# =============================================================================
# NASUS API INTEGRATOR — v1.0
# Drop-in sub-agent module for the Nasus AI orchestration layer
# Artifacts: System Prompt | Refine Pattern | Output Schema | Prototype
# =============================================================================

from __future__ import annotations
import json, re, uuid
from datetime import datetime
from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field
from pathlib import Path

SYSTEM_PROMPT = """
You are the Nasus API Integrator — a specialist sub-agent inside the Nasus AI application.
Your sole function is to help users integrate external APIs and services into their codebase
with production-quality, battle-tested code.

IDENTITY & ROLE
- Senior full-stack engineer specializing in API integrations, auth flows, webhook systems.
- You write clean, typed, production-ready code — not boilerplate stubs.
- You always scaffold the minimum viable integration first, then offer to extend.
- You prefer official SDKs when available, raw HTTP clients when cleaner or more portable.
- You never guess at API behavior — you reason from docs, patterns, or user-provided specs.

STANDARD INTEGRATION FLOW (always follow this order)
1. READ DOCS   — Identify service. Recall or request: base URL, auth method, key endpoints,
                 rate limits, SDK availability, webhook support.
2. SCAFFOLD    — Plan file structure: config file, client module, types, test file.
                 Output the file tree before writing any code.
3. CONFIG      — Write environment variable setup (.env.example, config loader).
                 Never hardcode secrets. Always use env vars or secret managers.
4. CLIENT CODE — Write typed API client: init, core methods, error handling, retry logic,
                 response parsing. Include type hints and docstrings.
5. TEST        — Write at minimum one happy-path and one error-case test using mocked HTTP.
                 No live API calls in tests.

COMMON SERVICE PATTERNS

STRIPE
- Auth: Bearer token (STRIPE_SECRET_KEY). Use stripe-python or stripe-node SDK.
- Key: idempotency keys on POST, webhook signature verification (stripe.Webhook.construct_event).
- Always scaffold: stripe_client.py, webhook_handler.py, .env.example.
- Never store card data directly — always use Stripe Elements or Payment Intents.

SUPABASE
- Auth: SUPABASE_URL + SUPABASE_ANON_KEY (public) / SERVICE_ROLE_KEY (server).
- Use supabase-py or @supabase/supabase-js.
- Key: Row Level Security (always mention it), auth flows, realtime subscriptions.
- Always scaffold: supabase_client.py, auth_helpers.py, .env.example.

WEBHOOKS (generic)
- Inbound: Validate HMAC-SHA256 signature. Parse JSON body. Respond 200 immediately, process async.
- Outbound: Retry with exponential backoff. Log delivery attempts. Store payload + status.
- Always scaffold: webhook_receiver.py, signature_validator.py, webhook_dispatcher.py.

REST CLIENTS (generic)
- Use httpx (Python) or axios (JS). BaseClient class with base_url, default headers,
  _get/_post/_patch/_delete helpers. Timeout config, retry on 429/5xx, structured error parsing.

OAUTH2 FLOWS
- Authorization Code: /authorize redirect, /callback token exchange, token storage.
- Client Credentials: token fetch + cache with expiry check.
- Always scaffold: oauth_client.py, token_store.py, .env.example.

OPENAI / LLM APIs
- Auth: OPENAI_API_KEY. Use openai-python SDK.
- Key: streaming responses, function/tool calling schema, token counting, retry on 429.
- Always scaffold: llm_client.py, prompt_templates.py, streaming_handler.py.

OUTPUT FORMAT RULES
Every response must follow this structure:
1. FILE TREE — Show scaffolded files before any code block.
2. CODE BLOCKS — One fenced block per file, labeled with the filename.
3. ENV EXAMPLE — Always include a .env.example block.
4. TEST FILE — Always include a test file, even if minimal.
5. NEXT STEPS — Numbered checklist of what the user must do to wire it up.
6. CONFIDENCE — Rate confidence (high/medium/low) and flag any assumptions made.

WHAT TO AVOID
- Never hardcode API keys, secrets, or credentials in code.
- Never write untested, untyped, or stub-only integration code.
- Never skip error handling — every HTTP call must handle 4xx and 5xx explicitly.
- Never assume API behavior without stating the assumption clearly.
- Never output a partial file tree — always show the complete scaffold.
- Never suggest deprecated methods (e.g., requests.get without session).
- Never skip webhook signature verification — always implement it.
- Never write synchronous code for async-native services.
"""

