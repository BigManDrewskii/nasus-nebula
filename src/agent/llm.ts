/**
 * LLM client — OpenRouter only.
 * Handles streaming completions, retries, rich model fetching.
 */

import { streamText, generateText } from 'ai';
import { getUnifiedModel } from './gateway/provider';
import { useAppStore } from '../store';
import { getGlobalRateLimiter } from './gateway/rateLimiter';

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | string
  content: string | null | Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }>
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: 'function' | string
  function: { name: string; arguments: string }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
  inactive?: boolean
}

export interface StreamCallbacks {
  onDelta: (text: string) => void
  onToolCalls: (calls: ToolCall[]) => void
  onUsage: (prompt: number, completion: number, total: number) => void
  onError: (err: string) => void
  signal: AbortSignal
  /** Extra headers to inject (e.g., from gateway config) */
  extraHeaders?: Record<string, string>
  /** Query parameters to append to the URL (e.g., Vercel provider options) */
  queryParams?: Record<string, string>
  /** Enable JSON output mode */
  jsonMode?: boolean
}

export interface LlmResponse {
  content: string | null
  toolCalls: ToolCall[]
  finishReason: string
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null
}

/**
 * Stream a chat completion using the Vercel AI SDK.
 * Handles streaming completions, retries, and gateway failover logic.
 */
export async function streamCompletion(
  apiBase: string,
  apiKey: string,
  provider: string,
  model: string,
  messages: LlmMessage[],
  tools: ToolDefinition[],
  cb: StreamCallbacks & { gatewayId?: string },
): Promise<LlmResponse> {
  // === DIAGNOSTIC LOGGING ===
  console.log('[streamCompletion] Entry:', {
    provider,
    apiBase,
    hasApiKey: Boolean(apiKey && apiKey.length > 0),
    apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'none',
    model,
    messageCount: messages.length,
    toolCount: tools.filter(t => !t.inactive).length,
    gatewayId: cb.gatewayId,
  })
  // ===========================

  const unifiedModel = getUnifiedModel({
    provider: provider as 'openrouter' | 'ollama' | 'custom',
    apiKey,
    apiBase,
    gatewayId: cb.gatewayId,
    extraHeaders: cb.extraHeaders,
  }, model);

  console.log('[streamCompletion] Unified model created:', {
    modelType: unifiedModel?.constructor?.name || 'unknown',
  })

  // Convert LlmMessage to AI SDK message format
  const coreMessages: any[] = messages.map(m => {
    if (m.role === 'tool') {
      return {
        role: 'tool',
        content: Array.isArray(m.content) ? m.content : [{ type: 'text', text: m.content || '' }],
        tool_call_id: m.tool_call_id || '',
      } as any;
    }
    return {
      role: m.role as any,
      content: m.content || '',
      tool_calls: m.tool_calls as any,
    };
  });

  // Convert ToolDefinition to AI SDK Tool
  const sdkTools: Record<string, any> = {};
  if (!cb.jsonMode) {
    tools.filter(t => !t.inactive).forEach(t => {
      sdkTools[t.function.name] = {
        description: t.function.description,
        parameters: t.function.parameters as any,
      };
    });
  }

  try {
    console.log('[streamCompletion] Calling streamText...')

    // Proactive rate limiting — wait before making request if needed
    const rateLimiter = getGlobalRateLimiter()
    const waitMs = await rateLimiter.acquire()
    if (waitMs > 100) {
      console.log(`[streamCompletion] Rate limited: waited ${Math.round(waitMs)}ms`)
    }

      const { textStream, toolCalls, usage, finishReason } = await streamText({
        model: unifiedModel,
        messages: coreMessages as any,
        tools: Object.keys(sdkTools).length > 0 ? sdkTools : undefined,
        // Don't retry on billing/auth errors — they won't recover with retries
        maxRetries: 2,
        onFinish: async (event) => {
        console.log('[streamCompletion] onFinish:', { usage: event.usage, toolCallsCount: event.toolCalls?.length })
        if (event.usage) {
          const input = event.usage.inputTokens ?? 0;
          const output = event.usage.outputTokens ?? 0;
          const total = event.usage.totalTokens ?? (input + output);
          cb.onUsage(input, output, total);
        }
        if (event.toolCalls && event.toolCalls.length > 0) {
          cb.onToolCalls(event.toolCalls.map((tc: any) => ({
            id: tc.toolCallId,
            type: 'function',
            function: { name: tc.toolName, arguments: JSON.stringify(tc.input ?? tc.args) },
          })));
        }
      },
        abortSignal: cb.signal,
      });

      // Attach no-op catch handlers to prevent unhandled rejection noise when
      // the stream errors — these promises reject in parallel with textStream.
      toolCalls.catch(() => {});
      usage.catch(() => {});
      finishReason.catch(() => {});

    console.log('[streamCompletion] streamText returned, starting stream read...')

    let fullContent = '';
    let deltaCount = 0;
    for await (const delta of textStream) {
      fullContent += delta;
      deltaCount++;
      cb.onDelta(delta);
    }

    console.log('[streamCompletion] Stream complete:', { deltaCount, contentLength: fullContent.length })

    const resolvedToolCalls = (await toolCalls).map((tc: any) => ({
      id: tc.toolCallId,
      type: 'function' as const,
      function: { name: tc.toolName, arguments: JSON.stringify(tc.input ?? tc.args) },
    }));

    const resolvedUsage = await usage;

    return {
      content: fullContent || null,
      toolCalls: resolvedToolCalls,
      finishReason: await finishReason,
      usage: resolvedUsage ? {
        promptTokens: resolvedUsage.inputTokens ?? 0,
        completionTokens: resolvedUsage.outputTokens ?? 0,
        totalTokens: resolvedUsage.totalTokens ?? (resolvedUsage.inputTokens ?? 0) + (resolvedUsage.outputTokens ?? 0),
      } : null,
    };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const errorStack = err instanceof Error ? err.stack : undefined;

      // Map HTTP status codes to user-friendly messages
      let userMessage = errorMsg;
      if (errorMsg.includes('402') || errorMsg.toLowerCase().includes('insufficient credits') || errorMsg.toLowerCase().includes('insufficient_credits')) {
        userMessage = 'OpenRouter account has insufficient credits. Add more at https://openrouter.ai/settings/credits';
      } else if (errorMsg.includes('401') || errorMsg.toLowerCase().includes('unauthorized') || errorMsg.toLowerCase().includes('invalid api key')) {
        userMessage = 'Invalid or missing API key. Check your API key in Settings.';
      } else if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('too many requests')) {
        userMessage = 'Rate limit reached. Please wait a moment before trying again.';
      }

      console.error('[streamCompletion] Error:', {
        message: errorMsg,
        stack: errorStack,
        provider,
        apiBase,
        model,
        hasApiKey: Boolean(apiKey && apiKey.length > 0),
      })
      cb.onError(userMessage);
      throw err;
    }
}

