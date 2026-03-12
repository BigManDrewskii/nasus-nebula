"""
Tests for the self-reflection loop in NasusOrchestrator._reflect().

No network calls — LLM is either absent (heuristic path) or monkey-patched.
"""

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_orchestrator import (
    NasusOrchestrator, Deliverable, Subtask, SubtaskIO, SubtaskStatus, Deadline,
)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_subtask(sid: str = "s1", module: str = "M06",
                  instruction: str = "write a blog post", stage: int = 1):
    return Subtask(
        subtask_id=sid,
        module=module,
        instruction=instruction,
        inputs=[SubtaskIO(name="topic", description="topic", source="user")],
        outputs=[SubtaskIO(name="content", description="output", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=stage,
    )


def _orch_with_plan(goal: str = "write a blog post about AI"):
    orch = NasusOrchestrator()
    orch.build_plan(goal, [_make_subtask()])
    return orch


# ---------------------------------------------------------------------------
# Heuristic path (no LLM)
# ---------------------------------------------------------------------------

def test_reflect_heuristic_passes_when_all_completed():
    orch = _orch_with_plan()
    orch.subtasks["s1"].status = SubtaskStatus.COMPLETED
    deliverable = Deliverable(
        index=0, label="M06: blog post", source_module="M06",
        output_type="module_output", artifact={"content": "hello"},
    )
    result = orch._reflect([deliverable], orch.goal)

    assert result["method"] == "heuristic"
    assert result["passed"] is True
    assert result["score"] == pytest.approx(1.0)
    assert result["issues"] == []


def test_reflect_heuristic_fails_when_subtask_incomplete():
    orch = _orch_with_plan()
    # subtask stays PENDING (default)
    result = orch._reflect([], orch.goal)

    assert result["method"] == "heuristic"
    assert result["passed"] is False
    assert result["score"] == pytest.approx(0.0)
    assert len(result["issues"]) == 1
    assert "s1" in result["issues"][0]


def test_reflect_heuristic_partial_completion():
    orch = NasusOrchestrator()
    s1 = _make_subtask("s1", "M06", "task 1", stage=1)
    s2 = _make_subtask("s2", "M07", "task 2", stage=2)
    orch.build_plan("multi-task goal", [s1, s2])
    orch.subtasks["s1"].status = SubtaskStatus.COMPLETED
    # s2 remains pending

    deliverable = Deliverable(
        index=0, label="s1 done", source_module="M06",
        output_type="module_output", artifact={},
    )
    result = orch._reflect([deliverable], orch.goal)

    assert result["method"] == "heuristic"
    assert result["passed"] is False
    assert result["score"] == pytest.approx(0.5)


def test_reflect_logged_to_orchestrator_log():
    orch = _orch_with_plan()
    orch._reflect([], orch.goal)
    assert any("Reflection" in line for line in orch.log)


# ---------------------------------------------------------------------------
# LLM path (monkey-patched)
# ---------------------------------------------------------------------------

class _FakeLLM:
    def __init__(self, response: dict):
        self._response = response

    def chat_json(self, messages, schema_hint=None):
        return self._response


def test_reflect_uses_llm_when_configured():
    orch = _orch_with_plan()
    orch.llm = _FakeLLM({
        "passed": True,
        "score": 0.9,
        "issues": [],
        "suggestions": ["Add more examples"],
    })
    deliverable = Deliverable(
        index=0, label="blog post", source_module="M06",
        output_type="module_output", artifact={"content": "post text"},
    )
    result = orch._reflect([deliverable], orch.goal)

    assert result["method"] == "llm"
    assert result["passed"] is True
    assert result["score"] == pytest.approx(0.9)
    assert result["suggestions"] == ["Add more examples"]


def test_reflect_llm_failure_falls_back_to_heuristic():
    orch = _orch_with_plan()

    class _BrokenLLM:
        def chat_json(self, messages, schema_hint=None):
            raise RuntimeError("network error")

    orch.llm = _BrokenLLM()
    orch.subtasks["s1"].status = SubtaskStatus.COMPLETED
    deliverable = Deliverable(
        index=0, label="done", source_module="M06",
        output_type="module_output", artifact={},
    )
    result = orch._reflect([deliverable], orch.goal)

    assert result["method"] == "heuristic"
    assert result["passed"] is True


# ---------------------------------------------------------------------------
# execute_plan includes reflection in its return value
# ---------------------------------------------------------------------------

def test_execute_plan_includes_reflection():
    orch = NasusOrchestrator()
    orch.build_plan("write blog", [_make_subtask("s1", "M06", "write blog")])

    report = orch.execute_plan()

    assert "reflection" in report
    reflection = report["reflection"]
    assert "passed" in reflection
    assert "score" in reflection
    assert "issues" in reflection
    assert "suggestions" in reflection
    assert "method" in reflection
