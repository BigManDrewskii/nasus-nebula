# NASUS M04 — DATA ANALYST
## Refinement Checks: RT-01 through RT-08
**Version:** 1.0 | **Module:** M04 | **Network:** Nasus Sub-Agent Network

These checks are applied during QA, integration testing, and live validation via `validate_analysis_output()`.
Each check defines what is tested, what PASS and FAIL look like, and exact remediation steps.

---

## RT-01 — Data Schema Detection Accuracy

**Description:**
Column data types must be correctly inferred at load time. Every column is classified as either `numeric` or `string`. A column is `numeric` only if every non-null value in it successfully converts to `float`. A column with even one non-convertible value falls back to `string`. This drives all downstream analysis — wrong dtype = wrong insights.

**PASS criteria:**
- A column of `["1.2", "3.4", "9.0"]` is classified as `dtype="numeric"`
- A column of `["Seed", "Series A", "Pre-Seed"]` is classified as `dtype="string"`
- A mixed column `["1.2", "N/A", "3.4"]` is classified as `dtype="string"` (non-convertible value present)
- `ColumnStats.mean` and `ColumnStats.std` are `None` for string columns
- `ColumnStats.mean` is a float for numeric columns

**FAIL criteria:**
- A numeric column is classified as string (e.g. all values are `"5.2"` but dtype returns `"string"`)
- `mean` or `std` is computed for a string column
- A mixed column is classified as numeric (non-null non-numeric values ignored silently)
- `min`/`max` return string comparisons instead of numeric comparisons

**Remediation:**
1. In `_col_stats()`, verify the `len(numeric) == len(non_null)` guard is intact — this is the dtype gate.
2. If a column of numeric strings fails, check that `float(v)` is being attempted for each non-null value.
3. If mixed columns are misclassified, add a test row with a non-numeric string and assert dtype == "string".
4. Never fall back to `str` comparison for min/max on numeric columns — use the `numeric` list, not `non_null`.

---

## RT-02 — Null Handling in Statistics

**Description:**
Null and empty-string values must be excluded from all statistical computations (mean, std, min, max) and counted separately in `ColumnStats.nulls`. The `count` field must reflect only non-null values. This prevents skewed statistics and ensures the null count is always accurate and visible to the caller.

**PASS criteria:**
- `ColumnStats.nulls` equals the number of `None` or `""` values in the column
- `ColumnStats.count` equals `len(rows) - nulls`
- `mean` and `std` are computed only from the `non_null` subset
- A column that is 100% null produces `count=0`, `mean=None`, `std=None`, `dtype="string"`
- A column with 1 non-null numeric value produces `std=0.0` (single-value stdev fallback)

**FAIL criteria:**
- `None` or `""` values are included in the mean calculation
- `count` is reported as `len(rows)` regardless of nulls
- `nulls` is always 0 even when null values exist
- `std` raises `StatisticsError` on a single-value column instead of returning 0.0

**Remediation:**
1. In `_col_stats()`, confirm `non_null = [v for v in values if v is not None and v != ""]` — both conditions required.
2. Confirm `ColumnStats.count = len(non_null)` not `len(values)`.
3. For single-value std: confirm `stdev` is guarded by `if len(numeric) > 1 else 0.0`.
4. Write a test with a column containing `[None, "", "3.0", None]` — expect `count=1`, `nulls=3`, `mean=3.0`, `std=0.0`.

---

## RT-03 — Insight Relevance to Requested Analysis Types

**Description:**
Insights must be scoped to the `analysis_types` listed in the request. A SUMMARY-only request must not produce TREND or ANOMALY insights. A TREND-only request must not produce SUMMARY boilerplate. Each analysis type has a discrete code path; they must not bleed into each other.

**PASS criteria:**
- Request with `analysis_types=["summary"]` produces only row/col count and null insights
- Request with `analysis_types=["trend"]` produces only trend direction insights
- Request with `analysis_types=["summary", "anomaly"]` produces both, and nothing else
- The `CUSTOM` type only fires when `custom_instruction` is non-empty
- `insights` list is never empty — falls back to `["No insights could be derived..."]`

**FAIL criteria:**
- TREND insight appears when only SUMMARY was requested
- ANOMALY outlier count appears when CORRELATION was requested
- `insights` is an empty list `[]` (violates RT-03 minimum)
- CUSTOM fires with empty `custom_instruction` string

