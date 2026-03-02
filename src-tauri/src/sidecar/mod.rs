//! Sidecar process management for Node.js + Playwright browser automation
//!
//! This module manages a Node.js child process that runs Playwright for
//! headless browser automation. Communication happens via WebSocket.

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use tokio::time::{sleep, timeout};
use tokio::io::AsyncReadExt;

/// Active browser session
#[derive(Debug, Clone)]
pub struct BrowserSession {
    pub id: String,
    pub websocket_url: String,
    pub status: SessionStatus,
}

#[derive(Debug, Clone, PartialEq)]
pub enum SessionStatus {
    Starting,
    Running,
    Stopped,
    Error(String),
}

/// Sidecar process state
pub struct SidecarState {
    process: Option<tokio::process::Child>,
    sessions: HashMap<String, BrowserSession>,
    sidecar_dir: PathBuf,
    websocket_port: u16,
}

impl SidecarState {
    pub fn new(sidecar_dir: PathBuf) -> Self {
        Self {
            process: None,
            sessions: HashMap::new(),
            sidecar_dir,
            websocket_port: 4750, // Default port for sidecar WebSocket
        }
    }
}

/// Shared state wrapper
pub struct SharedSidecarState(pub Arc<Mutex<SidecarState>>);

/// Error types for sidecar operations
#[derive(Debug, thiserror::Error)]
pub enum SidecarError {
    #[error("Sidecar not running")]
    NotRunning,

    #[error("Sidecar already running")]
    AlreadyRunning,

    #[error("Session not found: {0}")]
    SessionNotFound(String),

    #[error("Session already exists: {0}")]
    SessionExists(String),

    #[error("Process error: {0}")]
    ProcessError(String),

    #[error("IO error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("JSON error: {0}")]
    JsonError(#[from] serde_json::Error),
}

/// Result type for sidecar operations
pub type SidecarResult<T> = Result<T, SidecarError>;

impl SidecarState {
    /// Start the Node.js sidecar process
    pub async fn start(&mut self) -> SidecarResult<String> {
        if self.process.is_some() {
            return Err(SidecarError::AlreadyRunning);
        }

        // Check if Node.js is available
        let node_check = Command::new("node")
            .arg("--version")
            .output();

        match node_check {
            Ok(output) if output.status.success() => {
                let version = String::from_utf8_lossy(&output.stdout);
                println!("[Sidecar] Node.js version: {}", version.trim());
            }
            Ok(_) => {
                return Err(SidecarError::ProcessError(
                    "Node.js found but returned error".into()
                ));
            }
            Err(e) => {
                return Err(SidecarError::ProcessError(
                    format!("Node.js not found: {}", e)
                ));
            }
        }

        // Check if sidecar directory exists and has package.json
        let package_json = self.sidecar_dir.join("package.json");
        if !package_json.exists() {
            return Err(SidecarError::ProcessError(
                format!("Sidecar package.json not found at {}", package_json.display())
            ));
        }

        // Check if node_modules exists; if not, run npm install
        let node_modules = self.sidecar_dir.join("node_modules");
        if !node_modules.exists() {
            println!("[Sidecar] node_modules not found, running npm install...");
            let install_output = Command::new("npm")
                .arg("install")
                .current_dir(&self.sidecar_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output();

            match install_output {
                Ok(output) if output.status.success() => {
                    println!("[Sidecar] npm install completed successfully");
                }
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(SidecarError::ProcessError(
                        format!("npm install failed: {}", stderr)
                    ));
                }
                Err(e) => {
                    return Err(SidecarError::ProcessError(
                        format!("Failed to run npm install: {}", e)
                    ));
                }
            }
        }

        // Start the sidecar process
        let index_js = self.sidecar_dir.join("index.js");
        if !index_js.exists() {
            return Err(SidecarError::ProcessError(
                format!("Sidecar index.js not found at {}", index_js.display())
            ));
        }

        println!("[Sidecar] Starting Node.js sidecar at {}", index_js.display());

        let mut child = tokio::process::Command::new("node")
            .arg(&index_js)
            .current_dir(&self.sidecar_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| SidecarError::ProcessError(
                format!("Failed to spawn sidecar process: {}", e)
            ))?;

        // Give the process a moment to start
        sleep(Duration::from_millis(500)).await;

        // Check if process is still running
        match child.try_wait() {
            Ok(Some(status)) => {
                return Err(SidecarError::ProcessError(
                    format!("Sidecar process exited immediately with status: {}", status)
                ));
            }
            Ok(None) => {
                // Process is still running, which is good
            }
            Err(e) => {
                return Err(SidecarError::ProcessError(
                    format!("Failed to check sidecar process status: {}", e)
                ));
            }
        }

        self.process = Some(child);

        // Spawn a task to monitor stderr for logging
        if let Some(mut stderr) = self.process.as_mut().and_then(|p| p.stderr.take()) {
            tokio::spawn(async move {
                let mut buf = [0; 1024];
                loop {
                    match stderr.read(&mut buf).await {
                        Ok(0) => break,
                        Ok(n) => {
                            if let Ok(s) = std::str::from_utf8(&buf[..n]) {
                                eprintln!("[Sidecar stderr] {}", s.trim());
                            }
                        }
                        Err(_) => break,
                    }
                }
            });
        }

        Ok("Sidecar started successfully".into())
    }

