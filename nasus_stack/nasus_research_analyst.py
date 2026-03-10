# =============================================================================
# NASUS RESEARCH ANALYST — v1.0
# Drop-in sub-agent module for the Nasus AI orchestration layer
# Artifacts: System Prompt | Refine Pattern | Output Schema | Prototype Class
# Run: python nasus_research_analyst.py
# Requires: pip install pydantic
# =============================================================================

from __future__ import annotations

import json
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

try:
    from pydantic import BaseModel, Field
except ImportError:
    raise ImportError("pydantic required: pip install pydantic")

# ---------------------------------------------------------------------------
# CANONICAL SCHEMA: nasus_research_analyst_schema.py
# The classes below (Citation, ReportSection, ResearchReport, SourceEntry,
# ReportMeta, AnalysisResult) are defined inline for historical reasons.
# The canonical, tested versions live in nasus_research_analyst_schema.py.
# New consumers should import from that file instead:
#
#   from nasus_research_analyst_schema import (
#       Citation, ReportSection, ResearchReport,
#       SourceEntry, ReportMeta, AnalysisResult,
#       validate_analysis_result,
#   )
# ---------------------------------------------------------------------------

# =============================================================================
# PHASE 1 — SPECIALIST SYSTEM PROMPT
# =============================================================================

SYSTEM_PROMPT: str = """
You are the Nasus Research Analyst — a senior AI specialist in multi-source
research synthesis, citation tracking, and structured report generation.
You are invoked by the Nasus orchestration layer for deep, evidence-based research.

## IDENTITY & ROLE
- Produce rigorous, citation-backed research reports only.
- Every factual claim MUST carry an inline citation tag [C1], [C2], etc.
- Never fabricate URLs, author names, publication dates, or quotes.
- Declare confidence (0.0–1.0) on every section and overall.
- Write for a professional audience: clear, precise, no filler.

## 6-PHASE RESEARCH LOOP

### PHASE 1 — SEARCH
- Decompose query into 3–5 focused sub-questions.
- Identify 3–10 authoritative sources per sub-question.
- Priority order: academic paper > government report > major news > industry blog.
- Record: URL, title, author, date, domain type for every source attempted.

### PHASE 2 — READ
- Skim abstract/intro/conclusion first.
- If relevance_score >= 0.5: deep-read relevant sections.
- Extract: key claims, data points, quotes, methodology notes.
- Flag contradictions between sources immediately.

### PHASE 3 — EXTRACT
- Pull claims, statistics, quotes with exact source attribution.
- Every extracted item: source_id + excerpt + section reference.
- Organise by sub-question, not by source.
- Discard sources with credibility_score < 3.0 unless flagging as [UNVERIFIED].

### PHASE 4 — SYNTHESIZE
- Cross-reference all extractions.
- Identify: consensus views | conflicting findings | knowledge gaps.
- Build narrative representing the weight of evidence — no cherry-picking.
- Distinguish inference from direct evidence explicitly.

### PHASE 5 — CITE
- Assign citation IDs: C1, C2, C3, ...
- Build full Citation object for each source used.
- Tag every factual sentence with [Cn] immediately after the claim.
- Multiple supporting sources: [C1][C3].

### PHASE 6 — EXPORT
- Format as structured ResearchReport (title, exec summary, 3–7 sections, conclusion).
- Attach source_list ordered by relevance_score descending.
- Return validated AnalysisResult JSON object — always.

## SOURCE CREDIBILITY SCORING (1.0–10.0)
| Source Type                        | Score     |
|------------------------------------|-----------|
| Peer-reviewed academic paper       | 9.0–10.0  |
| Preprint (arXiv, SSRN, bioRxiv)    | 7.0–8.5   |
| Government / institutional report  | 8.0–9.0   |
| Major news outlet (Reuters, BBC)   | 6.0–8.0   |
| Industry research report           | 5.5–7.5   |
| Established tech/industry blog     | 4.0–6.0   |
| Opinion / editorial                | 3.0–5.0   |
| Personal blog / forum post         | 1.5–3.5   |
| Unverified / anonymous source      | 1.0–2.5   |

## WHAT TO AVOID
- NEVER fabricate a citation, URL, author, or statistic.
- NEVER make a factual claim without [Cn] inline tag.
- NEVER use source with credibility_score < 3.0 without [UNVERIFIED] flag.
- NEVER plagiarise — paraphrase; use quotes only for direct quotations.
- NEVER omit executive_summary.
- NEVER set overall_confidence > 0.85 unless 5+ high-quality sources agree.
- NEVER ignore conflicting evidence — address it head-on.
- NEVER produce more than 7 report sections.

## OUTPUT FORMAT RULES
- Return AnalysisResult JSON object always.
- Section body: markdown format with inline [Cn] tags after each claim.
- Source list: ordered by relevance_score descending.
- Confidence badges: >= 0.8 HIGH | 0.5–0.79 MEDIUM | < 0.5 LOW.
- depth_level: "surface" (1–3 sources) | "standard" (4–7) | "deep" (8+).
- Always include: export_formats: ["markdown", "pdf", "json"].
- Timestamp: generated_at in ISO 8601 UTC.
"""

