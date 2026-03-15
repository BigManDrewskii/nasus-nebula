/**
 * Gateway Store Slice — Zustand state for gateway configuration.
 *
 * This is a "slice" that merges into your existing useAppStore.
 * It persists gateway configs to tauri-plugin-store and manages the
 * GatewayService instance.
 *
 * Integration:
 *   // In your store.ts, add this slice to the store:
 *   import { createGatewaySlice, type GatewaySlice } from './agent/gateway/gatewayStore'
 *
 *   interface AppState extends GatewaySlice { ... }
 *
 *   export const useAppStore = create<AppState>()((...a) => ({
 *     ...createGatewaySlice(...a),
 *     ...yourOtherSlices,
 *   }))
 */

import type { StateCreator } from 'zustand'
import { GatewayService } from './gatewayService'
import { createLogger } from '../../lib/logger'
import type {
  GatewayConfig,
  GatewayHealth,
  GatewayEvent,
  RoutingMode,
} from './gatewayTypes'
import { DEFAULT_GATEWAYS } from './gatewayTypes'
import { selectModel, translateModelId, findModelById } from './modelRegistry'
import type { OpenRouterModel } from '../llm'

const log = createLogger('Gateway')

// ─── Slice Interface ────────────────────────────────────────────────────────

export interface GatewaySlice {
  // ── State ───────────────────────────────────────────────────────────────
  gateways: GatewayConfig[]
  routingMode: RoutingMode
  manualModelId: string
  gatewayHealth: GatewayHealth[]
  gatewayService: GatewayService | null
  lastGatewayEvent: GatewayEvent | null
  openRouterModels: OpenRouterModel[]
  modelsLastFetched: number
  /** True once loadGatewayConfig has finished its first run. */
  gatewayConfigReady: boolean

  // ── Actions ─────────────────────────────────────────────────────────────

  setOpenRouterModels: (models: OpenRouterModel[]) => void

  /** Initialize the gateway service (call once on app startup) */
  initGatewayService: () => void

  /** Update a single gateway's config */
  updateGateway: (id: string, updates: Partial<GatewayConfig>) => void

  /** Add a new custom gateway */
  addGateway: (config: GatewayConfig) => void

  /** Remove a gateway */
  removeGateway: (id: string) => void

  /** Set routing mode */
  setRoutingMode: (mode: RoutingMode) => void

  /** Set manual model selection */
  setManualModel: (modelId: string) => void

  /** Save gateway config to persistent store */
  saveGatewayConfig: () => Promise<void>

  /** Load gateway config from persistent store */
  loadGatewayConfig: () => Promise<void>

  /** Run health check on a specific gateway */
  checkGatewayHealth: (id: string) => Promise<{ ok: boolean; latencyMs: number; error?: string }>

  /**
   * Resolve the current LLM connection params.
   * Returns (apiBase, apiKey, model, extraHeaders) for the current config.
   * Used by the execution layer to make LLM calls.
   */
  resolveConnection: () => {
    apiBase: string
    apiKey: string
    model: string
    provider: string
    gatewayId?: string
    extraHeaders: Record<string, string>
  }

