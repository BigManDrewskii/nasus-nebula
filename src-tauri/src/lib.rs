use bollard::container::{
    Config, CreateContainerOptions, LogOutput, RemoveContainerOptions,
    StartContainerOptions,
};
use bollard::exec::{CreateExecOptions, StartExecResults};
use bollard::image::CreateImageOptions;
use bollard::models::HostConfig;
use bollard::Docker;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_store::StoreExt;

// ─── Global cancellation flags ────────────────────────────────────────────────

type CancelMap = Arc<Mutex<HashMap<String, bool>>>;

fn get_cancel_map(app: &AppHandle) -> CancelMap {
    app.try_state::<CancelMap>()
        .map(|s| s.inner().clone())
        .unwrap_or_else(|| Arc::new(Mutex::new(HashMap::new())))
}

fn is_cancelled(app: &AppHandle, task_id: &str) -> bool {
    get_cancel_map(app)
        .lock()
        .ok()
        .map(|m| *m.get(task_id).unwrap_or(&false))
        .unwrap_or(false)
}

fn set_cancelled(app: &AppHandle, task_id: &str, val: bool) {
    if let Ok(mut m) = get_cancel_map(app).lock() {
        m.insert(task_id.to_string(), val);
    }
}

// ─── Config ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct AppConfig {
    pub api_key: String,
    pub model: String,
    pub workspace_path: String,
    /// The base URL for the LLM API, e.g. "https://openrouter.ai/api/v1"
    /// or "http://localhost:4000/v1" for a LiteLLM proxy.
    pub api_base: String,
    /// Human-readable provider label: "openrouter" | "litellm" | "openai" | "custom"
    pub provider: String,
}

#[tauri::command]
fn get_config(app: AppHandle) -> Result<AppConfig, String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    let api_key = store
        .get("api_key")
        .and_then(|v: serde_json::Value| v.as_str().map(|s| s.to_string()))
        .unwrap_or_default();
    let model = store
        .get("model")
        .and_then(|v: serde_json::Value| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "anthropic/claude-3.7-sonnet".to_string());
    let workspace_path = store
        .get("workspace_path")
        .and_then(|v: serde_json::Value| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| {
            dirs::home_dir()
                .map(|p| p.join("nasus-workspace").to_string_lossy().to_string())
                .unwrap_or_else(|| "/tmp/nasus-workspace".to_string())
        });
    let api_base = store
        .get("api_base")
        .and_then(|v: serde_json::Value| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "https://openrouter.ai/api/v1".to_string());
    let provider = store
        .get("provider")
        .and_then(|v: serde_json::Value| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| "openrouter".to_string());
    Ok(AppConfig {
        api_key,
        model,
        workspace_path,
        api_base,
        provider,
    })
}

#[tauri::command]
fn save_config(
    app: AppHandle,
    api_key: String,
    model: String,
    workspace_path: String,
    api_base: String,
    provider: String,
) -> Result<(), String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    store.set("api_key", serde_json::Value::String(api_key));
    store.set("model", serde_json::Value::String(model));
    store.set("workspace_path", serde_json::Value::String(workspace_path));
    store.set("api_base", serde_json::Value::String(api_base));
    store.set("provider", serde_json::Value::String(provider));
    store
        .save()
        .map_err(|e: tauri_plugin_store::Error| e.to_string())?;
    Ok(())
}

/// Fetch available models from any OpenAI-compatible /models endpoint.
/// Works with OpenRouter, LiteLLM proxy, and OpenAI direct.
#[tauri::command]
async fn fetch_models(api_base: String, api_key: String) -> Result<Vec<String>, String> {
    let url = format!("{}/models", api_base.trim_end_matches('/'));
    let client = reqwest::Client::new();
    let resp = client
        .get(&url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?;

    if !resp.status().is_success() {
        return Err(format!("HTTP {}", resp.status()));
    }

    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;
    let models: Vec<String> = json["data"]
        .as_array()
        .unwrap_or(&vec![])
        .iter()
        .filter_map(|m| m["id"].as_str().map(|s| s.to_string()))
        .collect();

    Ok(models)
}

/// Check whether a filesystem path exists, is a directory, and is writable
#[tauri::command]
fn validate_path(path: String) -> bool {
    let p = std::path::Path::new(&path);
    if !p.is_dir() {
        return false;
    }
    // Check write permission by attempting to create a temp file
    let test = p.join(".nasus_write_test");
    match std::fs::File::create(&test) {
        Ok(_) => {
            let _ = std::fs::remove_file(&test);
            true
        }
        Err(_) => false,
    }
}

/// Open a native macOS folder picker dialog and return the selected path
#[tauri::command]
async fn pick_folder(app: AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    let path = app
        .dialog()
        .file()
        .set_title("Choose Workspace Folder")
        .blocking_pick_folder();
    Ok(path.map(|p| p.to_string()))
}

// ─── Agent events ─────────────────────────────────────────────────────────────

#[derive(Clone, Serialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum AgentEvent {
    Thinking {
        task_id: String,
        message_id: String,
        content: String,
    },
    ToolCall {
        task_id: String,
        message_id: String,
        call_id: String,
        tool: String,
        input: serde_json::Value,
    },
    ToolResult {
        task_id: String,
        message_id: String,
        call_id: String,
        output: String,
        is_error: bool,
    },
    StreamChunk {
        task_id: String,
        message_id: String,
        delta: String,
        done: bool,
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
    StrikeEscalation {
        task_id: String,
        message_id: String,
        tool: String,
        attempts: Vec<String>,
    },
    ContextCompressed {
        task_id: String,
        message_id: String,
        removed_count: usize,
    },
    IterationTick {
        task_id: String,
        message_id: String,
        iteration: usize,
    },
    TokenUsage {
        task_id: String,
        message_id: String,
        prompt_tokens: u64,
        completion_tokens: u64,
        total_tokens: u64,
    },
    /// Fired after the first user message is processed with a short LLM-generated title
    AutoTitle {
        task_id: String,
        title: String,
    },
    /// Fired after each agent turn — carries the assistant message + tool results
    /// so the frontend can append them to rawHistory for multi-turn context.
    RawMessages {
        task_id: String,
        messages: Vec<serde_json::Value>,
    },
}

// ─── LLM types ────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct LlmMessage {
    pub role: String,
    pub content: serde_json::Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<ToolCall>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ToolCall {
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub function: FunctionCall,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FunctionCall {
    pub name: String,
    pub arguments: String,
}

// ─── Error tracking for 3-strike protocol ─────────────────────────────────────

#[derive(Debug, Default)]
struct ErrorTracker {
    strikes: std::collections::HashMap<String, (usize, Vec<String>)>,
}

impl ErrorTracker {
    fn record_error(&mut self, tool: &str, summary: &str) -> usize {
        let entry = self.strikes.entry(tool.to_string()).or_insert((0, vec![]));
        entry.0 += 1;
        entry.1.push(summary.to_string());
        entry.0
    }

    fn reset(&mut self, tool: &str) {
        self.strikes.remove(tool);
    }

    #[allow(dead_code)]
    fn strike_count(&self, _tool: &str) -> usize {
        self.strikes.get(_tool).map(|(c, _)| *c).unwrap_or(0)
    }

    fn attempts(&self, tool: &str) -> Vec<String> {
        self.strikes
            .get(tool)
            .map(|(_, a)| a.clone())
            .unwrap_or_default()
    }
}

// ─── Tool definitions ─────────────────────────────────────────────────────────

fn tool_definitions() -> serde_json::Value {
    serde_json::json!([
        {
            "type": "function",
            "function": {
                "name": "bash",
                "description": "Execute a shell command inside the secure sandbox. Working directory is /workspace. Use for running code, installing packages, file operations, searching, etc.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "command": {
                            "type": "string",
                            "description": "Bash command to run. Avoid interactive commands. Use non-interactive flags."
                        },
                        "timeout_secs": {
                            "type": "integer",
                            "description": "Max seconds to wait (default 30, max 300).",
                            "default": 30
                        }
                    },
                    "required": ["command"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "read_file",
                "description": "Read the contents of a file from /workspace. Use this to check your memory files (task_plan.md, findings.md, progress.md) or any output files.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path relative to /workspace or absolute path."
                        }
                    },
                    "required": ["path"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "write_file",
                "description": "Write content to a file in /workspace. Use to update task_plan.md, findings.md, progress.md, or create output artifacts.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Path relative to /workspace or absolute."
                        },
                        "content": {
                            "type": "string",
                            "description": "Full file content to write."
                        }
                    },
                    "required": ["path", "content"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "list_files",
                "description": "List files and directories in a path within the sandbox workspace.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "path": {
                            "type": "string",
                            "description": "Directory path to list (default: /workspace).",
                            "default": "/workspace"
                        },
                        "recursive": {
                            "type": "boolean",
                            "description": "Whether to list recursively (default false).",
                            "default": false
                        }
                    }
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "http_fetch",
                "description": "Make an HTTP GET or POST request. Use to fetch web pages, APIs, or download resources. Response is capped at 6KB.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "url": { "type": "string" },
                        "method": {
                            "type": "string",
                            "enum": ["GET", "POST"],
                            "default": "GET"
                        },
                        "body": { "type": "string", "description": "Request body for POST" },
                        "headers": { "type": "object", "description": "Headers map" }
                    },
                    "required": ["url"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "search_web",
                "description": "Search the web for information. Returns a list of results with titles, URLs, and snippets. Use before http_fetch when you need to discover URLs.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query string."
                        },
                        "num_results": {
                            "type": "integer",
                            "description": "Number of results to return (default 5, max 10).",
                            "default": 5
                        }
                    },
                    "required": ["query"]
                }
            }
        }
    ])
}

