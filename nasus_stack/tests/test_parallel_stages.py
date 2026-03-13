"""
Tests for parallel stage execution in execute_plan().

Uses M09 (action=health_check) for the success path — works with no credentials.
M01 with no 'query' field reliably fails for the "one-fails" case.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus
from nasus_orchestrator import NasusOrchestrator, Subtask, SubtaskIO
from nasus_orchestrator_schema import Deadline, SubtaskStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _m09_subtask(sid: str) -> Subtask:
    return Subtask(
        subtask_id=sid,
        module="M09",
        instruction="health_check",
        inputs=[SubtaskIO(name="action", description="action", source="user", value="health_check")],
        outputs=[SubtaskIO(name="result", description="output", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=1,
    )


def _m06_bad_subtask(sid: str) -> Subtask:
    """M06 with empty instruction → topic="" → M06 rejects (falsy topic)."""
    return Subtask(
        subtask_id=sid,
        module="M06",
        instruction="",  # becomes topic="" → M06.route_envelope marks failed
        inputs=[],
        outputs=[SubtaskIO(name="result", description="output", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=1,
    )


def _run_two_subtask_plan(st1: Subtask, st2: Subtask) -> NasusOrchestrator:
    orch = NasusOrchestrator()
    orch.build_plan("parallel test goal", [st1, st2])
    orch.execute_plan()
    return orch


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_parallel_stage_both_subtasks_complete():
    """Two M09 subtasks in the same stage both complete via the parallel path."""
    orch = NasusOrchestrator()
    subtasks = [_m09_subtask("p1"), _m09_subtask("p2")]
    orch.build_plan("parallel health checks", subtasks)

    assert orch.stages[0].can_parallelize is True

    orch.execute_plan()

    assert orch.subtasks["p1"].status == SubtaskStatus.COMPLETED
    assert orch.subtasks["p2"].status == SubtaskStatus.COMPLETED
    assert len(orch.deliverables) == 2


def test_single_subtask_stage_completes():
    """A single-subtask stage runs through the serial path and completes."""
    orch = NasusOrchestrator()
    orch.build_plan("serial health check", [_m09_subtask("s1")])

    assert orch.stages[0].can_parallelize is False

    orch.execute_plan()

    assert orch.subtasks["s1"].status == SubtaskStatus.COMPLETED
    assert len(orch.deliverables) == 1


def test_parallel_stage_deliverable_count_correct():
    """Three M09 subtasks in one stage produce 3 deliverables with unique indices."""
    orch = NasusOrchestrator()
    subtasks = [_m09_subtask("q1"), _m09_subtask("q2"), _m09_subtask("q3")]
    orch.build_plan("triple parallel", subtasks)

    assert orch.stages[0].can_parallelize is True

    orch.execute_plan()

    assert len(orch.deliverables) == 3
    indices = [d.index for d in orch.deliverables]
    assert len(set(indices)) == 3, f"Duplicate deliverable indices: {indices}"


def test_parallel_stage_one_fails_other_completes():
    """When one parallel subtask fails the other still completes; no exception escapes."""
    orch = NasusOrchestrator()
    subtasks = [_m09_subtask("ok"), _m06_bad_subtask("bad")]
    orch.build_plan("mixed parallel", subtasks)

    assert orch.stages[0].can_parallelize is True

    report = orch.execute_plan()  # must not raise

    assert orch.subtasks["ok"].status == SubtaskStatus.COMPLETED
    assert orch.subtasks["bad"].status == SubtaskStatus.FAILED
    assert isinstance(report, dict)
