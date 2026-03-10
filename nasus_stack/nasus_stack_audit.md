# Nasus Stack Architecture Audit
**Generated:** 2026-03-09 | **Auditor:** Code Agent | **Scope:** 9 specialist modules + 1 orchestrator + 1 task planner + 1 quality reviewer

---

## SECTION A — Module Inventory

| ID | Module Name | Schema Class (Input) | Schema Class (Output) | Envelope Consistent | Schema Style |
|----|-------------|---------------------|----------------------|---------------------|--------------|
| M00 | Orchestrator Core | `Subtask`, `SubtaskInput[]`, `goal: str` | `ExecutionPlan`, `SynthesisReport`, `EscalationModuleFailure`, `ClarificationRequest` | PARTIAL — no top-level job_id/status wrapper | @dataclass |
| M00-TP | Task Planner | `goal: str` (free text) | `PlanBundle`, `ClarificationRequest`, `PlanError` | PARTIAL — plan_id present, no status/errors envelope | @dataclass |
| M00-QR | Quality Reviewer | `source_module: ModuleID`, output blob from any module | `ReviewApproved`, `ReviewRevise`, `ReviewReject`, `PipelineReview` | PARTIAL — review_id present, no job_id/status wrapper | @dataclass |
| M09 | Memory Manager | `WriteRequest`, `ReadRequest`, `QueryRequest` | `WriteStatus`, memory layer objects (`SessionMemory`, `ProjectMemory`, `EntityMemory`, `GlobalMemory`) | NO — no standard envelope; raw operation objects only | @dataclass |
| M06 | Content Creator | `ContentRequest` (topic, platform, audience, tone, seo, hook_type) | `ContentOutput` (body, metadata, revision_checklist, iteration_history) | NO — no job_id, no status field, no errors list | @dataclass |
| M07 | Product Strategist | `product_brief: str`, `market_data: dict` (free-form, prompt-driven) | `ProductStrategyOutput` (user_stories, prioritization_matrix, roadmap, strategy_snapshot, competitive_analysis) | NO — no envelope at all; pure domain objects | @dataclass |
| M08 | Landing Page | `LandingPageSession` (product_name, tagline, brand_color, etc.) | `LandingPageOutput` (section_plan, copy_blocks, cro_scorecard, visual_spec, html_output) | NO — no job_id/status/errors wrapper | @dataclass |
| M05 | Code Engineer | `spec: str`, `existing_code: str`, `test_cases: list` (free-form) | `CodeEngineOutput` (summary, project, lint, tests, suggested_next_steps, session_context, meta) | NO — uses Pydantic BaseModel, no standard envelope | Pydantic BaseModel |
| M01 | Research Analyst | No schema file (zip only) | No schema file (zip only) | UNKNOWN — prompt-only module | N/A |
| M02 | API Integrator | `nasus_api_integrator.py` (py file, not a separate schema) | `nasus_api_integrator.py` | PARTIAL — uses SessionContext pattern similar to M05 | Pydantic BaseModel |
| M04 | Data Analyst | `nasus_data_analyst.py` only | `nasus_data_analyst.py` only | UNKNOWN — no separate schema file audited | N/A |
| M03 | Web Browser | `nasus_web_browser.py` only | `nasus_web_browser.py` only | UNKNOWN — no separate schema file audited | N/A |

---

## SECTION B — Contract Compatibility Matrix

Rows = PRODUCER module. Columns = CONSUMER module.
Rating: YES (output type directly matches input type), NO (type mismatch, adapter required), PARTIAL (structural match but field name differences), N/A (not a valid pipeline direction).