fn system_prompt() -> String {
    r#"You are Nasus, an autonomous AI agent with access to a secure, isolated sandbox computer.
Your job: take the user's goal and independently plan and execute a multi-step solution until fully complete.

═══════════════════════════════════════════════════════
MEMORY PROTOCOL (MANDATORY - follow exactly)
═══════════════════════════════════════════════════════

You have THREE persistent memory files in /workspace that survive context resets.
These are your external brain. Use them religiously.

**1. task_plan.md** — Your master plan
   Structure:
   ```
   # Goal
   <one-sentence description of what you are achieving>

   # Phases
   - [ ] Phase 1: <description>
   - [ ] Phase 2: <description>
   ...

   # Current Phase
   Phase N: <what you are doing right now>

   # Error Log
   | Error | Tool | Attempt # | What I tried | Outcome |
   |-------|------|-----------|--------------|---------|
   ```
   - Write this file FIRST before any other action
   - Update phase checkboxes as you complete them: [ ] → [x]
   - Log every error to the Error Log table immediately

**2. findings.md** — Research and discoveries
   Structure:
   ```
   # Findings
   ## <Topic>
   - Key fact 1
   - URL: <url> → <what it contains>
   ...
   ```
   - Save findings every 2 search/browse/read operations (the "2-Action Rule")
   - Never lose research by leaving it only in the context window

**3. progress.md** — Chronological action log
   Structure:
   ```
   # Progress Log
   | Time | Tool | Action | Result |
   |------|------|--------|--------|
   ```
   - Append a row AFTER EVERY tool call
   - This is your recovery log — if the context resets, you read this to know where you are

═══════════════════════════════════════════════════════
SESSION RECOVERY (REBOOT CHECK)
═══════════════════════════════════════════════════════

If you ever find yourself unsure of where you are in the task, immediately answer:
1. What is the overall goal? (read task_plan.md)
2. What phases are done vs. pending?
3. What was the last action taken? (read progress.md)
4. What key information have I gathered? (read findings.md)
5. What is the immediate next step?

Then continue from exactly where you left off.

═══════════════════════════════════════════════════════
3-STRIKE ERROR PROTOCOL
═══════════════════════════════════════════════════════

When a tool call fails or produces wrong output:
- **Strike 1**: Diagnose the specific error. Apply a targeted fix. Log to task_plan.md error table.
- **Strike 2**: The targeted fix didn't work. Try a COMPLETELY DIFFERENT approach or tool.
- **Strike 3**: Fundamental rethink. Search for solutions online. Reconsider the entire method.
- **Failure (3 strikes exhausted)**: STOP. Explain to the user exactly what you tried and why it failed.
  Do NOT keep retrying the same thing.

═══════════════════════════════════════════════════════
2-ACTION SAVE RULE
═══════════════════════════════════════════════════════

After every 2 calls to search_web, http_fetch, read_file, or bash (when reading output):
→ IMMEDIATELY write key findings to findings.md before continuing.

This prevents losing critical information if the context window fills.

═══════════════════════════════════════════════════════
TOOL STRATEGY
═══════════════════════════════════════════════════════

- Use `bash` for everything that runs in the sandbox (code, installs, file ops, curl, grep, etc.)
- Use `search_web` to discover URLs/information before fetching
- Use `http_fetch` for external APIs or pages that don't need a browser
- Use `list_files` to orient yourself in /workspace when needed
- Use `write_file` for creating/updating files (never use bash echo for multiline content)
- Use `read_file` to check your memory files and verify outputs

═══════════════════════════════════════════════════════
SANDBOX ENVIRONMENT
═══════════════════════════════════════════════════════

- Ubuntu 22.04 with Python 3, Node.js, git, curl, wget pre-installed
- Working directory: /workspace (your files persist here across turns)
- Full internet access
- No sudo password required

═══════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════

1. NEVER fabricate tool outputs. Always call the tool.
2. Write task_plan.md FIRST on every new task.
3. Update progress.md AFTER every tool call.
4. Apply the 2-Action Save Rule without exception.
5. Follow the 3-Strike protocol on errors — never exceed 3 attempts on the same failure.
6. When writing code, always test it before reporting success.
7. When done, summarize: what was accomplished, what files are in /workspace, and any caveats."#
        .to_string()
}

