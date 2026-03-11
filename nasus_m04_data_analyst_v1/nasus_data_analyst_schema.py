"""
NASUS DATA ANALYST — SCHEMA
Version: 1.0 | Module: M04 | Stack: Nasus Sub-Agent Network
"""
from __future__ import annotations
from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional

MODULE_ID = "M04"
MODULE_NAME = "Data Analyst"
CAPABILITIES = ["CSV analysis", "JSON analysis", "chart generation", "statistical ops", "SQL"]


class DataFormat(str, Enum):
    CSV = "csv"
    JSON = "json"
    JSONL = "jsonl"
    DICT_LIST = "dict_list"
    SQL_RESULT = "sql_result"


class AnalysisType(str, Enum):
    SUMMARY = "summary"
    DISTRIBUTION = "distribution"
    CORRELATION = "correlation"
    TREND = "trend"
    ANOMALY = "anomaly"
    COMPARISON = "comparison"
    CUSTOM = "custom"


class ChartType(str, Enum):
    BAR = "bar"
    LINE = "line"
    PIE = "pie"
    SCATTER = "scatter"
    HISTOGRAM = "histogram"
    HEATMAP = "heatmap"
    TABLE = "table"


class AnalysisStatus(str, Enum):
    PENDING = "PENDING"
    LOADING = "LOADING"
    ANALYZING = "ANALYZING"
    VISUALIZING = "VISUALIZING"
    DONE = "DONE"
    FAILED = "FAILED"


@dataclass
class DataRequest:
    data: Any
    format: DataFormat = DataFormat.DICT_LIST
    analysis_types: List[AnalysisType] = field(default_factory=lambda: [AnalysisType.SUMMARY])
    chart_types: Optional[List[ChartType]] = None
    sql_query: str = ""
    custom_instruction: str = ""
    output_format: str = "markdown"

    def to_dict(self) -> dict:
        return {
            "format": self.format.value,
            "analysis_types": [a.value for a in self.analysis_types],
            "chart_types": [c.value for c in self.chart_types] if self.chart_types else [],
            "sql_query": self.sql_query,
            "custom_instruction": self.custom_instruction,
            "output_format": self.output_format,
        }


@dataclass
class ColumnStats:
    name: str
    dtype: str
    count: int
    nulls: int
    unique: int
    min: Any = None
    max: Any = None
    mean: Any = None
    std: Any = None

    def to_dict(self) -> dict:
        return {
            "name": self.name, "dtype": self.dtype, "count": self.count,
            "nulls": self.nulls, "unique": self.unique,
            "min": self.min, "max": self.max, "mean": self.mean, "std": self.std,
        }


@dataclass
class DataSummary:
    row_count: int
    col_count: int
    columns: List[ColumnStats] = field(default_factory=list)
    sample_rows: List[dict] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "row_count": self.row_count,
            "col_count": self.col_count,
            "columns": [c.to_dict() for c in self.columns],
            "sample_rows": self.sample_rows[:3],
        }


@dataclass
class AnalysisResult:
    request_summary: str
    summary: DataSummary
    insights: List[str] = field(default_factory=list)
    charts: List[dict] = field(default_factory=list)
    sql_result: Any = None
    narrative: str = ""
    status: AnalysisStatus = AnalysisStatus.DONE

    def to_dict(self) -> dict:
        return {
            "request_summary": self.request_summary,
            "summary": self.summary.to_dict(),
            "insights": self.insights,
            "charts": self.charts,
            "sql_result": self.sql_result,
            "narrative": self.narrative,
            "status": self.status.value,
        }


@dataclass
class AnalysisError:
    message: str
    error_code: str = "ANALYSIS_ERROR"

    def to_dict(self) -> dict:
        return {"error_code": self.error_code, "message": self.message}


def validate_analysis_output(result: AnalysisResult) -> List[str]:
    issues: List[str] = []
    if not result.insights:
        issues.append("RT-03: No insights generated")
    if result.summary.row_count == 0:
        issues.append("RT-01: Empty dataset")
    if result.charts:
        for i, chart in enumerate(result.charts):
            for key in ("type", "title", "data"):
                if key not in chart:
                    issues.append(f"RT-04: Chart {i} missing field '{key}'")
    if not result.narrative:
        issues.append("RT-06: Narrative is empty")
    return issues
