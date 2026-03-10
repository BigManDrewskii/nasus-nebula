/**
 * useSidecarHealthPoll.ts
 * Place at: src/hooks/useSidecarHealthPoll.ts
 *
 * Polls the Python sidecar health endpoint every POLL_INTERVAL_MS.
 * Exposes `isSidecarReady` boolean to the rest of the app.
 *
 * Usage in App.tsx:
 *   const { isSidecarReady, lastChecked } = useSidecarHealthPoll()
 *
 * The hook does NOT start the sidecar — it only checks whether it's up.
 * Start/stop is handled by the Tauri startSidecar() / stopSidecar() wrappers.
 */

import { useEffect, useRef, useState } from 'react'
import { healthCheck } from '../agent/sidecarClient'

const POLL_INTERVAL_MS = 4_000

export interface UseSidecarHealthPollResult {
  /** True when the sidecar responded OK to the last health check */
  isSidecarReady: boolean
  /** ISO timestamp of the last health check */
  lastChecked: string | null
  /** Trigger an immediate re-check (e.g. after the user clicks "Start Sidecar") */
  recheck: () => void
}

export function useSidecarHealthPoll(): UseSidecarHealthPollResult {
  const [isSidecarReady, setIsSidecarReady] = useState(false)
  const [lastChecked, setLastChecked] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  const runCheck = async () => {
    const ok = await healthCheck()
    if (!mountedRef.current) return
    setIsSidecarReady(ok)
    setLastChecked(new Date().toISOString())
  }

  const scheduleNext = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      await runCheck()
      if (mountedRef.current) scheduleNext()
    }, POLL_INTERVAL_MS)
  }

  useEffect(() => {
    mountedRef.current = true
    // Immediate check on mount
    void runCheck().then(() => {
      if (mountedRef.current) scheduleNext()
    })

    return () => {
      mountedRef.current = false
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const recheck = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    void runCheck().then(() => {
      if (mountedRef.current) scheduleNext()
    })
  }

  return { isSidecarReady, lastChecked, recheck }
}