// ─── Memory file templates ────────────────────────────────────────────────────

fn task_plan_template(goal: &str) -> String {
    format!(
        "# Goal\n{goal}\n\n# Phases\n- [ ] Phase 1: Investigate and plan approach\n- [ ] Phase 2: Execute\n- [ ] Phase 3: Verify and summarize\n\n# Current Phase\nPhase 1: Investigate and plan approach\n\n# Error Log\n| Error | Tool | Attempt # | What I tried | Outcome |\n|-------|------|-----------|--------------|---------|"
    )
}

fn findings_template() -> &'static str {
    "# Findings\n\n_No findings recorded yet._"
}

fn progress_template() -> String {
    let now = chrono::Utc::now().format("%Y-%m-%d %H:%M UTC").to_string();
    format!(
        "# Progress Log\n\n| Time | Tool | Action | Result |\n|------|------|--------|--------|\n| {now} | — | Task started | Initializing memory files |"
    )
}

// ─── Docker Sandbox ───────────────────────────────────────────────────────────

async fn get_or_connect_docker() -> Result<Docker, String> {
    Docker::connect_with_local_defaults().map_err(|e| format!("Docker unavailable: {e}"))
}

const SANDBOX_IMAGE: &str = "ubuntu:22.04";

async fn ensure_image(docker: &Docker, app: &AppHandle, task_id: &str, message_id: &str) -> Result<(), String> {
    // Check if the image is already present locally
    if docker.inspect_image(SANDBOX_IMAGE).await.is_ok() {
        return Ok(());
    }

    // Image not found locally — pull it, streaming progress
    let _ = app.emit(
        "agent-event",
        AgentEvent::Thinking {
            task_id: task_id.to_string(),
            message_id: message_id.to_string(),
            content: format!("Pulling Docker image {}… (first-time setup, may take a minute)", SANDBOX_IMAGE),
        },
    );

    let mut stream = docker.create_image(
        Some(CreateImageOptions {
            from_image: SANDBOX_IMAGE,
            ..Default::default()
        }),
        None,
        None,
    );

    let mut last_status = String::new();
    while let Some(event) = stream.next().await {
        match event {
            Ok(info) => {
                let status = info.status.unwrap_or_default();
                let progress = info.progress.unwrap_or_default();
                let combined = if progress.is_empty() {
                    status.clone()
                } else {
                    format!("{status}: {progress}")
                };
                // Only emit when status changes to avoid flooding the UI
                if !combined.is_empty() && combined != last_status {
                    last_status = combined.clone();
                    let _ = app.emit(
                        "agent-event",
                        AgentEvent::Thinking {
                            task_id: task_id.to_string(),
                            message_id: message_id.to_string(),
                            content: format!("[Docker pull] {combined}"),
                        },
                    );
                }
            }
            Err(e) => return Err(format!("Image pull failed: {e}")),
        }
    }

    let _ = app.emit(
        "agent-event",
        AgentEvent::Thinking {
            task_id: task_id.to_string(),
            message_id: message_id.to_string(),
            content: format!("Image {} ready.", SANDBOX_IMAGE),
        },
    );

    Ok(())
}

async fn ensure_sandbox(
    docker: &Docker,
    app: &AppHandle,
    task_id: &str,
    message_id: &str,
    workspace_path: &str,
) -> Result<String, String> {
    let name = format!("nasus-sandbox-{}", &task_id[..task_id.len().min(8)]);

    if let Ok(info) = docker.inspect_container(&name, None).await {
        if info.state.and_then(|s| s.running).unwrap_or(false) {
            return Ok(name);
        }
        let _ = docker
            .remove_container(
                &name,
                Some(RemoveContainerOptions {
                    force: true,
                    ..Default::default()
                }),
            )
            .await;
    }

    // Pull the image if not present locally before attempting create_container
    ensure_image(docker, app, task_id, message_id).await?;

    tokio::fs::create_dir_all(workspace_path)
        .await
        .map_err(|e| e.to_string())?;

    let host_cfg = HostConfig {
        binds: Some(vec![format!("{}:/workspace", workspace_path)]),
        memory: Some(2 * 1024 * 1024 * 1024),
        nano_cpus: Some(2_000_000_000),
        ..Default::default()
    };

    let config = Config {
        image: Some(SANDBOX_IMAGE),
        cmd: Some(vec!["sleep", "infinity"]),
        working_dir: Some("/workspace"),
        host_config: Some(host_cfg),
        ..Default::default()
    };

    docker
        .create_container(
            Some(CreateContainerOptions {
                name: &name,
                platform: None,
            }),
            config,
        )
        .await
        .map_err(|e| format!("Create container: {e}"))?;

    docker
        .start_container(&name, None::<StartContainerOptions<String>>)
        .await
        .map_err(|e| format!("Start container: {e}"))?;

    let docker_bg = docker.clone();
    let name_bg = name.clone();
    tokio::spawn(async move {
        let _ = exec_in_sandbox(
            &docker_bg,
            &name_bg,
            "which curl wget git python3 node npm > /dev/null 2>&1 || \
             (apt-get update -qq && apt-get install -y -qq curl wget git python3 python3-pip nodejs npm 2>&1 | tail -3)",
            120,
        )
        .await;
    });

    Ok(name)
}

async fn exec_in_sandbox(
    docker: &Docker,
    container: &str,
    command: &str,
    timeout_secs: u64,
) -> Result<String, String> {
    let exec = docker
        .create_exec(
            container,
            CreateExecOptions {
                attach_stdout: Some(true),
                attach_stderr: Some(true),
                cmd: Some(vec!["bash", "-c", command]),
                ..Default::default()
            },
        )
        .await
        .map_err(|e| e.to_string())?;

    let result = docker
        .start_exec(&exec.id, None)
        .await
        .map_err(|e| e.to_string())?;

    let mut output = String::new();

    if let StartExecResults::Attached {
        output: mut stream, ..
    } = result
    {
        let timeout = tokio::time::Duration::from_secs(timeout_secs);
        let _ = tokio::time::timeout(timeout, async {
            while let Some(chunk) = stream.next().await {
                match chunk {
                    Ok(LogOutput::StdOut { message }) => {
                        output.push_str(&String::from_utf8_lossy(&message));
                    }
                    Ok(LogOutput::StdErr { message }) => {
                        output.push_str(&String::from_utf8_lossy(&message));
                    }
                    _ => {}
                }
            }
        })
        .await;
    }

    if output.len() > 8000 {
        let tail = &output[output.len() - 7500..];
        output = format!("[...truncated to last 7500 chars...]\n{}", tail);
    }

    Ok(output)
}

