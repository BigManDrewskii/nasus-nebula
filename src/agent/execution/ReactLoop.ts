/**
 * ReactLoop — the core ReAct (Reason + Act) iteration cycle.
 *
 * Extracted from ExecutionAgent so the hot loop can be tested and
 * reasoned about in isolation.  ExecutionAgent constructs a ReactLoop,
 * wires callbacks, and calls run().
 *
 * Owns:
 *  - The while-loop and iteration bookkeeping
 *  - LLM calls with gateway failover (callLLM)
 *  - Tool dispatch and result handling (handleToolCalls)
 *  - 3-strike error escalation via ErrorTracker
 *  - Context compression via injected ContextCompressor
 *  - Plan-progress tracking (task_plan.md checkbox updates)
 */

import { streamCompletion, isReasoningModel } from '../llm'
import type { LlmMessage, LlmResponse, ToolCall } from '../llm'
import { startTurnTracking } from '../tools'
import { executeTool } from '../tools/index'
import type { ExecutionConfig } from '../sandboxRuntime'
import type { ExecutionPlan } from '../core/Agent'
import { useAppStore } from '../../store'
import type { AgentStep } from '../../types'
import { ErrorTracker } from '../core/ErrorTracker'
import { TraceLogger } from '../TraceLogger'
import { workspaceManager } from '../workspace/WorkspaceManager'
import { createLogger } from '../../lib/logger'
import type { SearchStatusCallback } from '../search'
import { runPhaseGate, getActiveToolsForPhase } from './PhaseGate'
import type { ContextCompressor } from './ContextCompressor'
import type { getToolDefinitions } from '../tools/index'

const log = createLogger('ReactLoop')

/** Derive an OpenAI-compatible provider type string from a gateway base URL. */
function _providerFromBase(apiBase: string): string | undefined {
  if (apiBase.includes('deepseek.com')) return 'deepseek'
  if (apiBase.includes('api.openai.com')) return 'openai'
  if (apiBase.includes('api.anthropic.com')) return 'anthropic'
  return undefined
}

/**
 * Returns true for errors that are unrecoverable and should halt the ReAct loop
 * immediately rather than triggering the outer retry/backoff logic.
 *
 * Covers:
 *  - All gateways exhausted ("All LLM gateways failed")
 *  - No gateways configured ("No gateways available")
 *  - Permanent auth failures (HTTP 401/403, "invalid api key", "unauthorized")
 *
 * Does NOT cover transient errors (network timeout, 429, 502/503) — those
 * should fall through to the retry loop.
 */
function _isPermanentLlmError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes('all llm gateways failed') ||
    msg.includes('no gateways available') ||
    msg.includes('invalid api key') ||
    msg.includes('unauthorized') ||
    // Match "authentication failed" / "authentication error"
    msg.includes('authentication') ||
    // HTTP status codes for permanent auth/authz failures
    msg.includes('http 401') ||
    msg.includes('http 403') ||
    msg.includes(' 401 ') ||
    msg.includes(' 403 ')
  )
}

// ── Public interfaces ────────────────────────────────────────────────────────

/**
 * UI/observability callbacks provided by ExecutionAgent.
 * Each wraps an emit method that dispatches to the store and/or window events.
 */
export interface ReactLoopCallbacks {
  onIterationTick: (n: number) => void
  onChunk: (delta: string) => void
  onReasoning: (delta: string) => void
  onTokenUsage: (p: number, c: number, t: number) => void
  onToolCall: (tool: string, input: Record<string, unknown>, callId: string) => void
  onToolResult: (callId: string, output: string, isError: boolean) => void
  onSearchStatus: (callId: string, evt: Parameters<SearchStatusCallback>[0]) => void
  onStrikeEscalation: (tool: string, attempts: string[]) => void
  onContextCompressed: (count: number) => void
  onModelSelected: (modelId: string, modelName: string, provider: string) => void
}

/** Resolved gateway connection (from store.resolveConnection()). */
type ResolvedConnection = ReturnType<ReturnType<typeof useAppStore.getState>['resolveConnection']>

