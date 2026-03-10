"""
Nasus Content Creator — Phase 3: Structured Output Schema
Version: 1.0.0 | Nasus Agent Network

This module defines all data structures used by the Nasus Content Creator
sub-agent for inputs, outputs, revisions, and metadata. These schemas are
used for:
  - Validating content generation requests
  - Enforcing output structure before handoff
  - Enabling downstream agents to parse content reliably
  - Powering the iteration history and change tracking system
"""

from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import List, Optional


# ---------------------------------------------------------------------------
# ContentQASignal -- machine-readable quality signal for M11 QR (GAP-07 fix)
# ---------------------------------------------------------------------------

@dataclass
class ContentQASignal:
    """
    Machine-readable quality signal emitted by M06 for M11 Quality Reviewer.
    (GAP-07 fix: ContentOutput previously had no QR-compatible signal)
    """
    self_score:      float
    checklist_items: List[dict]
    flagged_fields:  List[str]  = field(default_factory=list)
    generated_at:    str        = field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    def __post_init__(self):
        if not (0.0 <= self.self_score <= 1.0):
            raise ValueError(f"ContentQASignal.self_score must be 0.0-1.0, got {self.self_score}")

    def to_dict(self) -> dict:
        return {
            "self_score":      self.self_score,
            "checklist_items": self.checklist_items,
            "flagged_fields":  self.flagged_fields,
            "generated_at":    self.generated_at,
        }


# ---------------------------------------------------------------------------
# ENUMERATIONS
# ---------------------------------------------------------------------------

class Platform(str, Enum):
    """Supported publishing platforms / content destinations."""
    BLOG         = "blog"
    LINKEDIN     = "linkedin"
    TWITTER_X    = "twitter_x"
    NEWSLETTER   = "newsletter"
    YOUTUBE      = "youtube"
    PRODUCT_PAGE = "product_page"


class ExpertiseLevel(str, Enum):
    """Reader expertise level used for audience calibration."""
    BEGINNER     = "beginner"
    INTERMEDIATE = "intermediate"
    EXPERT       = "expert"


class ToneMode(str, Enum):
    """Supported tone modes. Can be stacked (max 2)."""
    PROFESSIONAL  = "professional"
    CONVERSATIONAL= "conversational"
    AUTHORITATIVE = "authoritative"
    WITTY         = "witty"
    EMPATHETIC    = "empathetic"
    MINIMALIST    = "minimalist"
    HYPE          = "hype"


class HookType(str, Enum):
    """Opening hook styles for engagement optimization."""
    QUESTION    = "question"
    STAT        = "stat"
    BOLD_CLAIM  = "bold_claim"
    STORY       = "story"


class ChangeScope(str, Enum):
    """Revision scope classification."""
    MICRO          = "micro"
    SECTION        = "section"
    FULL_REWRITE   = "full_rewrite"


class ContentFormat(str, Enum):
    """Output format — mirrors Platform but used at the content level."""
    BLOG_POST       = "blog_post"
    LINKEDIN_POST   = "linkedin_post"
    TWITTER_THREAD  = "twitter_thread"
    NEWSLETTER      = "newsletter"
    YOUTUBE_SCRIPT  = "youtube_script"
    PRODUCT_PAGE    = "product_page"


# ---------------------------------------------------------------------------
# INPUT SCHEMAS
# ---------------------------------------------------------------------------

@dataclass
class AudienceSpec:
    """
    Explicit or inferred audience profile attached to every request.
    If not provided by caller, Content Creator infers and populates this.
    """
    expertise_level : ExpertiseLevel          = ExpertiseLevel.INTERMEDIATE
    platform        : Platform                = Platform.BLOG
    age_range       : str                     = "25-45"           # e.g. "18-35", "25-50"
    notes           : str                     = ""                 # free-form context


@dataclass
class ToneSpec:
    """
    Tone configuration for a content generation request.
    Primary tone is always set. Secondary is optional (stacking).
    """
    primary   : ToneMode            = ToneMode.CONVERSATIONAL
    secondary : Optional[ToneMode]  = None
    notes     : str                 = ""


@dataclass
class SEOSpec:
    """
    SEO configuration for a content generation request.
    Primary keyword is required. Secondary keywords are optional.
    """
    primary_keyword    : str        = ""
    secondary_keywords : list[str]  = field(default_factory=list)
    meta_description   : str        = ""    # populated in output, optionally seeded here
    target_flesch      : str        = "50-70"


