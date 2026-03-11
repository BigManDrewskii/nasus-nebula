"""
nasus_code_engineer_schema.py
Nasus M05 -- Code Engineer
Schema: enums, dataclasses, validation
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import List

# ---------------------------------------------------------------------------
# Registry imports
# ---------------------------------------------------------------------------
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus  # noqa: F401

# ---------------------------------------------------------------------------
# Module identity
# ---------------------------------------------------------------------------
MODULE_ID: str = "M05"
MODULE_NAME: str = "Code Engineer"
CAPABILITIES: List[str] = [
    "Python codegen",
    "JS codegen",
    "TS codegen",
    "debugging",
    "refactoring",
]


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class Language(str, Enum):
    """Supported programming / markup languages."""
    PYTHON      = "python"
    JAVASCRIPT  = "javascript"
    TYPESCRIPT  = "typescript"
    BASH        = "bash"
    SQL         = "sql"
    HTML_CSS    = "html_css"
    RUST        = "rust"
    GO          = "go"


class CodeTask(str, Enum):
    """The type of engineering task to perform."""
    GENERATE  = "generate"
    DEBUG     = "debug"
    REFACTOR  = "refactor"
    EXPLAIN   = "explain"
    TEST      = "test"
    REVIEW    = "review"
    CONVERT   = "convert"


class CodeStyle(str, Enum):
    """Output style directive."""
    CLEAN        = "clean"        # idiomatic, readable, no noise
    MINIMAL      = "minimal"      # shortest correct implementation
    DOCUMENTED   = "documented"   # full docstrings / JSDoc
    VERBOSE      = "verbose"      # inline comments everywhere
    PRODUCTION   = "production"   # error handling, logging, strict typing


class CodeStatus(str, Enum):
    """Lifecycle status of a code operation."""
    PENDING    = "pending"
    THINKING   = "thinking"
    GENERATING = "generating"
    REVIEWING  = "reviewing"
    DONE       = "done"
    FAILED     = "failed"


# ---------------------------------------------------------------------------
# Input dataclass
# ---------------------------------------------------------------------------

@dataclass
class Spec:
    """
    Describes a code engineering task.

    Fields
    ------
    task : CodeTask
        What to do -- generate, debug, refactor, etc.
    language : Language
        Target programming language.
    description : str
        Natural-language description of what is needed.
    context_code : str
        Existing code to modify, debug, or review. Empty string if none.
    requirements : List[str]
        Bullet-point requirements the output must satisfy.
    style : CodeStyle
        Output style directive (default CLEAN).
    max_lines : int
        Soft upper bound on total generated lines (default 200).
    include_tests : bool
        Whether to generate accompanying test files.
    include_docs : bool
        Whether to include docstrings / header comments.
    """
    task:          CodeTask
    language:      Language
    description:   str
    context_code:  str       = ""
    requirements:  List[str] = field(default_factory=list)
    style:         CodeStyle = CodeStyle.CLEAN
    max_lines:     int       = 200
    include_tests: bool      = False
    include_docs:  bool      = True


# ---------------------------------------------------------------------------
# Output dataclasses
# ---------------------------------------------------------------------------

@dataclass
class CodeBlock:
    """
    A single named file of generated code.

    Fields
    ------
    language : Language
        Language of this block.
    code : str
        The actual source code.
    filename : str
        Suggested filename (e.g. api_client.py).
    description : str
        One-line purpose of this file.
    line_count : int
        Number of non-empty lines in code.
    """
    language:    Language
    code:        str
    filename:    str
    description: str
    line_count:  int

    def to_dict(self) -> dict:
        return {
            "language":    self.language.value,
            "code":        self.code,
            "filename":    self.filename,
            "description": self.description,
            "line_count":  self.line_count,
        }


@dataclass
class CodeResult:
    """
    Successful result of a code engineering operation.

    Fields
    ------
    spec_summary : str
        One-sentence restatement of the requested task.
    blocks : List[CodeBlock]
        Generated code files (always at least one).
    explanation : str
        Human-readable explanation of the approach taken.
    tests : List[CodeBlock]
        Optional test files (populated when include_tests=True).
    review_notes : List[str]
        Observations or improvement suggestions (used by review/debug).
    status : CodeStatus
        Final status, normally DONE.
    """
    spec_summary:  str
    blocks:        List[CodeBlock]
    explanation:   str
    tests:         List[CodeBlock] = field(default_factory=list)
    review_notes:  List[str]       = field(default_factory=list)
    status:        CodeStatus      = CodeStatus.DONE

    def to_dict(self) -> dict:
        return {
            "spec_summary":  self.spec_summary,
            "blocks":        [b.to_dict() for b in self.blocks],
            "explanation":   self.explanation,
            "tests":         [t.to_dict() for t in self.tests],
            "review_notes":  self.review_notes,
            "status":        self.status.value,
        }


@dataclass
class CodeError:
    """
    Failed result -- returned when the spec cannot be fulfilled.

    Fields
    ------
    description : str
        What went wrong.
    error_code : str
        Short machine-readable code (e.g. LANG_TASK_MISMATCH).
    message : str
        Detailed explanation / remediation hint.
    """
    description: str
    error_code:  str
    message:     str

    def to_dict(self) -> dict:
        return {
            "description": self.description,
            "error_code":  self.error_code,
            "message":     self.message,
        }


# ---------------------------------------------------------------------------
# Validation helper
# ---------------------------------------------------------------------------

def validate_code_output(result: CodeResult) -> List[str]:
    """
    Post-generation quality gate.

    Parameters
    ----------
    result : CodeResult
        The result produced by the runtime.

    Returns
    -------
    List[str]
        Validation failure messages. Empty list means PASS.
    """
    issues: List[str] = []

    # RT-03 -- every block must have a filename
    for i, block in enumerate(result.blocks):
        if not block.filename or block.filename.strip() == "":
            issues.append(f"RT-03: CodeBlock[{i}] is missing a filename.")

    # RT-06 -- no hardcoded secrets or dangerous patterns
    danger_patterns = [
        "os.system(",
        "eval(",
        "exec(",
        "subprocess.call(",
        "subprocess.Popen(",
        "__import__(",
        "SECRET_KEY =",
        "PASSWORD =",
        "API_KEY =",
        "private_key =",
    ]
    for block in result.blocks:
        for pat in danger_patterns:
            if pat.lower() in block.code.lower():
                issues.append(
                    f"RT-06: Dangerous pattern '{pat}' found in {block.filename}."
                )

    # RT-07 -- hard cap of 500 lines per block
    for block in result.blocks:
        if block.line_count > 500:
            issues.append(
                f"RT-07: {block.filename} has {block.line_count} lines, "
                f"exceeding the absolute maximum of 500."
            )

    # RT-02 -- basic syntax heuristic for Python (balanced parens/braces)
    for block in result.blocks:
        if block.language == Language.PYTHON:
            open_parens  = block.code.count("(")
            close_parens = block.code.count(")")
            open_braces  = block.code.count("{")
            close_braces = block.code.count("}")
            if open_parens != close_parens:
                issues.append(
                    f"RT-02: Unbalanced parentheses in {block.filename} "
                    f"({open_parens} open vs {close_parens} close)."
                )
            if open_braces != close_braces:
                issues.append(
                    f"RT-02: Unbalanced braces in {block.filename} "
                    f"({open_braces} open vs {close_braces} close)."
                )

    return issues
