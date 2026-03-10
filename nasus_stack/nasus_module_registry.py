"""
NASUS MODULE REGISTRY
Version: 1.0 | Shared across all Nasus modules

Single source of truth for:
  - ModuleID enum  (GAP-10 fix: was defined independently in 3 files)
  - NasusStatus enum
  - NasusEnvelope  (GAP-01 fix: standard I/O wrapper for all modules)

Import pattern in any module:
    from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus
"""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Any, List, Optional


class ModuleID(str, Enum):
    M00 = "M00"
    M01 = "M01"
    M02 = "M02"
    M03 = "M03"
    M04 = "M04"
    M05 = "M05"
    M06 = "M06"
    M07 = "M07"
    M08 = "M08"
    M09 = "M09"
    M10 = "M10"
    M11 = "M11"

    @classmethod
    def label(cls, mid: "ModuleID") -> str:
        _labels = {
            cls.M00: "Orchestrator Core",
            cls.M01: "Research Analyst",
            cls.M02: "API Integrator",
            cls.M03: "Web Browser",
            cls.M04: "Data Analyst",
            cls.M05: "Code Engineer",
            cls.M06: "Content Creator",
            cls.M07: "Product Strategist",
            cls.M08: "Landing Page Builder",
            cls.M09: "Memory Manager",
            cls.M10: "Task Planner",
            cls.M11: "Quality Reviewer",
        }
        return _labels.get(mid, mid.value)


class NasusStatus(str, Enum):
    PENDING  = "PENDING"
    RUNNING  = "RUNNING"
    DONE     = "DONE"
    FAILED   = "FAILED"


@dataclass
class NasusEnvelope:
    module_id:  ModuleID
    payload:    Any
    job_id:     str            = field(default_factory=lambda: "job_" + uuid.uuid4().hex[:10])
    status:     NasusStatus    = NasusStatus.PENDING
    errors:     List[str]      = field(default_factory=list)
    created_at: str            = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str            = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def mark_running(self) -> "NasusEnvelope":
        self.status     = NasusStatus.RUNNING
        self.updated_at = datetime.now(timezone.utc).isoformat()
        return self

    def mark_done(self, payload: Optional[Any] = None) -> "NasusEnvelope":
        self.status     = NasusStatus.DONE
        self.updated_at = datetime.now(timezone.utc).isoformat()
        if payload is not None:
            self.payload = payload
        return self

    def mark_failed(self, error: str) -> "NasusEnvelope":
        self.status     = NasusStatus.FAILED
        self.updated_at = datetime.now(timezone.utc).isoformat()
        self.errors.append(error)
        return self

    def add_error(self, msg: str) -> "NasusEnvelope":
        self.errors.append(msg)
        return self

    def to_dict(self) -> dict:
        payload_out = (
            self.payload.to_dict()
            if hasattr(self.payload, "to_dict")
            else self.payload
        )
        return {
            "job_id":     self.job_id,
            "module_id":  self.module_id.value,
            "status":     self.status.value,
            "payload":    payload_out,
            "errors":     self.errors,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "NasusEnvelope":
        return cls(
            module_id  = ModuleID(d["module_id"]),
            payload    = d.get("payload"),
            job_id     = d.get("job_id", "job_" + uuid.uuid4().hex[:10]),
            status     = NasusStatus(d.get("status", "PENDING")),
            errors     = d.get("errors", []),
            created_at = d.get("created_at", datetime.now(timezone.utc).isoformat()),
            updated_at = d.get("updated_at", datetime.now(timezone.utc).isoformat()),
        )

    def validate(self) -> List[str]:
        issues: List[str] = []
        if not self.job_id:
            issues.append("job_id is empty")
        if self.payload is None and self.status == NasusStatus.DONE:
            issues.append("DONE envelope has no payload")
        if self.errors and self.status != NasusStatus.FAILED:
            issues.append("errors present but status is not FAILED")
        return issues
