import { useEffect } from 'react'
import { useAppStore } from '../store'
import type { ModelInfo } from '../store'
import { tauriInvoke } from '../tauri'
import { createLogger } from '../lib/logger'

const log = createLogger('useModelSync')

/**
 * Drop this hook once in the app root. It silently keeps the backend model
 * registry in sync with the frontend store. Errors are swallowed silently.
 */
export function useModelSync() {
  useEffect(() => {
    tauriInvoke<ModelInfo[]>('get_model_registry')
      .then((registry) => {
        if (registry && registry.length > 0) {
          useAppStore.getState().setRouterConfig({ registry })
        }
      })
      .catch((err: unknown) => {
        log.warn('Failed to sync backend model registry', err instanceof Error ? err : new Error(String(err)))
      })
  }, [])
}