/**
 * Non-streaming call — used for auto-title (cheap single-turn).
 */
export async function chatOnce(
  apiBase: string,
  apiKey: string,
  provider: string,
  model: string,
  userPrompt: string,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  const unifiedModel = getUnifiedModel({
    provider: provider as 'openrouter' | 'ollama' | 'custom',
    apiKey,
    apiBase,
    extraHeaders,
  }, model);

  try {
    // Rate limiting for non-streaming calls too
    await getGlobalRateLimiter().acquire()

    const { text } = await generateText({
      model: unifiedModel,
      prompt: userPrompt,
    });
    return text.trim();
  } catch (err) {
    console.error('[LLM] chatOnce failed:', err);
    return '';
  }
}

/**
 * One-shot JSON completion.
 */
export async function chatJson<T>(
  apiBase: string,
  apiKey: string,
  provider: string,
  model: string,
  prompt: string,
  _maxTokens = 1000,
  extraHeaders?: Record<string, string>,
): Promise<T | null> {
  const unifiedModel = getUnifiedModel({
    provider: provider as 'openrouter' | 'ollama' | 'custom',
    apiKey,
    apiBase,
    extraHeaders,
  }, model);

  try {
    // Rate limiting for non-streaming calls too
    await getGlobalRateLimiter().acquire()

    const { text } = await generateText({
      model: unifiedModel,
      prompt,
    });

    // Clean potential markdown fences
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(clean) as T
  } catch (err) {
    console.error('[LLM] chatJson failed:', err);
    return null
  }
}

/**
 * One-shot string completion via the current gateway.
 */
export async function chatOnceViaGateway(prompt: string, _maxTokens = 500, modelId?: string): Promise<string> {
  const { resolveConnection } = useAppStore.getState()
  const conn = resolveConnection()
  return chatOnce(conn.apiBase, conn.apiKey, conn.provider, modelId || conn.model, prompt, conn.extraHeaders)
}

/**
 * One-shot JSON completion via the current gateway.
 */
export async function chatJsonViaGateway<T>(prompt: string, maxTokens = 1000, modelId?: string): Promise<T | null> {
  const { resolveConnection } = useAppStore.getState()
  const conn = resolveConnection()
  return chatJson<T>(conn.apiBase, conn.apiKey, conn.provider, modelId || conn.model, prompt, maxTokens, conn.extraHeaders)
}

/**
 * Fetch available models from any OpenAI-compatible /models endpoint.
 * Kept for backwards compat — new code should use fetchOpenRouterModels.
 */
export async function fetchModels(apiBase: string, apiKey: string): Promise<string[]> {
  // Rate limiting for model fetching
  await getGlobalRateLimiter().acquire()

  const url = `${apiBase.replace(/\/$/, '')}/models`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
  const json = await resp.json()
  return (json?.data ?? [])
    .map((m: Record<string, unknown>) => m.id as string)
    .filter(Boolean)
}

// ── OpenRouter rich model metadata ────────────────────────────────────────────

