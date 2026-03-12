"""
nasus_product_strategist.py
====================================
Nasus Product Strategist — single-file prototype.

Simulates a 2-turn strategy session using the schema from
nasus_product_strategist_schema.py. Each turn produces:
  - A JSON artifact  (demo_turn_N.json)
  - A Markdown artifact (demo_turn_N.md)

Run directly:
  python nasus_product_strategist.py

No external dependencies beyond the standard library + the schema module.
"""

from __future__ import annotations

import json
import os
import sys
from copy import deepcopy
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple

# ---------------------------------------------------------------------------
# Import schema — resolve path whether run from repo root or code/ dir
# ---------------------------------------------------------------------------
_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)

from nasus_product_strategist_schema import (
    CompetitiveAnalysis,
    Competitor,
    PrioritizationItem,
    ProductStrategyOutput,
    RoadmapInitiative,
    StrategySnapshot,
    UserStory,
    demo_output,
)


# ---------------------------------------------------------------------------
# Session state
# ---------------------------------------------------------------------------

@dataclass
class StrategySession:
    """
    Manages a multi-turn product strategy conversation.
    Holds the evolving ProductStrategyOutput and the turn counter.
    """

    output: ProductStrategyOutput
    turn: int = 1
    history: List[Dict[str, Any]] = field(default_factory=list)

    def record(self, role: str, content: str) -> None:
        self.history.append({"turn": self.turn, "role": role, "content": content})

    def advance(self) -> None:
        self.turn += 1

    def snapshot(self) -> StrategySnapshot:
        return self.output.strategy_snapshot

    def export_json(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.output.to_json())

    def export_markdown(self, path: str) -> None:
        with open(path, "w", encoding="utf-8") as f:
            f.write(self.output.to_markdown())


# ---------------------------------------------------------------------------
# Strategist core — applies user feedback and produces revised output
# ---------------------------------------------------------------------------

