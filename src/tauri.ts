// Tauri API wrappers for the desktop app.

import { createLogger } from './lib/logger'
import type { UnlistenFn } from '@tauri-apps/api/event'

const log = createLogger('tauri')

// Type for Tauri v2 core module
type TauriCoreModule = {
  invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
  default?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
}

export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T | undefined> {
  if (cmd === 'run_agent' || cmd === 'stop_agent') {
    return undefined
  }

  if (cmd.startsWith('docker_')) {
    const win = window as typeof globalThis & {
      __TAURI_INTERNALS__?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
      __TAURI__?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
      external?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
    }
    const globalInvoke = win.__TAURI_INTERNALS__?.invoke ?? win.__TAURI__?.invoke ?? win.external?.invoke
    if (typeof globalInvoke === 'function') {
      return await globalInvoke(cmd, args) as T
    }
    throw new Error(`Tauri invoke not available for ${cmd}`)
  }

  try {
    const win = window as typeof globalThis & {
      __TAURI_INTERNALS__?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
      __TAURI__?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
      external?: { invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown> }
    }
    const globalInvoke = win.__TAURI_INTERNALS__?.invoke ?? win.__TAURI__?.invoke ?? win.external?.invoke
    if (typeof globalInvoke === 'function') {
      return await globalInvoke(cmd, args) as T
    }

    if (!win.__TAURI_INTERNALS__ && !win.__TAURI__) {
      return undefined
    }

    const core = await import('@tauri-apps/api/core').catch(() => null) as TauriCoreModule | null

    if (core) {
      if (typeof core.invoke === 'function') {
        return await core.invoke(cmd, args) as T
      }
      if (core.default && typeof core.default.invoke === 'function') {
        return await core.default.invoke(cmd, args) as T
      }
    }

    return undefined
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    const isNotInTauri =
      msg.includes('invoke is not a function') ||
      msg.includes('__TAURI__') ||
      msg.includes('not a function') ||
      msg.includes('Cannot read properties of undefined')
    if (isNotInTauri) {
      return undefined
    }
    log.error(`Tauri invoke failed for ${cmd}`, err instanceof Error ? err : new Error(String(err)))
    throw err
  }
}

// ─── Memory store wrappers (Phase 2 — SQLite-backed) ─────────────────────────────────────────────

/**
 * Persist a key/value pair to the SQLite-backed memory store.
 * Returns true on success.
 */
export async function memorySet(key: string, value: string): Promise<boolean> {
  const result = await tauriInvoke<boolean>('memory_set', { key, value })
  return result ?? false
}

/**
 * Retrieve a value from the SQLite-backed memory store.
 * Returns null if the key does not exist.
 */
export async function memoryGet(key: string): Promise<string | null> {
  const result = await tauriInvoke<string | null>('memory_get', { key })
  return result ?? null
}

// ─── Search config wrapper (Phase 2 — Tauri keychain) ────────────────────────────────────────────

export interface SearchConfigPayload {
  provider: string
  api_key: string
  base_url?: string
}

/**
 * Retrieve the persisted search/Exa config from the Tauri keychain.
 * Returns null if nothing has been saved yet.
 */
export async function getSearchConfig(): Promise<SearchConfigPayload | null> {
  const result = await tauriInvoke<SearchConfigPayload | null>('get_search_config')
  return result ?? null
}

export async function getSearchConfigApiKey(): Promise<string | null> {
  const cfg = await getSearchConfig()
  return cfg?.api_key ?? null
}

/**
 * Save search config to the Tauri keychain.
 */
export async function setSearchConfig(config: SearchConfigPayload): Promise<void> {
  await tauriInvoke('set_search_config', {
    provider: config.provider,
    api_key: config.api_key,
    base_url: config.base_url ?? null,
  })
}

// ─── Task History Persistence ─────────────────────────────────────────────────────

export async function persistTaskHistory(taskId: string, history: unknown[]): Promise<void> {
  await tauriInvoke('save_task_history', { taskId, rawHistory: JSON.stringify(history) })
}

export async function deletePersistedTaskHistory(taskId: string): Promise<void> {
  await tauriInvoke('delete_task_history', { taskId })
}

export async function getPersistedTaskHistory(taskId: string): Promise<unknown[] | null> {
  const result = await tauriInvoke<string | null>('load_task_history', { taskId })
  return result ? (JSON.parse(result) as unknown[]) : null
}

// ─── Trace Logging ─────────────────────────────────────────────────────────────────

export interface DbTraceStep {
  task_id: string
  step_type: string
  content: string
  timestamp: string | number
  id?: string
  message_id?: string
  step_kind?: string
  tool_name?: string | null
  input_json?: string | null
  output_text?: string | null
  is_error?: boolean
  duration_ms?: number | null
}

export async function dbAppendTrace(step: DbTraceStep): Promise<void> {
  await tauriInvoke('db_append_trace', step as unknown as Record<string, unknown>)
}

// ─── Workspace ─────────────────────────────────────────────────────────────────────

export async function workspaceReadBinary(taskId: string, path: string): Promise<Uint8Array> {
  const result = await tauriInvoke<string>('workspace_read_binary', { taskId, path })
  // Base64 decode
  const binary = atob(result ?? '')
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// ─── Browser Sidecar ───────────────────────────────────────────────────────────────

export async function checkOllama(): Promise<boolean> {
  const result = await tauriInvoke<boolean>('is_ollama_running')
  return result ?? false
}

// ─── Utility ───────────────────────────────────────────────────────────────────────

export async function tauriInvokeOrThrow<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  const result = await tauriInvoke<T>(cmd, args)
  if (result === undefined) throw new Error(`Tauri command ${cmd} returned undefined`)
  return result
}

// ─── Tauri Event Listener ───────────────────────────────────────────────────────────

export async function tauriListen(event: string, handler: (payload: unknown) => void): Promise<UnlistenFn> {
  const { listen } = await import('@tauri-apps/api/event')
  return await listen(event, handler)
}

export type { UnlistenFn } from '@tauri-apps/api/event'

// ─── Browser Sidecar Installation ───────────────────────────────────────────────────

export async function browserCheckSidecarInstalled(): Promise<boolean> {
  const result = await tauriInvoke<{ installed: boolean; has_node_modules: boolean; has_chromium: boolean; message: string }>('browser_check_sidecar_installed')
  return result?.installed ?? false
}

export async function browserInstallSidecar(_options?: { progress?: (p: number) => void }): Promise<void> {
  await tauriInvoke('browser_install_sidecar')
}

// ─── ARIA Snapshot ─────────────────────────────────────────────────────────────────

export interface AriaSnapshotResult {
  snapshot: string
  timestamp: string
  url: string
  title: string
}