|        | M00-Orch | M00-TP | M00-QR | M09 | M01 | M02 | M03 | M04 | M05 | M06 | M07 | M08 |
|--------|----------|--------|--------|-----|-----|-----|-----|-----|-----|-----|-----|-----|
| **M00-Orch** | N/A | N/A | PARTIAL | PARTIAL | YES | YES | YES | YES | YES | YES | YES | YES |
| **M00-TP** | YES | N/A | YES | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **M00-QR** | PARTIAL | NO | N/A | NO | NO | NO | NO | NO | NO | NO | NO | NO |
| **M09** | YES | NO | NO | N/A | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL | PARTIAL |
| **M01** | PARTIAL | NO | YES | PARTIAL | N/A | NO | NO | YES | NO | YES | YES | NO |
| **M02** | PARTIAL | NO | YES | PARTIAL | NO | N/A | NO | YES | YES | NO | NO | NO |
| **M03** | PARTIAL | NO | YES | PARTIAL | YES | NO | N/A | YES | NO | NO | NO | YES |
| **M04** | PARTIAL | NO | YES | PARTIAL | NO | NO | NO | N/A | NO | YES | YES | YES |
| **M05** | PARTIAL | NO | YES | PARTIAL | NO | NO | NO | NO | N/A | PARTIAL | NO | PARTIAL |
| **M06** | PARTIAL | NO | YES | PARTIAL | NO | NO | NO | NO | NO | N/A | NO | YES |
| **M07** | PARTIAL | NO | YES | PARTIAL | NO | NO | NO | NO | NO | YES | N/A | YES |
| **M08** | PARTIAL | NO | YES | PARTIAL | NO | NO | NO | NO | NO | NO | NO | N/A |

**Key finding:** Almost all cross-module handoffs score PARTIAL because no module emits a standard typed envelope. Consumers must extract raw domain objects and adapt field names manually. The Orchestrator (M00) acts as the universal adapter, which creates a single point of failure.

---

## SECTION C — Envelope Consistency

A "standard envelope" is defined here as a top-level wrapper containing at minimum:
`{ job_id, module_id, status, payload, errors[] }`

### M00 — Orchestrator Core
- **Verdict: PARTIAL DEVIATION**
- Has `session_id` (via `OrchestratorSessionRecord`) and `output_type` enum (`EXECUTION_PLAN`, `SYNTHESIS_REPORT`, `ESCALATION`, `DISPATCH`)
- **Missing:** No top-level `job_id` field on `ExecutionPlan` or `SynthesisReport`. No `errors[]` list — failures go into separate `EscalationModuleFailure` objects.
- **Deviation:** `output_type` is present but inconsistently placed; `DispatchBlock` uses `OutputType` enum but `SynthesisReport` uses the same enum — they are not structurally interchangeable as they have different required fields.

### M00-TP — Task Planner
- **Verdict: PARTIAL DEVIATION**
- Has `plan_id` (uuid), `output_type` (PlanBundle/ClarificationRequest/PlanError), `created_at`
- **Missing:** No `job_id`, no `status` field, no `errors[]` array at top level. Validation errors exist only as return values from `.validate()` methods, not embedded in the output object.
- **Deviation:** Three different root types (`PlanBundle`, `ClarificationRequest`, `PlanError`) are not unified under a single envelope — the consumer must isinstance-check to determine which was returned.

### M00-QR — Quality Reviewer
- **Verdict: PARTIAL DEVIATION**
- Has `review_id` (qr_XXXXXXXX), `source_module`, `quality_score`, `verdict` (APPROVED/REVISE/REJECT), `reviewed_at`
- **Missing:** No `job_id`, no `status` field. `errors[]` exists implicitly as `findings[]` + `revision_requests[]` but uses different naming.
- **Deviation:** Three separate root classes (`ReviewApproved`, `ReviewRevise`, `ReviewReject`) — consumer must isinstance-check or inspect `verdict` string. `review_id` prefix is `qr_` vs `pqr_` for `PipelineReview` — naming inconsistency.

### M09 — Memory Manager
- **Verdict: NO STANDARD ENVELOPE**
- Input: Raw operation objects (`WriteRequest`, `ReadRequest`, `QueryRequest`) with no shared base class.
- Output: Domain layer objects (`SessionMemory`, `ProjectMemory`, etc.) returned directly.
- `WriteStatus` enum exists (`success/conflict/validation_error/duplicate`) but is not wrapped in a structured response object with `record_id` attached — the prompt describes returning both but no `WriteResponse` dataclass was found in the schema.
- **Missing:** `job_id`, `module_id` self-identification, `errors[]`, `status`.

