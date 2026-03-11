"""
NASUS API INTEGRATOR — STRUCTURED OUTPUT SCHEMA
Version: 1.0 | Module: M02 | Stack: Nasus Sub-Agent Network

Dataclasses covering all API Integrator output types:
- ApiRequest        (outbound HTTP/GraphQL request descriptor)
- ApiResponse       (normalised response wrapper)
- WebhookConfig     (webhook registration descriptor)
- IntegrationError  (structured error with retry metadata)
- Full JSON serialization, validation, and round-trip helpers

REGISTRY IMPORT (shared across all Nasus modules):
    from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from enum import Enum
from typing import Any, Dict, List, Optional
import json
import time
import uuid
from datetime import datetime, timezone

# Shared registry — single source of truth for IDs and envelope
from nasus_module_registry import ModuleID, NasusEnvelope, NasusStatus  # noqa: F401


# ---------------------------------------------------------------------------
# MODULE IDENTITY
# ---------------------------------------------------------------------------

MODULE_ID   = "M02"
MODULE_NAME = "API Integrator"
CAPABILITIES: List[str] = [
    "REST API calls",
    "GraphQL",
    "webhook setup",
    "auth flows",
]


# ---------------------------------------------------------------------------
# ENUMS
# ---------------------------------------------------------------------------

class HttpMethod(str, Enum):
    GET    = "GET"
    POST   = "POST"
    PUT    = "PUT"
    PATCH  = "PATCH"
    DELETE = "DELETE"


class AuthType(str, Enum):
    NONE   = "NONE"
    API_KEY = "API_KEY"
    BEARER  = "BEARER"
    BASIC   = "BASIC"
    OAUTH2  = "OAUTH2"
    CUSTOM  = "CUSTOM"


class ContentType(str, Enum):
    JSON       = "application/json"
    FORM       = "application/x-www-form-urlencoded"
    MULTIPART  = "multipart/form-data"
    XML        = "application/xml"
    TEXT       = "text/plain"


class IntegrationStatus(str, Enum):
    PENDING      = "PENDING"
    CONNECTING   = "CONNECTING"
    EXECUTING    = "EXECUTING"
    DONE         = "DONE"
    FAILED       = "FAILED"
    RATE_LIMITED = "RATE_LIMITED"


# ---------------------------------------------------------------------------
# DATACLASSES
# ---------------------------------------------------------------------------

@dataclass
class ApiRequest:
    """
    Descriptor for a single outbound API call.

    Fields
    ------
    url             : Full endpoint URL (no trailing slash).
    method          : HTTP verb.
    headers         : Caller-supplied headers (auth headers are merged in build_headers).
    body            : Request payload — dict for JSON, str for raw, None for GET.
    auth_type       : Authentication scheme to apply.
    auth_value      : Credential value (API key, Bearer token, "user:pass" for BASIC).
                      NEVER logged or echoed in responses.
    timeout_seconds : Per-request timeout.
    retry_count     : Max retry attempts on transient failures (5xx, network errors).
    label           : Optional human-readable tag for debugging / batch tracking.
    content_type    : Content-Type to declare on outbound body.
    graphql_query   : If set, request is treated as a GraphQL operation.
    graphql_variables: Variables dict for the GraphQL query.
    """
    url:               str
    method:            HttpMethod
    headers:           Dict[str, str]
    body:              Any                = None
    auth_type:         AuthType           = AuthType.NONE
    auth_value:        str                = ""
    timeout_seconds:   int                = 30
    retry_count:       int                = 2
    label:             str                = ""
    content_type:      ContentType        = ContentType.JSON
    graphql_query:     Optional[str]      = None
    graphql_variables: Optional[Dict]    = None

    def to_dict(self) -> dict:
        return {
            "url":               self.url,
            "method":            self.method.value,
            "headers":           self.headers,
            "body":              self.body,
            "auth_type":         self.auth_type.value,
            # auth_value intentionally omitted — security rule RT-01
            "timeout_seconds":   self.timeout_seconds,
            "retry_count":       self.retry_count,
            "label":             self.label,
            "content_type":      self.content_type.value,
            "graphql_query":     self.graphql_query,
            "graphql_variables": self.graphql_variables,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ApiRequest":
        return cls(
            url               = d["url"],
            method            = HttpMethod(d.get("method", "GET")),
            headers           = d.get("headers", {}),
            body              = d.get("body"),
            auth_type         = AuthType(d.get("auth_type", "NONE")),
            auth_value        = d.get("auth_value", ""),
            timeout_seconds   = int(d.get("timeout_seconds", 30)),
            retry_count       = int(d.get("retry_count", 2)),
            label             = d.get("label", ""),
            content_type      = ContentType(d.get("content_type", "application/json")),
            graphql_query     = d.get("graphql_query"),
            graphql_variables = d.get("graphql_variables"),
        )


@dataclass
class ApiResponse:
    """
    Normalised wrapper for a completed API call.

    Fields
    ------
    status_code : HTTP status code (200, 201, 400, 401, 429, 500 …)
    body        : Parsed response body (dict/list/str).
    headers     : Response headers.
    latency_ms  : Round-trip latency in milliseconds.
    success     : True when status_code < 400.
    label       : Mirrors the originating ApiRequest.label.
    """
    status_code: int
    body:        Any
    headers:     Dict[str, str]
    latency_ms:  float
    success:     bool
    label:       str = ""

    def to_dict(self) -> dict:
        return {
            "status_code": self.status_code,
            "body":        self.body,
            "headers":     self.headers,
            "latency_ms":  self.latency_ms,
            "success":     self.success,
            "label":       self.label,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "ApiResponse":
        return cls(
            status_code = int(d["status_code"]),
            body        = d.get("body"),
            headers     = d.get("headers", {}),
            latency_ms  = float(d.get("latency_ms", 0.0)),
            success     = bool(d.get("success", False)),
            label       = d.get("label", ""),
        )


@dataclass
class WebhookConfig:
    """
    Descriptor for registering an inbound webhook.

    Fields
    ------
    endpoint_url : Publicly reachable URL that will receive POST events.
    event_types  : List of event names to subscribe to.
    secret       : HMAC signing secret used to verify payloads (RT-07).
    active       : Whether the webhook should be activated immediately.
    """
    endpoint_url: str
    event_types:  List[str]
    secret:       str  = ""
    active:       bool = True

    def to_dict(self) -> dict:
        return {
            "endpoint_url": self.endpoint_url,
            "event_types":  self.event_types,
            # secret omitted from serialisation — security rule
            "active":       self.active,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "WebhookConfig":
        return cls(
            endpoint_url = d["endpoint_url"],
            event_types  = d.get("event_types", []),
            secret       = d.get("secret", ""),
            active       = bool(d.get("active", True)),
        )


@dataclass
class IntegrationError:
    """
    Structured error descriptor returned when an API call fails after retries.

    Fields
    ------
    url               : Target URL that failed.
    error_code        : Short machine-readable code (e.g. "TIMEOUT", "HTTP_429").
    message           : Human-readable description.
    retries_attempted : Number of attempts made before giving up.
    """
    url:               str
    error_code:        str
    message:           str
    retries_attempted: int

    def to_dict(self) -> dict:
        return {
            "url":               self.url,
            "error_code":        self.error_code,
            "message":           self.message,
            "retries_attempted": self.retries_attempted,
        }

    @classmethod
    def from_dict(cls, d: dict) -> "IntegrationError":
        return cls(
            url               = d["url"],
            error_code        = d.get("error_code", "UNKNOWN"),
            message           = d.get("message", ""),
            retries_attempted = int(d.get("retries_attempted", 0)),
        )


# ---------------------------------------------------------------------------
# VALIDATION HELPERS
# ---------------------------------------------------------------------------

def validate_api_output(response: Any) -> List[str]:
    """
    RT-05: Validate that a response or error object is well-formed.

    Returns a list of validation issue strings. Empty list = valid.
    """
    issues: List[str] = []

    if isinstance(response, ApiResponse):
        if response.status_code < 100 or response.status_code > 599:
            issues.append(f"Invalid status_code: {response.status_code}")
        if response.latency_ms < 0:
            issues.append(f"Negative latency_ms: {response.latency_ms}")
        if response.success and response.status_code >= 400:
            issues.append(
                f"Inconsistent: success=True but status_code={response.status_code}"
            )
        if not response.success and response.status_code < 400:
            issues.append(
                f"Inconsistent: success=False but status_code={response.status_code}"
            )

    elif isinstance(response, IntegrationError):
        if not response.url:
            issues.append("IntegrationError.url is empty")
        if not response.error_code:
            issues.append("IntegrationError.error_code is empty")
        if response.retries_attempted < 0:
            issues.append(f"Negative retries_attempted: {response.retries_attempted}")

    else:
        issues.append(
            f"Unknown response type: {type(response).__name__}. "
            "Expected ApiResponse or IntegrationError."
        )

    return issues


def validate_request(request: ApiRequest) -> List[str]:
    """
    RT-02: Pre-flight validation for an ApiRequest before execution.

    Checks:
    - URL is non-empty and does not have a trailing slash
    - Method is a valid HttpMethod
    - timeout_seconds is positive
    - retry_count is non-negative
    - auth_value is present when auth_type != NONE
    - GraphQL requests use POST method
    """
    issues: List[str] = []

    if not request.url:
        issues.append("url is empty")
    elif request.url.endswith("/") and request.url not in ("http://", "https://"):
        issues.append(f"url has trailing slash: {request.url}")

    if request.timeout_seconds <= 0:
        issues.append(f"timeout_seconds must be > 0, got {request.timeout_seconds}")

    if request.retry_count < 0:
        issues.append(f"retry_count must be >= 0, got {request.retry_count}")

    if request.auth_type != AuthType.NONE and not request.auth_value:
        issues.append(
            f"auth_value is required when auth_type={request.auth_type.value}"
        )

    if request.graphql_query and request.method != HttpMethod.POST:
        issues.append(
            "GraphQL requests must use POST method"
        )

    return issues


# ---------------------------------------------------------------------------
# SELF-TEST
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    print(f"=== {MODULE_ID} {MODULE_NAME} — Schema Self-Test ===")

    # Build a sample request
    req = ApiRequest(
        url        = "https://api.example.com/v1/users",
        method     = HttpMethod.GET,
        headers    = {"Accept": "application/json"},
        auth_type  = AuthType.BEARER,
        auth_value = "secret-token-123",
        label      = "fetch-users",
    )
    print("ApiRequest.to_dict():", json.dumps(req.to_dict(), indent=2))

    # Validate it
    errs = validate_request(req)
    print("Validation issues:", errs or "none")

    # Round-trip
    req2 = ApiRequest.from_dict(req.to_dict())
    assert req2.url == req.url
    print("Round-trip OK")

    # Sample response
    resp = ApiResponse(
        status_code = 200,
        body        = {"users": [{"id": 1, "name": "Alice"}]},
        headers     = {"content-type": "application/json"},
        latency_ms  = 142.7,
        success     = True,
        label       = "fetch-users",
    )
    out_issues = validate_api_output(resp)
    print("ApiResponse validation:", out_issues or "none")

    # Webhook config
    wh = WebhookConfig(
        endpoint_url = "https://my-service.example.com/hooks/nasus",
        event_types  = ["order.created", "order.updated"],
        secret       = "wh-secret-xyz",
    )
    print("WebhookConfig.to_dict():", json.dumps(wh.to_dict(), indent=2))

    # IntegrationError
    err = IntegrationError(
        url               = "https://api.example.com/v1/broken",
        error_code        = "HTTP_500",
        message           = "Internal Server Error after 2 retries",
        retries_attempted = 2,
    )
    err_issues = validate_api_output(err)
    print("IntegrationError validation:", err_issues or "none")

    print("\nAll schema self-tests passed.")
