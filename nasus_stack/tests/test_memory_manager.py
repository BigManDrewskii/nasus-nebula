"""
Tests for MemoryStore — all four layers, SQLite persistence, warm-start.
Zero network calls; LLM path is never exercised here.
"""

import time
import pytest
from pathlib import Path

import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_memory_manager import MemoryStore


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def mem():
    return MemoryStore()


@pytest.fixture
def mem_db(tmp_path):
    db_file = str(tmp_path / "test_memory.db")
    return MemoryStore(db_path=db_file), db_file


# ---------------------------------------------------------------------------
# write / read — all layers
# ---------------------------------------------------------------------------

def test_write_read_semantic(mem):
    mem.write("semantic", "planet", "Earth", metadata={"source": "test", "confidence": 0.99})
    result = mem.read("semantic", "planet")
    assert result["status"] == "hit"
    assert result["data"]["value"] == "Earth"
    assert result["data"]["confidence"] == 0.99


def test_write_read_working(mem):
    mem.write("working", "task_id", "abc123")
    result = mem.read("working", "task_id")
    assert result["status"] == "hit"
    assert result["data"]["value"] == "abc123"


def test_write_read_procedural(mem):
    mem.write(
        "procedural", "pattern_alpha", "do X then Y",
        metadata={"description": "do X then Y", "trigger": "always", "steps": ["X", "Y"], "success_rate": 0.9}
    )
    result = mem.read("procedural", "pattern_alpha")
    assert result["status"] == "hit"
    assert result["data"]["description"] == "do X then Y"


def test_write_read_episodic(mem):
    mem.write("episodic", "sess_001", "did some work")
    result = mem.read("episodic", "sess_001")
    assert result["status"] == "hit"
    assert len(result["data"]) == 1
    assert result["data"][0]["summary"] == "did some work"


def test_read_miss(mem):
    result = mem.read("semantic", "nonexistent_key")
    assert result["status"] == "miss"
    assert result["data"] is None


def test_read_invalid_layer(mem):
    result = mem.read("invalid_layer", "key")
    assert result["status"] == "error"


def test_read_all_semantic(mem):
    mem.write("semantic", "k1", "v1")
    mem.write("semantic", "k2", "v2")
    result = mem.read("semantic")
    assert result["status"] == "hit"
    assert "k1" in result["data"]
    assert "k2" in result["data"]


# ---------------------------------------------------------------------------
# query
# ---------------------------------------------------------------------------

def test_query_finds_written_entry(mem):
    mem.write("semantic", "nasus_agent", "autonomous multi-module AI system",
              metadata={"source": "test", "confidence": 1.0})
    result = mem.query("nasus agent system")
    assert result["confidence"] > 0
    assert any(r["layer"] == "semantic" for r in result["results"])


def test_query_returns_matched_layers(mem):
    mem.write("working", "project", "FlowDesk")
    mem.write("semantic", "flowdesk_icp", "B2B SaaS", metadata={"source": "test", "confidence": 0.9})
    result = mem.query("FlowDesk")
    assert len(result["matched_layers"]) >= 1


def test_query_no_match(mem):
    result = mem.query("zzz_no_match_xyzzy_12345")
    assert result["confidence"] == 0.0
    assert result["results"] == []


# ---------------------------------------------------------------------------
# forget
# ---------------------------------------------------------------------------

def test_forget_semantic(mem):
    mem.write("semantic", "tmp_key", "temporary")
    result = mem.forget("semantic", "tmp_key")
    assert result["status"] == "ok"
    assert result["freed_bytes_estimate"] > 0
    assert mem.read("semantic", "tmp_key")["status"] == "miss"


def test_forget_episodic(mem):
    mem.write("episodic", "sess_del", "to be deleted")
    result = mem.forget("episodic", "sess_del")
    assert result["status"] == "ok"
    assert mem.read("episodic", "sess_del")["status"] == "miss"


def test_forget_miss(mem):
    result = mem.forget("semantic", "does_not_exist")
    assert result["status"] == "miss"
    assert result["freed_bytes_estimate"] == 0


# ---------------------------------------------------------------------------
# summarize_session
# ---------------------------------------------------------------------------

def test_summarize_session_appends_episodic(mem):
    result = mem.summarize_session("sess_s1", "M06", "Generated a 500-word blog post about AI.")
    assert result["session_id"] == "sess_s1"
    assert result["module"] == "M06"
    assert "blog" in result["summary"]
    ep = mem.read("episodic", "sess_s1")
    assert ep["status"] == "hit"
    assert len(ep["data"]) == 1


# ---------------------------------------------------------------------------
# health_check
# ---------------------------------------------------------------------------

def test_health_check_empty(mem):
    result = mem.health_check()
    assert "overall_score" in result
    assert result["overall_score"] >= 0
    assert "warnings" in result


def test_health_check_with_data(mem):
    mem.write("semantic", "fact1", "value1", metadata={"source": "test", "confidence": 0.95})
    mem.write("working", "ctx", "active")
    result = mem.health_check()
    assert result["layer_counts"]["semantic"] == 1
    assert result["layer_counts"]["working"] == 1
    assert result["overall_score"] > 0


# ---------------------------------------------------------------------------
# export_snapshot
# ---------------------------------------------------------------------------

def test_export_snapshot_has_all_layers(mem):
    mem.write("semantic", "snap_key", "snap_val")
    snap = mem.export_snapshot()
    assert "layers" in snap
    for layer in ("episodic", "semantic", "procedural", "working"):
        assert layer in snap["layers"]
    assert "snap_key" in snap["layers"]["semantic"]


# ---------------------------------------------------------------------------
# TTL expiry
# ---------------------------------------------------------------------------

def test_ttl_expiry(mem):
    mem.write("working", "expiring_key", "gone_soon", metadata={"ttl_seconds": 0})
    # ttl=0 means age > 0 is immediately True — next read triggers eviction
    time.sleep(0.05)
    result = mem.read("working", "expiring_key")
    assert result["status"] == "miss"


# ---------------------------------------------------------------------------
# SQLite persistence & warm-start
# ---------------------------------------------------------------------------

def test_sqlite_write_and_warmstart(tmp_path):
    db_file = str(tmp_path / "warmstart.db")

    store1 = MemoryStore(db_path=db_file)
    store1.write("semantic", "persisted_key", {"nested": True},
                 metadata={"source": "test", "confidence": 1.0})
    store1.write("working", "session_ctx", "active_session")

    # New instance with same db_path — data should survive
    store2 = MemoryStore(db_path=db_file)
    hit = store2.read("semantic", "persisted_key")
    assert hit["status"] == "hit"
    assert hit["data"]["value"] == {"nested": True}


def test_sqlite_forget_persists(tmp_path):
    db_file = str(tmp_path / "forget_persist.db")

    store1 = MemoryStore(db_path=db_file)
    store1.write("semantic", "delete_me", "gone",
                 metadata={"source": "test", "confidence": 1.0})
    store1.forget("semantic", "delete_me")

    store2 = MemoryStore(db_path=db_file)
    result = store2.read("semantic", "delete_me")
    assert result["status"] == "miss"
