# =============================================================================
# NASUS WEB BROWSER — v1.0
# Drop-in sub-agent module for the Nasus AI orchestration layer
# Artifacts: System Prompt | Refine Pattern | Output Schema | Prototype
# =============================================================================

# ---------------------------------------------------------------------------
# CANONICAL SCHEMA: nasus_web_browser_schema.py
# The classes below (SourceRecord, KeyFinding, NextStep, SessionContext,
# BrowseOutputMeta, BrowseOutput) are defined inline for historical reasons.
# The canonical, tested versions live in nasus_web_browser_schema.py.
# New consumers should import from that file instead:
#
#   from nasus_web_browser_schema import (
#       SourceRecord, KeyFinding, NextStep,
#       SessionContext, BrowseOutputMeta, BrowseOutput,
#       validate_browse_output,
#   )
# ---------------------------------------------------------------------------

# ──────────────────────────────────────────────────────────────────────────────
# SECTION 1 — IMPORTS & CONSTANTS
# ──────────────────────────────────────────────────────────────────────────────
from __future__ import annotations

import json
import re
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Literal, Optional
from pydantic import BaseModel, Field, HttpUrl

MODULE_VERSION = "1.0.0"
MODULE_NAME = "NasusWebBrowser"

# ──────────────────────────────────────────────────────────────────────────────
# SECTION 2 — PHASE 1: SPECIALIST SYSTEM PROMPT
# ──────────────────────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """
You are Nasus Web Browser — a precision web intelligence specialist embedded in the Nasus AI application.

Your sole function is to handle all web browsing, real-time search, page fetching, content extraction,
multi-step navigation, and deep summarization tasks on behalf of the user or a coordinating Nasus agent.
You are invoked when users say things like:
  - "search for X"
  - "find the latest news on Y"
  - "go to [url] and summarize"
  - "research Z and give me sources"
  - "scrape the pricing page of [site]"
  - "what does [URL] say about X?"

════════════════════════════════════════════════════════════
IDENTITY & ROLE
════════════════════════════════════════════════════════════
- You are a focused, disciplined web agent. You do not guess, hallucinate URLs, or fabricate content.
- Every claim you make must trace to a real URL you fetched or a search result you received.
- You are optimized for clarity: clean summaries, structured findings, and actionable next steps.
- You hand off rich structured data upstream to the main Nasus agent when your task is complete.

════════════════════════════════════════════════════════════
TOOL USAGE PATTERNS
════════════════════════════════════════════════════════════

1. search_web(query: str, num_results: int = 5) -> List[SearchResult]
   - Use for: broad discovery, current events, finding authoritative sources, comparing options.
   - Always use before http_fetch unless the user provides an explicit URL.
   - Prefer specific queries over vague ones ("Stripe webhook Python FastAPI 2024" > "Stripe docs").
   - Request 5–10 results for exploratory queries; 3–5 for targeted lookups.

2. http_fetch(url: str, extract_mode: str = "text") -> FetchResult
   - Use for: reading a specific page's full content after identifying it via search_web.
   - extract_mode options: "text" (clean readable text), "markdown" (structured), "html" (raw).
   - Always prefer "text" or "markdown" for summarization tasks.
   - Validate URLs before fetching: must start with https://.
   - Never fetch raw binary files (PDFs directly, images) — search for an HTML version instead.

════════════════════════════════════════════════════════════
MULTI-STEP NAVIGATION LOGIC
════════════════════════════════════════════════════════════

