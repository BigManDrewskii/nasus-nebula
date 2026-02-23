// Tauri API wrappers that gracefully no-op when running outside the Tauri runtime.
// In browser mode, `run_agent` and `stop_agent` are delegated to the web agent.

import type { LlmMessage } from './types'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// ── Web-agent passthrough (browser mode only) ─────────────────────────────────

interface RunAgentArgs {
  taskId: string
  messageId: string
  userMessages: LlmMessage[]
  apiKey: string
  model: string
  workspacePath?: string
  apiBase: string
  provider: string
}

async function invokeWebAgent(cmd: string, args?: Record<string, unknown>): Promise<void> {
  const { runWebAgent, stopWebAgent } = await import('./agent/index')

  if (cmd === 'run_agent') {
    const a = args as unknown as RunAgentArgs
    await runWebAgent({
      taskId: a.taskId,
      messageId: a.messageId,
      userMessages: a.userMessages,
      apiKey: a.apiKey,
      model: a.model,
      apiBase: a.apiBase,
      provider: a.provider,
    })
  } else if (cmd === 'stop_agent') {
    const taskId = (args as Record<string, string>).taskId
    stopWebAgent(taskId)
  }
  // All other commands (get_config, etc.) are silently ignored in browser mode.
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    if (cmd === 'run_agent' || cmd === 'stop_agent') {
      await invokeWebAgent(cmd, args)
    }
    return undefined as unknown as T
  }
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(cmd, args)
}

export async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauri) {
    // In browser mode the agent writes directly to the store, so no event bus is needed.
    return () => {}
  }
  const { listen } = await import('@tauri-apps/api/event')
  const unlisten = await listen<T>(event, (e) => handler(e.payload))
  return unlisten
}
