"""
NASUS RESEARCH ANALYST -- RUNTIME MODULE
Version: 1.0 | Module: M01 | Stack: Nasus Sub-Agent Network

Entry point : route_envelope(envelope: NasusEnvelope) -> NasusEnvelope
Capabilities: web research, competitive intel, trend scanning, source retrieval

Pipeline
--------
  1. route_envelope() receives a NasusEnvelope with payload = ResearchRequest | dict
  2. classify_query()   -- detects query type, complexity, recommended depth
  3. search()           -- simulates multi-source retrieval with realistic stubs
  4. synthesize()       -- produces a structured narrative summary
  5. research()         -- orchestrates 2-4, returns ResearchResult | ResearchError
  6. route_envelope()   -- wraps result into envelope, marks DONE or FAILED
"""

from __future__ import annotations

import json
import sys
import os
from datetime import datetime, timezone
from typing import List, Union

# ---------------------------------------------------------------------------
# Registry imports (exact, as required by spec)
# ---------------------------------------------------------------------------
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus

# ---------------------------------------------------------------------------
# Local schema imports
# ---------------------------------------------------------------------------
from nasus_research_analyst_schema import (
    ResearchDepth,
    SourceType,
    ResearchStatus,
    ConfidenceLevel,
    QueryCategory,
    ResearchRequest,
    ResearchFinding,
    ResearchResult,
    ResearchError,
    QueryClassification,
    validate_research_output,
)

# ---------------------------------------------------------------------------
# Module identity
# ---------------------------------------------------------------------------
MODULE_ID   = "M01"
MODULE_NAME = "Research Analyst"
CAPABILITIES = ["web research", "competitive intel", "trend scanning", "source retrieval"]


# ---------------------------------------------------------------------------
# STEP 1 -- Query Classification
# ---------------------------------------------------------------------------

# Keyword maps for query categorisation
_MARKET_KEYS     = {"market", "industry", "segment", "tam", "valuation", "funding",
                    "revenue", "growth", "size", "adoption", "demand"}
_COMPETITOR_KEYS = {"competitor", "competitors", "vs", "versus", "alternative",
                    "alternatives", "compare", "comparison", "rival", "landscape"}
_TECHNICAL_KEYS  = {"how", "implement", "architecture", "api", "library", "framework",
                    "protocol", "algorithm", "stack", "sdk", "code", "integration"}
_TREND_KEYS      = {"trend", "trends", "emerging", "future", "2024", "2025", "2026",
                    "next", "upcoming", "new", "latest", "recent", "evolution"}


def classify_query(request: ResearchRequest) -> QueryClassification:
    """
    Analyses the query string to determine:
    - category   : market / competitor / technical / trend / general
    - complexity : low / medium / high
    - suggested_depth  : ResearchDepth override recommendation
    - inferred_sources : best source types for this category

    Does NOT mutate the request -- caller decides whether to apply overrides.
    """
    tokens = set(request.query.lower().split())
    word_count = len(request.query.split())

    # Category detection via keyword overlap (highest score wins)
    scores = {
        QueryCategory.MARKET:     len(tokens & _MARKET_KEYS),
        QueryCategory.COMPETITOR: len(tokens & _COMPETITOR_KEYS),
        QueryCategory.TECHNICAL:  len(tokens & _TECHNICAL_KEYS),
        QueryCategory.TREND:      len(tokens & _TREND_KEYS),
        QueryCategory.GENERAL:    0,
    }
    # Default to GENERAL if no signal
    best = max(scores, key=lambda k: scores[k])
    if scores[best] == 0:
        best = QueryCategory.GENERAL

    # Complexity: driven by word count and clause density
    if word_count <= 5:
        complexity = "low"
    elif word_count <= 15:
        complexity = "medium"
    else:
        complexity = "high"

    # Suggested depth based on category + complexity
    depth_map = {
        (QueryCategory.GENERAL,    "low"):    ResearchDepth.SURFACE,
        (QueryCategory.GENERAL,    "medium"): ResearchDepth.STANDARD,
        (QueryCategory.GENERAL,    "high"):   ResearchDepth.STANDARD,
        (QueryCategory.MARKET,     "low"):    ResearchDepth.STANDARD,
        (QueryCategory.MARKET,     "medium"): ResearchDepth.DEEP,
        (QueryCategory.MARKET,     "high"):   ResearchDepth.DEEP,
        (QueryCategory.COMPETITOR, "low"):    ResearchDepth.STANDARD,
        (QueryCategory.COMPETITOR, "medium"): ResearchDepth.DEEP,
        (QueryCategory.COMPETITOR, "high"):   ResearchDepth.EXHAUSTIVE,
        (QueryCategory.TECHNICAL,  "low"):    ResearchDepth.SURFACE,
        (QueryCategory.TECHNICAL,  "medium"): ResearchDepth.STANDARD,
        (QueryCategory.TECHNICAL,  "high"):   ResearchDepth.DEEP,
        (QueryCategory.TREND,      "low"):    ResearchDepth.STANDARD,
        (QueryCategory.TREND,      "medium"): ResearchDepth.DEEP,
        (QueryCategory.TREND,      "high"):   ResearchDepth.DEEP,
    }
    suggested_depth = depth_map.get((best, complexity), ResearchDepth.STANDARD)

    # Source recommendations per category
    source_map = {
        QueryCategory.MARKET:     [SourceType.WEB, SourceType.NEWS, SourceType.ACADEMIC],
        QueryCategory.COMPETITOR: [SourceType.WEB, SourceType.NEWS, SourceType.SOCIAL],
        QueryCategory.TECHNICAL:  [SourceType.WEB, SourceType.ACADEMIC, SourceType.API],
        QueryCategory.TREND:      [SourceType.NEWS, SourceType.SOCIAL, SourceType.WEB],
        QueryCategory.GENERAL:    [SourceType.WEB, SourceType.NEWS],
    }
    inferred_sources = source_map.get(best, [SourceType.WEB, SourceType.NEWS])

    notes = (
        f"Detected category={best.value}, complexity={complexity}. "
        f"Keyword hits: { {k.value: v for k, v in scores.items() if v > 0} }."
    )

    return QueryClassification(
        category         = best,
        complexity       = complexity,
        suggested_depth  = suggested_depth,
        inferred_sources = inferred_sources,
        notes            = notes,
    )


