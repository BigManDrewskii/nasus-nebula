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

import { streamCompletion, powerfulModel, isReasoningModel } from '../llm'
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
import { runPhaseGate } from './PhaseGate'
import type { ContextCompressor } from './ContextCompressor'
import type { getToolDefinitions } from '../tools/index'

const log = createLogger('ReactLoop')

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

      // Context compression
      const model = useAppStore.getState().model
      const threshold = compressor.getThreshold(model)
      if (messages.length > threshold) {
        const masked = compressor.compress(messages, callbacks.onContextCompressed)
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

      // LLM call
      const hasOuterRetriesLeft = consecutiveLlmFailures < MAX_CONSECUTIVE_LLM_FAILURES
      const llmResult = await this.callLLM(
        messages, signal, toolDefs, resolvedConnection,
        forcePowerfulModel, hasOuterRetriesLeft, callbacks,
      )

      if (!llmResult) {
        if (signal?.aborted) return done('aborted')

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
          compressor.compress(messages, callbacks.onContextCompressed)
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
        preIterationContent, callbacks,
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
    const apiBase = resolvedConnection.apiBase || store.apiBase
    const apiKey = resolvedConnection.apiKey || store.apiKey
    const provider = resolvedConnection.provider || store.provider

    let model: string
    if (forcePowerfulModel) {
      if (provider === 'openrouter' || provider === 'requesty') {
        model = powerfulModel(store.openRouterModels)
      } else if (provider === 'deepseek') {
        model = 'deepseek-chat'
      } else {
        model = resolvedConnection.model || store.model
      }
    } else {
      model = resolvedConnection.model || store.model
    }

    if (!apiKey || apiKey.length === 0) {
      const providerLabel =
        provider === 'vercel' ? 'Vercel AI Gateway' :
        provider === 'openrouter' ? 'OpenRouter' :
        provider === 'openai' ? 'OpenAI' : provider
      log.error('callLLM failed', new Error(`No API key for ${providerLabel}`))
      return null
    }

    try {
      callbacks.onModelSelected(model, model.split('/').pop() || model, provider)

      const result = await streamCompletion(
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
          onError: suppressErrorEmit ? () => {} : (_err) => {
            // Error handling is done at the loop level
          },
          onReasoning: (reasoning) => callbacks.onReasoning(reasoning),
          signal,
          extraHeaders: resolvedConnection.extraHeaders,
        },
      )

      return result
    } catch (err) {
      // Clean up a partial assistant+tool_calls message if the stream failed before
      // tool execution could complete.
      if (messages.length > 0) {
        const last = messages[messages.length - 1]
        if (last.role === 'assistant' && last.tool_calls && last.tool_calls.length > 0) {
          messages.pop()
          log.warn('Removed partial assistant+tool_calls message after stream error')
        }
      }
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
  ): Promise<'continue' | 'aborted' | 'max_iterations' | 'complete'> {
    // Process one tool call at a time for maximum reliability
    const singleToolCall = toolCalls.slice(0, 1)

    // Surface LLM pre-tool narration as a thinking step
    if (content?.trim()) {
      const thinkStep: AgentStep = { kind: 'thinking', content: content.trim() }
      useAppStore.getState().addStep(taskId, messageId, thinkStep)
      if (preIterationContent !== undefined) {
        useAppStore.getState().setMessageContent(taskId, messageId, preIterationContent)
      }
    }

    const assistantMsg: LlmMessage = {
      role: 'assistant',
      content: content || null,
      tool_calls: singleToolCall,
    }
    if (reasoningContent) {
      const currentModel = useAppStore.getState().model
      if (isReasoningModel(currentModel)) {
        assistantMsg.reasoning_content = reasoningContent
      }
    }
    messages.push(assistantMsg)

    startTurnTracking(taskId)

    for (const tc of singleToolCall) {
      if (signal?.aborted) return 'aborted'

      const callId = tc.id
      const fnName = tc.function.name
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch { /* malformed JSON */ }

      callbacks.onToolCall(fnName, args, callId)

      const availableTools = toolDefs.map((t: { function: { name: string } }) => t.function.name)

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

      // Research checkpoint
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

      // Execute tool
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

      if (fnName === 'complete') return 'complete'

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
