"""
HTTP endpoint tests for the Nasus sidecar (FastAPI app).
Uses fastapi.testclient.TestClient — no real network, no real LLM calls.
"""

import time
import pytest
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))

from fastapi.testclient import TestClient


# ---------------------------------------------------------------------------
# App fixture — shared across all tests in this module
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def client():
    from nasus_sidecar.app import app
    with TestClient(app) as c:
        yield c


# ---------------------------------------------------------------------------
# GET /health
# ---------------------------------------------------------------------------

def test_health_returns_ok(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert "modules" in body
    assert "active_jobs" in body
    assert "total_jobs" in body


# ---------------------------------------------------------------------------
# POST /configure
# ---------------------------------------------------------------------------

def test_configure_with_key(client):
    resp = client.post("/configure", json={
        "api_key": "sk-test-fake-key",
        "api_base": "https://openrouter.ai/api/v1",
        "model": "openai/gpt-4o-mini",
    })
    assert resp.status_code == 200
    body = resp.json()
    assert body["llm_ready"] is True
    assert "api_key" not in body  # key must never be echoed back


def test_configure_response_does_not_echo_key(client):
    secret = "sk-super-secret-should-not-appear"
    resp = client.post("/configure", json={
        "api_key": secret,
        "api_base": "https://openrouter.ai/api/v1",
        "model": "openai/gpt-4o-mini",
    })
    assert resp.status_code == 200
    body_text = resp.text
    assert secret not in body_text


# ---------------------------------------------------------------------------
# POST /task → GET /task/{id}/status
# ---------------------------------------------------------------------------

def test_submit_m09_write_returns_job_id(client):
    resp = client.post("/task", json={
        "module_id": "M09",
        "payload": {
            "action": "write",
            "layer": "working",
            "key": "test_ctx",
            "value": "hello from test",
        },
    })
    assert resp.status_code == 200
    body = resp.json()
    assert "job_id" in body
    assert body["status"] == "PENDING"


def test_submit_and_poll_m09_completes(client):
    resp = client.post("/task", json={
        "module_id": "M09",
        "payload": {
            "action": "health_check",
        },
    })
    job_id = resp.json()["job_id"]

    # Poll until done or timeout
    for _ in range(20):
        status_resp = client.get(f"/task/{job_id}/status")
        assert status_resp.status_code == 200
        status = status_resp.json()["status"]
        if status in ("DONE", "FAILED"):
            break
        time.sleep(0.1)

    assert status_resp.json()["status"] == "DONE"


def test_status_nonexistent_job_returns_404(client):
    resp = client.get("/task/nonexistent_job_id_xyz/status")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# DELETE /task/{id}
# ---------------------------------------------------------------------------

def test_cancel_existing_job(client):
    submit = client.post("/task", json={
        "module_id": "M09",
        "payload": {"action": "export_snapshot"},
    })
    job_id = submit.json()["job_id"]

    # Give it a moment to start, then cancel
    time.sleep(0.05)
    cancel_resp = client.delete(f"/task/{job_id}")
    assert cancel_resp.status_code == 200
    assert cancel_resp.json()["job_id"] == job_id
    assert cancel_resp.json()["status"] == "cancelled"


def test_cancel_nonexistent_job_returns_404(client):
    resp = client.delete("/task/totally_fake_job_id")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# POST /task — invalid module
# ---------------------------------------------------------------------------

def test_submit_invalid_module_returns_400(client):
    resp = client.post("/task", json={
        "module_id": "M99",
        "payload": {},
    })
    assert resp.status_code == 400
    assert "M99" in resp.json().get("detail", "")
