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
import { buildPlanContext } from './context/ContextBuilder'
import {
  healthCheck,
  runTask,
  type SidecarStep,
  type StatusResponse,
} from './sidecarClient'

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
      // ── Sidecar path ────────────────────────────────────────────────────
      store.setStatus(taskId, 'planning')
      await this.runViaSidecar(params)
      return
    }

    // ── Fallback: direct LLM path ────────────────────────────────────────
    if (this.config.skipPlanning) {
      await this.executeDirectly(params)
      return
    }

    store.setStatus(taskId, 'planning')

    let plan: ExecutionPlan
    try {
      plan = await generatePlan({
        taskId,
        messageId: params.messageId,
        userMessages: params.userMessages,
        userMessage: params.userMessage,
        apiKey: params.apiKey,
        model: params.model,
        apiBase: params.apiBase,
        provider: params.provider,
        searchConfig: params.searchConfig,
        signal,
        planningAgent: this.planningAgent,
      })
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
   * Streams step events back into the agent store in real time.
   */
  private async runViaSidecar(params: OrchestratorTaskParams): Promise<void> {
    const { taskId, messageId, signal } = params
    const store = useAppStore.getState()

    const payload: Record<string, unknown> = {
      task_id: taskId,
      message_id: messageId,
      user_message: params.userMessage,
      messages: params.userMessages,
      model: params.model,
      api_base: params.apiBase,
      provider: params.provider,
      max_iterations: params.maxIterations ?? 10,
    }

    try {
      for await (const event of runTask('orchestrator', payload)) {
        if (signal.aborted) break

        switch (event.type) {
          case 'step': {
            const step = event.data as SidecarStep
            // Map sidecar step types onto the existing agent store step format
            store.addAgentStep(taskId, {
              id: `sidecar-step-${step.step}`,
              type: step.type === 'tool_call' ? 'tool' : step.type === 'observation' ? 'result' : 'thought',
              content: step.content,
              tool: step.tool,
              toolInput: step.tool_input as Record<string, unknown> | undefined,
              toolOutput: step.tool_output as string | undefined,
              timestamp: step.timestamp,
            })
            break
          }
          case 'status': {
            const s = (event.data as StatusResponse).status
            if (s === 'running') store.setStatus(taskId, 'executing')
            break
          }
          case 'done': {
            const final = event.data as StatusResponse
            if (final.status === 'completed') {
              store.setStatus(taskId, 'completed')
            } else if (final.status === 'error') {
              store.setStatus(taskId, 'error')
            }
            break
          }
          case 'error': {
            store.setStatus(taskId, 'error')
            break
          }
        }
      }
    } catch (err) {
      if (signal.aborted) return
      // Sidecar died mid-stream — mark error, don't fall back silently
      store.setStatus(taskId, 'error')
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

    const context = buildPlanContext(plan, params.userMessages)

    const executionParams: ExecutionConfigParams = {
      taskId,
      messageId,
      plan,
      context,
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
      searchConfig: params.searchConfig,
      executionConfig: params.executionConfig,
      signal,
      maxIterations: params.maxIterations,
    }

    try {
      await this.executionAgent.execute(executionParams)
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
      title: params.taskTitle ?? 'Direct Execution',
      phases: [
        {
          id: 'phase-1',
          title: 'Execute Task',
          steps: [
            {
              id: 'step-1',
              title: params.userMessage.slice(0, 80),
              description: params.userMessage,
              tools: [],
            },
          ],
        },
      ],
    }

    store.setCurrentPlan(directPlan)

    const context = buildPlanContext(directPlan, params.userMessages)

    const executionParams: ExecutionConfigParams = {
      taskId,
      messageId,
      plan: directPlan,
      context,
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
      searchConfig: params.searchConfig,
      executionConfig: params.executionConfig,
      signal,
      maxIterations: params.maxIterations,
    }

    try {
      await this.executionAgent.execute(executionParams)
    } catch (err) {
      if (signal.aborted) return
      store.setStatus(taskId, 'error')
      throw err
    }
  }
}
