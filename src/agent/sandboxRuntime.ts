/**
 * Unified sandbox dispatcher.
 *
 * Docker is the recommended local backend (free, private, offline).
 * E2B is the cloud sandbox fallback.
 * Pyodide (browser WebAssembly) is the last-resort fallback for Python only.
 */

import { runPython } from './pythonRuntime'
import {
  e2bRunPython,
  e2bRunBash,
  disposeE2bSandbox,
  type SandboxStatusCallback,
} from './e2bRuntime'
import {
  dockerRunPython,
  dockerRunBash,
  disposeDockerSandbox,
  type DockerStatusCallback,
} from './dockerRuntime'
import { tauriInvoke } from '../tauri'

export interface ExecutionConfig {
  /** Execution mode selected in Settings */
  executionMode: 'docker' | 'e2b' | 'pyodide' | 'disabled'
  e2bApiKey?: string
  /** Task ID for workspace tracking */
  taskId?: string
  /** Workspace path for mounting into containers */
  workspacePath?: string
  /** Called during sandbox cold-start so the UI can show a spinner */
  onSandboxStatus?: SandboxStatusCallback
}

export interface SandboxResult {
  output: string
  isError: boolean
}

/** Resolve which backend to use for the given config and capability. */
async function resolveBackend(
  cfg: ExecutionConfig,
  capability: 'python' | 'bash',
): Promise<'docker' | 'e2b' | 'pyodide' | 'disabled'> {
  const { executionMode, e2bApiKey } = cfg

  if (executionMode === 'disabled') return 'disabled'

  if (executionMode === 'docker') {
    // Check if Docker is available
    try {
      const isAvailable = await tauriInvoke<boolean>('docker_check_status')
      return isAvailable ? 'docker' : 'e2b'
    } catch {
      // Fallback to E2B if Docker check fails
      return 'e2b'
    }
  }

  if (executionMode === 'e2b') {
    return e2bApiKey?.trim() ? 'e2b' : 'disabled'
  }

  if (executionMode === 'pyodide') {
    return capability === 'bash' ? 'disabled' : 'pyodide'
  }

  // Fallback: Docker first, then e2b if key present, else pyodide for python, disabled for bash
  try {
    const isAvailable = await tauriInvoke<boolean>('docker_check_status')
    if (isAvailable) return 'docker'
  } catch {
    // Docker not available, continue to fallback
  }
  if (e2bApiKey?.trim()) return 'e2b'
  if (capability === 'python') return 'pyodide'
  return 'disabled'
}

const NO_DOCKER_MSG =
  '[Docker is not available. Make sure Docker Desktop is running, or add an E2B API key in Settings.]'

/** Execute Python code using the best available runtime. */
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
        cfg.onSandboxStatus as DockerStatusCallback,
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

  if (backend === 'e2b') {
    try {
      const res = await e2bRunPython(code, cfg.e2bApiKey!, cfg.onSandboxStatus)
      const parts: string[] = []
      if (res.stdout) parts.push(res.stdout)
      if (res.stderr) parts.push(`[stderr]\n${res.stderr}`)
      if (res.charts && res.charts.length > 0) {
        for (const png of res.charts) {
          parts.push(`![chart](data:image/png;base64,${png})`)
        }
      }
      if (res.error) {
        parts.push(`[error]\n${res.error}`)
        return { output: parts.join('\n').trim() || res.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return {
        output: `E2B error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  }

  if (backend === 'pyodide') {
    try {
      const result = await runPython(code)
      const parts: string[] = []
      if (result.stdout) parts.push(result.stdout)
      if (result.stderr) parts.push(`[stderr]\n${result.stderr}`)
      if (result.error) {
        parts.push(`[error]\n${result.error}`)
        return { output: parts.join('\n').trim() || result.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return {
        output: `python_execute error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  }

  // disabled
  if (cfg.executionMode === 'disabled') {
    return { output: '[Code execution is disabled. Enable it in Settings → Code Execution.]', isError: false }
  }
  return { output: NO_DOCKER_MSG, isError: false }
}

/** Execute a shell command using Docker or E2B cloud sandbox. */
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
        cfg.onSandboxStatus as DockerStatusCallback,
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

  if (backend === 'e2b') {
    try {
      const res = await e2bRunBash(command, cfg.e2bApiKey!, cfg.onSandboxStatus)
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
        output: `E2B bash error: ${err instanceof Error ? err.message : String(err)}`,
        isError: true,
      }
    }
  }

  if (cfg.executionMode === 'disabled') {
    return { output: '[Code execution is disabled. Enable it in Settings → Code Execution.]', isError: false }
  }
  return {
    output: '[bash_execute requires Docker or E2B. Configure one in Settings → Code Execution.]',
    isError: false,
  }
}

/** Kill any active sandbox containers. Call on task stop/switch. */
export async function disposeSandbox(): Promise<void> {
  await Promise.all([
    disposeE2bSandbox(),
    disposeDockerSandbox(),
  ])
}