@dataclass
class ContentRequest:
    """
    The top-level input schema for a content generation request.
    This is the object passed into the Content Creator agent.
    """
    # Required
    topic           : str                       # what to write about
    content_format  : ContentFormat             # which format to produce

    # Optional — inferred if not provided
    audience        : AudienceSpec              = field(default_factory=AudienceSpec)
    tone            : ToneSpec                  = field(default_factory=ToneSpec)
    seo             : SEOSpec                   = field(default_factory=SEOSpec)
    hook_type       : HookType                  = HookType.BOLD_CLAIM
    word_count_hint : Optional[int]             = None   # target word count, if specified
    extra_context   : str                       = ""     # any additional instructions
    version         : str                       = "v1.0" # generation version label


# ---------------------------------------------------------------------------
# OUTPUT SCHEMAS
# ---------------------------------------------------------------------------

@dataclass
class AudienceInference:
    """
    The audience profile as inferred (or confirmed) by the agent.
    Always present in the output header.
    """
    age_range       : str
    expertise_level : ExpertiseLevel
    platform        : Platform
    notes           : str = ""
    was_inferred    : bool = True   # False if caller explicitly provided the audience


@dataclass
class ToneDeclaration:
    """
    The tone mode(s) active for the generated content.
    Always present in the output header.
    """
    primary         : ToneMode
    secondary       : Optional[ToneMode] = None
    notes           : str = ""


@dataclass
class ContentSection:
    """
    A single structural section of the content piece.
    Used for blog posts, YouTube scripts, and other multi-section formats.
    """
    heading         : str           # H2 or equivalent label (e.g. "[HOOK]", "Section 1")
    body            : str           # full text of the section
    section_index   : int = 0       # order within the piece (0-indexed)
    b_roll_note     : str = ""      # YouTube only — suggested B-roll visual


@dataclass
class Tweet:
    """A single tweet within a Twitter/X thread."""
    index       : int               # 1-indexed position in thread
    text        : str               # content (max 280 chars enforced at runtime)
    is_hook     : bool = False      # True for tweet 1
    is_cta      : bool = False      # True for final tweet
    char_count  : int = 0           # populated at generation time


@dataclass
class ProductPageCopy:
    """Structured output for product page format."""
    headline            : str
    subheadline         : str
    benefit_bullets     : list[str]         = field(default_factory=list)  # exactly 3
    social_proof        : str               = "[TESTIMONIAL PLACEHOLDER]"
    cta_text            : str               = ""


@dataclass
class NewsletterBlock:
    """Structured output for newsletter section format."""
    subject_line        : str
    preview_text        : str
    body_paragraphs     : list[str]         = field(default_factory=list)
    sign_off            : str               = ""
    cta_text            : str               = ""
    cta_destination     : str               = "[INSERT URL]"


@dataclass
class ContentBody:
    """
    The main content payload. Uses a union-style approach — only the field
    matching the requested ContentFormat will be populated.
    """
    content_format      : ContentFormat
    raw_text            : str                           # full rendered text (always populated)

    # Format-specific structured fields (one will be populated per request)
    sections            : list[ContentSection]  = field(default_factory=list)   # blog, YT script
    tweets              : list[Tweet]           = field(default_factory=list)   # twitter thread
    product_copy        : Optional[ProductPageCopy]     = None                  # product page
    newsletter          : Optional[NewsletterBlock]     = None                  # newsletter

    word_count          : int   = 0
    hook_type_used      : HookType = HookType.BOLD_CLAIM


@dataclass
class RevisionChecklist:
    """
    Per-output checklist of items requiring human review before publishing.
    Populated automatically by the agent; humans check off items.
    """
    needs_source_flags      : list[str] = field(default_factory=list)  # list of flagged stats
    cta_url_confirmed       : bool      = False
    keyword_density_ok      : bool      = True
    tone_consistent         : bool      = True
    format_deviations       : list[str] = field(default_factory=list)  # any format changes noted
    additional_notes        : list[str] = field(default_factory=list)  # free-form reviewer notes


@dataclass
class ContentMetadata:
    """
    SEO and publishing metadata block. Always appended to output.
    """
    title_suggestions   : list[str]         = field(default_factory=list)  # exactly 3
    meta_description    : str               = ""     # max 155 chars
    primary_keyword     : str               = ""
    secondary_keywords  : list[str]         = field(default_factory=list)
    revision_checklist  : RevisionChecklist = field(default_factory=RevisionChecklist)


@dataclass
class ContentOutput:
    """
    The complete output object returned by Nasus Content Creator.
    This is the canonical response schema — all downstream consumers
    should expect this structure.
    """
    # Header
    audience        : AudienceInference
    tone            : ToneDeclaration

    # Content
    content         : ContentBody

    # Metadata
    metadata        : ContentMetadata

    # Versioning
    version         : str = "v1.0"
    request_topic   : str = ""

    # QA signal for M11 Quality Reviewer (GAP-07 fix)
    qa_signal       : Optional[ContentQASignal] = None


