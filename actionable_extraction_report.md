# Actionable Extraction Report: High-Value Patterns for Nasus

**To:** User
**From:** Manus AI
**Date:** 2026-03-08
**Subject:** Deep-Dive Analysis: Three High-Impact, Portable Patterns to Enhance Nasus

## 1. Executive Summary

Following your request for a deeper analysis, I have re-examined the reference codebases with a specific focus on identifying concrete, liftable logic that offers a distinct advantage over Nasus's current implementation. While our initial analysis concluded that Nasus's core architecture is robust, this deep-dive reveals three high-impact patterns that can be directly ported to significantly improve efficiency, reliability, and performance.

These are not architectural shifts, but specific, function-level upgrades that can be implemented with moderate effort. The three key recommendations are:

1.  **True Observation Masking for Context Compression:** Replace the current expensive and inefficient context summarization with a zero-cost, lossless observation masking strategy.
2.  **Hard Tool Constraints via Response Prefill:** Upgrade the current "soft" tool masking system to a "hard" constraint using model-native response prefilling for guaranteed compliance.
3.  **Semantic Tool Output Truncation:** Implement intelligent, per-tool truncation logic that preserves semantic boundaries instead of using a crude character-count approach.

This report details the rationale and implementation plan for each pattern. A companion file, `nasus_enhancement_claude_prompt.md`, provides a ready-to-use prompt for implementing these changes.

## 2. Pattern 1: True Observation Masking

**Source:** *Simple Observation Masking Is as Efficient as LLM Summarization for Agent Context Management* (arXiv:2508.21433v1) [1]

**Current Nasus Implementation:** The `ExecutionAgent.ts` `compressContext` method currently uses a costly and inefficient strategy. It identifies middle messages, generates a summary of them using a separate LLM call (to a "cheap" model), and replaces the messages with that summary. This has two major flaws:

*   **High Cost & Latency:** It incurs an extra LLM call for every compression event, adding cost and latency.
*   **Information Loss:** The summary is inherently lossy and may omit critical details that the agent needs for future steps.

**Proposed Enhancement:** The research paper demonstrates that a simple observation masking strategy is just as effective as LLM summarization, but with zero additional cost. The core idea is to **preserve all agent actions (the `assistant` messages with `tool_calls`) but replace the corresponding lengthy observations (the `tool` messages) with a simple placeholder.**

> "This strategy manages the context size by selectively condensing past environment observations while preserving the full history of agent actions and decisions." [1]

**Implementation in `ExecutionAgent.ts`:**

The `compressContext` function should be rewritten to implement this logic:

1.  **Identify Old Tool Calls:** Instead of removing the whole block, identify `assistant` messages with `tool_calls` that are beyond a certain threshold (e.g., not in the most recent 5-7 tool interactions).
2.  **Preserve the Action:** Keep the `assistant` message containing the `tool_calls` array in the message history.
3.  **Mask the Observation:** Find the corresponding `tool` result message(s) and replace their `content` with a simple placeholder string, like `"[Observation masked for brevity. Action was successful.]"`.
4.  **No LLM Call:** The entire summarization call using `chatOnceViaGateway` should be removed.

This change will make context compression virtually instantaneous and free, while preserving the full, lossless history of the agent's decisions.

## 3. Pattern 2: Hard Tool Constraints via Response Prefill

**Source:** *Context Engineering for AI Agents: Lessons from Building Manus* [2]

**Current Nasus Implementation:** `ContextBuilder.ts` supports tool masking by adding a system message that tells the model which tools are unavailable. This is a "soft" constraint; the model can, and sometimes does, ignore this instruction and call a disabled tool, leading to errors.

**Proposed Enhancement:** The Manus blog post details a superior method: using the model provider's API to enforce a "hard" constraint. This is achieved by prefilling the model's response to force it into a specific generation path. Most modern inference APIs, including OpenRouter, support this.

> "Rather than removing tools, it masks the token logits during decoding to prevent (or enforce) the selection of certain actions based on the current context... In practice, most model providers and inference frameworks support some form of response prefill, which allows you to constrain the action space without modifying the tool definitions." [2]

**Implementation in `llm.ts`:**

The `streamCompletion` function should be modified to accept an optional parameter for tool constraints. When a specific tool or a group of tools needs to be enforced, the call to the LLM should include the appropriate prefill or response format parameter.

For example, using an OpenAI-compatible API:

```typescript
// Example of enforcing a specific tool
const response = await streamText({
  model: unifiedModel,
  messages: coreMessages,
  tools: sdkTools,
  tool_choice: { type: "function", function: { name: "my_required_tool" } }
});
```

This completely prevents the model from calling any other tool, making the agent's behavior far more predictable and reliable, especially during critical phases like planning or verification.

## 4. Pattern 3: Semantic Tool Output Truncation

**Source:** Reference Codebase 1 (`pasted_content_2.txt`)

**Current Nasus Implementation:** In `ExecutionAgent.ts`, the output of every tool is truncated using a simple character-based `slice()` if it exceeds 15,000 characters. This is a blunt instrument that can cut off information mid-sentence or mid-code-block, destroying context.

**Proposed Enhancement:** The reference codebase demonstrates a more intelligent, semantic truncation strategy:

1.  **Line-Based, Not Character-Based:** Truncate based on line counts, not raw characters. This preserves the integrity of individual lines.
2.  **Keep Head and Tail:** For long outputs, keep the first N lines and the last M lines, replacing the middle with a placeholder like `"[... 57 lines omitted ...]"`.
3.  **Per-Tool Logic:** Apply different truncation rules for different tools. For example, the output of `list_files` can be truncated more aggressively than the output of `read_file`.

**Implementation in `ExecutionAgent.ts`:**

The hardcoded `slice(0, 7500) + ... + slice(-5000)` logic should be replaced with a dedicated `truncateOutput` function.

```typescript
function truncateOutput(output: string, toolName: string): string {
  const lines = output.split("\n");
  let maxLines = 100; // Default

  if (toolName === 'read_file') maxLines = 200;
  if (toolName === 'list_files') maxLines = 50;

  if (lines.length <= maxLines) {
    return output;
  }

  const head = lines.slice(0, Math.ceil(maxLines * 0.7)).join("\n");
  const tail = lines.slice(lines.length - Math.floor(maxLines * 0.3)).join("\n");
  const omitted = lines.length - maxLines;

  return `${head}\n\n[... ${omitted} lines omitted ...]\n\n${tail}`;
}
```

This ensures that tool outputs, even when long, remain readable and contextually intact for the agent.

## 5. References

[1] "Simple Observation Masking Is as Efficient as LLM Summarization for Agent Context Management." *arXiv*, 29 Aug. 2025, arxiv.org/html/2508.21433v1.

[2] Ji, Yichao. "Context Engineering for AI Agents: Lessons from Building Manus." *Manus Blog*, 18 July 2025, manus.im/blog/Context-Engineering-for-AI-Agents-Lessons-from-Building-Manus.
