# NASUS — Full Codebase Audit Report (v2)

**Date**: 2026-03-07
**Stack**: React 19, TypeScript 5.9, Vite 7, Zustand 5, Tailwind v4, Vercel AI SDK v6.0.111, Tauri 2.9.5

---

## STATUS SUMMARY

- **Critical path (message → response)**: BROKEN at `llm.ts:241` — streaming text is garbled (`"undefinedundefined..."` rendered to UI). Tool calls still work. Planning works (uses raw fetch, not SDK streaming).
- **Tool execution**: PARTIALLY BROKEN — 29/32 tools functional. 3 browser tools (`browser_get_tabs`, `browser_eval`, `browser_select`) call non-existent Rust commands. System prompt still advertises them to the LLM.
- **Provider config**: WORKS — API keys flow through gateway → store → SDK providers. Gateway initialization on startup confirmed. Cold-start race condition handled by polling.
- **UI rendering**: WORKS (when data is correct) — streaming, tool cards, error banners, finish states all wired. But they'll display garbled "undefined" text from the broken streaming.
- **Build health**: BROKEN — 50 TypeScript errors. `tsc -b` fails. Vite builds succeed (esbuild ignores types).
- **Rust backend**: MOSTLY WORKS — 57 commands registered. `run_agent` / `stop_agent` are silently short-circuited in `tauriInvoke` (never reach Rust). 3 browser commands missing.

---

## BLOCKING ISSUES (must fix before anything else)

### 1. `llm.ts:241-242` — Streaming text uses wrong property name
**Severity**: CRITICAL — The app is completely unusable
**File**: `src/agent/llm.ts` lines 241-242
**Evidence**: AI SDK v6.0.111's `fullStream` emits `text-delta` chunks as `{ type: "text-delta", text: "..." }`. Confirmed in `node_modules/ai/dist/index.mjs` line 7240:
```js
controller.enqueue({ type: "text-delta", id: chunk.id, text: chunk.delta, providerMetadata: chunk.providerMetadata });
```
Code uses `chunk.textDelta` (undefined at runtime). Result: `fullContent` accumulates `"undefinedundefined..."` and `cb.onDelta(undefined)` passes `undefined` → store's `appendChunk` concatenates `"" + undefined` = literal string `"undefined"`.
**Fix**: `chunk.textDelta` → `chunk.text` on lines 241-242.

### 2. `llm.ts:243` — Reasoning chunk type doesn't exist on fullStream
**Severity**: HIGH — DeepSeek R1 reasoning tokens silently dropped
**File**: `src/agent/llm.ts` line 243
**Evidence**: Code checks `chunk.type === 'reasoning'` but SDK v6 emits `'reasoning-delta'` (confirmed in `index.mjs` line 7260). The `'reasoning'` type existed in AI SDK v4 but was renamed in v5+.
Also at line 245: `(chunk as any).textDelta` — same issue, reasoning chunks use `.text` not `.textDelta`.
**Fix**: `chunk.type === 'reasoning'` → `chunk.type === 'reasoning-delta'`, and `(chunk as any).textDelta` → `chunk.text`.

### 3. `llm.ts:250` — `'provider-defined'` chunk type doesn't exist on fullStream
**Severity**: LOW — fallback path for reasoning that never fires
**File**: `src/agent/llm.ts` line 250
**Evidence**: `'provider-defined'` is not in SDK v6's fullStream union type. Dead code path.
**Fix**: Remove the entire `else if (chunk.type === 'provider-defined')` block (lines 250-256), or replace with actual SDK v6 reasoning types if needed.

### 4. Three browser tools call non-existent Rust commands
**Severity**: HIGH — LLM will call these, waste iterations, trigger 3-strike escalation
**Files**: Tool implementations call `tauriInvoke('browser_get_tabs')`, `tauriInvoke('browser_eval')`, `tauriInvoke('browser_select')` — none registered in `src-tauri/src/lib.rs` `generate_handler!`.
**Compounded by**: `ExecutionAgent.ts:782` lists all three in the environment summary sent to the LLM as system prompt, guaranteeing the model will try to use them.
**Fix**: Either (a) implement the 3 commands in Rust, or (b) remove the 3 tool registrations from `src/agent/tools/index.ts` AND remove them from the env summary at `ExecutionAgent.ts:782`.

### 5. `e2bRuntime.ts` imports deleted package
**Severity**: MEDIUM — Causes TS error, file is dead code
**File**: `src/agent/e2bRuntime.ts:34` — `import { CodeInterpreter } from '@e2b/code-interpreter'`
**Fix**: Delete `src/agent/e2bRuntime.ts`.

### 6. `AstAnalyzer.ts` — 15 type errors from web-tree-sitter
**Severity**: MEDIUM — Blocks clean TS build
**File**: `src/agent/AstAnalyzer.ts` lines 73,111,139,142,250,253,263,269,272,277,299,301,356,360,361
**Fix**: Add a `src/types/web-tree-sitter.d.ts` module declaration overriding the broken types.

