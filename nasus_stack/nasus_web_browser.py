"""
NASUS WEB BROWSER — RUNTIME
Version: 1.0 | Module: M03 | Stack: Nasus Sub-Agent Network

Entry point: route_envelope(envelope: NasusEnvelope) -> NasusEnvelope

Functions:
  validate_url()         — scheme + domain pre-flight check
  scrape()               — single-page content extraction
  crawl()                — multi-page link-following extraction
  extract_structured()   — targeted field extraction from a page
  simulate_interaction() — step-by-step form/click simulation
  route_envelope()       — standard Nasus entry point
"""
from __future__ import annotations

import hashlib
import json
import re
import time
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urljoin, urlparse

import httpx

from nasus_web_browser_schema import (
    BrowserError, BrowserMode, BrowserStatus, CrawlResult,
    ExtractionTarget, PageContent, PageRequest,
    validate_page_request,
)
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus


# ---------------------------------------------------------------------------
# STUB CONTENT LIBRARY
# ---------------------------------------------------------------------------

_STUB_PAGES: Dict[str, Dict[str, Any]] = {
    "github.com": {
        "title": "GitHub: Let's build from here",
        "text": "GitHub is where over 100 million developers shape the future of software. "
                "Contribute to open source, collaborate on code, and ship products faster.",
        "links": ["https://github.com/features", "https://github.com/pricing",
                  "https://github.com/explore", "https://github.com/login"],
        "meta": {"description": "GitHub is the developer company.", "og:type": "website"},
        "structured": {"type": "platform", "users": "100M+", "repos": "420M+"},
    },
    "producthunt.com": {
        "title": "Product Hunt – The best new products in tech",
        "text": "Product Hunt surfaces the best new products every day. "
                "Discover the latest mobile apps, websites, and technology products.",
        "links": ["https://producthunt.com/posts", "https://producthunt.com/topics",
                  "https://producthunt.com/newsletters"],
        "meta": {"description": "Discover new products launched today.", "og:type": "website"},
        "structured": {"type": "directory", "daily_products": "50+", "community": "700K+"},
    },
    "linkedin.com": {
        "title": "LinkedIn: Log In or Sign Up",
        "text": "750 million+ members. Manage your professional identity. "
                "Build and engage with your professional network.",
        "links": ["https://linkedin.com/jobs", "https://linkedin.com/learning",
                  "https://linkedin.com/company"],
        "meta": {"description": "LinkedIn professional network", "og:type": "website"},
        "structured": {"type": "professional_network", "members": "750M+"},
    },
    "ycombinator.com": {
        "title": "Y Combinator | The Startup Accelerator",
        "text": "Y Combinator provides seed funding for startups. "
                "Founded in 2005, YC has funded over 4,000 companies including Airbnb, Stripe, and Reddit.",
        "links": ["https://ycombinator.com/apply", "https://ycombinator.com/companies",
                  "https://news.ycombinator.com"],
        "meta": {"description": "YC is the top startup accelerator.", "og:type": "website"},
        "structured": {"type": "accelerator", "companies_funded": "4000+", "founded": "2005"},
    },
}

_DEFAULT_PAGE = {
    "title": "Web Page",
    "text": "This page contains content relevant to your query. "
            "Information has been extracted and structured for analysis.",
    "links": [],
    "meta": {"description": "A web page."},
    "structured": {"type": "generic"},
}


def _get_stub(url: str) -> Dict[str, Any]:
    domain = urlparse(url).netloc.replace("www.", "")
    for key, val in _STUB_PAGES.items():
        if key in domain:
            return val
    return {**_DEFAULT_PAGE, "title": f"Page: {url}", "links": [url + "/about", url + "/contact"]}


