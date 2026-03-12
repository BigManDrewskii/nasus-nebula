"""
Tests for the memory bus enforcement in execute_plan.

After each DONE deliverable from M01/M05/M06/M07/M08, execute_plan must
fire an M09 write to the episodic layer.  Non-bus modules (M04, M03, etc.)
must NOT trigger automatic writes.

All tests are fully offline — M09 is intercepted in-process.
"""

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

import types
from nasus_orchestrator import (
    NasusOrchestrator, Subtask, SubtaskIO, SubtaskStatus, Deadline,
)
from nasus_module_registry import ModuleID, NasusEnvelope
from nasus_memory_manager import MemoryStore


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_subtask(sid: str, module: str, instruction: str = "do something", stage: int = 1):
    return Subtask(
        subtask_id=sid,
        module=module,
        instruction=instruction,
        inputs=[SubtaskIO(name="in", description="in", source="user")],
        outputs=[SubtaskIO(name="out", description="out", source="")],
        depends_on=[],
        deadline=Deadline.NON_BLOCKING,
        stage=stage,
    )


def _build_orch_with_memory(module: str, instruction: str = "do task"):
    """
    Return (orchestrator, memory_store) where:
    - orchestrator has a one-subtask plan for the given module
    - M09 routes are intercepted to write to the in-process MemoryStore
    - The specialist module (M01/M05/M06/M07/M08/M04) returns a stub DONE envelope
    """
    memory = MemoryStore()
    orch = NasusOrchestrator()

    original_route = NasusOrchestrator.route_envelope

    def _patched_route(self, envelope):
        if envelope.module_id == ModuleID.M09:
            payload = envelope.payload or {}
            action = payload.get("action", "")
            envelope.mark_running()
            try:
                if action == "write":
                    memory.write(
                        layer=payload["layer"],
                        key=payload["key"],
                        value=payload["value"],
                        metadata=payload.get("metadata"),
                    )
                    envelope.mark_done({"status": "written"})
                else:
                    envelope.mark_done({})
            except Exception as exc:
                envelope.mark_failed(str(exc))
            return envelope

        # Specialist modules: return a stub DONE result
        if envelope.module_id in (
            ModuleID.M01, ModuleID.M02, ModuleID.M03, ModuleID.M04,
            ModuleID.M05, ModuleID.M06, ModuleID.M07, ModuleID.M08,
        ):
            envelope.mark_running()
            envelope.mark_done({"result": f"{envelope.module_id.value} output stub"})
            return envelope

        return original_route(self, envelope)

    orch.route_envelope = types.MethodType(_patched_route, orch)
    orch.build_plan("test goal", [_make_subtask("s1", module, instruction)])
    return orch, memory


def _count_bus_writes(memory: MemoryStore, session_id: str) -> int:
    """Count episodic entries with session_id prefix matching the orch session."""
    snap = memory.export_snapshot()
    episodic = snap["layers"]["episodic"]
    return len([e for e in episodic if e.get("session_id", "").startswith(session_id + ":")])


# ---------------------------------------------------------------------------
# Memory bus modules should write
# ---------------------------------------------------------------------------

def test_m01_output_written_to_memory_on_done():
    orch, memory = _build_orch_with_memory("M01", "research AI trends")
    orch.execute_plan()
    assert _count_bus_writes(memory, orch.session_id) == 1


def test_m05_output_written_to_memory_on_done():
    orch, memory = _build_orch_with_memory("M05", "write hello world")
    orch.execute_plan()
    assert _count_bus_writes(memory, orch.session_id) == 1


def test_m06_output_written_to_memory_on_done():
    orch, memory = _build_orch_with_memory("M06", "write a blog post")
    orch.execute_plan()
    assert _count_bus_writes(memory, orch.session_id) == 1


def test_m07_output_written_to_memory_on_done():
    orch, memory = _build_orch_with_memory("M07", "create PRD")
    orch.execute_plan()
    assert _count_bus_writes(memory, orch.session_id) == 1


def test_m08_output_written_to_memory_on_done():
    orch, memory = _build_orch_with_memory("M08", "build landing page")
    orch.execute_plan()
    assert _count_bus_writes(memory, orch.session_id) == 1


# ---------------------------------------------------------------------------
# Non-bus module should NOT write
# ---------------------------------------------------------------------------

def test_non_bus_module_not_written():
    """M04 (data analyst) is not in _MEMORY_BUS_MODULES — no write."""
    orch, memory = _build_orch_with_memory("M04", "analyze data")
    orch.execute_plan()
    assert _count_bus_writes(memory, orch.session_id) == 0


# ---------------------------------------------------------------------------
# Failure isolation
# ---------------------------------------------------------------------------

def test_memory_write_failure_does_not_abort_execution():
    """If the M09 write raises, execute_plan still completes."""
    memory = MemoryStore()
    orch = NasusOrchestrator()

    original_route = NasusOrchestrator.route_envelope

    def _patched_route(self, envelope):
        if envelope.module_id == ModuleID.M09:
            raise RuntimeError("DB unavailable")
        if envelope.module_id in (ModuleID.M06,):
            envelope.mark_running()
            envelope.mark_done({"result": "blog post"})
            return envelope
        return original_route(self, envelope)

    orch.route_envelope = types.MethodType(_patched_route, orch)
    orch.build_plan("test", [_make_subtask("s1", "M06", "write blog")])

    report = orch.execute_plan()
    # Execution completed — M09 failure was swallowed
    assert "reflection" in report
    assert orch.subtasks["s1"].status == SubtaskStatus.COMPLETED


# ---------------------------------------------------------------------------
# Key format and content
# ---------------------------------------------------------------------------

def test_memory_key_format():
    """Key written must be '{session_id}:{subtask_id}'."""
    orch, memory = _build_orch_with_memory("M06", "write blog post")
    orch.execute_plan()

    snap = memory.export_snapshot()
    episodic = snap["layers"]["episodic"]
    expected_key = f"{orch.session_id}:s1"
    keys = [e["session_id"] for e in episodic]
    assert expected_key in keys


def test_memory_bus_stores_instruction_and_summary():
    """The episodic summary must contain the instruction and output summary."""
    orch, memory = _build_orch_with_memory("M06", "write about climate change")
    orch.execute_plan()

    snap = memory.export_snapshot()
    episodic = snap["layers"]["episodic"]
    entry = next(
        e for e in episodic
        if e["session_id"] == f"{orch.session_id}:s1"
    )
    # summary is str(value) — must contain the instruction (truncated to 200 chars)
    assert "write about climate change" in entry["summary"]
    assert "M06" in entry["summary"]


def test_memory_bus_uses_episodic_layer():
    """Writes must go to the episodic layer, not semantic or working."""
    orch, memory = _build_orch_with_memory("M01", "research competitors")
    orch.execute_plan()

    snap = memory.export_snapshot()
    assert len(snap["layers"]["episodic"]) == 1
    assert len(snap["layers"]["semantic"]) == 0
