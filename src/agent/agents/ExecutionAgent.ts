/**
 * Execution Agent — thin orchestrator for the ReAct-based task executor.
 *
 * Core loop logic, tool dispatch, and compression have been extracted to:
 *   src/agent/execution/ReactLoop.ts      — ReAct while-loop + tool dispatch
 *   src/agent/execution/ContextCompressor.ts — message-window compression
 *   src/agent/execution/PhaseGate.ts      — phase-gate verification + tool masking
 *
 * ExecutionAgent is responsible for:
 *  - Setting up initial message context (ContextBuilder, preamble, stack templates)
 *  - Wiring UI event emitters as ReactLoop callbacks
 *  - The verification + self-correction cycle
 *  - All store/window event emission (the UI integration boundary)
 */

import { BaseAgent } from '../core/BaseAgent'
import { AgentState } from '../core/AgentState'
import type { AgentContext, AgentResult, ExecutionPlan } from '../core/Agent'
import type { LlmMessage } from '../llm'
import { SPECIALIST_CONTEXTS } from '../prompts/specialistContexts'
import { cheapestModel, chatOnceViaGateway } from '../llm'
import { flushTurnFiles, type SearchStatusCallback } from '../tools'
import { workspaceManager } from '../workspace/WorkspaceManager'
import type { ExecutionConfig } from '../sandboxRuntime'
import { useAppStore } from '../../store'
import type { AgentStep } from '../../types'
import { detectStack, seedStackTemplate } from '../stackTemplates'
import { getToolDefinitions } from '../tools/index'
import { verifyExecution, type VerificationContext } from './VerificationAgent'
import { DEFAULT_MAX_ITERATIONS } from '../../lib/constants'
import { readProjectMemory, updateProjectMemory } from '../projectMemory'
import { getModelAdapter } from '../promptAdapter'
import { buildContext } from '../context/ContextBuilder'
import { createLogger } from '../../lib/logger'
import { ErrorTracker } from '../core/ErrorTracker'
import { ReactLoop } from '../execution/ReactLoop'
import { ContextCompressor } from '../execution/ContextCompressor'
import { getActiveToolsForPhase } from '../execution/PhaseGate'

const log = createLogger('ExecutionAgent')

const MAX_CORRECTION_ATTEMPTS = 3

/**
 * Execution configuration for the agent loop.
 */
export interface ExecutionConfigParams extends AgentContext {
  taskId: string
  messageId: string
  userMessages: LlmMessage[]
  maxIterations?: number
  /** Plan to follow during execution */
  plan?: ExecutionPlan
  /** Enable verification after execution */
  enableVerification?: boolean
  /** Correction hints from previous verification attempt */
  correctionHints?: string
  /** Current correction attempt (0-indexed) */
  correctionAttempt?: number
}

/** Internal type for executeOnce return value. */
interface ExecuteOnceResult {
  agentResult: AgentResult
  executionOutputBuffer: string
}

/**
 * Execution Agent — Main ReAct loop agent.
 *
 * Executes tasks by:
 * 1. Thinking about the current state
 * 2. Calling tools as needed
 * 3. Observing results
 * 4. Repeating until done
 */
export class ExecutionAgent extends BaseAgent {
  readonly id = 'execution-agent'
  readonly name = 'Execution Agent'
  readonly description = 'Executes tasks using tools in a ReAct loop'

  private readonly compressor = new ContextCompressor()

  /**
   * Preserved across correction runs so errorTracker and output buffer
   * carry through the verification → self-correction cycle.
   */
  private _priorLoopState: { errorTracker: ErrorTracker; executionOutputBuffer: string } | null =
    null

  constructor(name: string = 'Execution Agent', type: 'executor' = 'executor') {
    super(name, type)
  }

  /**
   * Execute the agent with the given context.
   * Supports self-correction loop when verification is enabled.
   */
  protected async doExecute(context: AgentContext): Promise<AgentResult> {
    const params = context as ExecutionConfigParams

    if (params.correctionHints) {
      return this.executeWithSelfCorrection(params)
    }

    const { agentResult, executionOutputBuffer } = await this.executeOnce(context)

    if (params.enableVerification && agentResult.state === AgentState.FINISHED) {
      return this.executeWithVerification(params, executionOutputBuffer)
    }

    return agentResult
  }

