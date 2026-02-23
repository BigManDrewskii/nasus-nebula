/**
 * Web agent loop — full Plan → Act → Observe cycle.
 *
 * Mirrors the Rust agent in src-tauri/src/lib.rs but runs entirely in the
 * browser. Dispatches events directly to the Zustand store instead of via
 * Tauri events.
 */

import { streamCompletion, chatOnce, type LlmMessage, type ToolDefinition } from './llm'
import { executeTool } from './tools'
import { useAppStore } from '../store'
import type { AgentStep } from '../types'

// ── Tool schema ───────────────────────────────────────────────────────────────

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    type: 'function',
    function: {
      name: 'bash',
      description:
        'Execute a shell command. In browser mode, complex commands are not available — use read_file/write_file for file operations and http_fetch/search_web for network access.',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Bash command to run.' },
          timeout_secs: { type: 'integer', description: 'Max seconds (default 30).', default: 30 },
        },
        required: ['command'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'read_file',
      description:
        'Read the contents of a file from the workspace. Use to check task_plan.md, findings.md, progress.md.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
        },
        required: ['path'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'write_file',
      description:
        'Write content to a file in the workspace. Use to update task_plan.md, findings.md, progress.md, or create output artifacts.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
          content: { type: 'string', description: 'Full file content to write.' },
        },
        required: ['path', 'content'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_files',
      description: 'List files and directories in the workspace.',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'Directory path (default: /workspace).', default: '/workspace' },
          recursive: { type: 'boolean', description: 'List recursively (default false).', default: false },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'http_fetch',
      description:
        'Make an HTTP GET or POST request to a URL. Note: cross-origin requests may be blocked by CORS in browser mode. JSON APIs with CORS headers work best.',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string' },
          method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' },
          body: { type: 'string', description: 'Request body for POST' },
          headers: { type: 'object', description: 'Headers map' },
        },
        required: ['url'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'search_web',
      description:
        'Search the web using DuckDuckGo and get results with titles, URLs, and snippets.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Search query string.' },
          num_results: { type: 'integer', description: 'Number of results (default 5, max 10).', default: 5 },
        },
        required: ['query'],
      },
    },
  },
]

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are Nasus, an autonomous AI agent.
Your job: take the user's goal and independently plan and execute a multi-step solution until fully complete.

IMPORTANT: You are running in browser mode. The sandbox environment has limitations:
- bash: only simple file operations (cat, echo, mkdir) work; complex commands are NOT available
- read_file / write_file: use these directly for all file operations — they work reliably
- http_fetch: external requests may be blocked by CORS — JSON APIs with CORS headers work best
- search_web: uses DuckDuckGo Instant Answer API — always available

═══════════════════════════════════════════════════════
MEMORY PROTOCOL (MANDATORY - follow exactly)
═══════════════════════════════════════════════════════

You have THREE persistent memory files in /workspace that survive context resets.
These are your external brain. Use them religiously.

**1. task_plan.md** — Your master plan
   Structure:
   \`\`\`
   # Goal
   <one-sentence description of what you are achieving>

   # Phases
   - [ ] Phase 1: <description>
   - [ ] Phase 2: <description>
   ...

   # Current Phase
   Phase N: <what you are doing right now>

   # Error Log
   | Error | Tool | Attempt # | What I tried | Outcome |
   |-------|------|-----------|--------------|---------|
   \`\`\`
   - Write this file FIRST before any other action
   - Update phase checkboxes as you complete them: [ ] → [x]
   - Log every error to the Error Log table immediately

**2. findings.md** — Research and discoveries
   Structure:
   \`\`\`
   # Findings
   ## <Topic>
   - Key fact 1
   - URL: <url> → <what it contains>
   ...
   \`\`\`
   - Save findings every 2 search/browse/read operations (the "2-Action Rule")
   - Never lose research by leaving it only in the context window

**3. progress.md** — Chronological action log
   Structure:
   \`\`\`
   # Progress Log
   | Time | Tool | Action | Result |
   |------|------|--------|--------|
   \`\`\`
   - Append a row AFTER EVERY tool call
   - This is your recovery log — if the context resets, you read this to know where you are

═══════════════════════════════════════════════════════
3-STRIKE ERROR PROTOCOL
═══════════════════════════════════════════════════════

When a tool call fails or produces wrong output:
- **Strike 1**: Diagnose the specific error. Apply a targeted fix. Log to task_plan.md error table.
- **Strike 2**: The targeted fix didn't work. Try a COMPLETELY DIFFERENT approach or tool.
- **Strike 3**: Fundamental rethink. Search for solutions online. Reconsider the entire method.
- **Failure (3 strikes exhausted)**: STOP. Explain to the user exactly what you tried and why it failed.
  Do NOT keep retrying the same thing.

═══════════════════════════════════════════════════════
2-ACTION SAVE RULE
═══════════════════════════════════════════════════════

After every 2 calls to search_web, http_fetch, read_file:
→ IMMEDIATELY write key findings to findings.md before continuing.

═══════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════

1. NEVER fabricate tool outputs. Always call the tool.
2. Write task_plan.md FIRST on every new task using write_file.
3. Update progress.md AFTER every tool call using write_file.
4. Apply the 2-Action Save Rule without exception.
5. Follow the 3-Strike protocol on errors — never exceed 3 attempts on the same failure.
6. When done, summarize: what was accomplished, what files are in the workspace, and any caveats.`