### M06 — Content Creator
- **Verdict: NO STANDARD ENVELOPE**
- `ContentOutput` has: `request` (echo of input), `audience_inference`, `tone_declaration`, `body`, `metadata`, `revision_checklist`, `iteration_history`
- **Missing:** `job_id`, `module_id`, `status`, `errors[]`. Has `RevisionChecklist` but it's a content editing tool, not a machine-readable error array.
- **Deviation:** Uses `@dataclass` while M05 uses Pydantic `BaseModel` — no consistency on ORM layer across modules.

### M07 — Product Strategist
- **Verdict: NO STANDARD ENVELOPE**
- `ProductStrategyOutput` contains pure domain objects: `user_stories`, `prioritization_matrix`, `roadmap`, `strategy_snapshot`, `confidence_score`, `confidence_rationale`, `revision_checklist`
- **Missing:** All envelope fields. No `job_id`, no `module_id` self-tag, no `status`, no `errors[]`.
- **Note:** `revision_checklist: List[str]` exists but is a list of human-readable follow-up notes, not a structured error/QA array.

### M08 — Landing Page
- **Verdict: NO STANDARD ENVELOPE**
- `LandingPageOutput` contains: `session` (LandingPageSession with `session_id`, `cro_score`), `section_plan`, `copy_blocks`, `cro_scorecard`, `visual_spec`, `html_output`
- `LandingPageSession.session_id` is a UUID but is NOT a `job_id` — it tracks the multi-turn design session, not the pipeline execution.
- **Missing:** `job_id`, `module_id`, `status`, `errors[]`. The `.validate()` method returns `List[str]` errors but these are not embedded in the output object.

### M05 — Code Engineer
- **Verdict: NO STANDARD ENVELOPE — DIFFERENT ORM**
- Only module using Pydantic `BaseModel` (all others use `@dataclass`).
- `CodeEngineOutput` has: `summary`, `project` (CodeProject), `lint` (LintResult), `tests` (TestResult), `suggested_next_steps`, `session_context` (SessionContext with `session_id`, `agent`, `version`), `meta` (CodeEngineMeta with `confidence`, `lint_passed`, `tests_passed`)
- `SessionContext.escalation: Optional[Dict]` provides a loose escalation hook but no typed contract.
- **Missing:** Standard `job_id`, `module_id` tag at top level, `errors[]`. `LintResult.errors: int` is a count, not an array.

---

## SECTION D — Memory Bus Coverage

### Modules that ALWAYS READ from M09 (per memory_manager_prompt.md, Section 7):
| Module | What it reads | Notes |
|--------|---------------|-------|
| M00 Orchestrator | Full project + global context before routing | Explicitly required at session start |
| M07 Product Strategist | Prior decisions before new strategy | Explicitly required |
| M08 Landing Page | Brand voice, prior copy, rejected ideas | Explicitly required |
| M06 Content Creator | Tone, vocabulary, prior content | Explicitly required |

### Modules that ALWAYS WRITE to M09 (per memory_manager_prompt.md, Section 7):
| Module | What it writes | Notes |
|--------|----------------|-------|
| M01 Research Analyst | entities + facts | Explicitly required |
| M07 Product Strategist | decisions + open_tasks | Explicitly required |
| M08 Landing Page | artifacts (HTML, copy, CRO scores) | Explicitly required |
| M06 Content Creator | artifacts (copy, SEO metadata) | Explicitly required |
| M05 Code Engineer | artifacts (files, schemas, test results) | Explicitly required |
| M00 Orchestrator | Goal summary, modules used, key outputs | At session end |

