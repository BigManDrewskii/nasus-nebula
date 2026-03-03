/**
 * Execution Agent — ReAct-based agent that executes tasks using tools.
 *
 * This is the main execution agent, refactored from the original loop.ts
 * into the BaseAgent pattern. It implements a Plan → Act → Observe cycle
 * with tool execution, error tracking, and context compression.
 *
 * GATEWAY INTEGRATION:
 * LLM calls now go through the GatewayService for automatic failover.
 * The legacy (apiBase, apiKey, model, provider) params are still accepted
 * for backward compatibility but are optional — the gateway resolves them.
 */

import { BaseAgent } from '../core/BaseAgent'
import { AgentState, StateManager } from '../core/AgentState'
import type { AgentContext, AgentResult, ExecutionPlan } from '../core/Agent'
import type { LlmMessage } from '../core/Agent'
import { streamCompletion, chatOnce, cheapestModel } from '../llm'
import { executeTool, startTurnTracking, flushTurnFiles, getWorkspace, type SearchConfig, type SearchStatusCallback } from '../tools'
import type { ExecutionConfig } from '../sandboxRuntime'
import { useAppStore } from '../../store'
import type { AgentStep, Task } from '../../types'
import { detectStack, seedStackTemplate } from '../stackTemplates'
import { SYSTEM_PROMPT } from '../systemPrompt'
import { getToolDefinitions } from '../tools/index'
import type { ToolCall } from '../llm'
import { verifyExecution, type VerificationContext } from './VerificationAgent'

// Gateway imports
import { selectModel, translateModelId } from '../gateway'
import type { GatewayType } from '../gateway'

const MAX_ITERATIONS = 50
const MAX_CORRECTION_ATTEMPTS = 3

// Context windows (tokens) per model family
const CONTEXT_WINDOWS: Array<[RegExp, number]> = [
  [/claude-3[.-]5|claude-3[.-]7|claude-sonnet-4|claude-opus-4/, 200_000],
  [/claude-3-haiku/, 200_000],
  [/gpt-4\.1/, 1_000_000],
  [/gpt-4o/, 128_000],
  [/o1|o3|o4/, 200_000],
  [/gemini-2\.5/, 1_048_576],
  [/gemini-2\.0/, 1_048_576],
  [/gemini-1\.5/, 1_048_576],
  [/deepseek-r1/, 128_000],
  [/deepseek-v3|deepseek-chat/, 128_000],
  [/deepseek/, 64_000],
  [/llama-3\.[23]-\d+b/, 128_000],
  [/llama-3\.3/, 128_000],
  [/mistral-large|mistral-medium/, 128_000],
  [/mixtral/, 32_000],
  [/qwen-2\.5|qwq/, 131_072],
  [/command-r/, 128_000],
]

/**
 * Error tracker for 3-strike escalation pattern.
 */
class ErrorTracker {
  private strikes: Map<string, string[]> = new Map()

  record(tool: string, error: string): number {
    const existing = this.strikes.get(tool) ?? []
    existing.push(error)
    this.strikes.set(tool, existing)
    return existing.length
  }

  getStrikes(tool: string): string[] {
    return this.strikes.get(tool) ?? []
  }

  clear(): void {
    this.strikes.clear()
  }
}

/**
 * Execution configuration for the agent loop.
 *
 * Gateway integration: apiKey, model, apiBase, provider are now OPTIONAL.
 * When omitted, the gateway service resolves them automatically with failover.
 * When provided, they act as overrides (bypass gateway).
 */
export interface ExecutionConfigParams {
  taskId: string
  messageId: string
  userMessages: LlmMessage[]
  signal: AbortSignal

  // ── Gateway-managed (optional overrides) ──────────────────────────────
  apiKey?: string
  model?: string
  apiBase?: string
  provider?: string

  // ── Existing params ───────────────────────────────────────────────────
  searchConfig?: SearchConfig
  executionConfig?: ExecutionConfig
  maxIterations?: number
  plan?: ExecutionPlan
  enableVerification?: boolean
  correctionHints?: string
  correctionAttempt?: number
}

/**
 * Resolve the LLM connection — either from explicit overrides or the gateway.
 */
