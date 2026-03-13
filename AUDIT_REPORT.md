# NASUS Technical Audit Report
**Date**: March 14, 2026 | **Codebase**: Tauri 2.0 Desktop App + Python Sidecar Stack

---

## 🔴 Critical Bugs

### 1. Double-Scrape Path Logic Bug in nasus_web_browser.py
**Location**: `nasus_web_browser.py:252-264`

**Description**:
The `scrape()` function has contradictory logic for when a "double-scrape" fallback occurs. Line 252 sets:
```python
js_required = not request.follow_links  # follow_links=False → may need JS; True → real HTTP crawl
```

Then lines 259-264 attempt a second `_real_scrape()` regardless:
```python
if not page_data:
    try:
        page_data = _real_scrape(request.url)  # ALREADY attempted at line 255
    except Exception as exc:
        scrape_error = str(exc)
```

**Impact**:
- Wastes HTTP requests (double-fetch for the same URL)
- Confusing behavior: both `follow_links=True` and `follow_links=False` make real HTTP attempt twice
- The heuristic `js_required = not request.follow_links` is backwards (follow_links=False should mean "don't crawl multiple pages, scrape this one carefully")

**Proposed Fix**:
Remove the duplicate `_real_scrape()` call at line 261. The first attempt (line 255) already covers the non-JS path. Only fall through to Playwright if the first real scrape failed AND `js_required=True`:
```python
if not page_data and js_required:
    page_data = _try_playwright_scrape(request.url, request.wait_for_selector or "") or {}
```

---

### 2. Orchestrator DAG Cycle Detection Missing
**Location**: `nasus_orchestrator.py:343-371` (_build_dag method)

**Description**:
The `_build_dag()` method builds stages but does **not detect circular dependencies**. If a subtask A depends on B, B depends on C, and C depends on A, the code will still construct a DAG and attempt to execute it, leading to:
- Infinite loop when trying to resolve inputs
- Resource starvation (threads blocked waiting for results that will never arrive)
- No escalation or user warning

**Impact**: Blocking issue for production execution.

**Proposed Fix**:
Implement cycle detection using DFS before returning stages. Pseudocode:
```python
def _has_cycle(self, subtasks):
    visited = {sid: False for sid in self.subtasks}
    rec_stack = {sid: False for sid in self.subtasks}

    def dfs(sid):
        visited[sid] = True
        rec_stack[sid] = True
        for dep in self.subtasks[sid].depends_on:
            if not visited[dep]:
                if dfs(dep): return True
            elif rec_stack[dep]: return True
        rec_stack[sid] = False
        return False

    for sid in self.subtasks:
        if not visited[sid] and dfs(sid):
            return True
    return False
```

If a cycle is detected, escalate with `EscalationType.CIRCULAR_DEPENDENCY`.

---

### 3. Self-Correction Recursion Unbounded
**Location**: `nasus_orchestrator.py:751-755` (execute_plan method)

**Description**:
When `max_correction_cycles > 0` and reflection reports failure, the code recursively calls `execute_plan()` with `max_correction_cycles - 1`:
```python
return self.execute_plan(
    interrupt_on_irreversible=interrupt_on_irreversible,
    max_correction_cycles=max_correction_cycles - 1,
)
```

However:
- The stack grows linearly with correction cycles
- No safeguard if `max_correction_cycles` is set to a huge value
- Each recursion re-executes _dispatch_subtask for failed tasks, but doesn't reset state properly
- Reflection logic (line 732) always adds a new "reflection" dict to report, but prior failures are never cleaned up from memory

**Impact**: Potential stack overflow, memory bloat, and cascading failures on repeated correction attempts.

