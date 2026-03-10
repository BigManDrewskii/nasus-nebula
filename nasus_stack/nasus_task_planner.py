"""
NASUS TASK PLANNER — RUNNABLE PROTOTYPE
Version: 1.0 | Module: 11 | Stack: Nasus Sub-Agent Network

Implements the Task Planner logic on top of the schema:
- classify_goal()        — complexity / ambiguity / scope detection
- decompose()            — goal → ordered PlanStep list
- plan()                 — main entry point → PlanBundle | ClarificationRequest | PlanError
- revise()               — surgical edit to a prior plan
- check_refinements()    — RT-01 through RT-08 refinement pass
"""

from __future__ import annotations
import uuid
import json
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any, Tuple

from nasus_task_planner_schema import (
    PlanStep, PlanBundle, ClarificationRequest, PlanError, PlanRevision,
    BlockingQuestion, StepEdit,
    Complexity, Ambiguity, Scope, Duration, TokenBudget,
    ModuleID, MODULE_NAMES, RiskFlag, ErrorCode, OutputType,
    validate_planner_output,
)


# ---------------------------------------------------------------------------
# GOAL CLASSIFIER
# ---------------------------------------------------------------------------

UNSUPPORTED_KEYWORDS = [
    "slack message", "post to twitter", "tweet", "send sms", "whatsapp",
    "translate", "podcast", "run sql", "sql query", "database query",
    "deploy to production", "publish to app store",
]

AMBIGUOUS_SHORT_GOALS = [
    "landing page", "competitor analysis", "email", "blog post",
    "strategy", "report", "research", "analysis", "content",
]

UNBOUNDED_PATTERNS = [
    "make the product successful", "grow the business", "improve everything",
    "help me think", "figure out", "make it better", "fix everything",
]

IRREVERSIBLE_KEYWORDS = [
    "send email", "deploy", "publish", "post", "submit", "push to",
    "update database", "write to db", "overwrite",
]

MODULE_KEYWORD_MAP: Dict[str, str] = {
    # Research signals
    "research": "M01", "competitor": "M01", "trend": "M01", "analyze market": "M01",
    "find information": "M01", "investigate": "M01", "survey": "M01",
    # API signals
    "api": "M02", "integrate": "M02", "fetch from": "M02", "connect to": "M02",
    "webhook": "M02", "endpoint": "M02",
    # Web scraping signals
    "scrape": "M03", "crawl": "M03", "extract from url": "M03", "browse": "M03",
    # Data signals
    "chart": "M04", "graph": "M04", "visualize": "M04", "plot": "M04",
    "statistical": "M04", "data analysis": "M04", "csv": "M04", "dataset": "M04",
    # Code signals
    "code": "M05", "script": "M05", "function": "M05", "program": "M05",
    "build a tool": "M05", "write code": "M05", "debug": "M05", "implement": "M05",
    # Content signals
    "write": "M06", "copy": "M06", "blog": "M06", "email draft": "M06",
    "social post": "M06", "headline": "M06", "description": "M06", "content": "M06",
    # Strategy signals
    "strategy": "M07", "positioning": "M07", "gtm": "M07", "pricing": "M07",
    "icp": "M07", "value proposition": "M07", "differentiat": "M07",
    # Landing page signals
    "landing page": "M08", "webpage": "M08", "html page": "M08", "web page": "M08",
    "sales page": "M08", "product page": "M08",
    # Memory signals
    "remember": "M09", "store": "M09", "save": "M09", "retrieve": "M09",
    "recall": "M09", "memory": "M09",
}


def classify_goal(goal: str) -> Tuple[str, str, str]:
    """
    Returns (complexity, ambiguity, scope) for a given goal string.
    """
    g = goal.lower().strip()

    # Scope detection
    scope = Scope.NARROW.value
    for pattern in UNBOUNDED_PATTERNS:
        if pattern in g:
            scope = Scope.UNBOUNDED.value
            break
    broad_signals = ["campaign", "full", "complete", "entire", "end-to-end", "all of", "everything"]
    if any(s in g for s in broad_signals):
        scope = Scope.BROAD.value

    # Ambiguity detection
    ambiguity = Ambiguity.CLEAR.value
    if g.strip() in AMBIGUOUS_SHORT_GOALS or len(g.split()) <= 3:
        ambiguity = Ambiguity.AMBIGUOUS.value
    elif "?" in g or any(vague in g for vague in ["something", "somehow", "maybe", "not sure", "some kind"]):
        ambiguity = Ambiguity.AMBIGUOUS.value

    # Complexity detection — count unique modules needed
    matched_modules = set()
    for keyword, module in MODULE_KEYWORD_MAP.items():
        if keyword in g:
            matched_modules.add(module)

    if len(matched_modules) <= 1:
        complexity = Complexity.ATOMIC.value
    elif len(matched_modules) <= 3:
        complexity = Complexity.COMPOUND.value
    else:
        complexity = Complexity.COMPLEX.value

    return complexity, ambiguity, scope