# ---------------------------------------------------------------------------
# STEP 2 -- Multi-Source Retrieval (stub)
# ---------------------------------------------------------------------------

# Source pool: realistic stub entries used to populate findings
_STUB_POOL = [
    {
        "domain": "techcrunch.com",
        "source_type": SourceType.NEWS,
        "title_template": "Analysis: {query} -- Industry Breakdown 2025",
        "excerpt_template": (
            "Recent coverage on {query} shows accelerating adoption across enterprise segments. "
            "Analysts point to a compound annual growth rate exceeding 18% through 2027, "
            "driven by infrastructure spend and AI-native tooling."
        ),
        "relevance": 0.91,
    },
    {
        "domain": "reuters.com",
        "source_type": SourceType.NEWS,
        "title_template": "{query}: Market Update and Key Players",
        "excerpt_template": (
            "A Reuters survey of 200 enterprise buyers found that {query} ranks in the "
            "top-3 strategic priorities for 2025. Budget allocation has increased 34% YoY "
            "as vendors compete on integration depth and compliance posture."
        ),
        "relevance": 0.87,
    },
    {
        "domain": "arxiv.org",
        "source_type": SourceType.ACADEMIC,
        "title_template": "A Survey of {query} Methods and Benchmarks (2024)",
        "excerpt_template": (
            "This paper surveys 143 peer-reviewed works on {query} published between "
            "2021-2024. The dominant approaches leverage transformer-based architectures "
            "with retrieval-augmented generation, achieving state-of-the-art on 7 of 9 benchmarks."
        ),
        "relevance": 0.84,
    },
    {
        "domain": "hbr.org",
        "source_type": SourceType.WEB,
        "title_template": "Why {query} Is Reshaping Competitive Strategy",
        "excerpt_template": (
            "Harvard Business Review examines how leading firms are embedding {query} into "
            "core operating models. Early movers report 2-3x improvements in cycle time "
            "and measurable gains in customer retention within 18 months of deployment."
        ),
        "relevance": 0.88,
    },
    {
        "domain": "mckinsey.com",
        "source_type": SourceType.WEB,
        "title_template": "The State of {query}: McKinsey Global Survey",
        "excerpt_template": (
            "McKinsey's global survey of 1,200 executives reveals that {query} has moved "
            "from pilot to production in 61% of Fortune 500 companies. The primary barrier "
            "remains talent: 74% of respondents cite skills gaps as the top inhibitor."
        ),
        "relevance": 0.93,
    },
    {
        "domain": "venturebeat.com",
        "source_type": SourceType.NEWS,
        "title_template": "{query} Startups Raised $4.2B in 2024 -- VentureBeat Tracker",
        "excerpt_template": (
            "Venture funding for {query} startups reached $4.2 billion across 312 deals in 2024, "
            "a 61% increase over 2023. Seed and Series A rounds dominate, suggesting the "
            "market is still early-stage with significant consolidation expected."
        ),
        "relevance": 0.82,
    },
    {
        "domain": "gartner.com",
        "source_type": SourceType.WEB,
        "title_template": "Gartner Hype Cycle: {query} Positioned in Early Majority",
        "excerpt_template": (
            "Gartner positions {query} on the Slope of Enlightenment in its 2025 Hype Cycle, "
            "indicating mainstream adoption within 2-5 years. Key risks include vendor lock-in, "
            "regulatory ambiguity, and integration complexity with legacy systems."
        ),
        "relevance": 0.90,
    },
    {
        "domain": "reddit.com",
        "source_type": SourceType.SOCIAL,
        "title_template": "r/technology: Real-world {query} experiences -- megathread",
        "excerpt_template": (
            "Practitioners on Reddit share hands-on experience with {query}. Common themes: "
            "faster prototyping (upvoted 847x), hidden operational costs (upvoted 612x), "
            "and difficulty integrating with existing data pipelines (upvoted 503x)."
        ),
        "relevance": 0.72,
    },
    {
        "domain": "nature.com",
        "source_type": SourceType.ACADEMIC,
        "title_template": "Empirical evaluation of {query} across multi-domain settings",
        "excerpt_template": (
            "Nature publishes a controlled study comparing {query} approaches across "
            "healthcare, finance, and logistics. Results show domain-specific tuning "
            "improves accuracy by 22-41% versus general-purpose baselines (p < 0.001)."
        ),
        "relevance": 0.85,
    },
    {
        "domain": "bloomberg.com",
        "source_type": SourceType.NEWS,
        "title_template": "Bloomberg Intelligence: {query} -- Q1 2025 Sector Report",
        "excerpt_template": (
            "Bloomberg Intelligence forecasts the {query} market to reach $89B by 2028. "
            "Top-quartile performers are distinguished by data flywheel effects and "
            "proprietary model training pipelines rather than base model selection."
        ),
        "relevance": 0.89,
    },
    {
        "domain": "wired.com",
        "source_type": SourceType.NEWS,
        "title_template": "Inside the Race to Dominate {query}",
        "excerpt_template": (
            "WIRED profiles the six companies leading the {query} space, "
            "examining their technical differentiation, go-to-market strategies, and "
            "the regulatory challenges shaping the next phase of competition."
        ),
        "relevance": 0.80,
    },
    {
        "domain": "github.com",
        "source_type": SourceType.API,
        "title_template": "awesome-{query}: curated open-source resources",
        "excerpt_template": (
            "The awesome-list for {query} on GitHub has 12,400 stars and covers "
            "frameworks, datasets, evaluation harnesses, and production deployment guides. "
            "Most-starred repos focus on retrieval, evaluation, and observability tooling."
        ),
        "relevance": 0.77,
    },
]

