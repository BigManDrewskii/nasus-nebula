# Nasus — Second-Pass Technical Audit Report
**Date:** 2026-03-14
**Scope:** Python stack (orchestrator, sidecar, modules), TypeScript frontend, integration layer

---

## 🔴 Critical Bugs

### 1. **Memory leak in sidecar SSE streams** (BLOCKING)
**Location:** `nasus_sidecar/app.py:82-87, 383-385`

**Description:**
The `_log_queues` dictionary stores `asyncio.Queue` instances per job (line 83). When a job completes, a sentinel `None` is pushed to close the stream (line 385), but the queue entry is never removed from `_log_queues`. After days of continuous operation, the dictionary grows unbounded with thousands of abandoned queue objects.

Similarly, `_jobs` (line 80) accumulates all job envelopes indefinitely — no cleanup mechanism exists.

**Impact:** Unbounded memory growth in long-running sidecar processes. Eventually leads to OOM crash.

**Proposed Fix:**
```python
# In _run_envelope() finally block, after closing SSE stream:
_log_queues.pop(job_id, None)

# In _run_resume() finally block:
_log_queues.pop(new_job_id, None)

# Add a cleanup endpoint (or periodic task):
@app.get("/cleanup")
async def cleanup_old_jobs() -> Dict[str, int]:
    """Remove jobs older than 24 hours from memory."""
    cutoff = datetime.now(timezone.utc) - timedelta(hours=24)
    removed = 0
    for job_id, job in list(_jobs.items()):
        created = datetime.fromisoformat(job.created_at)
        if created < cutoff:
            _jobs.pop(job_id, None)
            _log_queues.pop(job_id, None)
            _job_orchestrators.pop(job_id, None)
            removed += 1
    return {"removed": removed, "remaining": len(_jobs)}
```

---

### 2. **HITL checkpoint orphaning on client disconnect** (BLOCKING)
**Location:** `nasus_sidecar/app.py:735-794`

**Description:**
When a job returns a CHECKPOINT (line 343-344), the per-job orchestrator is stored in `_job_orchestrators[job_id]` (line 344). If the user approves/rejects decisions (POST `/task/{job_id}/approve`, `/reject`) but then closes their browser or network drops before calling `/task/{job_id}/resume`, the checkpoint orchestrator remains in `_job_orchestrators` indefinitely.

There is no timeout, TTL, or garbage collection mechanism. A user who starts 100 tasks with checkpoints and abandons them all will leak 100 orchestrator instances (each holding plan state, LLM client refs, etc.).

**Impact:** Unbounded memory accumulation of orchestrator instances. Potential for security/privacy issues if checkpoints are never cleared.

**Proposed Fix:**
```python
# Add checkpoint expiration tracking:
_checkpoint_timestamps: Dict[str, float] = {}  # job_id -> time.monotonic()

@app.post("/task/{job_id}/approve")
async def approve_subtask(job_id: str, req: _ApprovalRequest) -> Dict[str, Any]:
    orch = _job_orchestrators.get(job_id) or _orchestrator
    if orch is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialised")
    orch.approve(req.subtask_id)
    _checkpoint_timestamps[job_id] = time.monotonic()  # Update timestamp on activity
    return {
        "job_id": job_id,
        "subtask_id": req.subtask_id,
        "decision": "approved",
    }

# Periodic cleanup (e.g., every 5 minutes):
import asyncio
async def cleanup_stale_checkpoints():
    while True:
        await asyncio.sleep(300)  # 5 minutes
        cutoff = time.monotonic() - 3600  # 1 hour TTL
        for job_id in list(_checkpoint_timestamps.keys()):
            if _checkpoint_timestamps[job_id] < cutoff:
                _job_orchestrators.pop(job_id, None)
                _checkpoint_timestamps.pop(job_id, None)

# Start in lifespan:
asyncio.create_task(cleanup_stale_checkpoints())
```

---

### 3. **DAG stage assignment silently produces incorrect order**
**Location:** `nasus_orchestrator.py:_build_dag()` (lines ~250-300 estimated from context)

**Description:**
Stages are assigned by integer `st.stage`. If two subtasks in the same stage have a `depends_on` relationship (e.g., ST-002 in stage 1 depends on ST-001 also in stage 1), the DAG builder does not reject this or reorder them. This produces a logically valid DAG but with incorrect serial execution order within the stage.

Example:
```python
Subtask(subtask_id="ST-001", stage=1, depends_on=[])
Subtask(subtask_id="ST-002", stage=1, depends_on=["ST-001"])
```