// ─── Tool execution ───────────────────────────────────────────────────────────

async fn execute_tool(
    docker: Option<&Docker>,
    container: Option<&str>,
    tool_name: &str,
    args: &serde_json::Value,
    http_client: &reqwest::Client,
) -> (String, bool) {
    macro_rules! sandbox {
        ($cmd:expr, $timeout:expr) => {
            match (docker, container) {
                (Some(d), Some(c)) => exec_in_sandbox(d, c, $cmd, $timeout).await,
                _ => Err("Sandbox unavailable".to_string()),
            }
        };
    }

    match tool_name {
        "bash" => {
            let cmd = args["command"].as_str().unwrap_or("echo 'no command'");
            let timeout = args["timeout_secs"].as_u64().unwrap_or(30).min(300);
            match sandbox!(cmd, timeout) {
                Ok(out) => (
                    if out.trim().is_empty() {
                        "(no output)".to_string()
                    } else {
                        out
                    },
                    false,
                ),
                Err(e) => (format!("exec error: {e}"), true),
            }
        }

        "read_file" => {
            let path = args["path"].as_str().unwrap_or("/workspace");
            let cmd = format!("cat '{path}' 2>&1");
            match sandbox!(&cmd, 10) {
                Ok(out) => (out, false),
                Err(e) => (format!("read error: {e}"), true),
            }
        }

        "write_file" => {
            let path = args["path"].as_str().unwrap_or("/workspace/output.txt");
            let content = args["content"].as_str().unwrap_or("");
            let encoded = base64_encode(content);
            let cmd = format!(
                "echo '{encoded}' | base64 -d > /tmp/_nasus_write_tmp && \
                 mkdir -p \"$(dirname '{path}')\" && \
                 mv /tmp/_nasus_write_tmp '{path}' && \
                 echo 'written: {path}'"
            );
            match sandbox!(&cmd, 15) {
                Ok(out) => (out, false),
                Err(e) => (format!("write error: {e}"), true),
            }
        }

        "list_files" => {
            let path = args["path"].as_str().unwrap_or("/workspace");
            let recursive = args["recursive"].as_bool().unwrap_or(false);
            let cmd = if recursive {
                format!("find '{path}' -type f -o -type d 2>&1 | head -100")
            } else {
                format!("ls -la '{path}' 2>&1")
            };
            match sandbox!(&cmd, 10) {
                Ok(out) => (out, false),
                Err(e) => (format!("list error: {e}"), true),
            }
        }

        "http_fetch" => {
            let url = match args["url"].as_str() {
                Some(u) => u.to_string(),
                None => return ("Missing url".to_string(), true),
            };
            let method = args["method"].as_str().unwrap_or("GET");
            let mut req = if method == "POST" {
                http_client.post(&url)
            } else {
                http_client.get(&url)
            };
            req = req
                .header("User-Agent", "Mozilla/5.0 (compatible; Nasus/1.0)")
                .timeout(std::time::Duration::from_secs(20));
            if let Some(hdrs) = args["headers"].as_object() {
                for (k, v) in hdrs {
                    if let Some(v) = v.as_str() {
                        req = req.header(k, v);
                    }
                }
            }
            if let Some(body) = args["body"].as_str() {
                req = req.body(body.to_string());
            }
            match req.send().await {
                Ok(resp) => {
                    let status = resp.status().as_u16();
                    let text = resp.text().await.unwrap_or_default();
                    let preview = if text.len() > 6000 { &text[..6000] } else { &text };
                    (format!("HTTP {status}\n{preview}"), false)
                }
                Err(e) => (format!("fetch error: {e}"), true),
            }
        }

        "search_web" => {
            let query = match args["query"].as_str() {
                Some(q) => q.to_string(),
                None => return ("Missing query".to_string(), true),
            };
            let num = args["num_results"].as_u64().unwrap_or(5).min(10);
            let encoded = urlencoding_simple(&query);
            let cmd = format!(
                r#"curl -sL --max-time 15 -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64)" \
                "https://html.duckduckgo.com/html/?q={encoded}" | \
                python3 -c "
import sys, re
html = sys.stdin.read()
results = re.findall(r'class=\"result__title\".*?href=\"([^\"]+)\".*?>(.*?)</a>.*?class=\"result__snippet\">(.*?)</span>', html, re.DOTALL)
if not results:
    titles = re.findall(r'<a class=\"result__a\" href=\"([^\"]+)\">(.*?)</a>', html, re.DOTALL)
    snippets = re.findall(r'<a class=\"result__snippet\".*?>(.*?)</a>', html, re.DOTALL)
    results = [(t[0], t[1], snippets[i] if i < len(snippets) else '') for i, t in enumerate(titles)]
clean = lambda s: re.sub(r'<[^>]+>', '', s).strip()
count = 0
for url, title, snippet in results:
    if count >= {num}: break
    t = clean(title)
    s = clean(snippet)
    if t:
        print(f'[{{count+1}}] {{t}}')
        print(f'    URL: {{url}}')
        if s: print(f'    {{s}}')
        print()
        count += 1
if count == 0:
    print('No results found. Try a different query or use http_fetch with a specific URL.')
""#,
                encoded = encoded,
                num = num,
            );

            if let Ok(out) = sandbox!(&cmd, 20) {
                (if out.trim().is_empty() { "No results found.".to_string() } else { out }, false)
            } else {
                let url = format!("https://api.duckduckgo.com/?q={encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1");
                match http_client
                    .get(&url)
                    .header("User-Agent", "Mozilla/5.0 (compatible; Nasus/1.0)")
                    .timeout(std::time::Duration::from_secs(10))
                    .send()
                    .await
                {
                    Ok(resp) => {
                        let text = resp.text().await.unwrap_or_default();
                        (format!("[Sandbox unavailable — limited results]\n{}", &text[..text.len().min(1000)]), false)
                    }
                    Err(e) => (format!("search error: {e}"), true),
                }
            }
        }

        unknown => (format!("Unknown tool: {unknown}"), true),
    }
}

fn urlencoding_simple(s: &str) -> String {
    s.chars()
        .map(|c| match c {
            ' ' => "+".to_string(),
            '&' => "%26".to_string(),
            '#' => "%23".to_string(),
            '%' => "%25".to_string(),
            '"' => "%22".to_string(),
            '<' => "%3C".to_string(),
            '>' => "%3E".to_string(),
            c => c.to_string(),
        })
        .collect()
}

fn base64_encode(s: &str) -> String {
    use std::fmt::Write as FmtWrite;
    let bytes = s.as_bytes();
    const TABLE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((bytes.len() + 2) / 3 * 4);
    for chunk in bytes.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
        let _ = write!(out, "{}", TABLE[(b0 >> 2) & 0x3F] as char);
        let _ = write!(out, "{}", TABLE[((b0 << 4) | (b1 >> 4)) & 0x3F] as char);
        let _ = write!(out, "{}", if chunk.len() > 1 { TABLE[((b1 << 2) | (b2 >> 6)) & 0x3F] as char } else { '=' });
        let _ = write!(out, "{}", if chunk.len() > 2 { TABLE[b2 & 0x3F] as char } else { '=' });
    }
    out
}

