/**
 * LLM streaming client — works with any OpenAI-compatible endpoint.
 * Supports OpenRouter, LiteLLM proxy, and OpenAI direct.
 */

export interface LlmMessage {
  role: string
  content: string | null
  tool_call_id?: string
  tool_calls?: ToolCall[]
}

export interface ToolCall {
  id: string
  type: string
  function: { name: string; arguments: string }
}

export interface ToolDefinition {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, unknown>
  }
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

/**
 * Stream a chat completion. Calls onDelta for each text token, calls onToolCalls
 * with fully-assembled tool_calls when the stream ends. Returns the assembled response.
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
  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://nasus.app'
    headers['X-Title'] = 'Nasus'
  }

  const body = JSON.stringify({
    model,
    messages,
    tools,
    tool_choice: 'auto',
    stream: true,
    stream_options: { include_usage: true },
  })

  let resp: Response
  try {
    resp = await fetch(url, { method: 'POST', headers, body, signal: cb.signal })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    cb.onError(msg)
    throw new Error(msg)
  }

  if (!resp.ok) {
    let errMsg = `HTTP ${resp.status}`
    try {
      const errJson = await resp.json()
      errMsg = errJson?.error?.message ?? errMsg
    } catch { /* ignore */ }
    cb.onError(errMsg)
    throw new Error(errMsg)
  }

  const reader = resp.body!.getReader()
  const decoder = new TextDecoder()
  let buf = ''

  let fullContent = ''
  let finishReason = ''
  // Indexed accumulator for streamed tool_call deltas
  const tcMap: Map<number, { id: string; name: string; args: string }> = new Map()
  let usageResult: LlmResponse['usage'] = null

  outer: while (true) {
    let readResult: ReadableStreamReadResult<Uint8Array>
    try {
      readResult = await reader.read()
    } catch {
      break
    }
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

      // Check abort
      if (cb.signal.aborted) break outer
    }
  }

  reader.releaseLock()

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

/**
 * Non-streaming call — used for auto-title (cheap single-turn).
 */
export async function chatOnce(
  apiBase: string,
  apiKey: string,
  provider: string,
  model: string,
  userPrompt: string,
  maxTokens = 20,
): Promise<string> {
  const url = `${apiBase.replace(/\/$/, '')}/chat/completions`

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://nasus.app'
    headers['X-Title'] = 'Nasus'
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
