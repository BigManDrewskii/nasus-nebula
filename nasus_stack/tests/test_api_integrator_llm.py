"""
Tests for M02 API Integrator — LLM request builder path.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

import nasus_api_integrator as m02
from nasus_api_integrator import _llm_build_request, route_envelope
from nasus_api_integrator_schema import ApiResponse, HttpMethod
from nasus_module_registry import ModuleID, NasusEnvelope


# ---------------------------------------------------------------------------
# Fake LLM helpers
# ---------------------------------------------------------------------------

class _FakeLLMGet:
    def chat_json(self, messages, schema_hint=None):
        return {"url": "https://api.example.com/users", "method": "GET"}


class _FakeLLMPost:
    def chat_json(self, messages, schema_hint=None):
        return {
            "url": "https://api.example.com/items",
            "method": "POST",
            "body": {"name": "Alice"},
        }


class _FakeLLMRaises:
    def chat_json(self, messages, schema_hint=None):
        raise RuntimeError("LLM unavailable")


def _patch_llm(monkeypatch, client, configured: bool = True):
    """Patch is_configured() and get_client() on the real llm_client module."""
    import nasus_sidecar.llm_client as _llm
    monkeypatch.setattr(_llm._CONFIG, "api_key", "test-key" if configured else "")
    monkeypatch.setattr(_llm, "get_client", lambda: client)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_llm_build_request_get(monkeypatch):
    _patch_llm(monkeypatch, _FakeLLMGet())
    result = _llm_build_request("list all users")
    assert result is not None
    assert result.url == "https://api.example.com/users"
    assert result.method == HttpMethod.GET


def test_llm_build_request_post_with_body(monkeypatch):
    _patch_llm(monkeypatch, _FakeLLMPost())
    result = _llm_build_request("create a new item named Alice")
    assert result is not None
    assert result.method == HttpMethod.POST
    assert result.body == {"name": "Alice"}


def test_llm_build_request_no_llm_returns_none(monkeypatch):
    _patch_llm(monkeypatch, _FakeLLMGet(), configured=False)
    result = _llm_build_request("list all users")
    assert result is None


def test_llm_build_request_llm_exception_returns_none(monkeypatch):
    _patch_llm(monkeypatch, _FakeLLMRaises())
    result = _llm_build_request("list all users")
    assert result is None


def test_route_envelope_instruction_path(monkeypatch):
    _patch_llm(monkeypatch, _FakeLLMGet())

    # Stub execute() so no real HTTP call is made
    fixed_response = ApiResponse(
        status_code=200,
        body={"users": []},
        headers={},
        latency_ms=5.0,
        success=True,
        label="test",
    )
    monkeypatch.setattr(m02, "execute", lambda req, **_: fixed_response)

    env = NasusEnvelope(
        module_id=ModuleID.M02,
        payload={"instruction": "list all users", "base_url": "https://api.example.com"},
    )
    result_env = route_envelope(env)

    assert result_env.status.value == "DONE"
    assert result_env.payload["status_code"] == 200
    assert result_env.payload["success"] is True
