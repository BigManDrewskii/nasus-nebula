# NASUS RESEARCH ANALYST -- REFINEMENT & ITERATION DOCUMENT
# Version: 1.0 | Module: M01 | Stack: Nasus Sub-Agent Network

---

## PURPOSE

This document defines the 8 refinement checks (RT-01 through RT-08) that the Quality Reviewer (M12) and the Orchestrator apply when evaluating M01 output. Each check includes: what is tested, how it is scored, what a PASS/FAIL looks like, and the remediation path for failures.

These checks run automatically after every M01 invocation. A result scoring below the threshold on 2 or more RT checks is sent back for revision before delivery.

---

## RT-01 -- Query Classification Accuracy

**What is tested:** Was the query correctly classified into the right category (MARKET / COMPETITOR / TECHNICAL / TREND / GENERAL), and did the source selection reflect that category?

**How it is scored:**
- Extract category from the query using the keyword maps in nasus_research_analyst.py
- Compare to the source types actually used in the findings
- Check that depth suggestion aligns with the category + complexity matrix

**PASS criteria:**
- Source types used are a subset of the recommended types for the detected category
- Depth used is within one level of the suggested depth for category + complexity
- No obvious category mismatch (e.g. ACADEMIC-only sources for a TREND query)

**FAIL criteria:**
- All sources are WEB when query is clearly ACADEMIC (e.g. "peer-reviewed studies on...")
- SURFACE depth used for a COMPETITOR query (insufficient by design)
- Category logged as GENERAL when 3+ competitor keywords are present

**Remediation:**
1. Re-run classify_query() with debug output
2. Override source_types in the ResearchRequest to match correct category
3. Increase depth to at least STANDARD for COMPETITOR and TREND categories
4. Re-invoke M01 with corrected ResearchRequest

---

## RT-02 -- Source Diversity

**What is tested:** Are findings sourced from at least 2 distinct domains? No single domain should account for more than 40% of findings (unless max_sources <= 3).

**How it is scored:**
- Parse domain from each `source_url` using `urllib.parse.urlparse().netloc`
- Count findings per domain
- Compute max_domain_share = max(count_per_domain) / total_findings

**PASS criteria:**
- `max_domain_share <= 0.40` for results with 5+ sources
- At least 2 distinct domains present in any result with 3+ sources
- Source types are varied (not all from a single SourceType) for STANDARD+ depth

**FAIL criteria:**
- All findings from a single domain (e.g. all from `techcrunch.com`)
- `max_domain_share > 0.60` for results with 10+ sources
- DEEP result uses only WEB sources when NEWS and ACADEMIC were available

**Remediation:**
1. Set deduplication flag to enforce max 2 findings per domain
2. Expand source_types to include at least one additional type
3. Re-run search() with domain-diversity enforcement active
4. If stub pool is the source, cycle more stub entries to distribute domains

**Note:** validate_research_output() already emits a RT-02 WARNING when all findings share the same domain. This warning in the summary is the diagnostic trigger for this check.

---

## RT-03 -- Citation Completeness

**What is tested:** When `require_citations=True`, every finding must have a valid, non-empty `source_url`. No finding should reference a source without a URL.

**How it is scored:**
- Iterate all findings
- Check `source_url` is non-empty string, starts with `http`, and is parseable by urlparse
- Check `title` and `excerpt` are both non-empty

**PASS criteria:**
- 100% of findings have a non-empty `source_url` that starts with `http`
- 100% of findings have a non-empty `title`
- 100% of findings have a non-empty `excerpt` (minimum 20 characters)
- Summary text contains at least one inline Markdown citation `[text](url)`

**FAIL criteria:**
- Any finding with `source_url = ""` or `source_url = None`
- Any finding with `title = ""` or `excerpt = ""`
- require_citations=True but zero inline citations in summary text

