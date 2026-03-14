# Nasus Architectural Refactor — Orchids.app Prompt

## Approach

Run this refactor in **three ordered phases**. Do not send all three phases at once — let each phase build cleanly before starting the next. Each phase is a self-contained orchids.app prompt you paste directly.

### Why three phases?

- **Phase 1** is destructive (deletions, simplifications). It must land first so Phase 2 doesn't build on dead code.
- **Phase 2** is additive (specialist prompt injection to replace Python modules). It needs the clean TS-only foundation.
- **Phase 3** is polish (gateway trimming, memory consolidation). Low risk, can be done last.

---

## PHASE 1 — Remove the Python sidecar and unify execution

> Paste this entire block into orchids.app as one prompt.

---

### PROMPT — PHASE 1

```
I am refactoring a Tauri 2.0 desktop app (React + Rust) called Nasus.
The app has a dual execution path: a Python FastAPI sidecar (primary) and a TypeScript ReAct loop (fallback).
The Python sidecar is less capable than the TS path on every dimension.
This refactor collapses the architecture to a single TS-only execution path.

---

## DELETIONS — Remove these entirely

### Python sidecar process and all modules
- Delete the entire `nasus_sidecar/` directory and all its contents
- Delete `nasus_orchestrator.py`
- Delete `nasus_module_registry.py`
- Delete all specialist module files: `nasus_research_analyst.py`, `nasus_api_integrator.py`,
  `nasus_web_browser.py`, `nasus_data_analyst.py`, `nasus_code_engineer.py`,
  `nasus_content_creator.py`, `nasus_product_strategist.py`, `nasus_landing_page.py`,
  `nasus_memory_manager.py`
- Delete all associated schema files (the 9 Pydantic schema files for M01–M09)

### Rust sidecar manager
- Delete `src-tauri/src/python_sidecar.rs`
- Remove the `python_sidecar` module from `src-tauri/src/lib.rs`
- Remove any Tauri commands related to starting, stopping, or pinging the Python sidecar process

### TS sidecar integration layer
- Delete `src/agent/bridge/sidecarMemoryBridge.ts` (or wherever it lives)
- Delete the `call_nasus_agent` tool file from `src/agent/tools/`
- Remove `call_nasus_agent` from the tool registry in `src/agent/tools/core/ToolRegistry.ts`

### Gateway rate limiter
- Delete `src/agent/gateway/rateLimiter.ts`
- Remove all imports and usages of the rate limiter from `gatewayService.ts` and `llm.ts`

---

## MODIFICATIONS — Simplify these files

### `src/agent/Orchestrator.ts` (AgentOrchestrator)
Collapse to a single execution path. Remove:
- `checkSidecar()` method and the `:4751` health ping
- `configureSidecar()` method (API key/model sync to Python)
- `runViaSidecar()` method and all SSE stream consumption logic (`consumeJobStream()`, event mapping)
- The `_isSidecarReady` flag and all branching logic on it
- The `nasusStackEnabled` setting check that routes to sidecar vs TS

The resulting `processTask()` method should be a straight line:
```typescript
async processTask(params) {
  const plan = await this.planningAgent.generatePlan(params)
  await this.executionAgent.execute(params, plan)
}
```

### `src/agent/gateway/gatewayService.ts`
- Remove all references to `rateLimiter`
- Remove Vercel AI Gateway type if it is not being actively used (keep OpenRouter, LiteLLM, Ollama, Direct, Custom)

### `src-tauri/src/gateway.rs`
- Remove the full circuit breaker implementation (consecutive failure counters, state machine, open/half-open/closed transitions)
- Replace with a simple health cache: store last N request outcomes per gateway, expose a `get_gateway_health()` Tauri command that returns success rate. Let the TS layer make routing decisions.
- Keep: health event recording, the `record_gateway_result()` command, basic failover ordering by priority

### `src/store/` (Zustand slices)
- Remove any store slices or state related to: sidecar status, sidecar job tracking, checkpoint approval (if it was sidecar-only HITL), Python module routing
- Keep: tasks, messages, rawHistory, gateway config, model registry, settings, workspace files, plan state

### `src/components/`
- Remove any UI components that exist solely to display sidecar status or manage sidecar jobs (e.g. a sidecar health indicator, job stream panel, Python module selector)
- Keep all other components intact

---

## DO NOT CHANGE

- `ReactLoop.ts` — do not touch this file
- `ExecutionAgent.ts` — do not touch this file
- `PlanningAgent.ts` — do not touch this file
- `VerificationAgent.ts` — do not touch this file
- `src-tauri/src/sidecar.rs` — this is the BROWSER EXTENSION WebSocket server, not the Python sidecar. Keep it.
- `src-tauri/src/docker.rs` — keep intact
- All 30 tools in the tool registry except `call_nasus_agent`
- `SqliteMemoryStore.ts`, `LocalMemoryStore.ts`, `transformersEmbedding.ts`
- `WorkspaceManager.ts`
- `src/agent/gateway/healthMiddleware.ts`
- `src/agent/gateway/modelRegistry.ts`
- `src/agent/llm.ts`

---

## VERIFICATION

After applying changes:
1. Run `npx tsc -b` — zero type errors required before proceeding
2. Run `npm run lint` — zero lint errors
3. Confirm `processTask()` in Orchestrator.ts has no sidecar branch
4. Confirm no file imports from the deleted sidecar files
5. Confirm `call_nasus_agent` does not appear in the tool registry definitions
```