# =============================================================================
# PHASE 2 — REFINE / ITERATION PATTERN
# =============================================================================

REFINE_PATTERN: Dict[str, Any] = {
    "version": "1.0",
    "description": (
        "Governs how Nasus Research Analyst handles follow-up messages, "
        "deeper dives, source verification, and iterative refinement "
        "across multi-turn sessions using session_state for context."
    ),
    "triggers": {
        "deeper": [
            "go deeper on",
            "expand on",
            "tell me more about",
            "elaborate on",
            "more detail on",
            "deep dive",
        ],
        "verify": [
            "verify source",
            "check source",
            "is this accurate",
            "confirm citation",
            "fact-check",
            "double-check",
        ],
        "narrow": [
            "narrow to",
            "focus only on",
            "just look at",
            "filter to",
            "restrict to",
            "limit to",
        ],
        "broaden": [
            "broaden",
            "expand scope",
            "include more",
            "also consider",
            "add context about",
            "widen",
        ],
        "tone": [
            "rewrite in",
            "change tone",
            "make it more",
            "simplify",
            "make technical",
            "executive style",
        ],
        "citation": [
            "add citation",
            "add source",
            "find a source for",
            "cite this",
            "where does this come from",
        ],
        "section_rewrite": [
            "rewrite section",
            "redo section",
            "update section",
            "revise section",
        ],
        "summarize": [
            "summarize in one",
            "give me a tldr",
            "one paragraph",
            "brief version",
            "short summary",
        ],
        "export": [
            "export as",
            "download as",
            "save as",
            "give me the pdf",
            "send as markdown",
            "export json",
        ],
        "full_rewrite": [
            "start over",
            "full rewrite",
            "redo everything",
            "rerun the research",
            "fresh report",
        ],
    },
    "context_accumulation": """
    session_state structure (passed into every refine() call):
    {
        "last_report":       ResearchReport,        # most recent full report
        "citation_registry": Dict[str, Citation],   # all citations this session
        "refinement_round":  int,                   # 0=original, increments each round
        "query_history":     List[str],             # original + all follow-ups
        "diff_log":          List[dict],            # per-round change summaries
    }

    On each refine() call:
    1. Load last_report + citation_registry from session_state.
    2. Detect trigger type from follow-up message.
    3. Apply partial_rerun_rules — only re-execute needed phases.
    4. Merge new citations into registry (no duplicate IDs).
    5. Increment refinement_round in returned report.
    6. Append diff summary to diff_log.
    """,
    "clarification_protocol": {
        "ask_when": [
            "Query has 2+ equally valid interpretations with different research paths",
            "User references source by partial name with multiple matches",
            "Scope change would invalidate > 50% of existing citations",
            "Depth change requires > 5 new sources — confirm before fetching",
        ],
        "assume_when": [
            "Refinement is purely additive (add detail, add citation)",
            "Tone/format change only — no new research needed",
            "Section rewrite with unambiguous heading reference",
            "Export format request",
        ],
        "format": "Ask ONE clarifying question. Offer 2–3 concrete options for fast response.",
    },
    "partial_rerun_rules": {
        "deeper": ["SEARCH", "READ", "EXTRACT", "SYNTHESIZE", "CITE", "EXPORT"],
        "verify": ["READ"],
        "narrow": ["EXTRACT", "SYNTHESIZE", "CITE", "EXPORT"],
        "broaden": ["SEARCH", "READ", "EXTRACT", "SYNTHESIZE", "CITE", "EXPORT"],
        "tone": ["EXPORT"],
        "citation": ["SEARCH", "CITE", "EXPORT"],
        "section_rewrite": ["SYNTHESIZE", "EXPORT"],
        "summarize": ["EXPORT"],
        "export": ["EXPORT"],
        "full_rewrite": ["SEARCH", "READ", "EXTRACT", "SYNTHESIZE", "CITE", "EXPORT"],
    },
    "error_recovery": {
        "source_fetch_failed": "Skip + add to meta.failed_sources. Flag in report footer. Continue.",
        "contradictory_sources": "Present both views under 'Conflicting Evidence' sub-heading. Cite all. Assess weight of evidence.",
        "no_sources_found": "Widen query. Notify user: 'No sources for [X]. Widening to [Y] — confirm?'",
        "low_confidence_only": "Produce report. Set overall_confidence <= 0.4. Add prominent disclaimer.",
        "validation_error": "Log to meta.errors. Repair field with safe default. Retry validation once.",
    },
    "iteration_limit": 5,
    "iteration_limit_message": (
        "Maximum 5 refinement rounds reached for this session. "
        "Please start a new research task for further changes."
    ),
}

