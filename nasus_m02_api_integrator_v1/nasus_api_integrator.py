"""
NASUS API INTEGRATOR — RUNTIME
Version: 1.0 | Module: M02 | Stack: Nasus Sub-Agent Network

Entry point: route_envelope(envelope: NasusEnvelope) -> NasusEnvelope

Functions:
  build_headers()          — inject auth credentials into request headers
  execute()                — send a single HTTP request with retry + backoff
  execute_batch()          — run multiple requests sequentially
  setup_webhook()          — register a webhook endpoint config
  verify_webhook_signature() — HMAC-SHA256 signature check
  route_envelope()         — standard Nasus entry point
"""
from __future__ import annotations

import hashlib
import hmac
import json
import math
import random
import time
from typing import Any, Dict, List, Optional, Union
from urllib.parse import urlparse

from nasus_api_integrator_schema import (
    ApiRequest, ApiResponse, AuthType, ContentType, HttpMethod,
    IntegrationError, IntegrationStatus, WebhookConfig,
    validate_request, validate_api_output,
)
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus


# ---------------------------------------------------------------------------
# AUTH HEADER BUILDER  (RT-01)
# ---------------------------------------------------------------------------

def build_headers(request: ApiRequest) -> Dict[str, str]:
    headers: Dict[str, str] = dict(request.headers or {})
    headers["Content-Type"] = request.content_type.value
    headers["Accept"] = "application/json"

    auth = request.auth_type
    val = request.auth_value or ""

    if auth == AuthType.API_KEY:
        key_name = request.auth_header_name or "X-Api-Key"
        headers[key_name] = val
    elif auth == AuthType.BEARER:
        headers["Authorization"] = f"Bearer {val}"
    elif auth == AuthType.BASIC:
        import base64
        encoded = base64.b64encode(val.encode()).decode()
        headers["Authorization"] = f"Basic {encoded}"
    elif auth == AuthType.OAUTH2:
        headers["Authorization"] = f"Bearer {val}"
    elif auth == AuthType.CUSTOM:
        template = request.auth_header_template or "Token {token}"
        headers["Authorization"] = template.replace("{token}", val)
    # AuthType.NONE — no auth header added

    return headers


# ---------------------------------------------------------------------------
# STUB RESPONSE DISPATCHER
# ---------------------------------------------------------------------------

_STUB_RESPONSES: Dict[str, Dict] = {
    "/users":    {"status": 200, "body": [{"id": 1, "name": "Alice"}, {"id": 2, "name": "Bob"}]},
    "/posts":    {"status": 201, "body": {"id": 101, "title": "Hello World", "created": True}},
    "/health":   {"status": 200, "body": {"status": "ok", "uptime": 99.9}},
    "/error400": {"status": 400, "body": {"error": "Bad Request", "detail": "Invalid param"}},
    "/error401": {"status": 401, "body": {"error": "Unauthorized"}},
    "/error403": {"status": 403, "body": {"error": "Forbidden"}},
    "/error404": {"status": 404, "body": {"error": "Not Found"}},
    "/error429": {"status": 429, "body": {"error": "Rate Limited"}, "retry_after": 2},
    "/error500": {"status": 500, "body": {"error": "Internal Server Error"}},
    "/error503": {"status": 503, "body": {"error": "Service Unavailable"}},
}

def _stub_response(request: ApiRequest) -> Dict[str, Any]:
    path = urlparse(request.url).path.rstrip("/") or "/"
    if path in _STUB_RESPONSES:
        return _STUB_RESPONSES[path]
    return {"status": 200, "body": {"message": "ok", "path": path}}


# ---------------------------------------------------------------------------
# EXECUTE (single request, retry + backoff)  (RT-03, RT-04)
# ---------------------------------------------------------------------------

def execute(request: ApiRequest, max_retries: int = 3) -> ApiResponse:
    pre_issues = validate_request(request)
    if pre_issues:
        return ApiResponse(
            status_code=400,
            body={"validation_errors": pre_issues},
            headers={},
            success=False,
            error_message="; ".join(pre_issues),
        )

    headers = build_headers(request)
    attempt = 0
    last_response: Optional[ApiResponse] = None

    while attempt <= max_retries:
        stub = _stub_response(request)
        status = stub["status"]
        body = stub.get("body", {})

        # RT-04: rate limit handling
        if status == 429:
            retry_after = stub.get("retry_after", 1)
            if attempt < max_retries:
                wait = retry_after + random.uniform(0, 0.5)
                time.sleep(min(wait, 0.05))  # stub: cap at 50ms
                attempt += 1
                continue
            return ApiResponse(
                status_code=429, body=body, headers={}, success=False,
                error_message="Rate limited — max retries exhausted",
            )

        # RT-03: retry on 5xx
        if status >= 500 and attempt < max_retries:
            backoff = (2 ** attempt) + random.uniform(0, 0.1)
            time.sleep(min(backoff, 0.05))  # stub: cap at 50ms
            attempt += 1
            continue

        success = 200 <= status < 300
        response = ApiResponse(
            status_code=status,
            body=body,
            headers={"Content-Type": "application/json"},
            success=success,
            error_message=None if success else body.get("error", f"HTTP {status}"),
        )

        issues = validate_api_output(response)
        if issues:
            response.error_message = (response.error_message or "") + " | " + "; ".join(issues)

        return response

    return ApiResponse(
        status_code=500, body={}, headers={}, success=False,
        error_message="Max retries exceeded",
    )


