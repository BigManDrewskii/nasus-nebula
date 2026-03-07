import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Message, AgentStep, LlmMessage } from './types'
import { clearWorkspace, copyWorkspace } from './agent/tools'
import type { ExecutionPlan } from './agent/core/Agent'
import { persistTaskHistory, deletePersistedTaskHistory, getPersistedTaskHistory } from './tauri'
import { logger } from './lib/logger'
import { MAX_TASKS, MAX_TOOL_RESULT_CHARS, MAX_RAW_HISTORY_LIVE, DEFAULT_MAX_ITERATIONS } from './lib/constants'

// NOTE: clearWorkspace is now async - we call it without await in state updates
// The workspace cleanup happens in the background

// Gateway integration
import { createGatewaySlice, type GatewaySlice } from './agent/gateway'
import { updateGlobalRateLimiterConfig } from './agent/gateway/rateLimiter'

// ── Router config ──────────────────────────────────────────────────────────────
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

// Per-task router state emitted by the Rust backend
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

interface AppState extends GatewaySlice {
  tasks: Task[]
  activeTaskId: string | null
  messages: Record<string, Message[]>
  // Full raw LLM history per task — includes tool_calls / tool results for proper multi-turn context
  rawHistory: Record<string, LlmMessage[]>
    apiKey: string
    model: string
    workspacePath: string
    recentWorkspacePaths: string[]
    apiBase: string
    provider: string
  // Router config
  routerConfig: RouterConfig
  // Routing preview (model that will be selected for current input)
  routingPreview: { modelId: string; displayName: string; reason: string } | null
  // Per-task router state (model used, cost, etc.) keyed by taskId
    taskRouterState: Record<string, TaskRouterState>
  // Config accordion state (sidebar settings sections) — DEPRECATED, kept for compatibility
  configSections: Record<string, boolean>
  // Settings modal state
  settingsOpen: boolean
  settingsTab: 'general' | 'model' | 'execution' | 'search' | 'about'
      /** Exa AI API key for web search */
      exaKey: string
    maxIterations: number
      /** Set to true after the user completes onboarding */
      onboardingComplete: boolean
        // Code execution (Docker sandbox)
        /** 'docker' | 'disabled' */
        executionMode: 'docker' | 'disabled'
        /** Enable verification after execution */
        enableVerification: boolean
          /** Live sandbox status shown in UI */
          sandboxStatus: 'idle' | 'starting' | 'ready' | 'stopped' | 'error'
        sandboxStatusMessage: string
    // Browser extension connection
    extensionConnected: boolean
    extensionVersion: string | null
    // Ollama models list (fetched from local Ollama instance)
    ollamaModels: Array<{ name: string; size?: number; modified_at?: string }>
    // Browser sidecar installation state
    sidecarInstalled: boolean
    sidecarInstallProgress: string | null
    sidecarPromptShown: boolean
    // Browser activity state for agent-driven browsing
    browserActivityActive: boolean
    // Rate limiting settings (to avoid 429 errors)
    rateLimitEnabled: boolean
    maxRequestsPerMinute: number

  // Planning state
  pendingPlan: ExecutionPlan | null
  planApprovalStatus: 'pending' | 'approved' | 'rejected' | null
  currentPlan: ExecutionPlan | null
  currentPhase: number
  currentStep: number

  pendingToolApproval: { tool: string; args: Record<string, any>; reason?: string; taskId: string } | null

