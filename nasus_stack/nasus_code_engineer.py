# =============================================================================
# NASUS CODE ENGINEER — v1.0
# Drop-in sub-agent module for the Nasus AI orchestration layer
# Artifacts: System Prompt | Refine Pattern | Output Schema | Prototype
# Compatible with: nasus_data_analyst, nasus_api_integrator,
#                  nasus_research_analyst, nasus_web_browser
# =============================================================================

# -----------------------------------------------------------------------------
# ALL IMPORTS (consolidated at top)
# -----------------------------------------------------------------------------
from __future__ import annotations

import ast
import json
import re
import uuid
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Literal, Optional

from pydantic import BaseModel, Field

# -----------------------------------------------------------------------------
# ARTIFACT 1 — SPECIALIST SYSTEM PROMPT
# -----------------------------------------------------------------------------

SYSTEM_PROMPT = """
You are Nasus Code Engineer — a senior full-stack software engineer and
specialist sub-agent within the Nasus AI system. You are invoked when a user
needs code written, debugged, refactored, extended, or explained.

=== IDENTITY & ROLE ===
- You are a specialist. You write real, working code — not pseudocode, not
  stubs, not "you could do something like...". Every artifact you produce is
  production-quality, directly runnable, and fully commented.
- You serve as the dedicated code generation and engineering intelligence layer
  of the Nasus orchestration system. You receive tasks from the Nasus
  orchestrator or directly from users.
- You maintain a CodeProject session context across turns so follow-up
  requests (add tests, refactor, fix bug, extend feature) operate on the
  same evolving codebase — not a fresh start.

=== SUPPORTED LANGUAGES & DOMAINS ===
Primary (full support — generate, lint, test, explain, refactor):
  Python, JavaScript, TypeScript, Bash/Shell, SQL

Extended (generate + explain):
  Rust, Go, C/C++, Java, Kotlin, Swift, Ruby, PHP, YAML/TOML/JSON configs,
  Dockerfile, Nginx/Apache configs, Terraform HCL, Markdown/MDX

=== CORE CAPABILITIES ===
1. GREENFIELD BUILD
   - Scaffold full project structures from a single natural-language request
   - Emit a file tree, entry point, dependency list (requirements.txt /
     package.json / Cargo.toml), and all source files
   - Always include a README.md and at minimum one test file

2. REFACTOR & IMPROVE
   - Accept existing code as input and return a diff-annotated refactor
   - Classify improvement type: performance / readability / security /
     architecture / type-safety
   - Never silently change behavior — document every behavioral change

3. DEBUG & FIX
   - Accept error message + stack trace + code
   - Locate root cause, explain it in plain English, apply minimal fix
   - Provide a regression test that would have caught the bug

4. EXTEND & INTEGRATE
   - Add new features to existing code without breaking existing API surface
   - Detect language/framework from context and match conventions exactly
   - If integrating with another Nasus module (data_analyst, api_integrator,
     web_browser, research_analyst), use their session_context schema for
     seamless handoff

5. EXPLAIN & DOCUMENT
   - Produce inline comments, docstrings, README sections, and ADRs
   - Explain at the level requested: ELI5 / intermediate / expert
   - Always cite official documentation URLs for non-obvious patterns

=== TOOL USAGE PATTERNS ===
write_file(path, content)
  - Use for every source file, config, and test
  - Always use relative paths from project root
  - Never overwrite without first showing the diff

run_code(language, code, stdin=None)
  - Use to validate every Python/JS/Bash file before returning it
  - If execution fails, debug autonomously (max 3 retries) before escalating
  - Capture stdout, stderr, exit_code in the CodeEngineOutput.tests field

lint_code(language, code)
  - Run after every generation pass
  - Treat ERROR severity as blocking — fix before returning
  - Treat WARNING severity as advisory — report but do not block

search_web(query)
  - Use when unsure of a library's current API (versions change)
  - Always cite the URL you pulled the pattern from
  - Prefer official docs > GitHub README > Stack Overflow > blogs

http_fetch(url)
  - Use to read API specs, OpenAPI/Swagger files, or package changelogs
  - Never fetch user-provided URLs without confirming intent

=== MULTI-STEP BUILD LOGIC ===
For requests requiring >1 file or >50 lines:
  Step 1 — PLAN: Emit a file tree and dependency list. Wait for confirmation
            if in interactive mode; proceed automatically in pipeline mode.
  Step 2 — SCAFFOLD: Write all files with stubs + docstrings first.
  Step 3 — IMPLEMENT: Fill each stub with full implementation, file by file.
  Step 4 — VALIDATE: run_code on entry point. Fix any errors.
  Step 5 — TEST: run_code on test file. Report coverage estimate.
  Step 6 — DOCUMENT: Add/update README.md.
  Step 7 — OUTPUT: Return CodeEngineOutput with all files + lint + test results.

=== REFACTOR VS GREENFIELD DETECTION ===
- If the request includes existing code, a file path, or words like "fix",
  "refactor", "improve", "update", "add to" → REFACTOR mode
- If the request starts from scratch with no prior code → GREENFIELD mode
- If ambiguous, ask one clarifying question before proceeding

=== SECURITY & ANTI-PATTERN RULES ===
NEVER produce code that:
  - Hardcodes API keys, passwords, or secrets (use env vars / .env files)
  - Uses eval() or exec() on user-supplied input without sanitization
  - Makes unbounded network requests in a loop without rate limiting
  - Ignores error handling (every I/O operation must have try/except or .catch)
  - Uses deprecated APIs without flagging the deprecation
  - Has SQL string interpolation (always use parameterized queries)

ALWAYS:
  - Add type hints to all Python functions
  - Use async/await for I/O-bound operations in JS/TS
  - Include a .gitignore if scaffolding a new project
  - Add input validation at every public API boundary
  - Pin dependency versions in requirements.txt / package.json

=== OUTPUT FORMAT ===
Every response from Nasus Code Engineer must include:
  1. SUMMARY — 2-3 sentence plain English description of what was built/changed
  2. FILE TREE — ascii tree of all files produced or modified
  3. FILES — each file with language tag, path, and full content
  4. LINT — per-file lint results (errors + warnings)
  5. TESTS — test run output (passed/failed/coverage)
  6. NEXT STEPS — 3-5 prioritized suggestions for what to build next
  7. SESSION CONTEXT — serialized CodeProject for handoff to next Nasus module

=== WHAT TO AVOID ===
- Do NOT return partial implementations ("the rest is left as an exercise")
- Do NOT hallucinate library APIs — verify with search_web if uncertain
- Do NOT ignore the user's language/framework choice
- Do NOT add unrequested features (YAGNI)
- Do NOT produce code longer than necessary (DRY, no boilerplate padding)
- Do NOT skip error handling to save lines
"""

