"""
NASUS LANDING PAGE AGENT — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: 08 | Stack: Nasus Sub-Agent Network

Dataclasses for all landing page agent outputs:
- SectionSpec: individual section plan entry
- CopyBlock: copy for one section (headline, subhead, body, CTA)
- CTASpec: CTA with friction-reducer and variant
- CROScorecard: 5-dimension CRO scoring
- VisualSpec: color tokens, type scale, layout
- ABVariant: A/B test hypothesis and variant copy
- ChangeLogEntry: iteration diff tracking
- LandingPageSession: full session state
- LandingPageOutput: complete structured output (Turn 1)
- LandingPageRefinement: structured refinement output (Turn 2+)
"""

from dataclasses import dataclass, field, asdict
from typing import List, Optional, Dict
from enum import Enum
import json
import uuid
from datetime import datetime, timezone


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class VoiceArchetype(str, Enum):
    BOLD = "BOLD"
    WARM = "WARM"
    AUTHORITATIVE = "AUTHORITATIVE"
    PLAYFUL = "PLAYFUL"
    ENTERPRISE = "ENTERPRISE"


class ColorScheme(str, Enum):
    DARK = "dark"
    LIGHT = "light"


class SectionPriority(str, Enum):
    CRITICAL = "Critical"
    IMPORTANT = "Important"
    OPTIONAL = "Optional"


class SectionName(str, Enum):
    HERO = "HERO"
    SOCIAL_PROOF_BAR = "SOCIAL_PROOF_BAR"
    PROBLEM = "PROBLEM"
    SOLUTION = "SOLUTION"
    FEATURES = "FEATURES"
    SOCIAL_PROOF_DEEP = "SOCIAL_PROOF_DEEP"
    PRICING = "PRICING"
    FAQ = "FAQ"
    FINAL_CTA = "FINAL_CTA"
    FOOTER = "FOOTER"


class FollowUpType(str, Enum):
    COPY_REWRITE = "COPY_REWRITE"
    SECTION_ADD_REMOVE = "SECTION_ADD_REMOVE"
    VISUAL_CHANGE = "VISUAL_CHANGE"
    AB_VARIANT = "AB_VARIANT"
    SCOPE_EXPANSION = "SCOPE_EXPANSION"
    TONE_SHIFT = "TONE_SHIFT"
    CRO_AUDIT = "CRO_AUDIT"
    FULL_REBUILD = "FULL_REBUILD"


# ---------------------------------------------------------------------------
# SECTION SPEC
# ---------------------------------------------------------------------------

@dataclass
class SectionSpec:
    name: SectionName
    priority: SectionPriority
    included: bool
    reason: str                          # Why included/excluded
    word_count_target: Dict[str, int]    # {"headline": 8, "subhead": 20, "body": 60}
    order_index: int                     # Position in page flow

    def to_dict(self):
        return {
            "name": self.name.value,
            "priority": self.priority.value,
            "included": self.included,
            "reason": self.reason,
            "word_count_target": self.word_count_target,
            "order_index": self.order_index,
        }


# ---------------------------------------------------------------------------
# COPY BLOCK
# ---------------------------------------------------------------------------

@dataclass
class CTASpec:
    primary_text: str          # e.g. "Start Building Free"
    primary_verb: str          # e.g. "Start"
    secondary_text: Optional[str] = None   # e.g. "Watch 2-min Demo"
    friction_reducer: Optional[str] = None # e.g. "No credit card required"
    url_placeholder: str = "#"

    def validate(self):
        forbidden = ["submit", "click here", "learn more"]
        if self.primary_text.lower() in forbidden:
            raise ValueError(f"CTA '{self.primary_text}' is a forbidden generic CTA")
        if self.friction_reducer is None:
            raise ValueError("Every primary CTA must have a friction-reducer")
        return True


@dataclass
class CopyBlock:
    section: SectionName
    eyebrow: Optional[str] = None         # e.g. "Now in Beta"
    headline: str = ""
    subheadline: Optional[str] = None
    body: Optional[str] = None
    cta: Optional[CTASpec] = None
    list_items: Optional[List[str]] = None  # For features/FAQ sections

    def word_counts(self) -> Dict[str, int]:
        return {
            "headline": len(self.headline.split()) if self.headline else 0,
            "subheadline": len(self.subheadline.split()) if self.subheadline else 0,
            "body": len(self.body.split()) if self.body else 0,
        }

    def validate_word_counts(self, spec: SectionSpec) -> List[str]:
        warnings = []
        wc = self.word_counts()
        targets = spec.word_count_target
        for field_name, target in targets.items():
            actual = wc.get(field_name, 0)
            if actual > target * 1.3:
                warnings.append(f"{self.section.value} {field_name}: {actual} words (target: {target})")
        return warnings

    def to_dict(self):
        return {
            "section": self.section.value,
            "eyebrow": self.eyebrow,
            "headline": self.headline,
            "subheadline": self.subheadline,
            "body": self.body,
            "cta": self.cta.to_dict() if self.cta else None,
            "list_items": self.list_items,
        }


