/**
 * PlanView — execution plan card.
 *
 * Approval state  : full card, amber accent, phases listed, Approve / Decline CTA
 * Execution state : compact progress card, current phase highlighted, collapses when done
 * Collapsed state : single-line breadcrumb strip
 */

import { memo, useState } from 'react'
import type { ExecutionPlan, PlanPhase, PlanStep } from '../agent/core/Agent'
import { Pxi } from './Pxi'
import { NasusLogo } from './NasusLogo'

interface PlanViewProps {
  plan: ExecutionPlan
  onApprove?: () => void
  onReject?: () => void
  currentPhase?: number
  currentStep?: number
  isReadOnly?: boolean
}

// ─── Step line ────────────────────────────────────────────────────────────────

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

// ─── Phase block ──────────────────────────────────────────────────────────────

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

  // Active phase
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

// ─── Main PlanView ────────────────────────────────────────────────────────────

export const PlanView = memo(function PlanView({
  plan, onApprove, onReject, currentPhase, currentStep, isReadOnly,
}: PlanViewProps) {
  const isApproval = !!onApprove && !!onReject && !isReadOnly
  const [collapsed, setCollapsed] = useState(isApproval ? true : false)

  const totalSteps = plan.phases.reduce((s, p) => s + p.steps.length, 0)
  const completedPhases = currentPhase ?? 0
  const progressPct = plan.phases.length > 0
    ? Math.round((completedPhases / plan.phases.length) * 100)
    : 0

  return (
    <div
      className="fade-in pv-root"
      style={{
        border: isApproval ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: isApproval
          ? '0 0 0 1px rgba(234,179,8,0.05) inset, 0 12px 40px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* Header */}
      <div
        className="flex-v-center pv-header"
        style={{ borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)' }}
        onClick={() => setCollapsed(o => !o)}
      >
        <div
          className="flex-center flex-shrink-0 pv-header-icon"
          style={{
            background: isApproval ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.05)',
            border: `1px solid ${isApproval ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)'}`,
          }}
        >
          {isApproval
            ? <NasusLogo size={14} fill="var(--amber)" />
            : <Pxi name="cpu" size={13} className="text-secondary" />
          }
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="font-display pv-header-title"
            style={{ color: isApproval ? 'var(--amber-soft)' : 'var(--tx-primary)' }}
          >
            {isApproval ? 'Execution Plan' : plan.title}
          </p>
          {isApproval ? (
            <p className="text-tertiary pv-header-subtitle truncate">{plan.title}</p>
          ) : (
            <p className="text-tertiary font-mono pv-header-subtitle">
              Phase {completedPhases + 1} / {plan.phases.length}
            </p>
          )}
        </div>

        <div className="flex-v-center flex-shrink-0 pv-header-right">
          {isApproval && !collapsed && (
            <span className="font-mono text-muted pv-phases-badge">
              {plan.phases.length} phases · {totalSteps} steps
            </span>
          )}
          <div className="flex-center pv-chevron-btn">
            <Pxi name={collapsed ? 'chevron-down' : 'chevron-up'} size={10} className="text-tertiary" />
          </div>
        </div>

        {!isApproval && (
          <div className="pv-progress-track absolute">
            <div
              className="pv-progress-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        )}
      </div>

      {/* Body */}
      {!collapsed && (
        <>
          {isApproval && plan.description && (
            <div className="pv-description-wrap">
              <p className="text-secondary pv-description">{plan.description}</p>
            </div>
          )}

          <div
            className="custom-scrollbar flex-col pv-phases-list"
            style={{
              maxHeight: isApproval ? 400 : 340,
              padding: isApproval ? '10px 14px 14px' : '10px 12px 12px',
              gap: isApproval ? 0 : 3,
            }}
          >
            {plan.phases.map((phase, i) => (
              isApproval ? (
                <div
                  key={phase.id}
                  className="flex pv-approval-phase"
                  style={{ borderBottom: i < plan.phases.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}
                >
                  <span className="flex-center flex-shrink-0 font-mono pv-approval-phase-num">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="pv-approval-phase-title">{phase.title}</p>
                    {phase.description && (
                      <p className="text-tertiary pv-approval-phase-desc">{phase.description}</p>
                    )}
                  </div>
                  {phase.steps.length > 0 && (
                    <span className="font-mono text-muted flex-shrink-0 pv-approval-step-count">
                      {phase.steps.length}
                    </span>
                  )}
                </div>
              ) : (
                <PhaseBlock
                  key={phase.id}
                  phase={phase}
                  phaseNumber={i + 1}
                  isCurrent={i === (currentPhase ?? 0)}
                  isDone={i < (currentPhase ?? 0)}
                  currentStep={i === (currentPhase ?? 0) ? currentStep : undefined}
                />
              )
            ))}
          </div>

          {!isApproval && (
            <div className="flex-v-center pv-exec-footer">
              <span className="pv-exec-pulse" />
              <span className="text-tertiary font-mono pv-exec-total">{totalSteps} steps total</span>
            </div>
          )}
        </>
      )}

      {/* Approval footer */}
      {isApproval && (
        <div className="flex-v-center justify-end pv-approval-footer">
          <button
            onClick={onReject}
            className="text-secondary pv-decline-btn"
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--tx-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)' }}
          >
            Decline
          </button>

          <button
            onClick={onApprove}
            className="flex-v-center pv-approve-btn"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)'
              e.currentTarget.style.boxShadow = '0 4px 22px rgba(234,179,8,0.38)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 2px 14px rgba(234,179,8,0.25)'
            }}
          >
            <Pxi name="play" size={9} />
            Approve
          </button>
        </div>
      )}
    </div>
  )
})

// ─── Legacy exports ───────────────────────────────────────────────────────────

export const PlanConfirmationModal = memo(({ plan, onApprove, onReject }: {
  plan: ExecutionPlan
  onApprove: () => void
  onReject: () => void
}) => (
  <div className="pv-modal-backdrop">
    <div className="pv-modal-inner">
      <PlanView plan={plan} onApprove={onApprove} onReject={onReject} />
    </div>
  </div>
))

export const CompactPlanView = memo(({ plan, currentPhase, currentStep }: {
  plan: ExecutionPlan
  currentPhase?: number
  currentStep?: number
}) => (
  <PlanView plan={plan} currentPhase={currentPhase} currentStep={currentStep} isReadOnly />
))
