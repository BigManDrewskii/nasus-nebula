# =============================================================================
# nasus_data_analyst.py
# Nasus AI -- Data Analyst Sub-Agent Module
# =============================================================================
# Requirements:
#   pip install pandas plotly matplotlib seaborn pydantic openpyxl pyarrow
# =============================================================================

# ---------------------------------------------------------------------------
# CANONICAL SCHEMA: nasus_data_analyst_schema.py
# The classes below (ColumnMeta, TableOutput, ChartOutput, InsightBullet,
# InsightsOutput, NasusAnalysisOutput) are defined inline for historical
# reasons. The canonical, tested versions live in nasus_data_analyst_schema.py.
# New consumers should import from that file instead:
#
#   from nasus_data_analyst_schema import (
#       ColumnMeta, TableOutput, ChartOutput,
#       InsightBullet, InsightsOutput, NasusAnalysisOutput,
#       validate_analysis_output,
#   )
# ---------------------------------------------------------------------------

from __future__ import annotations

import base64
import io
import json
import time
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional, Union

import matplotlib
matplotlib.use("Agg")  # non-interactive backend -- safe for server environments
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import seaborn as sns
from pydantic import BaseModel, Field, field_validator, model_validator


# =============================================================================
# ARTIFACT 1 -- SPECIALIST SYSTEM PROMPT
# =============================================================================

SYSTEM_PROMPT = """
# ROLE & IDENTITY
# ---------------
# Name: Nasus Data Analyst
# Platform: Nasus AI -- embedded data analysis and visualization specialist
#
# Your sole domain: data analysis, statistical inference, visualization design,
# and insight extraction. Decline anything outside this domain with one line.
#
# Tone: precise and professional. Lead with findings. Back every claim with a
# computed statistic. Never pad responses with filler.

You are Nasus Data Analyst, an expert analyst embedded inside the Nasus AI
platform. Respond only to data analysis, visualization, statistics, and
insight-extraction tasks.

# SUPPORTED INPUT FORMATS
# -----------------------
# - CSV  (auto-detect delimiter and encoding)
# - JSON (records, columns, or split orientation)
# - Excel (.xlsx / .xls) -- first sheet unless specified
# - Parquet
# - SQL query results passed as Python dict or list-of-dicts
#
# On load you MUST:
#   1. Infer schema (column names, dtypes)
#   2. Count nulls per column -- report if > 5%
#   3. Detect duplicate rows and report count
#   4. Coerce ambiguous types ("1,234" -> float; "2024-01-01" -> datetime)
#   5. Never silently drop rows -- flag all cleaning decisions in caveats

Accepted inputs: CSV, JSON, Excel (.xlsx/.xls), Parquet, SQL result dicts.
Auto-detect delimiter, encoding, and schema on load. Handle missing values,
mixed types, and duplicate rows. Flag all decisions in the caveats field.

# CORE ANALYTICAL CAPABILITIES
# ----------------------------
# Descriptive: mean, median, mode, std dev, variance, IQR, skewness, kurtosis,
#   percentiles (p5, p25, p75, p95)
# Distribution: histograms, KDE, box plots, violin plots, Q-Q plots
# Correlation: Pearson, Spearman, Kendall; output heatmap + matrix
# Time-series: trend (linear/poly), seasonality, rolling averages (7d/30d/90d),
#   YoY/MoM comparisons, lag analysis
# Categorical: frequency tables, Pareto charts, crosstabs, chi-square tests
# Outlier: IQR fence, Z-score (|z|>3), DBSCAN flagging -- return row indices
# Regression: OLS linear, polynomial (deg 2-4), logistic (binary target)
#   -- return coefficients, R-squared, p-values, residual plot
# Clustering: K-Means (elbow for k), DBSCAN (auto eps via kNN)
#   -- return labels, silhouette score, centroid stats
# Advanced: cohort retention, funnel analysis, RFM scoring (column-mapped)

# CHART LIBRARY SELECTION LOGIC (FOLLOW STRICTLY)
# ------------------------------------------------
# IF output_target == "web" OR output_target == "interactive":
#     USE Plotly -- return fig.to_json() as payload
#     Best for: line, scatter, bar, pie, heatmap, 3D, dashboards
#
# ELIF output_target == "static" OR "export" OR "pdf":
#     USE Matplotlib -- return base64-encoded PNG
#     Best for: publication-quality, print/export contexts
#
# ELIF chart_type in ["distribution","correlation_heatmap","pairplot","regression_plot"]:
#     USE Seaborn (Matplotlib backend) -- return base64 PNG
#     Note: Seaborn for styled statistical plots only, never interactive
#
# ELIF output_target == "frontend_custom" OR flag == "d3":
#     RETURN D3-compatible JSON: {"data":[...],"x_scale":{...},"y_scale":{...},"axes":{...}}
#     Do NOT generate D3 JavaScript -- structured data only
#
# DEFAULT: USE Plotly (safe default for all web contexts)

# STRICT OUTPUT RULES
# -------------------
# 1. Always return NasusAnalysisOutput-compliant JSON
# 2. Every chart MUST have: title, x_label, y_label, legend (if multi-series)
# 3. Never invent, impute, or hallucinate data values
# 4. If data insufficient: set error field explaining why
# 5. Every InsightBullet requires confidence score (0.0-1.0)
# 6. Round all floats to 4 decimal places in JSON
# 7. All timestamps: ISO 8601

# HARD PROHIBITIONS
# -----------------
# - NEVER produce unlabeled axes
# - NEVER produce charts without titles
# - NEVER hallucinate or interpolate missing data points
# - NEVER run destructive operations without explicit user instruction
# - NEVER produce narrative contradicting computed statistics
# - NEVER use ambiguous column references -- resolve or ask
# - NEVER omit caveats when data quality is compromised
"""