### Modules with NO SCHEMA-LEVEL memory integration (memory_store field absent):
| Module | Memory Bus Status | Risk |
|--------|-------------------|------|
| M00-TP Task Planner | `memory_store: bool` exists at **step level** in PlanStep, but Task Planner itself has no M09 read/write in its own schema | MEDIUM — planner cannot self-recall prior plans without orchestrator injection |
| M00-QR Quality Reviewer | Zero memory references in schema or prompt | HIGH — QR cannot recall prior review verdicts, cannot detect regression across sessions |
| M02 API Integrator | Not listed in Section 7 of memory_manager_prompt | MEDIUM — auth configs and endpoint results not persisted |
| M03 Web Browser | Not listed in Section 7 | LOW — scrape results are typically session-ephemeral |
| M04 Data Analyst | Not listed in Section 7 | MEDIUM — analysis results and chart artifacts not auto-persisted |

### Critical Gap:
The `PlanStep.memory_store: bool` field in M00-TP is a routing directive to M09, but **no schema enforces that M09 is actually called when `memory_store=True`**. This is a behavioral contract with no structural enforcement.

---

## SECTION E — Quality Gate Coverage

### The Quality Reviewer (M00-QR) can inspect these modules:
The QR operates on `source_module: ModuleID` which covers M01–M10. Structurally, QR can receive ANY module output. However, the quality of review depends on whether the module output carries reviewable fields.

| Module | QR-Inspectable Fields | Has `quality_score` field? | Has `review_target`? | QA Gate Status |
|--------|----------------------|---------------------------|---------------------|----------------|
| M00 Orchestrator | `SynthesisReport.deliverables`, `conflicts`, `null_outputs` | NO — scores are implicit in `SchemaValidationResult.score` | NO | PARTIAL |
| M00-TP Task Planner | `PlanBundle.steps[].confidence`, `risk_flags`, `open_questions` | NO — confidence is per-step, not a bundle-level score | NO | PARTIAL |
| M01 Research Analyst | No schema — QR must inspect raw output | NO | NO | BLIND |
| M02 API Integrator | No separate schema audited | UNKNOWN | UNKNOWN | UNKNOWN |
| M03 Web Browser | No separate schema audited | UNKNOWN | UNKNOWN | UNKNOWN |
| M04 Data Analyst | No separate schema audited | UNKNOWN | UNKNOWN | UNKNOWN |
| M05 Code Engineer | `CodeEngineMeta.confidence`, `LintResult.passed`, `TestResult.passed/failed` | YES (`meta.confidence: float`) | NO — `session_context.escalation` is loose dict | GOOD |
| M06 Content Creator | `ContentOutput.revision_checklist`, `metadata.word_count` | NO — no `quality_score` field | NO | POOR |
| M07 Product Strategist | `ProductStrategyOutput.confidence_score`, `revision_checklist` | YES (`confidence_score: float 0.0-1.0`) | NO | PARTIAL |
| M08 Landing Page | `LandingPageOutput.cro_scorecard` (total 0–100), `copy_warnings` | YES (`cro_scorecard.total: int`) | NO — different scoring scale (0-100 vs 0.0-1.0) | PARTIAL — scale mismatch |
| M09 Memory Manager | `WriteStatus` enum, `Artifact.cro_score`, `Artifact.seo_score` | YES (artifact-level, not operation-level) | NO | PARTIAL |

### Critical Gap — QA Bypass:
No module has a `review_target` field pointing back at itself for QR consumption. The QR's `revision_target: ModuleID` field in `RevisionRequest` correctly names which module must re-run, but the upstream modules produce no self-identifying hook field that the QR can use to auto-route without orchestrator intervention.

### Score Scale Inconsistency:
- M05 uses `confidence: float 0.0–1.0`
- M07 uses `confidence_score: float 0.0–1.0`
- M08 uses `cro_score: int 0–100` (different scale entirely)
- QR uses `quality_score: float 0.0–1.0`

The QR cannot directly compare M08's CRO score against its own 0.0–1.0 threshold without normalization. No normalizer exists in any schema.

---

## SECTION F — Critical Gaps & Recommendations

### GAP-01: No Standard Envelope
**Issue:** Zero modules share a common top-level envelope. No `job_id`, `module_id`, `status`, or `errors[]` field exists consistently across the stack. Each module has idiosyncratic root objects (`ContentOutput`, `CodeEngineOutput`, `ProductStrategyOutput`, etc.).

