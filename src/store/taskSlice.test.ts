/**
 * taskSlice.test.ts
 *
 * Tests the storage transaction fixes applied in rounds B and D:
 *   B2 — appendRawHistory: debounced persist (_schedulePersist, 500ms)
 *   B3 — duplicateTask: deep copy of rawHistory (no shared object refs)
 *   B1 — deleteTask: async cleanup outside Immer set()
 *   D1 — deleteTask: contextBuilder.clearStablePrefix called
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

// ── Module mocks ──────────────────────────────────────────────────────────────

const mockClearWorkspace = vi.fn().mockResolvedValue(undefined)
const mockCopyWorkspace = vi.fn().mockResolvedValue(undefined)

vi.mock('../agent/tools', () => ({
  clearWorkspace: (...args: unknown[]) => mockClearWorkspace(...args),
  copyWorkspace: (...args: unknown[]) => mockCopyWorkspace(...args),
}))

const mockPersistTaskHistory = vi.fn().mockResolvedValue(undefined)
const mockDeletePersistedTaskHistory = vi.fn().mockResolvedValue(undefined)
const mockGetPersistedTaskHistory = vi.fn().mockResolvedValue(null)

vi.mock('../tauri', () => ({
  persistTaskHistory: (...args: unknown[]) => mockPersistTaskHistory(...args),
  deletePersistedTaskHistory: (...args: unknown[]) => mockDeletePersistedTaskHistory(...args),
  getPersistedTaskHistory: (...args: unknown[]) => mockGetPersistedTaskHistory(...args),
}))

vi.mock('../lib/logger', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

vi.mock('../agent/messageUtils', () => ({
  sanitizeMessages: vi.fn((msgs: unknown[]) => msgs),
}))

const mockClearStablePrefix = vi.fn()

vi.mock('../agent/context/ContextBuilder', () => ({
  contextBuilder: {
    clearStablePrefix: (...args: unknown[]) => mockClearStablePrefix(...args),
    updateStablePrefix: vi.fn(),
    build: vi.fn(),
  },
}))

// ── Store factory ─────────────────────────────────────────────────────────────

import { createTaskSlice, INITIAL_TASK, WELCOME_MESSAGE } from './taskSlice'
import type { TaskSlice } from './taskSlice'
import type { LlmMessage } from '../agent/llm'

function makeStore() {
  return create<TaskSlice>()(
    immer((set, get, api) => ({
      ...createTaskSlice(set, get, api),
    })),
  )
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('taskSlice', () => {
  let useStore: ReturnType<typeof makeStore>

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
    useStore = makeStore()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ── duplicateTask — Fix B3 ──────────────────────────────────────────────────

  describe('duplicateTask — deep copy of rawHistory (Fix B3)', () => {
    it('creates a new task with copied rawHistory', () => {
      const msg: LlmMessage = { role: 'user', content: 'hello' }
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [msg])

      useStore.getState().duplicateTask(INITIAL_TASK.id)
      const { tasks, rawHistory } = useStore.getState()

      expect(tasks).toHaveLength(2)
      const newId = tasks[0].id // unshift puts new task first
      expect(rawHistory[newId]).toHaveLength(rawHistory[INITIAL_TASK.id].length)
    })

    it('deep-copies rawHistory entries: mutating the original does not affect the copy', () => {
      const msg: LlmMessage = { role: 'user', content: 'original' }
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [msg])

      useStore.getState().duplicateTask(INITIAL_TASK.id)
      const { tasks, rawHistory } = useStore.getState()
      const newId = tasks[0].id

      // Verify no shared object references between original and copy
      const originalEntry = rawHistory[INITIAL_TASK.id][0]
      const copiedEntry = rawHistory[newId][0]
      expect(originalEntry).not.toBe(copiedEntry) // different object references
      expect(copiedEntry.content).toBe('original') // same value
    })

    it('mutating the copy does not affect the original', () => {
      const msg: LlmMessage = { role: 'user', content: 'shared?' }
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [msg])

      useStore.getState().duplicateTask(INITIAL_TASK.id)
      const state = useStore.getState()
      const newId = state.tasks[0].id

      // Directly mutate the copy's entry
      useStore.setState((s) => {
        if (s.rawHistory[newId][0]) {
          s.rawHistory[newId][0].content = 'mutated'
        }
      })

      // Original must be unchanged
      const original = useStore.getState().rawHistory[INITIAL_TASK.id][0]
      expect(original.content).toBe('shared?')
    })

    it('calls copyWorkspace outside the Immer set()', async () => {
      useStore.getState().duplicateTask(INITIAL_TASK.id)
      await vi.runAllTimersAsync()
      expect(mockCopyWorkspace).toHaveBeenCalledOnce()
    })

    it('new task title is suffixed with " (copy)"', () => {
      useStore.getState().duplicateTask(INITIAL_TASK.id)
      const { tasks } = useStore.getState()
      expect(tasks[0].title).toContain('(copy)')
    })

    it('new task is set as the active task', () => {
      useStore.getState().duplicateTask(INITIAL_TASK.id)
      const { tasks, activeTaskId } = useStore.getState()
      expect(activeTaskId).toBe(tasks[0].id)
    })

    it('new task status is "pending" regardless of the original status', () => {
      useStore.getState().updateTaskStatus(INITIAL_TASK.id, 'running')
      useStore.getState().duplicateTask(INITIAL_TASK.id)
      expect(useStore.getState().tasks[0].status).toBe('pending')
    })
  })

  // ── deleteTask — Fix B1 + D1 ───────────────────────────────────────────────

  describe('deleteTask — async cleanup and contextBuilder cleanup (Fix B1 + D1)', () => {
    it('removes the task from the tasks array synchronously', () => {
      useStore.getState().deleteTask(INITIAL_TASK.id)
      expect(useStore.getState().tasks).toHaveLength(0)
    })

    it('removes messages and rawHistory for the deleted task', () => {
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'user', content: 'x' }])
      useStore.getState().deleteTask(INITIAL_TASK.id)

      const { messages, rawHistory } = useStore.getState()
      expect(messages[INITIAL_TASK.id]).toBeUndefined()
      expect(rawHistory[INITIAL_TASK.id]).toBeUndefined()
    })

    it('calls clearWorkspace after the state update', async () => {
      useStore.getState().deleteTask(INITIAL_TASK.id)
      // State update is sync — workspace cleanup is async
      expect(mockClearWorkspace).toHaveBeenCalledWith(INITIAL_TASK.id)
    })

    it('calls deletePersistedTaskHistory after the state update', () => {
      useStore.getState().deleteTask(INITIAL_TASK.id)
      expect(mockDeletePersistedTaskHistory).toHaveBeenCalledWith(INITIAL_TASK.id)
    })

    it('calls contextBuilder.clearStablePrefix (Fix D1)', () => {
      useStore.getState().deleteTask(INITIAL_TASK.id)
      expect(mockClearStablePrefix).toHaveBeenCalledWith(INITIAL_TASK.id)
    })

    it('sets activeTaskId to the next task when the active task is deleted', () => {
      const newTask = { id: 'task-2', title: 'Second', status: 'pending' as const, createdAt: new Date() }
      useStore.getState().addTask(newTask)
      useStore.getState().setActiveTaskId(INITIAL_TASK.id)

      useStore.getState().deleteTask(INITIAL_TASK.id)
      expect(useStore.getState().activeTaskId).toBe('task-2')
    })

    it('sets activeTaskId to null when the last task is deleted', () => {
      useStore.getState().deleteTask(INITIAL_TASK.id)
      expect(useStore.getState().activeTaskId).toBeNull()
    })

    it('is a no-op for an unknown task ID', () => {
      const before = useStore.getState().tasks.length
      useStore.getState().deleteTask('does-not-exist')
      expect(useStore.getState().tasks.length).toBe(before)
      expect(mockClearWorkspace).not.toHaveBeenCalled()
    })
  })

  // ── appendRawHistory — Fix B2 ──────────────────────────────────────────────

  describe('appendRawHistory — debounced persist (Fix B2)', () => {
    it('updates rawHistory in the store synchronously', () => {
      const msg: LlmMessage = { role: 'user', content: 'test' }
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [msg])
      expect(useStore.getState().rawHistory[INITIAL_TASK.id]).toHaveLength(1)
    })

    it('does NOT call persistTaskHistory immediately (debounced)', () => {
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'user', content: 'x' }])
      // No timers advanced — persist should not have fired yet
      expect(mockPersistTaskHistory).not.toHaveBeenCalled()
    })

    it('calls persistTaskHistory after 500ms debounce', async () => {
      const msg: LlmMessage = { role: 'user', content: 'deferred' }
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [msg])

      await vi.advanceTimersByTimeAsync(500)

      expect(mockPersistTaskHistory).toHaveBeenCalledOnce()
      expect(mockPersistTaskHistory).toHaveBeenCalledWith(
        INITIAL_TASK.id,
        expect.arrayContaining([expect.objectContaining({ content: 'deferred' })]),
      )
    })

    it('debounces rapid successive calls — only the last one triggers persist', async () => {
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'user', content: 'a' }])
      await vi.advanceTimersByTimeAsync(200) // half debounce
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'assistant', content: 'b' }])
      await vi.advanceTimersByTimeAsync(200) // still within debounce of 2nd call
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'user', content: 'c' }])

      expect(mockPersistTaskHistory).not.toHaveBeenCalled()

      await vi.advanceTimersByTimeAsync(500) // debounce expires for 3rd call

      expect(mockPersistTaskHistory).toHaveBeenCalledOnce()
    })

    it('persists the latest accumulated state when debounce fires', async () => {
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'user', content: 'first' }])
      await vi.advanceTimersByTimeAsync(200)
      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'assistant', content: 'second' }])
      await vi.advanceTimersByTimeAsync(500)

      const [, persistedHistory] = mockPersistTaskHistory.mock.calls[0]
      expect(persistedHistory).toHaveLength(2)
      expect(persistedHistory[1].content).toBe('second')
    })

    it('caps history at MAX_RAW_HISTORY_LIVE (120) messages', () => {
      const msgs: LlmMessage[] = Array.from({ length: 130 }, (_, i) => ({
        role: 'user' as const,
        content: `msg-${i}`,
      }))
      useStore.getState().appendRawHistory(INITIAL_TASK.id, msgs)
      const stored = useStore.getState().rawHistory[INITIAL_TASK.id]
      expect(stored.length).toBeLessThanOrEqual(120)
    })

    it('independent debounce timers per task', async () => {
      const newTask = { id: 'task-b', title: 'B', status: 'pending' as const, createdAt: new Date() }
      useStore.getState().addTask(newTask)

      useStore.getState().appendRawHistory(INITIAL_TASK.id, [{ role: 'user', content: 'for-initial' }])
      await vi.advanceTimersByTimeAsync(500) // fire initial's timer

      useStore.getState().appendRawHistory('task-b', [{ role: 'user', content: 'for-b' }])
      await vi.advanceTimersByTimeAsync(100) // too soon for task-b

      // Only the initial task's persist should have fired
      expect(mockPersistTaskHistory).toHaveBeenCalledTimes(1)
      expect(mockPersistTaskHistory.mock.calls[0][0]).toBe(INITIAL_TASK.id)

      await vi.advanceTimersByTimeAsync(400) // fire task-b's timer
      expect(mockPersistTaskHistory).toHaveBeenCalledTimes(2)
      expect(mockPersistTaskHistory.mock.calls[1][0]).toBe('task-b')
    })
  })

  // ── addTask — Fix B1 ───────────────────────────────────────────────────────

  describe('addTask — workspace cleanup outside Immer set()', () => {
    it('adds the task to the front of the list', () => {
      const newTask = { id: 'new-1', title: 'New', status: 'pending' as const, createdAt: new Date() }
      useStore.getState().addTask(newTask)
      expect(useStore.getState().tasks[0].id).toBe('new-1')
    })

    it('initializes messages and rawHistory for the new task', () => {
      const newTask = { id: 'new-2', title: 'New', status: 'pending' as const, createdAt: new Date() }
      useStore.getState().addTask(newTask)
      expect(useStore.getState().messages['new-2']).toEqual([WELCOME_MESSAGE])
      expect(useStore.getState().rawHistory['new-2']).toEqual([])
    })
  })
})
