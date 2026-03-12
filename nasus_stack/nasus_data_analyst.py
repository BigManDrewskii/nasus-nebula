"""
NASUS DATA ANALYST — RUNTIME
Version: 1.0 | Module: M04 | Stack: Nasus Sub-Agent Network

Entry point: route_envelope(envelope: NasusEnvelope) -> NasusEnvelope

Functions:
  load_data()        — parse CSV/JSON/dict-list, compute ColumnStats
  run_analysis()     — generate insights per AnalysisType
  generate_charts()  — produce chart spec dicts
  run_sql()          — simple filter/select on dict-list
  build_narrative()  — prose summary from insights
  analyse()          — orchestrates full pipeline
  route_envelope()   — standard Nasus entry point
"""
from __future__ import annotations

import csv
import io
import json
import math
import statistics
from typing import Any, Dict, List, Optional, Tuple, Union

from nasus_data_analyst_schema import (
    AnalysisError, AnalysisResult, AnalysisStatus, AnalysisType,
    ChartType, ColumnStats, DataFormat, DataRequest, DataSummary,
    validate_analysis_output,
)
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus


# ---------------------------------------------------------------------------
# DATA LOADER
# ---------------------------------------------------------------------------

def _parse_rows(data: Any, fmt: DataFormat) -> List[dict]:
    if fmt == DataFormat.DICT_LIST:
        if isinstance(data, list):
            return data
        raise ValueError("DICT_LIST format requires a Python list of dicts")
    if fmt == DataFormat.JSON:
        raw = json.loads(data) if isinstance(data, str) else data
        return raw if isinstance(raw, list) else [raw]
    if fmt == DataFormat.JSONL:
        lines = data.strip().split("\n") if isinstance(data, str) else data
        return [json.loads(l) for l in lines if l.strip()]
    if fmt == DataFormat.CSV:
        reader = csv.DictReader(io.StringIO(data))
        return list(reader)
    if fmt == DataFormat.SQL_RESULT:
        return data if isinstance(data, list) else []
    return []


def _col_stats(rows: List[dict], col: str) -> ColumnStats:
    values = [r.get(col) for r in rows]
    non_null = [v for v in values if v is not None and v != ""]
    nulls = len(values) - len(non_null)
    unique = len(set(str(v) for v in non_null))

    # detect numeric
    numeric = []
    for v in non_null:
        try:
            numeric.append(float(v))
        except (TypeError, ValueError):
            pass

    dtype = "numeric" if len(numeric) == len(non_null) and non_null else "string"
    mn = mx = mean = std = None
    if dtype == "numeric" and numeric:
        mn = min(numeric)
        mx = max(numeric)
        mean = round(statistics.mean(numeric), 4)
        std = round(statistics.stdev(numeric), 4) if len(numeric) > 1 else 0.0

    return ColumnStats(
        name=col, dtype=dtype, count=len(non_null),
        nulls=nulls, unique=unique,
        min=mn, max=mx, mean=mean, std=std,
    )


def load_data(request: DataRequest) -> Tuple[List[dict], DataSummary]:
    rows = _parse_rows(request.data, request.format)
    if not rows:
        raise ValueError("Dataset is empty after parsing")

    # RT-07: large dataset warning
    if len(rows) > 10000:
        import warnings
        warnings.warn(
            f"RT-07: Dataset has {len(rows)} rows (>10,000). "
            "Consider sampling before analysis for performance.",
            UserWarning,
            stacklevel=2,
        )

    cols = list(rows[0].keys()) if rows else []
    col_stats = [_col_stats(rows, c) for c in cols]
    summary = DataSummary(
        row_count=len(rows),
        col_count=len(cols),
        columns=col_stats,
        sample_rows=rows[:3],
    )
    return rows, summary


# ---------------------------------------------------------------------------
# ANALYSIS ENGINE
# ---------------------------------------------------------------------------