**Impact:** The Orchestrator must hand-craft adapters for every module pair. Adding module M11 requires updating the Orchestrator, not just the new module. Inter-op is O(N²) complexity.

**Recommended Fix:**
```python
@dataclass
class NasusEnvelope:
    job_id: str                     # ORCH-XXXXXXXX or plan_XXXXXXXX
    module_id: str                  # M01–M10 or M00/M00-TP/M00-QR
    status: str                     # "success" | "error" | "partial"
    payload: Any                    # the domain object (ContentOutput, etc.)
    errors: List[str]               # machine-readable error list
    quality_score: Optional[float]  # 0.0-1.0, populated post-QR
    created_at: str
```
All module outputs should be wrapped in `NasusEnvelope` before returning to the Orchestrator.

---

### GAP-02: ORM Inconsistency — @dataclass vs Pydantic BaseModel
**Issue:** M05 (Code Engineer) uses `pydantic.BaseModel` + `Field(...)` with validation. All other modules use Python `@dataclass`. This means M05 outputs have automatic field validation, serialization, and `.model_dump()`, while all others rely on hand-written `.to_dict()` methods.
**Specific reference:** `nasus_code_engineer.py` line 23: `from pydantic import BaseModel, Field`; all other schema files use `from dataclasses import dataclass, field`.

**Impact:** Serialization behavior differs. `@dataclass` objects require `.to_dict()` calls; Pydantic objects use `.model_dump()`. An orchestrator assembling a pipeline must use two different serialization paths.

**Recommended Fix:** Standardize all schemas on either Pydantic v2 (`BaseModel`) or `@dataclass` + `to_dict()`. Given the stack's complexity, Pydantic is recommended — it provides free JSON schema generation, field-level validation, and `.model_dump()`.

---

### GAP-03: Task Planner (M00-TP) References M10 (Orchestrator) But Orchestrator Is M00
**Issue:** `nasus_task_planner_schema.py` `ModuleID` enum (line 60) includes `M10 = "M10"` labelled "Orchestrator Core". The Orchestrator prompt identifies itself with no module number. The Quality Reviewer prompt (Section 2) also lists M10 as "Orchestrator Core". But the Orchestrator schema uses `ModuleID` enum starting at M01 with no M10 entry — it references `M01` through `M09` only.
**Specific reference:** task_planner_schema.py `ModuleID.M10 = "M10"` vs orchestrator_schema.py `ModuleID` enum which only defines M01–M09 (line 29–38).

**Impact:** A `PlanStep` with `module_id="M10"` passes Task Planner validation but would be rejected or silently misrouted by the Orchestrator which has no M10 in its own registry.

**Recommended Fix:** Align all `ModuleID` enums across all schema files. Add M10 to the Orchestrator schema enum, or rename all references to M00. A single shared `nasus_module_registry.py` should be the single source of truth for all module IDs.

---

### GAP-04: Quality Reviewer Has No Memory Integration
**Issue:** The Quality Reviewer (M00-QR) schema has zero memory read/write operations. It cannot recall prior review verdicts for the same module, cannot detect quality regression over time, and cannot persist `review_id` records for audit trails.
**Specific reference:** Memory manager prompt Section 7 lists modules that read/write; M00-QR is absent from both lists.

**Impact:** Every review is stateless. The QR cannot say "M06 has failed the tone check 3 times this session" or "this is a regression from the last approved version."

**Recommended Fix:** Add M00-QR to the Memory Manager's write list. After each `ReviewReject` or `ReviewRevise`, write a `Artifact`-type record to the session layer with `source_module`, `quality_score`, `verdict`, and `review_id`. On review start, read the last N reviews for the same source_module.

---

### GAP-05: WriteRequest Has No Corresponding WriteResponse Class
**Issue:** `memory_manager_schema.py` defines `WriteRequest` (line 324) with `layer`, `operation_type`, `target_id`, `payload`, `source_module`. The prompt (Section OP-1) describes returning `write_status` and `record_id`. But no `WriteResponse` dataclass exists in the schema.
**Specific reference:** `WriteStatus` enum exists (line 34), but it's never wrapped with `record_id` into a response object.

