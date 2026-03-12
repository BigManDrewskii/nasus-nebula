"""
Tests for WorkspaceIO — file system artifact persistence.
Uses tmp_path for isolation; no network calls.
"""

import json
import pytest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))


# ---------------------------------------------------------------------------
# Fixtures
# ---------------------------------------------------------------------------

@pytest.fixture
def ws(tmp_path):
    from nasus_sidecar.workspace_io import WorkspaceIO
    return WorkspaceIO(base=str(tmp_path / "workspaces"))


# ---------------------------------------------------------------------------
# save / load round-trip
# ---------------------------------------------------------------------------

def test_save_load_string(ws):
    ws.save("sess_1", "report.md", "# Hello World")
    assert ws.load("sess_1", "report.md") == "# Hello World"


def test_save_load_dict_as_json(ws):
    data = {"key": "value", "count": 42}
    ws.save("sess_1", "data.json", data)
    loaded = json.loads(ws.load("sess_1", "data.json"))
    assert loaded["key"] == "value"
    assert loaded["count"] == 42


def test_save_load_bytes(ws):
    ws.save("sess_1", "raw.bin", b"\x00\x01\x02")
    path = ws.session_path("sess_1") / "raw.bin"
    assert path.read_bytes() == b"\x00\x01\x02"


def test_save_returns_path(ws):
    result = ws.save("sess_2", "out.txt", "data")
    assert isinstance(result, Path)
    assert result.exists()


def test_load_missing_raises(ws):
    with pytest.raises(FileNotFoundError):
        ws.load("sess_missing", "nonexistent.txt")


# ---------------------------------------------------------------------------
# list
# ---------------------------------------------------------------------------

def test_list_returns_metadata(ws):
    ws.save("sess_3", "a.md", "alpha")
    ws.save("sess_3", "b.json", {"x": 1})
    files = ws.list("sess_3")
    names = {f["name"] for f in files}
    assert "a.md" in names
    assert "b.json" in names
    for f in files:
        assert "size" in f
        assert "created_at" in f


def test_list_empty_session(ws):
    files = ws.list("sess_new_empty")
    assert files == []


# ---------------------------------------------------------------------------
# delete
# ---------------------------------------------------------------------------

def test_delete_existing_file(ws):
    ws.save("sess_4", "remove.txt", "bye")
    assert ws.delete("sess_4", "remove.txt") is True
    with pytest.raises(FileNotFoundError):
        ws.load("sess_4", "remove.txt")


def test_delete_nonexistent_returns_false(ws):
    assert ws.delete("sess_4", "ghost.txt") is False


def test_delete_session_removes_all(ws):
    ws.save("sess_5", "f1.txt", "a")
    ws.save("sess_5", "f2.txt", "b")
    count = ws.delete_session("sess_5")
    assert count == 2
    assert ws.list("sess_5") == []


def test_delete_session_nonexistent_returns_zero(ws):
    assert ws.delete_session("no_such_session") == 0


# ---------------------------------------------------------------------------
# Path traversal guard
# ---------------------------------------------------------------------------

def test_save_traversal_rejected(ws):
    with pytest.raises(ValueError, match="traversal"):
        ws.save("sess_6", "../escape.txt", "bad")


def test_load_traversal_rejected(ws):
    with pytest.raises(ValueError, match="traversal"):
        ws.load("sess_6", "../../etc/passwd")


def test_delete_traversal_rejected(ws):
    with pytest.raises(ValueError, match="traversal"):
        ws.delete("sess_6", "../secret.txt")


# ---------------------------------------------------------------------------
# HTTP endpoints (FastAPI TestClient)
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def app_client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("ws_http")
    from nasus_sidecar.workspace_io import init_workspace_io
    init_workspace_io(base=str(tmp / "workspaces"))

    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c


def test_http_list_workspace_empty(app_client):
    resp = app_client.get("/workspace/sess_http_empty")
    assert resp.status_code == 200
    assert resp.json()["count"] == 0


def test_http_get_artifact_missing(app_client):
    resp = app_client.get("/workspace/sess_http/ghost.txt")
    assert resp.status_code == 404


def test_http_list_and_get_artifact(tmp_path):
    from nasus_sidecar.workspace_io import init_workspace_io
    ws_base = str(tmp_path / "workspaces")
    init_workspace_io(base=ws_base)

    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient
    with TestClient(app) as client:
        # Directly seed a file via WorkspaceIO
        from nasus_sidecar.workspace_io import get_workspace_io
        get_workspace_io().save("sess_seed", "notes.md", "# Notes")

        resp = client.get("/workspace/sess_seed")
        assert resp.status_code == 200
        assert any(f["name"] == "notes.md" for f in resp.json()["files"])

        resp2 = client.get("/workspace/sess_seed/notes.md")
        assert resp2.status_code == 200


def test_http_delete_workspace(tmp_path):
    from nasus_sidecar.workspace_io import init_workspace_io, get_workspace_io
    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient
    with TestClient(app) as client:
        # Seed the file after lifespan has run so we use the active singleton
        init_workspace_io(base=str(tmp_path / "workspaces"))
        get_workspace_io().save("sess_del", "file.txt", "data")
        resp = client.delete("/workspace/sess_del")
        assert resp.status_code == 200
        assert resp.json()["deleted_count"] == 1


# ---------------------------------------------------------------------------
# execute_plan artifact integration
# ---------------------------------------------------------------------------

def test_execute_plan_writes_deliverable_to_workspace(tmp_path):
    """M10 execute_plan should persist DONE subtask payloads to disk."""
    from nasus_sidecar.workspace_io import init_workspace_io, get_workspace_io
    init_workspace_io(base=str(tmp_path / "workspaces"))

    from nasus_module_registry import ModuleID, NasusEnvelope
    from nasus_orchestrator import NasusOrchestrator

    orch = NasusOrchestrator()
    env = NasusEnvelope(
        module_id=ModuleID.M10,
        payload={
            "goal": "write content about AI",
            "action": "execute_plan",
            "subtasks": [
                {"step_id": "s1", "module": "M06", "description": "write blog post about AI", "stage": 1},
            ],
        },
    )
    result_env = orch.route_envelope(env)

    # Whether LLM is configured or not, M06 returns DONE (template fallback)
    assert result_env.status.value == "DONE"

    # The workspace should contain the deliverable file
    files = get_workspace_io().list(orch.session_id)
    artifact_names = {f["name"] for f in files}
    assert any("s1" in name for name in artifact_names)