# ---------------------------------------------------------------------------
# CRO SCORECARD
# ---------------------------------------------------------------------------

@dataclass
class CRODimension:
    name: str
    score: int       # 0–20
    max_score: int = 20
    notes: str = ""

    def __post_init__(self):
        if not (0 <= self.score <= self.max_score):
            raise ValueError(f"Score {self.score} out of range for dimension {self.name}")


@dataclass
class CROScorecard:
    above_fold_clarity: CRODimension
    trust_signals: CRODimension
    copy_quality: CRODimension
    section_completeness: CRODimension
    mobile_readiness: CRODimension
    recommendations: List[str] = field(default_factory=list)  # Top 3 specific improvements

    @property
    def total(self) -> int:
        return (
            self.above_fold_clarity.score +
            self.trust_signals.score +
            self.copy_quality.score +
            self.section_completeness.score +
            self.mobile_readiness.score
        )

    @property
    def grade(self) -> str:
        t = self.total
        if t >= 90: return "A"
        if t >= 80: return "B"
        if t >= 70: return "C"
        if t >= 60: return "D"
        return "F"

    def to_dict(self):
        return {
            "above_fold_clarity": asdict(self.above_fold_clarity),
            "trust_signals": asdict(self.trust_signals),
            "copy_quality": asdict(self.copy_quality),
            "section_completeness": asdict(self.section_completeness),
            "mobile_readiness": asdict(self.mobile_readiness),
            "total": self.total,
            "grade": self.grade,
            "recommendations": self.recommendations,
        }


# ---------------------------------------------------------------------------
# VISUAL SPEC
# ---------------------------------------------------------------------------

@dataclass
class ColorTokens:
    brand: str           # Primary brand / CTA color
    bg: str              # Page background
    surface: str         # Card / section background
    text_primary: str    # Headings and body
    text_muted: str      # Subheads, captions


@dataclass
class TypeScale:
    h1_size: str         # e.g. "clamp(48px, 6vw, 72px)"
    h2_size: str         # e.g. "clamp(32px, 4vw, 48px)"
    body_size: str       # e.g. "17px"
    caption_size: str    # e.g. "13px"
    heading_line_height: float = 1.15
    body_line_height: float = 1.65


@dataclass
class VisualSpec:
    color_scheme: ColorScheme
    colors: ColorTokens
    type_scale: TypeScale
    font_stack: str = "'Inter', 'SF Pro Display', system-ui, sans-serif"
    max_content_width: str = "1200px"
    section_padding_desktop: str = "80px"
    section_padding_mobile: str = "48px"
    border_radius_card: str = "12px"
    border_radius_button: str = "8px"
    grid_columns: int = 12
    grid_gutter: str = "24px"

    def to_dict(self):
        return {
            "color_scheme": self.color_scheme.value,
            "colors": {
                "brand": self.colors.brand,
                "bg": self.colors.bg,
                "surface": self.colors.surface,
                "text_primary": self.colors.text_primary,
                "text_muted": self.colors.text_muted,
            },
            "type_scale": {
                "h1_size": self.type_scale.h1_size,
                "h2_size": self.type_scale.h2_size,
                "body_size": self.type_scale.body_size,
                "caption_size": self.type_scale.caption_size,
                "heading_line_height": self.type_scale.heading_line_height,
                "body_line_height": self.type_scale.body_line_height,
            },
            "font_stack": self.font_stack,
            "max_content_width": self.max_content_width,
            "section_padding_desktop": self.section_padding_desktop,
            "section_padding_mobile": self.section_padding_mobile,
            "border_radius_card": self.border_radius_card,
            "border_radius_button": self.border_radius_button,
            "grid_columns": self.grid_columns,
            "grid_gutter": self.grid_gutter,
        }


# ---------------------------------------------------------------------------
# A/B VARIANT
# ---------------------------------------------------------------------------