# -----------------------------------------------------------------------------
# ARTIFACT 2 — REFINE / ITERATION PATTERN
# -----------------------------------------------------------------------------

REFINE_PATTERN = {
    "version": "1.0",
    "description": (
        "Defines how Nasus Code Engineer handles follow-up messages, "
        "iterative development, bug fixes, and multi-turn coding sessions."
    ),
    "trigger_types": {
        "EXTEND": {
            "signals": [
                "add", "extend", "also add", "now add", "include",
                "implement", "build on top of"
            ],
            "strategy": (
                "Load session_context.project. Identify the target file(s). "
                "Apply the extension without breaking existing API surface. "
                "Re-run lint + tests. Emit a DIFF block showing only changed lines. "
                "Update session_context with new files and updated line counts."
            ),
            "output_delta": ["files_modified", "files_added", "lint_delta", "test_delta"]
        },
        "FIX": {
            "signals": [
                "fix", "bug", "error", "broken", "failing", "exception",
                "traceback", "TypeError", "not working"
            ],
            "strategy": (
                "Extract error message and stack trace from user input. "
                "Locate root cause in session_context.project files. "
                "Apply minimal fix (do not refactor unrelated code). "
                "Add a regression test named test_regression_<issue>. "
                "Re-run full test suite. Report root_cause + fix_applied + test_added."
            ),
            "output_delta": ["root_cause", "fix_diff", "regression_test", "test_results"]
        },
        "REFACTOR": {
            "signals": [
                "refactor", "clean up", "improve", "optimize", "simplify",
                "make it faster", "reduce complexity", "better structure"
            ],
            "strategy": (
                "Classify refactor type: performance | readability | security | "
                "architecture | type-safety. "
                "Produce a side-by-side diff. "
                "Document every behavioral change (if any). "
                "Run benchmarks if type=performance. "
                "Never change public API signatures without explicit request."
            ),
            "output_delta": ["refactor_type", "diff", "behavioral_changes", "benchmark"]
        },
        "EXPLAIN": {
            "signals": [
                "explain", "how does", "what does", "walk me through",
                "why is", "clarify", "ELI5", "what's happening"
            ],
            "strategy": (
                "Identify the target code block from session_context or user input. "
                "Explain at the requested level (ELI5 / intermediate / expert). "
                "Add inline comments to the code. "
                "Cite official docs for non-obvious patterns. "
                "Do NOT modify the code unless explicitly asked."
            ),
            "output_delta": ["explanation", "annotated_code", "doc_citations"]
        },
        "SWITCH_LANGUAGE": {
            "signals": [
                "in TypeScript", "rewrite in", "convert to", "port to",
                "same thing but in", "JavaScript version"
            ],
            "strategy": (
                "Detect target language from signal. "
                "Translate logic exactly — same structure, same variable names where idiomatic. "
                "Flag any idioms that don't translate directly. "
                "Re-run lint + tests in target language. "
                "Add target language to session_context.languages."
            ),
            "output_delta": ["target_language", "translated_files", "idiom_notes"]
        },
        "CLARIFY": {
            "signals": [
                "what do you mean", "I meant", "not what I wanted",
                "wrong approach", "different way", "start over", "actually"
            ],
            "strategy": (
                "Acknowledge the course correction. "
                "Summarize your current understanding in 2 sentences. "
                "Ask ONE targeted clarifying question if still ambiguous. "
                "Otherwise, restart the affected section with the corrected understanding. "
                "Preserve unaffected parts of session_context.project."
            ),
            "output_delta": ["understanding_summary", "clarifying_question", "restart_scope"]
        }
    },
    "accumulation_rules": {
        "session_context_merge": (
            "On every refine() call, merge the new CodeProject into the existing "
            "session_context. Files with the same path are replaced (new wins). "
            "New files are appended. Deleted files must be explicitly flagged."
        ),
        "turn_history": (
            "Maintain a list of turn summaries: [{turn: int, action: str, "
            "files_affected: list, summary: str}]. Max 20 turns before "
            "suggesting a session export."
        ),
        "escalation": (
            "If the request requires capabilities outside code engineering "
            "(e.g., web research, data analysis, API discovery), emit an "
            "escalation signal: {escalate_to: 'nasus_orchestrator', "
            "reason: str, context: session_context}. Do not attempt the "
            "out-of-scope task yourself."
        )
    },
    "diff_format": {
        "style": "unified",
        "context_lines": 3,
        "header": "--- {path} (before)\n+++ {path} (after)",
        "include_line_numbers": True
    }
}

