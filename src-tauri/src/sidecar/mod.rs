//! Sidecar process management for Node.js + Playwright browser automation
//!
//! Architecture: PERSISTENT WebSocket connections per session.
//!
//! Previously, every Tauri command opened a new WebSocket to the sidecar,
//! sent one message, waited, then closed. This added 2-5 seconds of latency
//! per command (handshake + Playwright page setup).
//!
//! Now: sessions hold a live `Arc<Mutex<WsConnection>>`. Commands send over
//! the existing socket and wait for the matching response type. This makes
//! sequential browser operations (navigate → extract → screenshot) fast.

use std::collections::HashMap;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, oneshot};
use tokio::time::{sleep, timeout};
use tokio::io::AsyncReadExt;
use tokio_tungstenite::{connect_async, tungstenite::Message, WebSocketStream};
use tokio_tungstenite::MaybeTlsStream;
use futures_util::{StreamExt, SinkExt, stream::SplitSink};
use tokio::net::TcpStream;

// ─── Types ────────────────────────────────────────────────────────────────────

type WsSink = SplitSink<WebSocketStream<MaybeTlsStream<TcpStream>>, Message>;

/// A live WebSocket connection to the sidecar for a single session.
pub struct WsConnection {
    pub sink: WsSink,
}

/// Active browser session (now holds a persistent WS connection)
pub struct BrowserSession {
    pub id: String,
    pub websocket_url: String,
    pub status: SessionStatus,
    /// Live connection — Some after session_ready, None if disconnected.
    pub conn: Option<Arc<Mutex<WsConnection>>>,
    /// Pending response waiters: expected_msg_type → oneshot sender
    pub waiters: Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>>,
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
    sessions: HashMap<String, Arc<Mutex<BrowserSession>>>,
    sidecar_dir: PathBuf,
    websocket_port: u16,
}

impl SidecarState {
    pub fn new(sidecar_dir: PathBuf) -> Self {
        Self {
            process: None,
            sessions: HashMap::new(),
            sidecar_dir,
            websocket_port: 4750,
        }
    }
}

pub struct SharedSidecarState(pub Arc<Mutex<SidecarState>>);

// ─── Errors ───────────────────────────────────────────────────────────────────

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

pub type SidecarResult<T> = Result<T, SidecarError>;

// ─── WS message types ─────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarRequest {
    #[serde(rename = "type")]
    pub msg_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarResponse {
    #[serde(rename = "type")]
    pub msg_type: String,
    #[serde(flatten)]
    pub data: serde_json::Value,
}

// ─── Connection management ────────────────────────────────────────────────────

/// Open a persistent WebSocket to the sidecar for a session, wait for
/// `session_ready`, then spawn a background reader task that routes incoming
/// messages to the matching oneshot waiter.
pub async fn open_session_connection(
    session_id: &str,
    port: u16,
) -> SidecarResult<(Arc<Mutex<WsConnection>>, Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>>)> {
    let ws_url = format!("ws://localhost:{}/ws/{}", port, session_id);

    // Retry up to 5 times in case the sidecar is still booting
    let mut last_err = SidecarError::ProcessError("never connected".into());
    for attempt in 0..5u32 {
        match connect_async(&ws_url).await {
            Ok((ws_stream, _)) => {
                let (sink, mut stream) = ws_stream.split();
                let conn = Arc::new(Mutex::new(WsConnection { sink }));
                let waiters: Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>> =
                    Arc::new(Mutex::new(HashMap::new()));

                // Register the session_ready waiter BEFORE spawning the reader task
                // to eliminate the race where the sidecar sends session_ready before
                // the waiter is inserted (which would cause it to be discarded).
                let (ready_tx, rx) = oneshot::channel::<serde_json::Value>();
                {
                    let mut w = waiters.lock().await;
                    w.insert("session_ready".into(), ready_tx);
                    // Also absorb the initial "connected" message — sidecar sends this
                    // immediately on connection, before session_ready.
                    // We create a dummy channel for it so the reader doesn't log a warning.
                    let (connected_tx, _connected_rx) = oneshot::channel::<serde_json::Value>();
                    w.insert("connected".into(), connected_tx);
                }

                let waiters_clone = waiters.clone();

                // Background task: read all incoming messages and dispatch to waiters
                tokio::spawn(async move {
                    while let Some(msg) = stream.next().await {
                        match msg {
                            Ok(Message::Text(text)) => {
                                if let Ok(val) = serde_json::from_str::<serde_json::Value>(&text) {
                                    let msg_type = val.get("type")
                                        .and_then(|v| v.as_str())
                                        .unwrap_or("")
                                        .to_string();

                                    // Skip heartbeats / pongs silently
                                    if msg_type == "heartbeat" || msg_type == "pong" { continue; }

                                    let mut w = waiters_clone.lock().await;
                                    if let Some(tx) = w.remove(&msg_type) {
                                        let _ = tx.send(val);
                                    } else {
                                        // Unmatched message — log and discard
                                        log::warn!("[Sidecar] Unmatched message type '{}' — no waiter registered", msg_type);
                                    }
                                }
                            }
                            Ok(Message::Close(_)) => break,
                            Err(e) => { log::error!("[Sidecar] WS read error: {}", e); break; }
                            _ => {}
                        }
                    }
                });
                match timeout(Duration::from_secs(20), rx).await {
                    Ok(Ok(_)) => {
                        return Ok((conn, waiters));
                    }
                    Ok(Err(_)) => {
                        return Err(SidecarError::ProcessError("session_ready channel dropped".into()));
                    }
                    Err(_) => {
                        return Err(SidecarError::ProcessError(
                            format!("Timeout waiting for session_ready on session {}", session_id)
                        ));
                    }
                }
            }
            Err(e) => {
                last_err = SidecarError::ProcessError(format!("WebSocket connection failed: {}", e));
                sleep(Duration::from_millis(300 * (attempt as u64 + 1))).await;
            }
        }
    }

    Err(last_err)
}

