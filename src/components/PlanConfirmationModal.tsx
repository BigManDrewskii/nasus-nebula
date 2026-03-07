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
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      padding: '3px 0',
      transition: 'opacity 0.2s',
    }}>
      {/* dot */}
      <div style={{
        width: 6, height: 6,
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: 5,
        background: isDone
          ? '#4ade80'
          : isCurrent
          ? 'var(--amber)'
          : 'rgba(255,255,255,0.14)',
        boxShadow: isCurrent ? '0 0 7px rgba(234,179,8,0.7)' : 'none',
        transition: 'background 0.2s, box-shadow 0.2s',
      }} />
      <span style={{
        fontSize: 12,
        lineHeight: 1.55,
        color: isDone
          ? 'var(--tx-muted)'
          : isCurrent
          ? 'var(--tx-primary)'
          : 'var(--tx-tertiary)',
        textDecoration: isDone ? 'line-through' : 'none',
        flex: 1,
        minWidth: 0,
        opacity: isDone ? 0.5 : 1,
        transition: 'color 0.2s, opacity 0.2s',
      }}>
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
  // Completed phases: compact single-line row
  if (isDone) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '5px 10px',
        borderRadius: 8,
        background: 'transparent',
        opacity: 0.42,
      }}>
        <Pxi name="check-circle" size={11} style={{ color: '#4ade80', flexShrink: 0 }} />
        <span style={{
          fontSize: 11,
          color: 'var(--tx-tertiary)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {phaseNumber}. {phase.title}
        </span>
        <span style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--tx-muted)',
          flexShrink: 0,
        }}>
          {phase.steps.length}
        </span>
      </div>
    )
  }

  // Pending (future) phase: subtle row
  if (!isCurrent) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '5px 10px',
        borderRadius: 8,
        background: 'transparent',
      }}>
        <span style={{
          flexShrink: 0,
          width: 18, height: 18,
          borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 9,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          background: 'rgba(255,255,255,0.04)',
          color: 'var(--tx-muted)',
        }}>
          {phaseNumber}
        </span>
        <span style={{
          fontSize: 11.5,
          color: 'var(--tx-muted)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {phase.title}
        </span>
        <span style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--tx-muted)',
          flexShrink: 0,
          opacity: 0.6,
        }}>
          {phase.steps.length}
        </span>
      </div>
    )
  }

  // Active phase — prominent card
  return (
    <div style={{
      borderRadius: 10,
      border: '1px solid rgba(234,179,8,0.22)',
      background: 'rgba(234,179,8,0.04)',
      overflow: 'hidden',
      boxShadow: '0 0 0 3px rgba(234,179,8,0.04)',
      transition: 'border-color 0.25s, background 0.25s',
    }}>
      {/* Phase header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px 10px',
      }}>
        {/* Number badge */}
        <div style={{
          flexShrink: 0,
          width: 22, height: 22,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          background: 'rgba(234,179,8,0.9)',
          color: '#000',
          letterSpacing: '-0.01em',
        }}>
          {phaseNumber}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--tx-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
          }}>
            {phase.title}
          </p>
          {phase.description && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--tx-tertiary)', lineHeight: 1.45 }}>
              {phase.description}
            </p>
          )}
        </div>

        <span style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'rgba(234,179,8,0.7)',
          flexShrink: 0,
          background: 'rgba(234,179,8,0.08)',
          padding: '2px 6px',
          borderRadius: 4,
          border: '1px solid rgba(234,179,8,0.15)',
        }}>
          {phase.steps.length} steps
        </span>
      </div>

      {/* Steps */}
      <div style={{
        padding: '8px 14px 12px 14px',
        borderTop: '1px solid rgba(234,179,8,0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}>
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
      className="fade-in"
      style={{
        width: '100%',
        borderRadius: 14,
        overflow: 'hidden',
        border: isApproval
          ? '1px solid rgba(234,179,8,0.2)'
          : '1px solid rgba(255,255,255,0.08)',
        background: '#0e0e0e',
        boxShadow: isApproval
          ? '0 0 0 1px rgba(234,179,8,0.05) inset, 0 12px 40px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 11,
          padding: '12px 14px 13px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
        }}
        onClick={() => setCollapsed(o => !o)}
      >
        {/* Icon */}
        <div style={{
          width: 28, height: 28,
          borderRadius: 8,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isApproval ? 'rgba(234,179,8,0.1)' : 'rgba(255,255,255,0.05)',
          border: `1px solid ${isApproval ? 'rgba(234,179,8,0.2)' : 'rgba(255,255,255,0.08)'}`,
        }}>
          {isApproval
            ? <NasusLogo size={14} fill="var(--amber)" />
            : <Pxi name="cpu" size={13} style={{ color: 'var(--tx-secondary)' }} />
          }
        </div>

        {/* Title block */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 12,
            fontWeight: 600,
            color: isApproval ? 'var(--amber-soft)' : 'var(--tx-primary)',
            fontFamily: 'var(--font-display)',
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {isApproval ? 'Execution Plan' : plan.title}
          </p>
          {isApproval ? (
            <p style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'var(--tx-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {plan.title}
            </p>
          ) : (
            <p style={{
              margin: '2px 0 0',
              fontSize: 11,
              color: 'var(--tx-tertiary)',
              fontFamily: 'var(--font-mono)',
            }}>
              Phase {completedPhases + 1} / {plan.phases.length}
            </p>
          )}
        </div>

        {/* Right side */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexShrink: 0 }}>
          {isApproval && !collapsed && (
            <span style={{
              fontSize: 9.5,
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-muted)',
              background: 'rgba(255,255,255,0.04)',
              padding: '2px 6px',
              borderRadius: 4,
              border: '1px solid rgba(255,255,255,0.07)',
            }}>
              {plan.phases.length} phases · {totalSteps} steps
            </span>
          )}
          <div style={{
            width: 24, height: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            <Pxi
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={10}
              style={{ color: 'var(--tx-tertiary)' }}
            />
          </div>
        </div>

        {/* Progress bar — execution mode */}
        {!isApproval && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 2,
            background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{
              height: '100%',
              background: 'linear-gradient(to right, rgba(234,179,8,0.7), var(--amber))',
              width: `${progressPct}%`,
              transition: 'width 0.6s ease-out',
              boxShadow: '0 0 6px rgba(234,179,8,0.4)',
            }} />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <>
          {/* Plan description — approval only */}
          {isApproval && plan.description && (
            <div style={{ padding: '12px 14px 4px' }}>
              <p style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--tx-secondary)',
                lineHeight: 1.65,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.025)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}>
                {plan.description}
              </p>
            </div>
          )}

          {/* Phases */}
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: isApproval ? 400 : 340,
              overflowY: 'auto',
              padding: isApproval ? '10px 14px 14px' : '10px 12px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: isApproval ? 0 : 3,
            }}
          >
            {plan.phases.map((phase, i) => (
              isApproval ? (
                /* Approval: clean numbered list */
                <div key={phase.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                  padding: '9px 2px',
                  borderBottom: i < plan.phases.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                }}>
                  <span style={{
                    flexShrink: 0,
                    width: 20, height: 20,
                    borderRadius: 5,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9.5,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(255,255,255,0.06)',
                    color: 'var(--tx-tertiary)',
                    marginTop: 1,
                    border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12.5, fontWeight: 500, color: 'var(--tx-primary)', lineHeight: 1.4 }}>
                      {phase.title}
                    </p>
                    {phase.description && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--tx-tertiary)', lineHeight: 1.5 }}>
                        {phase.description}
                      </p>
                    )}
                  </div>
                  {phase.steps.length > 0 && (
                    <span style={{
                      fontSize: 9,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--tx-muted)',
                      flexShrink: 0,
                      marginTop: 3,
                    }}>
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

          {/* Execution-mode footer */}
          {!isApproval && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 14px 9px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.15)',
            }}>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--amber)',
                animation: 'statusPulse 1.6s ease-in-out infinite',
                flexShrink: 0,
                display: 'block',
              }} />
              <span style={{ fontSize: 10.5, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {totalSteps} steps total
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Approval footer — always visible ── */}
      {isApproval && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 7,
          padding: '10px 14px 11px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.15)',
        }}>
          <button
            onClick={onReject}
            style={{
              padding: '6px 16px',
              fontSize: 11.5,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.09)',
              background: 'transparent',
              color: 'var(--tx-secondary)',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--tx-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)' }}
          >
            Decline
          </button>

          <button
            onClick={onApprove}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 22px',
              fontSize: 11.5,
              fontWeight: 600,
              letterSpacing: '0.04em',
              borderRadius: 8,
              border: 'none',
              background: 'var(--amber)',
              color: '#000',
              cursor: 'pointer',
              boxShadow: '0 2px 14px rgba(234,179,8,0.25)',
              transition: 'transform 0.1s, box-shadow 0.14s, background 0.1s',
              fontFamily: 'inherit',
            }}
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
  <div style={{
    position: 'fixed', inset: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 24,
    background: 'rgba(0,0,0,0.82)',
    backdropFilter: 'blur(20px)',
    animation: 'fadeIn 0.25s ease-out',
  }}>
    <div style={{ width: '100%', maxWidth: 540, animation: 'slideUp 0.3s cubic-bezier(0.22,1,0.36,1)' }}>
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