export interface ReactLoopConfig {
  taskId: string
  messageId: string
  maxIterations: number
  signal: AbortSignal
  toolDefs: ReturnType<typeof getToolDefinitions>
  executionConfig?: ExecutionConfig
  plan?: ExecutionPlan
  resolvedConnection: ResolvedConnection
  forcePowerfulModel: boolean
  env: 'sandbox' | 'browser-only'
  callbacks: ReactLoopCallbacks
  compressor: ContextCompressor
  /**
   * When set, this is a correction run — preserve errorTracker and
   * executionOutputBuffer instead of starting fresh.
   */
  priorRunState?: {
    errorTracker: ErrorTracker
    executionOutputBuffer: string
  }
}

export interface ReactLoopResult {
  status: 'complete' | 'max_iterations' | 'aborted' | 'error'
  errorMessage?: string
  /** Accumulated tool output snippets for post-run verification. */
  executionOutputBuffer: string
  /** Returned so correction runs can reuse the same tracker. */
  errorTracker: ErrorTracker
  /** Checkbox count so ExecutionAgent can sync resetProgressTracking. */
  completedCheckboxes: number
}

// ── ReactLoop ────────────────────────────────────────────────────────────────

export class ReactLoop {
  // Loop-owned mutable state
  private config: ReactLoopConfig
  private errorTracker: ErrorTracker
  private searchBrowseCount = 0
  private completedCheckboxes = 0
  private contextWarningIssued = false
  private executionOutputBuffer = ''

  constructor(config: ReactLoopConfig) {
    this.config = config
    if (config.priorRunState) {
      this.errorTracker = config.priorRunState.errorTracker
      this.executionOutputBuffer = config.priorRunState.executionOutputBuffer
    } else {
      this.errorTracker = new ErrorTracker()
    }
  }