  setActiveTaskId: (id: string | null) => void
  addTask: (task: Task) => void
  deleteTask: (id: string) => void
  updateTaskTitle: (id: string, title: string) => void
  updateTaskStatus: (id: string, status: Task['status']) => void
  toggleTaskPin: (id: string) => void
  duplicateTask: (id: string) => void
  getMessages: (taskId: string) => Message[]
  getRawHistory: (taskId: string) => LlmMessage[]
  addMessage: (taskId: string, message: Message) => void
  appendChunk: (taskId: string, messageId: string, delta: string) => void
  setStreaming: (taskId: string, messageId: string, streaming: boolean) => void
  setError: (taskId: string, messageId: string, error: string) => void
  addStep: (taskId: string, messageId: string, step: AgentStep) => void
  updateStep: (taskId: string, messageId: string, step: AgentStep) => void
  updateSearchStatus: (taskId: string, messageId: string, step: AgentStep) => void
  setMessageModel: (taskId: string, messageId: string, modelId: string, modelName: string, provider: string) => void
  appendRawHistory: (taskId: string, msgs: LlmMessage[]) => void
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
  setRouterConfig: (config: Partial<RouterConfig>) => void
  setRoutingPreview: (preview: { modelId: string; displayName: string; reason: string } | null) => void
  setTaskRouterState: (taskId: string, state: Partial<TaskRouterState>) => void
  updateTokenUsage: (taskId: string, usage: { promptTokens: number; completionTokens: number }, modelId: string) => void
  setConfigSection: (section: string, open: boolean) => void

  openSettings: (tab?: 'general' | 'model' | 'execution' | 'search' | 'about') => void
  closeSettings: () => void
  setSettingsTab: (tab: 'general' | 'model' | 'execution' | 'search' | 'about') => void
  setPendingPlan: (plan: ExecutionPlan | null) => void
  setPlanApprovalStatus: (status: 'pending' | 'approved' | 'rejected' | null) => void
  setCurrentPlan: (plan: ExecutionPlan | null) => void
  setCurrentPhase: (phase: number) => void
  setCurrentStep: (step: number) => void
  approvePlan: () => void
  rejectPlan: () => void

  setPendingToolApproval: (approval: { tool: string; args: Record<string, any>; reason?: string; taskId: string } | null) => void
  approveTool: (taskId: string, tool: string) => void
  rejectTool: (taskId: string, tool: string) => void
  setRateLimitEnabled: (enabled: boolean) => void
  setMaxRequestsPerMinute: (max: number) => void
}

const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  author: 'agent',
  content:
    "Hi! I'm Nasus, your autonomous AI agent. I can browse the web, write and run code, analyze data, and complete complex tasks end-to-end. What would you like to accomplish?",
  timestamp: new Date(),
}

const INITIAL_TASK: Task = {
  id: 'initial',
  title: 'Getting started',
  status: 'pending',
  createdAt: new Date(),
}