  /**
   * Set up context, create a ReactLoop, run it, and translate the result
   * into an AgentResult.  Preserves _priorLoopState for correction runs.
   */
  private async executeOnce(
    context: AgentContext,
    isCorrection = false,
  ): Promise<ExecuteOnceResult> {
    const params = context as ExecutionConfigParams
    const { taskId, messageId, userMessages, signal } = params

    const store = useAppStore.getState()
    const resolvedConnection = store.resolveConnection()
    const apiKey = params.apiKey || resolvedConnection.apiKey || store.apiKey

    const maxIter = params.maxIterations ?? DEFAULT_MAX_ITERATIONS

    if (!isCorrection) {
      this._priorLoopState = null
    }

    if (!apiKey) {
      this.emitError(
        taskId,
        messageId,
        'No API key configured. Open Settings (⌘,) and enter your OpenRouter API key (sk-or-…).',
      )
      return {
        agentResult: { state: AgentState.ERROR, done: true, error: 'No API key configured' },
        executionOutputBuffer: '',
      }
    }

    this.emitAgentStarted(taskId, messageId)

    // Auto-title on first message
    const isFirstMessage = userMessages.length === 1
    if (isFirstMessage) {
      const firstContent =
        typeof userMessages[0].content === 'string' ? userMessages[0].content : ''
      if (firstContent) {
        this.autoTitle(firstContent, taskId).catch(() => {})
      }
    }

    const envSummary = this.buildEnvSummary(params.executionConfig)
    const modelHints = getModelAdapter(params.model || store.model)
    const { buildPreferencesSummary } = await import('../memory/userPreferences')
    const userPrefs = buildPreferencesSummary()

    const preambleParts: string[] = []
    if (userPrefs) preambleParts.push(userPrefs)
    if (modelHints) preambleParts.push(modelHints)

    if (!store.extensionConnected) {
      preambleParts.push(
        '[BROWSER EXTENSION: NOT CONNECTED] The browser extension is disconnected. ' +
        'All browser_* tools will fail immediately. Do not plan or attempt browser automation. ' +
        'Use http_fetch, search_web, or browser_read_page for web content instead.',
      )
    }

    const projectMemory = await readProjectMemory()
    if (projectMemory?.trim()) {
      preambleParts.push(`[Project Context]\n${projectMemory.slice(0, 2000)}`)
    }

    if (params.plan?.specialistDomain) {
      const ctx = SPECIALIST_CONTEXTS[params.plan.specialistDomain]
      if (ctx) preambleParts.push(ctx)
    }

    const firstUserContent =
      typeof userMessages[0]?.content === 'string' ? userMessages[0].content : ''
    let stackInjection: string | undefined
    if (firstUserContent && userMessages.length === 1) {
      const detectedStack = detectStack(firstUserContent)
      if (detectedStack) {
        seedStackTemplate(taskId, detectedStack.id)
        stackInjection = `[Stack Template Ready] ${detectedStack.contextInjection}`
      }
    }

    const env = params.executionConfig?.executionMode === 'docker' ? 'sandbox' : 'browser-only'
    const toolDefs = getToolDefinitions(env)
    const forcePowerfulModel = params.plan?.complexity === 'high'

    // Phase-aware tool masking (research phases only)
    const currentPhase = params.plan?.phases.find(p => p.status === 'in_progress')
    const isResearchPhase = currentPhase
      ? /research|gather|search/i.test(currentPhase.title)
      : false
    const phaseStepTools =
      isResearchPhase && currentPhase ? currentPhase.steps.map(s => s.tools ?? []) : []
    const activeTools =
      isResearchPhase && currentPhase
        ? getActiveToolsForPhase(currentPhase.title, phaseStepTools)
        : []

    const builtContext = await buildContext(
      userMessages,
      toolDefs,
      {
        includeMemory: true,
        maxMemoryItems: 3,
        includePlan: !!params.plan,
        maskInactiveTools: activeTools.length > 0,
        activeTools: activeTools.length > 0 ? activeTools : undefined,
      },
      params.plan,
      envSummary,
    )

    const messages: LlmMessage[] = [...builtContext.messages]

    let insertAt = 1
    for (const part of preambleParts) {
      messages.splice(insertAt++, 0, { role: 'system', content: part })
    }
    if (stackInjection) {
      messages.splice(insertAt++, 0, { role: 'system', content: stackInjection })
    }

    if (params.correctionHints) {
      messages.push({
        role: 'system',
        content: `[Correction Required]\n${params.correctionHints}\n\nAddress these issues and complete the task.`,
      })
    }

    const loop = new ReactLoop({
      taskId,
      messageId,
      maxIterations: maxIter,
      signal: signal!,
      toolDefs,
      executionConfig: params.executionConfig,
      plan: params.plan,
      resolvedConnection,
      forcePowerfulModel,
      env,
      compressor: this.compressor,
      priorRunState: isCorrection ? (this._priorLoopState ?? undefined) : undefined,
      callbacks: {
        onIterationTick: n => this.emitIterationTick(taskId, n),
        onChunk: d => this.emitChunk(taskId, messageId, d),
        onReasoning: d => this.emitReasoning(taskId, messageId, d),
        onTokenUsage: (p, c, t) => this.emitTokenUsage(taskId, p, c, t),
        onToolCall: (tool, input, id) => this.emitToolCall(taskId, messageId, tool, input, id),
        onToolResult: (id, output, isError) =>
          this.emitToolResult(taskId, messageId, id, output, isError),
        onSearchStatus: (id, evt) => this.emitSearchStatus(taskId, messageId, id, evt),
        onStrikeEscalation: (tool, attempts) =>
          this.emitStrikeEscalation(taskId, messageId, tool, attempts),
        onContextCompressed: count => {
          const step: AgentStep = { kind: 'context_compressed', removedCount: count }
          useAppStore.getState().addStep(taskId, messageId, step)
        },
        onModelSelected: (modelId, modelName, provider) =>
          this.emitModelSelected(taskId, messageId, modelId, modelName, provider),
      },
    })

    const result = await loop.run(messages)

    this._priorLoopState = {
      errorTracker: result.errorTracker,
      executionOutputBuffer: result.executionOutputBuffer,
    }

    if (result.status === 'aborted' || signal?.aborted) {
      this.emitDone(taskId, messageId)
      return {
        agentResult: { state: AgentState.FINISHED, done: true },
        executionOutputBuffer: result.executionOutputBuffer,
      }
    }

    if (result.status === 'max_iterations') {
      this.flushRemainingFiles(taskId, messageId)
      this.emitError(
        taskId,
        messageId,
        `Maximum iterations (${maxIter}) reached. Check the Output panel for files that were created.`,
      )
      return {
        agentResult: { state: AgentState.ERROR, done: true, error: 'Max iterations reached' },
        executionOutputBuffer: result.executionOutputBuffer,
      }
    }

    if (result.status === 'error') {
      this.emitError(taskId, messageId, result.errorMessage ?? 'Execution failed')
      return {
        agentResult: {
          state: AgentState.ERROR,
          done: true,
          error: result.errorMessage ?? 'Execution failed',
        },
        executionOutputBuffer: result.executionOutputBuffer,
      }
    }

    // 'complete'
    this.flushRemainingFiles(taskId, messageId)
    this.emitDone(taskId, messageId)
    return {
      agentResult: { state: AgentState.FINISHED, done: true },
      executionOutputBuffer: result.executionOutputBuffer,
    }
  }