  /**
   * Run the ReAct loop.
   * @param messages  - Mutable message array; new messages are appended in-place.
   */
  async run(messages: LlmMessage[]): Promise<ReactLoopResult> {
    const { taskId, messageId, maxIterations, signal, toolDefs, executionConfig, plan,
            resolvedConnection, forcePowerfulModel, env, callbacks, compressor } = this.config

    let consecutiveLlmFailures = 0
    const MAX_CONSECUTIVE_LLM_FAILURES = 2

    const tracer = new TraceLogger(taskId, messageId)

    const done = (status: ReactLoopResult['status'], errorMessage?: string): ReactLoopResult => ({
      status,
      errorMessage,
      executionOutputBuffer: this.executionOutputBuffer,
      errorTracker: this.errorTracker,
      completedCheckboxes: this.completedCheckboxes,
    })

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      if (signal?.aborted) return done('aborted')

      callbacks.onIterationTick(iteration + 1)

      const warnIter = Math.max(1, maxIterations - 10)
      if (iteration === warnIter) {
        messages.push({
          role: 'system',
          content: `[Warning] You are at iteration ${iteration + 1}/${maxIterations}. Prioritize completing remaining phases and delivering results to the user now.`,
        })
      }

      // Attention refresh every 5 iterations
      if (iteration > 0 && iteration % 5 === 0 && iteration !== warnIter) {
        this.pushOrReplaceSystemMessage(
          messages,
          '[Attention Refresh',
          `[Attention Refresh — iteration ${iteration + 1}] Re-read /workspace/task_plan.md now and confirm your current phase before continuing.`,
        )
      }

      // Context checkpoint nudge every 10 iterations
      if (iteration > 0 && iteration % 10 === 0) {
        this.pushOrReplaceSystemMessage(
          messages,
          '[Context Checkpoint]',
          `[Context Checkpoint — iteration ${iteration + 1}] Write a brief context.md to /workspace using write_file. Include: phases completed, key decisions, what remains. This preserves state if context fills. Do it now before the next tool call.`,
        )
      }

      // Context compression — scale the block-count trigger to the model's context window
      const model = useAppStore.getState().model
      const threshold = compressor.getThreshold(model)
      const minBlocks = Math.min(8, Math.max(1, Math.floor(threshold / 4)))
      if (messages.length > threshold) {
        const masked = compressor.compress(messages, callbacks.onContextCompressed, minBlocks)
        if (masked > 0) {
          const ws = workspaceManager.getWorkspaceSync(taskId)
          if (ws?.has('context.md')) {
            this.pushOrReplaceSystemMessage(
              messages,
              '[Context Restored]',
              `[Context Restored] Older observations were compressed. Re-read /workspace/context.md with read_file to restore your current state before continuing.`,
            )
          }
        }
      }

      // Snapshot message content before this LLM call for narration restoration
      const preIterationContent =
        useAppStore.getState().messages[taskId]?.find((m: { id: string }) => m.id === messageId)?.content ?? ''

      // Phase-aware tool filtering — restrict the visible tool set based on the active plan phase
      let activeToolDefs = toolDefs
      if (plan && plan.phases.length > 0) {
        const phaseIdx = Math.min(
          useAppStore.getState().currentPhase ?? 0,
          plan.phases.length - 1,
        )
        const phase = plan.phases[phaseIdx]
        const stepToolLists = phase.steps.map(
          (s: { tools?: string[] }) => s.tools ?? [],
        )
        const activeNames = getActiveToolsForPhase(phase.title, stepToolLists)
        if (activeNames.length > 0) {
          activeToolDefs = toolDefs.filter(
            (t: { function: { name: string } }) => activeNames.includes(t.function.name),
          )
        }
      }

      // LLM call — permanent errors (auth failure, all gateways exhausted) are
      // re-thrown by callLLM; catch them here for an immediate clean exit.
      const hasOuterRetriesLeft = consecutiveLlmFailures < MAX_CONSECUTIVE_LLM_FAILURES
      let llmResult: Awaited<ReturnType<typeof this.callLLM>>
      try {
        llmResult = await this.callLLM(
          messages, signal, activeToolDefs, resolvedConnection,
          forcePowerfulModel, hasOuterRetriesLeft, callbacks,
        )
      } catch (permanentErr) {
        if (signal?.aborted) return done('aborted')
        const errMsg = permanentErr instanceof Error ? permanentErr.message : String(permanentErr)
        log.error('callLLM threw permanent error — halting loop', permanentErr instanceof Error ? permanentErr : new Error(errMsg))
        return done('error', errMsg)
      }

      if (!llmResult) {
        if (signal?.aborted) return done('aborted')

        const hasKey = useAppStore.getState().gateways?.some(
          (g: { enabled: boolean; apiKey: string }) => g.enabled && g.apiKey?.trim().length > 0
        ) ?? false

        if (!hasKey) {
          return done('error', 'No API key configured. Open Settings → Gateway and add your DeepSeek API key.')
        }

        consecutiveLlmFailures++
        if (consecutiveLlmFailures <= MAX_CONSECUTIVE_LLM_FAILURES) {
          const backoffMs = 5000 * consecutiveLlmFailures
          log.warn(`callLLM failed (outer attempt ${consecutiveLlmFailures}/${MAX_CONSECUTIVE_LLM_FAILURES}), waiting ${backoffMs}ms before retry`)
          await new Promise(r => setTimeout(r, backoffMs))
          iteration--
          continue
        }
        return done('error', 'LLM call failed after all retries. Check your network connection.')
      }

      consecutiveLlmFailures = 0

      const { finishReason, content, toolCalls, usage, reasoningContent } = llmResult

      // Token awareness
      const effectiveModel = useAppStore.getState().model
      if (usage) {
        useAppStore.getState().updateTokenUsage(taskId, usage, effectiveModel)

        const modelCtx = compressor.getContextWindow(effectiveModel)
        const utilization = usage.promptTokens / modelCtx

        if (utilization > 0.7 && !this.contextWarningIssued) {
          messages.push({
            role: 'system',
            content: `[Context Warning] You are using ${Math.round(utilization * 100)}% of the context window. Prioritize completing the task. Avoid reading large files unless essential.`,
          })
          this.contextWarningIssued = true
        }

        if (utilization > 0.85) {
          compressor.compress(messages, callbacks.onContextCompressed, minBlocks)
        }
      }

      if (signal?.aborted) return done('aborted')

      if (reasoningContent) {
        tracer.recordThinking(reasoningContent)
      }

      // No tool calls — check if task is truly done
      if (finishReason === 'stop' || toolCalls.length === 0) {
        const ws = workspaceManager.getWorkspaceSync(taskId)
        const planContent = ws?.get('task_plan.md') ?? ''
        const hasUncheckedItems =
          planContent.includes('[ ]') ||
          planContent.includes('[?]') ||
          planContent.includes('☐')

        if (hasUncheckedItems) {
          if (content) {
            messages.push({ role: 'assistant', content })
          }
          this.pushOrReplaceSystemMessage(
            messages,
            '[MID-TASK STOP DETECTED]',
            `[MID-TASK STOP DETECTED] You stopped without completing the task. task_plan.md still has unchecked items. DO NOT output text — call the next tool IMMEDIATELY to continue execution. No narration, no explanation — just the next tool call.`,
          )
          callbacks.onIterationTick(iteration + 2)
          continue
        }

        if (content) {
          useAppStore.getState().appendRawHistory(taskId, [{ role: 'assistant', content }])
        }
        return done('complete')
      }

      // Process tool calls
      const toolResult = await this.handleToolCalls(
        toolCalls, content, messages, taskId, messageId, executionConfig, signal,
        iteration, warnIter, tracer, reasoningContent, toolDefs, env, plan,
        preIterationContent, callbacks, maxIterations,
      )

      if (toolResult === 'aborted' || toolResult === 'complete') {
        return done(toolResult === 'complete' ? 'complete' : 'aborted')
      }

      if (toolResult === 'max_iterations') {
        return done('max_iterations', `Maximum iterations (${maxIterations}) reached.`)
      }

      // Continuation nudge
      if (iteration > 0 && iteration < warnIter - 1) {
        const ws = workspaceManager.getWorkspaceSync(taskId)
        if (ws) {
          const planFile = ws.get('task_plan.md') || ''
          if (planFile.includes('[ ]') || planFile.includes('[?]') || planFile.includes('☐')) {
            this.pushOrReplaceSystemMessage(
              messages,
              '[Continue]',
              `[Continue] task_plan.md has unchecked phases. Do NOT output a summary yet — immediately call the next tool to continue execution.`,
            )
          }
        }
      }
    }

