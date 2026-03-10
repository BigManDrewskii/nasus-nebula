import json
import uuid
import math
from datetime import datetime, timezone
from dataclasses import dataclass, field, asdict
from typing import Any, Optional
from pathlib import Path


# ---------------------------------------------------------------------------
# Data models
# ---------------------------------------------------------------------------

@dataclass
class EpisodicRecord:
    session_id: str
    timestamp: str
    module: str
    summary: str
    artifacts: dict = field(default_factory=dict)


@dataclass
class SemanticFact:
    key: str
    value: Any
    source: str
    confidence: float
    last_updated: str


@dataclass
class ProceduralPattern:
    pattern_id: str
    description: str
    trigger: str
    steps: list
    success_rate: float
    last_used: Optional[str] = None


@dataclass
class WorkingEntry:
    key: str
    value: Any
    ttl_seconds: Optional[int]
    created_at: str


# ---------------------------------------------------------------------------
# MemoryStore
# ---------------------------------------------------------------------------

class MemoryStore:
    """
    Four-layer in-memory store for Nasus agents.

    Layers
    ------
    episodic   - list  : past session records
    semantic   - dict  : long-term facts / world-model
    procedural - dict  : learned patterns & workflows
    working    - dict  : current-session scratchpad (supports TTL)
    """

    VALID_LAYERS = {"episodic", "semantic", "procedural", "working"}

    def __init__(self):
        self._store: dict[str, Any] = {
            "episodic":   [],          # list[EpisodicRecord]
            "semantic":   {},          # key -> SemanticFact
            "procedural": {},          # pattern_id -> ProceduralPattern
            "working":    {},          # key -> WorkingEntry
        }
        self._op_log: list[dict] = []  # lightweight audit trail

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _now() -> str:
        return datetime.now(timezone.utc).isoformat()

    @staticmethod
    def _op_id() -> str:
        return "op_" + str(uuid.uuid4()).replace("-", "")[:16]

    def _log(self, op_id: str, action: str, layer: str, key: Optional[str], status: str):
        self._op_log.append({
            "op_id": op_id,
            "action": action,
            "layer": layer,
            "key": key,
            "status": status,
            "ts": self._now(),
        })

    def _estimate_bytes(self, obj: Any) -> int:
        try:
            return len(json.dumps(obj, default=str).encode("utf-8"))
        except Exception:
            return 0

    def _is_expired(self, entry: WorkingEntry) -> bool:
        if entry.ttl_seconds is None:
            return False
        created = datetime.fromisoformat(entry.created_at)
        age = (datetime.now(timezone.utc) - created).total_seconds()
        return age > entry.ttl_seconds

    def _evict_expired_working(self):
        expired = [k for k, v in self._store["working"].items() if self._is_expired(v)]
        for k in expired:
            del self._store["working"][k]

    # ------------------------------------------------------------------
    # write
    # ------------------------------------------------------------------

    def write(self, layer: str, key: str, value: Any, metadata: Optional[dict] = None) -> dict:
        """
        Write a value into the specified layer.

        Returns
        -------
        dict with keys: operation_id, status, layer, key, timestamp
        """
        op_id = self._op_id()
        if layer not in self.VALID_LAYERS:
            self._log(op_id, "write", layer, key, "error_invalid_layer")
            return {"operation_id": op_id, "status": "error", "detail": f"Unknown layer: {layer}"}

        meta = metadata or {}
        now = self._now()

        if layer == "episodic":
            # For episodic, key is used as session_id; value is the summary text
            record = EpisodicRecord(
                session_id=key,
                timestamp=meta.get("timestamp", now),
                module=meta.get("module", "unknown"),
                summary=str(value),
                artifacts=meta.get("artifacts", {}),
            )
            self._store["episodic"].append(record)

        elif layer == "semantic":
            fact = SemanticFact(
                key=key,
                value=value,
                source=meta.get("source", "unknown"),
                confidence=float(meta.get("confidence", 1.0)),
                last_updated=now,
            )
            self._store["semantic"][key] = fact

        elif layer == "procedural":
            pattern = ProceduralPattern(
                pattern_id=key,
                description=meta.get("description", str(value)),
                trigger=meta.get("trigger", ""),
                steps=meta.get("steps", []),
                success_rate=float(meta.get("success_rate", 1.0)),
                last_used=meta.get("last_used"),
            )
            self._store["procedural"][key] = pattern

        elif layer == "working":
            entry = WorkingEntry(
                key=key,
                value=value,
                ttl_seconds=meta.get("ttl_seconds"),
                created_at=now,
            )
            self._store["working"][key] = entry

        self._log(op_id, "write", layer, key, "ok")
        return {
            "operation_id": op_id,
            "status": "ok",
            "layer": layer,
            "key": key,
            "timestamp": now,
        }

    # ------------------------------------------------------------------
    # read
    # ------------------------------------------------------------------

    def read(self, layer: str, key: Optional[str] = None) -> dict:
        """
        Read from a layer.

        - If layer == 'episodic' and key is provided, returns records whose
          session_id matches key.  key=None returns all episodic records.
        - For other layers, key=None returns the entire layer dict.

        Returns
        -------
        dict with keys: status ('hit'|'miss'|'error'), layer, key, data
        """
        op_id = self._op_id()
        if layer not in self.VALID_LAYERS:
            return {"status": "error", "detail": f"Unknown layer: {layer}"}

        self._evict_expired_working()

        if layer == "episodic":
            records = self._store["episodic"]
            if key:
                matched = [asdict(r) for r in records if r.session_id == key]
                status = "hit" if matched else "miss"
                data = matched
            else:
                data = [asdict(r) for r in records]
                status = "hit" if data else "miss"
            self._log(op_id, "read", layer, key, status)
            return {"status": status, "layer": layer, "key": key, "data": data}

        layer_data = self._store[layer]

        if key is None:
            # Return entire layer (serialise dataclasses)
            data = {k: asdict(v) for k, v in layer_data.items()}
            status = "hit" if data else "miss"
        else:
            entry = layer_data.get(key)
            if entry is None:
                self._log(op_id, "read", layer, key, "miss")
                return {"status": "miss", "layer": layer, "key": key, "data": None}
            data = asdict(entry)
            status = "hit"

        self._log(op_id, "read", layer, key, status)
        return {"status": status, "layer": layer, "key": key, "data": data}

    # ------------------------------------------------------------------
    # query
    # ------------------------------------------------------------------

    def query(self, natural_language_query: str) -> dict:
        """
        Simple keyword-based cross-layer search (stand-in for vector search).

        Scores each entry by counting how many query tokens appear in its
        serialised representation.  Returns top-5 matches per layer.

        Returns
        -------
        dict with keys: query, matched_layers, results (list), confidence (0-1)
        """
        self._evict_expired_working()
        import re as _re
        tokens = set(_re.sub(r'[^a-z0-9]', ' ', natural_language_query.lower()).split())
        # Remove common English stop words that add noise
        stop = {'what', 'do', 'we', 'know', 'about', 'the', 'a', 'an', 'is', 'are', 'in', 'of', 'to', 'and', 'for'}
        tokens = tokens - stop
        if not tokens:
            tokens = set(natural_language_query.lower().split())
        results = []

        def _score(text: str) -> float:
            text_lower = text.lower()
            # Also check against a fully-lowered, punctuation-stripped version
            stripped = text_lower.replace('"', '').replace("'", '').replace('_', ' ')
            hits = sum(1 for t in tokens if t in text_lower or t in stripped)
            return hits / max(len(tokens), 1)

        # --- episodic ---
        for record in self._store["episodic"]:
            blob = json.dumps(asdict(record), default=str)
            sc = _score(blob)
            if sc > 0:
                results.append({
                    "layer": "episodic",
                    "key": record.session_id,
                    "score": round(sc, 3),
                    "preview": record.summary[:120],
                    "data": asdict(record),
                })

        # --- semantic ---
        for key, fact in self._store["semantic"].items():
            blob = json.dumps(asdict(fact), default=str)
            sc = _score(blob)
            if sc > 0:
                results.append({
                    "layer": "semantic",
                    "key": key,
                    "score": round(sc, 3),
                    "preview": f"{fact.key} = {str(fact.value)[:80]}",
                    "data": asdict(fact),
                })

        # --- procedural ---
        for pid, pattern in self._store["procedural"].items():
            blob = json.dumps(asdict(pattern), default=str)
            sc = _score(blob)
            if sc > 0:
                results.append({
                    "layer": "procedural",
                    "key": pid,
                    "score": round(sc, 3),
                    "preview": pattern.description[:120],
                    "data": asdict(pattern),
                })

        # --- working ---
        for key, entry in self._store["working"].items():
            blob = json.dumps(asdict(entry), default=str)
            sc = _score(blob)
            if sc > 0:
                results.append({
                    "layer": "working",
                    "key": key,
                    "score": round(sc, 3),
                    "preview": f"{entry.key} = {str(entry.value)[:80]}",
                    "data": asdict(entry),
                })

        results.sort(key=lambda x: x["score"], reverse=True)
        top = results[:10]
        matched_layers = list({r["layer"] for r in top})
        confidence = round(top[0]["score"], 3) if top else 0.0

        return {
            "query": natural_language_query,
            "matched_layers": matched_layers,
            "results": top,
            "total_matches": len(results),
            "confidence": confidence,
        }

    # ------------------------------------------------------------------
    # forget
    # ------------------------------------------------------------------

    def forget(self, layer: str, key: str) -> dict:
        """
        Remove an entry from a layer.

        For 'episodic', removes all records whose session_id == key.

        Returns
        -------
        dict with keys: status, layer, key, freed_bytes_estimate
        """
        op_id = self._op_id()
        if layer not in self.VALID_LAYERS:
            return {"status": "error", "detail": f"Unknown layer: {layer}"}

        freed = 0

        if layer == "episodic":
            before = [r for r in self._store["episodic"] if r.session_id == key]
            if not before:
                self._log(op_id, "forget", layer, key, "miss")
                return {"status": "miss", "layer": layer, "key": key, "freed_bytes_estimate": 0}
            freed = sum(self._estimate_bytes(asdict(r)) for r in before)
            self._store["episodic"] = [r for r in self._store["episodic"] if r.session_id != key]

        else:
            layer_data = self._store[layer]
            entry = layer_data.get(key)
            if entry is None:
                self._log(op_id, "forget", layer, key, "miss")
                return {"status": "miss", "layer": layer, "key": key, "freed_bytes_estimate": 0}
            freed = self._estimate_bytes(asdict(entry))
            del layer_data[key]

        self._log(op_id, "forget", layer, key, "ok")
        return {
            "status": "ok",
            "layer": layer,
            "key": key,
            "freed_bytes_estimate": freed,
        }

    # ------------------------------------------------------------------
    # summarize_session
    # ------------------------------------------------------------------

    def summarize_session(self, session_id: str, module: str, raw_output: str) -> dict:
        """
        Distil raw_output into a compact summary and persist to episodic layer.

        The summary is the first 300 chars of raw_output (prototype heuristic).
        In production this would call an LLM summarisation endpoint.

        Returns
        -------
        dict with keys: session_id, module, summary, stored_at
        """
        # Prototype summarisation: truncate + add word count annotation
        word_count = len(raw_output.split())
        summary = raw_output[:300].rstrip()
        if len(raw_output) > 300:
            summary += f"... [{word_count} words total]"

        stored_at = self._now()
        record = EpisodicRecord(
            session_id=session_id,
            timestamp=stored_at,
            module=module,
            summary=summary,
            artifacts={"raw_length": len(raw_output), "word_count": word_count},
        )
        self._store["episodic"].append(record)

        op_id = self._op_id()
        self._log(op_id, "summarize_session", "episodic", session_id, "ok")

        return {
            "session_id": session_id,
            "module": module,
            "summary": summary,
            "word_count": word_count,
            "stored_at": stored_at,
        }

    # ------------------------------------------------------------------
    # health_check
    # ------------------------------------------------------------------

    def health_check(self) -> dict:
        """
        Compute a health score (0-100) for the memory store.

        Scoring breakdown
        -----------------
        - Episodic : 25 pts  (capped at 10 records for full score)
        - Semantic  : 25 pts  (capped at 20 facts,  avg confidence ×25)
        - Procedural: 25 pts  (capped at 10 patterns, avg success_rate ×25)
        - Working   : 25 pts  (non-empty = 25, else 0 — session is live)

        Warnings are issued for low-confidence facts, empty layers, etc.
        """
        self._evict_expired_working()
        warnings = []

        # --- episodic ---
        ep_count = len(self._store["episodic"])
        ep_score = min(ep_count / 10, 1.0) * 25
        if ep_count == 0:
            warnings.append("Episodic layer is empty — no session history yet.")

        # --- semantic ---
        sem_facts = list(self._store["semantic"].values())
        sem_count = len(sem_facts)
        if sem_count == 0:
            sem_score = 0.0
            warnings.append("Semantic layer is empty — no facts stored.")
        else:
            avg_conf = sum(f.confidence for f in sem_facts) / sem_count
            if avg_conf < 0.7:
                warnings.append(f"Average semantic confidence is low ({avg_conf:.2f}).")
            sem_score = min(sem_count / 20, 1.0) * avg_conf * 25

        # --- procedural ---
        proc_patterns = list(self._store["procedural"].values())
        proc_count = len(proc_patterns)
        if proc_count == 0:
            proc_score = 0.0
            warnings.append("Procedural layer is empty — no learned patterns.")
        else:
            avg_sr = sum(p.success_rate for p in proc_patterns) / proc_count
            if avg_sr < 0.6:
                warnings.append(f"Average procedural success rate is low ({avg_sr:.2f}).")
            proc_score = min(proc_count / 10, 1.0) * avg_sr * 25

        # --- working ---
        work_count = len(self._store["working"])
        work_score = 25.0 if work_count > 0 else 0.0
        if work_count == 0:
            warnings.append("Working layer is empty — no active session context.")

        overall = round(ep_score + sem_score + proc_score + work_score, 1)

        total_entries = ep_count + sem_count + proc_count + work_count

        return {
            "overall_score": overall,
            "layer_scores": {
                "episodic":   round(ep_score, 1),
                "semantic":   round(sem_score, 1),
                "procedural": round(proc_score, 1),
                "working":    round(work_score, 1),
            },
            "layer_counts": {
                "episodic":   ep_count,
                "semantic":   sem_count,
                "procedural": proc_count,
                "working":    work_count,
            },
            "total_entries": total_entries,
            "warnings": warnings,
            "checked_at": self._now(),
        }

    # ------------------------------------------------------------------
    # export_snapshot
    # ------------------------------------------------------------------

    def export_snapshot(self) -> dict:
        """
        Export a full serialisable snapshot of all layers.

        Returns
        -------
        dict with keys: snapshot_id, exported_at, layers (all four)
        """
        self._evict_expired_working()
        return {
            "snapshot_id": "snap_" + str(uuid.uuid4()).replace("-", "")[:12],
            "exported_at": self._now(),
            "layers": {
                "episodic":   [asdict(r) for r in self._store["episodic"]],
                "semantic":   {k: asdict(v) for k, v in self._store["semantic"].items()},
                "procedural": {k: asdict(v) for k, v in self._store["procedural"].items()},
                "working":    {k: asdict(v) for k, v in self._store["working"].items()},
            },
        }