**Proposed Fix**:
Replace recursion with an iterative loop in execute_plan:
```python
correction_cycle = 0
while correction_cycle < max_correction_cycles:
    report = self.synthesize()
    report["reflection"] = self._reflect(self.deliverables, self.goal)

    if report["reflection"].get("passed", True):
        break

    failed_ids = [sid for sid, st in self.subtasks.items() if st.status == SubtaskStatus.FAILED]
    if failed_ids:
        for sid in failed_ids:
            st = self.subtasks[sid]
            st.status = SubtaskStatus.PENDING
            st.retry_count = 0
        self.stages = self._build_dag(list(self.subtasks.values()))

    correction_cycle += 1

return report
```

---

### 4. LLM Synthesis Without Fallback in nasus_web_browser.py
**Location**: `nasus_web_browser.py:507-514` (route_envelope method)

**Description**:
When `request.extract_prompt` is set and LLM synthesis is attempted:
```python
if request.extract_prompt:
    _text = result.text if isinstance(result, PageContent) else (...)
    if _text:
        synthesis = _llm_synthesize(_text, request.extract_prompt, request.url)
        if synthesis:
            result_dict["llm_synthesis"] = synthesis
```

The `_llm_synthesize()` function at line 205-221 silently returns `None` if:
- LLM client is not configured
- Any exception occurs during API call

This means the caller has **no way to know** whether synthesis succeeded or failed. If the user relied on LLM extraction, they receive incomplete data with no indication.

**Impact**: Silent data loss; users assume extraction happened when it didn't.

**Proposed Fix**:
Return a structured result from `_llm_synthesize()`:
```python
def _llm_synthesize(...) -> dict:
    return {"success": False, "data": None, "error": "LLM not configured"}
    # or
    return {"success": True, "data": extracted_text, "error": None}
```

Then in `route_envelope()`:
```python
if request.extract_prompt and _text:
    synthesis_result = _llm_synthesize(_text, request.extract_prompt, request.url)
    result_dict["llm_synthesis"] = {
        "data": synthesis_result.get("data"),
        "success": synthesis_result.get("success", False),
        "error": synthesis_result.get("error")
    }
```

---

## 🟡 Functional Gaps

### 1. Memory Bus Contract Not Enforced
**Location**: `nasus_orchestrator.py:620-638` (_dispatch_subtask method)

**Description**:
When a subtask is completed and its module is in `_MEMORY_BUS_MODULES`, the code attempts to write to M09 (memory manager):
```python
if st.module in self._MEMORY_BUS_MODULES:
    try:
        _mem_payload = { "action": "write", ... }
        _mem_env = NasusEnvelope(module_id=ModuleID.M09, payload=_mem_payload)
        self.route_envelope(_mem_env)
    except Exception:
        pass  # SILENT FAILURE
```

**Issues**:
- Silent exception catch: if M09 is unavailable or misconfigured, no error is logged or escalated
- No confirmation that memory write succeeded
- Memory writes are fire-and-forget; no replay mechanism if they fail

**Impact**: Module outputs that should be persisted to memory are silently lost.

**Proposed Fix**:
- Log the exception at WARNING level
- Collect failed memory writes and expose them in the synthesis report
- Return a structured result from route_envelope indicating success/failure

---

### 2. Workspace File Cleanup on Error Not Implemented
**Location**: `nasus_sidecar/app.py:85-107` (lifespan)

**Description**:
The sidecar FastAPI app initializes workspace_io at startup:
```python
from nasus_sidecar.workspace_io import init_workspace_io
init_workspace_io(base=str(_db_dir / "workspaces"))
```

But the lifespan cleanup does nothing:
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    global _orchestrator, _memory
    # ... initialization ...
    yield
    # Cleanup: nothing needed for stateless sidecar
```

**Issues**:
- Workspace files accumulate indefinitely in `~/.nasus/workspaces/{session_id}/`
- No mechanism to clean up failed/cancelled job workspaces
- No quota enforcement or disk usage monitoring

**Impact**: Disk space leak over time; users' home directories filled with orphaned session directories.

**Proposed Fix**:
Implement cleanup in lifespan shutdown:
```python
yield
# Cleanup old workspaces (older than N days)
from datetime import datetime, timezone, timedelta
import os
ws_base = Path.home() / ".nasus" / "workspaces"
cutoff = datetime.now(timezone.utc) - timedelta(days=7)
for session_dir in ws_base.iterdir():
    if session_dir.is_dir():
        mtime = datetime.fromtimestamp(session_dir.stat().st_mtime, tz=timezone.utc)
        if mtime < cutoff:
            shutil.rmtree(session_dir, ignore_errors=True)
