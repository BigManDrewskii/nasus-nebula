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
    const { taskId, messageId, userMessages, apiKey, model, apiBase, provider, signal } = params
    const maxIter = params.maxIterations ?? MAX_ITERATIONS

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
          this.autoTitle(apiBase, apiKey, provider, model, firstContent, taskId).catch(() => {})
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

      // Context compression
      const compressAt = this.compressThreshold(model)
      if (messages.length > compressAt) {
        this.compressContext(messages, taskId, messageId)
      }

      // LLM call
      const llmResult = await this.callLLM(messages, model, apiBase, apiKey, provider, taskId, messageId, signal!)
      if (!llmResult) {
        if (signal && !signal.aborted) {
          return { state: AgentState.ERROR, done: true, error: 'LLM call failed' }
        }
        return { state: AgentState.FINISHED, done: true }
      }

      const { finishReason, responseContent, responseToolCalls } = llmResult

      if (signal?.aborted) {
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

    const verificationContext: VerificationContext = {
      task: { id: taskId } as Task,
      userInput: '',
      messages: params.userMessages,
      tools: [],
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
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

  private async callLLM(
    messages: LlmMessage[],
    model: string,
    apiBase: string,
    apiKey: string,
    provider: string,
    taskId: string,
    messageId: string,
    signal: AbortSignal,
  ): Promise<{ finishReason: string; responseContent: string | null; responseToolCalls: ToolCall[] } | null> {
    let finishReason = ''
    let responseContent: string | null = null
    let responseToolCalls: ToolCall[] = []

    try {
      const result = await streamCompletion(
        apiBase,
        apiKey,
        provider,
        model,
        messages,
        getToolDefinitions() as any,
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
    } catch (err) {
      if (!signal.aborted) {
        this.emitError(taskId, messageId, err instanceof Error ? err.message : String(err))
      }
      return null
    }

    return { finishReason, responseContent, responseToolCalls }
  }

  // ── Tool Call Processing ───────────────────────────────────────────────────────

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
              onSandboxStatus: (status, message) => {
                useAppStore.getState().setSandboxStatus(status, message)
              },
            }
          : undefined,
      )

      let output: string
      const isScreenshot = fnName === 'browser_screenshot' && !isError && rawOutput.startsWith('data:image/')

      if (isError) {
        const strike = this.errorTracker.record(fnName, rawOutput)
        if (strike === 1) {
          output = `[Strike 1/3] Error: ${rawOutput}\nDiagnose and apply a targeted fix.`
        } else if (strike === 2) {
          output = `[Strike 2/3] Same tool failed again: ${rawOutput}\nTry a COMPLETELY DIFFERENT approach or tool.`
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
      }

      this.emitToolResult(taskId, messageId, callId, output, isError)

      // Add to message history
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
          content: typeof output === 'string' ? output : JSON.stringify(output),
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

  private async autoTitle(
    apiBase: string,
    apiKey: string,
    provider: string,
    _model: string,
    userMessage: string,
    taskId: string,
  ): Promise<void> {
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
 */
export async function runExecutionAgent(params: ExecutionConfigParams): Promise<void> {
  const agent = new ExecutionAgent('execution', 'executor')
  await agent.execute(params)
}
