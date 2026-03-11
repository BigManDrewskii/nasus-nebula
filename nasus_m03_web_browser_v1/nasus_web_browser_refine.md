# NASUS M03 — WEB BROWSER
## Refinement Checks: RT-01 through RT-08
**Version:** 1.0 | **Module:** M03 | **Network:** Nasus Sub-Agent Network

---

## RT-01 — URL Validation Accuracy

**Description:**
Every request must pass URL validation before any network or stub call. The validator checks scheme, domain presence, and non-empty URL. Invalid URLs must produce a `BrowserError` immediately — no page fetch is attempted.

**PASS criteria:**
- `https://example.com` passes validation
- `http://example.com/path?q=1` passes validation
- `""` (empty string) → `BrowserError(error_code="VALIDATION_ERROR", message="URL is empty")`
- `ftp://example.com` → error: invalid scheme
- `javascript:alert(1)` → error: invalid scheme
- `//example.com` → error: no scheme
- `https://` (no domain) → error: no domain

**FAIL criteria:**
- Empty URL reaches `_get_stub()` without error
- `ftp://` or `javascript:` URLs are processed
- `validate_url()` returns `None` for a URL with no domain

**Remediation:**
1. In `validate_url()`, confirm `if not url: return "URL is empty"` is the first check.
2. Confirm `parsed.scheme not in ("http", "https")` check runs before netloc check.
3. Confirm `if not parsed.netloc: return "URL has no domain"`.
4. Test all 5 invalid cases and assert each returns a non-None error string.
5. Confirm `scrape()`, `crawl()`, `extract_structured()`, `simulate_interaction()` all call `validate_url()` as first step.

---

## RT-02 — JavaScript Rendering Fallback

**Description:**
Pages marked `js_required=True` must attempt JS rendering. If JS rendering fails or is unavailable (stub environment), the system must fall back to plain HTTP fetch rather than returning empty content. The result must indicate whether JS rendering was used or a fallback occurred.

**PASS criteria:**
- `js_required=True` on any URL → text includes `[JS rendering simulated]` (stub) or real rendered content (prod)
- If headless browser fails → fallback text includes `[JS fallback — content may be incomplete]`
- Fallback result has `success=True` (partial content is still a result)
- `js_required=False` → no JS note appended, plain fetch only

**FAIL criteria:**
- `js_required=True` returns empty `PageContent(text="", success=False)` when fallback is available
- JS note missing from stub output when `js_required=True`
- Fallback raises exception instead of returning partial result

**Remediation:**
1. In `scrape()`, confirm `js_note = " [JS rendering simulated]" if js_required else ""`.
2. Confirm `text + js_note` is assigned to `PageContent.text`.
3. In production extension: wrap headless call in try/except; on failure set `text = plain_fetch_text + " [JS fallback...]"`.
4. Test: `PageRequest(url="https://github.com", js_required=True)` — assert `"[JS rendering simulated]"` in result text.

---

## RT-03 — Empty Content Detection

**Description:**
A page that returns empty or whitespace-only content must raise an error rather than returning a `PageContent` with an empty `text` field. Empty content is a data quality failure, not a valid result.

**PASS criteria:**
- Stub returns non-empty text for all known domains → `PageContent(success=True)`
- A stub returning `text=""` → `ValueError("RT-03: Empty content returned for <url>")` → `BrowserError`
- `PageContent.text.strip()` is checked, not just `PageContent.text`
- Whitespace-only text (`"   "`) is treated as empty

**FAIL criteria:**
- `PageContent(text="", success=True)` returned without error
- `text = " "` (whitespace only) is accepted as valid content
- RT-03 check runs after `PageContent` construction instead of before

**Remediation:**
1. In `scrape()`, confirm `if not text.strip(): raise ValueError(f"RT-03: Empty content returned for {request.url}")`.
2. This check must run before `PageContent(...)` is constructed.
3. `browse()` catches `ValueError` and returns `BrowserError` — confirm this catch is present.
4. Test: mock a stub with `text=""` and assert `BrowserError` is returned.

---

## RT-04 — Link Deduplication in Crawl

**Description:**
The crawler must never visit the same URL twice within a single crawl session. All links collected across pages must be deduplicated in `CrawlResult.all_links`. The deduplication must preserve insertion order (first occurrence wins).

**PASS criteria:**
- If page A and page B both link to page C, page C is visited only once
- `visited` set prevents re-queuing already-visited URLs
- `CrawlResult.all_links` contains no duplicate URLs
- Order of links in `all_links` matches discovery order (breadth-first)
- `max_pages` limit is respected — crawl stops after N unique pages regardless of queue size

**FAIL criteria:**
- Same URL crawled twice in one session
- `all_links` contains duplicate entries
- Crawl exceeds `max_pages` limit
- Links from failed pages are still added to the queue for future crawling

**Remediation:**
1. In `crawl()`, confirm `visited: set = set()` is initialised before the loop.
2. Confirm `if url in visited: continue` runs before any `scrape()` call.
3. Confirm `visited.add(url)` runs immediately after the visited check.
4. Confirm `list(dict.fromkeys(all_links))` is used for order-preserving dedup on `all_links`.
5. Confirm `while queue and len(pages) < max_pages` as the loop condition.

---

## RT-05 — Interaction Step Validation

**Description:**
Every interaction step must be validated before execution. Steps missing the required `action` field are skipped with a `SKIP` log entry. Unknown actions are logged but do not stop execution. A `navigate` step must validate the target URL using `validate_url()`. Invalid navigate targets produce an `ERROR` log entry.

