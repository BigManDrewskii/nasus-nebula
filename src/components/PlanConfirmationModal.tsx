/**
 * PlanView — Displays the execution plan for user approval or during execution.
 * Elevated design: richer status badges, amber glow on CTA, phase left-border active state.
 */

import { memo, useState } from 'react'
import type { ExecutionPlan, PlanPhase, PlanStep } from '../agent/core/Agent'
import { Pxi } from './Pxi'

interface PlanViewProps {
  plan: ExecutionPlan
  onApprove?: () => void
  onReject?: () => void
  currentPhase?: number
  currentStep?: number
  isReadOnly?: boolean
}

// ── Plan Step Item ────────────────────────────────────────────────────────────

interface PlanStepItemProps {
  step: PlanStep
  stepNumber: number
  isCurrent: boolean
  isCompleted: boolean
}

const PlanStepItem = memo(({ step, stepNumber, isCurrent, isCompleted }: PlanStepItemProps) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '6px 10px 6px 8px',
        borderRadius: 6,
        background: isCurrent ? 'rgba(234,179,8,0.04)' : 'transparent',
        borderLeft: isCurrent ? '2px solid rgba(234,179,8,0.5)' : '2px solid transparent',
        transition: 'background 0.15s, border-color 0.15s',
        marginLeft: -2,
      }}
    >
      {/* Step number badge */}
      <span
        className="font-numeric"
        style={{
          flexShrink: 0,
          width: 18,
          height: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 9,
          fontWeight: 600,
          borderRadius: 4,
          marginTop: 1,
          background: isCompleted
            ? 'rgba(52,211,153,0.15)'
            : isCurrent
            ? 'rgba(234,179,8,0.9)'
            : 'rgba(255,255,255,0.04)',
          color: isCompleted ? '#34d399' : isCurrent ? '#000' : 'var(--tx-muted)',
          transition: 'background 0.15s',
        }}
      >
        {isCompleted ? <Pxi name="check" size={8} /> : stepNumber}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontSize: 12,
            display: 'block',
            color: isCompleted
              ? 'var(--tx-tertiary)'
              : isCurrent
              ? 'var(--tx-primary)'
              : 'var(--tx-secondary)',
            textDecoration: isCompleted ? 'line-through' : 'none',
            lineHeight: 1.45,
          }}
        >
          {step.description}
        </span>

        {step.tools && step.tools.length > 0 && !isCompleted && (
          <div style={{ display: 'flex', gap: 3, marginTop: 5, flexWrap: 'wrap' }}>
            {step.tools.map((tool) => (
              <span
                key={tool}
                style={{
                  padding: '1px 5px',
                  fontSize: 9,
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  background: isCurrent
                    ? 'rgba(234,179,8,0.08)'
                    : 'rgba(255,255,255,0.04)',
                  border: '1px solid',
                  borderColor: isCurrent
                    ? 'rgba(234,179,8,0.2)'
                    : 'rgba(255,255,255,0.06)',
                  color: isCurrent ? 'var(--amber)' : 'var(--tx-muted)',
                }}
              >
                {tool}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
})

// ── Plan Phase Item ───────────────────────────────────────────────────────────

interface PlanPhaseItemProps {
  phase: PlanPhase
  phaseNumber: number
  isCurrent: boolean
  isCompleted: boolean
  currentStep?: number
}

const PlanPhaseItem = memo(({ phase, phaseNumber, isCurrent, isCompleted, currentStep }: PlanPhaseItemProps) => {
  // Completed phases collapse to a single compact line
  if (isCompleted) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 14px',
        opacity: 0.4,
        borderRadius: 9,
        border: '1px solid rgba(255,255,255,0.03)',
      }}>
        <Pxi name="check" size={11} style={{ color: '#4ade80', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--tx-tertiary)', textDecoration: 'line-through', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {phase.title}
        </span>
        <span style={{ fontSize: 9, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
          {phase.steps.length} steps
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        borderRadius: 9,
        border: '1px solid',
        borderColor: isCurrent ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.06)',
        background: isCurrent ? 'rgba(234,179,8,0.03)' : 'transparent',
        borderLeft: isCurrent ? '2px solid rgba(234,179,8,0.45)' : undefined,
        transition: 'border-color 0.2s',
        overflow: 'hidden',
      }}
    >
      {/* Phase header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
        }}
      >
        {/* Phase number badge */}
        <div
          className="font-numeric"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 600,
            background: isCompleted
              ? 'rgba(52,211,153,0.1)'
              : isCurrent
              ? 'rgba(234,179,8,0.9)'
              : 'rgba(255,255,255,0.04)',
            color: isCompleted ? '#4ade80' : isCurrent ? '#000' : 'var(--tx-muted)',
          }}
        >
          {isCompleted ? <Pxi name="check" size={11} /> : phaseNumber}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            className="font-display"
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isCurrent ? 'var(--tx-primary)' : 'var(--tx-secondary)',
              margin: 0,
            }}
          >
            {phase.title}
          </h4>
          {isCurrent && phase.description && (
            <p
              style={{
                fontSize: 11,
                color: 'var(--tx-tertiary)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: '2px 0 0',
              }}
            >
              {phase.description}
            </p>
          )}
        </div>

        {/* Step count badge */}
        <span
          className="font-numeric"
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            padding: '2px 6px',
            borderRadius: 4,
            background: isCurrent
              ? 'rgba(234,179,8,0.1)'
              : 'rgba(255,255,255,0.03)',
            color: isCurrent ? 'var(--amber)' : 'var(--tx-muted)',
            flexShrink: 0,
          }}
        >
          {phase.steps.length}
        </span>
      </div>

      {/* Expanded steps for current phase */}
      {isCurrent && (
        <div style={{ padding: '0 12px 12px' }}>
          <div
            style={{
              height: 1,
              background: 'rgba(234,179,8,0.1)',
              margin: '0 0 10px',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, paddingLeft: 2 }}>
            {phase.steps.map((step, idx) => (
              <PlanStepItem
                key={step.id}
                step={step}
                stepNumber={idx + 1}
                isCurrent={idx === currentStep}
                isCompleted={idx < (currentStep ?? 0)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
})

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ isApprovalMode, isCollapsed }: { isApprovalMode: boolean; isCollapsed: boolean }) {
  if (isApprovalMode) {
    return (
      <span
        className="font-numeric"
        style={{
          fontSize: 9,
          fontWeight: 600,
          padding: '2px 7px',
          borderRadius: 5,
          background: 'rgba(234,179,8,0.12)',
          border: '1px solid rgba(234,179,8,0.25)',
          color: 'var(--amber)',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        PENDING APPROVAL
      </span>
    )
  }

  if (!isCollapsed) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <span
          style={{
            width: 5, height: 5,
            borderRadius: '50%',
            background: '#4ade80',
            animation: 'statusPulse 1.6s ease-in-out infinite',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span
          className="font-numeric"
          style={{
            fontSize: 9,
            fontWeight: 600,
            color: '#4ade80',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          ACTIVE
        </span>
      </div>
    )
  }

  return null
}

// ── Main Plan View ────────────────────────────────────────────────────────────

export const PlanView = memo(({ plan, onApprove, onReject, currentPhase, currentStep, isReadOnly }: PlanViewProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isApprovalMode = !!onApprove && !!onReject && !isReadOnly
  const totalSteps = plan.phases.reduce((sum, p) => sum + p.steps.length, 0)
  const progressPercent = currentPhase !== undefined
    ? Math.round(((currentPhase + (currentStep !== undefined ? currentStep / Math.max(1, plan.phases[currentPhase]?.steps.length ?? 1) : 0)) / plan.phases.length) * 100)
    : 0

    return (
      <div
        className="fade-in"
        style={{
          width: '100%',
          overflow: 'hidden',
          borderRadius: 14,
          ...(isApprovalMode ? {
            border: '1px solid rgba(234,179,8,0.2)',
            background: 'rgba(13,13,13,0.95)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(234,179,8,0.06)',
          } : {
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(13,13,13,0.9)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
          }),
        }}
      >
      {/* Card header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '14px 16px',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          position: 'relative',
          userSelect: 'none',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Left: icon + title + status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 7, background: isApprovalMode ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${isApprovalMode ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.07)'}` }}>
            <Pxi
              name={isApprovalMode ? 'shield-check' : 'cpu'}
              size={14}
              style={{ color: isApprovalMode ? 'var(--amber)' : 'var(--tx-secondary)' }}
            />
          </div>

          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                className="font-display"
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--tx-primary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  margin: 0,
                }}
              >
                {isApprovalMode ? 'Execution Plan' : 'In Progress'}
              </h2>
              <StatusBadge isApprovalMode={isApprovalMode} isCollapsed={isCollapsed} />
            </div>
            <p
              className="font-numeric"
              style={{
                fontSize: 11,
                color: 'var(--tx-tertiary)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                margin: '2px 0 0',
              }}
            >
              {plan.title}
            </p>
          </div>
        </div>

        {/* Right: phase count + chevron */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {!isCollapsed && (
            <div style={{ textAlign: 'right' }}>
              <div
                className="font-numeric"
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  lineHeight: 1,
                  color: isApprovalMode ? 'var(--amber)' : 'var(--tx-primary)',
                }}
              >
                {plan.phases.length}
              </div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  color: 'var(--tx-muted)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  marginTop: 1,
                }}
              >
                phases
              </div>
            </div>
          )}

          <div
            style={{
              width: 24, height: 24,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 5,
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <Pxi
              name={isCollapsed ? 'chevron-down' : 'chevron-up'}
              size={11}
              style={{ color: 'var(--tx-tertiary)' }}
            />
          </div>
        </div>

          {/* Progress bar (execution mode) */}
          {!isApprovalMode && (
            <div
              style={{
                position: 'absolute',
                bottom: 0, left: 0, right: 0,
                height: 2,
                background: 'rgba(234,179,8,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  background: 'var(--amber)',
                  boxShadow: '0 0 8px rgba(234,179,8,0.4)',
                  transition: 'width 0.7s ease-out',
                  width: `${progressPercent}%`,
                }}
              />
            </div>
          )}
      </div>

      {/* Card body */}
      {!isCollapsed && (
        <>
          {/* Plan description */}
          {isApprovalMode && plan.description && (
            <div style={{ padding: '12px 16px 0' }}>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--tx-secondary)',
                  lineHeight: 1.55,
                  padding: '11px 13px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  margin: 0,
                }}
              >
                {plan.description}
              </p>
            </div>
          )}

          {/* Phases list */}
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: 420,
              overflowY: 'auto',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {plan.phases.map((phase, idx) => (
              <PlanPhaseItem
                key={phase.id}
                phase={phase}
                phaseNumber={idx + 1}
                isCurrent={idx === (currentPhase ?? 0)}
                isCompleted={idx < (currentPhase ?? 0)}
                currentStep={idx === (currentPhase ?? 0) ? currentStep : undefined}
              />
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              padding: '12px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.15)',
              flexWrap: 'wrap',
            }}
          >
            {/* Step / time meta */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <Pxi name="zap" size={10} style={{ color: 'var(--amber)' }} />
                <span
                  className="font-numeric"
                  style={{ fontSize: 10, fontWeight: 500, color: 'var(--tx-secondary)' }}
                >
                  {totalSteps} steps
                </span>
              </div>
              {plan.estimatedSteps > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Pxi name="timer" size={10} style={{ color: 'var(--amber)' }} />
                  <span
                    className="font-numeric"
                    style={{ fontSize: 10, fontWeight: 500, color: 'var(--amber)' }}
                  >
                    ~{plan.estimatedSteps}s
                  </span>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {isApprovalMode ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onReject}
                  className="font-display"
                  style={{
                    padding: '7px 14px',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    borderRadius: 7,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'var(--tx-secondary)',
                    cursor: 'pointer',
                    transition: 'background 0.12s, color 0.12s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                    e.currentTarget.style.color = 'var(--tx-primary)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--tx-secondary)'
                  }}
                >
                  Reject
                </button>

                  <button
                    onClick={onApprove}
                    className="font-display"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '8px 22px',
                      fontSize: 11,
                      fontWeight: 700,
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      borderRadius: 8,
                      border: 'none',
                      background: 'var(--amber)',
                      color: '#000',
                      cursor: 'pointer',
                      boxShadow: '0 0 20px rgba(234,179,8,0.2), 0 2px 8px rgba(234,179,8,0.15)',
                      transition: 'transform 0.1s, box-shadow 0.15s',
                      fontFamily: 'inherit',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.03)'
                      e.currentTarget.style.boxShadow = '0 0 28px rgba(234,179,8,0.3), 0 4px 12px rgba(234,179,8,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = '0 0 20px rgba(234,179,8,0.2), 0 2px 8px rgba(234,179,8,0.15)'
                    }}
                  >
                    <Pxi name="play" size={9} />
                    Approve
                  </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 6,
                  background: 'rgba(74,222,128,0.08)',
                  border: '1px solid rgba(74,222,128,0.18)',
                }}
              >
                <span
                  style={{
                    width: 5, height: 5,
                    borderRadius: '50%',
                    background: '#4ade80',
                    animation: 'statusPulse 1.6s ease-in-out infinite',
                    display: 'inline-block',
                  }}
                />
                <span
                  className="font-display"
                  style={{
                    fontSize: 9,
                    fontWeight: 600,
                    color: '#4ade80',
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase',
                  }}
                >
                  Running
                </span>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
})

// Legacy Exports

export const PlanConfirmationModal = memo(({ plan, onApprove, onReject }: { plan: ExecutionPlan, onApprove: () => void, onReject: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/85 backdrop-blur-2xl animate-in fade-in duration-500">
      <div className="w-full max-w-2xl shadow-3xl transform animate-in slide-in-from-bottom-12 duration-700">
        <PlanView plan={plan} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  )
})

export const CompactPlanView = memo(({ plan, currentPhase, currentStep }: { plan: ExecutionPlan, currentPhase?: number, currentStep?: number }) => {
  return <PlanView plan={plan} currentPhase={currentPhase} currentStep={currentStep} isReadOnly />
})