# Depth -> source count mapping
_DEPTH_SOURCE_COUNT = {
    ResearchDepth.SURFACE:    3,
    ResearchDepth.STANDARD:   10,
    ResearchDepth.DEEP:       25,
    ResearchDepth.EXHAUSTIVE: 50,
}


def search(request: ResearchRequest) -> List[ResearchFinding]:
    """
    Simulates multi-source retrieval.

    Uses the stub pool to generate realistic findings keyed to the query.
    Respects request.depth (source count), request.max_sources cap,
    and request.source_types filter.

    In production this would call:
      - web_search() for WEB/NEWS sources
      - academic_search() for ACADEMIC sources
      - social_search() for SOCIAL sources
      - internal_query() for INTERNAL sources
      - api_call() for API sources
    """
    target_count = min(
        _DEPTH_SOURCE_COUNT.get(request.depth, 10),
        request.max_sources,
    )

    # Filter stubs by requested source types
    pool = [
        s for s in _STUB_POOL
        if s["source_type"] in request.source_types
    ]
    # If filter leaves us short, fall back to full pool
    if len(pool) < 3:
        pool = _STUB_POOL

    # Cycle through pool until we have enough findings
    findings: List[ResearchFinding] = []
    ts = datetime.now(timezone.utc).isoformat()
    query_short = request.query[:60]

    for i in range(target_count):
        stub = pool[i % len(pool)]
        url  = f"https://www.{stub['domain']}/research/{query_short.lower().replace(' ', '-')}-{i+1}"
        findings.append(
            ResearchFinding(
                source_url      = url,
                title           = stub["title_template"].format(query=query_short),
                excerpt         = stub["excerpt_template"].format(query=query_short),
                relevance_score = min(1.0, stub["relevance"] + (0.01 * (i % 3))),
                source_type     = stub["source_type"],
                retrieved_at    = ts,
            )
        )

    # Sort by relevance descending
    findings.sort(key=lambda f: f.relevance_score, reverse=True)
    return findings