// ─── LLM call (real SSE streaming) ───────────────────────────────────────────
//
// Streams the LLM response token-by-token via Server-Sent Events.
// Emits StreamChunk events in real-time and returns the fully assembled
// response JSON once the stream is complete (for tool call extraction).

async fn llm_stream(
    client: &reqwest::Client,
    app: &AppHandle,
    api_key: &str,
    api_base: &str,
    provider: &str,
    model: &str,
    messages: &[LlmMessage],
    tools: &serde_json::Value,
    task_id: &str,
    message_id: &str,
) -> Result<serde_json::Value, String> {
    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto",
        "stream": true,
        "stream_options": { "include_usage": true },
    });

    let url = format!("{}/chat/completions", api_base.trim_end_matches('/'));
    let mut req = client
        .post(&url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(180));

    // OpenRouter-specific headers — omit for other providers
    if provider == "openrouter" {
        req = req
            .header("HTTP-Referer", "https://nasus.app")
            .header("X-Title", "Nasus");
    }

    let resp = req
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    if !status.is_success() {
        // Non-streaming error — read body and return
        let err_body: serde_json::Value = resp.json().await.unwrap_or_default();
        return Err(format!(
            "LLM error {status}: {}",
            err_body["error"]["message"]
                .as_str()
                .unwrap_or(&err_body.to_string())
        ));
    }

    // Accumulate streaming state
    let mut full_content = String::new();
    let mut finish_reason = String::new();
    // tool_calls indexed by their position in the array
    let mut tool_call_map: std::collections::HashMap<usize, serde_json::Value> =
        std::collections::HashMap::new();
    let mut usage_obj: Option<serde_json::Value> = None;
    // Whether we have emitted at least one non-empty content chunk (= final answer mode)
    let mut is_final_answer = false;

    let mut stream = resp.bytes_stream();
    let mut buf = String::new();

    while let Some(chunk) = stream.next().await {
        let bytes = chunk.map_err(|e| e.to_string())?;
        buf.push_str(&String::from_utf8_lossy(&bytes));

        // Process all complete SSE lines in the buffer
        while let Some(nl) = buf.find('\n') {
            let line = buf[..nl].trim().to_string();
            buf = buf[nl + 1..].to_string();

            if line.is_empty() || line == "data: [DONE]" {
                continue;
            }

            let data = if let Some(d) = line.strip_prefix("data: ") {
                d
            } else {
                continue;
            };

            let chunk_json: serde_json::Value = match serde_json::from_str(data) {
                Ok(v) => v,
                Err(_) => continue,
            };

            // Capture usage if present (sent in the final chunk)
            if let Some(usage) = chunk_json.get("usage") {
                usage_obj = Some(usage.clone());
            }

            let choice = &chunk_json["choices"][0];
            let delta = &choice["delta"];

            if let Some(fr) = choice["finish_reason"].as_str() {
                if !fr.is_empty() {
                    finish_reason = fr.to_string();
                }
            }

            // Accumulate content delta → emit StreamChunk
            if let Some(text) = delta["content"].as_str() {
                if !text.is_empty() {
                    is_final_answer = true;
                    full_content.push_str(text);
                    let _ = app.emit(
                        "agent-event",
                        AgentEvent::StreamChunk {
                            task_id: task_id.to_string(),
                            message_id: message_id.to_string(),
                            delta: text.to_string(),
                            done: false,
                        },
                    );
                }
            }

            // Accumulate tool_call deltas
            if let Some(tcs) = delta["tool_calls"].as_array() {
                for tc_delta in tcs {
                    let idx = tc_delta["index"].as_u64().unwrap_or(0) as usize;
                    let entry = tool_call_map.entry(idx).or_insert_with(|| {
                        serde_json::json!({
                            "id": "",
                            "type": "function",
                            "function": { "name": "", "arguments": "" }
                        })
                    });

                    if let Some(id) = tc_delta["id"].as_str() {
                        entry["id"] = serde_json::Value::String(id.to_string());
                    }
                    if let Some(name) = tc_delta["function"]["name"].as_str() {
                        let existing = entry["function"]["name"].as_str().unwrap_or("").to_string();
                        entry["function"]["name"] =
                            serde_json::Value::String(format!("{existing}{name}"));
                    }
                    if let Some(args) = tc_delta["function"]["arguments"].as_str() {
                        let existing = entry["function"]["arguments"]
                            .as_str()
                            .unwrap_or("")
                            .to_string();
                        entry["function"]["arguments"] =
                            serde_json::Value::String(format!("{existing}{args}"));
                    }
                }
            }
        }
    }

    // Emit usage if we got it
    if let Some(usage) = &usage_obj {
        let _ = app.emit(
            "agent-event",
            AgentEvent::TokenUsage {
                task_id: task_id.to_string(),
                message_id: message_id.to_string(),
                prompt_tokens: usage["prompt_tokens"].as_u64().unwrap_or(0),
                completion_tokens: usage["completion_tokens"].as_u64().unwrap_or(0),
                total_tokens: usage["total_tokens"].as_u64().unwrap_or(0),
            },
        );
    }

    // If this was a final answer, close the stream
    if is_final_answer {
        let _ = app.emit(
            "agent-event",
            AgentEvent::StreamChunk {
                task_id: task_id.to_string(),
                message_id: message_id.to_string(),
                delta: String::new(),
                done: true,
            },
        );
    }

    // Reconstruct a response-shaped JSON that the agent loop can process identically
    let mut tool_calls_arr: Vec<serde_json::Value> = tool_call_map
        .into_iter()
        .collect::<std::collections::BTreeMap<_, _>>()
        .into_values()
        .collect();

    // Sort is implicit from BTreeMap — but filter out any empty-id entries
    tool_calls_arr.retain(|tc| !tc["id"].as_str().unwrap_or("").is_empty());

    let reconstructed = serde_json::json!({
        "choices": [{
            "finish_reason": finish_reason,
            "message": {
                "role": "assistant",
                "content": if full_content.is_empty() { serde_json::Value::Null } else { serde_json::Value::String(full_content) },
                "tool_calls": if tool_calls_arr.is_empty() { serde_json::Value::Null } else { serde_json::Value::Array(tool_calls_arr) },
            }
        }],
        "usage": usage_obj.unwrap_or(serde_json::Value::Null),
    });

    Ok(reconstructed)
}

// ─── Context compression ──────────────────────────────────────────────────────
//
// Threshold lowered to 40 messages (was 80) to avoid hitting context limits.

