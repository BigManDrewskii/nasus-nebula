/**
 * E2B cloud sandbox runtime.
 *
 * Uses @e2b/code-interpreter to run Python and shell commands in a secure
 * cloud sandbox. One sandbox instance is kept alive per session and reused
 * across calls. The sandbox is killed on dispose().
 *
 * BYOK pattern: the user's own E2B API key is passed directly from the store.
 * Keys are never sent to any Nasus server.
 *
 * NOTE: @e2b/code-interpreter is dynamically imported to avoid pulling in
 * Node.js stream/Buffer polyfills at module evaluation time, which crashes
 * the browser before any API key is entered.
 */

export interface SandboxExecResult {
  stdout: string
  stderr: string
  error?: string
  /** Base64 PNG for matplotlib charts, if any */
  charts?: string[]
}

export type SandboxStatusCallback = (status: 'starting' | 'ready' | 'error', message?: string) => void

// One sandbox per session — created lazily, reused across calls
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let activeSandbox: any | null = null
let sandboxApiKey: string | null = null

/** Dynamically load the E2B SDK (avoids Buffer/stream crash at init). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadSdk(): Promise<{ Sandbox: any }> {
  return import('@e2b/code-interpreter') as Promise<{ Sandbox: any }>
}

/**
 * Get or create the sandbox, re-creating if the key changed or sandbox is dead.
 * Calls onStatus('starting') before creation, onStatus('ready') after.
 */
async function getSandbox(
  apiKey: string,
  onStatus?: SandboxStatusCallback,
): Promise<NonNullable<typeof activeSandbox>> {
  const { Sandbox } = await loadSdk()

  // Reuse existing sandbox if key matches and it's still alive
  if (activeSandbox && sandboxApiKey === apiKey) {
    try {
      const alive = await activeSandbox.isRunning({ requestTimeoutMs: 5_000 })
      if (alive) return activeSandbox
    } catch {
      // Treat any error as dead — fall through to re-create
    }
    activeSandbox = null
    sandboxApiKey = null
  }

  // Key changed — kill the old sandbox if there is one
  if (activeSandbox && sandboxApiKey !== apiKey) {
    try { await activeSandbox.kill() } catch { /* best-effort */ }
    activeSandbox = null
    sandboxApiKey = null
  }

  onStatus?.('starting', 'Starting E2B sandbox…')

  try {
    // Sandbox.create(opts) — apiKey and timeoutMs are both in SandboxOpts
    const sbx = await Sandbox.create({ apiKey, timeoutMs: 1_800_000 /* 30 min */ })
    activeSandbox = sbx
    sandboxApiKey = apiKey
    onStatus?.('ready', 'Sandbox ready')
    return sbx
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    onStatus?.('error', `Sandbox start failed: ${msg}`)
    throw err
  }
}

/** Run Python code in the E2B cloud sandbox. */
export async function e2bRunPython(
  code: string,
  apiKey: string,
  onStatus?: SandboxStatusCallback,
): Promise<SandboxExecResult> {
  const sbx = await getSandbox(apiKey, onStatus)

  // runCode(code, opts?) — language defaults to 'python', no need to pass it
  const execution = await sbx.runCode(code)

  const stdout = (execution.logs?.stdout ?? []).join('\n')
  const stderr = (execution.logs?.stderr ?? []).join('\n')

  let errorMsg: string | undefined
  if (execution.error) {
    errorMsg = `${execution.error.name}: ${execution.error.value}`
    if (execution.error.traceback) errorMsg += `\n${execution.error.traceback}`
  }

  // Collect any PNG charts from results (matplotlib savefig / show)
  const charts: string[] = []
  for (const result of (execution.results ?? [])) {
    if (result.png) charts.push(result.png)
  }

  return { stdout, stderr, error: errorMsg, charts: charts.length > 0 ? charts : undefined }
}

/** Run a shell command in the E2B cloud sandbox. */
export async function e2bRunBash(
  command: string,
  apiKey: string,
  onStatus?: SandboxStatusCallback,
): Promise<SandboxExecResult> {
  const sbx = await getSandbox(apiKey, onStatus)

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

/** Returns true if an active sandbox is currently alive. */
export function hasActiveSandbox(): boolean {
  return activeSandbox !== null && sandboxApiKey !== null
}