export const useAppStore = create<AppState>()(
  persist(
    (...a) => {
      const [set, get] = a
      return {
      ...createGatewaySlice(...a),
      tasks: [INITIAL_TASK],
      activeTaskId: 'initial',
      messages: { initial: [WELCOME_MESSAGE] },
      rawHistory: {},
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
              // Browser extension connection
              extensionConnected: false,
              extensionVersion: null,
          // Ollama models list
          ollamaModels: [],
          // Browser sidecar state
          sidecarInstalled: false,
          sidecarInstallProgress: null,
          sidecarPromptShown: false,
          browserActivityActive: false,
          // Rate limiting settings (conservative defaults for free tiers)
          rateLimitEnabled: true,
          maxRequestsPerMinute: 60,
          routerConfig: {
            mode: 'auto',
            budget: 'free',
            modelOverrides: {},
          },
          routingPreview: null,
            taskRouterState: {},
          // Config accordion state (sidebar settings sections)
          configSections: { model: false, parameters: false, systemPrompt: false, stats: false },
          // Settings modal state
          settingsOpen: false,
          settingsTab: 'general',
            pendingPlan: null,
            planApprovalStatus: null,
            currentPlan: null,
          currentPhase: 0,
          currentStep: 0,

          pendingToolApproval: null,

          setActiveTaskId: (id) => {

            // Clear plan state from the previous task so the new task starts clean
            set({
              activeTaskId: id,
              pendingPlan: null,
              currentPlan: null,
              planApprovalStatus: null,
              currentPhase: 0,
              currentStep: 0,
            })
            // If selecting a task that doesn't have history in memory, try to load from DB
            if (id && (!get().rawHistory[id] || get().rawHistory[id].length === 0)) {
              getPersistedTaskHistory(id).then(history => {
                if (history && history.length > 0) {
                  set(state => ({
                    rawHistory: { ...state.rawHistory, [id]: history }
                  }))
                }
              }).catch(err => {
                logger.warn('store', `Failed to load history for task ${id}`, err)
                // Non-blocking: store stays empty, user can retry
              })
              }
            },
          addTask: (task) =>

          set((state) => {
            const tasks = [task, ...state.tasks]
            const messages = { ...state.messages, [task.id]: [WELCOME_MESSAGE] }
            const rawHistory = { ...state.rawHistory, [task.id]: [] }

              // Prune oldest tasks (beyond MAX_TASKS) to keep localStorage lean
              if (tasks.length > MAX_TASKS) {
                const pruned = tasks.slice(MAX_TASKS)
                for (const t of pruned) {
                  delete messages[t.id]
                  delete rawHistory[t.id]
                  // Async workspace cleanup - fire and forget
                  clearWorkspace(t.id).catch(err => {
                    logger.warn('store', `Failed to cleanup workspace for pruned task ${t.id}`, err)
                  })
                }
                // Notify UI that old tasks were pruned
                window.dispatchEvent(new CustomEvent('nasus:tasks-pruned', {
                  detail: { count: pruned.length },
                }))
              }

            return {
              tasks: tasks.slice(0, MAX_TASKS),
              messages,
              rawHistory,
            }
          }),

      deleteTask: (id) =>
        set((state) => {
          const tasks = state.tasks.filter((t) => t.id !== id)
          const messages = { ...state.messages }
          const rawHistory = { ...state.rawHistory }
          delete messages[id]
            delete rawHistory[id]
            // Async workspace cleanup - fire and forget
            clearWorkspace(id).catch(err => {
              logger.warn('store', `Failed to cleanup workspace for deleted task ${id}`, err)
            })
            // Async history cleanup in DB
            deletePersistedTaskHistory(id).catch(err => {
              logger.warn('store', `Failed to delete history for task ${id}`, err)
            })

          // If we deleted the active task, select the next one
          const activeTaskId =
            state.activeTaskId === id
              ? (tasks[0]?.id ?? null)
              : state.activeTaskId
          return { tasks, messages, rawHistory, activeTaskId }
        }),

      updateTaskTitle: (id, title) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

        updateTaskStatus: (id, status) =>
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
          })),

        toggleTaskPin: (id) =>
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? { ...t, pinned: !t.pinned } : t)),
          })),

        duplicateTask: (id) =>
          set((state) => {
            const source = state.tasks.find((t) => t.id === id)
            if (!source) return {}
            const newId = crypto.randomUUID()
            const newTask: Task = {
              ...source,
              id: newId,
              title: `${source.title} (copy)`,
              status: 'pending',
              createdAt: new Date(),
              pinned: false,
            }
            const tasks = [newTask, ...state.tasks].slice(0, MAX_TASKS)
            const messages = { ...state.messages, [newId]: [WELCOME_MESSAGE] }
            const rawHistory = { ...state.rawHistory, [newId]: state.rawHistory[id] ?? [] }
            // Copy workspace files from source to new task
            copyWorkspace(id, newId)
            // Persist duplicated history to DB in background
            if (rawHistory[newId].length > 0) {
              persistTaskHistory(newId, rawHistory[newId]).catch(err => {
                logger.warn('store', `Failed to persist history for duplicated task ${newId}`, err)
              })
            }
            return { tasks, messages, rawHistory, activeTaskId: newId }
          }),

      getMessages: (taskId) => get().messages[taskId] ?? [WELCOME_MESSAGE],
      getRawHistory: (taskId) => get().rawHistory[taskId] ?? [],

      addMessage: (taskId, message) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [taskId]: [...(state.messages[taskId] ?? [WELCOME_MESSAGE]), message],
          },
        })),

      appendChunk: (taskId, messageId, delta) =>
        set((state) => {
          const msgs = state.messages[taskId]
          if (!msgs) return {}
          const idx = msgs.findIndex((m) => m.id === messageId)
          if (idx === -1) return {}
          // Mutate a shallow clone of just the target message — avoids mapping every message
          const updated = [...msgs]
          updated[idx] = { ...updated[idx], content: updated[idx].content + delta }
          return {
            messages: {
              ...state.messages,
              [taskId]: updated,
            },
          }
        }),

      setStreaming: (taskId, messageId, streaming) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [taskId]: (state.messages[taskId] ?? []).map((m) =>
              m.id === messageId ? { ...m, streaming } : m,
            ),
          },
        })),

      setError: (taskId, messageId, error) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [taskId]: (state.messages[taskId] ?? []).map((m) =>
              m.id === messageId ? { ...m, error, streaming: false } : m,
            ),
          },
        })),

      addStep: (taskId, messageId, step) =>
        set((state) => {
          const msgs = state.messages[taskId] ?? []
          return {
            messages: {
              ...state.messages,
              [taskId]: msgs.map((m) =>
                m.id === messageId
                  ? { ...m, steps: [...(m.steps ?? []), step] }
                  : m,
              ),
            },
          }
        }),

      // For tool_result: find the matching tool_call and attach the result data to it
      // in-place so the step list never has orphan entries.
      // For all other step kinds, append normally.
      updateStep: (taskId, messageId, updatedStep) =>
        set((state) => ({
          messages: {
            ...state.messages,
            [taskId]: (state.messages[taskId] ?? []).map((m) => {
              if (m.id !== messageId) return m
              if (updatedStep.kind !== 'tool_result') {
                return { ...m, steps: [...(m.steps ?? []), updatedStep] }
              }
              // Find the matching tool_call step and merge result into it
              const callId = updatedStep.callId
              const existingCall = (m.steps ?? []).find(
                (s) => s.kind === 'tool_call' && s.callId === callId,
              )
              if (existingCall) {
                // Replace the tool_call step with a version that carries the result
                return {
                  ...m,
                  steps: (m.steps ?? []).map((s) =>
                    s.kind === 'tool_call' && s.callId === callId
                      ? { ...s, result: updatedStep }
                      : s,
                  ),
                }
              }
              // Orphan fallback — no matching call found, just append
              return { ...m, steps: [...(m.steps ?? []), updatedStep] }
            }),
          },
        })),

        // Upsert a search_status step: replace the most recent search_status for the
        // same callId, or append a new one. This way the UI chip updates in-place
        // as the phase progresses (searching → complete / fallback / all_failed).
        updateSearchStatus: (taskId, messageId, step) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [taskId]: (state.messages[taskId] ?? []).map((m) => {
                if (m.id !== messageId) return m
                if (step.kind !== 'search_status') return m
                const callId = step.callId
                const steps = m.steps ?? []
                // Find the last existing search_status for this callId and replace it
                let existingIdx = -1
                for (let i = steps.length - 1; i >= 0; i--) {
                  const s = steps[i]
                  if (s.kind === 'search_status' && s.callId === callId) { existingIdx = i; break }
                }
                if (existingIdx !== -1) {
                  const next = [...steps]
                  next[existingIdx] = step
                  return { ...m, steps: next }
                }
                // No existing entry — append
                return { ...m, steps: [...steps, step] }
              }),
            },
          })),

          setMessageModel: (taskId, messageId, modelId, modelName, provider) =>
            set((state) => ({
              messages: {
                ...state.messages,
                [taskId]: (state.messages[taskId] ?? []).map((m) =>
                  m.id === messageId ? { ...m, modelId, modelName, provider } : m
                ),
              },
            })),

          appendRawHistory: (taskId, msgs) =>
            set((state) => {
              const current = state.rawHistory[taskId] ?? []
              const appended = [...current, ...msgs]

              // Cap in-memory size to prevent OOM on very long runs
              const capped = appended.length > MAX_RAW_HISTORY_LIVE
                ? appended.slice(-MAX_RAW_HISTORY_LIVE)
                : appended

              // Schedule persistence outside state update for atomicity (fixes race condition)
              queueMicrotask(() => {
                persistTaskHistory(taskId, capped).catch(err => {
                  logger.warn('store', `Failed to persist history for task ${taskId}`, err)
                })
              })

              return {
                rawHistory: {
                  ...state.rawHistory,
                  [taskId]: capped,
                },
              }
            }),


            setApiKey: (key) => {
              set({ apiKey: key })
              // Sync the key into whichever gateway is currently the active provider
              const { provider, gateways, updateGateway } = get()
              const gw = gateways.find((g) => g.id === provider || g.type === provider)
              if (gw && gw.apiKey !== key) {
                updateGateway(gw.id, { apiKey: key })
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

                // Enable the selected gateway, disable all other non-Ollama gateways.
                const { gateways, updateGateway } = get()
                gateways.forEach((g) => {
                  if (g.id === provider || g.type === provider) {
                    if (!g.enabled) updateGateway(g.id, { enabled: true })
                  } else if (g.type !== 'ollama' && g.enabled) {
                    updateGateway(g.id, { enabled: false })
                  }
                })

                // When switching to a provider that has its own fixed routing
                // (DeepSeek, Ollama, custom), lock routerConfig.mode to 'manual'
                // so the auto-router never overrides the user's choice with a
                // free OpenRouter model mid-task.
                // OpenRouter and Requesty support auto-routing; leave mode alone.
                const autoCapableProviders = ['openrouter', 'requesty']
                if (!autoCapableProviders.includes(provider)) {
                  set((s) => ({ routerConfig: { ...s.routerConfig, mode: 'manual' } }))
                }

                // Fetch models for the new provider
                get().fetchModelsForProvider(provider)

                // Reset model to a sensible default when switching providers.
                // The previous guard `!currentModel.includes(provider)` was wrong:
                // - "anthropic/claude-sonnet-4" doesn't include "openrouter" → always resets
                // - It also never correctly detects foreign-provider models.
                // New logic: reset if the current model is not in the openRouterModels list
                // for OR/Requesty, or if it doesn't match known DeepSeek/Ollama model IDs.
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
                    // Valid if it's in the fetched model list (has a slash, OR-style)
                    return get().openRouterModels.some(m => m.id === currentModel) || currentModel.includes('/')
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
              // Store the key for this specific provider
              const { gateways, updateGateway } = get()
              const gw = gateways.find((g) => g.id === provider || g.type === provider)
              if (gw) {
                updateGateway(gw.id, { apiKey: key })
              }

              // Also update the legacy apiKey field for backward compatibility
              if (provider === get().provider) {
                set({ apiKey: key })
              }
            },
            getProviderKey: (provider) => {
              const { gateways, apiKey } = get()
              const gw = gateways.find((g) => g.id === provider || g.type === provider)
              return gw?.apiKey || (provider === get().provider ? apiKey : '')
            },
            fetchModelsForProvider: async (provider) => {
              try {
                switch (provider) {
                  case 'openrouter': {
                    const key = get().getProviderKey('openrouter')
                    if (!key) return
                    const { fetchOpenRouterModels } = await import('./agent/llm')
                    const models = await fetchOpenRouterModels(key)
                    set({ openRouterModels: models })
                    break
                  }
                  case 'requesty': {
                    // Requesty exposes an OpenAI-compatible /models endpoint.
                    // Reuse fetchModels from llm.ts — it just hits /<base>/models.
                    const key = get().getProviderKey('requesty')
                    const gw = get().gateways.find((g) => g.type === 'requesty')
                    if (!key || !gw) return
                    const { fetchModels } = await import('./agent/llm')
                    const ids = await fetchModels(gw.apiBase, key).catch(() => [])
                    // Map raw ID strings into minimal OpenRouterModel-compatible objects
                    // so the existing model picker UI works without changes.
                    const models = ids.map((id) => ({
                      id,
                      name: id,
                      description: '',
                      context_length: 128_000,
                      architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] },
                      pricing: { prompt: '0', completion: '0' },
                      top_provider: { context_length: null, is_moderated: false },
                    }))
                    set({ openRouterModels: models })
                    break
                  }
                  case 'deepseek': {
                    // DeepSeek direct doesn't publish a useful /models list (returns fixed set).
                    // Populate the picker with the known stable model IDs from the registry.
                    const { getModelsForGateway } = await import('./agent/gateway/modelRegistry')
                    const registryModels = getModelsForGateway('deepseek')
                    const models = registryModels.map((m) => ({
                      id: m.ids.deepseek!,
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
                    set({ openRouterModels: models })
                    break
                  }
                  case 'ollama': {
                    try {
                      const gw = get().gateways.find((g) => g.type === 'ollama')
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
                console.error(`[Nasus] Failed to fetch models for ${provider}:`, err)
              }
            },
            setOllamaModels: (models) => set({ ollamaModels: models }),
            setSidecarInstalled: (installed) => set({ sidecarInstalled: installed }),
            setSidecarInstallProgress: (progress) => set({ sidecarInstallProgress: progress }),
            setSidecarPromptShown: (shown) => set({ sidecarPromptShown: shown }),
            checkSidecarInstalled: async () => {
              try {
                const { browserCheckSidecarInstalled } = await import('./tauri')
                const status = await browserCheckSidecarInstalled()
                set({ sidecarInstalled: status.installed })
                return status.installed
              } catch {
                return false
              }
            },
            installSidecar: async () => {
              try {
                const { browserInstallSidecar, tauriListen } = await import('./tauri')
                // Listen for progress events
                const unlisten = await tauriListen<string>('sidecar:install_progress', (progress) => {
                  set({ sidecarInstallProgress: progress })
                })
                const result = await browserInstallSidecar()
                unlisten()
                set({ sidecarInstalled: true, sidecarInstallProgress: null })
                return result
              } catch (err) {
                set({ sidecarInstallProgress: null })
                throw err
              }
            },
            setBrowserActivityActive: (active) => set({ browserActivityActive: active }),
              setExaKey: (key) => set({ exaKey: key }),
              setMaxIterations: (n) => set({ maxIterations: n }),
              setOnboardingComplete: () => set({ onboardingComplete: true }),
                setEnableVerification: (enabled) => set({ enableVerification: enabled }),
                setSandboxStatus: (status, message = '') => set({ sandboxStatus: status, sandboxStatusMessage: message }),
                setExtensionConnected: (connected, version = null) => set({ extensionConnected: connected, extensionVersion: version }),
        setRouterConfig: (config) =>
          set((state) => ({ routerConfig: { ...state.routerConfig, ...config } })),
        setRoutingPreview: (preview) => set({ routingPreview: preview }),
        setTaskRouterState: (taskId, state) =>
          set((s) => ({
            taskRouterState: {
              ...s.taskRouterState,
              [taskId]: { ...(s.taskRouterState[taskId] ?? { modelId: '', displayName: '', reason: '', totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0, callCount: 0, isFree: false }), ...state },
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

              // Calculate cost — use the DELTA (this call's tokens only), not the cumulative total.
              // Using totalTokens here causes quadratic growth: each update would add the entire
              // running sum instead of just the incremental cost of this one call.
              const deltaTokens = usage.promptTokens + usage.completionTokens
              const { registry } = s.routerConfig
              const modelInfo = (registry ?? []).find(m => m.id === modelId)

              let estimatedCost = current.estimatedCost
              if (modelInfo) {
                // Use cost_tier to estimate (simplified)
                const tierCost: Record<string, number> = { premium: 10, standard: 2, budget: 0.5, free: 0 }
                const costPerMillion = tierCost[modelInfo.cost_tier.toLowerCase()] ?? 2
                estimatedCost += (deltaTokens / 1_000_000) * costPerMillion
              } else {
                // Fallback to a generic rate if not in registry
                estimatedCost += (deltaTokens / 1_000_000) * 5
              }

              const contextUtilization = usage.promptTokens / (modelInfo?.context_window ?? 128_000)
            
            return {
              taskRouterState: {
                ...s.taskRouterState,
                [taskId]: {
                  ...(s.taskRouterState[taskId] ?? { modelId: '', displayName: '', reason: '', totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0, callCount: 0, isFree: false }),
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
          setConfigSection: (section, open) =>
            set((s) => ({
              configSections: { ...s.configSections, [section]: open },
            })),
          openSettings: (tab) => set({ settingsOpen: true, settingsTab: tab ?? 'general' }),
        closeSettings: () => set({ settingsOpen: false }),
        setSettingsTab: (tab) => set({ settingsTab: tab }),
        setPendingPlan: (plan) => set({ pendingPlan: plan }),
        setPlanApprovalStatus: (status) => set({ planApprovalStatus: status }),
        setCurrentPlan: (plan) => set({ currentPlan: plan }),
        setCurrentPhase: (phase) => set({ currentPhase: phase }),
        setCurrentStep: (step) => set({ currentStep: step }),
        approvePlan: () => {
          const state = useAppStore.getState()
          // Clear both pending and current plan — the card is for approval only.
          // Once approved we don't keep it in the chat thread (Option A UX).
          set({ planApprovalStatus: 'approved', pendingPlan: null, currentPlan: null })
          // Emit approval event for orchestrator
          if (state.activeTaskId) {
            window.dispatchEvent(new CustomEvent(`nasus:plan-approve-${state.activeTaskId}`))
          }
        },
          rejectPlan: () => {
            set({ planApprovalStatus: 'rejected', pendingPlan: null })
          },

          setPendingToolApproval: (approval) => {
            set({ pendingToolApproval: approval })
          },
          approveTool: (taskId, tool) => {
            set({ pendingToolApproval: null })
            window.dispatchEvent(new CustomEvent(`nasus:tool-approved-${taskId}`, { detail: { tool } }))
          },
          rejectTool: (taskId, tool) => {
            set({ pendingToolApproval: null })
            window.dispatchEvent(new CustomEvent(`nasus:tool-rejected-${taskId}`, { detail: { tool } }))
          },
          setRateLimitEnabled: (enabled) => {
            set({ rateLimitEnabled: enabled })
            updateGlobalRateLimiterConfig({ enabled })
          },
          setMaxRequestsPerMinute: (max) => {
            set({ maxRequestsPerMinute: max })
            updateGlobalRateLimiterConfig({ maxRequests: max })
          },
        }
    },
  {
      name: 'nasus-store-v2',
      partialize: (state) => {
        // Trim large tool result outputs in steps before persisting to avoid bloating localStorage
        const trimmedMessages: Record<string, Message[]> = {}
        for (const [tid, msgs] of Object.entries(state.messages)) {
          trimmedMessages[tid] = msgs.map((m) => {
            if (!m.steps || m.steps.length === 0) return m
            return {
              ...m,
                steps: m.steps.map((s) => {
                  if (s.kind === 'tool_result' && typeof s.output === 'string' && s.output.length > MAX_TOOL_RESULT_CHARS) {
                  return { ...s, output: s.output.slice(0, MAX_TOOL_RESULT_CHARS) + '\n[…truncated for storage]' }
                }
                return s
              }),
            }
          })
        }

          return {
            tasks: state.tasks,
            messages: trimmedMessages,
            // Only keep last 5 messages in rawHistory in localStorage for immediate reload
            // Full history is loaded from SQLite on demand
            rawHistory: Object.fromEntries(
              Object.entries(state.rawHistory).map(([tid, msgs]) => [tid, msgs.slice(-5)])
            ),
              // Do NOT persist the API key to localStorage — it is sensitive and
              // must only live in memory / the Tauri secure store.
              apiKey: '',
          model: state.model,
            workspacePath: state.workspacePath,
            recentWorkspacePaths: state.recentWorkspacePaths,
            apiBase: state.apiBase,
          provider: state.provider,
          activeTaskId: state.activeTaskId,
              exaKey: state.exaKey,
                maxIterations: state.maxIterations,
                onboardingComplete: state.onboardingComplete,
                  enableVerification: state.enableVerification,
              // openRouterModels and ollamaModels are persisted so the dropdown is populated immediately on reload.
              // They will be refreshed in the background on startup if the key is present.
                openRouterModels: state.openRouterModels,
                ollamaModels: state.ollamaModels,
                modelsLastFetched: state.modelsLastFetched,
                routerConfig: state.routerConfig,
                // Strip API keys from gateways before writing to localStorage.
                // Keys are sensitive and must not be stored in plaintext in the
                // browser's localStorage. They are held only in memory and in the
                // Tauri secure store (written via saveGatewayConfig).
                gateways: state.gateways.map(g => ({ ...g, apiKey: '' })),
                extensionConnected: state.extensionConnected,
                extensionVersion: state.extensionVersion,
                sidecarPromptShown: state.sidecarPromptShown,
                rateLimitEnabled: state.rateLimitEnabled,
                maxRequestsPerMinute: state.maxRequestsPerMinute,
                }
      },
      // On rehydration, clear any streaming:true flags left by a previous crashed session
      onRehydrateStorage: () => (state) => {
        if (!state) return

        // Initialize rate limiter with stored settings
        updateGlobalRateLimiterConfig({
          enabled: state.rateLimitEnabled ?? true,
          maxRequests: state.maxRequestsPerMinute ?? 60,
        })

        const fixedMessages: Record<string, Message[]> = {}
        for (const [tid, msgs] of Object.entries(state.messages)) {
          fixedMessages[tid] = msgs.map((m) =>
            m.streaming ? { ...m, streaming: false } : m,
          )
        }
        // Use setState to update rather than direct mutation (safer with zustand persist)
        useAppStore.setState({ messages: fixedMessages })

        // Trigger history load for active task from DB for full context
        if (state.activeTaskId) {
          getPersistedTaskHistory(state.activeTaskId).then(history => {
            if (history && history.length > 0) {
              useAppStore.setState(s => ({
                rawHistory: { ...s.rawHistory, [state.activeTaskId!]: history }
              }))
            }
          }).catch(err => {
            logger.warn('store', `Failed to load history for active task ${state.activeTaskId}`, err)
          })
        }

        // Seed workspaceVersions for any tasks that have persisted workspace data,
        // so getWorkspaceVersion() returns > 0 and components re-render correctly.
        import('./agent/workspace/WorkspaceManager').then(({ workspaceManager }) => {
          const tasks = state.tasks ?? []
          // Fire all workspace loads in parallel, log individual failures
          for (const task of tasks) {
            workspaceManager.getWorkspace(task.id).catch(err => {
              logger.warn('store', `Failed to load workspace for task ${task.id}`, err)
            })
          }
        }).catch(err => {
          logger.warn('store', 'Failed to load WorkspaceManager module', err)
        })
      },
    },
  ),
)
