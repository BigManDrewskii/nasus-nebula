# NASUS M02 — API INTEGRATOR
## Refinement Checks: RT-01 through RT-08
**Version:** 1.0 | **Module:** M02 | **Network:** Nasus Sub-Agent Network

---

## RT-01 — Auth Header Injection Accuracy

**Description:**
Every supported auth type must inject credentials into the correct header with the correct format. No auth value must appear in the URL, query string, or request body. The `auth_value` field must be redacted from all serialised output.

**PASS criteria:**
- `BEARER` → `Authorization: Bearer <token>`
- `API_KEY` → `X-Api-Key: <key>` (or custom header name if `auth_header_name` set)
- `BASIC` → `Authorization: Basic <base64(user:pass)>`
- `OAUTH2` → `Authorization: Bearer <access_token>`
- `CUSTOM` → `Authorization: Token <value>` (or custom template)
- `NONE` → no Authorization header added
- `auth_value` is not present in `ApiResponse.to_dict()` output

**FAIL criteria:**
- Token appears in URL query string
- Wrong header format for any auth type
- `auth_value` leaks into response dict

**Remediation:**
1. In `build_headers()`, audit each `AuthType` branch.
2. In `ApiRequest.to_dict()`, confirm `auth_value` is excluded or redacted to `"[REDACTED]"`.
3. Test each auth type and assert the correct `Authorization` header key and value format.

---

## RT-02 — Request Pre-flight Validation

**Description:**
Every request must be validated before execution via `validate_request()`. A request with a missing URL, invalid scheme, missing required auth, or a GraphQL POST without a body must return a 400-equivalent error without hitting the network.

**PASS criteria:**
- Empty URL → validation error, no execution
- URL without `http://` or `https://` scheme → validation error
- `BEARER` auth with empty `auth_value` → validation error
- GraphQL request with `GET` method → validation error (must be POST)
- Valid request passes validation and proceeds to `execute()`

**FAIL criteria:**
- Malformed URL reaches the HTTP layer
- Auth-required request executes with empty credentials
- `validate_request()` always returns `[]` regardless of input

**Remediation:**
1. In `execute()`, confirm `validate_request(request)` is called before `build_headers()`.
2. If issues list is non-empty, return `ApiResponse(status_code=400, ...)` immediately.
3. Add test: pass `ApiRequest(url="", ...)` and assert status_code == 400.

---

## RT-03 — Retry with Exponential Backoff on 5xx

**Description:**
Requests returning 5xx status codes must be retried up to `max_retries` times using exponential backoff with jitter. The formula is `sleep = (2^attempt) + jitter` where jitter is a random float in `[0, 0.1]`. After exhausting retries, return the last error response.

**PASS criteria:**
- 500 response on attempt 0 → retry → attempt 1 → retry → attempt 2 → return error
- Backoff between retries is non-zero
- After `max_retries` exhausted, returns `ApiResponse(success=False)`
- 200 response on first attempt → no retry, returns immediately
- 4xx responses → no retry (client errors are not retried)

**FAIL criteria:**
- 5xx response returned immediately without retry
- Infinite retry loop (no attempt counter increment)
- 429 handled by retry logic instead of rate-limit handler
- Backoff sleep is zero (jitter only, no base)

**Remediation:**
1. In `execute()`, confirm `attempt` increments inside the `>= 500` retry branch.
2. Confirm `while attempt <= max_retries` loop terminates.
3. Confirm 4xx responses break the loop and return immediately.
4. In tests, cap sleep to 50ms (stub environment); confirm retries happen without timing out.

---

## RT-04 — Rate Limit Handling (429)

**Description:**
A 429 response must trigger a wait using the `Retry-After` value from the response (or a default of 1 second), then retry. After exhausting retries, return a descriptive rate-limit error — not a generic 500.

**PASS criteria:**
- 429 → read `retry_after` from stub → wait → retry
- After max retries on 429 → `ApiResponse(status_code=429, error_message="Rate limited — max retries exhausted")`
- Error message clearly states rate limiting (not "Internal Server Error")
- `retry_after` defaults to 1 if not present in response

**FAIL criteria:**
- 429 treated as generic 5xx (wrong error message)
- No wait between rate-limit retries
- Rate-limit error returns status_code=500