fn compress_context(
    messages: &mut Vec<LlmMessage>,
    task_id: &str,
    message_id: &str,
    app: &AppHandle,
) -> usize {
    let tool_result_indices: Vec<usize> = messages
        .iter()
        .enumerate()
        .filter_map(|(i, m)| if m.role == "tool" { Some(i) } else { None })
        .collect();

    if tool_result_indices.len() <= 6 {
        return 0;
    }

    let middle_results: std::collections::HashSet<usize> =
        tool_result_indices[2..tool_result_indices.len() - 4]
            .iter()
            .copied()
            .collect();

    let mut all_remove = middle_results.clone();
    let mut i = 0;
    while i < messages.len() {
        if messages[i].role == "assistant" && messages[i].tool_calls.is_some() {
            let mut j = i + 1;
            let mut result_indices = vec![];
            while j < messages.len() && messages[j].role == "tool" {
                result_indices.push(j);
                j += 1;
            }
            if !result_indices.is_empty()
                && result_indices.iter().all(|idx| middle_results.contains(idx))
            {
                all_remove.insert(i);
            }
        }
        i += 1;
    }

    let removed = all_remove.len();
    let mut new_messages: Vec<LlmMessage> = messages
        .iter()
        .enumerate()
        .filter(|(i, _)| !all_remove.contains(i))
        .map(|(_, m)| m.clone())
        .collect();

    if new_messages.len() > 1 {
        new_messages.insert(
            1,
            LlmMessage {
                role: "system".to_string(),
                content: serde_json::Value::String(format!(
                    "[Context compressed: {removed} old tool call/result pairs removed to save space. Your memory files in /workspace still contain full history.]"
                )),
                tool_call_id: None,
                tool_calls: None,
            },
        );
    }

    *messages = new_messages;

    let _ = app.emit(
        "agent-event",
        AgentEvent::ContextCompressed {
            task_id: task_id.to_string(),
            message_id: message_id.to_string(),
            removed_count: removed,
        },
    );

    removed
}

// ─── Initialize memory files in sandbox ───────────────────────────────────────

async fn init_memory_files(
    docker: &Docker,
    container: &str,
    task_id: &str,
    first_user_message: &str,
) {
    let goal = first_user_message.lines().next().unwrap_or(first_user_message);
    let goal = if goal.len() > 200 { &goal[..200] } else { goal };

    let plan = task_plan_template(goal);
    let findings = findings_template();
    let progress = progress_template();

    let write_b64 = |path: &str, content: &str| -> String {
        let enc = base64_encode(content);
        format!("echo '{enc}' | base64 -d > '{path}'")
    };

    let cmd = format!(
        "mkdir -p /workspace/.nasus && \
         echo '{task_id}' > /workspace/.nasus/task_id && \
         {plan_cmd} && \
         {findings_cmd} && \
         {progress_cmd} && \
         echo 'Memory files initialized'",
        task_id = task_id,
        plan_cmd = write_b64("/workspace/task_plan.md", &plan),
        findings_cmd = write_b64("/workspace/findings.md", findings),
        progress_cmd = write_b64("/workspace/progress.md", &progress),
    );

    let _ = exec_in_sandbox(docker, container, &cmd, 15).await;
}

// ─── Auto-title: generate a short task title from first user message ──────────
//
// Fires a tiny, cheap LLM call (max_tokens=10) in the background and emits
// AutoTitle so the frontend can update the sidebar without blocking the agent.

async fn auto_title_task(
    client: &reqwest::Client,
    api_key: &str,
    api_base: &str,
    provider: &str,
    model: &str,
    user_message: &str,
    task_id: &str,
    app: &AppHandle,
) {
    let prompt = format!(
        "Summarise the following task in 4-6 words as a short title. Reply with ONLY the title, no punctuation:\n\n{user_message}"
    );

    // Use a cheap/fast model for titling — on OpenRouter use claude-3-haiku;
    // on all other providers (LiteLLM, OpenAI, custom) use whatever model the
    // user has configured, since we can't assume any specific model is available.
    let title_model = if provider == "openrouter" {
        "anthropic/claude-3-haiku".to_string()
    } else {
        model.to_string()
    };

    let body = serde_json::json!({
        "model": title_model,
        "messages": [{ "role": "user", "content": prompt }],
        "max_tokens": 20,
    });

    let url = format!("{}/chat/completions", api_base.trim_end_matches('/'));
    let mut req = client
        .post(&url)
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .timeout(std::time::Duration::from_secs(15));

    if provider == "openrouter" {
        req = req
            .header("HTTP-Referer", "https://nasus.app")
            .header("X-Title", "Nasus");
    }

    let result = req.json(&body).send().await;

    if let Ok(resp) = result {
        if let Ok(json) = resp.json::<serde_json::Value>().await {
            if let Some(title) = json["choices"][0]["message"]["content"].as_str() {
                let clean = title.trim().trim_matches('"').trim_matches('\'').to_string();
                if !clean.is_empty() {
                    let _ = app.emit(
                        "agent-event",
                        AgentEvent::AutoTitle {
                            task_id: task_id.to_string(),
                            title: clean,
                        },
                    );
                }
            }
        }
    }
}

// ─── Read memory files command ────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct MemoryFiles {
    pub task_plan: String,
    pub findings: String,
    pub progress: String,
    pub task_id: Option<String>,
}

#[tauri::command]
async fn read_memory_files(
    _task_id: String,
    workspace_path: String,
) -> Result<MemoryFiles, String> {
    let base = std::path::PathBuf::from(&workspace_path);

    let read = |name: &str| -> String {
        std::fs::read_to_string(base.join(name)).unwrap_or_else(|_| String::new())
    };

    let stored_task_id =
        std::fs::read_to_string(base.join(".nasus").join("task_id")).ok();

    Ok(MemoryFiles {
        task_plan: read("task_plan.md"),
        findings: read("findings.md"),
        progress: read("progress.md"),
        task_id: stored_task_id,
    })
}

// ─── Stop agent ───────────────────────────────────────────────────────────────

#[tauri::command]
async fn stop_agent(app: AppHandle, task_id: String) -> Result<(), String> {
    set_cancelled(&app, &task_id, true);
    Ok(())
}

// ─── Main agent loop ──────────────────────────────────────────────────────────

