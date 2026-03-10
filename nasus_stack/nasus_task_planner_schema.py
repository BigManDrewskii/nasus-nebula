"""
NASUS TASK PLANNER — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 11 | Stack: Nasus Sub-Agent Network

Dataclasses covering all Task Planner output types:
- PlanStep (individual step in a plan)
- PlanBundle (full execution plan)
- ClarificationRequest (when inputs are ambiguous/missing)
- PlanError (out-of-scope or contradictory goals)
- BlockingQuestion (sub-element of ClarificationRequest)
- PlanRevision (surgical edit to a prior plan)
- Full JSON serialization, validation, and round-trip helpers
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from typing import Optional, List, Literal, Dict, Any
from enum import Enum
import json
import uuid
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class Complexity(str, Enum):
    ATOMIC = "ATOMIC"
    COMPOUND = "COMPOUND"
    COMPLEX = "COMPLEX"


class Ambiguity(str, Enum):
    CLEAR = "CLEAR"
    AMBIGUOUS = "AMBIGUOUS"
    PARTIAL = "PARTIAL"


class Scope(str, Enum):
    NARROW = "NARROW"
    BROAD = "BROAD"
    UNBOUNDED = "UNBOUNDED"


class Duration(str, Enum):
    FAST = "FAST"          # < 5 min
    MEDIUM = "MEDIUM"      # 5-20 min
    SLOW = "SLOW"          # 20-60 min
    EXTENDED = "EXTENDED"  # > 60 min


class TokenBudget(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    VERY_HIGH = "very_high"


# ModuleID imported from shared registry (GAP-03 / GAP-10 fix)
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus  # noqa: F401


MODULE_NAMES: Dict[str, str] = {
    "M01": "Research Analyst",
    "M02": "API Integrator",
    "M03": "Web Browser",
    "M04": "Data Analyst",
    "M05": "Code Engineer",
    "M06": "Content Creator",
    "M07": "Product Strategist",
    "M08": "Landing Page",
    "M09": "Memory Manager",
    "M10": "Orchestrator Core",
}


class RiskFlag(str, Enum):
    MISSING_INPUT = "MISSING_INPUT"
    EXTERNAL_DEPENDENCY = "EXTERNAL_DEPENDENCY"
    QUALITY_GATE_REQUIRED = "QUALITY_GATE_REQUIRED"
    TOKEN_INTENSIVE = "TOKEN_INTENSIVE"
    HALLUCINATION_RISK = "HALLUCINATION_RISK"
    IRREVERSIBLE_ACTION = "IRREVERSIBLE_ACTION"
    RATE_LIMIT_RISK = "RATE_LIMIT_RISK"
    LONG_RUNNING = "LONG_RUNNING"


class InputSource(str, Enum):
    USER = "user"
    # step:{step_id} and memory:{key} and external:{name} are handled as strings


class ErrorCode(str, Enum):
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    CONTRADICTORY_INPUTS = "CONTRADICTORY_INPUTS"
    CIRCULAR_DEPENDENCY = "CIRCULAR_DEPENDENCY"
    UNSUPPORTED_CAPABILITY = "UNSUPPORTED_CAPABILITY"


class OutputType(str, Enum):
    PLAN_BUNDLE = "PlanBundle"
    CLARIFICATION_REQUEST = "ClarificationRequest"
    PLAN_ERROR = "PlanError"
    PLAN_REVISION = "PlanRevision"


# ---------------------------------------------------------------------------
# CONDITION BLOCK
# ---------------------------------------------------------------------------

@dataclass
class ConditionOn:
    """Conditional execution gate for a step."""
    step_id: str
    condition_value: str  # e.g. "success", "output_not_empty", "confidence>0.8"

    def to_dict(self) -> Dict[str, Any]:
        return {"step_id": self.step_id, "condition_value": self.condition_value}

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ConditionOn":
        try:
            return cls(step_id=d["step_id"], condition_value=d["condition_value"])
        except KeyError as e:
            raise ValueError(f"ConditionOn.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# PLAN STEP
# ---------------------------------------------------------------------------

@dataclass
class PlanStep:
    """
    A single unit of work in a PlanBundle.
    Maps to exactly one Nasus module.
    """
    step_id: str
    module_id: str                          # M01-M10
    module_name: str                        # human-readable
    description: str                        # 1-sentence action description
    input_source: str                       # "user" | "step:s01" | "memory:key" | "external:name"
    input_artifacts: List[str]              # named inputs consumed
    output_artifact: str                    # named output produced
    depends_on: List[str]                   # step_ids this step waits for
    parallel: bool                          # can run in parallel with sibling steps
    condition_on: Optional[ConditionOn]     # conditional execution gate
    memory_store: bool                      # persist output via M09
    estimated_tokens: str                   # low | medium | high | very_high
    confidence: float                       # 0.0-1.0
    risk_flags: List[str]                   # from RiskFlag enum

    def validate(self) -> List[str]:
        errors: List[str] = []
        if not self.step_id.startswith("s") or not self.step_id[1:].isdigit():
            errors.append(f"step_id '{self.step_id}' must match pattern sNN")
        if self.module_id not in [m.value for m in ModuleID]:
            errors.append(f"module_id '{self.module_id}' is not a valid Nasus module")
        if not (0.0 <= self.confidence <= 1.0):
            errors.append(f"confidence {self.confidence} out of range [0.0, 1.0]")
        if self.confidence < 0.30:
            errors.append(f"confidence {self.confidence} below minimum threshold 0.30")
        if not self.description.strip():
            errors.append("description must not be empty")
        if not self.output_artifact.strip():
            errors.append("output_artifact must not be empty")
        if self.estimated_tokens not in [t.value for t in TokenBudget]:
            errors.append(f"estimated_tokens '{self.estimated_tokens}' must be one of low/medium/high/very_high")
        for flag in self.risk_flags:
            if flag not in [r.value for r in RiskFlag]:
                errors.append(f"risk_flag '{flag}' is not in the standard taxonomy")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_id": self.step_id,
            "module_id": self.module_id,
            "module_name": self.module_name,
            "description": self.description,
            "input_source": self.input_source,
            "input_artifacts": self.input_artifacts,
            "output_artifact": self.output_artifact,
            "depends_on": self.depends_on,
            "parallel": self.parallel,
            "condition_on": self.condition_on.to_dict() if self.condition_on else None,
            "memory_store": self.memory_store,
            "estimated_tokens": self.estimated_tokens,
            "confidence": self.confidence,
            "risk_flags": self.risk_flags,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "PlanStep":
        try:
            cond = d.get("condition_on")
            return cls(
                step_id=d["step_id"],
                module_id=d["module_id"],
                module_name=d["module_name"],
                description=d["description"],
                input_source=d["input_source"],
                input_artifacts=d.get("input_artifacts", []),
                output_artifact=d["output_artifact"],
                depends_on=d.get("depends_on", []),
                parallel=d.get("parallel", False),
                condition_on=ConditionOn.from_dict(cond) if cond else None,
                memory_store=d.get("memory_store", False),
                estimated_tokens=d.get("estimated_tokens", "medium"),
                confidence=d["confidence"],
                risk_flags=d.get("risk_flags", []),
            )
        except KeyError as e:
            raise ValueError(f"PlanStep.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# PLAN BUNDLE
# ---------------------------------------------------------------------------

@dataclass
class PlanBundle:
    """
    Full execution plan emitted by the Task Planner.
    Consumed directly by the Orchestrator Core (M10).
    """
    goal: str
    complexity: str                    # Complexity enum value
    ambiguity: str                     # Ambiguity enum value
    scope: str                         # Scope enum value
    steps: List[PlanStep]
    assumptions: List[str] = field(default_factory=list)
    open_questions: List[str] = field(default_factory=list)
    plan_id: str = field(default_factory=lambda: f"plan_{uuid.uuid4().hex[:12]}")
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    # Computed fields (auto-derived on validate)
    total_steps: int = field(init=False, default=0)
    parallel_tracks: int = field(init=False, default=0)
    critical_path: List[str] = field(init=False, default_factory=list)
    estimated_duration: str = field(init=False, default="FAST")

    def __post_init__(self):
        self._compute_derived()

    def _compute_derived(self):
        """Compute total_steps, parallel_tracks, critical_path, estimated_duration."""
        self.total_steps = len(self.steps)

        # Count parallel tracks: number of steps with parallel=True + 1 base track
        parallel_count = sum(1 for s in self.steps if s.parallel)
        self.parallel_tracks = max(1, parallel_count)

        # Critical path: longest dependency chain
        self.critical_path = self._find_critical_path()

        # Duration: based on critical path length and token budgets
        cp_steps = [s for s in self.steps if s.step_id in self.critical_path]
        high_budget = sum(1 for s in cp_steps if s.estimated_tokens in ("high", "very_high"))
        cp_len = len(self.critical_path)

        if cp_len == 1 and high_budget == 0:
            self.estimated_duration = Duration.FAST.value
        elif cp_len <= 3 and high_budget <= 1:
            self.estimated_duration = Duration.MEDIUM.value
        elif cp_len <= 6 or high_budget <= 3:
            self.estimated_duration = Duration.SLOW.value
        else:
            self.estimated_duration = Duration.EXTENDED.value

    def _find_critical_path(self) -> List[str]:
        """Return the longest dependency chain as ordered list of step_ids.
        Cycle-safe: if a cycle is detected mid-traversal, that branch returns []
        so _has_circular_dependency() can report it cleanly via validate().
        """
        step_map = {s.step_id: s for s in self.steps}

        def depth(step_id: str, memo: Dict[str, List[str]], visiting: set) -> List[str]:
            if step_id in memo:
                return memo[step_id]
            # Cycle guard -- return empty so this branch contributes nothing
            if step_id in visiting:
                return []
            step = step_map.get(step_id)
            if not step or not step.depends_on:
                memo[step_id] = [step_id]
                return [step_id]
            visiting.add(step_id)
            best: List[str] = []
            for dep in step.depends_on:
                path = depth(dep, memo, visiting)
                if len(path) > len(best):
                    best = path
            visiting.discard(step_id)
            result = best + [step_id]
            memo[step_id] = result
            return result

        memo: Dict[str, List[str]] = {}
        longest: List[str] = []
        for step in self.steps:
            path = depth(step.step_id, memo, set())
            if len(path) > len(longest):
                longest = path
        return longest

    def validate(self) -> List[str]:
        errors: List[str] = []

        # Validate each step
        seen_ids: set = set()
        seen_artifacts: set = set()
        for step in self.steps:
            step_errors = step.validate()
            errors.extend([f"[{step.step_id}] {e}" for e in step_errors])
            if step.step_id in seen_ids:
                errors.append(f"Duplicate step_id: {step.step_id}")
            seen_ids.add(step.step_id)
            if step.output_artifact in seen_artifacts:
                errors.append(f"Duplicate output_artifact: {step.output_artifact} (step {step.step_id})")
            seen_artifacts.add(step.output_artifact)

        # Validate depends_on references
        for step in self.steps:
            for dep in step.depends_on:
                if dep not in seen_ids:
                    errors.append(f"[{step.step_id}] depends_on '{dep}' not found in plan")

        # Detect circular dependencies
        if self._has_circular_dependency():
            errors.append("CIRCULAR_DEPENDENCY detected in depends_on chains")

        # Validate complexity enum
        if self.complexity not in [c.value for c in Complexity]:
            errors.append(f"complexity '{self.complexity}' is invalid")

        # Validate ambiguity / open_questions consistency
        if self.ambiguity == Ambiguity.PARTIAL.value and not self.open_questions:
            errors.append("ambiguity=PARTIAL requires at least one open_question")

        # Validate scope
        if self.scope == Scope.UNBOUNDED.value:
            errors.append("scope=UNBOUNDED is not allowed in a PlanBundle — use ClarificationRequest")

        # Check irreversible actions have trailing M09 step
        for i, step in enumerate(self.steps):
            if RiskFlag.IRREVERSIBLE_ACTION.value in step.risk_flags:
                # Check if there's an M09 step after this one that depends on it
                has_audit = any(
                    s.module_id == ModuleID.M09.value and step.step_id in s.depends_on
                    for s in self.steps[i+1:]
                )
                if not has_audit:
                    errors.append(f"[{step.step_id}] IRREVERSIBLE_ACTION requires a trailing M09 audit step")

        # Token intensity check
        cp_steps = [s for s in self.steps if s.step_id in self.critical_path]
        very_high_cp = [s for s in cp_steps if s.estimated_tokens == TokenBudget.VERY_HIGH.value]
        if len(very_high_cp) >= 2:
            missing_flag = [s for s in very_high_cp if RiskFlag.TOKEN_INTENSIVE.value not in s.risk_flags]
            if missing_flag:
                errors.append(f"Steps {[s.step_id for s in missing_flag]} need TOKEN_INTENSIVE risk flag")

        return errors

    def _has_circular_dependency(self) -> bool:
        """DFS cycle detection on the dependency graph."""
        step_map = {s.step_id: s for s in self.steps}
        visited: set = set()
        rec_stack: set = set()

        def dfs(node: str) -> bool:
            visited.add(node)
            rec_stack.add(node)
            step = step_map.get(node)
            if step:
                for dep in step.depends_on:
                    if dep not in visited:
                        if dfs(dep):
                            return True
                    elif dep in rec_stack:
                        return True
            rec_stack.discard(node)
            return False

        for step_id in step_map:
            if step_id not in visited:
                if dfs(step_id):
                    return True
        return False

    def to_dict(self) -> Dict[str, Any]:
        self._compute_derived()
        return {
            "output_type": OutputType.PLAN_BUNDLE.value,
            "plan_id": self.plan_id,
            "goal": self.goal,
            "complexity": self.complexity,
            "ambiguity": self.ambiguity,
            "scope": self.scope,
            "total_steps": self.total_steps,
            "parallel_tracks": self.parallel_tracks,
            "critical_path": self.critical_path,
            "estimated_duration": self.estimated_duration,
            "assumptions": self.assumptions,
            "open_questions": self.open_questions,
            "created_at": self.created_at,
            "steps": [s.to_dict() for s in self.steps],
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "PlanBundle":
        try:
            steps = [PlanStep.from_dict(s) for s in d.get("steps", [])]
            bundle = cls(
                goal=d["goal"],
                complexity=d["complexity"],
                ambiguity=d["ambiguity"],
                scope=d["scope"],
                steps=steps,
                assumptions=d.get("assumptions", []),
                open_questions=d.get("open_questions", []),
                plan_id=d.get("plan_id", f"plan_{uuid.uuid4().hex[:12]}"),
                created_at=d.get("created_at", datetime.now(timezone.utc).isoformat()),
            )
            return bundle
        except KeyError as e:
            raise ValueError(f"PlanBundle.from_dict: missing required field {e}") from e
    @classmethod
    def from_json(cls, json_str: str) -> "PlanBundle":
        return cls.from_dict(json.loads(json_str))


# ---------------------------------------------------------------------------
# BLOCKING QUESTION
# ---------------------------------------------------------------------------

@dataclass
class BlockingQuestion:
    """A single clarification question inside a ClarificationRequest."""
    question_id: str         # q01, q02, ...
    question: str            # the actual question text
    why_needed: str          # explains which module/step needs this
    acceptable_answer_format: str  # e.g. "string", "persona dict", "URL", "one of: A/B/C"

    def validate(self) -> List[str]:
        errors: List[str] = []
        if not self.question_id.startswith("q"):
            errors.append(f"question_id '{self.question_id}' must start with 'q'")
        if not self.question.strip():
            errors.append("question must not be empty")
        if not self.why_needed.strip():
            errors.append("why_needed must not be empty")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "question_id": self.question_id,
            "question": self.question,
            "why_needed": self.why_needed,
            "acceptable_answer_format": self.acceptable_answer_format,
        }

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "BlockingQuestion":
        try:
            return cls(
                question_id=d["question_id"],
                question=d["question"],
                why_needed=d["why_needed"],
                acceptable_answer_format=d.get("acceptable_answer_format", "string"),
            )
        except KeyError as e:
            raise ValueError(f"BlockingQuestion.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# CLARIFICATION REQUEST
# ---------------------------------------------------------------------------

# NOTE: This ClarificationRequest wraps BlockingQuestion objects (task planner output).
# It is DISTINCT from orchestrator_schema.OrchestratorClarification (EscalationType wrapper).
# output_type string: "ClarificationRequest"
@dataclass
class ClarificationRequest:
    """
    Emitted when goal is AMBIGUOUS, PARTIAL, or UNBOUNDED.
    Blocks plan emission until questions are answered.
    """
    goal: str
    reason: str                             # "AMBIGUOUS" | "UNBOUNDED" | "PARTIAL"
    blocking_questions: List[BlockingQuestion]
    partial_plan_available: bool = False
    partial_plan_steps: int = 0
    plan_id: str = field(default_factory=lambda: f"clarify_{uuid.uuid4().hex[:12]}")
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def validate(self) -> List[str]:
        errors: List[str] = []
        if not self.blocking_questions:
            errors.append("ClarificationRequest must have at least one blocking_question")
        for q in self.blocking_questions:
            errors.extend(q.validate())
        valid_reasons = {"AMBIGUOUS", "UNBOUNDED", "PARTIAL"}
        if self.reason not in valid_reasons:
            errors.append(f"reason '{self.reason}' must be one of {valid_reasons}")
        if self.partial_plan_available and self.partial_plan_steps <= 0:
            errors.append("partial_plan_steps must be > 0 when partial_plan_available=True")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "output_type": OutputType.CLARIFICATION_REQUEST.value,
            "plan_id": self.plan_id,
            "goal": self.goal,
            "reason": self.reason,
            "blocking_questions": [q.to_dict() for q in self.blocking_questions],
            "partial_plan_available": self.partial_plan_available,
            "partial_plan_steps": self.partial_plan_steps,
            "created_at": self.created_at,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "ClarificationRequest":
        try:
            questions = [BlockingQuestion.from_dict(q) for q in d.get("blocking_questions", [])]
            return cls(
                goal=d["goal"],
                reason=d["reason"],
                blocking_questions=questions,
                partial_plan_available=d.get("partial_plan_available", False),
                partial_plan_steps=d.get("partial_plan_steps", 0),
                plan_id=d.get("plan_id", f"clarify_{uuid.uuid4().hex[:12]}"),
                created_at=d.get("created_at", datetime.now(timezone.utc).isoformat()),
            )
        except KeyError as e:
            raise ValueError(f"ClarificationRequest.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# PLAN ERROR
# ---------------------------------------------------------------------------

@dataclass
class PlanError:
    """
    Emitted when a goal cannot be planned at all.
    Used for circular deps, out-of-scope goals, or contradictions.
    """
    goal: str
    error_code: str            # ErrorCode enum value
    error_detail: str          # human-readable explanation
    suggested_reframe: str     # what the user could ask instead
    plan_id: str = field(default_factory=lambda: f"error_{uuid.uuid4().hex[:12]}")
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def validate(self) -> List[str]:
        errors: List[str] = []
        if self.error_code not in [e.value for e in ErrorCode]:
            errors.append(f"error_code '{self.error_code}' is not valid")
        if not self.error_detail.strip():
            errors.append("error_detail must not be empty")
        if not self.suggested_reframe.strip():
            errors.append("suggested_reframe must not be empty")
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "output_type": OutputType.PLAN_ERROR.value,
            "plan_id": self.plan_id,
            "goal": self.goal,
            "error_code": self.error_code,
            "error_detail": self.error_detail,
            "suggested_reframe": self.suggested_reframe,
            "created_at": self.created_at,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "PlanError":
        try:
            return cls(
                goal=d["goal"],
                error_code=d["error_code"],
                error_detail=d["error_detail"],
                suggested_reframe=d["suggested_reframe"],
                plan_id=d.get("plan_id", f"error_{uuid.uuid4().hex[:12]}"),
                created_at=d.get("created_at", datetime.now(timezone.utc).isoformat()),
            )
        except KeyError as e:
            raise ValueError(f"PlanError.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# PLAN REVISION
# ---------------------------------------------------------------------------

@dataclass
class StepEdit:
    """Describes a single surgical edit to an existing plan step."""
    operation: Literal["add", "remove", "modify"]
    step_id: str
    reason: str
    new_step: Optional[PlanStep] = None      # for add/modify
    original_step: Optional[PlanStep] = None  # for remove/modify (before state)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "operation": self.operation,
            "step_id": self.step_id,
            "reason": self.reason,
            "new_step": self.new_step.to_dict() if self.new_step else None,
            "original_step": self.original_step.to_dict() if self.original_step else None,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "StepEdit":
        try:
            return cls(
                operation=d["operation"],
                step_id=d["step_id"],
                reason=d["reason"],
                new_step=PlanStep.from_dict(d["new_step"]) if d.get("new_step") else None,
                original_step=PlanStep.from_dict(d["original_step"]) if d.get("original_step") else None,
            )
        except KeyError as e:
            raise ValueError(f"StepEdit.from_dict: missing required field {e}") from e
@dataclass
class PlanRevision:
    """
    Surgical edit to an existing PlanBundle.
    Emitted when user refines a prior plan (e.g. 'skip the research step').
    """
    source_plan_id: str
    goal: str
    revision_reason: str
    edits: List[StepEdit]
    revised_plan: PlanBundle
    plan_id: str = field(default_factory=lambda: f"revision_{uuid.uuid4().hex[:12]}")
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def validate(self) -> List[str]:
        errors: List[str] = []
        if not self.edits:
            errors.append("PlanRevision must contain at least one StepEdit")
        if not self.source_plan_id.strip():
            errors.append("source_plan_id must not be empty")
        errors.extend(self.revised_plan.validate())
        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "output_type": OutputType.PLAN_REVISION.value,
            "plan_id": self.plan_id,
            "source_plan_id": self.source_plan_id,
            "goal": self.goal,
            "revision_reason": self.revision_reason,
            "edits": [e.to_dict() for e in self.edits],
            "revised_plan": self.revised_plan.to_dict(),
            "created_at": self.created_at,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d):
        try:
            return cls(
                plan_id=d.get("plan_id", f"revision_{uuid.uuid4().hex[:12]}"),
                source_plan_id=d["source_plan_id"],
                goal=d["goal"],
                revision_reason=d["revision_reason"],
                edits=[StepEdit.from_dict(e) for e in d.get("edits", [])],
                revised_plan=PlanBundle.from_dict(d["revised_plan"]),
                created_at=d.get("created_at", ""),
            )
        except KeyError as e:
            raise ValueError(f"PlanRevision.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# UNIVERSAL DESERIALIZER
# ---------------------------------------------------------------------------

def parse_planner_output(raw):
    """
    Parse any Task Planner output from JSON string or dict.
    Returns the correct typed object based on output_type field.
    """
    if isinstance(raw, str):
        d = json.loads(raw)
    else:
        d = raw

    output_type = d.get("output_type")
    if output_type == OutputType.PLAN_BUNDLE.value:
        return PlanBundle.from_dict(d)
    elif output_type == OutputType.CLARIFICATION_REQUEST.value:
        return ClarificationRequest.from_dict(d)
    elif output_type == OutputType.PLAN_ERROR.value:
        return PlanError.from_dict(d)
    else:
        raise ValueError(f"Unknown output_type: '{output_type}'")


# ---------------------------------------------------------------------------
# VALIDATION RUNNER
# ---------------------------------------------------------------------------

def validate_planner_output(obj) -> Dict[str, Any]:
    """
    Run validation on any planner output object.
    Returns dict with passed (bool), error_count (int), errors (list).
    """
    errors = obj.validate()
    return {
        "passed": len(errors) == 0,
        "error_count": len(errors),
        "errors": errors,
        "output_type": obj.to_dict().get("output_type"),
        "plan_id": obj.to_dict().get("plan_id"),
    }


# ---------------------------------------------------------------------------
# ENVELOPE WRAPPER
# ---------------------------------------------------------------------------

def wrap_in_envelope(obj, job_id=None):
    """Wrap any planner output in a NasusEnvelope for orchestrator routing. (GAP-12 fix)"""
    import uuid as _uuid
    env = NasusEnvelope(
        job_id=job_id or f"tp_{_uuid.uuid4().hex[:8]}",
        module_id=ModuleID.M10,
        payload=obj.to_dict(),
    )
    env.mark_done(obj.to_dict())
    return env


# ---------------------------------------------------------------------------
# VALIDATION TEST SUITE
# ---------------------------------------------------------------------------

def run_validation_tests() -> Dict[str, Any]:
    results = {}
    passed = 0
    failed = 0

    # --- Test 1: Valid ATOMIC PlanBundle ---
    try:
        step = PlanStep(
            step_id="s01",
            module_id="M06",
            module_name="Content Creator",
            description="Write a 150-word product description for a SaaS invoicing tool",
            input_source="user",
            input_artifacts=["product_brief"],
            output_artifact="product_description",
            depends_on=[],
            parallel=False,
            condition_on=None,
            memory_store=False,
            estimated_tokens="low",
            confidence=0.97,
            risk_flags=[],
        )
        bundle = PlanBundle(
            goal="Write a product description for a SaaS invoicing tool",
            complexity="ATOMIC",
            ambiguity="CLEAR",
            scope="NARROW",
            steps=[step],
        )
        errs = bundle.validate()
        if not errs:
            results["T01_atomic_bundle"] = "PASS"
            passed += 1
        else:
            results["T01_atomic_bundle"] = f"FAIL: {errs}"
            failed += 1
    except Exception as e:
        results["T01_atomic_bundle"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 2: COMPOUND PlanBundle with parallel steps ---
    try:
        s1 = PlanStep("s01","M01","Research Analyst","Research top 3 competitors","user",
                      ["industry_context"],"competitor_report",[],False,None,True,"medium",0.88,["MISSING_INPUT"])
        s2 = PlanStep("s02","M07","Product Strategist","Derive differentiation positioning","step:s01",
                      ["competitor_report"],"positioning_framework",["s01"],False,None,True,"medium",0.91,[])
        s3 = PlanStep("s03","M06","Content Creator","Write landing page copy","step:s02",
                      ["positioning_framework"],"landing_page_copy",["s02"],True,None,False,"medium",0.93,[])
        s4 = PlanStep("s04","M08","Landing Page","Build full HTML landing page","step:s02",
                      ["positioning_framework","landing_page_copy"],"landing_page_html",["s02","s03"],False,None,False,"very_high",0.89,["QUALITY_GATE_REQUIRED"])
        bundle2 = PlanBundle(
            goal="Research competitors and build a differentiated landing page",
            complexity="COMPOUND",
            ambiguity="PARTIAL",
            scope="NARROW",
            steps=[s1, s2, s3, s4],
            open_questions=["What is the product name and primary value proposition?"],
        )
        errs = bundle2.validate()
        if not errs:
            results["T02_compound_bundle"] = "PASS"
            passed += 1
        else:
            results["T02_compound_bundle"] = f"FAIL: {errs}"
            failed += 1
    except Exception as e:
        results["T02_compound_bundle"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 3: ClarificationRequest ---
    try:
        q1 = BlockingQuestion("q01","Who is the target audience?","M08 requires audience for CTA copy","string or persona dict")
        q2 = BlockingQuestion("q02","What is the product name?","M06 and M08 need product name in copy","string")
        clarify = ClarificationRequest(
            goal="landing page",
            reason="AMBIGUOUS",
            blocking_questions=[q1, q2],
            partial_plan_available=False,
        )
        errs = clarify.validate()
        if not errs:
            results["T03_clarification_request"] = "PASS"
            passed += 1
        else:
            results["T03_clarification_request"] = f"FAIL: {errs}"
            failed += 1
    except Exception as e:
        results["T03_clarification_request"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 4: PlanError ---
    try:
        err = PlanError(
            goal="Send a Slack message with the results",
            error_code="UNSUPPORTED_CAPABILITY",
            error_detail="Sending Slack messages is not available in M01-M10",
            suggested_reframe="M06 can draft the Slack message text -- sending requires a channel integration",
        )
        errs = err.validate()
        if not errs:
            results["T04_plan_error"] = "PASS"
            passed += 1
        else:
            results["T04_plan_error"] = f"FAIL: {errs}"
            failed += 1
    except Exception as e:
        results["T04_plan_error"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 5: Circular dependency detection ---
    try:
        s1 = PlanStep("s01","M01","Research Analyst","Step 1","user",[],"out_s01",["s03"],False,None,False,"low",0.90,[])
        s2 = PlanStep("s02","M06","Content Creator","Step 2","step:s01",[],"out_s02",["s01"],False,None,False,"low",0.90,[])
        s3 = PlanStep("s03","M07","Product Strategist","Step 3","step:s02",[],"out_s03",["s02"],False,None,False,"low",0.90,[])
        bundle3 = PlanBundle(goal="Circular test",complexity="COMPOUND",ambiguity="CLEAR",scope="NARROW",steps=[s1,s2,s3])
        errs = bundle3.validate()
        if any("CIRCULAR" in e for e in errs):
            results["T05_circular_dependency"] = "PASS"
            passed += 1
        else:
            results["T05_circular_dependency"] = f"FAIL: circular not detected. Errors: {errs}"
            failed += 1
    except Exception as e:
        results["T05_circular_dependency"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 6: Duplicate artifact detection ---
    try:
        s1 = PlanStep("s01","M01","Research Analyst","Step 1","user",[],"shared_artifact",[],False,None,False,"low",0.90,[])
        s2 = PlanStep("s02","M06","Content Creator","Step 2","user",[],"shared_artifact",[],False,None,False,"low",0.90,[])
        bundle4 = PlanBundle(goal="Duplicate artifact test",complexity="COMPOUND",ambiguity="CLEAR",scope="NARROW",steps=[s1,s2])
        errs = bundle4.validate()
        if any("Duplicate output_artifact" in e for e in errs):
            results["T06_duplicate_artifact"] = "PASS"
            passed += 1
        else:
            results["T06_duplicate_artifact"] = f"FAIL: duplicate not detected. Errors: {errs}"
            failed += 1
    except Exception as e:
        results["T06_duplicate_artifact"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 7: JSON round-trip ---
    try:
        step = PlanStep("s01","M04","Data Analyst","Analyze sales CSV","user",["sales.csv"],"sales_insights",[],False,None,True,"high",0.85,["EXTERNAL_DEPENDENCY"])
        bundle = PlanBundle(goal="Analyze sales data",complexity="ATOMIC",ambiguity="CLEAR",scope="NARROW",steps=[step])
        json_str = bundle.to_json()
        restored = PlanBundle.from_json(json_str)
        assert restored.goal == bundle.goal
        assert len(restored.steps) == 1
        assert restored.steps[0].step_id == "s01"
        results["T07_json_roundtrip"] = "PASS"
        passed += 1
    except Exception as e:
        results["T07_json_roundtrip"] = f"FAIL: {e}"
        failed += 1

    # --- Test 8: IRREVERSIBLE_ACTION requires M09 audit step ---
    try:
        s1 = PlanStep("s01","M06","Content Creator","Draft email","user",[],"email_draft",[],False,None,False,"medium",0.92,[])
        s2 = PlanStep("s02","M02","API Integrator","Send email via API","step:s01",["email_draft"],"send_confirmation",["s01"],False,None,False,"low",0.88,["IRREVERSIBLE_ACTION"])
        # Missing M09 audit step -- should fail
        bundle5 = PlanBundle(goal="Send email",complexity="COMPOUND",ambiguity="CLEAR",scope="NARROW",steps=[s1,s2])
        errs = bundle5.validate()
        if any("IRREVERSIBLE_ACTION" in e and "M09" in e for e in errs):
            results["T08_irreversible_needs_m09"] = "PASS"
            passed += 1
        else:
            results["T08_irreversible_needs_m09"] = f"FAIL: missing M09 check not caught. Errors: {errs}"
            failed += 1
    except Exception as e:
        results["T08_irreversible_needs_m09"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 9: Low confidence step rejection ---
    try:
        step = PlanStep("s01","M01","Research Analyst","Step with low confidence","user",[],"output",[],False,None,False,"low",0.25,[])
        errs = step.validate()
        if any("0.25" in e or "minimum threshold" in e for e in errs):
            results["T09_low_confidence_rejection"] = "PASS"
            passed += 1
        else:
            results["T09_low_confidence_rejection"] = f"FAIL: low confidence not caught. Errors: {errs}"
            failed += 1
    except Exception as e:
        results["T09_low_confidence_rejection"] = f"EXCEPTION: {e}"
        failed += 1

    # --- Test 10: parse_planner_output universal deserializer ---
    try:
        step = PlanStep("s01","M05","Code Engineer","Write Python utility","user",["spec"],"utility_script",[],False,None,False,"medium",0.94,[])
        bundle = PlanBundle(goal="Write a utility",complexity="ATOMIC",ambiguity="CLEAR",scope="NARROW",steps=[step])
        json_str = bundle.to_json()
        obj = parse_planner_output(json_str)
        assert isinstance(obj, PlanBundle)
        assert obj.goal == "Write a utility"
        results["T10_universal_deserializer"] = "PASS"
        passed += 1
    except Exception as e:
        results["T10_universal_deserializer"] = f"FAIL: {e}"
        failed += 1

    total = passed + failed
    return {
        "total": total,
        "passed": passed,
        "failed": failed,
        "score": f"{passed}/{total}",
        "results": results,
    }


# ---------------------------------------------------------------------------
# MAIN
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("=" * 60)
    print("NASUS TASK PLANNER -- SCHEMA VALIDATION")
    print("=" * 60)
    report = run_validation_tests()
    print(f"\nScore: {report['score']} ({report['passed']} passed, {report['failed']} failed)\n")
    for test_name, result in report["results"].items():
        status = "OK" if result == "PASS" else "XX"
        print(f"  [{status}]  {test_name}: {result}")
    print()
    if report["failed"] == 0:
        print("ALL TESTS PASSED -- schema is production ready.")
    else:
        print(f"{report['failed']} TEST(S) FAILED -- review errors above.")

__all__ = [
    # Enums
    "Complexity", "Ambiguity", "Scope", "Duration", "TokenBudget",
    "RiskFlag", "InputSource", "ErrorCode", "OutputType",
    # Dataclasses
    "ConditionOn", "PlanStep", "PlanBundle",
    "BlockingQuestion", "ClarificationRequest",
    "PlanError", "StepEdit", "PlanRevision",
    # Functions
    "parse_planner_output", "validate_planner_output", "wrap_in_envelope",
    "run_validation_tests",
]
