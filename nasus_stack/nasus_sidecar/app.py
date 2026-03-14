"""
nasus_sidecar/app.py
====================
FastAPI sidecar server for the Nasus stack.
Runs on localhost:4751. Spawned by Tauri as a sidecar process.

Endpoints:
  GET  /health                    -- liveness + module status
  POST /task                      -- submit a NasusEnvelope job
  GET  /task/{job_id}/status      -- poll job status
  GET  /task/{job_id}/stream      -- SSE stream of job log lines
  DELETE /task/{job_id}           -- cancel a running job

Adaptation notes (Phase 6):
  - NasusEnvelope(module_id, payload) -- module_id and payload are positional
  - NasusStatus enum used for status comparisons (not bare strings)
  - MemoryStore (not MemoryManager) is the actual class in nasus_memory_manager.py
    M09 calls are routed by payload['action']: write / read / query / forget /
    summarize_session / health_check / export_snapshot
  - NasusOrchestrator() takes no constructor args
  - route_envelope(envelope) is the single IPC entry point for M00/M10/M11/etc.

Phase 6 of Nasus Stack hardening.
"""

from __future__ import annotations

import asyncio
import json
import os
import sys
import time
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from collections import deque
from typing import Any, AsyncGenerator, Dict, List, Optional

# Add parent dir so imports work when run from code/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import re as _re

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse

_SECRET_RE = _re.compile(
    r'(Bearer\s+|api[_-]?key[=:\s]+)[^\s\'"&,]{8,}',
    _re.IGNORECASE,
)


def _redact_secrets(text: str) -> str:
    return _SECRET_RE.sub(r'\1[REDACTED]', text)
from nasus_memory_manager import MemoryStore
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus
from nasus_orchestrator import NasusOrchestrator
from pydantic import BaseModel

from nasus_sidecar import llm_client

# ---------------------------------------------------------------------------
# Singletons -- initialised at startup
# ---------------------------------------------------------------------------

_orchestrator: Optional[NasusOrchestrator] = None
_memory: Optional[MemoryStore] = None

# Search API keys — populated via POST /configure
_SEARCH_CONFIG: Dict[str, str] = {"exa_key": "", "brave_key": "", "serper_key": ""}


def get_search_config() -> Dict[str, str]:
    """Read-only snapshot of current search key config (imported by M01 and other research modules)."""
    return dict(_SEARCH_CONFIG)


# In-flight job registry: job_id -> NasusEnvelope
_jobs: Dict[str, NasusEnvelope] = {}

# Bounded deque of completed/failed job IDs — O(1) popleft for old _jobs eviction.
_MAX_COMPLETED_JOBS = 200
_completed_job_order: deque = deque()

# SSE log queues: job_id -> asyncio.Queue of log line strings (None = sentinel)
_log_queues: Dict[str, asyncio.Queue] = {}

# Per-job orchestrator instances preserved when a job returns a CHECKPOINT.
# Keyed by job_id. Entries are removed on resume or cancel.
_job_orchestrators: Dict[str, NasusOrchestrator] = {}
# Creation timestamps for TTL-based checkpoint cleanup.
_job_orchestrators_ts: Dict[str, float] = {}
_CHECKPOINT_TTL_S = 3600  # 1 hour

# Process start time for uptime calculation
_start_time: float = time.monotonic()


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


