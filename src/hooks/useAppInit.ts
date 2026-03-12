/**
 * useAppInit.ts
 *
 * Orchestrates application initialization in a predictable sequence:
 * 1. Store hydration (wait for zustand persist to finish)
 * 2. Gateway service initialization
 * 3. Sidecar health check
 * 4. Embedding model warm-up (non-blocking)
 *
 * Returns initialization status and provides retry capability.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { healthCheck } from '../agent/sidecarClient'
import { tauriListen } from '../tauri'
import { createLogger } from '../lib/logger'

const log = createLogger('useAppInit')

export type InitPhase =
  | 'hydrating_store'
  | 'init_gateway'
  | 'checking_sidecar'
  | 'warming_embeddings'
  | 'complete'
  | 'error'

export interface InitError {
  phase: InitPhase
  message: string
  recoverable: boolean
}

export interface InitStatus {
  phase: InitPhase
  error: InitError | null
  progress: number // 0-100
}

export interface UseAppInitResult {
  status: InitStatus
  isReady: boolean
  retry: () => void
}

const PHASE_PROGRESS: Record<InitPhase, number> = {
  hydrating_store: 10,
  init_gateway: 40,
  checking_sidecar: 70,
  warming_embeddings: 90,
  complete: 100,
  error: 0,
}

/**
 * Initialize the embedding model (non-blocking, non-critical)
 */
async function warmEmbeddingModel(): Promise<void> {
  try {
    const { warmEmbeddingModel: warmModel } = await import('../agent/memory/transformersEmbedding')
    warmModel()
    log.debug('Embedding model warmed')
  } catch (err) {
    log.warn('Embedding model warm-up failed (non-critical)', err instanceof Error ? err : new Error(String(err)))
  }
}

/**
 * Check sidecar health (non-blocking if fails)
 */
async function checkSidecarHealth(): Promise<boolean> {
  try {
    const isHealthy = await healthCheck()
    if (!isHealthy) {
      log.warn('Sidecar not responding')
    }
    return isHealthy
  } catch {
    return false
  }
}

/**
 * Wait for zustand persist hydration to complete
 */
async function waitForHydration(): Promise<void> {
  return new Promise<void>((resolve) => {
    // Use zustand persist's built-in hasHydrated method
    if (useAppStore.persist.hasHydrated()) {
      resolve()
      return
    }
    // Poll for hydration completion (max 2 seconds)
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (useAppStore.persist.hasHydrated() || Date.now() - startTime > 2000) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)
  })
}

/**
 * Main initialization hook
 */
export function useAppInit(): UseAppInitResult {
  // Store access
  const initGatewayService = useAppStore((s) => s.initGatewayService)
  const loadGatewayConfig = useAppStore((s) => s.loadGatewayConfig)
  const addToast = useAppStore((s) => s.addToast)
  const degradedListenedRef = useRef(false)

  // State
  const [status, setStatus] = useState<InitStatus>({
    phase: 'hydrating_store',
    error: null,
    progress: PHASE_PROGRESS.hydrating_store,
  })

  const runInitialization = useCallback(async () => {
    try {
      // Phase 1: Wait for store hydration
      setStatus({ phase: 'hydrating_store', error: null, progress: PHASE_PROGRESS.hydrating_store })

      await waitForHydration()
      log.debug('Store hydrated')

      // Phase 2: Initialize gateway service
      setStatus({ phase: 'init_gateway', error: null, progress: PHASE_PROGRESS.init_gateway })

      try {
        initGatewayService()
        await loadGatewayConfig()
        log.debug('Gateway service initialized')
      } catch (err) {
        log.error('Gateway initialization failed', err instanceof Error ? err : new Error(String(err)))
        setStatus({
          phase: 'error',
          error: {
            phase: 'init_gateway',
            message: err instanceof Error ? err.message : 'Failed to initialize gateway',
            recoverable: true,
          },
          progress: 0,
        })
        return
      }

      // Phase 3: Check sidecar (non-blocking failure)
      setStatus({ phase: 'checking_sidecar', error: null, progress: PHASE_PROGRESS.checking_sidecar })

      const sidecarOk = await checkSidecarHealth()
      if (!sidecarOk) {
        log.warn('Sidecar health check failed - continuing anyway')
      } else {
        // Sidecar is up — push LLM credentials from the gateway system so modules
        // can make LLM calls without the user having to re-enter their API key.
        // Use resolveConnection() — store.apiBase may be stale (DeepSeek URL from
        // a previous session); the gateway slice always has the correct per-provider apiBase.
        const conn = useAppStore.getState().resolveConnection()
        if (conn.apiKey) {
          import('../tauri').then(({ tauriInvoke }) =>
            tauriInvoke('nasus_configure_llm', {
              config: {
                api_key: conn.apiKey,
                api_base: conn.apiBase,
                model: conn.model || 'openai/gpt-4o-mini',
              },
            })
          ).catch(() => {})
        }
      }

      // Phase 3.5: Initialize memory store early so it's ready before the first task
      import('../agent/memory').then(({ initMemoryStore }) => initMemoryStore()).catch(() => {})

      // Phase 4: Warm embedding model (background, non-blocking)
      setStatus({ phase: 'warming_embeddings', error: null, progress: PHASE_PROGRESS.warming_embeddings })

      // Don't await - let it warm in background
      warmEmbeddingModel().catch((err) => log.warn('Embedding warm-up failed', err instanceof Error ? err : new Error(String(err))))

      // Complete
      setStatus({ phase: 'complete', error: null, progress: PHASE_PROGRESS.complete })
    } catch (err) {
      log.error('Initialization failed', err instanceof Error ? err : new Error(String(err)))
      setStatus({
        phase: 'error',
        error: {
          phase: 'hydrating_store',
          message: err instanceof Error ? err.message : 'Initialization failed',
          recoverable: true,
        },
        progress: 0,
      })
    }
  }, [initGatewayService, loadGatewayConfig])

  // Listen for backend degraded-mode event (e.g. SQLite failed to open)
  useEffect(() => {
    if (degradedListenedRef.current) return
    degradedListenedRef.current = true

    let unlisten: (() => void) | undefined
    tauriListen('app:degraded-mode', (event) => {
      const e = event as { payload?: { message?: string } } | null
      const msg = e?.payload?.message ?? 'Database unavailable — task history and memory are disabled.'
      addToast(msg, 'amber')
    }).then((fn) => { unlisten = fn }).catch(() => { /* not in Tauri */ })

    return () => { unlisten?.() }
  }, [addToast])

  // Run initialization on mount
  useEffect(() => {
    runInitialization()
  }, [runInitialization])

  const retry = useCallback(() => {
    log.debug('Retrying initialization')
    runInitialization()
  }, [runInitialization])

  return {
    status,
    isReady: status.phase === 'complete',
    retry,
  }
}
