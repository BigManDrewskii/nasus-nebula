// python_sidecar.rs
// Place at: src-tauri/src/python_sidecar.rs
// Phase 7 -- Nasus Stack Tauri integration glue.

use std::sync::Arc;
use std::time::Duration;
use tokio::process::{Child, Command};
use tokio::sync::Mutex;
use tokio::time::sleep;

pub const NASUS_PORT: u16 = 4751;
pub const NASUS_BASE_URL: &str = "http://127.0.0.1:4751";

// State
pub struct PythonSidecarState {
    process: Option<Child>,
    pub is_ready: bool,
    pub sidecar_dir: String,
}

impl PythonSidecarState {
    pub fn new() -> Self {
        Self {
            process: None,
            is_ready: false,
            sidecar_dir: String::new(),
        }
    }

    pub fn with_dir(dir: &str) -> Self {
        Self {
            process: None,
            is_ready: false,
            sidecar_dir: dir.to_string(),
        }
    }
}

impl Default for PythonSidecarState {
    fn default() -> Self {
        Self::new()
    }
}

// Spawn nasus_sidecar — try venv python first, then python3, then python
pub async fn spawn_sidecar(
    state: Arc<Mutex<PythonSidecarState>>,
    sidecar_dir: &str,
) -> Result<(), String> {
    let mut guard = state.lock().await;
    if guard.process.is_some() {
        return Ok(());
    }

    // Kill any stale process holding port 4751 (e.g. from a previous dev session)
    #[cfg(unix)]
    {
        let _ = std::process::Command::new("sh")
            .args(["-c", &format!("lsof -ti:{} | xargs kill -9 2>/dev/null", NASUS_PORT)])
            .output();
        // Give the kernel a moment to release the port
        tokio::time::sleep(Duration::from_millis(200)).await;
    }

    let data_dir = format!("{}/nasus_data", sidecar_dir);

    // Candidate Python executables in priority order:
    // 1. venv (Unix)  2. venv (Windows)  3. python3  4. python
    let candidates = [
        format!("{}/.venv/bin/python", sidecar_dir),
        format!("{}/.venv/Scripts/python.exe", sidecar_dir),
        "python3".to_string(),
        "python".to_string(),
    ];

    let mut child_result = Err(std::io::Error::new(
        std::io::ErrorKind::NotFound,
        "no python found",
    ));
    for exe in &candidates {
        let mut cmd = Command::new(exe);
        cmd.args(["-m", "nasus_sidecar"])
            .current_dir(sidecar_dir)
            .env("NASUS_DATA_DIR", &data_dir)
            .kill_on_drop(true);
        match cmd.spawn() {
            Ok(child) => {
                child_result = Ok(child);
                break;
            }
            Err(_) => continue,
        }
    }
    let child = child_result.map_err(|e| {
        format!(
            "Failed to spawn nasus_sidecar (tried venv, python3, python): {}",
            e
        )
    })?;

    log::info!("[nasus] spawned sidecar from {}", sidecar_dir);
    guard.sidecar_dir = sidecar_dir.to_string();
    guard.process = Some(child);
    Ok(())
}

// Poll /health every 200ms for up to 15s
pub async fn wait_until_ready(state: Arc<Mutex<PythonSidecarState>>) -> Result<(), String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(2))
        .build()
        .map_err(|e| e.to_string())?;
    let url = format!("{}/health", NASUS_BASE_URL);
    for attempt in 0..75u32 {
        sleep(Duration::from_millis(200)).await;
        if let Ok(r) = client.get(&url).send().await {
            if r.status().is_success() {
                state.lock().await.is_ready = true;
                log::info!("[nasus] ready after {}ms", (attempt + 1) * 200);
                return Ok(());
            }
        }
    }
    Err(format!(
        "Nasus sidecar did not become ready within 15s on {}",
        url
    ))
}

// Convenience: spawn + wait
pub async fn spawn_and_wait_ready(
    state: Arc<Mutex<PythonSidecarState>>,
    sidecar_dir: &str,
) -> Result<(), String> {
    spawn_sidecar(state.clone(), sidecar_dir).await?;
    wait_until_ready(state).await
}

// Kill the process
pub async fn stop_sidecar(state: Arc<Mutex<PythonSidecarState>>) {
    let mut g = state.lock().await;
    if let Some(mut child) = g.process.take() {
        let _ = child.kill().await;
        let _ = child.wait().await;
        g.is_ready = false;
    }
}

// Tauri commands -- register all 5 in invoke_handler![]
#[tauri::command]
pub async fn nasus_is_ready(
    state: tauri::State<'_, Arc<Mutex<PythonSidecarState>>>,
) -> Result<bool, String> {
    Ok(state.lock().await.is_ready)
}

