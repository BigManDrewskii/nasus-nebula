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
import type {
  GatewayConfig,
  GatewayHealth,
  GatewayEvent,
  RoutingMode,
} from './gatewayTypes'
import { DEFAULT_GATEWAYS } from './gatewayTypes'
import { selectModel, translateModelId } from './modelRegistry'

// ─── Slice Interface ────────────────────────────────────────────────────────

export interface GatewaySlice {
  // ── State ───────────────────────────────────────────────────────────────
  gateways: GatewayConfig[]
  routingMode: RoutingMode
  manualModelId: string
  gatewayHealth: GatewayHealth[]
  gatewayService: GatewayService | null
  lastGatewayEvent: GatewayEvent | null

  // ── Actions ─────────────────────────────────────────────────────────────

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
    extraHeaders: Record<string, string>
  }

  /**
   * Get the GatewayService instance for making calls with failover.
   */
  getGatewayService: () => GatewayService
}

// ─── Slice Creator ──────────────────────────────────────────────────────────

export const createGatewaySlice: StateCreator<GatewaySlice, [], [], GatewaySlice> = (set, get) => ({
  // ── Initial State ─────────────────────────────────────────────────────────
  gateways: [...DEFAULT_GATEWAYS],
  routingMode: 'auto-paid',
  manualModelId: '',
  gatewayHealth: [],
  gatewayService: null,
  lastGatewayEvent: null,

  // ── Actions ───────────────────────────────────────────────────────────────

  initGatewayService: () => {
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
      const { tauriInvoke } = await import('../tauri')
      const { gateways, routingMode, manualModelId } = get()

      // Save to tauri-plugin-store via a Tauri command
      // We serialize gateways but strip API keys for the config file —
      // keys are stored separately in the OS keychain via set_search_key pattern
      const safeGateways = gateways.map((g) => ({
        ...g,
        apiKey: g.apiKey ? '***' : '', // Don't persist keys in plaintext JSON
      }))

      await tauriInvoke('save_config', {
        apiKey: '', // Legacy — now per-gateway
        model: manualModelId || 'auto',
        workspacePath: '', // Don't overwrite
        apiBase: gateways.find((g) => g.enabled)?.apiBase ?? '',
        provider: gateways.find((g) => g.enabled)?.type ?? 'openrouter',
      })

      // Store gateway-specific config
      // TODO: When you add a save_gateway_config Tauri command, use it here
      console.log('[gateway] Config saved', { routingMode, gatewayCount: safeGateways.length })
    } catch (err) {
      console.error('[gateway] Failed to save config:', err)
    }
  },

  loadGatewayConfig: async () => {
    try {
      const { tauriInvoke } = await import('../tauri')
      const config = await tauriInvoke<{
        api_key: string
        model: string
        workspace_path: string
        api_base: string
        provider: string
      }>('get_config')

      if (!config) return

      // Migrate from legacy single-gateway config to multi-gateway
      const { gateways } = get()
      const updatedGateways = gateways.map((g) => {
        if (g.type === 'openrouter' && config.provider === 'openrouter') {
          return { ...g, apiKey: config.api_key, enabled: true }
        }
        if (g.type === config.provider) {
          return { ...g, apiBase: config.api_base, apiKey: config.api_key, enabled: true }
        }
        return g
      })

      set({ gateways: updatedGateways })

      // Determine routing mode from legacy model field
      if (config.model === 'auto' || !config.model) {
        set({ routingMode: 'auto-paid' })
      } else {
        set({ routingMode: 'manual', manualModelId: config.model })
      }

      // Sync to service
      const { gatewayService } = get()
      gatewayService?.updateGateways(updatedGateways)
    } catch (err) {
      console.error('[gateway] Failed to load config:', err)
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

    if (!primary) {
      return {
        apiBase: 'https://openrouter.ai/api/v1',
        apiKey: '',
        model: 'anthropic/claude-sonnet-4-20250514',
        provider: 'openrouter',
        extraHeaders: {},
      }
    }

    // Resolve model ID
    let modelId: string

    if (routingMode === 'manual' && manualModelId) {
      // Translate model ID to the primary gateway's format
      modelId = manualModelId
      // Check if it needs translation (e.g., user picked an OpenRouter ID but primary is Direct)
      const translated = translateModelId(manualModelId, 'openrouter', primary.type)
      if (translated !== manualModelId) modelId = translated
    } else {
      // Auto-select based on mode and gateway
      const selection = selectModel(routingMode, primary.type, manualModelId)
      modelId = selection?.modelId ?? 'anthropic/claude-sonnet-4-20250514'
    }

    return {
      apiBase: primary.apiBase,
      apiKey: primary.apiKey,
      model: modelId,
      provider: primary.type,
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