**Remediation:**
1. Remove any findings with empty source_url before building ResearchResult
2. If removing drops below depth minimum, flag for re-retrieval
3. Rewrite summary to include inline citations for every key claim
4. If stub data is generating empty URLs, fix the URL template in the stub pool

---

## RT-04 -- Summary Coherence with Findings

**What is tested:** Is the summary a faithful synthesis of the findings? The summary must not introduce claims that are absent from the findings list, and must cover the top 3 findings by relevance.

**How it is scored:**
- Extract key noun phrases from the summary
- Cross-check each against finding excerpts
- Flag any summary claim with zero supporting finding
- Verify top-3 findings by relevance_score are referenced in the summary

**PASS criteria:**
- No more than 10% of summary sentences contain unsupported claims
- Top-3 findings by relevance_score are referenced (by title or URL) in the summary
- Summary length >= 200 characters
- Summary contains the original query in the opening paragraph

**FAIL criteria:**
- Summary introduces a named company, statistic, or factual claim not in any finding excerpt
- Summary is < 100 characters (too brief to be coherent)
- None of the top-3 findings are referenced in the summary
- Summary is a copy-paste of a single finding excerpt with no synthesis

**Remediation:**
1. Re-run synthesize() with a stricter "cite only from findings" instruction
2. Add a hallucination guard: after synthesis, strip any sentence that does not contain a term from the findings text
3. Rebuild summary manually from top-3 excerpts if LLM synthesis fails
4. If summary is too brief, increase depth and re-run

---

## RT-05 -- Confidence Calibration

**What is tested:** Is the assigned `ConfidenceLevel` honest given the source count and diversity?

**How it is scored:**
Apply the calibration matrix:

| Sources | Types | Max Allowed Confidence |
|---------|-------|------------------------|
| < 3 | any | LOW |
| 3-9 | 1 | MEDIUM |
| 3-9 | 2+ | MEDIUM |
| 10-14 | 1 | MEDIUM |
| 10-14 | 2+ | HIGH |
| 15+ | 3+ | VERIFIED |

Check that `result.confidence` does not exceed the max allowed for the actual source count and type diversity.

**PASS criteria:**
- Assigned confidence is at or below the calibration ceiling
- VERIFIED is only used when 15+ sources from 3+ distinct source types are present
- LOW is used when fewer than 3 sources are present, regardless of other factors

**FAIL criteria:**
- VERIFIED assigned on a 5-source result
- HIGH assigned on a 2-source result
- LOW assigned on a 20-source, multi-type result (under-confidence is also a failure -- it misleads downstream modules)

**Remediation:**
1. Call `_score_confidence(findings)` directly and replace `result.confidence` with its output
2. Log the mismatch in the summary caveats
3. If confidence is too low due to low source count, increase depth and re-run

---

## RT-06 -- Depth Compliance

**What is tested:** Does the number of findings match the requested depth level?

**Expected source counts:**

| Depth | Expected Sources | Hard Minimum |
|-------|-----------------|---------------|
| SURFACE | 3 | 2 |
| STANDARD | 10 | 7 |
| DEEP | 25 | 18 |
| EXHAUSTIVE | 50 | 40 |

**How it is scored:**
- Check `result.total_sources` against the depth-expected count
- Allow ±20% tolerance before failing
- Also check that `total_sources == len(findings)` (consistency check)

**PASS criteria:**
- `total_sources >= hard_minimum` for the requested depth
- `total_sources == len(findings)`
- EXHAUSTIVE results have >= 40 findings

**FAIL criteria:**
- DEEP result returns 5 findings
- SURFACE result returns 0 findings
- `total_sources` and `len(findings)` do not match

**Remediation:**
1. Check if `max_sources` was set lower than the depth minimum -- if so, raise it or document why
2. Expand the stub pool or add more source types to reach the minimum
3. If the query domain genuinely has fewer sources, document in caveats and downgrade depth
4. Fix `total_sources = len(findings)` consistency programmatically

---

## RT-07 -- Relevance Scoring Consistency