/// Send a command over the session's persistent connection and await the response.
pub async fn send_session_command(
    session: &Arc<Mutex<BrowserSession>>,
    command: &str,
    params: Option<serde_json::Value>,
) -> SidecarResult<serde_json::Value> {
    // Determine expected response type (e.g. "navigate" → "navigate_result")
    let expected_type = format!("{}_result", command);

    let (conn_arc, waiters_arc) = {
        let s = session.lock().await;
        match (&s.conn, s.status == SessionStatus::Running) {
            (Some(c), true) => (c.clone(), s.waiters.clone()),
            _ => return Err(SidecarError::ProcessError(
                format!("Session {} is not connected", s.id)
            )),
        }
    };

    // Register waiter BEFORE sending to avoid race
    let (tx, rx) = oneshot::channel::<serde_json::Value>();
    {
        let mut w = waiters_arc.lock().await;
        w.insert(expected_type.clone(), tx);
    }

    // Send the command
    let request = SidecarRequest { msg_type: command.to_string(), params };
    let json = serde_json::to_string(&request).map_err(SidecarError::JsonError)?;
    {
        let mut conn = conn_arc.lock().await;
        conn.sink.send(Message::Text(json.into()))
            .await
            .map_err(|e| SidecarError::ProcessError(format!("Failed to send: {}", e)))?;
    }

    // Wait for response (30 s timeout)
    match timeout(Duration::from_secs(30), rx).await {
        Ok(Ok(response)) => {
            if response.get("type").and_then(|v| v.as_str()) == Some("error") {
                let msg = response.get("message")
                    .and_then(|v| v.as_str())
                    .unwrap_or("Unknown error");
                return Err(SidecarError::ProcessError(msg.to_string()));
            }
            Ok(response)
        }
        Ok(Err(_)) => Err(SidecarError::ProcessError("Response channel dropped".into())),
        Err(_) => {
            // Remove stale waiter
            let mut w = waiters_arc.lock().await;
            w.remove(&expected_type);
            Err(SidecarError::ProcessError(format!(
                "Timeout waiting for {} response", expected_type
            )))
        }
    }
}

// ─── SidecarState impl ────────────────────────────────────────────────────────