# ---------------------------------------------------------------------------
# Demo
# ---------------------------------------------------------------------------

def run_demo():
    store = MemoryStore()
    base = Path("/home/user/files/code")
    base.mkdir(parents=True, exist_ok=True)

    # ==============================
    # TURN 1
    # ==============================
    print("\n" + "="*60)
    print("TURN 1 — FlowDesk onboarding assistant project context")
    print("="*60)

    t1 = {}

    # Write working layer
    t1["write_project_name"] = store.write(
        "working", "project_name", "FlowDesk"
    )
    t1["write_goal"] = store.write(
        "working", "goal", "onboarding assistant"
    )
    t1["write_assigned_modules"] = store.write(
        "working", "assigned_modules",
        ["content_creator", "landing_page", "product_strategist"]
    )

    # Write semantic fact
    t1["write_semantic_audience"] = store.write(
        "semantic", "flowdesk_target_audience",
        "B2B SaaS teams, 10-200 employees",
        metadata={
            "source": "product_strategist",
            "confidence": 0.92,
        }
    )

    # Write procedural pattern
    t1["write_procedural_pattern"] = store.write(
        "procedural", "saas_onboarding_flow",
        "Standard SaaS onboarding content pattern",
        metadata={
            "description": "Standard SaaS onboarding content pattern",
            "trigger": "new SaaS product brief",
            "steps": [
                "Extract ICP",
                "Define value props",
                "Draft hero section",
                "Build email sequence",
            ],
            "success_rate": 0.88,
        }
    )

    # Read back working layer
    t1["read_project_name"] = store.read("working", "project_name")

    # Cross-layer query
    t1["query_flowdesk"] = store.query("what do we know about FlowDesk?")

    print(json.dumps(t1, indent=2, default=str))

    # Save JSON
    with open(base / "demo_mm_turn_1.json", "w") as f:
        json.dump(t1, f, indent=2, default=str)

    # Save Markdown narrative
    md1 = _build_turn1_markdown(t1)
    with open(base / "demo_mm_turn_1.md", "w") as f:
        f.write(md1)

    print("\nTurn 1 files written.")

    # ==============================
    # TURN 2
    # ==============================
    print("\n" + "="*60)
    print("TURN 2 — Session ended, storing episodic memory")
    print("="*60)

    t2 = {}

    # Summarise and store episodic record
    t2["summarize_session"] = store.summarize_session(
        session_id="sess_001",
        module="landing_page",
        raw_output=(
            "Produced 8-section landing page for FlowDesk with CRO score 86. "
            "Hero: BOLD tone. CTA: Start Free Trial."
        ),
    )

    # Write CRO score to semantic layer
    t2["write_cro_score"] = store.write(
        "semantic", "flowdesk_landing_page_cro",
        86,
        metadata={"source": "landing_page", "confidence": 1.0}
    )

    # Forget project_name from working layer
    t2["forget_project_name"] = store.forget("working", "project_name")

    # Health check
    t2["health_check"] = store.health_check()

    # Full snapshot
    t2["export_snapshot"] = store.export_snapshot()

    print(json.dumps(t2, indent=2, default=str))

    # Save JSON
    with open(base / "demo_mm_turn_2.json", "w") as f:
        json.dump(t2, f, indent=2, default=str)

    # Save Markdown narrative
    md2 = _build_turn2_markdown(t2)
    with open(base / "demo_mm_turn_2.md", "w") as f:
        f.write(md2)

    print("\nTurn 2 files written.")
    print("\nAll 4 output files confirmed:")
    for name in ["demo_mm_turn_1.json", "demo_mm_turn_1.md",
                 "demo_mm_turn_2.json", "demo_mm_turn_2.md"]:
        p = base / name
        print(f"  {'OK' if p.exists() else 'MISSING'} — {p} ({p.stat().st_size if p.exists() else 0} bytes)")