async def _checkpoint_ttl_cleanup() -> None:
    """Background task: evict _job_orchestrators entries older than _CHECKPOINT_TTL_S."""
    while True:
        await asyncio.sleep(300)  # check every 5 minutes
        cutoff = time.monotonic() - _CHECKPOINT_TTL_S
        expired = [jid for jid, ts in list(_job_orchestrators_ts.items()) if ts < cutoff]
        for jid in expired:
            _job_orchestrators.pop(jid, None)
            _job_orchestrators_ts.pop(jid, None)


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _orchestrator, _memory
    _db_dir = Path.home() / ".nasus"
    _db_dir.mkdir(parents=True, exist_ok=True)
    _memory = MemoryStore(db_path=str(_db_dir / "memory.db"))
    _orchestrator = NasusOrchestrator()
    from nasus_sidecar.workspace_io import init_workspace_io
    init_workspace_io(base=str(_db_dir / "workspaces"))
    cleanup_task = asyncio.create_task(_checkpoint_ttl_cleanup())
    yield
    cleanup_task.cancel()
    try:
        await cleanup_task
    except asyncio.CancelledError:
        pass


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Nasus Sidecar",
    version="1.0.0",
    description="Python sidecar for the Nasus AI stack. Runs on port 4751.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "tauri://localhost",
        "https://tauri.localhost",
        "http://localhost",
        "http://127.0.0.1",
        "http://localhost:5173",  # Vite dev server
        "http://localhost:4173",  # Vite preview
        "http://localhost:8080",  # Orchids proxy
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

from nasus_sidecar.logger import get_logger as _get_logger
_access_log = _get_logger("http")


@app.middleware("http")
async def _request_log_middleware(request: Request, call_next):
    response = await call_next(request)
    _access_log.info(
        f"{request.method} {request.url.path}",
        extra={
            "status": response.status_code,
            "client": request.client.host if request.client else "",
        },
    )
    return response


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class EnvelopeRequest(BaseModel):
    job_id: Optional[str] = None
    module_id: str  # e.g. "M00", "M09", "M10"
    payload: Optional[Dict[str, Any]] = None
    errors: List[str] = []


class LLMConfigRequest(BaseModel):
    api_key: str
    api_base: str = "https://openrouter.ai/api/v1"
    model: str = "openai/gpt-4o-mini"
    timeout_s: float = 60.0
    exa_key: str = ""
    brave_key: str = ""
    serper_key: str = ""
    token_budget: Optional[int] = None  # per-session cumulative token cap


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _build_envelope(req: EnvelopeRequest) -> NasusEnvelope:
    """Build a NasusEnvelope from an incoming HTTP request."""
    job_id = req.job_id or f"job_{uuid.uuid4().hex[:8]}"
    try:
        module_id = ModuleID(req.module_id)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Unknown module_id: {req.module_id!r}. Valid values: {[m.value for m in ModuleID]}",
        )
    env = NasusEnvelope(
        module_id=module_id,
        payload=req.payload or {},
    )
    # Override the auto-generated job_id with the requested one
    env.job_id = job_id
    for err in req.errors:
        env.add_error(err)
    return env


def _envelope_to_dict(env: NasusEnvelope) -> Dict[str, Any]:
    """Serialize a NasusEnvelope to a plain JSON-safe dict."""
    return env.to_dict()


async def _push_log(job_id: str, line: str) -> None:
    q = _log_queues.get(job_id)
    if q is not None:
        await q.put(line)


def _route_m09(env: NasusEnvelope) -> NasusEnvelope:
    """
    Route an M09 envelope to MemoryStore.

    The payload must contain an 'action' key. Supported actions:
      write             -- layer, key, value, metadata (opt)
      read              -- layer, key (opt)
      query             -- query (natural language string)
      forget            -- layer, key
      summarize_session -- session_id, module, raw_output
      health_check      -- (no args)
      export_snapshot   -- (no args)
    """
    env.mark_running()
    if _memory is None:
        env.mark_failed("Memory store not initialised — sidecar still starting up")
        return env
    payload = env.payload or {}
    action = payload.get("action", "")

    try:
        if action == "write":
            result = _memory.write(
                layer=payload["layer"],
                key=payload["key"],
                value=payload["value"],
                metadata=payload.get("metadata"),
            )
        elif action == "read":
            result = _memory.read(
                layer=payload["layer"],
                key=payload.get("key"),
            )
        elif action == "query":
            result = _memory.query(payload["query"])
        elif action == "forget":
            result = _memory.forget(
                layer=payload["layer"],
                key=payload["key"],
            )
        elif action == "summarize_session":
            result = _memory.summarize_session(
                session_id=payload["session_id"],
                module=payload["module"],
                raw_output=payload["raw_output"],
            )
        elif action == "health_check":
            result = _memory.health_check()
        elif action == "export_snapshot":
            result = _memory.export_snapshot()
        else:
            raise ValueError(
                f"Unknown M09 action: {action!r}. "
                "Valid: write, read, query, forget, summarize_session, health_check, export_snapshot"
            )

        env.mark_done(result)

    except (KeyError, TypeError) as exc:
        env.mark_failed(f"M09 {action} missing required field: {exc}")
    except Exception as exc:
        env.mark_failed(_redact_secrets(str(exc)))

    return env