**What is tested:** Are relevance scores consistent, calibrated, and sorted correctly?

**How it is scored:**
- All scores must be in [0.0, 1.0]
- Findings must be sorted descending by relevance_score
- No two findings should have identical relevance_score (except 0.0)
- Score distribution should not be flat (all the same value)

**PASS criteria:**
- All `relevance_score` values are in [0.0, 1.0]
- `findings[0].relevance_score >= findings[-1].relevance_score` (sorted descending)
- Score variance > 0.01 across the full findings list
- No finding with `relevance_score < 0.5` is included in the result

**FAIL criteria:**
- Any `relevance_score` outside [0.0, 1.0]
- Findings not sorted by relevance (first finding has lower score than last)
- All findings have the exact same relevance_score (flat scoring = no discrimination)
- Findings with relevance_score = 0.0 or 0.1 present in the result

**Remediation:**
1. After search(), apply: `findings = sorted(findings, key=lambda f: f.relevance_score, reverse=True)`
2. Apply min-score filter: `findings = [f for f in findings if f.relevance_score >= 0.5]`
3. If all scores are identical, re-score using the quality scoring rubric (Section 7 of prompt)
4. Clamp all scores: `f.relevance_score = max(0.0, min(1.0, f.relevance_score))`

---

## RT-08 -- Error Propagation to Envelope

**What is tested:** When research fails, is the error correctly propagated to the NasusEnvelope? Downstream modules must never receive a FAILED envelope with a DONE payload, or a DONE envelope with an error payload.

**How it is scored:**
- Check envelope.status against envelope.payload type
- Check envelope.error field is populated on FAILED and None on DONE
- Check payload is serializable (can be JSON-encoded)

**PASS criteria:**
- `envelope.status == NasusStatus.DONE` and `envelope.payload` is a valid ResearchResult dict
- `envelope.status == NasusStatus.FAILED` and `envelope.payload` is a valid ResearchError dict
- `envelope.error is None` when status is DONE
- `envelope.error` is a non-empty string when status is FAILED
- `json.dumps(envelope.payload)` does not raise (serialization check)

**FAIL criteria:**
- `envelope.status == NasusStatus.DONE` but `envelope.payload` contains an `error_code` key
- `envelope.status == NasusStatus.FAILED` but `envelope.error is None`
- `envelope.payload` is a raw Python object (not dict) -- not JSON-serializable
- `envelope.status == NasusStatus.PENDING` after route_envelope() returns

**Remediation:**
1. Add an explicit status consistency check at the end of route_envelope():
   ```python
   assert not (envelope.status == NasusStatus.DONE and "error_code" in envelope.payload)
   assert not (envelope.status == NasusStatus.FAILED and envelope.error is None)
   ```
2. Wrap all payload assignments in `.to_dict()` calls -- never assign raw objects
3. Add a try/except around `json.dumps(envelope.payload)` in route_envelope() as a final guard
4. If status is still PENDING after routing, force it to FAILED with error = "ROUTE_ERROR: status not updated"

---

## REVISION WORKFLOW

When M12 (Quality Reviewer) flags an M01 result for revision:

1. **REVISE verdict** (score 0.70-0.89):
   - Identify which RT checks failed
   - Apply remediations listed above for each failed check
   - Re-run only the affected pipeline step (do not re-run full research if only synthesis failed)
   - Re-submit the revised ResearchResult to M12

2. **REJECT verdict** (score < 0.70):
   - Full re-invocation of M01 with a corrected ResearchRequest
   - Orchestrator should log the failure and adjust request parameters before retry
   - Maximum 2 retries before escalating to human review

3. **APPROVED verdict** (score >= 0.90):
   - No action needed. Result is forwarded to downstream module.

---

## ITERATION LOG

| Version | Date | Change |
|---------|------|--------|
| 1.0 | 2026-03-11 | Initial RT-01 through RT-08 specification |
