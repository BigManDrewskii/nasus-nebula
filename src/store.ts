import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Task, Message, AgentStep } from './types'

interface AppState {
  tasks: Task[]
  activeTaskId: string | null
  messages: Record<string, Message[]>
  apiKey: string
  model: string
  workspacePath: string

  setActiveTaskId: (id: string | null) => void
  addTask: (task: Task) => void
  updateTaskTitle: (id: string, title: string) => void
  updateTaskStatus: (id: string, status: Task['status']) => void
  getMessages: (taskId: string) => Message[]
  addMessage: (taskId: string, message: Message) => void
  appendChunk: (taskId: string, messageId: string, delta: string) => void
  setStreaming: (taskId: string, messageId: string, streaming: boolean) => void
  addStep: (taskId: string, messageId: string, step: AgentStep) => void
  updateStep: (taskId: string, messageId: string, step: AgentStep) => void
  setApiKey: (key: string) => void
  setModel: (model: string) => void
  setWorkspacePath: (path: string) => void
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
      apiKey: '',
      model: 'anthropic/claude-3.5-sonnet',
      workspacePath: '',

      setActiveTaskId: (id) => set({ activeTaskId: id }),

      addTask: (task) =>
        set((state) => ({
          tasks: [task, ...state.tasks],
          messages: { ...state.messages, [task.id]: [WELCOME_MESSAGE] },
        })),

      updateTaskTitle: (id, title) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, title } : t)),
        })),

      updateTaskStatus: (id, status) =>
        set((state) => ({
          tasks: state.tasks.map((t) => (t.id === id ? { ...t, status } : t)),
        })),

      getMessages: (taskId) => get().messages[taskId] ?? [WELCOME_MESSAGE],

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

        // Appends a tool_result step; the matching tool_call stays in the list unchanged.
        // (The UI renders them as paired rows by callId — no in-place mutation needed.)
        updateStep: (taskId, messageId, updatedStep) =>
          set((state) => ({
            messages: {
              ...state.messages,
              [taskId]: (state.messages[taskId] ?? []).map((m) =>
                m.id === messageId
                  ? { ...m, steps: [...(m.steps ?? []), updatedStep] }
                  : m,
              ),
            },
          })),

      setApiKey: (key) => set({ apiKey: key }),
      setModel: (model) => set({ model }),
      setWorkspacePath: (path) => set({ workspacePath: path }),
    }),
    {
      name: 'nasus-store',
      partialize: (state) => ({
        tasks: state.tasks,
        messages: state.messages,
        apiKey: state.apiKey,
        model: state.model,
        workspacePath: state.workspacePath,
        activeTaskId: state.activeTaskId,
      }),
    },
  ),
)