**Remediation:**
1. In `run_analysis()`, confirm each `atype` is checked inside its own `elif` branch with no shared state leaking across branches.
2. Test: pass `analysis_types=["summary"]` and assert no insight string contains "trend" or "outlier".
3. Test: pass `analysis_types=["custom"]` with empty `custom_instruction` and assert no custom insight is added.
4. If insights comes back empty, the fallback at the end of `run_analysis()` must be present: `return insights or ["No insights..."]`.

---

## RT-04 — Chart Spec Completeness

**Description:**
Every chart dict produced by `generate_charts()` must contain exactly the three required keys: `type`, `title`, and `data`. Missing any of these keys will cause rendering failures in downstream consumers. The `validate_analysis_output()` function checks for these keys and appends a warning insight for each violation.

**PASS criteria:**
- Every dict in `result.charts` contains `"type"`, `"title"`, and `"data"` keys
- `data` is a non-empty list
- `type` matches one of the `ChartType` enum values (bar, line, pie, scatter, histogram, table)
- Optional keys (`x`, `y`) are present where applicable but never required

**FAIL criteria:**
- Any chart dict is missing `"type"`, `"title"`, or `"data"`
- `data` is `[]` or `None`
- `validate_analysis_output()` returns `"RT-04: Chart N missing field 'key'"` warnings
- A chart type is requested but the required column types are absent (e.g. SCATTER with only 1 numeric col) — in this case no chart is produced, which is acceptable; an empty chart list is preferable to a malformed spec

**Remediation:**
1. In `generate_charts()`, audit every `charts.append({...})` call — verify `type`, `title`, `data` are always set.
2. Add a guard: if `data` list would be empty after construction, skip appending the chart entirely.
3. Run `validate_analysis_output(result)` after `generate_charts()` and assert return value is `[]`.
4. For SCATTER with <2 numeric cols: confirm the `elif ctype == ChartType.SCATTER and len(numeric_cols) >= 2` guard is present.

---

## RT-05 — SQL Query Safety

**Description:**
The SQL runner is read-only. It must reject any query containing data-mutation or schema-modification keywords. The check is case-insensitive and performed on the uppercased query string before any parsing. This is a hard security boundary — not a soft warning.

**PASS criteria:**
- `SELECT * FROM data LIMIT 5` executes and returns up to 5 rows
- `SELECT * FROM data WHERE stage = 'Seed'` returns only matching rows
- `INSERT INTO data VALUES (...)` raises `ValueError("SQL-RT-05: Only SELECT queries are permitted.")`
- `UPDATE data SET x = 1` raises `ValueError`
- `DELETE FROM data` raises `ValueError`
- `DROP TABLE data` raises `ValueError`
- `CREATE TABLE foo` raises `ValueError`
- `ALTER TABLE data ADD COLUMN x` raises `ValueError`

**FAIL criteria:**
- Any mutation keyword executes without raising
- The check is case-sensitive and misses `insert` (lowercase)
- `LIMIT` parsing crashes on non-integer values instead of silently ignoring
- `WHERE` parsing crashes on columns with spaces or special characters instead of degrading gracefully

**Remediation:**
1. In `run_sql()`, confirm the blocked keyword list includes all six: INSERT, UPDATE, DELETE, DROP, CREATE, ALTER.
2. Confirm the check runs on `q = query.strip().upper()` — never on the raw query string.
3. Wrap LIMIT int conversion in try/except to handle `LIMIT abc` gracefully.
4. Wrap WHERE parsing in a broad `except Exception: pass` so malformed WHERE clauses degrade to no-filter, not crash.

---

## RT-06 — Narrative Coherence with Insights

**Description:**
The narrative string must be a faithful prose rendering of the insights list. Every insight bullet must appear in the narrative. The narrative must not introduce new claims not present in the insights. An empty narrative is a hard failure — `validate_analysis_output()` flags it as `"RT-06: Narrative is empty"`.

**PASS criteria:**
- `result.narrative` is a non-empty string
- The narrative contains a numbered entry for each item in `result.insights`
- The standard disclaimer is appended: `"*Generated by Nasus M04 Data Analyst..."`
- The bold header `"**Analysis Summary**"` appears at the top
- If insights has N items, the narrative has N numbered lines

**FAIL criteria:**
- `result.narrative == ""` or `result.narrative is None`
- Narrative has fewer numbered lines than `len(result.insights)`
- Narrative contains a claim not present in any insight string
- `validate_analysis_output()` returns `"RT-06: Narrative is empty"`

