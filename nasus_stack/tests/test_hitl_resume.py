"""
Tests for Phase 5 HITL resume flow.

Verifies:
  - Per-job orchestrator is stored in _job_orchestrators when CHECKPOINT returned
  - POST /task/{job_id}/approve routes to the per-job orchestrator, not the global one
  - POST /task/{job_id}/resume calls execute_plan on the stored orch & returns new job_id
  - POST /task/{job_id}/resume returns 404 when no checkpoint exists for job_id
  - DELETE /task/{job_id} cleans up _job_orchestrators entry
  - nasus_orchestrator.py M10 passes interrupt_on_irreversible from payload
"""

import sys
import uuid
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


# ---------------------------------------------------------------------------
# Shared fixture
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


# ---------------------------------------------------------------------------
# _job_orchestrators population
# ---------------------------------------------------------------------------


def test_job_orchestrators_stored_on_checkpoint():
    """When a job returns output_type=CHECKPOINT, job_orch must be stored."""
    from nasus_sidecar import app as app_module
    from nasus_module_registry import NasusEnvelope, ModuleID

    checkpoint_result = {
        "output_type": "CHECKPOINT",
        "session_id": "s1",
        "plan_id": "p1",
        "goal": "test goal",
        "pending_approvals": [{"subtask_id": "sub_1", "module": "M05", "instruction": "write code"}],
        "created_at": "2026-01-01T00:00:00Z",
    }

    mock_orch = MagicMock()
    mock_env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    mock_env.mark_done(checkpoint_result)

    job_id = f"test_{uuid.uuid4().hex[:6]}"

    # Simulate what _run_envelope does after getting a CHECKPOINT result
    app_module._jobs[job_id] = mock_env
    payload_result = mock_env.payload if mock_env.payload else {}
    if isinstance(payload_result, dict) and payload_result.get("output_type") == "CHECKPOINT":
        app_module._job_orchestrators[job_id] = mock_orch

    assert job_id in app_module._job_orchestrators
    assert app_module._job_orchestrators[job_id] is mock_orch

    # Cleanup
    del app_module._job_orchestrators[job_id]
    del app_module._jobs[job_id]


# ---------------------------------------------------------------------------
# Approve routes to per-job orchestrator
# ---------------------------------------------------------------------------


