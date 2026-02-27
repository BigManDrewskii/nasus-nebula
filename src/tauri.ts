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
  if (!isTauri) {
    if (cmd === 'run_agent' || cmd === 'stop_agent') {
      await invokeWebAgent(cmd, args)
    }
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
