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

// Rust types for Tauri commands
interface DockerContainerResult {
  containerId: string
}

interface DockerExecResultRaw {
  stdout: string
  stderr: string
  exitCode: number
}

// Active container state
let activeContainerId: string | null = null

/** Image to use for Docker sandbox */
const SANDBOX_IMAGE = 'nasus-sandbox:latest'

/** Default container resource limits */
const CONTAINER_CONFIG = {
  memory: '512m',
  cpu: '1',
  timeout: 120000, // 2 minutes per execution
}

/**
 * Get or create a container for the current session.
 * Calls onStatus('starting') before creation, onStatus('ready') after.
 */
async function getContainer(
  taskId: string,
  workspacePath: string,
  onStatus?: DockerStatusCallback,
): Promise<string> {
  if (activeContainerId) {
    return activeContainerId
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

    if (!result?.containerId) {
      throw new Error('Failed to create container: no container ID returned')
    }

    activeContainerId = result.containerId
    onStatus?.('ready', 'Container ready')
    return activeContainerId
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

    const error = result.exitCode !== 0 ? `Exit code ${result.exitCode}` : undefined

    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      error,
      exitCode: result.exitCode,
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

    const error = result.exitCode !== 0 ? `Exit code ${result.exitCode}` : undefined

    return {
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
      error,
      exitCode: result.exitCode,
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

/** Kill and remove the active container (call on task stop / switch). */
export async function disposeDockerSandbox(): Promise<void> {
  if (activeContainerId) {
    try {
      await tauriInvoke('docker_dispose_container', { containerId: activeContainerId })
    } catch {
      // Best-effort cleanup
    }
    activeContainerId = null
  }
}

/** Returns true if an active container exists. */
export function hasActiveDockerContainer(): boolean {
  return activeContainerId !== null
}
