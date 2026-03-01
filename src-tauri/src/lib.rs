use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::{Path};
use std::sync::Arc;
use tauri::{AppHandle, State, Emitter, Manager};
use tokio::sync::Mutex;
use rusqlite::{params, Connection};

pub mod models;
pub mod search;
pub mod docker;

use crate::models::classifier::{classify_task};
use crate::models::router::{BudgetMode, ModelSelectionMode, RouterConfig, RoutingDecision};
use crate::search::service::SearchService;

// --- State and Config ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub api_key: String,
    pub model: String,
    pub workspace_path: String,
    pub api_base: String,
    pub provider: String,
}

pub struct AppState {
    pub config: Mutex<Config>,
    pub router_config: Mutex<RouterConfig>,
    pub search_service: Arc<SearchService>,
    pub active_tasks: Mutex<HashMap<String, tokio::task::JoinHandle<()>>>,
}

// --- Agent Events ---

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum AgentEvent {
    Thinking {
        task_id: String,
        message_id: String,
        content: String,
    },
    StreamChunk {
        task_id: String,
        message_id: String,
        delta: String,
        done: bool,
    },
    ToolCall {
        task_id: String,
        message_id: String,
        tool: String,
        input: serde_json::Value,
        call_id: String,
    },
    ToolResult {
        task_id: String,
        message_id: String,
        call_id: String,
        output: String,
        is_error: bool,
    },
    IterationTick {
        task_id: String,
        iteration: u32,
    },
    TokenUsage {
        task_id: String,
        total_tokens: u64,
    },
    ModelSelected {
        task_id: String,
        model_id: String,
        display_name: String,
        reason: String,
    },
    Done {
        task_id: String,
        message_id: String,
    },
    Error {
        task_id: String,
        message_id: String,
        error: String,
    },
}

// --- Commands ---

