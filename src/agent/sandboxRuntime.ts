/**
 * Sandbox dispatcher for Tauri desktop app.
 *
 * Docker is the only supported execution backend.
 * Code execution is disabled if Docker is not available.
 */

import {
  dockerRunPython,
  dockerRunBash,
  disposeDockerSandbox,
  type DockerStatusCallback,
} from './dockerRuntime'
import { tauriInvoke } from '../tauri'

export interface ExecutionConfig {
  /** Execution mode - 'docker' if available, 'disabled' otherwise */
  executionMode: 'docker' | 'disabled'
  /** Task ID for workspace tracking */
  taskId?: string
  /** Workspace path for mounting into containers */
  workspacePath?: string
  /** Called during sandbox cold-start so the UI can show a spinner */
  onSandboxStatus?: DockerStatusCallback
}

export interface SandboxResult {
  output: string
  isError: boolean
}

export type SandboxStatusCallback = DockerStatusCallback

/** Resolve which backend to use for the given config and capability. */
async function resolveBackend(
  cfg: ExecutionConfig,
  _capability: 'python' | 'bash',
): Promise<'docker' | 'disabled'> {
  if (cfg.executionMode === 'disabled') return 'disabled'

  // Check if Docker is available
  try {
    const isAvailable = await tauriInvoke<boolean>('docker_check_status')
    return isAvailable ? 'docker' : 'disabled'
  } catch {
    return 'disabled'
  }
}

const NO_DOCKER_MSG =
  '[Docker is not available. Make sure Docker Desktop is running to enable code execution.]'

/** Execute Python code using Docker. */
export async function executePython(
  code: string,
  cfg: ExecutionConfig,
): Promise<SandboxResult> {
  const backend = await resolveBackend(cfg, 'python')

  if (backend === 'docker') {
    try {
      const res = await dockerRunPython(
        code,
        cfg.taskId ?? 'unknown',
        cfg.workspacePath ?? '',
        cfg.onSandboxStatus,
      )
      const parts: string[] = []
      if (res.stdout) parts.push(res.stdout)
      if (res.stderr) parts.push(`[stderr]\n${res.stderr}`)
      if (res.error) {
        parts.push(`[error]\n${res.error}`)
        return { output: parts.join('\n').trim() || res.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return {
        output: `Docker error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  }

  // disabled
  return { output: NO_DOCKER_MSG, isError: false }
}

/** Execute a shell command using Docker. */
export async function executeBash(
  command: string,
  cfg: ExecutionConfig,
): Promise<SandboxResult> {
  const backend = await resolveBackend(cfg, 'bash')

  if (backend === 'docker') {
    try {
      const res = await dockerRunBash(
        command,
        cfg.taskId ?? 'unknown',
        cfg.workspacePath ?? '',
        cfg.onSandboxStatus,
      )
      const parts: string[] = []
      if (res.stdout) parts.push(res.stdout)
      if (res.stderr) parts.push(`[stderr]\n${res.stderr}`)
      if (res.error) {
        parts.push(`[error]\n${res.error}`)
        return { output: parts.join('\n').trim() || res.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return {
        output: `Docker bash error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  }

  return {
    output: '[bash_execute requires Docker. Make sure Docker Desktop is running.]',
    isError: false,
  }
}

/** Kill any active Docker containers. Call on task stop/switch. */
export async function disposeSandbox(): Promise<void> {
  await disposeDockerSandbox()
}