```

---

### 3. No Input Validation on NasusEnvelope Payloads
**Location**: `nasus_module_registry.py:64-132` (NasusEnvelope class)

**Description**:
The `NasusEnvelope.validate()` method (line 123-131) only checks:
- job_id is not empty
- DONE status has a payload
- errors and status consistency

It does **NOT validate**:
- Payload type matches expected schema for the module
- Required fields in payload are present
- Payload size limits

This means a malformed payload can pass through envelope validation and crash the receiving module at runtime.

**Impact**: Poor error messages; modules fail with cryptic exceptions instead of clear validation errors.

**Proposed Fix**:
Extend validate() to call module-specific validators:
```python
def validate(self) -> List[str]:
    issues = [...]  # existing checks

    # Call module-specific validator if available
    validator = MODULE_VALIDATORS.get(self.module_id.value)
    if validator:
        issues.extend(validator(self.payload))

    return issues
```

---

### 4. Code Engineer HTML_CSS Execution Sandbox Safety Not Documented
**Location**: `nasus_code_engineer.py:1-70` (module-level)

**Description**:
When CodeTask is EXECUTE with language HTML_CSS, the code generator returns HTML/CSS but there is no documented sandbox or CSP policy for execution. The CLAUDE.md mentions the app is desktop-only, so browser execution is unclear.

**Impact**: If this ever gets wired to browser automation, XSS and script injection risks are not documented.

**Proposed Fix**:
Add a docstring and explicit check:
```python
def route_envelope(envelope: NasusEnvelope) -> NasusEnvelope:
    payload = envelope.payload
    spec = Spec(**payload)

    # HTML_CSS execution not supported in desktop mode; require explicit user confirmation
    if spec.language == Language.HTML_CSS and spec.task == CodeTask.EXECUTE:
        return envelope.mark_failed(
            "HTML/CSS execution disabled in desktop mode for security. "
            "Use GENERATE task to output static HTML, or REVIEW for analysis."
        )
    ...
```

---

## 🔵 Inconsistencies

### 1. Duplicate DAG/Subtask Data Structures in Orchestrator
**Location**: `nasus_orchestrator.py:97-141` vs `nasus_orchestrator_schema.py:99-145`

**Description**:
The orchestrator defines its own `Subtask` and `DAGStage` dataclasses (lines 106-149 in orchestrator.py), but `nasus_orchestrator_schema.py` defines identical structures:
- `nasus_orchestrator_schema.Subtask` (line 121)
- `nasus_orchestrator_schema.DAGStage` (line 153)

The schema versions are used in ExecutionPlan and SynthesisReport, but the orchestrator's internal execution uses its own versions. This creates two sources of truth and is error-prone when transferring between them.

**Impact**: Risk of field mismatch, inconsistent serialization, harder to maintain.

**Proposed Fix**:
Remove the duplicate definitions from `nasus_orchestrator.py` and import from schema:
```python
from nasus_orchestrator_schema import Subtask as SchemaSubtask, DAGStage as SchemaDagStage