  /**
   * Get the GatewayService instance for making calls with failover.
   */
  getGatewayService: () => GatewayService
}

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createGatewaySlice: StateCreator<GatewaySlice, [['zustand/immer', never]], [], GatewaySlice> = (set, get) => ({
  // ── Initial State ─────────────────────────────────────────────────────────
  gateways: [...DEFAULT_GATEWAYS],
  routingMode: 'auto-paid',
  manualModelId: '',
  gatewayHealth: [],
  gatewayService: null,
  lastGatewayEvent: null,
  openRouterModels: [],
  modelsLastFetched: 0,
  gatewayConfigReady: false,

  // ── Actions ───────────────────────────────────────────────────────────────

  setOpenRouterModels: (models) => set({ openRouterModels: models, modelsLastFetched: Date.now() }),

  initGatewayService: () => {
    // Gateways are NOT persisted (not in partialize), so gateways[0].apiKey is always ''
    // on startup. The persisted apiKey lives in the same zustand store (AppState) —
    // but we can't import useAppStore here without a circular dep.
    // Instead, we seed the key immediately after creation via updateGateways (called
    // from App.tsx after loadGatewayConfig resolves). For the first call we just
    // create the service and rely on loadGatewayConfig to push the real key.
    const { gateways } = get()
    const service = new GatewayService(gateways, (event) => {
      set({ lastGatewayEvent: event, gatewayHealth: service.getHealth() })
    })
    set({ gatewayService: service })
  },

  updateGateway: (id, updates) => {
    set((state) => ({
      gateways: state.gateways.map((g) =>
        g.id === id ? { ...g, ...updates } : g,
      ),
    }))
    // Sync to service
    const { gatewayService, gateways } = get()
    gatewayService?.updateGateways(gateways)
  },

  addGateway: (config) => {
    set((state) => ({ gateways: [...state.gateways, config] }))
    const { gatewayService, gateways } = get()
    gatewayService?.updateGateways(gateways)
  },

  removeGateway: (id) => {
    set((state) => ({
      gateways: state.gateways.filter((g) => g.id !== id),
    }))
    const { gatewayService, gateways } = get()
    gatewayService?.updateGateways(gateways)
  },

  setRoutingMode: (mode) => set({ routingMode: mode }),

  setManualModel: (modelId) => set({ manualModelId: modelId }),

    saveGatewayConfig: async () => {
      try {
        const { tauriInvoke } = await import('../../tauri')
        const { gateways, routingMode, manualModelId } = get()

        // The Rust GatewayConfig uses `gateway_type` (serialized as `gatewayType`),
        // but the frontend type uses `type`. Map before sending so Rust can deserialize.
        const rustGateways = gateways.map(({ type: gatewayType, ...rest }) => ({
          ...rest,
          gatewayType,
        }))

        await tauriInvoke('save_gateways', { gateways: rustGateways })

      // Also keep the legacy single-gateway config in sync so older code paths work
      const primary = gateways.find((g) => g.enabled) ?? gateways[0]
      if (primary) {
        await tauriInvoke('save_config', {
          apiKey: primary.apiKey ?? '',
          model: manualModelId || 'auto',
          workspacePath: '',
          apiBase: primary.apiBase,
          provider: primary.type,
        })
      }

        log.info('Config saved', { routingMode, gatewayCount: gateways.length })
    } catch (err) {
      log.error('Failed to save config', err instanceof Error ? err : new Error(String(err)))
    }
  },

    loadGatewayConfig: async () => {
      try {
        const { tauriInvoke } = await import('../../tauri')

        // Primary: restore full gateway configs (including per-provider keys) from
        // the Tauri secure store via save_gateways / get_gateways.
          // Rust returns `gatewayType` (from snake_case gateway_type) — map back to `type`
          // so the rest of the frontend codebase never sees `gatewayType`.
          type RustGateway = Omit<GatewayConfig, 'type'> & { gatewayType?: GatewayConfig['type']; type?: GatewayConfig['type'] }
          const rawGateways = await tauriInvoke<RustGateway[]>('get_gateways').catch(() => null)
          const savedGateways: GatewayConfig[] | null = rawGateways
            ? rawGateways.map(({ gatewayType, type, ...rest }) => ({
                ...rest,
                type: (type ?? gatewayType ?? 'custom') as GatewayConfig['type'],
              }))
            : null

        // Fallback: read the legacy single-key config for backward compatibility
        const config = await tauriInvoke<{
          api_key: string
          model: string
          workspace_path: string
          api_base: string
          provider: string
        }>('get_config').catch(() => null)

        // Load per-provider keys from OS keyring — the most reliable persistence path
        const [dsKeyringKey, anthropicKeyringKey] = await Promise.all([
          tauriInvoke<string>('get_provider_key', { provider: 'deepseek' }).catch(() => ''),
          tauriInvoke<string>('get_provider_key', { provider: 'anthropic' }).catch(() => ''),
        ])

        const { gateways: currentGateways } = get()

        let updatedGateways: GatewayConfig[]

          if (savedGateways && savedGateways.length > 0) {
          // Merge saved gateway config into defaults.
          // Note: Rust serializes with camelCase, so apiKey/apiBase are correct but
          // gatewayType != type — we merge only the fields that exist on the JS type.
          updatedGateways = currentGateways.map(g => {
            const saved = savedGateways.find(s => s.id === g.id)
            if (!saved) return g
            return {
              ...g,
              apiKey: saved.apiKey || g.apiKey,          // never overwrite a real key with empty string
              apiBase: saved.apiBase ?? g.apiBase,
              enabled: saved.enabled ?? g.enabled,
              priority: saved.priority ?? g.priority,
              label: saved.label ?? g.label,
              extraHeaders: saved.extraHeaders ?? g.extraHeaders,
            }
          })
        } else if (config) {
          // Legacy migration path — only one key was ever saved
          let resolvedKey = config.api_key
          if (!resolvedKey) {
            try {
              const { useAppStore } = await import('../../store')
              resolvedKey = useAppStore.getState().apiKey
            } catch { /* ignore */ }
          }
          updatedGateways = currentGateways.map((g) => {
            if (g.type === config.provider) {
              return { ...g, apiKey: resolvedKey, enabled: true }
            }
            if (g.type !== 'ollama') return { ...g, enabled: false }
            return g
          })
        } else {
          updatedGateways = currentGateways
        }

        // Overlay keyring keys — these take priority over everything else since they
        // are written by SettingsPanel.checkAndSave and are the most up-to-date values
        updatedGateways = updatedGateways.map(g => {
          if (g.id === 'deepseek' && dsKeyringKey) return { ...g, apiKey: dsKeyringKey }
          if (g.id === 'anthropic' && anthropicKeyringKey) return { ...g, apiKey: anthropicKeyringKey, enabled: true }
          return g
        })

        set({ gateways: updatedGateways })

        // Sync the active provider's key into store.apiKey for the needsKey guard
        const activeProvider = config?.provider || currentGateways.find(g => g.enabled)?.type || 'deepseek'
        const activeGateway = updatedGateways.find(g => g.type === activeProvider || g.id === activeProvider)
        const resolvedKey = activeGateway?.apiKey || config?.api_key || ''
        if (resolvedKey) {
          try {
            const { useAppStore } = await import('../../store')
            useAppStore.getState().setApiKey(resolvedKey)
          } catch { /* ignore */ }
        }

        // Determine routing mode from legacy model field
        if (!config || config.model === 'auto' || !config.model) {
          set({ routingMode: 'auto-paid' })
        } else {
          set({ routingMode: 'manual', manualModelId: config.model })
        }

        // Sync to service
        const { gatewayService } = get()
        gatewayService?.updateGateways(updatedGateways)

        // Mark config as loaded so handleSend can proceed
        set({ gatewayConfigReady: true })
      } catch (err) {
        // Tauri not available (browser mode) — recover keys from sessionStorage.
        // Gateway keys are intentionally stripped from Zustand's localStorage persist
        // (partialize zeroes them out). When the user saves settings, SettingsPanel
        // writes each provider's key to sessionStorage under 'nasus:key:<provider>'.
        // We read them back here so the gateway layer has valid keys during dev/HMR.
        try {
          const activeProvider = (() => {
            try { return sessionStorage.getItem('nasus:active-provider') } catch { return null }
          })() || (await import('../../store')).useAppStore.getState().provider || 'deepseek'

          const keyForProvider = (id: string) => {
            try { return sessionStorage.getItem(`nasus:key:${id}`) ?? '' } catch { return '' }
          }

          const { gateways } = get()
          const synced = gateways.map((g) => {
            const key = keyForProvider(g.type)
            if (g.type === activeProvider && g.type !== 'ollama') {
              return { ...g, apiKey: key, enabled: true }
            }
            if (g.type !== 'ollama') {
              // Keep the key in case the user has it stored, but disable the gateway
              return { ...g, apiKey: key || g.apiKey, enabled: false }
            }
            return g
          })
          set({ gateways: synced })
          const { gatewayService } = get()
          gatewayService?.updateGateways(synced)

          // Also sync the active key back into store.apiKey for the needsKey guard
          const activeKey = keyForProvider(activeProvider)
          if (activeKey) {
            try {
              const { useAppStore } = await import('../../store')
              useAppStore.getState().setApiKey(activeKey)
            } catch { /* ignore */ }
          }
        } catch {
          // ignore
        }
          log.error('Failed to load config', err instanceof Error ? err : new Error(String(err)))
        // Mark ready even on error so the UI doesn't stay stuck waiting
        set({ gatewayConfigReady: true })
      }
    },

  checkGatewayHealth: async (id) => {
    const { gatewayService } = get()
    if (!gatewayService) return { ok: false, latencyMs: 0, error: 'Service not initialized' }
    const result = await gatewayService.healthCheck(id)
    set({ gatewayHealth: gatewayService.getHealth() })
    return result
  },

  resolveConnection: () => {
    const { gateways, routingMode, manualModelId } = get()

    // Find the primary enabled gateway
    const primary = gateways
      .filter((g) => g.enabled)
      .sort((a, b) => a.priority - b.priority)[0]

    // Sensible per-gateway fallback model IDs when auto-selection produces nothing
    const FALLBACK_MODELS: Partial<Record<string, string>> = {
      deepseek: 'deepseek-chat',
      ollama: 'llama3.3:70b',
      custom: '',
    }

    // Grab the legacy store key as a last-resort fallback.
    // store.apiKey is populated by loadGatewayConfig (via setApiKey) and by
    // SettingsPanel.checkAndSave. It will be '' after a cold rehydration
    // (partialize strips it) but non-empty once loadGatewayConfig has run.
    // get() is typed as GatewaySlice but at runtime the merged AppState includes
    // legacy apiKey/provider/apiBase — we access them via a widened type.
    type LegacyFields = { apiKey?: string; provider?: string; apiBase?: string }
    const legacyState = get() as GatewaySlice & LegacyFields
    const legacyKey = legacyState.apiKey ?? ''

    if (!primary) {
      // No enabled gateway — best-effort: use the legacy key with the persisted provider
      const legacyProvider = legacyState.provider ?? 'deepseek'
      const legacyBase = legacyState.apiBase ?? 'https://api.deepseek.com/v1'
      return {
        apiBase: legacyBase,
        apiKey: legacyKey,
        model: FALLBACK_MODELS[legacyProvider] ?? '',
        provider: legacyProvider,
        extraHeaders: {},
      }
    }

    const fallbackModel = FALLBACK_MODELS[primary.type] ?? ''

    // Resolve model ID
    let modelId: string

      if (routingMode === 'manual' && manualModelId) {
        // Find the registry entry for this model ID regardless of which gateway format it's in.
        // e.g. manualModelId='deepseek-chat' (DeepSeek direct) on an OpenRouter gateway
        // must resolve to 'deepseek/deepseek-chat', not pass through unchanged.
        const registryEntry = findModelById(manualModelId)
        if (registryEntry) {
          // We have a canonical entry — use the ID for the active gateway, fall back to
          // the stored ID only if the active gateway doesn't have a mapping.
          modelId = registryEntry.ids[primary.type] ?? manualModelId
        } else {
          // Not in registry — try a directional translate from every known gateway format.
          // This handles cases like OpenRouter slugs stored while on a direct gateway.
          const allGatewayTypes: Array<import('./gatewayTypes').GatewayType> = ['deepseek', 'ollama', 'litellm', 'direct', 'custom']
          let resolved = manualModelId
          for (const fromGateway of allGatewayTypes) {
            if (fromGateway === primary.type) continue
            const candidate = translateModelId(manualModelId, fromGateway, primary.type)
            if (candidate !== manualModelId) { resolved = candidate; break }
          }
          modelId = resolved
        }

      } else {
      // Auto-select based on mode and gateway
      const selection = selectModel(routingMode, primary.type, manualModelId, get().openRouterModels)
      modelId = selection?.modelId ?? fallbackModel
    }

    // If the gateway's own key is empty (e.g., after rehydration wipes it), fall
    // back to the store-level apiKey so we always have the best available key.
    const resolvedKey = primary.apiKey || legacyKey

    return {
      apiBase: primary.apiBase,
      apiKey: resolvedKey,
      model: modelId,
      provider: primary.type,
      gatewayId: primary.id,
      extraHeaders: primary.extraHeaders ?? {},
    }
  },

  getGatewayService: () => {
    const { gatewayService } = get()
    if (!gatewayService) {
      // Auto-initialize if not yet done
      get().initGatewayService()
      return get().gatewayService!
    }
    return gatewayService
  },
})
