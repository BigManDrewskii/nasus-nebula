# Orchids.app Prompt — Rounds F–J

## Context

This is a Tauri 2.0 desktop AI agent app (React + TypeScript + Rust). Five earlier rounds (A–E) hardened startup degradation, storage transactions, tool contract enforcement, memory/resource leaks, and the gateway layer. All previously introduced fixes pass `npx tsc --noEmit` cleanly.

The remaining work covers five areas:
- **F** — Fix three pre-existing `ReactLoop.test.ts` failures (mock gap)
- **G** — Audit + fix bugs in `PlanningAgent.ts` and `VerificationAgent.ts`, add tests
- **H** — Audit + fix bugs in the `ExecutionAgent` verification/self-correction cycle, add tests
- **I** — Fix the `WorkspaceManager.test.ts` `slugify('')` mismatch
- **J** — Verify `npx tsc --noEmit` still passes after all changes

Work through all rounds sequentially. After each round confirm the fix compiles and the target tests pass before moving to the next.

---

## Round F — ReactLoop test failures (3 tests, `src/agent/execution/ReactLoop.test.ts`)

### Root cause

The three failing tests are:
- `"returns complete when LLM returns stop with no tool calls and no workspace"`
- `"returns complete when the "complete" tool is called"`
- `"prefixes error tool output with [ERROR] in executionOutputBuffer"`

All three fail with `status: 'error'` instead of the expected `status: 'complete'`.

**Trace:**
`ReactLoop.callLLM` calls `store.getGatewayService().callWithFailover(...)`. The existing Vitest store mock (in the test file) does **not** include `getGatewayService`, so `store.getGatewayService()` is `undefined` and accessing `.callWithFailover` throws a `TypeError`. `callLLM` catches all errors, and since the error is not a "permanent LLM error" (`_isPermanentLlmError` returns false for TypeError), it returns `null`. Back in `run()`, `llmResult` is `null`. The `hasKey` check (`store.gateways?.some(...)`) also evaluates to `false` because `gateways` is absent from the mock, so `run()` returns `done('error', 'No API key configured...')`.

### Fix — update the store mock inside `ReactLoop.test.ts`

Add `gateways` and `getGatewayService` to the `useAppStore.getState` return value:

```typescript
// Inside the vi.mock('../../store', ...) factory, add to the getState return object:
gateways: [{ id: 'gw-1', enabled: true, apiKey: 'sk-test' }],
getGatewayService: vi.fn(() => ({
  callWithFailover: async (
    fn: (apiBase: string, apiKey: string, extraHeaders: Record<string, string>) => Promise<unknown>,
  ) => {
    const result = await fn('https://api.openai.com/v1', 'sk-test', {})
    return { result }
  },
})),
```

With this fix `callLLM` will call `streamCompletion` (which is already mocked at `'../llm'`), and the three tests will get the mocked `LlmResponse` they set up.

---

## Round G — PlanningAgent + VerificationAgent bugs

### G1 — Wrong Anthropic model string in `PlanningAgent.ts` (line ~145)

**File:** `src/agent/agents/PlanningAgent.ts`

**Bug:** When `conn.provider === 'anthropic'`, the fallback model resolves to the bare string `'claude-haiku-4-5'`. The Anthropic API requires the full versioned model string `'claude-haiku-4-5-20251001'`. Sending `'claude-haiku-4-5'` returns HTTP 404.

**Fix:** Change the fallback:
```typescript
// Before
planModel = (fast?.ids['anthropic']) ?? 'claude-haiku-4-5'
// After
planModel = (fast?.ids['anthropic']) ?? 'claude-haiku-4-5-20251001'
```

### G2 — VerificationAgent `analyzeWithLLM` uses OpenRouter slug as universal fallback (`src/agent/agents/VerificationAgent.ts`, ~line 438)

**Bug:** `verifyModel` resolution only guards for `deepseek`. For all other providers (anthropic, ollama, litellm, custom) it falls back to `'anthropic/claude-3-haiku'` — an OpenRouter-only slug. Sending this model ID to a direct Anthropic or Ollama gateway returns HTTP 404.

**Fix:** Mirror the full provider guard from `PlanningAgent.autoTitle`:
```typescript
let verifyModel: string
if (conn.provider === 'deepseek') {
  verifyModel = 'deepseek-chat'
} else if (conn.provider === 'anthropic') {
  verifyModel = 'claude-haiku-4-5-20251001'
} else if (conn.provider === 'ollama') {
  verifyModel = conn.model || 'llama3.3:70b'
} else {
  verifyModel = store.openRouterModels.length > 0
    ? cheapestModel(store.openRouterModels)
    : 'anthropic/claude-haiku-4-5'
}
```

### G3 — VerificationAgent `callWithStructuredOutput` sends wrong auth header for Anthropic (`src/agent/agents/VerificationAgent.ts`, ~line 492)

