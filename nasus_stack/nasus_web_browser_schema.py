"""
nasus_web_browser_schema.py
Nasus M03 Web Browser — Schema Definitions
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum
from typing import Any, Dict, List, Optional


# ---------------------------------------------------------------------------
# Registry imports (Nasus shared contracts)
# ---------------------------------------------------------------------------
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus  # noqa: F401

# ---------------------------------------------------------------------------
# Module identity
# ---------------------------------------------------------------------------
MODULE_ID: ModuleID = "M03"
MODULE_NAME: str = "Web Browser"
MODULE_CAPABILITIES: List[str] = [
    "page scraping",
    "form filling",
    "JS-heavy sites",
    "screenshot",
]


# ---------------------------------------------------------------------------
# Enumerations
# ---------------------------------------------------------------------------

class BrowseMode(str, Enum):
    """Operating mode for a browser request."""
    SCRAPE     = "scrape"      # Single-page content extraction
    CRAWL      = "crawl"       # Multi-page link-following extraction
    EXTRACT    = "extract"     # AI-assisted structured data extraction
    INTERACT   = "interact"    # Fill forms / click elements / navigate
    SCREENSHOT = "screenshot"  # Capture visual snapshot of a page


class ExtractionTarget(str, Enum):
    """What content to pull from a page."""
    TEXT       = "text"        # Visible readable text
    LINKS      = "links"       # All anchor href values
    IMAGES     = "images"      # img src values + alt text
    TABLES     = "tables"      # Tabular data as list[dict]
    FORMS      = "forms"       # Form fields, names, types
    METADATA   = "metadata"    # <meta> tags, Open Graph, JSON-LD
    STRUCTURED = "structured"  # AI-guided structured extraction


class BrowserStatus(str, Enum):
    """Lifecycle status of a browser operation."""
    PENDING    = "pending"     # Request queued, not yet started
    LOADING    = "loading"     # Page fetch in progress
    EXTRACTING = "extracting"  # Content parsing / AI extraction
    DONE       = "done"        # Successfully completed
    FAILED     = "failed"      # Unrecoverable error
    BLOCKED    = "blocked"     # Bot detection / CAPTCHA / 403


# ---------------------------------------------------------------------------
# Request dataclass
# ---------------------------------------------------------------------------

@dataclass
class PageRequest:
    """
    A single browsing job dispatched to M03.

    Attributes
    ----------
    url : str
        Fully-qualified URL to browse (must include scheme).
    mode : BrowseMode
        What kind of operation to perform.
    targets : List[ExtractionTarget]
        Which content types to extract from the page.
    interaction_steps : List[dict], optional
        Sequence of browser actions for INTERACT mode.
        Each step is a dict with keys: action, selector, value (optional).
        Supported actions: "click", "fill", "select", "wait", "scroll", "hover".
        Example: [{"action": "fill", "selector": "#email", "value": "user@example.com"},
                  {"action": "click", "selector": "#submit"}]
    extract_prompt : str
        Natural-language prompt passed to the AI extractor in EXTRACT/STRUCTURED mode.
    max_depth : int
        Maximum link-following depth for CRAWL mode (default 1 = seed page only).
    follow_links : bool
        Whether to follow links discovered on the page (CRAWL mode toggle).
    wait_for_selector : str
        CSS selector to wait for before extracting (useful for JS-rendered content).
        Empty string means no wait — extract immediately after load.
    """

    url: str
    mode: BrowseMode
    targets: List[ExtractionTarget]
    interaction_steps: Optional[List[Dict[str, Any]]] = field(default=None)
    extract_prompt: str = ""
    max_depth: int = 1
    follow_links: bool = False
    wait_for_selector: str = ""

    def __post_init__(self) -> None:
        if not self.url:
            raise ValueError("PageRequest.url must not be empty.")
        if not self.targets:
            raise ValueError("PageRequest.targets must contain at least one ExtractionTarget.")
        if self.max_depth < 1:
            raise ValueError("PageRequest.max_depth must be >= 1.")


# ---------------------------------------------------------------------------
# Result dataclasses
# ---------------------------------------------------------------------------

@dataclass
class PageContent:
    """
    Extracted content from a single browsed page.

    Attributes
    ----------
    url : str
        The actual URL after any redirects.
    title : str
        Page <title> text.
    text : str
        Cleaned visible text content.
    links : List[str]
        All unique hrefs found on the page.
    tables : List[dict]
        Tables as list of row-dicts keyed by column header.
    metadata : dict
        Meta tags, Open Graph properties, JSON-LD blobs, etc.
    extracted : Any
        AI-structured extraction result (STRUCTURED/EXTRACT mode).
    status_code : int
        HTTP response status code (0 if unknown / JS-only).
    """

    url: str
    title: str
    text: str
    links: List[str]
    tables: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    extracted: Any
    status_code: int

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "title": self.title,
            "text": self.text,
            "links": self.links,
            "tables": self.tables,
            "metadata": self.metadata,
            "extracted": self.extracted,
            "status_code": self.status_code,
        }


@dataclass
class CrawlResult:
    """
    Aggregated result from a multi-page crawl.

    Attributes
    ----------
    seed_url : str
        The original URL the crawl started from.
    pages : List[PageContent]
        All successfully extracted pages.
    total_pages : int
        Count of pages attempted (success + failure).
    failed_urls : List[str]
        URLs that could not be fetched or parsed.
    """

    seed_url: str
    pages: List[PageContent]
    total_pages: int
    failed_urls: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "seed_url": self.seed_url,
            "pages": [p.to_dict() for p in self.pages],
            "total_pages": self.total_pages,
            "failed_urls": self.failed_urls,
        }


@dataclass
class BrowserError:
    """
    Structured error from a failed browser operation.

    Error codes
    -----------
    URL_INVALID      -- URL failed format or reachability check
    BLOCKED          -- 403, CAPTCHA, or bot-detection triggered
    TIMEOUT          -- Page or selector wait exceeded limit
    NOT_FOUND        -- HTTP 404
    JS_ERROR         -- JavaScript runtime error prevented render
    EXTRACTION_EMPTY -- Page loaded but no content matched targets
    INTERACTION_FAIL -- An interaction step could not be executed
    UNKNOWN          -- Catch-all for unclassified errors
    """

    url: str
    error_code: str
    message: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "url": self.url,
            "error_code": self.error_code,
            "message": self.message,
        }


# ---------------------------------------------------------------------------
# Output validator
# ---------------------------------------------------------------------------

def validate_browser_output(result: Any) -> List[str]:
    """
    Validate a browser operation result and return a list of issue strings.
    An empty list means the result is valid.

    Checks performed
    ----------------
    - Result is one of the known output types.
    - PageContent: url non-empty, status_code reasonable, at least one field populated.
    - CrawlResult: pages list non-empty, total_pages consistent.
    - BrowserError: error_code and message both non-empty.
    """
    issues: List[str] = []

    if isinstance(result, BrowserError):
        if not result.error_code:
            issues.append("BrowserError.error_code is empty.")
        if not result.message:
            issues.append("BrowserError.message is empty.")
        return issues

    if isinstance(result, PageContent):
        if not result.url:
            issues.append("PageContent.url is empty.")
        if result.status_code not in range(100, 600) and result.status_code != 0:
            issues.append(
                f"PageContent.status_code {result.status_code} is out of range."
            )
        has_content = (
            bool(result.text)
            or bool(result.links)
            or bool(result.tables)
            or bool(result.metadata)
            or result.extracted is not None
        )
        if not has_content:
            issues.append(
                "PageContent has no extracted content in any field "
                "(possible EXTRACTION_EMPTY)."
            )
        return issues

    if isinstance(result, CrawlResult):
        if not result.seed_url:
            issues.append("CrawlResult.seed_url is empty.")
        if not result.pages:
            issues.append("CrawlResult.pages list is empty — crawl returned no content.")
        if result.total_pages < len(result.pages):
            issues.append(
                f"CrawlResult.total_pages ({result.total_pages}) is less than "
                f"len(pages) ({len(result.pages)}) — inconsistent count."
            )
        return issues

    issues.append(
        f"Unknown result type: {type(result).__name__}. "
        "Expected PageContent, CrawlResult, or BrowserError."
    )
    return issues


# ---------------------------------------------------------------------------
# Compatibility aliases (nasus_web_browser.py v1 uses these names)
# ---------------------------------------------------------------------------

BrowserMode = BrowseMode


def validate_page_request(req: "PageRequest") -> List[str]:
    """Validate a PageRequest and return a list of issue strings. Empty = valid."""
    from typing import List as _List
    issues: _List[str] = []
    if not req.url or not req.url.strip():
        issues.append("PageRequest.url is empty")
    return issues
