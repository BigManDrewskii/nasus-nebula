/**
 * useAppInit.ts
 *
 * Orchestrates application initialization in a predictable sequence:
 * 1. Store hydration (wait for zustand persist to finish)
 * 2. Gateway service initialization
 * 3. Embedding model warm-up (non-blocking)
 *
 * Returns initialization status and provides retry capability.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useAppStore } from '../store'
import { tauriListen } from '../tauri'
import { createLogger } from '../lib/logger'

const log = createLogger('useAppInit')

export type InitPhase =
  | 'hydrating_store'
  | 'init_gateway'
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
  init_gateway: 50,
  warming_embeddings: 90,
  complete: 100,
  error: 0,
}

async function warmEmbeddingModel(): Promise<void> {
  try {
    const { warmEmbeddingModel: warmModel } = await import('../agent/memory/transformersEmbedding')
    warmModel()
    log.debug('Embedding model warmed')
  } catch (err) {
    log.warn('Embedding model warm-up failed (non-critical)', err instanceof Error ? err : new Error(String(err)))
  }
}

async function waitForHydration(): Promise<void> {
  return new Promise<void>((resolve) => {
    if (useAppStore.persist.hasHydrated()) {
      resolve()
      return
    }
    const startTime = Date.now()
    const checkInterval = setInterval(() => {
      if (useAppStore.persist.hasHydrated() || Date.now() - startTime > 2000) {
        clearInterval(checkInterval)
        resolve()
      }
    }, 50)
  })
}

export function useAppInit(): UseAppInitResult {
  const initGatewayService = useAppStore((s) => s.initGatewayService)
  const loadGatewayConfig = useAppStore((s) => s.loadGatewayConfig)
  const addToast = useAppStore((s) => s.addToast)
  const degradedListenedRef = useRef(false)

  const [status, setStatus] = useState<InitStatus>({
    phase: 'hydrating_store',
    error: null,
    progress: PHASE_PROGRESS.hydrating_store,
  })

  const runInitialization = useCallback(async () => {
    try {
      setStatus({ phase: 'hydrating_store', error: null, progress: PHASE_PROGRESS.hydrating_store })
      await waitForHydration()
      log.debug('Store hydrated')

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

      // Initialize memory store early so it's ready before the first task
      import('../agent/memory').then(({ initMemoryStore }) => initMemoryStore()).catch(() => {})

      setStatus({ phase: 'warming_embeddings', error: null, progress: PHASE_PROGRESS.warming_embeddings })
      warmEmbeddingModel().catch((err) => log.warn('Embedding warm-up failed', err instanceof Error ? err : new Error(String(err))))

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
