use once_cell::sync::Lazy;
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::collections::HashSet;
use std::path::Path;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager, State};
use tokio::sync::Mutex;

pub mod docker;
mod error;
pub mod gateway;
pub mod models;
pub mod python_sidecar;
pub mod search;
pub mod sidecar;
pub use error::NasusError;

/// Convenience alias — use this as the return type for Tauri commands
/// instead of `Result<T, String>` to get structured, serializable errors.
pub type NasusResult<T> = Result<T, NasusError>;

use crate::models::classifier::classify_task;
use crate::models::router::{BudgetMode, ModelSelectionMode, RouterConfig, RoutingDecision};
use crate::search::service::SearchService;

// --- Shared HTTP Client ---
// Uses once_cell::sync::Lazy for thread-safe lazy initialization with connection pooling
static HTTP_CLIENT: Lazy<reqwest::Client> = Lazy::new(|| {
    reqwest::Client::builder()
        .pool_idle_timeout(std::time::Duration::from_secs(90))
        .timeout(std::time::Duration::from_secs(30))
        .user_agent("Mozilla/5.0 (compatible; Nasus/1.0)")
        .build()
        .expect("Failed to create HTTP client")
});

// --- State and Config ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Config {
    pub api_key: String,
    pub model: String,
    pub workspace_path: String,
    pub api_base: String,
    pub provider: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SearchConfig {
    pub exa_key: String,
}

impl Default for SearchConfig {
    fn default() -> Self {
        Self {
            exa_key: String::new(),
        }
    }
}

pub struct AppState {
    pub config: Mutex<Config>,
    pub router_config: Mutex<RouterConfig>,
    pub search_config: Mutex<SearchConfig>,
    pub search_service: Arc<SearchService>,
    /// Set of task IDs currently running (used for stop coordination).
    /// The actual cancellation is performed by TypeScript via AbortController —
    /// the Rust side emits a "nasus:stop-task" event and TypeScript handles it.
    pub active_tasks: Mutex<HashSet<String>>,
    pub sidecar: sidecar::SharedSidecarState,
    /// Shared SQLite connection — avoids opening a new file handle on every command.
    /// WAL mode is enabled on init for better concurrent read performance.
    pub db: Arc<Mutex<Connection>>,
}

/// Open (or create) the nasus.db and configure it for shared use.
fn open_db(app_data_dir: &Path) -> Result<Connection, String> {
    let db_path = app_data_dir.join("nasus.db");
    if let Some(p) = db_path.parent() {
        let _ = std::fs::create_dir_all(p);
    }
    let conn = Connection::open(&db_path).map_err(|e| e.to_string())?;
    // Enable WAL for better concurrent read performance, set busy timeout to
    // prevent immediate SQLITE_BUSY errors under write contention, and increase
    // the page cache to reduce disk I/O during trace-heavy executions.
    conn.execute_batch(
      "PRAGMA journal_mode=WAL; PRAGMA synchronous=NORMAL; PRAGMA busy_timeout=5000; PRAGMA cache_size=-65536;"
    )
        .map_err(|e| e.to_string())?;
    // Ensure all tables exist
    ensure_extended_schema(&conn)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (task_id TEXT PRIMARY KEY, raw_history TEXT)",
        [],
    )
    .map_err(|e| e.to_string())?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS kv_store (key TEXT PRIMARY KEY, value TEXT NOT NULL)",
        [],
    )
    .map_err(|e| e.to_string())?;
    Ok(conn)
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

// --- Path Validation ---

/// Validates that a path doesn't escape the base directory (prevents path traversal attacks).
/// Returns Ok(()) if the path is safe, Err with message if traversal is detected.
///
/// Uses a two-step approach:
/// 1. Lexically reject any path component that is ".." (catches the common case without I/O)
/// 2. Canonicalize only the *base* directory (which must already exist) and verify that the
///    joined path, once its lexical components are resolved, stays within the base.
///
/// We intentionally do NOT call canonicalize() on the full target path because the file
/// may not exist yet (e.g. on the first write_file call), which would cause canonicalize()
/// to return an error and silently block every new-file creation.
fn validate_path_no_traversal(base: &Path, path: &Path) -> Result<(), String> {
    use std::path::Component;

    // Step 1: Reject any ".." component in the relative path
    for component in path.components() {
        if matches!(component, Component::ParentDir) {
            return Err("Path traversal detected: '..' is not allowed".to_string());
        }
    }

    // Step 2: Canonicalize the base (it must exist) and lexically verify the join
    // Create the base directory if it doesn't exist yet so canonicalize can succeed
    let _ = std::fs::create_dir_all(base);
    let base_canonical = base
        .canonicalize()
        .map_err(|e| format!("Invalid base path: {}", e))?;

    // Build the joined path by appending each non-special component
    let mut resolved = base_canonical.clone();
    for component in path.components() {
        match component {
            Component::Normal(part) => resolved.push(part),
            Component::CurDir => {} // "." — skip
            Component::RootDir => {
                // Absolute path supplied — treat it as relative to base
                // (strip the leading / and continue)
            }
            Component::Prefix(_) => {
                // Windows drive prefix — skip
            }
            Component::ParentDir => {
                // Already caught above, but be defensive
                return Err("Path traversal detected: '..' is not allowed".to_string());
            }
        }
    }

    // Final check: the resolved path must still start with the canonical base
    if !resolved.starts_with(&base_canonical) {
        return Err("Path traversal detected: access denied".to_string());
    }

    Ok(())
}

// --- Commands ---

