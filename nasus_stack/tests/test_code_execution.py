"""
Tests for M05 Code Engineer — CodeTask.EXECUTE (subprocess execution).
"""
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))

from nasus_code_engineer import execute_code, route_envelope
from nasus_code_engineer_schema import (
    CodeError,
    CodeTask,
    ExecutionResult,
    Language,
    Spec,
)
from nasus_module_registry import ModuleID, NasusEnvelope


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _exec_spec(code: str, language: Language = Language.PYTHON) -> Spec:
    return Spec(
        task=CodeTask.EXECUTE,
        language=language,
        description="execute test",
        context_code=code,
    )


# ---------------------------------------------------------------------------
# Tests
# ---------------------------------------------------------------------------

def test_execute_hello_world():
    result = execute_code(_exec_spec('print("hello world")'))
    assert isinstance(result, ExecutionResult)
    assert result.exit_code == 0
    assert "hello world" in result.stdout
    assert result.timed_out is False
    assert result.duration_ms >= 0


def test_execute_runtime_error():
    result = execute_code(_exec_spec("raise ValueError('boom')"))
    assert isinstance(result, ExecutionResult)
    assert result.exit_code != 0
    assert "ValueError" in result.stderr
    assert result.timed_out is False


def test_execute_timeout(monkeypatch):
    import nasus_code_engineer as m05
    monkeypatch.setattr(m05, "_EXECUTE_TIMEOUT_S", 1)
    result = execute_code(_exec_spec("import time; time.sleep(5)"))
    assert isinstance(result, ExecutionResult)
    assert result.timed_out is True
    assert result.exit_code == -1
    assert "timed out" in result.stderr.lower()


def test_execute_non_python_rejected():
    result = execute_code(_exec_spec("console.log('hi')", language=Language.TYPESCRIPT))
    assert isinstance(result, CodeError)
    assert result.error_code == "UNSUPPORTED_LANGUAGE"


def test_execute_empty_code_rejected():
    result = execute_code(_exec_spec("   "))
    assert isinstance(result, CodeError)
    assert result.error_code == "MISSING_CONTEXT"


def test_route_envelope_execute():
    env = NasusEnvelope(
        module_id=ModuleID.M05,
        payload={
            "task": "execute",
            "language": "python",
            "description": "end-to-end execute",
            "context_code": "x = 6 * 7\nprint(x)",
        },
    )
    result_env = route_envelope(env)
    assert result_env.status.value == "DONE"
    payload = result_env.payload
    assert payload["exit_code"] == 0
    assert "42" in payload["stdout"]
    assert payload["timed_out"] is False
