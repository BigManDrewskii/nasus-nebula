import type { StateCreator } from 'zustand'
import type { ExecutionPlan } from '../agent/core/Agent'
import { stopWebAgent } from '../agent/index'

export interface AgentSlice {
  pendingPlan: ExecutionPlan | null
  planApprovalStatus: 'pending' | 'approved' | 'rejected' | null
  currentPlan: ExecutionPlan | null
  currentPhase: number
  currentStep: number

  pendingToolApproval: { tool: string; args: Record<string, unknown>; reason?: string; taskId: string } | null

  setPendingPlan: (plan: ExecutionPlan | null) => void
  setPlanApprovalStatus: (status: 'pending' | 'approved' | 'rejected' | null) => void
  setCurrentPlan: (plan: ExecutionPlan | null) => void
  setCurrentPhase: (phase: number) => void
  setCurrentStep: (step: number) => void
  /** Approve the pending plan. Pass the taskId explicitly so it's always correct.
   *  Optionally pass an updatedPlan if the user edited the plan before approving. */
  approvePlan: (taskId: string, updatedPlan?: ExecutionPlan) => void
  /** Reject (Skip) the pending plan. Stops the agent and sets task to 'stopped'. */
  rejectPlan: (taskId: string) => void

  resetPlanState: () => void

  setPendingToolApproval: (approval: { tool: string; args: Record<string, unknown>; reason?: string; taskId: string } | null) => void
  approveTool: (taskId: string, tool: string) => void
  rejectTool: (taskId: string, tool: string) => void
}

export const createAgentSlice: StateCreator<AgentSlice, [['zustand/immer', never]], [], AgentSlice> = (set, get) => ({
  pendingPlan: null,
  planApprovalStatus: null,
  currentPlan: null,
  currentPhase: 0,
  currentStep: 0,
  pendingToolApproval: null,

  setPendingPlan: (plan) => set({ pendingPlan: plan }),
  setPlanApprovalStatus: (status) => set({ planApprovalStatus: status }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setCurrentStep: (step) => set({ currentStep: step }),

  approvePlan: (taskId: string, updatedPlan?: ExecutionPlan) => {
    // Clear pendingPlan but do NOT null currentPlan here — the Orchestrator's
    // waitForApproval reads plan from the event detail then calls setCurrentPlan().
    // Nulling it here races with that assignment and causes a blank plan execution.
    set({ planApprovalStatus: 'approved', pendingPlan: null })
    // Dispatch AFTER state update so subscribers see approved status first
    window.dispatchEvent(new CustomEvent(`nasus:plan-approve-${taskId}`, {
      detail: updatedPlan ? { plan: updatedPlan } : undefined,
    }))
  },

  rejectPlan: (taskId: string) => {
    set({ planApprovalStatus: 'rejected', pendingPlan: null })
    // Fire the reject event FIRST — the Orchestrator's waitForApproval is listening
    // for this event. If we call stopWebAgent() first, the AbortSignal fires and
    // resolves the Promise as 'cancelled' before 'rejected', causing the wrong status.
    window.dispatchEvent(new CustomEvent(`nasus:plan-reject-${taskId}`))
    // Stop the agent after a microtask so the event handler runs first
    Promise.resolve().then(() => {
      stopWebAgent(taskId)
      const store = get() as { updateTaskStatus?: (id: string, status: string) => void }
      if (store.updateTaskStatus) store.updateTaskStatus(taskId, 'stopped')
    })
  },

  resetPlanState: () => {
    set({
      pendingPlan: null,
      planApprovalStatus: null,
      currentPlan: null,
      currentPhase: 0,
      currentStep: 0,
    })
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
})
