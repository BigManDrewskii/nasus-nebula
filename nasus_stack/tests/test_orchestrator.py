"""
Tests for NasusOrchestrator:
  - build_plan / _build_dag
  - _deserialize_subtasks
  - route_envelope: M09 fallback, M06 validation, M10 plan (no LLM)
"""

import pytest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus
from nasus_orchestrator import NasusOrchestrator, Subtask, SubtaskIO
from nasus_orchestrator_schema import Deadline, SubtaskStatus


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_subtask(sid: str, module: str = "M01", stage: int = 1,
                  depends_on=None) -> Subtask:
    return Subtask(
        subtask_id=sid,
        module=module,
        instruction=f"Do something for {sid}",
        inputs=[SubtaskIO(name="query", description="input query", source="user")],
        outputs=[SubtaskIO(name="result", description="output", source="")],
        depends_on=depends_on or [],
        deadline=Deadline.NON_BLOCKING,
        stage=stage,
    )


# ---------------------------------------------------------------------------
# build_plan
# ---------------------------------------------------------------------------

def test_build_plan_single_subtask():
    orch = NasusOrchestrator()
    st = _make_subtask("step_01", module="M01", stage=1)
    result = orch.build_plan("research the market", [st])
    assert result["subtask_count"] == 1
    assert result["stage_count"] == 1
    assert result["goal"] == "research the market"
    assert "PLAN-" in result["plan_id"]


def test_build_plan_multiple_stages():
    orch = NasusOrchestrator()
    subtasks = [
        _make_subtask("s1", module="M01", stage=1),
        _make_subtask("s2", module="M06", stage=2, depends_on=["s1"]),
        _make_subtask("s3", module="M06", stage=2),
    ]
    result = orch.build_plan("full pipeline", subtasks)
    assert result["stage_count"] == 2
    assert result["subtask_count"] == 3


def test_build_plan_parallel_stage():
    orch = NasusOrchestrator()
    subtasks = [
        _make_subtask("pa", module="M01", stage=1),
        _make_subtask("pb", module="M04", stage=1),
    ]
    result = orch.build_plan("parallel work", subtasks)
    stage = result["stages"][0]
    assert stage["parallel"] is True


# ---------------------------------------------------------------------------
# _deserialize_subtasks
# ---------------------------------------------------------------------------

def test_deserialize_subtasks_from_dicts():
    raw = [
        {
            "step_id": "step_01",
            "module": "M01",
            "description": "research AI trends",
            "inputs": ["query"],
            "outputs": ["report"],
            "stage": 1,
        },
        {
            "step_id": "step_02",
            "module": "M06",
            "description": "write blog post",
            "inputs": ["report"],
            "outputs": ["post"],
            "stage": 2,
            "depends_on": ["step_01"],
        },
    ]
    subtasks = NasusOrchestrator._deserialize_subtasks(raw)
    assert len(subtasks) == 2
    assert all(isinstance(s, Subtask) for s in subtasks)
    assert subtasks[0].subtask_id == "step_01"
    assert subtasks[0].module == "M01"
    assert subtasks[1].depends_on == ["step_01"]


def test_deserialize_subtasks_passthrough_subtask_objects():
    st = _make_subtask("existing_obj")
    result = NasusOrchestrator._deserialize_subtasks([st])
    assert result[0] is st


def test_deserialize_subtasks_skips_invalid():
    result = NasusOrchestrator._deserialize_subtasks([None, 42, "bad"])
    assert result == []


def test_deserialize_subtasks_generates_id_if_missing():
    raw = [{"module": "M01", "description": "no id given", "stage": 1}]
    result = NasusOrchestrator._deserialize_subtasks(raw)
    assert len(result) == 1
    assert result[0].subtask_id  # auto-generated, not empty


# ---------------------------------------------------------------------------
# route_envelope: M09 fallback
# ---------------------------------------------------------------------------

def test_route_m09_fallback_returns_done():
    orch = NasusOrchestrator()
    env = NasusEnvelope(module_id=ModuleID.M09, payload={"action": "health_check"})
    result = orch.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert result.payload.get("module") == "M09"


# ---------------------------------------------------------------------------
# route_envelope: M06 missing topic → FAILED
# ---------------------------------------------------------------------------

def test_route_m06_missing_topic_fails():
    orch = NasusOrchestrator()
    env = NasusEnvelope(module_id=ModuleID.M06, payload={"content_format": "blog_post"})
    result = orch.route_envelope(env)
    assert result.status == NasusStatus.FAILED
    assert any("topic" in err for err in result.errors)


# ---------------------------------------------------------------------------
# route_envelope: M10 plan action (no LLM) → DONE with stages
# ---------------------------------------------------------------------------

def test_route_m10_plan_no_llm():
    orch = NasusOrchestrator()
    env = NasusEnvelope(
        module_id=ModuleID.M10,
        payload={
            "goal": "launch a product",
            "action": "plan",
            "subtasks": [
                {"step_id": "s1", "module": "M07", "description": "define product", "stage": 1},
                {"step_id": "s2", "module": "M08", "description": "build landing page", "stage": 2,
                 "depends_on": ["s1"]},
            ],
        },
    )
    result = orch.route_envelope(env)
    assert result.status == NasusStatus.DONE
    payload = result.payload
    assert payload.get("stage_count", 0) >= 1
    assert "plan_id" in payload


def test_route_m10_missing_goal_fails():
    orch = NasusOrchestrator()
    env = NasusEnvelope(
        module_id=ModuleID.M10,
        payload={"action": "plan"},  # no goal, no llm
    )
    result = orch.route_envelope(env)
    assert result.status == NasusStatus.FAILED


# ---------------------------------------------------------------------------
# route_envelope: unknown module → DONE with escalation payload
# ---------------------------------------------------------------------------

def test_route_unknown_module_handled():
    orch = NasusOrchestrator()
    # Force an unknown module_id value by building envelope manually
    env = NasusEnvelope(module_id=ModuleID.M00, payload={})
    result = orch.route_envelope(env)
    # M00 with no message and no LLM returns session record — just shouldn't crash
    assert result.status in (NasusStatus.DONE, NasusStatus.FAILED)
