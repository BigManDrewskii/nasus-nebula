import type { StateCreator } from 'zustand'
import { updateGlobalRateLimiterConfig } from '../agent/gateway/rateLimiter'
import { DEFAULT_MAX_ITERATIONS } from '../lib/constants'
import { createLogger } from '../lib/logger'

const log = createLogger('Settings')

/**
 * Push LLM credentials to the Python sidecar.
 * Fire-and-forget — silently swallows errors because the sidecar may not be
 * running yet (the NasusAgentTool readiness guard handles that case).
 */
async function _pushLlmConfigToSidecar(apiKey: string, apiBase: string, model: string): Promise<void> {
  try {
    const { tauriInvoke } = await import('../tauri')
    await tauriInvoke('nasus_configure_llm', {
      config: {
        api_key: apiKey,
        api_base: apiBase || 'https://openrouter.ai/api/v1',
        model: model || 'openai/gpt-4o-mini',
      },
    })
  } catch {
    // Sidecar not running — will be configured on next checkNasusInstalled() call
  }
}

// ── Router config types ────────────────────────────────────────────────────

export type ToolCallingSupport = 'Strong' | 'Moderate' | 'Weak' | 'Unknown'
export type CostTier = 'Free' | 'Budget' | 'Standard' | 'Premium'
export type ModelProvider = 'Anthropic' | 'OpenAI' | 'Google' | 'DeepSeek' | 'Meta' | 'Mistral' | 'XAI' | 'Other'

export interface ModelCapabilities {
  reasoning: number
  coding: number
  writing: number
  speed: number
  instruction_following: number
}

export interface ModelInfo {
  id: string
  display_name: string
  provider: ModelProvider
  capabilities: ModelCapabilities
  tool_calling: ToolCallingSupport
  cost_tier: CostTier
  context_window: number
  enabled: boolean
}

export interface RouterModelOverrides {
  [modelId: string]: boolean
}

export interface RouterConfig {
  /** 'auto' or a specific model ID */
  mode: string
  /** 'free' | 'paid' */
  budget: string
  modelOverrides: RouterModelOverrides
  /** Full model registry sync'd from backend */
  registry?: ModelInfo[]
}

/** Per-task router state emitted by the Rust backend */
export interface TaskRouterState {
  modelId: string
  displayName: string
  reason: string
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  callCount: number
  isFree: boolean
  /** Cumulative token usage for this task */
  tokenUsage?: TaskTokenUsage
}

export interface TaskTokenUsage {
  totalPromptTokens: number
  totalCompletionTokens: number
  totalTokens: number
  estimatedCost: number       // USD, calculated from model pricing
  contextUtilization: number  // 0-1, current prompt size / model context window
}

// ── Slice definition ──────────────────────────────────────────────────────

export type TextScale = 'compact' | 'default'

