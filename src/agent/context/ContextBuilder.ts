/**
 * Context Builder — Manus-inspired context engineering.
 *
 * Key principles from Manus:
 * 1. Stable prompt prefixes for KV cache hits
 * 2. Append-only context (never modify existing)
 * 3. Mask tools instead of removing
 *
 * This improves performance by maximizing prompt cache hits
 * and reduces token usage through intelligent context management.
 */

import type { LlmMessage } from '../llm'
import type { ToolDefinition } from '../llm'
import { SYSTEM_PROMPT } from '../systemPrompt'
import { sanitizeMessages } from '../messageUtils'
import type { ExecutionPlan } from '../core/Agent'
import { memoryStore, type MemoryResult } from '../memory/LocalMemoryStore'

/**
 * Tool with active/inactive state for masking.
 */
export interface MaskedTool extends ToolDefinition {
  inactive?: boolean
}

/**
 * Context building options.
 */
export interface ContextBuilderOptions {
  /** Include memory from previous tasks */
  includeMemory?: boolean
  /** Maximum memory items to include */
  maxMemoryItems?: number
  /** Include execution plan if available */
  includePlan?: boolean
  /** Mask inactive tools instead of removing */
  maskInactiveTools?: boolean
  /** List of active tool names (if masking) */
  activeTools?: string[]
}

/**
 * Built context result.
 */
export interface BuiltContext {
  /** Full messages array for LLM */
  messages: LlmMessage[]
  /** Tool definitions for function calling */
  tools: ToolDefinition[]
  /** Cache breakpoint index (first non-cacheable message) */
  cacheBreakpoint: number
  /** Memory items included */
  memories?: MemoryResult[]
  /** Size info */
  stats: {
    totalMessages: number
    cacheableMessages: number
    estimatedTokens: number
  }
}

/**
 * Cache-aware stable prefix that should never change.
 *
 * This prefix is designed to maximize KV cache hits by keeping
 * system prompts and tool definitions stable across requests.
 */
const STABLE_CACHE_PREFIX = [
  { role: 'system' as const, content: SYSTEM_PROMPT },
]

/**
 * Token estimation (rough approximation).
 */
function estimateTokens(messages: LlmMessage[]): number {
  let tokens = 0
  for (const msg of messages) {
    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content)
    // Rough estimate: ~4 chars per token
    tokens += Math.ceil(content.length / 4)
  }
  return tokens
}

/**
 * Format tools for the LLM.
 *
 * When masking is enabled, inactive tools are marked but not removed.
 * This preserves cache structure while preventing the LLM from using them.
 */
function formatTools(
  tools: ToolDefinition[],
  options: ContextBuilderOptions,
): ToolDefinition[] {
  if (!options.maskInactiveTools || !options.activeTools) {
    return tools
  }

  // Mask tools that aren't active by adding inactive flag
  return tools.map(tool => ({
    ...tool,
    inactive: !options.activeTools?.includes(tool.function.name),
  }))
}

/**
 * Build context for plan injection.
 */
function buildPlanContext(plan: ExecutionPlan): string {
  const phaseList = plan.phases.map((p, idx) => {
    const steps = p.steps.map((s) => `  - ${s.description}`).join('\n')
    return `Phase ${idx + 1}: ${p.title}\n${steps}`
  }).join('\n\n')

  return `[Approved Execution Plan]
Title: ${plan.title}
Description: ${plan.description}
Estimated Steps: ${plan.estimatedSteps}

${phaseList}

Follow this plan systematically. Complete each phase before moving to the next one.`
}

/**
 * Context Builder — Constructs optimized LLM context.
 *
 * Features:
 * - Stable prefix for cache hits
 * - Tool masking instead of removal
 * - Memory injection from RAG
 * - Plan-aware context
 */
export class ContextBuilder {
  private stablePrefix: LlmMessage[] = STABLE_CACHE_PREFIX

