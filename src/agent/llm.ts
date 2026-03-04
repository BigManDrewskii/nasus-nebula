/**
 * LLM client — OpenRouter only.
 * Handles streaming completions, retries, rich model fetching.
 */

import { streamText, generateText } from 'ai';
import { getUnifiedModel } from './gateway/provider';

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
}

export interface LlmResponse {
  content: string | null
  toolCalls: ToolCall[]
  finishReason: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
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
  cb: StreamCallbacks,
): Promise<LlmResponse> {
  const unifiedModel = getUnifiedModel({
    provider,
    apiKey,
    apiBase,
    extraHeaders: cb.extraHeaders,
  }, model);

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
  tools.filter(t => !t.inactive).forEach(t => {
    sdkTools[t.function.name] = {
      description: t.function.description,
      parameters: t.function.parameters as any,
    };
  });

  try {
    const { textStream, toolCalls, usage, finishReason } = await streamText({
      model: unifiedModel,
      messages: coreMessages as any,
      tools: Object.keys(sdkTools).length > 0 ? sdkTools : undefined,
      onFinish: async (event) => {
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

    let fullContent = '';
    for await (const delta of textStream) {
      fullContent += delta;
      cb.onDelta(delta);
    }

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
        prompt_tokens: resolvedUsage.inputTokens ?? 0,
        completion_tokens: resolvedUsage.outputTokens ?? 0,
        total_tokens: resolvedUsage.totalTokens ?? (resolvedUsage.inputTokens ?? 0) + (resolvedUsage.outputTokens ?? 0),
      } : null,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    cb.onError(msg);
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
    provider,
    apiKey,
    apiBase,
    extraHeaders,
  }, model);

  try {
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
 * Fetch available models from any OpenAI-compatible /models endpoint.
 * Kept for backwards compat — new code should use fetchOpenRouterModels.
 */
export async function fetchModels(apiBase: string, apiKey: string): Promise<string[]> {
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
  }
  top_provider: {
    context_length: number | null
    is_moderated: boolean
  }
  supported_parameters?: string[]
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

// ── Vercel AI Gateway models ────────────────────────────────────────────────────

export interface VercelModel {
  id: string
  object: string
  created: number
  owned_by: string
}

/**
 * Fetch available models from Vercel AI Gateway's /models endpoint.
 * Vercel uses the OpenAI-compatible API format.
 */
export async function fetchVercelModels(apiKey: string): Promise<VercelModel[]> {
  const url = 'https://ai-gateway.vercel.sh/v1/models'
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  }

  const resp = await fetch(url, { headers })
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      const body = await resp.json()
      if (body?.error?.message) msg = body.error.message
    } catch {
      // Response body isn't JSON — ignore and use the status message
    }
    throw new Error(msg)
  }

  const json = await resp.json()
  const models: VercelModel[] = (json?.data ?? json ?? []).filter(
    (m: VercelModel) => m.id && m.id.length > 0,
  )

  // Sort by provider/name
  models.sort((a, b) => {
    const fa = a.id.split('/')[0]
    const fb = b.id.split('/')[0]
    if (fa !== fb) return fa.localeCompare(fb)
    return a.id.localeCompare(b.id)
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
  if (models.length === 0) return 'anthropic/claude-3-haiku'
  
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