class ProductStrategist:
    """
    Simulates the Nasus Product Strategist sub-agent across multiple turns.
    Each turn accepts a user message and returns a revised ProductStrategyOutput
    plus a natural-language response.
    """

    SYSTEM_HEADER = (
        "You are Nasus Product Strategist. You think from the user's perspective first, "
        "apply RICE/ICE/MoSCoW/Kano frameworks rigorously, and always surface strategic tensions "
        "before making recommendations. You never pad outputs. You flag low-confidence assumptions."
    )

    def __init__(self, session: StrategySession) -> None:
        self.session = session

    def process_turn(self, user_message: str) -> Tuple[str, ProductStrategyOutput]:
        """
        Process one user turn. Returns (response_text, updated_output).
        This prototype applies deterministic mutations based on keyword triggers
        to simulate realistic session evolution without a live LLM.
        """
        self.session.record("user", user_message)
        msg_lower = user_message.lower()

        # Apply mutations based on message intent
        mutations_applied = []

        if any(kw in msg_lower for kw in ["gitlab", "git lab"]):
            self._add_gitlab_initiative()
            mutations_applied.append("Added GitLab integration initiative to Later horizon")

        if any(kw in msg_lower for kw in ["mobile", "ios", "android", "pwa"]):
            self._add_mobile_initiative()
            mutations_applied.append("Added Mobile PWA initiative to Later horizon")

        if any(kw in msg_lower for kw in ["sso", "enterprise", "saml", "series a"]):
            self._accelerate_sso()
            mutations_applied.append("Moved SSO / Enterprise SAML to Now horizon (accelerated)")

        if any(kw in msg_lower for kw in ["confidence", "risk", "validate", "study"]):
            self._lower_ai_confidence()
            mutations_applied.append("Lowered AI Retrospective Generator confidence score to reflect validation risk")

        if any(kw in msg_lower for kw in ["acv", "pricing", "price", "revenue"]):
            self._add_pricing_question()
            mutations_applied.append("Added ACV/pricing open question to strategy snapshot")

        if any(kw in msg_lower for kw in ["competitor", "linear", "jira", "asana"]):
            self._add_competitor_note()
            mutations_applied.append("Added competitive positioning note to snapshot tensions")

        # Always advance snapshot turn and update last_action
        self.session.output.strategy_snapshot = StrategySnapshot(
            turn=self.session.turn,
            product_hypothesis=self.session.output.strategy_snapshot.product_hypothesis,
            agreed_priorities=self.session.output.strategy_snapshot.agreed_priorities,
            open_questions=self.session.output.strategy_snapshot.open_questions,
            last_action=f"Turn {self.session.turn}: {user_message[:120]}",
            strategic_tensions=self.session.output.strategy_snapshot.strategic_tensions,
        )

        response = self._compose_response(user_message, mutations_applied)
        self.session.record("strategist", response)
        self.session.advance()
        return response, self.session.output

    # ------------------------------------------------------------------
    # Mutation helpers
    # ------------------------------------------------------------------

    def _add_gitlab_initiative(self) -> None:
        existing_ids = {r.id for r in self.session.output.roadmap}
        if "RI-007" not in existing_ids:
            self.session.output.roadmap.append(
                RoadmapInitiative(
                    id="RI-007",
                    title="GitLab Integration",
                    horizon="Later",
                    theme="Developer Experience",
                    initiative_type="Strategic Bet",
                    owner_placeholder="Backend + Integrations",
                    success_metric="GitLab-linked teams represent >= 15% of paying seats within 6 months",
                    confidence_score=0.70,
                    dependencies=["RI-002"],
                    changed=True,
                    status="Planned",
                )
            )
            # Update revision checklist
            item = "Scope GitLab integration — assess API parity with GitHub auto-linking (RI-002)"
            if item not in self.session.output.revision_checklist:
                self.session.output.revision_checklist.append(item)

    def _add_mobile_initiative(self) -> None:
        existing_ids = {r.id for r in self.session.output.roadmap}
        if "RI-008" not in existing_ids:
            self.session.output.roadmap.append(
                RoadmapInitiative(
                    id="RI-008",
                    title="Mobile PWA (iOS + Android)",
                    horizon="Later",
                    theme="Accessibility",
                    initiative_type="Strategic Bet",
                    owner_placeholder="Frontend + Product",
                    success_metric="Mobile WAU >= 20% of total WAU within 90 days of launch",
                    confidence_score=0.60,
                    dependencies=["RI-001"],
                    changed=True,
                    status="Planned",
                )
            )
            item = "Decide native vs. PWA for mobile — key architectural decision before Later horizon"
            if item not in self.session.output.revision_checklist:
                self.session.output.revision_checklist.append(item)
            # Remove the open checklist item about mobile if present
            self.session.output.revision_checklist = [
                c for c in self.session.output.revision_checklist
                if "native vs. PWA" not in c or "Later horizon" in c
            ]

    def _accelerate_sso(self) -> None:
        for r in self.session.output.roadmap:
            if r.id == "RI-004" and r.horizon != "Now":
                r.horizon = "Now"
                r.changed = True
        # Reflect in snapshot agreed priorities if not already there
        priority = "SSO / Enterprise SAML accelerated to Now horizon — Series A gate"
        if priority not in self.session.output.strategy_snapshot.agreed_priorities:
            self.session.output.strategy_snapshot.agreed_priorities.append(priority)

    def _lower_ai_confidence(self) -> None:
        for p in self.session.output.prioritization_matrix:
            if p.id == "PRI-004" and p.confidence > 45.0:
                p.confidence = 45.0
                p.rice_score = p.compute_rice()
                ease = round(10 - min(p.effort, 10), 2)
                p.ice_score = p.compute_ice(ease)
        for r in self.session.output.roadmap:
            if r.id == "RI-005" and r.confidence_score > 0.45:
                r.confidence_score = 0.45
                r.changed = True
        tension = "AI Retro Generator confidence revised down to 45% — validate before Next horizon planning"
        if tension not in self.session.output.strategy_snapshot.strategic_tensions:
            self.session.output.strategy_snapshot.strategic_tensions.append(tension)

    def _add_pricing_question(self) -> None:
        q = "What ACV floor triggers the enterprise SSO investment — $8K, $10K, or $15K?"
        if q not in self.session.output.strategy_snapshot.open_questions:
            self.session.output.strategy_snapshot.open_questions.append(q)

    def _add_competitor_note(self) -> None:
        tension = "Linear recently shipped AI triage — re-evaluate AI Features competitive score (currently 3/5)"
        if tension not in self.session.output.strategy_snapshot.strategic_tensions:
            self.session.output.strategy_snapshot.strategic_tensions.append(tension)

    # ------------------------------------------------------------------
    # Response composer
    # ------------------------------------------------------------------

    def _compose_response(self, user_message: str, mutations: List[str]) -> str:
        snap = self.session.output.strategy_snapshot
        top = self.session.output.get_top_priorities(3)
        top_str = ", ".join(f"{p.feature_name} (RICE {p.rice_score})" for p in top)

        mut_str = ""
        if mutations:
            mut_lines = "\n".join(f"  - {m}" for m in mutations)
            mut_str = f"\n\n**Roadmap / Matrix changes this turn:**\n{mut_lines}"

        tensions_str = "\n".join(f"  - {t}" for t in snap.strategic_tensions[-2:])

        return (
            f"**Turn {snap.turn} — Strategist Response**\n\n"
            f"Understood. Here is my current read on FlowDesk given your input.\n\n"
            f"**Top priorities by RICE:** {top_str}{mut_str}\n\n"
            f"**Active strategic tensions:**\n{tensions_str}\n\n"
            f"**Open questions requiring your input:**\n"
            + "\n".join(f"  - {q}" for q in snap.open_questions[-3:])
            + f"\n\n**Strategist confidence:** {self.session.output.strategist_confidence} — "
            f"{self.session.output.confidence_rationale[:120]}..."
        )


