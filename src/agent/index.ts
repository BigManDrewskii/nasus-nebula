/**
 * Public API for the browser-side web agent.
 *
 * runWebAgent  — starts the agentic loop for a task
 * stopWebAgent — cancels a running task
 */

import type { LlmMessage } from '../types'
import { runAgentLoop } from './loop'

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
}

export async function runWebAgent(params: RunWebAgentParams): Promise<void> {
  // Cancel any existing run for this task
  stopWebAgent(params.taskId)

  const controller = new AbortController()
  controllers.set(params.taskId, controller)

  try {
    await runAgentLoop({
      ...params,
      signal: controller.signal,
    })
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
}

export function isWebAgentRunning(taskId: string): boolean {
  return controllers.has(taskId)
}