# =============================================================================
# PHASE 3 — STRUCTURED OUTPUT SCHEMA (Pydantic)
# =============================================================================

# ---------------------------------------------------------------------------
# MARKDOWN / PDF RENDERING HINTS
# ---------------------------------------------------------------------------
# markdown : render section.body as-is; wrap citations in <sup>[Cn]</sup>.
# pdf      : use WeasyPrint or ReportLab; map confidence badge to color:
#              HIGH   -> green  (#2ecc71)
#              MEDIUM -> amber  (#f39c12)
#              LOW    -> red    (#e74c3c)
# json     : dump AnalysisResult.model_dump(mode="json") directly.
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
        ..., ge=0.0, le=1.0, description="Relevance to the research query, 0.0–1.0"
    )
    confidence: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Analyst confidence in this citation's accuracy, 0.0–1.0",
    )
    domain_type: str = Field(
        ...,
        description="One of: academic | government | news | industry | blog | opinion | forum | unknown",
    )
    verified: bool = Field(
        True, description="False if source could not be fully accessed"
    )


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
        ..., ge=0.0, le=1.0, description="Section-level confidence score"
    )
    confidence_badge: str = Field(
        "", description="Computed badge: HIGH | MEDIUM | LOW — set automatically"
    )

    def model_post_init(self, __context: Any) -> None:
        if self.confidence >= 0.8:
            object.__setattr__(self, "confidence_badge", "HIGH")
        elif self.confidence >= 0.5:
            object.__setattr__(self, "confidence_badge", "MEDIUM")
        else:
            object.__setattr__(self, "confidence_badge", "LOW")


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
        0, ge=0, description="0 = original report; increments on each refine() call"
    )


class SourceEntry(BaseModel):
    """Lightweight ranked source entry for the source_list."""

    citation_id: str
    title: str
    url: str
    credibility_score: float
    relevance_score: float
    domain_type: str
    verified: bool


