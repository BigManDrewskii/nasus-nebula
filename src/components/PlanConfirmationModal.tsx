/**
 * PlanConfirmationModal — Lovable-style plan panel anchored above the chat input.
 *
 * Renders as a fixed panel that sits just above the input area (bottom of chat).
 * Three actions:
 *   Skip    — close panel + stop agent (task set to 'stopped')
 *   Edit    — enter edit mode so user can tweak the plan description before approving
 *   Approve — approve and begin execution
 *
 * PlanView (compact) — used inline in the message list during execution.
 * CompactPlanView    — thin alias for PlanView in read-only mode.
 */

import { memo, useState, useEffect, useRef, useCallback } from 'react'
import type { ExecutionPlan, PlanPhase, PlanStep, PlanFile } from '../agent/core/Agent'
import { Pxi } from './Pxi'
import { NasusLogo } from './NasusLogo'

// ─── File action badge ────────────────────────────────────────────────────────

const ACTION_COLOR: Record<PlanFile['action'], string> = {
  create: 'var(--green, #4ade80)',
  modify: 'var(--amber, #eab308)',
  delete: '#f87171',
}

const ACTION_LABEL: Record<PlanFile['action'], string> = {
  create: '+',
  modify: '~',
  delete: '−',
}

function FileChip({ file }: { file: PlanFile }) {
  const parts = file.path.split('/')
  const name = parts.pop() ?? file.path
  const dir = parts.join('/')
  return (
    <div className="plm-file-chip">
      <span className="plm-file-action" style={{ color: ACTION_COLOR[file.action] }}>
        {ACTION_LABEL[file.action]}
      </span>
      {dir && <span className="plm-file-dir">{dir}/</span>}
      <span className="plm-file-name">{name}</span>
    </div>
  )
}

// ─── Phase row (in modal) ─────────────────────────────────────────────────────

