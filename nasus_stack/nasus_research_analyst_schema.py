"""
NASUS RESEARCH ANALYST — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 01 | Stack: Nasus Sub-Agent Network

Pydantic v2 schema classes for all Research Analyst outputs:
- Citation:        A single verified source used in the report
- ReportSection:   A titled section within the research report
- ResearchReport:  The full structured research report
- SourceEntry:     Lightweight ranked source entry for the source_list
- ReportMeta:      Metadata about the research run
- AnalysisResult:  Top-level validated output object

Extracted from inline definitions in nasus_research_analyst.py (Phase 3 hardening).
All downstream consumers and the Quality Reviewer should import from this file.

Import pattern:
    from nasus_research_analyst_schema import (
        Citation, ReportSection, ResearchReport,
        SourceEntry, ReportMeta, AnalysisResult,
    )
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# CITATION
# ---------------------------------------------------------------------------


class Citation(BaseModel):
    """A single verified source used in the report."""

    id: str = Field(..., description="Sequential citation ID, e.g. 'C1', 'C2'")
    url: str = Field(..., description="Full canonical URL of the source")
    title: str = Field(..., description="Title of the article, paper, or page")
    author: Optional[str] = Field(None, description="Author(s) — None if not available")
    date: Optional[str] = Field(
        None, description="Publication date ISO 8601 (YYYY-MM-DD)"
    )
    excerpt: str = Field(
        ..., description="Verbatim quote or close paraphrase used in report"
    )
    credibility_score: float = Field(
        ...,
        ge=1.0,
        le=10.0,
        description="Source credibility 1.0–10.0 per scoring table",
    )
    relevance_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Relevance to the research query, 0.0–1.0",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Analyst confidence in this citation's accuracy, 0.0–1.0",
    )
    domain_type: str = Field(
        ...,
        description=(
            "One of: academic | government | news | industry | blog | opinion | forum | unknown"
        ),
    )
    verified: bool = Field(
        True, description="False if source could not be fully accessed"
    )


# ---------------------------------------------------------------------------
# REPORT SECTION
# ---------------------------------------------------------------------------


class ReportSection(BaseModel):
    """A single titled section within the research report."""

    heading: str = Field(..., description="Section heading, max 80 chars")
    body: str = Field(
        ...,
        description="Markdown-formatted body with inline [Cn] citation tags after each claim",
    )
    citation_ids: List[str] = Field(
        default_factory=list,
        description="All citation IDs referenced in this section, e.g. ['C1', 'C3']",
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Section-level confidence score",
    )
    confidence_badge: str = Field(
        "",
        description="Computed badge: HIGH | MEDIUM | LOW — set automatically",
    )

    def model_post_init(self, __context: Any) -> None:
        if self.confidence >= 0.8:
            object.__setattr__(self, "confidence_badge", "HIGH")
        elif self.confidence >= 0.5:
            object.__setattr__(self, "confidence_badge", "MEDIUM")
        else:
            object.__setattr__(self, "confidence_badge", "LOW")


# ---------------------------------------------------------------------------
# RESEARCH REPORT
# ---------------------------------------------------------------------------


class ResearchReport(BaseModel):
    """The full structured research report."""

    title: str = Field(..., description="Descriptive report title")
    executive_summary: str = Field(
        ...,
        description="3–5 sentence plain-English summary of key findings — always present",
    )
    sections: List[ReportSection] = Field(
        ...,
        min_length=3,
        max_length=7,
        description="3 to 7 titled sections covering sub-questions and synthesis",
    )
    conclusion: str = Field(
        ...,
        description="Final synthesis paragraph with overall takeaways and knowledge gaps",
    )
    refinement_round: int = Field(
        0,
        ge=0,
        description="0 = original report; increments on each refine() call",
    )


# ---------------------------------------------------------------------------
# SOURCE ENTRY
# ---------------------------------------------------------------------------


class SourceEntry(BaseModel):
    """Lightweight ranked source entry for the source_list."""

    citation_id: str
    title: str
    url: str
    credibility_score: float
    relevance_score: float
    domain_type: str
    verified: bool


# ---------------------------------------------------------------------------
# REPORT META
# ---------------------------------------------------------------------------


class ReportMeta(BaseModel):
    """Metadata about the research run."""

    query: str = Field(..., description="Original research query as submitted")
    depth_level: str = Field(
        ...,
        description="'surface' (1-3 sources) | 'standard' (4-7) | 'deep' (8+)",
    )
    overall_confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Aggregate confidence across all sections",
    )
    confidence_badge: str = Field(
        "",
        description="Computed: HIGH | MEDIUM | LOW — set automatically",
    )
    export_formats: List[str] = Field(
        default_factory=lambda: ["markdown", "pdf", "json"],
        description="Formats available for export",
    )
    generated_at: str = Field(
        default_factory=lambda: datetime.now(timezone.utc).isoformat(),
        description="ISO 8601 UTC timestamp of report generation",
    )
    source_count: int = Field(0, ge=0, description="Total number of sources consulted")
    failed_sources: List[str] = Field(
        default_factory=list,
        description="URLs that could not be fetched or verified",
    )
    errors: List[str] = Field(
        default_factory=list,
        description="Non-fatal errors encountered during research run",
    )
    phases_executed: List[str] = Field(
        default_factory=list,
        description="Research phases actually run, e.g. ['SEARCH','READ','EXTRACT',...]",
    )

    def model_post_init(self, __context: Any) -> None:
        if self.overall_confidence >= 0.8:
            object.__setattr__(self, "confidence_badge", "HIGH")
        elif self.overall_confidence >= 0.5:
            object.__setattr__(self, "confidence_badge", "MEDIUM")
        else:
            object.__setattr__(self, "confidence_badge", "LOW")


# ---------------------------------------------------------------------------
# ANALYSIS RESULT (top-level output)
# ---------------------------------------------------------------------------


class AnalysisResult(BaseModel):
    """
    Top-level validated output object returned by NasusResearchAnalyst.
    Always serialise with: result.model_dump(mode='json')
    """

    report: ResearchReport
    citations: List[Citation] = Field(
        default_factory=list,
        description="All citations used, in assignment order C1, C2, ...",
    )
    source_list: List[SourceEntry] = Field(
        default_factory=list,
        description="All sources ranked by relevance_score descending",
    )
    meta: ReportMeta

    @property
    def normalized_quality_score(self) -> float:
        """
        Returns overall_confidence as the normalized 0.0–1.0 quality score
        for Quality Reviewer compatibility.
        """
        try:
            return round(min(max(self.meta.overall_confidence, 0.0), 1.0), 4)
        except (AttributeError, TypeError, ValueError):
            return 0.0


# ---------------------------------------------------------------------------
# VALIDATION HELPERS
# ---------------------------------------------------------------------------

VALID_DOMAIN_TYPES = frozenset(
    {
        "academic",
        "government",
        "news",
        "industry",
        "blog",
        "opinion",
        "forum",
        "unknown",
    }
)

VALID_DEPTH_LEVELS = frozenset({"surface", "standard", "deep"})


def validate_analysis_result(result: AnalysisResult) -> List[str]:
    """
    Run semantic validation on an AnalysisResult beyond Pydantic field checks.
    Returns a list of human-readable error strings (empty = valid).
    """
    errors: List[str] = []

    # Check citation IDs are sequential
    expected_ids = {f"C{i}" for i in range(1, len(result.citations) + 1)}
    actual_ids = {c.id for c in result.citations}
    if actual_ids != expected_ids:
        errors.append(
            f"Citation IDs are not sequential C1..C{len(result.citations)}: "
            f"got {sorted(actual_ids)}"
        )

    # Check all section citation_ids reference valid citations
    valid_ids = actual_ids
    for section in result.report.sections:
        for cid in section.citation_ids:
            if cid not in valid_ids:
                errors.append(
                    f"Section '{section.heading}' references unknown citation {cid}"
                )

    # Check domain_type values
    for citation in result.citations:
        if citation.domain_type not in VALID_DOMAIN_TYPES:
            errors.append(
                f"Citation {citation.id} has invalid domain_type '{citation.domain_type}'. "
                f"Valid: {sorted(VALID_DOMAIN_TYPES)}"
            )

    # Check depth_level
    if result.meta.depth_level not in VALID_DEPTH_LEVELS:
        errors.append(
            f"meta.depth_level '{result.meta.depth_level}' is invalid. "
            f"Valid: {sorted(VALID_DEPTH_LEVELS)}"
        )

    # Source count consistency
    if result.meta.source_count != len(result.citations):
        errors.append(
            f"meta.source_count ({result.meta.source_count}) != "
            f"len(citations) ({len(result.citations)})"
        )

    # Source list should be sorted by relevance_score descending
    if len(result.source_list) >= 2:
        for i in range(len(result.source_list) - 1):
            if (
                result.source_list[i].relevance_score
                < result.source_list[i + 1].relevance_score
            ):
                errors.append(
                    "source_list is not sorted by relevance_score descending "
                    f"(index {i}: {result.source_list[i].relevance_score} < "
                    f"index {i + 1}: {result.source_list[i + 1].relevance_score})"
                )
                break

    # Report must have 3–7 sections (Pydantic enforces this, but belt-and-suspenders)
    n_sections = len(result.report.sections)
    if not (3 <= n_sections <= 7):
        errors.append(f"Report has {n_sections} sections; expected 3–7")

    # Executive summary must not be empty
    if not result.report.executive_summary.strip():
        errors.append("executive_summary is empty")

    # Conclusion must not be empty
    if not result.report.conclusion.strip():
        errors.append("conclusion is empty")

    return errors


# ---------------------------------------------------------------------------
# SCHEMA TESTS
# ---------------------------------------------------------------------------


def run_schema_tests() -> None:
    """Self-test for all M01 Research Analyst schema classes."""
    import json as _json

    print("Running Research Analyst schema tests...\n")
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

    # T01 — Citation round-trip
    def t01():
        c = Citation(
            id="C1",
            url="https://example.com/paper",
            title="Example Paper",
            excerpt="Key finding from the paper.",
            credibility_score=8.5,
            relevance_score=0.9,
            confidence=0.85,
            domain_type="academic",
        )
        d = c.model_dump()
        c2 = Citation.model_validate(d)
        assert c2.id == "C1"
        assert c2.credibility_score == 8.5
        assert c2.verified is True

    test("T01 — Citation round-trip", t01)

    # T02 — Citation rejects out-of-range credibility
    def t02():
        try:
            Citation(
                id="C1",
                url="https://example.com",
                title="Bad",
                excerpt="x",
                credibility_score=15.0,  # out of range
                relevance_score=0.5,
                confidence=0.5,
                domain_type="news",
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T02 — Citation rejects out-of-range credibility", t02)

    # T03 — ReportSection confidence badge
    def t03():
        s = ReportSection(heading="Test", body="content [C1]", confidence=0.92)
        assert s.confidence_badge == "HIGH"
        s2 = ReportSection(heading="Test", body="content", confidence=0.6)
        assert s2.confidence_badge == "MEDIUM"
        s3 = ReportSection(heading="Test", body="content", confidence=0.3)
        assert s3.confidence_badge == "LOW"

    test("T03 — ReportSection confidence badge", t03)

    # T04 — ResearchReport min sections enforced
    def t04():
        try:
            ResearchReport(
                title="Test",
                executive_summary="Summary.",
                sections=[
                    ReportSection(heading="S1", body="b1", confidence=0.8),
                    ReportSection(heading="S2", body="b2", confidence=0.7),
                ],  # only 2 — minimum is 3
                conclusion="Conclusion.",
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T04 — ResearchReport min sections enforced", t04)

    # T05 — ReportMeta badge auto-set
    def t05():
        m = ReportMeta(
            query="test",
            depth_level="standard",
            overall_confidence=0.95,
        )
        assert m.confidence_badge == "HIGH"

    test("T05 — ReportMeta badge auto-set", t05)

    # T06 — AnalysisResult full round-trip
    def t06():
        sections = [
            ReportSection(
                heading=f"Section {i}",
                body=f"Body {i} [C1]",
                confidence=0.8,
                citation_ids=["C1"],
            )
            for i in range(1, 4)
        ]
        report = ResearchReport(
            title="Test Report",
            executive_summary="This is a test.",
            sections=sections,
            conclusion="In conclusion...",
        )
        citation = Citation(
            id="C1",
            url="https://example.com",
            title="Source",
            excerpt="excerpt",
            credibility_score=7.0,
            relevance_score=0.85,
            confidence=0.9,
            domain_type="news",
        )
        source = SourceEntry(
            citation_id="C1",
            title="Source",
            url="https://example.com",
            credibility_score=7.0,
            relevance_score=0.85,
            domain_type="news",
            verified=True,
        )
        meta = ReportMeta(
            query="test query",
            depth_level="standard",
            overall_confidence=0.85,
            source_count=1,
            phases_executed=["SEARCH", "READ", "EXTRACT"],
        )
        result = AnalysisResult(
            report=report,
            citations=[citation],
            source_list=[source],
            meta=meta,
        )
        j = result.model_dump_json(indent=2)
        parsed = _json.loads(j)
        assert parsed["report"]["title"] == "Test Report"
        assert len(parsed["citations"]) == 1
        assert parsed["meta"]["confidence_badge"] == "HIGH"

        # Validate
        errors = validate_analysis_result(result)
        assert len(errors) == 0, f"Unexpected validation errors: {errors}"

    test("T06 — AnalysisResult full round-trip + validation", t06)

    # T07 — normalized_quality_score
    def t07():
        meta = ReportMeta(query="q", depth_level="surface", overall_confidence=0.75)
        sections = [
            ReportSection(heading=f"S{i}", body="b", confidence=0.7) for i in range(3)
        ]
        result = AnalysisResult(
            report=ResearchReport(
                title="T",
                executive_summary="S",
                sections=sections,
                conclusion="C",
            ),
            meta=meta,
        )
        assert result.normalized_quality_score == 0.75

    test("T07 — normalized_quality_score", t07)

    # T08 — validate_analysis_result catches bad citation IDs
    def t08():
        sections = [
            ReportSection(
                heading=f"S{i}", body="b", confidence=0.7, citation_ids=["C99"]
            )
            for i in range(3)
        ]
        result = AnalysisResult(
            report=ResearchReport(
                title="T",
                executive_summary="S",
                sections=sections,
                conclusion="C",
            ),
            citations=[
                Citation(
                    id="C1",
                    url="https://x.com",
                    title="X",
                    excerpt="e",
                    credibility_score=5.0,
                    relevance_score=0.5,
                    confidence=0.5,
                    domain_type="news",
                )
            ],
            meta=ReportMeta(
                query="q", depth_level="surface", overall_confidence=0.5, source_count=1
            ),
        )
        errors = validate_analysis_result(result)
        assert any("C99" in e for e in errors), f"Expected C99 error, got: {errors}"

    test("T08 — validate catches unknown citation refs", t08)

    # T09 — SourceEntry round-trip
    def t09():
        se = SourceEntry(
            citation_id="C1",
            title="Test",
            url="https://example.com",
            credibility_score=6.0,
            relevance_score=0.7,
            domain_type="industry",
            verified=True,
        )
        d = se.model_dump()
        se2 = SourceEntry.model_validate(d)
        assert se2.citation_id == "C1"

    test("T09 — SourceEntry round-trip", t09)

    print(f"\n  Results: {passed} passed, {failed} failed\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_schema_tests()
