"""
Tests for NasusEnvelope lifecycle and ModuleID enum.
"""

import pytest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus


# ---------------------------------------------------------------------------
# ModuleID enum
# ---------------------------------------------------------------------------

def test_module_id_covers_m00_to_m11():
    expected = {f"M{i:02d}" for i in range(12)}
    actual = {m.value for m in ModuleID}
    assert expected == actual


def test_module_id_label():
    assert ModuleID.label(ModuleID.M01) == "Research Analyst"
    assert ModuleID.label(ModuleID.M09) == "Memory Manager"
    assert ModuleID.label(ModuleID.M10) == "Task Planner"


def test_module_id_str_enum():
    assert ModuleID("M04") == ModuleID.M04
    with pytest.raises(ValueError):
        ModuleID("M99")


# ---------------------------------------------------------------------------
# NasusEnvelope lifecycle
# ---------------------------------------------------------------------------

def test_envelope_initial_status_pending():
    env = NasusEnvelope(module_id=ModuleID.M01, payload={"query": "test"})
    assert env.status == NasusStatus.PENDING


def test_envelope_mark_running():
    env = NasusEnvelope(module_id=ModuleID.M01, payload={})
    env.mark_running()
    assert env.status == NasusStatus.RUNNING


def test_envelope_mark_done():
    env = NasusEnvelope(module_id=ModuleID.M01, payload={})
    env.mark_running()
    env.mark_done({"result": "ok"})
    assert env.status == NasusStatus.DONE
    assert env.payload == {"result": "ok"}


def test_envelope_mark_failed():
    env = NasusEnvelope(module_id=ModuleID.M01, payload={})
    env.mark_failed("something broke")
    assert env.status == NasusStatus.FAILED
    assert "something broke" in env.errors


def test_envelope_add_error_accumulates():
    env = NasusEnvelope(module_id=ModuleID.M05, payload={})
    env.add_error("err1")
    env.add_error("err2")
    assert len(env.errors) == 2


# ---------------------------------------------------------------------------
# NasusEnvelope.to_dict / from_dict
# ---------------------------------------------------------------------------

def test_envelope_to_dict_serializes():
    env = NasusEnvelope(module_id=ModuleID.M06, payload={"topic": "AI"})
    env.mark_done({"content": "Hello"})
    d = env.to_dict()
    assert d["module_id"] == "M06"
    assert d["status"] == "DONE"
    assert d["payload"] == {"content": "Hello"}
    assert isinstance(d["errors"], list)
    assert "job_id" in d
    assert "created_at" in d


def test_envelope_from_dict_round_trip():
    env = NasusEnvelope(module_id=ModuleID.M04, payload={"custom_instruction": "analyse"})
    env.mark_done({"narrative": "numbers look good"})
    d = env.to_dict()
    env2 = NasusEnvelope.from_dict(d)
    assert env2.module_id == ModuleID.M04
    assert env2.status == NasusStatus.DONE
    assert env2.payload == {"narrative": "numbers look good"}


def test_envelope_validate_clean():
    env = NasusEnvelope(module_id=ModuleID.M01, payload={"query": "test"})
    env.mark_done({"result": "ok"})
    issues = env.validate()
    assert issues == []


def test_envelope_validate_catches_missing_payload_on_done():
    env = NasusEnvelope(module_id=ModuleID.M01, payload=None)
    env.status = NasusStatus.DONE  # force directly — no payload set
    issues = env.validate()
    assert any("payload" in i for i in issues)