function PhaseRow({ phase, index }: { phase: PlanPhase; index: number }) {
  const [open, setOpen] = useState(index === 0)
  return (
    <div className="plm-phase">
      <button className="plm-phase-header" onClick={() => setOpen(o => !o)}>
        <span className="plm-phase-num">{index + 1}</span>
        <span className="plm-phase-title">{phase.title}</span>
        <span className="plm-phase-step-count">{phase.steps.length} steps</span>
        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={9} className="plm-phase-chevron" />
      </button>
      {open && (
        <div className="plm-steps">
          {phase.steps.map((step: PlanStep) => (
            <div key={step.id} className="plm-step">
              <span className="plm-step-dot" />
              <span className="plm-step-text">{step.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Complexity badge colors ──────────────────────────────────────────────────

const COMPLEXITY_BG = {
  low: 'rgba(74,222,128,0.12)',
  medium: 'rgba(234,179,8,0.12)',
  high: 'rgba(248,113,113,0.12)',
}
const COMPLEXITY_FG = {
  low: '#4ade80',
  medium: '#eab308',
  high: '#f87171',
}

// ─── Main modal ───────────────────────────────────────────────────────────────

export const PlanConfirmationModal = memo(function PlanConfirmationModal({
  plan,
  taskId,
  onApprove,
  onReject,
}: {
  plan: ExecutionPlan
  /** The task ID — passed explicitly so approve/reject always target the right task */
  taskId: string
  onApprove: (taskId: string) => void
  onReject: (taskId: string) => void
}) {
  const [approving, setApproving] = useState(false)
  // Edit mode: shows a textarea to tweak the plan description before approving
  const [editMode, setEditMode] = useState(false)
  const [editedDescription, setEditedDescription] = useState(plan.description ?? '')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Focus textarea when edit mode opens
  useEffect(() => {
    if (editMode) {
      setTimeout(() => textareaRef.current?.focus(), 60)
    }
  }, [editMode])

  // Escape: if in edit mode, exit edit mode; otherwise skip
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (editMode) {
        setEditMode(false)
      } else {
        onReject(taskId)
      }
    }
  }, [editMode, onReject, taskId])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  function handleSkip() {
    onReject(taskId)
  }

  function handleEdit() {
    setEditMode(true)
    setEditedDescription(plan.description ?? plan.title)
  }

  function handleEditCancel() {
    setEditMode(false)
    setEditedDescription(plan.description ?? '')
  }

  function handleApprove() {
    setApproving(true)
    onApprove(taskId)
  }

  const totalSteps = plan.phases.reduce((s, p) => s + p.steps.length, 0)
  const complexity = plan.complexity ?? 'medium'
  const hasFiles = plan.files && plan.files.length > 0

  return (
    <div className="plm-overlay" role="dialog" aria-modal="true" aria-label="Execution plan">
      {/* Dim backdrop — clicking it = Skip */}
      <div className="plm-backdrop" onClick={handleSkip} />

      {/* The panel itself sits above the input */}
      <div className="plm-panel" onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="plm-header">
          <div className="plm-header-icon">
            <NasusLogo size={16} fill="var(--amber)" />
          </div>
          <div className="plm-header-text">
            <h2 className="plm-title">Here's the plan</h2>
            <p className="plm-subtitle">{plan.title}</p>
          </div>
          <div className="plm-header-meta">
            <span
              className="plm-complexity-badge"
              style={{
                background: COMPLEXITY_BG[complexity],
                color: COMPLEXITY_FG[complexity],
              }}
            >
              {complexity}
            </span>
            <span className="plm-meta-pill">
              {plan.phases.length} phases · {totalSteps} steps
            </span>
          </div>
          {/* Close (Skip) button in corner */}
          <button className="plm-close-btn" onClick={handleSkip} aria-label="Skip plan">
            <Pxi name="x" size={10} />
          </button>
        </div>

        {/* ── Edit mode ── */}
        {editMode ? (
          <div className="plm-edit-body">
            <p className="plm-edit-label">
              Edit the plan description before approving:
            </p>
            <textarea
              ref={textareaRef}
              className="plm-edit-textarea custom-scrollbar"
              value={editedDescription}
              onChange={e => setEditedDescription(e.target.value)}
              rows={5}
              spellCheck={false}
            />
            <div className="plm-edit-footer">
              <button className="plm-btn plm-btn--skip" onClick={handleEditCancel}>
                Cancel
              </button>
              <button
                className="plm-btn plm-btn--approve"
                onClick={handleApprove}
                disabled={approving}
              >
                {approving ? (
                  <>
                    <span className="plm-spinner" />
                    Starting…
                  </>
                ) : (
                  <>
                    <Pxi name="play" size={9} />
                    Approve &amp; run
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* ── Scrollable body ── */}
            <div className="plm-body custom-scrollbar">
              {/* Plan description */}
              {plan.description && (
                <p className="plm-description">{plan.description}</p>
              )}

              {/* Phases */}
              <div className="plm-phases">
                {plan.phases.map((phase, i) => (
                  <PhaseRow key={phase.id} phase={phase} index={i} />
                ))}
              </div>

              {/* Files */}
              {hasFiles && (
                <div className="plm-files-section">
                  <p className="plm-files-label">
                    <Pxi name="file-code" size={10} style={{ marginRight: 5 }} />
                    Files affected
                  </p>
                  <div className="plm-files-grid">
                    {plan.files!.map((f, i) => (
                      <FileChip key={i} file={f} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Footer ── */}
            <div className="plm-footer">
              <button className="plm-btn plm-btn--skip" onClick={handleSkip}>
                Skip
              </button>
              <div className="plm-footer-right">
                <button
                  className="plm-btn plm-btn--edit"
                  onClick={handleEdit}
                  disabled={approving}
                >
                  <Pxi name="pencil" size={9} />
                  Edit
                </button>
                <button
                  className="plm-btn plm-btn--approve"
                  onClick={handleApprove}
                  disabled={approving}
                >
                  {approving ? (
                    <>
                      <span className="plm-spinner" />
                      Starting…
                    </>
                  ) : (
                    <>
                      <Pxi name="play" size={9} />
                      Approve plan
                    </>
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
})

// ─── Inline execution view (used in message list during run) ──────────────────

interface PlanViewProps {
  plan: ExecutionPlan
  onApprove?: () => void
  onReject?: () => void
  currentPhase?: number
  currentStep?: number
  isReadOnly?: boolean
}

function StepLine({ step, isCurrent, isDone }: { step: PlanStep; isCurrent: boolean; isDone: boolean }) {
  return (
    <div className="flex pv-step">
      <div
        className="pv-step-dot flex-shrink-0"
        style={{
          background: isDone ? '#4ade80' : isCurrent ? 'var(--amber)' : 'rgba(255,255,255,0.14)',
          boxShadow: isCurrent ? '0 0 7px rgba(234,179,8,0.7)' : 'none',
        }}
      />
      <span
        className="flex-1 pv-step-text"
        style={{
          color: isDone ? 'var(--tx-muted)' : isCurrent ? 'var(--tx-primary)' : 'var(--tx-tertiary)',
          textDecoration: isDone ? 'line-through' : 'none',
          opacity: isDone ? 0.5 : 1,
        }}
      >
        {step.description}
      </span>
    </div>
  )
}

const PhaseBlock = memo(function PhaseBlock({
  phase, phaseNumber, isCurrent, isDone, currentStep,
}: {
  phase: PlanPhase
  phaseNumber: number
  isCurrent: boolean
  isDone: boolean
  currentStep?: number
}) {
  if (isDone) {
    return (
      <div className="flex-v-center pv-phase-done">
        <Pxi name="check-circle" size={11} style={{ color: '#4ade80', flexShrink: 0 }} />
        <span className="text-tertiary flex-1 truncate pv-phase-done-title">
          {phaseNumber}. {phase.title}
        </span>
        <span className="font-mono text-muted flex-shrink-0 pv-phase-step-count">
          {phase.steps.length}
        </span>
      </div>
    )
  }

  if (!isCurrent) {
    return (
      <div className="flex-v-center pv-phase-pending">
        <span className="flex-center flex-shrink-0 font-mono pv-phase-num-badge">
          {phaseNumber}
        </span>
        <span className="text-muted flex-1 truncate pv-phase-pending-title">
          {phase.title}
        </span>
        <span className="font-mono text-muted flex-shrink-0 pv-phase-step-count pv-phase-step-count--dim">
          {phase.steps.length}
        </span>
      </div>
    )
  }

  return (
    <div className="pv-phase-active">
      <div className="flex-v-center pv-phase-active-header">
        <div className="flex-center flex-shrink-0 font-mono pv-phase-active-num">
          {phaseNumber}
        </div>
        <div className="flex-1 min-w-0">
          <p className="pv-phase-active-title">{phase.title}</p>
          {phase.description && (
            <p className="text-tertiary pv-phase-active-desc">{phase.description}</p>
          )}
        </div>
        <span className="font-mono pv-phase-active-count">
          {phase.steps.length} steps
        </span>
      </div>
      <div className="flex-col pv-phase-steps">
        {phase.steps.map((step, i) => (
          <StepLine
            key={step.id}
            step={step}
            isCurrent={i === currentStep}
            isDone={i < (currentStep ?? 0)}
          />
        ))}
      </div>
    </div>
  )
})

export const PlanView = memo(function PlanView({
  plan, currentPhase, currentStep, isReadOnly,
}: PlanViewProps) {
  const [collapsed, setCollapsed] = useState(false)

  const totalSteps = plan.phases.reduce((s, p) => s + p.steps.length, 0)
  const completedPhases = currentPhase ?? 0
  const progressPct = plan.phases.length > 0
    ? Math.round((completedPhases / plan.phases.length) * 100)
    : 0

  return (
    <div
      className="fade-in pv-root"
      style={{
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header */}
      <div
        className="flex-v-center pv-header"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
        onClick={() => !isReadOnly && setCollapsed(o => !o)}
      >
        <div
          className="flex-center flex-shrink-0 pv-header-icon"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Pxi name="cpu" size={13} className="text-secondary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-display pv-header-title" style={{ color: 'var(--tx-primary)' }}>
            {plan.title}
          </p>
          <p className="text-tertiary font-mono pv-header-subtitle">
            Phase {completedPhases + 1} / {plan.phases.length}
          </p>
        </div>
        <div className="flex-v-center flex-shrink-0 pv-header-right">
          {!isReadOnly && (
            <div className="flex-center pv-chevron-btn">
              <Pxi name={collapsed ? 'chevron-down' : 'chevron-up'} size={10} className="text-tertiary" />
            </div>
          )}
          <div className="pv-progress-track absolute">
            <div className="pv-progress-fill" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </div>

      {/* Body */}
      {!collapsed && (
        <>
          <div
            className="custom-scrollbar flex-col pv-phases-list"
            style={{
              maxHeight: 340,
              padding: '10px 12px 12px',
              gap: 3,
            }}
          >
            {plan.phases.map((phase, i) => (
              <PhaseBlock
                key={phase.id}
                phase={phase}
                phaseNumber={i + 1}
                isCurrent={i === (currentPhase ?? 0)}
                isDone={i < (currentPhase ?? 0)}
                currentStep={i === (currentPhase ?? 0) ? currentStep : undefined}
              />
            ))}
          </div>
          <div className="flex-v-center pv-exec-footer">
            <span className="pv-exec-pulse" />
            <span className="text-tertiary font-mono pv-exec-total">{totalSteps} steps total</span>
          </div>
        </>
      )}
    </div>
  )
})

export const CompactPlanView = memo(({ plan, currentPhase, currentStep }: {
  plan: ExecutionPlan
  currentPhase?: number
  currentStep?: number
}) => (
  <PlanView plan={plan} currentPhase={currentPhase} currentStep={currentStep} isReadOnly />
))
