/**
 * Agent Orchestrator — Coordinates the planning and execution agents.
 *
 * Single execution path: plan → user approval → execute via ReactLoop.
 * The Python sidecar path has been removed; the TypeScript ReactLoop
 * is the sole execution engine.
 */

import type { ExecutionPlan } from './core/Agent'
import type { LlmMessage } from './llm'
import type { SearchConfig } from './tools'
import type { ExecutionConfig as SandboxConfig } from './sandboxRuntime'
import { generatePlan, isSimplePlan } from './agents/PlanningAgent'
import { ExecutionAgent, type ExecutionConfigParams } from './agents/ExecutionAgent'
import { useAppStore } from '../store'

// ─── Public interfaces ────────────────────────────────────────────────────────

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

  private config: OrchestratorConfig = {}

  setConfig(config: OrchestratorConfig): void {
    this.config = { ...config }
  }

  /**
   * Process a task through the full agent pipeline.
   * Generates a plan, waits for approval, then executes via the ReactLoop.
   */
  async processTask(params: OrchestratorTaskParams): Promise<void> {
    const { taskId, signal } = params
    const store = useAppStore.getState()

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

    if (this.config.autoApproveSimple && isSimplePlan(plan)) {
      await this.executePlan(params, plan)
      return
    }

    const approvalResult = await this.waitForApproval(taskId, plan, signal)

    if (!approvalResult.approved) {
      if (approvalResult.reason === 'cancelled') return
      store.setStatus(taskId, approvalResult.reason === 'rejected' ? 'stopped' : 'error')
      return
    }

    await this.executePlan(params, approvalResult.plan)
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
   * Execute a plan using the ExecutionAgent.
   */
  private async executePlan(
    params: OrchestratorTaskParams,
    plan: ExecutionPlan,
  ): Promise<void> {
    const { taskId, messageId, signal } = params
    const store = useAppStore.getState()

    store.setCurrentPlan(plan)
    store.setCurrentPhase(0)
    store.setCurrentStep(0)
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
      await new ExecutionAgent('execution', 'executor').execute(executionParams)
      store.setStatus(taskId, 'completed')
    } catch (err) {
      if (signal.aborted) return
      store.setStatus(taskId, 'error')
      throw err
    }
  }

  /**
   * Execute directly without planning (skipPlanning mode).
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
      await new ExecutionAgent('execution', 'executor').execute(executionParams)
      store.setStatus(taskId, 'completed')
    } catch (err) {
      if (signal.aborted) return
      store.setStatus(taskId, 'error')
      throw err
    }
  }
}

// ─── Singleton & named export ─────────────────────────────────────────────────

/** Shared orchestrator instance. */
export const orchestrator = new AgentOrchestrator()

/**
 * Named export alias so callers can do:
 *   import { processTaskWithOrchestrator } from '../agent/Orchestrator'
 */
export async function processTaskWithOrchestrator(
  params: OrchestratorTaskParams,
  config?: OrchestratorConfig,
): Promise<void> {
  if (config) orchestrator.setConfig(config)
  return orchestrator.processTask(params)
}