# Alias or wrap if internal logic needs different behavior:
Subtask = SchemaSubtask
DAGStage = SchemaDagStage
```

---

### 2. Module ID Mapping Hardcoded in Two Places
**Location**: `nasus_orchestrator.py:46-90` vs `nasus_module_registry.py:38-53`

**Description**:
Module names and capabilities are defined in:
1. **nasus_orchestrator.py**: `MODULE_NAMES` dict (line 46) and `MODULE_CAPABILITIES` dict (line 58)
2. **nasus_module_registry.py**: `ModuleID.label()` classmethod (line 38)

Changes to module names or capabilities must be updated in both places. This is a maintenance burden and source of sync bugs.

**Impact**: If M05's label is changed in registry but not in orchestrator, the two systems report different names for the same module.

**Proposed Fix**:
Move all module metadata to a single source (e.g., a new `nasus_module_catalog.py`):
```python
# nasus_module_catalog.py
MODULE_METADATA = {
    "M01": {
        "name": "Research Analyst",
        "capabilities": ["web research", "competitive intel", ...],
    },
    "M02": { ... },
    ...
}
```

Then import in both orchestrator and registry.

---

### 3. SchemaValidationResult Score Never Used
**Location**: `nasus_orchestrator_schema.py:538-585`

**Description**:
The `validate_execution_plan()` and `validate_synthesis_report()` functions both compute a `score` field (0-100), but the score is **never acted upon**. The validation result only indicates valid/invalid; the score is informational but has no effect on plan execution or escalation.

**Impact**: Dead code; misleading API suggests confidence score is actionable when it's not.

**Proposed Fix**:
Either:
1. Use the score to escalate if below threshold (e.g., score < 50 → clarification_request)
2. Or remove the score field if it's not actionable

---

### 4. TypeScript ExecutionAgent Correction Loop Never Tested
**Location**: `src/agent/agents/ExecutionAgent.ts:101-112` (doExecute method)

**Description**:
The ExecutionAgent supports self-correction via `correctionHints` parameter:
```typescript
if (params.correctionHints) {
    return this.executeWithSelfCorrection(params)
}
```

But there are no tests for this path in the test suite (verified by test file listing). The correction logic may be broken but not caught.

**Impact**: Self-correction feature may silently fail or crash in production.

**Proposed Fix**:
Add integration test in test suite (e.g., `test_execution_self_correction.ts`):
```typescript
test('ExecutionAgent self-correction on verification failure', async () => {
    const context = { ..., correctionHints: "Previous execution failed validation. Retry with better error handling." };
    const result = await agent.execute(context);
    expect(result.state).toBe(AgentState.FINISHED);
    expect(result.output).toContain('corrected');
});
```

---

## ⚪ Test Coverage Gaps

### 1. No Tests for Orchestrator Reflection Scoring
**Location**: `nasus_orchestrator.py:761-840` (_reflect method)

**Files**: `nasus_stack/tests/` (has test_reflection.py but only partial coverage)

**Description**:
The `_reflect()` method returns a scoring dict with `score: float`. Tests exist (test_reflection.py) but only verify LLM path. The heuristic fallback path (lines 824-840) is never tested:
- No test verifies score is computed correctly when subtasks fail
- No test checks edge case where total_count == 0
- No test validates the issues/suggestions lists are properly populated

**Impact**: Heuristic scoring bugs could go unnoticed.

**Proposed Fix**:
Add tests to test_reflection.py:
```python
def test_reflect_heuristic_no_llm():
    orchestrator = NasusOrchestrator(llm_client=None)
    orchestrator.subtasks = { "ST-001": Subtask(..., status=SubtaskStatus.FAILED) }
    orchestrator.deliverables = []

    result = orchestrator._reflect([], "Test goal")

    assert result["method"] == "heuristic"
    assert result["passed"] == False
    assert result["score"] == 0.0
    assert len(result["issues"]) == 1
    assert "ST-001" in result["issues"][0]

def test_reflect_heuristic_empty_subtasks():
    orchestrator = NasusOrchestrator(llm_client=None)
    orchestrator.subtasks = {}

    result = orchestrator._reflect([], "Test goal")
    # Should not divide by zero
    assert result["score"] == 0.0