function resolveConnection(params: ExecutionConfigParams): {
  apiBase: string
  apiKey: string
  model: string
  provider: string
  extraHeaders: Record<string, string>
} {
  // If all four legacy params are provided, use them directly (bypass gateway)
  if (params.apiKey && params.apiBase && params.model && params.provider) {
    return {
      apiBase: params.apiBase,
      apiKey: params.apiKey,
      model: params.model,
      provider: params.provider,
      extraHeaders: {},
    }
  }

  // Otherwise, resolve from the gateway service
  const store = useAppStore.getState()
  const conn = store.resolveConnection()

  return {
    apiBase: params.apiBase || conn.apiBase,
    apiKey: params.apiKey || conn.apiKey,
    model: params.model || conn.model,
    provider: params.provider || conn.provider,
    extraHeaders: conn.extraHeaders,
  }
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

  protected stateManager: StateManager = new StateManager()

  private errorTracker = new ErrorTracker()
  private searchBrowseCount = 0

  /**
   * Execute the agent with the given context.
   * Supports self-correction loop when verification is enabled.
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    const params = context as ExecutionConfigParams

    // If correction hints are present, we're in a self-correction loop
    if (params.correctionHints) {
      return this.executeWithSelfCorrection(params)
    }

    // Run execution normally
    const result = await this.executeOnce(context)

    // Run verification if enabled and execution completed
    if (params.enableVerification && result.state === AgentState.FINISHED) {
      return this.executeWithVerification(params, result)
    }

    return result
  }

  /**
   * Execute the agent once (main execution loop).
   */
  private async executeOnce(context: AgentContext): Promise<AgentResult> {
    return this.stateManager.withState(AgentState.RUNNING, async () => {
      const params = context as ExecutionConfigParams
      const { taskId, messageId, userMessages, signal } = params
      const maxIter = params.maxIterations ?? MAX_ITERATIONS

      // ── Resolve LLM connection via gateway ──────────────────────────────
      const conn = resolveConnection(params)

      // Validate API key (skip for Ollama which doesn't need one)
      if (!conn.apiKey && conn.provider !== 'ollama') {
        this.emitError(
          taskId,
          messageId,
          'No API key configured. Open Settings (⌘,) and configure your LLM gateway.',
        )
        return { state: AgentState.ERROR, done: true, error: 'No API key configured' }
      }

      this.emitAgentStarted(taskId, messageId)

      // Auto-title on first message
      const isFirstMessage = userMessages.length === 1
      if (isFirstMessage) {
        const firstContent = typeof userMessages[0].content === 'string' ? userMessages[0].content : ''
        if (firstContent) {
          this.autoTitle(conn, firstContent, taskId).catch(() => {})
        }
      }

      // Build message history
      const messages: LlmMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...userMessages,
      ]

      // Inject environment summary
      const envSummary = this.buildEnvSummary(params.executionConfig)
      messages.splice(1, 0, { role: 'system', content: envSummary })

      // Inject stack template if detected
      const firstUserContent = typeof userMessages[0]?.content === 'string' ? userMessages[0].content : ''
      if (firstUserContent && userMessages.length === 1) {
        const detectedStack = detectStack(firstUserContent)
        if (detectedStack) {
          seedStackTemplate(taskId, detectedStack.id)
          messages.splice(2, 0, {
            role: 'system',
            content: `[Stack Template Ready] ${detectedStack.contextInjection}`,
          })
        }
      }

      // Main execution loop
      for (let iteration = 0; iteration < maxIter; iteration++) {
        if (signal.aborted) {
          this.emitDone(taskId, messageId)
          return { state: AgentState.FINISHED, done: true }
        }

        this.emitIterationTick(taskId, iteration + 1)

        // Warning near max
        const warnIter = Math.max(1, maxIter - 10)
        if (iteration === warnIter) {
          messages.push({
            role: 'system',
            content: `[Warning] You are at iteration ${iteration + 1}/${maxIter}. Prioritize completing remaining phases and delivering results to the user now.`,
          })
        }

        // Attention refresh
        if (iteration > 0 && iteration % 5 === 0 && iteration !== warnIter) {
          messages.push({
            role: 'system',
            content: `[Attention Refresh — iteration ${iteration + 1}] Re-read /workspace/task_plan.md now and confirm your current phase before continuing.`,
          })
        }

        // Context compression
        const compressAt = this.compressThreshold(conn.model)
        if (messages.length > compressAt) {
          this.compressContext(messages, taskId, messageId)
        }

        // ── LLM call (with gateway failover) ────────────────────────────
        const llmResult = await this.callLLM(messages, conn, taskId, messageId, signal)
        if (!llmResult) {
          if (!signal.aborted) {
            return { state: AgentState.ERROR, done: true, error: 'LLM call failed' }
          }
          return { state: AgentState.FINISHED, done: true }
        }

        const { finishReason, responseContent, responseToolCalls } = llmResult

        if (signal.aborted) {
          this.emitDone(taskId, messageId)
          return { state: AgentState.FINISHED, done: true }
        }

        // No tool calls = done
        const noTools = responseToolCalls.length === 0
        if (finishReason === 'stop' || noTools) {
          if (responseContent) {
            useAppStore.getState().appendRawHistory(taskId, [
              { role: 'assistant', content: responseContent },
            ])
          }
          this.emitDone(taskId, messageId)
          return { state: AgentState.FINISHED, done: true }
        }

        // Process tool calls
        const toolResult = await this.processToolCalls(
          responseToolCalls,
          responseContent,
          messages,
          taskId,
          messageId,
          params.searchConfig,
          params.executionConfig,
          signal,
          iteration,
          warnIter,
          maxIter,
        )

        if (toolResult === 'aborted') {
          this.emitDone(taskId, messageId)
          return { state: AgentState.FINISHED, done: true }
        }

        if (toolResult === 'max_iterations') {
          messages.push({
            role: 'system',
            content: '[Final Turn] You have reached the iteration limit. Summarise progress and deliver what you have to the user NOW.',
          })
        }
      }

      // Max iterations reached
      this.emitDone(taskId, messageId)
      return { state: AgentState.FINISHED, done: true }
    })
  }

  /**
   * Execute with verification and optional self-correction.
   */
  private async executeWithVerification(
    params: ExecutionConfigParams,
    _executionResult: AgentResult,
  ): Promise<AgentResult> {
    const attempt = params.correctionAttempt ?? 0

    // Run verification
    const verificationResult = await this.runVerification(params)

    if (verificationResult.passed) {
      this.emitVerificationPassed(params.taskId, params.messageId)
      return { state: AgentState.FINISHED, done: true }
    }

    // Verification failed — attempt correction if within limit
    if (attempt >= MAX_CORRECTION_ATTEMPTS) {
      this.emitVerificationFailed(params.taskId, params.messageId, 'Maximum correction attempts reached')
      return { state: AgentState.FINISHED, done: true }
    }

    // Build correction hints
    const correctionHints = this.buildCorrectionHints(verificationResult, attempt)

    // Retry with correction hints
    const retryParams: ExecutionConfigParams = {
      ...params,
      correctionHints,
      correctionAttempt: attempt + 1,
    }

    return this.executeOnce(retryParams)
  }

  /**
   * Execute with self-correction (when already in correction loop).
   */
  private async executeWithSelfCorrection(params: ExecutionConfigParams): Promise<AgentResult> {
    const attempt = params.correctionAttempt ?? 0

    if (attempt >= MAX_CORRECTION_ATTEMPTS) {
      this.emitVerificationFailed(params.taskId, params.messageId, 'Maximum correction attempts reached')
      return {
        state: AgentState.ERROR,
        done: true,
        error: `Failed after ${MAX_CORRECTION_ATTEMPTS} correction attempts`,
      }
    }

    // Execute with correction hints
    const result = await this.executeOnce(params)

    // If still failing and verification enabled, try verification again
    if (params.enableVerification && result.state === AgentState.FINISHED) {
      return this.executeWithVerification(params, result)
    }

    return result
  }

  /**
   * Run verification on execution results.
   */
  private async runVerification(params: ExecutionConfigParams): Promise<ReturnType<typeof verifyExecution>> {
    const { plan, taskId } = params

    // Resolve connection for verification (same gateway)
    const conn = resolveConnection(params)

    // Get workspace to collect created files
    const workspace = await getWorkspace(taskId)
    const createdFiles: Array<{ path: string; content: string }> = []

    for (const [path, content] of workspace.entries()) {
      if (!path.startsWith('.')) {
        createdFiles.push({ path, content })
      }
    }

    const verificationContext: VerificationContext = {
      task: { id: taskId } as Task,
      userInput: '',
      messages: params.userMessages,
      tools: [],
      apiKey: conn.apiKey,
      model: conn.model,
      apiBase: conn.apiBase,
      provider: conn.provider,
      plan: plan || { id: '', title: '', description: '', estimatedSteps: 0, phases: [], dependencies: [], createdAt: new Date() },
      executionOutput: '',
      createdFiles,
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

  // ── LLM Call (Gateway-Aware) ────────────────────────────────────────────

  /**
   * Make an LLM call with automatic gateway failover.
   *
   * The gateway service will:
   * 1. Try the primary gateway
   * 2. On failure, retry with exponential backoff
   * 3. If retries exhausted, failover to next gateway
   * 4. Emit status events for the UI at each step
   */
  private async callLLM(
    messages: LlmMessage[],
    conn: ReturnType<typeof resolveConnection>,
    taskId: string,
    messageId: string,
    signal: AbortSignal,
  ): Promise<{ finishReason: string; responseContent: string | null; responseToolCalls: ToolCall[] } | null> {
    let finishReason = ''
    let responseContent: string | null = null
    let responseToolCalls: ToolCall[] = []

    try {
      // Check if gateway service is available for failover
      const store = useAppStore.getState()
      const gatewayService = store.gatewayService

      if (gatewayService) {
        // ── Gateway mode: call with automatic failover ──────────────
        const { result } = await gatewayService.callWithFailover(
          async (apiBase, apiKey, extraHeaders) => {
            // Resolve model ID for this specific gateway
            const gwType = (store.gateways.find((g) => g.apiBase === apiBase)?.type ?? 'openrouter') as GatewayType
            const selection = selectModel(store.routingMode, gwType, conn.model)
            const effectiveModel = selection?.modelId ?? conn.model

            return streamCompletion(
              apiBase,
              apiKey,
              gwType,
              effectiveModel,
              messages,
              getToolDefinitions(),
              {
                onDelta: (delta) => this.emitChunk(taskId, messageId, delta),
                onToolCalls: (calls) => { responseToolCalls = calls },
                onUsage: (prompt, completion, total) => this.emitTokenUsage(taskId, prompt, completion, total),
                onError: (err) => this.emitError(taskId, messageId, err),
                signal,
                extraHeaders,
              },
            )
          },
        )

        finishReason = result.finishReason
        responseContent = result.content
        responseToolCalls = result.toolCalls
      } else {
        // ── Legacy mode: direct call (no failover) ──────────────────
        const result = await streamCompletion(
          conn.apiBase,
          conn.apiKey,
          conn.provider,
          conn.model,
          messages,
          getToolDefinitions(),
          {
            onDelta: (delta) => this.emitChunk(taskId, messageId, delta),
            onToolCalls: (calls) => { responseToolCalls = calls },
            onUsage: (prompt, completion, total) => this.emitTokenUsage(taskId, prompt, completion, total),
            onError: (err) => this.emitError(taskId, messageId, err),
            signal,
          },
        )

        finishReason = result.finishReason
        responseContent = result.content
        responseToolCalls = result.toolCalls
      }
    } catch (err) {
      if (!signal.aborted) {
        this.emitError(taskId, messageId, err instanceof Error ? err.message : String(err))
      }
      return null
    }

    return { finishReason, responseContent, responseToolCalls }
  }

  // ── Tool Call Processing ───────────────────────────────────────────────────

  private async processToolCalls(
    responseToolCalls: ToolCall[],
    responseContent: string | null,
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
    searchConfig?: SearchConfig,
    executionConfig?: ExecutionConfig,
    signal?: AbortSignal,
    iteration = 0,
    warnIter = 40,
    _maxIter = 50,
  ): Promise<'continue' | 'aborted' | 'max_iterations'> {
    // Enforce one-tool-call-per-turn
    const singleToolCall = responseToolCalls.slice(0, 1)

    messages.push({
      role: 'assistant',
      content: responseContent || null,
      tool_calls: singleToolCall,
    })

    startTurnTracking(taskId)

    for (const tc of singleToolCall) {
      if (signal?.aborted) return 'aborted'

      const callId = tc.id
      const fnName = tc.function.name
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch { /* malformed JSON — use empty */ }

      this.emitToolCall(taskId, messageId, fnName, args, callId)

      // Research checkpoint
      if (fnName === 'search_web' || fnName === 'http_fetch' || fnName === 'read_file') {
        this.searchBrowseCount++
        if (this.searchBrowseCount > 0 && this.searchBrowseCount % 3 === 0) {
          messages.push({
            role: 'system',
            content: `[Research checkpoint — ${this.searchBrowseCount} operations]: If this is a complex task, consider saving key findings to findings.md before continuing.`,
          })
        }
      }

      const { output: rawOutput, isError } = await executeTool(
        taskId, fnName, args, searchConfig,
        fnName === 'search_web'
          ? (evt: Parameters<SearchStatusCallback>[0]) => this.emitSearchStatus(taskId, messageId, callId, evt)
          : undefined,
        executionConfig
          ? {
              ...executionConfig,
              onSandboxStatus: (status: string, message: string) => {
                useAppStore.getState().setSandboxStatus(status, message)
              },
            }
          : undefined,
      )

      // Truncate tool output
      const output = typeof rawOutput === 'string'
        ? rawOutput.length > 12_000
          ? rawOutput.slice(0, 6_000) + '\n\n[…truncated…]\n\n' + rawOutput.slice(-4_000)
          : rawOutput
        : JSON.stringify(rawOutput)

      this.emitToolResult(taskId, messageId, callId, output, isError)

      // Error tracking — 3-strike escalation
      if (isError) {
        const strikes = this.errorTracker.record(fnName, output)
        if (strikes >= 3) {
          const attempts = this.errorTracker.getStrikes(fnName)
          this.emitStrikeEscalation(taskId, messageId, fnName, attempts)
          messages.push({
            role: 'system',
            content: `[3-Strike Escalation] Tool "${fnName}" has failed 3 times with these errors:\n${attempts.map((a, i) => `${i + 1}. ${a.slice(0, 200)}`).join('\n')}\n\nDo NOT retry the same approach. Either:\n1. Try a completely different tool/approach\n2. If this subtask is non-critical, skip it and continue\n3. If critical, report the blocker to the user`,
          })
        }
      }

      // Add tool result to messages
      if (isError) {
        messages.push({
          role: 'tool',
          content: `Error: ${output}`,
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

    // Sync rawHistory
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

    // Emit output cards
    const turnFiles = flushTurnFiles(taskId)
    const deliverableFiles = turnFiles.filter((f) => {
      const name = f.filename
      return name !== 'task_plan.md' && name !== 'findings.md' && name !== 'progress.md'
    })
    if (deliverableFiles.length > 0) {
      const step: AgentStep = { kind: 'output_cards', files: deliverableFiles }
      useAppStore.getState().addStep(taskId, messageId, step)
    }

    // Continuation nudge
    if (iteration > 0 && iteration < warnIter - 1) {
      const ws = await getWorkspace(taskId)
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

    return 'continue'
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────

  private buildEnvSummary(executionConfig?: ExecutionConfig): string {
    const hasCloudSandbox = executionConfig?.executionMode === 'e2b'
    return hasCloudSandbox
      ? `[Environment] Cloud sandbox active (${executionConfig!.executionMode}). Full shell available via bash_execute: npm, node, npx, pip, apt, git, curl, wget all work. Pre-built web templates with all dependencies installed are available at /templates/nextjs-shadcn, /templates/react-vite, /templates/vanilla-html. For web projects: copy a template with bash_execute, then use serve_preview to start the dev server. Do NOT scaffold projects from scratch with npm init or npx create-next-app.`
      : `[Environment] Browser-only mode. No cloud sandbox configured. Available tools: write_file, read_file, patch_file, list_files, http_fetch, search_web, python_execute, bash (cat/ls/echo/mkdir only). npm, node, npx, pip, curl, wget, apt, git WILL FAIL — do not attempt them. Write files directly with write_file instead.`
  }

  private compressThreshold(model: string): number {
    for (const [re, ctx] of CONTEXT_WINDOWS) {
      if (re.test(model)) {
        return Math.max(20, Math.floor((ctx * 0.6) / 500))
      }
    }
    return 40
  }

  private compressContext(messages: LlmMessage[], taskId: string, messageId: string): number {
    const toolResultIndices = messages
      .map((m, i) => (m.role === 'tool' ? i : -1))
      .filter((i) => i >= 0)

    if (toolResultIndices.length <= 6) return 0

    const middleResults = new Set(toolResultIndices.slice(2, toolResultIndices.length - 4))
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

    const step: AgentStep = { kind: 'context_compressed', removedCount: removed }
    useAppStore.getState().addStep(taskId, messageId, step)

    return removed
  }

  /**
   * Auto-title — uses the cheapest available model via the gateway.
   */
  private async autoTitle(
    conn: ReturnType<typeof resolveConnection>,
    userMessage: string,
    taskId: string,
  ): Promise<void> {
    // Try to find the cheapest model for titling
    const { openRouterModels } = useAppStore.getState()
    const titleModel = openRouterModels.length > 0
      ? cheapestModel(openRouterModels)
      : 'anthropic/claude-3-haiku'

    const prompt = `Summarise the following task in 4-6 words as a short title. Reply with ONLY the title, no punctuation:\n\n${userMessage}`
    const title = await chatOnce(conn.apiBase, conn.apiKey, conn.provider, titleModel, prompt, 20)
    if (title) {
      const clean = title.replace(/^["']|["']$/g, '').trim()
      if (clean) useAppStore.getState().updateTaskTitle(taskId, clean)
    }
  }

  private flushRemainingFiles(taskId: string, messageId: string): void {
    const remainingFiles = flushTurnFiles(taskId).filter((f) => {
      const name = f.filename
      return name !== 'task_plan.md' && name !== 'findings.md' && name !== 'progress.md'
    })
    if (remainingFiles.length > 0) {
      const step: AgentStep = { kind: 'output_cards', files: remainingFiles }
      useAppStore.getState().addStep(taskId, messageId, step)
    }
  }

  // ── Event Emitters ───────────────────────────────────────────────────────────

  private emitAgentStarted(taskId: string, messageId: string): void {
    window.dispatchEvent(new CustomEvent('nasus:agent-started', { detail: { taskId, messageId } }))
  }

  private emitIterationTick(taskId: string, iteration: number): void {
    window.dispatchEvent(new CustomEvent('nasus:iteration', { detail: { taskId, iteration } }))
  }

  private emitChunk(taskId: string, messageId: string, delta: string): void {
    useAppStore.getState().appendChunk(taskId, messageId, delta)
    window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
  }

  private emitTokenUsage(taskId: string, prompt: number, completion: number, total: number): void {
    window.dispatchEvent(
      new CustomEvent('nasus:tokens', { detail: { taskId, prompt_tokens: prompt, completion_tokens: completion, total_tokens: total } }),
    )
  }

  private emitToolCall(taskId: string, messageId: string, tool: string, input: Record<string, unknown>, callId: string): void {
    const step: AgentStep = { kind: 'tool_call', tool, input, callId }
    useAppStore.getState().addStep(taskId, messageId, step)
  }

  private emitToolResult(taskId: string, messageId: string, callId: string, output: string, isError: boolean): void {
    const step: AgentStep = { kind: 'tool_result', callId, output, isError }
    useAppStore.getState().updateStep(taskId, messageId, step)
  }

  private emitStrikeEscalation(taskId: string, messageId: string, tool: string, attempts: string[]): void {
    const step: AgentStep = { kind: 'strike_escalation', tool, attempts }
    useAppStore.getState().addStep(taskId, messageId, step)
  }

  private emitSearchStatus(taskId: string, messageId: string, callId: string, evt: Parameters<SearchStatusCallback>[0]): void {
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

  private emitDone(taskId: string, messageId: string): void {
    useAppStore.getState().setStreaming(taskId, messageId, false)
    useAppStore.getState().updateTaskStatus(taskId, 'completed')
    window.dispatchEvent(new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }))
    window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
  }

  private emitError(taskId: string, messageId: string, err: string): void {
    useAppStore.getState().setError(taskId, messageId, err)
    useAppStore.getState().updateTaskStatus(taskId, 'failed')
    window.dispatchEvent(new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }))
    window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
  }

  private emitVerificationPassed(taskId: string, messageId: string): void {
    const step: AgentStep = { kind: 'verification', status: 'passed' }
    useAppStore.getState().addStep(taskId, messageId, step)
    window.dispatchEvent(new CustomEvent('nasus:verification-passed', { detail: { taskId, messageId } }))
  }

  private emitVerificationFailed(taskId: string, messageId: string, reason: string): void {
    const step: AgentStep = { kind: 'verification', status: 'failed', error: reason }
    useAppStore.getState().addStep(taskId, messageId, step)
    window.dispatchEvent(new CustomEvent('nasus:verification-failed', { detail: { taskId, messageId, reason } }))
  }
}

/**
 * Convenience function to run the execution agent with the given parameters.
 * This maintains the same API as the original runAgentLoop function.
 *
 * GATEWAY: If apiKey/apiBase/model/provider are omitted from params,
 * the gateway service resolves them automatically.
 */
export async function runExecutionAgent(params: ExecutionConfigParams): Promise<void> {
  const agent = new ExecutionAgent('execution', 'executor')
  await agent.execute(params)
}