impl SidecarState {
    pub async fn start(&mut self) -> SidecarResult<String> {
        if self.process.is_some() {
            return Err(SidecarError::AlreadyRunning);
        }

        let node_check = Command::new("node").arg("--version").output();
        match node_check {
            Ok(output) if output.status.success() => {
                let version = String::from_utf8_lossy(&output.stdout);
                log::info!("[Sidecar] Node.js version: {}", version.trim());
            }
            Ok(_) => return Err(SidecarError::ProcessError("Node.js returned error".into())),
            Err(e) => return Err(SidecarError::ProcessError(format!("Node.js not found: {}", e))),
        }

        let package_json = self.sidecar_dir.join("package.json");
        if !package_json.exists() {
            return Err(SidecarError::ProcessError(
                format!("Sidecar package.json not found at {}", package_json.display())
            ));
        }

        let node_modules = self.sidecar_dir.join("node_modules");
        if !node_modules.exists() {
            log::info!("[Sidecar] node_modules not found, running npm install...");
            let install_output = Command::new("npm")
                .arg("install")
                .current_dir(&self.sidecar_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output();

            match install_output {
                Ok(output) if output.status.success() => {
                    log::info!("[Sidecar] npm install completed successfully");
                }
                Ok(output) => {
                    let stderr = String::from_utf8_lossy(&output.stderr);
                    return Err(SidecarError::ProcessError(format!("npm install failed: {}", stderr)));
                }
                Err(e) => {
                    return Err(SidecarError::ProcessError(format!("Failed to run npm install: {}", e)));
                }
            }
        }

        let index_js = self.sidecar_dir.join("index.js");
        if !index_js.exists() {
            return Err(SidecarError::ProcessError(
                format!("Sidecar index.js not found at {}", index_js.display())
            ));
        }

        log::info!("[Sidecar] Starting Node.js sidecar at {}", index_js.display());

        let mut child = tokio::process::Command::new("node")
            .arg(&index_js)
            .current_dir(&self.sidecar_dir)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .map_err(|e| SidecarError::ProcessError(format!("Failed to spawn sidecar: {}", e)))?;

        // Give the sidecar time to bind the WebSocket port
        sleep(Duration::from_millis(800)).await;

        match child.try_wait() {
            Ok(Some(status)) => {
                return Err(SidecarError::ProcessError(
                    format!("Sidecar exited immediately with status: {}", status)
                ));
            }
            Ok(None) => {}
            Err(e) => {
                return Err(SidecarError::ProcessError(format!("Failed to check sidecar: {}", e)));
            }
        }

        self.process = Some(child);

        if let Some(mut stderr) = self.process.as_mut().and_then(|p| p.stderr.take()) {
            tokio::spawn(async move {
                let mut buf = [0; 1024];
                loop {
                    match stderr.read(&mut buf).await {
                        Ok(0) => break,
                        Ok(n) => {
                            if let Ok(s) = std::str::from_utf8(&buf[..n]) {
                                log::debug!("[Sidecar stderr] {}", s.trim());
                            }
                        }
                        Err(_) => break,
                    }
                }
            });
        }

        Ok("Sidecar started successfully".into())
    }

    pub async fn stop(&mut self) -> SidecarResult<()> {
        if let Some(mut child) = self.process.take() {
            log::info!("[Sidecar] Stopping sidecar process...");
            match child.kill().await {
                Ok(_) => {
                    let _ = timeout(Duration::from_secs(5), child.wait()).await;
                    log::info!("[Sidecar] Sidecar process stopped");
                }
                Err(e) => log::error!("[Sidecar] Error killing sidecar: {}", e),
            }
            self.sessions.clear();
        }
        Ok(())
    }

    pub fn is_running(&mut self) -> bool {
        if let Some(child) = self.process.as_mut() {
            match child.try_wait() {
                Ok(Some(_)) => { self.process = None; false }
                Ok(None) => true,
                Err(_) => { self.process = None; false }
            }
        } else {
            false
        }
    }

    /// Create a new browser session and open a persistent WS connection to it.
    pub async fn create_session(&mut self) -> SidecarResult<String> {
        if !self.is_running() {
            return Err(SidecarError::NotRunning);
        }

        let session_id = uuid::Uuid::new_v4().to_string();
        let port = self.websocket_port;
        let waiters: Arc<Mutex<HashMap<String, oneshot::Sender<serde_json::Value>>>> =
            Arc::new(Mutex::new(HashMap::new()));

        let session = Arc::new(Mutex::new(BrowserSession {
            id: session_id.clone(),
            websocket_url: format!("ws://localhost:{}/ws/{}", port, session_id),
            status: SessionStatus::Starting,
            conn: None,
            waiters: waiters.clone(),
        }));

        self.sessions.insert(session_id.clone(), session.clone());

        // Open the persistent connection (also waits for session_ready)
        match open_session_connection(&session_id, port).await {
            Ok((conn, new_waiters)) => {
                let mut s = session.lock().await;
                s.conn = Some(conn);
                s.waiters = new_waiters;
                s.status = SessionStatus::Running;
            }
            Err(e) => {
                self.sessions.remove(&session_id);
                return Err(e);
            }
        }

        Ok(session_id)
    }

    pub fn get_session_arc(&self, id: &str) -> Option<Arc<Mutex<BrowserSession>>> {
        self.sessions.get(id).cloned()
    }

    pub fn remove_session(&mut self, id: &str) -> SidecarResult<()> {
        self.sessions.remove(id)
            .ok_or_else(|| SidecarError::SessionNotFound(id.to_string()))?;
        Ok(())
    }
}

// ─── Helper to get session or error ──────────────────────────────────────────

async fn get_session(
    state: &crate::AppState,
    session_id: &str,
) -> NasusResult<Arc<Mutex<BrowserSession>>> {
    let sidecar = state.sidecar.0.lock().await;
    sidecar.get_session_arc(session_id)
        .ok_or_else(|| NasusError::Sidecar(format!("Session not found: {}", session_id)))
}

// ─── Tauri Commands ───────────────────────────────────────────────────────────

use crate::AppState;
use crate::{NasusError, NasusResult};
use tauri::{AppHandle, Manager, State};
use tauri::Emitter;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StartSessionResult {
    pub session_id: String,
    pub websocket_url: String,
}

#[tauri::command]
pub async fn browser_start_sidecar(state: State<'_, AppState>) -> NasusResult<String> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.start().await.map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_stop_sidecar(state: State<'_, AppState>) -> NasusResult<()> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.stop().await.map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_is_sidecar_running(state: State<'_, AppState>) -> NasusResult<bool> {
    let mut sidecar = state.sidecar.0.lock().await;
    Ok(sidecar.is_running())
}

#[tauri::command]
pub async fn browser_start_session(state: State<'_, AppState>) -> NasusResult<StartSessionResult> {
    let mut sidecar = state.sidecar.0.lock().await;
    let session_id = sidecar.create_session().await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    let websocket_url = format!("ws://localhost:{}/ws/{}", sidecar.websocket_port, session_id);
    Ok(StartSessionResult { session_id, websocket_url })
}

#[tauri::command]
pub async fn browser_stop_session(
    state: State<'_, AppState>,
    session_id: String,
) -> NasusResult<()> {
    let mut sidecar = state.sidecar.0.lock().await;
    sidecar.remove_session(&session_id)
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_navigate(
    state: State<'_, AppState>,
    session_id: String,
    url: String,
    timeout_ms: Option<u64>,
) -> NasusResult<serde_json::Value> {
    log::info!("[Browser] Navigate {} → {}", session_id, url);
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::json!({ "url": url });
    if let Some(t) = timeout_ms {
        params["timeoutMs"] = serde_json::json!(t);
    }
    send_session_command(&session, "navigate", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_screenshot(
    state: State<'_, AppState>,
    session_id: String,
    full_page: bool,
) -> NasusResult<String> {
    log::info!("[Browser] Screenshot {} (full={})", session_id, full_page);
    let session = get_session(&state, &session_id).await?;
    let params = serde_json::json!({ "fullPage": full_page });
    let response = send_session_command(&session, "screenshot", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    response.get("dataUrl")
        .and_then(|v| v.as_str())
        .map(|s| s.to_string())
        .ok_or_else(|| NasusError::Sidecar("No dataUrl in screenshot response".into()))
}

/// Click — returns full click info (tag, text, href) instead of unit.
#[tauri::command]
pub async fn browser_click(
    state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
    x: Option<f64>,
    y: Option<f64>,
) -> NasusResult<serde_json::Value> {
    log::info!("[Browser] Click {} selector={:?} coords={:?},{:?}", session_id, selector, x, y);
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::Map::new();
    if let Some(s) = selector { params.insert("selector".into(), serde_json::json!(s)); }
    if let Some(cx) = x { params.insert("x".into(), serde_json::json!(cx)); }
    if let Some(cy) = y { params.insert("y".into(), serde_json::json!(cy)); }
    send_session_command(&session, "click", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_type(
    state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
    text: String,
    clear_first: Option<bool>,
) -> NasusResult<usize> {
    log::info!("[Browser] Type {}", session_id);
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::Map::new();
    if let Some(s) = selector { params.insert("selector".into(), serde_json::json!(s)); }
    params.insert("text".into(), serde_json::json!(text));
    if let Some(c) = clear_first { params.insert("clearFirst".into(), serde_json::json!(c)); }
    let response = send_session_command(&session, "type", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    response.get("typed").and_then(|v| v.as_u64()).map(|v| v as usize)
        .ok_or_else(|| NasusError::Sidecar("Invalid type response".into()))
}

#[tauri::command]
pub async fn browser_scroll(
    state: State<'_, AppState>,
    session_id: String,
    direction: Option<String>,
    amount: Option<u32>,
) -> NasusResult<i32> {
    log::info!("[Browser] Scroll {}", session_id);
    let session = get_session(&state, &session_id).await?;
    let params = serde_json::json!({
        "direction": direction.unwrap_or_else(|| "down".into()),
        "amount": amount.unwrap_or(400),
    });
    let response = send_session_command(&session, "scroll", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    response.get("scrolled").and_then(|v| v.as_i64()).map(|v| v as i32)
        .ok_or_else(|| NasusError::Sidecar("Invalid scroll response".into()))
}

#[tauri::command]
pub async fn browser_wait_for(
    state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
    url_pattern: Option<String>,
    timeout_ms: Option<u64>,
) -> NasusResult<String> {
    log::info!("[Browser] WaitFor {} selector={:?}", session_id, selector);
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::Map::new();
    if let Some(s) = selector { params.insert("selector".into(), serde_json::json!(s)); }
    if let Some(p) = url_pattern { params.insert("urlPattern".into(), serde_json::json!(p)); }
    if let Some(t) = timeout_ms { params.insert("timeoutMs".into(), serde_json::json!(t)); }
    let response = send_session_command(&session, "wait_for", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    response.get("matched").and_then(|v| v.as_str()).map(|s| s.to_string())
        .ok_or_else(|| NasusError::Sidecar("Invalid wait_for response".into()))
}

#[tauri::command]
pub async fn browser_execute(
    state: State<'_, AppState>,
    session_id: String,
    expression: String,
    await_promise: Option<bool>,
) -> NasusResult<serde_json::Value> {
    log::info!("[Browser] Execute {}", session_id);
    let session = get_session(&state, &session_id).await?;
    let params = serde_json::json!({
        "expression": expression,
        "awaitPromise": await_promise.unwrap_or(false),
    });
    let response = send_session_command(&session, "execute", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    response.get("result").cloned()
        .ok_or_else(|| NasusError::Sidecar("Invalid execute response".into()))
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExtractResult {
    pub url: String,
    pub title: String,
    pub content: String,
    pub length: usize,
}

#[tauri::command]
pub async fn browser_extract(
    state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
) -> NasusResult<ExtractResult> {
    log::info!("[Browser] Extract {} selector={:?}", session_id, selector);
    let session = get_session(&state, &session_id).await?;
    let params = if let Some(sel) = selector {
        serde_json::json!({ "selector": sel })
    } else {
        serde_json::Value::Object(serde_json::Map::new())
    };
    let response = send_session_command(&session, "extract", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    Ok(ExtractResult {
        url:     response.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        title:   response.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        content: response.get("content").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        length:  response.get("length").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
    })
}

/// Read a page in one shot: navigate + wait for network idle + extract.
#[tauri::command]
pub async fn browser_read_page(
    state: State<'_, AppState>,
    session_id: String,
    url: String,
    timeout_ms: Option<u64>,
    selector: Option<String>,
) -> NasusResult<ExtractResult> {
    log::info!("[Browser] ReadPage {} → {}", session_id, url);
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::json!({ "url": url });
    if let Some(t) = timeout_ms { params["timeoutMs"] = serde_json::json!(t); }
    if let Some(s) = selector { params["selector"] = serde_json::json!(s); }
    let response = send_session_command(&session, "read_page", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    Ok(ExtractResult {
        url:     response.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        title:   response.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        content: response.get("content").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        length:  response.get("length").and_then(|v| v.as_u64()).unwrap_or(0) as usize,
    })
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AriaSnapshotResult {
    pub url: String,
    pub title: String,
    pub snapshot: String,
}

#[tauri::command]
pub async fn browser_aria_snapshot(
    state: State<'_, AppState>,
    session_id: String,
    selector: Option<String>,
) -> NasusResult<AriaSnapshotResult> {
    log::info!("[Browser] AriaSnapshot {} selector={:?}", session_id, selector);
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::Map::new();
    if let Some(sel) = selector { params.insert("selector".into(), serde_json::json!(sel)); }
    let response = send_session_command(&session, "aria_snapshot", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    Ok(AriaSnapshotResult {
        url:      response.get("url").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        title:    response.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        snapshot: response.get("snapshot").and_then(|v| v.as_str()).unwrap_or("").to_string(),
    })
}

#[tauri::command]
pub async fn browser_upload_file(
    state: State<'_, AppState>,
    session_id: String,
    selector: String,
    file_path: String,
) -> NasusResult<String> {
    let session = get_session(&state, &session_id).await?;
    let params = serde_json::json!({ "selector": selector, "filePath": file_path });
    let response = send_session_command(&session, "upload_file", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    response.get("uploaded").and_then(|v| v.as_str()).map(|s| s.to_string())
        .ok_or_else(|| NasusError::Sidecar("Invalid upload_file response".into()))
}

#[tauri::command]
pub async fn browser_cookies(
    state: State<'_, AppState>,
    session_id: String,
    action: String,
    domain: Option<String>,
    name: Option<String>,
    value: Option<String>,
) -> NasusResult<serde_json::Value> {
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::Map::new();
    params.insert("action".into(), serde_json::json!(action));
    if let Some(d) = domain { params.insert("domain".into(), serde_json::json!(d)); }
    if let Some(n) = name   { params.insert("name".into(),   serde_json::json!(n)); }
    if let Some(v) = value  { params.insert("value".into(),  serde_json::json!(v)); }
    send_session_command(&session, "cookies", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_set_stealth(
    state: State<'_, AppState>,
    session_id: String,
    enabled: bool,
) -> NasusResult<bool> {
    // Stealth is now baked into browser launch — this command is a no-op kept for API compat.
    let session = get_session(&state, &session_id).await?;
    let params = serde_json::json!({ "enabled": enabled });
    let response = send_session_command(&session, "set_stealth", Some(params))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))?;
    Ok(response.get("stealth").and_then(|v| v.as_bool()).unwrap_or(enabled))
}

#[tauri::command]
pub async fn browser_get_tabs(
    state: State<'_, AppState>,
    session_id: String,
) -> NasusResult<serde_json::Value> {
    let session = get_session(&state, &session_id).await?;
    send_session_command(&session, "get_tabs", None)
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

#[tauri::command]
pub async fn browser_select(
    state: State<'_, AppState>,
    session_id: String,
    selector: String,
    value: Option<String>,
    label: Option<String>,
) -> NasusResult<serde_json::Value> {
    let session = get_session(&state, &session_id).await?;
    let mut params = serde_json::Map::new();
    params.insert("selector".into(), serde_json::json!(selector));
    if let Some(v) = value { params.insert("value".into(), serde_json::json!(v)); }
    if let Some(l) = label { params.insert("label".into(), serde_json::json!(l)); }
    send_session_command(&session, "select", Some(serde_json::Value::Object(params)))
        .await
        .map_err(|e| NasusError::Sidecar(e.to_string()))
}

// ─── Install / check commands ─────────────────────────────────────────────────

/// Returns the installed Node.js version string (e.g. "v20.11.0"), or an error if not found.
#[tauri::command]
pub async fn check_node_version() -> NasusResult<String> {
    let output = Command::new("node")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::null())
        .output()
        .map_err(|e| NasusError::Sidecar(format!("Node.js not found: {}", e)))?;
    if output.status.success() {
        Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
    } else {
        Err(NasusError::Sidecar("Node.js not found or returned an error".into()))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SidecarInstallStatus {
    pub installed: bool,
    pub has_node_modules: bool,
    pub has_chromium: bool,
    pub message: String,
}

#[tauri::command]
pub async fn browser_check_sidecar_installed(
    state: State<'_, AppState>,
) -> NasusResult<SidecarInstallStatus> {
    let sidecar = state.sidecar.0.lock().await;
    let has_node_modules = sidecar.sidecar_dir.join("node_modules").exists();

    // Actually check whether Playwright's Chromium binary exists.
    // `playwright-core` stores it under node_modules/playwright-core/.local-browsers/chromium-*/chrome-*/chrome
    // We probe by running `node -e "require('playwright-core').chromium.executablePath()"` — this resolves
    // the exact path Playwright would use and checks if it exists on disk.
    let has_chromium = if has_node_modules {
        let check = Command::new("node")
            .arg("-e")
            .arg("try { const pw = require('playwright-core'); pw.chromium.executablePath().then ? pw.chromium.executablePath().then(p => { const fs = require('fs'); process.exit(fs.existsSync(p) ? 0 : 1) }) : (() => { const fs = require('fs'); process.exit(fs.existsSync(pw.chromium.executablePath()) ? 0 : 1) })() } catch(e) { process.exit(1) }")
            .current_dir(&sidecar.sidecar_dir)
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .status();
        matches!(check, Ok(s) if s.success())
    } else {
        false
    };

    let installed = has_node_modules && has_chromium;
    let message = if installed {
        "Browser sidecar is ready".into()
    } else if has_node_modules && !has_chromium {
        "Chromium not installed — click Install to download it".into()
    } else {
        "Dependencies not installed — click Install to set up the browser".into()
    };

    Ok(SidecarInstallStatus {
        installed,
        has_node_modules,
        has_chromium,
        message,
    })
}

#[tauri::command]
pub async fn browser_install_sidecar(
    state: State<'_, AppState>,
    app: AppHandle,
) -> NasusResult<String> {
    let sidecar_dir = {
        let sidecar = state.sidecar.0.lock().await;
        sidecar.sidecar_dir.clone()
    };

    let emit_progress = |message: String| { let _ = app.emit("sidecar:install_progress", message); };

    // ── Step 1: ensure package.json and index.js exist in sidecar_dir ──────────
    // In production the sidecar_dir is the app-data sidecar dir which starts empty.
    // We copy the bundled resource files into it so npm install has something to work with.
    let package_json = sidecar_dir.join("package.json");
    let index_js = sidecar_dir.join("index.js");

    if !package_json.exists() || !index_js.exists() {
        emit_progress("Copying sidecar files...".into());

        // Try bundled resource dir first (production)
        let resource_sidecar: Option<std::path::PathBuf> = app.path().resource_dir()
            .ok()
            .map(|r: std::path::PathBuf| r.join("sidecar"));

        // Also try dev paths: cwd/src-tauri/sidecar and cwd/sidecar
        let dev_source = std::env::current_dir().ok().and_then(|cwd| {
            let p1 = cwd.join("src-tauri").join("sidecar");
            if p1.join("package.json").exists() { return Some(p1); }
            let p2 = cwd.join("sidecar");
            if p2.join("package.json").exists() { return Some(p2); }
            None
        });

        let source_dir = dev_source
            .or_else(|| resource_sidecar.filter(|p: &std::path::PathBuf| p.join("package.json").exists()))
            .ok_or_else(|| NasusError::Sidecar(
                "Cannot find sidecar source files. Please report this bug.".into()
            ))?;

        let _ = std::fs::create_dir_all(&sidecar_dir);

        for filename in &["package.json", "index.js"] {
            let src = source_dir.join(filename);
            let dst = sidecar_dir.join(filename);
            if src.exists() && !dst.exists() {
                std::fs::copy(&src, &dst).map_err(|e| {
                    NasusError::Sidecar(format!("Failed to copy {}: {}", filename, e))
                })?;
            }
        }
    }

    // ── Step 2: npm install ────────────────────────────────────────────────────
    emit_progress("Installing npm dependencies...".into());

    let npm_output = std::process::Command::new("npm")
        .args(["install", "--no-save"])
        .current_dir(&sidecar_dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output();

    match npm_output {
        Ok(output) if output.status.success() => {
            // ── Step 3: install Playwright Chromium ────────────────────────────
            emit_progress("Installing Chromium browser...".into());
            let pw_output = std::process::Command::new("npx")
                .args(["playwright", "install", "chromium"])
                .current_dir(&sidecar_dir)
                .stdout(Stdio::piped())
                .stderr(Stdio::piped())
                .output();
            match pw_output {
                Ok(o) if o.status.success() => {
                    emit_progress("Installation complete!".into());
                    Ok("Sidecar installed successfully".into())
                }
                Ok(o) => Err(NasusError::Sidecar(format!(
                    "Chromium installation failed: {}",
                    String::from_utf8_lossy(&o.stderr)
                ))),
                Err(e) => Err(NasusError::Sidecar(format!("playwright install error: {}", e))),
            }
        }
        Ok(output) => Err(NasusError::Sidecar(format!(
            "npm install failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ))),
        Err(e) => Err(NasusError::Sidecar(format!("Failed to run npm install: {}", e))),
    }
}