**Impact:** Callers of M09 write operations have no typed contract for what they receive back. The Orchestrator's `MemoryWriteRecord` (orchestrator_schema.py line 318) defines `key`, `source_module`, `value`, `ttl_hours` — a completely different shape from what M09 actually returns.

**Recommended Fix:**
```python
@dataclass
class WriteResponse:
    write_status: WriteStatus
    record_id: str
    layer: str
    conflict_detail: Optional[str] = None
    created_at: str = field(default_factory=lambda: datetime.utcnow().isoformat())
```

---

### GAP-06: LandingPage CRO Score Scale Incompatible with Quality Reviewer
**Issue:** `LandingPageOutput.cro_scorecard.total` is an `int` 0–100 (sum of 5 dimensions, 0–20 each). The Quality Reviewer's `quality_score` threshold is `float 0.0–1.0` with APPROVED requiring `>= 0.90`.
**Specific reference:** `landing_page_schema.py` line 173–180 (`CROScorecard.total()`); `quality_reviewer_schema.py` line 218 (`assert self.quality_score >= 0.90`).

**Impact:** When the QR reviews M08 output, there is no defined normalization. A CRO score of 85/100 should map to 0.85 (REVISE territory), but this conversion is undocumented and not enforced anywhere in the schema.

**Recommended Fix:** Add a `normalized_quality_score` property to `LandingPageOutput`:
```python
@property
def normalized_quality_score(self) -> float:
    return round(self.cro_scorecard.total / 100.0, 4)
```
And document in QR prompt Section 4 that M08 review uses `cro_scorecard.total / 100` as `quality_score`.

---

### GAP-07: Content Creator Has No Machine-Readable Quality Signal
**Issue:** `ContentOutput` has `revision_checklist: RevisionChecklist` with fields `missing_facts`, `tone_deviations`, `format_deviations`, `additional_notes` — all `list[str]`. There is no numeric `quality_score`, no pass/fail per checklist item, and no `findings[]` array.
**Specific reference:** `content_creator_schema.py` line 228–238 (`RevisionChecklist` class).

**Impact:** The Quality Reviewer cannot automatically score M06 output — it must parse free-text strings in `revision_checklist` to derive a score, which makes QR scoring for content non-deterministic.

**Recommended Fix:** Add a structured pre-QR self-assessment to `ContentOutput`:
```python
@dataclass
class ContentQASignal:
    checklist_items: List[ChecklistItem]  # reuse QR's ChecklistItem type
    self_score: float                     # 0.0-1.0, computed from PASS/FAIL ratio
```

---

### GAP-08: Product Strategist Prompt Uses Free-Form Input (No Schema)
**Issue:** The Product Strategist prompt describes accepting `product_brief`, `market_data`, `user_research`, etc. as inputs, but `nasus_product_strategist_schema.py` defines only OUTPUT classes (`ProductStrategyOutput`, `UserStory`, `PrioritizationItem`, etc.) — there is no `StrategyRequest` or `StrategyInput` dataclass.
**Specific reference:** `nasus_product_strategist_schema.py` first dataclass is `UserStory` (line 25) — no input class exists.

**Impact:** M07 has an undefined input contract. The Orchestrator's `SubtaskInput` for M07 steps will be free-text `description/value` pairs with no validation. A PlanStep can pass anything and M07 has no way to reject malformed inputs.

**Recommended Fix:** Add a `StrategyRequest` input class:
```python
@dataclass
class StrategyRequest:
    product_brief: str
    market_data: Optional[str] = None
    user_research: Optional[str] = None
    focus: str = "full"  # "prioritization" | "competitive" | "roadmap" | "full"
    output_format: str = "full"
```

---

### GAP-09: Task Planner Quality Checklist References Fields That Don't Exist in PlanBundle
**Issue:** Quality Reviewer prompt Section 4, M10-TP checklist states: "Every step has non-empty `goal` and `inputs`". But `PlanStep` has no `goal` field — it has `description` (str) and `input_artifacts` (List[str]).
**Specific reference:** QR prompt line 163: `"Every step has non-empty \`goal\` and \`inputs\`"` vs task_planner_schema.py PlanStep fields: `description` (line 147), `input_artifacts` (line 150).

