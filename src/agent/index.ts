/**
 * Public API for the browser-side web agent.
 *
 * runWebAgent  — starts the agentic loop for a task
 * stopWebAgent — cancels a running task
 */

import type { LlmMessage } from '../types'
import { runExecutionAgent } from './agents/ExecutionAgent'
import type { SearchConfig } from './tools'
import type { ExecutionConfig } from './sandboxRuntime'
import { disposeSandbox } from './sandboxRuntime'
import { processTaskWithOrchestrator, type OrchestratorConfig } from './Orchestrator'
import { workspaceManager } from './workspace/WorkspaceManager'

// AbortControllers keyed by taskId
const controllers: Map<string, AbortController> = new Map()

export interface RunWebAgentParams {
  taskId: string
  messageId: string
  userMessages: LlmMessage[]
  apiKey: string
  model: string
  apiBase: string
  provider: string
  searchConfig?: SearchConfig
  executionConfig?: ExecutionConfig
  maxIterations?: number
  /** Enable multi-agent mode with planning (default: false for backward compatibility) */
  usePlanning?: boolean
  /** Orchestrator configuration */
  orchestratorConfig?: OrchestratorConfig
}

export async function runWebAgent(params: RunWebAgentParams): Promise<void> {
  // Cancel any existing run for this task
  stopWebAgent(params.taskId)

  const controller = new AbortController()
  controllers.set(params.taskId, controller)

  try {
    // Ensure workspace is loaded before agent starts
    await workspaceManager.ensureLoaded(params.taskId)

    // Use orchestrator if planning is enabled
    if (params.usePlanning) {
      // Extract first user message for planning
      const firstUserMessage = params.userMessages.find(m => m.role === 'user')
      const userMessage = typeof firstUserMessage?.content === 'string'
        ? firstUserMessage.content
        : ''

      await processTaskWithOrchestrator(
        {
          taskId: params.taskId,
          messageId: params.messageId,
          userMessages: params.userMessages,
          userMessage,
          apiKey: params.apiKey,
          model: params.model,
          apiBase: params.apiBase,
          provider: params.provider,
          searchConfig: params.searchConfig,
          executionConfig: params.executionConfig,
          signal: controller.signal,
          maxIterations: params.maxIterations,
        },
        params.orchestratorConfig,
      )
      } else {
        // Original behavior: direct execution
        await runExecutionAgent({
          task: { id: params.taskId, title: params.taskId, status: 'in_progress', createdAt: new Date() },
          userInput: params.userMessages[params.userMessages.length - 1]?.content as string || '',
          messages: params.userMessages,
          tools: [],
          ...params,
          signal: controller.signal,
        })
      }
  } finally {
    controllers.delete(params.taskId)
  }
}

export function stopWebAgent(taskId: string) {
  const ctrl = controllers.get(taskId)
  if (ctrl) {
    ctrl.abort()
    controllers.delete(taskId)
  }
  // Best-effort sandbox cleanup on stop
  disposeSandbox().catch(() => {})
}

export function isWebAgentRunning(taskId: string): boolean {
  return controllers.has(taskId)
}
