# Nasus Agent Stack — Full Architecture Audit

**Date:** March 12, 2026
**Auditor:** Claude (Opus 4.6)
**Scope:** All Python modules in `/nasus_stack/` — 19 source files, ~450KB of code
**Verdict:** ~65% toward a production-grade agentic tool

---

## Executive Summary

Nasus has a surprisingly well-architected foundation: a central orchestrator with DAG-based planning, a standardized envelope protocol for inter-module communication, a four-layer memory system, real-time SSE streaming, and 9 specialist sub-agents. The bones are solid. What's missing are the muscles and tendons — real tool execution, persistent storage, proper sandboxing, async orchestration, and end-to-end testing. You're closer than most people get at this stage. Here's exactly what's done, what's faked, and what's left.

---

## 1. What's Working Well (Strengths)

### Unified Envelope Protocol
`NasusEnvelope` + `ModuleID` in `nasus_module_registry.py` gives every module a common I/O contract. Status lifecycle (`PENDING → RUNNING → DONE/FAILED`), job IDs, error accumulation, and serialization are all handled consistently. This is a **critical foundation** that many agent projects skip.

### Orchestrator Design (M00/M10)
The orchestrator in `nasus_orchestrator.py` is genuinely well-structured:
- DAG-based stage execution with dependency tracking
- Goal classification (single module / sequential / parallel / hybrid)
- Conflict detection between module outputs
- Scope expansion at runtime (RT-2 refinements)
- Smart LLM-driven routing with confidence-gated fallback to direct chat
- Streaming token output via `_emitter` callback pattern

### Task Planner (M11)
`nasus_task_planner.py` implements proper decomposition: keyword-to-module mapping, ambiguity/complexity/scope classification, and 8 refinement checks (RT-01 through RT-08). The plan revision system supports surgical edits ("skip the research step").

### Memory Manager (M09)
`nasus_memory_manager.py` has a proper four-layer architecture:
- **Episodic** — session history records
- **Semantic** — long-term facts with confidence scores
- **Procedural** — learned patterns with success rates
- **Working** — TTL-based session scratchpad

Cross-layer keyword search, health scoring, and snapshot export all work.

### Sidecar API
`nasus_sidecar/app.py` is production-shaped:
- FastAPI with proper lifespan management
- Async job execution with fire-and-forget pattern
- SSE streaming with per-job queues and sentinel-based cleanup
- Hot-reloadable LLM configuration via `POST /configure`
- Global error handler

### LLM Client
`nasus_sidecar/llm_client.py` is robust:
- Works with any OpenAI-compatible endpoint (OpenRouter, Ollama, LiteLLM)
- Retry with exponential backoff on 429/502/503/504
- JSON mode with schema hints + self-repair retry loop
- Streaming with fallback to non-streaming
- Per-job client injection (no shared mutable state)

---

## 2. What's Partially Done (Gaps)

### 2a. Stub-Heavy Specialist Modules

This is the single biggest gap. Most specialist modules have **schema + routing done** but use hardcoded responses instead of real tool execution:

| Module | Schema | Route | Real Execution | LLM Integration |
|--------|--------|-------|----------------|-----------------|
| M01 Research Analyst | ✅ | ✅ | ⚠️ Real search (Exa/Serper/Brave) + fallback stubs | ✅ Synthesis via LLM |
| M02 API Integrator | ✅ | ✅ | ⚠️ Has real `httpx` calls BUT stub response map for known paths | ❌ No LLM |
| M03 Web Browser | ✅ | ✅ | ⚠️ Real `httpx` scraping + stub fallback library | ❌ No LLM |
| M04 Data Analyst | ✅ | ✅ | ❌ Template-based, no real pandas/stats | ❌ No LLM |
| M05 Code Engineer | ✅ | ✅ | ❌ Returns hardcoded code stubs | ❌ No LLM codegen |
| M06 Content Creator | ✅ | ✅ | ❌ Template string generation | ❌ No LLM |
| M07 Product Strategist | ✅ | ✅ | ❌ Template frameworks | ❌ No LLM |
| M08 Landing Page | ✅ | ✅ | ❌ Template HTML output | ❌ No LLM |

**M01 is the most complete specialist** — it actually hits real search APIs and uses the LLM for synthesis. The others need the same treatment.

### 2b. No Actual Plan Execution Loop

The orchestrator can **build** a DAG plan and **dispatch** individual subtasks, but there's no automated execution loop that:
1. Walks the DAG stage-by-stage
2. Dispatches all subtasks in a parallel stage concurrently
3. Feeds outputs from completed subtasks into dependent ones
4. Handles retries/failures/replanning mid-execution

Right now, the TypeScript frontend or an external caller must manually call `/task` for each step. A real agent executes the full plan autonomously.

### 2c. Memory Is In-Memory Only

`MemoryStore` lives in Python process memory. When the sidecar restarts, all episodic history, semantic facts, and procedural patterns vanish. For a proper agentic tool you need:
- SQLite or file-based persistence (minimum)
- Vector embeddings for semantic search (the current keyword search is a placeholder)
- Cross-session memory loading on startup

### 2d. No File System Operations