**Impact:** QR checklist item M10-TP check will always return N/A or be silently skipped since `goal` does not exist. This is a broken QA check.

**Recommended Fix:** Update QR prompt Section 4 M10 checklist to reference actual PlanStep field names: `description` (not `goal`), `input_artifacts` (not `inputs`).

---

### GAP-10: No Shared ModuleID Source of Truth
**Issue:** `ModuleID` enum is independently defined in at minimum 3 schema files:
- `nasus_orchestrator_schema.py` line 29: M01–M09 only
- `nasus_task_planner_schema.py` line 60: M01–M10 (adds M10=Orchestrator)
- `nasus_quality_reviewer_schema.py` line 58: M01–M10 (matches task planner, not orchestrator)

These three definitions are out of sync: orchestrator does not know about M10, and if a new module M11 is added, all three files must be updated independently.

**Recommended Fix:** Create `nasus_module_registry.py` as a single source of truth:
```python
class ModuleID(str, Enum):
    M01_RESEARCH    = "M01"
    M02_API         = "M02"
    M03_BROWSER     = "M03"
    M04_DATA        = "M04"
    M05_CODE        = "M05"
    M06_CONTENT     = "M06"
    M07_STRATEGY    = "M07"
    M08_LANDING     = "M08"
    M09_MEMORY      = "M09"
    M10_ORCHESTRATOR = "M10"
    M11_TASK_PLANNER = "M11"  # currently not numbered
    M12_QUALITY_REVIEWER = "M12"  # currently not numbered
```
Import from this file in all schema modules.

---

## SECTION G — Module Scores

Scoring rubric 1–5:
- **Envelope (ENV):** Does it wrap output in a standard job_id/status/errors envelope?
- **Contract Clarity (CON):** Are input AND output types explicitly defined in schema?
- **Inter-op Readiness (IOP):** Can another module consume its output without an adapter?
- **Memory Integration (MEM):** Does it have defined read/write hooks to M09?
- **QA Hookability (QAH):** Does it expose a numeric quality_score or structured checklist for QR?

| Module | ENV | CON | IOP | MEM | QAH | AVG | Notes |
|--------|-----|-----|-----|-----|-----|-----|-------|
| M00 Orchestrator | 3 | 4 | 3 | 4 | 3 | **3.4** | |
| M00-TP Task Planner | 3 | 4 | 3 | 2 | 3 | **3.0** | |
| M00-QR Quality Reviewer | 3 | 4 | 3 | 2 | 5 | **3.4** | memory_write() stubs added (GAP-04 partial) |
| M09 Memory Manager | 3 | 4 | 3 | 5 | 2 | **3.4** | WriteResponse added (GAP-05 fixed) |
| M01 Research Analyst | 2 | 4 | 3 | 3 | 3 | **3.0** | nasus_research_analyst_schema.py added (Phase 3) |
| M02 API Integrator | 2 | 2 | 2 | 2 | 1 | **1.8** | |
| M03 Web Browser | 2 | 4 | 3 | 1 | 3 | **2.6** | nasus_web_browser_schema.py added (Phase 3) |
| M04 Data Analyst | 2 | 4 | 3 | 2 | 3 | **2.8** | nasus_data_analyst_schema.py added (Phase 3) |
| M05 Code Engineer | 2 | 4 | 3 | 3 | 4 | **3.2** | |
| M06 Content Creator | 1 | 4 | 3 | 3 | 4 | **3.0** | ContentQASignal added (GAP-07 fixed) |
| M07 Product Strategist | 1 | 4 | 3 | 3 | 3 | **2.8** | StrategyRequest added (GAP-08 fixed) |
| M08 Landing Page | 2 | 4 | 3 | 3 | 4 | **3.2** | normalized_quality_score added (GAP-06 fixed) |

