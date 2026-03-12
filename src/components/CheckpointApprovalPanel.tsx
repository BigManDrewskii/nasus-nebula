/**
 * CheckpointApprovalPanel
 *
 * Rendered inline below the last agent message when execute_plan returns
 * a CHECKPOINT dict (output_type === 'CHECKPOINT'). Shows each subtask
 * awaiting HITL approval with Approve / Reject toggles and a Resume button
 * that fires once all decisions are recorded.
 */

import { useAppStore } from '../store'

const MODULE_COLOR: Record<string, string> = {
  M02: '#f97316',  // API integrator — network side-effects
  M03: '#8b5cf6',  // Web browser — destructive browsing
  M05: '#3b82f6',  // Code engineer — writes to disk
}

function ModuleBadge({ module }: { module: string }) {
  const color = MODULE_COLOR[module] ?? 'var(--tx-tertiary)'
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: '0.05em',
        color,
        background: `${color}22`,
        borderRadius: 4,
        padding: '2px 6px',
        flexShrink: 0,
      }}
    >
      {module}
    </span>
  )
}

function DecisionToggle({
  decision,
  onChange,
}: {
  decision: 'approve' | 'reject' | undefined
  onChange: (d: 'approve' | 'reject') => void
}) {
  return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
      <button
        onClick={() => onChange('approve')}
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: '3px 10px',
          borderRadius: 4,
          border: '1px solid',
          cursor: 'pointer',
          background: decision === 'approve' ? '#22c55e22' : 'transparent',
          borderColor: decision === 'approve' ? '#22c55e' : 'var(--border)',
          color: decision === 'approve' ? '#22c55e' : 'var(--tx-secondary)',
          transition: 'all 0.1s',
        }}
      >
        Approve
      </button>
      <button
        onClick={() => onChange('reject')}
        style={{
          fontSize: 11,
          fontWeight: 500,
          padding: '3px 10px',
          borderRadius: 4,
          border: '1px solid',
          cursor: 'pointer',
          background: decision === 'reject' ? '#ef444422' : 'transparent',
          borderColor: decision === 'reject' ? '#ef4444' : 'var(--border)',
          color: decision === 'reject' ? '#ef4444' : 'var(--tx-secondary)',
          transition: 'all 0.1s',
        }}
      >
        Reject
      </button>
    </div>
  )
}

export function CheckpointApprovalPanel({ messageId }: { messageId: string }) {
  const pendingCheckpoint  = useAppStore(s => s.pendingCheckpoint)
  const checkpointJobId    = useAppStore(s => s.checkpointJobId)
  const checkpointMsgId    = useAppStore(s => s.checkpointMessageId)
  const decisions          = useAppStore(s => s.checkpointDecisions)
  const activeTaskId       = useAppStore(s => s.activeTaskId)
  const setDecision        = useAppStore(s => s.setCheckpointDecision)
  const clearCheckpoint    = useAppStore(s => s.clearCheckpoint)

  if (!pendingCheckpoint || checkpointMsgId !== messageId) return null

  const approvals = pendingCheckpoint.pending_approvals
  const allDecided = approvals.every(a => decisions[a.subtask_id] !== undefined)

  function handleResume() {
    if (!activeTaskId || !checkpointJobId) return
    window.dispatchEvent(
      new CustomEvent(`nasus:checkpoint-resume-${activeTaskId}`, {
        detail: { jobId: checkpointJobId },
      }),
    )
  }

  function handleCancel() {
    clearCheckpoint()
  }

  return (
    <div
      style={{
        marginTop: 16,
        border: '1px solid var(--border)',
        borderRadius: 8,
        overflow: 'hidden',
        background: 'var(--bg-app-2, #1a1a1a)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 16px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#f59e0b',
            flexShrink: 0,
            boxShadow: '0 0 6px #f59e0b88',
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--tx-primary)' }}>
          Awaiting Approval
        </span>
        <span style={{ fontSize: 11, color: 'var(--tx-tertiary)', marginLeft: 4 }}>
          {approvals.length} subtask{approvals.length !== 1 ? 's' : ''} require confirmation
        </span>
      </div>

      {/* Subtask rows */}
      <div style={{ padding: '8px 0' }}>
        {approvals.map((approval) => (
          <div
            key={approval.subtask_id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 12,
              padding: '8px 16px',
              borderBottom: '1px solid var(--border)',
            }}
          >
            <ModuleBadge module={approval.module} />
            <span
              style={{
                flex: 1,
                fontSize: 12,
                color: 'var(--tx-secondary)',
                lineHeight: 1.5,
                wordBreak: 'break-word',
              }}
              title={approval.instruction}
            >
              {approval.instruction.length > 120
                ? `${approval.instruction.slice(0, 120)}…`
                : approval.instruction}
            </span>
            <DecisionToggle
              decision={decisions[approval.subtask_id]}
              onChange={(d) => setDecision(approval.subtask_id, d)}
            />
          </div>
        ))}
      </div>

      {/* Footer actions */}
      <div
        style={{
          padding: '10px 16px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 8,
        }}
      >
        <button
          onClick={handleCancel}
          style={{
            fontSize: 11,
            fontWeight: 500,
            padding: '4px 14px',
            borderRadius: 4,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--tx-tertiary)',
            cursor: 'pointer',
          }}
        >
          Cancel
        </button>
        <button
          onClick={handleResume}
          disabled={!allDecided}
          style={{
            fontSize: 11,
            fontWeight: 600,
            padding: '4px 16px',
            borderRadius: 4,
            border: 'none',
            background: allDecided ? '#3b82f6' : 'var(--bg-app-3)',
            color: allDecided ? '#fff' : 'var(--tx-tertiary)',
            cursor: allDecided ? 'pointer' : 'not-allowed',
            transition: 'background 0.15s',
          }}
        >
          Resume Execution
        </button>
      </div>
    </div>
  )
}