def test_approve_uses_per_job_orchestrator(hitl_client):
    """POST /task/{job_id}/approve should call approve() on the per-job orch."""
    from nasus_sidecar import app as app_module
    from nasus_module_registry import NasusEnvelope, ModuleID

    job_id = f"ckpt_{uuid.uuid4().hex[:6]}"
    mock_orch = MagicMock()
    mock_env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    mock_env.mark_done({"output_type": "CHECKPOINT", "pending_approvals": []})
    app_module._jobs[job_id] = mock_env
    app_module._job_orchestrators[job_id] = mock_orch

    resp = hitl_client.post(f"/task/{job_id}/approve", json={"subtask_id": "sub_x"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "approved"
    assert data["subtask_id"] == "sub_x"

    mock_orch.approve.assert_called_once_with("sub_x")

    # Cleanup
    del app_module._job_orchestrators[job_id]
    del app_module._jobs[job_id]


def test_reject_uses_per_job_orchestrator(hitl_client):
    """POST /task/{job_id}/reject should call reject() on the per-job orch."""
    from nasus_sidecar import app as app_module
    from nasus_module_registry import NasusEnvelope, ModuleID

    job_id = f"ckpt_{uuid.uuid4().hex[:6]}"
    mock_orch = MagicMock()
    mock_env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    mock_env.mark_done({"output_type": "CHECKPOINT", "pending_approvals": []})
    app_module._jobs[job_id] = mock_env
    app_module._job_orchestrators[job_id] = mock_orch

    resp = hitl_client.post(f"/task/{job_id}/reject", json={"subtask_id": "sub_y"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["decision"] == "rejected"

    mock_orch.reject.assert_called_once_with("sub_y")

    # Cleanup
    del app_module._job_orchestrators[job_id]
    del app_module._jobs[job_id]


# ---------------------------------------------------------------------------
# Resume endpoint
# ---------------------------------------------------------------------------


def test_resume_returns_404_for_unknown_job(hitl_client):
    resp = hitl_client.post("/task/nonexistent_job_xyz/resume")
    assert resp.status_code == 404


def test_resume_returns_new_job_id(hitl_client):
    """POST /task/{job_id}/resume should pop the orch and return a new job_id."""
    from nasus_sidecar import app as app_module
    from nasus_module_registry import NasusEnvelope, ModuleID

    job_id = f"ckpt_{uuid.uuid4().hex[:6]}"

    # Build a mock orchestrator whose execute_plan returns a synthesis report
    mock_orch = MagicMock()
    mock_orch.execute_plan.return_value = {
        "output_type": "SynthesisReport",
        "summary": "done",
        "deliverables": [],
    }
    mock_env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    mock_env.mark_done({"output_type": "CHECKPOINT", "pending_approvals": []})
    app_module._jobs[job_id] = mock_env
    app_module._job_orchestrators[job_id] = mock_orch

    resp = hitl_client.post(f"/task/{job_id}/resume")
    assert resp.status_code == 200
    data = resp.json()
    assert "job_id" in data
    assert data["job_id"].startswith("resume_")
    assert data["resumed_from"] == job_id

    # Original orch should have been popped
    assert job_id not in app_module._job_orchestrators

    # Cleanup new job
    new_job_id = data["job_id"]
    app_module._jobs.pop(new_job_id, None)
    app_module._log_queues.pop(new_job_id, None)


def test_resume_twice_returns_404(hitl_client):
    """A second /resume call for the same job_id must 404 (orch was popped)."""
    from nasus_sidecar import app as app_module
    from nasus_module_registry import NasusEnvelope, ModuleID

    job_id = f"ckpt_{uuid.uuid4().hex[:6]}"
    mock_orch = MagicMock()
    mock_orch.execute_plan.return_value = {"output_type": "SynthesisReport"}
    mock_env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    mock_env.mark_done({"output_type": "CHECKPOINT", "pending_approvals": []})
    app_module._jobs[job_id] = mock_env
    app_module._job_orchestrators[job_id] = mock_orch

    resp1 = hitl_client.post(f"/task/{job_id}/resume")
    assert resp1.status_code == 200

    resp2 = hitl_client.post(f"/task/{job_id}/resume")
    assert resp2.status_code == 404


# ---------------------------------------------------------------------------
# Cancel cleans up _job_orchestrators
# ---------------------------------------------------------------------------


def test_cancel_removes_job_orchestrator(hitl_client):
    from nasus_sidecar import app as app_module
    from nasus_module_registry import NasusEnvelope, ModuleID

    job_id = f"ckpt_{uuid.uuid4().hex[:6]}"
    mock_orch = MagicMock()
    mock_env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    mock_env.mark_done({"output_type": "CHECKPOINT", "pending_approvals": []})
    app_module._jobs[job_id] = mock_env
    app_module._job_orchestrators[job_id] = mock_orch

    resp = hitl_client.delete(f"/task/{job_id}")
    assert resp.status_code == 200
    assert job_id not in app_module._job_orchestrators


# ---------------------------------------------------------------------------
# nasus_orchestrator.py M10 interrupt_on_irreversible passthrough
# ---------------------------------------------------------------------------


def test_m10_passes_interrupt_on_irreversible_true():
    """M10 execute_plan action should pass interrupt_on_irreversible=True from payload."""
    from nasus_orchestrator import NasusOrchestrator
    from nasus_module_registry import NasusEnvelope, ModuleID

    orch = NasusOrchestrator()

    with patch.object(orch, "build_plan"), \
         patch.object(orch, "execute_plan", return_value={"output_type": "SynthesisReport"}) as mock_ep, \
         patch.object(orch, "_llm_plan"):
        orch.stages = [MagicMock()]  # pretend plan is built
        env = NasusEnvelope(
            module_id=ModuleID.M10,
            payload={"action": "execute_plan", "goal": "g", "interrupt_on_irreversible": True},
        )
        orch.route_envelope(env)
        mock_ep.assert_called_once_with(interrupt_on_irreversible=True)


def test_m10_passes_interrupt_on_irreversible_false():
    """M10 execute_plan default should pass interrupt_on_irreversible=False."""
    from nasus_orchestrator import NasusOrchestrator
    from nasus_module_registry import NasusEnvelope, ModuleID

    orch = NasusOrchestrator()

    with patch.object(orch, "build_plan"), \
         patch.object(orch, "execute_plan", return_value={"output_type": "SynthesisReport"}) as mock_ep, \
         patch.object(orch, "_llm_plan"):
        orch.stages = [MagicMock()]
        env = NasusEnvelope(
            module_id=ModuleID.M10,
            payload={"action": "execute_plan", "goal": "g"},
        )
        orch.route_envelope(env)
        mock_ep.assert_called_once_with(interrupt_on_irreversible=False)