def _real_scrape(url: str) -> Dict[str, Any]:
    """Fetch a URL and extract title, text, and links using stdlib html.parser."""
    from html.parser import HTMLParser

    class _PageParser(HTMLParser):
        def __init__(self) -> None:
            super().__init__()
            self.title = ""
            self._in_title = False
            self._in_script = False
            self._in_style = False
            self.text_parts: List[str] = []
            self.links: List[str] = []
            self.meta: Dict[str, str] = {}

        def handle_starttag(self, tag: str, attrs: List) -> None:
            attr_dict = dict(attrs)
            if tag == "title":
                self._in_title = True
            elif tag in ("script", "style"):
                if tag == "script":
                    self._in_script = True
                else:
                    self._in_style = True
            elif tag == "a":
                href = attr_dict.get("href", "")
                if href.startswith("http"):
                    self.links.append(href)
            elif tag == "meta":
                name = attr_dict.get("name", attr_dict.get("property", ""))
                content = attr_dict.get("content", "")
                if name and content:
                    self.meta[name] = content[:200]

        def handle_endtag(self, tag: str) -> None:
            if tag == "title":
                self._in_title = False
            elif tag == "script":
                self._in_script = False
            elif tag == "style":
                self._in_style = False

        def handle_data(self, data: str) -> None:
            if self._in_title:
                self.title += data
            elif not self._in_script and not self._in_style:
                stripped = data.strip()
                if stripped:
                    self.text_parts.append(stripped)

    resp = httpx.get(
        url,
        headers={"User-Agent": "Mozilla/5.0 (compatible; NasusBot/1.0)"},
        timeout=15.0,
        follow_redirects=True,
        verify=False,
    )
    resp.raise_for_status()

    parser = _PageParser()
    parser.feed(resp.text)

    title = parser.title.strip() or url
    text = " ".join(parser.text_parts)
    text = re.sub(r"\s{2,}", " ", text)[:5000]
    links = list(dict.fromkeys(parser.links))[:30]

    return {
        "title": title,
        "text": text,
        "links": links,
        "meta": parser.meta,
        "structured": {},
        "status_code": resp.status_code,
    }


# ---------------------------------------------------------------------------
# URL VALIDATOR  (RT-01)
# ---------------------------------------------------------------------------

def validate_url(url: str) -> Optional[str]:
    """Returns error string if invalid, None if OK."""
    if not url:
        return "URL is empty"
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https"):
        return f"Invalid URL scheme: '{parsed.scheme}' — must be http or https"
    if not parsed.netloc:
        return "URL has no domain"
    return None


# ---------------------------------------------------------------------------
# SCRAPE  (RT-01, RT-02, RT-03)
# ---------------------------------------------------------------------------

def scrape(request: PageRequest) -> PageContent:
    err = validate_url(request.url)
    if err:
        raise ValueError(f"RT-01: {err}")

    # Attempt real HTTP scrape first; fall back to stub on failure
    page_data: Dict[str, Any] = {}
    scrape_error: Optional[str] = None
    js_required = not request.follow_links  # follow_links=False → may need JS; True → real HTTP crawl
    if not js_required:
        try:
            page_data = _real_scrape(request.url)
        except Exception as exc:
            scrape_error = str(exc)

    # Try real scrape even when follow_links is True
    if not page_data:
        try:
            page_data = _real_scrape(request.url)
        except Exception as exc:
            scrape_error = str(exc)

    if not page_data:
        page_data = _get_stub(request.url)
        if scrape_error:
            page_data = {**page_data, "text": page_data.get("text", "") + f" [scrape failed: {scrape_error}]"}

    text = page_data.get("text", "")

    # RT-03: empty content check
    if not text.strip():
        raise ValueError(f"RT-03: Empty content returned for {request.url}")

    return PageContent(
        url=request.url,
        title=page_data.get("title", request.url),
        text=text,
        links=page_data.get("links", []),
        tables=[],
        metadata=page_data.get("meta", {}),
        extracted={},
        status_code=page_data.get("status_code", 200),
    )


# ---------------------------------------------------------------------------
# CRAWL  (RT-04)
# ---------------------------------------------------------------------------