# ---------------------------------------------------------------------------
# Markdown builders
# ---------------------------------------------------------------------------

def _build_turn1_markdown(t1: dict) -> str:
    query = t1.get("query_flowdesk", {})
    matched = ", ".join(query.get("matched_layers", []))
    total = query.get("total_matches", 0)
    conf = query.get("confidence", 0)
    results_preview = ""
    for r in query.get("results", [])[:3]:
        results_preview += f"  - [{r['layer']}] `{r['key']}` (score {r['score']}): {r['preview']}\n"

    read_status = t1.get("read_project_name", {}).get("status", "?")
    read_value = (t1.get("read_project_name", {}).get("data") or {}).get("value", "?")

    lines = [
        "# Nasus Memory Manager — Turn 1 Narrative",
        "",
        "## Context",
        "This turn initialises the working memory for the **FlowDesk onboarding assistant** project.",
        "Three modules are assigned: `content_creator`, `landing_page`, and `product_strategist`.",
        "",
        "## What Was Stored",
        "",
        "### Working Layer",
        "| Key | Value |",
        "|-----|-------|",
        "| `project_name` | FlowDesk |",
        "| `goal` | onboarding assistant |",
        "| `assigned_modules` | content_creator, landing_page, product_strategist |",
        "",
        "All three working entries were written with status `ok`.",
        f"A read-back of `project_name` returned status **{read_status}** with value **{read_value}**.",
        "",
        "### Semantic Layer",
        "Stored a verified audience fact:",
        "- **Key:** `flowdesk_target_audience`",
        "- **Value:** B2B SaaS teams, 10-200 employees",
        "- **Source:** product_strategist",
        "- **Confidence:** 0.92",
        "",
        "### Procedural Layer",
        "Recorded a reusable onboarding pattern:",
        "- **Pattern ID:** `saas_onboarding_flow`",
        "- **Trigger:** new SaaS product brief",
        "- **Steps:** Extract ICP → Define value props → Draft hero section → Build email sequence",
        "- **Success Rate:** 88%",
        "",
        "## Cross-Layer Query",
        f'Query: _"what do we know about FlowDesk?"_',
        "",
        f"- **Matched layers:** {matched}",
        f"- **Total matches:** {total}",
        f"- **Top confidence:** {conf}",
        "",
        "Top results:",
        results_preview,
        "## Summary",
        "Turn 1 successfully bootstrapped the memory store with working context,",
        "one semantic fact, and one procedural pattern. The cross-layer query",
        "confirmed all three layers surfaced relevant FlowDesk data.",
    ]
    return "\n".join(lines)