# =============================================================================
# ARTIFACT 2 -- REFINE / ITERATION PATTERN
# =============================================================================

REFINE_PATTERN: dict[str, Any] = {
    # Keywords that signal the user wants to iterate on a prior result.
    # Used as a first-pass gate before deeper signal matching.
    "trigger_keywords": [
        "change", "update", "modify", "adjust", "tweak", "edit",
        "filter", "exclude", "include", "limit", "zoom",
        "instead", "switch", "swap", "use", "show as",
        "what does", "explain", "why", "clarify", "what is",
        "redo", "rerun", "again", "retry",
        "last", "previous", "that chart", "that table",
    ],

    # Registry of refinement types. Each entry documents:
    #   - description: what this type covers
    #   - example_phrases: natural language examples
    #   - detection_signals: keywords scored against the user message
    #   - patch_strategy: how last_output is updated
    #   - requires_reanalysis: True = re-run full pipeline; False = patch only
    "refinement_types": {

        # Visual-only changes -- no stats recomputation needed
        "visual_tweak": {
            "description": "Aesthetic or formatting change to an existing chart",
            "example_phrases": [
                "change color to blue", "make bars horizontal",
                "increase font size", "remove grid lines",
                "add annotations", "rotate x-axis labels",
            ],
            "detection_signals": [
                "color", "colour", "horizontal", "vertical",
                "font", "grid", "annotate", "label", "rotate",
                "theme", "style", "palette",
            ],
            "patch_strategy": "Regenerate chart only; preserve stats and insights",
            "requires_reanalysis": False,
        },

        # Re-run with a filtered subset of the data
        "filter_rerun": {
            "description": "Apply a filter to the dataset and re-run the same analysis",
            "example_phrases": [
                "filter to Q3 only", "exclude outliers",
                "only show US region", "remove nulls first",
                "top 10 products only",
            ],
            "detection_signals": [
                "filter", "only", "exclude", "remove",
                "where", "top", "bottom", "subset",
                "without", "except",
            ],
            "patch_strategy": "Apply filter -> re-run full pipeline -> return new output",
            "requires_reanalysis": True,
        },

        # Swap the aggregation or statistical method
        "metric_swap": {
            "description": "Replace the aggregation or statistical method",
            "example_phrases": [
                "use median instead of mean", "show sum not average",
                "switch to percentage", "show cumulative",
            ],
            "detection_signals": [
                "median", "mean", "sum", "average", "total",
                "percentage", "percent", "cumulative",
                "instead of", "swap", "use",
            ],
            "patch_strategy": "Re-aggregate with new metric; rebuild chart and insights",
            "requires_reanalysis": True,
        },

        # Change chart type while keeping the same data
        "chart_type_change": {
            "description": "Switch to a different visualization type",
            "example_phrases": [
                "show as pie chart instead", "make it a scatter plot",
                "use a heatmap", "bar chart not line",
            ],
            "detection_signals": [
                "pie", "bar", "line", "scatter", "heatmap",
                "histogram", "box", "violin", "area",
                "show as", "as a", "instead",
            ],
            "patch_strategy": "Rebuild chart with new type; data and insights unchanged",
            "requires_reanalysis": False,
        },

        # Narrow or shift the time window
        "date_range": {
            "description": "Zoom into a specific date range or period",
            "example_phrases": [
                "zoom into last 30 days", "show only Q4",
                "from January to March", "year to date", "last 3 months",
            ],
            "detection_signals": [
                "last", "days", "weeks", "months", "year",
                "quarter", "Q1", "Q2", "Q3", "Q4",
                "from", "to", "between", "since", "until",
                "YTD", "MTD", "rolling",
            ],
            "patch_strategy": "Slice dataframe by date range -> re-run pipeline",
            "requires_reanalysis": True,
        },

        # User wants explanation, not a new chart
        "clarification_request": {
            "description": "User asks for meaning or context behind a result",
            "example_phrases": [
                "what does this spike mean?", "why is the trend negative?",
                "explain the outliers", "what caused the drop in March?",
            ],
            "detection_signals": [
                "what", "why", "explain", "mean", "cause",
                "reason", "interpret", "tell me", "clarify", "understand",
            ],
            "patch_strategy": "Augment insights field only; no chart regeneration",
            "requires_reanalysis": False,
        },
    },

    # How prior conversation turns are retained across refine() calls.
    # Strategy: append each turn as {role, content, output_snapshot}.
    # On refine(), retrieve the most recent NasusAnalysisOutput as the diff
    # base and apply only the delta -- avoid full re-analysis when possible.
    "context_accumulation": {
        "strategy": (
            "Append each turn as {role, content, output_snapshot} to "
            "conversation_history. On each refine() call, retrieve the most "
            "recent NasusAnalysisOutput as the diff base. Apply only the delta "
            "-- avoid full re-analysis when patch_strategy permits."
        ),
        "max_turns": 10,
        "fields_persisted": [
            "original_dataframe",   # held in memory as analyst._df
            "last_query",           # the user's last full analysis query
            "last_output",          # full NasusAnalysisOutput of last turn
            "applied_filters",      # cumulative filter stack
            "active_chart_type",    # chart type last rendered
            "active_metric",        # aggregation metric last used
            "date_range_bounds",    # (start, end) if a date filter is active
        ],
    },

    # Graceful error recovery: what to do when analysis cannot complete cleanly.
    "error_recovery": {
        "on_parse_error": (
            "Return error field: 'Could not parse input data. Expected one of: "
            "CSV, JSON, Excel, Parquet. Please check format and retry.'"
        ),
        "on_missing_column": (
            "Return error field: 'Column <name> not found. Available columns: "
            "<list>. Did you mean <closest_match>?' -- use difflib.get_close_matches."
        ),
        "on_empty_result": (
            "Return error field: 'Applied filters produced zero rows. "
            "Relax filter conditions or verify the date range covers your data.'"
        ),
        "on_ambiguous_request": (
            "Return clarification_needed field listing the ambiguous term "
            "and 2-3 interpretation options. Do not guess -- halt and ask."
        ),
    },

    # Ordered steps executed on every refine() call.
    "iteration_loop": [
        "1. RECEIVE follow-up message from user",
        "2. DETECT refinement_type via keyword scoring against detection_signals",
        "3. RETRIEVE last_output from conversation_history[-1]",
        "4. DIFF: compare new request against last_output state",
        "5. DECIDE: requires_reanalysis flag -> full pipeline vs. patch only",
        "6. PATCH output: apply delta (filter / metric / chart / insight)",
        "7. VALIDATE patched output against NasusAnalysisOutput schema",
        "8. APPEND new turn to conversation_history",
        "9. RETURN updated NasusAnalysisOutput",
    ],
}


