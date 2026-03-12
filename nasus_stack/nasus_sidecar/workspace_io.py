"""
nasus_sidecar/workspace_io.py
==============================
Filesystem persistence for session artifacts.

All module outputs are written to:
  ~/.nasus/workspaces/{session_id}/{filename}

Safe by default: filenames are sanitised, path traversal rejected.
"""

from __future__ import annotations

import json
import re
import unicodedata
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, List, Optional


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_UNSAFE_RE = re.compile(r"[^\w\s.\-]", re.UNICODE)


def _safe_filename(name: str) -> str:
    """
    Normalise to ASCII, strip characters outside [a-zA-Z0-9 ._-], collapse
    spaces to underscores, enforce a 128-char cap.
    """
    name = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode()
    name = _UNSAFE_RE.sub("", name).strip().replace(" ", "_")
    return name[:128] or "artifact"


def _guard(filename: str) -> None:
    """Raise ValueError if filename contains path traversal sequences."""
    parts = Path(filename).parts
    if any(p == ".." for p in parts):
        raise ValueError(f"Path traversal rejected: {filename!r}")


# ---------------------------------------------------------------------------
# WorkspaceIO
# ---------------------------------------------------------------------------

class WorkspaceIO:
    """
    Filesystem-backed artifact store.

    Usage
    -----
    workspace = WorkspaceIO()                         # default ~/.nasus/workspaces
    workspace = WorkspaceIO(base="/tmp/test_ws")      # override for tests
    path = workspace.save("sess_abc", "output.md", "# Hello")
    text = workspace.load("sess_abc", "output.md")
    files = workspace.list("sess_abc")
    workspace.delete("sess_abc", "output.md")
    """

    def __init__(self, base: Optional[str] = None) -> None:
        self._base = Path(base) if base else Path.home() / ".nasus" / "workspaces"

    # ── Internal ─────────────────────────────────────────────────────────────

    def session_path(self, session_id: str) -> Path:
        """Return (and create) the directory for a session."""
        p = self._base / session_id
        p.mkdir(parents=True, exist_ok=True)
        return p

    # ── Public API ────────────────────────────────────────────────────────────

    def save(self, session_id: str, filename: str, content: Any) -> Path:
        """
        Write *content* to workspaces/{session_id}/{filename}.

        *content* may be:
          - str  → written as-is (UTF-8)
          - bytes → written as binary
          - dict/list → JSON-serialised

        Returns the absolute Path of the written file.
        """
        _guard(filename)
        filename = _safe_filename(filename)
        dest = self.session_path(session_id) / filename

        if isinstance(content, (dict, list)):
            dest.write_text(json.dumps(content, indent=2, default=str), encoding="utf-8")
        elif isinstance(content, bytes):
            dest.write_bytes(content)
        else:
            dest.write_text(str(content), encoding="utf-8")

        return dest

    def load(self, session_id: str, filename: str) -> str:
        """Read and return file content as a string. Raises FileNotFoundError if missing."""
        _guard(filename)
        filename = _safe_filename(filename)
        path = self.session_path(session_id) / filename
        return path.read_text(encoding="utf-8")

    def list(self, session_id: str) -> List[dict]:
        """
        Return metadata for all files in the session workspace.
        Each entry: {name, size, created_at (ISO)}
        """
        sp = self.session_path(session_id)
        files = []
        for f in sorted(sp.iterdir()):
            if f.is_file():
                stat = f.stat()
                files.append({
                    "name": f.name,
                    "size": stat.st_size,
                    "created_at": datetime.fromtimestamp(
                        stat.st_ctime, tz=timezone.utc
                    ).isoformat(),
                })
        return files

    def delete(self, session_id: str, filename: str) -> bool:
        """Delete a single artifact. Returns True if deleted, False if not found."""
        _guard(filename)
        filename = _safe_filename(filename)
        path = self.session_path(session_id) / filename
        if path.exists():
            path.unlink()
            return True
        return False

    def delete_session(self, session_id: str) -> int:
        """Delete all artifacts for a session. Returns count of files deleted."""
        sp = self._base / session_id
        if not sp.exists():
            return 0
        count = 0
        for f in sp.iterdir():
            if f.is_file():
                f.unlink()
                count += 1
        try:
            sp.rmdir()
        except OSError:
            pass  # non-empty (subdirs) — leave the directory
        return count


# ---------------------------------------------------------------------------
# Module-level singleton (shared across the sidecar process)
# ---------------------------------------------------------------------------

_workspace_io: Optional[WorkspaceIO] = None


def get_workspace_io() -> WorkspaceIO:
    global _workspace_io
    if _workspace_io is None:
        _workspace_io = WorkspaceIO()
    return _workspace_io


def init_workspace_io(base: Optional[str] = None) -> WorkspaceIO:
    """Called from lifespan to configure the base path before any requests arrive."""
    global _workspace_io
    _workspace_io = WorkspaceIO(base=base)
    return _workspace_io
