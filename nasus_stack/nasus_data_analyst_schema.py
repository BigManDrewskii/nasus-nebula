"""
NASUS DATA ANALYST — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 04 | Stack: Nasus Sub-Agent Network

Pydantic v2 schema classes for all Data Analyst outputs:
- ColumnMeta:          Metadata for a single column in the analysed dataset
- TableOutput:         Summary view of the loaded dataset
- ChartOutput:         A single chart artifact (Plotly JSON, base64 PNG, or D3)
- InsightBullet:       A single data-backed insight with confidence score
- InsightsOutput:      Narrative summary + structured bullets + data quality score
- NasusAnalysisOutput: Top-level output contract for analyze() and refine()

Extracted from inline definitions in nasus_data_analyst.py (Phase 3 hardening).
All downstream consumers and the Quality Reviewer should import from this file.

Import pattern:
    from nasus_data_analyst_schema import (
        ColumnMeta, TableOutput, ChartOutput,
        InsightBullet, InsightsOutput, NasusAnalysisOutput,
    )
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field, field_validator, model_validator

# ---------------------------------------------------------------------------
# MODULE CONSTANTS
# ---------------------------------------------------------------------------

MODULE_VERSION = "1.0.0"

VALID_CHART_LIBRARIES = frozenset({"plotly", "matplotlib", "seaborn", "d3"})

VALID_CHART_TYPES = frozenset(
    {
        "line",
        "bar",
        "scatter",
        "pie",
        "distribution",
        "histogram",
        "heatmap",
        "box",
        "violin",
        "area",
        "treemap",
        "funnel",
        "waterfall",
        "radar",
    }
)

VALID_RENDER_HINTS = frozenset({"plotly_json", "base64_png", "d3_payload"})

VALID_INSIGHT_CATEGORIES = frozenset(
    {"trend", "anomaly", "correlation", "distribution", "comparison", "summary"}
)

REQUIRED_METADATA_KEYS = frozenset(
    {
        "analysis_id",
        "timestamp",
        "input_format",
        "row_count",
        "col_count",
        "duration_ms",
    }
)


# ---------------------------------------------------------------------------
# COLUMN META
# ---------------------------------------------------------------------------


class ColumnMeta(BaseModel):
    """Metadata for a single column in the analysed dataset."""

    name: str = Field(..., description="Column name as it appears in the dataset")
    dtype: str = Field(
        ..., description="Pandas dtype string, e.g. 'float64', 'object', 'int64'"
    )
    null_count: int = Field(
        ..., ge=0, description="Number of null / NaN values in this column"
    )
    null_pct: float = Field(
        ..., ge=0.0, le=1.0, description="Fraction of null values (0.0–1.0)"
    )
    unique_count: int = Field(
        ..., ge=0, description="Number of distinct non-null values"
    )
    sample_values: list[Any] = Field(
        default_factory=list,
        description="Up to 5 representative sample values from the column",
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "name": "revenue",
                "dtype": "float64",
                "null_count": 2,
                "null_pct": 0.02,
                "unique_count": 98,
                "sample_values": [1200.5, 3400.0, 980.75, 2100.0, 450.25],
            }
        }
    }

    @field_validator("sample_values", mode="before")
    @classmethod
    def cap_samples(cls, v: list) -> list:
        """Limit sample values to 5 entries."""
        return v[:5]


# ---------------------------------------------------------------------------
# TABLE OUTPUT
# ---------------------------------------------------------------------------


class TableOutput(BaseModel):
    """Summary view of the loaded dataset."""

    columns: list[ColumnMeta] = Field(
        ..., description="Metadata for each column in the dataset"
    )
    row_count: int = Field(..., ge=0, description="Total number of rows in the dataset")
    sample_rows: list[dict[str, Any]] = Field(
        default_factory=list,
        description="Up to 5 representative rows from the dataset",
    )
    warnings: list[str] = Field(
        default_factory=list,
        description="Data quality warnings (e.g. 'Column X has 45% nulls')",
    )

    @field_validator("sample_rows", mode="before")
    @classmethod
    def cap_sample_rows(cls, v: list[dict]) -> list[dict]:
        """Limit sample rows to 5 entries."""
        return v[:5]


# ---------------------------------------------------------------------------
# CHART OUTPUT
# ---------------------------------------------------------------------------


class ChartOutput(BaseModel):
    """
    A single chart artifact.

    payload is either:
      - dict  (Plotly JSON, parsed from fig.to_json())
      - str   (base64-encoded PNG from Matplotlib/Seaborn, or D3 JSON string)
    """

    chart_id: str = Field(
        default_factory=lambda: f"chart_{uuid.uuid4().hex[:8]}",
        description="Unique chart identifier",
    )
    title: str = Field(..., description="Human-readable chart title")
    chart_type: str = Field(
        ...,
        description="Chart type: line | bar | scatter | pie | distribution | histogram | etc.",
    )
    library: str = Field(
        ..., description="Rendering library: plotly | matplotlib | seaborn | d3"
    )
    payload: Union[str, dict] = Field(
        ...,
        description=(
            "Chart data — Plotly JSON dict, base64 PNG string, or D3 payload string"
        ),
    )
    x_label: str = Field(..., description="X-axis label")
    y_label: str = Field(..., description="Y-axis label")
    legend: Optional[list[str]] = Field(
        None, description="Legend entries, if applicable"
    )
    render_hint: str = Field(
        default="plotly_json",
        description="Frontend hint: 'plotly_json' | 'base64_png' | 'd3_payload'",
    )

    @field_validator("library")
    @classmethod
    def validate_library(cls, v: str) -> str:
        if v not in VALID_CHART_LIBRARIES:
            raise ValueError(
                f"library must be one of {sorted(VALID_CHART_LIBRARIES)}, got '{v}'"
            )
        return v

    model_config = {
        "json_schema_extra": {
            "example": {
                "chart_id": "chart_a1b2c3d4",
                "title": "Monthly Revenue by Region",
                "chart_type": "line",
                "library": "plotly",
                "payload": {"data": [], "layout": {}},
                "x_label": "Month",
                "y_label": "Revenue (USD)",
                "legend": ["North", "South", "East", "West"],
                "render_hint": "plotly_json",
            }
        }
    }


# ---------------------------------------------------------------------------
# INSIGHT BULLET
# ---------------------------------------------------------------------------


class InsightBullet(BaseModel):
    """A single data-backed insight with confidence score and category."""

    text: str = Field(..., description="The insight statement")
    confidence: float = Field(
        ..., ge=0.0, le=1.0, description="Confidence in this insight (0.0–1.0)"
    )
    supporting_stat: str = Field(
        ...,
        description="Supporting statistic, e.g. 'mean=1234.56, std=200.11'",
    )
    category: str = Field(
        ...,
        description="Insight category: trend | anomaly | correlation | distribution",
    )

    @field_validator("confidence")
    @classmethod
    def round_confidence(cls, v: float) -> float:
        """Round confidence to 4 decimal places."""
        return round(v, 4)


# ---------------------------------------------------------------------------
# INSIGHTS OUTPUT
# ---------------------------------------------------------------------------


class InsightsOutput(BaseModel):
    """Narrative summary + structured bullets + data quality score."""

    summary: str = Field(..., description="Narrative summary of the key data insights")
    bullets: list[InsightBullet] = Field(
        ..., description="Structured insight bullets with confidence scores"
    )
    data_quality_score: float = Field(
        ...,
        ge=0.0,
        le=1.0,
        description="Overall data quality score (0.0–1.0)",
    )
    caveats: list[str] = Field(
        default_factory=list,
        description="Data caveats and limitations the user should be aware of",
    )

    @field_validator("data_quality_score")
    @classmethod
    def round_dq(cls, v: float) -> float:
        """Round data quality score to 4 decimal places."""
        return round(v, 4)


# ---------------------------------------------------------------------------
# NASUS ANALYSIS OUTPUT (top-level)
# ---------------------------------------------------------------------------


class NasusAnalysisOutput(BaseModel):
    """
    Top-level output contract for the Nasus Data Analyst.
    Every analyze() and refine() call returns exactly this shape.
    """

    table: TableOutput = Field(..., description="Summary view of the loaded dataset")
    charts: list[ChartOutput] = Field(..., description="Generated chart artifacts")
    insights: InsightsOutput = Field(
        ..., description="Narrative summary and structured insight bullets"
    )
    metadata: dict[str, Any] = Field(
        ...,
        description=(
            "Required keys: analysis_id, timestamp, input_format, "
            "row_count, col_count, duration_ms"
        ),
    )
    error: Optional[str] = Field(
        None, description="Error message if analysis failed (partial or full)"
    )

    @model_validator(mode="after")
    def validate_metadata_keys(self) -> "NasusAnalysisOutput":
        missing = REQUIRED_METADATA_KEYS - set(self.metadata.keys())
        if missing:
            raise ValueError(f"metadata missing required keys: {missing}")
        return self

    @property
    def normalized_quality_score(self) -> float:
        """
        Returns data_quality_score as the normalized 0.0–1.0 quality score
        for Quality Reviewer compatibility.
        """
        try:
            return round(min(max(self.insights.data_quality_score, 0.0), 1.0), 4)
        except (AttributeError, TypeError, ValueError):
            return 0.0

    model_config = {
        "json_schema_extra": {
            "example": {
                "table": {},
                "charts": [],
                "insights": {
                    "summary": "Revenue grew 12.4% QoQ driven by the North region.",
                    "bullets": [],
                    "data_quality_score": 0.97,
                    "caveats": [],
                },
                "metadata": {
                    "analysis_id": "ana_abc123",
                    "timestamp": "2026-03-09T14:20:00+00:00",
                    "input_format": "dataframe",
                    "row_count": 100,
                    "col_count": 6,
                    "duration_ms": 312,
                },
                "error": None,
            }
        }
    }


# ---------------------------------------------------------------------------
# VALIDATION HELPERS
# ---------------------------------------------------------------------------


def validate_analysis_output(output: NasusAnalysisOutput) -> List[str]:
    """
    Run semantic validation on a NasusAnalysisOutput beyond Pydantic field checks.
    Returns a list of human-readable error strings (empty = valid).
    """
    errors: List[str] = []

    # Check metadata required keys (belt-and-suspenders — model_validator also does this)
    missing = REQUIRED_METADATA_KEYS - set(output.metadata.keys())
    if missing:
        errors.append(f"metadata missing required keys: {sorted(missing)}")

    # Check chart libraries are valid
    for chart in output.charts:
        if chart.library not in VALID_CHART_LIBRARIES:
            errors.append(
                f"Chart '{chart.title}' uses invalid library '{chart.library}'. "
                f"Valid: {sorted(VALID_CHART_LIBRARIES)}"
            )

    # Check render hints are valid
    for chart in output.charts:
        if chart.render_hint not in VALID_RENDER_HINTS:
            errors.append(
                f"Chart '{chart.title}' has invalid render_hint '{chart.render_hint}'. "
                f"Valid: {sorted(VALID_RENDER_HINTS)}"
            )

    # Check chart IDs are unique
    chart_ids = [c.chart_id for c in output.charts]
    if len(chart_ids) != len(set(chart_ids)):
        errors.append("Duplicate chart_id values detected")

    # Check row_count consistency between table and metadata
    if output.table.row_count != output.metadata.get(
        "row_count", output.table.row_count
    ):
        errors.append(
            f"table.row_count ({output.table.row_count}) != "
            f"metadata.row_count ({output.metadata.get('row_count')})"
        )

    # Check col_count consistency
    actual_col_count = len(output.table.columns)
    meta_col_count = output.metadata.get("col_count", actual_col_count)
    if actual_col_count != meta_col_count:
        errors.append(
            f"len(table.columns) ({actual_col_count}) != "
            f"metadata.col_count ({meta_col_count})"
        )

    # Check insights summary is not empty
    if not output.insights.summary.strip():
        errors.append("insights.summary is empty")

    # Check data quality score range (belt-and-suspenders)
    dq = output.insights.data_quality_score
    if not (0.0 <= dq <= 1.0):
        errors.append(f"insights.data_quality_score ({dq}) is out of range [0.0, 1.0]")

    # Check insight bullet categories
    for bullet in output.insights.bullets:
        if bullet.category not in VALID_INSIGHT_CATEGORIES:
            errors.append(
                f"Insight bullet '{bullet.text[:40]}...' has invalid category "
                f"'{bullet.category}'. Valid: {sorted(VALID_INSIGHT_CATEGORIES)}"
            )

    # Check column null_pct consistency
    for col in output.table.columns:
        if output.table.row_count > 0:
            expected_pct = col.null_count / output.table.row_count
            if abs(col.null_pct - expected_pct) > 0.02:  # 2% tolerance for rounding
                errors.append(
                    f"Column '{col.name}': null_pct ({col.null_pct}) doesn't match "
                    f"null_count/row_count ({expected_pct:.4f})"
                )

    # Error field should be None on successful output
    if output.error is not None and output.error.strip():
        errors.append(
            f"Output has error set ('{output.error[:80]}') — "
            "this may indicate a partial failure"
        )

    return errors


# ---------------------------------------------------------------------------
# SCHEMA TESTS
# ---------------------------------------------------------------------------


def run_schema_tests() -> None:
    """Self-test for all M04 Data Analyst schema classes."""
    import json as _json

    print("Running Data Analyst schema tests...\n")
    passed = 0
    failed = 0

    def test(name: str, fn):  # noqa: ANN001
        nonlocal passed, failed
        try:
            fn()
            print(f"  PASS  {name}")
            passed += 1
        except Exception as e:
            print(f"  FAIL  {name}: {e}")
            failed += 1

    # T01 — ColumnMeta round-trip
    def t01():
        cm = ColumnMeta(
            name="revenue",
            dtype="float64",
            null_count=2,
            null_pct=0.02,
            unique_count=98,
            sample_values=[1200.5, 3400.0, 980.75, 2100.0, 450.25],
        )
        d = cm.model_dump()
        cm2 = ColumnMeta.model_validate(d)
        assert cm2.name == "revenue"
        assert cm2.dtype == "float64"
        assert len(cm2.sample_values) == 5

    test("T01 — ColumnMeta round-trip", t01)

    # T02 — ColumnMeta caps sample_values at 5
    def t02():
        cm = ColumnMeta(
            name="x",
            dtype="int64",
            null_count=0,
            null_pct=0.0,
            unique_count=100,
            sample_values=[1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        )
        assert len(cm.sample_values) == 5

    test("T02 — ColumnMeta caps sample_values at 5", t02)

    # T03 — ColumnMeta rejects negative null_count
    def t03():
        try:
            ColumnMeta(
                name="x",
                dtype="int64",
                null_count=-1,
                null_pct=0.0,
                unique_count=10,
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T03 — ColumnMeta rejects negative null_count", t03)

    # T04 — TableOutput caps sample_rows at 5
    def t04():
        cols = [
            ColumnMeta(
                name="a", dtype="int64", null_count=0, null_pct=0.0, unique_count=10
            )
        ]
        rows = [{"a": i} for i in range(20)]
        to = TableOutput(columns=cols, row_count=20, sample_rows=rows)
        assert len(to.sample_rows) == 5

    test("T04 — TableOutput caps sample_rows at 5", t04)

    # T05 — ChartOutput round-trip
    def t05():
        chart = ChartOutput(
            title="Revenue Over Time",
            chart_type="line",
            library="plotly",
            payload={"data": [], "layout": {}},
            x_label="Month",
            y_label="Revenue (USD)",
            legend=["North", "South"],
            render_hint="plotly_json",
        )
        d = chart.model_dump()
        chart2 = ChartOutput.model_validate(d)
        assert chart2.title == "Revenue Over Time"
        assert chart2.library == "plotly"
        assert chart2.chart_id.startswith("chart_")

    test("T05 — ChartOutput round-trip", t05)

    # T06 — ChartOutput rejects invalid library
    def t06():
        try:
            ChartOutput(
                title="Bad",
                chart_type="line",
                library="invalid_lib",
                payload="",
                x_label="X",
                y_label="Y",
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T06 — ChartOutput rejects invalid library", t06)

    # T07 — InsightBullet round-trip + confidence rounding
    def t07():
        ib = InsightBullet(
            text="Revenue increased 12% QoQ",
            confidence=0.87654321,
            supporting_stat="mean=12345.67, std=1500.00",
            category="trend",
        )
        assert ib.confidence == 0.8765  # rounded to 4 decimals
        d = ib.model_dump()
        ib2 = InsightBullet.model_validate(d)
        assert ib2.text == "Revenue increased 12% QoQ"
        assert ib2.confidence == 0.8765

    test("T07 — InsightBullet round-trip + confidence rounding", t07)

    # T08 — InsightsOutput round-trip + dq rounding
    def t08():
        io = InsightsOutput(
            summary="Revenue grew driven by the North region.",
            bullets=[
                InsightBullet(
                    text="Growth observed",
                    confidence=0.9,
                    supporting_stat="growth=12.4%",
                    category="trend",
                )
            ],
            data_quality_score=0.97123456,
            caveats=["Limited to Q3 data only"],
        )
        assert io.data_quality_score == 0.9712  # rounded to 4 decimals
        d = io.model_dump()
        io2 = InsightsOutput.model_validate(d)
        assert io2.summary.startswith("Revenue grew")
        assert len(io2.caveats) == 1

    test("T08 — InsightsOutput round-trip + dq rounding", t08)

    # T09 — NasusAnalysisOutput full round-trip
    def t09():
        col = ColumnMeta(
            name="revenue",
            dtype="float64",
            null_count=2,
            null_pct=0.02,
            unique_count=98,
        )
        table = TableOutput(columns=[col], row_count=100)
        chart = ChartOutput(
            title="Revenue Chart",
            chart_type="line",
            library="plotly",
            payload={"data": [], "layout": {}},
            x_label="Month",
            y_label="Revenue",
        )
        insights = InsightsOutput(
            summary="Revenue grew 12.4% QoQ.",
            bullets=[
                InsightBullet(
                    text="Strong growth",
                    confidence=0.9,
                    supporting_stat="growth=12.4%",
                    category="trend",
                )
            ],
            data_quality_score=0.97,
        )
        metadata = {
            "analysis_id": "ana_test123",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "input_format": "dataframe",
            "row_count": 100,
            "col_count": 1,
            "duration_ms": 312,
        }
        output = NasusAnalysisOutput(
            table=table,
            charts=[chart],
            insights=insights,
            metadata=metadata,
        )

        j = output.model_dump_json(indent=2)
        parsed = _json.loads(j)
        assert parsed["table"]["row_count"] == 100
        assert len(parsed["charts"]) == 1
        assert parsed["insights"]["data_quality_score"] == 0.97
        assert parsed["error"] is None

    test("T09 — NasusAnalysisOutput full round-trip", t09)

    # T10 — NasusAnalysisOutput rejects missing metadata keys
    def t10():
        col = ColumnMeta(
            name="x", dtype="int64", null_count=0, null_pct=0.0, unique_count=10
        )
        table = TableOutput(columns=[col], row_count=10)
        insights = InsightsOutput(
            summary="s",
            bullets=[],
            data_quality_score=0.5,
        )
        try:
            NasusAnalysisOutput(
                table=table,
                charts=[],
                insights=insights,
                metadata={"analysis_id": "test"},  # missing most required keys
            )
            raise AssertionError("Should have raised")
        except Exception:
            pass

    test("T10 — NasusAnalysisOutput rejects missing metadata keys", t10)

    # T11 — normalized_quality_score
    def t11():
        col = ColumnMeta(
            name="x", dtype="int64", null_count=0, null_pct=0.0, unique_count=10
        )
        table = TableOutput(columns=[col], row_count=10)
        insights = InsightsOutput(
            summary="s",
            bullets=[],
            data_quality_score=0.82,
        )
        metadata = {
            "analysis_id": "ana_test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "input_format": "dataframe",
            "row_count": 10,
            "col_count": 1,
            "duration_ms": 50,
        }
        output = NasusAnalysisOutput(
            table=table,
            charts=[],
            insights=insights,
            metadata=metadata,
        )
        assert output.normalized_quality_score == 0.82

    test("T11 — normalized_quality_score", t11)

    # T12 — validate_analysis_output catches row_count mismatch
    def t12():
        col = ColumnMeta(
            name="x", dtype="int64", null_count=0, null_pct=0.0, unique_count=10
        )
        table = TableOutput(columns=[col], row_count=100)
        insights = InsightsOutput(
            summary="s",
            bullets=[],
            data_quality_score=0.9,
        )
        metadata = {
            "analysis_id": "ana_test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "input_format": "dataframe",
            "row_count": 200,  # mismatch with table.row_count=100
            "col_count": 1,
            "duration_ms": 50,
        }
        output = NasusAnalysisOutput(
            table=table,
            charts=[],
            insights=insights,
            metadata=metadata,
        )
        validation_errors = validate_analysis_output(output)
        assert any("row_count" in e for e in validation_errors), (
            f"Expected row_count mismatch error, got: {validation_errors}"
        )

    test("T12 — validate catches row_count mismatch", t12)

    # T13 — validate_analysis_output catches duplicate chart IDs
    def t13():
        col = ColumnMeta(
            name="x", dtype="int64", null_count=0, null_pct=0.0, unique_count=10
        )
        table = TableOutput(columns=[col], row_count=10)
        insights = InsightsOutput(
            summary="s",
            bullets=[],
            data_quality_score=0.9,
        )
        metadata = {
            "analysis_id": "ana_test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "input_format": "dataframe",
            "row_count": 10,
            "col_count": 1,
            "duration_ms": 50,
        }
        chart1 = ChartOutput(
            chart_id="chart_duplicate",
            title="Chart 1",
            chart_type="bar",
            library="plotly",
            payload={},
            x_label="X",
            y_label="Y",
        )
        chart2 = ChartOutput(
            chart_id="chart_duplicate",  # same ID — should trigger validation error
            title="Chart 2",
            chart_type="line",
            library="plotly",
            payload={},
            x_label="X",
            y_label="Y",
        )
        output = NasusAnalysisOutput(
            table=table,
            charts=[chart1, chart2],
            insights=insights,
            metadata=metadata,
        )
        validation_errors = validate_analysis_output(output)
        assert any("Duplicate" in e for e in validation_errors), (
            f"Expected duplicate chart_id error, got: {validation_errors}"
        )

    test("T13 — validate catches duplicate chart IDs", t13)

    # T14 — validate_analysis_output passes on valid output
    def t14():
        col = ColumnMeta(
            name="x", dtype="int64", null_count=0, null_pct=0.0, unique_count=10
        )
        table = TableOutput(columns=[col], row_count=10)
        insights = InsightsOutput(
            summary="Everything looks good.",
            bullets=[
                InsightBullet(
                    text="Stable data",
                    confidence=0.95,
                    supporting_stat="std=0.01",
                    category="trend",
                )
            ],
            data_quality_score=0.95,
        )
        metadata = {
            "analysis_id": "ana_test",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "input_format": "dataframe",
            "row_count": 10,
            "col_count": 1,
            "duration_ms": 50,
        }
        output = NasusAnalysisOutput(
            table=table,
            charts=[],
            insights=insights,
            metadata=metadata,
        )
        validation_errors = validate_analysis_output(output)
        assert len(validation_errors) == 0, (
            f"Expected no validation errors, got: {validation_errors}"
        )

    test("T14 — validate passes on valid output", t14)

    print(f"\n  Results: {passed} passed, {failed} failed\n")


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_schema_tests()
