"""
nasus_sidecar/logger.py
=======================
Structured JSON logging for the Nasus stack.

Usage
-----
    from nasus_sidecar.logger import get_logger

    log = get_logger("nasus.orchestrator", session_id="sess_abc")
    log.info("Plan built", extra={"stage_count": 3})
    log.warning("LLM not configured — using template fallback")
    log.error("Envelope failed", extra={"module": "M06", "job_id": "job_xyz"})

Output format (one JSON object per line)
-----------------------------------------
    {
      "ts": "2026-03-12T12:00:00.123456+00:00",
      "level": "INFO",
      "logger": "nasus.orchestrator",
      "msg": "Plan built",
      "session_id": "sess_abc",
      "stage_count": 3
    }

Destinations
------------
- File  : ~/.nasus/logs/nasus.log  (all levels ≥ DEBUG, JSON)
- Stderr: levels ≥ WARNING only (plain text for terminal readability)
"""

from __future__ import annotations

import json
import logging
import logging.handlers
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional


# ---------------------------------------------------------------------------
# JSON formatter
# ---------------------------------------------------------------------------

class _JsonFormatter(logging.Formatter):
    """Emit one JSON object per log record."""

    def format(self, record: logging.LogRecord) -> str:
        base: dict[str, Any] = {
            "ts": datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "msg": record.getMessage(),
        }

        # Merge any extra fields added by the caller or LoggerAdapter context
        for key, val in record.__dict__.items():
            if key.startswith("_") or key in _STDLIB_ATTRS:
                continue
            base[key] = val

        if record.exc_info:
            base["exc"] = self.formatException(record.exc_info)

        return json.dumps(base, default=str)


# Standard LogRecord attributes we don't want to re-emit
_STDLIB_ATTRS = frozenset({
    "args", "created", "exc_info", "exc_text", "filename", "funcName",
    "levelname", "levelno", "lineno", "message", "module", "msecs",
    "msg", "name", "pathname", "process", "processName", "relativeCreated",
    "stack_info", "taskName", "thread", "threadName",
})


# ---------------------------------------------------------------------------
# Stderr plain formatter (WARNING+)
# ---------------------------------------------------------------------------

_PLAIN_FMT = logging.Formatter(
    fmt="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)


# ---------------------------------------------------------------------------
# Root logger setup (called once at process start)
# ---------------------------------------------------------------------------

_configured = False


def _configure_root() -> None:
    global _configured
    if _configured:
        return
    _configured = True

    root = logging.getLogger("nasus")
    root.setLevel(logging.DEBUG)
    root.propagate = False

    # --- File handler (JSON, all levels) ---
    log_dir = Path.home() / ".nasus" / "logs"
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / "nasus.log"

    fh = logging.handlers.RotatingFileHandler(
        log_file,
        maxBytes=10 * 1024 * 1024,  # 10 MB
        backupCount=3,
        encoding="utf-8",
    )
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(_JsonFormatter())
    root.addHandler(fh)

    # --- Stderr handler (plain text, WARNING+) ---
    sh = logging.StreamHandler(sys.stderr)
    sh.setLevel(logging.WARNING)
    sh.setFormatter(_PLAIN_FMT)
    root.addHandler(sh)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_logger(name: str, **ctx: Any) -> logging.LoggerAdapter:
    """
    Return a LoggerAdapter for *name* under the "nasus" namespace.
    Any keyword arguments become persistent extra fields on every log record.

    Example
    -------
        log = get_logger("orchestrator", session_id="s123")
        log.info("Stage complete", extra={"stage": 2})
        # → {"ts": ..., "level": "INFO", "logger": "nasus.orchestrator",
        #    "msg": "Stage complete", "session_id": "s123", "stage": 2}
    """
    _configure_root()
    logger = logging.getLogger(f"nasus.{name}")
    # merge_extra=True (Python 3.12+): merges persistent ctx with per-call extra dicts
    try:
        return logging.LoggerAdapter(logger, ctx, merge_extra=True)
    except TypeError:
        return logging.LoggerAdapter(logger, ctx)