Both are in stage 1, but ST-002 cannot run until ST-001 completes — yet the stage executor treats them as parallelizable.

**Impact:** Silent execution order bugs. In parallel execution mode, ST-002 may start before ST-001 finishes, causing dependency failures.

**Proposed Fix:**
```python
def _build_dag(self) -> DependencyGraph:
    # ... existing code ...

    # After assigning stages, validate within-stage dependencies
    for stage_num in range(len(stage_groups)):
        stage_subtasks = [st_id for st_id, st in self.subtasks.items() if st.stage == stage_num]
        for st_id in stage_subtasks:
            st = self.subtasks[st_id]
            for dep_id in st.depends_on:
                if dep_id in stage_subtasks:
                    # Both in same stage but have dependency — move dependee to next stage
                    self.subtasks[st_id].stage = stage_num + 1
                    self._log(f"WARNING: {st_id} depends on {dep_id} in same stage — moved {st_id} to stage {stage_num + 1}")
```

---

### 4. **State not reset between self-correction cycles**
**Location:** `nasus_orchestrator.py:execute_plan()` (method likely ~line 150-200)
Context: ExecutionAgent also calls `execute_plan()` with `interrupt_on_irreversible=True` after HITL approvals.

**Description:**
During self-correction (ExecutionAgent lines 101-111, correctionHints triggered), the orchestrator's `deliverables` list and stage counters are not cleared. If the first execution produces 3 deliverables and the correction attempt produces 2 more, the final synthesis report will show all 5, even though only the last 2 are valid.

Subtask states are not reset either — a COMPLETED subtask remains COMPLETED even after re-execution in the correction cycle.

**Impact:** Incorrect final synthesis report with duplicate/stale deliverables. Data quality issues for long-running self-correction loops.

**Proposed Fix:**
In `ExecutionAgent.executeWithSelfCorrection()` (assuming it exists), before re-running `execute_plan()`:
```python
async executeWithSelfCorrection(params: ExecutionConfigParams): Promise<AgentResult> {
  const job_orch = _job_orchestrators[job_id] or _orchestrator

  # Reset state for correction attempt
  job_orch.deliverables = []
  job_orch.conflicts = []
  for st in job_orch.subtasks.values():
    if st.status in (SubtaskStatus.COMPLETED, SubtaskStatus.FAILED):
      st.status = SubtaskStatus.PENDING
      st.result = None
      st.error = None

  # Re-run with correction hints injected
  result_dict = await loop.run_in_executor(
    None, job_orch.execute_plan, interrupt_on_irreversible=True
  )
  return result_dict
}
```

---

## 🟡 Functional Gaps

### 1. **No payload schema validation in NasusEnvelope**
**Location:** `nasus_module_registry.py:123-131`

**Description:**
The `NasusEnvelope.validate()` method checks `job_id`, `payload` presence, and error consistency, but never validates the **shape** of the payload. If a module returns `payload={"status": "ok"}` instead of the expected `ExecutionPlan` dict, validation passes silently.

Each module is responsible for documenting its output schema, but there's no machine-readable enforcement.

**Impact:** Runtime errors downstream when consumers assume payload structure. Type safety lost at the IPC boundary.

**Proposed Fix:**
Add optional schema validation:
```python
@dataclass
class NasusEnvelope:
    module_id: ModuleID
    payload: Any
    job_id: str = ...
    status: NasusStatus = ...
    payload_schema: Optional[Dict[str, Any]] = None  # JSON Schema
    errors: List[str] = ...

    def validate(self, strict: bool = False) -> List[str]:
        issues = [...]  # existing checks
        if strict and self.payload_schema and isinstance(self.payload, dict):
            from jsonschema import validate as json_validate
            try:
                json_validate(instance=self.payload, schema=self.payload_schema)
            except Exception as e:
                issues.append(f"payload validation failed: {e}")
        return issues
```

---

### 2. **Duplicate module name definitions**
**Location:** `nasus_orchestrator.py:46-63` vs `nasus_module_registry.py:38-53`

**Description:**
Module ID → name mappings are defined in two places:
- `nasus_orchestrator.py` has `MODULE_NAMES = { "M01": "research_analyst", ... }`
- `nasus_module_registry.py` has `ModuleID.label(mid)` returning the same mappings

This violates DRY. If a module is renamed, both places must be updated or the codebase will have inconsistent labels.

**Impact:** Maintainability debt. Risk of stale labels causing confusion in logs and UI.

