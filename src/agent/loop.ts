/**
 * Web agent loop — full Plan → Act → Observe cycle.
 *
 * Mirrors the Rust agent in src-tauri/src/lib.rs but runs entirely in the
 * browser. Dispatches events directly to the Zustand store instead of via
 * Tauri events.
 */

import { streamCompletion, chatOnce, type LlmMessage, type ToolDefinition } from './llm'
import { executeTool, type SearchConfig, type SearchStatusCallback } from './tools'
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
        name: 'patch_file',
        description:
          'Replace an exact string in a workspace file. Safer than write_file for small edits like checking off a phase checkbox in task_plan.md. Fails if old_str is not found — read the file first.',
        parameters: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
            old_str: { type: 'string', description: 'Exact string to find (must be unique in the file).' },
            new_str: { type: 'string', description: 'Replacement string.' },
          },
          required: ['path', 'old_str', 'new_str'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'search_web',
        description:
          'Search the web for current information. Use this tool when you need: real-time data, recent events, facts you are unsure about, current prices/stats, or anything that may have changed after your training cutoff. Do NOT use for general knowledge you are already confident about, coding syntax, math, or creative writing. Do NOT search again if results are already in context for the same topic.',
        parameters: {
          type: 'object',
          properties: {
            query: {
              type: 'string',
              description: 'A concise, specific search query written like you would type into Google — use keywords, not full sentences. GOOD: "React 19 release date 2025", "SearXNG JSON API format". BAD: "Can you please find information about when React 19 was released?" (too verbose). The agent should generate the query, never pass the user\'s raw message directly.',
            },
            num_results: {
              type: 'integer',
              description: 'Number of results to return. Use 3 for simple factual lookups, 5 (default) for general research, 10 for comprehensive research.',
              default: 5,
            },
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
  - search_web: multi-backend search (Brave → Google CSE → SearXNG → DuckDuckGo fallback chain); Wikipedia always included for factual queries

═══════════════════════════════════════════════════════
TASK COMPLEXITY JUDGEMENT (decide FIRST)
═══════════════════════════════════════════════════════

Before acting, classify the task:

**Simple** (1–3 tool calls expected): answer directly, write output files, done.
  - Examples: "write a poem", "create index.html", "summarise this text"
  - Do NOT write task_plan.md, findings.md, or progress.md for simple tasks.
  - Just do the work and deliver the result.

**Complex** (4+ tool calls, research, multi-phase): use memory files.
  - Examples: "build a full website", "research X and write a report", "multi-step data pipeline"
  - Write task_plan.md FIRST, then proceed.

═══════════════════════════════════════════════════════
WEB SEARCH GUIDELINES
═══════════════════════════════════════════════════════

**When to search:**
- User asks about recent events, news, or current data
- You need to verify a fact you are uncertain about
- The topic requires information after your training cutoff
- User explicitly asks to "look up" or "search for" something

**When NOT to search:**
- You already know the answer with high confidence
- The question is about coding syntax, math, logic, or creative writing
- The question is purely conversational
- You just searched for this topic and results are in context — do not re-search

**Best practices:**
- Use concise keyword queries, not full sentences
- Search once, then work with the results
- Always cite sources (URL) when presenting search results
- Synthesize; do not dump raw snippets

═══════════════════════════════════════════════════════
MEMORY PROTOCOL (complex tasks only)
═══════════════════════════════════════════════════════

For complex tasks, use THREE persistent files in /workspace:

**1. task_plan.md** — Master plan (write FIRST for complex tasks)
   \`\`\`
   # Goal
   <one sentence>
   # Phases
   - [ ] Phase 1: …
   # Current Phase
   Phase N: …
   # Error Log
   | Error | Tool | Attempt # | What I tried | Outcome |
   \`\`\`
   Update phase checkboxes as you complete them ([ ] → [x]).

**2. findings.md** — Research notes
   Save key findings after every 3 search/fetch/read operations.

**3. progress.md** — Action log (optional for very long tasks)
   Append a row after each tool call if the task spans many iterations.

═══════════════════════════════════════════════════════
3-STRIKE ERROR PROTOCOL
═══════════════════════════════════════════════════════

- **Strike 1**: Diagnose. Apply a targeted fix.
- **Strike 2**: Try a COMPLETELY DIFFERENT approach or tool.
- **Strike 3**: Fundamental rethink. Search for solutions. Reconsider the method.
- **After 3 strikes**: STOP. Explain exactly what failed and why.

═══════════════════════════════════════════════════════
RULES
═══════════════════════════════════════════════════════

1. NEVER fabricate tool outputs. Always call the tool.
2. For simple tasks: skip memory files entirely — go straight to the work.
3. For complex tasks: write task_plan.md first; save findings after every 3 operations.
4. Follow the 3-Strike protocol — never exceed 3 attempts on the same failure.
5. Use patch_file for small edits (e.g., checking off a checkbox).
6. When done, summarise: what was accomplished, what files are in /workspace, any caveats.

═══════════════════════════════════════════════════════
USER FILE UPLOADS
═══════════════════════════════════════════════════════

When files are attached:
1. They appear as: [User attached N file(s): - uploads/filename.ext …]
2. Access with read_file("uploads/filename.ext")
3. Acknowledge files specifically (describe images, note document contents, identify code language)
4. Files < 8 KB are inlined in the message. Larger files need explicit read_file.
5. Save outputs derived from uploads to /workspace and note them in your summary.`

// ── Error tracker ─────────────────────────────────────────────────────────────

class ErrorTracker {
  private strikes: Map<string, { count: number; attempts: string[] }> = new Map()

  record(tool: string, summary: string): number {
    const sig = `${tool}::${summary.slice(0, 60)}`
    const entry = this.strikes.get(sig) ?? { count: 0, attempts: [] }
    entry.count++
    entry.attempts.push(summary)
    this.strikes.set(sig, entry)
    return entry.count
  }

  reset(tool: string) {
    // Clear all strike keys for this tool (any error signature)
    for (const key of this.strikes.keys()) {
      if (key.startsWith(`${tool}::`)) this.strikes.delete(key)
    }
  }

  attempts(tool: string): string[] {
    const all: string[] = []
    for (const [key, val] of this.strikes.entries()) {
      if (key.startsWith(`${tool}::`)) all.push(...val.attempts)
    }
    return all
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
      content: `[Context compressed: ${removed} old tool call/result pairs removed to save space. Key recovery files are in /workspace — read task_plan.md to confirm current phase, findings.md for research, progress.md for action history.]`,
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
  searchConfig?: SearchConfig
  signal: AbortSignal
  maxIterations?: number
}

const MAX_ITERATIONS = 50
const WARN_ITERATIONS = 40
const COMPRESS_THRESHOLD = 40

export async function runAgentLoop(params: RunAgentParams): Promise<void> {
  const { taskId, messageId, userMessages, apiKey, model, apiBase, provider, searchConfig, signal } = params
  const maxIter = params.maxIterations ?? MAX_ITERATIONS
  const warnIter = Math.max(1, maxIter - 10)
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
      searchStatus: (callId: string, evt: Parameters<SearchStatusCallback>[0]) => {
        const step: AgentStep = {
          kind: 'search_status',
          callId,
          query: evt.query,
          phase: evt.phase,
          provider: evt.provider,
          message: evt.message,
          resultCount: evt.resultCount,
          durationMs: evt.durationMs,
        }
        // Update the most recent search_status step for this callId, or add a new one
        useAppStore.getState().updateSearchStatus(taskId, messageId, step)
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

  // ── Auto-title on first message (fire-and-forget, non-blocking) ─────────────
  const isFirstMessage = userMessages.length === 1
  if (isFirstMessage) {
    const firstContent =
      typeof userMessages[0].content === 'string' ? userMessages[0].content : ''
    if (firstContent) {
      autoTitle(apiBase, apiKey, provider, model, firstContent, taskId).catch(() => {})
    }
  }

  // ── Build message history ───────────────────────────────────────────────────
  const messages: LlmMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages,
  ]

  const errorTracker = new ErrorTracker()
  let searchBrowseCount = 0

  for (let iteration = 0; iteration < maxIter; iteration++) {
    if (signal.aborted) {
      emit.done()
      return
    }

      emit.iterationTick(iteration + 1)

      // ── Soft warning near max ─────────────────────────────────────────────────
      if (iteration === warnIter) {
        messages.push({
          role: 'system',
          content: `[Warning] You are at iteration ${iteration + 1}/${maxIter}. Prioritize completing remaining phases and delivering results to the user now.`,
        })
      }

      // ── Attention refresh every 5 iterations ─────────────────────────────────
      if (iteration > 0 && iteration % 5 === 0 && iteration !== warnIter) {
        messages.push({
          role: 'system',
          content: `[Attention Refresh — iteration ${iteration + 1}] Re-read /workspace/task_plan.md now and confirm your current phase before continuing.`,
        })
      }

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

          if (fnName === 'search_web' || fnName === 'http_fetch' || fnName === 'read_file') {
          searchBrowseCount++
          // Nudge to save findings every 3 research ops (only for longer tasks)
          if (searchBrowseCount > 0 && searchBrowseCount % 3 === 0) {
            messages.push({
              role: 'system',
              content: `[Research checkpoint — ${searchBrowseCount} operations]: If this is a complex task, consider saving key findings to findings.md before continuing.`,
            })
          }
        }

          const { output: rawOutput, isError } = await executeTool(
          taskId, fnName, args, searchConfig,
          fnName === 'search_web'
            ? (evt) => emit.searchStatus(callId, evt)
            : undefined,
        )

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
  emit.error(`Maximum iterations (${maxIter}) reached. The agent stopped to prevent runaway usage.`)
}