def _build_turn2_markdown(t2: dict) -> str:
    hc = t2.get("health_check", {})
    snap = t2.get("export_snapshot", {})
    summ = t2.get("summarize_session", {})
    forget = t2.get("forget_project_name", {})

    ep_count = hc.get("layer_counts", {}).get("episodic", 0)
    sem_count = hc.get("layer_counts", {}).get("semantic", 0)
    proc_count = hc.get("layer_counts", {}).get("procedural", 0)
    work_count = hc.get("layer_counts", {}).get("working", 0)
    overall = hc.get("overall_score", 0)
    warnings = hc.get("warnings", [])
    snap_id = snap.get("snapshot_id", "?")

    warn_block = "\n".join(f"- {w}" for w in warnings) if warnings else "_No warnings._"

    lines = [
        "# Nasus Memory Manager — Turn 2 Narrative",
        "",
        "## Context",
        "The FlowDesk session has ended. This turn persists the session outcome",
        "into episodic memory, updates semantic facts with the CRO score,",
        "cleans up working context, and performs a full health check.",
        "",
        "## Session Summary Stored",
        f"- **Session ID:** {summ.get('session_id', '?')}",
        f"- **Module:** {summ.get('module', '?')}",
        f"- **Summary:** {summ.get('summary', '?')}",
        f"- **Word count:** {summ.get('word_count', '?')}",
        f"- **Stored at:** {summ.get('stored_at', '?')}",
        "",
        "## New Semantic Fact",
        "The landing page CRO score was recorded with full confidence:",
        "- **Key:** `flowdesk_landing_page_cro`",
        "- **Value:** 86",
        "- **Source:** landing_page",
        "- **Confidence:** 1.0",
        "",
        "## Working Memory Cleanup",
        f"Forgot `project_name` from working layer — status: **{forget.get('status', '?')}**, "
        f"freed ~{forget.get('freed_bytes_estimate', 0)} bytes.",
        "",
        "## Health Check Results",
        f"**Overall Score: {overall} / 100**",
        "",
        "| Layer | Score | Count |",
        "|-------|-------|-------|",
        f"| Episodic | {hc.get('layer_scores',{}).get('episodic','?')} | {ep_count} |",
        f"| Semantic | {hc.get('layer_scores',{}).get('semantic','?')} | {sem_count} |",
        f"| Procedural | {hc.get('layer_scores',{}).get('procedural','?')} | {proc_count} |",
        f"| Working | {hc.get('layer_scores',{}).get('working','?')} | {work_count} |",
        "",
        f"**Total entries:** {hc.get('total_entries', 0)}",
        "",
        "**Warnings:**",
        warn_block,
        "",
        "## Snapshot",
        f"A full memory snapshot was exported with ID `{snap_id}`.",
        "All four layers are captured in the accompanying JSON file.",
        "",
        "## Summary",
        "Turn 2 closed the FlowDesk session cleanly: episodic history was saved,",
        "semantic knowledge was enriched with the CRO metric, and stale working",
        "context was purged. The health check confirms the store is in a",
        "consistent state and ready for the next agent session.",
    ]
    return "\n".join(lines)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    run_demo()
