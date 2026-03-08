# Nasus vs Reference Projects — Side-by-Side Comparison Notes

## What Nasus Already Has (Strong)
1. **Multi-agent pipeline**: Planning → Approval → Execution → Verification → Self-Correction (3 attempts)
2. **33 tools** across 5 categories (file, browser, code, web, memory)
3. **Browser automation** via Playwright sidecar (ARIA snapshots, screenshots, click, type, scroll, eval, tabs)
4. **Docker sandboxing** for code execution with per-task isolation
5. **Context compression** — summarizes old messages when hitting 60-85% of context window
6. **Semantic memory** — local embeddings via Transformers.js (all-MiniLM-L6-v2), vector search via voy-search
7. **Gateway circuit breaker** — health tracking, exponential backoff, automatic failover
8. **Rate limiter** — token bucket pattern
9. **Model-specific prompt adaptation** — Claude, GPT, DeepSeek R1/V3, Gemini, Qwen, Llama all get tailored hints
10. **Permission system** — dangerous bash commands require approval
11. **Self-correction loop** — verification agent checks results, feeds corrections back (up to 3 attempts)
12. **Plan approval UI** — user can review/approve/reject plans before execution
13. **Workspace isolation** — each task gets its own directory
14. **SQLite persistence** — task history, traces, memory items
15. **OS keyring** for API key storage

## What Reference Projects Have That Nasus Doesn't

### 1. MCP (Model Context Protocol) Support
- **OWL**: Full MCP integration for standardized tool invocation
- **Suna**: MCP support mentioned
- **OpenHands**: MCP client support
- **Nasus**: Zero MCP code. Only one mention in a comment.
- **Verdict**: HIGH VALUE. MCP is becoming the standard for tool interop. Adding MCP client support would let Nasus use any MCP server (file systems, databases, APIs, etc.) without writing custom tools.

### 2. Sub-Agent Delegation / Parallel Agents
- **OpenHands**: Sub-agent delegation — can spawn child agents for subtasks
- **OWL**: Dual-role collaboration with dynamic agent spawning
- **OpenManus**: Multi-agent collaborative system
- **Nasus**: Single execution agent, sequential only. The orchestrator is a singleton. No parallel execution.
- **Verdict**: MEDIUM VALUE. Nasus's sequential approach works well for most tasks. Parallel agents would help for research-heavy tasks (search multiple sources simultaneously) but adds significant complexity.

### 3. Reinforcement Learning / Self-Improvement
- **OpenManus**: GRPO-based RL tuning for agent improvement
- **Nasus**: No RL or self-improvement beyond the self-correction loop
- **Verdict**: LOW VALUE for a desktop app. RL requires training infrastructure. Not practical for Nasus's architecture.

### 4. Multi-Modal Capabilities
- **OWL**: Image classification, speech recognition, video keyframe extraction, document parsing
- **Nasus**: Has browser screenshots and ARIA snapshots, but no image understanding, no speech, no document parsing
- **Verdict**: MEDIUM VALUE. Vision model integration (sending screenshots to a vision LLM for understanding) would be high value. Speech/video are niche.

### 5. Structured Output / JSON Mode
- **OpenHands**: Uses structured output for agent responses
- **Nasus**: Planning agent asks for JSON but parses it manually. No `response_format: { type: "json_object" }` or tool_choice forcing.
- **Verdict**: HIGH VALUE. Using structured output / tool_choice: "required" would make tool calls more reliable, especially with weaker models.

### 6. Context Condensation Strategies
- **OpenHands**: Multiple condenser strategies — LLM-based, observation masking, recent-events, amortized
- **Nasus**: Single strategy — keep first 3 + last 5 messages, summarize the rest with a cheap model
- **Verdict**: MEDIUM VALUE. Nasus's approach works but could be more sophisticated. Observation masking (trimming large tool outputs) would help.

### 7. Tool Masking / Dynamic Tool Selection
- **Nasus**: Has the infrastructure (`maskInactiveTools` in ContextBuilder) but it's disabled: `maskInactiveTools: false // masking disabled until tool-phase logic is added`
- **Verdict**: HIGH VALUE (already built, just needs activation). Sending all 33 tools to every LLM call wastes tokens and confuses weaker models. Phase-aware tool masking would be a quick win.

### 8. Browser Use Patterns
- **Browser Use**: Vision-based page analysis (no DOM reliance), 89.1% on WebVoyager
- **Skyvern**: Vision-driven, no brittle selectors
- **Agent S**: GUI automation using vision models, surpassed human performance on OSWorld
- **Nasus**: Has ARIA snapshots + screenshots but doesn't send screenshots to vision models for understanding. Relies on ARIA tree + CSS selectors.
- **Verdict**: HIGH VALUE. Adding vision model analysis of screenshots would make browser automation much more robust. The screenshots are already being captured — they just need to be sent to a vision-capable model.

## What Nasus Has That References Don't
1. **Desktop-native** — Tauri app, not a web app or CLI tool
2. **Prompt adaptation per model** — No reference project does this
3. **Plan approval UI** — Most agents auto-execute without user review
4. **Cost estimation** — Real-time token/cost tracking
5. **Gateway failover** — Circuit breaker with exponential backoff
6. **OS keyring integration** — Most store keys in env vars or config files

## Recommendations Priority

### Tier 1 — High Value, Moderate Effort
1. **Enable tool masking** — Already built, just needs phase-to-tool mapping
2. **Structured output for planning** — Use `response_format` or `tool_choice: "required"`
3. **Vision model for browser screenshots** — Send screenshots to vision LLM for page understanding

### Tier 2 — High Value, Higher Effort
4. **MCP client support** — Add `@modelcontextprotocol/sdk` as a dependency, implement MCP tool discovery and invocation
5. **Observation trimming** — Truncate large tool outputs before they enter the context window

### Tier 3 — Medium Value, High Effort
6. **Sub-agent delegation** — Spawn child execution agents for parallel subtasks
7. **Multi-modal document parsing** — PDF/Word/Excel understanding via vision models
