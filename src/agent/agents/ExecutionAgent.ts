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
import { streamCompletion, chatOnce, cheapestModel, powerfulModel, balancedModel, chatOnceViaGateway } from '../llm'
import { startTurnTracking, flushTurnFiles, getWorkspace, type SearchStatusCallback } from '../tools'
import { executeTool as executeToolLegacy } from '../tools'
import { executeTool as executeRegistryTool } from '../tools/index'
import type { ExecutionConfig } from '../sandboxRuntime'
import { useAppStore } from '../../store'
import type { AgentStep, Task } from '../../types'
import { detectStack, seedStackTemplate } from '../stackTemplates'
import { SYSTEM_PROMPT } from '../systemPrompt'
import { getToolDefinitions } from '../tools/index'
import type { ToolCall } from '../llm'
import { verifyExecution, type VerificationContext } from './VerificationAgent'
import { DEFAULT_MAX_ITERATIONS } from '../../lib/constants'
import { readProjectMemory, updateProjectMemory } from '../projectMemory'
import { permissionSystem } from '../core/PermissionSystem'
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
        messages.push({
          role: 'system',
          content: `[Attention Refresh — iteration ${iteration + 1}] Re-read /workspace/task_plan.md now and confirm your current phase before continuing.`,
        })
      }

      // Get current model for context compression threshold
      const model = useAppStore.getState().model
      const compressAt = this.compressThreshold(model)
      if (messages.length > compressAt) {
        this.compressContext(messages, taskId, messageId)
      }

      // LLM call with automatic gateway failover
      const llmResult = await this.callLLM(messages, taskId, messageId, signal!)
      if (!llmResult) {
        if (signal && !signal.aborted) {
          return { state: AgentState.ERROR, done: true, error: 'LLM call failed' }
        }
        return { state: AgentState.FINISHED, done: true }
      }

      const { finishReason, responseContent, responseToolCalls, usage, model: effectiveModel } = llmResult

      // Token awareness & context management
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
    if (finishReason === 'stop' || responseToolCalls.length === 0) {
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
      params.executionConfig,
      signal,
      iteration,
      warnIter,
    )

      if (toolResult === 'aborted') {
        this.emitDone(taskId, messageId)
        return { state: AgentState.FINISHED, done: true }
      }

      if (toolResult === 'max_iterations') {
        this.flushRemainingFiles(taskId, messageId)
        this.emitError(taskId, messageId, `Maximum iterations (${maxIter}) reached. Check the Output panel for files that were created.`)
        return { state: AgentState.ERROR, done: true, error: 'Max iterations reached' }
      }
    }

    return { state: AgentState.FINISHED, done: true }
  }


  /**
   * Execute with verification and self-correction loop.
   */
  private async executeWithVerification(
    params: ExecutionConfigParams,
    initialResult: AgentResult,
  ): Promise<AgentResult> {
    const attempt = params.correctionAttempt ?? 0

    // Max correction attempts reached
    if (attempt >= MAX_CORRECTION_ATTEMPTS) {
      this.emitVerificationFailed(params.taskId, params.messageId, 'Maximum correction attempts reached')
      return initialResult
    }

    // Run verification
    const verificationResult = await this.runVerification(params)

    // Verification passed
    if (verificationResult.passed) {
      this.emitVerificationPassed(params.taskId, params.messageId)
      return initialResult
    }

    // Verification failed - emit correction needed and retry
    this.emitVerificationFailed(params.taskId, params.messageId, verificationResult.issues[0]?.message || 'Verification failed')

    // Build correction hints
    const correctionHints = this.buildCorrectionHints(verificationResult, attempt + 1)

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

    // Get workspace to collect created files
    const workspace = await getWorkspace(taskId)
    const createdFiles: Array<{ path: string; content: string }> = []

    for (const [path, content] of workspace.entries()) {
      if (!path.startsWith('.')) {
        createdFiles.push({ path, content })
      }
    }

    // Get connection params from store (gateway resolution)
    const store = useAppStore.getState()

    const verificationContext: VerificationContext = {
      task: { id: taskId } as Task,
      userInput: '',
      messages: params.userMessages,
      tools: [],
      apiKey: params.apiKey || store.apiKey,
      model: params.model || store.model,
      apiBase: params.apiBase || store.apiBase,
      provider: params.provider || store.provider,
      plan: plan || { id: '', title: '', description: '', estimatedSteps: 0, phases: [], dependencies: [], createdAt: new Date() },
      executionOutput: '', // Will be filled by verification agent
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

  // ── LLM Call ─────────────────────────────────────────────────────────────────

  /**
   * Make an LLM call with automatic gateway failover.
   * Uses the gateway service to try multiple gateways on failure.
   */
  private async callLLM(
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
    signal: AbortSignal,
  ): Promise<{ finishReason: string; responseContent: string | null; responseToolCalls: ToolCall[]; usage: any; model: string } | null> {
    let finishReason = ''
    let responseContent: string | null = null
    let responseToolCalls: ToolCall[] = []
    let usage: any = null
    let model = ''

    const store = useAppStore.getState()
    const gatewayService = store.getGatewayService()
    let isAutoFreeFallback = false

    const performCall = async () => {
      return gatewayService.callWithFailover(
        async (apiBase, apiKey, extraHeaders, queryParams) => {
          // Resolve gateway type from apiBase
          const gateway = store.gateways.find(g => g.apiBase === apiBase)
          const gatewayType = (gateway?.type ?? 'openrouter') as GatewayType

            // Use routingMode from gateway store directly (already 'auto-free' | 'auto-paid' | 'manual')
            let routingMode = store.routingMode
            
            // If forcePowerfulModel is set (e.g. after a tool strike), try to use a paid/powerful model
            if (this.forcePowerfulModel && routingMode === 'auto-free') {
              routingMode = 'auto-paid'
            }

            // Auto-fallback check: if we've already hit a 402 this task, or we're doing a manual fallback retry, force auto-free
            const taskState = store.taskRouterState[taskId]
            if (isAutoFreeFallback || taskState?.reason?.includes('402') || taskState?.reason?.includes('Payment Required')) {
              routingMode = 'auto-free'
            }

              const modelSelection = selectModel(routingMode, gatewayType, store.manualModelId || undefined, store.openRouterModels)
              let effectiveModel = modelSelection?.modelId ?? store.model ?? 'anthropic/claude-3.7-sonnet'
              
              // If still on a weak model and forcePowerfulModel is set, pick a known powerful one
              if (this.forcePowerfulModel && (effectiveModel.includes('haiku') || effectiveModel.includes('mini') || effectiveModel.includes('flash'))) {
                effectiveModel = powerfulModel(store.openRouterModels)
              }

              const effectiveDisplayName = modelSelection?.model?.canonicalName ?? effectiveModel
              const effectiveProvider = gatewayType === 'openrouter' ? 'OpenRouter' : 'Vercel'

            model = effectiveModel
            this.emitModelSelected(taskId, messageId, effectiveModel, effectiveDisplayName, effectiveProvider)

            // Derive budget from routingMode instead of routerConfig (avoid cross-slice access)
          // const budget = routingMode === 'auto-free' ? 'free' : 'paid'
          // const fallbackModels = await getFallbackChain(effectiveModel, budget)

          return streamCompletion(
            apiBase,
            apiKey,
            gatewayType,
            effectiveModel,
            messages,
            getToolDefinitions() as any,
            {
              onDelta: (delta) => this.emitChunk(taskId, messageId, delta),
              onToolCalls: (calls) => { responseToolCalls = calls },
              onUsage: (prompt, completion, total) => {
                usage = { promptTokens: prompt, completionTokens: completion, totalTokens: total }
                this.emitTokenUsage(taskId, prompt, completion, total)
              },
              onError: (err) => this.emitError(taskId, messageId, err),
              signal,
              extraHeaders,
              queryParams,
            },
          )
        },
      )
    }

    try {
      const { result } = await performCall()
      finishReason = result.finishReason
      responseContent = result.content
      responseToolCalls = result.toolCalls
      usage = result.usage || usage
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      
      // If we hit a 402 Payment Required, record it in task state to trigger auto-fallback
      if (msg.includes('402') || msg.includes('Payment Required') || msg.includes('insufficient credits')) {
        const storeState = useAppStore.getState()
        
        // If we weren't already in auto-free mode, try one more time with auto-free
        const taskState = storeState.taskRouterState[taskId]
        const alreadyFree = storeState.routingMode === 'auto-free' || taskState?.isFree
        
        storeState.setTaskRouterState(taskId, { 
          reason: `Insufficient credits. Falling back to free models. (${msg})`,
          isFree: true 
        })
        
        // Also immediately switch the global routing mode to auto-free to help the user
        storeState.setRoutingMode('auto-free')

        if (!alreadyFree && !signal.aborted) {
          isAutoFreeFallback = true
          try {
            const { result } = await performCall()
            finishReason = result.finishReason
            responseContent = result.content
            responseToolCalls = result.toolCalls
            usage = result.usage || usage
            return { finishReason, responseContent, responseToolCalls, usage, model }
          } catch {
            // Fall through to error emission
          }
        }
      }

      if (!signal.aborted) {
        this.emitError(taskId, messageId, msg)
      }
      return null
    }

    return { finishReason, responseContent, responseToolCalls, usage, model }
  }


  // ── Tool Call Processing ───────────────────────────────────────────────────────

  private async processToolCalls(
    responseToolCalls: ToolCall[],
    responseContent: string | null,
    messages: LlmMessage[],
    taskId: string,
    messageId: string,
    executionConfig?: ExecutionConfig,
    signal?: AbortSignal,
    iteration = 0,
    warnIter = 40,
  ): Promise<'continue' | 'aborted' | 'max_iterations'> {
    messages.push({
      role: 'assistant',
      content: responseContent || null,
      tool_calls: responseToolCalls,
    })

    startTurnTracking(taskId)

    // Group tool calls: File operations should be serialized to avoid race conditions
    const FILE_OPS = ['write_file', 'edit_file', 'patch_file', 'delete_file', 'bash_execute'] // bash_execute can also modify files
    const fileToolCalls = responseToolCalls.filter(tc => FILE_OPS.includes(tc.function.name))
    const nonFileToolCalls = responseToolCalls.filter(tc => !FILE_OPS.includes(tc.function.name))

    const executeOne = async (tc: ToolCall) => {
      if (signal?.aborted) return null

      const callId = tc.id
      const fnName = tc.function.name
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(tc.function.arguments || '{}')
      } catch { /* malformed JSON — use empty */ }

      this.emitToolCall(taskId, messageId, fnName, args, callId)

      // Step: Permission Check
      const permission = await permissionSystem.checkPermission(fnName, args, taskId)
      if (!permission.approved) {
        const output = permission.reason || `User rejected execution of tool: ${fnName}`
        this.emitToolResult(taskId, messageId, callId, output, true)
        return { callId, output, effectiveOutput: output, isScreenshot: false, rawOutput: output }
      }

      // Research checkpoint
      if (fnName === 'search_web' || fnName === 'http_fetch' || fnName === 'read_file' || fnName === 'search_files') {
        this.searchBrowseCount++
        if (this.searchBrowseCount > 0 && this.searchBrowseCount % 5 === 0) {
          messages.push({
            role: 'system',
            content: `[Research checkpoint — ${this.searchBrowseCount} operations]: If this is a complex task, consider saving key findings to findings.md before continuing.`,
          })
        }
      }

      // Try registry tool first, fallback to legacy tool executor if not found
      let toolResult: { output: string, isError: boolean }
      try {
        toolResult = await executeRegistryTool(fnName, args, {
          taskId,
          executionConfig,
          onSearchStatus: (evt) => this.emitSearchStatus(taskId, messageId, callId, evt)
        })
      } catch (e) {
        // Fallback to legacy dispatcher if registry fails or doesn't have it
        toolResult = await executeToolLegacy(
          taskId, fnName, args,
          (evt) => this.emitSearchStatus(taskId, messageId, callId, evt),
          executionConfig
        )
      }

      const { output: rawOutput, isError } = toolResult
      let output: string
      const isScreenshot = fnName === 'browser_screenshot' && !isError && rawOutput.startsWith('data:image/')

        if (isError) {
          const strike = this.errorTracker.record(fnName, rawOutput)
          if (strike === 1) {
            output = `[Strike 1/3] Error: ${rawOutput}\nDiagnose and apply a targeted fix.`
          } else if (strike === 2) {
            this.forcePowerfulModel = true
            output = `[Strike 2/3] Same tool failed again: ${rawOutput}\nSwitching to a more powerful model. Try a COMPLETELY DIFFERENT approach or tool.`
          } else if (strike === 3) {
          const attempts = this.errorTracker.attempts(fnName)
          this.emitStrikeEscalation(taskId, messageId, fnName, attempts)
          output = `[Strike 3/3 — ESCALATE] All 3 attempts at \`${fnName}\` failed:\n${attempts.join('\n---\n')}\n\nYou MUST stop retrying this tool.`
        } else {
          output = `[BLOCKED] \`${fnName}\` has failed ${strike} times. Do not call this tool again. Report failure to user.`
        }
      } else {
        this.errorTracker.reset(fnName)
        output = rawOutput
        this.updateTaskPlanProgress(taskId)
      }

        this.emitToolResult(taskId, messageId, callId, output, isError)

        // Quick verification for code files
        if (!isError && (fnName === 'write_file' || fnName === 'edit_file' || fnName === 'patch_file')) {
          const filePath = args.path as string
          const content = args.content as string
          if (filePath && content) {
            const verification = await this.quickVerify(taskId, filePath, content)
            if (!verification.ok) {
              messages.push({
                role: 'system',
                content: `[Quick Check Failed] Issues in ${filePath}:\n${verification.issues.join('\n')}\nFix these before proceeding.`,
              })
            }
          }
        }

        // Output Truncation Logic (P0 Implementation Review Fix)
      const MAX_OUTPUT_CHARS = 10000
      let effectiveOutput = output
      if (typeof output === 'string' && output.length > MAX_OUTPUT_CHARS && !isScreenshot) {
        // Smarter truncation: Head + Tail
        const head = output.slice(0, 5000)
        const tail = output.slice(-2000)
        effectiveOutput = head + 
          ` \n\n[... truncated ${output.length - 7000} characters ...]\n\n ` + 
          tail
        
        // Add hint if truncated mid-JSON
        if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
          effectiveOutput += `\n[Note: JSON output truncated, content may be incomplete.]`
        }
      }

      return { callId, output, effectiveOutput, isScreenshot, rawOutput }
    }

    // 1. Run non-file operations in parallel
    const nonFileResults = await Promise.all(nonFileToolCalls.map(executeOne))
    
    // 2. Run file operations serially
    const fileResults: any[] = []
    for (const tc of fileToolCalls) {
      if (signal?.aborted) break
      const res = await executeOne(tc)
      if (res) fileResults.push(res)
    }

    const allResults = [...nonFileResults.filter(Boolean), ...fileResults]

    // Construct tool messages in history
    for (const res of allResults) {
      const { callId, output, effectiveOutput, isScreenshot, rawOutput } = res as any
      
      if (isScreenshot) {
        const base64 = rawOutput.replace(/^data:image\/[^;]+;base64,/, '')
        const mediaType = rawOutput.startsWith('data:image/png') ? 'image/png' : 'image/jpeg'
        messages.push({
          role: 'tool',
          content: [
            { type: 'text', text: '[Screenshot captured. See image below.]' },
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${base64}`, detail: 'auto' },
            },
          ],
          tool_call_id: callId,
        } as unknown as LlmMessage)
      } else {
        messages.push({
          role: 'tool',
          content: typeof effectiveOutput === 'string' ? effectiveOutput : JSON.stringify(effectiveOutput),
          tool_call_id: callId,
        } as unknown as LlmMessage)
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

  // ── Helper Methods ─────────────────────────────────────────────────────────────

  private buildEnvSummary(executionConfig?: ExecutionConfig): string {
    const hasDockerSandbox = executionConfig?.executionMode === 'docker'
    return hasDockerSandbox
      ? `[Environment] Docker sandbox active. Full shell available via bash_execute: npm, node, npx, pip, apt, git, curl, wget all work. Pre-built web templates with all dependencies installed are available at /templates/nextjs-shadcn, /templates/react-vite, /templates/vanilla-html. For web projects: copy a template with bash_execute, then use serve_preview to start the dev server. Do NOT scaffold projects from scratch with npm init or npx create-next-app.`
      : `[Environment] No sandbox configured. Available tools: write_file, read_file, patch_file, list_files, http_fetch, search_web, python_execute, bash (cat/ls/echo/mkdir only). npm, node, npx, pip, curl, wget, apt, git WILL FAIL — do not attempt them. Write files directly with write_file instead.`
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

  private async quickVerify(
    taskId: string,
    filePath: string,
    content: string,
  ): Promise<{ ok: boolean; issues: string[] }> {
    const issues: string[] = []
    const ext = filePath.split('.').pop()?.toLowerCase()

    // 1. Check for common syntax issues (no external tools needed)
    if (['ts', 'tsx', 'js', 'jsx'].includes(ext ?? '')) {
      // Unmatched brackets/braces
      const opens = (content.match(/[{(\[]/g) || []).length
      const closes = (content.match(/[})\]]/g) || []).length
      if (Math.abs(opens - closes) > 2) {
        issues.push(`Bracket mismatch: ${opens} opening, ${closes} closing`)
      }

      // Incomplete file (ends mid-statement)
      const trimmed = content.trimEnd()
      if (trimmed.endsWith(',') || trimmed.endsWith('{') || trimmed.endsWith('(')) {
        issues.push('File appears truncated (ends with incomplete syntax)')
      }

      // Check for common "oops" patterns
      if (content.includes('TODO: implement') || content.includes('// ...')) {
        issues.push('File contains placeholder/unimplemented sections')
      }
    }

    // 2. Check for JSON validity
    if (ext === 'json') {
      try {
        JSON.parse(content)
      } catch (e) {
        issues.push(`Invalid JSON: ${(e as Error).message}`)
      }
    }

    return { ok: issues.length === 0, issues }
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

    // Use the gateway's resolved connection so we get the correct apiKey, apiBase,
    // and any extra headers (HTTP-Referer / X-Title) that OpenRouter requires.
    const resolved = store.resolveConnection()
    const apiBase = resolved.apiBase || store.apiBase
    const apiKey  = resolved.apiKey  || store.apiKey
    const provider = resolved.provider || store.provider

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