    return done('max_iterations', `Maximum iterations (${maxIterations}) reached.`)
  }

  // ── Private: LLM call ──────────────────────────────────────────────────────

  private async callLLM(
    messages: LlmMessage[],
    signal: AbortSignal,
    toolDefs: ReturnType<typeof getToolDefinitions>,
    resolvedConnection: ResolvedConnection,
    forcePowerfulModel: boolean,
    suppressErrorEmit: boolean,
    callbacks: ReactLoopCallbacks,
  ): Promise<LlmResponse | null> {
    const store = useAppStore.getState()
    const primaryProvider = resolvedConnection.provider || store.provider
    const primaryApiKey = resolvedConnection.apiKey || store.apiKey

    let model: string
    if (forcePowerfulModel) {
      if (primaryProvider === 'deepseek') {
        model = 'deepseek-chat'
      } else {
        model = resolvedConnection.model || store.model
      }
    } else {
      model = resolvedConnection.model || store.model
    }

    // Guard: no API key configured at all — fail fast before hitting the network.
    // Check both the legacy direct apiKey field AND any active gateway key.
    const hasGatewayKey = store.gateways?.some(
      (g: { enabled: boolean; apiKey: string }) => g.enabled && g.apiKey?.trim().length > 0
    ) ?? false

    if (!hasGatewayKey && (!primaryApiKey || primaryApiKey.length === 0)) {
      const providerLabel =
        primaryProvider === 'deepseek' ? 'DeepSeek' :
        primaryProvider === 'openai' ? 'OpenAI' :
        primaryProvider === 'ollama' ? 'Ollama' : primaryProvider
      log.error('callLLM failed', new Error(`No API key configured for ${providerLabel}`))
      return null
    }

    callbacks.onModelSelected(model, model.split('/').pop() || model, primaryProvider)

    try {
      const gatewayService = store.getGatewayService()
      const { result } = await gatewayService.callWithFailover(
        async (apiBase, apiKey, extraHeaders) => {
          const provider = _providerFromBase(apiBase) ?? primaryProvider
          return streamCompletion(
            apiBase,
            apiKey,
            provider,
            model,
            messages,
            toolDefs,
            {
              onDelta: (delta) => callbacks.onChunk(delta),
              onToolCalls: () => {},
              onUsage: (p, c, t) => callbacks.onTokenUsage(p, c, t),
              onError: suppressErrorEmit ? () => {} : (_err) => {},
              onReasoning: (reasoning) => callbacks.onReasoning(reasoning),
              signal,
              extraHeaders,
            },
          )
        },
      )
      return result
    } catch (_err) {
      log.error('callLLM stream failed', _err instanceof Error ? _err : new Error(String(_err)))
      // Clean up a partial assistant+tool_calls message if the stream failed before
      // tool execution could complete.
      if (messages.length > 0) {
        const last = messages[messages.length - 1]
        if (last.role === 'assistant' && last.tool_calls && last.tool_calls.length > 0) {
          messages.pop()
          log.warn('Removed partial assistant+tool_calls message after stream error')
        }
      }
      // Re-throw unrecoverable errors so the ReAct loop exits immediately instead of
      // burning retries. Covers: all gateways exhausted, no configured gateways,
      // and permanent auth failures (401/403). Transient errors (network timeouts,
      // 429 rate limits, 502/503) are swallowed so the outer retry logic handles them.
      if (_isPermanentLlmError(_err)) throw _err
      return null
    }
  }

  // ── Private: tool dispatch ─────────────────────────────────────────────────

  private async handleToolCalls(
    toolCalls: ToolCall[],
    content: string | null,
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
    executionConfig: ExecutionConfig | undefined,
    signal: AbortSignal | undefined,
    iteration: number,
    warnIter: number,
    tracer: TraceLogger | undefined,
    reasoningContent: string | null | undefined,
    toolDefs: ReturnType<typeof getToolDefinitions>,
    env: 'sandbox' | 'browser-only',
    plan: ExecutionPlan | undefined,
    preIterationContent: string,
    callbacks: ReactLoopCallbacks,
    maxIterations: number,
  ): Promise<'continue' | 'aborted' | 'max_iterations' | 'complete'> {
    // Surface LLM pre-tool narration as a thinking step
    if (content?.trim()) {
      const thinkStep: AgentStep = { kind: 'thinking', content: content.trim() }
      useAppStore.getState().addStep(taskId, messageId, thinkStep)
      if (preIterationContent !== undefined) {
        useAppStore.getState().setMessageContent(taskId, messageId, preIterationContent)
      }
    }

    // Assistant message includes ALL tool calls so every tool_call_id has a
    // matching tool result before the next assistant turn (OpenAI-format requirement).
    const assistantMsg: LlmMessage = {
      role: 'assistant',
      content: content || null,
      tool_calls: toolCalls,
    }
    if (reasoningContent) {
      const currentModel = useAppStore.getState().model
      if (isReasoningModel(currentModel)) {
        assistantMsg.reasoning_content = reasoningContent
      }
    }
    messages.push(assistantMsg)

    startTurnTracking(taskId)

    const availableTools = toolDefs.map((t: { function: { name: string } }) => t.function.name)

    // ── Phase 1: pre-execution checks (sequential) ──────────────────────────
    // Validate each tool call. Blocked / loop-detected / unavailable calls get
    // an immediate synthetic error result pushed now. The rest go into readyTools.

    const readyTools: Array<{ callId: string; fnName: string; args: Record<string, unknown> }> = []

    for (const tc of toolCalls) {
      if (signal?.aborted) return 'aborted'

      const callId = tc.id
      const fnName = tc.function.name
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch { /* malformed JSON */ }

      callbacks.onToolCall(fnName, args, callId)

      if (!availableTools.includes(fnName)) {
        const output = `Tool "${fnName}" is not available in the current environment. ${
          env === 'browser-only'
            ? 'You are in browser-only mode without shell access. Use write_file/edit_file for file operations, python_execute for WASM computation, and http_fetch for networking.'
            : 'Check tool availability.'
        }`
        this.recordToolResult(callId, output, true, callbacks)
        messages.push({ role: 'tool', content: `Error: ${output}`, tool_call_id: callId, tool_name: fnName })
        continue
      }

      // Identical-call loop detection
      if (this.errorTracker.recordCall(fnName, args)) {
        const loopMsg = `[LOOP DETECTED] You have called "${fnName}" with the same arguments ${ErrorTracker.IDENTICAL_CALL_CAP + 1}+ times. The result will not change. You MUST try a different approach, use a different tool, or re-read the task plan and pivot strategy.`
        this.recordToolResult(callId, loopMsg, true, callbacks)
        messages.push({ role: 'tool', content: `Error: ${loopMsg}`, tool_call_id: callId, tool_name: fnName })
        this.pushOrReplaceSystemMessage(
          messages,
          '[LOOP DETECTED]',
          `[LOOP DETECTED] "${fnName}" has been called with identical arguments repeatedly. Do NOT call it again with the same args. Change strategy.`,
        )
        continue
      }

      // Hard block: tool exceeded strike cap
      if (this.errorTracker.isBlocked(fnName)) {
        const prevErrors = this.errorTracker.attempts(fnName)
        const blockMsg =
          `[BLOCKED] "${fnName}" has been disabled after ${this.errorTracker.getStrikes(fnName)} consecutive failures.\n` +
          `Previous errors: ${prevErrors.slice(-3).join(' | ')}\n\n` +
          `You MUST use a different approach:\n` +
          (fnName === 'patch_file'
            ? `- Use edit_file with line numbers instead (read the file first with read_file to get line numbers)\n- Or use write_file to rewrite the file completely`
            : `- Use a different tool to accomplish the same goal\n- If this step is non-critical, skip it`) +
          `\n\nDo NOT call ${fnName} again.`
        this.recordToolResult(callId, blockMsg, true, callbacks)
        messages.push({ role: 'tool', content: `Error: ${blockMsg}`, tool_call_id: callId, tool_name: fnName })
        this.pushOrReplaceSystemMessage(
          messages,
          `[TOOL BLOCKED: ${fnName}]`,
          `[TOOL BLOCKED: ${fnName}] This tool has been permanently disabled for this task after repeated failures. ` +
          (fnName === 'patch_file'
            ? `Use edit_file (line-number based) or write_file instead.`
            : `Use a different approach.`) +
          ` Do NOT attempt to call ${fnName} again.`,
        )
        continue
      }

      // Research checkpoint (update shared counter before parallel dispatch)
      if (fnName === 'search_web' || fnName === 'http_fetch' || fnName === 'read_file') {
        this.searchBrowseCount++
        if (this.searchBrowseCount > 0 && this.searchBrowseCount % 3 === 0) {
          this.pushOrReplaceSystemMessage(
            messages,
            '[Research checkpoint',
            `[Research checkpoint — ${this.searchBrowseCount} operations]: Consider saving key findings to findings.md or project_memory if you've made significant progress.`,
          )
        }
      }

      readyTools.push({ callId, fnName, args })
    }

    // ── Phase 2: parallel tool execution ────────────────────────────────────
    // All non-skipped tools run concurrently. Each trace span opens before
    // dispatch and closes when its individual promise resolves.

    const execResults = await Promise.all(
      readyTools.map(async ({ callId, fnName, args }) => {
        const traceSpan = tracer?.startToolCall(fnName, args)
        let output: string
        let isError: boolean
        try {
          const result = await executeTool(
            fnName,
            args,
            {
              taskId,
              executionConfig: executionConfig ? {
                ...executionConfig,
                onSandboxStatus: (status: 'starting' | 'ready' | 'error', message?: string) => {
                  useAppStore.getState().setSandboxStatus(status, message)
                },
              } : undefined,
              onSearchStatus: (evt: Parameters<SearchStatusCallback>[0]) =>
                callbacks.onSearchStatus(callId, evt),
            },
          )
          const rawOutput = result.output
          isError = result.isError
          output = typeof rawOutput === 'string'
            ? this.truncateOutput(rawOutput, fnName)
            : JSON.stringify(rawOutput)
        } catch (toolErr) {
          isError = true
          output = `Tool execution threw: ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`
          log.warn(`executeTool threw for ${fnName}`, toolErr instanceof Error ? toolErr : new Error(String(toolErr)))
        }
        traceSpan?.end(output, isError)
        return { callId, fnName, output, isError }
      })
    )

    if (signal?.aborted) return 'aborted'

    // ── Phase 3: post-execution processing (sequential, original order) ──────
    // Push tool result messages and system nudges in original tool-call order
    // so the LLM sees a deterministic, well-structured conversation history.

    const execResultMap = new Map(execResults.map(r => [r.callId, r]))
    let shouldComplete = false

    for (const { callId, fnName } of readyTools) {
      const { output: rawOutput, isError } = execResultMap.get(callId)!

      let output = rawOutput
      if (isError) {
        const currentPhase = useAppStore.getState().currentPhase ?? 0
        const ctx = [
          `[Tool Error — iteration ${iteration + 1}/${maxIterations}]`,
          plan ? `[Phase: ${plan.phases[currentPhase]?.title ?? 'unknown'}]` : null,
          `[Tool: ${fnName}]`,
        ].filter(Boolean).join(' ')
        output = `${ctx}\n${rawOutput}`
      }

      this.recordToolResult(callId, output, isError, callbacks)

      // 3-strike error escalation
      if (isError) {
        const strikes = this.errorTracker.record(fnName, output)
        if (strikes >= 3) {
          const attempts = this.errorTracker.attempts(fnName)
          callbacks.onStrikeEscalation(fnName, attempts)
          const altHint = fnName === 'patch_file'
            ? `Use edit_file with line numbers (read the file first with read_file, then edit_file with {start_line, end_line, new_content}). Or use write_file to rewrite the entire file.`
            : `Try a completely different tool or approach to achieve the same goal.`
          this.pushOrReplaceSystemMessage(
            messages,
            `[TOOL BLOCKED: ${fnName}]`,
            `[TOOL BLOCKED: ${fnName}] This tool has failed ${strikes} times and is now DISABLED.\n` +
            `Errors:\n${attempts.slice(-3).map((a, i) => `${i + 1}. ${a.slice(0, 250)}`).join('\n')}\n\n` +
            `${altHint}\n\n` +
            `Do NOT call ${fnName} again. If this step is non-critical, skip it and continue with the next step.`,
          )
        }
      }

      // bash non-zero exit nudge
      if (!isError && (fnName === 'bash_execute' || fnName === 'bash')) {
        const hasNonZeroExit =
          /exit code [1-9]\d*|exited with \d+|FAILED|ERROR:|error:/i.test(output) ||
          output.includes('npm ERR!') ||
          output.includes('error TS') ||
          output.includes('SyntaxError:') ||
          output.includes('ModuleNotFoundError:')
        if (hasNonZeroExit) {
          this.pushOrReplaceSystemMessage(
            messages,
            '[Build/Test Failure]',
            `[Build/Test Failure] The last ${fnName} command returned errors (see above). You MUST fix these errors before continuing. Do NOT proceed to the next phase until the build/tests pass. Read the error output carefully and apply the correct fix.`,
          )
        }
      }

      messages.push({
        role: 'tool',
        content: isError ? `Error: ${output}` : output,
        tool_call_id: callId,
        tool_name: fnName,
      })

      // Phase-gate verification after update_plan
      if (!isError && fnName === 'update_plan' && plan) {
        this.updateTaskPlanProgress(taskId)

        const gateIssues = await runPhaseGate(plan, taskId)
        if (gateIssues.length > 0) {
          const issueLines = gateIssues
            .map(i => `- ${i.message}${i.correction ? ` → ${i.correction}` : ''}`)
            .join('\n')
          this.pushOrReplaceSystemMessage(
            messages,
            '[Phase Gate]',
            `[Phase Gate] Quick verification found issues in the files written so far:\n${issueLines}\n\nAddress these before continuing to the next phase.`,
          )
        }

        // Plan-file reconciliation
        const ws = workspaceManager.getWorkspaceSync(taskId)
        const planFile = ws?.get('task_plan.md') ?? ''
        const fileChecked = (planFile.match(/\[x\]/gi) ?? []).length
        const planChecked = this.completedCheckboxes
        const divergence = Math.abs(fileChecked - planChecked)
        if (divergence > 2) {
          this.completedCheckboxes = fileChecked
          this.pushOrReplaceSystemMessage(
            messages,
            '[Plan Reconciliation]',
            `[Plan Reconciliation] task_plan.md shows ${fileChecked} completed items but the tracker expected ${planChecked}. Tracker has been synced to the file. Re-read task_plan.md to confirm your current position before continuing.`,
          )
        }
      }

      if (fnName === 'complete') shouldComplete = true

      // Auto-advance plan phase/step proportionally
      if (fnName !== 'update_plan' && plan) {
        const phases = plan.phases
        const totalSteps = phases.reduce((s, p) => s + p.steps.length, 0)
        if (totalSteps > 0) {
          const progressRatio = Math.min(iteration / Math.max(warnIter, 1), 1)
          let remaining = Math.floor(progressRatio * totalSteps)
          let phaseIdx = 0
          let stepIdx = 0
          for (let pi = 0; pi < phases.length; pi++) {
            if (remaining < phases[pi].steps.length) {
              phaseIdx = pi
              stepIdx = remaining
              break
            }
            remaining -= phases[pi].steps.length
            phaseIdx = phases.length - 1
            stepIdx = phases[phases.length - 1].steps.length - 1
          }
          const s = useAppStore.getState()
          s.setCurrentPhase(phaseIdx)
          s.setCurrentStep(stepIdx)
        }
      }
    }

    if (shouldComplete) return 'complete'
    return 'continue'
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  /**
   * Emit a tool result via callback and update the execution output buffer.
   * The buffer is used by ExecutionAgent.runVerification() after the loop ends.
   */
  private recordToolResult(
    callId: string,
    output: string,
    isError: boolean,
    callbacks: ReactLoopCallbacks,
  ): void {
    callbacks.onToolResult(callId, output, isError)

    if (isError) {
      const snippet = `[ERROR] ${output.slice(0, 500)}\n`
      const combined = this.executionOutputBuffer + snippet
      this.executionOutputBuffer = combined.slice(-8000)
    } else {
      const snippet = output.slice(-200)
      const combined = this.executionOutputBuffer + snippet + '\n'
      this.executionOutputBuffer = combined.slice(-8000)
    }
  }

  private pushOrReplaceSystemMessage(
    messages: LlmMessage[],
    prefix: string,
    content: string,
  ): void {
    const idx = messages.findIndex(
      m => m.role === 'system' && typeof m.content === 'string' && m.content.startsWith(prefix),
    )
    const msg: LlmMessage = { role: 'system', content }
    if (idx >= 0) {
      messages[idx] = msg
    } else {
      messages.push(msg)
    }
  }

  private truncateOutput(output: string, toolName: string): string {
    const lines = output.split('\n')
    let maxLines = 150

    if (toolName.startsWith('read_file')) maxLines = 300
    if (toolName.startsWith('list_files')) maxLines = 100
    if (toolName.startsWith('search_files')) maxLines = 200

    if (lines.length <= maxLines) return output

    const headCount = Math.ceil(maxLines * 0.7)
    const tailCount = Math.floor(maxLines * 0.3)
    const head = lines.slice(0, headCount).join('\n')
    const tail = lines.slice(lines.length - tailCount).join('\n')
    const omitted = lines.length - (headCount + tailCount)

    return `${head}\n\n[... ${omitted} lines omitted for brevity ...]\n\n${tail}`
  }

  /**
   * Mark the next unchecked item in task_plan.md as complete.
   */
  private updateTaskPlanProgress(taskId: string): void {
    try {
      const ws = workspaceManager.getWorkspaceSync(taskId)
      if (!ws) return

      const planContent = ws.get('task_plan.md')
      if (!planContent) return

      const lines = planContent.split('\n')
      let updated = false
      let checkCount = 0

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (line.includes('[ ]') || line.includes('[?]') || line.includes('☐')) {
          if (checkCount === this.completedCheckboxes) {
            if (line.includes('[ ]')) {
              lines[i] = line.replace('[ ]', '[x]')
            } else if (line.includes('[?]')) {
              lines[i] = line.replace('[?]', '[x]')
            } else if (line.includes('☐')) {
              lines[i] = line.replace('☐', '☑')
            }
            updated = true
            this.completedCheckboxes++
            break
          }
          checkCount++
        }
      }

      if (updated) {
        ws.set('task_plan.md', lines.join('\n'))
      }
    } catch (e) {
      log.debug('Failed to update task_plan.md', { error: String(e) })
    }
  }
}