**Bug:** `VerificationAgent.callWithStructuredOutput` always builds `Authorization: Bearer <key>` headers regardless of provider. PlanningAgent already handles the Anthropic case (`x-api-key` + `anthropic-version`). VerificationAgent does not — direct Anthropic API calls return HTTP 401.

**Fix:** Add the same Anthropic header guard that exists in `PlanningAgent.callWithStructuredOutput`:
```typescript
const headers: Record<string, string> = { 'Content-Type': 'application/json' }
if ((conn.apiBase ?? '').includes('api.anthropic.com')) {
  headers['x-api-key'] = conn.apiKey
  headers['anthropic-version'] = '2023-06-01'
} else {
  headers['Authorization'] = `Bearer ${conn.apiKey}`
}
Object.assign(headers, conn.extraHeaders ?? {})
```

Also add `anthropic` to `noToolChoice` guard in `VerificationAgent.callWithStructuredOutput` (line ~486) so the header fix is never even reached on the Anthropic native API:
```typescript
const noToolChoice = conn.provider === 'ollama' || conn.provider === 'deepseek' || conn.provider === 'anthropic'
```

### G4 — `validatePlan` silent catch swallows all parse errors with no logging (`src/agent/agents/PlanningAgent.ts`, ~line 389)

**Bug:** The `catch` block in `validatePlan` silently returns a 1-step fallback plan, so malformed responses from the LLM are invisible. Users never know planning degraded.

**Fix:** Add a `log.warn` before returning the fallback:
```typescript
} catch (err) {
  log.warn('validatePlan: falling back to single-step plan', err instanceof Error ? err : new Error(String(err)))
  return { /* existing fallback plan */ }
}
```

### G5 — Write `src/agent/agents/PlanningAgent.test.ts`

Test the following behaviours (all pure/synchronous, no network):

1. **`validatePlan` happy path** — given a valid `parsed` object with 2 phases and 3 steps, returns an `ExecutionPlan` with correct `estimatedSteps = 3` and both phases present.
2. **`validatePlan` empty phases** — `parsed = { title: 'T', description: 'D', phases: [] }` returns fallback single-step plan.
3. **`validatePlan` malformed phases** — `parsed = { phases: 'not-an-array' }` triggers the catch and returns fallback.
4. **`detectDomain`** — via `isSimplePlan`: `'research the latest trends'` → `research`, `'build a react component'` → `code`, `'analyze this csv'` → `data_analysis`. Access via the exported `isSimplePlan` function or by calling `generatePlan` with a mocked gateway — prefer testing `validatePlan` and `detectDomain` directly by making them package-private or exporting for test only. If they are private, test via the `generatePlan` fallback path.
5. **`isSimplePlan` (exported)** — plan with 1 phase/2 steps and only `['search_web']` tools → `true`. Plan with `['bash_execute']` → `false`. Plan with 3 phases → `false`.

Mock the following for this file:
- `'../../store'` → `useAppStore.getState` returning minimal store with `resolveConnection: () => ({ provider: 'openai', apiBase: 'https://api.openai.com/v1', apiKey: 'sk-test', model: 'gpt-4o', extraHeaders: {} })`, `openRouterModels: []`, `model: 'gpt-4o'`
- `'../llm'` → `chatJsonViaGateway: vi.fn(() => Promise.resolve(null))`, `cheapestModel: vi.fn(() => 'gpt-4o-mini')`
- `'../memory/SqliteMemoryStore'` → `memoryStore: { retrieveContext: vi.fn(() => Promise.resolve({ memories: [], context: '' })) }`
- `'../gateway/modelRegistry'` → `getModelsForGateway: vi.fn(() => [])`

### G6 — Write `src/agent/agents/VerificationAgent.test.ts`

Test the following:

1. **`runChecklist` — filesCreated false** — `createdFiles` contains an entry with empty `content` → `checklist.filesCreated = false`.
2. **`runChecklist` — syntaxValid false for truncated content** — a `.ts` file whose last 5 lines contain `// ...` → `checklist.syntaxValid = false`.
3. **`runChecklist` — planCompliant true when no workspace** — `taskId` has no workspace entry → returns `true` (optimistic default).
4. **`runChecklist` — errorsResolved false** — `executionOutput` contains `'Error:'` → `false`.
5. **`isPassed` — passes when no errors** — empty issues + all checklist true → `passed = true`.
6. **`isPassed` — fails when syntaxValid=false** — `checklist.syntaxValid = false` even with empty issues → `passed = false`.
7. **`calculateConfidence`** — full pass → `1.0`. One error issue → `< 0.9`. `syntaxValid=false` + one error → `< 0.5`.
8. **`verifyExecution` (exported convenience)** — quick mode: does not call `analyzeWithLLM` (LLM mock must NOT be called). Full mode with no issues: returns `{ passed: true }`.