#[tauri::command]
async fn get_config(app: AppHandle, state: State<'_, AppState>) -> NasusResult<Config> {
    let mut config = state.config.lock().await;
    // If the in-memory key is empty, try to reload it from the persisted store.
    // This handles the cold-start case where the process was restarted but the
    // key was written on a previous run.
    if config.api_key.is_empty() {
        if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
            if let Some(v) = store.get("apiKey") {
                if let Some(k) = v.as_str() {
                    if !k.is_empty() {
                        config.api_key = k.to_string();
                    }
                }
            }
            // Also restore provider/model/apiBase from store if in-memory defaults are still set
            if let Some(v) = store.get("provider") {
                if let Some(s) = v.as_str() {
                    if !s.is_empty() {
                        config.provider = s.to_string();
                    }
                }
            }
            if let Some(v) = store.get("model") {
                if let Some(s) = v.as_str() {
                    if !s.is_empty() {
                        config.model = s.to_string();
                    }
                }
            }
            if let Some(v) = store.get("apiBase") {
                if let Some(s) = v.as_str() {
                    if !s.is_empty() {
                        config.api_base = s.to_string();
                    }
                }
            }
            if let Some(v) = store.get("workspacePath") {
                if let Some(s) = v.as_str() {
                    if !s.is_empty() {
                        config.workspace_path = s.to_string();
                    }
                }
            }
        }
    }
    Ok(config.clone())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn save_config(
    app: AppHandle,
    state: State<'_, AppState>,
    apiKey: String,
    model: String,
    workspacePath: String,
    apiBase: String,
    provider: String,
) -> NasusResult<()> {
    // Update in-memory state
    {
        let mut config = state.config.lock().await;
        config.api_key = apiKey.clone();
        config.model = model.clone();
        if !workspacePath.is_empty() {
            config.workspace_path = workspacePath.clone();
        }
        config.api_base = apiBase.clone();
        config.provider = provider.clone();
    }

    // Persist to tauri-plugin-store so settings survive restarts.
    // This file lives in the app's private data directory (not web-accessible),
    // so storing the key here is equivalent to localStorage on a desktop app.
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        if !apiKey.is_empty() {
            let _ = store.set("apiKey", serde_json::Value::String(apiKey));
        }
        let _ = store.set("model", serde_json::Value::String(model));
        if !workspacePath.is_empty() {
            let _ = store.set("workspacePath", serde_json::Value::String(workspacePath));
        }
        let _ = store.set("apiBase", serde_json::Value::String(apiBase));
        let _ = store.set("provider", serde_json::Value::String(provider));
        let _ = store.save();
    }

    Ok(())
}

#[tauri::command]
async fn validate_path(path: String) -> NasusResult<bool> {
    let p = std::path::Path::new(&path);
    Ok(p.exists() && p.is_dir())
}

#[tauri::command]
async fn get_model_registry(
    state: State<'_, AppState>,
) -> NasusResult<Vec<models::registry::ModelInfo>> {
    let router_config = state.router_config.lock().await;
    Ok(router_config.registry.clone())
}

/// Fetch latest models from OpenRouter and update the registry
#[tauri::command]
async fn refresh_models(
    state: State<'_, AppState>,
) -> NasusResult<Vec<models::registry::ModelInfo>> {
    // Get API key from config
    let api_key = {
        let config = state.config.lock().await;
        if config.api_key.is_empty() {
            return Err(NasusError::Config("No API key configured".to_string()));
        }
        config.api_key.clone()
    };

    // Fetch models from OpenRouter
    let models = models::fetch_openrouter_models(&api_key)
        .await
        .map_err(|e| NasusError::Command(e))?;

    // Update the router config registry
    {
        let mut router_config = state.router_config.lock().await;
        router_config.registry = models.clone();
    }

    Ok(models)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn save_router_settings(
    state: State<'_, AppState>,
    mode: ModelSelectionMode,
    budget: BudgetMode,
    modelOverrides: HashMap<String, bool>,
) -> NasusResult<()> {
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
) -> NasusResult<RoutingDecision> {
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
    searchConfig: Option<SearchConfig>,
) -> NasusResult<Vec<search::SearchResult>> {
    let mut providers: Vec<Box<dyn search::SearchProvider>> = vec![];
    // Use shared HTTP client with connection pooling
    let client = &*HTTP_CLIENT;

    // Determine which config to use
    let config = if let Some(c) = searchConfig {
        log::debug!(
            "[Search] Using provided searchConfig, key_length={}",
            c.exa_key.len()
        );
        c
    } else {
        let cfg = state.search_config.lock().await.clone();
        log::debug!(
            "[Search] Using state searchConfig, key_length={}",
            cfg.exa_key.len()
        );
        cfg
    };

    // Use Exa as the sole search provider
    if !config.exa_key.is_empty() {
        log::debug!("[Search] Adding Exa provider");
        providers.push(Box::new(search::providers::exa::ExaProvider {
            api_key: config.exa_key,
            client: client.clone(),
        }));
    } else {
        log::warn!("[Search] exa_key is empty, no providers added!");
    }

    log::debug!("[Search] Total providers: {}", providers.len());
    state
        .search_service
        .search(&query, numResults, providers)
        .await
        .map_err(|e| NasusError::Command(e.to_string()))
}

#[allow(non_snake_case)]
#[tauri::command]
async fn save_search_config(
    state: State<'_, AppState>,
    searchConfig: SearchConfig,
) -> NasusResult<()> {
    log::debug!(
        "[save_search_config] Saving config, key_length={}",
        searchConfig.exa_key.len()
    );
    let mut config = state.search_config.lock().await;
    *config = searchConfig;
    Ok(())
}

#[tauri::command]
async fn get_search_config(state: State<'_, AppState>) -> NasusResult<SearchConfig> {
    let config = state.search_config.lock().await;
    log::debug!(
        "[get_search_config] Returning config, key_length={}",
        config.exa_key.len()
    );
    Ok(config.clone())
}

/// Retrieve the Exa API key from the app store.
/// Returns an empty string if no key has been stored yet.
#[tauri::command]
async fn get_exa_key(app: AppHandle) -> NasusResult<String> {
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        if let Some(v) = store.get("exa_api_key") {
            if let Some(s) = v.as_str() {
                return Ok(s.to_string());
            }
        }
    }
    Ok(String::new())
}