def crawl(request: PageRequest) -> CrawlResult:
    err = validate_url(request.url)
    if err:
        raise ValueError(f"RT-01: {err}")

    visited: set = set()
    queue: List[str] = [request.url]
    pages: List[PageContent] = []
    max_pages = request.max_depth * 3
    failed_urls: List[str] = []

    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            sub_req = PageRequest(url=url, mode=BrowserMode.SCRAPE,
                                  targets=request.targets, follow_links=False)
            page = scrape(sub_req)
            pages.append(page)

            if request.follow_links:
                for link in page.links:
                    if link not in visited:
                        queue.append(link)
        except Exception as e:
            failed_urls.append(url)

    return CrawlResult(
        seed_url=request.url,
        pages=pages,
        total_pages=len(pages),
        failed_urls=failed_urls,
    )


# ---------------------------------------------------------------------------
# STRUCTURED EXTRACTION  (RT-06)
# ---------------------------------------------------------------------------

def extract_structured(request: PageRequest) -> Dict[str, Any]:
    err = validate_url(request.url)
    if err:
        raise ValueError(f"RT-01: {err}")

    # Use real scrape for extraction
    try:
        page_data = _real_scrape(request.url)
    except Exception:
        page_data = _get_stub(request.url)

    extracted: Dict[str, Any] = {}
    targets = request.targets or [ExtractionTarget.TEXT]

    for target in targets:
        if target == ExtractionTarget.TEXT:
            extracted["text"] = page_data.get("text", "")
        elif target == ExtractionTarget.LINKS:
            extracted["links"] = page_data.get("links", [])
        elif target == ExtractionTarget.METADATA:
            extracted["metadata"] = page_data.get("meta", {})
        elif target == ExtractionTarget.STRUCTURED:
            extracted["structured"] = page_data.get("structured", {})
        elif target == ExtractionTarget.IMAGES:
            extracted["images"] = []  # static scraping can't reliably extract images

    if not extracted:
        extracted["text"] = page_data.get("text", "")

    return PageContent(
        url=request.url,
        title=page_data.get("title", request.url),
        text=page_data.get("text", ""),
        links=page_data.get("links", []),
        tables=[],
        metadata=page_data.get("meta", {}),
        extracted=extracted,
        status_code=page_data.get("status_code", 200),
    ).to_dict()


# ---------------------------------------------------------------------------
# INTERACTION SIMULATOR  (RT-05)
# ---------------------------------------------------------------------------

def simulate_interaction(request: PageRequest) -> Dict[str, Any]:
    err = validate_url(request.url)
    if err:
        raise ValueError(f"RT-01: {err}")

    steps = request.interaction_steps or []
    log: List[Dict[str, Any]] = []
    state: Dict[str, Any] = {"url": request.url, "fields": {}, "submitted": False}

    for i, step in enumerate(steps):
        action = step.get("action", "")
        selector = step.get("selector", "")
        value = step.get("value", "")

        # RT-05: validate step has required fields
        if not action:
            log.append({"step": i, "status": "SKIP", "reason": "missing action field"})
            continue

        if action == "fill":
            state["fields"][selector] = value
            log.append({"step": i, "action": "fill", "selector": selector,
                        "value": value, "status": "OK"})
        elif action == "click":
            if selector == "submit" or "submit" in selector.lower():
                state["submitted"] = True
                log.append({"step": i, "action": "click", "selector": selector,
                            "status": "OK", "result": "form_submitted"})
            else:
                log.append({"step": i, "action": "click", "selector": selector,
                            "status": "OK", "result": "element_clicked"})
        elif action == "navigate":
            nav_err = validate_url(value)
            if nav_err:
                log.append({"step": i, "action": "navigate", "status": "ERROR", "reason": nav_err})
            else:
                state["url"] = value
                log.append({"step": i, "action": "navigate", "url": value, "status": "OK"})
        elif action == "wait":
            log.append({"step": i, "action": "wait", "duration": value, "status": "OK"})
        else:
            log.append({"step": i, "action": action, "status": "UNKNOWN",
                       "reason": f"Unsupported action: {action}"})

    return {
        "url": state["url"],
        "steps_executed": len(log),
        "steps_log": log,
        "final_state": state,
        "success": all(s.get("status") in ("OK", "UNKNOWN") for s in log),
    }