#[tauri::command]
async fn run_agent(
    app: AppHandle,
    task_id: String,
    message_id: String,
    user_messages: Vec<serde_json::Value>,
    api_key: String,
    model: String,
    workspace_path: String,
    api_base: Option<String>,
    provider: Option<String>,
) -> Result<(), String> {
    let effective_model = if model.is_empty() {
        "anthropic/claude-3.7-sonnet".to_string()
    } else {
        model.clone()
    };

    let effective_api_base = api_base
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "https://openrouter.ai/api/v1".to_string());
    let effective_provider = provider
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "openrouter".to_string());

    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .unwrap_or_default();

    let tools = tool_definitions();

    // ── Auto-title on first message ────────────────────────────────────────────
    let is_first_message = user_messages.len() == 1;
    if is_first_message {
        let first_content = user_messages
            .first()
            .and_then(|m| m["content"].as_str())
            .unwrap_or("")
            .to_string();

        if !first_content.is_empty() {
            let http_clone = http.clone();
            let key_clone = api_key.clone();
            let base_clone = effective_api_base.clone();
            let provider_clone = effective_provider.clone();
            let model_clone = effective_model.clone();
            let tid_clone = task_id.clone();
            let app_clone = app.clone();
            tokio::spawn(async move {
                auto_title_task(&http_clone, &key_clone, &base_clone, &provider_clone, &model_clone, &first_content, &tid_clone, &app_clone).await;
            });
        }
    }

    // ── Connect to Docker & start sandbox ──────────────────────────────────────
    let docker_result = get_or_connect_docker().await;
    let (docker_opt, container_opt) = match &docker_result {
        Ok(d) => {
            match ensure_sandbox(d, &app, &task_id, &message_id, &workspace_path).await {
                Ok(name) => {
                    let _ = app.emit(
                        "agent-event",
                        AgentEvent::Thinking {
                            task_id: task_id.clone(),
                            message_id: message_id.clone(),
                            content: format!("Sandbox ready: {name}"),
                        },
                    );
                    (Some(d.clone()), Some(name))
                }
                Err(e) => {
                    let _ = app.emit(
                        "agent-event",
                        AgentEvent::Thinking {
                            task_id: task_id.clone(),
                            message_id: message_id.clone(),
                            content: format!("Sandbox failed: {e}. Running in limited mode."),
                        },
                    );
                    (Some(d.clone()), None)
                }
            }
        }
        Err(e) => {
            let _ = app.emit(
                "agent-event",
                AgentEvent::Thinking {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                    content: format!(
                        "Docker not available ({e}). Tool calls will be simulated."
                    ),
                },
            );
            (None, None)
        }
    };

    // ── Initialize memory files ────────────────────────────────────────────────
    if is_first_message {
        if let (Some(docker), Some(container)) = (&docker_opt, &container_opt) {
            let first_msg = user_messages
                .first()
                .and_then(|m| m["content"].as_str())
                .unwrap_or("Task");

            let _ = app.emit(
                "agent-event",
                AgentEvent::Thinking {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                    content: "Initializing memory files (task_plan.md, findings.md, progress.md)…".to_string(),
                },
            );

            init_memory_files(docker, container, &task_id, first_msg).await;
        }
    }

    // ── Build initial message history ──────────────────────────────────────────
    let mut messages: Vec<LlmMessage> = vec![LlmMessage {
        role: "system".to_string(),
        content: serde_json::Value::String(system_prompt()),
        tool_call_id: None,
        tool_calls: None,
    }];

    for m in &user_messages {
        // Deserialize fully so tool_call_id / tool_calls are preserved for multi-turn context
        let msg: LlmMessage = serde_json::from_value(m.clone()).unwrap_or_else(|_| LlmMessage {
            role: m["role"].as_str().unwrap_or("user").to_string(),
            content: m["content"].clone(),
            tool_call_id: None,
            tool_calls: None,
        });
        messages.push(msg);
    }

    // ── Agent state ────────────────────────────────────────────────────────────
    let mut error_tracker = ErrorTracker::default();
    let mut search_browse_count: usize = 0;

    const MAX_ITERATIONS: usize = 30;
    // Compression threshold lowered from 80 → 40 to avoid context limit hits
    const COMPRESS_THRESHOLD: usize = 40;

    set_cancelled(&app, &task_id, false);

    for iteration in 0..MAX_ITERATIONS {
        if is_cancelled(&app, &task_id) {
            let _ = app.emit(
                "agent-event",
                AgentEvent::Done {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                },
            );
            return Ok(());
        }

        let _ = app.emit(
            "agent-event",
            AgentEvent::IterationTick {
                task_id: task_id.clone(),
                message_id: message_id.clone(),
                iteration: iteration + 1,
            },
        );

        if messages.len() > COMPRESS_THRESHOLD {
            compress_context(&mut messages, &task_id, &message_id, &app);
        }

        // Emit reasoning if model supports extended thinking
        // (handled inside llm_stream via delta["reasoning"])

        let response = match llm_stream(
            &http,
            &app,
            &api_key,
            &effective_api_base,
            &effective_provider,
            &effective_model,
            &messages,
            &tools,
            &task_id,
            &message_id,
        )
        .await
        {
            Ok(r) => r,
            Err(e) => {
                let _ = app.emit(
                    "agent-event",
                    AgentEvent::Error {
                        task_id: task_id.clone(),
                        message_id: message_id.clone(),
                        error: e.clone(),
                    },
                );
                return Err(e);
            }
        };

        let choice = &response["choices"][0];
        let finish_reason = choice["finish_reason"].as_str().unwrap_or("");
        let msg = &choice["message"];

        // Token usage is now emitted inside llm_stream

        let tool_calls = msg["tool_calls"].as_array().cloned();
        let no_tools = tool_calls.is_none()
            || tool_calls.as_ref().map(|v| v.is_empty()).unwrap_or(true);

        if finish_reason == "stop" || no_tools {
            // Emit the assistant's final message to rawHistory so multi-turn works
            if let Some(content) = msg["content"].as_str() {
                if !content.is_empty() {
                    let _ = app.emit(
                        "agent-event",
                        AgentEvent::RawMessages {
                            task_id: task_id.clone(),
                            messages: vec![serde_json::json!({
                                "role": "assistant",
                                "content": content
                            })],
                        },
                    );
                }
            }
            // Final answer was streamed live — just emit Done
            let _ = app.emit(
                "agent-event",
                AgentEvent::Done {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                },
            );
            return Ok(());
        }

        // ── Tool calls ─────────────────────────────────────────────────────────
        let calls = tool_calls.unwrap();

        messages.push(LlmMessage {
            role: "assistant".to_string(),
            content: msg["content"].clone(),
            tool_call_id: None,
            tool_calls: Some(
                calls
                    .iter()
                    .filter_map(|tc| serde_json::from_value(tc.clone()).ok())
                    .collect(),
            ),
        });

        for tc in &calls {
            let call_id = tc["id"].as_str().unwrap_or("").to_string();
            let fn_name = tc["function"]["name"].as_str().unwrap_or("").to_string();
            let args_str = tc["function"]["arguments"].as_str().unwrap_or("{}");
            let args: serde_json::Value =
                serde_json::from_str(args_str).unwrap_or(serde_json::json!({}));

            let _ = app.emit(
                "agent-event",
                AgentEvent::ToolCall {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                    call_id: call_id.clone(),
                    tool: fn_name.clone(),
                    input: args.clone(),
                },
            );

            if matches!(fn_name.as_str(), "search_web" | "http_fetch") {
                search_browse_count += 1;
                if search_browse_count % 2 == 0 {
                    messages.push(LlmMessage {
                        role: "system".to_string(),
                        content: serde_json::Value::String(
                            "[2-Action Rule]: You have performed 2 search/fetch operations. You MUST now save key findings to findings.md before continuing.".to_string()
                        ),
                        tool_call_id: None,
                        tool_calls: None,
                    });
                }
            }

            let (raw_output, is_error) = execute_tool(
                docker_opt.as_ref().map(|d| d as &Docker),
                container_opt.as_deref(),
                &fn_name,
                &args,
                &http,
            )
            .await;

            let output = if is_error {
                let strike = error_tracker.record_error(&fn_name, &raw_output);
                match strike {
                    1 => format!(
                        "[Strike 1/3] Error: {raw_output}\nDiagnose and apply a targeted fix."
                    ),
                    2 => format!(
                        "[Strike 2/3] Same tool failed again: {raw_output}\nTry a COMPLETELY DIFFERENT approach or tool."
                    ),
                    3 => {
                        let attempts = error_tracker.attempts(&fn_name);
                        let _ = app.emit(
                            "agent-event",
                            AgentEvent::StrikeEscalation {
                                task_id: task_id.clone(),
                                message_id: message_id.clone(),
                                tool: fn_name.clone(),
                                attempts: attempts.clone(),
                            },
                        );
                        format!(
                            "[Strike 3/3 — ESCALATE] All 3 attempts at `{fn_name}` failed:\n{}\n\nYou MUST stop retrying this tool. Either:\n1. Explain to the user why this cannot be completed\n2. Or find a fundamentally different solution path",
                            attempts.join("\n---\n")
                        )
                    }
                    _ => format!(
                        "[BLOCKED] `{fn_name}` has failed {strike} times. Do not call this tool again. Report failure to user."
                    ),
                }
            } else {
                error_tracker.reset(&fn_name);
                raw_output
            };

            let _ = app.emit(
                "agent-event",
                AgentEvent::ToolResult {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                    call_id: call_id.clone(),
                    output: output.clone(),
                    is_error,
                },
            );

            messages.push(LlmMessage {
                role: "tool".to_string(),
                content: serde_json::Value::String(output),
                tool_call_id: Some(call_id),
                tool_calls: None,
            });
        }

        // Emit assistant + tool messages to frontend so rawHistory stays in sync
        // for multi-turn context. We re-serialize the slice added this iteration.
        // The assistant message is the last messages entry before the tool results;
        // find it by looking backwards from current end.
        {
            // Collect the assistant message and all its tool results that were just pushed.
            // They are the last (1 + calls.len()) entries (excluding any system injections).
            let mut raw_batch: Vec<serde_json::Value> = Vec::new();
            for m in messages.iter().rev() {
                match m.role.as_str() {
                    "tool" => {
                        raw_batch.push(serde_json::to_value(m).unwrap_or_default());
                    }
                    "assistant" if m.tool_calls.is_some() => {
                        raw_batch.push(serde_json::to_value(m).unwrap_or_default());
                        break;
                    }
                    _ => break,
                }
            }
            raw_batch.reverse();
            if !raw_batch.is_empty() {
                let _ = app.emit(
                    "agent-event",
                    AgentEvent::RawMessages {
                        task_id: task_id.clone(),
                        messages: raw_batch,
                    },
                );
            }
        }
    }

    let _ = app.emit(
        "agent-event",
        AgentEvent::Error {
            task_id: task_id.clone(),
            message_id: message_id.clone(),
            error: "Agent reached maximum iteration limit (30). Check progress.md in the workspace for current state.".to_string(),
        },
    );
    Ok(())
}

