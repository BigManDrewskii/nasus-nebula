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

import httpx

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
        key_name = getattr(request, "auth_header_name", None) or "X-Api-Key"
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
        template = getattr(request, "auth_header_template", None) or "Token {token}"
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
            latency_ms=0.0,
            success=False,
            label=request.label,
        )

    headers = build_headers(request)
    attempt = 0
    effective_retries = request.retry_count

    with httpx.Client(timeout=float(request.timeout_seconds)) as http_client:
        while attempt <= effective_retries:
            t0 = time.monotonic()
            try:
                kwargs: Dict[str, Any] = {
                    "method": request.method.value,
                    "url": request.url,
                    "headers": headers,
                    "follow_redirects": True,
                }
                if request.body is not None:
                    if request.content_type == ContentType.JSON:
                        kwargs["json"] = request.body
                    else:
                        kwargs["data"] = request.body

                http_resp = http_client.request(**kwargs)
                latency_ms = (time.monotonic() - t0) * 1000
                status = http_resp.status_code
                try:
                    body = http_resp.json()
                except Exception:
                    body = {"text": http_resp.text[:4000]}
                resp_headers = dict(http_resp.headers)

            except httpx.TimeoutException:
                if attempt < effective_retries:
                    time.sleep((2 ** attempt) + random.uniform(0, 0.1))
                    attempt += 1
                    continue
                return ApiResponse(
                    status_code=504, body={"error": "Request timed out"},
                    headers={}, latency_ms=(time.monotonic() - t0) * 1000,
                    success=False, label=request.label,
                )
            except httpx.ConnectError as exc:
                if attempt < effective_retries:
                    time.sleep((2 ** attempt) + random.uniform(0, 0.1))
                    attempt += 1
                    continue
                return ApiResponse(
                    status_code=503, body={"error": f"Connection error: {exc}"},
                    headers={}, latency_ms=(time.monotonic() - t0) * 1000,
                    success=False, label=request.label,
                )

            # RT-04: rate limit handling
            if status == 429:
                retry_after = float(resp_headers.get("Retry-After", 1))
                if attempt < effective_retries:
                    time.sleep(retry_after + random.uniform(0, 0.5))
                    attempt += 1
                    continue
                return ApiResponse(
                    status_code=429, body=body, headers=resp_headers,
                    latency_ms=latency_ms, success=False, label=request.label,
                )

            # RT-03: retry on 5xx
            if status >= 500 and attempt < effective_retries:
                backoff = (2 ** attempt) + random.uniform(0, 0.1)
                time.sleep(backoff)
                attempt += 1
                continue

            success = 200 <= status < 300
            response = ApiResponse(
                status_code=status,
                body=body,
                headers=resp_headers,
                latency_ms=latency_ms,
                success=success,
                label=request.label,
            )

            validate_api_output(response)
            return response

    return ApiResponse(
        status_code=500, body={"error": "Max retries exceeded"},
        headers={}, latency_ms=0.0, success=False, label=request.label,
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
        "webhook_id": f"wh_{hashlib.md5(config.endpoint_url.encode()).hexdigest()[:8]}",
        "endpoint_url": config.endpoint_url,
        "event_types": config.event_types,
        "active": config.active,
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
                    requests.append(ApiRequest.from_dict(item))
                elif isinstance(item, ApiRequest):
                    requests.append(item)
            responses = execute_batch(requests)
            return envelope.mark_done([r.to_dict() for r in responses])

        # Single request mode
        if isinstance(payload, dict):
            # Webhook setup
            if payload.get("webhook_url") or payload.get("endpoint_url"):
                cfg = WebhookConfig(
                    endpoint_url=payload.get("endpoint_url") or payload.get("webhook_url", ""),
                    event_types=payload.get("event_types") or payload.get("events", ["*"]),
                    secret=payload.get("secret", ""),
                )
                result = setup_webhook(cfg)
                return envelope.mark_done(result)

            request = ApiRequest.from_dict(payload)
        elif isinstance(payload, ApiRequest):
            request = payload
        else:
            return envelope.mark_failed(f"Unsupported payload type: {type(payload)}")

        response = execute(request)
        if not response.success:
            error_detail = (
                response.body.get("error") or f"HTTP {response.status_code}"
                if isinstance(response.body, dict) else f"HTTP {response.status_code}"
            )
            return envelope.mark_failed(error_detail)
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