**PASS criteria:**
- Step with `action="fill"`, `selector`, `value` → executes, status `OK`
- Step with `action="click"` → executes, status `OK`
- Step with `action="navigate"`, valid URL → executes, state URL updated, status `OK`
- Step with `action="navigate"`, invalid URL → status `ERROR`, reason included, execution continues
- Step with no `action` field → status `SKIP`, execution continues
- Step with `action="unknown_action"` → status `UNKNOWN`, execution continues
- `success` in result is `True` only if no step has status `ERROR`

**FAIL criteria:**
- Missing `action` raises `KeyError` instead of `SKIP`
- Invalid navigate URL raises uncaught exception
- `success` is `True` when a step has status `ERROR`
- Execution stops on first `UNKNOWN` action

**Remediation:**
1. In `simulate_interaction()`, confirm `action = step.get("action", "")` (not `step["action"]`).
2. Confirm `if not action: log.append({..., "status": "SKIP"}); continue`.
3. In `navigate` branch, confirm `nav_err = validate_url(value)` is called before `state["url"] = value`.
4. Confirm `success = all(s.get("status") in ("OK", "UNKNOWN") for s in log)` — ERROR makes success False.
5. Test: 4-step sequence with one invalid navigate — assert `success=False` and `steps_executed=4`.

---

## RT-06 — Extraction Schema Alignment

**Description:**
`extract_structured()` must return a result dict that always contains the `url`, `extracted`, and `meta` keys. The `extracted` dict must contain at least one key. If no `extraction_targets` are specified, `text` must be returned as a fallback. Each requested target must be present in `extracted` if data is available.

**PASS criteria:**
- Result always has `url`, `extracted`, `meta` keys
- `extracted` is never an empty dict
- `extraction_targets=[]` → `extracted` contains `text` fallback
- `extraction_targets=["title", "links"]` → `extracted` contains both `title` and `links`
- Unavailable target (e.g. `images` on stub with no images) returns an empty list, not missing key

**FAIL criteria:**
- Result missing `url`, `extracted`, or `meta`
- `extracted = {}` returned for any input
- Requested target absent from `extracted` without explanation

**Remediation:**
1. In `extract_structured()`, confirm `result = {"url": ..., "extracted": {}, "meta": ...}` is initialised.
2. Confirm fallback: `if not result["extracted"]: result["extracted"]["text"] = stub["text"]`.
3. For each `ExtractionTarget`, confirm the branch sets `result["extracted"][key] = ...`.
4. For `IMAGES` with no real images, return `[]` not omit the key.
5. Test: call with no targets and assert `"text"` key present in `extracted`.

---

## RT-07 — Screenshot Quality and Format

**Description:**
The SCREENSHOT mode must return a dict with `url`, `screenshot` (reference string or base64), `width`, and `height`. In the stub environment, `screenshot` is a deterministic hash-based reference. In production, it must be a base64-encoded PNG or a presigned URL. Quality must be `"high"` by default.

**PASS criteria:**
- `mode="screenshot"` → dict with `url`, `screenshot`, `width`, `height`, `quality` keys
- `screenshot` value is non-empty string
- `width=1280`, `height=800` as defaults
- `quality="high"` in result
- Stub screenshot reference is deterministic for the same URL (same hash each time)

**FAIL criteria:**
- Screenshot result missing `width` or `height`
- `screenshot` key contains `None` or empty string
- Non-deterministic screenshot ref (fails idempotency test)
- `quality` field missing from result

**Remediation:**
1. In `browse()`, confirm the `SCREENSHOT` branch returns all 5 keys: `url`, `screenshot`, `width`, `height`, `quality`.
2. Confirm `hashlib.md5(request.url.encode()).hexdigest()[:8]` for deterministic stub ref.
3. Test: call screenshot mode twice with same URL, assert `screenshot` value identical both times.
4. In production extension: replace stub with `playwright` screenshot → base64 encode → return.

---

## RT-08 — Error Envelope Propagation

**Description:**
Any `BrowserError` returned by `browse()` must produce a `FAILED` envelope. A `DONE` envelope must only be produced for fully successful results (`PageContent(success=True)`, `CrawlResult`, extracted dict, interaction result). The `job_id` must be preserved in all cases.

**PASS criteria:**
- Empty URL → `BrowserError` → `envelope.mark_failed(...)` → status `FAILED`
- Invalid scheme → `BrowserError` → `FAILED`
- Valid scrape → `PageContent` → `envelope.mark_done(result.to_dict())` → `DONE`
- Valid crawl → `CrawlResult` → `mark_done(result.to_dict())` → `DONE`
- Valid extract → dict → `mark_done(result)` → `DONE`
- Unhandled exception in `route_envelope()` → caught → `mark_failed(f"route_envelope error: {e}")` → `FAILED`
- `envelope.job_id` unchanged after any code path

**FAIL criteria:**
- `BrowserError` wrapped in `mark_done()` (error hidden in DONE response)
- Exception escapes `route_envelope()` uncaught
- `job_id` mutated during execution
- `PageContent(success=False)` (e.g. crawl sub-page error) causes whole envelope to FAIL

**Remediation:**
1. In `route_envelope()`, confirm `if isinstance(result, BrowserError): return envelope.mark_failed(result.to_dict()["message"])`.
2. Confirm `hasattr(result, "to_dict")` check before calling `.to_dict()` — dicts go directly to `mark_done()`.
3. Note: individual crawl page failures (sub-page `PageContent(success=False)`) are embedded in `CrawlResult` — the envelope is `DONE` because the crawl itself succeeded. Only a top-level `BrowserError` causes `FAILED`.
4. Confirm outer `except Exception as e` in `route_envelope()` calls `envelope.mark_failed(...)`.
5. Test: pass `url=""` and assert envelope status `FAILED`; pass valid URL and assert `DONE`.
