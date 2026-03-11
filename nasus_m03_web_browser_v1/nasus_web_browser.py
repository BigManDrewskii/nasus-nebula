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

    stub = _get_stub(request.url)
    text = stub["text"]

    # RT-02: JS fallback flag
    js_required = "javascript" in text.lower() or request.js_required
    js_note = " [JS rendering simulated]" if js_required else ""

    # RT-03: empty content check
    if not text.strip():
        raise ValueError(f"RT-03: Empty content returned for {request.url}")

    return PageContent(
        url=request.url,
        title=stub["title"],
        text=text + js_note,
        links=stub.get("links", []),
        meta=stub.get("meta", {}),
        status_code=200,
        success=True,
    )


# ---------------------------------------------------------------------------
# CRAWL  (RT-04)
# ---------------------------------------------------------------------------

def crawl(request: PageRequest, max_pages: int = 5) -> CrawlResult:
    err = validate_url(request.url)
    if err:
        raise ValueError(f"RT-01: {err}")

    visited: set = set()
    queue: List[str] = [request.url]
    pages: List[PageContent] = []
    all_links: List[str] = []

    while queue and len(pages) < max_pages:
        url = queue.pop(0)
        if url in visited:
            continue
        visited.add(url)

        try:
            sub_req = PageRequest(url=url, mode=BrowserMode.SCRAPE,
                                  js_required=request.js_required)
            page = scrape(sub_req)
            pages.append(page)

            # RT-04: dedup links before adding to queue
            for link in page.links:
                if link not in visited and link not in all_links:
                    all_links.append(link)
                    queue.append(link)
        except Exception as e:
            pages.append(PageContent(
                url=url, title="", text="", links=[], meta={},
                status_code=500, success=False, error=str(e),
            ))

    return CrawlResult(
        start_url=request.url,
        pages=pages,
        total_pages=len(pages),
        all_links=list(dict.fromkeys(all_links)),  # dedup preserve order
    )


# ---------------------------------------------------------------------------
# STRUCTURED EXTRACTION  (RT-06)
# ---------------------------------------------------------------------------

def extract_structured(request: PageRequest) -> Dict[str, Any]:
    err = validate_url(request.url)
    if err:
        raise ValueError(f"RT-01: {err}")

    stub = _get_stub(request.url)
    result: Dict[str, Any] = {
        "url": request.url,
        "extracted": {},
        "meta": stub.get("meta", {}),
    }

    for target in (request.extraction_targets or []):
        if target == ExtractionTarget.TITLE:
            result["extracted"]["title"] = stub["title"]
        elif target == ExtractionTarget.TEXT:
            result["extracted"]["text"] = stub["text"]
        elif target == ExtractionTarget.LINKS:
            result["extracted"]["links"] = stub.get("links", [])
        elif target == ExtractionTarget.META:
            result["extracted"]["meta"] = stub.get("meta", {})
        elif target == ExtractionTarget.STRUCTURED_DATA:
            result["extracted"]["structured_data"] = stub.get("structured", {})
        elif target == ExtractionTarget.IMAGES:
            result["extracted"]["images"] = [f"{request.url}/logo.png"]
        elif target == ExtractionTarget.CONTACT_INFO:
            result["extracted"]["contact"] = {"email": "info@example.com", "phone": "+1-555-0100"}

    # RT-06: schema alignment check
    if not result["extracted"]:
        result["extracted"]["text"] = stub["text"]  # fallback

    return result


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
            return BrowserError(message="; ".join(issues), error_code="VALIDATION_ERROR")

        if request.mode == BrowserMode.SCRAPE:
            return scrape(request)
        elif request.mode == BrowserMode.CRAWL:
            return crawl(request, max_pages=request.max_pages or 5)
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
        return BrowserError(message=str(e), error_code="VALIDATION_ERROR")
    except Exception as e:
        return BrowserError(message=f"Browser error: {e}", error_code="RUNTIME_ERROR")


# ---------------------------------------------------------------------------
# ROUTE ENVELOPE — standard Nasus entry point  (RT-08)
# ---------------------------------------------------------------------------

def route_envelope(envelope: NasusEnvelope) -> NasusEnvelope:
    envelope.mark_running()
    try:
        payload = envelope.payload

        if isinstance(payload, dict):
            mode = BrowserMode(payload.get("mode", "scrape"))
            targets_raw = payload.get("extraction_targets", [])
            targets = [ExtractionTarget(t) for t in targets_raw] if targets_raw else None
            request = PageRequest(
                url=payload.get("url", ""),
                mode=mode,
                js_required=payload.get("js_required", False),
                extraction_targets=targets,
                interaction_steps=payload.get("interaction_steps"),
                max_pages=payload.get("max_pages", 5),
                wait_for=payload.get("wait_for"),
            )
        elif isinstance(payload, PageRequest):
            request = payload
        else:
            return envelope.mark_failed(f"Unsupported payload type: {type(payload)}")

        result = browse(request)

        if isinstance(result, BrowserError):
            return envelope.mark_failed(result.to_dict()["message"])

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
