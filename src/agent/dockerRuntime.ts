/**
 * Docker local container runtime.
 *
 * Uses local Docker daemon to run Python and shell commands in containers.
 * One container instance is kept alive per session and reused across calls.
 * The container is killed on dispose().
 *
 * Docker advantages:
 * - Free (no API costs)
 * - Privacy (code never leaves machine)
 * - Offline capable
 * - Lower latency (no API round-trip)
 */

import { tauriInvoke } from '../tauri'

export interface DockerExecResult {
  stdout: string
  stderr: string
  error?: string
  exitCode: number
}

export type DockerStatusCallback = (status: 'starting' | 'ready' | 'error', message?: string) => void

// Rust types for Tauri commands (Tauri v2 does not convert snake_case → camelCase)
interface DockerContainerResult {
  container_id: string
}

interface DockerExecResultRaw {
  stdout: string
  stderr: string
  exit_code: number
}

// Per-task container registry — each taskId gets its own isolated container
const taskContainers: Map<string, string> = new Map()

/** Image to use for Docker sandbox */
const SANDBOX_IMAGE = 'nasus-sandbox:latest'

/** Default container resource limits */
const CONTAINER_CONFIG = {
  memory: '512m',
  cpu: '1',
  timeout: 120000, // 2 minutes per execution
}

/**
 * Get or create a container for the given task.
 * Each taskId maps to its own isolated container.
 * Calls onStatus('starting') before creation, onStatus('ready') after.
 */
async function getContainer(
  taskId: string,
  workspacePath: string,
  onStatus?: DockerStatusCallback,
): Promise<string> {
  const existing = taskContainers.get(taskId)
  if (existing) {
    return existing
  }

  onStatus?.('starting', 'Starting Docker container…')

  try {
    const result = await tauriInvoke<DockerContainerResult>('docker_create_container', {
      taskId,
      workspacePath,
      image: SANDBOX_IMAGE,
      memory: CONTAINER_CONFIG.memory,
      cpu: CONTAINER_CONFIG.cpu,
    })

      if (!result?.container_id) {
        throw new Error('Failed to create container: no container ID returned')
      }

      taskContainers.set(taskId, result.container_id)
    onStatus?.('ready', 'Container ready')
    return result.container_id
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    onStatus?.('error', `Container start failed: ${msg}`)
    throw err
  }
}

/** Run Python code in the Docker container. */
export async function dockerRunPython(
  code: string,
  taskId: string,
  workspacePath: string,
  onStatus?: DockerStatusCallback,
): Promise<DockerExecResult> {
  const containerId = await getContainer(taskId, workspacePath, onStatus)

  try {
    const result = await tauriInvoke<DockerExecResultRaw>('docker_execute_python', {
      containerId,
      code,
      timeout: CONTAINER_CONFIG.timeout,
    })

    if (!result) {
      throw new Error('No result from Docker execution')
    }

      const error = result.exit_code !== 0 ? `Exit code ${result.exit_code}` : undefined

      return {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        error,
        exitCode: result.exit_code,
      }
  } catch (err) {
    return {
      stdout: '',
      stderr: '',
      error: err instanceof Error ? err.message : String(err),
      exitCode: -1,
    }
  }
}

/** Run a shell command in the Docker container. */
export async function dockerRunBash(
  command: string,
  taskId: string,
  workspacePath: string,
  onStatus?: DockerStatusCallback,
): Promise<DockerExecResult> {
  const containerId = await getContainer(taskId, workspacePath, onStatus)

  try {
    const result = await tauriInvoke<DockerExecResultRaw>('docker_execute_bash', {
      containerId,
      command,
      timeout: CONTAINER_CONFIG.timeout,
    })

    if (!result) {
      throw new Error('No result from Docker execution')
    }

      const error = result.exit_code !== 0 ? `Exit code ${result.exit_code}` : undefined

      return {
        stdout: result.stdout ?? '',
        stderr: result.stderr ?? '',
        error,
        exitCode: result.exit_code,
      }
  } catch (err) {
    return {
      stdout: '',
      stderr: '',
      error: err instanceof Error ? err.message : String(err),
      exitCode: -1,
    }
  }
}

/** Kill and remove the container for a specific task (call on task stop / switch). */
export async function disposeDockerSandbox(taskId?: string): Promise<void> {
  if (taskId) {
    const containerId = taskContainers.get(taskId)
    if (containerId) {
      try {
        await tauriInvoke('docker_dispose_container', { containerId })
      } catch {
        // Best-effort cleanup
      }
      taskContainers.delete(taskId)
    }
  } else {
    // Dispose all containers (e.g. on app shutdown)
    for (const [id, containerId] of taskContainers.entries()) {
      try {
        await tauriInvoke('docker_dispose_container', { containerId })
      } catch {
        // Best-effort cleanup
      }
      taskContainers.delete(id)
    }
  }
}

/** Returns true if an active container exists for the given task (or any task if no taskId). */
export function hasActiveDockerContainer(taskId?: string): boolean {
  if (taskId) return taskContainers.has(taskId)
  return taskContainers.size > 0
}
