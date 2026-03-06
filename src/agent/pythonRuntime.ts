/**
 * Python runtime service.
 *
 * Manages a single Pyodide Web Worker and exposes a simple `runPython(code)`
 * function. The worker is created lazily on first call and reused across calls.
 *
 * Usage:
 *   import { runPython } from './pythonRuntime'
 *   const { stdout, stderr, error } = await runPython('print("hello")')
 */

export interface PythonResult {
  stdout: string
  stderr: string
  error?: string
}

interface PendingRun {
  resolve: (r: PythonResult) => void
  reject: (e: Error) => void
  timeoutHandle: ReturnType<typeof setTimeout>
}

const PYTHON_TIMEOUT_MS = 30_000

let worker: Worker | null = null
let workerReady = false
let workerReadyPromise: Promise<void> | null = null
const pending = new Map<string, PendingRun>()

function getWorker(): Promise<Worker> {
  if (worker && workerReady) return Promise.resolve(worker)

  if (!worker) {
    // Vite ?worker import — dynamically import the worker module as a Worker
    worker = new Worker(new URL('./pyodideWorker.ts', import.meta.url), { type: 'module' })

    workerReadyPromise = new Promise<void>((resolve) => {
      worker!.addEventListener('message', function handler(e: MessageEvent) {
        if (e.data?.type === 'ready') {
          workerReady = true
          worker!.removeEventListener('message', handler)
          resolve()
        }
      })
    })

    worker.addEventListener('message', (e: MessageEvent) => {
      const { type, id, stdout, stderr, error } = e.data as {
        type: string
        id: string
        stdout: string
        stderr: string
        error?: string
      }
      if (type !== 'result') return
      const p = pending.get(id)
      if (!p) return
      clearTimeout(p.timeoutHandle)
      pending.delete(id)
      p.resolve({ stdout, stderr, error })
    })

    worker.addEventListener('error', (e) => {
      // Notify all pending runs
      for (const [, p] of pending) {
        clearTimeout(p.timeoutHandle)
        p.reject(new Error(e.message ?? 'Worker error'))
      }
      pending.clear()
      // Reset so next call gets a fresh worker
      worker = null
      workerReady = false
      workerReadyPromise = null
    })
  }

  return workerReadyPromise!.then(() => worker!)
}

export async function runPython(code: string): Promise<PythonResult> {
  const w = await getWorker()
  const id = crypto.randomUUID()

  return new Promise<PythonResult>((resolve, reject) => {
    const timeoutHandle = setTimeout(() => {
      pending.delete(id)
      reject(new Error(`Python execution timed out after ${PYTHON_TIMEOUT_MS / 1000}s`))
    }, PYTHON_TIMEOUT_MS)

    pending.set(id, { resolve, reject, timeoutHandle })
    w.postMessage({ type: 'run', id, code })
  })
}

/** Terminate the worker (e.g. on app unmount / reset) */
export function terminatePythonWorker() {
  if (worker) {
    worker.terminate()
    worker = null
    workerReady = false
    workerReadyPromise = null
  }
  for (const [, p] of pending) {
    clearTimeout(p.timeoutHandle)
    p.reject(new Error('Worker terminated'))
  }
  pending.clear()
}
