/**
 * LLM client — OpenRouter only.
 * Handles streaming completions, retries, rich model fetching.
 */

import { streamText, generateText } from 'ai';
import { getUnifiedModel, type ProviderConfig } from './gateway/provider';
import { useAppStore } from '../store';
import { getGlobalRateLimiter } from './gateway/rateLimiter';
import { findModelById } from './gateway/modelRegistry';

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
  /** Called when reasoning_content tokens arrive (DeepSeek R1 only) */
  onReasoning?: (text: string) => void
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
  /** Chain-of-thought from DeepSeek R1 reasoning_content (null for non-reasoning models) */
  reasoningContent?: string | null
}

// ── DeepSeek R1 tool-call guard ───────────────────────────────────────────────
// DeepSeek R1 (pre-0528) does not support function/tool calling.
// Sending tools: [...] to the API returns HTTP 400.
// R1-0528+ does support tools. The free variant (:free) maps to the same checkpoint.
//
// IMPORTANT: 'deepseek-reasoner' is the model ID for BOTH R1 and R1-0528 on
// api.deepseek.com. We must check the model registry supportsTools field first
// before falling back to name-based heuristics to handle this ambiguity.
function modelSupportsTools(model: string): boolean {
  // Registry lookup takes precedence — it has the definitive supportsTools value
  // for each canonical model, including the ambiguous deepseek-reasoner case.
  const registryEntry = findModelById(model)
  if (registryEntry && registryEntry.supportsTools !== undefined) {
    return registryEntry.supportsTools
  }

  // Fallback: string-based heuristics for models not in the registry
  const id = model.toLowerCase()
  // Explicitly tool-capable R1 checkpoints (OpenRouter slugs)
  if (id.includes('deepseek-r1-0528')) return true
  // Base R1 (all sub-variants) — no tools (pre-0528)
  if (id.includes('deepseek-r1')) return false
  // deepseek-reasoner without a version suffix: conservatively disable tools
  // because we can't tell if it's R1 or R1-0528 without registry context.
  if (id === 'deepseek-reasoner' || id.endsWith('/deepseek-reasoner')) return false
  // All other models default to supporting tools
  return true
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
    const unifiedModel = getUnifiedModel({
    provider: provider as ProviderConfig['provider'],
    apiKey,
    apiBase,
    gatewayId: cb.gatewayId,
    extraHeaders: cb.extraHeaders,
  }, model);

  // Determine if this model supports tool/function calling.
  // Must be computed before building coreMessages so we can adapt history format.
  const toolsEnabled = !cb.jsonMode && modelSupportsTools(model)

  // Convert LlmMessage to AI SDK message format
  const coreMessages: any[] = messages.map(m => {
      if (m.role === 'tool') {
        // If tools are disabled for this model, convert tool results to plain user messages
        // so the conversation history remains valid without function-call scaffolding
        if (!toolsEnabled) {
          return {
            role: 'user',
            content: `[Tool result] ${typeof m.content === 'string' ? m.content : JSON.stringify(m.content)}`,
          } as any
        }
        // Vercel AI SDK v4 CoreToolMessage requires content as ToolResultPart[]:
        // { type: 'tool-result', toolCallId: string, result: unknown }
        const toolCallId = m.tool_call_id || ''
        const resultText = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        return {
          role: 'tool',
          content: [{ type: 'tool-result', toolCallId, result: resultText }],
        } as any;
      }
    if (m.role === 'assistant' && !toolsEnabled) {
      // Strip tool_calls and reasoning_content from assistant messages when tools are disabled
      return {
        role: 'assistant',
        content: m.content || '',
      } as any
    }
      // Assistant message with tool calls: map to Vercel AI SDK v4 CoreAssistantMessage format.
      // The SDK uses toolInvocations[] not tool_calls[] for history messages.
      if (m.tool_calls && m.tool_calls.length > 0) {
        return {
          role: 'assistant',
          content: m.content || '',
          toolInvocations: m.tool_calls.map((tc: ToolCall) => {
            let args: unknown = {}
            try { args = JSON.parse(tc.function.arguments || '{}') } catch { /* keep {} */ }
            return {
              state: 'call' as const,
              toolCallId: tc.id,
              toolName: tc.function.name,
              args,
            }
          }),
        } as any
      }
      return {
        role: m.role as any,
        content: m.content || '',
      };
  });

  // Convert ToolDefinition to AI SDK Tool
  const sdkTools: Record<string, any> = {}
  // Strip tools for models that don't support function calling (e.g., DeepSeek R1 pre-0528)
  if (toolsEnabled) {
    tools.filter(t => !t.inactive).forEach(t => {
      sdkTools[t.function.name] = {
        description: t.function.description,
        parameters: t.function.parameters as any,
      };
    });
  }

  try {
      // Proactive rate limiting — wait before making request if needed
      const rateLimiter = getGlobalRateLimiter()
      await rateLimiter.acquire()

      const { fullStream, toolCalls, usage, finishReason } = await streamText({
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
      let fullReasoning = '';

      for await (const chunk of fullStream) {
        if (chunk.type === 'text-delta') {
          fullContent += chunk.textDelta;
          cb.onDelta(chunk.textDelta);
        } else if (chunk.type === 'reasoning') {
          // Vercel AI SDK 4.x exposes DeepSeek reasoning_content as a 'reasoning' chunk type
          const reasoningDelta = (chunk as any).textDelta ?? (chunk as any).reasoning ?? '';
          if (reasoningDelta) {
            fullReasoning += reasoningDelta;
            cb.onReasoning?.(reasoningDelta);
          }
        } else if (chunk.type === 'provider-defined') {
          // Fallback: some SDK versions surface reasoning in provider-defined chunks
          const delta = (chunk as any).value?.reasoning_content ?? (chunk as any).value?.reasoning ?? '';
          if (delta) {
            fullReasoning += delta;
            cb.onReasoning?.(delta);
          }
        }
        // Other chunk types (tool-call, tool-result, finish, error) are handled by onFinish/toolCalls
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
          promptTokens: resolvedUsage.inputTokens ?? 0,
          completionTokens: resolvedUsage.outputTokens ?? 0,
          totalTokens: resolvedUsage.totalTokens ?? (resolvedUsage.inputTokens ?? 0) + (resolvedUsage.outputTokens ?? 0),
        } : null,
        reasoningContent: fullReasoning || null,
      };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    console.error('[streamCompletion] Error:', {
      message: errorMsg,
      stack: errorStack,
      provider,
      apiBase,
      model,
      hasApiKey: Boolean(apiKey && apiKey.length > 0),
    })
    cb.onError(errorMsg);
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
    provider: provider as ProviderConfig['provider'],
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
    provider: provider as ProviderConfig['provider'],
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
 * Prefers Claude Sonnet 4, Claude 3.7 Sonnet, GPT-4.1, Gemini 2.5 Pro, DeepSeek R1-0528.
 */
export function powerfulModel(models: OpenRouterModel[]): string {
  const powerfulIds = [
    // Prefer latest Claude Sonnet (tool-capable, strong coding)
    'anthropic/claude-sonnet-4-20250514',
    'anthropic/claude-sonnet-4',
    'anthropic/claude-3.5-sonnet',
    // GPT-4.1 family (1M context, strong tools)
    'openai/gpt-4.1',
    'openai/o4-mini',
    'openai/o3',
    // Gemini 2.5 Pro
    'google/gemini-2.5-pro-preview',
    'google/gemini-2.5-pro',
    'google/gemini-2.0-flash-001',
    // DeepSeek (good coding fallback)
    'deepseek/deepseek-r1-0528',   // R1-0528: reasoning + tool calling
    'deepseek/deepseek-chat',      // V3: strong coding, cheap
  ]

  for (const id of powerfulIds) {
    if (models.some(m => m.id === id)) return id
  }

  // Fallback: highest context length from available models
  if (models.length > 0) {
    return models.sort((a, b) => b.context_length - a.context_length)[0].id
  }

  return 'anthropic/claude-sonnet-4-20250514'
}

/**
 * Return a "balanced" model (good speed/intelligence/cost).
 */
export function balancedModel(models: OpenRouterModel[]): string {
  const balancedIds = [
    'anthropic/claude-3.5-haiku',
    'openai/gpt-4.1-mini',
    'google/gemini-2.0-flash-lite-001',
    'google/gemini-2.0-flash-001',
    'deepseek/deepseek-chat',       // V3: excellent coding balance
    'mistralai/mistral-large-2411',
  ]

  for (const id of balancedIds) {
    if (models.some(m => m.id === id)) return id
  }

  return cheapestModel(models)
}
