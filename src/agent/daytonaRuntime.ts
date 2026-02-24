/**
 * Daytona cloud sandbox runtime.
 *
 * Uses @daytonaio/sdk to run Python and shell commands in a secure
 * cloud sandbox. One sandbox instance is kept alive per session and reused
 * across calls. The sandbox is deleted on dispose().
 *
 * BYOK pattern: the user's own Daytona API key is passed from the store.
 * Keys are never sent to any Nasus server.
 */

import { Daytona } from '@daytonaio/sdk'
import type { Sandbox } from '@daytonaio/sdk'

export interface SandboxExecResult {
  stdout: string
  stderr: string
  error?: string
}

// One sandbox instance per session — created lazily, reused across calls
let activeSandbox: Sandbox | null = null
let activeApiKey: string | null = null
let activeApiUrl: string | null = null

/** Get or create the Daytona sandbox, re-creating if credentials changed. */
async function getSandbox(apiKey: string, apiUrl: string): Promise<Sandbox> {
  if (activeSandbox && activeApiKey === apiKey && activeApiUrl === apiUrl) {
    return activeSandbox
  }

  // Dispose previous if credentials changed
  if (activeSandbox) {
    await disposeDaytonaSandbox().catch(() => {})
  }

  const daytona = new Daytona({ apiKey, apiUrl })
  const sbx = await daytona.create({
    language: 'python',
    autoStopInterval: 30, // 30-minute auto-stop
  })

  activeSandbox = sbx
  activeApiKey = apiKey
  activeApiUrl = apiUrl
  return sbx
}

/** Run Python code in the Daytona cloud sandbox. */
export async function daytonaRunPython(
  code: string,
  apiKey: string,
  apiUrl: string,
): Promise<SandboxExecResult> {
  const sbx = await getSandbox(apiKey, apiUrl)
  const response = await sbx.process.codeRun(code)

  const stdout = response.artifacts?.stdout ?? response.result ?? ''
  const exitCode = response.exitCode ?? 0

  return {
    stdout,
    stderr: '',
    error: exitCode !== 0 ? `Exit code ${exitCode}` : undefined,
  }
}

/** Run a shell command in the Daytona cloud sandbox. */
export async function daytonaRunBash(
  command: string,
  apiKey: string,
  apiUrl: string,
): Promise<SandboxExecResult> {
  const sbx = await getSandbox(apiKey, apiUrl)
  const response = await sbx.process.executeCommand(command)

  const stdout = response.artifacts?.stdout ?? response.result ?? ''
  const exitCode = response.exitCode ?? 0

  return {
    stdout,
    stderr: '',
    error: exitCode !== 0 ? `Exit code ${exitCode}` : undefined,
  }
}

/** Delete the active Daytona sandbox (call on task stop / switch). */
export async function disposeDaytonaSandbox(): Promise<void> {
  if (activeSandbox && activeApiKey && activeApiUrl) {
    const daytona = new Daytona({ apiKey: activeApiKey, apiUrl: activeApiUrl })
    try { await daytona.delete(activeSandbox) } catch { /* best-effort */ }
    activeSandbox = null
    activeApiKey = null
    activeApiUrl = null
  }
}
