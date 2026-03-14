/**
 * Sidecar Memory Bridge
 *
 * Thin, non-blocking bridge between the TypeScript MemoryStore (Tauri SQLite)
 * and the Python sidecar's M09 MemoryStore (~/.nasus/memory.db).
 *
 * Flow:
 *   TS → M09  facts saved via SaveMemoryTool are mirrored to M09 semantic layer
 *   M09 → TS  M09 semantic facts are merged into readProjectMemory() output
 *
 * All exported functions swallow errors silently — the bridge must never block
 * the main agent path. Short timeouts ensure fast failure when the sidecar
 * is unavailable.
 */

const SIDECAR_BASE = 'http://127.0.0.1:4751'
const CALL_TIMEOUT_MS = 800   // per individual HTTP call
const POLL_TIMEOUT_MS = 3000  // total polling budget for one M09 job

// ── Internal types ────────────────────────────────────────────────────────────

interface _M09SubmitResp {
  job_id: string
}

interface _M09StatusResp {
  status: 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'
  payload?: unknown
}

interface _SemanticFact {
  key: string
  value: unknown
  source: string
  confidence: number
  last_updated: string
}

interface _M09ReadResult {
  status: 'hit' | 'miss' | 'error'
  data?: Record<string, _SemanticFact>
}

// ── Transport helpers ─────────────────────────────────────────────────────────

async function _submitM09(payload: Record<string, unknown>): Promise<string> {
  const resp = await fetch(`${SIDECAR_BASE}/task`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ module_id: 'M09', payload }),
    signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
  })
  if (!resp.ok) throw new Error(`M09 submit ${resp.status}`)
  return ((await resp.json()) as _M09SubmitResp).job_id
}

async function _pollM09(jobId: string): Promise<unknown> {
  const deadline = Date.now() + POLL_TIMEOUT_MS
  while (Date.now() < deadline) {
    await new Promise<void>(r => setTimeout(r, 200))
    let resp: Response
    try {
      resp = await fetch(`${SIDECAR_BASE}/task/${jobId}/status`, {
        signal: AbortSignal.timeout(CALL_TIMEOUT_MS),
      })
    } catch {
      continue
    }
    if (!resp.ok) continue
    const s = (await resp.json()) as _M09StatusResp
    if (s.status === 'DONE') return s.payload
    if (s.status === 'FAILED') throw new Error('M09 job failed')
  }
  throw new Error('M09 bridge timed out')
}

async function _callM09(payload: Record<string, unknown>): Promise<unknown> {
  const jobId = await _submitM09(payload)
  return _pollM09(jobId)
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Read all facts from the M09 semantic layer as plain strings.
 * Returns [] on any error (sidecar unavailable, timeout, bad shape, etc.).
 */
export async function readM09SemanticFacts(): Promise<string[]> {
  try {
    const raw = await _callM09({ action: 'read', layer: 'semantic' })
    const result = raw as _M09ReadResult
    if (result.status !== 'hit' || !result.data) return []
    return Object.values(result.data)
      .map(f => {
        const v = f?.value
        if (typeof v === 'string') return v
        if (v != null) return JSON.stringify(v)
        return ''
      })
      .filter(s => s.length > 0)
  } catch {
    return []
  }
}

/**
 * Write a fact string to the M09 semantic layer.
 * Fire-and-forget — resolves immediately, never throws.
 */
export function writeM09SemanticFact(fact: string): void {
  const key = `ts_agent_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`
  void _callM09({
    action: 'write',
    layer: 'semantic',
    key,
    value: fact,
    metadata: { source: 'ts_agent', confidence: 0.9 },
  }).catch(() => {
    // Best-effort write — silently discard on sidecar unavailability
  })
}
