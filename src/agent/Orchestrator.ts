/**
 * Agent Orchestrator — Coordinates multiple agents in a workflow.
 *
 * The Orchestrator:
 * 1. Checks if the Python sidecar is available
 * 2. If sidecar is ready: routes tasks through the sidecar (FastAPI :4751)
 * 3. If sidecar is unavailable: falls back to direct LLM execution
 * 4. Presents plans for user approval
 * 5. Tracks overall progress and handles errors
 */

import type { ExecutionPlan } from './core/Agent'
import type { LlmMessage } from './llm'
import type { SearchConfig } from './tools'
import type { ExecutionConfig as SandboxConfig } from './sandboxRuntime'
import { PlanningAgent, generatePlan } from './agents/PlanningAgent'
import { ExecutionAgent, type ExecutionConfigParams } from './agents/ExecutionAgent'
import { useAppStore } from '../store'
import {
  healthCheck,
  healthStatus,
  configureSidecar,
  runTask,
  type SidecarStep,
  type StatusResponse,
} from './sidecarClient'
import { extractAndWriteCodeFiles } from './codeExtractor'

/**
 * Orchestrator configuration.
 */
export interface OrchestratorConfig {
  /** Skip planning and go straight to execution */
  skipPlanning?: boolean
  /** Auto-approve simple plans */
  autoApproveSimple?: boolean
  /** Maximum time to wait for user approval (ms) */
  approvalTimeout?: number
  /** Enable verification after execution */
  enableVerification?: boolean
  /** Force sidecar routing even if health check is slow */
  forceSidecar?: boolean
}

/**
 * Task parameters for the orchestrator.
 */
export interface OrchestratorTaskParams {
  taskId: string
  taskTitle?: string
  messageId: string
  userMessages: LlmMessage[]
  userMessage: string
  apiKey: string
  model: string
  apiBase: string
  provider: string
  searchConfig?: SearchConfig
  executionConfig?: SandboxConfig
  signal: AbortSignal
  maxIterations?: number
}

/**
 * Plan approval result.
 */
export type PlanApprovalResult =
  | { approved: true; plan: ExecutionPlan }
  | { approved: false; plan: ExecutionPlan; reason: 'rejected' | 'timeout' | 'cancelled' }

/**
 * Agent Orchestrator — Coordinates the agent workflow.
 */
export class AgentOrchestrator {
  readonly id = 'agent-orchestrator'
  readonly name = 'Agent Orchestrator'
  readonly description = 'Coordinates planning and execution agents'

  private planningAgent: PlanningAgent = new PlanningAgent('planning', 'planner')
  private executionAgent: ExecutionAgent = new ExecutionAgent('execution', 'executor')
  private config: OrchestratorConfig = {}
  private _isSidecarReady = false

  /** True if the last health check confirmed the sidecar is up */
  get isSidecarReady(): boolean {
    return this._isSidecarReady
  }

  setConfig(config: OrchestratorConfig): void {
    this.config = { ...config }
    if (typeof config.autoApproveSimple === 'boolean') {
      this.planningAgent.setConfig({ autoApproveSimple: config.autoApproveSimple })
    }
  }

  /**
   * Probe the sidecar health endpoint and cache the result.
   * Call this once on app startup (App.tsx) and again whenever
   * the sidecar is restarted.
   */
  async checkSidecar(): Promise<boolean> {
    this._isSidecarReady = await healthCheck()
    return this._isSidecarReady
  }

  /**
   * Process a task through the full agent pipeline.
   * Routes through the Python sidecar if available, otherwise
   * falls back to direct LLM execution.
   */
  async processTask(params: OrchestratorTaskParams): Promise<void> {
    const { taskId, signal } = params
    const store = useAppStore.getState()

    // Refresh sidecar health on each task (cheap ping, ~5ms)
    if (!this.config.forceSidecar) {
      await this.checkSidecar()
    }

    if (this._isSidecarReady) {
      // ── Sidecar path ─────────────────────────────────────────────────────────────────────
      store.setStatus(taskId, 'planning')
      await this.runViaSidecar(params)
      return
    }

    // ── Fallback: direct LLM path ────────────────────────────────────────────────────────────
    if (this.config.skipPlanning) {
      await this.executeDirectly(params)
      return
    }

    store.setStatus(taskId, 'planning')

    let plan: ExecutionPlan
    try {
      plan = await generatePlan(
        params.userMessage,
        params.apiKey,
        params.model,
        params.apiBase,
        params.provider,
        { autoApproveSimple: this.config.autoApproveSimple },
      )
    } catch (err) {
      if (signal.aborted) return
      throw err
    }

    if (signal.aborted) return

    const approvalResult = await this.waitForApproval(taskId, plan, signal)

    if (!approvalResult.approved) {
      if (approvalResult.reason === 'cancelled') return
      store.setStatus(taskId, approvalResult.reason === 'rejected' ? 'stopped' : 'error')
      return
    }

    await this.executePlan(params, approvalResult.plan)
  }