  /**
   * Execute with verification and optional self-correction.
   */
  private async executeWithVerification(
    params: ExecutionConfigParams,
    executionOutputBuffer: string,
  ): Promise<AgentResult> {
    const attempt = params.correctionAttempt ?? 0

    const verificationResult = await this.runVerification(params, executionOutputBuffer)

    if (verificationResult.passed) {
      this.emitVerificationPassed(params.taskId, params.messageId)
      return { state: AgentState.FINISHED, done: true }
    }

    if (attempt >= MAX_CORRECTION_ATTEMPTS) {
      this.emitVerificationFailed(
        params.taskId,
        params.messageId,
        'Maximum correction attempts reached',
      )
      return { state: AgentState.FINISHED, done: true }
    }

    const correctionHints = this.buildCorrectionHints(verificationResult, attempt)

    const retryParams: ExecutionConfigParams = {
      ...params,
      correctionHints,
      correctionAttempt: attempt + 1,
    }

    const { agentResult, executionOutputBuffer: newBuffer } = await this.executeOnce(
      retryParams,
      true,
    )

    if (params.enableVerification && agentResult.state === AgentState.FINISHED) {
      return this.executeWithVerification(
        { ...retryParams, correctionAttempt: attempt + 1 },
        newBuffer,
      )
    }

    return agentResult
  }