export interface SettingsSlice {
  apiKey: string
  model: string
  workspacePath: string
  recentWorkspacePaths: string[]
  apiBase: string
  provider: string
  /** Exa AI API key for web search */
  exaKey: string
  maxIterations: number
  /** Set to true after the user completes onboarding */
  onboardingComplete: boolean
  /** 'docker' | 'disabled' */
  executionMode: 'docker' | 'disabled'
  /** Enable verification after execution */
  enableVerification: boolean
  /** Live sandbox status shown in UI */
  sandboxStatus: 'idle' | 'starting' | 'ready' | 'stopped' | 'error'
  sandboxStatusMessage: string
  /** Browser extension connection */
  extensionConnected: boolean
  extensionVersion: string | null
  /** Ollama models list (fetched from local Ollama instance) */
  ollamaModels: Array<{ name: string; size?: number; modified_at?: string }>
  /** Browser sidecar installation state */
  sidecarInstalled: boolean
  sidecarInstallProgress: string | null
  sidecarPromptShown: boolean
  /** Browser activity state for agent-driven browsing */
  browserActivityActive: boolean
  /** Python (Nasus stack) sidecar state */
  nasusReady: boolean
  nasusChecking: boolean
  nasusInstalling: boolean
  nasusInstallProgress: string | null
  nasusInstallError: string | null
  /** Rate limiting settings (to avoid 429 errors) */
  rateLimitEnabled: boolean
  maxRequestsPerMinute: number
  /** Router config */
  routerConfig: RouterConfig
  /** Routing preview (model that will be selected for current input) */
  routingPreview: { modelId: string; displayName: string; reason: string } | null
  /** Per-task router state (model used, cost, etc.) keyed by taskId */
  taskRouterState: Record<string, TaskRouterState>
  /** UI text density: 'compact' (11px body) | 'default' (13px body) */
  textScale: TextScale

  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setWorkspacePath: (path: string) => void
  addRecentWorkspacePath: (path: string) => void
  setApiBase: (base: string) => void
  setProvider: (provider: string) => void
  setProviderKey: (provider: string, key: string) => void
  getProviderKey: (provider: string) => string
  fetchModelsForProvider: (provider: string) => Promise<void>
  setExaKey: (key: string) => void
  setMaxIterations: (n: number) => void
  setOnboardingComplete: () => void
  setEnableVerification: (enabled: boolean) => void
  setSandboxStatus: (status: 'idle' | 'starting' | 'ready' | 'stopped' | 'error', message?: string) => void
  setExtensionConnected: (connected: boolean, version?: string | null) => void
  setOllamaModels: (models: Array<{ name: string; size?: number; modified_at?: string }>) => void
  setSidecarInstalled: (installed: boolean) => void
  setSidecarInstallProgress: (progress: string | null) => void
  setSidecarPromptShown: (shown: boolean) => void
  checkSidecarInstalled: () => Promise<boolean>
  installSidecar: () => Promise<string>
  setBrowserActivityActive: (active: boolean) => void
  /** Python (Nasus stack) sidecar actions */
  checkNasusInstalled: () => Promise<boolean>
  installNasusSidecar: () => Promise<string>
  setRouterConfig: (config: Partial<RouterConfig>) => void
  setRoutingPreview: (preview: { modelId: string; displayName: string; reason: string } | null) => void
  setTaskRouterState: (taskId: string, state: Partial<TaskRouterState>) => void
  updateTokenUsage: (taskId: string, usage: { promptTokens: number; completionTokens: number }, modelId: string) => void
  setRateLimitEnabled: (enabled: boolean) => void
  setMaxRequestsPerMinute: (max: number) => void
  setTextScale: (scale: TextScale) => void
}

// Needed at runtime but type is defined in gatewayStore — access via get() cast
type WithGatewayAccess = {
  gateways: Array<{ id: string; type: string; apiKey: string; apiBase: string; enabled: boolean }>
  updateGateway: (id: string, patch: Record<string, unknown>) => void
  openRouterModels: Array<{ id: string; name: string; description: string; context_length: number; architecture: unknown; pricing: unknown; top_provider: unknown }>
}

const DEFAULT_ROUTER_STATE: Omit<TaskRouterState, 'tokenUsage'> = {
  modelId: '',
  displayName: '',
  reason: '',
  totalCostUsd: 0,
  totalInputTokens: 0,
  totalOutputTokens: 0,
  callCount: 0,
  isFree: false,
}

