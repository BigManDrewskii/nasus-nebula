import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Message, AgentStep, LlmMessage } from './types'
import { clearWorkspace } from './agent/tools'

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
    dynamicModels: string[]
      braveSearchKey: string
      googleCseKey: string
      googleCseId: string
      // 'auto' | 'brave' | 'google' | 'searxng' | 'ddg'
      searchProvider: string
      maxIterations: number
      /** Set to true after the user completes onboarding */
      onboardingComplete: boolean
      // Code execution (BYOK sandboxes)
      e2bApiKey: string
      daytonaApiKey: string
      daytonaApiUrl: string
      /** 'auto' | 'e2b' | 'daytona' | 'pyodide' | 'disabled' */
      executionMode: string

  setActiveTaskId: (id: string | null) => void
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
      setSearchProvider: (provider: string) => void
      setMaxIterations: (n: number) => void
      setOnboardingComplete: () => void
      setE2bApiKey: (key: string) => void
      setDaytonaApiKey: (key: string) => void
      setDaytonaApiUrl: (url: string) => void
      setExecutionMode: (mode: string) => void
}

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_TASKS = 50
const MAX_TOOL_RESULT_CHARS = 2000  // Truncate large tool outputs before persisting

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
          dynamicModels: [],
          braveSearchKey: '',
          googleCseKey: '',
          googleCseId: '',
              searchProvider: 'auto',
              maxIterations: 50,
              onboardingComplete: false,
              e2bApiKey: '',
              daytonaApiKey: '',
              daytonaApiUrl: '',
              executionMode: 'auto',

        setActiveTaskId: (id) => set({ activeTaskId: id }),
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
          set((state) => ({
            rawHistory: {
              ...state.rawHistory,
              [taskId]: [...(state.rawHistory[taskId] ?? []), ...msgs],
            },
          })),

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
              setSearchProvider: (provider) => set({ searchProvider: provider }),
              setMaxIterations: (n) => set({ maxIterations: n }),
              setOnboardingComplete: () => set({ onboardingComplete: true }),
              setE2bApiKey: (key) => set({ e2bApiKey: key }),
              setDaytonaApiKey: (key) => set({ daytonaApiKey: key }),
              setDaytonaApiUrl: (url) => set({ daytonaApiUrl: url }),
              setExecutionMode: (mode) => set({ executionMode: mode }),
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
                if (s.kind === 'tool_call' && s.result && typeof s.result.output === 'string' && s.result.output.length > MAX_TOOL_RESULT_CHARS) {
                  return { ...s, result: { ...s.result, output: s.result.output.slice(0, MAX_TOOL_RESULT_CHARS) + '\n[…truncated for storage]' } }
                }
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
              searchProvider: state.searchProvider,
                maxIterations: state.maxIterations,
                onboardingComplete: state.onboardingComplete,
                e2bApiKey: state.e2bApiKey,
                daytonaApiKey: state.daytonaApiKey,
                daytonaApiUrl: state.daytonaApiUrl,
                executionMode: state.executionMode,
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
      },
    },
  ),
)
