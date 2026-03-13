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
    set((state) => { state.activeTaskId = id })
    if (id && (!get().rawHistory[id] || get().rawHistory[id].length === 0)) {
      getPersistedTaskHistory(id).then((history: unknown[] | null) => {
        if (history && history.length > 0) {
          const cleaned = sanitizeMessages(history as LlmMessage[])
          set((state) => { state.rawHistory[id] = cleaned })
        }
      }).catch((err: unknown) => {
        logger.warn('store', `Failed to load history for task ${id}`, err)
      })
    }
  },

  addTask: (task) =>
    set((state) => {
      state.tasks.unshift(task)
      state.messages[task.id] = [WELCOME_MESSAGE]
      state.rawHistory[task.id] = []

      if (state.tasks.length > MAX_TASKS) {
        const pruned = state.tasks.splice(MAX_TASKS)
        for (const t of pruned) {
          delete state.messages[t.id]
          delete state.rawHistory[t.id]
          clearWorkspace(t.id).catch(err => {
            logger.warn('store', `Failed to cleanup workspace for pruned task ${t.id}`, err)
          })
        }
        window.dispatchEvent(new CustomEvent('nasus:tasks-pruned', {
          detail: { count: pruned.length },
        }))
      }
    }),

  deleteTask: (id) =>
    set((state) => {
      const taskIdx = state.tasks.findIndex((t) => t.id === id)
      if (taskIdx === -1) return
      const wasActive = state.activeTaskId === id
      state.tasks.splice(taskIdx, 1)
      delete state.messages[id]
      delete state.rawHistory[id]
      if (wasActive) state.activeTaskId = state.tasks[0]?.id ?? null
      clearWorkspace(id).catch((err: unknown) => {
        logger.warn('store', `Failed to cleanup workspace for deleted task ${id}`, err)
      })
      deletePersistedTaskHistory(id).catch((err: unknown) => {
        logger.warn('store', `Failed to delete history for task ${id}`, err)
      })
    }),

  updateTaskTitle: (id, title) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (task) task.title = title
    }),

  updateTaskStatus: (id, status) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (task) task.status = status
    }),

  toggleTaskPin: (id) =>
    set((state) => {
      const task = state.tasks.find((t) => t.id === id)
      if (task) task.pinned = !task.pinned
    }),

  duplicateTask: (id) =>
    set((state) => {
      const source = state.tasks.find((t) => t.id === id)
      if (!source) return
      const newId = crypto.randomUUID()
      const newTask: Task = {
        ...source,
        id: newId,
        title: `${source.title} (copy)`,
        status: 'pending',
        createdAt: new Date(),
        pinned: false,
      }
      state.tasks.unshift(newTask)
      if (state.tasks.length > MAX_TASKS) state.tasks.splice(MAX_TASKS)
      state.messages[newId] = [WELCOME_MESSAGE]
      state.rawHistory[newId] = state.rawHistory[id] ? [...state.rawHistory[id]] : []
      state.activeTaskId = newId
      copyWorkspace(id, newId)
      if (state.rawHistory[newId].length > 0) {
        persistTaskHistory(newId, state.rawHistory[newId]).catch((err: unknown) => {
          logger.warn('store', `Failed to persist history for duplicated task ${newId}`, err)
        })
      }
    }),

  getMessages: (taskId) => get().messages[taskId] ?? [WELCOME_MESSAGE],
  getRawHistory: (taskId) => get().rawHistory[taskId] ?? [],

  addMessage: (taskId, message) =>
    set((state) => {
      (state.messages[taskId] ??= [WELCOME_MESSAGE]).push(message)
    }),

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
    set((state) => {
      const msg = (state.messages[taskId] ?? []).find((m) => m.id === messageId)
      if (msg) msg.streaming = streaming
    }),

  setError: (taskId, messageId, error) =>
    set((state) => {
      const msg = (state.messages[taskId] ?? []).find((m) => m.id === messageId)
      if (msg) { msg.error = error; msg.streaming = false }
    }),

  addStep: (taskId, messageId, step) =>
    set((state) => {
      const msg = (state.messages[taskId] ?? []).find((m) => m.id === messageId)
      if (!msg) return
      msg.steps ??= []
      msg.steps.push(step)
    }),

  updateStep: (taskId, messageId, updatedStep) =>
    set((state) => {
      const msg = (state.messages[taskId] ?? []).find((m) => m.id === messageId)
      if (!msg) return
      msg.steps ??= []
      if (updatedStep.kind !== 'tool_result') {
        msg.steps.push(updatedStep)
        return
      }
      const callId = updatedStep.callId
      const existingCall = msg.steps.find(
        (s) => s.kind === 'tool_call' && s.callId === callId,
      )
      if (existingCall) {
        (existingCall as { result?: unknown }).result = updatedStep
      } else {
        msg.steps.push(updatedStep)
      }
    }),

  updateSearchStatus: (taskId, messageId, step) =>
    set((state) => {
      const msg = (state.messages[taskId] ?? []).find((m) => m.id === messageId)
      if (!msg || step.kind !== 'search_status') return
      msg.steps ??= []
      const callId = step.callId
      let existingIdx = -1
      for (let i = msg.steps.length - 1; i >= 0; i--) {
        const s = msg.steps[i]
        if (s.kind === 'search_status' && s.callId === callId) { existingIdx = i; break }
      }
      if (existingIdx !== -1) {
        msg.steps[existingIdx] = step
      } else {
        msg.steps.push(step)
      }
    }),

  setMessageModel: (taskId, messageId, modelId, modelName, provider) =>
    set((state) => {
      const msg = (state.messages[taskId] ?? []).find((m) => m.id === messageId)
      if (msg) { msg.modelId = modelId; msg.modelName = modelName; msg.provider = provider }
    }),

  appendRawHistory: (taskId, msgs) =>
    set((state) => {
      const current = state.rawHistory[taskId] ?? []
      const appended = [...current, ...msgs]
      const sanitized = sanitizeMessages(appended)
      const capped = sanitized.length > MAX_RAW_HISTORY_LIVE
        ? sanitized.slice(-MAX_RAW_HISTORY_LIVE)
        : sanitized
      queueMicrotask(() => {
        persistTaskHistory(taskId, capped).catch((err: unknown) => {
          logger.warn('store', `Failed to persist history for task ${taskId}`, err)
        })
      })
      state.rawHistory[taskId] = capped
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