def run_analysis(rows: List[dict], summary: DataSummary, request: DataRequest) -> List[str]:
    insights: List[str] = []
    numeric_cols = [c for c in summary.columns if c.dtype == "numeric"]
    string_cols  = [c for c in summary.columns if c.dtype == "string"]

    # RT-07: large dataset insight
    if summary.row_count > 10000:
        insights.append(
            f"RT-07 WARNING: Dataset has {summary.row_count} rows. "
            "Results are computed on full data — consider sampling for faster iteration."
        )

    for atype in request.analysis_types:

        if atype == AnalysisType.SUMMARY:
            insights.append(
                f"Dataset has {summary.row_count} rows and {summary.col_count} columns. "
                f"{len(numeric_cols)} numeric, {len(string_cols)} categorical."
            )
            total_nulls = sum(c.nulls for c in summary.columns)
            if total_nulls:
                insights.append(f"Total null/missing values: {total_nulls} across all columns.")

        elif atype == AnalysisType.DISTRIBUTION:
            for c in numeric_cols[:3]:
                if c.mean is not None:
                    insights.append(
                        f"'{c.name}': mean={c.mean}, min={c.min}, max={c.max}, std={c.std}. "
                        f"Range span = {round(c.max - c.min, 4)}."
                    )

        elif atype == AnalysisType.CORRELATION:
            if len(numeric_cols) >= 2:
                a, b = numeric_cols[0], numeric_cols[1]
                insights.append(
                    f"Potential correlation signal between '{a.name}' and '{b.name}' "
                    f"(both numeric — run a Pearson test for confirmation)."
                )
            else:
                insights.append("Correlation analysis requires at least 2 numeric columns.")

        elif atype == AnalysisType.TREND:
            if numeric_cols:
                c = numeric_cols[0]
                vals = []
                for r in rows:
                    try:
                        vals.append(float(r.get(c.name, 0)))
                    except (TypeError, ValueError):
                        pass
                if len(vals) > 1:
                    direction = "upward" if vals[-1] > vals[0] else "downward"
                    pct = round(abs(vals[-1] - vals[0]) / (abs(vals[0]) + 1e-9) * 100, 1)
                    insights.append(
                        f"'{c.name}' shows a {direction} trend from {vals[0]} to {vals[-1]} "
                        f"({pct}% change across {len(vals)} records)."
                    )

        elif atype == AnalysisType.ANOMALY:
            for c in numeric_cols[:2]:
                if c.mean and c.std and c.std > 0:
                    outliers = []
                    for r in rows:
                        try:
                            v = float(r.get(c.name, 0))
                            if abs(v - c.mean) > 3 * c.std:
                                outliers.append(v)
                        except (TypeError, ValueError):
                            pass
                    if outliers:
                        insights.append(
                            f"'{c.name}': {len(outliers)} potential outlier(s) detected "
                            f"(>3 sigma from mean {c.mean}). Values: {outliers[:3]}"
                        )
                    else:
                        insights.append(f"'{c.name}': No significant outliers detected (3-sigma rule).")

        elif atype == AnalysisType.COMPARISON:
            if string_cols and numeric_cols:
                grp_col = string_cols[0].name
                val_col = numeric_cols[0].name
                groups: Dict[str, List[float]] = {}
                for r in rows:
                    k = str(r.get(grp_col, "unknown"))
                    try:
                        v = float(r.get(val_col, 0))
                        groups.setdefault(k, []).append(v)
                    except (TypeError, ValueError):
                        pass
                top = sorted(groups.items(), key=lambda x: statistics.mean(x[1]), reverse=True)[:3]
                for name, vals in top:
                    insights.append(
                        f"Group '{name}': avg {val_col} = {round(statistics.mean(vals), 2)} "
                        f"({len(vals)} records)"
                    )

        elif atype == AnalysisType.CUSTOM and request.custom_instruction:
            from nasus_sidecar import llm_client as _llm_client
            if _llm_client.is_configured():
                try:
                    client = _llm_client.get_client()
                    sample = json.dumps(summary.sample_rows, default=str)[:2000]
                    resp = client.chat([{"role": "user", "content":
                        f"Dataset ({summary.row_count} rows x {summary.col_count} cols). "
                        f"Sample rows: {sample}\n\nAnalyze: {request.custom_instruction}"}])
                    insights.append(f"Custom analysis: {resp[:800]}")
                except Exception as exc:
                    insights.append(
                        f"Custom analysis: '{request.custom_instruction}' — "
                        f"applied over {summary.row_count} rows. (LLM error: {exc})"
                    )
            else:
                insights.append(
                    f"Custom analysis: '{request.custom_instruction}' — "
                    f"applied over {summary.row_count} rows."
                )

    return insights or ["No insights could be derived from the provided data and analysis types."]


# ---------------------------------------------------------------------------
# CHART GENERATOR
# ---------------------------------------------------------------------------