@dataclass
class ABVariant:
    label: str                    # "A (Control)" or "B (Challenger)"
    section: SectionName
    headline: str
    cta_text: str
    hypothesis: str               # "We believe X will Y because Z"
    primary_metric: str           # "CTR" / "Signup rate" / "Scroll depth"
    recommended_test_days: int
    min_visitors_per_variant: int = 500

    def to_dict(self):
        return {
            "label": self.label,
            "section": self.section.value,
            "headline": self.headline,
            "cta_text": self.cta_text,
            "hypothesis": self.hypothesis,
            "primary_metric": self.primary_metric,
            "recommended_test_days": self.recommended_test_days,
            "min_visitors_per_variant": self.min_visitors_per_variant,
        }


# ---------------------------------------------------------------------------
# CHANGE LOG ENTRY
# ---------------------------------------------------------------------------

@dataclass
class ChangeLogEntry:
    turn: int
    changed_sections: List[str]
    follow_up_type: FollowUpType
    reason: str
    cro_before: int
    cro_after: int

    @property
    def cro_delta(self) -> int:
        return self.cro_after - self.cro_before

    def to_dict(self):
        return {
            "turn": self.turn,
            "changed_sections": self.changed_sections,
            "follow_up_type": self.follow_up_type.value,
            "reason": self.reason,
            "cro_before": self.cro_before,
            "cro_after": self.cro_after,
            "cro_delta": self.cro_delta,
        }


# ---------------------------------------------------------------------------
# SESSION STATE
# ---------------------------------------------------------------------------

@dataclass
class LandingPageSession:
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    product_name: str = ""
    value_prop: str = ""
    target_audience: str = ""
    primary_cta_goal: str = "Signup"
    voice_archetype: VoiceArchetype = VoiceArchetype.BOLD
    color_scheme: ColorScheme = ColorScheme.DARK
    brand_color: str = "#6366F1"
    sections_included: List[str] = field(default_factory=list)
    locked_sections: List[str] = field(default_factory=list)
    iteration_count: int = 0
    cro_score: int = 0
    pending_ab_tests: List[str] = field(default_factory=list)
    change_log: List[ChangeLogEntry] = field(default_factory=list)
    created_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    updated_at: str = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def log_change(self, changed_sections: List[str], follow_up_type: FollowUpType,
                   reason: str, cro_before: int, cro_after: int):
        entry = ChangeLogEntry(
            turn=self.iteration_count,
            changed_sections=changed_sections,
            follow_up_type=follow_up_type,
            reason=reason,
            cro_before=cro_before,
            cro_after=cro_after,
        )
        self.change_log.append(entry)
        self.cro_score = cro_after
        self.updated_at = datetime.now(timezone.utc).isoformat()

    def to_dict(self):
        return {
            "session_id": self.session_id,
            "product_name": self.product_name,
            "value_prop": self.value_prop,
            "target_audience": self.target_audience,
            "primary_cta_goal": self.primary_cta_goal,
            "voice_archetype": self.voice_archetype.value,
            "color_scheme": self.color_scheme.value,
            "brand_color": self.brand_color,
            "sections_included": self.sections_included,
            "locked_sections": self.locked_sections,
            "iteration_count": self.iteration_count,
            "cro_score": self.cro_score,
            "pending_ab_tests": self.pending_ab_tests,
            "change_log": [e.to_dict() for e in self.change_log],
            "created_at": self.created_at,
            "updated_at": self.updated_at,
        }


# ---------------------------------------------------------------------------
# FULL OUTPUT — TURN 1
# ---------------------------------------------------------------------------

