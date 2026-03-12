"""
nasus_sidecar/llm_client.py
============================
Shared LLM client for all Nasus stack modules.

Wraps any OpenAI-compatible API endpoint (OpenRouter, Ollama, LiteLLM, direct).
Provides:
  - configure()       — set global API credentials once (called via /configure endpoint)
  - chat()            — basic streaming-off chat completion
  - chat_json()       — structured JSON output with schema hint + retry
  - is_configured()   — guard used by modules before attempting LLM calls

Design notes:
  - Uses httpx (already in requirements) for sync HTTP — no new deps for basic usage.
  - Falls back to openai SDK if available (added in Phase 2 requirements).
  - All module callers receive a NasusLLMClient instance injected by the orchestrator,
    so they never read global state directly (testable + mockable).
  - JSON retry: up to MAX_JSON_RETRIES attempts; on parse failure injects the raw
    response back as a correction message so the model can self-repair.
"""

from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass, field
from typing import Any, Dict, Generator, List, Optional

import httpx

# ---------------------------------------------------------------------------
# Config singleton
# ---------------------------------------------------------------------------


@dataclass
class _LLMConfig:
    api_key: str = ""
    api_base: str = "https://openrouter.ai/api/v1"
    default_model: str = "openai/gpt-4o-mini"
    timeout_s: float = 60.0
    max_retries: int = 3


_CONFIG = _LLMConfig()


def configure(
    api_key: str,
    api_base: str = "https://openrouter.ai/api/v1",
    model: str = "openai/gpt-4o-mini",
    timeout_s: float = 60.0,
) -> None:
    """
    Set global LLM credentials.
    Called once by the FastAPI lifespan / POST /configure endpoint before any module runs.
    """
    _CONFIG.api_key = api_key.strip()
    _CONFIG.api_base = api_base.rstrip("/")
    _CONFIG.default_model = model
    _CONFIG.timeout_s = timeout_s


def is_configured() -> bool:
    """Return True if an API key has been provided."""
    return bool(_CONFIG.api_key)


def get_config() -> _LLMConfig:
    """Read-only snapshot of current config (used by NasusLLMClient instances)."""
    return _LLMConfig(
        api_key=_CONFIG.api_key,
        api_base=_CONFIG.api_base,
        default_model=_CONFIG.default_model,
        timeout_s=_CONFIG.timeout_s,
        max_retries=_CONFIG.max_retries,
    )


# ---------------------------------------------------------------------------
# Message helpers
# ---------------------------------------------------------------------------


def system(content: str) -> Dict[str, str]:
    return {"role": "system", "content": content}


def user(content: str) -> Dict[str, str]:
    return {"role": "user", "content": content}


def assistant(content: str) -> Dict[str, str]:
    return {"role": "assistant", "content": content}


# ---------------------------------------------------------------------------
# Low-level HTTP call
# ---------------------------------------------------------------------------

MAX_JSON_RETRIES = 3

# Regex to extract a JSON object or array from fenced or bare LLM output.
_JSON_FENCE_RE = re.compile(
    r"```(?:json)?\s*(\{.*?\}|\[.*?\])\s*```",
    re.DOTALL,
)
_JSON_BARE_RE = re.compile(
    r"(\{.*\}|\[.*\])",
    re.DOTALL,
)


def _extract_json(text: str) -> Any:
    """
    Try to extract a JSON value from a raw LLM text response.
    Checks in order: fenced code block → bare JSON object/array → direct parse.
    Raises ValueError if nothing parseable is found.
    """
    # 1. Fenced block
    m = _JSON_FENCE_RE.search(text)
    if m:
        return json.loads(m.group(1))

    # 2. Bare object / array (greedy — takes largest match)
    m = _JSON_BARE_RE.search(text)
    if m:
        return json.loads(m.group(1))

    # 3. Direct parse (model may have returned clean JSON without fences)
    return json.loads(text.strip())


