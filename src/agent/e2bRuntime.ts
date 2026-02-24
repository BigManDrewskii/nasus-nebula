/**
 * E2B cloud sandbox runtime.
 *
 * Uses @e2b/code-interpreter to run Python and shell commands in a secure
 * cloud sandbox. One sandbox instance is kept alive per session and reused
 * across calls. The sandbox is killed on dispose().
 *
 * BYOK pattern: the user's own E2B API key is passed directly from the store.
 * Keys are never sent to any Nasus server.
 */

import { Sandbox } from '@e2b/code-interpreter'

export interface SandboxExecResult {
  stdout: string
  stderr: string
  error?: string
  /** Base64 PNG for matplotlib charts, if any */
  charts?: string[]
}

// One sandbox per session — created lazily, reused across calls
let activeSandbox: Sandbox | null = null
let sandboxApiKey: string | null = null

/** Get or create the sandbox, re-creating if the key changed. */
async function getSandbox(apiKey: string): Promise<Sandbox> {
  if (activeSandbox && sandboxApiKey === apiKey) {
    // Ping to verify it's still alive
    const alive = await activeSandbox.isRunning().catch(() => false)
    if (alive) return activeSandbox
    // Dead — reset and recreate
    activeSandbox = null
    sandboxApiKey = null
  }

  // Create fresh sandbox
  const sbx = await Sandbox.create({ apiKey, timeoutMs: 1_800_000 /* 30 min */ })
  activeSandbox = sbx
  sandboxApiKey = apiKey
  return sbx
}

/** Run Python code in the E2B cloud sandbox. */
export async function e2bRunPython(code: string, apiKey: string): Promise<SandboxExecResult> {
  const sbx = await getSandbox(apiKey)

  const execution = await sbx.runCode(code, { language: 'python' })

  const stdout = execution.logs.stdout.join('\n')
  const stderr = execution.logs.stderr.join('\n')

  let errorMsg: string | undefined
  if (execution.error) {
    errorMsg = `${execution.error.name}: ${execution.error.value}`
    if (execution.error.traceback) errorMsg += `\n${execution.error.traceback}`
  }

  // Collect any PNG charts from results (matplotlib savefig / show)
  const charts: string[] = []
  for (const result of execution.results) {
    if (result.png) charts.push(result.png)
  }

  return { stdout, stderr, error: errorMsg, charts: charts.length > 0 ? charts : undefined }
}

/** Run a shell command in the E2B cloud sandbox. */
export async function e2bRunBash(command: string, apiKey: string): Promise<SandboxExecResult> {
  const sbx = await getSandbox(apiKey)

  const result = await sbx.commands.run(command, { timeoutMs: 120_000 })

  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    error: result.exitCode !== 0 ? `Exit code ${result.exitCode}` : undefined,
  }
}

/** Kill the active E2B sandbox (call on task stop / switch). */
export async function disposeE2bSandbox(): Promise<void> {
  if (activeSandbox) {
    try { await activeSandbox.kill() } catch { /* best-effort */ }
    activeSandbox = null
    sandboxApiKey = null
  }
}
