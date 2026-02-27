/**
 * LLM client — OpenRouter only.
 * Handles streaming completions, retries, rich model fetching.
 */

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
}

export interface LlmResponse {
  content: string | null
  toolCalls: ToolCall[]
  finishReason: string
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null
}

// ── Retry helpers ──────────────────────────────────────────────────────────────

const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 1000

async function sleep(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new DOMException('Aborted', 'AbortError')); return }
    const t = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('Aborted', 'AbortError')) }, { once: true })
  })
}

function isRetryable(status: number): boolean {
  return status === 429 || status === 502 || status === 503 || status === 504
}

/**
 * Stream a chat completion. Calls onDelta for each text token, calls onToolCalls
 * with fully-assembled tool_calls when the stream ends. Returns the assembled response.
 * Retries on 429 / 5xx with exponential backoff (up to MAX_RETRIES attempts).
 */
export async function streamCompletion(
  apiBase: string,
  apiKey: string,
  _provider: string,
  model: string,
  messages: LlmMessage[],
  tools: ToolDefinition[],
  cb: StreamCallbacks,
): Promise<LlmResponse> {
  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nasus.app',
      'X-Title': 'Nasus',
    }

  const body = JSON.stringify({
    model,
    messages,
    tools,
    tool_choice: 'auto',
    stream: true,
    stream_options: { include_usage: true },
  })

  // ── Retry loop ────────────────────────────────────────────────────────────
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (cb.signal.aborted) throw new DOMException('Aborted', 'AbortError')

    let resp: Response
    try {
      resp = await fetch(url, { method: 'POST', headers, body, signal: cb.signal })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (attempt < MAX_RETRIES && !cb.signal.aborted) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
        try { await sleep(delay, cb.signal) } catch { break }
        continue
      }
      cb.onError(msg)
      throw new Error(msg)
    }

    // Handle retryable HTTP status
    if (!resp.ok) {
      if (isRetryable(resp.status) && attempt < MAX_RETRIES) {
        // Respect Retry-After header if present (common on 429)
        const retryAfter = resp.headers.get('Retry-After')
        const delay = retryAfter
          ? Math.max(Number(retryAfter) * 1000, 500)
          : BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
        try { await sleep(delay, cb.signal) } catch { break }
        continue
      }

        let errMsg = `HTTP ${resp.status}`
        try {
          const errJson = await resp.json()
          // OpenRouter error format: { error: { message, code, metadata } }
          const orMsg = errJson?.error?.message
          const orCode = errJson?.error?.code
          if (orMsg) errMsg = orCode ? `[${orCode}] ${orMsg}` : orMsg
        } catch { /* ignore */ }
      cb.onError(errMsg)
      throw new Error(errMsg)
    }

    // ── Stream read with idle timeout ────────────────────────────────────────
    const IDLE_TIMEOUT_MS = 30_000  // 30s without a chunk = network stall
    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    let buf = ''

    let fullContent = ''
    let finishReason = ''
    const tcMap: Map<number, { id: string; name: string; args: string }> = new Map()
    let usageResult: LlmResponse['usage'] = null
    let streamError: string | null = null

    let idleTimer: ReturnType<typeof setTimeout> | null = null
    const abortController = new AbortController()

    function resetIdleTimer() {
      if (idleTimer) clearTimeout(idleTimer)
      idleTimer = setTimeout(() => {
        abortController.abort()
      }, IDLE_TIMEOUT_MS)
    }

    // Propagate the caller's abort signal to our internal one
    cb.signal.addEventListener('abort', () => abortController.abort(), { once: true })

    resetIdleTimer()

    outer: while (true) {
      // Race: read vs abort
      let readResult: ReadableStreamReadResult<Uint8Array>
      try {
        // AbortController doesn't cancel an in-flight reader.read() natively,
        // so we race it with a rejected promise on abort.
        readResult = await Promise.race([
          reader.read(),
          new Promise<never>((_, reject) => {
            if (abortController.signal.aborted) {
              reject(new DOMException('Aborted', 'AbortError'))
            } else {
              abortController.signal.addEventListener('abort', () =>
                reject(new DOMException('Aborted', 'AbortError')), { once: true })
            }
          }),
        ])
      } catch (err) {
        const wasIdleTimeout = !cb.signal.aborted && abortController.signal.aborted
        if (wasIdleTimeout) {
          streamError = 'Stream stalled (no data for 30s). The provider may be overloaded — please retry.'
        }
        break
      }

      resetIdleTimer()
      const { done, value } = readResult
      if (done) break

      buf += decoder.decode(value, { stream: true })

      let nl: number
      while ((nl = buf.indexOf('\n')) !== -1) {
        const line = buf.slice(0, nl).trim()
        buf = buf.slice(nl + 1)

        if (!line || line === 'data: [DONE]') continue
        const data = line.startsWith('data: ') ? line.slice(6) : null
        if (!data) continue

        let chunk: Record<string, unknown>
        try {
          chunk = JSON.parse(data)
        } catch {
          continue
        }

        // Usage — sent in final chunk by OpenRouter / LiteLLM
        if (chunk.usage && typeof chunk.usage === 'object') {
          const u = chunk.usage as Record<string, number>
          usageResult = {
            prompt_tokens: u.prompt_tokens ?? 0,
            completion_tokens: u.completion_tokens ?? 0,
            total_tokens: u.total_tokens ?? 0,
          }
        }

        const choices = (chunk.choices as unknown[]) ?? []
        if (choices.length === 0) continue
        const choice = choices[0] as Record<string, unknown>
        const delta = (choice.delta ?? {}) as Record<string, unknown>

        if (typeof choice.finish_reason === 'string' && choice.finish_reason) {
          finishReason = choice.finish_reason
        }

        // Content delta
        if (typeof delta.content === 'string' && delta.content) {
          fullContent += delta.content
          cb.onDelta(delta.content)
        }

        // Tool call deltas
        const tcDeltas = delta.tool_calls as Array<Record<string, unknown>> | undefined
        if (tcDeltas) {
          for (const tcd of tcDeltas) {
            const idx = (tcd.index as number) ?? 0
            if (!tcMap.has(idx)) tcMap.set(idx, { id: '', name: '', args: '' })
            const entry = tcMap.get(idx)!
            if (typeof tcd.id === 'string') entry.id = tcd.id
            const fn = tcd.function as Record<string, string> | undefined
            if (fn?.name) entry.name += fn.name
            if (fn?.arguments) entry.args += fn.arguments
          }
        }

        if (cb.signal.aborted) break outer
      }
    }

    if (idleTimer) clearTimeout(idleTimer)
    reader.releaseLock()

    if (streamError) {
      // Retry on stream stall if we haven't exceeded retries
      if (attempt < MAX_RETRIES && !cb.signal.aborted) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, attempt)
        try { await sleep(delay, cb.signal) } catch { break }
        continue
      }
      cb.onError(streamError)
      throw new Error(streamError)
    }

    if (usageResult) {
      cb.onUsage(usageResult.prompt_tokens, usageResult.completion_tokens, usageResult.total_tokens)
    }

    const toolCalls: ToolCall[] = []
    for (const [, entry] of [...tcMap.entries()].sort(([a], [b]) => a - b)) {
      if (entry.id) {
        toolCalls.push({
          id: entry.id,
          type: 'function',
          function: { name: entry.name, arguments: entry.args },
        })
      }
    }

    if (toolCalls.length > 0) {
      cb.onToolCalls(toolCalls)
    }

    return { content: fullContent || null, toolCalls, finishReason, usage: usageResult }
  }

  // Should not reach here; thrown inside the loop
  const msg = 'Max retries exceeded'
  cb.onError(msg)
  throw new Error(msg)
}

