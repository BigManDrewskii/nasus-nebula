/**
 * LLM client — OpenRouter only.
 * Handles streaming completions, retries, rich model fetching.
 */

import { streamText, jsonSchema } from 'ai';
import { getUnifiedModel, type ProviderConfig } from './gateway/provider';
import { useAppStore } from '../store';
import { getGlobalRateLimiter } from './gateway/rateLimiter';
import { findModelById } from './gateway/modelRegistry';
import { sanitizeMessages } from './messageUtils';
import { createLogger } from '../lib/logger';

const log = createLogger('LLM');

export interface LlmMessage {
  role: 'system' | 'user' | 'assistant' | 'tool' | string
  content: string | null | Array<{ type: string; text?: string; image_url?: { url: string; detail?: string } }>
  tool_call_id?: string
  tool_name?: string
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

    // Convert LlmMessage → AI SDK v6 ModelMessage format.
    // Strict rules per SDK schema:
    //   system   → content: string (never null/array)
    //   user     → content: string | TextPart[]  (image_url → image, no null)
    //   assistant→ content: string | (TextPart | ToolCallPart)[]  (no null)
    //   tool     → content: ToolResultPart[]
    const contentToString = (c: LlmMessage['content']): string => {
      if (c == null) return ''
      if (typeof c === 'string') return c
      // Array — flatten to text (images are dropped for text-only models)
      return c.map(p => (p.type === 'text' ? (p.text ?? '') : '')).join('').trim()
    }

      // ── Sanitize message history ─────────────────────────────────────────────
      // Enforces the OpenAI message ordering invariants (shared implementation in messageUtils.ts).
      const sanitizedMessages = sanitizeMessages(messages as LlmMessage[])

    const coreMessages: any[] = sanitizedMessages.map(m => {
      // ── tool ──────────────────────────────────────────────────────────────
      if (m.role === 'tool') {
        if (!toolsEnabled) {
          return {
            role: 'user',
            content: `[Tool result] ${contentToString(m.content)}`,
          }
        }
          const toolCallId = m.tool_call_id || ''
          const toolName   = m.tool_name   || 'unknown'
          const output     = contentToString(m.content)
          return {
            role: 'tool',
            content: [{
              type: 'tool-result',
              toolCallId,
              toolName,
              output: { type: 'text', value: output },
            }],
          }
      }

      // ── assistant ─────────────────────────────────────────────────────────
      if (m.role === 'assistant') {
        const textContent = typeof m.content === 'string'
          ? m.content
          : contentToString(m.content)

        if (!toolsEnabled) {
          return { role: 'assistant', content: textContent || '' }
        }

        if (m.tool_calls && m.tool_calls.length > 0) {
          const parts: any[] = []
          if (textContent) parts.push({ type: 'text', text: textContent })
          for (const tc of m.tool_calls) {
            let input: unknown = {}
            try { input = JSON.parse(tc.function.arguments || '{}') } catch { /* keep {} */ }
            parts.push({ type: 'tool-call', toolCallId: tc.id, toolName: tc.function.name, input })
          }
          return { role: 'assistant', content: parts }
        }
        return { role: 'assistant', content: textContent || '' }
      }

      // ── system ────────────────────────────────────────────────────────────
      if (m.role === 'system') {
        // System content MUST be a plain string per AI SDK schema
        return { role: 'system', content: contentToString(m.content) }
      }

      // ── user (and any unknown roles) ──────────────────────────────────────
      // Convert OpenAI image_url format → AI SDK image format
      if (Array.isArray(m.content) && m.content.length > 0) {
        const parts: any[] = m.content.map(p => {
          if (p.type === 'image_url' && p.image_url?.url) {
            return { type: 'image', image: p.image_url.url }
          }
          return { type: 'text', text: p.text ?? '' }
        }).filter(p => p.type !== 'text' || p.text)
        return { role: m.role, content: parts.length > 0 ? parts : '' }
      }
      return {
        role: m.role as any,
        content: contentToString(m.content) || '',
      }
    });

