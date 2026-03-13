"""
Tests for the agent self-correction loop in execute_plan().

The loop re-dispatches failed subtasks when:
  - max_correction_cycles > 0  (default = 0, so opt-in)
  - reflection.passed == False
  - at least one subtask has status FAILED
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_orchestrator import NasusOrchestrator, Subtask, SubtaskIO
from nasus_orchestrator_schema import Deadline, SubtaskStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _m09_subtask(sid: str, stage: int = 1) -> Subtask:
    return Subtask(
        subtask_id=sid,
        module="M09",
        instruction="health_check",
        inputs=[SubtaskIO(name="action", description="action", source="user", value="health_check")],
        outputs=[SubtaskIO(name="result", description="output", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=stage,
    )


def _m06_bad_subtask(sid: str, stage: int = 1) -> Subtask:
    """M06 with empty instruction → topic="" → always fails."""
    return Subtask(
        subtask_id=sid,
        module="M06",
        instruction="",
        inputs=[],
        outputs=[SubtaskIO(name="result", description="output", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=stage,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_no_correction_when_reflection_passes():
    """All subtasks complete → reflection.passed=True → no retry cycle."""
    orch = NasusOrchestrator()
    orch.build_plan("all succeed", [_m09_subtask("ok1"), _m09_subtask("ok2")])

    report = orch.execute_plan(max_correction_cycles=1)

    assert report["reflection"]["passed"] is True
    assert orch.subtasks["ok1"].status == SubtaskStatus.COMPLETED
    assert orch.subtasks["ok2"].status == SubtaskStatus.COMPLETED


def test_correction_disabled_by_default():
    """execute_plan() without max_correction_cycles → failed subtask stays FAILED."""
    orch = NasusOrchestrator()
    orch.build_plan("one fails", [_m09_subtask("ok"), _m06_bad_subtask("bad")])

    report = orch.execute_plan()  # default max_correction_cycles=0

    assert orch.subtasks["bad"].status == SubtaskStatus.FAILED
    assert report["reflection"]["passed"] is False


def test_correction_cycle_retries_failed_subtask(monkeypatch):
    """
    With max_correction_cycles=1 and reflection failing, the loop resets the
    failed subtask and re-dispatches it. Monkeypatch _reflect to fail on the
    first call and succeed on the second; patch route_envelope to succeed for
    the bad module on the second dispatch.
    """
    orch = NasusOrchestrator()
    orch.build_plan("retry test", [_m09_subtask("ok"), _m06_bad_subtask("bad")])

    _reflect_calls = [0]
    _orig_reflect = orch._reflect

    def _fake_reflect(deliverables, goal):
        _reflect_calls[0] += 1
        if _reflect_calls[0] == 1:
            return {"passed": False, "score": 0.4, "issues": ["bad failed"], "suggestions": [], "method": "mock"}
        return _orig_reflect(deliverables, goal)

    monkeypatch.setattr(orch, "_reflect", _fake_reflect)

    # Patch route_envelope so M06 succeeds on the second call
    _m06_calls = [0]
    _orig_route = orch.route_envelope

    def _patched_route(envelope):
        from nasus_module_registry import ModuleID
        if envelope.module_id == ModuleID.M06:
            _m06_calls[0] += 1
            if _m06_calls[0] >= 2:
                envelope.mark_done({"content": "corrected output"})
                return envelope
        return _orig_route(envelope)

    monkeypatch.setattr(orch, "route_envelope", _patched_route)

    report = orch.execute_plan(max_correction_cycles=1)

    assert orch.subtasks["bad"].status == SubtaskStatus.COMPLETED
    assert orch.subtasks["ok"].status == SubtaskStatus.COMPLETED
    assert isinstance(report, dict)


def test_correction_stops_at_cycle_limit():
    """
    max_correction_cycles=1, subtask always fails → after one correction
    cycle the subtask is still FAILED, no infinite loop, report is returned.
    """
    orch = NasusOrchestrator()
    orch.build_plan("always fails", [_m06_bad_subtask("bad")])

    report = orch.execute_plan(max_correction_cycles=1)

    assert orch.subtasks["bad"].status == SubtaskStatus.FAILED
    assert isinstance(report, dict)
    assert "output_type" in report
