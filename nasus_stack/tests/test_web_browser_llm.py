"""
Tests for M03 Web Browser — LLM synthesis path.

_llm_synthesize() is called when:
  - route_envelope payload includes 'extract_prompt'
  - LLM client is configured (is_configured() returns True)

In all other cases the response is returned without 'llm_synthesis'.
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus


# ---------------------------------------------------------------------------
# Fake LLM helpers
# ---------------------------------------------------------------------------

class _FakeLLMChat:
    def chat(self, messages):
        return "Extracted: main heading is 'Hello World'"


class _FakeLLMRaises:
    def chat(self, messages):
        raise RuntimeError("LLM unavailable")


def _patch_llm(monkeypatch, client, configured: bool = True):
    import nasus_sidecar.llm_client as _llm
    monkeypatch.setattr(_llm._CONFIG, "api_key", "test-key" if configured else "")
    monkeypatch.setattr(_llm, "get_client", lambda: client)


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_llm_synthesis_skipped_when_no_extract_prompt():
    """No extract_prompt → llm_synthesis key absent from response payload."""
    import nasus_web_browser as m03
    env = NasusEnvelope(
        module_id=ModuleID.M03,
        payload={"url": "https://github.com", "mode": "scrape"},
    )
    result = m03.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert "llm_synthesis" not in result.payload


def test_llm_synthesis_skipped_when_llm_not_configured(monkeypatch):
    """extract_prompt set but LLM not configured → llm_synthesis key absent."""
    _patch_llm(monkeypatch, _FakeLLMChat(), configured=False)
    import nasus_web_browser as m03
    env = NasusEnvelope(
        module_id=ModuleID.M03,
        payload={
            "url": "https://github.com",
            "mode": "scrape",
            "extract_prompt": "What is the main heading?",
        },
    )
    result = m03.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert "llm_synthesis" not in result.payload


def test_llm_synthesis_appended_when_configured(monkeypatch):
    """extract_prompt + LLM configured → llm_synthesis key present with mock reply."""
    _patch_llm(monkeypatch, _FakeLLMChat())
    import nasus_web_browser as m03
    env = NasusEnvelope(
        module_id=ModuleID.M03,
        payload={
            "url": "https://github.com",
            "mode": "scrape",
            "extract_prompt": "What is the main heading?",
        },
    )
    result = m03.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert "llm_synthesis" in result.payload
    assert result.payload["llm_synthesis"] == "Extracted: main heading is 'Hello World'"


def test_llm_synthesis_exception_falls_back_gracefully(monkeypatch):
    """LLM chat() raises → no llm_synthesis key, envelope still DONE."""
    _patch_llm(monkeypatch, _FakeLLMRaises())
    import nasus_web_browser as m03
    env = NasusEnvelope(
        module_id=ModuleID.M03,
        payload={
            "url": "https://github.com",
            "mode": "scrape",
            "extract_prompt": "Get the title",
        },
    )
    result = m03.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert "llm_synthesis" not in result.payload


def test_llm_synthesis_e2e_extract_mode(monkeypatch):
    """EXTRACT mode with extract_prompt completes without crash (LLM or fallback)."""
    _patch_llm(monkeypatch, _FakeLLMChat())
    import nasus_web_browser as m03
    env = NasusEnvelope(
        module_id=ModuleID.M03,
        payload={
            "url": "https://github.com",
            "mode": "extract",
            "extract_prompt": "Get the page title",
        },
    )
    result = m03.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert isinstance(result.payload, dict)


def test_llm_synthesis_fires_in_extract_mode(monkeypatch):
    """EXTRACT mode: extract_structured() returns a dict; synthesis must still fire."""
    _patch_llm(monkeypatch, _FakeLLMChat())
    import nasus_web_browser as m03
    env = NasusEnvelope(
        module_id=ModuleID.M03,
        payload={
            "url": "https://github.com",
            "mode": "extract",
            "extract_prompt": "What is the main heading?",
        },
    )
    result = m03.route_envelope(env)
    assert result.status == NasusStatus.DONE
    assert "llm_synthesis" in result.payload
    assert result.payload["llm_synthesis"] == "Extracted: main heading is 'Hello World'"
