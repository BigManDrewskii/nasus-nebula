use bollard::container::{
    Config, CreateContainerOptions, LogOutput, RemoveContainerOptions,
    StartContainerOptions,
};
use bollard::exec::{CreateExecOptions, StartExecResults};
use bollard::models::HostConfig;
use bollard::Docker;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_store::StoreExt;

// ─── Global cancellation flags ────────────────────────────────────────────────
// Maps task_id → cancelled flag. `run_agent` checks this each iteration.

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
        .unwrap_or_else(|| "anthropic/claude-3.5-sonnet".to_string());
    let workspace_path = store
        .get("workspace_path")
        .and_then(|v: serde_json::Value| v.as_str().map(|s| s.to_string()))
        .unwrap_or_else(|| {
            dirs::home_dir()
                .map(|p| p.join("nasus-workspace").to_string_lossy().to_string())
                .unwrap_or_else(|| "/tmp/nasus-workspace".to_string())
        });
    Ok(AppConfig {
        api_key,
        model,
        workspace_path,
    })
}

#[tauri::command]
fn save_config(
    app: AppHandle,
    api_key: String,
    model: String,
    workspace_path: String,
) -> Result<(), String> {
    let store = app.store("config.json").map_err(|e| e.to_string())?;
    store.set("api_key", serde_json::Value::String(api_key));
    store.set("model", serde_json::Value::String(model));
    store.set("workspace_path", serde_json::Value::String(workspace_path));
    store
        .save()
        .map_err(|e: tauri_plugin_store::Error| e.to_string())?;
    Ok(())
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
    /// Emitted when the agent hits a 3-strike failure so the UI can surface it
    StrikeEscalation {
        task_id: String,
        message_id: String,
        tool: String,
        attempts: Vec<String>, // summaries of each attempt
    },
    /// Emitted when context is compressed mid-task
    ContextCompressed {
        task_id: String,
        message_id: String,
        removed_count: usize,
    },
    /// Emitted at the start of each agent iteration so the UI can show a counter
    IterationTick {
        task_id: String,
        message_id: String,
        iteration: usize,
    },
    /// Emitted after each LLM response with token usage counts
    TokenUsage {
        task_id: String,
        message_id: String,
        prompt_tokens: u64,
        completion_tokens: u64,
        total_tokens: u64,
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
    /// Per-tool strike counts: tool_name → (strike_count, attempt_summaries)
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

async fn ensure_sandbox(
    docker: &Docker,
    task_id: &str,
    workspace_path: &str,
) -> Result<String, String> {
    let name = format!("nasus-sandbox-{}", &task_id[..task_id.len().min(8)]);

    // Check if already running
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
        image: Some("ubuntu:22.04"),
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

    // Bootstrap common tools in the background so we don't block the first LLM call
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

    // Cap output to prevent context overflow
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
    // Helper: run a command in the sandbox; returns error string if sandbox unavailable
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
              // Base64-encode the content so no quoting issues regardless of what the agent writes
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
                    let preview = if text.len() > 6000 {
                        &text[..6000]
                    } else {
                        &text
                    };
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
              // Use the sandbox to run a real web search via curl + Python HTML parsing
              // DuckDuckGo HTML endpoint returns real search results without an API key
              let cmd = format!(
                  r#"curl -sL --max-time 15 -H "User-Agent: Mozilla/5.0 (X11; Linux x86_64)" \
                  "https://html.duckduckgo.com/html/?q={encoded}" | \
                  python3 -c "
import sys, re
html = sys.stdin.read()
results = re.findall(r'class=\"result__title\".*?href=\"([^\"]+)\".*?>(.*?)</a>.*?class=\"result__snippet\">(.*?)</span>', html, re.DOTALL)
if not results:
    # fallback: grab any links with snippets
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
                  // Fallback: hit DuckDuckGo from host process when sandbox unavailable
                  let url = format!("https://api.duckduckgo.com/?q={encoded}&format=json&no_redirect=1&no_html=1&skip_disambig=1");
                  match http_client.get(&url)
                      .header("User-Agent", "Mozilla/5.0 (compatible; Nasus/1.0)")
                      .timeout(std::time::Duration::from_secs(10))
                      .send().await
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

/// Minimal URL encoding (percent-encode spaces and common special chars)
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

/// Safe base64 encoding for passing arbitrary content through shell heredocs
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

// ─── LLM call ─────────────────────────────────────────────────────────────────

async fn llm_chat(
    client: &reqwest::Client,
    api_key: &str,
    model: &str,
    messages: &[LlmMessage],
    tools: &serde_json::Value,
) -> Result<serde_json::Value, String> {
    let body = serde_json::json!({
        "model": model,
        "messages": messages,
        "tools": tools,
        "tool_choice": "auto",
    });

    let resp = client
        .post("https://openrouter.ai/api/v1/chat/completions")
        .header("Authorization", format!("Bearer {api_key}"))
        .header("Content-Type", "application/json")
        .header("HTTP-Referer", "https://nasus.app")
        .header("X-Title", "Nasus")
        .timeout(std::time::Duration::from_secs(120))
        .json(&body)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = resp.status();
    let json: serde_json::Value = resp.json().await.map_err(|e| e.to_string())?;

    if !status.is_success() {
        return Err(format!(
            "LLM error {status}: {}",
            json["error"]["message"]
                .as_str()
                .unwrap_or(&json.to_string())
        ));
    }

    Ok(json)
}

// ─── Context compression ──────────────────────────────────────────────────────

/// When message history grows large, trim old tool results (keep first 2 + last 4 tool pairs)
/// while preserving the system prompt and all non-tool messages.
fn compress_context(
    messages: &mut Vec<LlmMessage>,
    task_id: &str,
    message_id: &str,
    app: &AppHandle,
) -> usize {
    // Collect indices of all `tool` result messages
    let tool_result_indices: Vec<usize> = messages
        .iter()
        .enumerate()
        .filter_map(|(i, m)| if m.role == "tool" { Some(i) } else { None })
        .collect();

    if tool_result_indices.len() <= 6 {
        return 0;
    }

    // The middle tool results to remove (keep first 2 + last 4)
    let middle_results: std::collections::HashSet<usize> =
        tool_result_indices[2..tool_result_indices.len() - 4]
            .iter()
            .copied()
            .collect();

    // Find assistant messages whose *entire* tool_calls set was consumed by removed results.
    // Strategy: an assistant message at index i is removable if ALL tool result messages
    // that follow it (before the next assistant/user message) are in middle_results.
    let mut all_remove = middle_results.clone();
    let mut i = 0;
    while i < messages.len() {
        if messages[i].role == "assistant" && messages[i].tool_calls.is_some() {
            // Collect the tool result indices immediately following this assistant message
            let mut j = i + 1;
            let mut result_indices = vec![];
            while j < messages.len() && messages[j].role == "tool" {
                result_indices.push(j);
                j += 1;
            }
            // Only remove the assistant message if ALL its results are being removed
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

    // Insert a compression notice after the system message
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

    // Use base64 to write each file safely — no quoting issues regardless of content
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

// ─── Read memory files command (for frontend Resume feature) ──────────────────

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
    // Read directly from the host-mounted workspace (not via Docker)
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
) -> Result<(), String> {
    let effective_model = if model.is_empty() {
        "anthropic/claude-3.5-sonnet".to_string()
    } else {
        model.clone()
    };

    let http = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(60))
        .build()
        .unwrap_or_default();

    let tools = tool_definitions();

    // ── Connect to Docker & start sandbox ──────────────────────────────────────
    let docker_result = get_or_connect_docker().await;
    let (docker_opt, container_opt) = match &docker_result {
        Ok(d) => {
            match ensure_sandbox(d, &task_id, &workspace_path).await {
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

    // ── Initialize memory files (only on first message in this task) ───────────
    let is_first_message = user_messages.len() == 1;
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
        messages.push(LlmMessage {
            role: m["role"].as_str().unwrap_or("user").to_string(),
            content: m["content"].clone(),
            tool_call_id: None,
            tool_calls: None,
        });
    }

    // ── Agent state ────────────────────────────────────────────────────────────
    let mut error_tracker = ErrorTracker::default();
    let mut search_browse_count: usize = 0; // tracks 2-action rule

    const MAX_ITERATIONS: usize = 30;

    // Clear any previous cancel flag for this task
    set_cancelled(&app, &task_id, false);

    for iteration in 0..MAX_ITERATIONS {
        // Check cancellation at the top of every iteration
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

        // Emit iteration tick so the UI can display a counter
        let _ = app.emit(
            "agent-event",
            AgentEvent::IterationTick {
                task_id: task_id.clone(),
                message_id: message_id.clone(),
                iteration: iteration + 1,
            },
        );

        // Context compression: if history is getting large, trim old tool results
        if messages.len() > 80 {
            compress_context(&mut messages, &task_id, &message_id, &app);
        }

        let response = match llm_chat(&http, &api_key, &effective_model, &messages, &tools).await {
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

        // Emit token usage so the UI can track cost/context
        if let Some(usage) = response.get("usage") {
            let _ = app.emit(
                "agent-event",
                AgentEvent::TokenUsage {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                    prompt_tokens: usage["prompt_tokens"].as_u64().unwrap_or(0),
                    completion_tokens: usage["completion_tokens"].as_u64().unwrap_or(0),
                    total_tokens: usage["total_tokens"].as_u64().unwrap_or(0),
                },
            );
        }

        // Emit reasoning/thinking tokens if present (extended thinking models)
        if let Some(thinking) = msg.get("reasoning").and_then(|r| r.as_str()) {
            if !thinking.is_empty() {
                let _ = app.emit(
                    "agent-event",
                    AgentEvent::Thinking {
                        task_id: task_id.clone(),
                        message_id: message_id.clone(),
                        content: thinking.to_string(),
                    },
                );
            }
        }

        let tool_calls = msg["tool_calls"].as_array().cloned();
        let no_tools = tool_calls.is_none()
            || tool_calls.as_ref().map(|v| v.is_empty()).unwrap_or(true);

        if finish_reason == "stop" || no_tools {
            // ── Final answer ─────────────────────────────────────────────────
            let final_text = msg["content"].as_str().unwrap_or("").to_string();

            // Stream word-by-word for natural feel
            for word in final_text.split_inclusive(' ') {
                let _ = app.emit(
                    "agent-event",
                    AgentEvent::StreamChunk {
                        task_id: task_id.clone(),
                        message_id: message_id.clone(),
                        delta: word.to_string(),
                        done: false,
                    },
                );
                tokio::time::sleep(tokio::time::Duration::from_millis(6)).await;
            }

            let _ = app.emit(
                "agent-event",
                AgentEvent::StreamChunk {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                    delta: String::new(),
                    done: true,
                },
            );
            let _ = app.emit(
                "agent-event",
                AgentEvent::Done {
                    task_id: task_id.clone(),
                    message_id: message_id.clone(),
                },
            );
            return Ok(());
        }

        // ── Tool calls ───────────────────────────────────────────────────────
        let calls = tool_calls.unwrap();

        // Add assistant message (with tool_calls) to history
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

            // Emit tool call event
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

            // Track search/browse for 2-action rule
            if matches!(fn_name.as_str(), "search_web" | "http_fetch") {
                search_browse_count += 1;
                if search_browse_count % 2 == 0 {
                    // Inject a reminder so the model saves findings
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

            // Execute the tool — always pass Option refs so search_web can handle no-sandbox fallback
            let (raw_output, is_error) =
                execute_tool(
                    docker_opt.as_ref().map(|d| d as &Docker),
                    container_opt.as_deref(),
                    &fn_name,
                    &args,
                    &http,
                ).await;

            // ── 3-Strike protocol ─────────────────────────────────────────
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
                    _ => {
                        // Beyond 3 strikes — force stop on this tool
                        format!(
                            "[BLOCKED] `{fn_name}` has failed {strike} times. Do not call this tool again. Report failure to user."
                        )
                    }
                }
            } else {
                // Success — reset strike counter for this tool
                error_tracker.reset(&fn_name);
                raw_output
            };

            // Emit tool result
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

            // Add tool result to message history
            messages.push(LlmMessage {
                role: "tool".to_string(),
                content: serde_json::Value::String(output),
                tool_call_id: Some(call_id),
                tool_calls: None,
            });
        }
    }

    // Max iterations hit
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

// ─── App entry ────────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_shell::init())
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
            get_agent_status,
            stop_sandbox,
            read_memory_files,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
