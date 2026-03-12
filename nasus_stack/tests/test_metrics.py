"""
Tests for the GET /metrics endpoint.
"""

import sys
import time
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


@pytest.fixture(scope="module")
def metrics_client(tmp_path_factory):
    tmp = tmp_path_factory.mktemp("metrics_ws")
    from nasus_sidecar.workspace_io import init_workspace_io
    init_workspace_io(base=str(tmp / "workspaces"))
    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c


def test_metrics_endpoint_returns_200(metrics_client):
    resp = metrics_client.get("/metrics")
    assert resp.status_code == 200


def test_metrics_has_jobs_section(metrics_client):
    data = metrics_client.get("/metrics").json()
    assert "jobs" in data
    jobs = data["jobs"]
    assert "total" in jobs
    assert "pending" in jobs
    assert "running" in jobs
    assert "completed" in jobs
    assert "failed" in jobs
    assert isinstance(jobs["total"], int)


def test_metrics_has_tokens_section(metrics_client):
    data = metrics_client.get("/metrics").json()
    assert "tokens" in data
    tokens = data["tokens"]
    assert "used" in tokens
    assert "budget" in tokens
    assert "budget_remaining" in tokens
    assert tokens["used"] == 0  # no LLM configured in test


def test_metrics_has_memory_section(metrics_client):
    data = metrics_client.get("/metrics").json()
    assert "memory" in data
    # Memory health_check returns a dict with at least 'overall_score'
    assert isinstance(data["memory"], dict)


def test_metrics_llm_configured_false_when_not_set(metrics_client):
    data = metrics_client.get("/metrics").json()
    assert data["llm_configured"] is False


def test_metrics_uptime_is_nonnegative(metrics_client):
    data = metrics_client.get("/metrics").json()
    assert "uptime_s" in data
    assert data["uptime_s"] >= 0.0
    assert isinstance(data["uptime_s"], (int, float))
