/**
 * sidecarClient.ts
 * HTTP client for the Nasus Python sidecar (FastAPI on localhost:4751).
 *
 * Place at: src/agent/sidecarClient.ts
 *
 * Exports:
 *   postTask(moduleId, payload)       → { jobId, status }
 *   pollStatus(jobId)                 → JobStatus
 *   waitForCompletion(jobId, opts)    → JobStatus (polls until done/error)
 *   streamLogs(jobId, onLine, onDone) → () => void   (returns cleanup fn)
 *   cancelTask(jobId)                 → void
 *   healthCheck()                     → boolean
 *   runTask(moduleId, payload, opts)  → AsyncGenerator<SidecarEvent>
 */

const SIDECAR_BASE = 'http://127.0.0.1:4751'
const DEFAULT_POLL_INTERVAL_MS = 600
const DEFAULT_TIMEOUT_MS = 300_000 // 5 minutes

// ─── Types ──────────────────────────────────────────────────────────────────

export type JobStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'error'
  | 'cancelled'

export interface TaskResponse {
  job_id: string
  status: JobStatus
  module_id: string
  created_at: string
}

export interface StatusResponse {
  job_id: string
  status: JobStatus
  module_id: string
  created_at: string
  started_at?: string
  completed_at?: string
  result?: unknown
  error?: string
  steps?: SidecarStep[]
}

export interface SidecarStep {
  step: number
  type: 'plan' | 'tool_call' | 'observation' | 'final' | 'error' | 'log'
  content: string
  tool?: string
  tool_input?: unknown
  tool_output?: unknown
  timestamp: string
}

export type SidecarEvent =
  | { type: 'step'; data: SidecarStep }
  | { type: 'status'; data: StatusResponse }
  | { type: 'done'; data: StatusResponse }
  | { type: 'error'; error: string }

// ─── Status normalization ────────────────────────────────────────────────────

// Python NasusStatus uses DONE/FAILED/PENDING/RUNNING (uppercase).
// Normalize to the lowercase values used throughout this TypeScript client.
function normalizeJobStatus(raw: string): JobStatus {
  switch (raw.toUpperCase()) {
    case 'DONE':      return 'completed'
    case 'FAILED':    return 'error'
    case 'PENDING':   return 'pending'
    case 'RUNNING':   return 'running'
    case 'CANCELLED': return 'cancelled'
    default:          return raw.toLowerCase() as JobStatus
  }
}

// ─── Core helpers ────────────────────────────────────────────────────────────

async function sidecarFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${SIDECAR_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`Sidecar ${init?.method ?? 'GET'} ${path} → ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Submit a task to the sidecar. Returns immediately with a job_id.
 */
export async function postTask(
  moduleId: string,
  payload: Record<string, unknown>,
): Promise<TaskResponse> {
  return sidecarFetch<TaskResponse>('/task', {
    method: 'POST',
    body: JSON.stringify({ module_id: moduleId, payload }),
  })
}

/**
 * Poll the status of a running job.
 */
export async function pollStatus(jobId: string): Promise<StatusResponse> {
  const raw = await sidecarFetch<StatusResponse>(`/task/${jobId}/status`)
  return { ...raw, status: normalizeJobStatus(raw.status) }
}

/**
 * Cancel a running job.
 */
export async function cancelTask(jobId: string): Promise<void> {
  await sidecarFetch<void>(`/task/${jobId}`, { method: 'DELETE' })
}

/**
 * Health check — returns true if the sidecar is up and responding.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const res = await fetch(`${SIDECAR_BASE}/health`, { method: 'GET' })
    return res.ok
  } catch {
    return false
  }
}

/**
 * Poll until job reaches a terminal state (completed | error | cancelled).
 * Throws if timeout exceeded.
 */
export async function waitForCompletion(
  jobId: string,
  opts?: { pollIntervalMs?: number; timeoutMs?: number },
): Promise<StatusResponse> {
  const interval = opts?.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS
  const timeout = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const deadline = Date.now() + timeout

  while (Date.now() < deadline) {
    const status = await pollStatus(jobId)
    if (status.status === 'completed' || status.status === 'error' || status.status === 'cancelled') {
      return status
    }
    await new Promise<void>((r) => setTimeout(r, interval))
  }
  throw new Error(`Sidecar job ${jobId} timed out after ${timeout}ms`)
}

/**
 * Open an SSE stream for a job and call onLine for each step event.
 * Returns a cleanup function — call it to close the stream.
 *
 * The sidecar emits: `data: {...SidecarStep JSON...}\n\n`
 */
export function streamLogs(
  jobId: string,
  onLine: (step: SidecarStep) => void,
  onDone: (finalStatus: StatusResponse | null) => void,
): () => void {
  const es = new EventSource(`${SIDECAR_BASE}/task/${jobId}/stream`)
  let closed = false

  const finish = async () => {
    if (closed) return
    closed = true
    es.close()
    try {
      const status = await pollStatus(jobId)
      onDone(status)
    } catch {
      onDone(null)
    }
  }

  es.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data as string) as Record<string, unknown>
      // Sidecar sends {"done": true, "status": ..., "job_id": ...} as completion sentinel
      if (data.done === true) {
        void finish()
        return
      }
      // SidecarStep format has a numeric `step` field
      if (typeof data.step === 'number') {
        onLine(data as unknown as SidecarStep)
      }
    } catch {
      // ignore parse errors
    }
  }

  es.onerror = () => {
    void finish()
  }

  return () => {
    if (!closed) {
      closed = true
      es.close()
    }
  }
}

/**
 * High-level: submit a task and yield events as an async generator.
 * Combines postTask + SSE streaming into a single ergonomic API.
 *
 * Usage:
 *   for await (const event of runTask('orchestrator', { prompt })) {
 *     if (event.type === 'step') renderStep(event.data)
 *     if (event.type === 'done') handleComplete(event.data)
 *   }
 */
export async function* runTask(
  moduleId: string,
  payload: Record<string, unknown>,
): AsyncGenerator<SidecarEvent> {
  const { job_id } = await postTask(moduleId, payload)

  // Yield an initial status
  const initial = await pollStatus(job_id)
  yield { type: 'status', data: initial }

  // Stream via SSE
  const buffer: SidecarEvent[] = []
  let done = false
  let resolveNext: (() => void) | null = null

  const push = (event: SidecarEvent) => {
    buffer.push(event)
    resolveNext?.()
    resolveNext = null
  }

  const cleanup = streamLogs(
    job_id,
    (step) => push({ type: 'step', data: step }),
    (final) => {
      if (final) push({ type: 'done', data: final })
      done = true
      resolveNext?.()
      resolveNext = null
    },
  )

  try {
    while (!done || buffer.length > 0) {
      if (buffer.length === 0) {
        await new Promise<void>((r) => { resolveNext = r })
      }
      while (buffer.length > 0) {
        yield buffer.shift()!
      }
    }
  } finally {
    cleanup()
  }
}