/// Persist the Exa API key to the app store and update in-memory state.
#[tauri::command]
async fn set_exa_key(app: AppHandle, state: State<'_, AppState>, key: String) -> NasusResult<()> {
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        if key.is_empty() {
            let _ = store.delete("exa_api_key");
        } else {
            let _ = store.set("exa_api_key", serde_json::Value::String(key.clone()));
        }
        let _ = store.save();
    }
    let mut config = state.search_config.lock().await;
    config.exa_key = key;
    Ok(())
}

/// Get a provider API key from the app store.
/// provider: "openrouter" | "requesty" | "deepseek"
#[tauri::command]
async fn get_provider_key(app: AppHandle, provider: String) -> NasusResult<String> {
    let store_key = format!("provider_key_{}", provider);
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        if let Some(v) = store.get(&store_key) {
            if let Some(s) = v.as_str() {
                return Ok(s.to_string());
            }
        }
    }
    Ok(String::new())
}

/// Save a provider API key to the app store.
/// provider: "openrouter" | "requesty" | "deepseek"
#[tauri::command]
async fn set_provider_key(app: AppHandle, provider: String, key: String) -> NasusResult<()> {
    let store_key = format!("provider_key_{}", provider);
    if let Ok(store) = tauri_plugin_store::StoreExt::store(&app, "nasus_config.json") {
        if key.is_empty() {
            let _ = store.delete(&store_key);
        } else {
            let _ = store.set(&store_key, serde_json::Value::String(key));
        }
        let _ = store.save();
    }
    Ok(())
}

// --- Workspace Commands ---

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DockerStatus {
    pub available: bool,
    pub message: String,
    pub download_url: String,
}