export const createSettingsSlice: StateCreator<SettingsSlice, [['zustand/immer', never]], [], SettingsSlice> = (set, get) => ({
  apiKey: '',
  model: 'anthropic/claude-sonnet-4-20250514',
  workspacePath: '',
  recentWorkspacePaths: [],
  apiBase: 'https://openrouter.ai/api/v1',
  provider: 'openrouter',
  exaKey: '',
  maxIterations: DEFAULT_MAX_ITERATIONS,
  onboardingComplete: false,
  executionMode: 'docker',
  enableVerification: true,
  sandboxStatus: 'idle',
  sandboxStatusMessage: '',
  extensionConnected: false,
  extensionVersion: null,
  ollamaModels: [],
  sidecarInstalled: false,
  sidecarInstallProgress: null,
  sidecarPromptShown: false,
  browserActivityActive: false,
  nasusReady: false,
  nasusChecking: false,
  nasusInstalling: false,
  nasusInstallProgress: null,
  nasusInstallError: null,
  rateLimitEnabled: true,
  maxRequestsPerMinute: 60,
  routerConfig: {
    mode: 'auto',
    budget: 'free',
    modelOverrides: {},
  },
  routingPreview: null,
  taskRouterState: {},
  textScale: 'default',

  setApiKey: (key) => {
    set({ apiKey: key })
    const s = get() as unknown as WithGatewayAccess & SettingsSlice
    const gw = s.gateways.find((g) => g.id === s.provider || g.type === s.provider)
    if (gw && gw.apiKey !== key) {
      s.updateGateway(gw.id, { apiKey: key })
    }
    // Also push credentials to the Python sidecar so modules have LLM access
    // without requiring a restart when the user updates their API key.
    if (key) {
      const { apiBase, model } = get()
      _pushLlmConfigToSidecar(key, apiBase, model).catch(() => {})
    }
  },

  setModel: (model) => set({ model }),

  setWorkspacePath: (path) => set({ workspacePath: path }),

  addRecentWorkspacePath: (path) =>
    set((state) => {
      if (!path.trim()) return {}
      const existing = state.recentWorkspacePaths.filter((p) => p !== path)
      return {
        recentWorkspacePaths: [path, ...existing].slice(0, 5),
      }
    }),

  setApiBase: (base) => set({ apiBase: base }),

  setProvider: (provider) => {
    set({ provider })
    const s = get() as unknown as WithGatewayAccess & SettingsSlice
    s.gateways.forEach((g) => {
      if (g.id === provider || g.type === provider) {
        if (!g.enabled) s.updateGateway(g.id, { enabled: true })
      } else if (g.type !== 'ollama' && g.enabled) {
        s.updateGateway(g.id, { enabled: false })
      }
    })
    const autoCapableProviders = ['openrouter', 'requesty']
    if (!autoCapableProviders.includes(provider)) {
      set((st) => ({ routerConfig: { ...st.routerConfig, mode: 'manual' } }))
    }
      // Don't auto-fetch Ollama models on every provider switch — Ollama may not
      // be running and the repeated failed requests cause console noise. Ollama
      // models are fetched on demand from SettingsPanel when the user opens that
      // section. Other providers are fine to fetch eagerly.
      if (provider !== 'ollama') {
        get().fetchModelsForProvider(provider)
      }
      const defaultModels: Record<string, string> = {
      openrouter: 'anthropic/claude-sonnet-4-20250514',
      requesty: 'anthropic/claude-sonnet-4-20250514',
      deepseek: 'deepseek-chat',
      ollama: 'llama3.3:latest',
      custom: '',
    }
    const currentModel = get().model
    const deepseekModelIds = ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder']
    const isModelValidForProvider = (() => {
      if (!currentModel) return false
      if (provider === 'openrouter' || provider === 'requesty') {
        return (s.openRouterModels ?? []).some((m) => m.id === currentModel) || currentModel.includes('/')
      }
      if (provider === 'deepseek') {
        return deepseekModelIds.includes(currentModel)
      }
      if (provider === 'ollama') {
        return get().ollamaModels.some(m => m.name === currentModel)
      }
      return true
    })()
    if (!isModelValidForProvider) {
      set({ model: defaultModels[provider] ?? currentModel })
    }
  },

  setProviderKey: (provider, key) => {
    const s = get() as unknown as WithGatewayAccess & SettingsSlice
    const gw = s.gateways.find((g) => g.id === provider || g.type === provider)
    if (gw) {
      s.updateGateway(gw.id, { apiKey: key })
    }
    if (provider === get().provider) {
      set({ apiKey: key })
    }
  },

  getProviderKey: (provider) => {
    const s = get() as unknown as WithGatewayAccess & SettingsSlice
    const gw = s.gateways.find((g) => g.id === provider || g.type === provider)
    return gw?.apiKey || (provider === get().provider ? get().apiKey : '')
  },

  fetchModelsForProvider: async (provider) => {
    try {
      switch (provider) {
        case 'openrouter': {
          const key = get().getProviderKey('openrouter')
          if (!key) return
          const { fetchOpenRouterModels } = await import('../agent/llm')
          const models = await fetchOpenRouterModels(key)
          // openRouterModels lives on the gateway slice — access via set
          ;(set as (patch: Record<string, unknown>) => void)({ openRouterModels: models })
          break
        }
        case 'requesty': {
          const key = get().getProviderKey('requesty')
          const s = get() as unknown as WithGatewayAccess & SettingsSlice
          const gw = s.gateways.find((g) => g.type === 'requesty')
          if (!key || !gw) return
          const { fetchModels } = await import('../agent/llm')
          const ids = await fetchModels(gw.apiBase, key).catch(() => [])
          const models = ids.map((id: string) => ({
            id,
            name: id,
            description: '',
            context_length: 128_000,
            architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] },
            pricing: { prompt: '0', completion: '0' },
            top_provider: { context_length: null, is_moderated: false },
          }))
          ;(set as (patch: Record<string, unknown>) => void)({ openRouterModels: models })
          break
        }
        case 'deepseek': {
          const { getModelsForGateway } = await import('../agent/gateway/modelRegistry')
          const registryModels = getModelsForGateway('deepseek')
          const models = registryModels.map((m) => ({
            id: (m.ids as Record<string, string>).deepseek!,
            name: m.canonicalName,
            description: m.description ?? '',
            context_length: m.contextWindow,
            architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] },
            pricing: {
              prompt: String(m.inputCostPer1M / 1_000_000),
              completion: String(m.outputCostPer1M / 1_000_000),
            },
            top_provider: { context_length: null, is_moderated: false },
          }))
          ;(set as (patch: Record<string, unknown>) => void)({ openRouterModels: models })
          break
        }
        case 'ollama': {
          try {
            const s = get() as unknown as WithGatewayAccess & SettingsSlice
            const gw = s.gateways.find((g) => g.type === 'ollama')
            const base = gw?.apiBase?.replace('/v1', '') ?? 'http://localhost:11434'
            const resp = await fetch(`${base}/api/tags`)
            const data = await resp.json()
            set({ ollamaModels: data.models || [] })
          } catch {
            set({ ollamaModels: [] })
          }
          break
        }
      }
    } catch (err) {
        log.error(`Failed to fetch models for ${provider}`, err)
    }
  },

  setExaKey: (key) => set({ exaKey: key }),
  setMaxIterations: (n) => set({ maxIterations: n }),
  setOnboardingComplete: () => set({ onboardingComplete: true }),
  setEnableVerification: (enabled) => set({ enableVerification: enabled }),
  setSandboxStatus: (status, message = '') => set({ sandboxStatus: status, sandboxStatusMessage: message }),
  setExtensionConnected: (connected, version = null) => set({ extensionConnected: connected, extensionVersion: version }),
  setOllamaModels: (models) => set({ ollamaModels: models }),
  setSidecarInstalled: (installed) => set({ sidecarInstalled: installed }),
  setSidecarInstallProgress: (progress) => set({ sidecarInstallProgress: progress }),
  setSidecarPromptShown: (shown) => set({ sidecarPromptShown: shown }),

  checkSidecarInstalled: async () => {
    try {
      const { browserCheckSidecarInstalled } = await import('../tauri')
      const installed = await browserCheckSidecarInstalled()
      set({ sidecarInstalled: installed })
      return installed
    } catch {
      return false
    }
  },

  installSidecar: async () => {
    try {
      const { browserInstallSidecar, tauriListen } = await import('../tauri')
      const unlisten = await tauriListen('sidecar:install_progress', (progress: unknown) => {
        set({ sidecarInstallProgress: progress as string | null })
      })
      await browserInstallSidecar()
      unlisten()
      set({ sidecarInstalled: true, sidecarInstallProgress: null })
      return 'Installation complete'
    } catch (err) {
      set({ sidecarInstallProgress: null })
      throw err
    }
  },

  setBrowserActivityActive: (active) => set({ browserActivityActive: active }),

  // ── Python (Nasus stack) sidecar ─────────────────────────────────────────

  checkNasusInstalled: async () => {
    set({ nasusChecking: true, nasusInstallError: null })
    try {
      const { tauriInvoke } = await import('../tauri')
      const status = await tauriInvoke<{ installed: boolean; has_venv: boolean; message: string }>('nasus_check_installed')
      const ready = status?.installed ?? false
      set({ nasusReady: ready, nasusChecking: false })

      // If the sidecar is installed and an API key is already in the store,
      // push credentials to the sidecar immediately (covers cold-start where
      // the key was persisted from a previous session).
      if (ready) {
        const { apiKey, apiBase, model } = get()
        if (apiKey) {
          tauriInvoke('nasus_configure_llm', {
            config: { api_key: apiKey, api_base: apiBase || 'https://openrouter.ai/api/v1', model: model || 'openai/gpt-4o-mini' },
          }).catch(() => { /* sidecar may not be running yet — NasusAgentTool will retry */ })
        }
      }

      return ready
    } catch {
      set({ nasusChecking: false, nasusReady: false })
      return false
    }
  },

  installNasusSidecar: async () => {
    set({ nasusInstalling: true, nasusInstallProgress: 'Starting installation…', nasusInstallError: null })
    try {
      const { tauriInvoke, tauriListen } = await import('../tauri')
      const unlisten = await tauriListen('nasus:install_progress', (progress: unknown) => {
        set({ nasusInstallProgress: progress as string | null })
      })
      const result = await tauriInvoke<string>('nasus_install_sidecar')
      unlisten()
      set({ nasusInstalling: false, nasusInstallProgress: null, nasusReady: true, nasusInstallError: null })

      // Push LLM credentials to the freshly-installed sidecar if available.
      const { apiKey, apiBase, model } = get()
      if (apiKey) {
        tauriInvoke('nasus_configure_llm', {
          config: { api_key: apiKey, api_base: apiBase || 'https://openrouter.ai/api/v1', model: model || 'openai/gpt-4o-mini' },
        }).catch(() => { /* best-effort — sidecar may still be starting */ })
      }

      return result ?? 'Installation complete'
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      set({ nasusInstalling: false, nasusInstallProgress: null, nasusInstallError: msg })
      throw err
    }
  },

  setRouterConfig: (config) =>
    set((state) => ({ routerConfig: { ...state.routerConfig, ...config } })),

  setRoutingPreview: (preview) => set({ routingPreview: preview }),

  setTaskRouterState: (taskId, state) =>
    set((s) => ({
      taskRouterState: {
        ...s.taskRouterState,
        [taskId]: { ...(s.taskRouterState[taskId] ?? DEFAULT_ROUTER_STATE), ...state },
      },
    })),

  updateTokenUsage: (taskId, usage, modelId) =>
    set((s) => {
      const current = s.taskRouterState[taskId]?.tokenUsage ?? {
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        totalTokens: 0,
        estimatedCost: 0,
        contextUtilization: 0,
      }
      const totalPromptTokens = current.totalPromptTokens + usage.promptTokens
      const totalCompletionTokens = current.totalCompletionTokens + usage.completionTokens
      const totalTokens = totalPromptTokens + totalCompletionTokens
      const deltaTokens = usage.promptTokens + usage.completionTokens
      const { registry } = s.routerConfig
      const modelInfo = (registry ?? []).find(m => m.id === modelId)
      let estimatedCost = current.estimatedCost
      if (modelInfo) {
        const tierCost: Record<string, number> = { premium: 10, standard: 2, budget: 0.5, free: 0 }
        const costPerMillion = tierCost[modelInfo.cost_tier.toLowerCase()] ?? 2
        estimatedCost += (deltaTokens / 1_000_000) * costPerMillion
      } else {
        estimatedCost += (deltaTokens / 1_000_000) * 5
      }
      const contextUtilization = usage.promptTokens / (modelInfo?.context_window ?? 128_000)
      return {
        taskRouterState: {
          ...s.taskRouterState,
          [taskId]: {
            ...(s.taskRouterState[taskId] ?? DEFAULT_ROUTER_STATE),
            tokenUsage: {
              totalPromptTokens,
              totalCompletionTokens,
              totalTokens,
              estimatedCost,
              contextUtilization,
            }
          }
        }
      }
    }),

  setRateLimitEnabled: (enabled) => {
    set({ rateLimitEnabled: enabled })
    updateGlobalRateLimiterConfig({ enabled })
  },

  setMaxRequestsPerMinute: (max) => {
    set({ maxRequestsPerMinute: max })
    updateGlobalRateLimiterConfig({ maxRequests: max })
  },

  setTextScale: (scale) => set({ textScale: scale }),
})