// ── Error tracker ─────────────────────────────────────────────────────────────

class ErrorTracker {
  private strikes: Map<string, { count: number; attempts: string[] }> = new Map()

  record(tool: string, summary: string): number {
    const entry = this.strikes.get(tool) ?? { count: 0, attempts: [] }
    entry.count++
    entry.attempts.push(summary)
    this.strikes.set(tool, entry)
    return entry.count
  }

  reset(tool: string) {
    this.strikes.delete(tool)
  }

  attempts(tool: string): string[] {
    return this.strikes.get(tool)?.attempts ?? []
  }
}

// ── Context compression ───────────────────────────────────────────────────────

function compressContext(messages: LlmMessage[], taskId: string, messageId: string): number {
  const toolResultIndices = messages
    .map((m, i) => (m.role === 'tool' ? i : -1))
    .filter((i) => i >= 0)

  if (toolResultIndices.length <= 6) return 0

  const middleResults = new Set(
    toolResultIndices.slice(2, toolResultIndices.length - 4),
  )

  const toRemove = new Set<number>(middleResults)
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i]
    if (m.role === 'assistant' && m.tool_calls?.length) {
      let j = i + 1
      const resultIndices: number[] = []
      while (j < messages.length && messages[j].role === 'tool') {
        resultIndices.push(j)
        j++
      }
      if (resultIndices.length > 0 && resultIndices.every((idx) => middleResults.has(idx))) {
        toRemove.add(i)
      }
    }
  }

  const removed = toRemove.size
  const kept = messages.filter((_, i) => !toRemove.has(i))

  if (kept.length > 1) {
    kept.splice(1, 0, {
      role: 'system',
      content: `[Context compressed: ${removed} old tool call/result pairs removed to save space. Your memory files in /workspace still contain full history.]`,
    })
  }

  messages.length = 0
  messages.push(...kept)

  // Emit to store
  const store = useAppStore.getState()
  const step: AgentStep = { kind: 'context_compressed', removedCount: removed }
  store.addStep(taskId, messageId, step)

  return removed
}

// ── Auto-title ─────────────────────────────────────────────────────────────────