```

---

### 2. No Workspace File Path Traversal Tests
**Location**: `nasus_sidecar/workspace_io.py:39-43` (_guard function)

**Description**:
The `_guard()` function rejects `..` in filenames, but there are no tests for:
- Absolute paths starting with `/`: `/etc/passwd`
- Symlink traversal (not possible with `Path.parts` check, but worth documenting)
- URL-encoded traversal: `%2e%2e`
- Double encoding: `%252e%252e`

**Impact**: Path traversal vulnerability if `_guard()` is incomplete.

**Proposed Fix**:
Add parametrized test:
```python
@pytest.mark.parametrize("unsafe_filename", [
    "../../../etc/passwd",
    "..\\..\\windows\\system32",
    "/etc/passwd",
    "//network/share",
    "%2e%2e/etc",
    "file%3fdelete=1",
])
def test_workspace_io_rejects_unsafe_paths(unsafe_filename):
    with pytest.raises(ValueError):
        _guard(unsafe_filename)
```

---

### 3. No Tests for Sidecar SSE Stream Error Handling
**Location**: `nasus_sidecar/app.py:150-200+` (stream endpoint and error handling)

**Description**:
The sidecar exposes `GET /task/{job_id}/stream` for SSE. Tests do not verify:
- Stream client disconnect mid-execution
- Multiple concurrent clients on same job
- Queue overflow when logs arrive faster than client reads
- Proper cleanup of `_log_queues` after client disconnects

**Impact**: Stream endpoint may leak memory or crash under concurrent load.

**Proposed Fix**:
Add integration test:
```python
@pytest.mark.asyncio
async def test_sse_stream_cleanup_on_disconnect():
    job_id = "test_job_123"

    async with AsyncClient(app=app, base_url="http://test") as client:
        async with client.stream("GET", f"/task/{job_id}/stream") as resp:
            # Disconnect after a few seconds
            await asyncio.sleep(1)

    # Queue should be cleaned up
    assert job_id not in _log_queues
```

---

### 4. No Tests for Code Engineer Generated Code Execution
**Location**: `nasus_code_engineer.py:50-250` (generate, debug, review functions)

**Description**:
The module generates code (Python, JS, etc.) but there are no tests that:
1. Execute the generated code to verify it's valid
2. Catch syntax errors in generation
3. Verify async code generation (Python code uses `async def`)

Example: Test at line 73-150 defines a Python async HTTP client stub but never runs it.

**Impact**: Generated code may be syntactically invalid but go undetected until user tries to use it.

**Proposed Fix**:
Add execution test:
```python
def test_code_generation_python_syntax():
    spec = Spec(
        task=CodeTask.GENERATE,
        language=Language.PYTHON,
        description="Async HTTP client",
        ...
    )
    result = route_envelope(NasusEnvelope(ModuleID.M05, spec))

    assert result.status == NasusStatus.DONE
    code = result.payload.get("blocks", [{}])[0].get("code", "")

    # Verify it's valid Python
    try:
        compile(code, "<generated>", "exec")
    except SyntaxError as e:
        pytest.fail(f"Generated code has syntax error: {e}")
```

---

## 💡 Improvement Suggestions

### 1. Add TypeScript Strict Null Checks for Workspace Manager
**Location**: `src/agent/workspace/WorkspaceManager.ts` (not fully read, but likely issue)

**Description**:
TypeScript strict null checks may not be fully enforced. Workspace operations that fail silently (e.g., file write error) could leave `output_cards` in an inconsistent state.

**Suggestion**:
Ensure all workspace operations return Result<T, Error> instead of throwing:
```typescript
interface FileWriteResult {
  success: boolean
  path?: string
  error?: string
}

