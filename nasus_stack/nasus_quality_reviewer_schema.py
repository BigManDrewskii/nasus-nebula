"""
NASUS QUALITY REVIEWER -- STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 12 | Stack: Nasus Sub-Agent Network

Dataclasses covering all Quality Reviewer output types:
- ChecklistItem     (single checklist evaluation)
- Finding           (detail on a FAIL item)
- RevisionRequest   (instruction for upstream module to fix)
- ReviewApproved    (verdict: output is ready)
- ReviewRevise      (verdict: fixable issues found)
- ReviewReject      (verdict: fundamental failure, escalate)
- ModuleReview      (sub-verdict for one module in a pipeline)
- PipelineReview    (composite verdict for multi-module output)

All classes serialize to/from JSON.
All enums are string-based for JSON compatibility.
"""

from __future__ import annotations
from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Optional, List
import json
import uuid
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class CheckResult(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    NA   = "N/A"


class Verdict(str, Enum):
    APPROVED = "APPROVED"
    REVISE   = "REVISE"
    REJECT   = "REJECT"


class RejectReason(str, Enum):
    WRONG_MODULE          = "WRONG_MODULE"
    OUT_OF_SCOPE          = "OUT_OF_SCOPE"
    HALLUCINATION_DETECTED = "HALLUCINATION_DETECTED"
    CRITICAL_ERROR        = "CRITICAL_ERROR"
    INCOMPLETE_OUTPUT     = "INCOMPLETE_OUTPUT"


class RevisionPriority(str, Enum):
    HIGH   = "HIGH"
    MEDIUM = "MEDIUM"
    LOW    = "LOW"


# ModuleID imported from shared registry (GAP-03 / GAP-10 fix)
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus  # noqa: F401


# ---------------------------------------------------------------------------
# CORE BUILDING BLOCKS
# ---------------------------------------------------------------------------

@dataclass
class ChecklistItem:
    """
    A single item from the module quality checklist.

    Fields:
        item_id      -- short identifier, e.g. "M01-C01"
        description  -- the checklist statement being evaluated
        result       -- PASS / FAIL / N/A
        note         -- optional context (required when result is N/A)
    """
    item_id: str
    description: str
    result: CheckResult
    note: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "item_id": self.item_id,
            "description": self.description,
            "result": self.result.value,
            "note": self.note,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ChecklistItem":
        try:
            return cls(
                item_id=d["item_id"],
                description=d["description"],
                result=CheckResult(d["result"]),
                note=d.get("note"),
            )
        except KeyError as e:
            raise ValueError(f"ChecklistItem.from_dict: missing required field {e}") from e
@dataclass
class Finding:
    """
    Detail record for a FAIL checklist item.

    Fields:
        item_id      -- matches the ChecklistItem.item_id that failed
        field        -- the specific field / section / line that failed
        issue        -- factual description of the failure (no subjective language)
        severity     -- HIGH / MEDIUM / LOW (mirrors RevisionPriority scale)
    """
    item_id: str
    field: str
    issue: str
    severity: RevisionPriority

    def to_dict(self) -> dict:
        return {
            "item_id": self.item_id,
            "field": self.field,
            "issue": self.issue,
            "severity": self.severity.value,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "Finding":
        try:
            return cls(
                item_id=d["item_id"],
                field=d["field"],
                issue=d["issue"],
                severity=RevisionPriority(d["severity"]),
            )
        except KeyError as e:
            raise ValueError(f"Finding.from_dict: missing required field {e}") from e
@dataclass
class RevisionRequest:
    """
    A single actionable instruction for an upstream module to fix one FAIL item.

    Fields:
        request_id        -- unique ID for this revision request
        item_id           -- the ChecklistItem.item_id this request addresses
        revision_target   -- which module must act on this (e.g. M05)
        field             -- same as Finding.field
        issue             -- same as Finding.issue
        instruction       -- concrete fix instruction (what to change and how)
        priority          -- HIGH / MEDIUM / LOW
    """
    item_id: str
    revision_target: ModuleID
    field: str
    issue: str
    instruction: str
    priority: RevisionPriority
    request_id: str = field(default_factory=lambda: f"rr_{uuid.uuid4().hex[:8]}")

    def to_dict(self) -> dict:
        return {
            "request_id": self.request_id,
            "item_id": self.item_id,
            "revision_target": self.revision_target.value,
            "field": self.field,
            "issue": self.issue,
            "instruction": self.instruction,
            "priority": self.priority.value,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "RevisionRequest":
        try:
            return cls(
                request_id=d.get("request_id", f"rr_{uuid.uuid4().hex[:8]}"),
                item_id=d["item_id"],
                revision_target=ModuleID(d["revision_target"]),
                field=d["field"],
                issue=d["issue"],
                instruction=d["instruction"],
                priority=RevisionPriority(d["priority"]),
            )
        except KeyError as e:
            raise ValueError(f"RevisionRequest.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# VERDICT CLASSES
# ---------------------------------------------------------------------------

@dataclass
class ReviewApproved:
    """
    Verdict: output is ready for delivery as-is.

    Fields:
        review_id       -- unique ID for this review
        source_module   -- module that produced the reviewed output
        quality_score   -- float 0.0-1.0 (must be >= 0.90)
        checklist       -- full list of ChecklistItems (all PASS or N/A)
        reviewed_at     -- ISO 8601 timestamp
        note            -- optional reviewer note
    """
    source_module: ModuleID
    quality_score: float
    checklist: List[ChecklistItem]
    reviewed_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    review_id: str = field(default_factory=lambda: f"qr_{uuid.uuid4().hex[:8]}")
    note: Optional[str] = None

    verdict: Verdict = field(default=Verdict.APPROVED, init=False)

    def __post_init__(self):
        if self.quality_score < 0.90:
            raise ValueError(
                f"ReviewApproved requires quality_score >= 0.90, got {self.quality_score}"
            )

    def to_dict(self) -> dict:
        return {
            "verdict": self.verdict.value,
            "review_id": self.review_id,
            "source_module": self.source_module.value,
            "quality_score": self.quality_score,
            "checklist": [c.to_dict() for c in self.checklist],
            "reviewed_at": self.reviewed_at,
            "note": self.note,
        }

    def memory_write(self) -> dict:
        """Return a WriteResponse-compatible dict for M09 persistence. (GAP-04 fix)"""
        return {
            "write_status": "success",
            "record_id":    self.review_id,
            "layer":        "session",
            "created_at":   self.reviewed_at,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d: dict) -> "ReviewApproved":
        try:
            return cls(
                review_id=d.get("review_id", f"qr_{uuid.uuid4().hex[:8]}"),
                source_module=ModuleID(d["source_module"]),
                quality_score=d["quality_score"],
                checklist=[ChecklistItem.from_dict(c) for c in d["checklist"]],
                reviewed_at=d.get("reviewed_at", datetime.now(timezone.utc).isoformat()),
                note=d.get("note"),
            )
        except KeyError as e:
            raise ValueError(f"ReviewApproved.from_dict: missing required field {e}") from e
@dataclass
class ReviewRevise:
    """
    Verdict: output has fixable issues. Upstream module must revise.

    Fields:
        review_id           -- unique ID for this review
        source_module       -- module that produced the reviewed output
        quality_score       -- float 0.70-0.89
        checklist           -- full ChecklistItem list (mix of PASS/FAIL/N/A)
        findings            -- Finding for every FAIL item
        revision_requests   -- RevisionRequest for every FAIL item
        reviewed_at         -- ISO 8601 timestamp
        note                -- optional reviewer note
    """
    source_module: ModuleID
    quality_score: float
    checklist: List[ChecklistItem]
    findings: List[Finding]
    revision_requests: List[RevisionRequest]
    reviewed_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    review_id: str = field(default_factory=lambda: f"qr_{uuid.uuid4().hex[:8]}")
    note: Optional[str] = None

    verdict: Verdict = field(default=Verdict.REVISE, init=False)

    def __post_init__(self):
        if not (0.70 <= self.quality_score <= 0.89):
            raise ValueError(
                f"ReviewRevise requires quality_score 0.70-0.89, got {self.quality_score}"
            )
        fail_items = {c.item_id for c in self.checklist if c.result == CheckResult.FAIL}
        finding_items = {f.item_id for f in self.findings}
        if fail_items != finding_items:
            raise ValueError(
                f"Every FAIL item must have a Finding. Missing: {fail_items - finding_items}"
            )

    def to_dict(self) -> dict:
        return {
            "verdict": self.verdict.value,
            "review_id": self.review_id,
            "source_module": self.source_module.value,
            "quality_score": self.quality_score,
            "checklist": [c.to_dict() for c in self.checklist],
            "findings": [f.to_dict() for f in self.findings],
            "revision_requests": [r.to_dict() for r in self.revision_requests],
            "reviewed_at": self.reviewed_at,
            "note": self.note,
        }

    def memory_write(self) -> dict:
        """Return a WriteResponse-compatible dict for M09 persistence. (GAP-04 fix)"""
        return {
            "write_status": "success",
            "record_id":    self.review_id,
            "layer":        "session",
            "created_at":   self.reviewed_at,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    @classmethod
    def from_dict(cls, d: dict) -> "ReviewRevise":
        try:
            return cls(
                review_id=d.get("review_id", f"qr_{uuid.uuid4().hex[:8]}"),
                source_module=ModuleID(d["source_module"]),
                quality_score=d["quality_score"],
                checklist=[ChecklistItem.from_dict(c) for c in d["checklist"]],
                findings=[Finding.from_dict(f) for f in d["findings"]],
                revision_requests=[RevisionRequest.from_dict(r) for r in d["revision_requests"]],
                reviewed_at=d.get("reviewed_at", datetime.now(timezone.utc).isoformat()),
                note=d.get("note"),
            )
        except KeyError as e:
            raise ValueError(f"ReviewRevise.from_dict: missing required field {e}") from e
@dataclass
class ReviewReject:
    """
    Verdict: fundamental failure. Escalate to Orchestrator.

    Fields:
        review_id         -- unique ID for this review
        source_module     -- module that produced the reviewed output
        quality_score     -- float 0.0-0.69 (or any if early_exit=True)
        checklist         -- ChecklistItem list (may be partial if early_exit)
        findings          -- Finding for every evaluated FAIL item
        reject_reason     -- one of the 5 RejectReason values
        escalation_note   -- plain-English message to Orchestrator
        early_exit        -- True if hard-reject trigger caused immediate exit
        reviewed_at       -- ISO 8601 timestamp
        note              -- optional reviewer note
    """
    source_module: ModuleID
    quality_score: float
    checklist: List[ChecklistItem]
    findings: List[Finding]
    reject_reason: RejectReason
    escalation_note: str
    early_exit: bool = False
    reviewed_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    review_id: str = field(default_factory=lambda: f"qr_{uuid.uuid4().hex[:8]}")
    note: Optional[str] = None

    verdict: Verdict = field(default=Verdict.REJECT, init=False)

    def __post_init__(self):
        if not self.early_exit:
            if self.quality_score >= 0.70:
                raise ValueError(
                    f"ReviewReject (non-early-exit) requires quality_score < 0.70, got {self.quality_score}"
                )

    def to_dict(self) -> dict:
        return {
            "verdict": self.verdict.value,
            "review_id": self.review_id,
            "source_module": self.source_module.value,
            "quality_score": self.quality_score,
            "checklist": [c.to_dict() for c in self.checklist],
            "findings": [f.to_dict() for f in self.findings],
            "reject_reason": self.reject_reason.value,
            "escalation_note": self.escalation_note,
            "early_exit": self.early_exit,
            "reviewed_at": self.reviewed_at,
            "note": self.note,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)

    def memory_write(self) -> dict:
        """Return a WriteResponse-compatible dict for M09 persistence. (GAP-14 fix)"""
        return {
            "write_status":  "rejected",
            "record_id":     self.review_id,
            "layer":         "session",
            "reject_reason": self.reject_reason.value,
            "created_at":    self.reviewed_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ReviewReject":
        try:
            return cls(
                review_id=d.get("review_id", f"qr_{uuid.uuid4().hex[:8]}"),
                source_module=ModuleID(d["source_module"]),
                quality_score=d["quality_score"],
                checklist=[ChecklistItem.from_dict(c) for c in d["checklist"]],
                findings=[Finding.from_dict(f) for f in d["findings"]],
                reject_reason=RejectReason(d["reject_reason"]),
                escalation_note=d["escalation_note"],
                early_exit=d.get("early_exit", False),
                reviewed_at=d.get("reviewed_at", datetime.now(timezone.utc).isoformat()),
                note=d.get("note"),
            )
        except KeyError as e:
            raise ValueError(f"ReviewReject.from_dict: missing required field {e}") from e
# ---------------------------------------------------------------------------
# PIPELINE / MULTI-MODULE SUPPORT
# ---------------------------------------------------------------------------

@dataclass
class ModuleReview:
    """
    Sub-verdict for one module's contribution in a multi-module pipeline.

    Fields:
        module_id       -- which module this sub-verdict covers
        weight          -- scoring weight (default 1.0; M04/M05/M08 use 1.5)
        review          -- one of ReviewApproved / ReviewRevise / ReviewReject
    """
    module_id: ModuleID
    review: ReviewApproved | ReviewRevise | ReviewReject
    weight: float = 1.0

    def to_dict(self) -> dict:
        return {
            "module_id": self.module_id.value,
            "weight": self.weight,
            "review": self.review.to_dict(),
        }


@dataclass
class PipelineReview:
    """
    Composite verdict for a multi-module pipeline output.

    Fields:
        pipeline_review_id  -- unique ID for this pipeline review
        module_reviews      -- list of ModuleReview, one per module segment
        composite_score     -- weighted average of per-module quality scores
        verdict             -- top-level verdict based on composite_score
        revision_requests   -- all RevisionRequests from all REVISE sub-verdicts
        escalations         -- all ReviewReject sub-verdicts requiring escalation
        reviewed_at         -- ISO 8601 timestamp
        note                -- optional reviewer note
    """
    module_reviews: List[ModuleReview]
    composite_score: float
    verdict: Verdict
    revision_requests: List[RevisionRequest] = field(default_factory=list)
    escalations: List[ReviewReject] = field(default_factory=list)
    reviewed_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    pipeline_review_id: str = field(default_factory=lambda: f"pqr_{uuid.uuid4().hex[:8]}")
    note: Optional[str] = None

    def to_dict(self) -> dict:
        return {
            "pipeline_review_id": self.pipeline_review_id,
            "composite_score": self.composite_score,
            "verdict": self.verdict.value,
            "module_reviews": [mr.to_dict() for mr in self.module_reviews],
            "revision_requests": [r.to_dict() for r in self.revision_requests],
            "escalations": [e.to_dict() for e in self.escalations],
            "reviewed_at": self.reviewed_at,
            "note": self.note,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


# ---------------------------------------------------------------------------
# SCHEMA TESTS
# ---------------------------------------------------------------------------

def run_schema_tests() -> None:
    print("Running Quality Reviewer schema tests...\n")
    passed = 0
    failed = 0

    def test(name: str, fn):
        nonlocal passed, failed
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {name}: {e}")
            failed += 1

    # T01 -- ChecklistItem round-trip
    def t01():
        item = ChecklistItem("M01-C01", "All claims are sourced", CheckResult.PASS)
        d = item.to_dict()
        item2 = ChecklistItem.from_dict(d)
        assert item2.item_id == "M01-C01"
        assert item2.result == CheckResult.PASS
    test("T01 -- ChecklistItem round-trip", t01)

    # T02 -- ChecklistItem N/A with note
    def t02():
        item = ChecklistItem("M04-C02", "Charts have labeled axes", CheckResult.NA, note="Text-only output")
        d = item.to_dict()
        assert d["result"] == "N/A"
        assert d["note"] == "Text-only output"
    test("T02 -- ChecklistItem N/A with note", t02)

    # T03 -- Finding round-trip
    def t03():
        f = Finding("M05-C01", "main() function", "Function raises NameError on first call", RevisionPriority.HIGH)
        d = f.to_dict()
        f2 = Finding.from_dict(d)
        assert f2.severity == RevisionPriority.HIGH
    test("T03 -- Finding round-trip", t03)

    # T04 -- RevisionRequest round-trip
    def t04():
        rr = RevisionRequest(
            item_id="M05-C01",
            revision_target=ModuleID.M05,
            field="main() function",
            issue="Raises NameError on first call",
            instruction="Fix the undefined variable reference on line 12",
            priority=RevisionPriority.HIGH,
        )
        d = rr.to_dict()
        rr2 = RevisionRequest.from_dict(d)
        assert rr2.revision_target == ModuleID.M05
        assert rr2.priority == RevisionPriority.HIGH
    test("T04 -- RevisionRequest round-trip", t04)

    # T05 -- ReviewApproved valid
    def t05():
        checklist = [
            ChecklistItem("M01-C01", "All claims sourced", CheckResult.PASS),
            ChecklistItem("M01-C02", "No hallucinations", CheckResult.PASS),
            ChecklistItem("M01-C03", "Coverage complete", CheckResult.PASS),
        ]
        ra = ReviewApproved(
            source_module=ModuleID.M01,
            quality_score=1.0,
            checklist=checklist,
        )
        j = ra.to_json()
        d = json.loads(j)
        assert d["verdict"] == "APPROVED"
        assert d["quality_score"] == 1.0
    test("T05 -- ReviewApproved valid", t05)

    # T06 -- ReviewApproved rejects low score
    def t06():
        try:
            ReviewApproved(
                source_module=ModuleID.M01,
                quality_score=0.85,
                checklist=[],
            )
            raise AssertionError("Should have raised")
        except ValueError as e:
            assert "0.90" in str(e)
    test("T06 -- ReviewApproved rejects score < 0.90", t06)

    # T07 -- ReviewRevise valid
    def t07():
        checklist = [
            ChecklistItem("M06-C01", "Format matches brief", CheckResult.PASS),
            ChecklistItem("M06-C04", "No filler phrases", CheckResult.FAIL),
            ChecklistItem("M06-C07", "No placeholder text", CheckResult.PASS),
        ]
        findings = [
            Finding("M06-C04", "paragraph 2", "Contains filler phrase: 'In conclusion'", RevisionPriority.MEDIUM),
        ]
        rrs = [
            RevisionRequest(
                item_id="M06-C04",
                revision_target=ModuleID.M06,
                field="paragraph 2",
                issue="Contains filler phrase: 'In conclusion'",
                instruction="Remove 'In conclusion' and rewrite the closing sentence directly",
                priority=RevisionPriority.MEDIUM,
            )
        ]
        rv = ReviewRevise(
            source_module=ModuleID.M06,
            quality_score=0.83,
            checklist=checklist,
            findings=findings,
            revision_requests=rrs,
        )
        d = rv.to_dict()
        assert d["verdict"] == "REVISE"
        assert len(d["revision_requests"]) == 1
    test("T07 -- ReviewRevise valid", t07)

    # T08 -- ReviewRevise fails if Finding missing for FAIL item
    def t08():
        checklist = [
            ChecklistItem("M06-C04", "No filler phrases", CheckResult.FAIL),
            ChecklistItem("M06-C07", "No placeholder text", CheckResult.FAIL),
        ]
        findings = [
            Finding("M06-C04", "p2", "Filler phrase", RevisionPriority.MEDIUM),
            # M06-C07 finding is intentionally missing
        ]
        try:
            ReviewRevise(
                source_module=ModuleID.M06,
                quality_score=0.75,
                checklist=checklist,
                findings=findings,
                revision_requests=[],
            )
            raise AssertionError("Should have raised")
        except ValueError as e:
            assert "M06-C07" in str(e)
    test("T08 -- ReviewRevise fails if Finding missing for FAIL", t08)

    # T09 -- ReviewReject valid (early exit)
    def t09():
        rj = ReviewReject(
            source_module=ModuleID.M08,
            quality_score=0.0,
            checklist=[],
            findings=[],
            reject_reason=RejectReason.HALLUCINATION_DETECTED,
            escalation_note="Output contains invented citation URLs. M01 must re-run with verified sources.",
            early_exit=True,
        )
        d = rj.to_dict()
        assert d["verdict"] == "REJECT"
        assert d["early_exit"] is True
        assert d["reject_reason"] == "HALLUCINATION_DETECTED"
    test("T09 -- ReviewReject valid (early exit)", t09)

    # T10 -- PipelineReview composite
    def t10():
        checklist_m01 = [ChecklistItem(f"M01-C0{i}", f"check {i}", CheckResult.PASS) for i in range(1, 8)]
        checklist_m05 = [ChecklistItem(f"M05-C0{i}", f"check {i}", CheckResult.PASS) for i in range(1, 9)]
        ra_m01 = ReviewApproved(source_module=ModuleID.M01, quality_score=1.0, checklist=checklist_m01)
        ra_m05 = ReviewApproved(source_module=ModuleID.M05, quality_score=0.95, checklist=checklist_m05)
        mr1 = ModuleReview(module_id=ModuleID.M01, review=ra_m01, weight=1.0)
        mr2 = ModuleReview(module_id=ModuleID.M05, review=ra_m05, weight=1.5)
        composite = (1.0 * 1.0 + 0.95 * 1.5) / (1.0 + 1.5)
        pr = PipelineReview(
            module_reviews=[mr1, mr2],
            composite_score=round(composite, 4),
            verdict=Verdict.APPROVED,
        )
        d = pr.to_dict()
        assert d["verdict"] == "APPROVED"
        assert abs(d["composite_score"] - 0.97) < 0.01
    test("T10 -- PipelineReview composite score", t10)

    print(f"\nResults: {passed} passed, {failed} failed out of {passed + failed} tests")
    if failed > 0:
        raise SystemExit(1)


if __name__ == "__main__":
    run_schema_tests()

__all__ = [
    # Enums
    "CheckResult", "RevisionPriority", "Verdict", "RejectReason",
    # Dataclasses
    "ChecklistItem", "Finding", "RevisionRequest",
    "ReviewApproved", "ReviewRevise", "ReviewReject",
    "QualityReviewSession",
]