#[tauri::command]
async fn check_docker() -> NasusResult<DockerStatus> {
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
async fn workspace_list(
    taskId: String,
    workspacePath: String,
) -> NasusResult<Vec<RustWorkspaceFile>> {
    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId));
    if !full_path.exists() {
        return Ok(vec![]);
    }

    let mut files = vec![];
    for entry in walkdir::WalkDir::new(&full_path).min_depth(1) {
        let entry = match entry {
            Ok(e) => e,
            Err(_) => continue,
        };
        if entry.file_type().is_file() {
            let path = entry
                .path()
                .strip_prefix(&full_path)
                .unwrap_or(entry.path())
                .to_string_lossy()
                .to_string();
            let filename = entry.file_name().to_string_lossy().to_string();
            let metadata = match entry.metadata() {
                Ok(m) => m,
                Err(_) => continue,
            };
            let size = metadata.len();
            let modified_at = metadata
                .modified()
                .map(|m| {
                    m.duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_secs()
                })
                .unwrap_or(0);
            files.push(RustWorkspaceFile {
                path,
                filename,
                size,
                modified_at,
            });
        }
    }
    Ok(files)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_read(
    taskId: String,
    path: String,
    workspacePath: String,
) -> NasusResult<String> {
    let base = Path::new(&workspacePath).join(format!("task-{}", taskId));
    let target = Path::new(&path);

    // Validate path doesn't escape workspace
    validate_path_no_traversal(&base, target).map_err(|e| NasusError::Config(e))?;

    let full_path = base.join(target);
    std::fs::read_to_string(full_path).map_err(NasusError::Io)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_read_binary(
    taskId: String,
    path: String,
    workspacePath: String,
) -> NasusResult<String> {
    use base64::{engine::general_purpose::STANDARD, Engine as _};
    let base = Path::new(&workspacePath).join(format!("task-{}", taskId));
    let target = Path::new(&path);
    validate_path_no_traversal(&base, target).map_err(|e| NasusError::Config(e))?;
    let full_path = base.join(target);
    let bytes = std::fs::read(full_path).map_err(NasusError::Io)?;
    Ok(STANDARD.encode(&bytes))
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_write(
    taskId: String,
    path: String,
    content: String,
    workspacePath: String,
) -> NasusResult<()> {
    let base = Path::new(&workspacePath).join(format!("task-{}", taskId));
    let target = Path::new(&path);

    // Validate path doesn't escape workspace
    validate_path_no_traversal(&base, target).map_err(|e| NasusError::Config(e))?;

    let full_path = base.join(target);
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent).map_err(NasusError::Io)?;
    }
    std::fs::write(full_path, content).map_err(NasusError::Io)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_delete(taskId: String, path: String, workspacePath: String) -> NasusResult<()> {
    let base = Path::new(&workspacePath).join(format!("task-{}", taskId));
    let target = Path::new(&path);

    // Validate path doesn't escape workspace
    validate_path_no_traversal(&base, target).map_err(|e| NasusError::Config(e))?;

    let full_path = base.join(target);
    std::fs::remove_file(full_path).map_err(NasusError::Io)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn workspace_delete_all(taskId: String, workspacePath: String) -> NasusResult<()> {
    // Prevent path traversal via taskId (basic check)
    if taskId.contains("..") || taskId.contains('/') || taskId.contains('\\') {
        return Err(NasusError::Config(
            "Invalid taskId: contains path characters".to_string(),
        ));
    }

    let full_path = Path::new(&workspacePath).join(format!("task-{}", taskId));
    if full_path.exists() {
        std::fs::remove_dir_all(full_path).map_err(NasusError::Io)?;
    }
    Ok(())
}

// --- Generic File Operations (for project-level files like .nasus/project_memory.md) ---

#[allow(non_snake_case)]
#[tauri::command]
async fn read_file(_taskId: String, path: String, workspacePath: String) -> NasusResult<String> {
    // Only allow project-level files (outside task directories)
    // Prevent path traversal attacks
    let clean_path = Path::new(&path);
    if clean_path
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(NasusError::Config("Path traversal not allowed".to_string()));
    }

    // Resolve the path relative to workspace root
    let full_path = Path::new(&workspacePath).join(clean_path);

    // Ensure the resolved path is still within workspace
    let workspace = Path::new(&workspacePath)
        .canonicalize()
        .map_err(NasusError::Io)?;
    let resolved = full_path
        .canonicalize()
        .map_err(|_| NasusError::Config("File not found".to_string()))?;

    if !resolved.starts_with(&workspace) {
        return Err(NasusError::Config(
            "Access denied: path outside workspace".to_string(),
        ));
    }

    std::fs::read_to_string(&full_path).map_err(NasusError::Io)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn write_file(
    _taskId: String,
    path: String,
    content: String,
    workspacePath: String,
) -> NasusResult<()> {
    // Only allow project-level files (outside task directories)
    // Prevent path traversal attacks
    let clean_path = Path::new(&path);
    if clean_path
        .components()
        .any(|c| matches!(c, std::path::Component::ParentDir))
    {
        return Err(NasusError::Config("Path traversal not allowed".to_string()));
    }

    // Resolve the path relative to workspace root
    let full_path = Path::new(&workspacePath).join(clean_path);

    // Ensure the resolved path is still within workspace
    let _ = std::fs::create_dir_all(Path::new(&workspacePath));
    let workspace = Path::new(&workspacePath)
        .canonicalize()
        .map_err(NasusError::Io)?;
    if let Ok(resolved) = full_path.canonicalize() {
        if !resolved.starts_with(&workspace) {
            return Err(NasusError::Config(
                "Access denied: path outside workspace".to_string(),
            ));
        }
    }

    // Create parent directories if needed
    if let Some(parent) = full_path.parent() {
        std::fs::create_dir_all(parent).map_err(NasusError::Io)?;
    }

    std::fs::write(&full_path, content).map_err(NasusError::Io)
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
) -> NasusResult<()> {
    // The actual agent runs entirely in TypeScript via the Orchestrator.
    // This command just registers the task as active so stop_agent can signal it.
    let mut active_tasks = state.active_tasks.lock().await;
    active_tasks.insert(taskId);
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn stop_agent(app: AppHandle, state: State<'_, AppState>, taskId: String) -> NasusResult<()> {
    let mut active_tasks = state.active_tasks.lock().await;
    active_tasks.remove(&taskId);
    // Emit a Tauri event so the TypeScript side can abort its AbortController.
    // The frontend listens for "nasus:stop-task" and calls stopWebAgent(taskId).
    let _ = app.emit("nasus:stop-task", serde_json::json!({ "taskId": taskId }));
    Ok(())
}

// --- HTTP Fetch Command (CORS bypass for Tauri) ---

/// Validate a URL against SSRF risks.
/// Rejects non-HTTP/HTTPS schemes, private/loopback/link-local IP ranges,
/// and hostnames that resolve to those ranges.
fn validate_url_for_fetch(url: &str) -> Result<(), String> {
    use std::net::{IpAddr, ToSocketAddrs};

    let parsed = url::Url::parse(url).map_err(|e| format!("Invalid URL: {}", e))?;

    // Only allow http and https schemes
    match parsed.scheme() {
        "http" | "https" => {}
        other => {
            return Err(format!(
                "Disallowed URL scheme: '{}'. Only http and https are permitted.",
                other
            ))
        }
    }

    let host = parsed
        .host_str()
        .ok_or_else(|| "URL has no host".to_string())?;

    // Reject bare 'localhost' / '0.0.0.0' without DNS resolution
    let lower = host.to_lowercase();
    if lower == "localhost" || lower == "0.0.0.0" {
        return Err(format!("Requests to '{}' are not permitted.", host));
    }

    // If the host is already an IP address, validate it directly
    if let Ok(ip) = host.parse::<IpAddr>() {
        return validate_ip(ip);
    }

    // Resolve hostname and validate all resulting IPs
    let port = parsed.port_or_known_default().unwrap_or(80);
    let addrs = format!("{}:{}", host, port)
        .to_socket_addrs()
        .map_err(|e| format!("Failed to resolve hostname '{}': {}", host, e))?;

    for addr in addrs {
        validate_ip(addr.ip())?;
    }

    Ok(())
}

fn validate_ip(ip: std::net::IpAddr) -> Result<(), String> {
    use std::net::IpAddr;

    let blocked = match ip {
        IpAddr::V4(v4) => {
            v4.is_loopback()          // 127.0.0.0/8
            || v4.is_private()        // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
            || v4.is_link_local()     // 169.254.0.0/16 (cloud metadata)
            || v4.is_broadcast()
            || v4.is_unspecified() // 0.0.0.0
        }
        IpAddr::V6(v6) => {
            v6.is_loopback()          // ::1
            || v6.is_unspecified() // ::
        }
    };

    if blocked {
        return Err(format!(
            "Requests to private/internal IP address {} are not permitted.",
            ip
        ));
    }

    Ok(())
}

/// HTTP fetch bypassing CORS - for agent use in Tauri mode
#[allow(non_snake_case)]
#[tauri::command]
async fn http_fetch(
    url: String,
    method: Option<String>,
    headers: Option<Vec<String>>,
    body: Option<String>,
) -> NasusResult<String> {
    // Reuse the shared HTTP_CLIENT (connection pooling) instead of creating a new client per call
    let client = &*HTTP_CLIENT;

    // Validate URL to prevent SSRF attacks (private IPs, non-HTTP schemes, etc.)
    validate_url_for_fetch(&url).map_err(|e| NasusError::Config(e))?;

    let mut request = client.request(
        method
            .as_deref()
            .unwrap_or("GET")
            .parse::<reqwest::Method>()
            .map_err(|e| NasusError::Command(e.to_string()))?,
        &url,
    );

    // Apply headers if provided (flattened array of key-value pairs)
    if let Some(h) = headers {
        for chunk in h.chunks(2) {
            if chunk.len() == 2 {
                request = request.header(&chunk[0], &chunk[1]);
            }
        }
    }

    // Apply body for POST requests
    if let Some(b) = body {
        request = request.body(b);
    }

    let response = request
        .send()
        .await
        .map_err(|e| NasusError::Command(e.to_string()))?;
    let status = response.status().as_u16();

    // Cap response size at 10MB to prevent OOM on large binary/HTML responses.
    // The ExecutionAgent truncates tool output to 15KB anyway, so reading more is wasteful.
    const MAX_RESPONSE_BYTES: u64 = 10 * 1024 * 1024;
    let content_length = response.content_length().unwrap_or(0);
    if content_length > MAX_RESPONSE_BYTES {
        return Ok(format!(
            "{}\n[Response truncated: content-length {} exceeds 10MB limit]",
            status, content_length
        ));
    }

    // Stream bytes up to the limit so we don't allocate the full body for large responses
    let bytes = response
        .bytes()
        .await
        .map_err(|e| NasusError::Command(e.to_string()))?;
    let truncated = if bytes.len() as u64 > MAX_RESPONSE_BYTES {
        &bytes[..MAX_RESPONSE_BYTES as usize]
    } else {
        &bytes[..]
    };
    let text = String::from_utf8_lossy(truncated).into_owned();

    // Include status code in response for frontend handling
    Ok(format!("{}\n{}", status, text))
}

// --- Persistence Commands ---

#[allow(non_snake_case)]
#[tauri::command]
async fn save_task_history(
    state: State<'_, AppState>,
    taskId: String,
    rawHistory: String,
) -> NasusResult<()> {
    let conn = state.db.lock().await;
    conn.execute(
        "INSERT OR REPLACE INTO history (task_id, raw_history) VALUES (?1, ?2)",
        params![taskId, rawHistory],
    )
    .map_err(|e| NasusError::Database(e.to_string()))?;
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn load_task_history(
    state: State<'_, AppState>,
    taskId: String,
) -> NasusResult<Option<String>> {
    let conn = state.db.lock().await;
    let mut stmt = conn
        .prepare("SELECT raw_history FROM history WHERE task_id = ?1")
        .map_err(|e| NasusError::Database(e.to_string()))?;
    let result = stmt.query_row(params![taskId], |row| row.get(0));
    match result {
        Ok(history) => Ok(Some(history)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(NasusError::Database(e.to_string())),
    }
}

#[allow(non_snake_case)]
#[tauri::command]
async fn delete_task_history(state: State<'_, AppState>, taskId: String) -> NasusResult<()> {
    let conn = state.db.lock().await;
    conn.execute("DELETE FROM history WHERE task_id = ?1", params![taskId])
        .map_err(|e| NasusError::Database(e.to_string()))?;
    Ok(())
}

// ── DB schema helper ──────────────────────────────────────────────────────────

/// Ensure the extended tables exist in nasus.db.
/// Called lazily before any operation that needs them.
fn ensure_extended_schema(conn: &Connection) -> Result<(), String> {
    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS memories (
            id          TEXT PRIMARY KEY,
            task_id     TEXT NOT NULL,
            content     TEXT NOT NULL,
            content_type TEXT,
            tags        TEXT,
            timestamp   INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_memories_task ON memories(task_id);

        CREATE TABLE IF NOT EXISTS trace_steps (
            id          TEXT PRIMARY KEY,
            task_id     TEXT NOT NULL,
            message_id  TEXT NOT NULL,
            step_kind   TEXT NOT NULL,
            tool_name   TEXT,
            input_json  TEXT,
            output_text TEXT,
            is_error    INTEGER DEFAULT 0,
            duration_ms INTEGER,
            timestamp   INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_trace_task ON trace_steps(task_id);
        CREATE INDEX IF NOT EXISTS idx_trace_msg  ON trace_steps(message_id);

        CREATE TABLE IF NOT EXISTS agent_tasks (
            id          TEXT PRIMARY KEY,
            title       TEXT NOT NULL,
            status      TEXT NOT NULL DEFAULT 'pending',
            created_at  INTEGER NOT NULL,
            updated_at  INTEGER NOT NULL,
            model_id    TEXT,
            total_tokens INTEGER DEFAULT 0,
            estimated_cost_usd REAL DEFAULT 0.0
        );",
    )
    .map_err(|e| e.to_string())
}

// ── Memory persistence commands ───────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbMemory {
    pub id: String,
    pub task_id: String,
    pub content: String,
    pub content_type: Option<String>,
    pub tags: Option<Vec<String>>,
    pub timestamp: i64,
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_save_memory(state: State<'_, AppState>, memory: DbMemory) -> NasusResult<()> {
    let conn = state.db.lock().await;
    let tags_json = memory
        .tags
        .map(|t| serde_json::to_string(&t).unwrap_or_default());
    conn.execute(
        "INSERT OR REPLACE INTO memories (id, task_id, content, content_type, tags, timestamp)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![
            memory.id,
            memory.task_id,
            memory.content,
            memory.content_type,
            tags_json,
            memory.timestamp
        ],
    )
    .map_err(|e| NasusError::Database(e.to_string()))?;
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_query_memories(
    state: State<'_, AppState>,
    taskId: Option<String>,
    limit: Option<i64>,
) -> NasusResult<Vec<DbMemory>> {
    let conn = state.db.lock().await;
    let lim = limit.unwrap_or(100);
    if let Some(tid) = &taskId {
        let mut s = conn
            .prepare(
                "SELECT id, task_id, content, content_type, tags, timestamp
             FROM memories WHERE task_id = ?1 ORDER BY timestamp DESC LIMIT ?2",
            )
            .map_err(|e| NasusError::Database(e.to_string()))?;
        let rows: Vec<DbMemory> = s
            .query_map(params![tid, lim], |row| {
                let tags_str: Option<String> = row.get(4)?;
                let tags = tags_str
                    .as_deref()
                    .and_then(|s| serde_json::from_str(s).ok());
                Ok(DbMemory {
                    id: row.get(0)?,
                    task_id: row.get(1)?,
                    content: row.get(2)?,
                    content_type: row.get(3)?,
                    tags,
                    timestamp: row.get(5)?,
                })
            })
            .map_err(|e| NasusError::Database(e.to_string()))?
            .filter_map(|r| r.ok())
            .collect();
        return Ok(rows);
    }
    let mut stmt = conn
        .prepare(
            "SELECT id, task_id, content, content_type, tags, timestamp
         FROM memories ORDER BY timestamp DESC LIMIT ?1",
        )
        .map_err(|e| NasusError::Database(e.to_string()))?;
    let rows: Vec<DbMemory> = stmt
        .query_map(params![lim], |row| {
            let tags_str: Option<String> = row.get(4)?;
            let tags = tags_str
                .as_deref()
                .and_then(|s| serde_json::from_str(s).ok());
            Ok(DbMemory {
                id: row.get(0)?,
                task_id: row.get(1)?,
                content: row.get(2)?,
                content_type: row.get(3)?,
                tags,
                timestamp: row.get(5)?,
            })
        })
        .map_err(|e| NasusError::Database(e.to_string()))?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rows)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_delete_memory(state: State<'_, AppState>, memoryId: String) -> NasusResult<()> {
    let conn = state.db.lock().await;
    conn.execute("DELETE FROM memories WHERE id = ?1", params![memoryId])
        .map_err(|e| NasusError::Database(e.to_string()))?;
    Ok(())
}

// ── Trace step commands ───────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbTraceStep {
    pub id: String,
    pub task_id: String,
    pub message_id: String,
    pub step_kind: String,
    pub tool_name: Option<String>,
    pub input_json: Option<String>,
    pub output_text: Option<String>,
    pub is_error: bool,
    pub duration_ms: Option<i64>,
    pub timestamp: i64,
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_append_trace(state: State<'_, AppState>, step: DbTraceStep) -> NasusResult<()> {
    // Trace writes are best-effort observability — use try_lock to avoid blocking
    // the agent loop when the DB is busy with a history save or memory write.
    // Drops the trace step silently if the lock is contended.
    if let Ok(conn) = state.db.try_lock() {
        let _ = conn.execute(
            "INSERT OR IGNORE INTO trace_steps
             (id, task_id, message_id, step_kind, tool_name, input_json, output_text, is_error, duration_ms, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![step.id, step.task_id, step.message_id, step.step_kind,
                    step.tool_name, step.input_json, step.output_text,
                    step.is_error as i32, step.duration_ms, step.timestamp],
        );
    }
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_get_trace(state: State<'_, AppState>, taskId: String) -> NasusResult<Vec<DbTraceStep>> {
    let conn = state.db.lock().await;
    let mut stmt = conn.prepare(
        "SELECT id, task_id, message_id, step_kind, tool_name, input_json, output_text, is_error, duration_ms, timestamp
         FROM trace_steps WHERE task_id = ?1 ORDER BY timestamp ASC"
    ).map_err(|e| NasusError::Database(e.to_string()))?;
    let rows: Vec<DbTraceStep> = stmt
        .query_map(params![taskId], |row| {
            Ok(DbTraceStep {
                id: row.get(0)?,
                task_id: row.get(1)?,
                message_id: row.get(2)?,
                step_kind: row.get(3)?,
                tool_name: row.get(4)?,
                input_json: row.get(5)?,
                output_text: row.get(6)?,
                is_error: row.get::<_, i32>(7)? != 0,
                duration_ms: row.get(8)?,
                timestamp: row.get(9)?,
            })
        })
        .map_err(|e| NasusError::Database(e.to_string()))?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rows)
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_delete_trace(state: State<'_, AppState>, taskId: String) -> NasusResult<()> {
    let conn = state.db.lock().await;
    conn.execute(
        "DELETE FROM trace_steps WHERE task_id = ?1",
        params![taskId],
    )
    .map_err(|e| NasusError::Database(e.to_string()))?;
    Ok(())
}

// ── Agent task registry commands ──────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DbAgentTask {
    pub id: String,
    pub title: String,
    pub status: String,
    pub created_at: i64,
    pub updated_at: i64,
    pub model_id: Option<String>,
    pub total_tokens: i64,
    pub estimated_cost_usd: f64,
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_upsert_task(state: State<'_, AppState>, task: DbAgentTask) -> NasusResult<()> {
    let conn = state.db.lock().await;
    conn.execute(
        "INSERT INTO agent_tasks (id, title, status, created_at, updated_at, model_id, total_tokens, estimated_cost_usd)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)
         ON CONFLICT(id) DO UPDATE SET
           title=excluded.title, status=excluded.status, updated_at=excluded.updated_at,
           model_id=excluded.model_id, total_tokens=excluded.total_tokens,
           estimated_cost_usd=excluded.estimated_cost_usd",
        params![task.id, task.title, task.status, task.created_at, task.updated_at,
                task.model_id, task.total_tokens, task.estimated_cost_usd],
    ).map_err(|e| NasusError::Database(e.to_string()))?;
    Ok(())
}

#[allow(non_snake_case)]
#[tauri::command]
async fn db_list_tasks(
    state: State<'_, AppState>,
    limit: Option<i64>,
) -> NasusResult<Vec<DbAgentTask>> {
    let conn = state.db.lock().await;
    let lim = limit.unwrap_or(50);
    let mut stmt = conn.prepare(
        "SELECT id, title, status, created_at, updated_at, model_id, total_tokens, estimated_cost_usd
         FROM agent_tasks ORDER BY updated_at DESC LIMIT ?1"
    ).map_err(|e| NasusError::Database(e.to_string()))?;
    let rows: Vec<DbAgentTask> = stmt
        .query_map(params![lim], |row| {
            Ok(DbAgentTask {
                id: row.get(0)?,
                title: row.get(1)?,
                status: row.get(2)?,
                created_at: row.get(3)?,
                updated_at: row.get(4)?,
                model_id: row.get(5)?,
                total_tokens: row.get(6)?,
                estimated_cost_usd: row.get(7)?,
            })
        })
        .map_err(|e| NasusError::Database(e.to_string()))?
        .filter_map(|r| r.ok())
        .collect();
    Ok(rows)
}

#[tauri::command]
async fn is_ollama_running() -> bool {
    match reqwest::get("http://localhost:11434/api/tags").await {
        Ok(resp) => resp.status().is_success(),
        Err(_) => false,
    }
}

/// Get fallback model chain for OpenRouter's server-side fallback routing
#[allow(non_snake_case)]
#[tauri::command]
async fn get_fallback_chain(primaryModel: String, budget: BudgetMode) -> NasusResult<Vec<String>> {
    Ok(models::router::build_fallback_chain(&primaryModel, budget))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .setup(|app| {
            let app_data_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            let cache_path = app_data_dir.join("search_cache.db");
            let _ = std::fs::create_dir_all(&app_data_dir);

            // Open shared SQLite connection (WAL mode, all tables ensured)
            let db_conn = open_db(&app_data_dir).expect("Failed to open nasus.db");

            // Get the sidecar directory path (writable, persists across launches)
            let mut sidecar_dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
            sidecar_dir.push("sidecar");
            let _ = std::fs::create_dir_all(&sidecar_dir);

            // Resolve where the sidecar source files (package.json + index.js) live.
            // Priority:
            //   1. src-tauri/sidecar/ relative to current_dir  (tauri dev — works when CWD is the project root)
            //   2. ../src-tauri/sidecar/ (CWD might be src-tauri itself)
            //   3. The bundled resource dir (tauri build — files are copied there via tauri.conf.json resources)
            //   4. The app-data sidecar dir (fallback — files must be copied there by browser_install_sidecar)
            let has_package_json = |p: &std::path::PathBuf| p.join("package.json").exists();

            let sidecar_source = std::env::current_dir()
                .ok()
                .and_then(|cwd| {
                    // Try cwd/src-tauri/sidecar first (project root CWD)
                    let p1 = cwd.join("src-tauri").join("sidecar");
                    if has_package_json(&p1) {
                        return p1.canonicalize().ok();
                    }
                    // Try cwd/sidecar (CWD is already src-tauri)
                    let p2 = cwd.join("sidecar");
                    if has_package_json(&p2) {
                        return p2.canonicalize().ok();
                    }
                    None
                })
                .or_else(|| {
                    // Bundled resource dir
                    app.path().resource_dir().ok().and_then(|r| {
                        let p = r.join("sidecar");
                        if has_package_json(&p) {
                            Some(p)
                        } else {
                            None
                        }
                    })
                });

            // If we found a source dir with package.json, use it directly.
            // Otherwise fall back to app_data sidecar dir — browser_install_sidecar
            // will copy the bundled files there on first install.
            let sidecar_path = sidecar_source.unwrap_or(sidecar_dir);

            // ── Python Nasus Sidecar ──────────────────────────────────────────────────
            // Resolve nasus_stack dir: try several candidate locations then fall back to
            // bundled resource_dir/sidecar-python (prod). In dev mode cargo runs from
            // src-tauri/, so we need to walk up to the project root.
            let nasus_dir: String = {
                let candidates: Vec<std::path::PathBuf> = {
                    let mut v = Vec::new();
                    // cwd/nasus_stack  (project root invocation)
                    if let Ok(cwd) = std::env::current_dir() {
                        v.push(cwd.join("nasus_stack"));
                        v.push(cwd.join("../nasus_stack"));
                    }
                    // exe/../../../nasus_stack  (src-tauri/target/debug/nasus → project root)
                    if let Ok(exe) = std::env::current_exe() {
                        if let Some(d) = exe
                            .parent()
                            .and_then(|p| p.parent())
                            .and_then(|p| p.parent())
                            .and_then(|p| p.parent())
                        {
                            v.push(d.join("nasus_stack"));
                        }
                    }
                    v
                };
                candidates
                    .into_iter()
                    .map(|p| p.canonicalize().unwrap_or(p))
                    .find(|p| p.exists())
                    .or_else(|| {
                        app.path()
                            .resource_dir()
                            .ok()
                            .map(|r| r.join("sidecar-python"))
                    })
                    .map(|p| p.to_string_lossy().to_string())
                    .unwrap_or_else(|| "nasus_stack".to_string())
            };

            let nasus_arc = std::sync::Arc::new(tokio::sync::Mutex::new(
                python_sidecar::PythonSidecarState::with_dir(&nasus_dir),
            ));
            app.manage(nasus_arc.clone());

            // Spawn in background — non-blocking so the app window opens immediately
            let nasus_arc_bg = nasus_arc.clone();
            tauri::async_runtime::spawn(async move {
                if let Err(e) = python_sidecar::spawn_and_wait_ready(nasus_arc_bg, &nasus_dir).await
                {
                    eprintln!("[nasus] sidecar startup failed: {}", e);
                }
            });

            // Manage GatewayState as standalone Tauri state so that
            // gateway::get_gateways / save_gateways / get_gateway_health commands
            // (which use tauri::State<'_, GatewayState>) can resolve it.
            app.manage(gateway::GatewayState::new(gateway::default_gateways()));

            app.manage(AppState {
                config: Mutex::new(Config {
                    api_key: "".into(),
                    model: "anthropic/claude-3.7-sonnet".into(),
                    workspace_path: "".into(),
                    api_base: "https://openrouter.ai/api/v1".into(),
                    provider: "openrouter".into(),
                }),
                router_config: Mutex::new(RouterConfig::default()),
                search_config: Mutex::new(SearchConfig::default()),
                search_service: Arc::new(SearchService::new(Some(cache_path))),
                active_tasks: Mutex::new(HashSet::new()),
                sidecar: sidecar::SharedSidecarState(Arc::new(Mutex::new(
                    sidecar::SidecarState::new(sidecar_path),
                ))),
                db: Arc::new(Mutex::new(db_conn)),
            });

            Ok(())
        })
        
// --- KV / Memory commands ---

#[tauri::command]
fn memory_set(
    state: State<'_, Arc<Mutex<Connection>>>,
    key: String,
    value: String,
) -> Result<(), String> {
    let conn = tauri::async_runtime::block_on(state.lock());
    conn.execute(
        "INSERT OR REPLACE INTO kv_store (key, value) VALUES (?1, ?2)",
        params![key, value],
    )
    .map(|_| ())
    .map_err(|e| e.to_string())
}

#[tauri::command]
fn memory_get(
    state: State<'_, Arc<Mutex<Connection>>>,
    key: String,
) -> Result<Option<String>, String> {
    let conn = tauri::async_runtime::block_on(state.lock());
    let mut stmt = conn
        .prepare("SELECT value FROM kv_store WHERE key = ?1")
        .map_err(|e| e.to_string())?;
    let result = stmt
        .query_row(params![key], |row| row.get::<_, String>(0))
        .optional()
        .map_err(|e| e.to_string())?;
    Ok(result)
}

.invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            validate_path,
            get_model_registry,
            refresh_models,
            save_router_settings,
            preview_routing,
            search,
            save_search_config,
            get_search_config,
            get_exa_key,
            set_exa_key,
            get_provider_key,
            set_provider_key,
            workspace_list,
            workspace_read,
            workspace_read_binary,
            workspace_write,
            workspace_delete,
            workspace_delete_all,
            read_file,
            write_file,
            run_agent,
            stop_agent,
            http_fetch,
            save_task_history,
            load_task_history,
            delete_task_history,
            check_docker,
            is_ollama_running,
            get_fallback_chain,
            db_save_memory,
            db_query_memories,
            db_delete_memory,
            db_append_trace,
            db_get_trace,
            db_delete_trace,
            db_upsert_task,
            db_list_tasks,
            gateway::get_gateways,
            gateway::save_gateways,
            gateway::get_gateway_health,
            gateway::test_gateway,
            docker::commands::docker_create_container,
            docker::commands::docker_execute_python,
            docker::commands::docker_execute_bash,
            docker::commands::docker_dispose_container,
            docker::commands::docker_check_status,
            docker::commands::docker_dispose_all_containers,
            sidecar::browser_start_sidecar,
            sidecar::browser_stop_sidecar,
            sidecar::browser_is_sidecar_running,
            sidecar::browser_start_session,
            sidecar::browser_stop_session,
            sidecar::browser_navigate,
            sidecar::browser_screenshot,
            sidecar::browser_click,
            sidecar::browser_type,
            sidecar::browser_scroll,
            sidecar::browser_wait_for,
            sidecar::browser_execute,
            sidecar::browser_extract,
            sidecar::browser_upload_file,
            sidecar::browser_cookies,
            sidecar::browser_set_stealth,
            sidecar::browser_get_tabs,
            sidecar::browser_select,
            sidecar::browser_aria_snapshot,
            sidecar::browser_read_page,
            sidecar::browser_check_sidecar_installed,
            sidecar::browser_install_sidecar,
            sidecar::check_node_version,
            python_sidecar::nasus_is_ready,
            python_sidecar::nasus_health,
            python_sidecar::nasus_submit_task,
            python_sidecar::nasus_task_status,
            python_sidecar::nasus_cancel_task,
            python_sidecar::nasus_check_installed,
            python_sidecar::nasus_install_sidecar,
            python_sidecar::nasus_configure_llm,
            memory_set,
            memory_get,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