  /**
   * Execute with self-correction (when already in correction loop).
   */
  private async executeWithSelfCorrection(
    params: ExecutionConfigParams,
  ): Promise<AgentResult> {
    const attempt = params.correctionAttempt ?? 0

    if (attempt >= MAX_CORRECTION_ATTEMPTS) {
      this.emitVerificationFailed(
        params.taskId,
        params.messageId,
        'Maximum correction attempts reached',
      )
      return {
        state: AgentState.ERROR,
        done: true,
        error: `Failed after ${MAX_CORRECTION_ATTEMPTS} correction attempts`,
      }
    }

    const { correctionHints: _, ...paramsWithoutHints } = params
    const { agentResult, executionOutputBuffer } = await this.executeOnce(
      paramsWithoutHints as ExecutionConfigParams,
      true,
    )

    if (params.enableVerification && agentResult.state === AgentState.FINISHED) {
      return this.executeWithVerification(params, executionOutputBuffer)
    }

    return agentResult
  }

  /**
   * Run verification on execution results.
   */
  private async runVerification(
    params: ExecutionConfigParams,
    executionOutputBuffer: string,
  ): Promise<Awaited<ReturnType<typeof verifyExecution>>> {
    const { taskId } = params

    const store = useAppStore.getState()
    const resolvedConnection = store.resolveConnection()
    const apiKey = params.apiKey || resolvedConnection.apiKey || store.apiKey
    const model = params.model || resolvedConnection.model || store.model
    const apiBase = params.apiBase || resolvedConnection.apiBase || store.apiBase
    const provider = params.provider || resolvedConnection.provider || store.provider

    const workspace = workspaceManager.getWorkspaceSync(taskId)
    const createdFiles: Array<{ path: string; content: string }> = []

    if (workspace) {
      for (const [path, content] of workspace.entries()) {
        if (!path.startsWith('.')) {
          createdFiles.push({ path, content })
        }
      }
    }

    const verificationContext: VerificationContext = {
      ...params,
      plan: params.plan || {
        id: '',
        title: '',
        description: '',
        estimatedSteps: 0,
        phases: [],
        dependencies: [],
        createdAt: new Date(),
      },
      executionOutput: executionOutputBuffer,
      createdFiles,
      apiKey,
      model,
      apiBase,
      provider,
    }

    return verifyExecution(verificationContext)
  }

  /**
   * Build correction hints from verification result.
   */
  private buildCorrectionHints(
    verificationResult: Awaited<ReturnType<typeof verifyExecution>>,
    attempt: number,
  ): string {
    const lines = [
      `[Correction Attempt ${attempt}/${MAX_CORRECTION_ATTEMPTS}]`,
      '',
      'The following issues were found in your previous execution:',
      '',
    ]

    for (const issue of verificationResult.issues) {
      const icon = issue.type === 'error' ? '✗' : issue.type === 'warning' ? '⚠' : 'ℹ'
      lines.push(`${icon} ${issue.message}`)
      if (issue.correction) {
        lines.push(`  → ${issue.correction}`)
      }
    }

    if (verificationResult.corrections.length > 0) {
      lines.push('', 'Suggested corrections:')
      for (let i = 0; i < verificationResult.corrections.length; i++) {
        lines.push(`${i + 1}. ${verificationResult.corrections[i]}`)
      }
    }

    lines.push('', 'Please address these issues and complete the task.')

    return lines.join('\n')
  }

