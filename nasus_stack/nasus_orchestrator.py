"""
NASUS ORCHESTRATOR CORE — PROTOTYPE
Version: 2.0 | Module: 10 | Stack: Nasus Sub-Agent Network

Phase 2: LLM reasoning added via injected NasusLLMClient.
  - route_envelope() now calls _llm_plan(), _llm_review(), _llm_orchestrate()
    when self.llm is available (injected by the sidecar after /configure).
  - All LLM methods fall back to pure-Python logic if self.llm is None so the
    orchestrator still works without credentials (useful for testing).
"""

# Phase 3: OrchestratorClarification replaces the old ClarificationRequest name.
# See nasus_orchestrator_schema.py for the rename rationale.

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any, Dict, List, Optional

if TYPE_CHECKING:
    # Avoid a hard import of the sidecar package from the orchestrator module —
    # the dependency goes the other way (sidecar imports orchestrator).
    # We only need the type for IDE hints; at runtime the injected client is
    # whatever the sidecar passes in.
    from nasus_sidecar.llm_client import NasusLLMClient

# ── Registry + Schema imports ──────────────────────────────────────────────
from nasus_module_registry import ModuleID, NasusEnvelope
from nasus_orchestrator_schema import (
    Complexity,
    Deadline,
    EscalationType,
    GoalType,
    OrchestratorClarification,
    OutputType,
    SchemaValidationResult,
    SubtaskStatus,
)

MODULE_NAMES = {
    "M01": "research_analyst",
    "M02": "api_integrator",
    "M03": "web_browser",
    "M04": "data_analyst",
    "M05": "code_engineer",
    "M06": "content_creator",
    "M07": "product_strategist",
    "M08": "landing_page",
    "M09": "memory_manager",
}

MODULE_CAPABILITIES = {
    "M01": ["web research", "competitive intel", "trend scanning", "source retrieval"],
    "M02": ["REST API calls", "GraphQL", "webhook setup", "auth flows"],
    "M03": ["page scraping", "form filling", "JS-heavy sites", "screenshot"],
    "M04": [
        "CSV analysis",
        "JSON analysis",
        "chart generation",
        "statistical ops",
        "SQL",
    ],
    "M05": ["Python codegen", "JS codegen", "TS codegen", "debugging", "refactoring"],
    "M06": [
        "copywriting",
        "email drafts",
        "social posts",
        "documentation",
        "subject lines",
    ],
    "M07": [
        "PRD writing",
        "feature prioritization",
        "competitive positioning",
        "market analysis",
    ],
    "M08": ["HTML/CSS/JS landing page", "Vercel deployment", "component map"],
    "M09": [
        "session state",
        "cross-session recall",
        "entity tracking",
        "memory health",
    ],
}

MODULE_PREREQUISITES = {"M08": ["product_brief"], "M05": ["spec"]}

# ── Core Data Structures ────────────────────────────────────────────────────────


@dataclass
class SubtaskIO:
    name: str
    description: str
    source: str
    value: Any = None


@dataclass
class Subtask:
    subtask_id: str
    module: str
    instruction: str
    inputs: List[SubtaskIO]
    outputs: List[SubtaskIO]
    depends_on: List[str]
    deadline: Deadline
    stage: int
    constraints: List[str] = field(default_factory=list)
    context: List[str] = field(default_factory=list)
    status: SubtaskStatus = SubtaskStatus.PENDING
    result: Any = None
    retry_count: int = 0

    def to_dict(self):
        return {
            "subtask_id": self.subtask_id,
            "module": self.module,
            "module_name": MODULE_NAMES.get(self.module, "unknown"),
            "instruction": self.instruction,
            "inputs": [
                {"name": i.name, "source": i.source, "value": i.value}
                for i in self.inputs
            ],
            "outputs": [
                {"name": o.name, "description": o.description} for o in self.outputs
            ],
            "depends_on": self.depends_on,
            "deadline": self.deadline.value,
            "stage": self.stage,
            "constraints": self.constraints,
            "context": self.context,
            "status": self.status.value,
        }


@dataclass
class DAGStage:
    stage_number: int
    subtask_ids: List[str]
    can_parallelize: bool
    data_contracts: List[str] = field(default_factory=list)