**Proposed Fix:**
Remove the duplicate from orchestrator and import from registry:
```python
# nasus_orchestrator.py
from nasus_module_registry import ModuleID

MODULE_NAMES = {mid.value: ModuleID.label(mid) for mid in ModuleID}
```

---

### 3. **Missing `_try_playwright_scrape` forwarding of `wait_for_selector`**
**Location:** `nasus_web_browser.py:scrape()` function signature and internal routing

**Description:**
The `route_envelope()` entry point likely calls `scrape(url, wait_for_selector=...)` but if the module checks for `js_required` heuristic and falls back to Playwright, the `wait_for_selector` parameter may not be forwarded (or may be partially forwarded).

This was listed as fixed in a previous audit, but I cannot verify forwarding in the read output (lines were cut off). Verify that line 188 receives and uses `wait_for_selector`.

**Impact:** Playwright scraping misses dynamic content waits when heuristic triggers.

**Proposed Fix:**
Ensure `_try_playwright_scrape()` is always called with the selector:
```python
def scrape(self, url: str, wait_for_selector: str = "", ...) -> Dict[str, Any]:
    # ... validation ...

    # Try Playwright first if selector is specified or heuristic suggests JS
    if wait_for_selector or self.js_required(url):
        result = _try_playwright_scrape(url, wait_for_selector=wait_for_selector)
        if result:
            return result

    # Fall back to httpx
    return _real_scrape(url)
```

---

## 🔵 Inconsistencies

### 1. **PreviewPane and OutputCards use different asset inlining logic**
**Location:** `PreviewPane.tsx:37-72` vs `OutputCards.tsx:75-93`

**Description:**
Both components inline CSS/JS files into HTML for iframe preview, but they use slightly different regex and path resolution:
- `PreviewPane.inlineAssets()` (line 41) strips both `./` and `/workspace/`
- `OutputCards.inlineAssetsForBundle()` (line 78) only strips `./`

If a bundle file references `<script src="/workspace/utils.js">`, OutputCards will fail to resolve it, but PreviewPane will succeed. Inconsistent behavior across output modes.

**Impact:** Bundled HTML exports may not render correctly if paths use `/workspace/` prefix.

**Proposed Fix:**
Unify both to use the same resolver:
```typescript
function resolve(ref: string): WorkspaceFile | undefined {
  const clean = ref
    .replace(/^\.\//, '')
    .replace(/^\/workspace\//, '')
    .replace(/^\/?/, '')  // Remove leading /
  return byName.get(clean)
}
```

---

### 2. **ExecutionAgent correction cycle does not preserve prior state**
**Location:** `ExecutionAgent.ts:87-88` (\_priorLoopState)

**Description:**
The `_priorLoopState` is initialized to `null` on first `executeOnce()` (line 132), then preserved across correction cycles. However, the reset logic (line 132) only checks `if (!isCorrection)` — if a correction produces another correction (rare but possible), the state may not reset correctly.

Additionally, it's unclear whether `executionOutputBuffer` contains all outputs or is cleared per cycle. The comment says "Preserved across correction runs" but the exact content semantics are ambiguous.

**Impact:** Potential for stale execution context in multi-correction scenarios (e.g., correction of a correction).

**Proposed Fix:**
Add explicit reset at the start of each correction:
```typescript
private async executeOnce(
  context: AgentContext,
  isCorrection = false,
): Promise<ExecuteOnceResult> {
  if (isCorrection) {
    // Preserve errorTracker but clear output buffer for new attempt
    if (this._priorLoopState) {
      this._priorLoopState.executionOutputBuffer = ''
    }
  } else {
    this._priorLoopState = null
  }
  // ... rest of method
}
```

---

### 3. **OutputCards.shouldBundle() heuristic unclear**
**Location:** `OutputCards.tsx:39-44`

**Description:**
The bundling heuristic is:
- If `files.length >= 3`: bundle = true
- If has HTML + companion (CSS/JS/TS) AND `files.length >= 2`: bundle = true

But "companion" detection is hardcoded to `['css', 'js', 'ts', 'scss']` (line 42). TypeScript and JSX (`.tsx`) are common companion files but not checked. A bundle with `index.html`, `styles.css`, `App.tsx` will have length=3 and trigger bundling by the first condition, but only by accident.

**Impact:** Unreliable bundling behavior. May fail to bundle some valid sets or bundle unexpectedly.

