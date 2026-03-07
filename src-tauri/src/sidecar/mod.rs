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
use tokio_tungstenite::{connect_async, tungstenite::Message};
use futures_util::{StreamExt, SinkExt};
use tauri::Emitter;

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

// ─── WebSocket Message Types ─────────────────────────────────────────────

/// WebSocket request message sent to sidecar
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarRequest {
    #[serde(rename = "type")]
    pub msg_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

/// WebSocket response message from sidecar
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarResponse {
    #[serde(rename = "type")]
    pub msg_type: String,
    #[serde(flatten)]
    pub data: serde_json::Value,
}

// ─── WebSocket Client Functions ───────────────────────────────────────────

/// Send a command to the sidecar via WebSocket and wait for response
pub async fn send_sidecar_command(
    session_id: &str,
    command: &str,
    params: Option<serde_json::Value>,
) -> SidecarResult<serde_json::Value> {
    let ws_url = format!("ws://localhost:4750/ws/{}", session_id);

    // Connect to sidecar WebSocket
    let (ws_stream, _) = connect_async(&ws_url)
        .await
        .map_err(|e| SidecarError::ProcessError(format!("WebSocket connection failed: {}", e)))?;

    let (mut write, mut read) = ws_stream.split();

    // Send command
    let request = SidecarRequest {
        msg_type: command.to_string(),
        params,
    };

    let request_json = serde_json::to_string(&request)
        .map_err(|e| SidecarError::JsonError(e))?;

    write.send(Message::Text(request_json.into()))
        .await
        .map_err(|e| SidecarError::ProcessError(format!("Failed to send message: {}", e)))?;

    // Wait for response with timeout
    let response_future = async {
        while let Some(msg) = read.next().await {
            match msg {
                Ok(Message::Text(text)) => {
                    if let Ok(response) = serde_json::from_str::<serde_json::Value>(&text) {
                        return Some(response);
                    }
                }
                Ok(Message::Close(_)) => return None,
                Err(e) => {
                    eprintln!("[Sidecar] WebSocket error: {}", e);
                    return None;
                }
                _ => {}
            }
        }
        None
    };

    match timeout(Duration::from_secs(30), response_future).await {
        Ok(Some(response)) => {
            // Check if response is an error
            if response.get("type").and_then(|v| v.as_str()) == Some("error") {
                let message = response.get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Unknown error");
                return Err(SidecarError::ProcessError(message.to_string()));
            }
            Ok(response)
        }
        Ok(None) => Err(SidecarError::ProcessError("Connection closed without response".into())),
        Err(_) => Err(SidecarError::ProcessError("Timeout waiting for response".into())),
    }
}

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
use crate::{NasusError, NasusResult};
use tauri::{AppHandle, State};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartSessionResult {
    pub session_id: String,
    pub websocket_url: String,
}

/// Start the sidecar process
#[tauri::command]
pub async fn browser_start_sidecar(
    state: State<'_, AppState>,
) -> NasusResult<String> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.start().await.map_err(|e| NasusError::Sidecar(e.to_string()))
}

/// Stop the sidecar process
#[tauri::command]
pub async fn browser_stop_sidecar(
    state: State<'_, AppState>,
) -> NasusResult<()> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.stop().await.map_err(|e| NasusError::Sidecar(e.to_string()))
}

/// Check if sidecar is running
#[tauri::command]
pub async fn browser_is_sidecar_running(
    state: State<'_, AppState>,
) -> NasusResult<bool> {
    let mut sidecar = state.sidecar.0.lock().await;
    Ok(sidecar.is_running())
}

/// Create a new browser session
#[tauri::command]
pub async fn browser_start_session(
    state: State<'_, AppState>,
) -> NasusResult<StartSessionResult> {
    let mut sidecar = state.sidecar.0.lock().await;
    let session = sidecar.create_session().await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
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
) -> NasusResult<()> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.remove_session(&session_id)
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