#[tauri::command]
async fn get_config(state: State<'_, AppState>) -> Result<Config, String> {
    let config = state.config.lock().await;
    Ok(config.clone())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn save_config(
    state: State<'_, AppState>,
    apiKey: String,
    model: String,
    workspacePath: String,
    apiBase: String,
    provider: String,
) -> Result<(), String> {
    let mut config = state.config.lock().await;
    config.api_key = apiKey;
    config.model = model;
    config.workspace_path = workspacePath;
    config.api_base = apiBase;
    config.provider = provider;
    Ok(())
}

#[tauri::command]
async fn validate_path(path: String) -> Result<bool, String> {
    let p = Path::new(&path);
    Ok(p.exists() && p.is_dir())
}

#[tauri::command]
async fn get_model_registry(state: State<'_, AppState>) -> Result<Vec<models::registry::ModelInfo>, String> {
    let router_config = state.router_config.lock().await;
    Ok(router_config.registry.clone())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn save_router_settings(
    state: State<'_, AppState>,
    mode: ModelSelectionMode,
    budget: BudgetMode,
    modelOverrides: HashMap<String, bool>,
) -> Result<(), String> {
    let mut router_config = state.router_config.lock().await;
    router_config.mode = mode;
    router_config.budget = budget;
    router_config.apply_enabled_overrides(&modelOverrides);
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn preview_routing(
    state: State<'_, AppState>,
    message: String,
    mode: ModelSelectionMode,
    budget: BudgetMode,
    modelOverrides: HashMap<String, bool>,
) -> Result<RoutingDecision, String> {
    let mut router_config = state.router_config.lock().await;
    router_config.mode = mode;
    router_config.budget = budget;
    router_config.apply_enabled_overrides(&modelOverrides);
    let classification = classify_task(&message);
    Ok(router_config.route(&classification))
}

#[allow(non_snake_case)]
#[tauri::command]
async fn search(
    state: State<'_, AppState>,
    query: String,
    numResults: usize,
) -> Result<Vec<search::SearchResult>, String> {
    state.search_service.search(&query, numResults, vec![]).await.map_err(|e| e.to_string())
}

// --- Workspace Commands ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerStatus {
    pub available: bool,
    pub message: String,
    pub download_url: String,
}

#[tauri::command]
async fn check_docker() -> Result<DockerStatus, String> {
    let docker = bollard::Docker::connect_with_local_defaults();
    match docker {
        Ok(d) => match d.version().await {
            Ok(_) => Ok(DockerStatus {
                available: true,
                message: "Docker is running".into(),
                download_url: "https://www.docker.com/products/docker-desktop/".into(),
            }),
            Err(_) => Ok(DockerStatus {
                available: false,
                message: "Could not reach Docker. Make sure Docker Desktop is running.".into(),
                download_url: "https://www.docker.com/products/docker-desktop/".into(),
            }),
        },
        Err(_) => Ok(DockerStatus {
            available: false,
            message: "Docker not found or not running.".into(),
            download_url: "https://www.docker.com/products/docker-desktop/".into(),
        }),
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RustWorkspaceFile {
    pub path: String,
    pub filename: String,
    pub size: u64,
    pub modified_at: u64,
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_list(taskId: String, workspacePath: String) -> Result<Vec<RustWorkspaceFile>, String> {
    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId));
    if !full_path.exists() { return Ok(vec![]); }
    
    let mut files = vec![];
    for entry in walkdir::WalkDir::new(&full_path).min_depth(1) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        if entry.file_type().is_file() {
            let path = entry.path().strip_prefix(&full_path).unwrap_or(entry.path()).to_string_lossy().to_string();
            let filename = entry.file_name().to_string_lossy().to_string();
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            let size = metadata.len();
            let modified_at = metadata.modified()
                .map(|m| m.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
                .unwrap_or(0);
            files.push(RustWorkspaceFile { path, filename, size, modified_at });
        }
    }
    Ok(files)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_read(taskId: String, path: String, workspacePath: String) -> Result<String, String> {
    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId)).join(path);
    std::fs::read_to_string(full_path).map_err(|e| e.to_string())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_write(taskId: String, path: String, content: String, workspacePath: String) -> Result<(), String> {
    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId)).join(path);
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(full_path, content).map_err(|e| e.to_string())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_delete(taskId: String, path: String, workspacePath: String) -> Result<(), String> {
    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId)).join(path);
    std::fs::remove_file(full_path).map_err(|e| e.to_string())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_delete_all(taskId: String, workspacePath: String) -> Result<(), String> {
    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId));
    if full_path.exists() {
        std::fs::remove_dir_all(full_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

// --- Agent Commands ---

#[allow(non_snake_case)]
#[tauri::command]
async fn run_agent(
    _app: AppHandle,
    state: State<'_, AppState>,
    taskId: String,
    _messageId: String,
    _userMessages: Vec<serde_json::Value>,
    _apiKey: String,
    _model: String,
    _workspacePath: String,
    _apiBase: String,
    _provider: String,
    _routerMode: ModelSelectionMode,
    _routerBudget: BudgetMode,
    _routerModelOverrides: HashMap<String, bool>,
    _taskTitle: String,
    _searchConfig: serde_json::Value,
) -> Result<(), String> {
    // Rust backend tracks active tasks so it can clean up resources (like Docker containers)
    // if the app crashes or if the task is aborted from the backend.
    // The actual agent logic now runs in the TypeScript Orchestrator.
    let handle = tokio::spawn(async move {
        // Placeholder for future backend-side state tracking or cleanup logic
        // For now, we just keep the task "active" in the state
    });
    
    let mut active_tasks = state.active_tasks.lock().await;
    active_tasks.insert(taskId, handle);
    
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn stop_agent(state: State<'_, AppState>, taskId: String) -> Result<(), String> {
    let mut active_tasks = state.active_tasks.lock().await;
    if let Some(handle) = active_tasks.remove(&taskId) {
        handle.abort();
    }
    Ok(())
}

// --- Persistence Commands ---

#[allow(non_snake_case)]
#[tauri::command]
async fn save_task_history(app: AppHandle, taskId: String, rawHistory: String) -> Result<(), String> {
    let db_path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("nasus.db");
    
    // Ensure parent dir exists
    if let Some(parent) = db_path.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (task_id TEXT PRIMARY KEY, raw_history TEXT)",
        [],
    ).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO history (task_id, raw_history) VALUES (?1, ?2)",
        params![taskId, rawHistory],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn load_task_history(app: AppHandle, taskId: String) -> Result<Option<String>, String> {
    let db_path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("nasus.db");
    
    if !db_path.exists() {
        return Ok(None);
    }

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    
    // Check if table exists
    let table_exists: bool = conn.query_row(
        "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='history'",
        [],
        |row| row.get(0),
    ).map_err(|_| false);

    if !table_exists {
        return Ok(None);
    }

    let mut stmt = conn.prepare("SELECT raw_history FROM history WHERE task_id = ?1")
        .map_err(|e| e.to_string())?;
    
    let result = stmt.query_row(params![taskId], |row| row.get(0));
    
    match result {
        Ok(history) => Ok(Some(history)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn delete_task_history(app: AppHandle, taskId: String) -> Result<(), String> {
    let db_path = app.path().app_data_dir()
        .map_err(|e| e.to_string())?
        .join("nasus.db");
    
    if !db_path.exists() {
        return Ok(());
    }

    let conn = Connection::open(db_path).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM history WHERE task_id = ?1", params![taskId])
        .map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn is_ollama_running() -> bool {
    match reqwest::get("http://localhost:11434/api/tags").await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_log::Builder::new().build())
    .plugin(tauri_plugin_store::Builder::new().build())
    .plugin(tauri_plugin_shell::init())
    .plugin(tauri_plugin_dialog::init())
    .manage(AppState {
        config: Mutex::new(Config {
            api_key: "".into(),
            model: "anthropic/claude-3.7-sonnet".into(),
            workspace_path: "".into(),
            api_base: "https://openrouter.ai/api/v1".into(),
            provider: "openrouter".into(),
        }),
        router_config: Mutex::new(RouterConfig::default()),
        search_service: Arc::new(SearchService::new(None)),
        active_tasks: Mutex::new(HashMap::new()),
    })
    .invoke_handler(tauri::generate_handler![
        get_config,
        save_config,
        validate_path,
        get_model_registry,
        save_router_settings,
        preview_routing,
        search,
        workspace_list,
        workspace_read,
        workspace_write,
        workspace_delete,
        workspace_delete_all,
        run_agent,
        stop_agent,
        save_task_history,
        load_task_history,
        delete_task_history,
        check_docker,
        is_ollama_running,
        docker::commands::docker_create_container,
        docker::commands::docker_execute_python,
        docker::commands::docker_execute_bash,
        docker::commands::docker_dispose_container,
        docker::commands::docker_check_status,
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
