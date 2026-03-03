# AI Provider Integration Audit Report
**Project:** Nasus (Tauri-based Desktop App)  
**Date:** March 3, 2026

## 1. Executive Summary
The current AI integration is built on a custom, manual implementation using `fetch` to interact with OpenRouter. While functional, it lacks standardization and is becoming increasingly complex to maintain, especially with the introduction of multi-gateway failover logic. There is no active usage of the **Vercel AI SDK**, despite project documentation and comments referencing it.

**Recommendation:** Immediately migrate to **Vercel AI SDK v6** with the dedicated `@openrouter/ai-sdk-provider` to simplify streaming, tool calling, and structured output.

---

## 2. Current Implementation Map

### AI Architecture Overview
- **App Type:** Tauri (React + Vite) Desktop Application.
- **Primary AI Interface:** `src/agent/llm.ts` handles all completions.
- **Agent Loop:** `src/agent/agents/ExecutionAgent.ts` implements a manual ReAct loop (Plan → Act → Observe).
- **State Management:** Zustand (`src/store.ts`) manages API keys, model selection, and gateway configuration.

### Provider Integration Details
| Feature | Implementation Method | Source File(s) |
| :--- | :--- | :--- |
| **Completions** | Manual `fetch` with SSE parsing | `src/agent/llm.ts` |
| **Model Fetching** | Static list + OpenRouter `/models` fetch | `src/lib/models.ts`, `src/agent/llm.ts` |
| **Streaming** | `ReadableStream` reader with 30s idle timeout | `src/agent/llm.ts` |
| **Retries** | Exponential backoff (max 3 attempts) | `src/agent/llm.ts` |
| **Tool Calling** | Manual ReAct loop in `ExecutionAgent` | `src/agent/agents/ExecutionAgent.ts` |
| **Failover** | Circuit breaker / Gateway Service (Proposed) | `ai-integration-concept-nasus/` |

---

## 3. Identified Gaps & Inconsistencies

### 1. Manual SSE Parsing vs. Vercel AI SDK
The current implementation manually decodes UTF-8 chunks and parses JSON strings. This is fragile and lacks the robustness of the Vercel AI SDK's `streamText`.
- **Gap:** No support for automatic model response healing (OpenRouter plugin).
- **Gap:** Complex tool-call partial assembly logic in `llm.ts`.

### 2. Hardcoded Model Logic
The app uses a mix of `STATIC_MODELS` and `FREE_MODELS_PAID_PRIORITY` heuristics.
- **Inconsistency:** Some parts of the app use `anthropic/claude-3-haiku` as a fallback, while others use `deepseek/deepseek-r1:free`.
- **Issue:** Reliance on `:free` suffix strings for routing is fragile if provider naming changes.

### 3. Vercel AI Gateway "Ghost" Integration
The code references Vercel AI Gateway headers (`x-vercel-ai-gateway-usage`) but does not use the **Vercel AI SDK** packages (`ai`, `@ai-sdk/openai`, etc.).
- **Confusion:** This creates a maintenance gap where developers might expect SDK features (like `generateObject`) that don't exist in the custom implementation.

### 4. Agent Loop Complexity
The `ExecutionAgent` implements a 900+ line manual loop for tool execution, iteration tracking, and error escalation.
- **Opportunity:** The SDK v6 `ToolLoopAgent` could reduce this logic by ~60% while improving reliability.

---

## 4. Recommended Fixes & Migration Path

### Phase 1: Modernize Dependencies
1.  **Install SDK:** `bun add ai @openrouter/ai-sdk-provider zod`.
2.  **Initialize Provider:** Create a dedicated provider config using `createOpenRouter()`.

### Phase 2: Refactor Core Completion Logic
1.  **Replace `llm.ts`:** Migrate `streamCompletion` to use `streamText`.
2.  **Standardize Tool Calling:** Define tools using the SDK's `tool()` helper with Zod schemas for automatic validation.

### Phase 3: Optimize Agent Architecture
1.  **Adopt `ToolLoopAgent`:** Migrate the ReAct loop from `ExecutionAgent` to the SDK's agentic framework.
2.  **Unified Routing:** Integrate the `GatewayService` logic with the SDK's provider fallback mechanisms.

---

## 5. Audit Checklist (Completed)
- [x] Scan full codebase for AI-related files.
- [x] Map provider usage, model fetching, and key handling.
- [x] Identify inconsistencies and stale integrations.
- [x] Document recommended fixes and modernization path.