# =============================================================================
# ARTIFACT 3 -- STRUCTURED OUTPUT SCHEMA (Pydantic v2)
# =============================================================================

class ColumnMeta(BaseModel):
    """Metadata for a single column in the analysed dataset."""

    name: str
    dtype: str
    null_count: int = Field(ge=0)
    null_pct: float = Field(ge=0.0, le=1.0)
    unique_count: int = Field(ge=0)
    sample_values: list[Any] = Field(default_factory=list)

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
        return v[:5]


class TableOutput(BaseModel):
    """Summary view of the loaded dataset."""

    columns: list[ColumnMeta]
    row_count: int = Field(ge=0)
    sample_rows: list[dict[str, Any]] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)

    @field_validator("sample_rows", mode="before")
    @classmethod
    def cap_sample_rows(cls, v: list[dict]) -> list[dict]:
        return v[:5]


class ChartOutput(BaseModel):
    """
    A single chart artifact.
    payload is either:
      - dict  (Plotly JSON, parsed from fig.to_json())
      - str   (base64-encoded PNG from Matplotlib/Seaborn, or D3 JSON string)
    """

    chart_id: str = Field(default_factory=lambda: f"chart_{uuid.uuid4().hex[:8]}")
    title: str
    chart_type: str   # "line" | "bar" | "scatter" | "pie" | "distribution" | etc.
    library: str      # "plotly" | "matplotlib" | "seaborn" | "d3"
    payload: Union[str, dict]
    x_label: str
    y_label: str
    legend: Optional[list[str]] = None
    render_hint: str = Field(
        default="plotly_json",
        description="Frontend hint: 'plotly_json' | 'base64_png' | 'd3_payload'",
    )

    @field_validator("library")
    @classmethod
    def validate_library(cls, v: str) -> str:
        allowed = {"plotly", "matplotlib", "seaborn", "d3"}
        if v not in allowed:
            raise ValueError(f"library must be one of {allowed}, got '{v}'")
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


class InsightBullet(BaseModel):
    """A single data-backed insight with confidence score and category."""

    text: str
    confidence: float = Field(ge=0.0, le=1.0)
    supporting_stat: str   # e.g. "mean=1234.56, std=200.11"
    category: str          # "trend" | "anomaly" | "correlation" | "distribution"

    @field_validator("confidence")
    @classmethod
    def round_confidence(cls, v: float) -> float:
        return round(v, 4)


class InsightsOutput(BaseModel):
    """Narrative summary + structured bullets + data quality score."""

    summary: str
    bullets: list[InsightBullet]
    data_quality_score: float = Field(ge=0.0, le=1.0)
    caveats: list[str] = Field(default_factory=list)

    @field_validator("data_quality_score")
    @classmethod
    def round_dq(cls, v: float) -> float:
        return round(v, 4)


class NasusAnalysisOutput(BaseModel):
    """
    Top-level output contract for the Nasus Data Analyst.
    Every analyze() and refine() call returns exactly this shape.
    """

    table: TableOutput
    charts: list[ChartOutput]
    insights: InsightsOutput
    metadata: dict[str, Any]
    # Required keys: analysis_id, timestamp, input_format, row_count, col_count, duration_ms
    error: Optional[str] = None

    @model_validator(mode="after")
    def validate_metadata_keys(self) -> "NasusAnalysisOutput":
        required = {
            "analysis_id", "timestamp", "input_format",
            "row_count", "col_count", "duration_ms",
        }
        missing = required - set(self.metadata.keys())
        if missing:
            raise ValueError(f"metadata missing required keys: {missing}")
        return self

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


# =============================================================================
# ARTIFACT 4 -- ORCHESTRATION CLASS
# =============================================================================

