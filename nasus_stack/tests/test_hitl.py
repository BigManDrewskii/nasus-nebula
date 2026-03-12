"""
Tests for Human-in-the-loop (HITL) checkpoints.

Covers:
- execute_plan pauses at irreversible modules when interrupt_on_irreversible=True
- approve() / reject() update approval registry
- Approved subtasks execute normally on next call to execute_plan
- Rejected subtasks are marked FAILED
- Non-irreversible modules are never paused
- HTTP approve/reject endpoints
"""

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_orchestrator import (
    NasusOrchestrator, Subtask, SubtaskIO, SubtaskStatus, Deadline,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_subtask(sid: str, module: str = "M05",
                  instruction: str = "generate code", stage: int = 1,
                  depends_on=None):
    return Subtask(
        subtask_id=sid,
        module=module,
        instruction=instruction,
        inputs=[SubtaskIO(name="spec", description="spec", source="user")],
        outputs=[SubtaskIO(name="code", description="output", source="")],
        depends_on=depends_on or [],
        deadline=Deadline.NON_BLOCKING,
        stage=stage,
    )


# ---------------------------------------------------------------------------
# Pause behaviour
# ---------------------------------------------------------------------------

def test_irreversible_subtask_is_paused():
    """M05 (code execution) must pause when interrupt_on_irreversible=True."""
    orch = NasusOrchestrator()
    orch.build_plan("generate and run code", [_make_subtask("s1", module="M05")])

    report = orch.execute_plan(interrupt_on_irreversible=True)

    assert report["output_type"] == "CHECKPOINT"
    assert len(report["pending_approvals"]) == 1
    assert report["pending_approvals"][0]["subtask_id"] == "s1"
    assert orch.subtasks["s1"].status == SubtaskStatus.AWAITING_APPROVAL


def test_non_irreversible_subtask_is_not_paused():
    """M06 (content creator) is never paused, even with the flag on."""
    orch = NasusOrchestrator()
    orch.build_plan("write content", [_make_subtask("s1", module="M06", instruction="write blog post")])

    report = orch.execute_plan(interrupt_on_irreversible=True)

    # Should complete normally — no CHECKPOINT
    assert report.get("output_type") != "CHECKPOINT"
    assert "reflection" in report


def test_flag_off_never_pauses():
    """With interrupt_on_irreversible=False (default), M05 runs without checkpoint."""
    orch = NasusOrchestrator()
    orch.build_plan("generate code", [_make_subtask("s1", module="M05")])

    report = orch.execute_plan(interrupt_on_irreversible=False)

    assert report.get("output_type") != "CHECKPOINT"


# ---------------------------------------------------------------------------
# Approve / reject
# ---------------------------------------------------------------------------

def test_approve_updates_registry():
    orch = NasusOrchestrator()
    orch.build_plan("code", [_make_subtask("s1", "M05")])
    orch.execute_plan(interrupt_on_irreversible=True)  # pause
    assert orch._approvals.get("s1") is None  # not yet approved

    orch.approve("s1")
    assert orch._approvals["s1"] == "approved"


def test_reject_updates_registry():
    orch = NasusOrchestrator()
    orch.build_plan("code", [_make_subtask("s1", "M05")])
    orch.execute_plan(interrupt_on_irreversible=True)

    orch.reject("s1")
    assert orch._approvals["s1"] == "rejected"


def test_approved_subtask_executes_on_resume():
    """After approve(), execute_plan proceeds and the subtask completes."""
    orch = NasusOrchestrator()
    orch.build_plan("code", [_make_subtask("s1", "M05", "write hello world in python")])

    # First pass — should pause
    orch.execute_plan(interrupt_on_irreversible=True)
    assert orch.subtasks["s1"].status == SubtaskStatus.AWAITING_APPROVAL

    # Approve, then resume
    orch.approve("s1")
    report = orch.execute_plan(interrupt_on_irreversible=True)

    # Should no longer be a CHECKPOINT
    assert report.get("output_type") != "CHECKPOINT"
    # Subtask should be DONE (module template fallback marks DONE)
    assert orch.subtasks["s1"].status == SubtaskStatus.COMPLETED


def test_rejected_subtask_is_marked_failed():
    orch = NasusOrchestrator()
    orch.build_plan("code", [_make_subtask("s1", "M05")])
    orch.execute_plan(interrupt_on_irreversible=True)

    orch.reject("s1")
    report = orch.execute_plan(interrupt_on_irreversible=True)

    assert orch.subtasks["s1"].status == SubtaskStatus.FAILED
    assert report.get("output_type") != "CHECKPOINT"


def test_checkpoint_logged():
    orch = NasusOrchestrator()
    orch.build_plan("code", [_make_subtask("s1", "M05")])
    orch.execute_plan(interrupt_on_irreversible=True)
    assert any("checkpoint" in line.lower() or "awaiting" in line.lower()
               for line in orch.log)


# ---------------------------------------------------------------------------
# HTTP endpoints
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def hitl_client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("hitl_ws")
    from nasus_sidecar.workspace_io import init_workspace_io
    init_workspace_io(base=str(tmp / "workspaces"))
    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c


def test_http_approve_unknown_job_succeeds(hitl_client):
    """Approve is job-id agnostic (job_id is informational only)."""
    resp = hitl_client.post(
        "/task/job_test/approve",
        json={"subtask_id": "s_http_test"},
    )
    assert resp.status_code == 200
    assert resp.json()["decision"] == "approved"


def test_http_reject_unknown_job_succeeds(hitl_client):
    resp = hitl_client.post(
        "/task/job_test/reject",
        json={"subtask_id": "s_http_reject"},
    )
    assert resp.status_code == 200
    assert resp.json()["decision"] == "rejected"


def test_http_approve_updates_orchestrator(hitl_client):
    """POST /approve must call orchestrator.approve() so the singleton is updated."""
    from nasus_sidecar.app import _orchestrator
    resp = hitl_client.post(
        "/task/job_xyz/approve",
        json={"subtask_id": "s_orch_check"},
    )
    assert resp.status_code == 200
    assert _orchestrator._approvals.get("s_orch_check") == "approved"