/// Navigate to a URL
#[tauri::command]
pub async fn browser_navigate(
    _state: State<'_, AppState>,
    session_id: String,
    url: String,
) -> NasusResult<serde_json::Value> {
    println!("[Browser] Navigate session {} to {}", session_id, url);

    let params = serde_json::json!({ "url": url.clone() });
    send_sidecar_command(&session_id, "navigate", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

/// Take a screenshot
#[tauri::command]
pub async fn browser_screenshot(
    _state: State<'_, AppState>,
    session_id: String,
    full_page: bool,
) -> NasusResult<String> {
    println!("[Browser] Screenshot session {} (full_page={})", session_id, full_page);

    let params = serde_json::json!({ "fullPage": full_page });
    let response = send_sidecar_command(&session_id, "screenshot", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("dataUrl")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Click an element
#[tauri::command]
pub async fn browser_click(
    _state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
    x: Option<f64>,
    y: Option<f64>,
) -> NasusResult<()> {
    println!("[Browser] Click session {} selector {:?} coords {:?},{:?}", session_id, selector, x, y);

    let mut params = serde_json::Map::new();
    if let Some(sel) = selector {
        params.insert("selector".into(), serde_json::Value::String(sel));
    }
    if let Some(cx) = x {
        params.insert("x".into(), serde_json::json!(cx));
    }
    if let Some(cy) = y {
        params.insert("y".into(), serde_json::json!(cy));
    }

    send_sidecar_command(&session_id, "click", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    Ok(())
}

/// Type text into an element
#[tauri::command]
pub async fn browser_type(
    _state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
    text: String,
    clear_first: Option<bool>,
) -> NasusResult<usize> {
    println!("[Browser] Type session {} text: {}", session_id, text);

    let mut params = serde_json::Map::new();
    if let Some(sel) = selector {
        params.insert("selector".into(), serde_json::Value::String(sel));
    }
    params.insert("text".into(), serde_json::Value::String(text.clone()));
    if let Some(clear) = clear_first {
        params.insert("clearFirst".into(), serde_json::Value::Bool(clear));
    }

    let response = send_sidecar_command(&session_id, "type", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("typed")
        .and_then(|v| v.as_u64())
        .map(|v| v as usize)
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Scroll the page
#[tauri::command]
pub async fn browser_scroll(
    _state: State<'_, AppState>,
    session_id: String,
    direction: Option<String>,
    amount: Option<u32>,
) -> NasusResult<i32> {
    println!("[Browser] Scroll session {} direction {:?}", session_id, direction);

    let dir = direction.unwrap_or_else(|| "down".to_string());
    let amt = amount.unwrap_or(400);

    let params = serde_json::json!({
        "direction": dir,
        "amount": amt
    });

    let response = send_sidecar_command(&session_id, "scroll", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("scrolled")
        .and_then(|v| v.as_i64())
        .map(|v| v as i32)
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Wait for a condition
#[tauri::command]
pub async fn browser_wait_for(
    _state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
    url_pattern: Option<String>,
    timeout_ms: Option<u64>,
) -> NasusResult<String> {
    println!("[Browser] Wait for session {} selector {:?}", session_id, selector);

    let mut params = serde_json::Map::new();
    if let Some(sel) = selector {
        params.insert("selector".into(), serde_json::Value::String(sel));
    }
    if let Some(pattern) = url_pattern {
        params.insert("urlPattern".into(), serde_json::Value::String(pattern));
    }
    if let Some(to) = timeout_ms {
        params.insert("timeoutMs".into(), serde_json::Value::Number(to.into()));
    }

    let response = send_sidecar_command(&session_id, "wait_for", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("matched")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Execute JavaScript
#[tauri::command]
pub async fn browser_execute(
    _state: State<'_, AppState>,
    session_id: String,
    expression: String,
    await_promise: Option<bool>,
) -> NasusResult<serde_json::Value> {
    println!("[Browser] Execute session {}", session_id);

    let params = serde_json::json!({
        "expression": expression,
        "awaitPromise": await_promise.unwrap_or(false)
    });

    let response = send_sidecar_command(&session_id, "execute", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("result")
        .cloned()
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Extract content from page
#[tauri::command]
pub async fn browser_extract(
    _state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
) -> NasusResult<ExtractResult> {
    println!("[Browser] Extract session {} selector {:?}", session_id, selector);

    let params = if let Some(sel) = selector {
        serde_json::json!({ "selector": sel })
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };

    let response = send_sidecar_command(&session_id, "extract", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    Ok(ExtractResult {
        url: response.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        title: response.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        content: response.get("content").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        length: response.get("length").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractResult {
    pub url: String,
    pub title: String,
    pub content: String,
    pub length: usize,
}

/// Capture an ARIA accessibility snapshot (YAML) of the current page.
/// Uses locator.ariaSnapshot() — the v1.49+ replacement for page.accessibility.snapshot().
#[tauri::command]
pub async fn browser_aria_snapshot(
    _state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
) -> NasusResult<AriaSnapshotResult> {
    println!("[Browser] AriaSnapshot session {} selector {:?}", session_id, selector);

    let mut params = serde_json::Map::new();
    if let Some(sel) = selector {
        params.insert("selector".into(), serde_json::Value::String(sel));
    }

    let response = send_sidecar_command(
        &session_id,
        "aria_snapshot",
        Some(serde_json::Value::Object(params)),
    )
    .await
    .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    Ok(AriaSnapshotResult {
        url: response.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        title: response.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        snapshot: response.get("snapshot").and_then(|v| v.as_str()).unwrap_or("").to_string(),
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AriaSnapshotResult {
    pub url: String,
    pub title: String,
    /// YAML accessibility tree returned by locator.ariaSnapshot()
    pub snapshot: String,
}

/// Upload a file to an input element
#[tauri::command]
pub async fn browser_upload_file(
    _state: State<'_, AppState>,
    session_id: String,
    selector: String,
    file_path: String,
) -> NasusResult<String> {
    println!("[Browser] Upload file session {} selector {} file {}", session_id, selector, file_path);

    let params = serde_json::json!({
        "selector": selector,
        "filePath": file_path
    });

    let response = send_sidecar_command(&session_id, "upload_file", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("uploaded")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Manage cookies
#[tauri::command]
pub async fn browser_cookies(
    _state: State<'_, AppState>,
    session_id: String,
    action: String,
    domain: Option<String>,
    name: Option<String>,
    value: Option<String>,
) -> NasusResult<serde_json::Value> {
    println!("[Browser] Cookies session {} action {}", session_id, action);

    let mut params = serde_json::Map::new();
    params.insert("action".into(), serde_json::Value::String(action));
    if let Some(d) = domain {
        params.insert("domain".into(), serde_json::Value::String(d));
    }
    if let Some(n) = name {
        params.insert("name".into(), serde_json::Value::String(n));
    }
    if let Some(v) = value {
        params.insert("value".into(), serde_json::Value::String(v));
    }

    send_sidecar_command(&session_id, "cookies", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

/// Set stealth mode
#[tauri::command]
pub async fn browser_set_stealth(
    _state: State<'_, AppState>,
    session_id: String,
    enabled: bool,
) -> NasusResult<bool> {
    println!("[Browser] Set stealth session {} enabled {}", session_id, enabled);

    let params = serde_json::json!({ "enabled": enabled });
    let response = send_sidecar_command(&session_id, "set_stealth", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;

    response.get("stealth")
        .and_then(|v| v.as_bool())
        .ok_or_else(|| NasusError::Sidecar("Invalid response from sidecar".to_string()))
}

/// Get all open tabs in the session
#[tauri::command]
pub async fn browser_get_tabs(
    _state: State<'_, AppState>,
    session_id: String,
) -> NasusResult<serde_json::Value> {
    println!("[Browser] Get tabs session {}", session_id);

    send_sidecar_command(&session_id, "get_tabs", None)
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

/// Select an option in a <select> element
#[tauri::command]
pub async fn browser_select(
    _state: State<'_, AppState>,
    session_id: String,
    selector: String,
    value: Option<String>,
    label: Option<String>,
) -> NasusResult<serde_json::Value> {
    println!("[Browser] Select session {} selector {}", session_id, selector);

    let mut params = serde_json::Map::new();
    params.insert("selector".into(), serde_json::Value::String(selector));
    if let Some(v) = value {
        params.insert("value".into(), serde_json::Value::String(v));
    }
    if let Some(l) = label {
        params.insert("label".into(), serde_json::Value::String(l));
    }

    send_sidecar_command(&session_id, "select", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

// ─── Sidecar Installation Commands ─────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarInstallStatus {
    pub installed: bool,
    pub has_node_modules: bool,
    pub has_chromium: bool,
    pub message: String,
}

/// Check if sidecar dependencies are installed
#[tauri::command]
pub async fn browser_check_sidecar_installed(
    state: State<'_, AppState>,
) -> NasusResult<SidecarInstallStatus> {
    let sidecar = state.sidecar.0.lock().await;
    let node_modules_path = sidecar.sidecar_dir.join("node_modules");
    let has_node_modules = node_modules_path.exists();

    // Check for Chromium in the expected Playwright location
    // Playwright stores browsers in a cache directory
    let chromium_path = sidecar.sidecar_dir.join("node_modules")
        .join("playwright-core")
        .join("local-registry")
        .join("chromium");

    // Also check the global cache location (Playwright stores as chromium-<version>)
    let has_global_chromium = dirs::home_dir()
        .and_then(|home| home.join(".cache").join("ms-playwright").canonicalize().ok())
        .as_ref()
        .and_then(|p| std::fs::read_dir(p).ok())
        .map_or(false, |entries| {
            entries.filter_map(|e| e.ok())
                .any(|entry| {
                    let name = entry.file_name();
                    let name_str = name.to_string_lossy();
                    name_str.starts_with("chromium-") && entry.path().is_dir()
                })
        });

    let has_chromium = chromium_path.exists() || has_global_chromium;

    Ok(SidecarInstallStatus {
        installed: has_node_modules && has_chromium,
        has_node_modules,
        has_chromium,
        message: if has_node_modules && has_chromium {
            "Sidecar is ready".to_string()
        } else if !has_node_modules {
            "Dependencies not installed".to_string()
        } else {
            "Chromium not installed".to_string()
        },
    })
}

/// Install sidecar dependencies (npm packages and Chromium)
#[tauri::command]
pub async fn browser_install_sidecar(
    state: State<'_, AppState>,
    app: AppHandle,
) -> NasusResult<String> {
    let sidecar_dir = {
        let sidecar = state.sidecar.0.lock().await;
        sidecar.sidecar_dir.clone()
    };

    // Emit progress event to frontend
    let emit_progress = |message: String| {
        let _ = app.emit("sidecar:install_progress", message);
    };

    emit_progress("Installing npm dependencies...".to_string());

    // Install npm dependencies
    let npm_output = std::process::Command::new("npm")
        .arg("install")
        .arg("--no-save")
        .current_dir(&sidecar_dir)
        .stdout(std::process::Stdio::piped())
        .stderr(std::process::Stdio::piped())
        .output();

    match npm_output {
        Ok(output) if output.status.success() => {
            emit_progress("Installing Chromium browser...".to_string());

            // Install Chromium via Playwright
            let playwright_output = std::process::Command::new("npx")
                .arg("playwright")
                .arg("install")
                .arg("chromium")
                .current_dir(&sidecar_dir)
                .stdout(std::process::Stdio::piped())
                .stderr(std::process::Stdio::piped())
                .output();

            match playwright_output {
                Ok(output) if output.status.success() => {
                    emit_progress("Installation complete!".to_string());
                    Ok("Sidecar installed successfully".to_string())
                }
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    Err(NasusError::Sidecar(format!("Chromium installation failed: {}", stderr)))
                }
                Err(e) => {
                    Err(NasusError::Sidecar(format!("Failed to run playwright install: {}", e)))
                }
            }
        }
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            Err(NasusError::Sidecar(format!("npm install failed: {}", stderr)))
        }
        Err(e) => {
            Err(NasusError::Sidecar(format!("Failed to run npm install: {}", e)))
        }
    }
}