class NasusDataAnalyst:
    """
    Drop-in data analyst module for the Nasus orchestration layer.

    Usage:
        analyst = NasusDataAnalyst(output_target="web")
        result  = analyst.analyze(df, "Show revenue trends by region")
        refined = analyst.refine("Filter to Q4 only and show as bar chart")

    In production: wire llm_client to your LLM of choice. The system_prompt
    and refine_pattern are passed to the LLM context; this class handles
    data loading, chart generation, and schema validation.

    In prototype mode (llm_client=None): runs real pandas/plotly analysis
    directly without an LLM intermediary.
    """

    def __init__(
        self,
        output_target: str = "web",
        llm_client: Any = None,
    ) -> None:
        self.system_prompt: str = SYSTEM_PROMPT
        self.refine_pattern: dict = REFINE_PATTERN
        self.output_target: str = output_target
        self.llm_client: Any = llm_client          # injected in production
        self.conversation_history: list[dict] = []
        self.last_output: Optional[NasusAnalysisOutput] = None
        self._df: Optional[pd.DataFrame] = None    # retained across turns
        self._last_query: str = ""
        self._applied_filters: list[str] = []

    # -------------------------------------------------------------------------
    # Public API
    # -------------------------------------------------------------------------

    def analyze(self, data: Any, query: str) -> NasusAnalysisOutput:
        """
        Primary entry point.

        Accepts data (DataFrame, dict, list, or file-path string) and a
        natural-language query. Returns a validated NasusAnalysisOutput.

        Production path: forward system_prompt + data schema + query to LLM,
        parse structured response back into NasusAnalysisOutput.

        Prototype path (this file): run real pandas/plotly analysis directly.
        """
        t_start = time.perf_counter()
        analysis_id = f"ana_{uuid.uuid4().hex[:10]}"

        try:
            df = self._load_data(data)
        except Exception as exc:
            return self._error_output(str(exc), analysis_id, t_start)

        self._df = df.copy()
        self._last_query = query
        self._applied_filters = []

        table = self._build_table_output(df)
        stats = self._run_descriptive_stats(df)
        chart_type = self._infer_chart_type(query)
        chart = self._generate_chart(df, chart_type, query)
        insights = self._extract_insights(df, stats, query)

        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)
        output = NasusAnalysisOutput(
            table=table,
            charts=[chart],
            insights=insights,
            metadata={
                "analysis_id": analysis_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "input_format": self._detect_input_format(data),
                "row_count": len(df),
                "col_count": len(df.columns),
                "duration_ms": duration_ms,
                "query": query,
            },
        )
        self.last_output = output
        self.conversation_history.append(
            {"role": "user", "content": query, "output": output}
        )
        return output

    def refine(self, follow_up: str) -> NasusAnalysisOutput:
        """
        Handles follow-up / iteration.

        Detects the refinement type using REFINE_PATTERN keyword scoring,
        applies a targeted patch (filter, chart swap, metric change, etc.),
        and returns an updated NasusAnalysisOutput linked to the parent.
        """
        if self._df is None or self.last_output is None:
            return self._error_output(
                "No prior analysis found. Call analyze() first.",
                f"ana_{uuid.uuid4().hex[:10]}",
                time.perf_counter(),
            )

        t_start = time.perf_counter()
        refine_type = self._detect_refinement_type(follow_up)
        df = self._df.copy()

        # Apply targeted patch based on detected refinement type
        if refine_type == "filter_rerun":
            df = self._apply_text_filter(df, follow_up)
            if df.empty:
                return self._error_output(
                    "Applied filters produced zero rows. Relax filter conditions.",
                    f"ana_{uuid.uuid4().hex[:10]}",
                    t_start,
                )

        if refine_type == "date_range":
            df = self._apply_date_filter(df, follow_up)
            if df.empty:
                return self._error_output(
                    "Date range filter produced zero rows.",
                    f"ana_{uuid.uuid4().hex[:10]}",
                    t_start,
                )

        # Chart type: explicit in follow-up takes priority, then carry forward
        chart_type = self._infer_chart_type(follow_up)
        if chart_type == "line":
            # "line" is default; check combined message for stronger signal
            chart_type = self._infer_chart_type(follow_up + " " + self._last_query)

        analysis_id = f"ana_{uuid.uuid4().hex[:10]}"
        parent_id = self.last_output.metadata.get("analysis_id", "")

        table = self._build_table_output(df)
        stats = self._run_descriptive_stats(df)
        chart = self._generate_chart(df, chart_type, follow_up)
        insights = self._extract_insights(df, stats, follow_up)

        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)
        output = NasusAnalysisOutput(
            table=table,
            charts=[chart],
            insights=insights,
            metadata={
                "analysis_id": analysis_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "input_format": "dataframe",
                "row_count": len(df),
                "col_count": len(df.columns),
                "duration_ms": duration_ms,
                "query": follow_up,
                "refinement_type": refine_type,
                "parent_analysis": parent_id,
                "applied_filters": list(self._applied_filters),
            },
        )
        self.last_output = output
        self.conversation_history.append(
            {"role": "user", "content": follow_up, "output": output}
        )
        # Trim history to configured max_turns
        max_turns = self.refine_pattern["context_accumulation"]["max_turns"]
        if len(self.conversation_history) > max_turns:
            self.conversation_history = self.conversation_history[-max_turns:]
        return output

    # -------------------------------------------------------------------------
    # Private: refinement detection
    # -------------------------------------------------------------------------

    def _detect_refinement_type(self, message: str) -> str:
        """
        Score each refinement type by counting detection_signal hits in the
        message. Returns the highest-scoring type, defaulting to visual_tweak.
        """
        msg_lower = message.lower()
        scores: dict[str, int] = {}
        for rtype, cfg in self.refine_pattern["refinement_types"].items():
            hits = sum(
                1 for sig in cfg["detection_signals"]
                if sig.lower() in msg_lower
            )
            scores[rtype] = hits
        best = max(scores, key=lambda k: scores[k])
        return best if scores[best] > 0 else "visual_tweak"

    # -------------------------------------------------------------------------
    # Private: data loading
    # -------------------------------------------------------------------------

    def _load_data(self, data: Any) -> pd.DataFrame:
        """Load data from DataFrame, dict, list, or file-path string."""
        if isinstance(data, pd.DataFrame):
            return data.reset_index(drop=True)
        if isinstance(data, (list, dict)):
            return pd.DataFrame(data).reset_index(drop=True)
        if isinstance(data, str):
            p = Path(data)
            if not p.exists():
                raise FileNotFoundError(f"File not found: {data}")
            ext = p.suffix.lower()
            loaders: dict[str, Any] = {
                ".csv":     lambda: pd.read_csv(p, encoding_errors="replace"),
                ".json":    lambda: pd.read_json(p),
                ".xlsx":    lambda: pd.read_excel(p),
                ".xls":     lambda: pd.read_excel(p),
                ".parquet": lambda: pd.read_parquet(p),
            }
            if ext not in loaders:
                raise ValueError(f"Unsupported file type: {ext}")
            return loaders[ext]().reset_index(drop=True)
        raise TypeError(f"Cannot load data of type {type(data).__name__}")

    def _detect_input_format(self, data: Any) -> str:
        if isinstance(data, pd.DataFrame):
            return "dataframe"
        if isinstance(data, list):
            return "list"
        if isinstance(data, dict):
            return "dict"
        if isinstance(data, str):
            return Path(data).suffix.lstrip(".") or "file"
        return "unknown"

    # -------------------------------------------------------------------------
    # Private: table summary
    # -------------------------------------------------------------------------

    def _build_table_output(self, df: pd.DataFrame) -> TableOutput:
        """Build ColumnMeta list + sample rows + data quality warnings."""
        warnings: list[str] = []
        dup_count = int(df.duplicated().sum())
        if dup_count:
            warnings.append(f"{dup_count} duplicate rows detected.")

        cols: list[ColumnMeta] = []
        for col in df.columns:
            null_count = int(df[col].isna().sum())
            null_pct = round(null_count / max(len(df), 1), 4)
            if null_pct > 0.05:
                warnings.append(f"Column '{col}' has {null_pct:.1%} nulls.")
            unique_count = int(df[col].nunique(dropna=False))
            raw_samples = df[col].dropna().head(5).tolist()
            sample_values = [
                v.isoformat() if isinstance(v, (pd.Timestamp, datetime)) else v
                for v in raw_samples
            ]
            cols.append(ColumnMeta(
                name=col,
                dtype=str(df[col].dtype),
                null_count=null_count,
                null_pct=null_pct,
                unique_count=unique_count,
                sample_values=sample_values,
            ))

        # Serialize sample rows -- convert Timestamps to ISO strings
        sample_rows: list[dict] = []
        for row in df.head(5).to_dict(orient="records"):
            clean: dict = {}
            for k, v in row.items():
                if isinstance(v, (pd.Timestamp, datetime)):
                    clean[k] = v.isoformat()
                elif isinstance(v, float) and not np.isfinite(v):
                    clean[k] = None
                else:
                    clean[k] = v
            sample_rows.append(clean)

        return TableOutput(
            columns=cols,
            row_count=len(df),
            sample_rows=sample_rows,
            warnings=warnings,
        )

    # -------------------------------------------------------------------------
    # Private: library selection & stats
    # -------------------------------------------------------------------------

    def _select_chart_library(self, chart_type: str) -> str:
        """Resolve which library to use per the system prompt decision tree."""
        if self.output_target in ("web", "interactive"):
            return "plotly"
        if self.output_target in ("static", "export", "pdf"):
            if chart_type in ("distribution", "correlation_heatmap",
                               "pairplot", "regression_plot"):
                return "seaborn"
            return "matplotlib"
        # Default target -- still respect statistical chart types
        if chart_type in ("distribution", "correlation_heatmap",
                           "pairplot", "regression_plot"):
            return "seaborn"
        return "plotly"

    def _run_descriptive_stats(self, df: pd.DataFrame) -> dict:
        """Compute full descriptive statistics for all numeric columns."""
        numeric = df.select_dtypes(include="number")
        if numeric.empty:
            return {}
        stats: dict = {}
        for col in numeric.columns:
            s = numeric[col].dropna()
            if s.empty:
                continue
            q1 = float(s.quantile(0.25))
            q3 = float(s.quantile(0.75))
            stats[col] = {
                "mean":     round(float(s.mean()), 4),
                "median":   round(float(s.median()), 4),
                "std":      round(float(s.std()), 4),
                "variance": round(float(s.var()), 4),
                "min":      round(float(s.min()), 4),
                "max":      round(float(s.max()), 4),
                "q1":       round(q1, 4),
                "q3":       round(q3, 4),
                "iqr":      round(q3 - q1, 4),
                "skewness": round(float(s.skew()), 4),
                "kurtosis": round(float(s.kurtosis()), 4),
                "p5":       round(float(s.quantile(0.05)), 4),
                "p95":      round(float(s.quantile(0.95)), 4),
            }
        return stats

    def _infer_chart_type(self, query: str) -> str:
        """Infer the most appropriate chart type from natural language keywords."""
        q = query.lower()
        if any(w in q for w in ("trend", "over time", "monthly", "weekly", "daily",
                                  "time series", "by month", "by week", "timeline")):
            return "line"
        if any(w in q for w in ("bar chart", "bar graph", "compare", "comparison",
                                  "by region", "by category", "by product", "show as bar")):
            return "bar"
        if any(w in q for w in ("distribution", "histogram", "spread", "frequency")):
            return "distribution"
        if any(w in q for w in ("scatter", "correlation between", "relationship")):
            return "scatter"
        if any(w in q for w in ("heatmap", "correlation matrix", "correlations")):
            return "correlation_heatmap"
        if any(w in q for w in ("pie", "share", "proportion", "breakdown", "composition")):
            return "pie"
        return "line"

    # -------------------------------------------------------------------------
    # Private: chart generation
    # -------------------------------------------------------------------------

    def _generate_chart(
        self, df: pd.DataFrame, chart_type: str, query: str
    ) -> ChartOutput:
        """Route chart generation to the correct library and return ChartOutput."""
        library = self._select_chart_library(chart_type)
        date_col = next(
            (c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])),
            None,
        )
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
        y_col = numeric_cols[0] if numeric_cols else None

        if library == "plotly":
            return self._plotly_chart(df, chart_type, date_col, y_col, cat_cols, query)
        return self._mpl_chart(df, chart_type, date_col, y_col, cat_cols, query, library)

    def _plotly_chart(
        self,
        df: pd.DataFrame,
        chart_type: str,
        date_col: Optional[str],
        y_col: Optional[str],
        cat_cols: list[str],
        query: str,
    ) -> ChartOutput:
        """Build a Plotly figure and return payload as parsed JSON dict."""
        color_col = cat_cols[0] if cat_cols else None
        title = self._make_title(query, chart_type)
        x_label = y_label = ""
        legend: Optional[list[str]] = None

        if chart_type == "bar" and color_col and y_col:
            agg = df.groupby(color_col)[y_col].sum().reset_index()
            fig = px.bar(
                agg, x=color_col, y=y_col, title=title, color=color_col,
                labels={color_col: color_col.title(), y_col: y_col.title()},
            )
            x_label, y_label = color_col.title(), y_col.title()
            legend = agg[color_col].unique().tolist()

        elif chart_type == "pie" and color_col and y_col:
            agg = df.groupby(color_col)[y_col].sum().reset_index()
            fig = px.pie(agg, names=color_col, values=y_col, title=title)
            x_label, y_label = "", y_col.title()
            legend = agg[color_col].unique().tolist()

        elif chart_type == "scatter" and y_col:
            num_cols = df.select_dtypes(include="number").columns.tolist()
            x_num = num_cols[1] if len(num_cols) > 1 else num_cols[0]
            fig = px.scatter(
                df, x=x_num, y=y_col, color=color_col, title=title,
                labels={x_num: x_num.title(), y_col: y_col.title()},
            )
            x_label, y_label = x_num.title(), y_col.title()
            legend = df[color_col].unique().tolist() if color_col else None

        elif chart_type == "line" and y_col:
            x_col = date_col or (df.columns[0] if len(df.columns) > 0 else None)
            if x_col and color_col:
                agg = df.groupby([x_col, color_col])[y_col].sum().reset_index()
                fig = px.line(
                    agg, x=x_col, y=y_col, color=color_col, title=title,
                    labels={x_col: x_col.title(), y_col: y_col.title()},
                )
                legend = agg[color_col].unique().tolist()
            elif x_col:
                agg = df.groupby(x_col)[y_col].sum().reset_index()
                fig = px.line(
                    agg, x=x_col, y=y_col, title=title,
                    labels={x_col: x_col.title(), y_col: y_col.title()},
                )
            else:
                fig = px.line(df, y=y_col, title=title)
            x_label = (x_col or "Index").title()
            y_label = y_col.title()

        else:
            # Fallback: bar by category or histogram of first numeric
            if color_col and y_col:
                agg = df.groupby(color_col)[y_col].sum().reset_index()
                fig = px.bar(agg, x=color_col, y=y_col, title=title)
                x_label, y_label = color_col.title(), y_col.title()
                legend = agg[color_col].unique().tolist()
            elif y_col:
                fig = px.histogram(df, x=y_col, title=title)
                x_label, y_label = y_col.title(), "Count"
            else:
                fig = go.Figure()
                fig.update_layout(title=title)
                x_label, y_label = "X", "Y"

        fig.update_layout(
            xaxis_title=x_label,
            yaxis_title=y_label,
            legend_title_text=color_col.title() if color_col else "",
            template="plotly_white",
        )

        return ChartOutput(
            title=title,
            chart_type=chart_type,
            library="plotly",
            payload=json.loads(fig.to_json()),
            x_label=x_label,
            y_label=y_label,
            legend=legend,
            render_hint="plotly_json",
        )

    def _mpl_chart(
        self,
        df: pd.DataFrame,
        chart_type: str,
        date_col: Optional[str],
        y_col: Optional[str],
        cat_cols: list[str],
        query: str,
        library: str,
    ) -> ChartOutput:
        """Build a Matplotlib/Seaborn figure and return as base64 PNG string."""
        sns.set_theme(style="whitegrid")
        fig, ax = plt.subplots(figsize=(10, 6))
        title = self._make_title(query, chart_type)
        color_col = cat_cols[0] if cat_cols else None
        x_label = y_label = ""

        if chart_type == "distribution" and y_col:
            sns.histplot(df[y_col].dropna(), kde=True, ax=ax, color="#4C72B0")
            ax.set_xlabel(y_col.title())
            ax.set_ylabel("Count")
            x_label, y_label = y_col.title(), "Count"

        elif chart_type == "correlation_heatmap":
            numeric = df.select_dtypes(include="number")
            corr = numeric.corr()
            sns.heatmap(corr, annot=True, fmt=".2f", cmap="coolwarm",
                        ax=ax, linewidths=0.5)
            x_label, y_label = "Features", "Features"

        elif chart_type == "bar" and color_col and y_col:
            agg = df.groupby(color_col)[y_col].sum().reset_index()
            ax.bar(agg[color_col], agg[y_col],
                   color=sns.color_palette("tab10", len(agg)))
            ax.set_xlabel(color_col.title())
            ax.set_ylabel(y_col.title())
            plt.xticks(rotation=45, ha="right")
            x_label, y_label = color_col.title(), y_col.title()

        elif y_col:
            x_col = date_col or df.columns[0]
            agg = df.groupby(x_col)[y_col].sum().reset_index()
            ax.plot(agg[x_col], agg[y_col], marker="o", linewidth=2)
            ax.set_xlabel(x_col.title())
            ax.set_ylabel(y_col.title())
            plt.xticks(rotation=45, ha="right")
            x_label, y_label = x_col.title(), y_col.title()
        else:
            x_label, y_label = "X", "Y"

        ax.set_title(title, fontsize=14, fontweight="bold")
        plt.tight_layout()

        buf = io.BytesIO()
        fig.savefig(buf, format="png", dpi=150)
        buf.seek(0)
        b64 = base64.b64encode(buf.read()).decode("utf-8")
        plt.close(fig)

        return ChartOutput(
            title=title,
            chart_type=chart_type,
            library=library,
            payload=b64,
            x_label=x_label,
            y_label=y_label,
            render_hint="base64_png",
        )

    # -------------------------------------------------------------------------
    # Private: insights
    # -------------------------------------------------------------------------

    def _extract_insights(
        self, df: pd.DataFrame, stats: dict, query: str
    ) -> InsightsOutput:
        """Generate data-backed InsightBullets from computed statistics."""
        bullets: list[InsightBullet] = []
        caveats: list[str] = []
        numeric_cols = df.select_dtypes(include="number").columns.tolist()
        cat_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()

        # Data quality score
        total_cells = df.shape[0] * df.shape[1]
        null_cells = int(df.isna().sum().sum())
        dq_score = round(1.0 - (null_cells / max(total_cells, 1)), 4)
        if null_cells > 0:
            caveats.append(
                f"{null_cells} null values across dataset "
                f"({null_cells / max(total_cells, 1):.1%} of cells)."
            )

        # Insight 1: primary metric summary
        if numeric_cols:
            primary = numeric_cols[0]
            s = stats.get(primary, {})
            if s:
                bullets.append(InsightBullet(
                    text=(
                        f"'{primary}' mean={s['mean']:,} "
                        f"(median={s['median']:,}), "
                        f"range [{s['min']:,} to {s['max']:,}], "
                        f"std={s['std']:,}."
                    ),
                    confidence=0.99,
                    supporting_stat=(
                        f"mean={s['mean']}, median={s['median']}, "
                        f"std={s['std']}, min={s['min']}, max={s['max']}"
                    ),
                    category="distribution",
                ))

        # Insight 2: skewness flag
        for col in numeric_cols:
            skew = stats.get(col, {}).get("skewness", 0.0)
            if abs(skew) > 1.0:
                direction = "right (positive)" if skew > 0 else "left (negative)"
                bullets.append(InsightBullet(
                    text=(
                        f"'{col}' is strongly {direction}-skewed "
                        f"(skewness={skew:.4f}) -- likely outliers or "
                        f"a non-normal distribution."
                    ),
                    confidence=0.92,
                    supporting_stat=f"skewness={skew:.4f}",
                    category="distribution",
                ))
                break  # one skew insight per report

        # Insight 3: top categorical segment
        if cat_cols and numeric_cols:
            cat, num = cat_cols[0], numeric_cols[0]
            try:
                grouped = df.groupby(cat)[num].sum()
                top = grouped.idxmax()
                top_val = round(float(grouped.max()), 4)
                total_val = round(float(df[num].sum()), 4)
                share = round(top_val / max(total_val, 1e-9), 4)
                bullets.append(InsightBullet(
                    text=(
                        f"'{top}' leads '{num}' with "
                        f"{top_val:,} ({share:.1%} of total)."
                    ),
                    confidence=0.97,
                    supporting_stat=(
                        f"top_segment={top}, value={top_val}, "
                        f"share={share:.4f}, total={total_val}"
                    ),
                    category="trend",
                ))
            except Exception:
                pass

        # Insight 4: IQR outlier count
        if numeric_cols:
            col = numeric_cols[0]
            s = stats.get(col, {})
            if s:
                lo = s["q1"] - 1.5 * s["iqr"]
                hi = s["q3"] + 1.5 * s["iqr"]
                n_out = int(((df[col] < lo) | (df[col] > hi)).sum())
                if n_out:
                    bullets.append(InsightBullet(
                        text=(
                            f"{n_out} outlier(s) in '{col}' "
                            f"outside IQR fence [{lo:.2f}, {hi:.2f}]."
                        ),
                        confidence=0.88,
                        supporting_stat=(
                            f"IQR_lower={lo:.4f}, IQR_upper={hi:.4f}, "
                            f"outlier_count={n_out}"
                        ),
                        category="anomaly",
                    ))

        # Build summary narrative
        row_desc = f"{len(df):,} rows x {len(df.columns)} columns"
        primary_metric = (
            f"Primary metric '{numeric_cols[0]}': "
            f"mean={stats.get(numeric_cols[0], {}).get('mean', 'N/A')}. "
            if numeric_cols else ""
        )
        segment_driver = (
            f"Key segment driver: '{cat_cols[0]}'. " if cat_cols else ""
        )
        summary = (
            f"Dataset: {row_desc}. "
            f"{primary_metric}"
            f"{segment_driver}"
            f"Data quality score: {dq_score:.2f}."
        )

        return InsightsOutput(
            summary=summary,
            bullets=bullets,
            data_quality_score=dq_score,
            caveats=caveats,
        )

    # -------------------------------------------------------------------------
    # Private: filters
    # -------------------------------------------------------------------------

    def _apply_text_filter(self, df: pd.DataFrame, message: str) -> pd.DataFrame:
        """Parse and apply keyword-based filters from a follow-up message."""
        msg = message.lower()
        date_col = next(
            (c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])),
            None,
        )

        # Quarter filter
        for q, (m_start, m_end) in {
            "q1": (1, 3), "q2": (4, 6), "q3": (7, 9), "q4": (10, 12)
        }.items():
            if q in msg.split() or f" {q} " in msg or msg.endswith(q):
                if date_col:
                    df = df[df[date_col].dt.month.between(m_start, m_end)].copy()
                    self._applied_filters.append(f"quarter={q.upper()}")
                break

        # Outlier exclusion via IQR
        if "outlier" in msg and ("exclude" in msg or "remove" in msg):
            for col in df.select_dtypes(include="number").columns:
                q1_val = df[col].quantile(0.25)
                q3_val = df[col].quantile(0.75)
                iqr = q3_val - q1_val
                df = df[df[col].between(q1_val - 1.5 * iqr,
                                         q3_val + 1.5 * iqr)].copy()
                self._applied_filters.append(f"iqr_exclude:{col}")

        return df

    def _apply_date_filter(self, df: pd.DataFrame, message: str) -> pd.DataFrame:
        """Narrow to a rolling N-day window if message specifies 'last N days'."""
        import re
        date_col = next(
            (c for c in df.columns if pd.api.types.is_datetime64_any_dtype(df[c])),
            None,
        )
        if not date_col:
            return df
        m = re.search(r"last\s+(\d+)\s+days?", message.lower())
        if m:
            n = int(m.group(1))
            cutoff = df[date_col].max() - pd.Timedelta(days=n)
            df = df[df[date_col] >= cutoff].copy()
            self._applied_filters.append(f"rolling_{n}d")
        return df

    # -------------------------------------------------------------------------
    # Private: utilities
    # -------------------------------------------------------------------------

    def _make_title(self, query: str, chart_type: str) -> str:
        """Derive a clean chart title from the query (max 80 chars)."""
        q = query.strip().rstrip("?.")
        if len(q) <= 80:
            return q
        return f"{chart_type.replace('_', ' ').title()} Analysis"

    def _error_output(
        self, error_msg: str, analysis_id: str, t_start: float
    ) -> NasusAnalysisOutput:
        """Construct a minimal valid NasusAnalysisOutput carrying an error."""
        duration_ms = round((time.perf_counter() - t_start) * 1000, 1)
        return NasusAnalysisOutput(
            table=TableOutput(columns=[], row_count=0, sample_rows=[], warnings=[]),
            charts=[],
            insights=InsightsOutput(
                summary="Analysis could not complete due to an error.",
                bullets=[],
                data_quality_score=0.0,
                caveats=[error_msg],
            ),
            metadata={
                "analysis_id": analysis_id,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "input_format": "unknown",
                "row_count": 0,
                "col_count": 0,
                "duration_ms": duration_ms,
            },
            error=error_msg,
        )


