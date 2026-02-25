import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Message, AgentStep, LlmMessage } from './types'
import { clearWorkspace, copyWorkspace } from './agent/tools'
import type { OpenRouterModel } from './agent/llm'

// ── Router config ──────────────────────────────────────────────────────────────
export interface RouterModelOverrides {
  [modelId: string]: boolean
}

export interface RouterConfig {
  /** 'auto' or a specific model ID */
  mode: string
  /** 'free' | 'paid' */
  budget: string
  modelOverrides: RouterModelOverrides
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
}

interface AppState {
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
  // Per-task router state (model used, cost, etc.) keyed by taskId
  taskRouterState: Record<string, TaskRouterState>
      /** Full rich model list fetched from OpenRouter /models */
      openRouterModels: OpenRouterModel[]
      /** Flat sorted ID list — kept for backwards compat */
      dynamicModels: string[]
      /** Unix ms timestamp of last successful models fetch — used to decide when to refresh */
      modelsLastFetched: number
        braveSearchKey: string
        googleCseKey: string
        googleCseId: string
        serperKey: string
        tavilyKey: string
        searxngUrl: string
        // 'auto' | 'brave' | 'google' | 'searxng' | 'ddg' | 'serper' | 'tavily'
        searchProvider: string
      maxIterations: number
      /** Set to true after the user completes onboarding */
      onboardingComplete: boolean
        // Code execution (BYOK sandboxes)
        e2bApiKey: string
        /** 'e2b' | 'pyodide' | 'disabled' */
        executionMode: string
        /** Live sandbox status shown in UI */
        sandboxStatus: 'idle' | 'starting' | 'ready' | 'error'
        sandboxStatusMessage: string

