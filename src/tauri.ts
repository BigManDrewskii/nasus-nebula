// Tauri API wrappers for the desktop app.

import type { LlmMessage } from './types'
import { createLogger } from './lib/logger'

const log = createLogger('tauri')

// Type for Tauri v2 core module
type TauriCoreModule = {
  invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  default?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
}

/**
 * Invoke a Tauri backend command.
 *
 * In v2, arguments must use snake_case to match Rust parameter names.
 * This wrapper catches all errors and returns undefined to prevent crashes.
 */
export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  // Agent commands are routed through the TS Orchestrator, not Rust backend
  if (cmd === 'run_agent' || cmd === 'stop_agent') {
    return undefined
  }

    try {
      // Fast path: check globals first (no async import needed)
      const win = window as typeof globalThis & {
        __TAURI_INTERNALS__?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
        __TAURI__?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
        external?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
      }
      const globalInvoke = win.__TAURI_INTERNALS__?.invoke ?? win.__TAURI__?.invoke ?? win.external?.invoke
      if (typeof globalInvoke === 'function') {
        return await globalInvoke(cmd, args) as T
      }

      // Not running inside Tauri — skip the dynamic import entirely to avoid
      // "Cannot read properties of undefined (reading 'invoke')" noise in browser dev mode.
      if (!win.__TAURI_INTERNALS__ && !win.__TAURI__) {
        return undefined
      }

      // Tauri v2: try to get invoke from @tauri-apps/api/core
      const core = await import('@tauri-apps/api/core').catch(() => null) as TauriCoreModule | null

      if (core) {
        // Standard v2 invoke
        if (typeof core.invoke === 'function') {
          return await core.invoke(cmd, args) as T
        }

        // Fallback for different v2 build configurations
        const altInvoke = core.invoke ?? core.default?.invoke
        if (typeof altInvoke === 'function') {
          return await altInvoke(cmd, args) as T
        }
      }

      log.warn(`No invoke method found for ${cmd}`)
      return undefined
    } catch (e) {
      // Suppress expected non-errors:
      // - "No such file / os error 2" = workspace file not found (expected)
      // - "Cannot read properties of undefined (reading 'invoke')" = running in browser without Tauri
      const errorMsg = String(e)
      if (
        !errorMsg.includes('No such file') &&
        !errorMsg.includes('os error 2') &&
        !errorMsg.includes("reading 'invoke'") &&
        !errorMsg.includes('invoke')
      ) {
        log.error(`Error calling ${cmd}`, e)
      }
    }

  return undefined
}

/**
 * Invoke a Tauri backend command and expect a non-undefined result.
 * Throws if the command returns undefined or fails.
 */
export async function tauriInvokeOrThrow<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const result = await tauriInvoke<T>(cmd, args)
  if (result === undefined) {
    throw new Error(`Tauri command ${cmd} returned undefined`)
  }
  return result
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
      log.error(`Failed to parse history for task ${taskId}`, e)
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
 * Read a workspace file as raw bytes (returned as a base64 string).
 * Use this for binary files like PDF, DOCX, XLSX.
 */