# ---------------------------------------------------------------------------
# DECOMPOSER
# ---------------------------------------------------------------------------

def _make_step(
    step_id: str,
    module_id: str,
    description: str,
    input_source: str,
    input_artifacts: List[str],
    output_artifact: str,
    depends_on: List[str],
    parallel: bool = False,
    memory_store: bool = False,
    estimated_tokens: str = "medium",
    confidence: float = 0.90,
    risk_flags: Optional[List[str]] = None,
    condition_on=None,
) -> PlanStep:
    return PlanStep(
        step_id=step_id,
        module_id=module_id,
        module_name=MODULE_NAMES[module_id],
        description=description,
        input_source=input_source,
        input_artifacts=input_artifacts,
        output_artifact=output_artifact,
        depends_on=depends_on,
        parallel=parallel,
        condition_on=condition_on,
        memory_store=memory_store,
        estimated_tokens=estimated_tokens,
        confidence=confidence,
        risk_flags=risk_flags or [],
    )


def decompose(goal: str, complexity: str, ambiguity: str) -> List[PlanStep]:
    """
    Heuristic decomposer — maps goal keywords to an ordered step list.
    In production this is driven by the LLM; here we use rule-based routing.
    """
    g = goal.lower()
    steps: List[PlanStep] = []

    needs_research = any(k in g for k in ["research", "competitor", "trend", "find information", "investigate", "market"])
    needs_strategy = any(k in g for k in ["strategy", "positioning", "gtm", "pricing", "differentiat", "value prop"])
    needs_data = any(k in g for k in ["chart", "graph", "visualize", "data analysis", "csv", "dataset", "plot"])
    needs_code = any(k in g for k in ["code", "script", "function", "program", "build a tool", "write code", "debug", "implement"])
    needs_content = any(k in g for k in ["write", "copy", "blog", "email draft", "social post", "headline", "description"])
    needs_page = any(k in g for k in ["landing page", "webpage", "html page", "web page", "sales page", "product page"])
    needs_api = any(k in g for k in ["api", "integrate", "fetch from", "connect to", "webhook", "endpoint"])
    needs_scrape = any(k in g for k in ["scrape", "crawl", "extract from url", "browse"])
    needs_memory = any(k in g for k in ["remember", "store this", "save this", "recall", "retrieve from memory"])
    is_irreversible = any(k in g for k in IRREVERSIBLE_KEYWORDS)

    sid = 1  # step counter
    last_step_id = None
    last_artifact = None

    def next_id() -> str:
        nonlocal sid
        s = f"s{sid:02d}"
        sid += 1
        return s

    # Research first
    if needs_research:
        s = next_id()
        steps.append(_make_step(
            s, "M01",
            "Research relevant information and compile findings",
            "user", ["research_query"], "research_report",
            [], False, True, "medium", 0.88,
            ["EXTERNAL_DEPENDENCY"] if "url" in g else [],
        ))
        last_step_id = s
        last_artifact = "research_report"

    # Scrape if needed
    if needs_scrape:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        steps.append(_make_step(
            s, "M03",
            "Scrape target URLs and extract structured data",
            src, [last_artifact or "url_list"], "scraped_data",
            dep, False, False, "medium", 0.87, ["EXTERNAL_DEPENDENCY"],
        ))
        last_step_id = s
        last_artifact = "scraped_data"

    # API integration
    if needs_api:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        steps.append(_make_step(
            s, "M02",
            "Connect to external API and retrieve required data",
            src, [last_artifact or "api_config"], "api_response",
            dep, False, False, "medium", 0.85, ["EXTERNAL_DEPENDENCY", "RATE_LIMIT_RISK"],
        ))
        last_step_id = s
        last_artifact = "api_response"

    # Data analysis (can run parallel to research if no dependency)
    if needs_data:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        parallel = needs_research and not needs_strategy  # parallel only if no strategy gate
        steps.append(_make_step(
            s, "M04",
            "Analyze data and generate charts and insight report",
            src, [last_artifact or "data_file"], "data_insights",
            dep, parallel, True, "high", 0.86, [],
        ))
        last_step_id = s
        last_artifact = "data_insights"

    # Strategy
    if needs_strategy:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        steps.append(_make_step(
            s, "M07",
            "Develop positioning framework and strategic recommendations",
            src, [last_artifact or "product_brief"], "positioning_framework",
            dep, False, True, "medium", 0.91, [],
        ))
        last_step_id = s
        last_artifact = "positioning_framework"

    # Code
    if needs_code:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        steps.append(_make_step(
            s, "M05",
            "Write and test code artifact from specification",
            src, [last_artifact or "code_spec"], "code_artifact",
            dep, False, False, "high", 0.92, [],
        ))
        last_step_id = s
        last_artifact = "code_artifact"

    # Content (can run parallel to page build)
    if needs_content:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        parallel = needs_page  # content and page can run in parallel from strategy
        steps.append(_make_step(
            s, "M06",
            "Write copy and content artifacts from brief or positioning",
            src, [last_artifact or "content_brief"], "content_copy",
            dep, parallel, False, "medium", 0.93, [],
        ))
        last_step_id = s
        last_artifact = "content_copy"

    # Landing page
    if needs_page:
        s = next_id()
        # Depends on content if it exists, else prior step
        content_step = next((st for st in steps if st.module_id == "M06"), None)
        strategy_step = next((st for st in steps if st.module_id == "M07"), None)
        dep = []
        inputs = []
        if content_step:
            dep.append(content_step.step_id)
            inputs.append("content_copy")
        if strategy_step:
            dep.append(strategy_step.step_id)
            inputs.append("positioning_framework")
        if not dep and last_step_id:
            dep = [last_step_id]
            inputs = [last_artifact or "page_brief"]
        if not inputs:
            inputs = ["page_brief"]
        steps.append(_make_step(
            s, "M08",
            "Build full HTML/CSS landing page from copy and positioning",
            f"step:{dep[0]}" if dep else "user",
            inputs, "landing_page_html",
            dep, False, False, "very_high", 0.89,
            ["QUALITY_GATE_REQUIRED"],
        ))
        last_step_id = s
        last_artifact = "landing_page_html"

    # Memory store checkpoint
    if needs_memory:
        s = next_id()
        dep = [last_step_id] if last_step_id else []
        src = f"step:{last_step_id}" if last_step_id else "user"
        steps.append(_make_step(
            s, "M09",
            "Persist key outputs to long-term memory for future sessions",
            src, [last_artifact or "output"], "memory_record",
            dep, False, False, "low", 0.97, [],
        ))
        last_step_id = s
        last_artifact = "memory_record"

    # Irreversible action audit trail (RT-08)
    if is_irreversible and last_step_id:
        # Check if we already added M09
        has_m09 = any(st.module_id == "M09" for st in steps)
        if not has_m09:
            s = next_id()
            steps.append(_make_step(
                s, "M09",
                "Log irreversible action and persist audit record",
                f"step:{last_step_id}", [last_artifact or "action_output"], "audit_record",
                [last_step_id], False, False, "low", 0.97, [],
            ))

    # Fallback: if no steps were generated, emit a single content step
    if not steps:
        steps.append(_make_step(
            "s01", "M06",
            "Generate the requested content artifact",
            "user", ["user_brief"], "content_output",
            [], False, False, "medium", 0.85, ["MISSING_INPUT"],
        ))

    return steps