# =============================================================================
# RUNNABLE DEMO
# =============================================================================

if __name__ == "__main__":
    import random

    random.seed(42)
    np.random.seed(42)

    # Generate a synthetic sales dataset (100 rows)
    regions  = ["North", "South", "East", "West"]
    products = ["Alpha", "Beta", "Gamma", "Delta"]
    dates    = pd.date_range("2025-01-01", periods=100, freq="3D")

    df_demo = pd.DataFrame({
        "date":    dates,
        "region":  [random.choice(regions)  for _ in range(100)],
        "product": [random.choice(products) for _ in range(100)],
        "revenue": np.round(np.random.normal(2500, 800, 100).clip(300), 2),
        "units":   np.random.randint(10, 200, 100),
        "margin":  np.round(np.random.uniform(0.08, 0.45, 100), 4),
    })

    print("=" * 70)
    print("NASUS DATA ANALYST -- DEMO RUN")
    print("=" * 70)

    analyst = NasusDataAnalyst(output_target="web")

    # --- Run 1: Full trend analysis -------------------------------------------
    print("\n[1] analyze() -- Revenue trends by region with key insights\n")
    result1 = analyst.analyze(
        df_demo, "Show me revenue trends by region with key insights"
    )

    out1 = result1.model_dump()
    # Truncate large Plotly payload for readable demo output
    out1["charts"][0]["payload"] = "<plotly_json truncated>"
    print(json.dumps({
        "analysis_id":       out1["metadata"]["analysis_id"],
        "row_count":         out1["metadata"]["row_count"],
        "duration_ms":       out1["metadata"]["duration_ms"],
        "table_warnings":    out1["table"]["warnings"],
        "chart_title":       out1["charts"][0]["title"],
        "chart_library":     out1["charts"][0]["library"],
        "chart_type":        out1["charts"][0]["chart_type"],
        "insights_summary":  out1["insights"]["summary"],
        "insight_bullets": [
            {"text": b["text"], "confidence": b["confidence"]}
            for b in out1["insights"]["bullets"]
        ],
        "data_quality_score": out1["insights"]["data_quality_score"],
        "error": out1["error"],
    }, indent=2))

    # --- Run 2: Refinement -- Q4 filter + bar chart ---------------------------
    print("\n[2] refine() -- Filter to Q4 only and show as bar chart\n")
    result2 = analyst.refine("Filter to Q4 only and show as bar chart")

    out2 = result2.model_dump()
    out2["charts"][0]["payload"] = "<plotly_json truncated>"
    print(json.dumps({
        "analysis_id":     out2["metadata"]["analysis_id"],
        "refinement_type": out2["metadata"].get("refinement_type"),
        "parent_analysis": out2["metadata"].get("parent_analysis"),
        "applied_filters": out2["metadata"].get("applied_filters"),
        "row_count":       out2["metadata"]["row_count"],
        "chart_type":      out2["charts"][0]["chart_type"],
        "insight_bullets": [
            {"text": b["text"], "confidence": b["confidence"]}
            for b in out2["insights"]["bullets"]
        ],
        "error": out2["error"],
    }, indent=2))

    # --- Schema validation check ----------------------------------------------
    print("\n[3] Schema validation\n")
    try:
        NasusAnalysisOutput.model_validate(result1.model_dump())
        NasusAnalysisOutput.model_validate(result2.model_dump())
        print("  PASS: Both outputs validate against NasusAnalysisOutput schema.")
    except Exception as e:
        print(f"  FAIL: {e}")

    print("\n" + "=" * 70)
    print("Demo complete. Module ready for Nasus orchestration layer.")
    print("=" * 70)