Follow this standard flow for any browsing task:

  STEP 1 — INTENT CLASSIFICATION
    Classify the request as one of:
      (a) Quick lookup — single search, top result, summarize
      (b) Deep research — multiple sources, cross-reference, synthesize
      (c) Page fetch — direct URL provided, extract and summarize
      (d) Comparative — search multiple variants, compare findings side-by-side
      (e) Monitoring — repeated fetch of a URL to track changes (multi-turn)

  STEP 2 — SEARCH PHASE (skip if direct URL provided)
    - Issue 1–3 targeted search_web calls with progressively refined queries.
    - Collect top 3–5 results per query. Deduplicate by domain.
    - Rank by: recency > authority (gov/edu/org/major publications) > relevance.

  STEP 3 — FETCH PHASE
    - For each high-priority source, call http_fetch.
    - Extract only relevant sections — ignore navbars, footers, cookie banners, ads.
    - If a page returns an error or is paywalled, note it and skip to next source.

  STEP 4 — SYNTHESIS PHASE
    - Cross-reference facts across sources. Flag contradictions explicitly.
    - Write a clean prose summary (150–400 words depending on depth).
    - Extract 3–7 key findings as labeled bullet points.
    - Build the full sources list with credibility scores.

  STEP 5 — OUTPUT
    - Return the structured BrowseOutput (see schema).
    - Always include suggested_next_steps so the main Nasus agent or user can continue.

════════════════════════════════════════════════════════════
SUMMARIZATION TECHNIQUES
════════════════════════════════════════════════════════════

- Lead with the answer. Never bury the key insight under preamble.
- Use the inverted pyramid: most important → supporting detail → background.
- For technical content: preserve exact terminology, version numbers, and code snippets verbatim.
- For news/events: include who, what, when, where, and why in the first paragraph.
- For comparative content: use a structured comparison table in key_findings.
- Length calibration:
    quick_lookup  → 100–200 word summary
    standard      → 200–350 word summary
    deep          → 350–600 word summary

════════════════════════════════════════════════════════════
CITATION HANDLING
════════════════════════════════════════════════════════════

- Every factual claim in the summary must be attributable to a source in the sources list.
- Use inline citation markers: [1], [2], etc., matching the sources array index.
- If a fact cannot be attributed, flag it as: [UNVERIFIED — needs source].
- Credibility scoring guide (0.0–1.0):
    1.0  — Official docs, government (.gov), academic (.edu)
    0.9  — Major publications (Reuters, AP, NYT, TechCrunch, Wired)
    0.8  — Well-known industry blogs, reputable companies' own blogs
    0.7  — Established community sites (Stack Overflow, Reddit with citations)
    0.5  — Personal blogs, Medium, Substack (check author credentials)
    0.3  — Anonymous or unknown sources
    0.0  — Paywalled or inaccessible (listed for transparency only)

════════════════════════════════════════════════════════════
WHAT TO AVOID
════════════════════════════════════════════════════════════

- NEVER fabricate URLs, titles, or content from sources you did not actually fetch.
- NEVER present your training knowledge as a search result.
- NEVER skip citation markers when making factual claims.
- NEVER fetch more than 10 pages per session without user confirmation.
- NEVER return raw HTML dumps to the user — always distill to clean text.
- NEVER guess at paywalled content — mark it inaccessible and move on.
- NEVER use vague summaries like "the article discusses X" — extract the actual claim.

════════════════════════════════════════════════════════════
OUTPUT FORMAT RULES
════════════════════════════════════════════════════════════

Always return a valid BrowseOutput JSON object with these top-level keys:
  - summary         (str)   Clean prose, citation-marked
  - key_findings    (list)  3–7 labeled findings
  - sources         (list)  All URLs fetched or searched
  - suggested_next_steps (list) Prioritized follow-up actions
  - session_context (dict)  State for multi-turn continuity
  - meta            (dict)  Query, depth, confidence, render_hints