### 7. `TraceLogger.ts` — enum syntax rejected by `erasableSyntaxOnly`
**Severity**: MEDIUM — Blocks clean TS build
**File**: `src/agent/TraceLogger.ts:22-25`
**Fix**: Convert enum to `const LogLevel = { DEBUG: 'debug', ... } as const`.

### 8. `useVoiceInput.ts` — SpeechRecognition types missing
**Severity**: MEDIUM — Blocks clean TS build, voice input won't compile
**File**: `src/hooks/useVoiceInput.ts:40,41,45,53,87,105`
**Fix**: Add `src/types/speech.d.ts` with SpeechRecognition interface declarations.

---

## HIGH PRIORITY (fix after blockers)

### 9. `VerificationAgent.ts:305` — `VerificationContext` missing `taskId`
**File**: `src/agent/agents/VerificationAgent.ts:305`
**Fix**: Add `taskId: string` to the `VerificationContext` interface. Currently the type check fails, and verification may use undefined taskId at runtime.

### 10. `GatewayHealth` type missing UI-expected properties
**Files**: `src/components/ChatHeader.tsx:191` uses `.requestCount`, `src/components/ContextPanel.tsx:570` uses `.id`
**Type**: `src/agent/gateway/gatewayTypes.ts:89-101` — has neither property
**Fix**: Add `requestCount?: number` to GatewayHealth. Change `.id` references to `.gatewayId`.

### 11. `FileParser.ts` — missing types for papaparse and pdfjs-dist
**File**: `src/agent/FileParser.ts:67,83,86`
**Fix**: `npm install --save-dev @types/papaparse`, cast pdfjs TextItem.

### 12. `transformersEmbedding.ts` — possibly undefined WASM env
**File**: `src/agent/memory/transformersEmbedding.ts:24,28`
**Fix**: Add null guards or non-null assertions.

### 13. Unused variables across 5 files (12 warnings)
**Files**: ChatView.tsx, ExecutionAgent.ts, ChatHeader.tsx, OutputPanel.tsx, ContextPanel.tsx, iconRegistry.ts
**Fix**: Remove unused destructures/imports or prefix with `_`.

### 14. `tauriInvoke` silently no-ops `run_agent` and `stop_agent`
**File**: `src/tauri.ts:22-24`
**Impact**: ChatView.tsx lines 349-374 builds an elaborate params object for `run_agent` that is immediately discarded. The Rust backend never tracks active tasks. `stop_agent` at ChatView:617 also does nothing on the Rust side.
**Fix**: Either remove the `tauriInvoke('run_agent', ...)` call entirely from ChatView, or remove the short-circuit in tauri.ts and let it reach Rust (adding the missing params to the Rust function signature).

---

## NICE TO HAVE (fix after high priority)

### 15. Dead code files
- `src/agent/e2bRuntime.ts` — imports non-existent `@e2b/code-interpreter`, zero importers
- `src/agent/pythonRuntime.ts` — Pyodide WASM removed per CLAUDE.md, zero importers

### 16. Double gateway resolution
`PlanningAgent.ts:71-72` resolves connection, then `chatJsonViaGateway()` resolves again. Minor perf waste.

### 17. `buildEnvSummary` lists broken browser tools
`ExecutionAgent.ts:782` advertises `browser_eval`, `browser_select`, `browser_get_tabs` in the system prompt even though they can't execute. Separate from issue #4 — even after removing the tool registrations, the env summary hardcodes these names.

---

## DETAILED CRITICAL PATH TRACE

### Step-by-step flow with verdict per link:

| Step | File:Line | What happens | Verdict |
|------|-----------|-------------|---------|
| 1. User presses Enter | `UserInputArea.tsx:86` | `handleSend()` → `onSend(trimmed)` | ✅ WORKS |
| 2. ChatView receives | `ChatView.tsx:879` | `handleSend(content)` called | ✅ WORKS |
| 3. Gateway config check | `ChatView.tsx:442-454` | Polls `gatewayConfigReady` up to 3s | ✅ WORKS |
| 4. API key validation | `ChatView.tsx:460-470` | `resolveConnection()` gets key from gateway slice | ✅ WORKS |
| 5. User message added | `ChatView.tsx:510` | `addMessage(task.id, userMsg)` | ✅ WORKS |
| 6. Agent message created | `ChatView.tsx:549-558` | Empty streaming message added to UI | ✅ WORKS |
| 7. `tauriInvoke('run_agent')` | `ChatView.tsx:349` | **Silently returns undefined** (tauri.ts:22-24) | ⚠️ NO-OP |
| 8. `runWebAgent()` called | `ChatView.tsx:377` | Passes params to agent/index.ts | ✅ WORKS |
| 9. Short msg detection | `agent/index.ts:66-68` | <80 chars or follow-up → skipPlanning=true | ✅ WORKS |
| 10. `processTaskWithOrchestrator()` | `agent/index.ts:70` | Enters Orchestrator | ✅ WORKS |
| 11. `generatePlan()` | `Orchestrator.ts:93` → `PlanningAgent.ts:86` | `chatJsonViaGateway()` → raw fetch → works | ✅ WORKS |
| 12. Auto-approve simple | `Orchestrator.ts:96-100` | ≤2 phases, ≤3 steps → auto-approve | ✅ WORKS |
| 13. Plan UI + approval | `Orchestrator.ts:103-114` | CustomEvent dispatch → store → PlanView button → event listener resolves | ✅ WORKS |
| 14. `executeWithPlan()` | `Orchestrator.ts:157` | Augments last user msg with plan, calls `executionAgent.execute()` | ✅ WORKS |
| 15. `doExecute()` → `executeOnce()` | `ExecutionAgent.ts:160` | Builds context, enters ReAct loop | ✅ WORKS |
| 16. `callLLM()` | `ExecutionAgent.ts:307` → `llm.ts:94` | `streamCompletion()` creates SDK model, calls `streamText()` | ✅ WORKS |
| 17. **Stream consumption** | `llm.ts:239-257` | `for await (chunk of fullStream)` — uses `chunk.textDelta` (undefined) | ❌ **BROKEN** |
| 18. Tool call extraction | `llm.ts:261` | `await toolCalls` — separate SDK promise, works independently | ✅ WORKS |
| 19. `emitChunk()` → `appendChunk()` | `ExecutionAgent.ts:1043` → `store.ts:405` | Pushes `undefined` as delta → UI shows "undefined" | ❌ **GARBLED** |
| 20. Tool dispatch | `ExecutionAgent.ts:703` | `executeRegistryTool()` — works for 29/32 tools | ⚠️ PARTIAL |
| 21. Tool result → messages | `ExecutionAgent.ts:743` | Pushed to messages array → next LLM iteration sees it | ✅ WORKS |
| 22. Loop termination | `ExecutionAgent.ts:352-361` | `finishReason === 'stop'` or `toolCalls.length === 0` → done | ✅ WORKS |
| 23. UI streaming stops | `ChatView.tsx:415-417` | `runningRef.current = false` in finally block | ✅ WORKS |

### Summary
**19 of 23 steps work.** The critical path is wired end-to-end, but step 17 (stream consumption) is broken, which corrupts step 19 (UI display). Tool calls (step 18) still work via a separate SDK promise, so the ReAct loop can execute tools — but the user sees garbled text instead of the agent's reasoning.

**Net effect**: The agent can plan, call tools, and complete tasks. But every text response displayed to the user reads as "undefinedundefinedundefined..." instead of the actual LLM output.

---

## RECOMMENDED FIX ORDER

| Step | Task | File(s) | Est. Time |
|------|------|---------|-----------|
| 1 | **Fix streaming**: `chunk.textDelta` → `chunk.text`, `'reasoning'` → `'reasoning-delta'` | `src/agent/llm.ts:241-257` | 5 min |
| 2 | Delete dead code: `e2bRuntime.ts`, `pythonRuntime.ts` | 2 files | 2 min |
| 3 | Remove 3 broken browser tools from registry + env summary | `src/agent/tools/index.ts`, `ExecutionAgent.ts:782` | 10 min |
| 4 | Fix `TraceLogger.ts` enum → `as const` object | `src/agent/TraceLogger.ts` | 5 min |
| 5 | Add `web-tree-sitter.d.ts` declaration file | new `.d.ts` file | 10 min |
| 6 | Add `speech.d.ts` for SpeechRecognition types | new `.d.ts` file | 5 min |
| 7 | Fix `VerificationContext` — add `taskId` | `src/agent/agents/VerificationAgent.ts` | 2 min |
| 8 | Fix `GatewayHealth` — add `requestCount`, fix `.id` → `.gatewayId` | `gatewayTypes.ts` + components | 5 min |
| 9 | Install `@types/papaparse`, fix pdfjs cast | `package.json`, `FileParser.ts` | 3 min |
| 10 | Fix `transformersEmbedding.ts` null guards | `transformersEmbedding.ts` | 2 min |
| 11 | Remove unused variables (12 warnings across 6 files) | 6 files | 5 min |
| 12 | Remove dead `tauriInvoke('run_agent')` call or fix short-circuit | `ChatView.tsx` or `tauri.ts` | 5 min |
| 13 | Run `npx tsc -b --noEmit` to verify 0 errors | — | 1 min |

**Total**: ~60 minutes. Step 1 alone makes the app usable.

---

## FILES THAT CAN BE SAFELY DELETED

- `src/agent/e2bRuntime.ts` — imports non-existent `@e2b/code-interpreter`; zero importers
- `src/agent/pythonRuntime.ts` — Pyodide WASM removed; zero importers
