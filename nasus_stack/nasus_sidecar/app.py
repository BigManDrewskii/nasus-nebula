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
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Any, AsyncGenerator, Dict, List, Optional

# Add parent dir so imports work when run from code/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
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

# In-flight job registry: job_id -> NasusEnvelope
_jobs: Dict[str, NasusEnvelope] = {}

# SSE log queues: job_id -> asyncio.Queue of log line strings (None = sentinel)
_log_queues: Dict[str, asyncio.Queue] = {}


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _orchestrator, _memory
    _memory = MemoryStore()
    _orchestrator = NasusOrchestrator()
    yield
    # Cleanup: nothing needed for stateless sidecar


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
    allow_origins=["*"],  # Tauri webview origin; tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        env.mark_failed(str(exc))

    return env


async def _run_envelope(env: NasusEnvelope) -> None:
    """
    Execute a job envelope asynchronously.
    Routes M09 to MemoryStore, everything else to NasusOrchestrator.
    Updates _jobs[job_id] in place.
    """
    job_id = env.job_id
    await _push_log(
        job_id,
        json.dumps({
            "step": 0,
            "type": "log",
            "content": f"job {job_id} started module={env.module_id.value}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }),
    )

    loop = asyncio.get_event_loop()
    try:
        if env.module_id == ModuleID.M09:
            # M09: MemoryStore -- synchronous, run in thread pool
            result_env = await loop.run_in_executor(None, _route_m09, env)
        else:
            # All other modules: NasusOrchestrator.route_envelope
            result_env = await loop.run_in_executor(
                None, _orchestrator.route_envelope, env
            )

        _jobs[job_id] = result_env

        # Emit the LLM response (or any textual result) as a structured SidecarStep
        # so the TypeScript client can display it in the chat UI.
        payload_data = result_env.payload if result_env.payload else {}
        if isinstance(payload_data, dict):
            response_text = (
                payload_data.get("response")
                or payload_data.get("content")
                or payload_data.get("next_recommended_action")
                or ""
            )
            if response_text:
                step_event = json.dumps({
                    "step": 1,
                    "type": "final",
                    "content": str(response_text),
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                await _push_log(job_id, step_event)

        await _push_log(
            job_id,
            json.dumps({
                "step": 0,
                "type": "log",
                "content": f"job {job_id} completed status={result_env.status.value if hasattr(result_env.status, 'value') else result_env.status}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        )

    except Exception as exc:
        env.mark_failed(str(exc))
        _jobs[job_id] = env
        await _push_log(
            job_id,
            json.dumps({
                "step": 0,
                "type": "error",
                "content": f"job {job_id} FAILED: {exc}",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }),
        )

    finally:
        # Signal SSE stream to close
        q = _log_queues.get(job_id)
        if q is not None:
            await q.put(None)  # None = sentinel -> stream closes


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
    llm_client.configure(
        api_key=req.api_key,
        api_base=req.api_base,
        model=req.model,
        timeout_s=req.timeout_s,
    )

    # Inject a live client into the orchestrator singleton so M10/M11/M00
    # calls made after this point use LLM reasoning.
    if _orchestrator is not None:
        _orchestrator.llm = llm_client.get_client(model=req.model)

    return {
        "status": "configured",
        "api_base": req.api_base,
        "model": req.model,
        "llm_ready": llm_client.is_configured(),
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

    return {"job_id": job_id, "status": "cancelled"}


# ---------------------------------------------------------------------------
# Global error handler
# ---------------------------------------------------------------------------


@app.exception_handler(Exception)
async def global_error_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content={
            "error": str(exc),
            "type": type(exc).__name__,
            "path": str(request.url),
        },
    )
