/**
 * Agent Orchestrator — Coordinates multiple agents in a workflow.
 *
 * The Orchestrator:
 * 1. Invokes the Planning Agent to generate a plan
 * 2. Presents the plan for user approval
 * 3. Invokes the Execution Agent to run the approved plan
 * 4. Tracks overall progress and handles errors
 */

import type { ExecutionPlan } from './core/Agent'
import type { LlmMessage } from './llm'
import type { SearchConfig } from './tools'
import type { ExecutionConfig as SandboxConfig } from './sandboxRuntime'
import { PlanningAgent, generatePlan } from './agents/PlanningAgent'
import { ExecutionAgent, type ExecutionConfigParams } from './agents/ExecutionAgent'
import { useAppStore } from '../store'
import { buildPlanContext } from './context/ContextBuilder'

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
  userMessage: string // First user message for planning
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

  setConfig(config: OrchestratorConfig): void {
    // Full replace (not merge) so stale config from previous tasks doesn't leak
    this.config = { ...config }
    // Propagate autoApproveSimple into the planning agent's own config
    if (typeof config.autoApproveSimple === 'boolean') {
      this.planningAgent.setConfig({ autoApproveSimple: config.autoApproveSimple })
    }
  }

  /**
   * Process a task through the full agent pipeline.
   */
  async processTask(params: OrchestratorTaskParams): Promise<void> {
    const { taskId, messageId, signal } = params

    // Skip planning if configured
    if (this.config.skipPlanning) {
      await this.executeDirectly(params)
      return
    }

    // Step 1: Generate plan
    const plan = await this.generatePlan(params)

    // Step 2: Check for auto-approval
    if (this.planningAgent.isSimplePlan(plan)) {
      // Auto-approve simple plans
      await this.executeWithPlan(params, plan)
      return
    }

    // Step 3: Present plan for user approval
    this.emitPlanPending(taskId, messageId, plan)

    // Step 4: Wait for user approval
    const approval = await this.waitForApproval(taskId, messageId, plan, signal)

    if (approval.approved === false) {
      this.emitPlanRejected(taskId, messageId, approval.reason)
      return
    }

    // Step 5: Execute with approved plan
    await this.executeWithPlan(params, approval.plan)
  }

  /**
   * Generate a plan using the Planning Agent.
   */
  private async generatePlan(params: OrchestratorTaskParams): Promise<ExecutionPlan> {
    const { userMessage, apiKey, model, apiBase, provider } = params

    return generatePlan(userMessage, apiKey, model, apiBase, provider, {
      autoApproveSimple: this.config.autoApproveSimple,
    })
  }

  /**
   * Execute directly without planning (original behavior).
   */
  private async executeDirectly(params: OrchestratorTaskParams): Promise<void> {
    const executionParams: ExecutionConfigParams = {
      task: { id: params.taskId, title: params.taskTitle || params.userMessage.slice(0, 60), status: 'in_progress', createdAt: new Date() },
      userInput: params.userMessage,
      messages: params.userMessages,
      tools: [],
      taskId: params.taskId,
      messageId: params.messageId,
      userMessages: params.userMessages,
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
      searchConfig: params.searchConfig,
      executionConfig: params.executionConfig,
      signal: params.signal,
      maxIterations: params.maxIterations,
      enableVerification: this.config.enableVerification,
    }

    await this.executionAgent.execute(executionParams)
  }

  /**
   * Execute with an approved plan.
   */
  private async executeWithPlan(params: OrchestratorTaskParams, plan: ExecutionPlan): Promise<void> {
    this.emitPlanApproved(params.taskId, params.messageId, plan)

    // Inject plan context into the final user message (not as a system role,
    // which breaks Anthropic providers that reject mid-conversation system messages).
    // Find the LAST user-role message specifically — the last element of userMessages
    // may be a tool result on task resume, which would corrupt it.
      // buildPlanContext gives the base plan block; append execution instruction here
      const planContext = buildPlanContext(plan) + '\n\nMark phases as complete by updating task_plan.md with checkboxes.'
    const lastUserIdx = (() => {
      for (let i = params.userMessages.length - 1; i >= 0; i--) {
        if (params.userMessages[i].role === 'user') return i
      }
      return params.userMessages.length - 1
    })()
    const targetMsg = params.userMessages[lastUserIdx]
    const augmentedLastMsg: LlmMessage = {
      role: 'user',
      content: (typeof targetMsg?.content === 'string' ? targetMsg.content : '') + '\n\n' + planContext,
    }
    const messagesWithPlan: LlmMessage[] = [
      ...params.userMessages.slice(0, lastUserIdx),
      augmentedLastMsg,
      ...params.userMessages.slice(lastUserIdx + 1),
    ]

    const executionParams: ExecutionConfigParams = {
      task: { id: params.taskId, title: params.taskTitle || params.userMessage.slice(0, 60), status: 'in_progress', createdAt: new Date() },
      userInput: params.userMessage,
      messages: messagesWithPlan,
      tools: [],
      taskId: params.taskId,
      messageId: params.messageId,
      userMessages: messagesWithPlan,
      apiKey: params.apiKey,
      model: params.model,
      apiBase: params.apiBase,
      provider: params.provider,
      searchConfig: params.searchConfig,
      executionConfig: params.executionConfig,
      signal: params.signal,
      maxIterations: params.maxIterations,
      plan,
      enableVerification: this.config.enableVerification,
    }

    await this.executionAgent.execute(executionParams)
  }

    /**
     * Wait for user approval of the plan.
     */
  private async waitForApproval(
    taskId: string,
    _messageId: string,
    plan: ExecutionPlan,
    signal: AbortSignal,
  ): Promise<PlanApprovalResult> {
    return new Promise((resolve) => {
      const timeout = this.config.approvalTimeout || 300_000 // 5 minutes default

      // Check signal
      if (signal.aborted) {
        resolve({ approved: false, plan, reason: 'cancelled' })
        return
      }

      // Listen for approval events
      const handleApprove = () => {
        cleanup()
        resolve({ approved: true, plan })
      }

      const handleReject = () => {
        cleanup()
        resolve({ approved: false, plan, reason: 'rejected' })
      }

      const handleAbort = () => {
        cleanup()
        resolve({ approved: false, plan, reason: 'cancelled' })
      }

      // Timeout handler
      const timeoutId = setTimeout(() => {
        cleanup()
        resolve({ approved: false, plan, reason: 'timeout' })
      }, timeout)

      // Cleanup
      const cleanup = () => {
        clearTimeout(timeoutId)
        window.removeEventListener(`nasus:plan-approve-${taskId}`, handleApprove)
        window.removeEventListener(`nasus:plan-reject-${taskId}`, handleReject)
        signal.removeEventListener('abort', handleAbort)
      }

      // Set up listeners
      window.addEventListener(`nasus:plan-approve-${taskId}`, handleApprove)
      window.addEventListener(`nasus:plan-reject-${taskId}`, handleReject)
      signal.addEventListener('abort', handleAbort)
    })
  }

  // ── Event Emitters ───────────────────────────────────────────────────────────────

  private emitPlanPending(taskId: string, messageId: string, plan: ExecutionPlan): void {
    // Update store for UI to show plan
    useAppStore.getState().setPendingPlan(plan)
    useAppStore.getState().setPlanApprovalStatus('pending')

    window.dispatchEvent(
      new CustomEvent('nasus:plan-pending', {
        detail: { taskId, messageId, plan },
      }),
    )
  }

  private emitPlanApproved(taskId: string, messageId: string, plan: ExecutionPlan): void {
    // Update store
    useAppStore.getState().setPendingPlan(null)
    useAppStore.getState().setPlanApprovalStatus('approved')

    window.dispatchEvent(
      new CustomEvent('nasus:plan-approved', {
        detail: { taskId, messageId, plan },
      }),
    )
  }

  private emitPlanRejected(taskId: string, messageId: string, reason: string): void {
    // Update store
    useAppStore.getState().setPendingPlan(null)
    useAppStore.getState().setPlanApprovalStatus('rejected')

    window.dispatchEvent(
      new CustomEvent('nasus:plan-rejected', {
        detail: { taskId, messageId, reason },
      }),
    )

    // User chose to skip — mark stopped, not failed
    useAppStore.getState().updateTaskStatus(taskId, 'stopped')
  }
}

/**
 * Global orchestrator instance.
 */
export const orchestrator = new AgentOrchestrator()

/**
 * Convenience function to process a task through the orchestrator.
 */
export async function processTaskWithOrchestrator(
  params: OrchestratorTaskParams,
  config?: OrchestratorConfig,
): Promise<void> {
  if (config) {
    orchestrator.setConfig(config)
  }
  await orchestrator.processTask(params)
}