  // Convert ToolDefinition to AI SDK Tool
  const sdkTools: Record<string, any> = {}
  // Strip tools for models that don't support function calling (e.g., DeepSeek R1 pre-0528)
  if (toolsEnabled) {
    tools.filter(t => !t.inactive).forEach(t => {
        sdkTools[t.function.name] = {
          description: t.function.description,
          inputSchema: jsonSchema(t.function.parameters as any),
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
          fullContent += chunk.text;
          cb.onDelta(chunk.text);
        } else if (chunk.type === 'reasoning-delta') {
          // AI SDK v5+ emits reasoning tokens as 'reasoning-delta' with .text
          const reasoningDelta = chunk.text ?? '';
          if (reasoningDelta) {
            fullReasoning += reasoningDelta;
            cb.onReasoning?.(reasoningDelta);
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
      // Suppress abort errors — they are expected on user-initiated stop, not real errors.
      // AI_NoOutputGeneratedError is only treated as an abort when the signal is actually
      // aborted — otherwise it's a real error (e.g. caused by AI_MissingToolResultsError)
      // that must be surfaced to the user.
      const signalAborted = cb.signal?.aborted ?? false
      const isAbort =
        err instanceof Error && (
          err.name === 'AbortError' ||
          err.message.includes('aborted') ||
          err.message.includes('Aborted') ||
          err.message.includes('AbortError') ||
          // AI SDK wraps abort in AI_NoOutputGeneratedError — only treat as abort
          // when the signal is genuinely aborted, not on unrelated stream failures
          (err.message.includes('No output generated') && signalAborted)
        )

      if (isAbort) {
        // Don't surface abort as an error — just re-throw so callers can check signal.aborted
        throw err
      }

    const errorMsg = err instanceof Error ? err.message : String(err);
    const errorStack = err instanceof Error ? err.stack : undefined;
    // Surface Zod cause for AI_InvalidPromptError to identify the exact bad message
      const cause = (err as any)?.cause
      log.error('streamCompletion error', err instanceof Error ? err : new Error(String(err)), {
        message: errorMsg,
        stack: errorStack,
        provider,
        apiBase,
        model,
        hasApiKey: Boolean(apiKey && apiKey.length > 0),
        ...(cause ? { cause: cause?.message ?? String(cause), causeErrors: cause?.errors } : {}),
      })
      // For schema validation errors, log the exact messages that failed so we can debug
      if (errorMsg.includes('ModelMessage') || errorMsg.includes('Invalid prompt')) {
        log.error('streamCompletion failing messages', undefined, { messages: JSON.stringify(coreMessages, null, 2) })
      }
    cb.onError(errorMsg);
    throw err;
  }
}

/**
 * Non-streaming call — used for auto-title (cheap single-turn).
 * Uses a direct fetch instead of generateText to avoid SDK response-parsing
 * issues with chunked-encoded responses from DeepSeek and other providers.
 */
export async function chatOnce(
  apiBase: string,
  apiKey: string,
  _provider: string,
  model: string,
  userPrompt: string,
  extraHeaders?: Record<string, string>,
): Promise<string> {
  try {
    await getGlobalRateLimiter().acquire()

    const base = (apiBase ?? 'https://api.openai.com/v1').replace(/\/$/, '')
    const url = `${base}/chat/completions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    }
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 500,
      stream: false,
    })

    const resp = await fetch(url, { method: 'POST', headers, body })
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
        log.error('chatOnce HTTP error', undefined, { status: resp.status, body: errText })
      return ''
    }

    const json = await resp.json()
    return (json?.choices?.[0]?.message?.content ?? '').trim()
  } catch (err) {
    const cause = (err as any)?.cause
      log.error('chatOnce failed', err instanceof Error ? err : new Error(String(err)), cause ? { cause: cause?.message ?? String(cause) } : undefined)
    return ''
  }
}

/**
 * One-shot JSON completion.
 * Uses a direct fetch to avoid SDK response-parsing issues.
 */
export async function chatJson<T>(
  apiBase: string,
  apiKey: string,
  _provider: string,
  model: string,
  prompt: string,
  _maxTokens = 1000,
  extraHeaders?: Record<string, string>,
): Promise<T | null> {
  try {
    await getGlobalRateLimiter().acquire()

    const base = (apiBase ?? 'https://api.openai.com/v1').replace(/\/$/, '')
    const url = `${base}/chat/completions`
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    }
    const body = JSON.stringify({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: _maxTokens,
      stream: false,
    })

    const resp = await fetch(url, { method: 'POST', headers, body })
    if (!resp.ok) {
      const errText = await resp.text().catch(() => '')
        log.error(`chatJson HTTP error ${resp.status}: ${errText}`)
      return null
    }

    const json = await resp.json()
    const text = (json?.choices?.[0]?.message?.content ?? '').trim()
    const clean = text.replace(/```json\n?|```\n?/g, '').trim()
    return JSON.parse(clean) as T
  } catch (err) {
      log.error('chatJson failed', err instanceof Error ? err : new Error(String(err)))
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