# ---------------------------------------------------------------------------
# Demo runner — 2-turn session
# ---------------------------------------------------------------------------

def run_demo(output_dir: str = ".") -> None:
    """
    Runs a 2-turn strategy session for FlowDesk and writes artifacts.

    Turn 1: User provides initial context and flags GitLab + enterprise SSO concerns.
    Turn 2: User asks about AI confidence and mobile strategy.

    Artifacts written:
      {output_dir}/demo_turn_1.json
      {output_dir}/demo_turn_1.md
      {output_dir}/demo_turn_2.json
      {output_dir}/demo_turn_2.md
    """
    os.makedirs(output_dir, exist_ok=True)

    # ---- Initialise session with Turn 0 state ----
    base_output = demo_output()
    session = StrategySession(output=base_output, turn=1)
    strategist = ProductStrategist(session)

    SEPARATOR = "\n" + "=" * 72 + "\n"

    # ================================================================
    # TURN 1
    # ================================================================
    turn1_user = (
        "We have about 40% of our target users on GitLab, not GitHub. "
        "Also our investors are asking about enterprise SSO before Series A — "
        "can we move that earlier? What does that do to the roadmap?"
    )

    print(SEPARATOR)
    print(f"TURN 1 — USER:")
    print(f"  {turn1_user}")

    response1, output1 = strategist.process_turn(turn1_user)

    print(f"\nTURN 1 — STRATEGIST:")
    print(response1)

    # Write Turn 1 artifacts
    json1_path = os.path.join(output_dir, "demo_turn_1.json")
    md1_path = os.path.join(output_dir, "demo_turn_1.md")
    session.export_json(json1_path)
    session.export_markdown(md1_path)
    print(f"\nArtifacts written:")
    print(f"  JSON: {json1_path}  ({os.path.getsize(json1_path):,} bytes)")
    print(f"  MD:   {md1_path}  ({os.path.getsize(md1_path):,} bytes)")

    # ================================================================
    # TURN 2
    # ================================================================
    turn2_user = (
        "The AI retrospective feature — I'm worried about the confidence level. "
        "What's the risk if we ship it before proper validation? "
        "Also we need a mobile strategy; our users are asking for iOS access."
    )

    print(SEPARATOR)
    print(f"TURN 2 — USER:")
    print(f"  {turn2_user}")

    response2, output2 = strategist.process_turn(turn2_user)

    print(f"\nTURN 2 — STRATEGIST:")
    print(response2)

    # Write Turn 2 artifacts
    json2_path = os.path.join(output_dir, "demo_turn_2.json")
    md2_path = os.path.join(output_dir, "demo_turn_2.md")
    session.export_json(json2_path)
    session.export_markdown(md2_path)
    print(f"\nArtifacts written:")
    print(f"  JSON: {json2_path}  ({os.path.getsize(json2_path):,} bytes)")
    print(f"  MD:   {md2_path}  ({os.path.getsize(md2_path):,} bytes)")

    # ================================================================
    # Session summary
    # ================================================================
    print(SEPARATOR)
    print("SESSION SUMMARY")
    print(SEPARATOR)

    snap = session.output.strategy_snapshot
    print(f"Total turns completed: {session.turn - 1}")
    print(f"Final snapshot turn:   {snap.turn}")
    print(f"Roadmap initiatives:   {len(session.output.roadmap)}")
    print(f"Open questions:        {len(snap.open_questions)}")
    print(f"Strategic tensions:    {len(snap.strategic_tensions)}")
    print(f"Revision checklist:    {len(session.output.revision_checklist)}")
    print(f"Strategist confidence: {session.output.strategist_confidence}")
    print()

    now = session.output.get_now_initiatives()
    nxt = session.output.get_next_initiatives()
    later = session.output.get_later_initiatives()
    print(f"Roadmap by horizon:")
    print(f"  Now ({len(now)}):   " + ", ".join(r.title for r in now))
    print(f"  Next ({len(nxt)}):  " + ", ".join(r.title for r in nxt))
    print(f"  Later ({len(later)}): " + ", ".join(r.title for r in later))
    print()

    top = session.output.get_top_priorities(5)
    print("Top 5 by RICE after 2 turns:")
    for i, p in enumerate(top):
        override = " [user override]" if p.user_override else ""
        print(f"  {i+1}. {p.feature_name:<38} RICE={p.rice_score}{override}")

    print(SEPARATOR)
    print("Demo complete. All artifacts written to:", os.path.abspath(output_dir))
    print(SEPARATOR)


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Write artifacts to same directory as this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    run_demo(output_dir=script_dir)