# ---------------------------------------------------------------------------
# STEP 3 -- Synthesis
# ---------------------------------------------------------------------------

def synthesize(query: str, findings: List[ResearchFinding]) -> str:
    """
    Produces a structured narrative summary from the list of findings.

    Structure
    ---------
    1. Overview paragraph
    2. Key themes (bulleted)
    3. Source notes
    4. Gaps / caveats

    In production this calls the LLM with findings as context and the
    synthesis prompt from nasus_research_analyst_prompt.md.
    """
    if not findings:
        return f"No findings retrieved for query: {query}"

    n   = len(findings)
    avg = sum(f.relevance_score for f in findings) / n
    top = findings[0]

    source_types_seen = list({f.source_type.value for f in findings})
    domains_seen      = []
    try:
        from urllib.parse import urlparse
        domains_seen = list({urlparse(f.source_url).netloc for f in findings})
    except Exception:
        pass

    summary_lines = [
        f"## Research Summary: {query}",
        "",
        f"Analysis synthesized from {n} sources across "
        f"{len(source_types_seen)} source categories "
        f"({', '.join(source_types_seen)}). "
        f"Average source relevance: {avg:.2f}.",
        "",
        "### Key Findings",
    ]

    # Pull top-3 excerpt highlights
    for i, f in enumerate(findings[:3], 1):
        summary_lines.append(f"{i}. [{f.title}]({f.source_url})")
        summary_lines.append(f"   > {f.excerpt[:200].strip()}...")
        summary_lines.append("")

    summary_lines += [
        "### Source Coverage",
        f"- {n} total sources retrieved",
        f"- Domains covered: {', '.join(domains_seen[:5])}{' ...' if len(domains_seen) > 5 else ''}",
        f"- Highest-relevance source: {top.source_url} (score: {top.relevance_score:.2f})",
        "",
        "### Caveats",
        "- Stub retrieval mode: findings are representative placeholders, "
        "not live web content.",
        "- Confidence is calibrated against source count and diversity. "
        "Run with DEEP or EXHAUSTIVE depth for production use.",
    ]

    return "\n".join(summary_lines)


# ---------------------------------------------------------------------------
# STEP 4 -- Confidence Scoring
# ---------------------------------------------------------------------------

def _score_confidence(findings: List[ResearchFinding]) -> ConfidenceLevel:
    """Derives a ConfidenceLevel from source count and type diversity."""
    n = len(findings)
    unique_types = len({f.source_type for f in findings})

    if n >= 15 and unique_types >= 3:
        return ConfidenceLevel.VERIFIED
    elif n >= 10 or (n >= 5 and unique_types >= 2):
        return ConfidenceLevel.HIGH
    elif n >= 3:
        return ConfidenceLevel.MEDIUM
    else:
        return ConfidenceLevel.LOW


# ---------------------------------------------------------------------------
# STEP 5 -- Main Research Orchestrator
# ---------------------------------------------------------------------------

def research(
    request: ResearchRequest,
) -> Union[ResearchResult, ResearchError]:
    """
    Orchestrates the full M01 pipeline:
      classify -> search -> synthesize -> confidence score -> validate

    Returns ResearchResult on success, ResearchError on any failure.
    """
    try:
        # 1. Classify query (advisory -- we log but do not force-override)
        classification = classify_query(request)

        # 2. Retrieve findings
        findings = search(request)

        if not findings:
            return ResearchError(
                query      = request.query,
                error_code = "NO_RESULTS",
                message    = (
                    f"Search returned zero results for query '{request.query}'. "
                    "Try broadening the query or switching source types."
                ),
            )

        # 3. Synthesize
        summary = synthesize(request.query, findings)

        # 4. Confidence
        confidence = _score_confidence(findings)

        # 5. Build result
        result = ResearchResult(
            query         = request.query,
            summary       = summary,
            findings      = findings,
            confidence    = confidence,
            status        = ResearchStatus.DONE,
            total_sources = len(findings),
        )

        # 6. Validate (log issues but do not block delivery)
        issues = validate_research_output(result)
        if issues:
            # Append validation notes to summary for transparency
            result.summary += (
                "\n\n### Validation Notes\n"
                + "\n".join(f"- {issue}" for issue in issues)
            )

        return result

    except Exception as exc:
        return ResearchError(
            query      = getattr(request, "query", "unknown"),
            error_code = "INTERNAL_ERROR",
            message    = f"{type(exc).__name__}: {exc}",
        )