  setActiveTaskId: (id: string | null) => void
  setOpenRouterModels: (models: OpenRouterModel[]) => void
  setDynamicModels: (models: string[]) => void
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
  appendRawHistory: (taskId: string, msgs: LlmMessage[]) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setWorkspacePath: (path: string) => void
  addRecentWorkspacePath: (path: string) => void
  setApiBase: (base: string) => void
  setProvider: (provider: string) => void
    setBraveSearchKey: (key: string) => void
    setGoogleCseKey: (key: string) => void
    setGoogleCseId: (id: string) => void
    setSerperKey: (key: string) => void
    setTavilyKey: (key: string) => void
    setSearxngUrl: (url: string) => void
      setSearchProvider: (provider: string) => void
      setMaxIterations: (n: number) => void
      setOnboardingComplete: () => void
        setE2bApiKey: (key: string) => void
        setExecutionMode: (mode: string) => void
        setSandboxStatus: (status: 'idle' | 'starting' | 'ready' | 'error', message?: string) => void
  setRouterConfig: (config: Partial<RouterConfig>) => void
  setTaskRouterState: (taskId: string, state: Partial<TaskRouterState>) => void
}

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_TASKS = 50
const MAX_TOOL_RESULT_CHARS = 2000  // Truncate large tool outputs before persisting
const MAX_RAW_HISTORY_LIVE = 120    // In-memory cap — prevents OOM on very long runs

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
    (set, get) => ({
      tasks: [INITIAL_TASK],
      activeTaskId: 'initial',
      messages: { initial: [WELCOME_MESSAGE] },
      rawHistory: {},
          apiKey: '',
          model: 'anthropic/claude-3.7-sonnet',
        workspacePath: '',
        recentWorkspacePaths: [],
        apiBase: 'https://openrouter.ai/api/v1',
        provider: 'openrouter',
          openRouterModels: [],
          dynamicModels: [],
          modelsLastFetched: 0,
            braveSearchKey: '',
            googleCseKey: '',
            googleCseId: '',
            serperKey: '',
            tavilyKey: '',
            searxngUrl: '',
              searchProvider: 'auto',
              maxIterations: 50,
              onboardingComplete: false,
              e2bApiKey: '',
                  executionMode: 'e2b',
                  sandboxStatus: 'idle',
                  sandboxStatusMessage: '',
          routerConfig: {
            mode: 'auto',
            budget: 'paid',
            modelOverrides: {},
          },
          taskRouterState: {},

        setActiveTaskId: (id) => set({ activeTaskId: id }),
          setOpenRouterModels: (models) => set({ openRouterModels: models, dynamicModels: models.map((m) => m.id), modelsLastFetched: Date.now() }),
        setDynamicModels: (models) => set({ dynamicModels: models }),

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
                  clearWorkspace(t.id)
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
          // Also clean up persisted workspace files for this task
          clearWorkspace(id)
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
            const rawHistory = { ...state.rawHistory, [newId]: [] }
            // Copy workspace files from source to new task
            copyWorkspace(id, newId)
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

        appendRawHistory: (taskId, msgs) =>
          set((state) => {
            const current = state.rawHistory[taskId] ?? []
            const appended = [...current, ...msgs]
            // Cap in-memory size to prevent OOM on very long runs
            const capped = appended.length > MAX_RAW_HISTORY_LIVE
              ? appended.slice(-MAX_RAW_HISTORY_LIVE)
              : appended
            return {
              rawHistory: {
                ...state.rawHistory,
                [taskId]: capped,
              },
            }
          }),

            setApiKey: (key) => set({ apiKey: key }),
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
            setProvider: (provider) => set({ provider }),
              setBraveSearchKey: (key) => set({ braveSearchKey: key }),
              setGoogleCseKey: (key) => set({ googleCseKey: key }),
              setGoogleCseId: (id) => set({ googleCseId: id }),
              setSerperKey: (key) => set({ serperKey: key }),
              setTavilyKey: (key) => set({ tavilyKey: key }),
              setSearxngUrl: (url) => set({ searxngUrl: url }),
              setSearchProvider: (provider) => set({ searchProvider: provider }),
              setMaxIterations: (n) => set({ maxIterations: n }),
              setOnboardingComplete: () => set({ onboardingComplete: true }),
                setE2bApiKey: (key) => set({ e2bApiKey: key }),
                setExecutionMode: (mode) => set({ executionMode: mode }),
                setSandboxStatus: (status, message = '') => set({ sandboxStatus: status, sandboxStatusMessage: message }),
        setRouterConfig: (config) =>
          set((state) => ({ routerConfig: { ...state.routerConfig, ...config } })),
        setTaskRouterState: (taskId, state) =>
          set((s) => ({
            taskRouterState: {
              ...s.taskRouterState,
              [taskId]: { ...(s.taskRouterState[taskId] ?? { modelId: '', displayName: '', reason: '', totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0, callCount: 0, isFree: false }), ...state },
            },
          })),
    }),
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
            // Trim rawHistory to last 60 messages per task to avoid localStorage bloat
            rawHistory: Object.fromEntries(
              Object.entries(state.rawHistory).map(([tid, msgs]) => [tid, msgs.slice(-60)])
            ),
            apiKey: state.apiKey,
          model: state.model,
            workspacePath: state.workspacePath,
            recentWorkspacePaths: state.recentWorkspacePaths,
            apiBase: state.apiBase,
          provider: state.provider,
          activeTaskId: state.activeTaskId,
              braveSearchKey: state.braveSearchKey,
              googleCseKey: state.googleCseKey,
              googleCseId: state.googleCseId,
              serperKey: state.serperKey,
              tavilyKey: state.tavilyKey,
              searxngUrl: state.searxngUrl,
              searchProvider: state.searchProvider,
                maxIterations: state.maxIterations,
                onboardingComplete: state.onboardingComplete,
                  e2bApiKey: state.e2bApiKey,
                  executionMode: state.executionMode,
              // openRouterModels is persisted so the dropdown is populated immediately on reload.
              // It will be refreshed in the background on startup if the key is present.
                openRouterModels: state.openRouterModels,
                dynamicModels: state.dynamicModels,
                modelsLastFetched: state.modelsLastFetched,
                routerConfig: state.routerConfig,
                }
      },
        // On rehydration, clear any streaming:true flags left by a previous crashed session
        onRehydrateStorage: () => (state) => {
          if (!state) return
          const fixedMessages: Record<string, Message[]> = {}
          for (const [tid, msgs] of Object.entries(state.messages)) {
            fixedMessages[tid] = msgs.map((m) =>
              m.streaming ? { ...m, streaming: false } : m,
            )
          }
          // Use setState to update rather than direct mutation (safer with zustand persist)
          useAppStore.setState({ messages: fixedMessages })

          // Seed workspaceVersions for any tasks that have persisted workspace data,
          // so getWorkspaceVersion() returns > 0 and components re-render correctly.
          import('./agent/tools').then(({ getWorkspace }) => {
            for (const task of state.tasks ?? []) {
              // Calling getWorkspace lazily loads from localStorage and seeds the version
              getWorkspace(task.id)
            }
          }).catch(() => {})
        },
    },
  ),
)