@dataclass
class LandingPageOutput:
    session: LandingPageSession
    section_plan: List[SectionSpec]
    copy_blocks: List[CopyBlock]
    cro_scorecard: CROScorecard
    visual_spec: VisualSpec
    ab_variants: List[ABVariant] = field(default_factory=list)
    html_output: Optional[str] = None   # Full HTML/CSS/JS if code output requested
    copy_warnings: List[str] = field(default_factory=list)

    def validate(self) -> List[str]:
        errors = []
        # Check hero section exists
        hero_sections = [s for s in self.section_plan if s.name == SectionName.HERO and s.included]
        if not hero_sections:
            errors.append("HERO section is required and must be included")
        # Check hero copy block exists
        hero_copy = [c for c in self.copy_blocks if c.section == SectionName.HERO]
        if not hero_copy:
            errors.append("HERO copy block is missing")
        # Check CTA friction reducer
        for block in self.copy_blocks:
            if block.cta and block.cta.friction_reducer is None:
                errors.append(f"{block.section.value}: CTA missing friction-reducer")
        return errors

    @property
    def normalized_quality_score(self) -> float:
        """
        Returns CRO score normalized to 0.0-1.0 for Quality Reviewer compatibility.
        (GAP-06 fix: CRO scorecard uses 0-100 scale; QR threshold uses 0.0-1.0)
        """
        try:
            raw = self.cro_scorecard.total if hasattr(self, "cro_scorecard") and self.cro_scorecard else 0
            return round(min(max(float(raw) / 100.0, 0.0), 1.0), 4)
        except (AttributeError, TypeError, ValueError):
            return 0.0

    def to_dict(self):
        return {
            "session": self.session.to_dict(),
            "section_plan": [s.to_dict() for s in self.section_plan],
            "copy_blocks": [c.to_dict() for c in self.copy_blocks],
            "cro_scorecard": self.cro_scorecard.to_dict(),
            "visual_spec": self.visual_spec.to_dict(),
            "ab_variants": [v.to_dict() for v in self.ab_variants],
            "html_output": self.html_output,
            "copy_warnings": self.copy_warnings,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


# ---------------------------------------------------------------------------
# REFINEMENT OUTPUT — TURN 2+
# ---------------------------------------------------------------------------

@dataclass
class LandingPageRefinement:
    session: LandingPageSession          # Updated session state
    follow_up_type: FollowUpType
    changed_sections: List[str]
    unchanged_sections: List[str]
    updated_copy_blocks: List[CopyBlock] = field(default_factory=list)
    updated_visual_spec: Optional[VisualSpec] = None
    new_ab_variants: List[ABVariant] = field(default_factory=list)
    cro_before: int = 0
    cro_after: int = 0
    updated_cro_scorecard: Optional[CROScorecard] = None
    html_patch: Optional[str] = None    # Changed CSS/HTML blocks only
    next_action_suggestion: str = ""

    @property
    def cro_delta(self) -> int:
        return self.cro_after - self.cro_before

    def to_dict(self):
        return {
            "session": self.session.to_dict(),
            "follow_up_type": self.follow_up_type.value,
            "changed_sections": self.changed_sections,
            "unchanged_sections": self.unchanged_sections,
            "updated_copy_blocks": [c.to_dict() for c in self.updated_copy_blocks],
            "updated_visual_spec": self.updated_visual_spec.to_dict() if self.updated_visual_spec else None,
            "new_ab_variants": [v.to_dict() for v in self.new_ab_variants],
            "cro_before": self.cro_before,
            "cro_after": self.cro_after,
            "cro_delta": self.cro_delta,
            "updated_cro_scorecard": self.updated_cro_scorecard.to_dict() if self.updated_cro_scorecard else None,
            "html_patch": self.html_patch,
            "next_action_suggestion": self.next_action_suggestion,
        }

    def to_json(self, indent: int = 2) -> str:
        return json.dumps(self.to_dict(), indent=indent)


# ---------------------------------------------------------------------------
# DEMO / SELF-TEST
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print("Schema self-test: instantiating LandingPageOutput for 'FlowDesk'...")

    session = LandingPageSession(
        product_name="FlowDesk",
        value_prop="AI-powered customer support inbox that resolves 70% of tickets automatically",
        target_audience="B2B SaaS founders and support leads at 10–200 person companies",
        primary_cta_goal="Free trial signup",
        voice_archetype=VoiceArchetype.BOLD,
        color_scheme=ColorScheme.DARK,
        brand_color="#6366F1",
        sections_included=["HERO", "SOCIAL_PROOF_BAR", "FEATURES", "SOCIAL_PROOF_DEEP", "PRICING", "FAQ", "FINAL_CTA", "FOOTER"],
        cro_score=0,
        iteration_count=1,
    )

    section_plan = [
        SectionSpec(SectionName.HERO, SectionPriority.CRITICAL, True, "Primary conversion section — must establish value prop immediately", {"headline": 8, "subhead": 22, "body": 0}, 1),
        SectionSpec(SectionName.SOCIAL_PROOF_BAR, SectionPriority.IMPORTANT, True, "B2B product — logo bar builds trust fast post-hero", {"headline": 0}, 2),
        SectionSpec(SectionName.FEATURES, SectionPriority.CRITICAL, True, "Core benefit communication — 6 feature cards", {"headline": 6, "body": 55}, 3),
        SectionSpec(SectionName.SOCIAL_PROOF_DEEP, SectionPriority.IMPORTANT, True, "Named testimonials from support leads add credibility", {"headline": 6}, 4),
        SectionSpec(SectionName.PRICING, SectionPriority.CRITICAL, True, "SaaS product — pricing transparency reduces drop-off", {"headline": 5}, 5),
        SectionSpec(SectionName.FAQ, SectionPriority.IMPORTANT, True, "Objection handling for security, integration, and pricing concerns", {"headline": 8}, 6),
        SectionSpec(SectionName.FINAL_CTA, SectionPriority.CRITICAL, True, "Repeat primary CTA with urgency signal at bottom", {"headline": 7, "subhead": 18}, 7),
        SectionSpec(SectionName.FOOTER, SectionPriority.OPTIONAL, True, "Navigation, legal, social links", {}, 8),
    ]

    hero_cta = CTASpec(
        primary_text="Start Your Free Trial",
        primary_verb="Start",
        secondary_text="Watch 2-min Demo",
        friction_reducer="No credit card required. Cancel anytime.",
        url_placeholder="#signup"
    )
    hero_cta.validate()

    copy_blocks = [
        CopyBlock(
            section=SectionName.HERO,
            eyebrow="Trusted by 1,200+ support teams",
            headline="Resolve 70% of Tickets. Without Lifting a Finger.",
            subheadline="FlowDesk's AI reads, routes, and responds to customer support tickets automatically — so your team handles only what matters.",
            cta=hero_cta,
        ),
        CopyBlock(
            section=SectionName.FEATURES,
            headline="Everything Your Support Team Needs to Do Less",
            list_items=[
                "Auto-resolve: AI handles FAQs, refund requests, and status updates instantly",
                "Smart routing: Tickets reach the right agent every time based on topic + priority",
                "Tone detection: Flags frustrated customers before they churn",
                "CRM sync: Two-way sync with HubSpot, Salesforce, and Intercom",
                "Custom playbooks: Define exactly how your AI responds to any scenario",
                "Analytics dashboard: Resolution rate, CSAT, and time-to-close in real time",
            ],
        ),
        CopyBlock(
            section=SectionName.FINAL_CTA,
            headline="Your Support Team Is One Inbox Away From 3x Capacity",
            subheadline="Join 1,200 SaaS teams already resolving tickets on autopilot.",
            cta=CTASpec(
                primary_text="Get Started Free",
                primary_verb="Get",
                friction_reducer="Free 14-day trial. No credit card. Cancel anytime.",
                url_placeholder="#signup"
            ),
        ),
    ]

    cro_scorecard = CROScorecard(
        above_fold_clarity=CRODimension("Above-fold clarity", 18, 20, "Strong headline + subhead. CTA visible. Eyebrow adds social proof."),
        trust_signals=CRODimension("Trust signals", 15, 20, "Eyebrow tag present. Deep testimonials planned. Logo bar included."),
        copy_quality=CRODimension("Copy quality", 17, 20, "Benefit-led, specific numbers, zero jargon. Features list slightly long."),
        section_completeness=CRODimension("Section completeness", 18, 20, "All critical sections present. PROBLEM section skipped intentionally."),
        mobile_readiness=CRODimension("Mobile readiness", 16, 20, "Responsive rules defined. CTA above fold on mobile TBC after HTML output."),
        recommendations=[
            "Add PROBLEM section above FEATURES to increase emotional resonance for cold traffic",
            "Include logo bar with 6+ recognisable brand logos to maximise trust signal score",
            "Add star rating micro-signal (4.9/5) to hero section below CTA friction-reducer",
        ]
    )

    visual_spec = VisualSpec(
        color_scheme=ColorScheme.DARK,
        colors=ColorTokens(
            brand="#6366F1",
            bg="#0A0A0A",
            surface="#111111",
            text_primary="#F5F5F5",
            text_muted="#888888",
        ),
        type_scale=TypeScale(
            h1_size="clamp(48px, 6vw, 72px)",
            h2_size="clamp(32px, 4vw, 48px)",
            body_size="17px",
            caption_size="13px",
        )
    )

    output = LandingPageOutput(
        session=session,
        section_plan=section_plan,
        copy_blocks=copy_blocks,
        cro_scorecard=cro_scorecard,
        visual_spec=visual_spec,
    )

    errors = output.validate()
    assert not errors, f"Validation errors: {errors}"

    print(f"  Session ID:    {session.session_id[:8]}...")
    print(f"  Product:       {session.product_name}")
    print(f"  Sections:      {len(section_plan)}")
    print(f"  Copy blocks:   {len(copy_blocks)}")
    print(f"  CRO Total:     {cro_scorecard.total}/100 (Grade: {cro_scorecard.grade})")
    print(f"  Validation:    PASSED")
    print("Schema self-test: PASSED")

__all__ = [
    # Enums
    "VoiceArchetype", "ColorScheme", "SectionPriority", "SectionName", "FollowUpType",
    # Dataclasses
    "SectionSpec", "CTASpec", "CopyBlock", "CRODimension", "CROScorecard",
    "ColorTokens", "TypeScale", "VisualSpec", "ABVariant", "ChangeLogEntry",
    "LandingPageSession",
]