/**
 * Non-streaming call — used for auto-title (cheap single-turn).
 */
export async function chatOnce(
  apiBase: string,
  apiKey: string,
  _provider: string,
  model: string,
  userPrompt: string,
  maxTokens = 20,
): Promise<string> {
  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://nasus.app',
      'X-Title': 'Nasus',
    }

  const body = JSON.stringify({
    model,
    messages: [{ role: 'user', content: userPrompt }],
    max_tokens: maxTokens,
  })

  try {
    const resp = await fetch(url, { method: 'POST', headers, body })
    if (!resp.ok) return ''
    const json = await resp.json()
    return json?.choices?.[0]?.message?.content?.trim() ?? ''
  } catch {
    return ''
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
const OR_HEADERS = { 'HTTP-Referer': 'https://nasus.app', 'X-Title': 'Nasus' }

/**
 * Fetch rich model metadata from OpenRouter's /models endpoint.
 * Returns full OpenRouterModel objects sorted by provider family then name.
 */
export async function fetchOpenRouterModels(apiKey: string): Promise<OpenRouterModel[]> {
  const url = `${OR_API_BASE}/models`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
    ...OR_HEADERS,
  }
  const resp = await fetch(url, { headers })
  if (!resp.ok) {
    let msg = `HTTP ${resp.status}`
    try {
      const body = await resp.json()
      const orMsg = body?.error?.message
      const orCode = body?.error?.code
      if (orMsg) msg = orCode ? `[${orCode}] ${orMsg}` : orMsg
    } catch { /* ignore */ }
    throw new Error(msg)
  }
  const json = await resp.json()
  const models: OpenRouterModel[] = (json?.data ?? []).filter(
    (m: OpenRouterModel) =>
      m.id &&
      m.name &&
      (m.architecture?.output_modalities ?? ['text']).includes('text'),
  )
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
 * Falls back to claude-3-haiku if the list is empty.
 */
export function cheapestModel(models: OpenRouterModel[]): string {
  if (models.length === 0) return 'anthropic/claude-3-haiku'
  let cheapest = models[0]
  for (const m of models) {
    const price = parseFloat(m.pricing?.completion ?? '999')
    const best  = parseFloat(cheapest.pricing?.completion ?? '999')
    if (price < best) cheapest = m
  }
  return cheapest.id
}
