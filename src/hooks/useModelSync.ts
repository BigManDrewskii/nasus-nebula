import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import type { ModelInfo } from '../store'
import { fetchOpenRouterModels, fetchVercelModels } from '../agent/llm'
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
  const openRouterModels = useAppStore((s) => s.openRouterModels)
  const vercelModels = useAppStore((s) => s.vercelModels)
  const setOpenRouterModels = useAppStore((s) => s.setOpenRouterModels)
  const setVercelModels = useAppStore((s) => s.setVercelModels)

  // Get gateway configs
  const gateways = useAppStore((s) => s.gateways)
  const vercelGateway = gateways.find((g) => g.type === 'vercel')

  // Track the keys we last fetched with so we re-fetch on key change
  const lastFetchedKey = useRef<string>('')
  const lastFetchedVercelKey = useRef<string>('')

  useEffect(() => {
    // Sync backend model registry
    tauriInvoke<ModelInfo[]>('get_model_registry')
      .then((registry) => {
        if (registry && registry.length > 0) {
          useAppStore.getState().setRouterConfig({ registry })
        }
      })
      .catch(err => {
        log.warn('Failed to sync backend model registry', err)
        // Non-blocking: stale registry or static fallback remains usable
      })

    // Fetch OpenRouter models
    if (apiKey?.trim()) {
      const keyChanged = lastFetchedKey.current !== apiKey.trim()
      const cacheStale = Date.now() - modelsLastFetched > MODEL_REFRESH_INTERVAL_MS
      const noCache = openRouterModels.length === 0

      if (keyChanged || cacheStale || noCache) {
        lastFetchedKey.current = apiKey.trim()

        fetchOpenRouterModels(apiKey.trim())
          .then((models) => {
            if (models.length > 0) setOpenRouterModels(models)
          })
          .catch(err => {
            log.warn('Failed to fetch OpenRouter models', err)
          })
      }
    }

    // Fetch Vercel models
    const vercelKey = vercelGateway?.apiKey?.trim()
    if (vercelKey) {
      const keyChanged = lastFetchedVercelKey.current !== vercelKey
      const vercelCacheStale = Date.now() - modelsLastFetched > MODEL_REFRESH_INTERVAL_MS
      const noVercelCache = vercelModels.length === 0

      if (keyChanged || vercelCacheStale || noVercelCache) {
        lastFetchedVercelKey.current = vercelKey

        fetchVercelModels(vercelKey)
          .then((models) => {
            if (models.length > 0) setVercelModels(models)
          })
          .catch(err => {
            log.warn('Failed to fetch Vercel models', err)
          })
      }
    }
  }, [
    apiKey,
    vercelGateway?.apiKey,
    modelsLastFetched,
    openRouterModels.length,
    vercelModels.length,
    setOpenRouterModels,
    setVercelModels,
  ])
}