  private buildEnvSummary(executionConfig?: ExecutionConfig): string {
    const hasSandbox = executionConfig?.executionMode === 'docker'

    const coreTools = [
      'read_file', 'write_file', 'edit_file', 'patch_file', 'list_files', 'search_files',
      'undo_file', 'search_web', 'http_fetch', 'browser_navigate', 'browser_click',
      'browser_type', 'browser_scroll', 'browser_screenshot', 'browser_extract',
      'browser_extract_links', 'browser_wait_for', 'browser_aria_snapshot',
      'think', 'save_memory', 'save_preference', 'complete', 'update_plan',
    ].join(', ')

    if (hasSandbox) {
      return `[Environment] Sandbox active (${executionConfig!.executionMode}). Full shell available.
Tools: All 30 tools available including bash_execute, git, serve_preview.
Templates: /templates/nextjs-shadcn, /templates/react-vite, /templates/vanilla-html.
For web projects: copy a template with bash_execute, then serve_preview to start dev server.`
    }

    return `[Environment] Browser-only mode. No shell access.
Available: ${coreTools}, bash (cat/ls/echo/mkdir ONLY), python_execute (WASM), serve_preview (fires preview tab — use after writing HTML/CSS/JS files).
NOT available: bash_execute, git, npm/node/pip/curl.
Strategy: Write files directly with write_file/edit_file. Call serve_preview when HTML output is ready. Use python_execute for computation. Use browser tools for web interaction. Use http_fetch for networking.`
  }

  private async autoTitle(userMessage: string, taskId: string): Promise<void> {
    const store = useAppStore.getState()
    const { openRouterModels } = store

    let titleModel: string
    const conn = store.resolveConnection()
    if (conn.provider === 'deepseek') {
      titleModel = 'deepseek-chat'
    } else {
      titleModel =
        openRouterModels.length > 0 ? cheapestModel(openRouterModels) : 'anthropic/claude-3-haiku'
    }

    const prompt = `Summarise the following task in 4-6 words as a short title. Reply with ONLY the title, no punctuation:\n\n${userMessage}`
    const title = await chatOnceViaGateway(prompt, 50, titleModel)
    if (title) {
      const clean = title.replace(/^["']|["']$/g, '').trim()
      if (clean) store.updateTaskTitle(taskId, clean)
    }
  }

  private flushRemainingFiles(taskId: string, messageId: string): void {
    const remainingFiles = flushTurnFiles(taskId).filter(f => {
      const name = f.filename
      return name !== 'task_plan.md' && name !== 'findings.md' && name !== 'progress.md'
    })
    if (remainingFiles.length > 0) {
      const step: AgentStep = { kind: 'output_cards', files: remainingFiles }
      useAppStore.getState().addStep(taskId, messageId, step)
    }
  }

  /**
   * No-op — each ReactLoop run starts with fresh tracking state.
   * Kept for API compatibility.
   */
  resetProgressTracking(): void {}

  // ── Event Emitters ─────────────────────────────────────────────────────────

  private emitAgentStarted(taskId: string, messageId: string): void {
    window.dispatchEvent(
      new CustomEvent('nasus:agent-started', { detail: { taskId, messageId } }),
    )
  }

  private emitIterationTick(taskId: string, iteration: number): void {
    window.dispatchEvent(
      new CustomEvent('nasus:iteration', { detail: { taskId, iteration } }),
    )
  }

  private emitChunk(taskId: string, messageId: string, delta: string): void {
    useAppStore.getState().appendChunk(taskId, messageId, delta)
    window.dispatchEvent(
      new CustomEvent('nasus:stream-chunk', { detail: { taskId, messageId, delta } }),
    )
  }

  private emitTokenUsage(
    taskId: string,
    prompt: number,
    completion: number,
    total: number,
  ): void {
    window.dispatchEvent(
      new CustomEvent('nasus:tokens', {
        detail: { taskId, prompt_tokens: prompt, completion_tokens: completion, total_tokens: total },
      }),
    )
  }

  private emitReasoning(taskId: string, messageId: string, delta: string): void {
    window.dispatchEvent(
      new CustomEvent('nasus:reasoning-chunk', { detail: { taskId, messageId, delta } }),
    )
  }

  private emitToolCall(
    taskId: string,
    messageId: string,
    tool: string,
    input: Record<string, unknown>,
    callId: string,
  ): void {
    const step: AgentStep = { kind: 'tool_call', tool, input, callId }
    useAppStore.getState().addStep(taskId, messageId, step)
    window.dispatchEvent(
      new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }),
    )
  }