#[tauri::command]
pub async fn nasus_health() -> Result<serde_json::Value, String> {
    crate::HTTP_CLIENT
        .get(format!("{}/health", NASUS_BASE_URL))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn nasus_submit_task(payload: serde_json::Value) -> Result<serde_json::Value, String> {
    crate::HTTP_CLIENT
        .post(format!("{}/task", NASUS_BASE_URL))
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn nasus_task_status(job_id: String) -> Result<serde_json::Value, String> {
    crate::HTTP_CLIENT
        .get(format!("{}/task/{}/status", NASUS_BASE_URL, job_id))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn nasus_cancel_task(job_id: String) -> Result<serde_json::Value, String> {
    crate::HTTP_CLIENT
        .delete(format!("{}/task/{}", NASUS_BASE_URL, job_id))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| e.to_string())
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct NasusInstallStatus {
    pub installed: bool,
    pub has_venv: bool,
    pub message: String,
}

/// Check whether the Python venv and dependencies are installed.
#[tauri::command]
pub async fn nasus_check_installed(
    state: tauri::State<'_, Arc<Mutex<PythonSidecarState>>>,
) -> Result<NasusInstallStatus, String> {
    let dir = state.lock().await.sidecar_dir.clone();
    if dir.is_empty() {
        return Ok(NasusInstallStatus {
            installed: false,
            has_venv: false,
            message: "Sidecar directory not initialised yet — app is still starting up".into(),
        });
    }
    let venv_python = if cfg!(windows) {
        format!("{}/.venv/Scripts/python.exe", dir)
    } else {
        format!("{}/.venv/bin/python", dir)
    };
    let has_venv = std::path::Path::new(&venv_python).exists();
    Ok(NasusInstallStatus {
        installed: has_venv,
        has_venv,
        message: if has_venv {
            "Nasus sidecar is ready".into()
        } else {
            "Python venv not found — click Install to set up the sidecar".into()
        },
    })
}

/// POST /configure to the running sidecar with LLM credentials.
/// Called from TypeScript after the API key becomes available (settings load or user entry).
/// Safe to call multiple times — the sidecar overwrites its config in place.
#[tauri::command]
pub async fn nasus_configure_llm(config: serde_json::Value) -> Result<serde_json::Value, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .map_err(|e| e.to_string())?;

    client
        .post(format!("{}/configure", NASUS_BASE_URL))
        .json(&config)
        .send()
        .await
        .map_err(|e| format!("nasus_configure_llm: request failed: {}", e))?
        .json::<serde_json::Value>()
        .await
        .map_err(|e| format!("nasus_configure_llm: response parse failed: {}", e))
}

/// Create .venv and install requirements. Emits `nasus:install_progress` events.
#[tauri::command]
pub async fn nasus_install_sidecar(
    state: tauri::State<'_, Arc<Mutex<PythonSidecarState>>>,
    app: tauri::AppHandle,
) -> Result<String, String> {
    use std::process::{Command as StdCommand, Stdio};
    use tauri::Emitter;

    let dir = state.lock().await.sidecar_dir.clone();

    let emit = |msg: &str| {
        let _ = app.emit("nasus:install_progress", msg.to_string());
    };

    // Step 1: create venv if absent
    let venv_dir = format!("{}/.venv", dir);
    if !std::path::Path::new(&venv_dir).exists() {
        emit("Creating Python virtual environment...");
        let status = StdCommand::new("python3")
            .args(["-m", "venv", ".venv"])
            .current_dir(&dir)
            .stdout(Stdio::null())
            .stderr(Stdio::piped())
            .output()
            .or_else(|_| {
                StdCommand::new("python")
                    .args(["-m", "venv", ".venv"])
                    .current_dir(&dir)
                    .stdout(Stdio::null())
                    .stderr(Stdio::piped())
                    .output()
            })
            .map_err(|e| format!("python not found: {}", e))?;

        if !status.status.success() {
            return Err(format!(
                "venv creation failed: {}",
                String::from_utf8_lossy(&status.stderr)
            ));
        }
    }

    // Step 2: pip install
    emit("Installing Python dependencies...");
    let pip = if cfg!(windows) {
        format!("{}/.venv/Scripts/pip.exe", dir)
    } else {
        format!("{}/.venv/bin/pip", dir)
    };
    let req = format!("{}/nasus_sidecar/requirements.txt", dir);
    let output = StdCommand::new(&pip)
        .args(["install", "-r", &req])
        .current_dir(&dir)
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .map_err(|e| format!("pip not found: {}", e))?;

    if !output.status.success() {
        return Err(format!(
            "pip install failed: {}",
            String::from_utf8_lossy(&output.stderr)
        ));
    }

    emit("Installation complete!");
    Ok("Nasus sidecar installed successfully".into())
}
