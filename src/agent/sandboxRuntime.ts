/**
 * Unified sandbox dispatcher.
 *
 * E2B is the only supported cloud sandbox backend.
 * Pyodide (browser WebAssembly) is the local-only fallback for Python.
 * Daytona has been removed.
 */

import { runPython } from './pythonRuntime'
import {
  e2bRunPython,
  e2bRunBash,
  disposeE2bSandbox,
  type SandboxStatusCallback,
} from './e2bRuntime'

export interface ExecutionConfig {
  /** Execution mode selected in Settings */
  executionMode: 'e2b' | 'pyodide' | 'disabled'
  e2bApiKey?: string
  /** Called during sandbox cold-start so the UI can show a spinner */
  onSandboxStatus?: SandboxStatusCallback
}

export interface SandboxResult {
  output: string
  isError: boolean
}

/** Resolve which backend to use for the given config and capability. */
function resolveBackend(
  cfg: ExecutionConfig,
  capability: 'python' | 'bash',
): 'e2b' | 'pyodide' | 'disabled' {
  const { executionMode, e2bApiKey } = cfg

  if (executionMode === 'disabled') return 'disabled'

  if (executionMode === 'e2b') {
    return e2bApiKey?.trim() ? 'e2b' : 'disabled'
  }

  if (executionMode === 'pyodide') {
    return capability === 'bash' ? 'disabled' : 'pyodide'
  }

  // Fallback: e2b if key present, else pyodide for python, disabled for bash
  if (e2bApiKey?.trim()) return 'e2b'
  if (capability === 'python') return 'pyodide'
  return 'disabled'
}

const NO_E2B_KEY_MSG =
  '[No E2B API key configured. Add your key in Settings → Code Execution → E2B API Key.]'

/** Execute Python code using the best available runtime. */
export async function executePython(
  code: string,
  cfg: ExecutionConfig,
): Promise<SandboxResult> {
  const backend = resolveBackend(cfg, 'python')

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
  return { output: NO_E2B_KEY_MSG, isError: false }
}

/** Execute a shell command using E2B cloud sandbox. */
export async function executeBash(
  command: string,
  cfg: ExecutionConfig,
): Promise<SandboxResult> {
  const backend = resolveBackend(cfg, 'bash')

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
    output: '[bash_execute requires E2B. Add your E2B API key in Settings → Code Execution.]',
    isError: false,
  }
}

/** Kill any active E2B sandbox. Call on task stop/switch. */
export async function disposeSandbox(): Promise<void> {
  await disposeE2bSandbox()
}