For testing private methods, call them via `verifyExecution`/`verifyPhaseGate` with appropriate inputs. Mock:
- `'../../store'` (same as G5 mock)
- `'../workspace/WorkspaceManager'` → `workspaceManager: { getWorkspaceSync: vi.fn(() => null) }`
- `'../llm'` → `chatOnceViaGateway: vi.fn(() => Promise.resolve('{"issues":[]}'))`, `cheapestModel: vi.fn(() => 'gpt-4o-mini')`

---

## Round H — ExecutionAgent verification/self-correction bugs

### H1 — `executeWithSelfCorrection` returns `AgentState.ERROR` but `executeWithVerification` returns `AgentState.FINISHED` for the same "max attempts reached" condition (`src/agent/agents/ExecutionAgent.ts`, ~lines 390–397)

**Bug:** When the correction attempt cap is hit inside `executeWithSelfCorrection`, it returns `{ state: AgentState.ERROR, done: true }`. But when the cap is hit inside `executeWithVerification` (~line 350), it returns `{ state: AgentState.FINISHED, done: true }`. The caller (`Orchestrator` or UI) can't distinguish these. Both code paths emit `emitVerificationFailed`, so the user event is consistent — but the `AgentResult.state` value is inconsistent. This means any caller that guards on `agentResult.state === AgentState.FINISHED` to trigger the next pipeline step will silently not proceed after self-correction exhaustion.

**Fix:** Unify both paths to return `AgentState.FINISHED` (the task is "done" even if imperfect):
```typescript
// In executeWithSelfCorrection, change:
return {
  state: AgentState.ERROR,    // ← wrong
  done: true,
  error: `Failed after ${MAX_CORRECTION_ATTEMPTS} correction attempts`,
}
// To:
return { state: AgentState.FINISHED, done: true }
```

### H2 — Write `src/agent/agents/ExecutionAgent.test.ts`

Test the following:

1. **`buildCorrectionHints` output** — given a `VerificationResult` with one error issue and one warning, the returned string contains `[Correction Attempt`, the error message, and the warning message.
2. **`executeWithVerification` — passes through when verification passes** — mock `verifyExecution` to return `{ passed: true, ... }`. Confirm `emitVerificationPassed` event fires and the return is `{ state: FINISHED, done: true }`.
3. **`executeWithVerification` — retries on failure, stops at MAX_CORRECTION_ATTEMPTS** — mock `verifyExecution` to always return `{ passed: false, issues: [...] }`. Confirm that after `MAX_CORRECTION_ATTEMPTS` retries the final return is still `{ state: FINISHED, done: true }` (H1 fix, not ERROR).
4. **`executeWithSelfCorrection` — returns FINISHED when attempt cap exceeded** — call with `correctionAttempt: 3` (= `MAX_CORRECTION_ATTEMPTS`). Confirm `{ state: FINISHED, done: true }`.

For these tests, mock `executeOnce` at the class level using `vi.spyOn`. Mock:
- `'../../store'`
- `'../workspace/WorkspaceManager'`
- `'./VerificationAgent'` → `verifyExecution: vi.fn()`
- All window event dispatch calls (jsdom provides `window.dispatchEvent` automatically in Vitest)

---

## Round I — `WorkspaceManager.test.ts` `slugify('')` mismatch

**File:** `src/agent/workspace/WorkspaceManager.test.ts` (line 49)

**Bug:** The test asserts `expect(slugify('')).toBe('')` but the implementation returns `'task'` for empty strings (intentional fallback to avoid empty workspace paths).

**Fix:** Update the test to match the intentional behaviour:
```typescript
it('handles empty string', () => {
  expect(slugify('')).toBe('task')
})
```

---

## Round J — Final validation

After applying all changes from F–I:

1. Run `npx tsc --noEmit`. It must exit with zero errors.
2. Run `node_modules/.bin/vitest run`. Confirm:
   - `ReactLoop.test.ts` — all tests pass (no more `status: 'error'` failures)
   - `WorkspaceManager.test.ts` — all tests pass
   - `PlanningAgent.test.ts` — all new tests pass
   - `VerificationAgent.test.ts` — all new tests pass
   - `ExecutionAgent.test.ts` — all new tests pass
   - Previously passing files (`gatewayService.test.ts`, `taskSlice.test.ts`, `executeTool.test.ts`, `ContextCompressor.test.ts`, `PhaseGate.test.ts`, `BaseAgent.test.ts`, `PermissionSystem.test.ts`, `SqliteMemoryStore.test.ts`) continue to pass
3. Report the final `Test Files X passed | Y failed` line.

---

## Constraints

- Do not use `--noEmit` skips or `@ts-ignore` to silence type errors.
- Do not use `any` unless the existing codebase already uses it at that callsite.
- `noUnusedLocals` and `noUnusedParameters` are enforced — do not introduce unused variables in test files.
- Do not modify `src-tauri/` Rust files.
- Each new test file must import from `vitest` (`describe`, `it`, `expect`, `vi`, `beforeEach`).
- Use `vi.hoisted` only if a mock needs to be referenced before `vi.mock` factory runs; otherwise prefer `vi.mock` factory + `vi.mocked(...)` in tests.
