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
  searchConfig?: import('./agent/tools').SearchConfig
  executionConfig?: import('./agent/sandboxRuntime').ExecutionConfig
  maxIterations?: number
  usePlanning?: boolean
  orchestratorConfig?: import('./agent/Orchestrator').OrchestratorConfig
}

async function invokeWebAgent(cmd: string, args?: Record<string, unknown>): Promise<void> {
  try {
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
        searchConfig: a.searchConfig,
        executionConfig: a.executionConfig,
        maxIterations: a.maxIterations,
        usePlanning: a.usePlanning,
        orchestratorConfig: a.orchestratorConfig,
      })
    } else if (cmd === 'stop_agent') {
      const taskId = (args as Record<string, string>).taskId
      stopWebAgent(taskId)
    }
  } catch (err) {
    console.error(`[tauriInvoke] Web agent fallback failed for ${cmd}:`, err)
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Invoke a Tauri backend command.
 * 
 * In v2, arguments must use snake_case to match Rust parameter names.
 * This wrapper catches all errors and returns undefined to prevent crashes.
 */
export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  // Always route agent commands through the TS Orchestrator
  if (cmd === 'run_agent' || cmd === 'stop_agent') {
    await invokeWebAgent(cmd, args)
    // If not in Tauri, we're done.
    // If in Tauri, we fall through to ALSO invoke the Rust backend (for state tracking).
    if (!isTauri) return undefined
  }

  if (!isTauri) {
    return undefined
  }

  try {
    // Tauri v2: try to get invoke from @tauri-apps/api/core
    const core = await import('@tauri-apps/api/core').catch(() => null)
    
    if (core) {
      // Standard v2 invoke
      if (typeof core.invoke === 'function') {
        return await core.invoke(cmd, args)
      }
      
      // Fallback for different v2 build configurations
      const altInvoke = (core as any).invoke || (core as any).default?.invoke
      if (typeof altInvoke === 'function') {
        return await altInvoke(cmd, args)
      }
    }
    
    // Legacy/global fallback
    const win = window as any
    const globalInvoke = win.__TAURI_INTERNALS__?.invoke || win.__TAURI__?.invoke || win.external?.invoke
    if (typeof globalInvoke === 'function') {
      return await globalInvoke(cmd, args)
    }
    
    // If we're here, we're supposedly in Tauri but have no way to invoke
    console.warn(`tauriInvoke [${cmd}]: isTauri is true but no invoke method found. Fallback to undefined.`)
    return undefined
  } catch (e) {
    // Only log "real" errors, not "File not found" which is expected during race conditions
    const errorMsg = String(e)
    if (!errorMsg.includes('No such file') && !errorMsg.includes('os error 2')) {
      console.error(`[tauriInvoke] Error calling ${cmd}:`, e)
    }
  }
  
  return undefined
}

// ── Persistence Helpers ───────────────────────────────────────────────────────

/**
 * Persist a task's full message history to the SQLite database.
 * This is called by the store to avoid bloating localStorage.
 */
export async function persistTaskHistory(taskId: string, rawHistory: LlmMessage[]): Promise<void> {
  const rawHistoryStr = JSON.stringify(rawHistory)
  await tauriInvoke('save_task_history', { taskId, rawHistory: rawHistoryStr })
}

/**
 * Load a task's full message history from the SQLite database.
 */
export async function getPersistedTaskHistory(taskId: string): Promise<LlmMessage[] | undefined> {
  const historyStr = await tauriInvoke<string | null>('load_task_history', { taskId })
  if (historyStr) {
    try {
      return JSON.parse(historyStr) as LlmMessage[]
    } catch (e) {
      console.error(`[tauri] Failed to parse history for task ${taskId}:`, e)
    }
  }
  return undefined
}

/**
 * Delete a task's message history from the SQLite database.
 */
export async function deletePersistedTaskHistory(taskId: string): Promise<void> {
  await tauriInvoke('delete_task_history', { taskId })
}

/**
 * Check if a local Ollama instance is running at http://localhost:11434.
 */
export async function checkOllama(): Promise<boolean> {
  if (!isTauri) {
    // In browser mode, we'd need to handle CORS, but let's assume no for now.
    try {
      const resp = await fetch('http://localhost:11434/api/tags', { method: 'GET', mode: 'no-cors' })
      return resp.type === 'opaque' || resp.ok
    } catch {
      return false
    }
  }
  return (await tauriInvoke<boolean>('is_ollama_running')) ?? false
}

export async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauri) {
    // In browser mode the agent writes directly to the store, so no event bus is needed.
    return () => {}
  }
  
  try {
    const { listen } = await import('@tauri-apps/api/event')
    const unlisten = await listen<T>(event, (e) => handler(e.payload))
    return unlisten
  } catch (err) {
    console.error(`[tauriListen] Failed to subscribe to ${event}:`, err)
    return () => {}
  }
}
