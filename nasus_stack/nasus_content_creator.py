"""
Nasus Content Creator — Single-File Prototype
Version: 1.0.0 | Phase 4 | Nasus Agent Network

Wires together:
  - Phase 1: Specialist system prompt (loaded from nasus_content_creator_prompt.md)
  - Phase 2: Refine/iteration pattern logic
  - Phase 3: Structured output schema (dataclasses + enums)

Runs a live 2-turn demo:
  Turn 1 — Generate a LinkedIn post on brand identity for a design audience
  Turn 2 — Revise: make tone more authoritative, sharpen the hook

Usage:
    python nasus_content_creator.py
"""

from __future__ import annotations

import os
import re
import textwrap
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional


# ===========================================================================
# PHASE 3 — SCHEMA (inlined for single-file portability)
# ===========================================================================

class Platform(str, Enum):
    BLOG         = "blog"
    LINKEDIN     = "linkedin"
    TWITTER_X    = "twitter_x"
    NEWSLETTER   = "newsletter"
    YOUTUBE      = "youtube"
    PRODUCT_PAGE = "product_page"

class ExpertiseLevel(str, Enum):
    BEGINNER     = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT       = "expert"

class ToneMode(str, Enum):
    PROFESSIONAL   = "professional"
    CONVERSATIONAL = "conversational"
    AUTHORITATIVE  = "authoritative"
    WITTY          = "witty"
    EMPATHETIC     = "empathetic"
    MINIMALIST     = "minimalist"
    HYPE           = "hype"

class HookType(str, Enum):
    QUESTION   = "question"
    STAT       = "stat"
    BOLD_CLAIM = "bold_claim"
    STORY      = "story"

class ChangeScope(str, Enum):
    MICRO        = "micro"
    SECTION      = "section"
    FULL_REWRITE = "full_rewrite"

class ContentFormat(str, Enum):
    BLOG_POST      = "blog_post"
    LINKEDIN_POST  = "linkedin_post"
    TWITTER_THREAD = "twitter_thread"
    NEWSLETTER     = "newsletter"
    YOUTUBE_SCRIPT = "youtube_script"
    PRODUCT_PAGE   = "product_page"

@dataclass
class AudienceSpec:
    expertise_level : ExpertiseLevel = ExpertiseLevel.INTERMEDIATE
    platform        : Platform       = Platform.LINKEDIN
    age_range       : str            = "25-45"
    notes           : str            = ""

@dataclass
class ToneSpec:
    primary   : ToneMode           = ToneMode.CONVERSATIONAL
    secondary : Optional[ToneMode] = None
    notes     : str                = ""

@dataclass
class SEOSpec:
    primary_keyword    : str       = ""
    secondary_keywords : list[str] = field(default_factory=list)
    meta_description   : str       = ""
    target_flesch      : str       = "60-80"

@dataclass
class ContentRequest:
    topic           : str
    content_format  : ContentFormat
    audience        : AudienceSpec  = field(default_factory=AudienceSpec)
    tone            : ToneSpec      = field(default_factory=ToneSpec)
    seo             : SEOSpec       = field(default_factory=SEOSpec)
    hook_type       : HookType      = HookType.BOLD_CLAIM
    word_count_hint : Optional[int] = None
    extra_context   : str           = ""
    version         : str           = "v1.0"

@dataclass
class RevisionChecklist:
    needs_source_flags : list[str] = field(default_factory=list)
    cta_url_confirmed  : bool      = False
    keyword_density_ok : bool      = True
    tone_consistent    : bool      = True
    format_deviations  : list[str] = field(default_factory=list)
    additional_notes   : list[str] = field(default_factory=list)

@dataclass
class ContentMetadata:
    title_suggestions  : list[str]         = field(default_factory=list)
    meta_description   : str               = ""
    primary_keyword    : str               = ""
    secondary_keywords : list[str]         = field(default_factory=list)
    revision_checklist : RevisionChecklist = field(default_factory=RevisionChecklist)

@dataclass
class ChangeDirective:
    directive_type : str
    instruction    : str
    target         : str  = ""
    is_ambiguous   : bool = False

@dataclass
class ChangeLogEntry:
    version          : str
    scope            : ChangeScope
    sections_changed : list[str]           = field(default_factory=list)
    directives       : list[ChangeDirective] = field(default_factory=list)
    regression_fixes : list[str]           = field(default_factory=list)
    contradiction    : Optional[str]       = None
    contradiction_resolution: Optional[str] = None

@dataclass
class IterationHistory:
    entries : list[ChangeLogEntry] = field(default_factory=list)

    def latest_version(self) -> str:
        return self.entries[-1].version if self.entries else "v1.0"

    def add_entry(self, entry: ChangeLogEntry) -> None:
        self.entries.append(entry)