def _build_strategy_prompt(product_name: str, description: str,
                            competitors: list, user_message: str) -> str:
    parts = [
        "You are an expert product strategist. Provide a rigorous, actionable strategy analysis.",
    ]
    if product_name:
        parts.append(f"Product: {product_name}")
    if description:
        parts.append(f"Description: {description}")
    if competitors:
        comp_str = ", ".join(competitors) if isinstance(competitors, list) else str(competitors)
        parts.append(f"Competitors: {comp_str}")
    if user_message:
        parts.append(f"\nUser request: {user_message}")
    parts.append(
        "\nProvide: positioning framework, top 3-5 RICE-prioritized initiatives, "
        "key strategic tensions, open questions, and specific recommendations. "
        "Be concrete — name the actual product, users, and market. No filler."
    )
    return "\n".join(parts)


def route_envelope(envelope):
    """Standard Nasus entry point for M07 Product Strategist."""
    envelope.mark_running()
    try:
        payload = envelope.payload or {}
        if not isinstance(payload, dict):
            return envelope.mark_failed("payload must be a dict")

        product_name = payload.get("product_name", "")
        description = payload.get("description", "")
        competitors = payload.get("competitors", [])
        user_message = payload.get("message", description)

        # LLM path
        try:
            from nasus_sidecar import llm_client as _llm_client
            if _llm_client.is_configured():
                client = _llm_client.get_client()
                prompt = _build_strategy_prompt(
                    product_name, description, competitors, user_message
                )
                response = client.chat([{"role": "user", "content": prompt}])
                return envelope.mark_done({
                    "strategy": response,
                    "product": product_name,
                })
        except Exception:
            pass

        # Fallback: structured placeholder
        return envelope.mark_done({
            "strategy": (
                f"Strategy framework for {product_name or 'product'}:\n"
                "Configure an LLM gateway to get real strategic analysis. "
                "Key areas to address: positioning, ICP, competitive differentiation, "
                "go-to-market motion, pricing model, and key metrics."
            ),
            "product": product_name,
        })
    except Exception as e:
        return envelope.mark_failed(str(e))
