"""
NASUS MEMORY MANAGER — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 09 | Stack: Nasus Sub-Agent Network

Dataclasses covering all 4 memory layers, 7 operations, conflict/validation
objects, health scoring, and full JSON serialization.
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

class MemoryLayer(str, Enum):
    SESSION = "session"
    PROJECT = "project"
    ENTITY  = "entity"
    GLOBAL  = "global"
    ALL     = "all"

class OperationType(str, Enum):
    CREATE  = "create"
    UPDATE  = "update"
    APPEND  = "append"
    REPLACE = "replace"

class WriteStatus(str, Enum):
    SUCCESS          = "success"
    CONFLICT         = "conflict"
    VALIDATION_ERROR = "validation_error"
    DUPLICATE        = "duplicate"


@dataclass
class WriteResponse:
    """
    Typed return contract for all M09 write operations. (GAP-05 fix)
    Replaces raw WriteStatus returns with a structured response object.
    """
    write_status: WriteStatus
    record_id:    str
    layer:        MemoryLayer
    created_at:   str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> dict:
        return {
            "write_status": self.write_status.value,
            "record_id":    self.record_id,
            "layer":        self.layer.value,
            "created_at":   self.created_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "WriteResponse":
        return cls(
            write_status = WriteStatus(d["write_status"]),
            record_id    = d["record_id"],
            layer        = MemoryLayer(d["layer"]),
            created_at   = d.get("created_at", datetime.now(timezone.utc).isoformat()),
        )


class EntityType(str, Enum):
    PERSON     = "person"
    COMPANY    = "company"
    PRODUCT    = "product"
    TOOL       = "tool"
    API        = "api"
    COMPETITOR = "competitor"
    CONCEPT    = "concept"

class ArtifactType(str, Enum):
    HTML_PAGE    = "html_page"
    COPY_BLOCK   = "copy_block"
    CRO_SCORECARD = "cro_scorecard"
    BLOG_POST    = "blog_post"
    SOCIAL_POST  = "social_post"
    EMAIL        = "email"
    SEO_METADATA = "seo_metadata"
    PYTHON_FILE  = "python_file"
    SCHEMA       = "schema"
    TEST_SUITE   = "test_suite"
    ZIP_PACKAGE  = "zip_package"
    STRATEGY_DOC = "strategy_doc"
    ROADMAP      = "roadmap"

class QueryType(str, Enum):
    BY_ID      = "by_id"
    BY_NAME    = "by_name"
    BY_TAG     = "by_tag"
    BY_MODULE  = "by_module"
    BY_TYPE    = "by_type"
    SEMANTIC   = "semantic"

class CompressionStrategy(str, Enum):
    SUMMARIZE              = "summarize"
    DEDUPLICATE            = "deduplicate"
    ARCHIVE                = "archive"
    PRUNE_CONFIDENCE_BELOW = "prune_confidence_below"

class ValidationCheck(str, Enum):
    MISSING_FIELDS       = "missing_fields"
    DUPLICATE_IDS        = "duplicate_ids"
    LOW_CONFIDENCE       = "low_confidence"
    STALE_RECORDS        = "stale_records"
    ORPHANED_REFERENCES  = "orphaned_references"
    CONTRADICTIONS       = "contradictions"

class IssueSeverity(str, Enum):
    CRITICAL = "critical"
    WARNING  = "warning"
    INFO     = "info"

class OperationStatus(str, Enum):
    SUCCESS = "success"
    CONFLICT = "conflict"
    ERROR   = "error"
    PARTIAL = "partial"

class RecordStatus(str, Enum):
    ACTIVE   = "active"
    STALE    = "stale"
    EXPIRED  = "expired"
    ARCHIVED = "archived"
    LOCKED   = "locked"


# ---------------------------------------------------------------------------
# PRIMITIVE OBJECTS
# ---------------------------------------------------------------------------

@dataclass
class Fact:
    fact: str
    source_url: Optional[str] = None
    source_module: Optional[str] = None
    confidence: float = 0.8
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "fact": self.fact,
            "source_url": self.source_url,
            "source_module": self.source_module,
            "confidence": self.confidence,
            "created_at": self.created_at,
        }


@dataclass
class Relationship:
    entity_id: str
    rel_type: str           # e.g. "competitor_of", "built_by", "uses_tool"
    direction: str = "outbound"  # outbound | inbound | bidirectional
    confidence: float = 0.8
    noted_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "entity_id": self.entity_id,
            "rel_type": self.rel_type,
            "direction": self.direction,
            "confidence": self.confidence,
            "noted_at": self.noted_at,
        }


@dataclass
class Decision:
    decision_id: str = field(default_factory=lambda: "dec_" + uuid.uuid4().hex[:8])
    decision: str = ""
    rationale: str = ""
    source_module: str = ""
    confidence: float = 0.9
    locked: bool = False
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "decision_id": self.decision_id,
            "decision": self.decision,
            "rationale": self.rationale,
            "source_module": self.source_module,
            "confidence": self.confidence,
            "locked": self.locked,
            "created_at": self.created_at,
            "tags": self.tags,
        }


@dataclass
class RejectedIdea:
    idea_id: str = field(default_factory=lambda: "rej_" + uuid.uuid4().hex[:8])
    idea: str = ""
    reason: str = ""
    rejected_by: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "idea_id": self.idea_id,
            "idea": self.idea,
            "reason": self.reason,
            "rejected_by": self.rejected_by,
            "created_at": self.created_at,
            "tags": self.tags,
        }


@dataclass
class Artifact:
    artifact_id: str = field(default_factory=lambda: "art_" + uuid.uuid4().hex[:8])
    artifact_type: str = ArtifactType.PYTHON_FILE.value
    name: str = ""
    file_path: Optional[str] = None
    source_module: str = ""
    cro_score: Optional[int] = None
    seo_score: Optional[int] = None
    word_count: Optional[int] = None
    language: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    tags: List[str] = field(default_factory=list)
    status: str = RecordStatus.ACTIVE.value

    def to_dict(self) -> Dict:
        return {
            "artifact_id": self.artifact_id,
            "artifact_type": self.artifact_type,
            "name": self.name,
            "file_path": self.file_path,
            "source_module": self.source_module,
            "cro_score": self.cro_score,
            "seo_score": self.seo_score,
            "word_count": self.word_count,
            "language": self.language,
            "created_at": self.created_at,
            "tags": self.tags,
            "status": self.status,
        }


@dataclass
class Constraint:
    constraint_id: str = field(default_factory=lambda: "con_" + uuid.uuid4().hex[:8])
    rule: str = ""
    set_by: str = "user"
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    applies_to: List[str] = field(default_factory=list)  # module slugs or "all"

    def to_dict(self) -> Dict:
        return {
            "constraint_id": self.constraint_id,
            "rule": self.rule,
            "set_by": self.set_by,
            "created_at": self.created_at,
            "applies_to": self.applies_to,
        }


@dataclass
class Pattern:
    pattern_id: str = field(default_factory=lambda: "pat_" + uuid.uuid4().hex[:8])
    description: str = ""
    observed_count: int = 1
    first_seen: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    last_seen: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    modules_involved: List[str] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "pattern_id": self.pattern_id,
            "description": self.description,
            "observed_count": self.observed_count,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "modules_involved": self.modules_involved,
            "tags": self.tags,
        }


@dataclass
class PerformanceRecord:
    module_slug: str = ""
    total_calls: int = 0
    successful_calls: int = 0
    failed_calls: int = 0
    avg_confidence: float = 0.0
    last_called: Optional[str] = None
    common_operations: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return {
            "module_slug": self.module_slug,
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "avg_confidence": self.avg_confidence,
            "last_called": self.last_called,
            "common_operations": self.common_operations,
        }


@dataclass
class NetworkConfig:
    active_modules: List[str] = field(default_factory=list)
    routing_rules: Dict[str, str] = field(default_factory=dict)
    flags: Dict[str, bool] = field(default_factory=dict)
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# MEMORY LAYERS
# ---------------------------------------------------------------------------

@dataclass
class SessionMemory:
    session_id: str = field(default_factory=lambda: "sess_" + uuid.uuid4().hex[:8])
    started_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    active_task: str = ""
    active_modules: List[str] = field(default_factory=list)
    user_instructions: List[str] = field(default_factory=list)
    intermediate_outputs: Dict[str, str] = field(default_factory=dict)
    pending_decisions: List[str] = field(default_factory=list)
    artifacts_created: List[str] = field(default_factory=list)  # artifact_ids
    promoted_to_project: bool = False
    status: str = RecordStatus.ACTIVE.value

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ProjectMemory:
    project_id: str = field(default_factory=lambda: "proj_" + uuid.uuid4().hex[:8])
    project_name: str = ""
    description: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    modules_used: List[str] = field(default_factory=list)
    artifacts: List[Artifact] = field(default_factory=list)
    decisions: List[Decision] = field(default_factory=list)
    rejected_ideas: List[RejectedIdea] = field(default_factory=list)
    open_tasks: List[str] = field(default_factory=list)
    completed_tasks: List[str] = field(default_factory=list)
    linked_entities: List[str] = field(default_factory=list)  # entity_ids
    tags: List[str] = field(default_factory=list)
    status: str = RecordStatus.ACTIVE.value

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["artifacts"] = [a.to_dict() for a in self.artifacts]
        d["decisions"] = [dec.to_dict() for dec in self.decisions]
        d["rejected_ideas"] = [r.to_dict() for r in self.rejected_ideas]
        return d


@dataclass
class EntityMemory:
    entity_id: str = field(default_factory=lambda: "ent_" + uuid.uuid4().hex[:8])
    entity_type: str = EntityType.PRODUCT.value
    name: str = ""
    aliases: List[str] = field(default_factory=list)
    description: str = ""
    known_facts: List[Fact] = field(default_factory=list)
    relationships: List[Relationship] = field(default_factory=list)
    last_referenced: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    source_projects: List[str] = field(default_factory=list)  # project_ids
    confidence_score: float = 0.8
    status: str = RecordStatus.ACTIVE.value

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["known_facts"] = [f.to_dict() for f in self.known_facts]
        d["relationships"] = [r.to_dict() for r in self.relationships]
        return d


@dataclass
class GlobalMemory:
    global_id: str = field(default_factory=lambda: "glob_" + uuid.uuid4().hex[:8])
    user_preferences: Dict[str, Any] = field(default_factory=dict)
    learned_constraints: List[Constraint] = field(default_factory=list)
    module_performance: Dict[str, PerformanceRecord] = field(default_factory=dict)
    recurring_patterns: List[Pattern] = field(default_factory=list)
    vocabulary: Dict[str, str] = field(default_factory=dict)
    network_config: NetworkConfig = field(default_factory=NetworkConfig)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["learned_constraints"] = [c.to_dict() for c in self.learned_constraints]
        d["module_performance"] = {k: v.to_dict() for k, v in self.module_performance.items()}
        d["recurring_patterns"] = [p.to_dict() for p in self.recurring_patterns]
        d["network_config"] = self.network_config.to_dict()
        return d


# ---------------------------------------------------------------------------
# OPERATION INPUTS
# ---------------------------------------------------------------------------

@dataclass
class WriteRequest:
    layer: str
    operation_type: str
    target_id: str          # uuid or "new"
    payload: Dict[str, Any]
    source_module: str
    confidence: float = 0.8
    session_id: Optional[str] = None
    project_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ReadRequest:
    layer: str              # MemoryLayer value or "all"
    query_type: str         # QueryType value
    query_value: str
    scope_filter: Optional[Dict[str, Any]] = None
    limit: int = 10
    include_confidence: bool = True
    session_id: Optional[str] = None
    project_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class QueryRequest:
    query: str
    session_id: Optional[str] = None
    project_id: Optional[str] = None
    scope_layers: List[str] = field(default_factory=lambda: ["session", "project", "entity", "global"])
    limit: int = 10

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class PromoteRequest:
    session_record_id: str
    target_layer: str       # "project" or "global"
    target_project_id: Optional[str] = None
    promote_fields: List[str] = field(default_factory=lambda: ["all"])

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class CompressRequest:
    layer: str
    compression_strategy: str
    threshold: Optional[Any] = None     # date string or float
    record_id: Optional[str] = None
    date_before: Optional[str] = None
    require_user_approval: bool = True

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class DiffRequest:
    scope_layer: str
    from_time: str          # ISO 8601 or session_id
    to_time: str = "now"
    project_id: Optional[str] = None
    entity_id: Optional[str] = None

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ValidateRequest:
    scope: str              # "all" | layer | project_id | entity_id
    checks: List[str] = field(default_factory=lambda: [c.value for c in ValidationCheck])

    def to_dict(self) -> Dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# OPERATION OUTPUTS
# ---------------------------------------------------------------------------

@dataclass
class ChangelogEntry:
    symbol: str     # "+" added, "~" updated, "-" removed, ">" promoted
    description: str
    record_id: Optional[str] = None
    source_module: Optional[str] = None
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def __str__(self) -> str:
        return f"  {self.symbol} {self.description}"

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class MemoryHealth:
    session_records: int = 0
    project_records: int = 0
    entity_records: int = 0
    global_records: int = 0
    conflicts_pending: int = 0
    stale_records: int = 0
    health_score: int = 100

    def compute_score(self) -> int:
        score = 100
        score -= min(self.conflicts_pending * 5, 20)
        score -= min(self.stale_records * 2, 15)
        return max(score, 0)

    def label(self) -> str:
        s = self.health_score
        if s >= 90: return "Healthy"
        if s >= 75: return "Good"
        if s >= 60: return "Fair"
        return "Degraded"

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ConflictDetail:
    conflict_id: str = field(default_factory=lambda: "cfl_" + uuid.uuid4().hex[:8])
    field_name: str = ""
    existing_value: Any = None
    new_value: Any = None
    existing_source: str = ""
    new_source: str = ""
    existing_confidence: float = 0.0
    new_confidence: float = 0.0
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    resolved: bool = False

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class WriteResponse:
    operation: str = "OP-1 WRITE"
    status: str = WriteStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    record_id: Optional[str] = None
    conflict_details: List[ConflictDetail] = field(default_factory=list)
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def render(self) -> str:
        lines = [
            f"OPERATION: {self.operation}",
            f"STATUS: {self.status}",
            f"TIMESTAMP: {self.timestamp}",
            "---",
            f"Record ID: {self.record_id}",
        ]
        if self.conflict_details:
            lines.append("CONFLICTS:")
            for c in self.conflict_details:
                lines.append(f"  ! {c.field_name}: existing={c.existing_value} vs new={c.new_value}")
        lines += [
            "---",
            "MEMORY HEALTH:",
            f"  Session records: {self.memory_health.session_records}",
            f"  Project records: {self.memory_health.project_records}",
            f"  Entity records:  {self.memory_health.entity_records}",
            f"  Global records:  {self.memory_health.global_records}",
            f"  Conflicts pending: {self.memory_health.conflicts_pending}",
            f"  Stale records: {self.memory_health.stale_records}",
            f"  Health score: {self.memory_health.health_score} ({self.memory_health.label()})",
            "---",
            "CHANGELOG (this operation):",
        ]
        for entry in self.changelog:
            lines.append(str(entry))
        if self.next_recommended_op:
            lines += ["---", f"NEXT RECOMMENDED OP: {self.next_recommended_op}"]
        return "\n".join(lines)

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "record_id": self.record_id,
            "conflict_details": [c.to_dict() for c in self.conflict_details],
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


@dataclass
class SearchMetadata:
    query_time_ms: int = 0
    layers_searched: List[str] = field(default_factory=list)
    filters_applied: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ReadResponse:
    operation: str = "OP-2 READ"
    status: str = OperationStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    results: List[Dict] = field(default_factory=list)
    total_found: int = 0
    search_metadata: SearchMetadata = field(default_factory=SearchMetadata)
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "results": self.results,
            "total_found": self.total_found,
            "search_metadata": self.search_metadata.to_dict(),
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


@dataclass
class QueryResponse:
    operation: str = "OP-3 QUERY"
    status: str = OperationStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    answer: str = ""
    supporting_records: List[str] = field(default_factory=list)
    confidence: float = 0.0
    gaps: List[str] = field(default_factory=list)
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def render(self) -> str:
        lines = [
            f"OPERATION: {self.operation}",
            f"STATUS: {self.status}",
            f"TIMESTAMP: {self.timestamp}",
            "---",
            f"ANSWER: {self.answer}",
            f"SUPPORTING RECORDS: {', '.join(self.supporting_records) if self.supporting_records else 'none'}",
            f"CONFIDENCE: {self.confidence}",
        ]
        if self.gaps:
            lines.append("GAPS:")
            for g in self.gaps:
                lines.append(f"  - {g}")
        lines += [
            "---",
            "MEMORY HEALTH:",
            f"  Session records: {self.memory_health.session_records}",
            f"  Project records: {self.memory_health.project_records}",
            f"  Entity records:  {self.memory_health.entity_records}",
            f"  Global records:  {self.memory_health.global_records}",
            f"  Conflicts pending: {self.memory_health.conflicts_pending}",
            f"  Stale records: {self.memory_health.stale_records}",
            f"  Health score: {self.memory_health.health_score} ({self.memory_health.label()})",
            "---",
            "CHANGELOG (this operation):",
            "  No changes — read-only operation.",
        ]
        if self.next_recommended_op:
            lines += ["---", f"NEXT RECOMMENDED OP: {self.next_recommended_op}"]
        return "\n".join(lines)

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "answer": self.answer,
            "supporting_records": self.supporting_records,
            "confidence": self.confidence,
            "gaps": self.gaps,
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


@dataclass
class PromoteResponse:
    operation: str = "OP-4 PROMOTE"
    status: str = OperationStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    promoted_record_id: Optional[str] = None
    fields_promoted: List[str] = field(default_factory=list)
    fields_dropped: List[str] = field(default_factory=list)
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "promoted_record_id": self.promoted_record_id,
            "fields_promoted": self.fields_promoted,
            "fields_dropped": self.fields_dropped,
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


@dataclass
class CompressResponse:
    operation: str = "OP-5 COMPRESS"
    status: str = OperationStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    records_compressed: int = 0
    tokens_saved_estimate: int = 0
    compression_summary: str = ""
    archived_record_ids: List[str] = field(default_factory=list)
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "records_compressed": self.records_compressed,
            "tokens_saved_estimate": self.tokens_saved_estimate,
            "compression_summary": self.compression_summary,
            "archived_record_ids": self.archived_record_ids,
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


@dataclass
class DiffRecord:
    record_id: str
    record_type: str
    summary: str
    before: Optional[Dict] = None
    after: Optional[Dict] = None

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class DiffResponse:
    operation: str = "OP-6 DIFF"
    status: str = OperationStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    added: List[DiffRecord] = field(default_factory=list)
    updated: List[DiffRecord] = field(default_factory=list)
    deleted: List[DiffRecord] = field(default_factory=list)
    promoted: List[DiffRecord] = field(default_factory=list)
    summary: str = ""
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "added": [r.to_dict() for r in self.added],
            "updated": [r.to_dict() for r in self.updated],
            "deleted": [r.to_dict() for r in self.deleted],
            "promoted": [r.to_dict() for r in self.promoted],
            "summary": self.summary,
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


@dataclass
class ValidationIssue:
    issue_id: str = field(default_factory=lambda: "iss_" + uuid.uuid4().hex[:8])
    check_type: str = ""
    severity: str = IssueSeverity.WARNING.value
    record_id: Optional[str] = None
    layer: Optional[str] = None
    description: str = ""
    auto_fixable: bool = False
    recommended_action: str = ""

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class ValidateResponse:
    operation: str = "OP-7 VALIDATE"
    status: str = OperationStatus.SUCCESS.value
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    issues_found: List[ValidationIssue] = field(default_factory=list)
    severity_counts: Dict[str, int] = field(default_factory=lambda: {"critical": 0, "warning": 0, "info": 0})
    auto_fixable_ids: List[str] = field(default_factory=list)
    recommended_actions: List[str] = field(default_factory=list)
    changelog: List[ChangelogEntry] = field(default_factory=list)
    memory_health: MemoryHealth = field(default_factory=MemoryHealth)
    next_recommended_op: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "operation": self.operation,
            "status": self.status,
            "timestamp": self.timestamp,
            "issues_found": [i.to_dict() for i in self.issues_found],
            "severity_counts": self.severity_counts,
            "auto_fixable_ids": self.auto_fixable_ids,
            "recommended_actions": self.recommended_actions,
            "changelog": [e.to_dict() for e in self.changelog],
            "memory_health": self.memory_health.to_dict(),
            "next_recommended_op": self.next_recommended_op,
        }


# ---------------------------------------------------------------------------
# MODULE HEADER (for inter-module calls)
# ---------------------------------------------------------------------------

@dataclass
class ModuleHeader:
    module: str
    session_id: str
    operation: str
    project_id: Optional[str] = None
    payload: Dict[str, Any] = field(default_factory=dict)

    def validate(self) -> Optional[str]:
        if not self.session_id:
            return "SESSION_ID required for all memory operations."
        if not self.module:
            return "MODULE slug required."
        if not self.operation:
            return "OPERATION required (OP-1 through OP-7)."
        return None

    def to_dict(self) -> Dict:
        return asdict(self)


# ---------------------------------------------------------------------------
# FULL MEMORY STORE (in-memory runtime snapshot)
# ---------------------------------------------------------------------------

@dataclass
class MemoryStore:
    sessions:  Dict[str, SessionMemory]  = field(default_factory=dict)
    projects:  Dict[str, ProjectMemory]  = field(default_factory=dict)
    entities:  Dict[str, EntityMemory]   = field(default_factory=dict)
    global_mem: Optional[GlobalMemory]   = None
    conflicts: List[ConflictDetail]      = field(default_factory=list)

    def health(self) -> MemoryHealth:
        h = MemoryHealth(
            session_records = len(self.sessions),
            project_records = sum(
                len(p.artifacts) + len(p.decisions) + len(p.open_tasks)
                for p in self.projects.values()
            ),
            entity_records  = len(self.entities),
            global_records  = len(self.global_mem.user_preferences) if self.global_mem else 0,
            conflicts_pending = len([c for c in self.conflicts if not c.resolved]),
            stale_records   = sum(
                1 for e in self.entities.values() if e.status == RecordStatus.STALE.value
            ),
        )
        h.health_score = h.compute_score()
        return h

    def to_dict(self) -> Dict:
        return {
            "sessions":   {k: v.to_dict() for k, v in self.sessions.items()},
            "projects":   {k: v.to_dict() for k, v in self.projects.items()},
            "entities":   {k: v.to_dict() for k, v in self.entities.items()},
            "global_mem": self.global_mem.to_dict() if self.global_mem else None,
            "conflicts":  [c.to_dict() for c in self.conflicts],
            "health":     self.health().to_dict(),
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent, default=str)


# ---------------------------------------------------------------------------
# QUICK SELF-TEST
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    store = MemoryStore()

    # --- Global layer bootstrap ---
    store.global_mem = GlobalMemory(
        user_preferences={"tone": "bold", "output_format": "markdown", "timezone": "Europe/Athens"},
        learned_constraints=[
            Constraint(rule="Never send emails without user approval", applies_to=["all"]),
            Constraint(rule="Always include CRO score in landing page artifacts", applies_to=["nasus_landing_page"]),
        ],
        vocabulary={"vibe coding": "Drewskii's term for design-led rapid prototyping"},
        network_config=NetworkConfig(
            active_modules=[
                "nasus_research_analyst", "nasus_api_integrator", "nasus_web_browser",
                "nasus_data_analyst", "nasus_code_engineer", "nasus_content_creator",
                "nasus_product_strategist", "nasus_landing_page", "nasus_memory_manager"
            ],
            flags={"require_user_approval_for_global_writes": True, "auto_promote_sessions": False}
        )
    )

    # --- Session layer ---
    sess = SessionMemory(
        active_task="Build FlowDesk landing page hero section",
        active_modules=["nasus_landing_page", "nasus_memory_manager"],
        user_instructions=["Make it bold and minimal", "CRO score must be above 80"],
        pending_decisions=["Should we include a video demo in the hero?"]
    )
    store.sessions[sess.session_id] = sess

    # --- Project layer ---
    proj = ProjectMemory(
        project_name="FlowDesk",
        description="SaaS project management tool for solo founders",
        modules_used=["nasus_product_strategist", "nasus_landing_page"],
        decisions=[
            Decision(decision="Free tier at $0", rationale="Lower barrier to entry", source_module="nasus_product_strategist", confidence=1.0, locked=True),
            Decision(decision="Pro tier at $49/mo", rationale="Matches competitor pricing research", source_module="nasus_product_strategist", confidence=0.88),
        ],
        rejected_ideas=[
            RejectedIdea(idea="Freemium with 3-project limit", reason="Too restrictive, hurts activation", rejected_by="user"),
        ],
        artifacts=[
            Artifact(artifact_type=ArtifactType.HTML_PAGE.value, name="FlowDesk Hero Section v2",
                     file_path="/code/flowdesk_hero_v2.html", source_module="nasus_landing_page",
                     cro_score=86, tags=["hero", "landing-page", "cro", "flowdesk"]),
        ],
        open_tasks=["Build pricing section", "Write onboarding email sequence"],
        completed_tasks=["Define ICP", "Write hero copy", "Build hero HTML"],
        tags=["saas", "flowdesk", "active"]
    )
    store.projects[proj.project_id] = proj

    # --- Entity layer ---
    competitor = EntityMemory(
        entity_type=EntityType.COMPETITOR.value,
        name="Notion",
        aliases=["notion.so"],
        description="All-in-one workspace tool — primary competitor for FlowDesk",
        known_facts=[
            Fact(fact="Notion pricing starts at $8/mo per user", source_url="https://notion.so/pricing", confidence=0.95),
            Fact(fact="Notion has 30M+ users as of 2024", source_url="https://techcrunch.com", confidence=0.85),
        ],
        relationships=[Relationship(entity_id=proj.project_id, rel_type="competitor_of")],
        source_projects=[proj.project_id],
        confidence_score=0.92
    )
    store.entities[competitor.entity_id] = competitor

    # --- Simulate a conflict ---
    conflict = ConflictDetail(
        field_name="Pro tier pricing",
        existing_value="$49/mo",
        new_value="$39/mo",
        existing_source="nasus_product_strategist",
        new_source="nasus_research_analyst",
        existing_confidence=0.88,
        new_confidence=0.75,
    )
    store.conflicts.append(conflict)

    # --- Health check ---
    health = store.health()
    print("=== MEMORY STORE HEALTH ===")
    print(f"  Session records:   {health.session_records}")
    print(f"  Project records:   {health.project_records}")
    print(f"  Entity records:    {health.entity_records}")
    print(f"  Global records:    {health.global_records}")
    print(f"  Conflicts pending: {health.conflicts_pending}")
    print(f"  Stale records:     {health.stale_records}")
    print(f"  Health score:      {health.health_score} ({health.label()})")

    # --- Simulate OP-3 QUERY response ---
    qr = QueryResponse(
        answer=(
            "Two pricing decisions are on record for FlowDesk:\n"
            "  1. [2026-03-01] Free tier confirmed at $0 — locked by user, confidence 1.0\n"
            "  2. [2026-03-05] Pro tier set at $49/mo — by nasus_product_strategist, confidence 0.88\n\n"
            "  CONFLICT FLAGGED: nasus_research_analyst proposed $39/mo on 2026-03-07. Not auto-resolved."
        ),
        supporting_records=["dec_001", "dec_002", "cfl_001"],
        confidence=0.91,
        gaps=["No enterprise pricing decision found", "No annual discount decision found"],
        memory_health=health,
        next_recommended_op="OP-1 WRITE to record enterprise pricing decision"
    )
    print("\n=== OP-3 QUERY RESPONSE ===")
    print(qr.render())

    # --- Simulate OP-1 WRITE response ---
    wr = WriteResponse(
        status=WriteStatus.SUCCESS.value,
        record_id="art_" + uuid.uuid4().hex[:8],
        changelog=[
            ChangelogEntry("+", "artifact FlowDesk Hero Section v2 added to proj_flowdesk", source_module="nasus_landing_page"),
        ],
        memory_health=health,
        next_recommended_op="OP-6 DIFF to review all FlowDesk changes this session"
    )
    print("\n=== OP-1 WRITE RESPONSE ===")
    print(wr.render())

    # --- Export full store to JSON ---
    import os
    out_path = "/home/user/files/code/demo_mm_store.json"
    with open(out_path, "w") as f:
        f.write(store.to_json())
    print(f"\n=== MEMORY STORE EXPORTED ===")
    print(f"  Saved to: {out_path}")
    print(f"  Size: {os.path.getsize(out_path):,} bytes")
    print("\nAll schema tests passed.")


__all__ = [
    # Enums
    "MemoryLayer", "OperationType", "WriteStatus", "EntityType", "ArtifactType",
    "QueryType", "CompressionStrategy", "ValidationCheck", "IssueSeverity",
    "OperationStatus", "RecordStatus",
    # Dataclasses
    "WriteResponse",
    "Fact", "Relationship", "Decision", "RejectedIdea", "Artifact",
    "Constraint", "Pattern", "PerformanceRecord", "NetworkConfig",
    "SessionMemory", "ProjectMemory", "EntityRecord", "UserPreferences",
    "MemoryConflict",
    # Operations
    "MemoryWriteOperation", "MemoryReadOperation",
    "MemoryCompressOperation", "MemoryValidateOperation",
    "MemoryQueryResult", "MemoryValidationReport",
]

__all__ = [
    # Enums
    "MemoryLayer", "OperationType", "WriteStatus", "EntityType", "ArtifactType",
    "QueryType", "CompressionStrategy", "ValidationCheck", "IssueSeverity",
    "OperationStatus", "RecordStatus",
    # Dataclasses
    "WriteResponse",
    "Fact", "Relationship", "Decision", "RejectedIdea", "Artifact",
    "Constraint", "Pattern", "PerformanceRecord", "NetworkConfig",
    "SessionMemory", "ProjectMemory", "EntityRecord", "UserPreferences",
    "MemoryConflict",
    # Operations
    "MemoryWriteOperation", "MemoryReadOperation",
    "MemoryCompressOperation", "MemoryValidateOperation",
    "MemoryQueryResult", "MemoryValidationReport",
]