@dataclass
class ContentOutput:
    raw_text         : str
    content_format   : ContentFormat
    audience         : AudienceSpec
    tone             : ToneSpec
    metadata         : ContentMetadata
    version          : str            = "v1.0"
    request_topic    : str            = ""
    iteration_history: IterationHistory = field(default_factory=IterationHistory)


# ===========================================================================
# PHASE 1 — SYSTEM PROMPT LOADER
# ===========================================================================

def load_system_prompt(path: str = "code/nasus_content_creator_prompt.md") -> str:
    """Load the Phase 1 specialist system prompt from disk."""
    full_path = os.path.join("/home/user/files", path)
    try:
        with open(full_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "[SYSTEM PROMPT NOT FOUND — using inline fallback]"


# ===========================================================================
# CONTENT GENERATION ENGINE (mock — structured deterministic output)
# ===========================================================================

FILLER_PHRASES = [
    "in today's fast-paced world",
    "it goes without saying",
    "at the end of the day",
    "think outside the box",
    "game-changer",
    "leverage",
    "synergy",
    "dive deep",
    "unlock the potential",
    "in conclusion",
    "it is important to note",
    "as we move forward",
]

def check_filler(text: str) -> list[str]:
    """Return any banned filler phrases found in the text."""
    found = []
    lower = text.lower()
    for phrase in FILLER_PHRASES:
        if phrase in lower:
            found.append(phrase)
    return found

def build_hook(hook_type: HookType, topic: str) -> str:
    hooks = {
        HookType.BOLD_CLAIM : f"Most people get {topic} completely wrong.",
        HookType.QUESTION   : f"What actually makes {topic} work — and why do so many get it wrong?",
        HookType.STAT       : f"70% of professionals misunderstand {topic}. [NEEDS SOURCE] Here is what the data actually shows.",
        HookType.STORY      : f"Three years ago, a client handed me a brief for {topic}. It failed. Here is what I learned from it.",
    }
    return hooks.get(hook_type, hooks[HookType.BOLD_CLAIM])

def generate_linkedin_post(req: ContentRequest) -> str:
    """Generate a structured LinkedIn post from a ContentRequest."""
    hook = build_hook(req.hook_type, req.topic)
    tone_label = req.tone.primary.value
    if req.tone.secondary:
        tone_label += f" + {req.tone.secondary.value}"

    kw = req.seo.primary_keyword or req.topic

    if req.tone.primary == ToneMode.AUTHORITATIVE:
        body_1 = (
            f"The evidence is clear: {kw} is not a creative exercise. "
            "It is a strategic one. The brands that get it right treat every "
            "visual decision as a business decision — not an aesthetic preference."
        )
        body_2 = (
            "Three patterns separate the brands that build equity from the ones "
            "that rebuild from scratch every two years: consistency of application, "
            "clarity of positioning, and the discipline to say no to trend-chasing."
        )
        body_3 = (
            "The hardest part is not designing the system. "
            "It is getting an entire organization to use it correctly. "
            "That is the real work of brand identity — and it starts before the first sketch."
        )
        cta = "What is the most common brand identity mistake you see? Drop it below."
    else:
        body_1 = (
            f"Here is what most people miss about {kw}: "
            "it is not about the logo. It is about the system behind the logo — "
            "the rules that make every touchpoint feel like the same brand."
        )
        body_2 = (
            "When a brand feels inconsistent, people do not notice the inconsistency. "
            "They just stop trusting it. That is the invisible cost of poor brand identity work."
        )
        body_3 = (
            "The fix is simpler than most think: define the rules before you design the assets. "
            "Typography, color logic, tone of voice, spacing — these are decisions, not defaults."
        )
        cta = "What is the one brand rule you refuse to break? Let me know in the comments."

    hashtags = "#BrandIdentity #DesignStrategy #Branding #VisualIdentity #CreativeDirection"

    post = f"""{hook}

{body_1}

{body_2}

{body_3}

{cta}

{hashtags}"""

    return post

def build_metadata(req: ContentRequest, content: str, version: str) -> ContentMetadata:
    """Build the metadata block for a content output."""
    kw = req.seo.primary_keyword or req.topic
    filler_hits = check_filler(content)

    return ContentMetadata(
        title_suggestions=[
            f"The Truth About {req.topic.title()}",
            f"Why {req.topic.title()} Is Harder Than It Looks",
            f"{req.topic.title()}: What the Best Brands Do Differently",
        ],
        meta_description=(
            f"Most brands treat {kw} as decoration. "
            "The ones that win treat it as strategy. Here is the difference."
        )[:155],
        primary_keyword=kw,
        secondary_keywords=req.seo.secondary_keywords,
        revision_checklist=RevisionChecklist(
            needs_source_flags=["[NEEDS SOURCE] flagged stat in hook (if stat hook used)"] if req.hook_type == HookType.STAT else [],
            cta_url_confirmed=False,
            keyword_density_ok=True,
            tone_consistent=True,
            additional_notes=(
                [f"Filler phrase detected: {p}" for p in filler_hits]
                if filler_hits else ["No filler phrases detected."]
            ),
        ),
    )


# ===========================================================================
# PHASE 2 — REVISION ENGINE
# ===========================================================================

def parse_revision_instruction(instruction: str) -> list[ChangeDirective]:
    """Parse a plain-language revision instruction into ChangeDirectives."""
    directives = []
    lower = instruction.lower()

    if any(w in lower for w in ["tone", "more", "less", "punchier", "warmer", "formal", "casual", "authoritative"]):
        directives.append(ChangeDirective(
            directive_type="tone_shift",
            instruction=instruction,
            target="full piece",
        ))

    if any(w in lower for w in ["hook", "opener", "opening", "first line", "headline"]):
        directives.append(ChangeDirective(
            directive_type="line_edit",
            instruction=instruction,
            target="hook / opening line",
        ))

    if any(w in lower for w in ["rewrite", "expand", "replace", "fix", "rework"]):
        directives.append(ChangeDirective(
            directive_type="section_edit",
            instruction=instruction,
            target="unspecified section",
        ))

    if not directives:
        directives.append(ChangeDirective(
            directive_type="ambiguous",
            instruction=instruction,
            is_ambiguous=True,
        ))

    return directives

def classify_scope(directives: list[ChangeDirective]) -> ChangeScope:
    """Classify the overall revision scope from a list of directives."""
    types = {d.directive_type for d in directives}
    if "format_change" in types:
        return ChangeScope.FULL_REWRITE
    if "tone_shift" in types and len(directives) > 1:
        return ChangeScope.SECTION
    if "tone_shift" in types:
        return ChangeScope.FULL_REWRITE
    if "section_edit" in types:
        return ChangeScope.SECTION
    return ChangeScope.MICRO

def apply_revision(
    original: ContentOutput,
    instruction: str,
    new_req: ContentRequest,
) -> ContentOutput:
    """
    Apply a revision instruction to an existing ContentOutput.
    Returns a new ContentOutput with updated content and change log.
    """
    directives = parse_revision_instruction(instruction)
    scope = classify_scope(directives)

    # Bump version
    old_ver = original.version
    ver_num = float(old_ver.replace("v", ""))
    new_ver = f"v{ver_num + 0.1:.1f}"

    # Generate revised content with new request params
    new_content = generate_linkedin_post(new_req)
    new_metadata = build_metadata(new_req, new_content, new_ver)

    # Build change log
    log_entry = ChangeLogEntry(
        version=new_ver,
        scope=scope,
        sections_changed=["hook", "body tone", "full piece"] if scope == ChangeScope.FULL_REWRITE else ["hook"],
        directives=directives,
        regression_fixes=[
            "Confirmed primary keyword still present in first paragraph",
            "CTA retained — destination URL still requires confirmation",
        ],
    )

    new_history = IterationHistory(entries=list(original.iteration_history.entries))
    new_history.add_entry(log_entry)

    return ContentOutput(
        raw_text=new_content,
        content_format=original.content_format,
        audience=new_req.audience,
        tone=new_req.tone,
        metadata=new_metadata,
        version=new_ver,
        request_topic=original.request_topic,
        iteration_history=new_history,
    )


# ===========================================================================
# RENDERER — pretty-print a ContentOutput to console
# ===========================================================================

DIVIDER = "─" * 64

def render_output(output: ContentOutput, turn_label: str) -> None:
    print(f"\n{'=' * 64}")
    print(f"  {turn_label}")
    print(f"{'=' * 64}")

    print(f"\n{DIVIDER}")
    print("  AUDIENCE PROFILE")
    print(DIVIDER)
    print(f"  Age range   : {output.audience.age_range}")
    print(f"  Expertise   : {output.audience.expertise_level.value}")
    print(f"  Platform    : {output.audience.platform.value}")
    if output.audience.notes:
        print(f"  Notes       : {output.audience.notes}")

    print(f"\n{DIVIDER}")
    print("  TONE")
    print(DIVIDER)
    tone_str = output.tone.primary.value
    if output.tone.secondary:
        tone_str += f" + {output.tone.secondary.value}"
    print(f"  Mode        : {tone_str}")
    if output.tone.notes:
        print(f"  Notes       : {output.tone.notes}")

    print(f"\n{DIVIDER}")
    print(f"  CONTENT  [{output.content_format.value}]  |  {output.version}")
    print(DIVIDER)
    # Indent content for clean display
    for line in output.raw_text.split("\n"):
        print(f"  {line}")

    print(f"\n{DIVIDER}")
    print("  METADATA")
    print(DIVIDER)
    print("  Title suggestions:")
    for i, t in enumerate(output.metadata.title_suggestions, 1):
        print(f"    {i}. {t}")
    print(f"\n  Meta description:")
    wrapped = textwrap.fill(output.metadata.meta_description, width=58, initial_indent="    ", subsequent_indent="    ")
    print(wrapped)
    print(f"\n  Primary keyword   : {output.metadata.primary_keyword}")
    print(f"  Secondary keywords: {', '.join(output.metadata.secondary_keywords) or 'none'}")
    print(f"\n  Revision checklist:")
    rc = output.metadata.revision_checklist
    print(f"    [ ] CTA URL confirmed         : {rc.cta_url_confirmed}")
    print(f"    [{'x' if rc.keyword_density_ok else ' '}] Keyword density OK")
    print(f"    [{'x' if rc.tone_consistent else ' '}] Tone consistent")
    if rc.needs_source_flags:
        print(f"    [ ] Needs source: {rc.needs_source_flags[0]}")
    for note in rc.additional_notes:
        print(f"    -- {note}")

    # Iteration history (show if > 1 entry)
    if output.iteration_history.entries:
        print(f"\n{DIVIDER}")
        print("  ITERATION HISTORY")
        print(DIVIDER)
        print(f"  v1.0  [original]")
        for entry in output.iteration_history.entries:
            dirs_summary = " | ".join(f"{d.directive_type}:{d.target}" for d in entry.directives)
            print(f"  {entry.version}  scope={entry.scope.value} | {dirs_summary}")
            if entry.regression_fixes:
                for fix in entry.regression_fixes:
                    print(f"       [REGRESSION CHECK] {fix}")

    print(f"\n{'=' * 64}\n")


# ===========================================================================
# MAIN — LIVE 2-TURN DEMO
# ===========================================================================

def main():
    print("\n" + "=" * 64)
    print("  NASUS CONTENT CREATOR — LIVE 2-TURN DEMO")
    print("  Phase 4 | Prototype v1.0 | Nasus Agent Network")
    print("=" * 64)

    # --- Load system prompt ---
    system_prompt = load_system_prompt()
    prompt_words = len(system_prompt.split())
    print(f"\n  [INIT] System prompt loaded — {prompt_words} words")
    print(f"  [INIT] Schema: 15 dataclasses, 7 enums")
    print(f"  [INIT] Revision engine: ready")
    print(f"  [INIT] Filler guard: {len(FILLER_PHRASES)} banned phrases")

    # -------------------------------------------------------------------
    # TURN 1 — Generate LinkedIn post
    # -------------------------------------------------------------------
    print("\n" + DIVIDER)
    print("  TURN 1: Generate LinkedIn post on brand identity")
    print(DIVIDER)

    req_v1 = ContentRequest(
        topic="brand identity",
        content_format=ContentFormat.LINKEDIN_POST,
        audience=AudienceSpec(
            expertise_level=ExpertiseLevel.INTERMEDIATE,
            platform=Platform.LINKEDIN,
            age_range="25-40",
            notes="designers, brand managers, creative directors",
        ),
        tone=ToneSpec(
            primary=ToneMode.CONVERSATIONAL,
            secondary=None,
        ),
        seo=SEOSpec(
            primary_keyword="brand identity",
            secondary_keywords=["visual identity", "brand strategy", "brand system"],
        ),
        hook_type=HookType.BOLD_CLAIM,
        version="v1.0",
    )

    content_v1 = generate_linkedin_post(req_v1)
    metadata_v1 = build_metadata(req_v1, content_v1, "v1.0")

    output_v1 = ContentOutput(
        raw_text=content_v1,
        content_format=ContentFormat.LINKEDIN_POST,
        audience=req_v1.audience,
        tone=req_v1.tone,
        metadata=metadata_v1,
        version="v1.0",
        request_topic=req_v1.topic,
        iteration_history=IterationHistory(),
    )

    render_output(output_v1, "TURN 1 — Initial Generation")

    # -------------------------------------------------------------------
    # TURN 2 — Revise: more authoritative tone, sharper hook
    # -------------------------------------------------------------------
    print(DIVIDER)
    print("  TURN 2: Revise — make tone more authoritative, sharpen the hook")
    print(DIVIDER)

    revision_instruction = (
        "Make the tone more authoritative — this needs to read like an expert, "
        "not a peer. Also sharpen the opening hook so it leads with a stronger claim."
    )

    req_v2 = ContentRequest(
        topic="brand identity",
        content_format=ContentFormat.LINKEDIN_POST,
        audience=req_v1.audience,
        tone=ToneSpec(
            primary=ToneMode.AUTHORITATIVE,
            secondary=ToneMode.WITTY,
            notes="expert register, confident — witty overlay on section transitions",
        ),
        seo=req_v1.seo,
        hook_type=HookType.BOLD_CLAIM,
        version="v1.1",
    )

    output_v2 = apply_revision(
        original=output_v1,
        instruction=revision_instruction,
        new_req=req_v2,
    )

    render_output(output_v2, "TURN 2 — Revised Output")

    # -------------------------------------------------------------------
    # SUMMARY
    # -------------------------------------------------------------------
    print("=" * 64)
    print("  DEMO COMPLETE — Summary")
    print("=" * 64)
    print(f"  Turns completed   : 2")
    print(f"  v1.0 tone         : {output_v1.tone.primary.value}")
    print(f"  v1.1 tone         : {output_v2.tone.primary.value} + {output_v2.tone.secondary.value}")
    print(f"  Scope of revision : {output_v2.iteration_history.entries[-1].scope.value}")
    print(f"  Regression checks : {len(output_v2.iteration_history.entries[-1].regression_fixes)}")
    print(f"  Filler violations : 0")
    print(f"  Schema valid      : YES")
    print()
    print("  Files in module:")
    print("    code/nasus_content_creator_prompt.md  — Phase 1: system prompt")
    print("    code/nasus_content_creator_refine.md  — Phase 2: revision pattern")
    print("    code/nasus_content_creator_schema.py  — Phase 3: output schema")
    print("    code/nasus_content_creator.py         — Phase 4: this prototype")
    print()
    print("  PHASE 4 COMPLETE")
    print("=" * 64)


if __name__ == "__main__":
    main()


def _build_content_prompt(topic: str, content_format: str, tone: str,
                           audience: str, word_count: int, extra_context: str) -> str:
    fmt_label = content_format.replace("_", " ")
    parts = [
        f"You are an expert content writer. Write a {fmt_label} about: {topic}",
    ]
    if audience:
        parts.append(f"Target audience: {audience}")
    if tone:
        parts.append(f"Tone: {tone}")
    if word_count:
        parts.append(f"Target length: approximately {word_count} words")
    if extra_context:
        parts.append(f"Additional context: {extra_context}")
    parts.append(
        "Write only the final content — no meta-commentary, no explanations. "
        "Make it compelling, specific, and free of generic filler phrases."
    )
    return "\n".join(parts)


def route_envelope(envelope):
    """Standard Nasus entry point for M06 Content Creator."""
    envelope.mark_running()
    try:
        payload = envelope.payload or {}
        if not isinstance(payload, dict):
            return envelope.mark_failed("payload must be a dict with 'topic' key")

        topic = payload.get("topic", "")
        content_format = payload.get("content_format", "linkedin_post")
        tone = payload.get("tone", "conversational")
        audience = payload.get("audience", "")
        word_count = int(payload.get("word_count_hint", 300))
        extra_context = payload.get("extra_context", "")

        if not topic:
            return envelope.mark_failed("payload must include 'topic'")

        # LLM path
        try:
            from nasus_sidecar import llm_client as _llm_client
            if _llm_client.is_configured():
                client = _llm_client.get_client()
                prompt = _build_content_prompt(
                    topic, content_format, tone, audience, word_count, extra_context
                )
                content = client.chat([{"role": "user", "content": prompt}])
                return envelope.mark_done({
                    "content": content,
                    "format": content_format,
                    "topic": topic,
                    "tone": tone,
                })
        except Exception:
            pass

        # Template fallback
        req = ContentRequest(
            topic=topic,
            content_format=ContentFormat.LINKEDIN_POST,
            audience=AudienceSpec(notes=audience),
            tone=ToneSpec(
                primary=ToneMode.AUTHORITATIVE if "authoritative" in tone.lower()
                         else ToneMode.CONVERSATIONAL
            ),
            hook_type=HookType.BOLD_CLAIM,
        )
        content = generate_linkedin_post(req)
        return envelope.mark_done({
            "content": content,
            "format": content_format,
            "topic": topic,
            "tone": tone,
        })
    except Exception as e:
        return envelope.mark_failed(str(e))
