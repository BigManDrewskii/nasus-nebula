"""
nasus_product_strategist_schema.py
====================================
Structured output schema for the Nasus Product Strategist sub-agent.
All classes use Python dataclasses with full type annotations.
No external dependencies beyond dataclasses, typing, and json.

Each class implements:
  - to_dict() -> dict
  - to_markdown() -> str
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from typing import Dict, List, Optional


# ---------------------------------------------------------------------------
# StrategyRequest -- typed input contract (GAP-08 fix)
# ---------------------------------------------------------------------------

@dataclass
class StrategyRequest:
    """
    Typed input contract for M07 Product Strategist. (GAP-08 fix)
    Replaces free-form product_brief + market_data dict with a validated input class.
    """
    product_brief:   str
    market_data:     Optional[str]  = None
    user_research:   Optional[str]  = None
    constraints:     List[str]      = field(default_factory=list)
    target_modules:  List[str]      = field(default_factory=list)

    def __post_init__(self):
        if not self.product_brief or not self.product_brief.strip():
            raise ValueError("StrategyRequest.product_brief cannot be empty")

    def to_dict(self) -> dict:
        return {
            "product_brief":  self.product_brief,
            "market_data":    self.market_data,
            "user_research":  self.user_research,
            "constraints":    self.constraints,
            "target_modules": self.target_modules,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "StrategyRequest":
        return cls(
            product_brief  = d["product_brief"],
            market_data    = d.get("market_data"),
            user_research  = d.get("user_research"),
            constraints    = d.get("constraints", []),
            target_modules = d.get("target_modules", []),
        )


# ---------------------------------------------------------------------------
# 1. UserStory
# ---------------------------------------------------------------------------

@dataclass
class UserStory:
    """A single user story in standard format with MoSCoW and Kano tagging."""

    id: str
    persona: str
    goal: str
    outcome: str
    acceptance_criteria: List[str]
    priority_tag: str   # "Must Have" | "Should Have" | "Could Have" | "Won't Have"
    kano_category: str  # "Basic" | "Performance" | "Delight"
    story_points: Optional[int] = None

    VALID_PRIORITY_TAGS = {"Must Have", "Should Have", "Could Have", "Won't Have"}
    VALID_KANO = {"Basic", "Performance", "Delight"}

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "persona": self.persona,
            "goal": self.goal,
            "outcome": self.outcome,
            "acceptance_criteria": self.acceptance_criteria,
            "priority_tag": self.priority_tag,
            "kano_category": self.kano_category,
            "story_points": self.story_points,
        }

    def to_markdown(self) -> str:
        """Returns a formatted user story block in Markdown."""
        ac_lines = "\n".join(f"  - {c}" for c in self.acceptance_criteria)
        points_str = f" | **Points:** {self.story_points}" if self.story_points is not None else ""
        return (
            f"### [{self.id}] As a {self.persona},\n"
            f"I want **{self.goal}**,\n"
            f"so that **{self.outcome}**.\n\n"
            f"**Priority:** {self.priority_tag} | **Kano:** {self.kano_category}{points_str}\n\n"
            f"**Acceptance Criteria:**\n{ac_lines}"
        )


# ---------------------------------------------------------------------------
# 2. PrioritizationItem
# ---------------------------------------------------------------------------

@dataclass
class PrioritizationItem:
    """
    A single feature/initiative entry in the prioritization matrix.
    Supports RICE and ICE scoring with manual override tracking.
    """

    id: str
    feature_name: str
    reach: float        # RICE: 0-10 scale (users reached per quarter)
    impact: float       # RICE: 0-10 scale
    confidence: float   # RICE: 0-100 (percentage)
    effort: float       # RICE: person-weeks (>0)
    rice_score: float   # stored result of compute_rice()
    ice_score: float    # stored result of compute_ice()
    moscow: str         # "Must" | "Should" | "Could" | "Won't"
    rationale: str
    user_override: bool = False
    tags: List[str] = field(default_factory=list)

    VALID_MOSCOW = {"Must", "Should", "Could", "Won't"}

    def compute_rice(self) -> float:
        """
        RICE formula: (Reach * Impact * (Confidence / 100)) / Effort
        Effort must be > 0 to avoid division by zero.
        Returns 0.0 if effort is zero.
        """
        if self.effort <= 0:
            return 0.0
        return round((self.reach * self.impact * (self.confidence / 100)) / self.effort, 2)

    def compute_ice(self, ease: float) -> float:
        """
        ICE formula: Impact * Confidence * Ease
        Ease is provided by caller (typically 10 - normalized_effort).
        Returns rounded score.
        """
        return round(self.impact * (self.confidence / 100) * ease, 2)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "feature_name": self.feature_name,
            "reach": self.reach,
            "impact": self.impact,
            "confidence": self.confidence,
            "effort": self.effort,
            "rice_score": self.rice_score,
            "ice_score": self.ice_score,
            "moscow": self.moscow,
            "rationale": self.rationale,
            "user_override": self.user_override,
            "tags": self.tags,
        }

    def to_markdown(self) -> str:
        """Returns a single Markdown table row for use in a prioritization matrix."""
        override_flag = " *(override)*" if self.user_override else ""
        tags_str = ", ".join(self.tags) if self.tags else "—"
        return (
            f"| {self.id} | {self.feature_name} | {self.reach} | {self.impact} | "
            f"{self.confidence}% | {self.effort}w | **{self.rice_score}** | "
            f"{self.ice_score} | {self.moscow}{override_flag} | {tags_str} |"
        )


# ---------------------------------------------------------------------------
# 3. RoadmapInitiative
# ---------------------------------------------------------------------------

@dataclass
class RoadmapInitiative:
    """
    A single initiative on the product roadmap, organised by horizon
    (Now / Next / Later) and typed by strategic category.
    """

    id: str
    title: str
    horizon: str          # "Now" | "Next" | "Later"
    theme: str
    initiative_type: str  # "Quick Win" | "Strategic Bet" | "Dependency" | "Risk"
    owner_placeholder: str
    success_metric: str
    confidence_score: float  # 0.0 - 1.0
    dependencies: List[str] = field(default_factory=list)  # list of initiative IDs
    changed: bool = False
    status: str = "Planned"  # "Planned" | "In Progress" | "Completed" | "Dropped"

    VALID_HORIZONS = {"Now", "Next", "Later"}
    VALID_TYPES = {"Quick Win", "Strategic Bet", "Dependency", "Risk"}
    VALID_STATUSES = {"Planned", "In Progress", "Completed", "Dropped"}

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "horizon": self.horizon,
            "theme": self.theme,
            "initiative_type": self.initiative_type,
            "owner_placeholder": self.owner_placeholder,
            "success_metric": self.success_metric,
            "confidence_score": self.confidence_score,
            "dependencies": self.dependencies,
            "changed": self.changed,
            "status": self.status,
        }

    def to_markdown(self) -> str:
        """Returns a single Markdown table row for use in a roadmap view."""
        deps_str = ", ".join(self.dependencies) if self.dependencies else "—"
        changed_flag = " *(updated)*" if self.changed else ""
        confidence_pct = f"{int(self.confidence_score * 100)}%"
        return (
            f"| {self.id} | {self.title}{changed_flag} | {self.horizon} | "
            f"{self.theme} | {self.initiative_type} | {self.owner_placeholder} | "
            f"{self.success_metric} | {confidence_pct} | {deps_str} | {self.status} |"
        )


# ---------------------------------------------------------------------------
# 4. Competitor
# ---------------------------------------------------------------------------

@dataclass
class Competitor:
    """
    Profile of a single competitor for the competitive analysis matrix.
    Feature scores use a 1-5 scale per dimension.
    """

    name: str
    positioning: str
    price_tier: str  # "Free" | "Freemium" | "Low" | "Mid" | "High" | "Enterprise"
    strengths: List[str]
    weaknesses: List[str]
    feature_scores: Dict[str, int]  # feature_name -> score 1-5
    is_assumed: bool = False  # True if data was inferred, not validated

    VALID_PRICE_TIERS = {"Free", "Freemium", "Low", "Mid", "High", "Enterprise"}

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "positioning": self.positioning,
            "price_tier": self.price_tier,
            "strengths": self.strengths,
            "weaknesses": self.weaknesses,
            "feature_scores": self.feature_scores,
            "is_assumed": self.is_assumed,
        }

    def to_markdown(self) -> str:
        """Returns a formatted competitor profile block in Markdown."""
        assumed_note = (
            "\n> *Note: Some data points are assumed/inferred, not validated.*"
            if self.is_assumed else ""
        )
        strengths_md = "\n".join(f"  - {s}" for s in self.strengths)
        weaknesses_md = "\n".join(f"  - {w}" for w in self.weaknesses)
        scores_md = "\n".join(
            f"  - {feat}: {score}/5"
            for feat, score in self.feature_scores.items()
        )
        return (
            f"#### {self.name} — {self.price_tier} tier\n"
            f"**Positioning:** {self.positioning}{assumed_note}\n\n"
            f"**Strengths:**\n{strengths_md}\n\n"
            f"**Weaknesses:**\n{weaknesses_md}\n\n"
            f"**Feature Scores:**\n{scores_md}"
        )


# ---------------------------------------------------------------------------
# 5. CompetitiveAnalysis
# ---------------------------------------------------------------------------

@dataclass
class CompetitiveAnalysis:
    """
    Full competitive landscape analysis including a feature comparison matrix,
    white-space mapping, and differentiation recommendations.
    """

    agent_product: str
    competitors: List[Competitor]
    feature_dimensions: List[str]   # 8-12 dimensions for the matrix
    white_space_opportunities: List[str]
    parity_gaps: List[str]
    differentiation_levers: List[str]
    positioning_narrative: str
    recommendations: List[str]      # exactly 3

    def feature_matrix_markdown(self) -> str:
        """
        Builds a full Markdown comparison table.
        Rows = competitors, columns = feature dimensions.
        """
        if not self.feature_dimensions:
            return "*No feature dimensions defined.*"

        header_cols = " | ".join(self.feature_dimensions)
        header = f"| Competitor | {header_cols} | Price Tier |"
        separator_cols = " | ".join(["---"] * len(self.feature_dimensions))
        separator = f"| --- | {separator_cols} | --- |"

        rows = [header, separator]
        for comp in self.competitors:
            score_cells = []
            for dim in self.feature_dimensions:
                score = comp.feature_scores.get(dim, 0)
                score_cells.append(str(score) if score > 0 else "—")
            assumed_marker = "*" if comp.is_assumed else ""
            row = (
                f"| **{comp.name}**{assumed_marker} | "
                + " | ".join(score_cells)
                + f" | {comp.price_tier} |"
            )
            rows.append(row)

        footnote = (
            "\n*\\* Data partially inferred / not fully validated.*"
            if any(c.is_assumed for c in self.competitors)
            else ""
        )

        return "\n".join(rows) + footnote

    def to_dict(self) -> dict:
        return {
            "agent_product": self.agent_product,
            "competitors": [c.to_dict() for c in self.competitors],
            "feature_dimensions": self.feature_dimensions,
            "white_space_opportunities": self.white_space_opportunities,
            "parity_gaps": self.parity_gaps,
            "differentiation_levers": self.differentiation_levers,
            "positioning_narrative": self.positioning_narrative,
            "recommendations": self.recommendations,
        }

    def to_markdown(self) -> str:
        competitors_md = "\n\n".join(c.to_markdown() for c in self.competitors)
        white_space_md = "\n".join(f"- {o}" for o in self.white_space_opportunities)
        parity_md = "\n".join(f"- {g}" for g in self.parity_gaps)
        levers_md = "\n".join(f"- {lv}" for lv in self.differentiation_levers)
        recs_md = "\n".join(f"{i+1}. {r}" for i, r in enumerate(self.recommendations))

        return (
            f"## Competitive Analysis — {self.agent_product}\n\n"
            f"### Positioning Narrative\n{self.positioning_narrative}\n\n"
            f"### Feature Comparison Matrix\n{self.feature_matrix_markdown()}\n\n"
            f"### Competitor Profiles\n\n{competitors_md}\n\n"
            f"### White-Space Opportunities\n{white_space_md}\n\n"
            f"### Parity Gaps\n{parity_md}\n\n"
            f"### Differentiation Levers\n{levers_md}\n\n"
            f"### Top Recommendations\n{recs_md}"
        )


# ---------------------------------------------------------------------------
# 6. StrategySnapshot
# ---------------------------------------------------------------------------

@dataclass
class StrategySnapshot:
    """
    A compact record of strategic state at a given conversation turn.
    Captures hypothesis, agreed priorities, open questions, and tensions.
    """

    turn: int
    product_hypothesis: str
    agreed_priorities: List[str]
    open_questions: List[str]
    last_action: str
    strategic_tensions: List[str]

    def to_dict(self) -> dict:
        return {
            "turn": self.turn,
            "product_hypothesis": self.product_hypothesis,
            "agreed_priorities": self.agreed_priorities,
            "open_questions": self.open_questions,
            "last_action": self.last_action,
            "strategic_tensions": self.strategic_tensions,
        }

    def to_markdown(self) -> str:
        """Returns a compact snapshot block suitable for inline status updates."""
        priorities_md = "\n".join(f"  - {p}" for p in self.agreed_priorities)
        questions_md = "\n".join(f"  - {q}" for q in self.open_questions)
        tensions_md = "\n".join(f"  - {t}" for t in self.strategic_tensions)

        return (
            f"### Strategy Snapshot — Turn {self.turn}\n\n"
            f"**Hypothesis:** {self.product_hypothesis}\n\n"
            f"**Last Action:** {self.last_action}\n\n"
            f"**Agreed Priorities:**\n{priorities_md}\n\n"
            f"**Open Questions:**\n{questions_md}\n\n"
            f"**Strategic Tensions:**\n{tensions_md}"
        )


# ---------------------------------------------------------------------------
# 7. ProductStrategyOutput (top-level)
# ---------------------------------------------------------------------------

@dataclass
class ProductStrategyOutput:
    """
    Top-level container for a complete product strategy session output.
    Aggregates user stories, prioritization matrix, roadmap,
    competitive analysis, and executive summary.
    """

    session_id: str
    product_name: str
    target_persona: str
    user_stories: List[UserStory]
    prioritization_matrix: List[PrioritizationItem]
    roadmap: List[RoadmapInitiative]
    strategy_snapshot: StrategySnapshot
    presentation_summary: str       # 3-5 sentence exec-ready summary
    strategist_confidence: str      # "HIGH" | "MEDIUM" | "LOW"
    confidence_rationale: str
    revision_checklist: List[str]   # items that need follow-up or validation
    competitive_analysis: Optional[CompetitiveAnalysis] = None

    VALID_CONFIDENCE_LEVELS = {"HIGH", "MEDIUM", "LOW"}

    # ------------------------------------------------------------------
    # Filtering helpers
    # ------------------------------------------------------------------

    def get_now_initiatives(self) -> List[RoadmapInitiative]:
        """Returns all roadmap initiatives in the 'Now' horizon."""
        return [i for i in self.roadmap if i.horizon == "Now"]

    def get_next_initiatives(self) -> List[RoadmapInitiative]:
        """Returns all roadmap initiatives in the 'Next' horizon."""
        return [i for i in self.roadmap if i.horizon == "Next"]

    def get_later_initiatives(self) -> List[RoadmapInitiative]:
        """Returns all roadmap initiatives in the 'Later' horizon."""
        return [i for i in self.roadmap if i.horizon == "Later"]

    def get_top_priorities(self, n: int = 5) -> List[PrioritizationItem]:
        """Returns the top-n prioritization items sorted by RICE score descending."""
        sorted_items = sorted(
            self.prioritization_matrix,
            key=lambda x: x.rice_score,
            reverse=True,
        )
        return sorted_items[:n]

    # ------------------------------------------------------------------
    # Serialization
    # ------------------------------------------------------------------

    def to_dict(self) -> dict:
        return {
            "session_id": self.session_id,
            "product_name": self.product_name,
            "target_persona": self.target_persona,
            "user_stories": [s.to_dict() for s in self.user_stories],
            "prioritization_matrix": [p.to_dict() for p in self.prioritization_matrix],
            "roadmap": [r.to_dict() for r in self.roadmap],
            "competitive_analysis": (
                self.competitive_analysis.to_dict()
                if self.competitive_analysis else None
            ),
            "strategy_snapshot": self.strategy_snapshot.to_dict(),
            "presentation_summary": self.presentation_summary,
            "strategist_confidence": self.strategist_confidence,
            "confidence_rationale": self.confidence_rationale,
            "revision_checklist": self.revision_checklist,
        }

    def to_json(self, indent: int = 2) -> str:
        """Serializes the full output to a formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent, ensure_ascii=False)

    def to_markdown(self) -> str:
        """Renders the full strategy output as a presentation-ready Markdown report."""

        # --- Header ---
        header = (
            f"# Product Strategy Report: {self.product_name}\n\n"
            f"**Session:** `{self.session_id}`  \n"
            f"**Target Persona:** {self.target_persona}  \n"
            f"**Strategist Confidence:** {self.strategist_confidence} — {self.confidence_rationale}\n"
        )

        # --- Executive Summary ---
        exec_summary = f"## Executive Summary\n\n{self.presentation_summary}"

        # --- Strategy Snapshot ---
        snapshot_md = self.strategy_snapshot.to_markdown()

        # --- User Stories ---
        stories_md = "\n\n---\n\n".join(s.to_markdown() for s in self.user_stories)
        user_stories_section = f"## User Stories\n\n{stories_md}"

        # --- Prioritization Matrix ---
        pri_header = (
            "| ID | Feature | Reach | Impact | Confidence | Effort | RICE | ICE | MoSCoW | Tags |\n"
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
        )
        pri_rows = "\n".join(p.to_markdown() for p in self.prioritization_matrix)
        top_pri_lines = "\n".join(
            f"{i+1}. **{item.feature_name}** (RICE: {item.rice_score})"
            for i, item in enumerate(self.get_top_priorities())
        )
        prioritization_section = (
            f"## Prioritization Matrix\n\n{pri_header}\n{pri_rows}\n\n"
            f"### Top Priorities by RICE\n\n{top_pri_lines}"
        )

        # --- Roadmap by Horizon ---
        roadmap_header = (
            "| ID | Title | Horizon | Theme | Type | Owner | Success Metric | Confidence | Deps | Status |\n"
            "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |"
        )

        def horizon_section(label: str, items: List[RoadmapInitiative]) -> str:
            if not items:
                return f"### {label}\n\n*No initiatives in this horizon.*"
            rows = "\n".join(item.to_markdown() for item in items)
            return f"### {label}\n\n{roadmap_header}\n{rows}"

        roadmap_section = (
            "## Roadmap\n\n"
            + horizon_section("Now (0-3 months)", self.get_now_initiatives()) + "\n\n"
            + horizon_section("Next (3-6 months)", self.get_next_initiatives()) + "\n\n"
            + horizon_section("Later (6-12 months)", self.get_later_initiatives())
        )

        # --- Competitive Analysis ---
        comp_section = ""
        if self.competitive_analysis:
            comp_section = self.competitive_analysis.to_markdown()

        # --- Revision Checklist ---
        checklist_items = "\n".join(f"- [ ] {item}" for item in self.revision_checklist)
        checklist_section = f"## Revision Checklist\n\n{checklist_items}"

        # --- Assemble ---
        sections = [
            header,
            exec_summary,
            snapshot_md,
            user_stories_section,
            prioritization_section,
            roadmap_section,
        ]
        if comp_section:
            sections.append(comp_section)
        sections.append(checklist_section)

        return "\n\n---\n\n".join(sections)