def _build_headers(api_key: str, api_base: str) -> Dict[str, str]:
    headers: Dict[str, str] = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {api_key}",
    }
    # OpenRouter attribution headers (ignored by other providers)
    if "openrouter" in api_base:
        headers["HTTP-Referer"] = "https://nasus.im"
        headers["X-Title"] = "Nasus Agent Stack"
    return headers


def _post_chat_full(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    api_base: str,
    timeout_s: float,
    response_format: Optional[Dict[str, str]] = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> tuple:
    """
    POST a chat completion request.
    Returns (content: str, raw_response: dict) so callers can inspect usage data.
    Raises httpx.HTTPStatusError or httpx.TimeoutException on failure.
    """
    url = f"{api_base}/chat/completions"
    body: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": False,
    }
    if response_format:
        body["response_format"] = response_format

    with httpx.Client(timeout=timeout_s) as client:
        resp = client.post(url, json=body, headers=_build_headers(api_key, api_base))
        resp.raise_for_status()
        data = resp.json()

    choices = data.get("choices", [])
    if not choices:
        raise ValueError(f"LLM returned no choices: {data}")
    return choices[0]["message"]["content"], data


def _post_chat(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    api_base: str,
    timeout_s: float,
    response_format: Optional[Dict[str, str]] = None,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> str:
    """
    POST a chat completion request and return the assistant message content as a string.
    Raises httpx.HTTPStatusError or httpx.TimeoutException on failure.
    """
    content, _ = _post_chat_full(
        messages, model, api_key, api_base, timeout_s, response_format, temperature, max_tokens
    )
    return content


def _post_chat_stream(
    messages: List[Dict[str, str]],
    model: str,
    api_key: str,
    api_base: str,
    timeout_s: float,
    temperature: float = 0.3,
    max_tokens: int = 4096,
) -> Generator[str, None, None]:
    """
    POST a streaming chat completion request and yield token delta strings.
    Uses SSE (Server-Sent Events) from the OpenAI-compatible /chat/completions endpoint.
    """
    url = f"{api_base}/chat/completions"
    body: Dict[str, Any] = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens,
        "stream": True,
    }
    headers = _build_headers(api_key, api_base)

    with httpx.Client(timeout=httpx.Timeout(timeout_s, read=timeout_s)) as client:
        with client.stream("POST", url, json=body, headers=headers) as resp:
            resp.raise_for_status()
            for raw_line in resp.iter_lines():
                line = raw_line.strip()
                if not line or not line.startswith("data:"):
                    continue
                data = line[5:].strip()
                if data == "[DONE]":
                    break
                try:
                    chunk = json.loads(data)
                    delta = chunk["choices"][0]["delta"].get("content") or ""
                    if delta:
                        yield delta
                except (json.JSONDecodeError, KeyError, IndexError):
                    continue


# ---------------------------------------------------------------------------
# Public client class
# ---------------------------------------------------------------------------


