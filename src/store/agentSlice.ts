import type { StateCreator } from 'zustand'
import type { ExecutionPlan } from '../agent/core/Agent'

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
  approvePlan: () => void
  rejectPlan: () => void

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

  approvePlan: () => {
    const activeTaskId = (get() as { activeTaskId?: string | null }).activeTaskId
    set({ planApprovalStatus: 'approved', pendingPlan: null, currentPlan: null })
    if (activeTaskId) {
      window.dispatchEvent(new CustomEvent(`nasus:plan-approve-${activeTaskId}`))
    }
  },

  rejectPlan: () => {
    set({ planApprovalStatus: 'rejected', pendingPlan: null })
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