async def _run_envelope(env: NasusEnvelope) -> None:
    """
    Execute a job envelope asynchronously.
    Routes M09 to MemoryStore, everything else to a per-job NasusOrchestrator
    instance with a thread-safe step emitter for real-time progress.
    Updates _jobs[job_id] in place.
    """
    job_id = env.job_id
    loop = asyncio.get_event_loop()

    # Thread-safe emitter: called from the executor thread to push SidecarStep
    # events onto this job's SSE queue on the asyncio event loop.
    def _push_step_sync(step_dict: Dict[str, Any]) -> None:
        future = asyncio.run_coroutine_threadsafe(
            _push_log(job_id, json.dumps(step_dict)), loop
        )
        try:
            future.result(timeout=2.0)
        except Exception:
            pass  # Never let a logging failure abort execution

    try:
        if env.module_id == ModuleID.M09:
            # M09: MemoryStore — synchronous, no progress steps needed
            result_env = await loop.run_in_executor(None, _route_m09, env)
        else:
            # Create a fresh per-job orchestrator so concurrent jobs never share
            # emitter state, then wire up the step emitter for live progress.
            job_orch = NasusOrchestrator()

            # Prefer a per-task api_base from the payload (sent by the TypeScript
            # orchestrator alongside every task). This eliminates race conditions
            # where the global _CONFIG or _orchestrator.llm is stale from a previous
            # provider session (e.g. DeepSeek key left over when switching to OpenRouter).
            payload_for_llm = env.payload or {}
            task_api_base = payload_for_llm.get("api_base", "").rstrip("/") if isinstance(payload_for_llm, dict) else ""

            if task_api_base and llm_client.is_configured():
                cfg = llm_client.get_config()
                if cfg.api_base != task_api_base:
                    from nasus_sidecar.llm_client import _LLMConfig, NasusLLMClient
                    per_task_cfg = _LLMConfig(
                        api_key=cfg.api_key,
                        api_base=task_api_base,
                        default_model=cfg.default_model,
                        timeout_s=cfg.timeout_s,
                        max_retries=cfg.max_retries,
                    )
                    job_orch.llm = NasusLLMClient(model=cfg.default_model, _cfg=per_task_cfg)
                else:
                    job_orch.llm = llm_client.get_client()
            elif _orchestrator is not None and _orchestrator.llm is not None:
                job_orch.llm = _orchestrator.llm
            elif llm_client.is_configured():
                job_orch.llm = llm_client.get_client()
            job_orch._emitter = _push_step_sync

            result_env = await loop.run_in_executor(
                None, job_orch.route_envelope, env
            )

        _jobs[job_id] = result_env

        # When the result is a CHECKPOINT, keep job_orch alive so
        # /approve, /reject, and /resume can operate on the same instance.
        payload_result = result_env.payload if result_env.payload else {}
        if isinstance(payload_result, dict) and payload_result.get("output_type") == "CHECKPOINT":
            _job_orchestrators[job_id] = job_orch
            _job_orchestrators_ts[job_id] = time.monotonic()
        else:
            # Track completion order for bounded _jobs cleanup (O(1) deque ops).
            _completed_job_order.append(job_id)
            if len(_completed_job_order) > _MAX_COMPLETED_JOBS:
                old_id = _completed_job_order.popleft()
                _jobs.pop(old_id, None)

        # Emit the full response as a final step ONLY if it wasn't already streamed
        # token-by-token via the emitter (streamed=True means each chunk was already pushed).
        payload_data = result_env.payload if result_env.payload else {}
        already_streamed = isinstance(payload_data, dict) and payload_data.get("streamed")
        if not already_streamed and isinstance(payload_data, dict):
            response_text = (
                payload_data.get("response")
                or payload_data.get("content")
                or payload_data.get("next_recommended_action")
                or ""
            )
            if response_text:
                await _push_log(
                    job_id,
                    json.dumps({
                        "step": 1,
                        "type": "final",
                        "content": str(response_text),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }),
                )

    except Exception as exc:
        safe_msg = _redact_secrets(str(exc))
        env.mark_failed(safe_msg)
        _jobs[job_id] = env
        await _push_log(
            job_id,
            json.dumps({
                "step": 0,
                "type": "error",
                "content": f"job {job_id} FAILED: {safe_msg}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        )

    finally:
        # Signal SSE stream to close
        q = _log_queues.get(job_id)
        if q is not None:
            await q.put(None)  # None = sentinel -> stream closes


async def _run_resume(new_job_id: str, job_orch: NasusOrchestrator) -> None:
    """
    Re-run execute_plan(interrupt_on_irreversible=True) on a stored per-job
    orchestrator after all HITL decisions have been recorded. Streams step
    events under new_job_id and writes the final result to _jobs[new_job_id].
    """
    loop = asyncio.get_event_loop()

    def _push_step_sync(step_dict: Dict[str, Any]) -> None:
        future = asyncio.run_coroutine_threadsafe(
            _push_log(new_job_id, json.dumps(step_dict)), loop
        )
        try:
            future.result(timeout=2.0)
        except Exception:
            pass

    job_orch._emitter = _push_step_sync  # type: ignore[attr-defined]

    try:
        result_dict = await loop.run_in_executor(
            None, lambda: job_orch.execute_plan(interrupt_on_irreversible=True)
        )
        resume_env = _jobs.get(new_job_id)
        if resume_env is None:
            # Shouldn't happen if caller pre-registered the job, but guard anyway.
            from nasus_module_registry import ModuleID as _MID
            resume_env = NasusEnvelope(module_id=_MID.M00, payload={})
            resume_env.job_id = new_job_id
            _jobs[new_job_id] = resume_env
        resume_env.mark_done(result_dict)

        # If still a CHECKPOINT, store the orch again so client can re-resume.
        if isinstance(result_dict, dict) and result_dict.get("output_type") == "CHECKPOINT":
            _job_orchestrators[new_job_id] = job_orch
            _job_orchestrators_ts[new_job_id] = time.monotonic()
        else:
            _completed_job_order.append(new_job_id)
            if len(_completed_job_order) > _MAX_COMPLETED_JOBS:
                old_id = _completed_job_order.popleft()
                _jobs.pop(old_id, None)

        payload_data = resume_env.payload if resume_env.payload else {}
        if not isinstance(payload_data, dict) or not payload_data.get("streamed"):
            response_text = (
                payload_data.get("response")
                or payload_data.get("content")
                or payload_data.get("next_recommended_action")
                or ""
            ) if isinstance(payload_data, dict) else ""
            if response_text:
                await _push_log(
                    new_job_id,
                    json.dumps({
                        "step": 1,
                        "type": "final",
                        "content": str(response_text),
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                    }),
                )
    except Exception as exc:
        safe_msg = _redact_secrets(str(exc))
        env = _jobs.get(new_job_id)
        if env:
            env.mark_failed(safe_msg)
        await _push_log(
            new_job_id,
            json.dumps({
                "step": 0,
                "type": "error",
                "content": f"resume {new_job_id} FAILED: {safe_msg}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        )
    finally:
        q = _log_queues.get(new_job_id)
        if q is not None:
            await q.put(None)


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/health")
async def health() -> Dict[str, Any]:
    """Liveness check. Tauri polls this before marking sidecar ready."""
    active = [
        j for j in _jobs.values() if getattr(j, "status", None) == NasusStatus.RUNNING
    ]
    return {
        "status": "ok",
        "version": "1.0.0",
        "modules": [m.value for m in ModuleID],
        "active_jobs": len(active),
        "total_jobs": len(_jobs),
        "llm_configured": llm_client.is_configured(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/configure")
async def configure_llm(req: LLMConfigRequest) -> Dict[str, Any]:
    """
    Configure the LLM client used by all Nasus modules.
    Called once by the Tauri frontend after the app starts and an API key is available.
    Safe to call multiple times (e.g. when the user changes their API key in Settings).

    After updating the global config, injects a fresh NasusLLMClient into the
    running _orchestrator singleton so subsequent route_envelope() calls immediately
    benefit from LLM reasoning without requiring a restart.
    """
    global _SEARCH_CONFIG

    llm_client.configure(
        api_key=req.api_key,
        api_base=req.api_base,
        model=req.model,
        timeout_s=req.timeout_s,
    )

    # Persist search API keys for use by M01 and other research modules.
    _SEARCH_CONFIG["exa_key"] = req.exa_key
    _SEARCH_CONFIG["brave_key"] = req.brave_key
    _SEARCH_CONFIG["serper_key"] = req.serper_key

    # Inject a live client into the orchestrator singleton so M10/M11/M00
    # calls made after this point use LLM reasoning.
    if _orchestrator is not None:
        _orchestrator.llm = llm_client.get_client(model=req.model, token_budget=req.token_budget)

    # Batch-embed existing memory entries now that the LLM is available.
    embedded_count = 0
    if _memory is not None:
        try:
            embedded_count = _memory.embed_all()
        except Exception:
            pass

    return {
        "status": "configured",
        "api_base": req.api_base,
        "model": req.model,
        "llm_ready": llm_client.is_configured(),
        "search_configured": bool(req.exa_key or req.brave_key or req.serper_key),
        "token_budget": req.token_budget,
        "embedded_count": embedded_count,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.post("/task")
async def submit_task(req: EnvelopeRequest) -> Dict[str, Any]:
    """
    Submit a job envelope. Returns immediately with job_id and PENDING status.
    Poll /task/{job_id}/status or stream /task/{job_id}/stream for results.
    """
    env = _build_envelope(req)
    job_id = env.job_id

    # Register job and create its SSE log queue
    _jobs[job_id] = env
    _log_queues[job_id] = asyncio.Queue()

    # Fire-and-forget
    asyncio.create_task(_run_envelope(env))

    return {
        "job_id": job_id,
        "status": NasusStatus.PENDING.value,
        "message": (
            f"Job {job_id} queued for module {req.module_id}. "
            f"Poll /task/{job_id}/status or stream /task/{job_id}/stream."
        ),
    }


@app.get("/task/{job_id}/status")
async def task_status(job_id: str) -> Dict[str, Any]:
    """Poll job status. Returns current envelope state."""
    env = _jobs.get(job_id)
    if not env:
        raise HTTPException(status_code=404, detail=f"Job {job_id!r} not found")
    return _envelope_to_dict(env)


@app.get("/task/{job_id}/stream")
async def task_stream(job_id: str) -> StreamingResponse:
    """
    SSE stream of log lines for a running job.
    Closes automatically when the job completes.
    """
    if job_id not in _jobs:
        raise HTTPException(status_code=404, detail=f"Job {job_id!r} not found")

    queue = _log_queues.get(job_id)
    if queue is None:
        # Job already completed — queue was consumed. Emit response + done so the
        # TypeScript client can still display the result if it missed the live stream.
        env = _jobs[job_id]

        async def single_event() -> AsyncGenerator[str, None]:
            payload_data = env.payload if env.payload else {}
            if isinstance(payload_data, dict):
                response_text = (
                    payload_data.get("response")
                    or payload_data.get("content")
                    or payload_data.get("next_recommended_action")
                    or ""
                )
                if response_text:
                    yield (
                        f"data: {json.dumps({'step': 1, 'type': 'final', 'content': str(response_text), 'timestamp': datetime.now(timezone.utc).isoformat()})}\n\n"
                    )
            yield (
                f"data: {json.dumps({'done': True, 'status': env.status.value if hasattr(env.status, 'value') else str(env.status), 'job_id': job_id})}\n\n"
            )

        return StreamingResponse(single_event(), media_type="text/event-stream")

    async def event_generator() -> AsyncGenerator[str, None]:
        try:
            while True:
                line = await queue.get()
                if line is None:  # sentinel -- job done
                    env = _jobs.get(job_id)
                    if env:
                        yield (
                            f"data: {json.dumps({'done': True, 'status': env.status.value if hasattr(env.status, 'value') else env.status, 'job_id': job_id})}\n\n"
                        )
                    break
                # Try to emit as a structured SidecarStep JSON object directly.
                # Falls back to the legacy {log: ..., job_id: ...} wrapper for
                # plain-string log lines (e.g. from older code paths).
                try:
                    parsed = json.loads(line)
                    if isinstance(parsed, dict) and "step" in parsed:
                        yield f"data: {line}\n\n"
                        continue
                except (json.JSONDecodeError, TypeError, ValueError):
                    pass
                yield f"data: {json.dumps({'log': line, 'job_id': job_id})}\n\n"
        finally:
            _log_queues.pop(job_id, None)  # always release queue memory on exit or cancel

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@app.delete("/task/{job_id}")
async def cancel_task(job_id: str) -> Dict[str, Any]:
    """
    Cancel a job. Marks it FAILED with reason 'cancelled by client'.
    Note: Python tasks cannot be truly interrupted mid-run;
    this marks the envelope and closes the SSE stream.
    """
    env = _jobs.get(job_id)
    if not env:
        raise HTTPException(status_code=404, detail=f"Job {job_id!r} not found")

    current_status = getattr(env, "status", None)
    if current_status == NasusStatus.RUNNING:
        env.mark_failed("Cancelled by client request")

    # Push sentinel to close any open SSE stream
    q = _log_queues.get(job_id)
    if q is not None:
        await q.put(None)

    # Release any stored checkpoint orchestrator
    _job_orchestrators.pop(job_id, None)
    _job_orchestrators_ts.pop(job_id, None)

    return {"job_id": job_id, "status": "cancelled"}


# ---------------------------------------------------------------------------
# Workspace endpoints
# ---------------------------------------------------------------------------


@app.get("/workspace/{session_id}")
async def list_workspace(session_id: str) -> Dict[str, Any]:
    """List all artifact files for a session workspace."""
    from nasus_sidecar.workspace_io import get_workspace_io
    files = get_workspace_io().list(session_id)
    return {"session_id": session_id, "files": files, "count": len(files)}


@app.get("/workspace/{session_id}/{filename}")
async def get_artifact(session_id: str, filename: str) -> Any:
    """Return the content of a specific artifact file."""
    from nasus_sidecar.workspace_io import get_workspace_io
    try:
        content = get_workspace_io().load(session_id, filename)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail=f"Artifact {filename!r} not found in session {session_id!r}")
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    # Return JSON if the content parses cleanly, else plain text
    try:
        return JSONResponse(content=json.loads(content))
    except (json.JSONDecodeError, ValueError):
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content)


@app.delete("/workspace/{session_id}")
async def delete_workspace(session_id: str) -> Dict[str, Any]:
    """Delete all artifact files for a session workspace."""
    from nasus_sidecar.workspace_io import get_workspace_io
    count = get_workspace_io().delete_session(session_id)
    return {"session_id": session_id, "deleted_count": count}


# ---------------------------------------------------------------------------
# Metrics endpoint
# ---------------------------------------------------------------------------


@app.get("/metrics")
async def get_metrics() -> Dict[str, Any]:
    """Operational telemetry: job counts, token usage, memory stats, uptime."""
    job_list = list(_jobs.values())
    jobs_by_status: Dict[str, int] = {"pending": 0, "running": 0, "completed": 0, "failed": 0}
    for j in job_list:
        raw = getattr(j, "status", None)
        status_val = raw.value if raw is not None else ""
        if status_val == "PENDING":
            jobs_by_status["pending"] += 1
        elif status_val == "RUNNING":
            jobs_by_status["running"] += 1
        elif status_val == "DONE":
            jobs_by_status["completed"] += 1
        elif status_val == "FAILED":
            jobs_by_status["failed"] += 1

    client = _orchestrator.llm if _orchestrator is not None else None
    return {
        "jobs": {
            "total": len(job_list),
            **jobs_by_status,
        },
        "tokens": {
            "used": client.tokens_used if client is not None else 0,
            "budget": client.token_budget if client is not None else None,
            "budget_remaining": client.budget_remaining if client is not None else None,
        },
        "memory": _memory.health_check() if _memory is not None else {},
        "llm_configured": llm_client.is_configured(),
        "uptime_s": round(time.monotonic() - _start_time, 1),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# ---------------------------------------------------------------------------
# Human-in-the-loop checkpoint endpoints
# ---------------------------------------------------------------------------


class _ApprovalRequest(BaseModel):
    subtask_id: str


@app.post("/task/{job_id}/approve")
async def approve_subtask(job_id: str, req: _ApprovalRequest) -> Dict[str, Any]:
    """
    Approve a subtask that was paused at a HITL checkpoint.
    Call POST /task/{job_id}/resume after all decisions are recorded.
    """
    orch = _job_orchestrators.get(job_id) or _orchestrator
    if orch is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialised")
    orch.approve(req.subtask_id)
    return {
        "job_id": job_id,
        "subtask_id": req.subtask_id,
        "decision": "approved",
    }


@app.post("/task/{job_id}/reject")
async def reject_subtask(job_id: str, req: _ApprovalRequest) -> Dict[str, Any]:
    """
    Reject a subtask that was paused at a HITL checkpoint.
    Call POST /task/{job_id}/resume after all decisions are recorded.
    """
    orch = _job_orchestrators.get(job_id) or _orchestrator
    if orch is None:
        raise HTTPException(status_code=503, detail="Orchestrator not initialised")
    orch.reject(req.subtask_id)
    return {
        "job_id": job_id,
        "subtask_id": req.subtask_id,
        "decision": "rejected",
    }


@app.post("/task/{job_id}/resume")
async def resume_task(job_id: str) -> Dict[str, Any]:
    """
    Resume execution after all HITL approvals/rejections have been recorded.
    Calls execute_plan(interrupt_on_irreversible=True) on the stored per-job
    orchestrator and streams results under a new job_id.
    Returns {job_id: new_job_id, status: 'PENDING'} immediately.
    """
    job_orch = _job_orchestrators.pop(job_id, None)
    _job_orchestrators_ts.pop(job_id, None)
    if job_orch is None:
        raise HTTPException(
            status_code=404,
            detail=f"No checkpoint found for job_id={job_id!r}. "
                   "Either approvals were not recorded or job already resumed.",
        )
    new_job_id = f"resume_{uuid.uuid4().hex[:8]}"
    resume_env = NasusEnvelope(module_id=ModuleID.M00, payload={"resumed_from": job_id})
    resume_env.mark_running()
    _jobs[new_job_id] = resume_env
    _log_queues[new_job_id] = asyncio.Queue()
    asyncio.create_task(_run_resume(new_job_id, job_orch))
    return {
        "job_id": new_job_id,
        "status": NasusStatus.PENDING.value,
        "resumed_from": job_id,
    }


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": _redact_secrets(str(exc)),
            "type": type(exc).__name__,
            "path": str(request.url),
        },
    )