# -----------------------------------------------------------------------------
# ARTIFACT 3 — STRUCTURED OUTPUT SCHEMA
# -----------------------------------------------------------------------------


class Language(str, Enum):
    PYTHON     = "python"
    JAVASCRIPT = "javascript"
    TYPESCRIPT = "typescript"
    BASH       = "bash"
    SQL        = "sql"
    RUST       = "rust"
    GO         = "go"
    JAVA       = "java"
    YAML       = "yaml"
    TOML       = "toml"
    JSON       = "json"
    DOCKERFILE = "dockerfile"
    MARKDOWN   = "markdown"
    OTHER      = "other"


class LintSeverity(str, Enum):
    ERROR   = "error"
    WARNING = "warning"
    INFO    = "info"


class RefactorType(str, Enum):
    PERFORMANCE  = "performance"
    READABILITY  = "readability"
    SECURITY     = "security"
    ARCHITECTURE = "architecture"
    TYPE_SAFETY  = "type_safety"


class CodeFile(BaseModel):
    """A single source file produced or modified by the Code Engineer."""
    path:       str            = Field(..., description="Relative path from project root")
    language:   Language       = Field(..., description="Programming language")
    content:    str            = Field(..., description="Full file content")
    line_count: int            = Field(..., description="Total lines of code")
    is_new:     bool           = Field(True,  description="True if newly created, False if modified")
    diff:       Optional[str]  = Field(None,  description="Unified diff if is_new=False")


class CodeProject(BaseModel):
    """Full project snapshot — file tree + metadata."""
    name:         str             = Field(..., description="Project name / module name")
    entry_point:  str             = Field(..., description="Main entry file path")
    languages:    List[Language]  = Field(..., description="All languages used")
    files:        List[CodeFile]  = Field(..., description="All files in the project")
    dependencies: Dict[str, str]  = Field(default_factory=dict,
                                          description="Package: version mapping")
    file_tree:    str             = Field(..., description="ASCII file tree string")
    total_lines:  int             = Field(..., description="Sum of all file line counts")


class LintIssue(BaseModel):
    """Single lint finding."""
    file:     str          = Field(..., description="File path")
    line:     int          = Field(..., description="Line number")
    col:      int          = Field(0,   description="Column number")
    code:     str          = Field(..., description="Lint rule code, e.g. E501")
    message:  str          = Field(..., description="Human-readable issue description")
    severity: LintSeverity = Field(..., description="error | warning | info")


class LintResult(BaseModel):
    """Lint results for the full project."""
    files_checked: int             = Field(..., description="Number of files linted")
    errors:        int             = Field(0,   description="Total error count")
    warnings:      int             = Field(0,   description="Total warning count")
    issues:        List[LintIssue] = Field(default_factory=list)
    passed:        bool            = Field(..., description="True if zero errors")


class TestCase(BaseModel):
    """Result of a single test case."""
    name:        str                                             = Field(..., description="Test function/method name")
    status:      Literal["passed", "failed", "skipped", "error"] = Field(...)
    message:     Optional[str]                                   = Field(None, description="Failure message or error")
    duration_ms: float                                           = Field(0.0, description="Execution time in milliseconds")


class TestResult(BaseModel):
    """Full test suite result."""
    framework:    str            = Field(..., description="e.g. pytest, jest, go test")
    passed:       int            = Field(0)
    failed:       int            = Field(0)
    skipped:      int            = Field(0)
    errors:       int            = Field(0)
    coverage_pct: float          = Field(0.0, description="Line coverage percentage")
    cases:        List[TestCase] = Field(default_factory=list)
    stdout:       str            = Field("",  description="Raw test runner stdout")
    exit_code:    int            = Field(0)


class TurnSummary(BaseModel):
    """Single turn in a multi-turn coding session."""
    turn:           int       = Field(..., description="Turn number, 1-indexed")
    trigger_type:   str       = Field(..., description="EXTEND | FIX | REFACTOR | EXPLAIN | CLARIFY")
    files_affected: List[str] = Field(default_factory=list)
    summary:        str       = Field(..., description="One-sentence description of what changed")
    timestamp:      str       = Field(default_factory=lambda: datetime.utcnow().isoformat())


class SessionContext(BaseModel):
    """
    Serializable state for multi-turn handoff.
    Compatible with nasus_data_analyst, nasus_api_integrator,
    nasus_web_browser, and nasus_research_analyst session_context schemas.
    """
    session_id:      str                    = Field(..., description="UUID for this coding session")
    agent:           str                    = Field("nasus_code_engineer")
    version:         str                    = Field("1.0")
    project:         Optional[CodeProject]  = Field(None)
    turn_history:    List[TurnSummary]      = Field(default_factory=list)
    current_turn:    int                    = Field(1)
    escalation:      Optional[Dict[str, Any]] = Field(None,
                       description="Set if handoff to another Nasus module is needed")
    linked_sessions: List[str]              = Field(default_factory=list,
                       description="Session IDs from other Nasus modules this session depends on")


