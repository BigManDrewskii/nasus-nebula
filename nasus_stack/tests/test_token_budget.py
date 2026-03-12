"""
Tests for token budget enforcement in NasusLLMClient.
All tests mock network calls — no real API requests are made.
"""

import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path
import sys
sys.path.insert(0, str(Path(__file__).parent.parent))


def _make_fake_response(content: str, total_tokens: int = 100) -> tuple:
    """Return what _post_chat_full would return for a successful call."""
    raw = {
        "choices": [{"message": {"content": content}}],
        "usage": {"prompt_tokens": 10, "completion_tokens": 90, "total_tokens": total_tokens},
    }
    return content, raw


# ---------------------------------------------------------------------------
# configure() needed to pass is_configured() check
# ---------------------------------------------------------------------------

@pytest.fixture(autouse=True)
def configure_llm():
    from nasus_sidecar import llm_client
    llm_client.configure(api_key="sk-test-fake-key", model="test/model")
    yield
    # Reset so other test modules are unaffected
    llm_client.configure(api_key="")


# ---------------------------------------------------------------------------
# Budget=0 → immediate error before any network call
# ---------------------------------------------------------------------------

def test_budget_zero_raises_immediately():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config
    client = NasusLLMClient(token_budget=0, _cfg=get_config())
    with pytest.raises(RuntimeError, match="Token budget exhausted"):
        client.chat([{"role": "user", "content": "hello"}])


# ---------------------------------------------------------------------------
# Budget > 0: accumulates tokens, raises once exhausted
# ---------------------------------------------------------------------------

def test_budget_accumulates_and_stops():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config

    client = NasusLLMClient(token_budget=150, _cfg=get_config())

    with patch("nasus_sidecar.llm_client._post_chat_full",
               return_value=_make_fake_response("first reply", total_tokens=100)):
        reply = client.chat([{"role": "user", "content": "first"}])
        assert reply == "first reply"
        assert client.tokens_used == 100
        assert client.budget_remaining == 50

    # Second call should also succeed (100 < 150)
    with patch("nasus_sidecar.llm_client._post_chat_full",
               return_value=_make_fake_response("second reply", total_tokens=40)):
        reply2 = client.chat([{"role": "user", "content": "second"}])
        assert reply2 == "second reply"
        assert client.tokens_used == 140

    # Now used=140, budget=150 — still OK for one more call that pushes it over
    # Calling with budget=150 and used=140 should pass _check_budget (140 < 150).
    # After that call, used becomes 150 → next call should fail.
    with patch("nasus_sidecar.llm_client._post_chat_full",
               return_value=_make_fake_response("third reply", total_tokens=10)):
        client.chat([{"role": "user", "content": "third"}])
        assert client.tokens_used == 150

    # Now used == budget → next call should raise
    with pytest.raises(RuntimeError, match="Token budget exhausted"):
        client.chat([{"role": "user", "content": "fourth"}])


# ---------------------------------------------------------------------------
# tokens_used property reflects consumed tokens
# ---------------------------------------------------------------------------

def test_tokens_used_starts_at_zero():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config
    client = NasusLLMClient(_cfg=get_config())
    assert client.tokens_used == 0


def test_tokens_used_increments_after_chat():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config

    client = NasusLLMClient(_cfg=get_config())
    with patch("nasus_sidecar.llm_client._post_chat_full",
               return_value=_make_fake_response("response", total_tokens=42)):
        client.chat([{"role": "user", "content": "hello"}])
    assert client.tokens_used == 42


# ---------------------------------------------------------------------------
# budget_remaining property
# ---------------------------------------------------------------------------

def test_budget_remaining_none_when_no_budget():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config
    client = NasusLLMClient(_cfg=get_config())
    assert client.budget_remaining is None


def test_budget_remaining_decrements():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config

    client = NasusLLMClient(token_budget=500, _cfg=get_config())
    assert client.budget_remaining == 500

    with patch("nasus_sidecar.llm_client._post_chat_full",
               return_value=_make_fake_response("ok", total_tokens=200)):
        client.chat([{"role": "user", "content": "hi"}])
    assert client.budget_remaining == 300


def test_budget_remaining_never_negative():
    from nasus_sidecar.llm_client import NasusLLMClient, get_config
    client = NasusLLMClient(token_budget=10, _cfg=get_config())
    # Manually push tokens_used past budget
    client._tokens_used = 999
    assert client.budget_remaining == 0


# ---------------------------------------------------------------------------
# /configure endpoint: token_budget echoed in response
# ---------------------------------------------------------------------------

def test_configure_endpoint_returns_token_budget():
    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient

    with TestClient(app) as client:
        resp = client.post("/configure", json={
            "api_key": "sk-test",
            "model": "openai/gpt-4o-mini",
            "token_budget": 100000,
        })
        assert resp.status_code == 200
        assert resp.json()["token_budget"] == 100000


def test_configure_no_budget_returns_null():
    from nasus_sidecar.app import app
    from fastapi.testclient import TestClient

    with TestClient(app) as client:
        resp = client.post("/configure", json={
            "api_key": "sk-test",
            "model": "openai/gpt-4o-mini",
        })
        assert resp.status_code == 200
        assert resp.json()["token_budget"] is None