**Proposed Fix:**
```typescript
function shouldBundle(files: OutputCardFile[]): boolean {
  if (files.length >= 3) return true
  const hasHtml = files.some(f => PREVIEW_EXTS.has(getExt(f.filename)))
  const COMPANION_EXTS = new Set(['css', 'js', 'ts', 'tsx', 'jsx', 'scss', 'sass'])
  const hasCompanion = files.some(f => COMPANION_EXTS.has(getExt(f.filename)))
  return hasHtml && hasCompanion && files.length >= 2
}
```

---

### 4. **useSidecarStream race condition on 'done' event**
**Location:** `useSidecarStream.ts:125-130`

**Description:**
When the 'done' event fires (line 125), the code immediately sets `setDone(true)` and closes the stream. However, the final `onmessage` event may arrive before 'done' is processed by the event loop, causing a race where the last step is recorded but marked as "done" simultaneously. React state updates are batched, but the order is not guaranteed.

Additionally, on line 128, `es.close()` is called, but `esRef.current` is not cleared to null. Subsequent calls to `cancel()` might try to close an already-closed EventSource.

**Impact:** Rare race condition where final log messages are lost or appear out of order. Memory leak if cancel is called after 'done' fires.

**Proposed Fix:**
```typescript
es.addEventListener('done', () => {
  retryCountRef.current = 0
  esRef.current = null  // Clear immediately
  es.close()
  closedRef.current = true
  setDone(true)  // Update state last
})
```

---

### 5. **WorkspaceManager slugify() may produce empty results**
**Location:** `WorkspaceManager.ts:12-19`

**Description:**
The `slugify()` function removes all non-alphanumeric characters, collapses spaces to hyphens, then slices to 30 chars. For a task title like "🎉 Test!", after removing non-ASCII and trimming, the result is "test" (4 chars). But if the title is entirely non-ASCII (e.g., "🎉🎊🎈"), the result is an empty string "" — which passes through to be used as a task ID.

While there's a fallback `return name[:128] or "artifact"` for empty filenames (workspace_io.py:36), no such fallback exists in slugify().

**Impact:** Task IDs can be empty strings, violating the invariant that job_id should be non-empty.

**Proposed Fix:**
```typescript
export function slugify(text: string): string {
  const result = text.toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30)
    .replace(/-+$/, '')
  return result || 'task'  // Fallback to 'task' if empty
}
```

---

## ⚪ Test Coverage Gaps

### 1. **HITL checkpoint lifecycle not tested**
**Files:** `nasus_sidecar/app.py` — no test file exists (search for `*test*.py` in sidecar dir)

**Issue:** The multi-step flow (job completes with CHECKPOINT → client calls /approve → calls /resume) is not covered by automated tests. Manual testing only. If a regression is introduced in the checkpoint handling, it may not be caught until production.

**Test TODO:**
```python
# tests/test_sidecar_checkpoint.py
@pytest.mark.asyncio
async def test_checkpoint_lifecycle():
    # 1. Submit task that returns checkpoint
    # 2. Call /approve with valid subtask_id
    # 3. Call /resume
    # 4. Verify resume_env contains the correct output
    pass

@pytest.mark.asyncio
async def test_checkpoint_timeout_cleanup():
    # 1. Submit task → checkpoint
    # 2. Wait 1 hour
    # 3. Verify _job_orchestrators[job_id] is cleaned up
    pass
```

---

### 2. **DAG cycle detection not tested with intra-stage dependencies**
**Files:** `nasus_orchestrator.py` — DAG building tests missing

**Issue:** The cycle detector was added (per audit notes), but there are no tests for cycles that span stages or exist within a single stage. The intra-stage dependency bug (item 🔴 3 above) may not be caught by existing tests.

**Test TODO:**
```python
def test_dag_intra_stage_dependency():
    orch = NasusOrchestrator()
    # Create subtasks ST-001, ST-002 in same stage with dependency
    orch.subtasks["ST-001"] = Subtask(stage=0, depends_on=[])
    orch.subtasks["ST-002"] = Subtask(stage=0, depends_on=["ST-001"])
    dag = orch._build_dag()
    # Verify: ST-002 is moved to stage 1, or cycle detected, or error raised
    assert dag.total_stages >= 2
```

---

### 3. **ExecutionAgent verification flow not tested**
**Files:** `ExecutionAgent.ts`, `VerificationAgent.ts` — no integration tests

**Issue:** The self-correction loop (lines 101-111 in ExecutionAgent) delegates to `executeWithVerification()` and `executeWithSelfCorrection()`, but there are no tests verifying that:
- Corrections are applied correctly
- State is reset between correction cycles
- Max correction attempts (3) is enforced