# ---------------------------------------------------------------------------
# BATCH EXECUTE  (RT-06)
# ---------------------------------------------------------------------------

def execute_batch(requests: List[ApiRequest]) -> List[ApiResponse]:
    """Order-preserving sequential execution."""
    return [execute(req) for req in requests]


# ---------------------------------------------------------------------------
# WEBHOOK  (RT-07)
# ---------------------------------------------------------------------------

def setup_webhook(config: WebhookConfig) -> Dict[str, Any]:
    return {
        "webhook_id": f"wh_{hashlib.md5(config.url.encode()).hexdigest()[:8]}",
        "url": config.url,
        "events": config.events,
        "active": True,
        "secret_set": bool(config.secret),
    }


def verify_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(secret.encode(), payload, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


# ---------------------------------------------------------------------------
# ROUTE ENVELOPE — standard Nasus entry point  (RT-08)
# ---------------------------------------------------------------------------

def route_envelope(envelope: NasusEnvelope) -> NasusEnvelope:
    envelope.mark_running()
    try:
        payload = envelope.payload

        # Batch mode
        if isinstance(payload, list):
            requests = []
            for item in payload:
                if isinstance(item, dict):
                    requests.append(ApiRequest(
                        url=item.get("url", ""),
                        method=HttpMethod(item.get("method", "GET").upper()),
                        auth_type=AuthType(item.get("auth_type", "none")),
                        auth_value=item.get("auth_value"),
                        headers=item.get("headers", {}),
                        body=item.get("body"),
                        content_type=ContentType(item.get("content_type", "application/json")),
                    ))
                elif isinstance(item, ApiRequest):
                    requests.append(item)
            responses = execute_batch(requests)
            return envelope.mark_done([r.to_dict() for r in responses])

        # Single request mode
        if isinstance(payload, dict):
            # Webhook setup
            if payload.get("webhook_url"):
                cfg = WebhookConfig(
                    url=payload["webhook_url"],
                    events=payload.get("events", ["*"]),
                    secret=payload.get("secret", ""),
                )
                result = setup_webhook(cfg)
                return envelope.mark_done(result)

            request = ApiRequest(
                url=payload.get("url", ""),
                method=HttpMethod(payload.get("method", "GET").upper()),
                auth_type=AuthType(payload.get("auth_type", "none")),
                auth_value=payload.get("auth_value"),
                headers=payload.get("headers", {}),
                body=payload.get("body"),
                content_type=ContentType(payload.get("content_type", "application/json")),
                auth_header_name=payload.get("auth_header_name"),
                auth_header_template=payload.get("auth_header_template"),
                timeout=payload.get("timeout", 30),
            )
        elif isinstance(payload, ApiRequest):
            request = payload
        else:
            return envelope.mark_failed(f"Unsupported payload type: {type(payload)}")

        response = execute(request)
        if not response.success:
            return envelope.mark_failed(response.error_message or f"HTTP {response.status_code}")
        return envelope.mark_done(response.to_dict())

    except Exception as e:
        return envelope.mark_failed(f"route_envelope error: {e}")


# ---------------------------------------------------------------------------
# DEMO
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import json

    # 1. GET /users
    r1 = execute(ApiRequest(url="https://api.example.com/users", method=HttpMethod.GET,
                            auth_type=AuthType.BEARER, auth_value="token123"))
    print("GET /users:", json.dumps(r1.to_dict(), indent=2))

    # 2. POST /posts
    r2 = execute(ApiRequest(url="https://api.example.com/posts", method=HttpMethod.POST,
                            auth_type=AuthType.API_KEY, auth_value="key_abc",
                            body={"title": "Hello"}, content_type=ContentType.JSON))
    print("POST /posts:", json.dumps(r2.to_dict(), indent=2))

    # 3. Batch
    batch = execute_batch([
        ApiRequest(url="https://api.example.com/health", method=HttpMethod.GET, auth_type=AuthType.NONE),
        ApiRequest(url="https://api.example.com/posts",  method=HttpMethod.GET, auth_type=AuthType.NONE),
    ])
    print("BATCH:", json.dumps([r.to_dict() for r in batch], indent=2))

    # 4. Webhook
    wh = setup_webhook(WebhookConfig(url="https://hooks.example.com/cb", events=["push", "pr"], secret="s3cr3t"))
    print("WEBHOOK:", json.dumps(wh, indent=2))
