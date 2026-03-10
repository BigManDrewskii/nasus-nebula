import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import type { ModelInfo } from '../store'
import { fetchOpenRouterModels } from '../agent/llm'
import { tauriInvoke } from '../tauri'
import { createLogger } from '../lib/logger'
import { MODEL_REFRESH_INTERVAL_MS } from '../lib/constants'

const log = createLogger('useModelSync')

/**
 * Drop this hook once in the app root. It silently keeps the model list fresh:
 *   - Fetches immediately on first mount if no models are cached yet
 *   - Re-fetches in the background if the cache is older than REFRESH_INTERVAL_MS
 *   - Re-fetches whenever the API key changes (e.g. after Settings save)
 *   - Never blocks the UI — all errors are swallowed silently
 */
export function useModelSync() {
  const apiKey = useAppStore((s) => s.apiKey)
  const modelsLastFetched = useAppStore((s) => s.modelsLastFetched)
  // Read length via getState() inside the effect to avoid it being a dep that causes a refetch loop
  const setOpenRouterModels = useAppStore((s) => s.setOpenRouterModels)

  // Track the keys we last fetched with so we re-fetch on key change
  const lastFetchedKey = useRef<string>('')

  useEffect(() => {
    // Sync backend model registry
    tauriInvoke<ModelInfo[]>('get_model_registry')
      .then((registry) => {
        if (registry && registry.length > 0) {
          useAppStore.getState().setRouterConfig({ registry })
        }
      })
      .catch((err: unknown) => {
        log.warn('Failed to sync backend model registry', err instanceof Error ? err : new Error(String(err)))
        // Non-blocking: stale registry or static fallback remains usable
      })

      // Fetch OpenRouter models
      if (apiKey?.trim()) {
        const keyChanged = lastFetchedKey.current !== apiKey.trim()
        const cacheStale = Date.now() - modelsLastFetched > MODEL_REFRESH_INTERVAL_MS
        // Read current length from store snapshot to avoid adding it as a dep
        const noCache = useAppStore.getState().openRouterModels.length === 0

        if (keyChanged || cacheStale || noCache) {
        lastFetchedKey.current = apiKey.trim()

          fetchOpenRouterModels(apiKey.trim())
            .then((models) => {
              if (models.length > 0) setOpenRouterModels(models)
          })
          .catch((err: unknown) => {
            log.warn('Failed to fetch OpenRouter models', err instanceof Error ? err : new Error(String(err)))
          })
      }
    }
  }, [
    apiKey,
    modelsLastFetched,
    setOpenRouterModels,
  ])
}
