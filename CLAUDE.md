# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nasus** is a Tauri 2.0 desktop application — an autonomous AI agent built with React and Rust. It executes complex multi-step tasks using a multi-agent architecture with tool-based execution, planning, and verification capabilities.

**Note**: This is a desktop-only application. Browser mode, Pyodide WASM execution, and E2B cloud sandbox have been removed.

## Development Commands

```bash
# Development
npm run tauri:dev        # Start Tauri dev mode (Rust backend + React frontend)

# Building
npm run build            # TypeScript compile + Vite production build
npm run tauri:build      # Full desktop app build
npm run tauri:build:debug   # Debug build with symbols

# Code Quality
npm run lint             # Run ESLint
npx tsc -b               # TypeScript type check (no emit)
```

## Architecture

### Multi-Agent System

The application uses a sophisticated agent architecture inspired by OpenManus:

- **PlanningAgent** (`src/agent/agents/PlanningAgent.ts`) - Generates execution plans with phases and steps
- **ExecutionAgent** (`src/agent/agents/ExecutionAgent.ts`) - ReAct-based loop that executes tasks using tools
- **VerificationAgent** (`src/agent/agents/VerificationAgent.ts`) - Validates execution results against requirements
- **BaseAgent** (`src/agent/core/BaseAgent.ts`) - Abstract base class providing common agent functionality

### Tool Registry System

Centralized tool management in `src/agent/tools/core/ToolRegistry.ts`:

- `globalToolRegistry` - Singleton registry for all available tools
- Tools are registered as constructors (lazy instantiation) or instances
- `getToolDefinitions()` - Returns tool definitions for LLM function calling
- Tools filter by capability: `sandbox` (requires Docker)

### Gateway & Model Routing

**Model-agnostic AI integration** with automatic failover:

- **Gateway types**: OpenRouter, LiteLLM, Ollama, Direct, Custom
- **Rust backend** (`src-tauri/src/gateway.rs`): Health tracking, circuit breaker pattern
- **TypeScript gateway** (`src/agent/gateway/`): Model selection, routing modes
- **Routing modes**: `auto-free`, `auto-paid`, `manual`
- **Server-side fallback**: OpenRouter `models` + `route: fallback` for model chain

### State Management

**Zustand store** (`src/store.ts`) with persistence:

- Tasks, messages, raw LLM history per task
- Router config, gateway config, model registry
- SQLite persistence for task history (via Rust backend)
- Workspace file tracking via `WorkspaceManager`

### Execution Flow

1. User submits task → `PlanningAgent` creates `ExecutionPlan`
2. User approves plan → `ExecutionAgent` runs ReAct loop
3. Each iteration: LLM thinks → calls tools → observes results
4. If verification enabled → `VerificationAgent` validates results
5. On failure → self-correction loop (max 3 attempts)

## Key Patterns

### Error Handling

**3-strike escalation pattern** in `ExecutionAgent`:
- Strike 1: "Diagnose and apply targeted fix"
- Strike 2: "Try a COMPLETELY DIFFERENT approach"
- Strike 3: Block tool, emit escalation event

### Context Compression

When message history exceeds context window threshold (model-specific):
- Remove middle tool call/result pairs
- Keep first 2 and last 4 for continuity
- Inject system message pointing to recovery files

### LLM Integration

**Streaming with retry** (`src/agent/llm.ts`):
- `streamCompletion()` - SSE streaming with idle timeout (30s)
- Automatic retry on 429, 502, 503, 504
- OpenRouter-specific headers for attribution (`HTTP-Referer`, `X-Title`)
- Server-side fallback via `models` array

### Workspace Management

**Per-task workspaces** (`src/agent/workspace/`):
- Isolated file storage per task (`task-{taskId}/`)
- In-memory Map for fast access
- File watching triggers UI updates
- Auto-cleanup on task delete/prune

### Browser Automation

**Sidecar service** (`src-tauri/src/sidecar.rs`):
- WebSocket communication with browser extension
- Stealth mode, cookie management
- Screenshot, click, type, scroll, extract

## TypeScript Configuration

- **Target**: ES2022, **Module**: ESNext
- **Strict mode enabled**
- `noUnusedLocals`, `noUnusedParameters` enforced
- JSX runtime: `react-jsx` (no import needed)

## Rust Backend

**Tauri 2.0** with the following modules:

- `lib.rs` - Main commands, workspace operations, Docker checks
- `gateway.rs` - Gateway health, failover, circuit breaker
- `docker.rs` - Container creation, Python/Bash execution
- `sidecar.rs` - Browser extension WebSocket server
- `models/` - Task classification, model routing, registry

**Key crates**: bollard (Docker), reqwest (HTTP), rusqlite (SQLite), tokio (async)

## Adding New Tools

1. Create tool class extending `BaseTool` in `src/agent/tools/`
2. Implement `execute()` method returning `ToolResult`
3. Add to `globalToolRegistry` in appropriate category file
4. Define capabilities: `requiresSandbox`, `worksInBrowser`
5. Add to specialist agent tool filters in `BaseAgent.filterTools()`

## Adding New Agents

1. Extend `BaseAgent` with agent type (`planner` | `executor` | `verifier` | `specialist`)
2. Implement `doExecute()` abstract method
3. Use `emitThinking()`, state transitions, cancellation checks
4. Register in agent orchestrator if needed

## Gateway Configuration

Gateways stored in Tauri plugin store. Default gateways:
- **OpenRouter** (priority 0): `https://openrouter.ai/api/v1`
- **LiteLLM** (priority 5): `http://localhost:4000/v1`
- **Ollama** (priority 10): `http://localhost:11434/v1`

Each gateway has: health tracking (consecutive failures, success rate), retry limits, timeout config.