REFINE_PATTERN = {
    "description": "Governs multi-turn conversations, error fixing, and scope changes.",
    "session_state_keys": ["service","auth_method","scaffolded_files","open_issues","turn_history","confidence","language"],
    "intent_patterns": {
        "error_fix": [r"(?i)(error|exception|traceback|4\d\d|5\d\d|failed|not working)", r"(?i)(fix|debug|why is|what's wrong)"],
        "scope_change": [r"(?i)(also add|now add|extend|include|add endpoint)", r"(?i)(swap|replace|switch to|use.*instead)"],
        "clarification": [r"(?i)(what does|explain|how does|why did|tell me more)"],
        "verification": [r"(?i)(does this work|is this correct|check|verify|review)"],
        "scope_narrow": [r"(?i)(just|only|skip|remove|without|don't include)"],
        "next_steps": [r"(?i)(what next|now what|how do I|next step)"],
    },
    "turn_handlers": {
        "error_fix": {
            "strategy": "Parse error to identify HTTP status, exception type, endpoint. Diagnose root cause first, then provide corrected code block with inline comments. Update scaffolded file in session state.",
            "output_additions": ["fixed_file","root_cause_explanation","prevention_tip"],
        },
        "scope_change": {
            "strategy": "Acknowledge scope delta. Output only new/changed files. If swapping providers, generate diff-style migration note plus new client file.",
            "output_additions": ["changed_files_only","migration_notes"],
        },
        "clarification": {
            "strategy": "Answer in plain language first, then optionally show a minimal snippet. Do not regenerate the full scaffold.",
            "output_additions": ["explanation","optional_snippet"],
        },
        "verification": {
            "strategy": "Read pasted code. Identify: security issues, error handling gaps, type safety issues, anti-patterns. Return scored review with [CRITICAL], [WARNING], [SUGGESTION] tags.",
            "output_additions": ["review_items","severity_scores","corrected_snippet"],
        },
    },
    "fallback": {"strategy": "Ask one clarifying question. Do not regenerate full scaffold on ambiguous input."},
    "context_accumulation": {
        "max_turns_in_context": 10,
        "compression_strategy": "After 10 turns, summarize: service, auth, files generated, open issues, confidence. Compress to single block.",
    },
    "guard_rails": [
        "Never regenerate full scaffold unless user explicitly requests a full reset.",
        "Never change auth method mid-session without user confirmation.",
        "Never fix errors by removing error handling — resolve root cause.",
        "Always state confidence level after any error fix.",
        "If scope change is breaking, confirm before proceeding.",
    ],
}


class ScaffoldedFile(BaseModel):
    path: str
    language: Literal["python","javascript","typescript","shell","yaml","toml","env"]
    purpose: str
    content: str
    is_new: bool = True

class CodeBlock(BaseModel):
    label: str
    language: str
    code: str
    description: Optional[str] = None

class TestInstruction(BaseModel):
    step: int
    action: str
    expected_output: str
    environment: Literal["local","ci","staging","production"] = "local"

class ChecklistItem(BaseModel):
    priority: Literal["critical","high","medium","low"]
    status: Literal["pending","in_progress","done"] = "pending"
    item: str
    detail: Optional[str] = None

class IntegrationMeta(BaseModel):
    service: str
    auth_method: str
    language: Literal["python","javascript","typescript"]
    sdk_used: Optional[str] = None
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    confidence_label: Literal["high","medium","low"]
    assumptions: List[str] = []
    generated_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
    session_id: Optional[str] = None
    turn: int = 1
    ui_hints: Dict[str,Any] = Field(default_factory=lambda: {
        "show_file_tree": True,
        "highlight_env_vars": True,
        "expand_first_file": True,
        "show_test_runner": True,
        "checklist_collapsible": True,
    })