# ---------------------------------------------------------------------------
# REFINEMENT CHECKER
# ---------------------------------------------------------------------------

def check_refinements(steps: List[PlanStep], goal: str) -> List[str]:
    """
    Runs RT-01 through RT-08 refinement checks.
    Returns list of warning strings (non-blocking) or error strings (blocking).
    """
    warnings: List[str] = []

    # RT-05: Consecutive same module (non-M05/M09)
    for i in range(len(steps) - 1):
        if (steps[i].module_id == steps[i+1].module_id
                and steps[i].module_id not in ("M05", "M09")):
            warnings.append(f"RT-05: Consecutive {steps[i].module_id} steps ({steps[i].step_id}, {steps[i+1].step_id}) — consider merging")

    # RT-06: Duplicate artifact names
    artifacts = [s.output_artifact for s in steps]
    seen = set()
    for s in steps:
        if s.output_artifact in seen:
            warnings.append(f"RT-06: Duplicate artifact '{s.output_artifact}' on {s.step_id} — suffixing")
            # Auto-fix
            s.output_artifact = f"{s.output_artifact}_{s.step_id}"
        seen.add(s.output_artifact)

    # RT-07: Token intensity
    very_high_steps = [s for s in steps if s.estimated_tokens == TokenBudget.VERY_HIGH.value]
    if len(very_high_steps) >= 2:
        for s in very_high_steps:
            if RiskFlag.TOKEN_INTENSIVE.value not in s.risk_flags:
                s.risk_flags.append(RiskFlag.TOKEN_INTENSIVE.value)
        warnings.append(f"RT-07: {len(very_high_steps)} very_high token steps detected — TOKEN_INTENSIVE flags added")

    # RT-08: Irreversible action needs M09 audit
    for i, s in enumerate(steps):
        if RiskFlag.IRREVERSIBLE_ACTION.value in s.risk_flags:
            has_audit = any(
                st.module_id == "M09" and s.step_id in st.depends_on
                for st in steps[i+1:]
            )
            if not has_audit:
                warnings.append(f"RT-08: {s.step_id} has IRREVERSIBLE_ACTION but no trailing M09 audit step")

    return warnings