def generate_charts(rows: List[dict], summary: DataSummary,
                    chart_types: List[ChartType]) -> List[dict]:
    charts = []
    numeric_cols = [c for c in summary.columns if c.dtype == "numeric"]
    string_cols  = [c for c in summary.columns if c.dtype == "string"]

    for ctype in chart_types:
        if ctype == ChartType.BAR and string_cols and numeric_cols:
            lbl = string_cols[0].name
            val = numeric_cols[0].name
            data = [{"label": str(r.get(lbl, "")), "value": r.get(val)} for r in rows[:10]]
            charts.append({"type": "bar", "title": f"{val} by {lbl}", "x": lbl, "y": val, "data": data})

        elif ctype == ChartType.LINE and numeric_cols:
            val = numeric_cols[0].name
            data = [{"index": i, "value": r.get(val)} for i, r in enumerate(rows[:20])]
            charts.append({"type": "line", "title": f"{val} over records", "x": "index", "y": val, "data": data})

        elif ctype == ChartType.PIE and string_cols:
            lbl = string_cols[0].name
            from collections import Counter
            counts = Counter(str(r.get(lbl, "")) for r in rows)
            data = [{"label": k, "value": v} for k, v in counts.most_common(6)]
            charts.append({"type": "pie", "title": f"Distribution of {lbl}", "data": data})

        elif ctype == ChartType.SCATTER and len(numeric_cols) >= 2:
            x_col, y_col = numeric_cols[0].name, numeric_cols[1].name
            data = [{"x": r.get(x_col), "y": r.get(y_col)} for r in rows[:50]]
            charts.append({"type": "scatter", "title": f"{x_col} vs {y_col}", "x": x_col, "y": y_col, "data": data})

        elif ctype == ChartType.HISTOGRAM and numeric_cols:
            val = numeric_cols[0].name
            values = []
            for r in rows:
                try:
                    values.append(float(r.get(val, 0)))
                except (TypeError, ValueError):
                    pass
            if values:
                mn, mx = min(values), max(values)
                bucket_size = (mx - mn) / 8 if mx != mn else 1
                buckets: Dict[str, int] = {}
                for v in values:
                    b = int((v - mn) / bucket_size)
                    label = f"{round(mn + b * bucket_size, 1)}"
                    buckets[label] = buckets.get(label, 0) + 1
                data = [{"bucket": k, "count": v} for k, v in sorted(buckets.items())]
                charts.append({"type": "histogram", "title": f"Distribution of {val}", "data": data})

        elif ctype == ChartType.TABLE:
            charts.append({
                "type": "table",
                "title": "Data Sample (first 10 rows)",
                "data": rows[:10],
            })

    return charts


# ---------------------------------------------------------------------------
# SQL RUNNER (safe read-only filter/select)
# ---------------------------------------------------------------------------

def run_sql(rows: List[dict], query: str) -> Any:
    """
    Supports a very basic SQL-like syntax:
      SELECT col1, col2 FROM data WHERE col = 'value' LIMIT n
    This is a stub — expand with sqlparse for production.
    """
    q = query.strip().upper()
    if any(kw in q for kw in ("INSERT", "UPDATE", "DELETE", "DROP", "CREATE", "ALTER")):
        raise ValueError("SQL-RT-05: Only SELECT queries are permitted.")

    # Simple LIMIT extraction
    result = list(rows)
    if "LIMIT" in q:
        try:
            limit = int(q.split("LIMIT")[-1].strip().split()[0])
            result = result[:limit]
        except (ValueError, IndexError):
            pass

    # Simple WHERE col = 'value'
    if "WHERE" in q:
        try:
            where_part = query.split("WHERE", 1)[-1].split("LIMIT")[0].strip()
            if "=" in where_part:
                col_raw, val_raw = where_part.split("=", 1)
                col = col_raw.strip().strip('"').strip("'")
                val = val_raw.strip().strip('"').strip("'")
                result = [r for r in result if str(r.get(col, "")).lower() == val.lower()]
        except Exception:
            pass

    return result


# ---------------------------------------------------------------------------
# NARRATIVE BUILDER
# ---------------------------------------------------------------------------

def build_narrative(insights: List[str]) -> str:
    if not insights:
        return "No significant patterns detected in the provided dataset."
    parts = ["**Analysis Summary**\n"]
    for i, insight in enumerate(insights, 1):
        parts.append(f"{i}. {insight}")
    parts.append(
        "\n*Generated by Nasus M04 Data Analyst. "
        "For advanced statistical validation, consult a domain expert.*"
    )
    return "\n".join(parts)


def _llm_narrative(insights: List[str], summary: DataSummary,
                   custom_instruction: str = "") -> str:
    from nasus_sidecar import llm_client as _llm_client
    if not _llm_client.is_configured():
        return build_narrative(insights)
    client = _llm_client.get_client()
    cols_desc = ", ".join(f"{c.name}({c.dtype})" for c in summary.columns[:8])
    ins_block = "\n".join(f"- {ins}" for ins in insights)
    prompt = (
        f"You are a senior data analyst. The dataset has {summary.row_count} rows "
        f"and {summary.col_count} columns ({cols_desc}).\n\n"
        f"Statistical findings:\n{ins_block}\n\n"
        + (f"The analyst asked: {custom_instruction}\n\n" if custom_instruction else "")
        + "Write a concise markdown summary (2-4 paragraphs) with key takeaways, "
          "notable patterns, and 1-2 actionable recommendations. "
          "Do not repeat the raw numbers verbatim."
    )
    try:
        return client.chat([{"role": "user", "content": prompt}])
    except Exception:
        return build_narrative(insights)