class IntegrationOutput(BaseModel):
    """
    Top-level output schema for NasusAPIIntegrator.
    Nasus frontend rendering order:
      1. meta  2. file_tree  3. scaffolded_files  4. env_example
      5. test_instructions  6. next_step_checklist  7. review_items
    """
    meta: IntegrationMeta
    file_tree: List[str]
    scaffolded_files: List[ScaffoldedFile]
    env_example: str
    code_blocks: List[CodeBlock] = []
    test_instructions: List[TestInstruction]
    next_step_checklist: List[ChecklistItem]
    review_items: Optional[List[Dict[str,str]]] = None
    session_summary: Optional[str] = None


class NasusAPIIntegrator:
    """
    Drop-in orchestration class for the Nasus API Integrator sub-agent.
    Usage:
        integrator = NasusAPIIntegrator()
        result = integrator.integrate("integrate Stripe payments into my FastAPI app")
        refined = integrator.refine("also add webhook handling", previous_result=result)
        print(integrator.export_markdown(result))
    """
    def __init__(self, language: str = "python", session_id: Optional[str] = None):
        self.language = language
        self.session_id = session_id or str(uuid.uuid4())[:8]
        self.turn = 0
        self.history: List[Dict[str,str]] = []
        self.scaffolded_paths: List[str] = []

    def _detect_intent(self, message: str) -> str:
        for intent, patterns in REFINE_PATTERN["intent_patterns"].items():
            for pattern in patterns:
                if re.search(pattern, message):
                    return intent
        return "new_integration"

    def _detect_service(self, message: str) -> str:
        known = {
            "stripe": r"stripe", "supabase": r"supabase",
            "openai": r"openai|gpt|llm", "webhook": r"webhook",
            "oauth": r"oauth|oauth2", "postgres": r"postgres|postgresql",
            "mongodb": r"mongo|mongodb", "rest": r"rest|http client|api client",
        }
        for service, pattern in known.items():
            if re.search(pattern, message, re.IGNORECASE):
                return service
        return "custom_rest"

    def integrate(self, user_message: str) -> IntegrationOutput:
        self.turn += 1
        self.history.append({"role": "user", "content": user_message})
        service = self._detect_service(user_message)
        return self._generate_stripe_mock(turn=self.turn)

    def refine(self, user_message: str, previous_result: IntegrationOutput) -> IntegrationOutput:
        self.turn += 1
        intent = self._detect_intent(user_message)
        self.history.append({"role": "user", "content": user_message})
        result = self._generate_stripe_mock(turn=self.turn)
        result.session_summary = (
            f"Session {self.session_id} | Turn {self.turn} | Intent: {intent} | "
            f"Files: {len(self.scaffolded_paths)} scaffolded"
        )
        return result

    def _generate_stripe_mock(self, turn: int) -> IntegrationOutput:
        """
        In production: send SYSTEM_PROMPT + user_message to LLM, parse response into IntegrationOutput.
        Here: fully populated Stripe mock for demo purposes.
        """
        stripe_client_code = (
            'import os\nimport stripe\nfrom typing import Optional\n\n'
            'stripe.api_key = os.environ["STRIPE_SECRET_KEY"]\nstripe.api_version = "2023-10-16"\n\n'
            'class StripeClient:\n'
            '    """Typed Stripe client for payment intent lifecycle."""\n\n'
            '    def create_customer(self, email: str, name: str) -> stripe.Customer:\n'
            '        return stripe.Customer.create(email=email, name=name)\n\n'
            '    def create_payment_intent(\n'
            '        self, amount_cents: int, currency: str = "usd",\n'
            '        customer_id: Optional[str] = None, idempotency_key: Optional[str] = None,\n'
            '    ) -> stripe.PaymentIntent:\n'
            '        kwargs: dict = dict(amount=amount_cents, currency=currency,\n'
            '            automatic_payment_methods={"enabled": True})\n'
            '        if customer_id:\n            kwargs["customer"] = customer_id\n'
            '        return stripe.PaymentIntent.create(**kwargs, idempotency_key=idempotency_key)\n\n'
            '    def retrieve_payment_intent(self, pi_id: str) -> stripe.PaymentIntent:\n'
            '        return stripe.PaymentIntent.retrieve(pi_id)\n\n'
            '    def cancel_payment_intent(self, pi_id: str) -> stripe.PaymentIntent:\n'
            '        return stripe.PaymentIntent.cancel(pi_id)\n'
        )

        webhook_code = (
            'import os\nimport stripe\nfrom fastapi import APIRouter, Request, HTTPException\n\n'
            'router = APIRouter()\nWEBHOOK_SECRET = os.environ["STRIPE_WEBHOOK_SECRET"]\n\n'
            '@router.post("/webhooks/stripe")\nasync def stripe_webhook(request: Request):\n'
            '    payload = await request.body()\n'
            '    sig_header = request.headers.get("stripe-signature")\n'
            '    try:\n'
            '        event = stripe.Webhook.construct_event(payload, sig_header, WEBHOOK_SECRET)\n'
            '    except stripe.error.SignatureVerificationError:\n'
            '        raise HTTPException(status_code=400, detail="Invalid signature")\n'
            '    if event["type"] == "payment_intent.succeeded":\n'
            '        pass  # TODO: fulfil order\n'
            '    elif event["type"] == "payment_intent.payment_failed":\n'
            '        pass  # TODO: notify customer\n'
            '    return {"status": "ok"}\n'
        )

        test_code = (
            'import pytest\nfrom unittest.mock import patch, MagicMock\n'
            'from src.integrations.stripe_client import StripeClient\n\n'
            '@patch("stripe.PaymentIntent.create")\n'
            'def test_create_payment_intent_success(mock_create):\n'
            '    mock_pi = MagicMock()\n    mock_pi.id = "pi_test_123"\n'
            '    mock_pi.status = "requires_payment_method"\n'
            '    mock_create.return_value = mock_pi\n'
            '    client = StripeClient()\n'
            '    pi = client.create_payment_intent(amount_cents=2000, currency="usd")\n'
            '    assert pi.id == "pi_test_123"\n    mock_create.assert_called_once()\n\n'
            '@patch("stripe.PaymentIntent.create")\n'
            'def test_create_payment_intent_card_declined(mock_create):\n'
            '    import stripe as s\n'
            '    mock_create.side_effect = s.error.CardError(\n'
            '        "Your card was declined.", param="card", code="card_declined")\n'
            '    with pytest.raises(s.error.CardError):\n'
            '        StripeClient().create_payment_intent(amount_cents=2000)\n'
        )

        env_example = (
            "# Stripe\n"
            "STRIPE_SECRET_KEY=sk_test_...\n"
            "STRIPE_WEBHOOK_SECRET=whsec_...\n"
            "STRIPE_PUBLISHABLE_KEY=pk_test_...\n"
        )

        files = [
            ScaffoldedFile(path="src/integrations/stripe_client.py", language="python",
                purpose="Typed Stripe client — customer + payment intent lifecycle",
                content=stripe_client_code),
            ScaffoldedFile(path="src/integrations/webhook_handler.py", language="python",
                purpose="FastAPI route for inbound Stripe webhooks with signature verification",
                content=webhook_code),
            ScaffoldedFile(path="tests/test_stripe.py", language="python",
                purpose="Pytest: happy-path + card-declined error case",
                content=test_code),
        ]
        self.scaffolded_paths = [f.path for f in files] + [".env.example"]

        return IntegrationOutput(
            meta=IntegrationMeta(
                service="Stripe", auth_method="Bearer Token (STRIPE_SECRET_KEY)",
                language="python", sdk_used="stripe-python 7.x",
                confidence_score=0.95, confidence_label="high",
                assumptions=["FastAPI web framework","Python 3.10+","stripe-python 7.x","pytest"],
                session_id=self.session_id, turn=turn,
            ),
            file_tree=self.scaffolded_paths,
            scaffolded_files=files,
            env_example=env_example,
            test_instructions=[
                TestInstruction(step=1, action="pip install stripe pytest", expected_output="No errors"),
                TestInstruction(step=2, action="Copy .env.example to .env and fill in test keys", expected_output=".env exists with STRIPE_SECRET_KEY"),
                TestInstruction(step=3, action="pytest tests/test_stripe.py -v", expected_output="2 passed"),
                TestInstruction(step=4, action="stripe listen --forward-to localhost:8000/webhooks/stripe", expected_output="Stripe CLI connected"),
                TestInstruction(step=5, action="stripe trigger payment_intent.succeeded", expected_output="200 OK from webhook handler"),
            ],
            next_step_checklist=[
                ChecklistItem(priority="critical", item="Set STRIPE_SECRET_KEY in your .env file"),
                ChecklistItem(priority="critical", item="Set STRIPE_WEBHOOK_SECRET after creating endpoint in Stripe Dashboard"),
                ChecklistItem(priority="high", item="Mount webhook router: app.include_router(router)"),
                ChecklistItem(priority="high", item="Run tests: pytest tests/test_stripe.py -v"),
                ChecklistItem(priority="medium", item="Register webhook endpoint in Stripe Dashboard -> Developers -> Webhooks"),
                ChecklistItem(priority="medium", item="Subscribe to: payment_intent.succeeded, payment_intent.payment_failed"),
                ChecklistItem(priority="low", item="Enable Stripe Radar rules for fraud protection"),
                ChecklistItem(priority="low", item="Use stripe-cli for local webhook testing"),
            ],
        )

    def export_markdown(self, result: IntegrationOutput) -> str:
        lines = [
            f"# Nasus API Integrator — {result.meta.service}",
            f"\n**Auth:** {result.meta.auth_method} | **SDK:** {result.meta.sdk_used} | "
            f"**Confidence:** {result.meta.confidence_label} ({result.meta.confidence_score:.0%})",
            f"**Session:** {result.meta.session_id} | Turn {result.meta.turn}\n",
        ]
        if result.meta.assumptions:
            lines.append("**Assumptions:**")
            for a in result.meta.assumptions:
                lines.append(f"- {a}")
            lines.append("")
        lines += ["## File Tree\n```", *result.file_tree, "```\n"]
        lines += ["## .env.example\n```env", result.env_example.strip(), "```\n"]
        for sf in result.scaffolded_files:
            lines += [f"## `{sf.path}`\n*{sf.purpose}*\n", f"```{sf.language}", sf.content.strip(), "```\n"]
        lines.append("## Test Instructions")
        for ti in result.test_instructions:
            lines.append(f"{ti.step}. **{ti.action}**\n   - Expected: {ti.expected_output}")
        lines.append("\n## Next Steps")
        for p in ["critical","high","medium","low"]:
            items = [i for i in result.next_step_checklist if i.priority == p]
            if items:
                lines.append(f"\n### {p.upper()}")
                for item in items:
                    icon = {"pending":"[ ]","in_progress":"[~]","done":"[x]"}.get(item.status,"[ ]")
                    lines.append(f"- {icon} {item.item}")
        return "\n".join(lines)

    def export_json(self, result: IntegrationOutput) -> str:
        return result.model_dump_json(indent=2)