async writeOutputCard(taskId: string, data: unknown): Promise<FileWriteResult> {
  try { ... }
  catch (e) { return { success: false, error: e.message } }
}
```

---

### 2. Document LLM Fallback Semantics Consistently
**Location**: `nasus_orchestrator.py`, `nasus_sidecar/llm_client.py`, `src/agent/llm.ts`

**Description**:
Three separate LLM integration points have different fallback behaviors:
- Orchestrator `_reflect()`: LLM → heuristic fallback
- Sidecar `llm_client.chat_json()`: Retry with parse failure injection → exception
- TypeScript `chatJsonViaGateway()`: Retry → undefined

**Suggestion**:
Document a consistent fallback strategy in CLAUDE.md and enforce it:
1. Try LLM call
2. On timeout/unavailable: use heuristic fallback
3. On parse error: retry with injection (if applicable)
4. On auth error: escalate immediately (no fallback)

---

### 3. Add Observability: Structured Logging for DAG Execution
**Location**: `nasus_orchestrator.py:538-655` (_dispatch_subtask method)

**Description**:
DAG execution is hard to debug because logs are unstructured strings. When a stage fails, it's unclear:
- Which subtask failed first
- Was it a network error or application logic?
- Did the retry succeed or re-fail with the same error?

**Suggestion**:
Structured logging with tracing IDs:
```python
def _dispatch_subtask(self, subtask_id: str, ...):
    trace_id = f"{self.session_id}:{subtask_id}"
    self._log(f"dispatch_start", extra={"trace_id": trace_id, "attempt": attempt})

    try:
        result = self.route_envelope(...)
        self._log(f"dispatch_success", extra={"trace_id": trace_id, "status": result.status})
    except Exception as e:
        self._log(f"dispatch_error", extra={"trace_id": trace_id, "error": str(e), "type": type(e).__name__})
```

---

### 4. Add Memory Pressure Monitoring
**Location**: `nasus_sidecar/app.py:98-109` (lifespan)

**Description**:
MemoryStore accumulates data indefinitely. No monitoring or limits prevent runaway memory consumption.

**Suggestion**:
Implement memory health check endpoint:
```python
@app.get("/memory/health")
async def memory_health():
    stats = _memory.get_stats()
    return {
        "episodic_entries": len(stats["episodic"]),
        "semantic_size_mb": stats["semantic_size_bytes"] / 1e6,
        "working_ttl_count": sum(1 for e in stats["working"] if e.ttl_seconds),
        "health": "ok" if stats["semantic_size_bytes"] < 100e6 else "warning"
    }
```

---

### 5. Add Circuit Breaker for Slow Modules
**Location**: `nasus_orchestrator.py:538-655` (_dispatch_subtask method)

**Description**:
If a module is slow (e.g., M01 web research taking 5+ minutes), the orchestrator doesn't timeout or skip it. Execution gets stuck.

**Suggestion**:
Add timeout per subtask based on deadline:
```python
deadline_timeout_ms = {
    Deadline.ASAP: 60_000,  # 1 min
    Deadline.BLOCKING_NEXT_STAGE: 300_000,  # 5 min
    Deadline.NON_BLOCKING: None,  # no timeout
}.get(st.deadline)

try:
    result_env = asyncio.timeout(deadline_timeout_ms / 1000, self.route_envelope(sub_env))
except asyncio.TimeoutError:
    self.receive_result(subtask_id, None, False, f"Deadline exceeded ({deadline_timeout_ms}ms)")
```

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Critical Bugs | 4 | Must fix before production |
| Functional Gaps | 4 | Feature completeness issues |
| Inconsistencies | 4 | Maintenance/correctness risk |
| Test Coverage Gaps | 4 | Hidden bugs, edge cases |
| Improvements | 5 | Quality of life, observability |

**Overall Risk Assessment**: **MEDIUM-HIGH**
- The critical bugs (double-scrape, DAG cycles, recursion, LLM synthesis) must be fixed before production deployment
- Test coverage is incomplete; self-correction and error paths are untested
- Duplicate data structures and hardcoded mappings create maintenance burden
- Memory leaks and workspace cleanup are long-term stability concerns

**Recommended Action**:
1. Fix the 4 critical bugs immediately
2. Implement cycle detection in orchestrator
3. Add comprehensive tests for self-correction and error paths
4. Unify module metadata definitions
5. Implement workspace cleanup and memory monitoring