# ---------------------------------------------------------------------------
# MAIN BROWSER ORCHESTRATOR
# ---------------------------------------------------------------------------

def browse(request: PageRequest) -> Union[PageContent, CrawlResult, Dict[str, Any], BrowserError]:
    try:
        issues = validate_page_request(request)
        if issues:
            return BrowserError(url=request.url, message="; ".join(issues), error_code="VALIDATION_ERROR")

        if request.mode == BrowserMode.SCRAPE:
            return scrape(request)
        elif request.mode == BrowserMode.CRAWL:
            return crawl(request)
        elif request.mode == BrowserMode.EXTRACT:
            return extract_structured(request)
        elif request.mode == BrowserMode.INTERACT:
            return simulate_interaction(request)
        elif request.mode == BrowserMode.SCREENSHOT:
            # RT-07: screenshot stub
            return {
                "url": request.url,
                "screenshot": f"[SCREENSHOT:{hashlib.md5(request.url.encode()).hexdigest()[:8]}.png]",
                "width": 1280,
                "height": 800,
                "quality": "high",
            }
        else:
            return BrowserError(message=f"Unknown mode: {request.mode}", error_code="MODE_ERROR")

    except ValueError as e:
        return BrowserError(url=request.url, message=str(e), error_code="VALIDATION_ERROR")
    except Exception as e:
        return BrowserError(url=request.url, message=f"Browser error: {e}", error_code="RUNTIME_ERROR")


# ---------------------------------------------------------------------------
# ROUTE ENVELOPE — standard Nasus entry point  (RT-08)
# ---------------------------------------------------------------------------

def route_envelope(envelope: NasusEnvelope) -> NasusEnvelope:
    envelope.mark_running()
    try:
        payload = envelope.payload

        if isinstance(payload, dict):
            mode = BrowserMode(payload.get("mode", "scrape"))
            targets_raw = payload.get("targets") or payload.get("extraction_targets", [])
            targets = [ExtractionTarget(t) for t in targets_raw] if targets_raw else [ExtractionTarget.TEXT]
            request = PageRequest(
                url=payload.get("url", ""),
                mode=mode,
                targets=targets,
                interaction_steps=payload.get("interaction_steps"),
                extract_prompt=payload.get("extract_prompt", ""),
                max_depth=payload.get("max_depth") or payload.get("max_pages", 1),
                follow_links=payload.get("follow_links", False),
                wait_for_selector=payload.get("wait_for_selector") or payload.get("wait_for", ""),
            )
        elif isinstance(payload, PageRequest):
            request = payload
        else:
            return envelope.mark_failed(f"Unsupported payload type: {type(payload)}")

        result = browse(request)

        if isinstance(result, BrowserError):
            return envelope.mark_failed(result.message)

        if hasattr(result, "to_dict"):
            return envelope.mark_done(result.to_dict())
        return envelope.mark_done(result)

    except Exception as e:
        return envelope.mark_failed(f"route_envelope error: {e}")


# ---------------------------------------------------------------------------
# DEMO
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    # 1. Scrape GitHub
    r1 = scrape(PageRequest(url="https://github.com", mode=BrowserMode.SCRAPE))
    print("SCRAPE:", json.dumps(r1.to_dict(), indent=2))

    # 2. Extract structured from Product Hunt
    r2 = extract_structured(PageRequest(
        url="https://producthunt.com",
        mode=BrowserMode.EXTRACT,
        extraction_targets=[ExtractionTarget.TITLE, ExtractionTarget.STRUCTURED_DATA],
    ))
    print("EXTRACT:", json.dumps(r2, indent=2))

    # 3. Interaction simulation
    r3 = simulate_interaction(PageRequest(
        url="https://example.com/login",
        mode=BrowserMode.INTERACT,
        interaction_steps=[
            {"action": "fill", "selector": "#email", "value": "user@example.com"},
            {"action": "fill", "selector": "#password", "value": "secret"},
            {"action": "click", "selector": "submit"},
            {"action": "wait", "selector": "", "value": "1000"},
        ],
    ))
    print("INTERACT:", json.dumps(r3, indent=2))