if __name__ == "__main__":
    print("=" * 65)
    print("NASUS API INTEGRATOR — Demo Run")
    print("=" * 65)

    integrator = NasusAPIIntegrator(language="python")

    print("\n[TURN 1] integrate Stripe payments into my FastAPI app")
    result = integrator.integrate("integrate Stripe payments into my FastAPI app")
    print(f"  Service    : {result.meta.service}")
    print(f"  Auth       : {result.meta.auth_method}")
    print(f"  SDK        : {result.meta.sdk_used}")
    print(f"  Confidence : {result.meta.confidence_label} ({result.meta.confidence_score:.0%})")
    print(f"  Files      :")
    for p in result.file_tree:
        print(f"    {p}")
    print(f"  Checklist  : {len(result.next_step_checklist)} items")

    print("\n[TURN 2] also add webhook handling for payment failures")
    refined = integrator.refine("also add webhook handling for payment failures", previous_result=result)
    print(f"  Intent detected : scope_change")
    print(f"  Session summary : {refined.session_summary}")

    out = Path("code")
    out.mkdir(exist_ok=True)
    (out / "nasus_api_integrator_demo.md").write_text(integrator.export_markdown(result))
    (out / "nasus_api_integrator_demo.json").write_text(integrator.export_json(result))
    print(f"\n  Exported: code/nasus_api_integrator_demo.md")
    print(f"  Exported: code/nasus_api_integrator_demo.json")
    print("\n" + "=" * 65)
    print("Demo complete. NasusAPIIntegrator ready for Nasus layer.")
    print("=" * 65)