# ---------------------------------------------------------------------------
# REVISION SCHEMAS (Phase 2 data structures)
# ---------------------------------------------------------------------------

@dataclass
class ChangeDirective:
    """
    A single parsed change instruction from a revision request.
    Multiple directives can exist in one revision request.
    """
    directive_type  : str           # "tone_shift", "section_edit", "line_edit",
                                    # "addition", "deletion", "format_change", "seo_adjustment"
    instruction     : str           # verbatim instruction text
    target          : str = ""      # which section/element is targeted (if known)
    is_ambiguous    : bool = False  # True if the instruction could not be clearly parsed


@dataclass
class ChangeLogEntry:
    """
    A record of what changed in a single revision pass.
    Appended to the iteration history.
    """
    version         : str                           # e.g. "v1.1"
    scope           : ChangeScope
    sections_changed: list[str]                     = field(default_factory=list)
    directives      : list[ChangeDirective]         = field(default_factory=list)
    regression_fixes: list[str]                     = field(default_factory=list)  # silent fixes
    contradiction   : Optional[str]                 = None   # description if conflict detected
    contradiction_resolution: Optional[str]         = None


@dataclass
class IterationHistory:
    """
    Full audit trail of all generation and revision passes for a content piece.
    Never deleted — only appended to.
    """
    entries         : list[ChangeLogEntry]          = field(default_factory=list)

    def latest_version(self) -> str:
        """Return the version label of the most recent entry."""
        if not self.entries:
            return "v1.0"
        return self.entries[-1].version

    def add_entry(self, entry: ChangeLogEntry) -> None:
        """Append a new change log entry."""
        self.entries.append(entry)


@dataclass
class RevisionRequest:
    """
    The input schema for a revision request.
    Wraps the original ContentOutput plus the new instructions.
    """
    original_output     : ContentOutput
    revision_version    : str                       # which version to revise (e.g. "v1.0")
    directives          : list[ChangeDirective]
    scope_hint          : Optional[ChangeScope]     = None
    preserve            : list[str]                 = field(default_factory=list)
    raw_instruction     : str                       = ""    # original free-form text


@dataclass
class RevisionOutput:
    """
    The complete output of a revision pass.
    Wraps the updated ContentOutput with change tracking.
    """
    updated_output      : ContentOutput
    change_log          : ChangeLogEntry
    iteration_history   : IterationHistory
    previous_version    : str       = "v1.0"
    new_version         : str       = "v1.1"


# ---------------------------------------------------------------------------
# VALIDATION HELPERS
# ---------------------------------------------------------------------------

def validate_content_request(req: ContentRequest) -> list[str]:
    """
    Run basic validation on a ContentRequest before sending to the agent.
    Returns a list of error strings (empty list = valid).
    """
    errors = []

    if not req.topic.strip():
        errors.append("topic is required and cannot be empty")

    if req.tone.primary == req.tone.secondary:
        errors.append("tone primary and secondary cannot be the same mode")

    incompatible_pairs = [
        (ToneMode.MINIMALIST, ToneMode.HYPE),
        (ToneMode.HYPE, ToneMode.MINIMALIST),
    ]
    if req.tone.secondary and (req.tone.primary, req.tone.secondary) in incompatible_pairs:
        errors.append(
            f"tone combination '{req.tone.primary}' + '{req.tone.secondary}' is incompatible — "
            "choose one or the other"
        )

    if req.seo.primary_keyword and len(req.seo.meta_description) > 155:
        errors.append("meta_description exceeds 155 character limit")

    if req.word_count_hint is not None and req.word_count_hint < 50:
        errors.append("word_count_hint below 50 is not a valid content piece")

    return errors


def validate_tweet_length(tweet: Tweet) -> bool:
    """Check that a tweet body does not exceed 280 characters."""
    return len(tweet.text) <= 280


def validate_product_copy(copy: ProductPageCopy) -> list[str]:
    """Validate product page copy structure."""
    errors = []
    if len(copy.benefit_bullets) != 3:
        errors.append(f"product page requires exactly 3 benefit bullets, got {len(copy.benefit_bullets)}")
    if len(copy.headline.split()) > 10:
        errors.append("product page headline exceeds 10-word limit")
    if len(copy.subheadline.split()) > 20:
        errors.append("product page subheadline exceeds 20-word limit")
    return errors


def validate_newsletter(nl: NewsletterBlock) -> list[str]:
    """Validate newsletter block constraints."""
    errors = []
    if len(nl.subject_line) > 50:
        errors.append(f"subject_line exceeds 50 chars ({len(nl.subject_line)})")
    if len(nl.preview_text) > 90:
        errors.append(f"preview_text exceeds 90 chars ({len(nl.preview_text)})")
    return errors