  /**
   * Route a task through the Python sidecar (FastAPI :4751).
   * Streams step events back into the agent store and chat UI in real time.
   */
  private async runViaSidecar(params: OrchestratorTaskParams): Promise<void> {
    const { taskId, messageId, signal } = params
    const store = useAppStore.getState()

    // Ensure the sidecar has LLM credentials — reconfigure if it lost them (e.g. after a restart)
    const health = await healthStatus()
    if (health && !health.llm_configured && params.apiKey) {
      await configureSidecar({
        api_key: params.apiKey,
        api_base: params.apiBase || 'https://openrouter.ai/api/v1',
        model: params.model || 'openai/gpt-4o-mini',
      })
    }

    // Notify UI that the agent has started (drives useAgentStatus → 'processing')
    window.dispatchEvent(new CustomEvent('nasus:agent-started', { detail: { taskId, messageId } }))

    // Normalize messages to a simple {role, content} format the Python LLM client expects
    const normalizedMessages = params.userMessages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string'
        ? m.content
        : Array.isArray(m.content)
          ? m.content.map((p: { text?: string }) => p.text ?? '').join(' ')
          : String(m.content),
    }))

    const payload: Record<string, unknown> = {
      task_id: taskId,
      message_id: messageId,
      user_message: params.userMessage,
      goal: params.userMessage,
      messages: normalizedMessages,
      model: params.model,
      api_base: params.apiBase,
      provider: params.provider,
      max_iterations: params.maxIterations ?? 10,
    }

    const finishOk = () => {
      store.setStreaming(taskId, messageId, false)
      store.updateTaskStatus(taskId, 'completed')
      store.setStatus(taskId, 'completed')
      window.dispatchEvent(new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }))
      window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
    }

    const finishErr = (msg: string) => {
      store.setError(taskId, messageId, msg)
      store.setStatus(taskId, 'error')
      window.dispatchEvent(new CustomEvent('nasus:agent-done', { detail: { taskId, messageId } }))
      window.dispatchEvent(new CustomEvent('nasus:processing-end', { detail: { taskId, messageId } }))
    }

    try {
      for await (const event of runTask('M00', payload)) {
        if (signal.aborted) break

        switch (event.type) {
          case 'step': {
            const step = event.data as SidecarStep

            // Map sidecar step types onto the agent store step format
            store.addAgentStep(taskId, {
              id: `sidecar-step-${step.step}`,
              type: step.type === 'tool_call' ? 'tool' : step.type === 'observation' ? 'result' : 'thought',
              content: step.content,
              tool: step.tool,
              toolInput: step.tool_input as Record<string, unknown> | undefined,
              toolOutput: step.tool_output as string | undefined,
              timestamp: step.timestamp,
            })

            // Emit 'final' step content as the chat message text, then extract
            // any code blocks and write them to the workspace as real files.
            if (step.type === 'final' && step.content) {
              store.appendChunk(taskId, messageId, step.content)
              window.dispatchEvent(new CustomEvent('nasus:stream-chunk', {
                detail: { taskId, messageId, delta: step.content },
              }))

              void extractAndWriteCodeFiles(
                step.content,
                taskId,
                (s) => store.addAgentStep(taskId, s),
              )
            }

            // Emit tool-call so the UI tool indicator shows the active tool
            if (step.type === 'tool_call' && step.tool) {
              window.dispatchEvent(new CustomEvent('nasus:tool-call', {
                detail: { taskId, messageId, tool: step.tool },
              }))
            }
            break
          }
          case 'status': {
            const s = (event.data as StatusResponse).status
            if (s === 'running') store.setStatus(taskId, 'executing')
            break
          }
          case 'done': {
            const final = event.data as StatusResponse & { errors?: string[] }
            if (final.status === 'completed') {
              finishOk()
            } else if (final.status === 'error') {
              finishErr(final.error ?? final.errors?.[0] ?? 'Sidecar execution failed')
            }
            break
          }
          case 'error': {
            finishErr((event as { error?: string }).error ?? 'Sidecar stream error')
            break
          }
        }
      }

      // If the stream ended without a 'done' event (e.g. sidecar closed cleanly),
      // ensure the message is closed so it doesn't spin forever.
      if (!signal.aborted) {
        const msgs = store.getMessages(taskId)
        if (msgs.some(m => m.id === messageId && m.streaming)) {
          finishOk()
        }
      }
    } catch (err) {
      if (signal.aborted) return
      finishErr(err instanceof Error ? err.message : 'Sidecar stream failed')
      throw err
    }
  }

  /**
   * Wait for user approval of the plan.
   */
  private waitForApproval(
    taskId: string,
    plan: ExecutionPlan,
    signal: AbortSignal,
  ): Promise<PlanApprovalResult> {
    const store = useAppStore.getState()

    store.setPendingPlan(plan)
    store.setPlanApprovalStatus('pending')
    store.setStatus(taskId, 'awaiting_approval')

    return new Promise((resolve) => {
      const cleanup = () => {
        window.removeEventListener(`nasus:plan-approve-${taskId}`, onApprove)
        window.removeEventListener(`nasus:plan-reject-${taskId}`, onReject)
        signal.removeEventListener('abort', onAbort)
        if (timeoutId !== undefined) clearTimeout(timeoutId)
      }

      const onApprove = (e: Event) => {
        cleanup()
        const detail = (e as CustomEvent).detail as { plan?: ExecutionPlan } | undefined
        const finalPlan = detail?.plan ?? plan
        resolve({ approved: true, plan: finalPlan })
      }

      const onReject = () => {
        cleanup()
        resolve({ approved: false, plan, reason: 'rejected' })
      }

      const onAbort = () => {
        cleanup()
        resolve({ approved: false, plan, reason: 'cancelled' })
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined
      if (this.config.approvalTimeout) {
        timeoutId = setTimeout(() => {
          cleanup()
          resolve({ approved: false, plan, reason: 'timeout' })
        }, this.config.approvalTimeout)
      }

      window.addEventListener(`nasus:plan-approve-${taskId}`, onApprove)
      window.addEventListener(`nasus:plan-reject-${taskId}`, onReject)
      signal.addEventListener('abort', onAbort)
    })
  }

  /**
   * Execute a plan using the ExecutionAgent (fallback path).
   */
  private async executePlan(
    params: OrchestratorTaskParams,
    plan: ExecutionPlan,
  ): Promise<void> {
    const { taskId, messageId, signal } = params
    const store = useAppStore.getState()

    store.setCurrentPlan(plan)
    store.setStatus(taskId, 'executing')

    const executionParams: ExecutionConfigParams = {
      taskId,
      messageId,
      plan,
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
      searchConfig: params.searchConfig,
      executionConfig: params.executionConfig,
      signal,
      maxIterations: params.maxIterations,
      userMessages: params.userMessages,
      task: { id: taskId, title: params.taskTitle ?? 'Task', status: 'running', createdAt: new Date() },
      userInput: params.userMessage,
      messages: params.userMessages,
      tools: [],
      enableVerification: this.config.enableVerification,
    }

    try {
      await this.executionAgent.execute(executionParams)
      store.setStatus(taskId, 'completed')
    } catch (err) {
      if (signal.aborted) return
      store.setStatus(taskId, 'error')
      throw err
    }
  }

  /**
   * Execute directly without planning (skipPlanning mode, fallback path).
   */
  private async executeDirectly(params: OrchestratorTaskParams): Promise<void> {
    const { taskId, messageId, signal } = params
    const store = useAppStore.getState()

    store.setStatus(taskId, 'executing')

    const directPlan: ExecutionPlan = {
      id: 'direct-plan',
      title: params.taskTitle ?? 'Direct Execution',
      description: params.userMessage.slice(0, 200),
      estimatedSteps: 1,
      phases: [
        {
          id: 'phase-1',
          title: 'Execute Task',
          description: 'Execute the user task directly',
          steps: [
            {
              id: 'step-1',
              description: params.userMessage.slice(0, 200),
              agent: 'executor',
              tools: [],
            },
          ],
          status: 'pending',
        },
      ],
      dependencies: [],
      createdAt: new Date(),
    }

    store.setCurrentPlan(directPlan)

    const executionParams: ExecutionConfigParams = {
      taskId,
      messageId,
      plan: directPlan,
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
      searchConfig: params.searchConfig,
      executionConfig: params.executionConfig,
      signal,
      maxIterations: params.maxIterations,
      userMessages: params.userMessages,
      task: { id: taskId, title: params.taskTitle ?? 'Task', status: 'running', createdAt: new Date() },
      userInput: params.userMessage,
      messages: params.userMessages,
      tools: [],
      enableVerification: this.config.enableVerification,
    }

    try {
      await this.executionAgent.execute(executionParams)
      store.setStatus(taskId, 'completed')
    } catch (err) {
      if (signal.aborted) return
      store.setStatus(taskId, 'error')
      throw err
    }
  }
}

// ─── Singleton & named export ───────────────────────────────────────────────────────────────────────────

/** Shared orchestrator instance (use this from components & CallNasusAgentTool). */
export const orchestrator = new AgentOrchestrator()

/**
 * Named export alias so callers can do:
 *   import { processTaskWithOrchestrator } from '../agent/Orchestrator'
 *
 * This is a thin wrapper that delegates to the singleton instance.
 */
export async function processTaskWithOrchestrator(
  params: OrchestratorTaskParams,
  config?: OrchestratorConfig,
): Promise<void> {
  if (config) orchestrator.setConfig(config)
  return orchestrator.processTask(params)
}