    /// Stop the sidecar process
    pub async fn stop(&mut self) -> SidecarResult<()> {
        if let Some(mut child) = self.process.take() {
            println!("[Sidecar] Stopping sidecar process...");

            // Try to kill gracefully first
            match child.kill().await {
                Ok(_) => {
                    // Wait for process to exit
                    let _ = timeout(Duration::from_secs(5), child.wait()).await;
                    println!("[Sidecar] Sidecar process stopped");
                }
                Err(e) => {
                    eprintln!("[Sidecar] Error killing sidecar process: {}", e);
                }
            }

            // Clear all sessions
            self.sessions.clear();
        }

        Ok(())
    }

    /// Check if sidecar is running
    pub fn is_running(&mut self) -> bool {
        if let Some(child) = self.process.as_mut() {
            match child.try_wait() {
                Ok(Some(_)) => {
                    // Process has exited
                    self.process = None;
                    false
                }
                Ok(None) => true,
                Err(_) => {
                    self.process = None;
                    false
                }
            }
        } else {
            false
        }
    }

    /// Create a new browser session
    pub async fn create_session(&mut self) -> SidecarResult<BrowserSession> {
        if !self.is_running() {
            return Err(SidecarError::NotRunning);
        }

        let session_id = uuid::Uuid::new_v4().to_string();
        let websocket_url = format!("ws://localhost:{}/ws/{}", self.websocket_port, session_id);

        let session = BrowserSession {
            id: session_id.clone(),
            websocket_url: websocket_url.clone(),
            status: SessionStatus::Starting,
        };

        self.sessions.insert(session_id.clone(), session);

        Ok(BrowserSession {
            id: session_id,
            websocket_url,
            status: SessionStatus::Starting,
        })
    }

    /// Get a session by ID
    pub fn get_session(&self, id: &str) -> Option<&BrowserSession> {
        self.sessions.get(id)
    }

    /// Remove a session
    pub fn remove_session(&mut self, id: &str) -> SidecarResult<()> {
        self.sessions.remove(id)
            .ok_or_else(|| SidecarError::SessionNotFound(id.to_string()))?;
        Ok(())
    }

    /// Get all active sessions
    pub fn list_sessions(&self) -> Vec<&BrowserSession> {
        self.sessions.values().collect()
    }
}

// ─── Tauri Commands ───────────────────────────────────────────────────────

use crate::AppState;
use tauri::State;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartSessionResult {
    pub session_id: String,
    pub websocket_url: String,
}

/// Start the sidecar process
#[tauri::command]
pub async fn browser_start_sidecar(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.start().await.map_err(|e| e.to_string())
}

/// Stop the sidecar process
#[tauri::command]
pub async fn browser_stop_sidecar(
    state: State<'_, AppState>,
) -> Result<(), String> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.stop().await.map_err(|e| e.to_string())
}

/// Check if sidecar is running
#[tauri::command]
pub async fn browser_is_sidecar_running(
    state: State<'_, AppState>,
) -> Result<bool, String> {
    let mut sidecar = state.sidecar.0.lock().await;
    Ok(sidecar.is_running())
}

/// Create a new browser session
#[tauri::command]
pub async fn browser_start_session(
    state: State<'_, AppState>,
) -> Result<StartSessionResult, String> {
    let mut sidecar = state.sidecar.0.lock().await;
    let session = sidecar.create_session().await.map_err(|e| e.to_string())?;
    Ok(StartSessionResult {
        session_id: session.id,
        websocket_url: session.websocket_url,
    })
}

/// Stop a browser session
#[tauri::command]
pub async fn browser_stop_session(
    state: State<'_, AppState>,
    session_id: String,
) -> Result<(), String> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.remove_session(&session_id).map_err(|e| e.to_string())
}

/// Navigate to a URL (basic implementation - will be expanded)
#[tauri::command]
pub async fn browser_navigate(
    _state: State<'_, AppState>,
    session_id: String,
    url: String,
) -> Result<String, String> {
    // For now, return success. In Phase 2, this will communicate with
    // the sidecar via WebSocket to perform actual navigation.
    println!("[Browser] Navigate session {} to {}", session_id, url);
    Ok(url)
}

/// Take a screenshot (basic implementation - will be expanded)
#[tauri::command]
pub async fn browser_screenshot(
    _state: State<'_, AppState>,
    session_id: String,
    full_page: bool,
) -> Result<String, String> {
    // For now, return a placeholder. In Phase 2, this will communicate with
    // the sidecar via WebSocket to get actual screenshot data.
    println!("[Browser] Screenshot session {} (full_page={})", session_id, full_page);
    Ok("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==".to_string())
}