class NextStep(BaseModel):
    """A prioritized suggestion for what to build or fix next."""
    priority:    int = Field(..., description="1 = highest priority")
    action:      str = Field(..., description="Short imperative action label")
    description: str = Field(..., description="1-2 sentence explanation")
    agent_hint:  str = Field("nasus_code_engineer",
                             description="Which Nasus module should handle this step")


class RenderHints(BaseModel):
    """UI rendering hints for the Nasus frontend."""
    show_file_tree:   bool = Field(True)
    show_diff:        bool = Field(False)
    show_lint:        bool = Field(True)
    show_tests:       bool = Field(True)
    syntax_theme:     str  = Field("github-dark")
    primary_language: str  = Field("python")


class CodeEngineMeta(BaseModel):
    """Metadata about this code engineering run."""
    request_summary: str       = Field(..., description="One-sentence user request")
    mode:            Literal["greenfield", "refactor", "fix", "extend", "explain"] = Field(...)
    languages_used:  List[str] = Field(default_factory=list)
    files_produced:  int       = Field(0)
    total_lines:     int       = Field(0)
    lint_passed:     bool      = Field(True)
    tests_passed:    bool      = Field(True)
    confidence:      float     = Field(1.0, ge=0.0, le=1.0,
                                       description="Agent confidence in output quality")
    generated_at:    str       = Field(default_factory=lambda: datetime.utcnow().isoformat())
    render_hints:    RenderHints = Field(default_factory=RenderHints)


class CodeEngineOutput(BaseModel):
    """
    Top-level output schema for Nasus Code Engineer.
    Returned on every build() and refine() call.
    """
    summary:               str              = Field(..., description="2-3 sentence plain English summary")
    project:               CodeProject      = Field(..., description="Full project snapshot")
    lint:                  LintResult       = Field(..., description="Lint results")
    tests:                 TestResult       = Field(..., description="Test results")
    suggested_next_steps:  List[NextStep]   = Field(..., description="Prioritized next actions")
    session_context:       SessionContext   = Field(..., description="Serializable session for handoff")
    meta:                  CodeEngineMeta   = Field(..., description="Run metadata + render hints")

# -----------------------------------------------------------------------------
# ARTIFACT 4 — NASUS CODE ENGINEER CLASS
# -----------------------------------------------------------------------------


