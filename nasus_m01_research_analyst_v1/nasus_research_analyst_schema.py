"""
NASUS RESEARCH ANALYST -- STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: M01 | Stack: Nasus Sub-Agent Network

Dataclasses covering research requests, findings, results, errors,
confidence scoring, source typing, and full JSON serialization.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Dict, Any
from enum import Enum
from datetime import datetime, timezone
import uuid, json


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class ResearchDepth(str, Enum):
    """Controls how many sources to retrieve and how deeply to synthesize."""
    SURFACE    = "surface"     # 3 sources  -- quick orientation
    STANDARD   = "standard"    # 10 sources -- default for most queries
    DEEP       = "deep"        # 25 sources -- competitive/trend analysis
    EXHAUSTIVE = "exhaustive"  # 50+ sources -- full research sprint


class SourceType(str, Enum):
    """Classification of where a finding was retrieved from."""
    WEB      = "web"
    ACADEMIC = "academic"
    NEWS     = "news"
    SOCIAL   = "social"
    INTERNAL = "internal"
    API      = "api"


class ResearchStatus(str, Enum):
    """Lifecycle state of a research job."""
    PENDING      = "pending"
    SEARCHING    = "searching"
    SYNTHESIZING = "synthesizing"
    DONE         = "done"
    FAILED       = "failed"


class ConfidenceLevel(str, Enum):
    """
    Confidence in the synthesized result.
    LOW     -- fewer than 3 sources or contradictory findings
    MEDIUM  -- 3-9 sources, some gaps remain
    HIGH    -- 10+ consistent sources
    VERIFIED -- cross-checked against at least 2 independent primary sources
    """
    LOW      = "low"
    MEDIUM   = "medium"
    HIGH     = "high"
    VERIFIED = "verified"


class QueryCategory(str, Enum):
    """Internal classification used by classify_query()."""
    MARKET     = "market"
    COMPETITOR = "competitor"
    TECHNICAL  = "technical"
    TREND      = "trend"
    GENERAL    = "general"


# ---------------------------------------------------------------------------
# REQUEST
# ---------------------------------------------------------------------------

@dataclass
class ResearchRequest:
    """
    Input contract for M01 Research Analyst.

    Fields
    ------
    query           : The research question or topic.
    depth           : How exhaustively to search (SURFACE / STANDARD / DEEP / EXHAUSTIVE).
    source_types    : Which source categories to pull from.
    max_sources     : Hard cap on findings returned.
    require_citations : If True, every finding must include a source_url.
    context         : Optional background context passed by Orchestrator.
    """
    query:            str
    depth:            ResearchDepth        = ResearchDepth.STANDARD
    source_types:     List[SourceType]     = field(default_factory=lambda: [SourceType.WEB, SourceType.NEWS])
    max_sources:      int                  = 10
    require_citations: bool                = True
    context:          str                  = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query":            self.query,
            "depth":            self.depth.value,
            "source_types":     [s.value for s in self.source_types],
            "max_sources":      self.max_sources,
            "require_citations": self.require_citations,
            "context":          self.context,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ResearchRequest":
        return cls(
            query            = d["query"],
            depth            = ResearchDepth(d.get("depth", "standard")),
            source_types     = [SourceType(s) for s in d.get("source_types", ["web", "news"])],
            max_sources      = int(d.get("max_sources", 10)),
            require_citations = bool(d.get("require_citations", True)),
            context          = d.get("context", ""),
        )


# ---------------------------------------------------------------------------
# FINDING
# ---------------------------------------------------------------------------

@dataclass
class ResearchFinding:
    """
    A single retrieved piece of evidence.

    Fields
    ------
    source_url      : Canonical URL of the source.
    title           : Page / article title.
    excerpt         : Relevant quoted or paraphrased passage.
    relevance_score : Float 0.0-1.0 indicating fit to the query.
    source_type     : Which SourceType category this came from.
    retrieved_at    : ISO-8601 timestamp of retrieval.
    """
    source_url:      str
    title:           str
    excerpt:         str
    relevance_score: float
    source_type:     SourceType
    retrieved_at:    str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict[str, Any]:
        return {
            "source_url":      self.source_url,
            "title":           self.title,
            "excerpt":         self.excerpt,
            "relevance_score": round(self.relevance_score, 4),
            "source_type":     self.source_type.value,
            "retrieved_at":    self.retrieved_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ResearchFinding":
        return cls(
            source_url      = d["source_url"],
            title           = d["title"],
            excerpt         = d["excerpt"],
            relevance_score = float(d["relevance_score"]),
            source_type     = SourceType(d["source_type"]),
            retrieved_at    = d.get("retrieved_at", datetime.now(timezone.utc).isoformat()),
        )


# ---------------------------------------------------------------------------
# RESULT
# ---------------------------------------------------------------------------

@dataclass
class ResearchResult:
    """
    Full output contract for a completed M01 research job.

    Fields
    ------
    query         : Original query string (echoed back).
    summary       : Synthesized narrative covering the key findings.
    findings      : Ordered list of ResearchFinding objects.
    confidence    : Overall confidence in the synthesis.
    status        : Final ResearchStatus (should be DONE).
    total_sources : Count of findings actually included.
    """
    query:         str
    summary:       str
    findings:      List[ResearchFinding] = field(default_factory=list)
    confidence:    ConfidenceLevel       = ConfidenceLevel.MEDIUM
    status:        ResearchStatus        = ResearchStatus.DONE
    total_sources: int                   = 0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query":         self.query,
            "summary":       self.summary,
            "findings":      [f.to_dict() for f in self.findings],
            "confidence":    self.confidence.value,
            "status":        self.status.value,
            "total_sources": self.total_sources,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ResearchResult":
        return cls(
            query         = d["query"],
            summary       = d["summary"],
            findings      = [ResearchFinding.from_dict(f) for f in d.get("findings", [])],
            confidence    = ConfidenceLevel(d.get("confidence", "medium")),
            status        = ResearchStatus(d.get("status", "done")),
            total_sources = int(d.get("total_sources", 0)),
        )


# ---------------------------------------------------------------------------
# ERROR
# ---------------------------------------------------------------------------

@dataclass
class ResearchError:
    """
    Returned when a research job fails at any stage.

    Fields
    ------
    query      : Original query string.
    error_code : Short machine-readable code (e.g. NO_RESULTS, TIMEOUT).
    message    : Human-readable explanation.
    """
    query:      str
    error_code: str
    message:    str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "query":      self.query,
            "error_code": self.error_code,
            "message":    self.message,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ResearchError":
        return cls(
            query      = d["query"],
            error_code = d["error_code"],
            message    = d["message"],
        )


# ---------------------------------------------------------------------------
# QUERY CLASSIFICATION RESULT
# ---------------------------------------------------------------------------

@dataclass
class QueryClassification:
    """
    Internal object produced by classify_query().
    Not serialized to the envelope -- used only within the runtime.
    """
    category:         QueryCategory
    complexity:       str    # "low" | "medium" | "high"
    suggested_depth:  ResearchDepth
    inferred_sources: List[SourceType]
    notes:            str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "category":         self.category.value,
            "complexity":       self.complexity,
            "suggested_depth":  self.suggested_depth.value,
            "inferred_sources": [s.value for s in self.inferred_sources],
            "notes":            self.notes,
        }


# ---------------------------------------------------------------------------
# VALIDATION
# ---------------------------------------------------------------------------

def validate_research_output(result: Any) -> List[str]:
    """
    Validates a ResearchResult for common quality gaps.
    Returns a list of issue strings. Empty list = clean.

    Checks
    ------
    - Result is a ResearchResult instance
    - Query is non-empty
    - Summary is non-empty
    - At least one finding present
    - All findings have source_url when require_citations is implied
    - Relevance scores are in [0.0, 1.0]
    - total_sources matches len(findings)
    - status is DONE
    - confidence is set
    """
    issues: List[str] = []

    if not isinstance(result, ResearchResult):
        issues.append(f"Expected ResearchResult, got {type(result).__name__}")
        return issues

    if not result.query or not result.query.strip():
        issues.append("query is empty")

    if not result.summary or not result.summary.strip():
        issues.append("summary is empty")

    if not result.findings:
        issues.append("findings list is empty -- no sources retrieved")
    else:
        for i, f in enumerate(result.findings):
            if not f.source_url or not f.source_url.strip():
                issues.append(f"finding[{i}] missing source_url")
            if not f.title or not f.title.strip():
                issues.append(f"finding[{i}] missing title")
            if not f.excerpt or not f.excerpt.strip():
                issues.append(f"finding[{i}] missing excerpt")
            if not (0.0 <= f.relevance_score <= 1.0):
                issues.append(f"finding[{i}] relevance_score {f.relevance_score} out of range [0,1]")

    if result.total_sources != len(result.findings):
        issues.append(
            f"total_sources={result.total_sources} does not match "
            f"len(findings)={len(result.findings)}"
        )

    if result.status != ResearchStatus.DONE:
        issues.append(f"status is '{result.status.value}', expected 'done'")

    # Diversity check: warn if all findings share the same domain
    if len(result.findings) >= 3:
        domains = set()
        for f in result.findings:
            try:
                from urllib.parse import urlparse
                domains.add(urlparse(f.source_url).netloc)
            except Exception:
                pass
        if len(domains) == 1:
            issues.append(
                "RT-02 WARNING: all findings share the same domain -- "
                "source diversity is poor"
            )

    return issues