---

## PHASE 2 — Replace Python modules with specialist prompt injection

> Only run this after Phase 1 compiles cleanly.

---

### PROMPT — PHASE 2

```
Nasus is a Tauri 2.0 desktop agent. The Python sidecar has been removed.
The TypeScript ReactLoop is now the single execution path.

Previously, the Python sidecar routed tasks to specialist modules (M01–M09) like a research analyst,
code engineer, content creator, etc. We are replacing this pattern with specialist system prompt injection
inside the existing PlanningAgent and ExecutionAgent — no new processes, no HTTP, no separate modules.

---

## ADD — Specialist prompt contexts

### Create `src/agent/prompts/specialistContexts.ts`

This file exports a map of task domain → system prompt suffix that can be injected into the LLM
context when the planner detects a domain match.

```typescript
export type SpecialistDomain =
  | 'research'
  | 'code'
  | 'data_analysis'
  | 'content'
  | 'browser_automation'
  | 'api_integration'
  | 'product_strategy'
  | 'landing_page'
  | 'general'

export const SPECIALIST_CONTEXTS: Record<SpecialistDomain, string> = {
  research: `
You are operating in research mode. Prioritize: search_web, http_fetch, browser_navigate.
Cross-reference at least 3 sources before drawing conclusions.
Save intermediate findings to files in the workspace using write_file.
Cite sources in your final output.`,

  code: `
You are operating in code engineering mode. Prioritize: bash_execute, python_execute, write_file, edit_file, git.
Always read existing files before editing. Run linters and tests after changes.
Write modular, well-commented code. Handle errors explicitly.`,

  data_analysis: `
You are operating in data analysis mode. Prioritize: python_execute (pandas, matplotlib, seaborn), write_file.
Load data files, inspect schemas first, then analyze. Save charts and results to the workspace.
Provide statistical summaries alongside visualizations.`,

  content: `
You are operating in content creation mode.
Write clearly and concisely for the specified audience and format.
Save all drafts to the workspace using write_file.
Offer a primary version and one alternative if the task is ambiguous.`,

  browser_automation: `
You are operating in browser automation mode. Prioritize: browser_navigate, browser_click, browser_type,
browser_extract, browser_screenshot, browser_aria_snapshot.
Take a screenshot at each major step. Use aria snapshots before clicking to confirm element existence.`,

  api_integration: `
You are operating in API integration mode. Prioritize: http_fetch, bash_execute.
Read API documentation via browser or fetch before making calls.
Handle auth headers, pagination, and rate limits explicitly. Log request/response pairs.`,

  product_strategy: `
You are operating in product strategy mode.
Structure outputs as: Problem → Users → Goals → Solution → Risks → Next Steps.
Be direct and specific. Avoid generic frameworks. Tailor advice to the actual codebase context.`,

  landing_page: `
You are operating in landing page generation mode. Prioritize: write_file, serve_preview.
Generate a single self-contained HTML file with embedded CSS and JS.
Use semantic HTML5, mobile-responsive layout, and a clear CTA. Save to workspace and serve preview.`,

  general: '',
}
```

### Modify `src/agent/agents/PlanningAgent.ts`

Add a `detectDomain()` private method that inspects the task string and returns a `SpecialistDomain`.
Use simple keyword heuristics (no LLM call needed for this):

```typescript
private detectDomain(task: string): SpecialistDomain {
  const t = task.toLowerCase()
  if (/\b(research|find|search|investigate|compare|survey|sources)\b/.test(t)) return 'research'
  if (/\b(code|implement|build|debug|refactor|write.*function|fix.*bug|test)\b/.test(t)) return 'code'
  if (/\b(analyze|data|csv|chart|plot|graph|pandas|statistics|dataset)\b/.test(t)) return 'data_analysis'
  if (/\b(write|draft|blog|email|copy|content|article|post|social)\b/.test(t)) return 'content'
  if (/\b(browser|scrape|click|navigate|fill.*form|automate.*web)\b/.test(t)) return 'browser_automation'
  if (/\b(api|endpoint|rest|graphql|webhook|integration|fetch)\b/.test(t)) return 'api_integration'
  if (/\b(product|strategy|roadmap|prd|feature|prioritize|stakeholder)\b/.test(t)) return 'product_strategy'
  if (/\b(landing page|html.*page|website|web page|homepage)\b/.test(t)) return 'landing_page'
  return 'general'
}
```

In `generatePlan()`, detect the domain and attach it to the returned `ExecutionPlan` as a `specialistDomain` field.

### Modify `src/agent/agents/ExecutionAgent.ts`

When constructing the system prompt for the ReactLoop, read `plan.specialistDomain` and append
`SPECIALIST_CONTEXTS[plan.specialistDomain]` to the base system prompt before the first LLM call.

---

## VERIFICATION

1. Run `npx tsc -b` — zero errors
2. Run `npm run lint`
3. Manually test: submit a task containing "research" — confirm specialistDomain === 'research' in plan
4. Confirm the specialist context string appears in the first LLM message sent by ExecutionAgent
```

