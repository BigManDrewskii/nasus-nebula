import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Message, AgentStep, LlmMessage } from './types'

interface AppState {
  tasks: Task[]
  activeTaskId: string | null
  messages: Record<string, Message[]>
  // Full raw LLM history per task — includes tool_calls / tool results for proper multi-turn context
  rawHistory: Record<string, LlmMessage[]>
  apiKey: string
  model: string
  workspacePath: string
  apiBase: string
  provider: string
  dynamicModels: string[]

  setActiveTaskId: (id: string | null) => void
  setDynamicModels: (models: string[]) => void
  addTask: (task: Task) => void
  deleteTask: (id: string) => void
  updateTaskTitle: (id: string, title: string) => void
  updateTaskStatus: (id: string, status: Task['status']) => void
  getMessages: (taskId: string) => Message[]
  getRawHistory: (taskId: string) => LlmMessage[]
  addMessage: (taskId: string, message: Message) => void
  appendChunk: (taskId: string, messageId: string, delta: string) => void
  setStreaming: (taskId: string, messageId: string, streaming: boolean) => void
  setError: (taskId: string, messageId: string, error: string) => void
  addStep: (taskId: string, messageId: string, step: AgentStep) => void
  updateStep: (taskId: string, messageId: string, step: AgentStep) => void
  appendRawHistory: (taskId: string, msgs: LlmMessage[]) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setWorkspacePath: (path: string) => void
  setApiBase: (base: string) => void
  setProvider: (provider: string) => void
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
    (set, get) => ({
      tasks: [INITIAL_TASK],
      activeTaskId: 'initial',
      messages: { initial: [WELCOME_MESSAGE] },
      rawHistory: {},
        apiKey: '',
        model: 'anthropic/claude-3.5-sonnet',
        workspacePath: '',
        apiBase: 'https://openrouter.ai/api/v1',
        provider: 'openrouter',
        dynamicModels: [],

        setActiveTaskId: (id) => set({ activeTaskId: id }),
        setDynamicModels: (models) => set({ dynamicModels: models }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
          messages: { ...state.messages, [task.id]: [WELCOME_MESSAGE] },
          rawHistory: { ...state.rawHistory, [task.id]: [] },
        })),

      deleteTask: (id) =>
        set((state) => {
          const tasks = state.tasks.filter((t) => t.id !== id)
          const messages = { ...state.messages }
          const rawHistory = { ...state.rawHistory }
          delete messages[id]
          delete rawHistory[id]
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
          const msgs = state.messages[taskId] ?? []
          return {
            messages: {
              ...state.messages,
              [taskId]: msgs.map((m) =>
                m.id === messageId ? { ...m, content: m.content + delta } : m,
              ),
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
        setApiBase: (base) => set({ apiBase: base }),
        setProvider: (provider) => set({ provider }),
    }),
    {
      name: 'nasus-store-v2',
      partialize: (state) => ({
        tasks: state.tasks,
        messages: state.messages,
        rawHistory: state.rawHistory,
        apiKey: state.apiKey,
        model: state.model,
        workspacePath: state.workspacePath,
        apiBase: state.apiBase,
        provider: state.provider,
        activeTaskId: state.activeTaskId,
      }),
      // On rehydration, clear any streaming:true flags left by a previous crashed session
      onRehydrateStorage: () => (state) => {
        if (!state) return
        const fixedMessages: Record<string, Message[]> = {}
        for (const [tid, msgs] of Object.entries(state.messages)) {
          fixedMessages[tid] = msgs.map((m) =>
            m.streaming ? { ...m, streaming: false, error: m.error ?? undefined } : m,
          )
        }
        state.messages = fixedMessages
      },
    },
  ),
)
