/**
 * appSlice.ts
 * Zustand slice that exposes task-status and agent-step helpers consumed by the Orchestrator.
 * Merge this into your root store (createAppStore) alongside agentSlice and other slices.
 */

import type { StateCreator } from 'zustand'

// ─── Agent step shape ────────────────────────────────────────────────────────────────────────────────

export type AgentStepType = 'thought' | 'tool' | 'result' | 'error'

export interface AgentStep {
  id: string
  type: AgentStepType
  content: string
  tool?: string
  toolInput?: Record<string, unknown>
  toolOutput?: string
  timestamp?: string
}

// ─── Task status shape ────────────────────────────────────────────────────────────────────────────

export type TaskStatus =
  | 'idle'
  | 'planning'
  | 'awaiting_approval'
  | 'executing'
  | 'completed'
  | 'stopped'
  | 'error'

export interface TaskState {
  status: TaskStatus
  steps: AgentStep[]
}

// ─── Slice interface ──────────────────────────────────────────────────────────────────────────────────

export interface AppSlice {
  tasks: Record<string, TaskState>

  /** Update the status of a task (creates the task entry if it doesn't exist). */
  setStatus: (taskId: string, status: TaskStatus) => void

  /** Append an agent step to a task's step log. */
  addAgentStep: (taskId: string, step: AgentStep) => void

  /** Remove all state for a task (call after the task UI is unmounted). */
  clearTask: (taskId: string) => void
}

// ─── Slice implementation ──────────────────────────────────────────────────────────────────────────────

export const createAppSlice: StateCreator<
  AppSlice,
  [['zustand/immer', never]],
  [],
  AppSlice
> = (set) => ({
  tasks: {},

  setStatus: (taskId, status) =>
    set((state) => {
      if (!state.tasks[taskId]) {
        state.tasks[taskId] = { status, steps: [] }
      } else {
        state.tasks[taskId].status = status
      }
    }),

  addAgentStep: (taskId, step) =>
    set((state) => {
      if (!state.tasks[taskId]) {
        state.tasks[taskId] = { status: 'executing', steps: [step] }
      } else {
        state.tasks[taskId].steps.push(step)
      }
    }),

  clearTask: (taskId) =>
    set((state) => {
      delete state.tasks[taskId]
    }),
})
