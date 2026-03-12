"""
NASUS ORCHESTRATOR CORE — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 10 | Stack: Nasus Sub-Agent Network

Dataclasses covering all orchestrator output types:
- Subtask & DAG structures
- Dispatch blocks
- Execution plans
- Synthesis reports
- Escalations
- Routing change log
- Session record
- Full JSON serialization
"""

# COMPATIBILITY NOTE (Phase 3):
# The orchestrator-level escalation class is named OrchestratorClarification.
# Do NOT confuse with task_planner_schema.ClarificationRequest (BlockingQuestion list).
# output_type string: "OrchestratorClarification"

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import datetime, timezone
import json
import uuid


# ─────────────────────────────────────────────
# ENUMS
# ─────────────────────────────────────────────

# ModuleID imported from shared registry (GAP-03 / GAP-10 fix)
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus  # noqa: F401


class GoalType(str, Enum):
    SINGLE_MODULE = "SINGLE_MODULE"
    SEQUENTIAL_PIPELINE = "SEQUENTIAL_PIPELINE"
    PARALLEL_DISPATCH = "PARALLEL_DISPATCH"
    HYBRID = "HYBRID"


class SubtaskStatus(str, Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    BLOCKED = "BLOCKED"
    RETRYING = "RETRYING"
    AWAITING_APPROVAL = "AWAITING_APPROVAL"


class Deadline(str, Enum):
    ASAP = "ASAP"
    BLOCKING_NEXT_STAGE = "BLOCKING_NEXT_STAGE"
    NON_BLOCKING = "NON_BLOCKING"


class Complexity(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class OutputType(str, Enum):
    EXECUTION_PLAN = "EXECUTION_PLAN"
    DISPATCH = "DISPATCH"
    SYNTHESIS_REPORT = "SYNTHESIS_REPORT"
    ESCALATION = "ESCALATION"


class EscalationType(str, Enum):
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    MODULE_FAILURE = "MODULE_FAILURE"
    AMBIGUOUS_GOAL = "AMBIGUOUS_GOAL"
    CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY"
    CONSTRAINT_CONFLICT = "CONSTRAINT_CONFLICT"


class RefinementType(str, Enum):
    RT1_OUTPUT_QUALITY_REJECT = "RT-1"
    RT2_SCOPE_EXPANSION = "RT-2"
    RT3_SCOPE_REDUCTION = "RT-3"
    RT4_MODULE_SWAP = "RT-4"
    RT5_CONSTRAINT_CHANGE = "RT-5"
    RT6_PRIORITY_SHIFT = "RT-6"
    RT7_CONTEXT_INJECTION = "RT-7"
    RT8_FULL_RESET = "RT-8"


# ─────────────────────────────────────────────
# CORE SUBTASK
# ─────────────────────────────────────────────

@dataclass
class SubtaskInput:
    name: str
    description: str
    source: str  # "user" | "ST-00X output" | "M09"
    value: Optional[Any] = None

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class SubtaskOutput:
    name: str
    format: str  # e.g. "JSON", "markdown", "HTML", "CSV"
    description: str

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class Subtask:
    subtask_id: str                          # ST-001, ST-002, ...
    module: ModuleID
    instruction: str
    inputs: List[SubtaskInput]
    outputs: List[SubtaskOutput]
    depends_on: List[str]                    # list of subtask_ids
    deadline: Deadline
    stage: int
    status: SubtaskStatus = SubtaskStatus.PENDING
    constraints: List[str] = field(default_factory=list)
    context: List[str] = field(default_factory=list)
    retry_count: int = 0
    max_retries: int = 2
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

    def to_dict(self) -> Dict:
        d = asdict(self)
        d["module"] = self.module.value
        d["deadline"] = self.deadline.value
        d["status"] = self.status.value
        return d


# ─────────────────────────────────────────────
# DAG
# ─────────────────────────────────────────────

@dataclass
class DAGStage:
    stage_number: int
    subtask_ids: List[str]
    can_parallelize: bool
    data_contracts: List[str] = field(default_factory=list)  # "ST-001.output → ST-002.input"

    def to_dict(self) -> Dict:
        return asdict(self)


@dataclass
class DependencyGraph:
    stages: List[DAGStage]
    total_stages: int
    has_cycles: bool = False
    cycle_path: Optional[str] = None  # e.g. "ST-001 → ST-003 → ST-001"

    def to_dict(self) -> Dict:
        return {
            "stages": [s.to_dict() for s in self.stages],
            "total_stages": self.total_stages,
            "has_cycles": self.has_cycles,
            "cycle_path": self.cycle_path
        }


# ─────────────────────────────────────────────
# DISPATCH BLOCK
# ─────────────────────────────────────────────

@dataclass
class DispatchBlock:
    output_type: OutputType = OutputType.DISPATCH
    subtask_id: str = ""
    module: ModuleID = ModuleID.M01
    stage: int = 0
    instruction: str = ""
    inputs: List[SubtaskInput] = field(default_factory=list)
    expected_outputs: List[SubtaskOutput] = field(default_factory=list)
    constraints: List[str] = field(default_factory=list)
    context: List[str] = field(default_factory=list)
    deadline: Deadline = Deadline.ASAP
    retry: bool = False
    rejection_reason: Optional[str] = None
    constraint_update: bool = False
    dispatched_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "output_type": self.output_type.value,
            "subtask_id": self.subtask_id,
            "module": self.module.value,
            "stage": self.stage,
            "instruction": self.instruction,
            "inputs": [i.to_dict() for i in self.inputs],
            "expected_outputs": [o.to_dict() for o in self.expected_outputs],
            "constraints": self.constraints,
            "context": self.context,
            "deadline": self.deadline.value,
            "retry": self.retry,
            "rejection_reason": self.rejection_reason,
            "constraint_update": self.constraint_update,
            "dispatched_at": self.dispatched_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ─────────────────────────────────────────────
# EXECUTION PLAN
# ─────────────────────────────────────────────

@dataclass
class ExecutionPlan:
    output_type: OutputType = OutputType.EXECUTION_PLAN
    plan_id: str = field(default_factory=lambda: f"PLAN-{uuid.uuid4().hex[:8].upper()}")
    session_id: str = ""
    goal: str = ""
    goal_type: GoalType = GoalType.SINGLE_MODULE
    complexity: Complexity = Complexity.MEDIUM
    subtasks: List[Subtask] = field(default_factory=list)
    dag: Optional[DependencyGraph] = None
    memory_prefetch: bool = True
    memory_snapshot_id: Optional[str] = None
    estimated_stages: int = 0
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "output_type": self.output_type.value,
            "plan_id": self.plan_id,
            "session_id": self.session_id,
            "goal": self.goal,
            "goal_type": self.goal_type.value,
            "complexity": self.complexity.value,
            "subtasks": [s.to_dict() for s in self.subtasks],
            "dag": self.dag.to_dict() if self.dag else None,
            "memory_prefetch": self.memory_prefetch,
            "memory_snapshot_id": self.memory_snapshot_id,
            "estimated_stages": self.estimated_stages,
            "created_at": self.created_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ─────────────────────────────────────────────
# CONFLICT
# ─────────────────────────────────────────────

@dataclass
class Conflict:
    field: str
    module_a: ModuleID
    value_a: Any
    module_b: ModuleID
    value_b: Any
    resolution: str  # "PREFER_A" | "PREFER_B" | "SURFACED_TO_USER"
    recommendation: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "field": self.field,
            "module_a": self.module_a.value,
            "value_a": self.value_a,
            "module_b": self.module_b.value,
            "value_b": self.value_b,
            "resolution": self.resolution,
            "recommendation": self.recommendation
        }


# ─────────────────────────────────────────────
# DELIVERABLE
# ─────────────────────────────────────────────

@dataclass
class Deliverable:
    index: int
    label: str
    source_module: ModuleID
    output_type: str       # e.g. "HTML file", "JSON", "research_report"
    artifact: Any          # file path, URL, string, dict
    verified: bool = True

    def to_dict(self) -> Dict:
        return {
            "index": self.index,
            "label": self.label,
            "source_module": self.source_module.value,
            "output_type": self.output_type,
            "artifact": self.artifact,
            "verified": self.verified
        }


# ─────────────────────────────────────────────
# MEMORY WRITE RECORD
# ─────────────────────────────────────────────

@dataclass
class MemoryWriteRecord:
    key: str
    layer: str   # "episodic" | "semantic" | "working" | "procedural"
    value: Any
    ttl_hours: Optional[int] = None

    def to_dict(self) -> Dict:
        return asdict(self)


# ─────────────────────────────────────────────
# SYNTHESIS REPORT
# ─────────────────────────────────────────────

@dataclass
class SynthesisReport:
    output_type: OutputType = OutputType.SYNTHESIS_REPORT
    report_id: str = field(default_factory=lambda: f"SR-{uuid.uuid4().hex[:8].upper()}")
    session_id: str = ""
    plan_id: str = ""
    goal: str = ""
    modules_used: List[ModuleID] = field(default_factory=list)
    stages_completed: int = 0
    conflicts_resolved: int = 0
    conflicts_surfaced: int = 0
    conflicts: List[Conflict] = field(default_factory=list)
    deliverables: List[Deliverable] = field(default_factory=list)
    memory_writes: List[MemoryWriteRecord] = field(default_factory=list)
    next_recommended_action: Optional[str] = None
    null_outputs: List[str] = field(default_factory=list)  # subtask_ids with no output
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "output_type": self.output_type.value,
            "report_id": self.report_id,
            "session_id": self.session_id,
            "plan_id": self.plan_id,
            "goal": self.goal,
            "modules_used": [m.value for m in self.modules_used],
            "stages_completed": self.stages_completed,
            "conflicts_resolved": self.conflicts_resolved,
            "conflicts_surfaced": self.conflicts_surfaced,
            "conflicts": [c.to_dict() for c in self.conflicts],
            "deliverables": [d.to_dict() for d in self.deliverables],
            "memory_writes": [m.to_dict() for m in self.memory_writes],
            "next_recommended_action": self.next_recommended_action,
            "null_outputs": self.null_outputs,
            "created_at": self.created_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ─────────────────────────────────────────────
# ESCALATIONS
# ─────────────────────────────────────────────

@dataclass
class EscalationOutOfScope:
    output_type: OutputType = OutputType.ESCALATION
    escalation_type: EscalationType = EscalationType.OUT_OF_SCOPE
    goal: str = ""
    reason: str = ""
    suggested_action: str = ""
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "output_type": self.output_type.value,
            "escalation_type": self.escalation_type.value,
            "goal": self.goal,
            "reason": self.reason,
            "suggested_action": self.suggested_action,
            "created_at": self.created_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


@dataclass
class EscalationModuleFailure:
    output_type: OutputType = OutputType.ESCALATION
    escalation_type: EscalationType = EscalationType.MODULE_FAILURE
    module: ModuleID = ModuleID.M01
    subtask_id: str = ""
    error: str = ""
    recovery_options: List[str] = field(default_factory=list)
    fallback_module: Optional[ModuleID] = None
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "output_type": self.output_type.value,
            "escalation_type": self.escalation_type.value,
            "module": self.module.value,
            "subtask_id": self.subtask_id,
            "error": self.error,
            "recovery_options": self.recovery_options,
            "fallback_module": self.fallback_module.value if self.fallback_module else None,
            "created_at": self.created_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# NOTE: Renamed from ClarificationRequest → OrchestratorClarification (Phase 3 fix)
# to avoid collision with task_planner_schema.ClarificationRequest (BlockingQuestion wrapper).
# The orchestrator version wraps an EscalationType; the planner version wraps BlockingQuestions.
@dataclass
class OrchestratorClarification:
    output_type: OutputType = OutputType.ESCALATION
    escalation_type: EscalationType = EscalationType.AMBIGUOUS_GOAL
    missing_fields: List[str] = field(default_factory=list)
    assumed_defaults: Dict[str, Any] = field(default_factory=dict)
    blocking: bool = False
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def to_dict(self) -> Dict:
        return {
            "output_type": self.output_type.value,
            "escalation_type": self.escalation_type.value,
            "missing_fields": self.missing_fields,
            "assumed_defaults": self.assumed_defaults,
            "blocking": self.blocking,
            "created_at": self.created_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ─────────────────────────────────────────────
# ROUTING CHANGE LOG
# ─────────────────────────────────────────────

@dataclass
class RoutingChange:
    change_id: str = field(default_factory=lambda: f"RC-{uuid.uuid4().hex[:6].upper()}")
    session_id: str = ""
    timestamp: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    change_type: str = ""   # RT-1 through RT-8 | EDGE-01 through EDGE-08
    subtask_id: str = ""
    before: str = ""
    after: str = ""
    trigger: str = ""
    downstream_impact: List[str] = field(default_factory=list)

    def to_dict(self) -> Dict:
        return asdict(self)


# ─────────────────────────────────────────────
# SESSION RECORD (written to M09 at end)
# ─────────────────────────────────────────────

@dataclass
class OrchestratorSessionRecord:
    session_id: str = field(default_factory=lambda: f"ORCH-{uuid.uuid4().hex[:10].upper()}")
    plan_id: str = ""
    report_id: str = ""
    goal: str = ""
    goal_type: GoalType = GoalType.SINGLE_MODULE
    complexity: Complexity = Complexity.MEDIUM
    modules_used: List[ModuleID] = field(default_factory=list)
    stages_completed: int = 0
    subtask_count: int = 0
    routing_changes: List[RoutingChange] = field(default_factory=list)
    conflicts: List[Conflict] = field(default_factory=list)
    deliverable_artifacts: List[str] = field(default_factory=list)  # file paths / URLs
    routing_pattern: str = ""   # e.g. "M01 → M06" for reuse in future similar goals
    entities_discovered: List[str] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    completed_at: Optional[str] = None

    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "plan_id": self.plan_id,
            "report_id": self.report_id,
            "goal": self.goal,
            "goal_type": self.goal_type.value,
            "complexity": self.complexity.value,
            "modules_used": [m.value for m in self.modules_used],
            "stages_completed": self.stages_completed,
            "subtask_count": self.subtask_count,
            "routing_changes": [r.to_dict() for r in self.routing_changes],
            "conflicts": [c.to_dict() for c in self.conflicts],
            "deliverable_artifacts": self.deliverable_artifacts,
            "routing_pattern": self.routing_pattern,
            "entities_discovered": self.entities_discovered,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


# ─────────────────────────────────────────────
# VALIDATION HELPER
# ─────────────────────────────────────────────

@dataclass
class SchemaValidationResult:
    valid: bool
    schema_version: str = "1.0"
    checks_passed: List[str] = field(default_factory=list)
    checks_failed: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    score: float = 0.0   # 0.0 – 100.0

    def to_dict(self) -> Dict:
        return asdict(self)

    def to_json(self) -> str:
        return json.dumps(self.to_dict(), indent=2)


def validate_execution_plan(plan: ExecutionPlan) -> SchemaValidationResult:
    passed, failed, warnings = [], [], []

    if plan.goal:
        passed.append("goal_present")
    else:
        failed.append("goal_missing")

    if plan.subtasks:
        passed.append("subtasks_present")
    else:
        failed.append("subtasks_empty")

    for st in plan.subtasks:
        if not st.instruction:
            failed.append(f"{st.subtask_id}_instruction_missing")
        else:
            passed.append(f"{st.subtask_id}_instruction_ok")
        if not st.inputs:
            warnings.append(f"{st.subtask_id}_no_inputs_defined")
        if not st.outputs:
            failed.append(f"{st.subtask_id}_outputs_missing")
        else:
            passed.append(f"{st.subtask_id}_outputs_ok")

    if plan.dag:
        if plan.dag.has_cycles:
            failed.append("dag_has_cycles")
        else:
            passed.append("dag_acyclic")
    else:
        warnings.append("dag_not_built")

    if plan.memory_prefetch:
        passed.append("memory_prefetch_enabled")
    else:
        warnings.append("memory_prefetch_disabled")

    total = len(passed) + len(failed)
    score = (len(passed) / total * 100) if total > 0 else 0.0

    return SchemaValidationResult(
        valid=len(failed) == 0,
        checks_passed=passed,
        checks_failed=failed,
        warnings=warnings,
        score=round(score, 1)
    )


def validate_synthesis_report(report: SynthesisReport) -> SchemaValidationResult:
    passed, failed, warnings = [], [], []

    if report.goal:
        passed.append("goal_present")
    else:
        failed.append("goal_missing")

    if report.deliverables:
        passed.append("deliverables_present")
    else:
        failed.append("deliverables_empty")

    if report.null_outputs:
        warnings.append(f"null_outputs_present: {report.null_outputs}")
    else:
        passed.append("no_null_outputs")

    if report.modules_used:
        passed.append("modules_used_recorded")
    else:
        warnings.append("modules_used_empty")

    if report.memory_writes:
        passed.append("memory_writes_present")
    else:
        warnings.append("memory_writes_empty")

    if report.next_recommended_action:
        passed.append("next_action_present")
    else:
        warnings.append("next_action_missing")

    total = len(passed) + len(failed)
    score = (len(passed) / total * 100) if total > 0 else 0.0

    return SchemaValidationResult(
        valid=len(failed) == 0,
        checks_passed=passed,
        checks_failed=failed,
        warnings=warnings,
        score=round(score, 1)
    )


# ─────────────────────────────────────────────
# DEMO / SMOKE TEST
# ─────────────────────────────────────────────

if __name__ == "__main__":
    print("=== Nasus Orchestrator Schema — Smoke Test ===\n")

    # Build a minimal execution plan
    plan = ExecutionPlan(
        session_id="SESS-TEST-001",
        goal="Research top 5 AI productivity tools and write a comparison email",
        goal_type=GoalType.SEQUENTIAL_PIPELINE,
        complexity=Complexity.MEDIUM,
        subtasks=[
            Subtask(
                subtask_id="ST-001",
                module=ModuleID.M01,
                instruction="Search for the top 5 AI productivity tools in 2025, return name, URL, pricing, and key features for each.",
                inputs=[SubtaskInput(name="query", description="Search query", source="user", value="top AI productivity tools 2025")],
                outputs=[SubtaskOutput(name="research_report", format="JSON", description="List of 5 tools with name, url, pricing, features")],
                depends_on=[],
                deadline=Deadline.BLOCKING_NEXT_STAGE,
                stage=0
            ),
            Subtask(
                subtask_id="ST-002",
                module=ModuleID.M06,
                instruction="Write a concise comparison email (max 300 words) summarizing the 5 tools from the research report, with a clear recommendation.",
                inputs=[SubtaskInput(name="research_report", description="Output from ST-001", source="ST-001 output")],
                outputs=[SubtaskOutput(name="email_draft", format="markdown", description="Email body with subject line")],
                depends_on=["ST-001"],
                deadline=Deadline.ASAP,
                stage=1
            )
        ],
        dag=DependencyGraph(
            stages=[
                DAGStage(stage_number=0, subtask_ids=["ST-001"], can_parallelize=False, data_contracts=[]),
                DAGStage(stage_number=1, subtask_ids=["ST-002"], can_parallelize=False, data_contracts=["ST-001.research_report → ST-002.research_report"])
            ],
            total_stages=2
        ),
        estimated_stages=2
    )

    validation = validate_execution_plan(plan)
    print(f"ExecutionPlan validation: {'PASS' if validation.valid else 'FAIL'} | Score: {validation.score}/100")
    print(f"  Passed: {validation.checks_passed}")
    print(f"  Warnings: {validation.warnings}\n")

    # Build a dispatch block
    dispatch = DispatchBlock(
        subtask_id="ST-001",
        module=ModuleID.M01,
        stage=0,
        instruction="Search for the top 5 AI productivity tools in 2025, return name, URL, pricing, and key features for each.",
        inputs=[SubtaskInput(name="query", description="Search query", source="user", value="top AI productivity tools 2025")],
        expected_outputs=[SubtaskOutput(name="research_report", format="JSON", description="5 tools with structured data")],
        deadline=Deadline.BLOCKING_NEXT_STAGE
    )
    print(f"DispatchBlock built: {dispatch.subtask_id} → {dispatch.module.value}")

    # Build a synthesis report
    report = SynthesisReport(
        session_id="SESS-TEST-001",
        plan_id=plan.plan_id,
        goal=plan.goal,
        modules_used=[ModuleID.M01, ModuleID.M06],
        stages_completed=2,
        deliverables=[
            Deliverable(index=1, label="Research Report", source_module=ModuleID.M01, output_type="JSON", artifact={"tools": ["Notion AI", "Otter.ai", "Superhuman", "Reclaim.ai", "Motion"]}),
            Deliverable(index=2, label="Comparison Email", source_module=ModuleID.M06, output_type="markdown", artifact="Subject: 5 AI Tools Worth Your Time\n\nHi...(email body)")
        ],
        memory_writes=[
            MemoryWriteRecord(key="session:SESS-TEST-001", layer="episodic", value="Research + email pipeline for AI tools")
        ],
        next_recommended_action="Send the comparison email via M02 API integrator or route to inbox agent."
    )

    report_validation = validate_synthesis_report(report)
    print(f"\nSynthesisReport validation: {'PASS' if report_validation.valid else 'FAIL'} | Score: {report_validation.score}/100")
    print(f"  Passed: {report_validation.checks_passed}")
    print(f"  Warnings: {report_validation.warnings}\n")

    print("=== All schema objects instantiated and validated successfully ===")
    print(f"Modules covered: {[m.value for m in ModuleID]}")
    print(f"Output types: {[o.value for o in OutputType]}")
    print(f"Escalation types: {[e.value for e in EscalationType]}")

__all__ = [
    # Enums
    "GoalType", "SubtaskStatus", "DeadlineUrgency", "RoutingMode",
    "SessionStatus", "FailureCategory",
    # Dataclasses
    "SubtaskRecord", "ExecutionPlan", "DispatchSignal",
    "OrchestrationRequest", "SynthesisReport", "EscalationSignal",
    "RecoveryPlan", "AmbiguityAlert", "RoutingChange",
    "OrchestratorClarification", "OrchestratorSessionRecord", "MemoryWriteRecord",
    # Functions
    "validate_execution_plan",
]
