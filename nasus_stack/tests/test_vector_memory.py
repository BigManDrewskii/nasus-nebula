"""
Tests for vector-embedding integration in MemoryStore.

All tests are fully offline — embedding calls are monkey-patched so no
network is required.  cosine_similarity() is tested directly; _try_embed()
and embed_all() are exercised via controlled stubs.
"""

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))


# ---------------------------------------------------------------------------
# Unit tests for cosine_similarity
# ---------------------------------------------------------------------------

def test_cosine_identical_vectors():
    from nasus_sidecar.llm_client import cosine_similarity
    v = [1.0, 0.0, 0.0]
    assert cosine_similarity(v, v) == pytest.approx(1.0)


def test_cosine_orthogonal_vectors():
    from nasus_sidecar.llm_client import cosine_similarity
    assert cosine_similarity([1.0, 0.0], [0.0, 1.0]) == pytest.approx(0.0)


def test_cosine_opposite_vectors():
    from nasus_sidecar.llm_client import cosine_similarity
    assert cosine_similarity([1.0, 0.0], [-1.0, 0.0]) == pytest.approx(-1.0)


def test_cosine_zero_vector_returns_zero():
    from nasus_sidecar.llm_client import cosine_similarity
    assert cosine_similarity([0.0, 0.0], [1.0, 2.0]) == 0.0


def test_cosine_arbitrary_vectors():
    from nasus_sidecar.llm_client import cosine_similarity
    a = [3.0, 4.0]
    b = [4.0, 3.0]
    # dot=24, |a|=5, |b|=5  → 24/25 = 0.96
    assert cosine_similarity(a, b) == pytest.approx(0.96)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _make_store():
    from nasus_memory_manager import MemoryStore
    return MemoryStore()


def _patch_llm(monkeypatch, vectors: dict):
    """
    Make llm_client appear configured and stub embed() to return from vectors dict.
    Falls back to a default unit vector for any unknown text.
    """
    import nasus_sidecar.llm_client as _llm
    DEFAULT = [1.0, 0.0, 0.0]

    monkeypatch.setattr(_llm._CONFIG, "api_key", "test-key")

    def _fake_embed(text, model="text-embedding-3-small"):
        return vectors.get(text, DEFAULT)

    monkeypatch.setattr(_llm, "embed", _fake_embed)


# ---------------------------------------------------------------------------
# _try_embed / embed_all
# ---------------------------------------------------------------------------

def test_try_embed_caches_vector(monkeypatch):
    store = _make_store()
    _patch_llm(monkeypatch, {"hello world": [0.5, 0.5, 0.0]})
    store._try_embed("semantic", "k1", "hello world")
    assert ("semantic", "k1") in store._embeddings
    assert store._embeddings[("semantic", "k1")] == [0.5, 0.5, 0.0]


def test_try_embed_skips_if_already_cached(monkeypatch):
    store = _make_store()
    store._embeddings[("semantic", "k1")] = [1.0, 0.0]

    import nasus_sidecar.llm_client as _llm
    monkeypatch.setattr(_llm._CONFIG, "api_key", "test-key")
    call_count = {"n": 0}

    def _counting_embed(text, model="text-embedding-3-small"):
        call_count["n"] += 1
        return [0.0, 1.0]

    monkeypatch.setattr(_llm, "embed", _counting_embed)
    store._try_embed("semantic", "k1", "hello")
    assert call_count["n"] == 0  # already cached, no call


def test_embed_all_returns_count(monkeypatch):
    store = _make_store()
    store.write("semantic", "fact_a", "value A")
    store.write("procedural", "pat_b", "pattern B", metadata={
        "description": "desc", "trigger": "trig", "steps": [], "success_rate": 1.0,
    })
    store.write("episodic", "sess_c", "session C summary")

    _patch_llm(monkeypatch, {})
    count = store.embed_all()
    assert count == 3
    assert ("semantic", "fact_a") in store._embeddings
    assert ("procedural", "pat_b") in store._embeddings
    assert ("episodic", "sess_c") in store._embeddings


def test_embed_all_skips_unconfigured(monkeypatch):
    """embed_all returns 0 when llm_client is not configured."""
    store = _make_store()
    store.write("semantic", "x", "something")

    import nasus_sidecar.llm_client as _llm
    monkeypatch.setattr(_llm._CONFIG, "api_key", "")  # not configured

    count = store.embed_all()
    assert count == 0
    assert len(store._embeddings) == 0


# ---------------------------------------------------------------------------
# query() — cosine path vs keyword fallback
# ---------------------------------------------------------------------------

def test_query_uses_cosine_when_embeddings_cached(monkeypatch):
    """
    Manually inject entry embeddings; patch embed() to return a query vector
    that is close to topic_ai and far from topic_cooking.
    """
    store = _make_store()
    store.write("semantic", "topic_ai", "artificial intelligence")
    store.write("semantic", "topic_cooking", "french cuisine recipes")

    # Inject entry embeddings directly — no network needed.
    # topic_ai aligns with query [1,0,0] → cosine 1.0
    # topic_cooking tilted slightly → cosine 0.3 (still > 0 so appears in results)
    store._embeddings[("semantic", "topic_ai")] = [1.0, 0.0, 0.0]
    store._embeddings[("semantic", "topic_cooking")] = [0.3, 0.9, 0.3]

    query_vec = [1.0, 0.0, 0.0]
    import nasus_sidecar.llm_client as _llm
    monkeypatch.setattr(_llm._CONFIG, "api_key", "test-key")
    monkeypatch.setattr(_llm, "embed", lambda text, model="x": query_vec)

    result = store.query("artificial intelligence")
    keys = [r["key"] for r in result["results"]]
    assert "topic_ai" in keys
    assert "topic_cooking" in keys

    ai_score = next(r["score"] for r in result["results"] if r["key"] == "topic_ai")
    cooking_score = next(r["score"] for r in result["results"] if r["key"] == "topic_cooking")
    assert ai_score > cooking_score


def test_query_falls_back_to_keyword_when_not_configured(monkeypatch):
    """When llm_client has no key, keyword scoring is used."""
    import nasus_sidecar.llm_client as _llm
    monkeypatch.setattr(_llm._CONFIG, "api_key", "")

    store = _make_store()
    store.write("semantic", "brand_identity", "brand identity strategy")
    store.write("semantic", "cooking_tips", "french cuisine cooking tips")

    result = store.query("brand identity")
    keys = [r["key"] for r in result["results"]]
    assert "brand_identity" in keys


def test_query_returns_correct_structure():
    store = _make_store()
    store.write("semantic", "k", "completely unrelated content xyz")
    result = store.query("quantum physics")
    assert "results" in result
    assert "confidence" in result
    assert "matched_layers" in result
    assert isinstance(result["results"], list)