None of the modules can actually read/write files on disk. A production agentic tool needs:
- Workspace directory management
- File creation from module outputs (save HTML, code, reports)
- File reading as input context
- Artifact versioning

---

## 3. What's Missing (Critical Gaps for Production)

### 3a. No Sandboxed Code Execution
M05 (Code Engineer) generates code stubs but can't execute them. A real agent needs:
- Subprocess/container execution for generated code
- Timeout and resource limits
- stdout/stderr capture
- Security boundary (no arbitrary system access)

### 3b. No Real Browser Automation
M03 (Web Browser) has basic `httpx` scraping but no JavaScript rendering. For JS-heavy sites you need:
- Playwright or Puppeteer integration
- Cookie/session management
- Screenshot capability
- CAPTCHA/bot-detection handling

### 3c. No Authentication/Secrets Management
API keys are passed in plaintext via `POST /configure` and stored in module-level globals. Need:
- Encrypted secrets store
- Per-module credential scoping
- OAuth flow support for third-party integrations

### 3d. No Rate Limiting or Cost Controls
The sidecar has no:
- Token budget tracking per session
- Cost estimation before LLM calls
- Rate limiting on incoming requests
- Concurrent job limits

### 3e. No Testing Infrastructure
Zero test files in the codebase. Every module has `if __name__ == "__main__": run_demo()` patterns, but no:
- Unit tests
- Integration tests
- Mock LLM for testing
- CI/CD pipeline

### 3f. No Structured Logging
Logging is `self.log.append(string)` in the orchestrator and `print()` in demos. Need:
- Python `logging` module with levels
- Structured JSON logs
- Request tracing (correlation IDs across modules)
- Log persistence

### 3g. CORS is Wide Open
`allow_origins=["*"]` in the sidecar. Fine for local Tauri sidecar, but needs tightening for any networked deployment.

---

## 4. Scorecard

| Dimension | Score | Notes |
|-----------|-------|-------|
| **Architecture & Design** | 8/10 | Envelope protocol, DAG planner, memory layers — well thought out |
| **Module Coverage** | 7/10 | 9 specialist agents + orchestrator + planner + reviewer |
| **Schema & Type Safety** | 8/10 | Dataclasses + enums everywhere, validation functions |
| **LLM Integration** | 6/10 | Client is excellent; only M00/M01 actually use it |
| **Real Tool Execution** | 3/10 | M01 search + M02/M03 partial HTTP; everything else is stubs |
| **Plan Execution** | 4/10 | Can build plans, can't auto-execute them end-to-end |
| **Memory & Persistence** | 5/10 | In-memory four-layer store works; no disk persistence |
| **API / Sidecar** | 8/10 | FastAPI + SSE + async jobs + hot config — production-shaped |
| **Error Handling** | 5/10 | Envelope status tracking works; no structured logging or alerting |
| **Security** | 3/10 | No sandboxing, plaintext secrets, open CORS |
| **Testing** | 1/10 | Demo scripts only, no test suite |
| **Documentation** | 4/10 | Good docstrings, no architecture docs or API docs |

**Overall: ~65/100** — strong foundation, needs real execution and hardening.

---

## 5. Recommended Priority Roadmap

### Phase 1: Make the Agent Actually Do Things (Weeks 1-2)
1. **Wire LLM into M05 (Code Engineer)** — have it generate real code via LLM, not stubs
2. **Wire LLM into M06 (Content Creator)** — real copy generation
3. **Wire LLM into M08 (Landing Page)** — LLM-driven HTML generation
4. **Add file system operations** — save outputs to workspace directory

### Phase 2: Autonomous Execution (Weeks 3-4)
5. **Build the plan execution loop** in the orchestrator — walk the DAG automatically
6. **Add subprocess execution for M05** — run generated code in a sandbox
7. **Persist memory to SQLite** — survive sidecar restarts
8. **Add Playwright to M03** — real browser automation for JS sites

### Phase 3: Production Hardening (Weeks 5-6)
9. **Add pytest suite** — at minimum, test envelope routing, plan decomposition, and memory CRUD
10. **Structured logging** with `logging` module + JSON formatter
11. **Token budget tracking** — estimate and cap LLM costs per session
12. **Secrets management** — encrypted storage, not globals

### Phase 4: Intelligence Upgrades (Weeks 7-8)
13. **Vector embeddings for memory search** — replace keyword scoring with semantic similarity
14. **Multi-turn agent loop** — agent reflects on its output, self-corrects, and iterates
15. **Tool-use protocol** — let the LLM decide which tools to call (function calling / tool use)
16. **Human-in-the-loop checkpoints** — pause for user approval on irreversible actions

---

## 6. Bottom Line

You've built the hardest part — the architecture. The envelope protocol, DAG planner, memory system, and sidecar API are genuinely well-designed. Most people building "AI agents" skip all of this and just chain LLM calls together. You have proper software engineering underneath.

The gap to "fully proper agentic tool" is primarily about **execution**: making the modules actually do real work (LLM calls, file I/O, code execution, browser automation) and making the orchestrator run plans end-to-end without human intervention. That's the difference between a framework and an agent.

You're about 65% there. The remaining 35% is the most visible part — it's what makes it feel like magic to the user — but it's also the most straightforward to build because you already have the infrastructure to hang it on.
