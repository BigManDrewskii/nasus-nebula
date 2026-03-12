import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CheckpointApprovalPanel } from './CheckpointApprovalPanel'
import type { CheckpointPayload } from '../agent/sidecarClient'

// ---------------------------------------------------------------------------
// vi.mock must be declared at top level; do NOT reference module-scope vars
// inside the factory (they haven't been initialized at hoist time).
// ---------------------------------------------------------------------------

vi.mock('../store', () => ({
  useAppStore: vi.fn(),
}))

import { useAppStore } from '../store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockSetDecision = vi.fn()
const mockClearCheckpoint = vi.fn()

const baseCheckpoint: CheckpointPayload = {
  output_type: 'CHECKPOINT',
  session_id: 'sess1',
  plan_id: 'plan1',
  goal: 'write some code',
  pending_approvals: [
    { subtask_id: 'sub_1', module: 'M05', instruction: 'Write the auth module to disk' },
    { subtask_id: 'sub_2', module: 'M02', instruction: 'Call the GitHub API to create a repo' },
  ],
  created_at: '2026-01-01T00:00:00Z',
}

function mockStore({
  checkpoint = baseCheckpoint as CheckpointPayload | null,
  jobId = 'job_abc',
  msgId = 'msg_1',
  decisions = {} as Record<string, 'approve' | 'reject'>,
  activeTaskId = 'task_1',
} = {}) {
  const storeState = {
    pendingCheckpoint: checkpoint,
    checkpointJobId: jobId,
    checkpointMessageId: msgId,
    checkpointDecisions: decisions,
    activeTaskId,
    setCheckpointDecision: mockSetDecision,
    clearCheckpoint: mockClearCheckpoint,
  }
  vi.mocked(useAppStore).mockImplementation(
    (selector) => (selector as unknown as (s: typeof storeState) => unknown)(storeState),
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mockStore()
})

function renderPanel(messageId = 'msg_1') {
  return render(<CheckpointApprovalPanel messageId={messageId} />)
}

// ---------------------------------------------------------------------------

describe('CheckpointApprovalPanel', () => {
  it('renders nothing when pendingCheckpoint is null', () => {
    mockStore({ checkpoint: null })
    const { container } = renderPanel()
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when messageId does not match checkpointMessageId', () => {
    mockStore({ msgId: 'other_msg' })
    const { container } = renderPanel('msg_1')
    expect(container.firstChild).toBeNull()
  })

  it('renders header with awaiting approval text', () => {
    renderPanel()
    expect(screen.getByText('Awaiting Approval')).toBeTruthy()
  })

  it('renders one row per pending approval', () => {
    renderPanel()
    expect(screen.getByText('M05')).toBeTruthy()
    expect(screen.getByText('M02')).toBeTruthy()
    expect(screen.getByText('Write the auth module to disk')).toBeTruthy()
  })

  it('truncates long instructions at 120 chars', () => {
    const longInstruction = 'A'.repeat(130)
    mockStore({
      checkpoint: {
        ...baseCheckpoint,
        pending_approvals: [
          { subtask_id: 'sub_long', module: 'M05', instruction: longInstruction },
        ],
      },
    })
    renderPanel()
    const truncated = longInstruction.slice(0, 120) + '…'
    expect(screen.getByText(truncated)).toBeTruthy()
  })

  it('clicking Approve calls setCheckpointDecision with approve', () => {
    renderPanel()
    const approveButtons = screen.getAllByText('Approve')
    fireEvent.click(approveButtons[0])
    expect(mockSetDecision).toHaveBeenCalledWith('sub_1', 'approve')
  })

  it('clicking Reject calls setCheckpointDecision with reject', () => {
    renderPanel()
    const rejectButtons = screen.getAllByText('Reject')
    fireEvent.click(rejectButtons[1])
    expect(mockSetDecision).toHaveBeenCalledWith('sub_2', 'reject')
  })

  it('Resume button is disabled when not all decisions are made', () => {
    mockStore({ decisions: { sub_1: 'approve' } })
    renderPanel()
    const resumeBtn = screen.getByText('Resume Execution') as HTMLButtonElement
    expect(resumeBtn.disabled).toBe(true)
  })

  it('Resume button is enabled when all decisions are made', () => {
    mockStore({ decisions: { sub_1: 'approve', sub_2: 'reject' } })
    renderPanel()
    const resumeBtn = screen.getByText('Resume Execution') as HTMLButtonElement
    expect(resumeBtn.disabled).toBe(false)
  })

  it('clicking Resume dispatches nasus:checkpoint-resume-{taskId} event', () => {
    mockStore({ decisions: { sub_1: 'approve', sub_2: 'approve' } })
    const dispatched: CustomEvent[] = []
    const handler = (e: Event) => dispatched.push(e as CustomEvent)
    window.addEventListener('nasus:checkpoint-resume-task_1', handler)
    renderPanel()
    fireEvent.click(screen.getByText('Resume Execution'))
    window.removeEventListener('nasus:checkpoint-resume-task_1', handler)
    expect(dispatched).toHaveLength(1)
    expect(dispatched[0].detail).toEqual({ jobId: 'job_abc' })
  })

  it('clicking Cancel calls clearCheckpoint', () => {
    renderPanel()
    fireEvent.click(screen.getByText('Cancel'))
    expect(mockClearCheckpoint).toHaveBeenCalledOnce()
  })
})
