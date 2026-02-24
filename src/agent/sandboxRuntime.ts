/**
 * Unified sandbox dispatcher.
 *
 * Resolves which runtime to use (E2B / Daytona / Pyodide) based on the
 * ExecutionConfig from the store, then delegates to the appropriate module.
 *
 * Fallback chain for 'auto' mode:
 *   E2B (if key set) → Daytona (if key set) → Pyodide (Python only) → error
 */

import { runPython } from './pythonRuntime'
import {
  e2bRunPython,
  e2bRunBash,
  disposeE2bSandbox,
} from './e2bRuntime'
import {
  daytonaRunPython,
  daytonaRunBash,
  disposeDaytonaSandbox,
} from './daytonaRuntime'

export interface ExecutionConfig {
  /** Execution mode selected in Settings */
  executionMode: 'auto' | 'e2b' | 'daytona' | 'pyodide' | 'disabled'
  e2bApiKey?: string
  daytonaApiKey?: string
  /** Defaults to 'https://app.daytona.io/api' */
  daytonaApiUrl?: string
}

export interface SandboxResult {
  output: string
  isError: boolean
}

const DEFAULT_DAYTONA_URL = 'https://app.daytona.io/api'

/** Resolve which backend to use for the given config and capability. */
function resolveBackend(
  cfg: ExecutionConfig,
  capability: 'python' | 'bash',
): 'e2b' | 'daytona' | 'pyodide' | 'disabled' {
  const { executionMode, e2bApiKey, daytonaApiKey } = cfg

  if (executionMode === 'disabled') return 'disabled'

  if (executionMode === 'e2b') {
    if (!e2bApiKey) return 'disabled'
    return 'e2b'
  }

  if (executionMode === 'daytona') {
    if (!daytonaApiKey) return 'disabled'
    return 'daytona'
  }

  if (executionMode === 'pyodide') {
    if (capability === 'bash') return 'disabled'
    return 'pyodide'
  }

  // Auto: try each available backend in order
  if (e2bApiKey) return 'e2b'
  if (daytonaApiKey) return 'daytona'
  if (capability === 'python') return 'pyodide'
  return 'disabled'
}

/** Execute Python code using the best available runtime. */
export async function executePython(
  code: string,
  cfg: ExecutionConfig,
): Promise<SandboxResult> {
  const backend = resolveBackend(cfg, 'python')

  if (backend === 'e2b') {
    try {
      const res = await e2bRunPython(code, cfg.e2bApiKey!)
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
      return { output: `E2B error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  }

  if (backend === 'daytona') {
    try {
      const apiUrl = cfg.daytonaApiUrl || DEFAULT_DAYTONA_URL
      const res = await daytonaRunPython(code, cfg.daytonaApiKey!, apiUrl)
      const parts: string[] = []
      if (res.stdout) parts.push(res.stdout)
      if (res.stderr) parts.push(`[stderr]\n${res.stderr}`)
      if (res.error) {
        parts.push(`[error]\n${res.error}`)
        return { output: parts.join('\n').trim() || res.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return { output: `Daytona error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
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
      return { output: `python_execute error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  }

  // disabled
  return {
    output: cfg.executionMode === 'disabled'
      ? '[Code execution is disabled. Enable it in Settings → Code Execution.]'
      : '[No code execution backend configured. Add an E2B or Daytona API key in Settings → Code Execution, or set mode to Pyodide.]',
    isError: false,
  }
}

/** Execute a shell command using a cloud sandbox runtime. */
export async function executeBash(
  command: string,
  cfg: ExecutionConfig,
): Promise<SandboxResult> {
  const backend = resolveBackend(cfg, 'bash')

  if (backend === 'e2b') {
    try {
      const res = await e2bRunBash(command, cfg.e2bApiKey!)
      const parts: string[] = []
      if (res.stdout) parts.push(res.stdout)
      if (res.stderr) parts.push(`[stderr]\n${res.stderr}`)
      if (res.error) {
        parts.push(`[error]\n${res.error}`)
        return { output: parts.join('\n').trim() || res.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return { output: `E2B bash error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  }

  if (backend === 'daytona') {
    try {
      const apiUrl = cfg.daytonaApiUrl || DEFAULT_DAYTONA_URL
      const res = await daytonaRunBash(command, cfg.daytonaApiKey!, apiUrl)
      const parts: string[] = []
      if (res.stdout) parts.push(res.stdout)
      if (res.stderr) parts.push(`[stderr]\n${res.stderr}`)
      if (res.error) {
        parts.push(`[error]\n${res.error}`)
        return { output: parts.join('\n').trim() || res.error, isError: true }
      }
      return { output: parts.join('\n').trim() || '(no output)', isError: false }
    } catch (err) {
      return { output: `Daytona bash error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
    }
  }

  // No cloud sandbox available for bash
  return {
    output:
      cfg.executionMode === 'disabled'
        ? '[Code execution is disabled. Enable it in Settings → Code Execution.]'
        : '[bash_execute requires a cloud sandbox (E2B or Daytona). Add an API key in Settings → Code Execution.]',
    isError: false,
  }
}

/** Kill any active sandbox (E2B + Daytona). Call on task stop/switch. */
export async function disposeSandbox(): Promise<void> {
  await Promise.allSettled([disposeE2bSandbox(), disposeDaytonaSandbox()])
}
