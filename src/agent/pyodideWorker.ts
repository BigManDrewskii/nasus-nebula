/**
 * Pyodide Web Worker
 *
 * Runs in a dedicated worker thread so the Python interpreter never blocks the UI.
 * Loaded lazily on first python_execute call via pythonRuntime.ts.
 *
 * Message protocol:
 *   main → worker  { type: 'run', id: string, code: string }
 *   worker → main  { type: 'result', id: string, stdout: string, stderr: string, error?: string }
 *   worker → main  { type: 'ready' }
 */

/// <reference lib="webworker" />

declare const self: DedicatedWorkerGlobalScope

// Pyodide loaded from CDN — avoids adding it to the npm bundle
const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/pyodide.js'

interface PyodideInterface {
  runPythonAsync(code: string): Promise<unknown>
  globals: { get(key: string): unknown }
}

let pyodide: PyodideInterface | null = null
let loading: Promise<PyodideInterface> | null = null

async function loadPyodide(): Promise<PyodideInterface> {
  if (pyodide) return pyodide
  if (loading) return loading

  loading = (async () => {
    // importScripts is synchronous but pyodide itself needs async init
    importScripts(PYODIDE_CDN)
    // @ts-expect-error — injected by importScripts
    const instance = await (self as unknown as { loadPyodide: (opts: object) => Promise<PyodideInterface> }).loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.27.2/full/',
      stdout: () => {}, // we capture via io redirect below
      stderr: () => {},
    })
    pyodide = instance
    return instance
  })()

  return loading
}

// Capture stdout/stderr via Python's io module
const CAPTURE_PROLOGUE = `
import sys, io as _io
_stdout_buf = _io.StringIO()
_stderr_buf = _io.StringIO()
sys.stdout = _stdout_buf
sys.stderr = _stderr_buf
`

const CAPTURE_EPILOGUE = `
_out = _stdout_buf.getvalue()
_err = _stderr_buf.getvalue()
sys.stdout = sys.__stdout__
sys.stderr = sys.__stderr__
`

self.addEventListener('message', async (e: MessageEvent) => {
  const { type, id, code } = e.data as { type: string; id: string; code: string }

  if (type !== 'run') return

  try {
    const py = await loadPyodide()

    // Run with output capture
    await py.runPythonAsync(CAPTURE_PROLOGUE)
    let runError: string | undefined

    try {
      await py.runPythonAsync(code)
    } catch (err) {
      runError = err instanceof Error ? err.message : String(err)
    }

    await py.runPythonAsync(CAPTURE_EPILOGUE)

    const stdout = String(py.globals.get('_out') ?? '')
    const stderr = String(py.globals.get('_err') ?? '')

    self.postMessage({ type: 'result', id, stdout, stderr, error: runError })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    self.postMessage({ type: 'result', id, stdout: '', stderr: '', error: msg })
  }
})

// Signal readiness (on load)
self.postMessage({ type: 'ready' })
