/**
 * Public API for the browser-side web agent.
 *
 * runWebAgent  — starts the agentic loop for a task
 * stopWebAgent — cancels a running task
 */

import type { LlmMessage } from '../types'
import { runExecutionAgent } from './agents/ExecutionAgent'
import type { SearchConfig } from './tools'
import { createLogger } from '../lib/logger'
import type { ExecutionConfig } from './sandboxRuntime'
import { disposeSandbox } from './sandboxRuntime'
import { processTaskWithOrchestrator, type OrchestratorConfig } from './Orchestrator'
import { workspaceManager } from './workspace/WorkspaceManager'
import { useAppStore } from '../store'

const log = createLogger('Agent')

// AbortControllers keyed by taskId
const controllers: Map<string, AbortController> = new Map()

// Wire Tauri's stop_agent event → stopWebAgent so the Rust backend can
// cancel a running task (e.g. from a native menu action or crash recovery).
// Only registers if running inside Tauri (window.__TAURI__ is defined).
if (typeof window !== 'undefined' && '__TAURI__' in window) {
  import('@tauri-apps/api/event').then(({ listen }) => {
    listen<{ taskId: string }>('nasus:stop-task', (event) => {
      stopWebAgent(event.payload.taskId)
    }).catch(() => {
      // Non-fatal — stop_agent from Rust is best-effort
    })
  }).catch(() => {})
}

export interface RunWebAgentParams {
  taskId: string
  taskTitle?: string
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
  // Reset any stale plan state from a previous run before starting.
  // Without this, pendingPlan / planApprovalStatus from task N bleeds into task N+1
  // causing the plan modal to show stale state or waitForApproval to mis-fire.
  useAppStore.getState().resetPlanState()

  // Cancel any concurrent run for this task before starting a new one.
  // Only abort if there's already a controller registered (i.e., a true concurrent run).
  // Don't call stopWebAgent here — that also disposes the sandbox, which we don't want
  // on a normal new-message send. Just abort the signal and replace the controller.
  const existing = controllers.get(params.taskId)
  if (existing) {
    existing.abort()
    controllers.delete(params.taskId)
  }

  const controller = new AbortController()
  controllers.set(params.taskId, controller)

  try {
    // Ensure workspace is loaded before agent starts
    await workspaceManager.ensureLoaded(params.taskId)

    // Use orchestrator if planning is enabled
    if (params.usePlanning) {
      // Use the LAST user message for planning context (not always the first)
      const lastUserMessage = [...params.userMessages].reverse().find(m => m.role === 'user')
      const userMessage = typeof lastUserMessage?.content === 'string'
        ? lastUserMessage.content
        : ''

      // Skip planning for:
      // 1. Short messages (< 80 chars) — unlikely to need a multi-phase plan
      // 2. Follow-up turns (> 2 user messages) — already have context/plan from previous turns
      const isShortMessage = userMessage.trim().length < 80
      const isFollowUp = params.userMessages.filter(m => m.role === 'user').length > 2
      const shouldSkipPlanning = isShortMessage || isFollowUp

      await processTaskWithOrchestrator(
        {
          taskId: params.taskId,
          taskTitle: params.taskTitle,
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
        {
          ...params.orchestratorConfig,
          skipPlanning: shouldSkipPlanning || params.orchestratorConfig?.skipPlanning,
          autoApproveSimple: true, // always auto-approve single-step plans
        },
      )
      } else {
        // Original behavior: direct execution
        await runExecutionAgent({
          taskId: params.taskId,
          messageId: params.messageId,
          task: { id: params.taskId, title: params.taskTitle || (params.userMessages[params.userMessages.length - 1]?.content as string || '').slice(0, 60), status: 'in_progress', createdAt: new Date() },
          userInput: params.userMessages[params.userMessages.length - 1]?.content as string || '',
          userMessages: params.userMessages,
          messages: params.userMessages,
          tools: [],
          apiKey: params.apiKey,
          model: params.model,
          apiBase: params.apiBase,
          provider: params.provider,
          searchConfig: params.searchConfig,
          executionConfig: params.executionConfig,
          maxIterations: params.maxIterations,
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
  // Best-effort sandbox cleanup on stop — only dispose this task's container
  disposeSandbox(taskId).catch(err => {
      log.warn('Failed to dispose sandbox on stop', err)
  })
}

export function isWebAgentRunning(taskId: string): boolean {
  return controllers.has(taskId)
}