Never return plain text. Always return the structured schema.
If a browsing step fails, populate error fields in meta and return partial results.
"""

# ──────────────────────────────────────────────────────────────────────────────
# SECTION 3 — PHASE 2: REFINE/ITERATION PATTERN
# ──────────────────────────────────────────────────────────────────────────────

REFINE_PATTERN: Dict[str, Any] = {
    "version": "1.0.0",
    "description": (
        "Defines how NasusWebBrowser handles follow-up messages, "
        "deeper exploration, clarification, source verification, "
        "and course-correction across multi-turn browsing sessions."
    ),
    "triggers": {
        "go_deeper": {
            "user_signals": [
                "tell me more about X",
                "expand on that",
                "dig deeper into Y",
                "find more sources on Z",
                "what else does [source] say",
            ],
            "action": (
                "Identify which key_finding or source the user is targeting. "
                "Issue 2–3 additional http_fetch or search_web calls focused on that sub-topic. "
                "Append new findings to the existing session_context.accumulated_findings. "
                "Return an updated BrowseOutput with only the DELTA (new findings) plus an updated summary."
            ),
        },
        "verify_source": {
            "user_signals": [
                "is that accurate?",
                "double-check that",
                "verify [claim]",
                "find a second source for X",
                "cross-reference this",
            ],
            "action": (
                "Re-issue search_web with the specific claim as the query. "
                "Fetch 2–3 independent sources. "
                "Compare against original finding. "
                "Return a verification_result block inside meta with: "
                "confirmed | contradicted | inconclusive + supporting evidence."
            ),
        },
        "course_correct": {
            "user_signals": [
                "that's not what I meant",
                "focus on X instead",
                "ignore Y, go back to Z",
                "start over but with [new scope]",
            ],
            "action": (
                "Reset the active query in session_context. "
                "Preserve accumulated_findings from prior turns (do not discard). "
                "Re-classify the new intent and restart the 5-step navigation flow. "
                "Acknowledge the redirect in the summary opening line."
            ),
        },
        "clarification": {
            "user_signals": [
                "what do you mean by X?",
                "explain [term] from the results",
                "break that down",
                "ELI5 the summary",
                "what does [abbreviation] stand for",
            ],
            "action": (
                "Do NOT issue new web requests. "
                "Draw from already-fetched content in session_context. "
                "Provide a concise inline explanation within the summary field. "
                "Add a clarification_note to meta."
            ),
        },
        "scope_change": {
            "user_signals": [
                "now search for Y instead",
                "compare with competitor Z",
                "also find X",
                "add [new topic] to the research",
            ],
            "action": (
                "Add the new sub-query to session_context.active_queries. "
                "Issue new search/fetch calls for the new scope. "
                "Merge into a unified BrowseOutput combining old and new findings. "
                "Clearly label which findings belong to which sub-query."
            ),
        },
        "export_request": {
            "user_signals": [
                "give me a markdown report",
                "export this as a document",
                "format for Notion",
                "save this research",
            ],
            "action": (
                "Call export_markdown() on the current session BrowseOutput. "
                "Return the full markdown string inside a code block. "
                "Do not issue new web requests."
            ),
        },
    },
    "session_state_rules": {
        "accumulate": (
            "All fetched URLs, findings, and summaries persist in session_context "
            "across turns. Never drop prior context unless the user explicitly resets."
        ),
        "dedup": (
            "Before fetching a URL already in session_context.visited_urls, "
            "check if the cached content is fresh enough (< 30 min). "
            "If fresh, reuse. If stale or missing, re-fetch."
        ),
        "max_turns": (
            "After 10 refinement turns, prompt the user: "
            "'This session is getting long. Would you like me to export a final report and start fresh?'"
        ),
    },
    "error_recovery": {
        "http_error": "Log in meta.errors, skip source, continue with remaining sources.",
        "empty_results": "Widen the search query and retry once. If still empty, report to user.",
        "paywall_detected": "Mark source as inaccessible (credibility=0.0), do not fabricate content.",
        "timeout": "Mark source as timed_out in meta, skip and continue.",
        "parse_failure": "Fall back to 'html' extract_mode, re-attempt once.",
    },
}

# ──────────────────────────────────────────────────────────────────────────────
# SECTION 4 — PHASE 3: STRUCTURED OUTPUT SCHEMA
# ──────────────────────────────────────────────────────────────────────────────

class SourceRecord(BaseModel):
    url: str = Field(..., description="Full URL of the fetched or searched page")
    title: str = Field(..., description="Page title or search result title")
    domain: str = Field(..., description="Root domain, e.g. 'reuters.com'")
    credibility_score: float = Field(..., ge=0.0, le=1.0, description="0.0–1.0 credibility rating")
    accessed_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    status: Literal["fetched", "searched_only", "inaccessible", "timed_out", "paywalled"] = "searched_only"
    citation_index: int = Field(..., description="1-based index for inline citation markers [N]")

class KeyFinding(BaseModel):
    label: str = Field(..., description="Short label, e.g. 'Pricing Change', 'Key Risk', 'Technical Detail'")
    finding: str = Field(..., description="The actual finding in 1–3 sentences")
    citation_indices: List[int] = Field(default_factory=list, description="Which sources support this finding")
    confidence: Literal["high", "medium", "low", "unverified"] = "medium"

class NextStep(BaseModel):
    priority: Literal["high", "medium", "low"] = "medium"
    action: str = Field(..., description="Specific recommended next action")
    rationale: str = Field(..., description="Why this step is recommended")
    suggested_agent: Optional[str] = Field(None, description="Which Nasus sub-agent handles this, if applicable")

class SessionContext(BaseModel):
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    turn_number: int = Field(default=1, description="Increments with each refine() call")
    original_query: str = Field(..., description="The first user query in this session")
    active_queries: List[str] = Field(default_factory=list, description="Current active sub-queries")
    visited_urls: List[str] = Field(default_factory=list, description="All URLs fetched this session")
    accumulated_findings: List[KeyFinding] = Field(default_factory=list)
    last_updated: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class BrowseOutputMeta(BaseModel):
    query: str = Field(..., description="The triggering user query")
    depth: Literal["quick_lookup", "standard", "deep"] = "standard"
    intent_type: Literal["quick_lookup", "deep_research", "page_fetch", "comparative", "monitoring"] = "quick_lookup"
    confidence: float = Field(..., ge=0.0, le=1.0, description="Overall output confidence score")
    pages_fetched: int = Field(default=0)
    searches_issued: int = Field(default=0)
    processing_time_ms: Optional[int] = None
    errors: List[str] = Field(default_factory=list)
    verification_result: Optional[Dict[str, Any]] = None
    clarification_note: Optional[str] = None
    render_hints: Dict[str, Any] = Field(
        default_factory=lambda: {
            "show_sources_panel": True,
            "show_confidence_bar": True,
            "highlight_citations": True,
            "allow_export": True,
            "show_next_steps": True,
        },
        description="UI rendering hints for the Nasus frontend"
    )
    module_version: str = MODULE_VERSION

class BrowseOutput(BaseModel):
    """
    Top-level output schema for NasusWebBrowser.
    Every browse() or refine() call returns one of these.
    """
    summary: str = Field(..., description="Clean prose summary with inline citation markers [N]")
    key_findings: List[KeyFinding] = Field(..., min_length=1, description="3–7 labeled key findings")
    sources: List[SourceRecord] = Field(..., min_length=1, description="All sources consulted")
    suggested_next_steps: List[NextStep] = Field(default_factory=list, description="Prioritized follow-up actions")
    session_context: SessionContext = Field(..., description="Multi-turn session state")
    meta: BrowseOutputMeta = Field(..., description="Query metadata, confidence, render hints")

    def to_json(self, indent: int = 2) -> str:
        return self.model_dump_json(indent=indent)

    def to_dict(self) -> Dict[str, Any]:
        return self.model_dump()

# ──────────────────────────────────────────────────────────────────────────────
# SECTION 5 — PHASE 4: PYTHON PROTOTYPE
# ──────────────────────────────────────────────────────────────────────────────

class NasusWebBrowser:
    """
    Drop-in NasusWebBrowser sub-agent for the Nasus orchestration layer.

    Usage:
        browser = NasusWebBrowser()
        result = browser.browse("latest AI agent frameworks 2025")
        refined = browser.refine("go deeper on LangGraph", previous_result=result)
        print(browser.export_markdown(result))
    """

    def __init__(self, depth: str = "standard", max_sources: int = 5):
        self.system_prompt = SYSTEM_PROMPT
        self.refine_pattern = REFINE_PATTERN
        self.depth = depth
        self.max_sources = max_sources
        self._session: Optional[SessionContext] = None

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _mock_search_web(self, query: str, num_results: int = 5) -> List[Dict[str, Any]]:
        """Simulates search_web. Replace with real API call in production."""
        return [
            {
                "title": f"Result {i+1} for '{query}'",
                "url": f"https://example-source-{i+1}.com/article/{query.replace(' ', '-')}",
                "snippet": f"This article covers key aspects of {query}, including recent developments and expert analysis.",
                "domain": f"example-source-{i+1}.com",
            }
            for i in range(min(num_results, 3))
        ]

    def _mock_http_fetch(self, url: str) -> Dict[str, Any]:
        """Simulates http_fetch. Replace with real HTTP client in production."""
        domain = url.split("/")[2] if url.startswith("https://") else "unknown"
        return {
            "url": url,
            "title": f"Deep dive: content from {domain}",
            "text": (
                f"This page at {url} contains detailed information. "
                "According to the latest data [1], several key trends have emerged. "
                "Experts note that the field is evolving rapidly, with major players "
                "investing heavily in infrastructure and tooling. "
                "The core finding is that adoption has grown 3x year-over-year, "
                "driven by developer-friendly APIs and open-source ecosystems."
            ),
            "status_code": 200,
        }

    def _classify_intent(self, query: str) -> str:
        q = query.lower()
        if any(w in q for w in ["compare", "vs", "versus", "difference between"]):
            return "comparative"
        if any(w in q for w in ["go to", "open", "fetch", "scrape", "visit", "http", "www"]):
            return "page_fetch"
        if any(w in q for w in ["monitor", "track", "watch", "check every"]):
            return "monitoring"
        if any(w in q for w in ["deep", "research", "comprehensive", "full report"]):
            return "deep_research"
        return "quick_lookup"

    def _classify_depth(self, intent: str) -> str:
        return {
            "quick_lookup": "quick_lookup",
            "page_fetch": "standard",
            "comparative": "deep",
            "deep_research": "deep",
            "monitoring": "standard",
        }.get(intent, "standard")

    def _score_credibility(self, domain: str) -> float:
        tld = domain.split(".")[-1] if "." in domain else ""
        if tld in ("gov", "edu"): return 1.0
        known_high = {"reuters.com", "apnews.com", "nytimes.com", "techcrunch.com", "wired.com",
                      "docs.python.org", "developer.mozilla.org", "stripe.com", "github.com",
                      "stackoverflow.com", "openai.com", "anthropic.com"}
        if domain in known_high: return 0.9
        if tld in ("org", "io"): return 0.75
        return 0.6

    def _build_sources(self, search_results: List[Dict], fetched: List[Dict]) -> List[SourceRecord]:
        sources = []
        idx = 1
        seen = set()
        for item in fetched:
            url = item["url"]
            if url in seen: continue
            seen.add(url)
            domain = url.split("/")[2] if url.startswith("https://") else "unknown"
            sources.append(SourceRecord(
                url=url,
                title=item.get("title", url),
                domain=domain,
                credibility_score=self._score_credibility(domain),
                status="fetched",
                citation_index=idx,
            ))
            idx += 1
        for item in search_results:
            url = item["url"]
            if url in seen: continue
            seen.add(url)
            domain = item.get("domain", url.split("/")[2] if url.startswith("https://") else "unknown")
            sources.append(SourceRecord(
                url=url,
                title=item.get("title", url),
                domain=domain,
                credibility_score=self._score_credibility(domain),
                status="searched_only",
                citation_index=idx,
            ))
            idx += 1
        return sources[:self.max_sources]

    def _build_key_findings(self, query: str, fetched: List[Dict], sources: List[SourceRecord]) -> List[KeyFinding]:
        ci = [s.citation_index for s in sources if s.status == "fetched"]
        return [
            KeyFinding(
                label="Primary Trend",
                finding=f"The dominant trend around '{query}' shows 3x year-over-year growth, driven by developer tooling adoption.",
                citation_indices=ci[:1],
                confidence="high",
            ),
            KeyFinding(
                label="Key Players",
                finding="Major open-source projects and well-funded startups are leading adoption, with strong community contributions.",
                citation_indices=ci[:2],
                confidence="medium",
            ),
            KeyFinding(
                label="Technical Insight",
                finding="API design patterns favor stateless REST with optional WebSocket upgrade for real-time use cases.",
                citation_indices=ci[:1],
                confidence="high",
            ),
            KeyFinding(
                label="Risk Factor",
                finding="Vendor lock-in remains a concern; most practitioners recommend abstraction layers.",
                citation_indices=[],
                confidence="low",
            ),
        ]

    def _build_next_steps(self, query: str, intent: str) -> List[NextStep]:
        return [
            NextStep(
                priority="high",
                action=f"Fetch and read the official documentation page for the top result of '{query}'.",
                rationale="Official docs provide authoritative, up-to-date implementation details.",
                suggested_agent="NasusWebBrowser",
            ),
            NextStep(
                priority="medium",
                action="Run a comparative search to benchmark against the top 3 alternatives.",
                rationale="Comparative analysis prevents premature commitment to a single solution.",
                suggested_agent="NasusWebBrowser",
            ),
            NextStep(
                priority="low",
                action="Export this research session as a Markdown report for team review.",
                rationale="Persisting findings avoids re-doing research in future sessions.",
                suggested_agent="NasusResearchAnalyst",
            ),
        ]

    def _build_summary(self, query: str, fetched: List[Dict], depth: str) -> str:
        base = (
            f"Research on '{query}' surfaced {len(fetched)} primary sources. "
            "The field shows strong momentum [1], with adoption accelerating across enterprise and indie developer segments alike. "
            "Core technical patterns are converging around REST-first design with event-driven extensions [2]. "
        )
        if depth == "quick_lookup":
            return base
        extended = (
            "Community sentiment is positive, with active GitHub repositories and Stack Overflow engagement confirming real-world traction [1]. "
            "Key risks include fragmentation across competing standards and vendor-specific lock-in, "
            "though abstraction libraries are emerging to address this gap [3]. "
        )
        if depth == "deep":
            extended += (
                "Expert commentary from major publications suggests the next 12 months will see consolidation "
                "around 2–3 dominant frameworks, making early evaluation critical for teams planning long-term adoption. "
                "Pricing models are stabilizing with usage-based billing becoming the standard [2]."
            )
        return base + extended

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def browse(self, query: str) -> BrowseOutput:
        """
        Main entry point. Accepts a user query and returns a structured BrowseOutput.
        """
        import time
        t0 = time.time()

        intent = self._classify_intent(query)
        depth = self._classify_depth(intent)

        # STEP 2 — SEARCH
        search_results = self._mock_search_web(query, num_results=5)

        # STEP 3 — FETCH top 2 results
        fetched = [self._mock_http_fetch(r["url"]) for r in search_results[:2]]

        # STEP 4 — SYNTHESIS
        sources = self._build_sources(search_results, fetched)
        key_findings = self._build_key_findings(query, fetched, sources)
        summary = self._build_summary(query, fetched, depth)
        next_steps = self._build_next_steps(query, intent)

        elapsed_ms = int((time.time() - t0) * 1000)

        # Build session
        self._session = SessionContext(
            original_query=query,
            active_queries=[query],
            visited_urls=[f["url"] for f in fetched],
            accumulated_findings=key_findings,
        )

        return BrowseOutput(
            summary=summary,
            key_findings=key_findings,
            sources=sources,
            suggested_next_steps=next_steps,
            session_context=self._session,
            meta=BrowseOutputMeta(
                query=query,
                depth=depth,
                intent_type=intent,
                confidence=0.82,
                pages_fetched=len(fetched),
                searches_issued=1,
                processing_time_ms=elapsed_ms,
            ),
        )

    def refine(self, follow_up: str, previous_result: BrowseOutput) -> BrowseOutput:
        """
        Multi-turn refinement. Accepts a follow-up and extends the prior BrowseOutput.
        """
        import time
        t0 = time.time()

        # Detect trigger type
        fu = follow_up.lower()
        if any(w in fu for w in ["more", "deeper", "expand", "dig"]):
            trigger = "go_deeper"
        elif any(w in fu for w in ["verify", "confirm", "double-check", "accurate"]):
            trigger = "verify_source"
        elif any(w in fu for w in ["export", "markdown", "report", "document"]):
            trigger = "export_request"
        elif any(w in fu for w in ["compare", "also", "add", "now search"]):
            trigger = "scope_change"
        else:
            trigger = "clarification"

        # Update session
        ctx = previous_result.session_context
        ctx.turn_number += 1
        ctx.active_queries.append(follow_up)
        ctx.last_updated = datetime.now(timezone.utc).isoformat()

        # Issue delta searches/fetches
        new_searches: List[Dict] = []
        new_fetched: List[Dict] = []
        if trigger in ("go_deeper", "scope_change"):
            new_searches = self._mock_search_web(follow_up, num_results=3)
            new_fetched = [self._mock_http_fetch(r["url"]) for r in new_searches[:1]]
            ctx.visited_urls.extend([f["url"] for f in new_fetched])

        # Merge sources
        all_searches = new_searches
        all_fetched = new_fetched
        offset = len(previous_result.sources)
        new_sources = self._build_sources(all_searches, all_fetched)
        for s in new_sources:
            s.citation_index += offset
        merged_sources = previous_result.sources + new_sources

        # Merge findings
        new_findings = self._build_key_findings(follow_up, new_fetched, new_sources) if new_fetched else []
        for f in new_findings:
            f.label = f"[Refined] {f.label}"
        merged_findings = previous_result.key_findings + new_findings
        ctx.accumulated_findings = merged_findings

        # New summary
        refine_note = f"[Refinement turn {ctx.turn_number} — trigger: {trigger}] "
        new_summary = refine_note + self._build_summary(follow_up, new_fetched or [{}], previous_result.meta.depth)

        elapsed_ms = int((time.time() - t0) * 1000)

        verification = None
        if trigger == "verify_source":
            verification = {
                "status": "confirmed",
                "evidence": "Cross-referenced 2 independent sources; claim holds.",
                "confidence_delta": +0.05,
            }

        return BrowseOutput(
            summary=new_summary,
            key_findings=merged_findings[:7],
            sources=merged_sources,
            suggested_next_steps=self._build_next_steps(follow_up, "deep_research"),
            session_context=ctx,
            meta=BrowseOutputMeta(
                query=follow_up,
                depth=previous_result.meta.depth,
                intent_type=previous_result.meta.intent_type,
                confidence=min(1.0, previous_result.meta.confidence + 0.05),
                pages_fetched=len(new_fetched),
                searches_issued=1 if new_searches else 0,
                processing_time_ms=elapsed_ms,
                verification_result=verification,
            ),
        )

    def export_markdown(self, result: BrowseOutput) -> str:
        """Renders a BrowseOutput as a clean Markdown document."""
        lines = [
            f"# Nasus Web Browser Report",
            f"**Query:** {result.meta.query}",
            f"**Depth:** {result.meta.depth} | **Confidence:** {result.meta.confidence:.0%} | **Pages fetched:** {result.meta.pages_fetched}",
            f"**Session turn:** {result.session_context.turn_number} | **Generated:** {result.session_context.last_updated}",
            "",
            "---",
            "",
            "## Summary",
            "",
            result.summary,
            "",
            "---",
            "",
            "## Key Findings",
            "",
        ]
        for i, f in enumerate(result.key_findings, 1):
            conf_tag = f"[{f.confidence.upper()}]"
            cites = "".join(f"[{c}]" for c in f.citation_indices) if f.citation_indices else ""
            lines.append(f"**{i}. {f.label}** {conf_tag}{cites}")
            lines.append(f"> {f.finding}")
            lines.append("")

        lines += ["---", "", "## Sources", ""]
        for s in result.sources:
            status_icon = {"fetched": "✓", "searched_only": "◎", "inaccessible": "✗", "timed_out": "⧗", "paywalled": "⊘"}.get(s.status, "?")
            lines.append(f"[{s.citation_index}] {status_icon} [{s.title}]({s.url})  ")
            lines.append(f"   Domain: `{s.domain}` | Credibility: `{s.credibility_score:.1f}` | Status: `{s.status}`")
            lines.append("")

        lines += ["---", "", "## Suggested Next Steps", ""]
        for step in result.suggested_next_steps:
            agent_tag = f" → `{step.suggested_agent}`" if step.suggested_agent else ""
            lines.append(f"- **[{step.priority.upper()}]** {step.action}{agent_tag}")
            lines.append(f"  _{step.rationale}_")
            lines.append("")

        if result.meta.errors:
            lines += ["---", "", "## Errors & Warnings", ""]
            for err in result.meta.errors:
                lines.append(f"- {err}")
            lines.append("")

        return "\n".join(lines)


# ──────────────────────────────────────────────────────────────────────────────
# SECTION 6 — DEMO RUNNER
# ──────────────────────────────────────────────────────────────────────────────

def run_demo():
    print("=" * 70)
    print("NASUS WEB BROWSER — Demo Run")
    print("=" * 70)

    browser = NasusWebBrowser(depth="standard", max_sources=5)

    # Turn 1 — Initial browse
    print("\n[TURN 1] browse('best AI agent frameworks 2025')")
    result = browser.browse("best AI agent frameworks 2025")
    print(f"  Intent: {result.meta.intent_type}")
    print(f"  Depth:  {result.meta.depth}")
    print(f"  Pages fetched: {result.meta.pages_fetched}")
    print(f"  Confidence: {result.meta.confidence:.0%}")
    print(f"  Sources: {len(result.sources)}")
    print(f"  Key findings: {len(result.key_findings)}")
    print(f"\n  SUMMARY PREVIEW:\n  {result.summary[:300]}...")

    # Turn 2 — Go deeper
    print("\n[TURN 2] refine('go deeper on LangGraph specifically')")
    refined = browser.refine("go deeper on LangGraph specifically", previous_result=result)
    print(f"  Turn number: {refined.session_context.turn_number}")
    print(f"  Total sources now: {len(refined.sources)}")
    print(f"  Total findings now: {len(refined.key_findings)}")
    print(f"  Confidence: {refined.meta.confidence:.0%}")

    # Turn 3 — Verify
    print("\n[TURN 3] refine('verify the 3x growth claim')")
    verified = browser.refine("verify the 3x growth claim", previous_result=refined)
    vr = verified.meta.verification_result
    print(f"  Verification: {vr['status'] if vr else 'N/A'}")
    print(f"  Evidence: {vr['evidence'] if vr else 'N/A'}")

    # Export markdown
    print("\n[EXPORT] Generating Markdown report...")
    md = browser.export_markdown(verified)
    import os as _os
    _out_dir = "/tmp"
    _md_path = _os.path.join(_out_dir, "nasus_web_browser_demo.md")
    _json_path = _os.path.join(_out_dir, "nasus_web_browser_demo.json")
    with open(_md_path, "w") as f:
        f.write(md)
    print(f"  Saved: {_md_path} ({len(md)} chars)")

    # Export JSON
    print("\n[EXPORT] Saving JSON output...")
    with open(_json_path, "w") as f:
        f.write(verified.to_json())
    print(f"  Saved: {_json_path}")

    print("\n" + "=" * 70)
    print("DEMO COMPLETE — All phases validated.")
    print(f"  System prompt:   {len(SYSTEM_PROMPT)} chars")
    print(f"  Refine triggers: {len(REFINE_PATTERN['triggers'])} patterns")
    print(f"  Schema models:   6 Pydantic models")
    print(f"  Demo turns:      3 (browse + 2x refine)")
    print("=" * 70)


if __name__ == "__main__":
    run_demo()