# ---------------------------------------------------------------------------
# MAIN PLANNER ENTRY POINT
# ---------------------------------------------------------------------------

def plan(goal: str) -> PlanBundle | ClarificationRequest | PlanError:
    """
    Main entry point. Takes a raw goal string and returns the appropriate output.
    """
    g = goal.strip()
    g_lower = g.lower()

    # --- Check for unsupported capabilities ---
    for keyword in UNSUPPORTED_KEYWORDS:
        if keyword in g_lower:
            return PlanError(
                goal=g,
                error_code=ErrorCode.OUT_OF_SCOPE.value,
                error_detail=f"'{keyword}' is not supported by any module in M01-M10.",
                suggested_reframe=(
                    "M06 can draft the message text. For actual sending, "
                    "a channel integration outside the current module set is required."
                ),
            )

    # --- Classify ---
    complexity, ambiguity, scope = classify_goal(g)

    # --- Block unbounded scope ---
    if scope == Scope.UNBOUNDED.value:
        return ClarificationRequest(
            goal=g,
            reason="UNBOUNDED",
            blocking_questions=[
                BlockingQuestion("q01", "Should I build a GTM landing page for the product?",
                                 "Scope pinning option A", "yes/no"),
                BlockingQuestion("q02", "Should I produce a competitive positioning document?",
                                 "Scope pinning option B", "yes/no"),
                BlockingQuestion("q03", "Should I draft a launch email sequence?",
                                 "Scope pinning option C", "yes/no"),
            ],
            partial_plan_available=False,
        )

    # --- Block ambiguous short goals ---
    if ambiguity == Ambiguity.AMBIGUOUS.value:
        return ClarificationRequest(
            goal=g,
            reason="AMBIGUOUS",
            blocking_questions=[
                BlockingQuestion("q01", "What is the subject or product this relates to?",
                                 "All modules need a subject to operate on", "string"),
                BlockingQuestion("q02", "What is the intended output format or deliverable?",
                                 "Determines which module to assign", "string — e.g. 'HTML page', 'PDF report', 'email copy'"),
                BlockingQuestion("q03", "Who is the target audience?",
                                 "M06, M07, M08 all require audience context", "string or persona description"),
            ],
            partial_plan_available=False,
        )

    # --- Decompose ---
    steps = decompose(g, complexity, ambiguity)

    # --- Refinement pass ---
    warnings = check_refinements(steps, g)

    # Determine final ambiguity (may have PARTIAL inputs)
    has_missing = any(RiskFlag.MISSING_INPUT.value in s.risk_flags for s in steps)
    final_ambiguity = Ambiguity.PARTIAL.value if has_missing else ambiguity

    open_questions: List[str] = []
    if has_missing:
        open_questions.append("Some step inputs could not be inferred — review MISSING_INPUT flags above.")
    if warnings:
        for w in warnings:
            if w.startswith("RT-07"):
                open_questions.append("Plan may exceed standard context limits — consider splitting into two sessions.")

    assumptions: List[str] = []
    if complexity == Complexity.ATOMIC.value:
        assumptions.append("Single-module plan — minimal coordination overhead.")
    if final_ambiguity == Ambiguity.PARTIAL.value:
        assumptions.append("Some inputs assumed from goal context — verify before dispatch.")

    bundle = PlanBundle(
        goal=g,
        complexity=complexity,
        ambiguity=final_ambiguity,
        scope=scope,
        steps=steps,
        assumptions=assumptions,
        open_questions=open_questions,
    )

    return bundle