# ---------------------------------------------------------------------------
# EXAMPLE INSTANTIATION (smoke test)
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    # Build a sample request
    req = ContentRequest(
        topic="Why most brand redesigns fail before they launch",
        content_format=ContentFormat.BLOG_POST,
        audience=AudienceSpec(
            expertise_level=ExpertiseLevel.INTERMEDIATE,
            platform=Platform.BLOG,
            age_range="25-40",
        ),
        tone=ToneSpec(
            primary=ToneMode.AUTHORITATIVE,
            secondary=ToneMode.WITTY,
        ),
        seo=SEOSpec(
            primary_keyword="brand redesign failure",
            secondary_keywords=["rebranding mistakes", "brand identity process"],
        ),
        hook_type=HookType.BOLD_CLAIM,
        word_count_hint=1200,
    )

    errors = validate_content_request(req)

    print("=== ContentRequest Smoke Test ===")
    print(f"Topic         : {req.topic}")
    print(f"Format        : {req.content_format.value}")
    print(f"Audience      : {req.audience.expertise_level.value} / {req.audience.platform.value}")
    print(f"Tone          : {req.tone.primary.value} + {req.tone.secondary.value if req.tone.secondary else 'none'}")
    print(f"Primary KW    : {req.seo.primary_keyword}")
    print(f"Hook type     : {req.hook_type.value}")
    print(f"Word hint     : {req.word_count_hint}")
    print(f"Validation    : {'PASS' if not errors else 'FAIL — ' + str(errors)}")
    print()

    # Build a sample output stub
    output = ContentOutput(
        audience=AudienceInference(
            age_range="25-40",
            expertise_level=ExpertiseLevel.INTERMEDIATE,
            platform=Platform.BLOG,
            was_inferred=False,
        ),
        tone=ToneDeclaration(
            primary=ToneMode.AUTHORITATIVE,
            secondary=ToneMode.WITTY,
        ),
        content=ContentBody(
            content_format=ContentFormat.BLOG_POST,
            raw_text="[generated content would appear here]",
            sections=[
                ContentSection(heading="Why Redesigns Die on the Whiteboard", body="...", section_index=0),
                ContentSection(heading="The Three Failure Patterns", body="...", section_index=1),
                ContentSection(heading="What a Successful Rebrand Actually Looks Like", body="...", section_index=2),
            ],
            word_count=1200,
            hook_type_used=HookType.BOLD_CLAIM,
        ),
        metadata=ContentMetadata(
            title_suggestions=[
                "Why Most Brand Redesigns Fail Before They Launch",
                "The Hidden Reasons Brand Redesigns Collapse",
                "Brand Redesign Failure: What No One Tells You",
            ],
            meta_description="Most brand redesigns fail before a single pixel ships. Here are the three patterns that kill them — and how to avoid each one.",
            primary_keyword="brand redesign failure",
            secondary_keywords=["rebranding mistakes", "brand identity process"],
            revision_checklist=RevisionChecklist(
                needs_source_flags=["83% of rebrands see engagement drop [NEEDS SOURCE]"],
                cta_url_confirmed=False,
                keyword_density_ok=True,
                tone_consistent=True,
            ),
        ),
        version="v1.0",
        request_topic=req.topic,
    )

    print("=== ContentOutput Stub ===")
    print(f"Version       : {output.version}")
    print(f"Audience      : {output.audience.expertise_level.value} / {output.audience.platform.value}")
    print(f"Tone active   : {output.tone.primary.value} + {output.tone.secondary.value if output.tone.secondary else 'none'}")
    print(f"Sections      : {len(output.content.sections)}")
    print(f"Word count    : {output.content.word_count}")
    print(f"Title opts    : {len(output.metadata.title_suggestions)}")
    print(f"Needs source  : {output.metadata.revision_checklist.needs_source_flags}")
    print()
    print("PHASE 3 COMPLETE")

__all__ = [
    # Enums
    "Platform", "ExpertiseLevel", "ToneMode", "HookType", "ChangeScope", "ContentFormat",
    # Dataclasses
    "ContentQASignal",
    "AudienceSpec", "ToneSpec", "SEOSpec", "ContentRequest",
    "AudienceInference", "ToneDeclaration", "ContentSection",
    "Tweet", "ProductPageCopy", "NewsletterBlock", "ContentBody",
    "RevisionChecklist", "ContentMetadata", "ContentOutput",
    "ChangeDirective", "ChangeLogEntry", "IterationHistory",
    "RevisionRequest", "RevisionOutput",
]
