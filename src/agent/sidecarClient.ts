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

export interface HealthStatus {
  status: string
  llm_configured: boolean
  version?: string
  active_jobs?: number
}

export interface ApprovalResponse {
  job_id: string
  subtask_id: string
  decision: 'approved' | 'rejected'
}

export interface WorkspaceFile {
  name: string
  size: number
  created_at: string
}

export interface WorkspaceListResponse {
  session_id: string
  files: WorkspaceFile[]
  count: number
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
 * Full health status including llm_configured flag.
 */
export async function healthStatus(): Promise<HealthStatus | null> {
  try {
    const res = await fetch(`${SIDECAR_BASE}/health`, { method: 'GET' })
    if (!res.ok) return null
    return res.json() as Promise<HealthStatus>
  } catch {
    return null
  }
}

/**
 * Configure the sidecar LLM credentials directly (bypasses Tauri IPC).
 */
export async function configureSidecar(config: {
  api_key: string
  api_base: string
  model: string
  exa_key?: string
  brave_key?: string
  serper_key?: string
}): Promise<boolean> {
  try {
    const res = await fetch(`${SIDECAR_BASE}/configure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    })
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

// ─── HITL checkpoint types + approval ────────────────────────────────────────

export interface CheckpointApproval {
  subtask_id: string
  module: string
  instruction: string
}

export interface CheckpointPayload {
  output_type: 'CHECKPOINT'
  session_id: string
  plan_id: string
  goal: string
  pending_approvals: CheckpointApproval[]
  created_at: string
}

/**
 * Resume execution after all HITL decisions have been recorded.
 * Returns a new {job_id} for the continuation stream.
 */
export async function resumeTask(jobId: string): Promise<TaskResponse> {
  return sidecarFetch<TaskResponse>(`/task/${jobId}/resume`, { method: 'POST' })
}

/**
 * Approve a subtask that was paused at a HITL checkpoint.
 */
export async function approveSubtask(
  jobId: string,
  subtaskId: string,
): Promise<ApprovalResponse> {
  return sidecarFetch<ApprovalResponse>(`/task/${jobId}/approve`, {
    method: 'POST',
    body: JSON.stringify({ subtask_id: subtaskId }),
  })
}

/**
 * Reject a subtask that was paused at a HITL checkpoint.
 */
export async function rejectSubtask(
  jobId: string,
  subtaskId: string,
): Promise<ApprovalResponse> {
  return sidecarFetch<ApprovalResponse>(`/task/${jobId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ subtask_id: subtaskId }),
  })
}

// ─── Workspace helpers ────────────────────────────────────────────────────────

/**
 * List all artifact files for a session workspace.
 */
export async function listWorkspace(sessionId: string): Promise<WorkspaceListResponse> {
  return sidecarFetch<WorkspaceListResponse>(`/workspace/${sessionId}`)
}

/**
 * Retrieve the content of a specific artifact file.
 * Returns parsed JSON if the file is JSON, otherwise the raw text.
 */
export async function getArtifact(sessionId: string, filename: string): Promise<unknown> {
  return sidecarFetch<unknown>(`/workspace/${sessionId}/${filename}`)
}

/**
 * Delete all artifact files for a session workspace.
 */
export async function deleteWorkspace(
  sessionId: string,
): Promise<{ session_id: string; deleted_count: number }> {
  return sidecarFetch<{ session_id: string; deleted_count: number }>(
    `/workspace/${sessionId}`,
    { method: 'DELETE' },
  )
}

/**
 * Stream events for an already-submitted job (e.g. a resumed checkpoint job).
 * Unlike runTask, this does NOT call postTask — it streams an existing job_id.
 */
export async function* streamJobEvents(jobId: string): AsyncGenerator<SidecarEvent> {
  const initial = await pollStatus(jobId)
  yield { type: 'status', data: initial }

  const buffer: SidecarEvent[] = []
  let done = false
  let resolveNext: (() => void) | null = null

  const push = (event: SidecarEvent) => {
    buffer.push(event)
    resolveNext?.()
    resolveNext = null
  }

  const cleanup = streamLogs(
    jobId,
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
