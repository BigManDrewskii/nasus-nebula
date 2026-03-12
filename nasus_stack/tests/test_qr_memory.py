"""
Tests for GAP-04 (QR memory write wiring) and GAP-09 (QR prompt field names).
"""

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_orchestrator import (
    NasusOrchestrator, Subtask, SubtaskIO, Deadline,
)
from nasus_module_registry import ModuleID, NasusEnvelope
from nasus_memory_manager import MemoryStore


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

class _FakeLLMReject:
    """Returns a REJECT verdict when chat_json is called."""
    def chat_json(self, messages, schema_hint=None):
        return {
            "verdict": "REJECT",
            "quality_score": 0.4,
            "summary": "Output is too short and lacks citations.",
            "findings": [{"item": "too short", "severity": "ERROR", "passed": False}],
            "revision_requests": [],
            "reject_reason": "Fundamentally incomplete.",
        }


class _FakeLLMRevise:
    """Returns a REVISE verdict when chat_json is called."""
    def chat_json(self, messages, schema_hint=None):
        return {
            "verdict": "REVISE",
            "quality_score": 0.75,
            "summary": "Good structure but needs more detail.",
            "findings": [],
            "revision_requests": ["Add examples"],
            "reject_reason": "",
        }


class _FakeLLMApproved:
    """Returns an APPROVED verdict when chat_json is called."""
    def chat_json(self, messages, schema_hint=None):
        return {
            "verdict": "APPROVED",
            "quality_score": 0.95,
            "summary": "Excellent.",
            "findings": [],
            "revision_requests": [],
            "reject_reason": "",
        }


def _orch_with_memory() -> tuple:
    """Return (orchestrator, memory_store) pair wired together via _route_m09."""
    memory = MemoryStore()
    orch = NasusOrchestrator()

    # Wire M09 → in-process MemoryStore (bypasses sidecar app.py)
    original_route = orch.route_envelope.__func__

    def _patched_route(self, envelope):
        if envelope.module_id == ModuleID.M09:
            action = (envelope.payload or {}).get("action", "")
            payload = envelope.payload or {}
            envelope.mark_running()
            try:
                if action == "write":
                    result = memory.write(
                        layer=payload["layer"],
                        key=payload["key"],
                        value=payload["value"],
                        metadata=payload.get("metadata"),
                    )
                    envelope.mark_done(result)
                else:
                    envelope.mark_done({})
            except Exception as exc:
                envelope.mark_failed(str(exc))
            return envelope
        return original_route(self, envelope)

    import types
    orch.route_envelope = types.MethodType(_patched_route, orch)
    return orch, memory


# ---------------------------------------------------------------------------
# GAP-04: QR memory writes
# ---------------------------------------------------------------------------

def test_reject_verdict_writes_to_memory():
    orch, memory = _orch_with_memory()
    orch.llm = _FakeLLMReject()

    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M06", "output": "short blog post"},
    )
    result_env = orch.route_envelope(env)

    assert result_env.status.value == "DONE"
    payload = result_env.payload
    assert payload["verdict"] == "REJECT"

    # Memory should have one episodic entry for this review
    snapshot = memory.export_snapshot()
    episodic = snapshot["layers"]["episodic"]
    review_entries = [e for e in episodic if e.get("session_id", "").startswith("review:")]
    assert len(review_entries) == 1
    assert "REJECT" in review_entries[0]["summary"]


def test_revise_verdict_writes_to_memory():
    orch, memory = _orch_with_memory()
    orch.llm = _FakeLLMRevise()

    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M06", "output": "blog post content"},
    )
    orch.route_envelope(env)

    snapshot = memory.export_snapshot()
    episodic = snapshot["layers"]["episodic"]
    review_entries = [e for e in episodic if e.get("session_id", "").startswith("review:")]
    assert len(review_entries) == 1
    assert "REVISE" in review_entries[0]["summary"]


def test_approved_verdict_does_not_write():
    """APPROVED verdicts are ephemeral — no memory write."""
    orch, memory = _orch_with_memory()
    orch.llm = _FakeLLMApproved()

    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M06", "output": "great content"},
    )
    orch.route_envelope(env)

    snapshot = memory.export_snapshot()
    episodic = snapshot["layers"]["episodic"]
    review_entries = [e for e in episodic if e.get("session_id", "").startswith("review:")]
    assert len(review_entries) == 0


def test_memory_write_failure_does_not_abort_qr():
    """If M09 write raises, the QR result is still returned."""
    orch = NasusOrchestrator()
    orch.llm = _FakeLLMReject()

    # Patch route_envelope to raise on M09
    import types
    original_route = orch.route_envelope.__func__

    def _failing_m09(self, envelope):
        if envelope.module_id == ModuleID.M09:
            raise RuntimeError("DB connection failed")
        return original_route(self, envelope)

    orch.route_envelope = types.MethodType(_failing_m09, orch)

    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M05", "output": "bad code"},
    )
    result_env = orch.route_envelope(env)

    # QR still completes — memory failure was swallowed
    assert result_env.status.value == "DONE"
    assert result_env.payload["verdict"] == "REJECT"


def test_review_key_format():
    """Key stored in memory must be review:{review_id}."""
    orch, memory = _orch_with_memory()
    orch.llm = _FakeLLMReject()

    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M01", "output": "stub"},
    )
    orch.route_envelope(env)

    snapshot = memory.export_snapshot()
    episodic = snapshot["layers"]["episodic"]
    keys = [e.get("session_id", "") for e in episodic]
    assert any(k.startswith("review:qr_") for k in keys)


def test_route_envelope_m11_triggers_write_logged():
    """After QR writes, the orchestrator log should mention the write."""
    orch, memory = _orch_with_memory()
    orch.llm = _FakeLLMReject()

    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M06", "output": "stub"},
    )
    orch.route_envelope(env)

    assert any("QR memory write" in line for line in orch.log)


# ---------------------------------------------------------------------------
# GAP-09: QR prompt field names
# ---------------------------------------------------------------------------

def test_qr_prompt_for_m10_uses_description_not_goal():
    """M10 review prompt must use 'description', NOT 'goal', for PlanStep field."""
    orch = NasusOrchestrator()
    captured_messages = []

    class _CaptureLLM:
        def chat_json(self, messages, schema_hint=None):
            captured_messages.extend(messages)
            return {
                "verdict": "APPROVED",
                "quality_score": 0.9,
                "summary": "ok",
                "findings": [],
                "revision_requests": [],
                "reject_reason": "",
            }

    orch.llm = _CaptureLLM()
    env = NasusEnvelope(
        module_id=ModuleID.M11,
        payload={"source_module": "M10", "output": {"steps": []}},
    )
    orch.route_envelope(env)

    system_prompt = next(
        (m["content"] for m in captured_messages if m["role"] == "system"), ""
    )
    assert "`description`" in system_prompt
    assert "`input_artifacts`" in system_prompt
    # Must NOT reference the wrong field names
    assert "non-empty `goal`" not in system_prompt
    assert "non-empty `inputs`" not in system_prompt