**Remediation:**
1. In `execute()`, confirm the `status == 429` branch is checked before the generic `>= 500` branch.
2. Confirm `retry_after = stub.get("retry_after", 1)` is present.
3. Confirm final return after rate-limit exhaustion uses `status_code=429`.

---

## RT-05 — SQL / Mutation Safety (N/A for HTTP)

**Description:**
This module handles HTTP APIs, not SQL. However, the equivalent safety rule applies: the API integrator must never construct or forward requests that include mutation of internal Nasus state. Specifically, `route_envelope()` must never modify the input envelope's `job_id`, `module_id`, or metadata fields.

**PASS criteria:**
- `envelope.job_id` is identical before and after `route_envelope()` call
- `envelope.module_id` is not overwritten
- No write operations on envelope fields outside of `mark_running()`, `mark_done()`, `mark_failed()`

**FAIL criteria:**
- `job_id` changes during execution
- Envelope metadata is modified outside sanctioned mark_* methods

**Remediation:**
1. Audit `route_envelope()` — confirm only `mark_running()`, `mark_done()`, `mark_failed()` mutate the envelope.
2. Add test: capture `envelope.job_id` before call, assert equal after.

---

## RT-06 — Batch Order Preservation

**Description:**
`execute_batch()` must return responses in the same order as the input request list. Response at index N must correspond to request at index N. Parallel execution is not used in the stub — sequential execution guarantees ordering.

**PASS criteria:**
- 3 requests → 3 responses in same order
- If request[1] fails (400), response[1] is the error and response[0] and [2] are unaffected
- Empty input list → empty response list
- Single-item list → single-item response list

**FAIL criteria:**
- Responses reordered (e.g. by response time)
- A failure in one request causes subsequent requests to be skipped
- Response count != request count

**Remediation:**
1. In `execute_batch()`, confirm it uses `[execute(req) for req in requests]` (list comprehension, not async gather).
2. Add test: send 3 requests to different stubs, assert `responses[i].body` matches expected stub for request `i`.

---

## RT-07 — Webhook Signature Verification

**Description:**
Webhook payloads must be verified using HMAC-SHA256 with `hmac.compare_digest` (timing-safe comparison). A mismatched signature must return `False`. An empty secret must not silently pass verification.

**PASS criteria:**
- Correct signature → `verify_webhook_signature()` returns `True`
- Wrong signature → returns `False`
- `hmac.compare_digest` used (not `==`)
- `setup_webhook()` returns dict with `webhook_id`, `url`, `events`, `active`, `secret_set`
- `secret_set` is `True` when secret is non-empty, `False` otherwise

**FAIL criteria:**
- Direct string comparison `expected == signature` used instead of `compare_digest`
- Empty secret produces `True` for any signature
- `setup_webhook()` returns a response missing required keys

**Remediation:**
1. In `verify_webhook_signature()`, confirm `hmac.compare_digest(expected, signature)` is used.
2. Test: compute correct HMAC, assert `True`; mutate one byte, assert `False`.
3. In `setup_webhook()`, confirm all 5 keys (`webhook_id`, `url`, `events`, `active`, `secret_set`) are present.

---

## RT-08 — Error Envelope Propagation

**Description:**
Any HTTP error response (non-2xx) or validation failure must produce a `FAILED` envelope. A `DONE` envelope must only be produced for fully successful responses (2xx). The `job_id` must be preserved in all cases.

**PASS criteria:**
- 200/201 response → `envelope.mark_done(response.to_dict())` → status `DONE`
- 400/401/403/404/500 response → `envelope.mark_failed(error_message)` → status `FAILED`
- Unhandled exception in `route_envelope()` → caught by outer `except` → `mark_failed()`
- `envelope.job_id` unchanged after call

**FAIL criteria:**
- Non-2xx response wrapped in `mark_done()`
- Exception escapes `route_envelope()` uncaught
- `job_id` mutated during execution

**Remediation:**
1. In `route_envelope()`, confirm `if not response.success: return envelope.mark_failed(...)`.
2. Confirm outer `except Exception as e` calls `envelope.mark_failed(...)` and returns it.
3. Test: send request to `/error401` stub, assert returned envelope status == `FAILED`.
4. Test: send request to `/users` stub, assert returned envelope status == `DONE`.
