/**
 * Web agent loop — full Plan → Act → Observe cycle.
 *
 * Mirrors the Rust agent in src-tauri/src/lib.rs but runs entirely in the
 * browser. Dispatches events directly to the Zustand store instead of via
 * Tauri events.
 */

import { streamCompletion, chatOnce, cheapestModel, type LlmMessage } from './llm'
import { executeTool, startTurnTracking, flushTurnFiles, getWorkspace, type SearchConfig, type SearchStatusCallback } from './tools'
import type { ExecutionConfig } from './sandboxRuntime'
import { useAppStore } from '../store'
import type { AgentStep } from '../types'
import { detectStack, seedStackTemplate } from './stackTemplates'
import { TOOL_DEFINITIONS } from './toolDefinitions'
import { SYSTEM_PROMPT } from './systemPrompt'


// (SYSTEM_PROMPT imported from systemPrompt.ts)

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
  _model: string,
  userMessage: string,
  taskId: string,
) {
  // Use the cheapest model from the fetched OR list, or fall back to haiku.
  // This avoids burning expensive tokens on a 6-word title.
  const { openRouterModels } = useAppStore.getState()
  const titleModel = openRouterModels.length > 0
    ? cheapestModel(openRouterModels)
    : 'anthropic/claude-3-haiku'

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
  executionConfig?: ExecutionConfig
  signal: AbortSignal
  maxIterations?: number
}

const MAX_ITERATIONS = 50

// Context windows (tokens) per model family — used to set compression threshold.
// Compression removes old tool call pairs once the message count suggests we
// might be approaching the limit.  We use a conservative message-count heuristic
// rather than counting tokens precisely (no tokenizer in browser).
// All model IDs here are OpenRouter format (provider/name).
const CONTEXT_WINDOWS: Array<[RegExp, number]> = [
  // Anthropic
  [/claude-3[.-]5|claude-3[.-]7|claude-sonnet-4|claude-opus-4/, 200_000],
  [/claude-3-haiku/,                                              200_000],
  // OpenAI
  [/gpt-4\.1/,                                                   1_000_000],
  [/gpt-4o/,                                                       128_000],
  [/o1|o3|o4/,                                                     200_000],
  // Google
  [/gemini-2\.5/,                                                1_048_576],
  [/gemini-2\.0/,                                                1_048_576],
  [/gemini-1\.5/,                                                1_048_576],
  // DeepSeek
  [/deepseek-r1/,                                                  128_000],
  [/deepseek-v3|deepseek-chat/,                                    128_000],
  [/deepseek/,                                                      64_000],
  // Meta Llama
  [/llama-3\.[23]-\d+b/,                                          128_000],
  [/llama-3\.3/,                                                   128_000],
  // Mistral
  [/mistral-large|mistral-medium/,                                 128_000],
  [/mixtral/,                                                       32_000],
  // Qwen
  [/qwen-2\.5|qwq/,                                               131_072],
  // Cohere
  [/command-r/,                                                    128_000],
]

/** Return approximate message-count compression threshold for a model. */
function compressThreshold(model: string): number {
  for (const [re, ctx] of CONTEXT_WINDOWS) {
    if (re.test(model)) {
      // Rough heuristic: 1 msg ≈ 500 tokens; start compressing at 60% of ctx
      return Math.max(20, Math.floor((ctx * 0.6) / 500))
    }
  }
  return 40 // conservative default
}