export interface OpenRouterModel {
  id: string
  name: string
  description: string
  context_length: number
  architecture: {
    tokenizer: string
    instruct_type: string | null
    input_modalities: string[]
    output_modalities: string[]
  }
  pricing: {
    prompt: string        // cost per token in USD as string e.g. "0.000003"
    completion: string
    request?: string
    image?: string
    internal_reasoning?: string // Added for 2026 models
    input_cache_read?: string   // Added for 2026 models
    input_cache_write?: string  // Added for 2026 models
  }
  top_provider: {
    context_length: number | null
    is_moderated: boolean
  }
  supported_parameters?: string[] // "tools", "structured_outputs", "include_reasoning", "seed", etc.
}

const OR_API_BASE = 'https://openrouter.ai/api/v1'

/**
 * Get OpenRouter-specific headers.
 * HTTP-Referer and X-Title are standard/CORS-allowed headers that OpenRouter
 * uses for attribution and free-tier rate limit eligibility. Always include them.
 */
function getORHeaders(): Record<string, string> {
  return { 'HTTP-Referer': 'https://nasus.app', 'X-Title': 'Nasus' }
}

/**
 * Fetch rich model metadata from OpenRouter's /models endpoint.
 * Returns full OpenRouterModel objects sorted by provider family then name.
 */
export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  // Rate limiting for model fetching too
  await getGlobalRateLimiter().acquire()

  const url = `${OR_API_BASE}/models`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...getORHeaders(),
  }
  const resp = await fetch(url, { headers })
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      const body = await resp.json()
      const orMsg = body?.error?.message
      const orCode = body?.error?.code
      if (orMsg) msg = orCode ? `[${orCode}] ${orMsg}` : orMsg
    } catch {
      // Response body isn't JSON — ignore and use the status message
    }
    throw new Error(msg)
  }
  const json = await resp.json()
  const models: OpenRouterModel[] = (json?.data ?? []).filter(
    (m: OpenRouterModel) =>
      m.id &&
      m.name &&
      (m.architecture?.output_modalities ?? ['text']).includes('text'),
  )
  // Inject an 'is_free' property into the models for easier filtering
  models.forEach(m => {
    (m as any).is_free = parseFloat(m.pricing?.prompt ?? '1') === 0;
  });
  models.sort((a, b) => {
    const fa = a.id.split('/')[0]
    const fb = b.id.split('/')[0]
    if (fa !== fb) return fa.localeCompare(fb)
    return a.name.localeCompare(b.name)
  })
  return models
}

/**
 * Format a per-token USD price (as string) into a human-readable label.
 * OpenRouter returns prices as strings like "0.000003" (per token).
 */
export function formatTokenPrice(pricePerToken: string | undefined): string {
  if (!pricePerToken) return '?'
  const n = parseFloat(pricePerToken)
  if (isNaN(n) || n === 0) return 'free'
  const perMillion = n * 1_000_000
  if (perMillion < 0.1) return `$${perMillion.toFixed(3)}/M`
  if (perMillion < 1)   return `$${perMillion.toFixed(2)}/M`
  return `$${perMillion.toFixed(1)}/M`
}

/**
 * Return the cheapest model from a list (by completion token price).
 * Prioritizes free models.
 * Falls back to anthropic/claude-3-haiku if the list is empty.
 */
export function cheapestModel(models: OpenRouterModel[]): string {
  if (models.length === 0) return 'anthropic/claude-3.5-haiku'
  
  // Try to find a free model first
  const freeModels = models.filter(m => parseFloat(m.pricing?.completion ?? '1') === 0)
  if (freeModels.length > 0) {
    // Prefer models with larger context windows among free ones
    return freeModels.sort((a, b) => b.context_length - a.context_length)[0].id
  }

  let cheapest = models[0]
  for (const m of models) {
    const price = parseFloat(m.pricing?.completion ?? '999')
    const best  = parseFloat(cheapest.pricing?.completion ?? '999')
    if (price < best) cheapest = m
  }
  return cheapest.id
}

/**
 * Return a "powerful" model from the list (high intelligence, usually more expensive).
 * Prefers Claude 3.7 Sonnet or GPT-4o variants.
 */
export function powerfulModel(models: OpenRouterModel[]): string {
  const powerfulIds = [
    'anthropic/claude-3.7-sonnet',
    'anthropic/claude-3.5-sonnet',
    'openai/gpt-4o',
    'openai/o3-mini',
    'google/gemini-2.0-pro-exp-02-05:free',
    'google/gemini-2.0-flash-001',
    'deepseek/deepseek-chat'
  ]

  for (const id of powerfulIds) {
    if (models.some(m => m.id === id)) return id
  }

  // Fallback: highest context length from available models
  if (models.length > 0) {
    return models.sort((a, b) => b.context_length - a.context_length)[0].id
  }

  return 'anthropic/claude-3.7-sonnet'
}

/**
 * Return a "balanced" model (good speed/intelligence/cost).
 */
export function balancedModel(models: OpenRouterModel[]): string {
  const balancedIds = [
    'anthropic/claude-3.5-haiku',
    'openai/gpt-4o-mini',
    'google/gemini-2.0-flash-lite-001',
    'mistralai/mistral-large-2411'
  ]

  for (const id of balancedIds) {
    if (models.some(m => m.id === id)) return id
  }

  return cheapestModel(models)
}
