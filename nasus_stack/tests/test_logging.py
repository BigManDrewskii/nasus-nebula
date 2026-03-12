"""
Tests for structured JSON logging (nasus_sidecar/logger.py).
"""

import json
import logging
import pytest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))


# ---------------------------------------------------------------------------
# get_logger returns a LoggerAdapter
# ---------------------------------------------------------------------------

def test_get_logger_returns_adapter():
    from nasus_sidecar.logger import get_logger
    log = get_logger("test.unit")
    assert isinstance(log, logging.LoggerAdapter)


def test_get_logger_with_context_fields():
    from nasus_sidecar.logger import get_logger
    log = get_logger("test.ctx", session_id="sess_abc", module="M06")
    assert log.extra["session_id"] == "sess_abc"
    assert log.extra["module"] == "M06"


# ---------------------------------------------------------------------------
# JSON formatter
# ---------------------------------------------------------------------------

@pytest.fixture
def json_handler():
    """Install an in-memory ListHandler with JsonFormatter and return (handler, adapter)."""
    from nasus_sidecar.logger import _JsonFormatter, _configure_root, get_logger

    _configure_root()

    class _ListHandler(logging.Handler):
        def __init__(self):
            super().__init__()
            self.records: list[str] = []

        def emit(self, record):
            self.records.append(self.format(record))

    handler = _ListHandler()
    handler.setFormatter(_JsonFormatter())
    handler.setLevel(logging.DEBUG)

    # Attach to the nasus root logger
    root = logging.getLogger("nasus")
    root.addHandler(handler)

    log = get_logger("test.json", session_id="s1")
    yield handler, log

    root.removeHandler(handler)


def test_json_output_is_valid_json(json_handler):
    handler, log = json_handler
    log.info("hello")
    assert len(handler.records) >= 1
    parsed = json.loads(handler.records[-1])
    assert parsed["msg"] == "hello"


def test_json_output_has_required_fields(json_handler):
    handler, log = json_handler
    log.info("check fields")
    parsed = json.loads(handler.records[-1])
    for field in ("ts", "level", "logger", "msg"):
        assert field in parsed, f"Missing field: {field}"


def test_json_output_carries_context_fields(json_handler):
    handler, log = json_handler
    log.info("with ctx")
    parsed = json.loads(handler.records[-1])
    assert parsed.get("session_id") == "s1"


@pytest.mark.skipif(
    sys.version_info < (3, 12),
    reason="LoggerAdapter.merge_extra requires Python 3.12+",
)
def test_json_output_carries_extra_fields(json_handler):
    handler, log = json_handler
    # Note: "module" is a reserved LogRecord attribute — use non-reserved names
    log.info("with extra", extra={"stage": 3, "nasus_module": "M10"})
    parsed = json.loads(handler.records[-1])
    assert parsed.get("stage") == 3
    assert parsed.get("nasus_module") == "M10"


def test_json_level_name(json_handler):
    handler, log = json_handler
    log.warning("watch out")
    parsed = json.loads(handler.records[-1])
    assert parsed["level"] == "WARNING"


# ---------------------------------------------------------------------------
# Orchestrator uses structured logger when build_plan is called
# ---------------------------------------------------------------------------

def test_orchestrator_logs_build_plan():
    """
    After build_plan() is called, the orchestrator's internal log list should
    contain an entry about the plan, and the structured logger should be active.
    """
    from nasus_orchestrator import NasusOrchestrator, Subtask, SubtaskIO
    from nasus_orchestrator_schema import Deadline

    orch = NasusOrchestrator()
    st = Subtask(
        subtask_id="s1",
        module="M01",
        instruction="research AI",
        inputs=[SubtaskIO(name="query", description="", source="user")],
        outputs=[SubtaskIO(name="result", description="", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=1,
    )
    orch.build_plan("research goal", [st])

    # Internal log list always populated regardless of structured logger config
    assert any("plan" in entry.lower() or "Plan" in entry for entry in orch.log)
    # Structured logger was wired up successfully
    assert orch._logger is not None
