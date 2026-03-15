import type { AppStateCreator } from './storeTypes'
import { DEFAULT_MAX_ITERATIONS } from '../lib/constants'
import { createLogger } from '../lib/logger'
import { findModelById } from '../agent/gateway/modelRegistry'

const log = createLogger('Settings')

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
  /** Brave Search API key */
  braveKey: string
  /** Serper (Google) API key */
  serperKey: string
  /** Tavily API key */
  tavilyKey: string
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
  /** Browser activity state for agent-driven browsing */
  browserActivityActive: boolean
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
  setBraveKey: (key: string) => void
  setSerperKey: (key: string) => void
  setTavilyKey: (key: string) => void
  setMaxIterations: (n: number) => void
  setOnboardingComplete: () => void
  setEnableVerification: (enabled: boolean) => void
  setSandboxStatus: (status: 'idle' | 'starting' | 'ready' | 'stopped' | 'error', message?: string) => void
  setExtensionConnected: (connected: boolean, version?: string | null) => void
  setOllamaModels: (models: Array<{ name: string; size?: number; modified_at?: string }>) => void
  setSidecarInstalled: (installed: boolean) => void
  setSidecarInstallProgress: (progress: string | null) => void
  checkSidecarInstalled: () => Promise<boolean>
  installSidecar: () => Promise<string>
  setBrowserActivityActive: (active: boolean) => void
  setRouterConfig: (config: Partial<RouterConfig>) => void
  setRoutingPreview: (preview: { modelId: string; displayName: string; reason: string } | null) => void
  setTaskRouterState: (taskId: string, state: Partial<TaskRouterState>) => void
  updateTokenUsage: (taskId: string, usage: { promptTokens: number; completionTokens: number }, modelId: string) => void
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

export const createSettingsSlice: AppStateCreator<SettingsSlice> = (set, get) => ({
  apiKey: '',
  model: 'deepseek-chat',
  workspacePath: '',
  recentWorkspacePaths: [],
  apiBase: 'https://api.deepseek.com/v1',
  provider: 'deepseek',
  exaKey: '',
  braveKey: '',
  serperKey: '',
  tavilyKey: '',
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
  browserActivityActive: false,
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
  },

  setModel: (model) => set({ model }),

  setWorkspacePath: (path) => set({ workspacePath: path }),

  addRecentWorkspacePath: (path) =>
    set((state) => {
      if (!path.trim()) return
      const existing = state.recentWorkspacePaths.filter((p) => p !== path)
      state.recentWorkspacePaths = [path, ...existing].slice(0, 5)
    }),

  setApiBase: (base) => set({ apiBase: base }),

  setProvider: (provider) => {
    set({ provider })
    const s = get() as unknown as WithGatewayAccess & SettingsSlice
    // Only ensure the selected provider's gateway is enabled — do not disable others.
    // The multi-gateway failover system depends on multiple gateways being enabled simultaneously.
    const gw = s.gateways.find((g) => g.id === provider || g.type === provider)
    if (gw && !gw.enabled) {
      s.updateGateway(gw.id, { enabled: true })
    }
    // Don't auto-fetch Ollama models on every provider switch — Ollama may not
    // be running and the repeated failed requests cause console noise.
    if (provider !== 'ollama') {
      get().fetchModelsForProvider(provider)
    }
    const defaultModels: Record<string, string> = {
      deepseek: 'deepseek-chat',
      anthropic: 'claude-sonnet-4-5',
      ollama: 'llama3.3:latest',
      custom: '',
    }
    const currentModel = get().model
    const isModelValidForProvider = (() => {
      if (!currentModel) return false
      if (provider === 'deepseek') {
        return ['deepseek-chat', 'deepseek-reasoner', 'deepseek-coder'].includes(currentModel)
      }
      if (provider === 'anthropic') {
        return ['claude-sonnet-4-5', 'claude-haiku-4-5'].includes(currentModel)
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
        case 'anthropic': {
          const { getModelsForGateway: getAnthropicModels } = await import('../agent/gateway/modelRegistry')
          const anthropicModels = getAnthropicModels('anthropic')
          const models = anthropicModels.map((m) => ({
            id: (m.ids as Record<string, string>).anthropic!,
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
        log.error(`Failed to fetch models for ${provider}`, err instanceof Error ? err : new Error(String(err)))
    }
  },

  setExaKey: (key) => set({ exaKey: key }),
  setBraveKey: (key) => set({ braveKey: key }),
  setSerperKey: (key) => set({ serperKey: key }),
  setTavilyKey: (key) => set({ tavilyKey: key }),
  setMaxIterations: (n) => set({ maxIterations: n }),
  setOnboardingComplete: () => set({ onboardingComplete: true }),
  setEnableVerification: (enabled) => set({ enableVerification: enabled }),
  setSandboxStatus: (status, message = '') => set({ sandboxStatus: status, sandboxStatusMessage: message }),
  setExtensionConnected: (connected, version = null) => set({ extensionConnected: connected, extensionVersion: version }),
  setOllamaModels: (models) => set({ ollamaModels: models }),
  setSidecarInstalled: (installed) => set({ sidecarInstalled: installed }),
  setSidecarInstallProgress: (progress) => set({ sidecarInstallProgress: progress }),

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
      const unlisten = await tauriListen('sidecar:install_progress', (event: unknown) => {
        set({ sidecarInstallProgress: (event as { payload?: string })?.payload ?? null })
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

  setRouterConfig: (config) =>
    set((state) => { Object.assign(state.routerConfig, config) }),

  setRoutingPreview: (preview) => set({ routingPreview: preview }),

  setTaskRouterState: (taskId, state) =>
    set((s) => {
      s.taskRouterState[taskId] = { ...(s.taskRouterState[taskId] ?? DEFAULT_ROUTER_STATE), ...state }
    }),

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

      // Use MODEL_REGISTRY for precise per-token pricing (separate input/output rates).
      // For models not in the registry (custom/OpenRouter), cost is not estimated.
      const registryEntry = findModelById(modelId)
      let estimatedCost = current.estimatedCost
      if (registryEntry) {
        estimatedCost +=
          (usage.promptTokens / 1_000_000) * registryEntry.inputCostPer1M +
          (usage.completionTokens / 1_000_000) * registryEntry.outputCostPer1M
      }

      const contextUtilization = usage.promptTokens / (registryEntry?.contextWindow ?? 128_000)
      const entry = s.taskRouterState[taskId] ?? DEFAULT_ROUTER_STATE
      s.taskRouterState[taskId] = {
        ...entry,
        tokenUsage: {
          totalPromptTokens,
          totalCompletionTokens,
          totalTokens,
          estimatedCost,
          contextUtilization,
        },
      }
    }),

  setTextScale: (scale) => set({ textScale: scale }),
})