# ---------------------------------------------------------------------------
# demo_output() — FlowDesk B2B SaaS example
# ---------------------------------------------------------------------------

def demo_output() -> ProductStrategyOutput:
    """
    Instantiates a realistic ProductStrategyOutput for FlowDesk,
    a task management tool for remote engineering teams.
    """

    # ---- User Stories ----
    stories: List[UserStory] = [
        UserStory(
            id="US-001",
            persona="remote engineering team lead",
            goal="see all in-progress tasks across sub-teams in a single view",
            outcome="I can identify blockers and re-allocate capacity without scheduling a sync call",
            acceptance_criteria=[
                "Dashboard loads within 1.5 seconds with up to 200 active tasks",
                "Tasks are grouped by sub-team and filterable by assignee or label",
                "Blocked tasks are visually flagged with a blocker badge",
                "View state persists across browser sessions",
            ],
            priority_tag="Must Have",
            kano_category="Basic",
            story_points=8,
        ),
        UserStory(
            id="US-002",
            persona="individual contributor engineer",
            goal="receive smart daily digest that summarises my task priorities for the day",
            outcome="I start focused work immediately without manually triaging my backlog every morning",
            acceptance_criteria=[
                "Digest arrives via Slack DM at a user-configurable time (default 9 AM local)",
                "Digest highlights up to 5 tasks ranked by due date and dependency chain",
                "One-click from digest to mark a task in-progress or snooze",
                "Digest generation uses only tasks assigned to the requesting user",
            ],
            priority_tag="Should Have",
            kano_category="Performance",
            story_points=5,
        ),
        UserStory(
            id="US-003",
            persona="engineering manager",
            goal="celebrate completed sprint milestones with an auto-generated team highlight reel",
            outcome="team morale improves through visible recognition without manual effort from me",
            acceptance_criteria=[
                "Highlight reel is generated automatically at sprint close",
                "Reel includes top contributors, shipped features, and velocity trend",
                "Reel is shareable as a Slack post or PDF export",
                "Manager can optionally add a personal note before publishing",
            ],
            priority_tag="Could Have",
            kano_category="Delight",
            story_points=3,
        ),
    ]

    # ---- Prioritization Matrix ----
    def make_item(
        id: str,
        feature_name: str,
        reach: float,
        impact: float,
        confidence: float,
        effort: float,
        moscow: str,
        rationale: str,
        user_override: bool = False,
        tags: Optional[List[str]] = None,
    ) -> PrioritizationItem:
        ease = round(10 - min(effort, 10), 2)
        item = PrioritizationItem(
            id=id,
            feature_name=feature_name,
            reach=reach,
            impact=impact,
            confidence=confidence,
            effort=effort,
            rice_score=0.0,
            ice_score=0.0,
            moscow=moscow,
            rationale=rationale,
            user_override=user_override,
            tags=tags or [],
        )
        item.rice_score = item.compute_rice()
        item.ice_score = item.compute_ice(ease)
        return item

    prioritization: List[PrioritizationItem] = [
        make_item(
            id="PRI-001",
            feature_name="Unified Team Dashboard",
            reach=9.0,
            impact=9.0,
            confidence=85.0,
            effort=3.0,
            moscow="Must",
            rationale="Core value prop — directly addresses the top pain point of async visibility.",
            tags=["visibility", "core"],
        ),
        make_item(
            id="PRI-002",
            feature_name="Smart Daily Digest (Slack)",
            reach=8.0,
            impact=7.0,
            confidence=70.0,
            effort=2.0,
            moscow="Should",
            rationale="High engagement driver; Slack integration already scaffolded from auth layer.",
            tags=["notifications", "integrations"],
        ),
        make_item(
            id="PRI-003",
            feature_name="GitHub PR Auto-Linking",
            reach=7.5,
            impact=8.0,
            confidence=90.0,
            effort=1.5,
            moscow="Must",
            rationale="Engineering teams expect seamless PR-to-task traceability. Low effort, high signal.",
            tags=["integrations", "developer-experience"],
        ),
        make_item(
            id="PRI-004",
            feature_name="AI Sprint Retrospective Generator",
            reach=6.0,
            impact=6.0,
            confidence=55.0,
            effort=4.0,
            moscow="Could",
            rationale="Differentiation play but confidence is low until we validate AI output quality.",
            user_override=True,
            tags=["ai", "delight"],
        ),
        make_item(
            id="PRI-005",
            feature_name="SSO / Enterprise SAML",
            reach=4.0,
            impact=9.0,
            confidence=95.0,
            effort=3.0,
            moscow="Must",
            rationale="Mandatory for enterprise deals >$10K ACV. Blocks sales pipeline at current stage.",
            tags=["enterprise", "security"],
        ),
    ]

    # ---- Roadmap ----
    roadmap: List[RoadmapInitiative] = [
        RoadmapInitiative(
            id="RI-001",
            title="Unified Team Dashboard (v1)",
            horizon="Now",
            theme="Core Visibility",
            initiative_type="Quick Win",
            owner_placeholder="Product + Frontend",
            success_metric="DAU/MAU ratio >= 0.6 within 30 days of launch",
            confidence_score=0.88,
            dependencies=[],
            changed=False,
            status="In Progress",
        ),
        RoadmapInitiative(
            id="RI-002",
            title="GitHub PR Auto-Linking",
            horizon="Now",
            theme="Developer Experience",
            initiative_type="Quick Win",
            owner_placeholder="Backend + Integrations",
            success_metric="50% of tasks have linked PRs within 60 days of launch",
            confidence_score=0.92,
            dependencies=[],
            changed=False,
            status="Planned",
        ),
        RoadmapInitiative(
            id="RI-003",
            title="Smart Daily Digest via Slack",
            horizon="Next",
            theme="Async Communication",
            initiative_type="Strategic Bet",
            owner_placeholder="Product + Platform",
            success_metric="Weekly active digest users >= 40% of seats within 90 days",
            confidence_score=0.72,
            dependencies=["RI-001"],
            changed=False,
            status="Planned",
        ),
        RoadmapInitiative(
            id="RI-004",
            title="SSO / Enterprise SAML",
            horizon="Next",
            theme="Enterprise Readiness",
            initiative_type="Dependency",
            owner_placeholder="Security + Backend",
            success_metric="First enterprise deal closed post-launch; <2 security incidents in 6 months",
            confidence_score=0.95,
            dependencies=[],
            changed=False,
            status="Planned",
        ),
        RoadmapInitiative(
            id="RI-005",
            title="AI Sprint Retrospective Generator",
            horizon="Later",
            theme="AI-Powered Insights",
            initiative_type="Strategic Bet",
            owner_placeholder="AI/ML Team",
            success_metric="Retro feature used in >= 30% of completed sprints; NPS delta +5",
            confidence_score=0.55,
            dependencies=["RI-001", "RI-003"],
            changed=True,
            status="Planned",
        ),
        RoadmapInitiative(
            id="RI-006",
            title="Team Highlight Reel (Sprint Close)",
            horizon="Later",
            theme="Team Morale",
            initiative_type="Quick Win",
            owner_placeholder="Product + Design",
            success_metric="Highlight reel shared by >= 25% of managers each sprint",
            confidence_score=0.65,
            dependencies=["RI-001"],
            changed=False,
            status="Planned",
        ),
    ]

    # ---- Competitors ----
    feature_dims = [
        "Task Management",
        "Sprint Planning",
        "GitHub Integration",
        "Slack Integration",
        "AI Features",
        "Custom Workflows",
        "Reporting & Analytics",
        "Mobile App",
        "Enterprise SSO",
        "Onboarding UX",
    ]

    competitors: List[Competitor] = [
        Competitor(
            name="Jira",
            positioning="Enterprise-grade issue tracker and project management platform for large engineering orgs",
            price_tier="Mid",
            strengths=[
                "Deep Atlassian ecosystem integration (Confluence, Bitbucket)",
                "Highly configurable workflows and custom fields",
                "Robust enterprise compliance and audit trails",
                "Massive plugin marketplace (3,000+ integrations)",
            ],
            weaknesses=[
                "Steep learning curve; notorious onboarding friction",
                "UI feels dated and slow for small agile teams",
                "Overkill complexity for teams under 30 engineers",
                "Pricing scales poorly for mid-market buyers",
            ],
            feature_scores={
                "Task Management": 5,
                "Sprint Planning": 5,
                "GitHub Integration": 4,
                "Slack Integration": 3,
                "AI Features": 2,
                "Custom Workflows": 5,
                "Reporting & Analytics": 5,
                "Mobile App": 3,
                "Enterprise SSO": 5,
                "Onboarding UX": 2,
            },
            is_assumed=False,
        ),
        Competitor(
            name="Linear",
            positioning="Fast, opinionated issue tracker built for modern product and engineering teams",
            price_tier="Freemium",
            strengths=[
                "Best-in-class speed and keyboard-first UX",
                "Opinionated workflow reduces setup overhead",
                "Strong GitHub and GitLab native integrations",
                "Beloved by developer-led teams and YC startups",
            ],
            weaknesses=[
                "Limited enterprise controls (SSO on paid plans only)",
                "Reporting and analytics are basic compared to Jira",
                "Less flexible for non-engineering workflows",
                "No built-in time tracking",
            ],
            feature_scores={
                "Task Management": 5,
                "Sprint Planning": 4,
                "GitHub Integration": 5,
                "Slack Integration": 4,
                "AI Features": 3,
                "Custom Workflows": 3,
                "Reporting & Analytics": 3,
                "Mobile App": 4,
                "Enterprise SSO": 3,
                "Onboarding UX": 5,
            },
            is_assumed=False,
        ),
        Competitor(
            name="Asana",
            positioning="Work management platform for cross-functional teams focused on goals and portfolio tracking",
            price_tier="Mid",
            strengths=[
                "Excellent cross-functional project visibility",
                "Strong goal and OKR alignment features",
                "Portfolio and workload management for PMs",
                "Polished UI with broad non-technical adoption",
            ],
            weaknesses=[
                "Weak developer-specific features (no native code integration)",
                "Sprint-style planning feels bolted-on",
                "Engineers find it too PM-centric",
                "AI features are early-stage and gimmicky",
            ],
            feature_scores={
                "Task Management": 5,
                "Sprint Planning": 3,
                "GitHub Integration": 2,
                "Slack Integration": 4,
                "AI Features": 2,
                "Custom Workflows": 4,
                "Reporting & Analytics": 4,
                "Mobile App": 5,
                "Enterprise SSO": 4,
                "Onboarding UX": 4,
            },
            is_assumed=True,
        ),
    ]

    competitive_analysis = CompetitiveAnalysis(
        agent_product="FlowDesk",
        competitors=competitors,
        feature_dimensions=feature_dims,
        white_space_opportunities=[
            "AI-generated daily digest — no competitor offers intelligent async standup replacement",
            "Remote team morale features (highlight reels, async celebrations) — untapped by all three",
            "Opinionated remote-first defaults (timezones, async-by-default) — all competitors treat remote as an add-on",
        ],
        parity_gaps=[
            "Enterprise SSO: Jira and Asana have full SAML support; FlowDesk must ship RI-004 to compete",
            "Mobile app: Asana and Linear score 4-5; FlowDesk has no native mobile app in roadmap",
            "Custom workflow builder: Jira and Asana lead; FlowDesk is early-stage",
        ],
        differentiation_levers=[
            "Remote-first UX with async-native defaults (timezone-aware scheduling, no-meeting-required workflows)",
            "AI-powered insights (sprint retros, daily digest) as a core feature set, not an upsell",
            "Developer-grade speed and keyboard shortcuts (Linear-level DX) combined with team-level analytics (Jira-level depth)",
        ],
        positioning_narrative=(
            "FlowDesk targets remote engineering teams of 5-50 who are underserved by Jira's complexity "
            "and outgrowing Linear's simplicity. Where Jira optimises for enterprise compliance and Linear "
            "optimises for speed, FlowDesk optimises for async collaboration — giving team leads visibility "
            "without meetings, and engineers focus without noise. The AI-native roadmap is the moat: "
            "daily digests and retro generators replace synchronous rituals, not just digitise them."
        ),
        recommendations=[
            "Ship GitHub PR Auto-Linking (RI-002) before Daily Digest — developer trust is the acquisition lever, not notifications.",
            "Accelerate Enterprise SSO (RI-004) ahead of Series A to unblock the sales pipeline; one enterprise deal funds 6 months of AI R&D.",
            "Commission a 10-user qualitative study on the AI Retrospective Generator before committing to full build — confidence at 55% is too low for a 4-week investment.",
        ],
    )

    # ---- Strategy Snapshot ----
    snapshot = StrategySnapshot(
        turn=1,
        product_hypothesis=(
            "Remote engineering teams of 5-50 will pay for a task tool that eliminates sync meetings "
            "through AI-driven async visibility, if it matches Linear's speed and adds team-level insight."
        ),
        agreed_priorities=[
            "Unified Team Dashboard is the non-negotiable v1 foundation",
            "GitHub integration unlocks developer trust before AI features",
            "Enterprise SSO gates the enterprise sales motion — must ship in Next horizon",
        ],
        open_questions=[
            "What is the target ACV for the initial enterprise tier?",
            "Does the AI Retrospective Generator require a proprietary model or can it run on a third-party LLM?",
            "How does FlowDesk handle teams that use GitLab instead of GitHub?",
        ],
        last_action="Initial strategy session — defined core user stories, prioritization matrix, and roadmap horizons.",
        strategic_tensions=[
            "Speed vs. enterprise readiness: shipping SSO delays AI differentiation work by ~4 weeks",
            "Opinionated UX vs. customisation: Linear-style simplicity conflicts with enterprise demand for custom workflows",
            "AI investment now vs. proving core product-market fit first",
        ],
    )

    # ---- Top-level Output ----
    output = ProductStrategyOutput(
        session_id="flowdesk-strategy-001",
        product_name="FlowDesk",
        target_persona="Remote engineering team leads and ICs at B2B SaaS companies (5-50 engineers)",
        user_stories=stories,
        prioritization_matrix=prioritization,
        roadmap=roadmap,
        competitive_analysis=competitive_analysis,
        strategy_snapshot=snapshot,
        presentation_summary=(
            "FlowDesk has a credible path to product-market fit in the underserved remote engineering team segment, "
            "sitting between Linear's simplicity and Jira's power. The immediate priority is delivering the Unified Dashboard "
            "and GitHub integration to establish developer trust before monetising through AI features. "
            "Enterprise SSO must ship in the Next horizon to unlock the sales pipeline ahead of Series A. "
            "The AI Retrospective Generator is a compelling differentiator but requires user validation before full investment — "
            "confidence at 55% does not justify a 4-week engineering sprint without qualitative signal."
        ),
        strategist_confidence="MEDIUM",
        confidence_rationale=(
            "Core assumptions around async visibility and developer-first positioning are well-validated by analogous products. "
            "AI feature viability and enterprise deal velocity are unvalidated assumptions that limit overall confidence to MEDIUM."
        ),
        revision_checklist=[
            "Validate AI Retrospective Generator with 10-user qualitative study before committing to RI-005 build",
            "Confirm enterprise ACV target and SAML buyer persona before scoping RI-004 effort",
            "Assess GitLab integration demand — current GitHub-only roadmap may alienate 20-30% of the ICP",
            "Define mobile app strategy: native vs. PWA decision needed before Later horizon planning",
        ],
    )

    return output


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    output = demo_output()
    print(output.to_json())

__all__ = [
    # Dataclasses
    "StrategyRequest",
    "UserStory", "PrioritizationItem", "RoadmapInitiative",
    "Competitor", "CompetitiveAnalysis",
    "StrategySnapshot", "ProductStrategyOutput",
]
