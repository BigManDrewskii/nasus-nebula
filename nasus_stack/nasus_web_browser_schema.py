"""
NASUS WEB BROWSER — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 03 | Stack: Nasus Sub-Agent Network

Pydantic v2 schema classes for all Web Browser outputs:
- SourceRecord:      A single fetched or searched web source
- KeyFinding:        A labeled finding with citation support
- NextStep:          A prioritized follow-up action
- SessionContext:    Multi-turn session state for browse/refine loops
- BrowseOutputMeta:  Query metadata, confidence, render hints
- BrowseOutput:      Top-level output for browse() and refine() calls

Extracted from inline definitions in nasus_web_browser.py (Phase 3 hardening).
All downstream consumers and the Quality Reviewer should import from this file.

Import pattern:
    from nasus_web_browser_schema import (
        SourceRecord, KeyFinding, NextStep,
        SessionContext, BrowseOutputMeta, BrowseOutput,
    )
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# MODULE CONSTANTS
# ---------------------------------------------------------------------------

MODULE_VERSION = "1.0.0"

VALID_SOURCE_STATUSES = frozenset(
    {"fetched", "searched_only", "inaccessible", "timed_out", "paywalled"}
)

VALID_INTENT_TYPES = frozenset(
    {"quick_lookup", "deep_research", "page_fetch", "comparative", "monitoring"}
)

VALID_DEPTH_LEVELS = frozenset({"quick_lookup", "standard", "deep"})

VALID_CONFIDENCE_LEVELS = frozenset({"high", "medium", "low", "unverified"})

VALID_PRIORITIES = frozenset({"high", "medium", "low"})


# ---------------------------------------------------------------------------
# SOURCE RECORD
# ---------------------------------------------------------------------------


class SourceRecord(BaseModel):
    """A single web source fetched or discovered via search."""

    url: str = Field(..., description="Full URL of the fetched or searched page")
    title: str = Field(..., description="Page title or search result title")
    domain: str = Field(..., description="Root domain, e.g. 'reuters.com'")
    credibility_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="0.0–1.0 credibility rating",
    )
    accessed_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp of when the source was accessed",
    )
    status: Literal[
        "fetched", "searched_only", "inaccessible", "timed_out", "paywalled"
    ] = Field(
        default="searched_only",
        description="Fetch status of this source",
    )
    citation_index: int = Field(
        ...,
        description="1-based index for inline citation markers [N]",
    )


# ---------------------------------------------------------------------------
# KEY FINDING
# ---------------------------------------------------------------------------


class KeyFinding(BaseModel):
    """A labeled finding extracted from browsed sources."""

    label: str = Field(
        ...,
        description="Short label, e.g. 'Pricing Change', 'Key Risk', 'Technical Detail'",
    )
    finding: str = Field(
        ...,
        description="The actual finding in 1–3 sentences",
    )
    citation_indices: List[int] = Field(
        default_factory=list,
        description="Which sources support this finding (1-based citation indices)",
    )
    confidence: Literal["high", "medium", "low", "unverified"] = Field(
        default="medium",
        description="Confidence level in this finding",
    )


# ---------------------------------------------------------------------------
# NEXT STEP
# ---------------------------------------------------------------------------


class NextStep(BaseModel):
    """A prioritized follow-up action recommended after browsing."""

    priority: Literal["high", "medium", "low"] = Field(
        default="medium",
        description="Urgency / importance of this step",
    )
    action: str = Field(
        ...,
        description="Specific recommended next action",
    )
    rationale: str = Field(
        ...,
        description="Why this step is recommended",
    )
    suggested_agent: Optional[str] = Field(
        None,
        description="Which Nasus sub-agent handles this, if applicable",
    )


# ---------------------------------------------------------------------------
# SESSION CONTEXT
# ---------------------------------------------------------------------------


class SessionContext(BaseModel):
    """Multi-turn session state for browse/refine loops."""

    session_id: str = Field(
        default_factory=lambda: str(uuid.uuid4()),
        description="Unique session identifier",
    )
    turn_number: int = Field(
        default=1,
        description="Increments with each refine() call",
    )
    original_query: str = Field(
        ...,
        description="The first user query in this session",
    )
    active_queries: List[str] = Field(
        default_factory=list,
        description="Current active sub-queries being investigated",
    )
    visited_urls: List[str] = Field(
        default_factory=list,
        description="All URLs fetched this session (dedup tracking)",
    )
    accumulated_findings: List[KeyFinding] = Field(
        default_factory=list,
        description="Findings accumulated across all turns",
    )
    last_updated: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 timestamp of the last session update",
    )


# ---------------------------------------------------------------------------
# BROWSE OUTPUT META
# ---------------------------------------------------------------------------


class BrowseOutputMeta(BaseModel):
    """Query metadata, confidence, and rendering hints."""

    query: str = Field(
        ...,
        description="The triggering user query",
    )
    depth: Literal["quick_lookup", "standard", "deep"] = Field(
        default="standard",
        description="Research depth classification",
    )
    intent_type: Literal[
        "quick_lookup", "deep_research", "page_fetch", "comparative", "monitoring"
    ] = Field(
        default="quick_lookup",
        description="Classified intent of the user query",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall output confidence score",
    )
    pages_fetched: int = Field(
        default=0,
        description="Number of pages actually fetched (HTTP GET)",
    )
    searches_issued: int = Field(
        default=0,
        description="Number of search queries issued",
    )
    processing_time_ms: Optional[int] = Field(
        None,
        description="Wall-clock processing time in milliseconds",
    )
    errors: List[str] = Field(
        default_factory=list,
        description="Non-fatal errors encountered during the browse",
    )
    verification_result: Optional[Dict[str, Any]] = Field(
        None,
        description="Cross-verification result if multiple sources were checked",
    )
    clarification_note: Optional[str] = Field(
        None,
        description="Note for the user if the query was ambiguous",
    )
    render_hints: Dict[str, Any] = Field(
        default_factory=lambda: {
            "show_sources_panel": True,
            "show_confidence_bar": True,
            "highlight_citations": True,
            "allow_export": True,
            "show_next_steps": True,
        },
        description="UI rendering hints for the Nasus frontend",
    )
    module_version: str = Field(
        default=MODULE_VERSION,
        description="Version of the Web Browser module that produced this output",
    )


# ---------------------------------------------------------------------------
# BROWSE OUTPUT (top-level)
# ---------------------------------------------------------------------------


class BrowseOutput(BaseModel):
    """
    Top-level output schema for NasusWebBrowser.
    Every browse() or refine() call returns one of these.
    """

    summary: str = Field(
        ...,
        description="Clean prose summary with inline citation markers [N]",
    )
    key_findings: List[KeyFinding] = Field(
        ...,
        min_length=1,
        description="3–7 labeled key findings",
    )
    sources: List[SourceRecord] = Field(
        ...,
        min_length=1,
        description="All sources consulted",
    )
    suggested_next_steps: List[NextStep] = Field(
        default_factory=list,
        description="Prioritized follow-up actions",
    )
    session_context: SessionContext = Field(
        ...,
        description="Multi-turn session state",
    )
    meta: BrowseOutputMeta = Field(
        ...,
        description="Query metadata, confidence, render hints",
    )

    def to_json(self, indent: int = 2) -> str:
        """Serialize to JSON string."""
        return self.model_dump_json(indent=indent)

    def to_dict(self) -> Dict[str, Any]:
        """Serialize to plain dict."""
        return self.model_dump()

    @property
    def normalized_quality_score(self) -> float:
        """
        Returns overall confidence as the normalized 0.0–1.0 quality score
        for Quality Reviewer compatibility.
        """
        try:
            return round(min(max(self.meta.confidence, 0.0), 1.0), 4)
        except (AttributeError, TypeError, ValueError):
            return 0.0


# ---------------------------------------------------------------------------
# VALIDATION HELPERS
# ---------------------------------------------------------------------------


def validate_browse_output(output: BrowseOutput) -> List[str]:
    """
    Run semantic validation on a BrowseOutput beyond Pydantic field checks.
    Returns a list of human-readable error strings (empty = valid).
    """
    errors: List[str] = []

    # Check citation indices are 1-based and sequential
    if output.sources:
        indices = sorted(s.citation_index for s in output.sources)
        expected = list(range(1, len(output.sources) + 1))
        if indices != expected:
            errors.append(
                f"Source citation_index values are not sequential 1..{len(output.sources)}: "
                f"got {indices}"
            )

    # Check findings reference valid citation indices
    valid_indices = {s.citation_index for s in output.sources}
    for finding in output.key_findings:
        for idx in finding.citation_indices:
            if idx not in valid_indices:
                errors.append(
                    f"Finding '{finding.label}' references unknown citation index {idx}"
                )

    # Check summary is not empty
    if not output.summary.strip():
        errors.append("summary is empty")

    # Check key_findings count (should be 3–7 per spec, but at least 1 per Pydantic)
    n_findings = len(output.key_findings)
    if n_findings > 7:
        errors.append(
            f"key_findings has {n_findings} entries; recommended maximum is 7"
        )

    # Check depth is valid
    if output.meta.depth not in VALID_DEPTH_LEVELS:
        errors.append(
            f"meta.depth '{output.meta.depth}' is invalid. "
            f"Valid: {sorted(VALID_DEPTH_LEVELS)}"
        )

    # Check intent_type is valid
    if output.meta.intent_type not in VALID_INTENT_TYPES:
        errors.append(
            f"meta.intent_type '{output.meta.intent_type}' is invalid. "
            f"Valid: {sorted(VALID_INTENT_TYPES)}"
        )

    # Check sources have valid statuses
    for source in output.sources:
        if source.status not in VALID_SOURCE_STATUSES:
            errors.append(
                f"Source '{source.title}' has invalid status '{source.status}'. "
                f"Valid: {sorted(VALID_SOURCE_STATUSES)}"
            )

    # Check pages_fetched consistency
    fetched_count = sum(1 for s in output.sources if s.status == "fetched")
    if output.meta.pages_fetched != fetched_count:
        errors.append(
            f"meta.pages_fetched ({output.meta.pages_fetched}) != "
            f"actual fetched sources ({fetched_count})"
        )

    # Check session context turn number is positive
    if output.session_context.turn_number < 1:
        errors.append(
            f"session_context.turn_number is {output.session_context.turn_number}; "
            "must be >= 1"
        )

    # Check original_query is not empty
    if not output.session_context.original_query.strip():
        errors.append("session_context.original_query is empty")

    return errors


# ---------------------------------------------------------------------------
# SCHEMA TESTS
# ---------------------------------------------------------------------------


def run_schema_tests() -> None:
    """Self-test for all M03 Web Browser schema classes."""
    import json as _json

    print("Running Web Browser schema tests...\n")
    passed = 0
    failed = 0

    def test(name: str, fn):  # noqa: ANN001
        nonlocal passed, failed
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {name}: {e}")
            failed += 1

    # T01 — SourceRecord round-trip
    def t01():
        s = SourceRecord(
            url="https://example.com/article",
            title="Example Article",
            domain="example.com",
            credibility_score=0.85,
            status="fetched",
            citation_index=1,
        )
        d = s.model_dump()
        s2 = SourceRecord.model_validate(d)
        assert s2.url == "https://example.com/article"
        assert s2.citation_index == 1
        assert s2.status == "fetched"

    test("T01 — SourceRecord round-trip", t01)

    # T02 — SourceRecord rejects out-of-range credibility
    def t02():
        try:
            SourceRecord(
                url="https://bad.com",
                title="Bad",
                domain="bad.com",
                credibility_score=1.5,  # out of range
                citation_index=1,
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T02 — SourceRecord rejects out-of-range credibility", t02)

    # T03 — KeyFinding round-trip
    def t03():
        kf = KeyFinding(
            label="Price Increase",
            finding="The product price increased by 15% in Q3.",
            citation_indices=[1, 3],
            confidence="high",
        )
        d = kf.model_dump()
        kf2 = KeyFinding.model_validate(d)
        assert kf2.label == "Price Increase"
        assert kf2.confidence == "high"
        assert kf2.citation_indices == [1, 3]

    test("T03 — KeyFinding round-trip", t03)

    # T04 — NextStep round-trip
    def t04():
        ns = NextStep(
            priority="high",
            action="Deep-dive into competitor pricing pages",
            rationale="Initial findings suggest pricing change, need confirmation",
            suggested_agent="M01",
        )
        d = ns.model_dump()
        ns2 = NextStep.model_validate(d)
        assert ns2.priority == "high"
        assert ns2.suggested_agent == "M01"

    test("T04 — NextStep round-trip", t04)

    # T05 — SessionContext defaults
    def t05():
        sc = SessionContext(original_query="What is the latest on AI regulation?")
        assert sc.turn_number == 1
        assert len(sc.session_id) > 0
        assert sc.original_query == "What is the latest on AI regulation?"
        assert sc.active_queries == []
        assert sc.visited_urls == []
        assert sc.accumulated_findings == []

    test("T05 — SessionContext defaults", t05)

    # T06 — BrowseOutputMeta render_hints defaults
    def t06():
        m = BrowseOutputMeta(
            query="test query",
            confidence=0.75,
        )
        assert m.render_hints["show_sources_panel"] is True
        assert m.render_hints["highlight_citations"] is True
        assert m.depth == "standard"
        assert m.intent_type == "quick_lookup"
        assert m.module_version == MODULE_VERSION

    test("T06 — BrowseOutputMeta render_hints defaults", t06)

    # T07 — BrowseOutput full round-trip
    def t07():
        source = SourceRecord(
            url="https://reuters.com/ai",
            title="AI Regulation Update",
            domain="reuters.com",
            credibility_score=0.95,
            status="fetched",
            citation_index=1,
        )
        finding = KeyFinding(
            label="New EU Regulation",
            finding="The EU passed new AI regulation in December 2024.",
            citation_indices=[1],
            confidence="high",
        )
        next_step = NextStep(
            priority="medium",
            action="Research US regulatory response",
            rationale="Compare EU and US approaches",
        )
        session = SessionContext(
            original_query="AI regulation news",
            active_queries=["AI regulation news"],
            visited_urls=["https://reuters.com/ai"],
        )
        meta = BrowseOutputMeta(
            query="AI regulation news",
            depth="standard",
            intent_type="deep_research",
            confidence=0.88,
            pages_fetched=1,
            searches_issued=2,
        )
        output = BrowseOutput(
            summary="The EU passed comprehensive AI regulation [1].",
            key_findings=[finding],
            sources=[source],
            suggested_next_steps=[next_step],
            session_context=session,
            meta=meta,
        )

        j = output.to_json()
        parsed = _json.loads(j)
        assert parsed["summary"].startswith("The EU")
        assert len(parsed["key_findings"]) == 1
        assert len(parsed["sources"]) == 1
        assert parsed["meta"]["confidence"] == 0.88

        d = output.to_dict()
        assert d["session_context"]["original_query"] == "AI regulation news"

    test("T07 — BrowseOutput full round-trip", t07)

    # T08 — normalized_quality_score
    def t08():
        source = SourceRecord(
            url="https://example.com",
            title="E",
            domain="example.com",
            credibility_score=0.5,
            status="fetched",
            citation_index=1,
        )
        finding = KeyFinding(label="F", finding="f", citation_indices=[1])
        session = SessionContext(original_query="q")
        meta = BrowseOutputMeta(query="q", confidence=0.82, pages_fetched=1)
        output = BrowseOutput(
            summary="s [1]",
            key_findings=[finding],
            sources=[source],
            session_context=session,
            meta=meta,
        )
        assert output.normalized_quality_score == 0.82

    test("T08 — normalized_quality_score", t08)

    # T09 — validate_browse_output catches bad citation reference
    def t09():
        source = SourceRecord(
            url="https://example.com",
            title="E",
            domain="example.com",
            credibility_score=0.5,
            status="fetched",
            citation_index=1,
        )
        finding = KeyFinding(
            label="F",
            finding="f",
            citation_indices=[1, 99],  # 99 does not exist
        )
        session = SessionContext(original_query="q")
        meta = BrowseOutputMeta(query="q", confidence=0.7, pages_fetched=1)
        output = BrowseOutput(
            summary="s [1]",
            key_findings=[finding],
            sources=[source],
            session_context=session,
            meta=meta,
        )
        validation_errors = validate_browse_output(output)
        assert any("99" in e for e in validation_errors), (
            f"Expected citation index 99 error, got: {validation_errors}"
        )

    test("T09 — validate catches unknown citation index", t09)

    # T10 — validate_browse_output catches pages_fetched mismatch
    def t10():
        source = SourceRecord(
            url="https://example.com",
            title="E",
            domain="example.com",
            credibility_score=0.5,
            status="searched_only",  # not fetched
            citation_index=1,
        )
        finding = KeyFinding(label="F", finding="f")
        session = SessionContext(original_query="q")
        meta = BrowseOutputMeta(
            query="q",
            confidence=0.7,
            pages_fetched=3,  # says 3 but none are fetched
        )
        output = BrowseOutput(
            summary="s",
            key_findings=[finding],
            sources=[source],
            session_context=session,
            meta=meta,
        )
        validation_errors = validate_browse_output(output)
        assert any("pages_fetched" in e for e in validation_errors), (
            f"Expected pages_fetched mismatch error, got: {validation_errors}"
        )

    test("T10 — validate catches pages_fetched mismatch", t10)

    # T11 — BrowseOutput requires at least 1 finding
    def t11():
        try:
            source = SourceRecord(
                url="https://example.com",
                title="E",
                domain="example.com",
                credibility_score=0.5,
                citation_index=1,
            )
            session = SessionContext(original_query="q")
            meta = BrowseOutputMeta(query="q", confidence=0.5)
            BrowseOutput(
                summary="s",
                key_findings=[],  # empty — min_length=1 should reject
                sources=[source],
                session_context=session,
                meta=meta,
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T11 — BrowseOutput rejects empty key_findings", t11)

    # T12 — BrowseOutput requires at least 1 source
    def t12():
        try:
            finding = KeyFinding(label="F", finding="f")
            session = SessionContext(original_query="q")
            meta = BrowseOutputMeta(query="q", confidence=0.5)
            BrowseOutput(
                summary="s",
                key_findings=[finding],
                sources=[],  # empty — min_length=1 should reject
                session_context=session,
                meta=meta,
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T12 — BrowseOutput rejects empty sources", t12)

    print(f"\n  Results: {passed} passed, {failed} failed\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_schema_tests()