@dataclass
class Conflict:
    field: str
    module_a: str
    value_a: Any
    module_b: str
    value_b: Any
    resolution: str
    recommendation: Optional[str] = None

    def to_dict(self):
        return {
            "field": self.field,
            "module_a": self.module_a,
            "value_a": self.value_a,
            "module_b": self.module_b,
            "value_b": self.value_b,
            "resolution": self.resolution,
            "recommendation": self.recommendation,
        }


@dataclass
class Deliverable:
    index: int
    label: str
    source_module: str
    output_type: str
    artifact: Any
    verified: bool = True

    def to_dict(self):
        return {
            "index": self.index,
            "label": self.label,
            "source_module": self.source_module,
            "output_type": self.output_type,
            "artifact": self.artifact,
            "verified": self.verified,
        }


# ── Orchestrator Core ───────────────────────────────────────────────────────────


class NasusOrchestrator:
    """
    Central routing brain of the Nasus Sub-Agent Network.
    Decomposes goals, routes subtasks, tracks DAG execution, and synthesizes outputs.
    """

    def __init__(self, llm_client: Optional["NasusLLMClient"] = None):
        # Optional LLM client injected by the sidecar layer after /configure.
        # When None, route_envelope() falls back to pure-Python heuristics.
        self.llm = llm_client

        self.session_id: str = f"ORCH-{uuid.uuid4().hex[:10].upper()}"
        self.plan_id: Optional[str] = None
        self.goal: str = ""
        self.goal_type: GoalType = GoalType.SINGLE_MODULE
        self.complexity: Complexity = Complexity.MEDIUM
        self.subtasks: Dict[str, Subtask] = {}
        self.stages: List[DAGStage] = []
        self.conflicts: List[Conflict] = []
        self.deliverables: List[Deliverable] = []
        self.routing_changes: List[Dict] = []
        self.memory_context: List[str] = []
        self.created_at: str = datetime.now(timezone.utc).isoformat()
        self.log: List[str] = []

    def _log(self, msg: str):
        ts = datetime.now(timezone.utc).strftime("%H:%M:%S")
        entry = f"[{ts}] {msg}"
        self.log.append(entry)

    # ── Step 1: Classify goal ──────────────────────────────────────────────────

    def classify_goal(
        self, goal: str, subtask_count: int, has_dependencies: bool
    ) -> GoalType:
        if subtask_count == 1:
            return GoalType.SINGLE_MODULE
        if has_dependencies and subtask_count > 1:
            return GoalType.SEQUENTIAL_PIPELINE
        if not has_dependencies and subtask_count > 1:
            return GoalType.PARALLEL_DISPATCH
        return GoalType.HYBRID

    # ── Step 2: Build execution plan ──────────────────────────────────────────

    def build_plan(self, goal: str, subtasks: List[Subtask]) -> Dict:
        self.plan_id = f"PLAN-{uuid.uuid4().hex[:8].upper()}"
        self.goal = goal
        self.subtasks = {st.subtask_id: st for st in subtasks}

        has_deps = any(st.depends_on for st in subtasks)
        self.goal_type = self.classify_goal(goal, len(subtasks), has_deps)

        # Determine complexity
        if len(subtasks) == 1:
            self.complexity = Complexity.LOW
        elif len(subtasks) <= 3:
            self.complexity = Complexity.MEDIUM
        elif len(subtasks) <= 6:
            self.complexity = Complexity.HIGH
        else:
            self.complexity = Complexity.CRITICAL

        # Build DAG stages
        self.stages = self._build_dag(subtasks)

        self._log(
            f"Plan built: {self.plan_id} | Goal type: {self.goal_type.value} | Complexity: {self.complexity.value} | Stages: {len(self.stages)}"
        )

        return {
            "output_type": OutputType.EXECUTION_PLAN.value,
            "plan_id": self.plan_id,
            "session_id": self.session_id,
            "goal": self.goal,
            "goal_type": self.goal_type.value,
            "complexity": self.complexity.value,
            "stage_count": len(self.stages),
            "subtask_count": len(subtasks),
            "stages": [
                {
                    "stage": s.stage_number,
                    "subtasks": s.subtask_ids,
                    "parallel": s.can_parallelize,
                    "data_contracts": s.data_contracts,
                }
                for s in self.stages
            ],
            "subtasks": [st.to_dict() for st in subtasks],
            "memory_prefetch": True,
            "created_at": self.created_at,
        }

    def _build_dag(self, subtasks: List[Subtask]) -> List[DAGStage]:
        stage_map: Dict[int, List[str]] = {}
        for st in subtasks:
            stage_map.setdefault(st.stage, []).append(st.subtask_id)

        stages = []
        for stage_num in sorted(stage_map.keys()):
            ids = stage_map[stage_num]
            contracts = []
            for st_id in ids:
                st = self.subtasks[st_id]
                for dep_id in st.depends_on:
                    dep = self.subtasks.get(dep_id)
                    if dep:
                        for out in dep.outputs:
                            for inp in st.inputs:
                                if out.name == inp.name or inp.source == dep_id:
                                    contracts.append(
                                        f"{dep_id}.{out.name} -> {st_id}.{inp.name}"
                                    )
            stages.append(
                DAGStage(
                    stage_number=stage_num,
                    subtask_ids=ids,
                    can_parallelize=len(ids) > 1,
                    data_contracts=contracts,
                )
            )
        return stages

    # ── Step 3: Dispatch ───────────────────────────────────────────────────────

    def dispatch(self, subtask_id: str) -> Dict:
        st = self.subtasks.get(subtask_id)
        if not st:
            return self.escalate_module_failure(subtask_id, "M00", "Subtask not found")

        # Check prerequisites
        module = st.module
        if module in MODULE_PREREQUISITES:
            for prereq in MODULE_PREREQUISITES[module]:
                has_prereq = any(
                    i.name == prereq or prereq in i.description.lower()
                    for i in st.inputs
                )
                if not has_prereq:
                    return self.clarification_request(
                        missing=[prereq],
                        defaults={
                            prereq: f"Required for {MODULE_NAMES[module]} -- please provide"
                        },
                    )

        st.status = SubtaskStatus.DISPATCHED
        self._log(
            f"Dispatched: {subtask_id} -> {module} ({MODULE_NAMES.get(module, 'unknown')})"
        )

        return {
            "output_type": OutputType.DISPATCH.value,
            "subtask_id": subtask_id,
            "module": module,
            "module_name": MODULE_NAMES.get(module, "unknown"),
            "stage": st.stage,
            "instruction": st.instruction,
            "inputs": [
                {"name": i.name, "source": i.source, "value": i.value}
                for i in st.inputs
            ],
            "expected_outputs": [
                {"name": o.name, "description": o.description} for o in st.outputs
            ],
            "constraints": st.constraints,
            "context": st.context + self.memory_context,
            "deadline": st.deadline.value,
            "dispatched_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Step 4: Receive module result ─────────────────────────────────────────

    def receive_result(
        self, subtask_id: str, result: Any, success: bool = True, error: str = ""
    ):
        st = self.subtasks.get(subtask_id)
        if not st:
            self._log(f"ERROR: result received for unknown subtask {subtask_id}")
            return

        if success:
            st.status = SubtaskStatus.COMPLETED
            st.result = result
            self._log(f"Completed: {subtask_id} -> result received")
            # Propagate result to dependent subtasks as context
            for other in self.subtasks.values():
                if subtask_id in other.depends_on:
                    for inp in other.inputs:
                        if inp.source == subtask_id and inp.value is None:
                            inp.value = result
        else:
            st.retry_count += 1
            if st.retry_count <= 2:
                st.status = SubtaskStatus.PENDING
                self._log(f"Retry {st.retry_count}/2: {subtask_id} -- {error}")
            else:
                st.status = SubtaskStatus.FAILED
                self._log(f"FAILED: {subtask_id} after 3 attempts -- {error}")

    # ── Step 5: Conflict detection ─────────────────────────────────────────────

    def detect_conflict(
        self,
        field: str,
        module_a: str,
        value_a: Any,
        module_b: str,
        value_b: Any,
        recommendation: str = "",
    ) -> Conflict:
        resolution = "SURFACED_TO_USER"
        c = Conflict(
            field=field,
            module_a=module_a,
            value_a=value_a,
            module_b=module_b,
            value_b=value_b,
            resolution=resolution,
            recommendation=recommendation,
        )
        self.conflicts.append(c)
        self._log(f"CONFLICT detected: {field} -- {module_a} vs {module_b}")
        return c

    # ── Step 6: Synthesize ────────────────────────────────────────────────────

    def synthesize(self, next_action: str = "") -> Dict:
        report_id = f"SR-{uuid.uuid4().hex[:8].upper()}"
        modules_used = list(
            {
                st.module
                for st in self.subtasks.values()
                if st.status == SubtaskStatus.COMPLETED
            }
        )
        stages_completed = len(
            set(
                st.stage
                for st in self.subtasks.values()
                if st.status == SubtaskStatus.COMPLETED
            )
        )
        null_outputs = [
            st_id
            for st_id, st in self.subtasks.items()
            if st.status != SubtaskStatus.COMPLETED
        ]

        self._log(
            f"Synthesis: {report_id} | Modules: {modules_used} | Null outputs: {null_outputs}"
        )

        return {
            "output_type": OutputType.SYNTHESIS_REPORT.value,
            "report_id": report_id,
            "session_id": self.session_id,
            "plan_id": self.plan_id,
            "goal": self.goal,
            "modules_used": modules_used,
            "stages_completed": stages_completed,
            "conflicts_resolved": sum(
                1 for c in self.conflicts if c.resolution != "SURFACED_TO_USER"
            ),
            "conflicts_surfaced": sum(
                1 for c in self.conflicts if c.resolution == "SURFACED_TO_USER"
            ),
            "conflicts": [c.to_dict() for c in self.conflicts],
            "deliverables": [d.to_dict() for d in self.deliverables],
            "null_outputs": null_outputs,
            "memory_writes": [
                {
                    "key": f"session:{self.session_id}",
                    "layer": "episodic",
                    "value": {
                        "goal": self.goal,
                        "modules": modules_used,
                        "routing_pattern": " -> ".join(modules_used),
                    },
                },
            ],
            "next_recommended_action": next_action,
            "execution_log": self.log,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Escalation helpers ────────────────────────────────────────────────────

    def escalate_out_of_scope(self, goal: str, reason: str, suggestion: str) -> Dict:
        self._log(f"ESCALATION OUT_OF_SCOPE: {reason}")
        return {
            "output_type": OutputType.ESCALATION.value,
            "escalation_type": "OUT_OF_SCOPE",
            "goal": goal,
            "reason": reason,
            "suggested_action": suggestion,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    def escalate_module_failure(self, subtask_id: str, module: str, error: str) -> Dict:
        self._log(f"ESCALATION MODULE_FAILURE: {module} / {subtask_id} -- {error}")
        return {
            "output_type": OutputType.ESCALATION.value,
            "escalation_type": "MODULE_FAILURE",
            "module": module,
            "subtask_id": subtask_id,
            "error": error,
            "recovery_options": [
                "Retry with modified instruction",
                "Route to fallback module",
                "Skip and flag in synthesis",
            ],
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    def clarification_request(self, missing: List[str], defaults: Dict) -> Dict:
        self._log(f"CLARIFICATION_REQUEST: missing {missing}")
        return {
            "output_type": OutputType.ESCALATION.value,
            "escalation_type": "AMBIGUOUS_GOAL",
            "missing_fields": missing,
            "assumed_defaults": defaults,
            "blocking": True,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    # ── Refinement: scope expansion ───────────────────────────────────────────

    def expand_scope(self, new_subtask: Subtask):
        self.subtasks[new_subtask.subtask_id] = new_subtask
        self.stages = self._build_dag(list(self.subtasks.values()))
        self.routing_changes.append(
            {
                "type": "RT-2",
                "subtask_id": new_subtask.subtask_id,
                "before": "NOT_IN_PLAN",
                "after": f"Stage {new_subtask.stage}",
                "trigger": "user_scope_expansion",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )
        self._log(
            f"Scope expanded: {new_subtask.subtask_id} added at stage {new_subtask.stage}"
        )

    # ── Serialization ─────────────────────────────────────────────────────────

    def to_session_record(self) -> Dict:
        return {
            "session_id": self.session_id,
            "plan_id": self.plan_id,
            "goal": self.goal,
            "goal_type": self.goal_type.value,
            "complexity": self.complexity.value,
            "modules_used": list({st.module for st in self.subtasks.values()}),
            "stages_completed": len(self.stages),
            "subtask_count": len(self.subtasks),
            "routing_changes": self.routing_changes,
            "conflicts": [c.to_dict() for c in self.conflicts],
            "deliverable_artifacts": [
                d.artifact for d in self.deliverables if isinstance(d.artifact, str)
            ],
            "routing_pattern": " -> ".join(
                list({st.module for st in self.subtasks.values()})
            ),
            "created_at": self.created_at,
            "completed_at": datetime.now(timezone.utc).isoformat(),
        }

    def to_envelope(self, job_id: str = None) -> "NasusEnvelope":
        """Wrap current orchestrator session state into a NasusEnvelope for sidecar response."""
        import uuid as _uuid

        env = NasusEnvelope(
            job_id=job_id or f"orch_{_uuid.uuid4().hex[:8]}",
            module_id=ModuleID.M00,
            payload=self.to_session_record(),
        )
        env.mark_done(self.to_session_record())
        return env

    def route_envelope(self, envelope: "NasusEnvelope") -> "NasusEnvelope":
        """
        Accept an incoming NasusEnvelope from the sidecar layer, validate it,
        dispatch to the appropriate module handler, and return a response envelope.

        Phase 2: When self.llm is available (injected after /configure), each
        module handler uses LLM reasoning. When self.llm is None the orchestrator
        falls back to pure-Python heuristics so the app keeps working without
        credentials.
        """
        envelope.mark_running()

        try:
            payload = envelope.payload or {}
            module_id = envelope.module_id

            if module_id == ModuleID.M10:
                # Task Planner — decompose a goal into a structured plan
                goal = payload.get("goal", "")
                if not goal:
                    raise ValueError("route_envelope: M10 requires payload.goal")
                if self.llm:
                    result_dict = self._llm_plan(goal, payload)
                else:
                    # Algorithmic fallback: build plan from any provided subtasks
                    subtasks = payload.get("subtasks", [])
                    result = self.build_plan(goal, subtasks)
                    result_dict = (
                        result
                        if isinstance(result, dict)
                        else (
                            result.to_dict() if hasattr(result, "to_dict") else result
                        )
                    )

            elif module_id == ModuleID.M11:
                # Quality Reviewer — score and approve/reject a module's output
                if self.llm:
                    result_dict = self._llm_review(payload)
                else:
                    result_dict = {
                        "status": "M11 requires LLM — call POST /configure with your API key first",
                        "module": "M11",
                        "verdict": "SKIPPED",
                    }

            elif module_id == ModuleID.M09:
                # Memory Manager — handled directly in app.py via MemoryStore;
                # this branch is a safety fallback if routed here by mistake.
                result_dict = {
                    "status": "M09 is handled by MemoryStore in app.py",
                    "module": "M09",
                }

            elif module_id == ModuleID.M00:
                # Full orchestration — when a goal is provided use LLM to build
                # a multi-module execution plan; otherwise return session status.
                goal = payload.get("goal", "")
                if goal and self.llm:
                    result_dict = self._llm_orchestrate(goal, payload)
                else:
                    result_dict = self.to_session_record()

            else:
                result_dict = {
                    "output_type": "OrchestratorClarification",
                    "escalation_type": "UNKNOWN_MODULE",
                    "message": f"No handler registered for module_id={module_id}",
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                }

            envelope.mark_done(result_dict)

        except Exception as exc:
            envelope.mark_failed(str(exc))

        return envelope

    # ── LLM-driven module handlers ────────────────────────────────────────────

    def _llm_plan(self, goal: str, payload: Dict) -> Dict:
        """
        Use the LLM to decompose a goal into a structured, ordered PlanBundle.
        Falls back to build_plan() if the LLM returns unparseable output.
        """
        context = payload.get("context", "")
        schema_hint = json.dumps(
            {
                "plan_id": "PLAN-xxxxxxxx",
                "goal": "the user goal restated clearly",
                "complexity": "LOW | MEDIUM | HIGH | CRITICAL",
                "steps": [
                    {
                        "step_id": "step_01",
                        "module": "M01 through M09",
                        "description": "exactly what this step does",
                        "inputs": ["list of concrete input names"],
                        "outputs": ["list of concrete output names"],
                        "depends_on": [],
                        "stage": 1,
                        "constraints": [],
                    }
                ],
                "open_questions": [],
                "risk_flags": [],
            },
            indent=2,
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are the Nasus Task Planner (M10). Decompose the user goal into an ordered "
                    "list of subtasks, each routed to exactly one specialist module.\n\n"
                    "Available modules:\n"
                    "  M01 — Research Analyst : web research, competitive intel, source retrieval\n"
                    "  M02 — API Integrator   : REST/GraphQL API calls, auth flows, webhooks\n"
                    "  M03 — Web Browser      : page scraping, form filling, JS-heavy sites\n"
                    "  M04 — Data Analyst     : CSV/JSON analysis, charts, statistics\n"
                    "  M05 — Code Engineer    : Python/JS/TS codegen, debugging, refactoring\n"
                    "  M06 — Content Creator  : copywriting, email drafts, social posts, docs\n"
                    "  M07 — Product Strategist: PRD, feature prioritization, market analysis\n"
                    "  M08 — Landing Page     : HTML/CSS/JS landing page, CRO optimization\n"
                    "  M09 — Memory Manager   : session state, cross-session recall\n\n"
                    "Rules:\n"
                    "  • Assign each step to exactly ONE module.\n"
                    "  • Use stage numbers for parallelism: same stage = can run in parallel.\n"
                    "  • depends_on lists step_ids that must complete before this step.\n"
                    "  • risk_flags: list irreversible or potentially destructive actions.\n"
                    "  • open_questions: list anything ambiguous that the user should clarify."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Goal: {goal}"
                    + (f"\n\nAdditional context:\n{context}" if context else "")
                ),
            },
        ]

        try:
            result = self.llm.chat_json(messages, schema_hint=schema_hint)
        except Exception as exc:
            self._log(
                f"_llm_plan: LLM call failed ({exc}), falling back to algorithmic planner"
            )
            return self.build_plan(goal, [])

        # Build internal Subtask objects from the LLM-produced step list
        steps = result.get("steps", [])
        subtasks: List[Subtask] = []
        for s in steps:
            st = Subtask(
                subtask_id=s.get("step_id", f"step_{uuid.uuid4().hex[:6]}"),
                module=s.get("module", "M01"),
                instruction=s.get("description", ""),
                inputs=[
                    SubtaskIO(name=i, description=i, source="user")
                    for i in s.get("inputs", [])
                ],
                outputs=[
                    SubtaskIO(
                        name=o,
                        description=o,
                        source=s.get("step_id", ""),
                    )
                    for o in s.get("outputs", [])
                ],
                depends_on=s.get("depends_on", []),
                deadline=Deadline.MEDIUM,
                stage=int(s.get("stage", 1)),
                constraints=s.get("constraints", []),
            )
            subtasks.append(st)

        plan = self.build_plan(goal, subtasks)
        plan["llm_generated"] = True
        plan["complexity_llm"] = result.get("complexity", plan.get("complexity"))
        plan["open_questions"] = result.get("open_questions", [])
        plan["risk_flags"] = result.get("risk_flags", [])
        return plan

    def _llm_review(self, payload: Dict) -> Dict:
        """
        Use the LLM to quality-review any module's output and return a structured verdict.
        """
        source_module = payload.get("source_module", "unknown")
        output_blob = payload.get("output", payload.get("content", ""))
        criteria = payload.get("criteria", [])

        if isinstance(output_blob, dict):
            output_str = json.dumps(output_blob, indent=2)
        else:
            output_str = str(output_blob)
        # Truncate to avoid filling the context window
        if len(output_str) > 6000:
            output_str = output_str[:6000] + "\n... [truncated]"

        schema_hint = json.dumps(
            {
                "verdict": "APPROVED | REVISE | REJECT",
                "quality_score": 0.0,
                "summary": "one-sentence summary of the review",
                "findings": [
                    {
                        "item": "description of finding",
                        "severity": "INFO | WARNING | ERROR",
                        "passed": True,
                    }
                ],
                "revision_requests": [
                    "specific change needed — only if verdict is REVISE"
                ],
                "reject_reason": "why rejected — only if verdict is REJECT",
            },
            indent=2,
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are the Nasus Quality Reviewer (M11). Analyse the provided module output "
                    "and return a structured review.\n\n"
                    "Scoring guide (quality_score 0.0–1.0):\n"
                    "  0.90–1.00 → APPROVED  (production ready)\n"
                    "  0.70–0.89 → REVISE    (good foundation, specific improvements needed)\n"
                    "  0.00–0.69 → REJECT    (fundamentally flawed or incomplete)\n\n"
                    "Be specific: name concrete issues, not vague criticism.\n"
                    "findings should enumerate every noteworthy observation."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Review the following output from module {source_module}:\n\n"
                    f"```\n{output_str}\n```"
                    + (
                        "\n\nAdditional review criteria:\n"
                        + "\n".join(f"  • {c}" for c in criteria)
                        if criteria
                        else ""
                    )
                ),
            },
        ]

        try:
            result = self.llm.chat_json(messages, schema_hint=schema_hint)
        except Exception as exc:
            return {
                "review_id": f"qr_{uuid.uuid4().hex[:8]}",
                "source_module": source_module,
                "verdict": "SKIPPED",
                "quality_score": 0.0,
                "summary": f"LLM call failed: {exc}",
                "findings": [],
                "revision_requests": [],
                "reject_reason": "",
                "error": str(exc),
            }

        result["review_id"] = f"qr_{uuid.uuid4().hex[:8]}"
        result["source_module"] = source_module
        result.setdefault("findings", [])
        result.setdefault("revision_requests", [])
        result.setdefault("reject_reason", "")
        return result

    def _llm_orchestrate(self, goal: str, payload: Dict) -> Dict:
        """
        Use the LLM to build a full multi-module execution plan for a complex goal.
        Calls _llm_plan internally but wraps the result in an orchestration report
        with memory-write directives and a recommended next action.
        """
        plan = self._llm_plan(goal, payload)

        # Extract modules involved from the plan steps
        steps = plan.get("subtasks", plan.get("steps", []))
        modules_involved = list(
            {s.get("module", s.get("module_id", "")) for s in steps}
        )

        schema_hint = json.dumps(
            {
                "next_recommended_action": "one concrete sentence: what to do immediately after this plan",
                "memory_key": "short snake_case key for storing this goal in memory",
                "execution_notes": [
                    "any important orchestration notes for the executor"
                ],
            },
            indent=2,
        )

        messages = [
            {
                "role": "system",
                "content": (
                    "You are the Nasus Orchestrator (M00). Given a decomposed execution plan, "
                    "provide orchestration guidance: the single most important next action, "
                    "a memory storage key, and any execution notes the agent runner should know."
                ),
            },
            {
                "role": "user",
                "content": (
                    f"Goal: {goal}\n\n"
                    f"Modules involved: {', '.join(modules_involved)}\n"
                    f"Step count: {len(steps)}\n\n"
                    "Provide orchestration guidance."
                ),
            },
        ]

        try:
            guidance = self.llm.chat_json(messages, schema_hint=schema_hint)
        except Exception as exc:
            self._log(
                f"_llm_orchestrate: guidance LLM call failed ({exc}), using defaults"
            )
            guidance = {
                "next_recommended_action": "Execute the plan steps in stage order.",
                "memory_key": f"goal_{uuid.uuid4().hex[:6]}",
                "execution_notes": [],
            }

        plan["output_type"] = "ORCHESTRATION_PLAN"
        plan["session_id"] = self.session_id
        plan["modules_involved"] = modules_involved
        plan["next_recommended_action"] = guidance.get("next_recommended_action", "")
        plan["memory_writes"] = [
            {
                "key": guidance.get("memory_key", f"goal_{self.session_id}"),
                "layer": "session",
                "value": {"goal": goal, "modules": modules_involved},
                "source_module": "M00",
            }
        ]
        plan["execution_notes"] = guidance.get("execution_notes", [])
        return plan


if __name__ == "__main__":
    print("Nasus Orchestrator Core -- Prototype v1.0")
    orch = NasusOrchestrator()
    print(f"Session: {orch.session_id}")
    print(f"Modules registered: {list(MODULE_NAMES.values())}")
    print("Ready.")