export async function runAgentLoop(params: RunAgentParams): Promise<void> {
  const { taskId, messageId, userMessages, apiKey, model, apiBase, provider, searchConfig, executionConfig, signal } = params
  const maxIter = params.maxIterations ?? MAX_ITERATIONS
  const warnIter = Math.max(1, maxIter - 10)
  const compressAt = compressThreshold(model)
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
      // End processing phase on first token so spinner → streaming cursor transitions correctly
      emit.processingEnd()
    },
    done: () => {
      useAppStore.getState().setStreaming(taskId, messageId, false)
      useAppStore.getState().updateTaskStatus(taskId, 'completed')
      emit.processingEnd()
      emit.agentDone()
    },
    error: (err: string) => {
      useAppStore.getState().setError(taskId, messageId, err)
      useAppStore.getState().updateTaskStatus(taskId, 'failed')
      emit.processingEnd()
      emit.agentDone()
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
      agentStarted: () => {
        window.dispatchEvent(new CustomEvent('nasus:agent-started', { detail: { taskId, messageId } }))
      },
      agentDone: () => {
        window.dispatchEvent(new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }))
      },
      processingEnd: () => {
        window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
      },
    }

  // ── Preflight: validate API key ─────────────────────────────────────────────
  if (!apiKey) {
    emit.error('No API key configured. Open Settings (⌘,) and enter your OpenRouter API key (sk-or-…).')
    return
  }

  // Signal agent has started — lets ChatView flip agentRunning and processingPhase
  emit.agentStarted()

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

  // ── Stack template pre-seeding ───────────────────────────────────────────────
  // For UI/web/code tasks, detect the stack from the user's message and seed the
  // workspace with a ready-to-use template file + inject context so the agent
  // skips boilerplate setup turns entirely.
  const firstUserContent =
    typeof userMessages[0]?.content === 'string' ? userMessages[0].content : ''
  if (firstUserContent && userMessages.length === 1) {
    const detectedStack = detectStack(firstUserContent)
    if (detectedStack) {
      seedStackTemplate(taskId, detectedStack.id)
      // Insert after system prompt so the agent sees it before the user message
      messages.splice(1, 0, {
        role: 'system',
        content: `[Stack Template Ready] ${detectedStack.contextInjection}`,
      })
    }
  }

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

      if (messages.length > compressAt) {
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
      // Enforce one-tool-call-per-turn: if the model batched multiple calls,
      // only process the first one. The next iteration will handle the rest.
      const singleToolCall = responseToolCalls.slice(0, 1)

        messages.push({
          role: 'assistant',
          content: responseContent || null,
          tool_calls: singleToolCall,
        })

      // Begin tracking files written during this batch of tool calls
      startTurnTracking(taskId)

      for (const tc of singleToolCall) {
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
            executionConfig
              ? {
                  ...executionConfig,
                  onSandboxStatus: (status, message) => {
                    useAppStore.getState().setSandboxStatus(status, message)
                  },
                }
              : undefined,
          )

        let output: string
        // For successful screenshot results, store a sentinel so we can inject
        // a vision message below (the base64 data URL is in rawOutput)
        const isScreenshot = fnName === 'browser_screenshot' && !isError && rawOutput.startsWith('data:image/')

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

        // For screenshots, inject the image as a vision-capable user message
        // so models with vision support can actually see the screenshot.
        if (isScreenshot) {
          // Strip the data URL prefix to get pure base64
          const base64 = rawOutput.replace(/^data:image\/[^;]+;base64,/, '')
          const mediaType = rawOutput.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
          messages.push({
            role: 'tool',
            // @ts-expect-error — multimodal tool results use content array
            content: [
              { type: 'text', text: '[Screenshot captured. See image below.]' },
              {
                type: 'image_url',
                image_url: { url: `data:${mediaType};base64,${base64}`, detail: 'auto' },
              },
            ],
            tool_call_id: callId,
          })
        } else {
          messages.push({
            role: 'tool',
            content: output,
            tool_call_id: callId,
          })
        }
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

        // Emit output_cards step if any deliverable files were written this turn
        const turnFiles = flushTurnFiles(taskId)
        const deliverableFiles = turnFiles.filter((f) => {
          const name = f.filename
          return name !== 'task_plan.md' && name !== 'findings.md' && name !== 'progress.md'
        })
        if (deliverableFiles.length > 0) {
          const step: AgentStep = { kind: 'output_cards', files: deliverableFiles }
          useAppStore.getState().addStep(taskId, messageId, step)
        }

        // After every tool batch: inject a continuation nudge to prevent the model
        // from prematurely stopping with narration instead of continuing to work.
        // Only inject if we are mid-task (not first iteration) and haven't hit warn threshold.
        if (iteration > 0 && iteration < warnIter - 1) {
          const ws = getWorkspace(taskId)
          const hasPlan = ws.has('task_plan.md')
          if (hasPlan) {
            const plan = ws.get('task_plan.md') ?? ''
            const hasUnchecked = plan.includes('- [ ]')
            if (hasUnchecked) {
              messages.push({
                role: 'system',
                content: `[Continue] task_plan.md has unchecked phases. Do NOT output a summary yet — immediately call the next tool to continue execution.`,
              })
            }
          }
        }
    }

  // Max iterations hit — flush any pending turn files before reporting error
  const remainingFiles = flushTurnFiles(taskId).filter((f) => {
    const name = f.filename
    return name !== 'task_plan.md' && name !== 'findings.md' && name !== 'progress.md'
  })
  if (remainingFiles.length > 0) {
    const step: AgentStep = { kind: 'output_cards', files: remainingFiles }
    useAppStore.getState().addStep(taskId, messageId, step)
  }
  emit.error(`Maximum iterations (${maxIter}) reached. Check the Output panel for files that were created.`)
}
