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

  // Docker commands must propagate errors — bypass the error-swallowing catch block
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
          if (core.default && typeof core.default.invoke === 'function') {
            return await core.default.invoke(cmd, args) as T
          }
        }

        return undefined
      } catch (err) {
        // Only swallow errors that indicate we're running outside Tauri (browser/dev mode).
        // Real backend errors (wrong args, command panics, etc.) must propagate so callers
        // can handle them rather than silently receiving undefined.
        const msg = err instanceof Error ? err.message : String(err)
        const isNotInTauri =
          msg.includes('invoke is not a function') ||
          msg.includes('__TAURI__') ||
          msg.includes('not a function') ||
          msg.includes('Cannot read properties of undefined')
        if (isNotInTauri) {
          return undefined
        }
        log.error(`Tauri invoke failed for ${cmd}:`, err)
        throw err
      }
}

// ------------------------------------------------------------------------------
// Types
// ------------------------------------------------------------------------------

export interface DockerContainer {
  Id: string
  Names: string[]
  Image: string
  Status: string
  State: string
  Created: number
  Ports: Array<{
    IP?: string
    PrivatePort: number
    PublicPort?: number
    Type: string
  }>
}

export interface DockerImage {
  Id: string
  RepoTags: string[]
  RepoDigests: string[]
  Size: number
  VirtualSize: number
  Created: number
}

export interface DockerStats {
  is_running: boolean
  version?: string
  container_count?: number
  image_count?: number
  error?: string
}

export interface ContainerLogs {
  stdout: string
  stderr: string
}

// ------------------------------------------------------------------------------
// Docker API
// ------------------------------------------------------------------------------

export async function checkDocker(): Promise<DockerStats> {
  const result = await tauriInvoke<DockerStats>('docker_stats')
  return result ?? { is_running: false, error: 'Not available' }
}

export async function listContainers(): Promise<DockerContainer[]> {
  const result = await tauriInvoke<DockerContainer[]>('docker_list_containers')
  return result ?? []
}

export async function listImages(): Promise<DockerImage[]> {
  const result = await tauriInvoke<DockerImage[]>('docker_list_images')
  return result ?? []
}

export async function startContainer(containerId: string): Promise<void> {
  await tauriInvoke('docker_start_container', { container_id: containerId })
}

export async function stopContainer(containerId: string): Promise<void> {
  await tauriInvoke('docker_stop_container', { container_id: containerId })
}

export async function removeContainer(containerId: string): Promise<void> {
  await tauriInvoke('docker_remove_container', { container_id: containerId })
}

export async function pullImage(imageName: string): Promise<void> {
  await tauriInvoke('docker_pull_image', { image_name: imageName })
}

export async function getContainerLogs(containerId: string, tail?: number): Promise<ContainerLogs> {
  const result = await tauriInvoke<ContainerLogs>('docker_get_container_logs', {
    container_id: containerId,
    tail: tail ?? 100,
  })
  return result ?? { stdout: '', stderr: '' }
}

export async function runContainer(options: {
  image: string
  name?: string
  env?: Record<string, string>
  ports?: Record<string, string>
  volumes?: Record<string, string>
  command?: string[]
  detach?: boolean
}): Promise<string> {
  const result = await tauriInvoke<string>('docker_run_container', {
    image: options.image,
    name: options.name ?? null,
    env: options.env ?? {},
    ports: options.ports ?? {},
    volumes: options.volumes ?? {},
    command: options.command ?? [],
    detach: options.detach ?? true,
  })
  return result ?? ''
}

export async function execInContainer(containerId: string, command: string[]): Promise<string> {
  const result = await tauriInvoke<string>('docker_exec_in_container', {
    container_id: containerId,
    command: command,
  })
  return result ?? ''
}

export async function buildImage(options: { dockerfile_path: string; tag: string; context_path: string }): Promise<void> {
  await tauriInvoke('docker_build_image', {
    dockerfile_path: options.dockerfile_path,
    tag: options.tag,
    context_path: options.context_path,
  })
}

// ------------------------------------------------------------------------------
// System API
// ------------------------------------------------------------------------------

export async function openUrl(url: string): Promise<void> {
  await tauriInvoke('open_url', { url })
}

export async function getAppVersion(): Promise<string> {
  const result = await tauriInvoke<string>('get_app_version')
  return result ?? '0.0.0'
}

export async function resolvePath(path: string): Promise<string> {
  const result = await tauriInvoke<string>('resolve_path', { path })
  return result ?? path
}

export async function getAppDataDir(): Promise<string> {
  const result = await tauriInvoke<string>('get_app_data_dir')
  return result ?? ''
}

// ------------------------------------------------------------------------------
// Model API
// ------------------------------------------------------------------------------

export interface ModelResponse {
  content: string
  model: string
  usage?: {
    input_tokens: number
    output_tokens: number
  }
}

export async function runModel(model: string, messages: LlmMessage[], options?: {
  temperature?: number
  max_tokens?: number
  system?: string
}): Promise<ModelResponse> {
  const result = await tauriInvoke<ModelResponse>('run_model', {
    model,
    messages,
    options: options ?? {},
  })
  return result ?? { content: '', model }
}

// ─── Sidecar lifecycle wrappers ──────────────────────────────────────────────────────
// These call the Rust commands already implemented in python_sidecar.rs.
// The sidecar binary must exist at src-tauri/sidecar/nasus-sidecar-<triple>
// (built by build-sidecar.sh) for start_sidecar to succeed.

export interface SidecarStatus {
  is_ready: boolean
  running: boolean
  sidecar_dir: string | null
}

/**
 * Spawn the Python sidecar process.
 * @param sidecarDir - Absolute path to the directory containing the sidecar binary.
 *                     Tauri resolves this relative to the app resource dir at runtime.
 */
export async function startSidecar(sidecarDir?: string): Promise<void> {
  await tauriInvoke('start_sidecar', { sidecar_dir: sidecarDir ?? null })
}

/**
 * Kill the running Python sidecar process (if any).
 */
export async function stopSidecar(): Promise<void> {
  await tauriInvoke('stop_sidecar')
}

/**
 * Get the current sidecar process status.
 */
export async function getSidecarStatus(): Promise<SidecarStatus> {
  return tauriInvoke<SidecarStatus>('sidecar_status')
}

/**
 * Restart the sidecar (kill + respawn).
 * @param sidecarDir - Same path as startSidecar.
 */
export async function restartSidecar(sidecarDir?: string): Promise<void> {
  await tauriInvoke('restart_sidecar', { sidecar_dir: sidecarDir ?? null })
}