export async function workspaceReadBinary(taskId: string, path: string, workspacePath: string): Promise<Uint8Array | undefined> {
  const b64 = await tauriInvoke<string>('workspace_read_binary', { taskId, path, workspacePath })
  if (!b64) return undefined
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/**
 * Check if a local Ollama instance is running at http://localhost:11434.
 */
export async function checkOllama(): Promise<boolean> {
  return (await tauriInvoke<boolean>('is_ollama_running')) ?? false
}

/**
 * Get the current search config from Rust state (for debugging).
 */
export async function getSearchConfig(): Promise<{ exaKey: string } | undefined> {
  return await tauriInvoke<{ exaKey: string }>('get_search_config')
}

/**
 * Get the fallback model chain for OpenRouter server-side fallback.
 * @param primaryModel - The primary model ID to use first
 * @param budget - 'free' or 'paid' budget mode
 * @returns Array of model IDs for fallback chain
 */
export async function getFallbackChain(
  primaryModel: string,
  budget: 'free' | 'paid',
): Promise<string[] | undefined> {
  return await tauriInvoke<string[]>('get_fallback_chain', {
    primaryModel,
    budget,
  })
}

// ── Browser Sidecar Commands ────────────────────────────────────────────────────

export interface SidecarInstallStatus {
  installed: boolean
  has_node_modules: boolean
  has_chromium: boolean
  message: string
}

/**
 * Check if browser sidecar dependencies are installed
 */
export async function browserCheckSidecarInstalled(): Promise<SidecarInstallStatus> {
  return await tauriInvoke<SidecarInstallStatus>('browser_check_sidecar_installed') ?? {
    installed: false,
    has_node_modules: false,
    has_chromium: false,
    message: 'Unable to check',
  }
}

/**
 * Install browser sidecar dependencies (npm packages and Chromium)
 */
export async function browserInstallSidecar(): Promise<string> {
  const result = await tauriInvokeOrThrow<string>('browser_install_sidecar')
  return result
}

export interface AriaSnapshotResult {
  url: string
  title: string
  /** YAML accessibility tree returned by locator.ariaSnapshot() (Playwright v1.49+) */
  snapshot: string
}

/**
 * Capture an ARIA accessibility snapshot of the current page via the sidecar.
 * Returns a YAML string optimised for LLM consumption.
 * This is the replacement for the removed page.accessibility.snapshot() API (removed in Playwright v1.57).
 */
export async function browserAriaSnapshot(
  sessionId: string,
  selector?: string,
): Promise<AriaSnapshotResult | undefined> {
  return await tauriInvoke<AriaSnapshotResult>('browser_aria_snapshot', {
    session_id: sessionId,
    selector,
  })
}

// ── Extended DB commands ──────────────────────────────────────────────────────

export interface DbMemory {
  id: string
  taskId: string
  content: string
  contentType?: string | null
  tags?: string[] | null
  timestamp: number
}

export interface DbTraceStep {
  id: string
  taskId: string
  messageId: string
  stepKind: string
  toolName?: string | null
  inputJson?: string | null
  outputText?: string | null
  isError: boolean
  durationMs?: number | null
  timestamp: number
}

export interface DbAgentTask {
  id: string
  title: string
  status: string
  createdAt: number
  updatedAt: number
  modelId?: string | null
  totalTokens: number
  estimatedCostUsd: number
}

export async function dbSaveMemory(memory: DbMemory): Promise<void> {
  await tauriInvoke('db_save_memory', { memory })
}

export async function dbQueryMemories(taskId?: string, limit?: number): Promise<DbMemory[]> {
  return (await tauriInvoke<DbMemory[]>('db_query_memories', { taskId, limit })) ?? []
}

export async function dbDeleteMemory(memoryId: string): Promise<void> {
  await tauriInvoke('db_delete_memory', { memoryId })
}

export async function dbAppendTrace(step: DbTraceStep): Promise<void> {
  await tauriInvoke('db_append_trace', { step })
}

export async function dbGetTrace(taskId: string): Promise<DbTraceStep[]> {
  return (await tauriInvoke<DbTraceStep[]>('db_get_trace', { taskId })) ?? []
}

export async function dbDeleteTrace(taskId: string): Promise<void> {
  await tauriInvoke('db_delete_trace', { taskId })
}

export async function dbUpsertTask(task: DbAgentTask): Promise<void> {
  await tauriInvoke('db_upsert_task', { task })
}

export async function dbListTasks(limit?: number): Promise<DbAgentTask[]> {
  return (await tauriInvoke<DbAgentTask[]>('db_list_tasks', { limit })) ?? []
}

export async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  try {
    const { listen } = await import('@tauri-apps/api/event')
    const unlisten = await listen<T>(event, (e) => handler(e.payload))
    return unlisten
  } catch (err) {
    log.error(`Failed to subscribe to ${event}`, err)
    return () => {}
  }
}
