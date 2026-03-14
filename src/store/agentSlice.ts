import type { StateCreator } from 'zustand'
import type { ExecutionPlan } from '../agent/core/Agent'
import { stopWebAgent } from '../agent/index'

export interface PendingToolApproval {
  requestId: string
  tool: string
  args: Record<string, unknown>
  reason?: string
  taskId: string
}

export interface AgentSlice {
  pendingPlan: ExecutionPlan | null
  planApprovalStatus: 'pending' | 'approved' | 'rejected' | null
  currentPlan: ExecutionPlan | null
  currentPhase: number
  currentStep: number

  pendingToolApprovals: PendingToolApproval[]

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

  enqueuePendingToolApproval: (approval: PendingToolApproval) => void
  approveTool: (taskId: string, requestId: string) => void
  rejectTool: (taskId: string, requestId: string) => void
}

export const createAgentSlice: StateCreator<AgentSlice, [['zustand/immer', never]], [], AgentSlice> = (set, get) => ({
  pendingPlan: null,
  planApprovalStatus: null,
  currentPlan: null,
  currentPhase: 0,
  currentStep: 0,
  pendingToolApprovals: [],

  setPendingPlan: (plan) => set({ pendingPlan: plan }),
  setPlanApprovalStatus: (status) => set({ planApprovalStatus: status }),
  setCurrentPlan: (plan) => set({ currentPlan: plan }),
  setCurrentPhase: (phase) => set({ currentPhase: phase }),
  setCurrentStep: (step) => set({ currentStep: step }),

  approvePlan: (taskId: string, updatedPlan?: ExecutionPlan) => {
    set({ planApprovalStatus: 'approved', pendingPlan: null })
    window.dispatchEvent(new CustomEvent(`nasus:plan-approve-${taskId}`, {
      detail: updatedPlan ? { plan: updatedPlan } : undefined,
    }))
  },

  rejectPlan: (taskId: string) => {
    set({ planApprovalStatus: 'rejected', pendingPlan: null })
    window.dispatchEvent(new CustomEvent(`nasus:plan-reject-${taskId}`))
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

  enqueuePendingToolApproval: (approval) => {
    set((state) => { state.pendingToolApprovals.push(approval) })
  },
  approveTool: (taskId, requestId) => {
    set((state) => {
      state.pendingToolApprovals = state.pendingToolApprovals.filter(a => a.requestId !== requestId)
    })
    window.dispatchEvent(new CustomEvent(`nasus:tool-approved-${taskId}`, { detail: { requestId } }))
  },
  rejectTool: (taskId, requestId) => {
    set((state) => {
      state.pendingToolApprovals = state.pendingToolApprovals.filter(a => a.requestId !== requestId)
    })
    window.dispatchEvent(new CustomEvent(`nasus:tool-rejected-${taskId}`, { detail: { requestId } }))
  },
})