**Remediation:**
1. In `build_narrative()`, confirm the loop `for i, insight in enumerate(insights, 1)` covers all insights.
2. Confirm `build_narrative()` is called with the final `insights` list, after any validation-appended warnings.
3. Test: pass 5 insights and assert `narrative.count("\n")` is at least 5.
4. If narrative comes back empty, check that `"
".join(parts)` is not accidentally discarded — confirm the return value is used in `analyse()`.

---

## RT-07 — Large Dataset Handling

**Description:**
Datasets exceeding 10,000 rows require a visible warning to prevent silent performance degradation. The warning must appear both as a `UserWarning` (catchable by the caller's warning filters) and as a prepended insight string so it surfaces in the narrative. Analysis still runs on the full dataset — RT-07 is informational, not blocking.

**PASS criteria:**
- A dataset with 10,001+ rows triggers `warnings.warn(...)` with `UserWarning` category
- The first insight in `result.insights` starts with `"RT-07 WARNING:"`
- The warning includes the actual row count
- Analysis completes normally on the full dataset — no truncation
- A dataset with exactly 10,000 rows does NOT trigger the warning (threshold is strictly `>10000`)

**FAIL criteria:**
- No warning emitted for 15,000-row dataset
- Warning emitted for 9,999-row dataset
- `RT-07 WARNING` insight is missing from `result.insights`
- Analysis is silently truncated to 10,000 rows without informing the caller

**Remediation:**
1. In `load_data()`, confirm the check is `if len(rows) > 10000` (strict greater-than, not >=).
2. Confirm `warnings.warn(...)` is called with `UserWarning` as the category.
3. In `run_analysis()`, confirm the same `> 10000` check prepends the RT-07 insight.
4. Test with a 10,000-row dataset and assert no warning; test with 10,001 rows and assert warning present.
5. Never truncate rows inside `load_data()` — the full list must be passed to `run_analysis()`.

---

## RT-08 — Error Envelope Propagation

**Description:**
Any `AnalysisError` returned by `analyse()` must produce a `FAILED` envelope — never a `DONE` envelope with error content embedded. The `route_envelope()` function is the single gate for this conversion. Every exception path in the pipeline must be caught and converted to either `AnalysisError` or a direct `envelope.mark_failed()` call. A `DONE` envelope must only be produced when `result` is a fully valid `AnalysisResult`.

**PASS criteria:**
- Empty dataset → `AnalysisError(error_code="LOAD_ERROR")` → `envelope.mark_failed(...)` → envelope status = `FAILED`
- Unsupported format string → same chain → `FAILED`
- Malformed JSON string → same chain → `FAILED`
- Valid dataset → `AnalysisResult` → `envelope.mark_done(result.to_dict())` → envelope status = `DONE`
- `envelope.job_id` is preserved in both DONE and FAILED envelopes
- No unhandled exception escapes `route_envelope()`

**FAIL criteria:**
- An `AnalysisError` is wrapped inside `envelope.mark_done()` (error hidden in DONE response)
- An exception raised inside `analyse()` propagates up through `route_envelope()` uncaught
- `envelope.job_id` changes or is cleared on failure
- A FAILED envelope contains `status="DONE"`
- The outer `try/except` in `route_envelope()` catches the error but returns `None` instead of calling `mark_failed()`

**Remediation:**
1. In `route_envelope()`, confirm the isinstance check: `if isinstance(result, AnalysisError): return envelope.mark_failed(...)`.
2. Confirm the outer `except Exception as e` block calls `envelope.mark_failed(f"route_envelope error: {e}")` and returns that value.
3. Confirm `envelope.mark_running()` is the first call and does not itself raise.
4. Test: pass `data=[]` and assert returned envelope has `status == "FAILED"` and `job_id` is unchanged.
5. Test: pass valid data and assert returned envelope has `status == "DONE"` and `result.status == "DONE"`.

---

## Validation Function Reference

`validate_analysis_output(result: AnalysisResult) -> List[str]`

Runs at the end of `analyse()`. Returns a list of warning strings. If non-empty, they are appended to `result.insights` as `[Validation warnings: ...]`. Does not raise or block the pipeline.

| Check | Condition | Warning text |
|---|---|---|
| RT-03 | `not result.insights` | `"RT-03: No insights generated"` |
| RT-01 | `result.summary.row_count == 0` | `"RT-01: Empty dataset"` |
| RT-04 | chart missing `type`/`title`/`data` | `"RT-04: Chart N missing field 'key'"` |
| RT-06 | `not result.narrative` | `"RT-06: Narrative is empty"` |

RT-02, RT-05, RT-07, RT-08 are enforced at pipeline runtime (raise or warn inline) rather than via this post-hoc validator.