@dataclass
class NasusLLMClient:
    """
    Per-module LLM client instance.
    Instantiated by the orchestrator and injected into each module.

    Usage:
        client = NasusLLMClient()                    # uses global config
        client = NasusLLMClient(model="gpt-4o")      # override model for this module
        client = NasusLLMClient(token_budget=50000)  # hard-stop after 50k tokens
    """

    model: Optional[str] = None  # None → use global default
    temperature: float = 0.3
    max_tokens: int = 4096
    token_budget: Optional[int] = None  # per-instance cumulative token cap
    _cfg: _LLMConfig = field(default_factory=get_config, repr=False)
    _tokens_used: int = field(default=0, init=False, repr=False)

    def __post_init__(self) -> None:
        # Re-snapshot config at instantiation so injected clients are consistent.
        self._cfg = get_config()
        if self.model is None:
            self.model = self._cfg.default_model

    def _effective_model(self) -> str:
        return self.model or _CONFIG.default_model

    @property
    def tokens_used(self) -> int:
        return self._tokens_used

    @property
    def budget_remaining(self) -> Optional[int]:
        if self.token_budget is None:
            return None
        return max(0, self.token_budget - self._tokens_used)

    def _check_budget(self) -> None:
        if self.token_budget is not None and self._tokens_used >= self.token_budget:
            raise RuntimeError(
                f"Token budget exhausted: used {self._tokens_used} of {self.token_budget} tokens"
            )

    def _record_usage(self, response_data: Dict[str, Any]) -> None:
        usage = response_data.get("usage") if isinstance(response_data, dict) else None
        if usage:
            self._tokens_used += usage.get("total_tokens", 0)

    # ── Core call ────────────────────────────────────────────────────────────

    def chat(
        self,
        messages: List[Dict[str, str]],
        *,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> str:
        """
        Basic chat completion. Returns the assistant's response as a plain string.
        Raises if the API call fails.
        """
        if not is_configured():
            raise RuntimeError(
                "NasusLLMClient: not configured. Call llm_client.configure() "
                "or POST /configure before running any LLM module."
            )

        self._check_budget()

        retries = self._cfg.max_retries
        last_err: Optional[Exception] = None
        backoff = 1.0

        for attempt in range(retries):
            try:
                content, raw = _post_chat_full(
                    messages=messages,
                    model=model or self._effective_model(),
                    api_key=self._cfg.api_key,
                    api_base=self._cfg.api_base,
                    timeout_s=self._cfg.timeout_s,
                    temperature=temperature
                    if temperature is not None
                    else self.temperature,
                    max_tokens=max_tokens
                    if max_tokens is not None
                    else self.max_tokens,
                )
                self._record_usage(raw)
                return content
            except (httpx.TimeoutException, httpx.NetworkError) as exc:
                last_err = exc
                time.sleep(backoff)
                backoff *= 2
                continue
            except httpx.HTTPStatusError as exc:
                status = exc.response.status_code
                if status in (429, 502, 503, 504):
                    last_err = exc
                    time.sleep(backoff)
                    backoff *= 2
                    continue
                raise  # Non-retryable HTTP error — propagate immediately
            except Exception as exc:
                raise RuntimeError(
                    f"LLM call failed (attempt {attempt + 1}): {exc}"
                ) from exc

        raise RuntimeError(
            f"LLM call failed after {retries} attempts: {last_err}"
        ) from last_err

    # ── Streaming output ─────────────────────────────────────────────────────

    def chat_stream(
        self,
        messages: List[Dict[str, str]],
        *,
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Generator[str, None, None]:
        """
        Streaming variant of chat(). Yields token delta strings as they arrive.
        Falls back to yielding the full response in one chunk if streaming fails.
        """
        if not is_configured():
            raise RuntimeError(
                "NasusLLMClient: not configured. Call llm_client.configure() first."
            )
        try:
            yield from _post_chat_stream(
                messages=messages,
                model=model or self._effective_model(),
                api_key=self._cfg.api_key,
                api_base=self._cfg.api_base,
                timeout_s=self._cfg.timeout_s,
                temperature=temperature if temperature is not None else self.temperature,
                max_tokens=max_tokens if max_tokens is not None else self.max_tokens,
            )
        except Exception:
            # Streaming failed — fall back to non-streaming and yield full response
            text = self.chat(messages, model=model, temperature=temperature, max_tokens=max_tokens)
            yield text

    # ── JSON output ──────────────────────────────────────────────────────────

    def chat_json(
        self,
        messages: List[Dict[str, str]],
        *,
        schema_hint: str = "",
        model: Optional[str] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
    ) -> Any:
        """
        Chat completion that guarantees a parsed Python object (dict/list) is returned.

        Strategy:
          1. Append a schema hint to the last user message so the model knows
             exactly what JSON shape is expected.
          2. Request JSON mode (response_format={"type": "json_object"}) when
             the model / provider supports it.
          3. On JSON parse failure: inject the raw response as a correction
             message and retry (up to MAX_JSON_RETRIES attempts).

        Returns the parsed Python object.
        Raises ValueError after MAX_JSON_RETRIES failed parse attempts.
        """
        if not is_configured():
            raise RuntimeError(
                "NasusLLMClient: not configured. Call llm_client.configure() first."
            )

        self._check_budget()

        effective_model = model or self._effective_model()
        temp = temperature if temperature is not None else self.temperature
        tokens = max_tokens if max_tokens is not None else self.max_tokens

        # Inject schema hint into a copy of the messages list
        augmented = list(messages)
        if schema_hint:
            schema_instruction = (
                "\n\n---\nRespond ONLY with a valid JSON object matching this schema:\n"
                f"{schema_hint}\n"
                "Do NOT include any explanation, markdown, or text outside the JSON."
            )
            # Append to the last user message, or add a new user message
            if augmented and augmented[-1]["role"] == "user":
                augmented[-1] = {
                    "role": "user",
                    "content": augmented[-1]["content"] + schema_instruction,
                }
            else:
                augmented.append(user(schema_instruction))

        # Only request JSON mode for models known to support it reliably.
        # Many OpenRouter models reject response_format with a 400, which wastes a
        # full LLM call before the retry logic kicks in. The schema hint + _extract_json
        # handles parsing for all models, so JSON mode is an optional optimisation only.
        _openai_base = "openai" in effective_model.lower() or "gpt-" in effective_model.lower()
        _anthropic_base = "anthropic" in effective_model.lower() or "claude-" in effective_model.lower()
        _openrouter_ok = _openai_base or _anthropic_base
        use_json_mode = (
            "ollama" in self._cfg.api_base.lower()
            or _openrouter_ok
        ) and not (
            "ollama" in self._cfg.api_base.lower()
            and "mistral" in effective_model.lower()
        )
        response_format: Optional[Dict[str, str]] = (
            {"type": "json_object"} if use_json_mode else None
        )

        working_messages = augmented
        last_parse_error: Optional[Exception] = None

        for attempt in range(MAX_JSON_RETRIES):
            raw = _post_chat(
                messages=working_messages,
                model=effective_model,
                api_key=self._cfg.api_key,
                api_base=self._cfg.api_base,
                timeout_s=self._cfg.timeout_s,
                response_format=response_format,
                temperature=temp,
                max_tokens=tokens,
            )

            try:
                return _extract_json(raw)
            except (json.JSONDecodeError, ValueError) as exc:
                last_parse_error = exc
                # Inject the bad response + correction instruction and retry
                working_messages = working_messages + [
                    assistant(raw),
                    user(
                        f"Your previous response was not valid JSON (error: {exc}). "
                        "Please respond again with ONLY a valid JSON object — no markdown, "
                        "no explanation, no code fences. Start your response with {{ or [."
                    ),
                ]
                continue

        raise ValueError(
            f"LLM did not return valid JSON after {MAX_JSON_RETRIES} attempts. "
            f"Last parse error: {last_parse_error}"
        )

    # ── Convenience builders ─────────────────────────────────────────────────

    def complete(self, prompt: str, **kwargs: Any) -> str:
        """Single-turn completion from a plain text prompt."""
        return self.chat([user(prompt)], **kwargs)

    def complete_json(self, prompt: str, schema_hint: str = "", **kwargs: Any) -> Any:
        """Single-turn JSON completion from a plain text prompt."""
        return self.chat_json([user(prompt)], schema_hint=schema_hint, **kwargs)


# ---------------------------------------------------------------------------
# Module-level convenience (for callers that want a quick shared client)
# ---------------------------------------------------------------------------


def get_client(model: Optional[str] = None, token_budget: Optional[int] = None) -> NasusLLMClient:
    """
    Return a NasusLLMClient snapshot using the current global config.
    Preferred over instantiating NasusLLMClient() directly in module code
    because it re-reads the global config each time (picks up /configure calls).
    """
    cfg = get_config()
    return NasusLLMClient(
        model=model or cfg.default_model,
        token_budget=token_budget,
        _cfg=cfg,
    )
