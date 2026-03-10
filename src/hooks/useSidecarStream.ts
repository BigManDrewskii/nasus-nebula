/**
 * useSidecarStream.ts
 * Place at: src/hooks/useSidecarStream.ts
 *
 * React hook that opens an SSE stream to /task/{jobId}/stream and
 * accumulates step events into component state as AgentStep objects.
 *
 * Usage:
 *   const { steps, done, error, cancel } = useSidecarStream(jobId)
 *
 * Pass jobId=null (or undefined) to keep the hook dormant.
 * The hook auto-cancels the stream on unmount.
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import type { SidecarStep } from '../agent/sidecarClient'

// ─── Mapped step type (matches existing AgentStep store shape) ────────────────

export interface StreamedAgentStep {
  id: string
  /** Mapped from SidecarStep.type */
  type: 'thought' | 'tool' | 'result' | 'error' | 'log'
  content: string
  tool?: string
  toolInput?: Record<string, unknown>
  toolOutput?: string
  timestamp: string
  /** The raw sidecar step number */
  stepIndex: number
}

function mapSidecarStep(raw: SidecarStep): StreamedAgentStep {
  let type: StreamedAgentStep['type']
  switch (raw.type) {
    case 'tool_call':    type = 'tool';    break
    case 'observation':  type = 'result';  break
    case 'error':        type = 'error';   break
    case 'log':          type = 'log';     break
    case 'plan':
    case 'final':
    default:             type = 'thought'; break
  }
  return {
    id: `stream-step-${raw.step}`,
    type,
    content: raw.content,
    tool: raw.tool,
    toolInput: raw.tool_input as Record<string, unknown> | undefined,
    toolOutput: raw.tool_output as string | undefined,
    timestamp: raw.timestamp,
    stepIndex: raw.step,
  }
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export interface UseSidecarStreamResult {
  /** Accumulated steps received so far */
  steps: StreamedAgentStep[]
  /** True when the sidecar emitted the 'done' event or the stream closed cleanly */
  done: boolean
  /** Error message if the stream failed */
  error: string | null
  /** Manually cancel the stream (also called automatically on unmount) */
  cancel: () => void
}

const SIDECAR_BASE = 'http://127.0.0.1:4751'

export function useSidecarStream(
  jobId: string | null | undefined,
): UseSidecarStreamResult {
  const [steps, setSteps] = useState<StreamedAgentStep[]>([])
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const closedRef = useRef(false)

  const cancel = useCallback(() => {
    if (!closedRef.current) {
      esRef.current?.close()
      esRef.current = null
      closedRef.current = true
    }
  }, [])

  useEffect(() => {
    if (!jobId) return

    // Reset state for new jobId
    setSteps([])
    setDone(false)
    setError(null)
    closedRef.current = false

    const es = new EventSource(`${SIDECAR_BASE}/task/${jobId}/stream`)
    esRef.current = es

    es.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data) as SidecarStep
        if (typeof raw.step === 'number') {
          const mapped = mapSidecarStep(raw)
          setSteps((prev) => [...prev, mapped])
        }
      } catch {
        // Ignore malformed frames
      }
    }

    es.addEventListener('done', () => {
      setDone(true)
      es.close()
      closedRef.current = true
    })

    es.onerror = () => {
      if (!closedRef.current) {
        setError('Stream connection lost')
        setDone(true)
        es.close()
        closedRef.current = true
      }
    }

    return () => {
      if (!closedRef.current) {
        es.close()
        closedRef.current = true
      }
    }
  }, [jobId])

  return { steps, done, error, cancel }
}