**Test TODO:**
```typescript
describe('ExecutionAgent self-correction', () => {
  it('should apply correction hints', async () => {
    // Mock a failed execution with correctionHints
    // Verify second execution includes hints in context
  })

  it('should reset deliverables between corrections', async () => {
    // Run correction cycle twice
    // Verify final deliverables contain only second cycle's results
  })

  it('should stop after MAX_CORRECTION_ATTEMPTS', async () => {
    // Force 4 failed verifications
    // Verify result.state === ERROR and no more corrections attempted
  })
})
```

---

### 4. **Path traversal defense not tested**
**Files:** `WorkspaceManager.ts:195`, `workspace_io.py:39-43`

**Issue:** Both the TypeScript and Python layers validate against `..` in paths, but there are no tests for:
- Absolute paths (`/etc/passwd`)
- URL-encoded traversal (`..%2F..`)
- Case variations on Windows (if ever ported)
- Symlink escapes (if symlinks are used)

**Test TODO:**
```typescript
describe('WorkspaceManager path safety', () => {
  it('should reject .. in path', async () => {
    await expect(workspaceManager.writeFile(taskId, 'a/../../etc/passwd', 'x'))
      .rejects.toThrow('Path traversal detected')
  })

  it('should reject absolute paths', async () => {
    await expect(workspaceManager.writeFile(taskId, '/etc/passwd', 'x'))
      .rejects.toThrow()
  })
})
```

---

## 💡 Improvement Suggestions

### 1. **Add request-scoped tracing IDs to sidecar logs**
**Location:** `nasus_sidecar/app.py:137-151`

**Issue:** The middleware logs `{status, client}` but not the job_id. When multiple concurrent jobs run, logs from different jobs are interleaved with no way to correlate them.

**Suggestion:** Inject a `trace_id` (from job_id) into the logging context:
```python
@app.middleware("http")
async def _request_log_middleware(request: Request, call_next):
    job_id = request.path_params.get('job_id', 'unknown')
    request.state.trace_id = job_id  # Store in request context
    # Use logging context (structlog or custom logger) to include trace_id in all logs
    response = await call_next(request)
    _access_log.info(
        f"{request.method} {request.url.path}",
        extra={
            "status": response.status_code,
            "client": request.client.host if request.client else "",
            "trace_id": job_id,  # Add this
        },
    )
    return response
```

---

### 2. **Implement graceful shutdown for sidecar**
**Location:** `nasus_sidecar/app.py:99-108` (lifespan)

**Issue:** The lifespan yields immediately after init. If Tauri or the user kills the sidecar while jobs are running, in-flight executions are abandoned. There's no drain period or cancellation signal.

**Suggestion:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _orchestrator, _memory
    # ... startup code ...
    yield
    # Graceful shutdown: wait up to 10s for in-flight jobs
    print("Sidecar shutting down, waiting for in-flight jobs...")
    import time
    deadline = time.monotonic() + 10
    while any(j.status == NasusStatus.RUNNING for j in _jobs.values()):
        if time.monotonic() > deadline:
            print("Timeout waiting for jobs, forcing shutdown")
            break
        await asyncio.sleep(0.1)
    # Close database, cleanup resources
    if _memory:
        _memory.close()
```

---

### 3. **Add structured logging for DAG execution**
**Location:** `nasus_orchestrator.py` (all _log calls)

**Issue:** The orchestrator logs as plain strings. In production, it's hard to aggregate errors or track stage transitions across multiple session IDs.

**Suggestion:**
Use JSON-structured logging:
```python
from structlog import get_logger
log = get_logger("orchestrator")

# Instead of: self._log(f"Dispatched: {subtask_id} -> {module}")
log.info("subtask_dispatched", subtask_id=subtask_id, module=module, session=self.session_id)

# Later, can query all "subtask_dispatched" events for a session
```

---

### 4. **Document the TypeScript ↔ Python sidecar contract**
**Location:** None — add file `SIDECAR_CONTRACT.md`

**Issue:** The integration between ExecutionAgent (TS) and nasus_orchestrator (Py) relies on envelope serialization and SSE message format, but this is not documented. If a future refactor breaks the contract, it won't be caught by the type system.

**Suggestion:**
Add a contract document:
```markdown
# Sidecar IPC Contract

## Envelope Format
POST /task body:
{
  "module_id": "M00" | "M01" | ...,
  "payload": { ... }  // module-specific; no schema enforced
}

