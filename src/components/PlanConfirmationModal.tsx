/**
 * PlanView — Displays the execution plan for user approval or during execution.
 * Integrated directly into the chat for a better UX.
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

// ── Plan Step Item ────────────────────────────────────────────────────────────────

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
        padding: '6px 8px',
        borderRadius: 6,
        background: isCurrent ? 'rgba(255,255,255,0.03)' : 'transparent',
        border: isCurrent ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent',
        transition: 'background 0.12s, border-color 0.12s',
      }}
    >
      <span
        className="font-numeric"
        style={{
          flexShrink: 0,
          width: 20,
          height: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 10,
          fontWeight: 600,
          borderRadius: 4,
          background: isCompleted
            ? 'rgba(234,179,8,0.15)'
            : isCurrent
            ? 'rgba(234,179,8,0.9)'
            : 'rgba(255,255,255,0.04)',
          color: isCompleted || isCurrent ? '#000' : 'var(--tx-muted)',
          transition: 'background 0.12s',
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
          }}
        >
          {step.description}
        </span>

        {step.tools && step.tools.length > 0 && !isCompleted && (
          <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
            {step.tools.map((tool) => (
              <span
                key={tool}
                className="font-numeric"
                style={{
                  padding: '2px 5px',
                  fontSize: 9,
                  fontWeight: 500,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  borderRadius: 4,
                  background: isCurrent
                    ? 'rgba(234,179,8,0.1)'
                    : 'rgba(255,255,255,0.04)',
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

// ── Plan Phase Item ───────────────────────────────────────────────────────────────

interface PlanPhaseItemProps {
  phase: PlanPhase
  phaseNumber: number
  isCurrent: boolean
  isCompleted: boolean
  currentStep?: number
}

const PlanPhaseItem = memo(({ phase, phaseNumber, isCurrent, isCompleted, currentStep }: PlanPhaseItemProps) => {
  return (
    <div
      style={{
        borderRadius: 8,
        border: '1px solid',
        borderColor: isCurrent ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
        background: isCurrent ? 'rgba(255,255,255,0.02)' : 'transparent',
        transition: 'opacity 0.2s ease',
        opacity: isCompleted ? 0.4 : 1,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 14px',
        }}
      >
        <div
          className="font-numeric"
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            fontSize: 11,
            fontWeight: 600,
            background: isCompleted
              ? 'rgba(234,179,8,0.12)'
              : isCurrent
              ? 'rgba(234,179,8,0.9)'
              : 'rgba(255,255,255,0.04)',
            color: isCompleted ? 'rgba(234,179,8,0.8)' : isCurrent ? '#000' : 'var(--tx-muted)',
          }}
        >
          {isCompleted ? <Pxi name="check" size={11} /> : phaseNumber}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h4
            className="font-display"
            style={{
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
              color: isCurrent ? 'var(--tx-primary)' : 'var(--tx-tertiary)',
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
              }}
            >
              {phase.description}
            </p>
          )}
        </div>

        <div
          className="font-numeric"
          style={{
            fontSize: 9,
            fontWeight: 500,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding: '3px 7px',
            borderRadius: 4,
            background: isCurrent
              ? 'rgba(234,179,8,0.1)'
              : 'rgba(255,255,255,0.03)',
            color: isCurrent ? 'var(--amber)' : 'var(--tx-muted)',
          }}
        >
          {phase.steps.length}
        </div>
      </div>

      {isCurrent && (
        <div style={{ padding: '0 10px 12px' }}>
          <div
            style={{
              height: 1,
              background: 'rgba(255,255,255,0.06)',
              margin: '0 0 10px',
            }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
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

// ── Main Plan View Component ───────────────────────────────────────────────────────

export const PlanView = memo(({ plan, onApprove, onReject, currentPhase, currentStep, isReadOnly }: PlanViewProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isApprovalMode = !!onApprove && !!onReject && !isReadOnly
  const totalSteps = plan.phases.reduce((sum, p) => sum + p.steps.length, 0)
  const progressPercent = currentPhase !== undefined
    ? Math.round(((currentPhase + (currentStep !== undefined ? currentStep / plan.phases[currentPhase].steps.length : 0)) / plan.phases.length) * 100)
    : 0

  return (
    <div
      className="fade-in"
      style={{
        width: '100%',
        overflow: 'hidden',
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.08)',
        background: 'rgba(13,13,13,0.95)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
          <Pxi
            name={isApprovalMode ? 'shield-check' : 'cpu'}
            size={16}
            style={{ color: isApprovalMode ? 'var(--amber)' : 'var(--tx-tertiary)', flexShrink: 0 }}
          />

          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                className="font-display"
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--tx-primary)',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                }}
              >
                {isApprovalMode ? 'Execution Plan' : 'In Progress'}
              </h2>

              {isApprovalMode && (
                <span
                  className="font-numeric"
                  style={{
                    fontSize: 9,
                    fontWeight: 500,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: 'rgba(234,179,8,0.12)',
                    color: 'var(--amber)',
                    letterSpacing: '0.05em',
                  }}
                >
                  PENDING
                </span>
              )}

              {!isApprovalMode && !isCollapsed && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: '50%',
                      background: 'var(--amber)',
                    }}
                  />
                  <span
                    className="font-numeric"
                    style={{
                      fontSize: 9,
                      fontWeight: 500,
                      color: 'var(--amber)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Active
                  </span>
                </div>
              )}
            </div>
            <p
              className="font-numeric"
              style={{
                fontSize: 11,
                color: 'var(--tx-tertiary)',
                fontWeight: 400,
                letterSpacing: '0.05em',
                marginTop: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {plan.title}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {!isCollapsed && (
            <div style={{ textAlign: 'right' }} className="hide-below-sm">
              <div
                className="font-numeric"
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: isApprovalMode ? 'var(--amber)' : 'var(--tx-primary)',
                }}
              >
                {plan.phases.length}
              </div>
              <div
                style={{
                  fontSize: 8,
                  fontWeight: 500,
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
              padding: 6,
              borderRadius: 4,
              background: isCollapsed ? 'rgba(255,255,255,0.04)' : 'transparent',
              transition: 'background 0.12s',
            }}
          >
            <Pxi
              name={isCollapsed ? 'chevron-down' : 'chevron-up'}
              size={12}
              style={{ color: 'var(--tx-tertiary)' }}
            />
          </div>
        </div>

        {/* Progress bar (execution mode only) */}
        {!isApprovalMode && (
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: 1,
              background: 'rgba(234,179,8,0.15)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--amber)',
                transition: 'width 0.6s ease-out',
                width: `${progressPercent}%`,
              }}
            />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {isApprovalMode && plan.description && (
            <div style={{ padding: '0 16px', paddingTop: 14 }}>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--tx-secondary)',
                  lineHeight: 1.5,
                  padding: '12px 14px',
                  borderRadius: 6,
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                {plan.description}
              </p>
            </div>
          )}

          <div
            className="custom-scrollbar"
            style={{
              maxHeight: 400,
              overflowY: 'auto',
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
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

          {/* Footer / Actions */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              padding: '14px 16px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              background: 'rgba(0,0,0,0.2)',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pxi name="zap" size={11} style={{ color: 'var(--amber)' }} />
                <span
                  className="font-numeric"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: 'var(--tx-primary)',
                  }}
                >
                  {totalSteps} steps
                </span>
              </div>
              {plan.estimatedSteps > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Pxi name="timer" size={11} style={{ color: 'var(--amber)' }} />
                  <span
                    className="font-numeric"
                    style={{
                      fontSize: 11,
                      fontWeight: 500,
                      color: 'var(--amber)',
                    }}
                  >
                    ~{plan.estimatedSteps}s
                  </span>
                </div>
              )}
            </div>

            {isApprovalMode ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={onReject}
                  className="font-display"
                  style={{
                    padding: '8px 14px',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderRadius: 6,
                    border: '1px solid rgba(255,255,255,0.1)',
                    background: 'transparent',
                    color: 'var(--tx-secondary)',
                    cursor: 'pointer',
                    transition: 'background 0.12s, color 0.12s, border-color 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    e.currentTarget.style.color = 'var(--tx-primary)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--tx-secondary)'
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
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
                    padding: '8px 16px',
                    fontSize: 11,
                    fontWeight: 500,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    borderRadius: 6,
                    border: 'none',
                    background: 'var(--amber)',
                    color: '#000',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(234,179,8,0.85)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'var(--amber)'
                  }}
                >
                  <Pxi name="play" size={10} />
                  <span>Approve</span>
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 6,
                  background: 'rgba(234,179,8,0.1)',
                  border: '1px solid rgba(234,179,8,0.2)',
                }}
              >
                <div
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: '50%',
                    background: 'var(--amber)',
                  }}
                />
                <span
                  className="font-display"
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: 'var(--amber)',
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

// Legacy Export — deprecated but kept for compatibility
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