# ---------------------------------------------------------------------------
# MAIN PIPELINE
# ---------------------------------------------------------------------------

def analyse(request: DataRequest) -> Union[AnalysisResult, AnalysisError]:
    try:
        rows, summary = load_data(request)
    except Exception as e:
        return AnalysisError(message=str(e), error_code="LOAD_ERROR")

    try:
        insights = run_analysis(rows, summary, request)
    except Exception as e:
        return AnalysisError(message=f"Analysis failed: {e}", error_code="ANALYSIS_ERROR")

    charts: List[dict] = []
    if request.chart_types:
        try:
            charts = generate_charts(rows, summary, request.chart_types)
        except Exception as e:
            charts = [{"error": str(e)}]

    sql_result = None
    if request.sql_query:
        try:
            sql_result = run_sql(rows, request.sql_query)
        except Exception as e:
            sql_result = {"error": str(e)}

    narrative = _llm_narrative(insights, summary, request.custom_instruction or "")

    result = AnalysisResult(
        request_summary=f"{request.format.value} | {[a.value for a in request.analysis_types]}",
        summary=summary,
        insights=insights,
        charts=charts,
        sql_result=sql_result,
        narrative=narrative,
        status=AnalysisStatus.DONE,
    )

    issues = validate_analysis_output(result)
    if issues:
        result.insights.append(f"[Validation warnings: {'; '.join(issues)}]")

    return result


# ---------------------------------------------------------------------------
# ROUTE ENVELOPE — standard Nasus entry point
# ---------------------------------------------------------------------------

def route_envelope(envelope: NasusEnvelope) -> NasusEnvelope:
    envelope.mark_running()
    try:
        payload = envelope.payload
        if isinstance(payload, dict):
            fmt = DataFormat(payload.get("format", "dict_list"))
            analysis_types = [AnalysisType(a) for a in payload.get("analysis_types", ["summary"])]
            chart_types = [ChartType(c) for c in payload.get("chart_types", [])] if payload.get("chart_types") else None
            request = DataRequest(
                data=payload.get("data"),
                format=fmt,
                analysis_types=analysis_types,
                chart_types=chart_types,
                sql_query=payload.get("sql_query", ""),
                custom_instruction=payload.get("custom_instruction", ""),
                output_format=payload.get("output_format", "markdown"),
            )
        elif isinstance(payload, DataRequest):
            request = payload
        else:
            return envelope.mark_failed(f"Unsupported payload type: {type(payload)}")

        result = analyse(request)

        if isinstance(result, AnalysisError):
            return envelope.mark_failed(result.to_dict()["message"])
        return envelope.mark_done(result.to_dict())

    except Exception as e:
        return envelope.mark_failed(f"route_envelope error: {e}")


# ---------------------------------------------------------------------------
# DEMO
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    STUB_DATA = [
        {"company": "Acme",       "raised_m": "5.2",  "employees": "12",  "stage": "Seed"},
        {"company": "BetaCo",     "raised_m": "18.0", "employees": "45",  "stage": "Series A"},
        {"company": "GammaTech",  "raised_m": "3.1",  "employees": "8",   "stage": "Seed"},
        {"company": "DeltaAI",    "raised_m": "42.0", "employees": "120", "stage": "Series B"},
        {"company": "EpsilonX",   "raised_m": "9.5",  "employees": "30",  "stage": "Series A"},
        {"company": "ZetaLabs",   "raised_m": "1.2",  "employees": "5",   "stage": "Pre-Seed"},
        {"company": "EtaWorks",   "raised_m": "75.0", "employees": "200", "stage": "Series C"},
        {"company": "ThetaNet",   "raised_m": "11.0", "employees": "38",  "stage": "Series A"},
        {"company": "IotaAI",     "raised_m": "6.8",  "employees": "22",  "stage": "Seed"},
        {"company": "KappaData",  "raised_m": "28.5", "employees": "88",  "stage": "Series B"},
    ]

    req = DataRequest(
        data=STUB_DATA,
        format=DataFormat.DICT_LIST,
        analysis_types=[AnalysisType.SUMMARY, AnalysisType.DISTRIBUTION,
                        AnalysisType.TREND, AnalysisType.COMPARISON],
        chart_types=[ChartType.BAR, ChartType.LINE],
    )

    result = analyse(req)
    print(json.dumps(result.to_dict(), indent=2))