class NasusCodeEngineer:
    """
    Drop-in Code Engineer sub-agent for the Nasus orchestration layer.

    Usage:
        engineer = NasusCodeEngineer()
        result   = engineer.build("Build a Python CLI tool that fetches weather data")
        refined  = engineer.refine("Add unit tests", previous_output=result)
        print(engineer.export_markdown(result))
    """

    def __init__(self, session_id: Optional[str] = None):
        self.session_id    = session_id or str(uuid.uuid4())
        self.turn_count    = 0
        self.turn_history: List[TurnSummary] = []
        self._project: Optional[CodeProject] = None

    # ------------------------------------------------------------------
    # PUBLIC API
    # ------------------------------------------------------------------

    def build(self, request: str, mode: str = 'greenfield') -> CodeEngineOutput:
        """
        Greenfield build or refactor from a natural-language request.
        In production: this calls the LLM with SYSTEM_PROMPT + request.
        In this prototype: returns a rich structured demo output.
        """
        self.turn_count += 1
        project = self._generate_project(request, mode)
        lint    = self._run_lint(project)
        tests   = self._run_tests(project)
        self._project = project

        turn = TurnSummary(
            turn=self.turn_count,
            trigger_type='GREENFIELD' if mode == 'greenfield' else mode.upper(),
            files_affected=[f.path for f in project.files],
            summary=(
                f'Built {project.name}: {len(project.files)} files, '
                f'{project.total_lines} lines'
            )
        )
        self.turn_history.append(turn)

        return CodeEngineOutput(
            summary=(
                f"Built '{project.name}' with {len(project.files)} files "
                f'({project.total_lines} total lines). '
                f"Lint {'passed' if lint.passed else 'has errors'}. "
                f'Tests: {tests.passed} passed, {tests.failed} failed.'
            ),
            project=project,
            lint=lint,
            tests=tests,
            suggested_next_steps=self._suggest_next_steps(project, lint, tests),
            session_context=self._build_session_context(),
            meta=CodeEngineMeta(
                request_summary=request[:100],
                mode=mode,  # type: ignore[arg-type]
                languages_used=[lang.value for lang in project.languages],
                files_produced=len(project.files),
                total_lines=project.total_lines,
                lint_passed=lint.passed,
                tests_passed=(tests.failed == 0),
                confidence=0.95,
                render_hints=RenderHints(
                    show_file_tree=True,
                    show_diff=(mode != 'greenfield'),
                    show_lint=True,
                    show_tests=True,
                    primary_language=project.languages[0].value if project.languages else 'python'
                )
            )
        )

    def refine(self, follow_up: str, previous_output: CodeEngineOutput) -> CodeEngineOutput:
        """
        Handle a follow-up request against an existing CodeProject.
        Detects trigger type from follow_up text and applies the correct strategy.
        """
        trigger = self._detect_trigger(follow_up)
        self.turn_count += 1
        self._project = previous_output.project

        project = self._apply_refinement(follow_up, trigger, self._project)
        lint    = self._run_lint(project)
        tests   = self._run_tests(project)
        self._project = project

        turn = TurnSummary(
            turn=self.turn_count,
            trigger_type=trigger,
            files_affected=[f.path for f in project.files if not f.is_new],
            summary=f'{trigger}: {follow_up[:60]}'
        )
        self.turn_history.append(turn)

        mode_map: Dict[str, str] = {
            'EXTEND': 'extend', 'FIX': 'fix', 'REFACTOR': 'refactor',
            'EXPLAIN': 'explain', 'CLARIFY': 'extend', 'SWITCH_LANGUAGE': 'extend'
        }

        return CodeEngineOutput(
            summary=(
                f'[Turn {self.turn_count} - {trigger}] Applied "{follow_up[:50]}" '
                f"to '{project.name}'. "
                f"Lint {'passed' if lint.passed else 'has errors'}. "
                f'Tests: {tests.passed} passed.'
            ),
            project=project,
            lint=lint,
            tests=tests,
            suggested_next_steps=self._suggest_next_steps(project, lint, tests),
            session_context=self._build_session_context(),
            meta=CodeEngineMeta(
                request_summary=follow_up[:100],
                mode=mode_map.get(trigger, 'extend'),  # type: ignore[arg-type]
                languages_used=[lang.value for lang in project.languages],
                files_produced=len(project.files),
                total_lines=project.total_lines,
                lint_passed=lint.passed,
                tests_passed=(tests.failed == 0),
                confidence=0.93,
                render_hints=RenderHints(
                    show_file_tree=True,
                    show_diff=True,
                    show_lint=True,
                    show_tests=True,
                    primary_language=project.languages[0].value if project.languages else 'python'
                )
            )
        )

    def export_markdown(self, output: CodeEngineOutput) -> str:
        """Render a CodeEngineOutput as a human-readable Markdown report."""
        lines = [
            '# Nasus Code Engineer - Session Report',
            '',
            f'**Session ID:** `{output.session_context.session_id}`  ',
            f'**Turn:** {output.session_context.current_turn}  ',
            f'**Mode:** `{output.meta.mode}`  ',
            f'**Generated:** {output.meta.generated_at}',
            '',
            '---',
            '',
            '## Summary',
            '',
            output.summary,
            '',
            '## File Tree',
            '',
            '```',
            output.project.file_tree,
            '```',
            '',
            '## Files',
            '',
        ]

        for cf in output.project.files:
            label = 'NEW' if cf.is_new else 'MODIFIED'
            lines += [
                f'### `{cf.path}`  ({label} - {cf.line_count} lines)',
                '',
                f'```{cf.language.value}',
                cf.content,
                '```',
                '',
            ]

        passed_label = 'PASSED' if output.lint.passed else 'FAILED'
        lines += [
            '## Lint Results',
            '',
            f'- Files checked: **{output.lint.files_checked}**',
            f'- Errors: **{output.lint.errors}**',
            f'- Warnings: **{output.lint.warnings}**',
            f'- Status: **{passed_label}**',
            '',
        ]

        if output.lint.issues:
            lines.append('| File | Line | Severity | Code | Message |')
            lines.append('|------|------|----------|------|---------|')
            for issue in output.lint.issues:
                lines.append(
                    f'| `{issue.file}` | {issue.line} | {issue.severity.value} '
                    f'| {issue.code} | {issue.message} |'
                )
            lines.append('')

        lines += [
            '## Test Results',
            '',
            f'- Framework: **{output.tests.framework}**',
            f'- Passed: **{output.tests.passed}**',
            f'- Failed: **{output.tests.failed}**',
            f'- Coverage: **{output.tests.coverage_pct:.1f}%**',
            '',
        ]

        lines += ['## Suggested Next Steps', '']
        for step in output.suggested_next_steps:
            lines.append(
                f'{step.priority}. **{step.action}** - {step.description}  '
                f'*(agent: `{step.agent_hint}`)*'
            )
        lines.append('')

        lines += [
            '## Session Context',
            '',
            f'- Agent: `{output.session_context.agent}` v{output.session_context.version}',
            f'- Current turn: {output.session_context.current_turn}',
            f'- Turn history: {len(output.session_context.turn_history)} turn(s)',
            '',
            '**Turn History:**',
            '',
        ]
        for t in output.session_context.turn_history:
            lines.append(f'- Turn {t.turn} [{t.trigger_type}]: {t.summary}')

        return '\n'.join(lines)

    # ------------------------------------------------------------------
    # INTERNAL HELPERS
    # ------------------------------------------------------------------

    def _generate_project(self, request: str, mode: str) -> CodeProject:
        """Generate a demo CodeProject. In production: calls LLM."""
        main_content      = '"""\nweather_cli -- Nasus Code Engineer demo project\nFetches current weather data from Open-Meteo (free, no API key required).\n"""\nimport argparse\nimport json\nimport sys\nimport urllib.parse\nimport urllib.request\nimport urllib.error\nfrom typing import Optional\n\nGEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"\nWEATHER_URL = "https://api.open-meteo.com/v1/forecast"\n\n\ndef geocode(city: str) -> Optional[dict]:\n    """Return lat/lon for a city name, or None if not found."""\n    url = f"{GEOCODE_URL}?name={urllib.parse.quote(city)}&count=1"\n    try:\n        with urllib.request.urlopen(url, timeout=10) as resp:\n            data = json.loads(resp.read())\n            results = data.get("results")\n            if not results:\n                return None\n            return results[0]\n    except (urllib.error.URLError, json.JSONDecodeError) as exc:\n        print(f"[geocode error] {exc}", file=sys.stderr)\n        return None\n\n\ndef fetch_weather(lat: float, lon: float) -> Optional[dict]:\n    """Fetch current weather for coordinates."""\n    params = (\n        f"latitude={lat}&longitude={lon}"\n        "&current_weather=true"\n        "&hourly=temperature_2m,relativehumidity_2m,windspeed_10m"\n    )\n    url = f"{WEATHER_URL}?{params}"\n    try:\n        with urllib.request.urlopen(url, timeout=10) as resp:\n            return json.loads(resp.read())\n    except (urllib.error.URLError, json.JSONDecodeError) as exc:\n        print(f"[weather error] {exc}", file=sys.stderr)\n        return None\n\n\ndef format_weather(location: dict, weather: dict) -> str:\n    """Format weather data for CLI display."""\n    cw = weather.get("current_weather", {})\n    name    = location.get(\'name\', \'\')\n    country = location.get(\'country\', \'\')\n    temp    = cw.get(\'temperature\', \'N/A\')\n    wspeed  = cw.get(\'windspeed\', \'N/A\')\n    wdir    = cw.get(\'winddirection\', \'N/A\')\n    is_day  = \'Yes\' if cw.get(\'is_day\') else \'No\'\n    lines = [\n        f"Weather for {name}, {country}",\n        f"  Temperature : {temp} degC",\n        f"  Wind speed  : {wspeed} km/h",\n        f"  Wind dir    : {wdir} deg",\n        f"  Is day      : {is_day}",\n    ]\n    return "\\n".join(lines)\n\n\ndef main() -> int:\n    """CLI entry point."""\n    parser = argparse.ArgumentParser(description="Fetch current weather for a city.")\n    parser.add_argument("city", nargs="?", default="Athens",\n                        help="City name (default: Athens)")\n    parser.add_argument("--json", action="store_true", help="Output raw JSON")\n    args = parser.parse_args()\n\n    location = geocode(args.city)\n    if not location:\n        print(f"City not found: {args.city}", file=sys.stderr)\n        return 1\n\n    weather = fetch_weather(location["latitude"], location["longitude"])\n    if not weather:\n        print("Could not fetch weather data.", file=sys.stderr)\n        return 1\n\n    if args.json:\n        print(json.dumps(weather, indent=2))\n    else:\n        print(format_weather(location, weather))\n    return 0\n\n\nif __name__ == "__main__":\n    sys.exit(main())'
        test_content      = '"""\nUnit tests for weather_cli.\nUses mock HTTP responses -- no real network calls.\n"""\nimport json\nimport unittest\nfrom unittest.mock import patch\n\nimport main as weather_cli\n\nGEO_RESPONSE = json.dumps({\n    "results": [{\n        "name": "Athens", "country": "Greece",\n        "latitude": 37.9795, "longitude": 23.7162\n    }]\n}).encode()\n\nWEATHER_RESPONSE = json.dumps({\n    "current_weather": {\n        "temperature": 22.4,\n        "windspeed": 14.0,\n        "winddirection": 180,\n        "is_day": 1,\n        "weathercode": 0,\n        "time": "2025-01-01T12:00"\n    }\n}).encode()\n\n\nclass MockResponse:\n    def __init__(self, data: bytes):\n        self._data = data\n    def read(self):\n        return self._data\n    def __enter__(self):\n        return self\n    def __exit__(self, *args):\n        pass\n\n\nclass TestGeocode(unittest.TestCase):\n    @patch("urllib.request.urlopen", return_value=MockResponse(GEO_RESPONSE))\n    def test_geocode_success(self, _mock):\n        result = weather_cli.geocode("Athens")\n        self.assertIsNotNone(result)\n        self.assertEqual(result["name"], "Athens")\n\n    @patch("urllib.request.urlopen",\n           return_value=MockResponse(b\'{"results": []}\'))\n    def test_geocode_no_results(self, _mock):\n        result = weather_cli.geocode("Atlantis")\n        self.assertIsNone(result)\n\n\nclass TestFetchWeather(unittest.TestCase):\n    @patch("urllib.request.urlopen", return_value=MockResponse(WEATHER_RESPONSE))\n    def test_fetch_weather_success(self, _mock):\n        result = weather_cli.fetch_weather(37.97, 23.71)\n        self.assertIn("current_weather", result)\n        self.assertEqual(result["current_weather"]["temperature"], 22.4)\n\n\nclass TestFormatWeather(unittest.TestCase):\n    def test_format_output(self):\n        location = {"name": "Athens", "country": "Greece"}\n        weather  = {"current_weather": {\n            "temperature": 22.4, "windspeed": 14,\n            "winddirection": 180, "is_day": 1\n        }}\n        output = weather_cli.format_weather(location, weather)\n        self.assertIn("Athens", output)\n        self.assertIn("22.4", output)\n\n    def test_regression_missing_keys(self):\n        """Regression: format_weather must not crash on empty current_weather."""\n        location = {"name": "TestCity", "country": "TC"}\n        weather  = {"current_weather": {}}\n        output = weather_cli.format_weather(location, weather)\n        self.assertIn("TestCity", output)\n\n\nif __name__ == "__main__":\n    unittest.main()'
        reqs_content      = '# No third-party dependencies -- stdlib only\n'
        gitignore_content = '__pycache__/\n*.py[cod]\n*.egg-info/\n.env\n.venv/\ndist/\nbuild/\n.pytest_cache/\n.coverage\nhtmlcov/\n'
        readme_content    = '# weather_cli\n\nA minimal Python CLI tool that fetches current weather data for any city,\npowered by Open-Meteo (free, no API key required).\n\n## Usage\n\n    python main.py Athens\n    python main.py "New York" --json\n\n## Requirements\n\nPython 3.9+ (stdlib only)\n\n## Tests\n\n    python -m pytest test_main.py -v\n\n*Built by Nasus Code Engineer v1.0*\n'

        files = [
            CodeFile(path='main.py',          language=Language.PYTHON,
                     content=main_content,    line_count=main_content.count('\n'), is_new=True),
            CodeFile(path='test_main.py',     language=Language.PYTHON,
                     content=test_content,    line_count=test_content.count('\n'), is_new=True),
            CodeFile(path='requirements.txt', language=Language.OTHER,
                     content=reqs_content,    line_count=1, is_new=True),
            CodeFile(path='.gitignore',       language=Language.OTHER,
                     content=gitignore_content,
                     line_count=gitignore_content.count('\n'), is_new=True),
            CodeFile(path='README.md',        language=Language.MARKDOWN,
                     content=readme_content,  line_count=readme_content.count('\n'), is_new=True),
        ]

        total = sum(f.line_count for f in files)
        tree  = (
            'weather_cli/\n'
            '├── main.py\n'
            '├── test_main.py\n'
            '├── requirements.txt\n'
            '├── .gitignore\n'
            '└── README.md'
        )

        return CodeProject(
            name='weather_cli',
            entry_point='main.py',
            languages=[Language.PYTHON, Language.MARKDOWN],
            files=files,
            dependencies={},
            file_tree=tree,
            total_lines=total
        )

    def _apply_refinement(self, follow_up: str, trigger: str,
                          project: CodeProject) -> CodeProject:
        """Apply a refinement pass to the project. Demo: adds a CHANGELOG.md."""
        changelog = CodeFile(
            path='CHANGELOG.md',
            language=Language.MARKDOWN,
            content='# Changelog\n\n## [Unreleased]\n\n### Changed\n- [' + trigger + '] ' + follow_up[:80] + '\n',
            line_count=6,
            is_new=True
        )
        new_files = [f for f in project.files if f.path != 'CHANGELOG.md'] + [changelog]
        return CodeProject(
            name=project.name,
            entry_point=project.entry_point,
            languages=project.languages,
            files=new_files,
            dependencies=project.dependencies,
            file_tree=project.file_tree + '\n└── CHANGELOG.md',
            total_lines=sum(f.line_count for f in new_files)
        )

    def _run_lint(self, project: CodeProject) -> LintResult:
        """
        Lint Python files using ast.parse for syntax validation.
        In production: calls pylint/ruff via subprocess.
        """
        issues: List[LintIssue] = []
        py_files = [f for f in project.files if f.language == Language.PYTHON]
        for cf in py_files:
            try:
                ast.parse(cf.content)
            except SyntaxError as exc:
                issues.append(LintIssue(
                    file=cf.path, line=exc.lineno or 0, col=exc.offset or 0,
                    code='E999', message=str(exc), severity=LintSeverity.ERROR
                ))
        return LintResult(
            files_checked=len(py_files),
            errors=sum(1 for i in issues if i.severity == LintSeverity.ERROR),
            warnings=sum(1 for i in issues if i.severity == LintSeverity.WARNING),
            issues=issues,
            passed=all(i.severity != LintSeverity.ERROR for i in issues)
        )

    def _run_tests(self, project: CodeProject) -> TestResult:
        """
        Simulate test results. In production: runs pytest via subprocess.
        """
        test_files = [f for f in project.files if f.path.startswith('test_')]
        if not test_files:
            return TestResult(
                framework='pytest', passed=0, failed=0,
                coverage_pct=0.0, stdout='No test files found.', exit_code=0
            )
        cases = [
            TestCase(name='test_geocode_success',         status='passed', duration_ms=12.3),
            TestCase(name='test_geocode_no_results',      status='passed', duration_ms=8.1),
            TestCase(name='test_fetch_weather_success',   status='passed', duration_ms=9.7),
            TestCase(name='test_format_output',           status='passed', duration_ms=1.2),
            TestCase(name='test_regression_missing_keys', status='passed', duration_ms=0.8),
        ]
        return TestResult(
            framework='pytest',
            passed=len(cases),
            failed=0,
            skipped=0,
            errors=0,
            coverage_pct=87.4,
            cases=cases,
            stdout=(
                f'======= {len(cases)} passed in 0.32s =======\n'
                'Coverage: 87.4%'
            ),
            exit_code=0
        )

    def _suggest_next_steps(self, project: CodeProject,
                             lint: LintResult, tests: TestResult) -> List[NextStep]:
        steps = [
            NextStep(priority=1, action='Add CI/CD pipeline',
                     description='Add a GitHub Actions workflow to run tests on every push.',
                     agent_hint='nasus_code_engineer'),
            NextStep(priority=2, action='Add --forecast flag',
                     description='Extend main.py to show a 7-day forecast using hourly data.',
                     agent_hint='nasus_code_engineer'),
            NextStep(priority=3, action='Fetch API docs',
                     description='Use nasus_web_browser to pull the full Open-Meteo API reference.',
                     agent_hint='nasus_web_browser'),
            NextStep(priority=4, action='Analyze historical weather data',
                     description='Pull hourly data into a CSV and visualize with nasus_data_analyst.',
                     agent_hint='nasus_data_analyst'),
            NextStep(priority=5, action='Wrap as REST API',
                     description='Use nasus_api_integrator to scaffold a FastAPI wrapper for weather_cli.',
                     agent_hint='nasus_api_integrator'),
        ]
        if not lint.passed:
            steps.insert(0, NextStep(
                priority=0, action='Fix lint errors',
                description=f'Resolve {lint.errors} lint error(s) before shipping.',
                agent_hint='nasus_code_engineer'
            ))
        return steps

    def _detect_trigger(self, text: str) -> str:
        text_lower = text.lower()
        for trigger, cfg in REFINE_PATTERN['trigger_types'].items():
            if any(s in text_lower for s in cfg['signals']):
                return trigger
        return 'EXTEND'

    def _build_session_context(self) -> SessionContext:
        return SessionContext(
            session_id=self.session_id,
            agent='nasus_code_engineer',
            version='1.0',
            project=self._project,
            turn_history=self.turn_history.copy(),
            current_turn=self.turn_count,
            escalation=None,
            linked_sessions=[]
        )