  private emitToolResult(
    taskId: string,
    messageId: string,
    callId: string,
    output: string,
    isError: boolean,
  ): void {
    const step: AgentStep = { kind: 'tool_result', callId, output, isError }
    useAppStore.getState().updateStep(taskId, messageId, step)
    window.dispatchEvent(
      new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }),
    )
  }

  private emitStrikeEscalation(
    taskId: string,
    messageId: string,
    tool: string,
    attempts: string[],
  ): void {
    const step: AgentStep = { kind: 'strike_escalation', tool, attempts }
    useAppStore.getState().addStep(taskId, messageId, step)
  }

  private emitSearchStatus(
    taskId: string,
    messageId: string,
    callId: string,
    evt: Parameters<SearchStatusCallback>[0],
  ): void {
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
    useAppStore.getState().updateSearchStatus(taskId, messageId, step)
  }

  private emitModelSelected(
    taskId: string,
    messageId: string,
    modelId: string,
    modelName: string,
    provider: string,
  ): void {
    useAppStore.getState().setMessageModel(taskId, messageId, modelId, modelName, provider)
    window.dispatchEvent(
      new CustomEvent('nasus:model-selected', {
        detail: { taskId, messageId, modelId, modelName, provider },
      }),
    )
  }

  private emitDone(taskId: string, messageId: string): void {
    useAppStore.getState().setStreaming(taskId, messageId, false)
    useAppStore.getState().updateTaskStatus(taskId, 'completed')
    window.dispatchEvent(
      new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }),
    )
    window.dispatchEvent(
      new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }),
    )

    updateProjectMemory(taskId).catch(err => {
      log.error(
        'Project memory update failed',
        err instanceof Error ? err : new Error(String(err)),
      )
    })
  }

  private emitError(taskId: string, messageId: string, err: string): void {
    useAppStore.getState().setError(taskId, messageId, err)
    useAppStore.getState().updateTaskStatus(taskId, 'failed')
    window.dispatchEvent(
      new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }),
    )
    window.dispatchEvent(
      new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }),
    )
  }

  private emitVerificationPassed(taskId: string, messageId: string): void {
    const step: AgentStep = { kind: 'verification', status: 'passed' }
    useAppStore.getState().addStep(taskId, messageId, step)
    window.dispatchEvent(
      new CustomEvent('nasus:verification-passed', { detail: { taskId, messageId } }),
    )
  }

  private emitVerificationFailed(
    taskId: string,
    messageId: string,
    reason: string,
  ): void {
    const step: AgentStep = { kind: 'verification', status: 'failed', error: reason }
    useAppStore.getState().addStep(taskId, messageId, step)
    window.dispatchEvent(
      new CustomEvent('nasus:verification-failed', { detail: { taskId, messageId, reason } }),
    )
  }
}

/**
 * Convenience function to run the execution agent with the given parameters.
 * Uses a module-level instance so gateway state persists across calls.
 */
const _sharedExecutionAgent = new ExecutionAgent('execution', 'executor')

export async function runExecutionAgent(params: ExecutionConfigParams): Promise<void> {
  await _sharedExecutionAgent.execute(params)
}