### Stack Average by Dimension (post Phase 3):
| Dimension | Before | After |
|-----------|--------|-------|
| Envelope Consistency | 2.0 / 5 | **2.1 / 5** |
| Contract Clarity | 2.8 / 5 | **4.0 / 5** |
| Inter-op Readiness | 2.3 / 5 | **3.0 / 5** |
| Memory Integration | 2.7 / 5 | **2.8 / 5** |
| QA Hookability | 2.4 / 5 | **3.3 / 5** |
| **Overall Stack Average** | **2.4 / 5** | **3.0 / 5** |

---

## Summary

The Nasus stack has strong individual module design — each module's domain objects are well-structured, validation logic is present, and behavioral rules are clearly documented in prompts. However, the **inter-module integration layer is the weakest point**:

1. **No shared envelope** means every handoff is a bespoke adapter problem
2. **Three divergent ModuleID enums** create silent routing mismatches
3. **QR is completely stateless** — it cannot detect regression
4. **M09 WriteResponse is missing** — the memory bus has an undefined return contract
5. **M05 uses Pydantic, everyone else uses dataclasses** — two serialization systems in one stack
6. **M01, M02, M03, M04 have no dedicated schema files** — 4 of 9 specialist modules are schema-dark

---

## Gap Resolution Tracker

| Gap | Description | Status | Fix Location |
|-----|-------------|--------|--------------|
| GAP-01 | No standard envelope | ✅ FIXED | `nasus_module_registry.py` — `NasusEnvelope` dataclass |
| GAP-02 | @dataclass vs Pydantic inconsistency | OPEN | M01/M03/M04 new schema files use Pydantic; older modules still use dataclasses |
| GAP-03 | Task Planner references M10 but M10 is not Orchestrator | ✅ FIXED | `nasus_module_registry.py` — single `ModuleID` enum M00–M11 |
| GAP-04 | Quality Reviewer has no memory integration | OPEN | `memory_write()` helpers added to ReviewApproved/ReviewRevise/ReviewReject in QR schema |
| GAP-05 | WriteResponse missing from M09 schema | ✅ FIXED | `nasus_memory_manager_schema.py` — `WriteResponse` dataclass (line 42) |
| GAP-06 | LandingPage CRO score scale incompatible with QR | ✅ FIXED | `nasus_landing_page_schema.py` — `normalized_quality_score` property on `LandingPageOutput` |
| GAP-07 | Content Creator has no machine-readable QA signal | ✅ FIXED | `nasus_content_creator_schema.py` — `ContentQASignal` dataclass; `qa_signal` field on `ContentOutput` |
| GAP-08 | Product Strategist has no typed input contract | ✅ FIXED | `nasus_product_strategist_schema.py` — `StrategyRequest` dataclass |
| GAP-09 | QR checklist references non-existent PlanStep fields `goal`/`inputs` | OPEN | Embedded in LLM system prompt; actual `_llm_review` in `nasus_orchestrator.py` uses generic criteria |
| GAP-10 | No shared ModuleID source of truth | ✅ FIXED | `nasus_module_registry.py` — canonical `ModuleID` enum imported by all modules |
| SCHEMA-DARK | M01, M03, M04 had no dedicated schema files | ✅ FIXED (Phase 3) | `nasus_research_analyst_schema.py` (9 tests pass), `nasus_web_browser_schema.py` (12 tests pass), `nasus_data_analyst_schema.py` (14 tests pass) |

**Remaining open items:**
- **GAP-02**: Full Pydantic migration for older modules (M06, M07, M08, M09, M10, M11) — out of scope for Phase 3
- **GAP-04**: QR memory write integration needs sidecar routing — `memory_write()` stubs exist but M11 is not wired to M09 at the orchestrator level
- **GAP-09**: The QR system prompt field name issue is in LLM prompt text, not in schema code

**Priority fix order (remaining):**
1. Wire `ReviewReject`/`ReviewRevise` `memory_write()` into `route_envelope` in orchestrator (completes GAP-04)
2. Standardize older module schemas on Pydantic v2 (GAP-02)
3. Fix QR LLM prompt to reference `description`/`input_artifacts` instead of `goal`/`inputs` (GAP-09)