async function autoTitle(
  apiBase: string,
  apiKey: string,
  provider: string,
  model: string,
  userMessage: string,
  taskId: string,
) {
  const titleModel = provider === 'openrouter' ? 'anthropic/claude-3-haiku' : model
  const prompt = `Summarise the following task in 4-6 words as a short title. Reply with ONLY the title, no punctuation:\n\n${userMessage}`
  const title = await chatOnce(apiBase, apiKey, provider, titleModel, prompt, 20)
  if (title) {
    const clean = title.replace(/^["']|["']$/g, '').trim()
    if (clean) useAppStore.getState().updateTaskTitle(taskId, clean)
  }
}

// ── Main agent loop ───────────────────────────────────────────────────────────

export interface RunAgentParams {
  taskId: string
  messageId: string
  userMessages: LlmMessage[]
  apiKey: string
  model: string
  apiBase: string
  provider: string
  signal: AbortSignal
}

const MAX_ITERATIONS = 30
const COMPRESS_THRESHOLD = 40

export async function runAgentLoop(params: RunAgentParams): Promise<void> {
  const { taskId, messageId, userMessages, apiKey, model, apiBase, provider, signal } = params
  const store = useAppStore.getState

  const emit = {
    thinking: (content: string) => {
      const step: AgentStep = { kind: 'thinking', content }
      useAppStore.getState().addStep(taskId, messageId, step)
    },
    toolCall: (tool: string, input: Record<string, unknown>, callId: string) => {
      const step: AgentStep = { kind: 'tool_call', tool, input, callId }
      useAppStore.getState().addStep(taskId, messageId, step)
    },
    toolResult: (callId: string, output: string, isError: boolean) => {
      const step: AgentStep = { kind: 'tool_result', callId, output, isError }
      useAppStore.getState().updateStep(taskId, messageId, step)
    },
    strikeEscalation: (tool: string, attempts: string[]) => {
      const step: AgentStep = { kind: 'strike_escalation', tool, attempts }
      useAppStore.getState().addStep(taskId, messageId, step)
    },
    chunk: (delta: string) => {
      useAppStore.getState().appendChunk(taskId, messageId, delta)
    },
    done: () => {
      useAppStore.getState().setStreaming(taskId, messageId, false)
      useAppStore.getState().updateTaskStatus(taskId, 'completed')
    },
    error: (err: string) => {
      useAppStore.getState().setError(taskId, messageId, err)
      useAppStore.getState().updateTaskStatus(taskId, 'failed')
    },
    iterationTick: (n: number) => {
      // Dispatch a custom event so ChatView can update its counter
      window.dispatchEvent(new CustomEvent('nasus:iteration', { detail: { taskId, iteration: n } }))
    },
    tokenUsage: (prompt: number, completion: number, total: number) => {
      window.dispatchEvent(
        new CustomEvent('nasus:tokens', { detail: { taskId, prompt_tokens: prompt, completion_tokens: completion, total_tokens: total } }),
      )
    },
  }

  // ── Preflight: validate API key ─────────────────────────────────────────────
  if (!apiKey) {
    emit.error('No API key configured. Open Settings (⌘,) and enter your OpenRouter or LiteLLM API key.')
    return
  }

  // ── Auto-title on first message ─────────────────────────────────────────────
  const isFirstMessage = userMessages.length === 1
  if (isFirstMessage) {
    const firstContent =
      typeof userMessages[0].content === 'string' ? userMessages[0].content : ''
    if (firstContent) {
      // Fire-and-forget
      autoTitle(apiBase, apiKey, provider, model, firstContent, taskId).catch(() => {})
    }
  }

  emit.thinking('Initializing…')

  // ── Build message history ───────────────────────────────────────────────────
  const messages: LlmMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages,
  ]

  const errorTracker = new ErrorTracker()
  let searchBrowseCount = 0

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    if (signal.aborted) {
      emit.done()
      return
    }

    emit.iterationTick(iteration + 1)

    if (messages.length > COMPRESS_THRESHOLD) {
      compressContext(messages, taskId, messageId)
    }

    // ── LLM call ──────────────────────────────────────────────────────────────
    let finishReason = ''
    let responseContent: string | null = null
    let responseToolCalls: import('./llm').ToolCall[] = []

    try {
      const result = await streamCompletion(
        apiBase,
        apiKey,
        provider,
        model,
        messages,
        TOOL_DEFINITIONS,
        {
          onDelta: emit.chunk,
          onToolCalls: (calls) => { responseToolCalls = calls },
          onUsage: emit.tokenUsage,
          onError: emit.error,
          signal,
        },
      )
      finishReason = result.finishReason
      responseContent = result.content
      responseToolCalls = result.toolCalls
    } catch (err) {
      if (!signal.aborted) {
        emit.error(err instanceof Error ? err.message : String(err))
      } else {
        emit.done()
      }
      return
    }

    if (signal.aborted) {
      emit.done()
      return
    }

    const noTools = responseToolCalls.length === 0

    if (finishReason === 'stop' || noTools) {
      // Final answer was streamed live; persist to rawHistory
      if (responseContent) {
        useAppStore.getState().appendRawHistory(taskId, [
          { role: 'assistant', content: responseContent },
        ])
      }
      emit.done()
      return
    }

    // ── Tool calls ────────────────────────────────────────────────────────────
    messages.push({
      role: 'assistant',
      content: responseContent,
      tool_calls: responseToolCalls,
    })

    for (const tc of responseToolCalls) {
      if (signal.aborted) { emit.done(); return }

      const callId = tc.id
      const fnName = tc.function.name
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch { /* malformed JSON — use empty */ }

      emit.toolCall(fnName, args, callId)

      if (fnName === 'search_web' || fnName === 'http_fetch') {
        searchBrowseCount++
        if (searchBrowseCount % 2 === 0) {
          messages.push({
            role: 'system',
            content:
              '[2-Action Rule]: You have performed 2 search/fetch operations. You MUST now save key findings to findings.md before continuing.',
          })
        }
      }

      const { output: rawOutput, isError } = await executeTool(taskId, fnName, args)

      let output: string
      if (isError) {
        const strike = errorTracker.record(fnName, rawOutput)
        if (strike === 1) {
          output = `[Strike 1/3] Error: ${rawOutput}\nDiagnose and apply a targeted fix.`
        } else if (strike === 2) {
          output = `[Strike 2/3] Same tool failed again: ${rawOutput}\nTry a COMPLETELY DIFFERENT approach or tool.`
        } else if (strike === 3) {
          const attempts = errorTracker.attempts(fnName)
          emit.strikeEscalation(fnName, attempts)
          output = `[Strike 3/3 — ESCALATE] All 3 attempts at \`${fnName}\` failed:\n${attempts.join('\n---\n')}\n\nYou MUST stop retrying this tool.`
        } else {
          output = `[BLOCKED] \`${fnName}\` has failed ${strike} times. Do not call this tool again. Report failure to user.`
        }
      } else {
        errorTracker.reset(fnName)
        output = rawOutput
      }

      emit.toolResult(callId, output, isError)

      messages.push({
        role: 'tool',
        content: output,
        tool_call_id: callId,
      })
    }

    // Sync rawHistory so multi-turn follow-ups work
    const batchRaw: LlmMessage[] = []
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]
      if (m.role === 'tool') {
        batchRaw.unshift(m)
      } else if (m.role === 'assistant' && m.tool_calls?.length) {
        batchRaw.unshift(m)
        break
      } else {
        break
      }
    }
    if (batchRaw.length > 0) {
      useAppStore.getState().appendRawHistory(taskId, batchRaw)
    }
  }

  // Max iterations hit
  emit.error('Maximum iterations reached. The agent stopped to prevent runaway usage.')
}
