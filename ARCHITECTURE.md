# Nasus App Architecture Document

> Complete mapping of all UI elements, pages, features, and backend systems

---

## Table of Contents
1. [Application Structure](#application-structure)
2. [Frontend Pages & Components](#frontend-pages--components)
3. [Backend Systems](#backend-systems)
4. [State Management](#state-management)
5. [Data Flow](#data-flow)
6. [Configuration & Settings](#configuration--settings)

---

## Application Structure

```
nasus/
├── src/                          # Frontend (React + TypeScript)
│   ├── components/               # UI Components
│   ├── agent/                    # Agent System
│   ├── hooks/                    # React Hooks
│   ├── lib/                      # Utilities
│   └── store.ts                  # State Management
└── src-tauri/src/                # Backend (Rust)
    ├── lib.rs                    # Main entry
    ├── gateway.rs                # API Gateway
    ├── docker.rs                 # Docker Sandbox
    ├── sidecar.rs                # Browser Automation
    └── models/                   # Model Routing
```

---

## Frontend Pages & Components

### 1. Main Application Layout

**File:** `App.tsx`

| Element | Description |
|---------|-------------|
| Left Sidebar | Task list, search, settings access |
| Chat Area | Message display, input, header |
| Right Panel | Preview, files, code, browser tabs |
| Settings Modal | API keys, model configuration |
| Onboarding Screen | Initial setup/welcome |
| Offline Banner | Connectivity warning |
| Prune Notice | Task limit notifications |

---

### 2. Left Sidebar

**File:** `Sidebar.tsx`

| Section | Elements |
|---------|----------|
| **Header** | Logo (Nasus icon), New Task button, Search input |
| **Task List** | Task items with status indicators, task count badge |
| **Footer** | Settings button |
| **Collapsed Rail** | Icon-only mode with quick access |

**Task Item (`TaskListItem.tsx`):**
- Task title (truncated)
- Status dot (pending, in_progress, completed, failed, stopped)
- Pin toggle
- Timestamp
- Active state highlight
- Delete on right-click
- Drag for reordering

**Search:**
- Real-time filtering by task title
- Case-insensitive

---

### 3. Chat View (Main Area)

**File:** `ChatView.tsx`

| Section | Elements |
|---------|----------|
| **Header** | `ChatHeader` component |
| **Message List** | Scrollable message area |
| **Plan View** | Execution plan display (inline) |
| **Empty State** | Welcome when no messages |
| **Input Area** | `UserInputArea` component |
| **Memory Viewer** | Memory file browser overlay |
| **Drop Zone** | File/folder drop overlay |

#### ChatHeader (`ChatHeader.tsx`)

| Element | Description |
|---------|-------------|
| Task Title | Current task name |
| Model Badge | Provider icon + model name |
| Health Dot | Gateway health indicator |
| Route Badge | FREE/PAID budget indicator |
| Iteration Counter | Current agent iteration |
| Token Counter | Total tokens used + cost estimate |
| Sandbox Pill | Sandbox status (Starting, Ready, Stopped, Error) |
| Files Pill | File count (when output hidden) |
| Memory Button | Open memory viewer |
| Stop Button | Stop agent (Esc key) |
| Status Dot | Task status indicator |

#### UserInputArea (`UserInputArea.tsx`)

| Element | Description |
|---------|-------------|
| Textarea | Auto-growing message input |
| Attach Button | File picker (images, PDF, code files) |
| Attachment Bar | Preview chips for attached files |
| Send Button | Submit message (Enter) |
| Stop Button | Stop generation (Esc) |
| Queued Message Banner | Shows queued follow-up message |

**States:**
- `idle` - Ready for input
- `processing` - Agent thinking
- `streaming` - Agent running
- `awaiting_input` - Waiting for user response

#### ChatMessage (`ChatMessage.tsx`)

**Message Types:**
- User message (right-aligned, amber accent)
- Agent message (left-aligned, streaming)
- System message (centered, muted)

**Agent Message Content:**
- Text content with markdown rendering
- Code blocks with syntax highlighting
- Tool call indicators
- Agent steps (expandable)
- Error display
- Timestamp

#### PlanConfirmationModal (`PlanConfirmationModal.tsx`)

| Element | Description |
|---------|-------------|
| Plan Summary | Phase and step overview |
| Phase List | Expandable phase sections |
| Step Items | Individual steps with tool calls |
| Approve Button | Start execution |
| Reject Button | Discard plan |
| Modify Button | Adjust plan (future) |

---

### 4. Right Output Panel

**File:** `OutputPanel.tsx`

| Tab | Content |
|-----|---------|
| **Preview** | HTML preview iframe |
| **Files** | Workspace file explorer |
| **Code** | Raw file viewer with syntax highlighting |
| **Browser** | Browser automation preview |

#### OutputPanel Structure

| Section | Elements |
|---------|----------|
| **Tab Bar** | Preview, Files, Code, Browser tabs + collapse toggle |
| **Meta Bar** | File path, chip, download button |
| **Content Area** | Tab-specific content |

#### PreviewPane (`PreviewPane.tsx`)
- iframe for HTML rendering
- Auto-refresh on file changes
- Dev server URL handling

#### FilesPane (`FilesPane.tsx`)
| Element | Description |
|---------|-------------|
| **Toolbar** | Select all, checkbox, download ZIP |
| **File List** | Grid with checkbox, icon, name, size, actions |
| **Footer** | Selected count, size total |

#### CodePane (`CodePane.tsx`)
- Syntax highlighting (custom tokenizer)
- Line numbers
- Copy button
- Auto-refresh

#### BrowserPreview (`BrowserPreview.tsx`)
- Screenshot display
- Navigation controls
- Page title/URL

---

### 5. Settings Panel

**File:** `SettingsPanel.tsx`

| Section | Fields |
|---------|--------|
| **API Key** | OpenRouter API key input |
| **Model** | Model selector dropdown |
| **Provider** | OpenRouter, Vercel AI, Ollama |
| **Budget** | Free-only / Paid toggle |
| **Workspace** | Path picker, recent paths |
| **Search API** | Exa API key |
| **Max Iterations** | Slider (1-50) |
| **Verification** | Enable/disable toggle |
| **Execution Mode** | Docker / Disabled |

---

### 6. Onboarding Screen

**File:** `OnboardingScreen.tsx`

| Step | Content |
|------|---------|
| **Welcome** | App introduction, key features |
| **API Key** | OpenRouter key input |
| **Workspace** | Default workspace selection |
| **Ready** | Start using the app |

---

### 7. Additional Components

| Component | Purpose |
|-----------|---------|
| `MemoryViewer.tsx` | Browse memory files (task_plan.md, findings.md, progress.md) |
| `VerificationReport.tsx` | Show verification results after task completion |
| `StreamingStatus.tsx` | Animated typing indicator |
| `DropZoneOverlay.tsx` | Drag-and-drop visual feedback |
| `AttachmentPreviewBar.tsx` | File attachment chips with remove |
| `BashOutput.tsx` | Command execution output |
| `ExpandableOutput.tsx` | Collapsible tool result sections |
| `AgentStepsView.tsx` | Step-by-step agent execution display |
| `WorkspacePicker.tsx` | Directory picker modal |
| `NasusLogo.tsx` | Logo component (SVG) |
| `Pxi.tsx` | Icon wrapper (Pxi = Pixel icon) |
| `PanelDivider.tsx` | Draggable panel resize handle |

---

### 8. Sidebar Configuration Accordion

**File:** `ConfigAccordion.tsx`

| Section | Content |
|---------|---------|
| **Model** | Model dropdown, provider toggle, free/paid |
| **Parameters** | Temperature slider, max tokens |
| **System Prompt** | Custom system prompt editor |
| **Stats** | Message count, tokens, cost, model used |

**Collapsed State:**
- Shows compact summary row with provider, model, budget badge
- Click to expand

**Provider Toggle (Segmented Control):**
- OpenRouter, Vercel AI, Auto (horizontal buttons)
- Health indicators
- Free/Paid toggle below (when not Auto)

---

## Backend Systems

### 1. Agent Framework

**Location:** `src/agent/`

#### BaseAgent (`BaseAgent.ts`)
- Abstract base class for all agents
- Common agent interface
- State management
- Cancellation handling
- Event emission

#### Agent Types

| Agent | File | Purpose |
|-------|------|---------|
| **PlanningAgent** | `PlanningAgent.ts` | Creates execution plans with phases/steps |
| **ExecutionAgent** | `ExecutionAgent.ts` | ReAct-based tool execution loop |
| **VerificationAgent** | `VerificationAgent.ts` | Validates task results |

#### Orchestrator (`Orchestrator.ts`)
- Manages multi-agent workflows
- Plans → Executes → Verifies
- Error recovery and retries

---

### 2. Tool System

**Location:** `src/agent/tools/`

#### ToolRegistry (`ToolRegistry.ts`)
- Central tool registration
- Tool capability filtering
- Tool discovery

#### Tool Categories

| Category | Tools |
|----------|-------|
| **File** | `ReadFileTool`, `WriteFileTool`, `PatchFileTool`, `ListFilesTool` |
| **Code** | `BashTool`, `PythonTool`, `PreviewServer` |
| **Browser** | `ClickTool`, `NavigateTool`, `ScreenshotTool`, `TypeTool`, `ScrollTool` |
| **Web** | `FetchTool`, `SearchTool` |
| **Core** | `CompleteTool`, `SaveMemoryTool`, `ThinkTool` |

#### BaseTool (`BaseTool.ts`)
- Abstract base for all tools
- Capability declarations
- Execution interface
- Result formatting

---

### 3. LLM Integration

**File:** `src/agent/llm.ts`

| Feature | Description |
|---------|-------------|
| **Streaming** | SSE-based response streaming |
| **Retry Logic** | Auto-retry on 429, 502, 503, 504 |
| **Timeout** | Idle timeout (30s) |
| **Headers** | OpenRouter attribution |
| **Fallback** | Server-side model routing |

---

### 4. Workspace Management

**Location:** `src/agent/workspace/`

| Component | Purpose |
|-----------|---------|
| **WorkspaceManager** | Per-task file storage |
| **File Watching** | Real-time UI updates |
| **Auto-cleanup** | Resource management |
| **Path Validation** | Security |

---

### 5. Memory System

| Component | Purpose |
|-----------|---------|
| **MemoryStore** | Memory interface |
| **LocalMemoryStore** | File-based implementation |
| **ContextBuilder** | Memory injection into prompts |
| **Memory Files** | `task_plan.md`, `findings.md`, `progress.md` |

---

### 6. Gateway & Routing

**Location:** `src/agent/gateway/`

| Component | Purpose |
|-----------|---------|
| **GatewayStore** | Gateway state management |
| **Model Selection** | Model routing logic |
| **Health Tracking** | Circuit breaker pattern |
| **Failover** | Automatic gateway switching |

**Providers:**
- OpenRouter (default)
- Vercel AI Gateway
- LiteLLM
- Ollama (local)

**Routing Modes:**
- `auto-free` - Automatic free model selection
- `auto-paid` - Automatic paid model selection
- `manual` - User-selected model

---

## State Management

**File:** `src/store.ts`

### Zustand Store Structure

| Category | State | Description |
|----------|-------|-------------|
| **Tasks** | `tasks[]` | All tasks |
| | `activeTaskId` | Current task |
| | `addTask` | Create task |
| | `deleteTask` | Remove task |
| | `updateTaskTitle` | Rename task |
| | `updateTaskStatus` | Change status |
| **Messages** | `messages` | Per-task messages |
| | `rawHistory` | LLM history with tool calls |
| | `addMessage` | Add message |
| | `appendChunk` | Stream response |
| **Config** | `apiKey` | OpenRouter key |
| | `model` | Selected model |
| | `provider` | API provider |
| | `workspacePath` | Workspace directory |
| | `routerConfig` | Routing settings |
| | `exaKey` | Search API key |
| | `maxIterations` | Max steps |
| | `enableVerification` | Verification toggle |
| **Gateway** | `gateways[]` | Configured gateways |
| | `gatewayHealth[]` | Health status |
| **Planning** | `pendingPlan` | Awaiting approval |
| | `currentPlan` | Active plan |
| | `planApprovalStatus` | Approval state |
| **UI State** | `configSections` | Accordion state |
| | `rightPanelWidth` | Panel width |
| | `rightPanelVisible` | Panel visibility |

### Persistence

| Storage | Content |
|---------|---------|
| **localStorage** | UI state, preferences |
| **SQLite** (via Tauri) | Task history, messages |

---

## Data Flow

### 1. Message Flow

```
User Input
    ↓
ChatView.onSend()
    ↓
addMessage() → Store
    ↓
runAgent()
    ↓
PlanningAgent → Execution Plan
    ↓
User Approval (if enabled)
    ↓
ExecutionAgent (ReAct Loop)
    ↓
Tool Execution → Results
    ↓
appendChunk() → Streaming Update
    ↓
VerificationAgent (optional)
    ↓
Final Status Update
```

### 2. Tool Execution Flow

```
Agent decides action
    ↓
ToolRegistry.getTool()
    ↓
Tool.execute()
    ↓
Docker Runtime (if sandbox)
    ↓
Result captured
    ↓
ToolResult formatted
    ↓
Returned to LLM
```

### 3. File Change Flow

```
Agent writes file
    ↓
WorkspaceManager.writeFile()
    ↓
File written to disk
    ↓
Watcher detects change
    ↓
useWorkspaceFiles() updates
    ↓
OutputPanel re-renders
```

---

## Configuration & Settings

### 1. Model Routing

| Setting | Values |
|---------|--------|
| Mode | `auto-free`, `auto-paid`, `manual` |
| Budget | `free`, `paid` |
| Model Override | Per-model enabled/disabled |

### 2. Execution

| Setting | Values |
|---------|--------|
| Execution Mode | `docker`, `disabled` |
| Max Iterations | 1-50 (default: 50) |
| Verification | `true`, `false` |

### 3. Search

| Setting | Provider |
|---------|----------|
| Web Search | Exa API (requires key) |

### 4. Workspace

| Setting | Description |
|---------|-------------|
| Path | File system directory |
| Recent Paths | Quick access list |

---

## Rust Backend (Tauri)

### Commands

| Command | Purpose |
|---------|---------|
| `run_agent` | Start agent execution |
| `stop_agent` | Stop running agent |
| `write_file` | Write to workspace |
| `read_file` | Read from workspace |
| `list_files` | List workspace files |
| `validate_path` | Check path validity |
| `search_web` | Web search |
| `http_fetch` | HTTP request (bypass CORS) |
| `get_task_history` | Load from SQLite |
| `save_task_history` | Persist to SQLite |

### Modules

| Module | Responsibility |
|--------|---------------|
| **lib.rs** | Command registration, setup |
| **gateway.rs** | Health tracking, failover |
| **docker.rs** | Container management |
| **sidecar.rs** | Browser WebSocket server |
| **search/** | Exa integration |
| **models/** | Model classification |

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd+N` / `Ctrl+N` | New task |
| `Cmd+,` / `Ctrl+,` | Open settings |
| `Cmd+\` / `Ctrl+\` | Toggle left sidebar |
| `Cmd+B` / `Ctrl+B` | Toggle left sidebar |
| `Cmd+Shift+\` | Toggle right panel collapse |
| `Cmd+.` | Toggle right panel visibility |
| `Esc` | Stop agent |
| `Enter` | Send message |
| `Shift+Enter` | Newline in input |

---

## Icon System (Pxi)

**File:** `Pxi.tsx` wraps iconfont (FontAwesome-style)

| Common Icons | Usage |
|--------------|-------|
| `sparkles` | AI/Model |
| `comment-dots` | System prompt |
| `sliders-h` | Parameters |
| `chart-bar` | Stats |
| `folder` | Files |
| `code` | Code |
| `globe` | Browser/Preview |
| `times` | Close/Remove |
| `check` | Success/Complete |
| `times-circle` | Failed/Error |
| `stop-circle` | Stopped |
| `leaf` | Free tier |
| `cloud` | Cloud API |
| `server` | Local |
| `bolt` | Auto route |
| `triangle` | Vercel |
| `bookmark` | Memory |

---

## Color System

| Token | Value | Usage |
|-------|-------|------|
| `--amber` | `oklch(64% 0.214 40.1)` | Primary accent |
| `--tx-primary` | `#e2e2e2` | Headings |
| `--tx-secondary` | `#ababab` | Body text |
| `--tx-tertiary` | `#757575` | Captions |
| `--tx-muted` | `#555555` | Decorative |

---

## File Type Icons

| Extension | Icon | Color |
|-----------|------|-------|
| `.ts`, `.tsx`, `.js`, `.jsx` | Code | Blue |
| `.py` | Code | Yellow |
| `.md`, `.txt` | File | Gray |
| `.json`, `.yaml` | Config | Purple |
| `.html`, `.css` | Web | Orange |
| Images | Image | Green |

---

*Document generated for Nasus V1.1*