// ─── Sandbox management ────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
pub struct AgentStatus {
    pub running: bool,
    pub container_id: Option<String>,
    pub message: String,
    pub docker_available: bool,
}

#[tauri::command]
async fn get_agent_status(task_id: String, _workspace_path: String) -> AgentStatus {
    match get_or_connect_docker().await {
        Ok(docker) => {
            let name = format!("nasus-sandbox-{}", &task_id[..task_id.len().min(8)]);
            match docker.inspect_container(&name, None).await {
                Ok(info) => {
                    let running = info.state.and_then(|s| s.running).unwrap_or(false);
                    AgentStatus {
                        running,
                        container_id: Some(name),
                        message: if running {
                            "Sandbox running".to_string()
                        } else {
                            "Sandbox stopped".to_string()
                        },
                        docker_available: true,
                    }
                }
                Err(_) => AgentStatus {
                    running: false,
                    container_id: None,
                    message: "No sandbox for this task".to_string(),
                    docker_available: true,
                },
            }
        }
        Err(e) => AgentStatus {
            running: false,
            container_id: None,
            message: format!("Docker unavailable: {e}"),
            docker_available: false,
        },
    }
}

#[tauri::command]
async fn stop_sandbox(task_id: String) -> Result<(), String> {
    let docker = get_or_connect_docker().await?;
    let name = format!("nasus-sandbox-{}", &task_id[..task_id.len().min(8)]);
    docker
        .remove_container(
            &name,
            Some(RemoveContainerOptions {
                force: true,
                ..Default::default()
            }),
        )
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

// ─── Docker health check ──────────────────────────────────────────────────────

#[derive(Debug, Serialize)]
pub struct DockerStatus {
    pub available: bool,
    /// Human-readable message shown in the UI
    pub message: String,
    /// Docker Desktop download URL (shown when not installed)
    pub download_url: String,
}

/// Called once on app launch. Returns whether Docker is reachable and,
/// if not, a clear message + download link so the UI can show a blocking modal.
#[tauri::command]
async fn check_docker() -> DockerStatus {
    match Docker::connect_with_local_defaults() {
        Err(_) => DockerStatus {
            available: false,
            message: "Docker is not installed or could not be found.".to_string(),
            download_url: "https://www.docker.com/products/docker-desktop/".to_string(),
        },
        Ok(docker) => {
            // Ping the daemon — connect_with_local_defaults succeeds even when the
            // daemon is stopped, so we need an actual round-trip to confirm it's running.
            match docker.ping().await {
                Ok(_) => DockerStatus {
                    available: true,
                    message: "Docker is running.".to_string(),
                    download_url: String::new(),
                },
                Err(e) => DockerStatus {
                    available: false,
                    message: format!(
                        "Docker Desktop is installed but not running. Please start it and relaunch Nasus. ({})",
                        e
                    ),
                    download_url: "https://www.docker.com/products/docker-desktop/".to_string(),
                },
            }
        }
    }
}

// ─── App entry ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(CancelMap::default())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            let _ = app.handle().store("config.json");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            run_agent,
            stop_agent,
            get_config,
            save_config,
            validate_path,
            fetch_models,
            get_agent_status,
            stop_sandbox,
            read_memory_files,
            check_docker,
            pick_folder,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
