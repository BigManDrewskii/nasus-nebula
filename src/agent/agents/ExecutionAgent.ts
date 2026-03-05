/**
 * Execution Agent — ReAct-based agent that executes tasks using tools.
 *
 * This is the main execution agent, refactored from the original loop.ts
 * into the BaseAgent pattern. It implements a Plan → Act → Observe cycle
 * with tool execution, error tracking, and context compression.
 */

import { BaseAgent } from '../core/BaseAgent'
import { AgentState } from '../core/AgentState'
import type { AgentContext, AgentResult, ExecutionPlan } from '../core/Agent'
import type { LlmMessage } from '../llm'
import { streamCompletion, cheapestModel, powerfulModel, chatOnceViaGateway, type LlmResponse } from '../llm'
import { startTurnTracking, flushTurnFiles, getWorkspace, type SearchStatusCallback } from '../tools'
import { executeTool as executeRegistryTool } from '../tools/index'
import type { ExecutionConfig } from '../sandboxRuntime'
import { useAppStore } from '../../store'
import type { AgentStep } from '../../types'
import { detectStack, seedStackTemplate } from '../stackTemplates'
import { SYSTEM_PROMPT } from '../systemPrompt'
import { getToolDefinitions } from '../tools/index'
import type { ToolCall } from '../llm'
import { verifyExecution, type VerificationContext } from './VerificationAgent'
import { DEFAULT_MAX_ITERATIONS } from '../../lib/constants'
import { readProjectMemory, updateProjectMemory } from '../projectMemory'
import { getModelAdapter } from '../promptAdapter'

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
  private strikes: Map<string, { count: number; attempts: string[] }> = new Map()
  private toolTotals: Map<string, number> = new Map()
  private static TOOL_GLOBAL_CAP: Record<string, number> = { bash: 4 }

  record(tool: string, summary: string): number {
    const total = (this.toolTotals.get(tool) ?? 0) + 1
    this.toolTotals.set(tool, total)
    const cap = ErrorTracker.TOOL_GLOBAL_CAP[tool]
    if (cap !== undefined && total >= cap) return 3

    const sig = `${tool}::${summary.slice(0, 60)}`
    const entry = this.strikes.get(sig) ?? { count: 0, attempts: [] }
    entry.count++
    entry.attempts.push(summary)
    this.strikes.set(sig, entry)
    return entry.count
  }

  reset(tool: string) {
    for (const key of this.strikes.keys()) {
      if (key.startsWith(`${tool}::`)) this.strikes.delete(key)
    }
    this.toolTotals.delete(tool)
  }

  attempts(tool: string): string[] {
    const all: string[] = []
    for (const [key, val] of this.strikes.entries()) {
      if (key.startsWith(`${tool}::`)) all.push(...val.attempts)
    }
    return all
  }
}

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

  private errorTracker = new ErrorTracker()
  private searchBrowseCount = 0
  // Track progress for auto-updating task_plan.md
  private completedCheckboxes = 0
  private contextWarningIssued = false
  private forcePowerfulModel = false

  constructor(name: string = 'Execution Agent', type: 'executor' = 'executor') {
    super(name, type)
  }

  /**
   * Execute the agent with the given context.
   * Supports self-correction loop when verification is enabled.
   */
  protected async doExecute(context: AgentContext): Promise<AgentResult> {
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
    const params = context as ExecutionConfigParams
    const { taskId, messageId, userMessages, signal } = params

      // Get connection params from store (gateway resolution)
      // Prefer the gateway's resolved apiKey as the source of truth
      const store = useAppStore.getState()
      const resolvedConnection = store.resolveConnection()
      const apiKey = params.apiKey || resolvedConnection.apiKey || store.apiKey

    const maxIter = params.maxIterations ?? DEFAULT_MAX_ITERATIONS

    // Reset per-task counters at the start of each execution
    this.searchBrowseCount = 0
    this.completedCheckboxes = 0
    this.contextWarningIssued = false
    
    // Set powerful model if plan complexity is high
    if (params.plan?.complexity === 'high') {
      this.forcePowerfulModel = true
    } else {
      this.forcePowerfulModel = false
    }

    // Validate API key
    if (!apiKey) {
      this.emitError(taskId, messageId, 'No API key configured. Open Settings (⌘,) and enter your OpenRouter API key (sk-or-…).')
      return { state: AgentState.ERROR, done: true, error: 'No API key configured' }
    }

    this.emitAgentStarted(taskId, messageId)

      // Auto-title on first message
      const isFirstMessage = userMessages.length === 1
      if (isFirstMessage) {
        const firstContent = typeof userMessages[0].content === 'string' ? userMessages[0].content : ''
        if (firstContent) {
          this.autoTitle(firstContent, taskId).catch(() => {})
        }
      }

    // Build message history
    const messages: LlmMessage[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...userMessages,
    ]

    // Inject project memory
    const projectMemory = await readProjectMemory()
    if (projectMemory && projectMemory.trim()) {
      messages.splice(1, 0, {
        role: 'system',
        content: `[Project Context]\n${projectMemory.slice(0, 2000)}`,
      })
    }

    // Inject model-specific hints
    const modelHints = getModelAdapter(params.model || store.model)
    if (modelHints) {
      messages.splice(1, 0, {
        role: 'system',
        content: modelHints,
      })
    }

    // Inject user preferences
    const { buildPreferencesSummary } = await import('../memory/userPreferences')
    const userPrefs = buildPreferencesSummary()
    if (userPrefs) {
      messages.splice(1, 0, {
        role: 'system',
        content: userPrefs,
      })
    }

    // Inject environment summary
    const envSummary = this.buildEnvSummary(params.executionConfig)
    const envIdx = messages.findIndex(m => m.role === 'user')
    messages.splice(envIdx === -1 ? 1 : envIdx, 0, { role: 'system', content: envSummary })

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

    // Inject correction hints if present
    if (params.correctionHints) {
      messages.push({
        role: 'system',
        content: `[Correction Required]\n${params.correctionHints}\n\nAddress these issues and complete the task.`,
      })
    }

    // Main execution loop
    for (let iteration = 0; iteration < maxIter; iteration++) {
      if (signal?.aborted) {
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
        this.pushOrReplaceSystemMessage(messages, '[Attention Refresh', `[Attention Refresh — iteration ${iteration + 1}] Re-read /workspace/task_plan.md now and confirm your current phase before continuing.`)
      }

      // Get current model for context compression threshold
      const model = useAppStore.getState().model
      const compressAt = this.compressThreshold(model)
      if (messages.length > compressAt) {
        this.compressContext(messages, taskId, messageId)
      }

      // LLM call with automatic gateway failover
      const llmResult = await this.callLLM(messages, taskId, messageId, signal!, params.executionConfig)
      if (!llmResult) {
        if (signal && !signal.aborted) {
          return { state: AgentState.ERROR, done: true, error: 'LLM call failed' }
        }
        return { state: AgentState.FINISHED, done: true }
      }

      const { finishReason, content, toolCalls, usage } = llmResult

      // Token awareness & context management
      // Get the effective model from the store (since LlmResponse doesn't include it)
      const effectiveModel = useAppStore.getState().model
      if (usage) {
        useAppStore.getState().updateTokenUsage(taskId, usage, effectiveModel)

        // Calculate context utilization
        const modelCtx = this.getContextWindow(effectiveModel)
        const utilization = usage.promptTokens / modelCtx

        // Warn agent at 70%
        if (utilization > 0.7 && !this.contextWarningIssued) {
          messages.push({
            role: 'system',
            content: `[Context Warning] You are using ${Math.round(utilization * 100)}% of the context window. Prioritize completing the task. Avoid reading large files unless essential.`,
          })
          this.contextWarningIssued = true
        }

        // Force compression at 85%
        if (utilization > 0.85) {
          this.compressContext(messages, taskId, messageId)
        }
      }

    if (signal?.aborted) {
      this.emitDone(taskId, messageId)
      return { state: AgentState.FINISHED, done: true }
    }

    // No tool calls = done
    if (finishReason === 'stop' || toolCalls.length === 0) {
      if (content) {
        useAppStore.getState().appendRawHistory(taskId, [
          { role: 'assistant', content: content },
        ])
      }
      this.emitDone(taskId, messageId)
      return { state: AgentState.FINISHED, done: true }
    }

    const isComplete = toolCalls.some((tc: ToolCall) => tc.function.name === 'complete')
    if (isComplete) {
      // Find the complete call to get its summary if needed, but the tool execution will handle it
    }

    // Process tool calls
    const toolResult = await this.processToolCalls(
      toolCalls,
      content,
      messages,
      taskId,
      messageId,
      params.executionConfig,
      signal,
      iteration,
      warnIter,
    )

    if (toolResult === 'aborted' || toolResult === 'complete') {
      this.emitDone(taskId, messageId)
      return { state: AgentState.FINISHED, done: true }
    }


      if (toolResult === 'max_iterations') {
        this.flushRemainingFiles(taskId, messageId)
        this.emitError(taskId, messageId, `Maximum iterations (${maxIter}) reached. Check the Output panel for files that were created.`)
        return { state: AgentState.ERROR, done: true, error: 'Max iterations reached' }
      }
    }

    // Should never reach here, but TypeScript needs a return
    return { state: AgentState.ERROR, done: true, error: 'Unexpected execution flow' }
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
  private async runVerification(params: ExecutionConfigParams): Promise<Awaited<ReturnType<typeof verifyExecution>>> {
    const { taskId } = params

    // Resolve connection for verification (same gateway)
    // Preference: use existing resolved params if any, or store
    const store = useAppStore.getState()
    const resolvedConnection = store.resolveConnection()
    const apiKey = params.apiKey || resolvedConnection.apiKey || store.apiKey
    const model = params.model || resolvedConnection.model || store.model
    const apiBase = params.apiBase || resolvedConnection.apiBase || store.apiBase
    const provider = params.provider || resolvedConnection.provider || store.provider

    // Get workspace to collect created files
    const workspace = getWorkspace(taskId)
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
      plan: params.plan || { id: '', title: '', description: '', estimatedSteps: 0, phases: [], dependencies: [], createdAt: new Date() },
      executionOutput: '',
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

  /**
   * Make an LLM call with automatic gateway failover.
   */
  private async callLLM(
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
    signal: AbortSignal,
    executionConfig?: ExecutionConfig,
  ): Promise<LlmResponse | null> {
    const store = useAppStore.getState()
    const resolved = store.resolveConnection()

    // Legacy support: prefer store/resolved values unless overridden
    const apiBase = resolved.apiBase || store.apiBase
    const apiKey = resolved.apiKey || store.apiKey
    const provider = resolved.provider || store.provider
    const model = this.forcePowerfulModel
      ? powerfulModel(store.openRouterModels)
      : (resolved.model || store.model)

    // === DIAGNOSTIC LOGGING ===
    console.log('[callLLM] Provider Configuration:', {
      provider,
      apiBase,
      hasApiKey: Boolean(apiKey && apiKey.length > 0),
      apiKeyPrefix: apiKey ? `${apiKey.slice(0, 8)}...` : 'none',
      model,
      gatewayId: resolved.gatewayId,
      extraHeaders: Object.keys(resolved.extraHeaders || {}),
    })
    // ===========================

    // Early validation for missing API key - provide visible error instead of silent hang
    if (!apiKey || apiKey.length === 0) {
      const providerLabel = provider === 'vercel' ? 'Vercel AI Gateway' :
                           provider === 'openrouter' ? 'OpenRouter' :
                           provider === 'openai' ? 'OpenAI' : provider
      const errorMsg = `No API key configured for ${providerLabel}. Open Settings (⌘,) and enter your ${providerLabel} API key.`
      console.error('[callLLM]', errorMsg)
      this.emitError(taskId, messageId, errorMsg)
      return null
    }

    try {
      this.emitModelSelected(taskId, messageId, model, model.split('/').pop() || model, provider)

      const env = executionConfig?.executionMode === 'docker' ? 'sandbox' : 'browser-only'

      const result = await streamCompletion(
        apiBase,
        apiKey,
        provider,
        model,
        messages,
        getToolDefinitions(env),
        {
          onDelta: (delta) => this.emitChunk(taskId, messageId, delta),
          onToolCalls: () => {}, // Handled by streamCompletion's onFinish or return
          onUsage: (p, c, t) => this.emitTokenUsage(taskId, p, c, t),
          onError: (err) => this.emitError(taskId, messageId, err),
          signal,
          extraHeaders: resolved.extraHeaders,
        },
      )

      return result
    } catch (err) {
      if (!signal.aborted) {
        this.emitError(taskId, messageId, err instanceof Error ? err.message : String(err))
      }
      return null
    }
  }

  /**
   * Process tool calls from the assistant.
   */
  private async processToolCalls(
    toolCalls: ToolCall[],
    content: string | null,
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
    executionConfig?: ExecutionConfig,
    signal?: AbortSignal,
    iteration = 0,
    warnIter = 40,
  ): Promise<'continue' | 'aborted' | 'max_iterations' | 'complete'> {
    // NASUS standard: process one tool call at a time for maximum reliability
    const singleToolCall = toolCalls.slice(0, 1)

    messages.push({
      role: 'assistant',
      content: content || null,
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
      } catch { /* malformed JSON */ }

      this.emitToolCall(taskId, messageId, fnName, args, callId)

      const env = executionConfig?.executionMode === 'docker' ? 'sandbox' : 'browser-only'
      const availableTools = getToolDefinitions(env).map(t => t.function.name)

      if (!availableTools.includes(fnName)) {
        const output = `Tool "${fnName}" is not available in the current environment. ${
          env === 'browser-only'
            ? 'You are in browser-only mode without shell access. Use write_file/edit_file for file operations, python_execute for WASM computation, and http_fetch for networking.'
            : 'Check tool availability.'
        }`
        this.emitToolResult(taskId, messageId, callId, output, true)
        messages.push({
          role: 'tool',
          content: `Error: ${output}`,
          tool_call_id: callId,
        })
        continue
      }

      // Research checkpoint
      if (fnName === 'search_web' || fnName === 'http_fetch' || fnName === 'read_file') {
        this.searchBrowseCount++
        if (this.searchBrowseCount > 0 && this.searchBrowseCount % 3 === 0) {
          this.pushOrReplaceSystemMessage(messages, '[Research checkpoint', `[Research checkpoint — ${this.searchBrowseCount} operations]: Consider saving key findings to findings.md or project_memory if you've made significant progress.`)
        }
      }

      // Execute the tool
      const { output: rawOutput, isError } = await executeRegistryTool(
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
          onSearchStatus: (evt: any) => this.emitSearchStatus(taskId, messageId, callId, evt),
        }
      )

      // Truncate tool output
      const output = typeof rawOutput === 'string'
        ? rawOutput.length > 15_000
          ? rawOutput.slice(0, 7_500) + '\n\n[…truncated…]\n\n' + rawOutput.slice(-5_000)
          : rawOutput
        : JSON.stringify(rawOutput)

      this.emitToolResult(taskId, messageId, callId, output, isError)

      // Error tracking — 3-strike escalation
      if (isError) {
        const strikes = this.errorTracker.record(fnName, output)
        if (strikes >= 3) {
          const attempts = this.errorTracker.attempts(fnName)
          this.emitStrikeEscalation(taskId, messageId, fnName, attempts)
          messages.push({
            role: 'system',
            content: `[3-Strike Escalation] Tool "${fnName}" has failed 3 times with these errors:\n${attempts.map((a, i) => `${i + 1}. ${a.slice(0, 200)}`).join('\n')}\n\nDo NOT retry the same approach. Either:\n1. Try a completely different tool/approach\n2. If this subtask is non-critical, skip it and continue\n3. If critical, report the blocker to the user`,
          })
        }
      }

      // Add tool result to history
      messages.push({
        role: 'tool',
        content: isError ? `Error: ${output}` : output,
        tool_call_id: callId,
      })

      // Auto-update task plan progress on success
      if (!isError && fnName !== 'think' && fnName !== 'update_plan') {
        this.updateTaskPlanProgress(taskId)
      }

      if (fnName === 'complete') return 'complete'
    }

    // Continuation nudge
    if (iteration > 0 && iteration < warnIter - 1) {
      const ws = getWorkspace(taskId)
      if (ws) {
        const plan = ws.get('task_plan.md') || ''
        if (plan.includes('[ ]') || plan.includes('[?]') || plan.includes('☐')) {
          this.pushOrReplaceSystemMessage(messages, '[Continue]', `[Continue] task_plan.md has unchecked phases. Do NOT output a summary yet — immediately call the next tool to continue execution.`)
        }
      }
    }

    return 'continue'
  }

  // ── Helper Methods ─────────────────────────────────────────────────────────────


  private buildEnvSummary(executionConfig?: ExecutionConfig): string {
    const hasSandbox = executionConfig?.executionMode === 'docker'
    
    // Core tools that are ALWAYS available
    const coreTools = [
      'read_file', 'write_file', 'edit_file', 'patch_file', 'list_files', 'search_files', 'undo_file',
      'search_web', 'http_fetch',
      'browser_navigate', 'browser_click', 'browser_type', 'browser_scroll', 'browser_screenshot', 'browser_extract', 'browser_extract_links', 'browser_wait_for', 'browser_eval', 'browser_select', 'browser_get_tabs',
      'think', 'save_memory', 'save_preference', 'complete', 'update_plan'
    ].join(', ')

    if (hasSandbox) {
      return `[Environment] Sandbox active (${executionConfig!.executionMode}). Full shell available.
Tools: All 30 tools available including bash_execute, git, serve_preview.
Templates: /templates/nextjs-shadcn, /templates/react-vite, /templates/vanilla-html.
For web projects: copy a template with bash_execute, then serve_preview to start dev server.`
    }

    return `[Environment] Browser-only mode. No shell access.
Available: ${coreTools}, bash (cat/ls/echo/mkdir ONLY), python_execute (WASM).
NOT available: bash_execute, git, serve_preview, npm/node/pip/curl.
Strategy: Write files directly with write_file/edit_file. Use python_execute for computation. Use browser tools for web interaction. Use http_fetch for networking.`
  }

  /**
   * Push a system message to the history, or replace an existing one with the same prefix.
   * Helps avoid message accumulation during long tasks.
   */
  private pushOrReplaceSystemMessage(messages: LlmMessage[], prefix: string, content: string): void {
    const idx = messages.findIndex(m =>
      m.role === 'system' && typeof m.content === 'string' && m.content.startsWith(prefix)
    )
    const msg: LlmMessage = { role: 'system', content }
    if (idx >= 0) {
      messages[idx] = msg
    } else {
      messages.push(msg)
    }
  }

  private compressThreshold(model: string): number {
    for (const [re, ctx] of CONTEXT_WINDOWS) {
      if (re.test(model)) {
        return Math.max(20, Math.floor((ctx * 0.6) / 500))
      }
    }
    return 40
  }

  private async compressContext(
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
  ): Promise<number> {
    const toolResultIndices = messages
      .map((m, i) => (m.role === 'tool' ? i : -1))
      .filter((i) => i >= 0)

    if (toolResultIndices.length <= 8) return 0

    // Identify messages to compress (keep first 3 and last 5)
    const keepFirst = 3
    const keepLast = 5
    const middleIndices = toolResultIndices.slice(keepFirst, toolResultIndices.length - keepLast)
    const toRemove = new Set<number>()

    // Also mark the assistant messages that go with removed tool results
    for (const idx of middleIndices) {
      toRemove.add(idx)
    }
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i]
      if (m.role === 'assistant' && m.tool_calls?.length) {
        let j = i + 1
        const resultIndices: number[] = []
        while (j < messages.length && messages[j].role === 'tool') {
          resultIndices.push(j)
          j++
        }
        if (resultIndices.length > 0 && resultIndices.every((idx) => toRemove.has(idx))) {
          toRemove.add(i)
        }
      }
    }

    // Build a text summary of the removed messages for the LLM to summarize
    const removedContent: string[] = []
    for (const idx of Array.from(toRemove).sort((a, b) => a - b)) {
      const m = messages[idx]
      if (m.role === 'assistant' && m.tool_calls) {
        for (const tc of m.tool_calls) {
          removedContent.push(`Called: ${tc.function.name}(${tc.function.arguments.slice(0, 100)})`)
        }
      } else if (m.role === 'tool') {
        const content = typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
        removedContent.push(`Result: ${content.slice(0, 200)}`)
      }
    }

    // Generate a compressed summary using a cheap/fast model
    let summary = ''
    try {
      const summaryPrompt = `Summarize these agent actions and their results in 3-5 bullet points. Focus on: what was attempted, what was discovered, what files were created/modified, and any errors encountered.\n\n${removedContent.join('\n')}`

      const store = useAppStore.getState()
      const { openRouterModels } = store
      const cheapModel = openRouterModels.length > 0
        ? cheapestModel(openRouterModels)
        : 'anthropic/claude-3-haiku'

      summary = await chatOnceViaGateway(summaryPrompt, 500, cheapModel) || ''
    } catch (e) {
      console.error('[Compression] Summary generation failed:', e)
      // If summary generation fails, fall back to a basic list
      summary = removedContent.slice(0, 10).join('\n')
    }

    const removedCount = toRemove.size
    const kept = messages.filter((_, i) => !toRemove.has(i))

    // Insert the summary as a system message
    if (kept.length > 1) {
      kept.splice(1, 0, {
        role: 'system',
        content: `[Context compressed — ${removedCount} messages summarized]\n${summary}\n\n[Recovery: Read task_plan.md for current phase, findings.md for research, progress.md for action history.]`,
      })
    }

    messages.length = 0
    messages.push(...kept)

    const step: AgentStep = { kind: 'context_compressed', removedCount }
    useAppStore.getState().addStep(taskId, messageId, step)

    return removedCount
  }

  private getContextWindow(modelId: string): number {
    for (const [re, ctx] of CONTEXT_WINDOWS) {
      if (re.test(modelId)) return ctx
    }
    return 128_000
  }

  /**
   * Auto-update task_plan.md with progress checkboxes.
   * Marks the next unchecked item as complete after successful tool execution.
   */
  private updateTaskPlanProgress(taskId: string): void {
    try {
      const ws = getWorkspace(taskId)
      if (!ws) return

      const planContent = ws.get('task_plan.md')
      if (!planContent) return

      const lines = planContent.split('\n')
      let updated = false
      let checkCount = 0

      // Find and update the next unchecked checkbox
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Match checkbox formats: [ ] or [?] or ☐
        const hasUnchecked = /\[?\s*\]|☐/.test(line)
        if (hasUnchecked && (line.includes('[ ]') || line.includes('[?]') || line.includes('☐'))) {
          if (checkCount === this.completedCheckboxes) {
            // Mark this checkbox as complete
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
      // Silently fail - if we can't update the plan, execution continues
      console.debug('Failed to update task_plan.md:', e)
    }
  }

  /**
   * Reset progress tracking when starting a new task.
   */
  resetProgressTracking(): void {
    this.completedCheckboxes = 0
  }

  private async autoTitle(
    userMessage: string,
    taskId: string,
  ): Promise<void> {
    const store = useAppStore.getState()
    const { openRouterModels } = store

    // Always use the cheapest available model for titling — no :free suffix,
    // since OpenRouter `:free` variants are not guaranteed to exist.
    const titleModel = openRouterModels.length > 0
      ? cheapestModel(openRouterModels)
      : 'anthropic/claude-3-haiku'

    const prompt = `Summarise the following task in 4-6 words as a short title. Reply with ONLY the title, no punctuation:\n\n${userMessage}`
    const title = await chatOnceViaGateway(prompt, 50, titleModel)
    if (title) {
      const clean = title.replace(/^["']|["']$/g, '').trim()
      if (clean) store.updateTaskTitle(taskId, clean)
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

  // ── Event Emitters ───────────────────────────────────────────────────────────────

  private emitAgentStarted(taskId: string, messageId: string): void {
    window.dispatchEvent(new CustomEvent('nasus:agent-started', { detail: { taskId, messageId } }))
  }

  private emitIterationTick(taskId: string, iteration: number): void {
    window.dispatchEvent(new CustomEvent('nasus:iteration', { detail: { taskId, iteration } }))
  }

  private emitChunk(taskId: string, messageId: string, delta: string): void {
    useAppStore.getState().appendChunk(taskId, messageId, delta)
    window.dispatchEvent(new CustomEvent('nasus:stream-chunk', { detail: { taskId, messageId } }))
  }

  private emitTokenUsage(taskId: string, prompt: number, completion: number, total: number): void {
    window.dispatchEvent(
      new CustomEvent('nasus:tokens', { detail: { taskId, prompt_tokens: prompt, completion_tokens: completion, total_tokens: total } }),
    )
  }

  private emitToolCall(taskId: string, messageId: string, tool: string, input: Record<string, unknown>, callId: string): void {
    const step: AgentStep = { kind: 'tool_call', tool, input, callId }
    useAppStore.getState().addStep(taskId, messageId, step)
    window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
  }

  private emitToolResult(taskId: string, messageId: string, callId: string, output: string, isError: boolean): void {
    const step: AgentStep = { kind: 'tool_result', callId, output, isError }
    useAppStore.getState().updateStep(taskId, messageId, step)
    window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
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

  private emitModelSelected(taskId: string, messageId: string, modelId: string, modelName: string, provider: string): void {
    useAppStore.getState().setMessageModel(taskId, messageId, modelId, modelName, provider)
    window.dispatchEvent(new CustomEvent('nasus:model-selected', { detail: { taskId, messageId, modelId, modelName, provider } }))
  }

  private emitDone(taskId: string, messageId: string): void {
    useAppStore.getState().setStreaming(taskId, messageId, false)
    useAppStore.getState().updateTaskStatus(taskId, 'completed')
    window.dispatchEvent(new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }))
    window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
    
    // Update project memory on task completion
    updateProjectMemory(taskId).catch(err => {
      console.error('[Project Memory] Update failed:', err)
    })
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
 * Uses a module-level instance so the errorTracker persists across calls within a session.
 */
const _sharedExecutionAgent = new ExecutionAgent('execution', 'executor')

export async function runExecutionAgent(params: ExecutionConfigParams): Promise<void> {
  await _sharedExecutionAgent.execute(params)
}
