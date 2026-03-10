/**
 * agent.ts — shared agent / task types used across components and the store.
 * Import from here instead of redeclaring inline to avoid implicit-any errors.
 */

// ─── Re-export store types so components only need one import ─────────────────────────────────────────────

export type { AgentStep, AgentStepType, TaskStatus, TaskState } from '../store/appSlice'

// ─── Component prop types ───────────────────────────────────────────────────────────────────────────────

/** Props for any component that displays a single agent step. */
export interface AgentStepCardProps {
  step: import('../store/appSlice').AgentStep
  index: number
  isLast?: boolean
}

/** Props for any component that renders the full step list for a task. */
export interface AgentStepListProps {
  taskId: string
  steps: import('../store/appSlice').AgentStep[]
  status: import('../store/appSlice').TaskStatus
}

/** Props for the task-status badge / pill component. */
export interface TaskStatusBadgeProps {
  status: import('../store/appSlice').TaskStatus
  /** If provided, renders a spinner next to active states. */
  showSpinner?: boolean
}

// ─── Utility helpers ──────────────────────────────────────────────────────────────────────────────────────

/** Return true for terminal task statuses (no further updates expected). */
export function isTerminalStatus(status: import('../store/appSlice').TaskStatus): boolean {
  return status === 'completed' || status === 'stopped' || status === 'error'
}

/** Narrow an unknown event payload to a typed AgentStep (for SSE/WS parsers). */
export function parseAgentStep(raw: unknown): import('../store/appSlice').AgentStep | null {
  if (
    raw !== null &&
    typeof raw === 'object' &&
    'id' in raw &&
    'type' in raw &&
    'content' in raw
  ) {
    return raw as import('../store/appSlice').AgentStep
  }
  return null
}