  /**
   * Build context for an LLM request.
   *
   * Options are passed per-call so that concurrent or sequential tasks cannot
   * leak options from one call into another via shared singleton state.
   */
  async build(
    userMessages: LlmMessage[],
    tools: ToolDefinition[],
    options: ContextBuilderOptions = {},
    plan?: ExecutionPlan,
    envSummary?: string,
  ): Promise<BuiltContext> {
    const messages: LlmMessage[] = []
    const cacheableMessages: LlmMessage[] = []

    // 1. Stable prefix (cacheable)
    messages.push(...this.stablePrefix)
    cacheableMessages.push(...this.stablePrefix)

    // 2. Environment summary (cacheable if constant)
    if (envSummary) {
      messages.push({ role: 'system', content: envSummary })
      // Consider environment cacheable if it doesn't change per-request
      // For now, mark as cacheable if using cloud sandbox (constant)
      if (!envSummary.includes('Browser-only mode')) {
        cacheableMessages.push({ role: 'system', content: envSummary })
      }
    }

      // 3. Tool definitions (cacheable)
      // Tools are added separately in the API call, but we track cacheability here
      const processedTools = formatTools(tools, options)
      // 4. Memory context (not cacheable - varies by request)
    let retrievedMemories: MemoryResult[] = []
    if (options.includeMemory) {
      const query = this.extractQuery(userMessages)
      const { memories, context } = await memoryStore.retrieveContext(
        query,
        options.maxMemoryItems || 3,
      )
      retrievedMemories = memories
      if (context) {
        messages.push({ role: 'system', content: context })
      }
    }

      // 5. Plan context (not cacheable - varies by task)
      if (options.includePlan && plan) {
        messages.push({ role: 'system', content: buildPlanContext(plan) })
      }

      // 6. User messages — sanitize first to strip any broken tool_call sequences
      // that may have accumulated from partial/failed streams, preventing repeated
      // warnings on every subsequent LLM call for the same conversation.
      messages.push(...sanitizeMessages(userMessages))

    // Calculate cache breakpoint (first non-cacheable message index)
    const cacheBreakpoint = cacheableMessages.length

    return {
      messages,
      tools: processedTools,
      cacheBreakpoint,
      memories: retrievedMemories,
      stats: {
        totalMessages: messages.length,
        cacheableMessages: cacheBreakpoint,
        estimatedTokens: estimateTokens(messages),
      },
    }
  }

  /**
   * Extract a search query from user messages for memory retrieval.
   */
  private extractQuery(userMessages: LlmMessage[]): string {
    const userMsgs = userMessages.filter(m => m.role === 'user')
    if (userMsgs.length === 0) return ''

    // Use the first user message as the query
    const first = userMsgs[0]
    return typeof first.content === 'string' ? first.content : JSON.stringify(first.content)
  }

  /**
   * Mask tools to only include specified active tools.
   *
   * Instead of removing tools (which breaks cache), we mark them
   * as inactive. The system prompt is updated to reflect this.
   */
  maskTools(tools: ToolDefinition[], activeTools: string[]): ToolDefinition[] {
    return tools.map(tool => ({
      ...tool,
      inactive: !activeTools.includes(tool.function.name),
    }))
  }

  /**
   * Update the stable prefix (use carefully - breaks cache).
   *
   * Only call this when the system prompt actually changes.
   */
  updateStablePrefix(prefix: LlmMessage[]): void {
    this.stablePrefix = prefix
  }
}

/**
 * Global context builder instance.
 */
export const contextBuilder = new ContextBuilder()

/**
 * Convenience function to build context.
 * Options are forwarded per-call to avoid cross-task state leakage.
 */
export async function buildContext(
  userMessages: LlmMessage[],
  tools: ToolDefinition[],
  options?: ContextBuilderOptions,
  plan?: ExecutionPlan,
  envSummary?: string,
): Promise<BuiltContext> {
  return contextBuilder.build(userMessages, tools, options ?? {}, plan, envSummary)
}
