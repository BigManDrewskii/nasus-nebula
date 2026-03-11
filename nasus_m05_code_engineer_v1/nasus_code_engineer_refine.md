# Nasus M05 — Code Engineer Refinement Rules

This document defines the post-generation quality gates applied to every
`CodeResult` before it leaves M05. Each rule has a short ID for traceability.

---

## RT-01 Language / Task Match Validation

**Trigger:** Every call to `generate()`, `debug()`, `refactor()`, `review()`.

**Rule:** The `spec.task` value must match the handler being called.
- `generate()` requires `CodeTask.GENERATE`
- `debug()` requires `CodeTask.DEBUG`
- `refactor()` requires `CodeTask.REFACTOR`
- `review()` / `explain()` accept `CodeTask.REVIEW` or `CodeTask.EXPLAIN`
- `route_envelope()` handles dispatch; it maps `TEST` and `CONVERT` to appropriate handlers

**Failure response:** Return `CodeError(error_code="TASK_MISMATCH", ...)` immediately.

---

## RT-02 Syntax Check Heuristic

**Trigger:** `validate_code_output(result)` called after generation.

**Rule (Python):** Count `(` vs `)` and `{` vs `}` in every `CodeBlock.code`.
If counts do not match, append a warning to the issues list.

**Rule (future):** TypeScript/JavaScript bracket balancing should be added as M05 matures.

**Note:** This is a lightweight heuristic, not a full AST parse. A connected
syntax-check tool (e.g. `py_compile`, `tsc --noEmit`) is the recommended upgrade path.

**Failure response:** Add `RT-02: Unbalanced ...` entry to `validate_code_output` issues list.
Caller may promote to `CodeError` if strict mode is required.

---

## RT-03 Filename Assignment

**Trigger:** `validate_code_output(result)`.

**Rule:** Every `CodeBlock` in `result.blocks` and `result.tests` must have a non-empty
`filename` with a recognisable extension matching its `language`.

**Naming convention:**
- Python: `snake_case.py`
- TypeScript: `camelCase.ts` or `kebab-case.ts`
- JavaScript: `camelCase.js`
- Bash: `verb_noun.sh`
- SQL: `YYYYMMDD_description.sql` for migrations
- Test files: `test_<module>.py` or `<module>.test.ts`

**Failure response:** Add `RT-03: CodeBlock[i] is missing a filename.` to issues list.

---

## RT-04 Documentation Coverage

**Trigger:** Applied when `spec.style in (DOCUMENTED, VERBOSE)` or `spec.include_docs=True`.

**Rule (Python):**
- Every `class` definition must have a class-level docstring.
- Every `def` with more than 3 parameters must have a docstring.
- Module-level docstring required if `include_docs=True`.

**Rule (TypeScript/JavaScript):**
- Every exported function must have a JSDoc comment.

**Failure response:** Add a `RT-04: Missing docstring on <symbol>` entry to `review_notes`.
This is a warning, not a hard block (unless `style=DOCUMENTED`).

---

## RT-05 Test Coverage When include_tests=True

**Trigger:** Post-generation check when `spec.include_tests=True`.

**Rule:** `result.tests` must be non-empty. Each test block must:
- Have a filename matching `test_*.py` (Python) or `*.test.ts` (TypeScript).
- Contain at least one test function/case.
- Cover at minimum: happy path and one error/edge case.

**Failure response:** If `result.tests` is empty, add `RT-05: include_tests=True but no test
blocks were generated.` to issues list.

---

## RT-06 No Hardcoded Secrets or Dangerous Patterns

**Trigger:** `validate_code_output(result)` — scans every `CodeBlock.code`.

**Banned patterns (case-insensitive substring match):**
| Pattern            | Reason                                      |
|--------------------|---------------------------------------------|
| `os.system(`       | Shell injection risk                        |
| `eval(`            | Arbitrary code execution                    |
| `exec(`            | Arbitrary code execution                    |
| `subprocess.call(` | Shell injection risk                        |
| `subprocess.Popen(`| Shell injection risk                        |
| `__import__(`      | Dynamic import obfuscation                  |
| `SECRET_KEY =`     | Hardcoded secret                            |
| `PASSWORD =`       | Hardcoded credential                        |
| `API_KEY =`        | Hardcoded API credential                    |
| `private_key =`    | Hardcoded cryptographic material            |

**Failure response:** Add `RT-06: Dangerous pattern '<x>' found in <filename>.` to issues list.
If the pattern is security-critical, escalate to `CodeError`.

---

## RT-07 Max Lines Compliance

**Trigger:** `validate_code_output(result)` — checks each `CodeBlock.line_count`.

**Rule:**
- `spec.max_lines` is a *soft* cap communicated to the generator.
- Hard cap: no single `CodeBlock` may exceed **500 non-empty lines**.
- If exceeded, add a `RT-07: <filename> has N lines, exceeding maximum of 500.` warning.

**Guidance for callers:** If a task legitimately requires more than 500 lines,
split it into multiple `Spec` calls (one per module/file) and assemble results.

---

## RT-08 Error Envelope Propagation

**Trigger:** `route_envelope()` — wraps all handler calls in try/except.

**Rule:** Any unhandled exception inside a handler must be caught and returned as:
```python
CodeError(description="Routing failed", error_code="ROUTE_ERROR", message=str(exc))
```
wrapped in the envelope with `status=NasusStatus.ERROR`.

**Callers must check `envelope.status` before reading `envelope.payload["result"]`.**

---

## Refinement Application Order

When multiple issues are detected, apply or report them in this priority order:

1. RT-06 (security) — must be resolved before delivery
2. RT-01 (task mismatch) — hard error, stop processing
3. RT-08 (envelope propagation) — hard error, stop processing
4. RT-03 (missing filename) — hard error for downstream consumers
5. RT-02 (syntax heuristic) — warning, flag for manual review
6. RT-07 (max lines) — warning, suggest splitting
7. RT-05 (test coverage) — warning, request test generation
8. RT-04 (doc coverage) — info, apply in DOCUMENTED/VERBOSE mode only

---

## Upgrade Path

When M05 is connected to a live LLM backend, the following refinements should be promoted
from heuristic to verified:

- RT-02: Replace regex with `ast.parse()` (Python) or `tsc --noEmit` (TypeScript)
- RT-04: Use AST visitor to count docstring nodes vs. function nodes
- RT-05: Measure branch coverage via `coverage.py` or `c8`
- RT-06: Integrate `bandit` (Python) or `eslint-plugin-security` (JS/TS) as post-pass