Response polling /task/{job_id}/status returns NasusEnvelope:
{
  "job_id": "job_xxx",
  "module_id": "M00",
  "status": "PENDING" | "RUNNING" | "DONE" | "FAILED",
  "payload": { ... },
  "errors": [...]
}

## SSE Stream Format (/task/{job_id}/stream)
Each event is JSON:
{
  "step": number,
  "type": "tool_call" | "observation" | "error" | "log" | "plan" | "final",
  "content": string,
  "tool"?: string,
  "tool_input"?: object,
  "tool_output"?: string,
  "timestamp": ISO8601
}

Final event:
{
  "done": true,
  "status": "DONE" | "FAILED",
  "job_id": "job_xxx"
}
```

---

### 5. **Add API key rotation support**
**Location:** `nasus_sidecar/app.py:477-524` (POST /configure)

**Issue:** The POST /configure endpoint updates the global `_CONFIG`, affecting all future jobs. If an API key is rotated (e.g., monthly security policy), there's no way to update it without restarting the sidecar. Also, no audit trail of when the key changed.

**Suggestion:**
```python
# Track configuration changes
_config_history: List[Dict] = []

@app.post("/configure")
async def configure_llm(req: LLMConfigRequest):
    global _CONFIG
    old_cfg = {
        "api_base": _CONFIG.api_base,
        "model": _CONFIG.default_model,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    _config_history.append(old_cfg)

    llm_client.configure(...)
    if _orchestrator:
        _orchestrator.llm = llm_client.get_client(...)

    return {
        "status": "configured",
        "config_changed": old_cfg != {...},  # Compare
        "previous_base": old_cfg["api_base"],
        "new_base": req.api_base,
    }

@app.get("/config/history")
async def get_config_history() -> List[Dict]:
    """Audit trail of API key rotations."""
    return _config_history[-10:]  # Last 10 changes
```

---

### 6. **Improve VerificationAgent quick mode documentation**
**Location:** `VerificationAgent.ts:72`

**Issue:** The `quick` mode flag skips LLM-based analysis, but it's unclear when to use it. The comment says "for periodic phase-gate checks inside the execution loop" but there's no example of where this is called.

**Suggestion:**
Add inline examples and update comments:
```typescript
export interface VerificationContext extends AgentContext {
  taskId: string
  plan: ExecutionPlan
  executionOutput: string
  createdFiles?: Array<{ path: string; content: string }>
  /**
   * Quick mode: skip the LLM-based analysis step.
   * Use for periodic phase-gate checks inside the execution loop to:
   *   - Verify syntax of generated code (fast)
   *   - Check file creation succeeded (file exists + readable)
   *   - Detect obviously broken tool calls (missing required fields)
   *
   * Full mode: use after execution completes to do semantic analysis:
   *   - Does the output match the plan description?
   *   - Are there logical inconsistencies?
   *   - Should we trigger self-correction?
   *
   * Example: ReactLoop calls verifyExecution(..., quick=true) every 5 steps.
   *          ExecutionAgent calls it once at end with quick=false.
   *
   * Default: false (full verification).
   */
  quick?: boolean
}
```

---

## Summary Table

| Category | Count | Severity |
|----------|-------|----------|
| 🔴 Critical bugs | 4 | 2 blocking, 2 high |
| 🟡 Functional gaps | 3 | All high |
| 🔵 Inconsistencies | 5 | 2 high, 3 medium |
| ⚪ Test gaps | 4 | All medium |
| 💡 Improvements | 6 | All low |
| **Total** | **22** | |

---

## Recommended Action Items

### Immediate (within 1 sprint)
1. Fix memory leaks in sidecar (`_log_queues`, `_jobs`, `_job_orchestrators`)
2. Add HITL checkpoint TTL cleanup
3. Fix DAG intra-stage dependency ordering
4. Add payload schema validation to NasusEnvelope

### Short-term (within 1 month)
5. Unify asset inlining logic (PreviewPane ↔ OutputCards)
6. Fix useSidecarStream race conditions
7. Add request-scoped tracing to sidecar logs
8. Write HITL checkpoint and DAG cycle detection tests

### Medium-term (within 1 quarter)
9. Consolidate MODULE_NAMES definitions
10. Implement graceful shutdown for sidecar
11. Add structured logging to orchestrator
12. Document sidecar IPC contract

---

**Report Generated:** 2026-03-14
**Audit Scope:** Python + TypeScript integration layer
**Next Audit:** After critical bugs are fixed (estimated 2-3 weeks)