# ---------------------------------------------------------------------------
# ENTRY POINT -- route_envelope
# ---------------------------------------------------------------------------

def route_envelope(envelope: NasusEnvelope) -> NasusEnvelope:
    """
    Standard M01 entry point called by the Nasus Orchestrator.

    Expected envelope.payload:
      - A ResearchRequest instance, OR
      - A dict with at minimum a 'query' key

    Returns the same envelope with:
      - payload replaced by ResearchResult.to_dict() on success
      - status set to NasusStatus.DONE or NasusStatus.FAILED
      - error field populated on failure
    """
    try:
        # Normalise payload to ResearchRequest
        payload = envelope.payload
        if isinstance(payload, dict):
            if "query" not in payload:
                raise ValueError("envelope.payload dict is missing required key 'query'")
            request = ResearchRequest.from_dict(payload)
        elif isinstance(payload, ResearchRequest):
            request = payload
        else:
            raise TypeError(
                f"envelope.payload must be ResearchRequest or dict, "
                f"got {type(payload).__name__}"
            )

        # Run the pipeline
        result = research(request)

        if isinstance(result, ResearchError):
            envelope.payload = result.to_dict()
            envelope.status  = NasusStatus.FAILED
            envelope.error   = f"[{result.error_code}] {result.message}"
        else:
            envelope.payload = result.to_dict()
            envelope.status  = NasusStatus.DONE
            envelope.error   = None

    except Exception as exc:
        envelope.status  = NasusStatus.FAILED
        envelope.error   = f"[ROUTE_ERROR] {type(exc).__name__}: {exc}"
        envelope.payload = {
            "error_code": "ROUTE_ERROR",
            "message":    str(exc),
        }

    return envelope


# ---------------------------------------------------------------------------
# DEMO (run directly)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Minimal stub for NasusEnvelope when running standalone
    try:
        from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus
    except ImportError:
        from dataclasses import dataclass as _dc, field as _f
        from enum import Enum as _E
        class NasusStatus(_E):
            PENDING = "pending"; DONE = "done"; FAILED = "failed"
        class ModuleID(_E):
            M01 = "M01"
        @_dc
        class NasusEnvelope:
            module_id: object
            payload:   object
            status:    object = NasusStatus.PENDING
            error:     object = None

    print("=" * 60)
    print("NASUS M01 RESEARCH ANALYST -- Demo Run")
    print("=" * 60)

    # --- Query 1: Market research ---
    print("\n[Query 1] AI agent market size 2025\n")
    env1 = NasusEnvelope(
        module_id = ModuleID.M01,
        payload   = {
            "query":        "AI agent market size 2025",
            "depth":        "standard",
            "source_types": ["web", "news", "academic"],
            "max_sources":  8,
        },
    )
    env1 = route_envelope(env1)
    print(f"Status   : {env1.status}")
    print(f"Error    : {env1.error}")
    if isinstance(env1.payload, dict) and "summary" in env1.payload:
        print(f"Confidence: {env1.payload.get('confidence')}")
        print(f"Sources   : {env1.payload.get('total_sources')}")
        print(f"\n{env1.payload['summary'][:600]}...")

    print("\n" + "-" * 60)

    # --- Query 2: Competitor landscape ---
    print("\n[Query 2] Competitors of Notion and their design strengths\n")
    env2 = NasusEnvelope(
        module_id = ModuleID.M01,
        payload   = {
            "query":        "Competitors of Notion and their design strengths",
            "depth":        "deep",
            "source_types": ["web", "news", "social"],
            "max_sources":  12,
            "require_citations": True,
        },
    )
    env2 = route_envelope(env2)
    print(f"Status   : {env2.status}")
    print(f"Error    : {env2.error}")
    if isinstance(env2.payload, dict) and "summary" in env2.payload:
        print(f"Confidence: {env2.payload.get('confidence')}")
        print(f"Sources   : {env2.payload.get('total_sources')}")
        print(f"\n{env2.payload['summary'][:600]}...")
        # Validate output
        from nasus_research_analyst_schema import ResearchResult
        result_obj = ResearchResult.from_dict(env2.payload)
        issues = validate_research_output(result_obj)
        print(f"\nValidation issues: {issues if issues else 'none'}")

    print("\n" + "=" * 60)
    print("Demo complete.")