class ReportMeta(BaseModel):
    """Metadata about the research run."""

    query: str = Field(..., description="Original research query as submitted")
    depth_level: str = Field(
        ..., description="'surface' (1-3 sources) | 'standard' (4-7) | 'deep' (8+)"
    )
    overall_confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Aggregate confidence across all sections"
    )
    confidence_badge: str = Field(
        "", description="Computed: HIGH | MEDIUM | LOW — set automatically"
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
        default_factory=list, description="URLs that could not be fetched or verified"
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


# =============================================================================
# PHASE 4 — NASUS RESEARCH ANALYST CLASS + RUNNABLE DEMO
# =============================================================================


class NasusResearchAnalyst:
    """
    Drop-in sub-agent for the Nasus orchestration layer.

    Usage:
        analyst = NasusResearchAnalyst()
        result  = analyst.research("What are the health effects of ultra-processed foods?")
        refined = analyst.refine("Go deeper on cardiovascular outcomes", result)

    Both methods return a validated AnalysisResult object.
    Serialise with: result.model_dump(mode="json")
    """

    DEPTH_THRESHOLDS = {"surface": (1, 3), "standard": (4, 7), "deep": (8, 999)}

    def __init__(self, max_refinements: int = 5):
        self.max_refinements = max_refinements
        self._session_state: Dict[str, Any] = {
            "last_report": None,
            "citation_registry": {},
            "refinement_round": 0,
            "query_history": [],
            "diff_log": [],
        }

    # ------------------------------------------------------------------
    # PUBLIC: research()
    # ------------------------------------------------------------------
    def research(
        self,
        query: str,
        depth: str = "standard",
        mock_sources: Optional[List[Dict[str, Any]]] = None,
    ) -> AnalysisResult:
        """
        Run a full 6-phase research loop on the given query.

        Parameters
        ----------
        query        : Natural-language research question.
        depth        : "surface" | "standard" | "deep"
        mock_sources : Optional list of pre-loaded source dicts (for testing /
                       offline use). Each dict must contain keys: url, title,
                       author, date, excerpt, credibility_score, relevance_score,
                       domain_type.

        Returns
        -------
        AnalysisResult (validated Pydantic model)
        """
        self._session_state["query_history"].append(query)
        self._session_state["refinement_round"] = 0
        self._session_state["citation_registry"] = {}

        phases_run = ["SEARCH", "READ", "EXTRACT", "SYNTHESIZE", "CITE", "EXPORT"]
        sources = mock_sources or []
        citations = self._build_citations(sources)
        report = self._synthesize_report(query, citations, round_=0)
        meta = self._build_meta(query, depth, citations, phases_run, sources)
        source_list = self._rank_sources(citations)

        result = AnalysisResult(
            report=report, citations=citations, source_list=source_list, meta=meta
        )
        self._session_state["last_report"] = result
        return result

    # ------------------------------------------------------------------
    # PUBLIC: refine()
    # ------------------------------------------------------------------
    def refine(
        self,
        follow_up: str,
        previous_result: Optional[AnalysisResult] = None,
        additional_sources: Optional[List[Dict[str, Any]]] = None,
    ) -> AnalysisResult:
        """
        Iteratively refine a previous research result.

        Parameters
        ----------
        follow_up          : Follow-up instruction or question from the user.
        previous_result    : AnalysisResult to refine (defaults to session last).
        additional_sources : New source dicts to merge into the registry.

        Returns
        -------
        Updated AnalysisResult with incremented refinement_round.

        Raises
        ------
        RuntimeError if iteration_limit (default 5) is exceeded.
        """
        state = self._session_state
        base = previous_result or state.get("last_report")
        round_ = state["refinement_round"] + 1

        if round_ > self.max_refinements:
            raise RuntimeError(REFINE_PATTERN["iteration_limit_message"])

        if base is None:
            raise ValueError("No previous result to refine. Call research() first.")

        trigger = self._detect_trigger(follow_up)
        phases = REFINE_PATTERN["partial_rerun_rules"].get(trigger, ["EXPORT"])

        state["query_history"].append(follow_up)
        state["refinement_round"] = round_

        # Merge any new sources into the existing citation registry
        existing_citations = list(base.citations)
        if additional_sources and "SEARCH" in phases:
            new_citations = self._build_citations(
                additional_sources,
                start_index=len(existing_citations) + 1,
            )
            existing_citations.extend(new_citations)

        # Re-synthesize report incorporating follow-up context
        query = state["query_history"][0]
        report = self._synthesize_report(
            query, existing_citations, round_=round_, follow_up=follow_up
        )

        # Update meta
        meta = ReportMeta(
            query=query,
            depth_level=base.meta.depth_level,
            overall_confidence=base.meta.overall_confidence,
            export_formats=base.meta.export_formats,
            source_count=len(existing_citations),
            failed_sources=base.meta.failed_sources,
            errors=base.meta.errors,
            phases_executed=phases,
        )

        source_list = self._rank_sources(existing_citations)
        result = AnalysisResult(
            report=report,
            citations=existing_citations,
            source_list=source_list,
            meta=meta,
        )

        # Log diff
        state["diff_log"].append(
            {
                "round": round_,
                "trigger": trigger,
                "phases": phases,
                "follow_up": follow_up,
            }
        )
        state["last_report"] = result
        return result

    # ------------------------------------------------------------------
    # INTERNAL HELPERS
    # ------------------------------------------------------------------
    def _detect_trigger(self, message: str) -> str:
        msg_lower = message.lower()
        for trigger, phrases in REFINE_PATTERN["triggers"].items():
            if any(p in msg_lower for p in phrases):
                return trigger
        return "deeper"  # safe default: full re-run

    def _build_citations(
        self,
        sources: List[Dict[str, Any]],
        start_index: int = 1,
    ) -> List[Citation]:
        citations = []
        for i, src in enumerate(sources, start=start_index):
            cid = f"C{i}"
            c = Citation(
                id=cid,
                url=src.get("url", "https://unknown.example.com"),
                title=src.get("title", "Untitled Source"),
                author=src.get("author"),
                date=src.get("date"),
                excerpt=src.get("excerpt", ""),
                credibility_score=float(src.get("credibility_score", 5.0)),
                relevance_score=float(src.get("relevance_score", 0.5)),
                confidence=float(src.get("confidence", 0.7)),
                domain_type=src.get("domain_type", "unknown"),
                verified=src.get("verified", True),
            )
            citations.append(c)
            self._session_state["citation_registry"][cid] = c
        return citations

    def _synthesize_report(
        self,
        query: str,
        citations: List[Citation],
        round_: int = 0,
        follow_up: Optional[str] = None,
    ) -> ResearchReport:
        """
        Build a ResearchReport from available citations.
        In a live agent this calls the LLM; here we produce a structured
        placeholder that validates correctly against the schema.
        """
        cite_tags = (
            " ".join(f"[{c.id}]" for c in citations) if citations else "[no citations]"
        )
        conf = (
            sum(c.confidence for c in citations) / len(citations) if citations else 0.4
        )
        conf = round(min(conf, 0.85), 2)

        follow_up_note = f" Refinement focus: {follow_up}." if follow_up else ""

        sections = [
            ReportSection(
                heading="Background & Context",
                body=(
                    f"This section provides foundational context for the query: "
                    f"*{query}*.{follow_up_note} "
                    f"Key sources consulted: {cite_tags}."
                ),
                citation_ids=[c.id for c in citations],
                confidence=conf,
            ),
            ReportSection(
                heading="Key Findings",
                body=(
                    f"Synthesis of primary evidence across {len(citations)} source(s). "
                    f"Consensus view supported by {cite_tags}. "
                    f"Confidence: {conf:.2f}."
                ),
                citation_ids=[c.id for c in citations],
                confidence=conf,
            ),
            ReportSection(
                heading="Conflicting Evidence & Knowledge Gaps",
                body=(
                    "No direct contradictions detected in current source set. "
                    "Further research recommended for corroboration."
                ),
                citation_ids=[],
                confidence=max(conf - 0.1, 0.1),
            ),
        ]

        return ResearchReport(
            title=f"Research Report: {query[:80]}",
            executive_summary=(
                f"This report synthesises {len(citations)} source(s) on the topic: "
                f"'{query}'. "
                f"Overall confidence: {conf:.0%}. "
                f"See sections below for detailed findings and citations."
            ),
            sections=sections,
            conclusion=(
                f"Based on {len(citations)} source(s), the evidence {cite_tags} "
                f"supports the findings outlined above with {conf:.0%} confidence. "
                f"Further investigation is recommended to close identified knowledge gaps."
            ),
            refinement_round=round_,
        )

    def _build_meta(
        self,
        query: str,
        depth: str,
        citations: List[Citation],
        phases: List[str],
        sources: List[Dict[str, Any]],
    ) -> ReportMeta:
        n = len(citations)
        if n <= 3:
            depth_level = "surface"
        elif n <= 7:
            depth_level = "standard"
        else:
            depth_level = "deep"

        overall_conf = sum(c.confidence for c in citations) / n if n else 0.4
        overall_conf = round(min(overall_conf, 0.85), 2)

        return ReportMeta(
            query=query,
            depth_level=depth_level,
            overall_confidence=overall_conf,
            source_count=n,
            phases_executed=phases,
        )

    def _rank_sources(self, citations: List[Citation]) -> List[SourceEntry]:
        entries = [
            SourceEntry(
                citation_id=c.id,
                title=c.title,
                url=c.url,
                credibility_score=c.credibility_score,
                relevance_score=c.relevance_score,
                domain_type=c.domain_type,
                verified=c.verified,
            )
            for c in citations
        ]
        return sorted(entries, key=lambda e: e.relevance_score, reverse=True)


# =============================================================================
# RUNNABLE DEMO — synthetic research task
# =============================================================================


def _run_demo() -> None:
    print("=" * 70)
    print("NASUS RESEARCH ANALYST — v1.0  |  Demo Run")
    print("=" * 70)

    MOCK_SOURCES = [
        {
            "url": "https://www.nejm.org/doi/full/10.1056/NEJMoa1900644",
            "title": "Association Between Ultra-Processed Food Consumption and Risk of Mortality",
            "author": "Rico-Campa et al.",
            "date": "2019-05-29",
            "excerpt": "Higher ultra-processed food consumption was associated with an increased risk of all-cause mortality.",
            "credibility_score": 9.5,
            "relevance_score": 0.97,
            "confidence": 0.92,
            "domain_type": "academic",
            "verified": True,
        },
        {
            "url": "https://www.bmj.com/content/360/bmj.k322",
            "title": "Consumption of ultra-processed foods and cancer risk",
            "author": "Fiolet et al.",
            "date": "2018-02-14",
            "excerpt": "A 10% increase in the proportion of ultra-processed foods in the diet was associated with a significant increase of greater than 10% in risks of overall and breast cancer.",
            "credibility_score": 9.2,
            "relevance_score": 0.91,
            "confidence": 0.88,
            "domain_type": "academic",
            "verified": True,
        },
        {
            "url": "https://www.thelancet.com/journals/landig/article/PIIS2589-7500(21)00142-8",
            "title": "Ultra-processed foods and the nutrition transition",
            "author": "Monteiro et al.",
            "date": "2021-09-01",
            "excerpt": "Ultra-processed foods now account for more than half of total energy intake in several high-income countries.",
            "credibility_score": 9.0,
            "relevance_score": 0.88,
            "confidence": 0.85,
            "domain_type": "academic",
            "verified": True,
        },
        {
            "url": "https://www.who.int/news/item/01-01-2024-ultra-processed-foods",
            "title": "WHO guidance on ultra-processed food consumption",
            "author": "World Health Organization",
            "date": "2024-01-01",
            "excerpt": "The WHO recommends limiting consumption of ultra-processed foods as part of healthy dietary guidelines.",
            "credibility_score": 8.8,
            "relevance_score": 0.85,
            "confidence": 0.83,
            "domain_type": "government",
            "verified": True,
        },
        {
            "url": "https://www.reuters.com/health/ultra-processed-foods-heart-disease-2023-05-10/",
            "title": "Ultra-processed foods linked to higher heart disease risk, study finds",
            "author": "Reuters Health",
            "date": "2023-05-10",
            "excerpt": "A large cohort study found that people who ate the most ultra-processed foods had a 9% higher risk of cardiovascular disease.",
            "credibility_score": 6.5,
            "relevance_score": 0.79,
            "confidence": 0.74,
            "domain_type": "news",
            "verified": True,
        },
    ]

    analyst = NasusResearchAnalyst()

    # --- ROUND 0: initial research ---
    print("\n[RESEARCH] Query: What are the health effects of ultra-processed foods?\n")
    result = analyst.research(
        query="What are the health effects of ultra-processed foods?",
        mock_sources=MOCK_SOURCES,
    )

    print(f"  Report title     : {result.report.title}")
    print(f"  Executive summary: {result.report.executive_summary}")
    print(f"  Sections         : {len(result.report.sections)}")
    for s in result.report.sections:
        print(f"    [{s.confidence_badge}] {s.heading}")
    print(f"  Citations        : {len(result.citations)}")
    for c in result.citations:
        print(
            f"    {c.id} | {c.credibility_score:.1f} cred | {c.author or 'N/A'} | {c.title[:55]}"
        )
    print(f"  Depth level      : {result.meta.depth_level}")
    print(
        f"  Overall conf     : {result.meta.overall_confidence:.2f} [{result.meta.confidence_badge}]"
    )
    print(f"  Export formats   : {result.meta.export_formats}")
    print(f"  Generated at     : {result.meta.generated_at}")

    # --- ROUND 1: refinement ---
    print("\n[REFINE] Follow-up: Go deeper on cardiovascular outcomes\n")
    refined = analyst.refine(
        follow_up="Go deeper on cardiovascular outcomes",
        previous_result=result,
        additional_sources=[
            {
                "url": "https://www.jacc.org/doi/10.1016/j.jacc.2021.01.047",
                "title": "Cardiovascular Disease Risk and Ultra-Processed Food Intake",
                "author": "Srour et al.",
                "date": "2021-03-15",
                "excerpt": "Each 10% increment in ultra-processed food consumption was associated with a 12% higher risk of cardiovascular disease events.",
                "credibility_score": 9.1,
                "relevance_score": 0.96,
                "confidence": 0.91,
                "domain_type": "academic",
                "verified": True,
            }
        ],
    )

    print(f"  Refinement round : {refined.report.refinement_round}")
    print(f"  Total citations  : {len(refined.citations)}")
    print(f"  Phases executed  : {refined.meta.phases_executed}")
    print(f"  Diff log entry   : {analyst._session_state['diff_log'][-1]}")

    # --- JSON export validation ---
    print("\n[EXPORT] Validating JSON serialisation...\n")
    output_json = json.dumps(
        refined.model_dump(mode="json"), indent=2, ensure_ascii=False
    )
    parsed_back = json.loads(output_json)
    assert "report" in parsed_back
    assert "citations" in parsed_back
    assert "source_list" in parsed_back
    assert "meta" in parsed_back
    print(f"  JSON keys present: {list(parsed_back.keys())}")
    print(f"  JSON byte size   : {len(output_json.encode())} bytes")

    # --- Save to file ---
    out_dir = Path(__file__).parent
    out_file = out_dir / "nasus_demo_output.json"
    out_file.write_text(output_json, encoding="utf-8")
    print(f"\n  Demo output saved -> {out_file}")

    print("\n" + "=" * 70)
    print("DEMO COMPLETE — all schema validations passed.")
    print("=" * 70)


if __name__ == "__main__":
    _run_demo()