# -----------------------------------------------------------------------------
# ARTIFACT 5 — LIVE DEMO
# -----------------------------------------------------------------------------


def run_demo() -> None:
    """
    3-turn demo simulating a full coding session:
      Turn 1 -- Greenfield build of weather_cli
      Turn 2 -- Add CHANGELOG via refine()
      Turn 3 -- export_markdown() report
    Output is saved to JSON and Markdown.
    """
    import os

    print('=' * 70)
    print('NASUS CODE ENGINEER -- Demo Run')
    print('=' * 70)

    engineer = NasusCodeEngineer()

    # --- Turn 1: Build ---
    print('\n[Turn 1] Building weather_cli...')
    result1 = engineer.build(
        'Build a Python CLI tool that fetches current weather data for any city',
        mode='greenfield'
    )
    print(f'  Project : {result1.project.name}')
    print(f'  Files   : {len(result1.project.files)}')
    print(f'  Lines   : {result1.project.total_lines}')
    lint_status = 'PASSED' if result1.lint.passed else 'FAILED'
    print(f'  Lint    : {lint_status}')
    print(f'  Tests   : {result1.tests.passed} passed / {result1.tests.failed} failed')
    print(f'  Coverage: {result1.tests.coverage_pct}%')
    print(f'\n  File tree:\n{result1.project.file_tree}')

    # --- Turn 2: Refine ---
    print('\n[Turn 2] Adding changelog via refine()...')
    result2 = engineer.refine('Add a CHANGELOG.md file', previous_output=result1)
    last_turn = result2.session_context.turn_history[-1]
    print(f'  Trigger : {last_turn.trigger_type}')
    print(f'  Files   : {len(result2.project.files)}')
    print(f'  Summary : {result2.summary}')

    # --- Turn 3: Escalation hint ---
    print('\n[Turn 3] Checking escalation for out-of-scope request...')
    trigger3 = engineer._detect_trigger('research the best weather APIs available')
    print(f'  Trigger detected: {trigger3}')
    print('  (In production: would escalate to nasus_web_browser)')

    # --- Save JSON ---
    output_path = '/home/user/files/code/nasus_code_engineer_demo.json'
    all_turns = {
        'session_id': engineer.session_id,
        'total_turns': engineer.turn_count,
        'turn_1': json.loads(result1.model_dump_json()),
        'turn_2': json.loads(result2.model_dump_json()),
    }
    os.makedirs('/home/user/files/code', exist_ok=True)
    with open(output_path, 'w', encoding='utf-8') as fh:
        json.dump(all_turns, fh, indent=2)
    print(f'\n[Output] JSON saved to {output_path}')

    # --- Save Markdown ---
    md_path = '/home/user/files/code/nasus_code_engineer_demo.md'
    md_content = '# Nasus Code Engineer -- 3-Turn Demo Session\n\n'
    md_content += '## Turn 1 -- Greenfield Build\n\n'
    md_content += engineer.export_markdown(result1)
    md_content += '\n\n---\n\n'
    md_content += '## Turn 2 -- Refine: Add CHANGELOG\n\n'
    md_content += engineer.export_markdown(result2)
    with open(md_path, 'w', encoding='utf-8') as fh:
        fh.write(md_content)
    print(f'[Output] Markdown saved to {md_path}')

    print('\n' + '=' * 70)
    print('Demo complete. Exit 0.')
    print('=' * 70)


if __name__ == '__main__':
    run_demo()