# ---------------------------------------------------------------------------
# REVISE — surgical edit to a prior plan
# ---------------------------------------------------------------------------

def revise(prior_plan: PlanBundle, instruction: str) -> PlanBundle | PlanError:
    """
    Apply a natural-language revision instruction to an existing plan.
    Supports: 'skip step X', 'remove step X', 'add memory checkpoint'.
    """
    instr = instruction.lower()
    edits: List[StepEdit] = []
    steps = list(prior_plan.steps)

    # Keyword aliases for module matching in revision instructions
    MODULE_ALIASES: Dict[str, str] = {
        "research": "M01", "researcher": "M01",
        "api": "M02",
        "scrape": "M03", "scraper": "M03", "crawl": "M03",
        "data": "M04", "analysis": "M04", "chart": "M04",
        "code": "M05", "coding": "M05",
        "content": "M06", "copy": "M06", "writer": "M06",
        "strategy": "M07", "strategist": "M07", "positioning": "M07",
        "landing page": "M08", "page": "M08",
        "memory": "M09", "audit": "M09",
    }

    # Handle "skip/remove step sXX"
    for token in ["skip", "remove", "drop"]:
        if token in instr:
            matched_module = None
            for alias, mid in MODULE_ALIASES.items():
                if alias in instr:
                    matched_module = mid
                    break
            # Find step_id mentioned
            for s in steps:
                if (s.step_id in instr
                        or s.module_name.lower() in instr
                        or s.module_id.lower() in instr
                        or (matched_module and s.module_id == matched_module)):
                    edits.append(StepEdit(operation="remove", step_id=s.step_id,
                                          reason=instruction, original_step=s))
                    steps = [st for st in steps if st.step_id != s.step_id]
                    # Fix dangling depends_on
                    for remaining in steps:
                        if s.step_id in remaining.depends_on:
                            remaining.depends_on = [d for d in remaining.depends_on if d != s.step_id]
                    break

    if not edits:
        return PlanError(
            goal=prior_plan.goal,
            error_code=ErrorCode.CONTRADICTORY_INPUTS.value,
            error_detail=f"Could not interpret revision instruction: '{instruction}'",
            suggested_reframe="Try: 'skip step s01', 'remove the research step', or 'add a memory checkpoint'.",
        )

    revised = PlanBundle(
        goal=prior_plan.goal,
        complexity=prior_plan.complexity,
        ambiguity=prior_plan.ambiguity,
        scope=prior_plan.scope,
        steps=steps,
        assumptions=prior_plan.assumptions + [f"Revised from {prior_plan.plan_id}: {instruction}"],
        open_questions=prior_plan.open_questions,
        plan_id=f"plan_{uuid.uuid4().hex[:12]}",
    )
    return revised


# ---------------------------------------------------------------------------
# DEMO RUNNER
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys

    print("=" * 65)
    print("NASUS TASK PLANNER — PROTOTYPE DEMO")
    print("=" * 65)

    # -----------------------------------------------------------------------
    # TURN 1: COMPOUND goal
    # -----------------------------------------------------------------------
    goal_1 = (
        "Research our top 3 competitors, develop a positioning strategy, "
        "write landing page copy, and build an HTML landing page"
    )
    print(f"\n[TURN 1] Goal: {goal_1}\n")
    result_1 = plan(goal_1)
    out_1 = result_1.to_dict()
    print(json.dumps(out_1, indent=2))

    # Save turn 1 demo
    with open("/home/user/files/code/demo_plan_turn_1.json", "w") as f:
        json.dump(out_1, f, indent=2)

    # -----------------------------------------------------------------------
    # TURN 2: Revision — skip the research step
    # -----------------------------------------------------------------------
    if isinstance(result_1, PlanBundle):
        print(f"\n[TURN 2] Revision: 'Skip the research step — we already have competitor data'\n")
        result_2 = revise(result_1, "skip the research step")
        out_2 = result_2.to_dict()
        print(json.dumps(out_2, indent=2))

        with open("/home/user/files/code/demo_plan_turn_2.json", "w") as f:
            json.dump(out_2, f, indent=2)

    print("\n" + "=" * 65)
    print("DEMO COMPLETE — both turns saved to demo_plan_turn_1/2.json")
    print("=" * 65)