---

## PHASE 3 — Memory consolidation and gateway cleanup

> Only run this after Phase 2 compiles cleanly.

---

### PROMPT — PHASE 3

```
Nasus is a Tauri 2.0 desktop agent. Phases 1 and 2 of a refactor are complete.
This phase consolidates the memory system and cleans up the gateway layer.

---

## MEMORY — Consolidate to single SQLite path

### Goal
Remove the `LocalMemoryStore.ts` fallback as a separate class. Instead, `SqliteMemoryStore.ts`
should handle its own in-memory fallback internally if the Tauri backend is unavailable.

### Modify `src/agent/memory/SqliteMemoryStore.ts`
- Add an internal `Map<string, Memory>` as a fallback cache
- If a Tauri command call fails (backend unavailable), fall back to the in-memory map silently
- Log a warning to console when falling back, but do not throw
- Expose the same interface as before — callers should not need to know which backend is active

### Delete `src/agent/memory/LocalMemoryStore.ts`
- Remove the file
- Remove all imports of `LocalMemoryStore` from any file that used it
- Update the memory factory/provider to instantiate only `SqliteMemoryStore`

### `src/agent/memory/sidecarMemoryBridge.ts`
- Should already be deleted from Phase 1. Confirm it is gone.

---

## GATEWAY — Merge model registries

### Merge `src/agent/gateway/vercelModelRegistry.ts` into `src/agent/gateway/modelRegistry.ts`
- Copy all model entries from `vercelModelRegistry.ts` into the main registry
- Tag Vercel-specific models with a `gateway: 'vercel'` field if not already tagged
- Delete `vercelModelRegistry.ts`
- Update all imports across the codebase to point to `modelRegistry.ts`

### Confirm `rateLimiter.ts` is gone (Phase 1)
- If any dead import references remain, remove them now

---

## FINAL VERIFICATION

1. Run `npx tsc -b` — zero errors
2. Run `npm run lint` — zero errors
3. Run `npm run build` — clean production build
4. Confirm the file tree contains NO references to:
   - `sidecar` in Python context (grep for `python_sidecar`, `nasus_sidecar`, `app.py`)
   - `LocalMemoryStore`
   - `vercelModelRegistry`
   - `rateLimiter`
   - `call_nasus_agent`
   - `runViaSidecar`
   - `checkSidecar`
   - `consumeJobStream`
5. Confirm `src/agent/Orchestrator.ts` `processTask()` is a straight-line function with no branching on sidecar state
```

---

## Summary of What Survives

| Layer | Status | Notes |
|---|---|---|
| `ReactLoop.ts` | ✅ Keep | Single execution path, untouched |
| `ExecutionAgent.ts` | ✅ Keep | Untouched |
| `PlanningAgent.ts` | ✅ Modified | Adds domain detection |
| `VerificationAgent.ts` | ✅ Keep | Untouched |
| All 29 tools (minus call_nasus_agent) | ✅ Keep | Full tool registry intact |
| `SqliteMemoryStore.ts` | ✅ Modified | Internal fallback added |
| `WorkspaceManager.ts` | ✅ Keep | Untouched |
| `src-tauri/src/sidecar.rs` | ✅ Keep | Browser extension WS, not Python |
| `src-tauri/src/docker.rs` | ✅ Keep | Untouched |
| `src/agent/gateway/` (3 files) | ✅ Keep | healthMiddleware, modelRegistry, gatewayService |
| `src/agent/llm.ts` | ✅ Keep | Untouched |
| Python sidecar (~5,000 lines) | ❌ Deleted | Entire nasus_sidecar/ + orchestrator |
| `python_sidecar.rs` | ❌ Deleted | Rust process manager |
| `sidecarMemoryBridge.ts` | ❌ Deleted | |
| `call_nasus_agent` tool | ❌ Deleted | |
| `rateLimiter.ts` | ❌ Deleted | |
| `vercelModelRegistry.ts` | ❌ Deleted | Merged into modelRegistry |
| `LocalMemoryStore.ts` | ❌ Deleted | Folded into SqliteMemoryStore |
| Rust circuit breaker in gateway.rs | ❌ Deleted | Simplified to health cache |
| `specialistContexts.ts` | 🆕 Added | Domain prompt injection |

**Net result**: ~5,500 lines deleted, ~150 lines added, single clean execution path.
