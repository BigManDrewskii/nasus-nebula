import type { StateCreator } from 'zustand'
import type { Task, Message, AgentStep, LlmMessage } from '../types'
import { clearWorkspace, copyWorkspace } from '../agent/tools'
import { persistTaskHistory, deletePersistedTaskHistory, getPersistedTaskHistory } from '../tauri'
import { logger } from '../lib/logger'
import { MAX_TASKS, MAX_TOOL_RESULT_CHARS, MAX_RAW_HISTORY_LIVE } from '../lib/constants'
import { sanitizeMessages } from '../agent/messageUtils'

export const WELCOME_MESSAGE: Message = {
  id: 'welcome',
  author: 'agent',
  content:
    "Hi! I'm Nasus, your autonomous AI agent. I can browse the web, write and run code, analyze data, and complete complex tasks end-to-end. What would you like to accomplish?",
  timestamp: new Date(),
}

export const INITIAL_TASK: Task = {
  id: 'initial',
  title: 'Getting started',
  status: 'pending',
  createdAt: new Date(),
}

export interface TaskSlice {
  tasks: Task[]
  activeTaskId: string | null
  messages: Record<string, Message[]>
  /** Full raw LLM history per task — includes tool_calls / tool results for proper multi-turn context */
  rawHistory: Record<string, LlmMessage[]>

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
  setMessageContent: (taskId: string, messageId: string, content: string) => void
  setStreaming: (taskId: string, messageId: string, streaming: boolean) => void
  setError: (taskId: string, messageId: string, error: string) => void
  addStep: (taskId: string, messageId: string, step: AgentStep) => void
  updateStep: (taskId: string, messageId: string, step: AgentStep) => void
  updateSearchStatus: (taskId: string, messageId: string, step: AgentStep) => void
  setMessageModel: (taskId: string, messageId: string, modelId: string, modelName: string, provider: string) => void
  appendRawHistory: (taskId: string, msgs: LlmMessage[]) => void
}

export const createTaskSlice: StateCreator<TaskSlice, [['zustand/immer', never]], [], TaskSlice> = (set, get) => ({
  tasks: [INITIAL_TASK],
  activeTaskId: 'initial',
  messages: { initial: [WELCOME_MESSAGE] },
  rawHistory: {},

  setActiveTaskId: (id) => {
    set({ activeTaskId: id })
    if (id && (!get().rawHistory[id] || get().rawHistory[id].length === 0)) {
      getPersistedTaskHistory(id).then((history: unknown[] | null) => {
        if (history && history.length > 0) {
          // Sanitize on load — any incomplete tool_call blocks persisted from a previous
          // crash or mid-execution kill are silently dropped before being used as context.
          const cleaned = sanitizeMessages(history as LlmMessage[])
          set(state => ({
            rawHistory: { ...state.rawHistory, [id]: cleaned }
          }))
        }
      }).catch((err: unknown) => {
        logger.warn('store', `Failed to load history for task ${id}`, err)
      })
    }
  },

  addTask: (task) =>
    set((state) => {
      const tasks = [task, ...state.tasks]
      const messages = { ...state.messages, [task.id]: [WELCOME_MESSAGE] }
      const rawHistory = { ...state.rawHistory, [task.id]: [] }

      if (tasks.length > MAX_TASKS) {
        const pruned = tasks.slice(MAX_TASKS)
        for (const t of pruned) {
          delete messages[t.id]
          delete rawHistory[t.id]
          clearWorkspace(t.id).catch(err => {
            logger.warn('store', `Failed to cleanup workspace for pruned task ${t.id}`, err)
          })
        }
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
      clearWorkspace(id).catch((err: unknown) => {
        logger.warn('store', `Failed to cleanup workspace for deleted task ${id}`, err)
      })
      deletePersistedTaskHistory(id).catch((err: unknown) => {
        logger.warn('store', `Failed to delete history for task ${id}`, err)
      })
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
      copyWorkspace(id, newId)
      if (rawHistory[newId].length > 0) {
        persistTaskHistory(newId, rawHistory[newId]).catch((err: unknown) => {
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
        if (!msgs) return
        const msg = msgs.find((m) => m.id === messageId)
        if (msg) {
          msg.content += delta
        }
      }),

    setMessageContent: (taskId, messageId, content) =>
      set((state) => {
        const msgs = state.messages[taskId]
        if (!msgs) return
        const msg = msgs.find((m) => m.id === messageId)
        if (msg) {
          msg.content = content
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

  updateStep: (taskId, messageId, updatedStep) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [taskId]: (state.messages[taskId] ?? []).map((m) => {
          if (m.id !== messageId) return m
          if (updatedStep.kind !== 'tool_result') {
            return { ...m, steps: [...(m.steps ?? []), updatedStep] }
          }
          const callId = updatedStep.callId
          const existingCall = (m.steps ?? []).find(
            (s) => s.kind === 'tool_call' && s.callId === callId,
          )
          if (existingCall) {
            return {
              ...m,
              steps: (m.steps ?? []).map((s) =>
                s.kind === 'tool_call' && s.callId === callId
                  ? { ...s, result: updatedStep }
                  : s,
              ),
            }
          }
          return { ...m, steps: [...(m.steps ?? []), updatedStep] }
        }),
      },
    })),

  updateSearchStatus: (taskId, messageId, step) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [taskId]: (state.messages[taskId] ?? []).map((m) => {
          if (m.id !== messageId) return m
          if (step.kind !== 'search_status') return m
          const callId = step.callId
          const steps = m.steps ?? []
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
      // Sanitize before capping and persisting — prevents corrupt tool_call blocks
      // (assistant+tool_calls without matching tool results) from being saved to disk
      // and reloaded on the next session, which would cause sanitizeMessages warnings
      // on every subsequent LLM call and silently corrupt the conversation context.
      const sanitized = sanitizeMessages(appended)
      const capped = sanitized.length > MAX_RAW_HISTORY_LIVE
        ? sanitized.slice(-MAX_RAW_HISTORY_LIVE)
        : sanitized
      queueMicrotask(() => {
        persistTaskHistory(taskId, capped).catch((err: unknown) => {
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
})

// Partialize helper — called by the root store's partialize
export function partializeTaskSlice(state: TaskSlice): Partial<TaskSlice> {
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
    rawHistory: Object.fromEntries(
      Object.entries(state.rawHistory).map(([tid, msgs]) => [tid, msgs.slice(-5)])
    ),
    activeTaskId: state.activeTaskId,
  }
}
