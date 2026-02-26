import { useEffect, useRef } from 'react'
import { useAppStore } from '../store'
import { fetchOpenRouterModels } from '../agent/llm'
import { tauriInvoke } from '../tauri'

// Refresh the model list if the cached copy is older than this threshold
const REFRESH_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Drop this hook once in the app root. It silently keeps the OpenRouter model
 * list fresh:
 *   - Fetches immediately on first mount if no models are cached yet
 *   - Re-fetches in the background if the cache is older than REFRESH_INTERVAL_MS
 *   - Re-fetches whenever the API key changes (e.g. after Settings save)
 *   - Never blocks the UI — all errors are swallowed silently
 */
export function useModelSync() {
  const apiKey = useAppStore((s) => s.apiKey)
  const modelsLastFetched = useAppStore((s) => s.modelsLastFetched)
  const openRouterModels = useAppStore((s) => s.openRouterModels)
  const setOpenRouterModels = useAppStore((s) => s.setOpenRouterModels)

  // Track the key we last fetched with so we re-fetch on key change
  const lastFetchedKey = useRef<string>('')

  useEffect(() => {
    // Sync backend model registry
    tauriInvoke<any[]>('get_model_registry')
      .then((registry) => {
        if (registry && registry.length > 0) {
          useAppStore.getState().setRouterConfig({ registry })
        }
      })
      .catch(() => { /* non-blocking */ })

    if (!apiKey?.trim()) return

    const keyChanged = lastFetchedKey.current !== apiKey.trim()
    const cacheStale = Date.now() - modelsLastFetched > REFRESH_INTERVAL_MS
    const noCache = openRouterModels.length === 0

    if (!keyChanged && !cacheStale && !noCache) return

    lastFetchedKey.current = apiKey.trim()

    fetchOpenRouterModels(apiKey.trim())
      .then((models) => {
        if (models.length > 0) setOpenRouterModels(models)
      })
      .catch(() => {
        // Silent — stale cache or static fallback remains usable
      })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey])
}
