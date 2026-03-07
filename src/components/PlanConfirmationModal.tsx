/**
 * PlanView — Manus-style minimal execution plan card.
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

// ─── Step pill ────────────────────────────────────────────────────────────────

function StepLine({ step, isCurrent, isDone }: { step: PlanStep; isCurrent: boolean; isDone: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 9,
      padding: '4px 0',
      opacity: isDone ? 0.38 : 1,
      transition: 'opacity 0.2s',
    }}>
      {/* dot */}
      <div style={{
        width: 5, height: 5,
        borderRadius: '50%',
        flexShrink: 0,
        marginTop: 6,
        background: isDone
          ? '#4ade80'
          : isCurrent
          ? 'var(--amber)'
          : 'rgba(255,255,255,0.18)',
        boxShadow: isCurrent ? '0 0 6px rgba(234,179,8,0.6)' : 'none',
        transition: 'background 0.2s, box-shadow 0.2s',
      }} />
      <span style={{
        fontSize: 12,
        lineHeight: 1.55,
        color: isCurrent ? 'var(--tx-primary)' : isDone ? 'var(--tx-muted)' : 'var(--tx-secondary)',
        textDecoration: isDone ? 'line-through' : 'none',
        flex: 1,
        minWidth: 0,
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
  // Completed phases: collapsed pill
  if (isDone) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 0',
        opacity: 0.32,
      }}>
        <Pxi name="check" size={10} style={{ color: '#4ade80', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--tx-tertiary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {phaseNumber}. {phase.title}
        </span>
      </div>
    )
  }

  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${isCurrent ? 'rgba(234,179,8,0.15)' : 'rgba(255,255,255,0.05)'}`,
      background: isCurrent ? 'rgba(234,179,8,0.025)' : 'transparent',
      overflow: 'hidden',
      transition: 'border-color 0.25s, background 0.25s',
    }}>
      {/* Phase header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
      }}>
        {/* number badge */}
        <div style={{
          flexShrink: 0,
          width: 20, height: 20,
          borderRadius: 5,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10,
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          background: isCurrent ? 'rgba(234,179,8,0.85)' : 'rgba(255,255,255,0.05)',
          color: isCurrent ? '#000' : 'var(--tx-muted)',
          transition: 'background 0.2s, color 0.2s',
        }}>
          {phaseNumber}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            color: isCurrent ? 'var(--tx-primary)' : 'var(--tx-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {phase.title}
          </p>
          {isCurrent && phase.description && (
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--tx-tertiary)', lineHeight: 1.45 }}>
              {phase.description}
            </p>
          )}
        </div>

        <span style={{
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: isCurrent ? 'var(--amber)' : 'var(--tx-muted)',
          flexShrink: 0,
        }}>
          {phase.steps.length}
        </span>
      </div>

      {/* Steps — only for current phase */}
      {isCurrent && (
        <div style={{
          padding: '0 14px 12px 14px',
          borderTop: '1px solid rgba(234,179,8,0.08)',
          paddingTop: 10,
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
      )}
    </div>
  )
})

// ─── Main PlanView ────────────────────────────────────────────────────────────

export const PlanView = memo(function PlanView({
  plan, onApprove, onReject, currentPhase, currentStep, isReadOnly,
}: PlanViewProps) {
  const isApproval = !!onApprove && !!onReject && !isReadOnly
  // Approval state starts collapsed (summary + Approve button visible, phases hidden)
  // Execution state starts expanded (phases are the main thing to watch)
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
          ? '1px solid rgba(234,179,8,0.18)'
          : '1px solid rgba(255,255,255,0.07)',
        background: '#0e0e0e',
        boxShadow: isApproval
          ? '0 0 0 1px rgba(234,179,8,0.04), 0 12px 40px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.35)',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          borderBottom: collapsed ? 'none' : '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          userSelect: 'none',
          position: 'relative',
        }}
        onClick={() => setCollapsed(o => !o)}
      >
        {/* logo / icon */}
        <div style={{
          width: 26, height: 26,
          borderRadius: 7,
          flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: isApproval ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isApproval ? 'rgba(234,179,8,0.18)' : 'rgba(255,255,255,0.07)'}`,
        }}>
          {isApproval
            ? <NasusLogo size={13} fill="var(--amber)" />
            : <Pxi name="cpu" size={12} style={{ color: 'var(--tx-secondary)' }} />
          }
        </div>

        {/* title + subtitle */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: isApproval ? 'var(--amber)' : 'var(--tx-secondary)',
            fontFamily: 'var(--font-display)',
          }}>
            {isApproval ? 'Execution Plan' : 'Working…'}
          </p>
          <p style={{
            margin: '1px 0 0',
            fontSize: 11,
            color: 'var(--tx-tertiary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {plan.title}
          </p>
        </div>

        {/* right side: phase count or phase indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isApproval && !collapsed && (
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-muted)',
              letterSpacing: '0.02em',
            }}>
              Phase {completedPhases + 1} / {plan.phases.length}
            </span>
          )}
          {isApproval && !collapsed && (
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-tertiary)',
            }}>
              {plan.phases.length} phases · {totalSteps} steps
            </span>
          )}
          <div style={{
            width: 22, height: 22,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderRadius: 5,
            background: 'rgba(255,255,255,0.04)',
          }}>
            <Pxi
              name={collapsed ? 'chevron-down' : 'chevron-up'}
              size={10}
              style={{ color: 'var(--tx-muted)' }}
            />
          </div>
        </div>

        {/* progress bar — execution mode only */}
        {!isApproval && (
          <div style={{
            position: 'absolute',
            bottom: 0, left: 0, right: 0,
            height: 1,
            background: 'rgba(234,179,8,0.06)',
            overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              background: 'var(--amber)',
              width: `${progressPct}%`,
              transition: 'width 0.6s ease-out',
              boxShadow: '0 0 8px rgba(234,179,8,0.5)',
            }} />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <>
          {/* Plan description — approval only */}
          {isApproval && plan.description && (
            <div style={{ padding: '12px 16px 0' }}>
              <p style={{
                margin: 0,
                fontSize: 12,
                color: 'var(--tx-secondary)',
                lineHeight: 1.65,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}>
                {plan.description}
              </p>
            </div>
          )}

          {/* Phases */}
          <div
            className="custom-scrollbar"
            style={{
              maxHeight: isApproval ? 400 : 320,
              overflowY: 'auto',
              padding: '12px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: isApproval ? 6 : 4,
            }}
          >
            {plan.phases.map((phase, i) => (
              isApproval ? (
                /* Approval: show all phases as clean numbered list */
                <div key={phase.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 11,
                  padding: '8px 0',
                  borderBottom: i < plan.phases.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
                }}>
                  {/* number */}
                  <span style={{
                    flexShrink: 0,
                    width: 18, height: 18,
                    borderRadius: 4,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9,
                    fontWeight: 600,
                    fontFamily: 'var(--font-mono)',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'var(--tx-tertiary)',
                    marginTop: 1,
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: 12, fontWeight: 500, color: 'var(--tx-primary)', lineHeight: 1.4 }}>
                      {phase.title}
                    </p>
                    {phase.description && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--tx-tertiary)', lineHeight: 1.5 }}>
                        {phase.description}
                      </p>
                    )}
                    {phase.steps.length > 0 && (
                      <p style={{ margin: '3px 0 0', fontSize: 10, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)' }}>
                        {phase.steps.length} step{phase.steps.length !== 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
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

          {/* Execution-mode footer (step count + running indicator) */}
          {!isApproval && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 16px',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(0,0,0,0.12)',
            }}>
              <span style={{
                width: 6, height: 6,
                borderRadius: '50%',
                background: 'var(--amber)',
                animation: 'statusPulse 1.6s ease-in-out infinite',
                flexShrink: 0,
                display: 'block',
              }} />
              <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)' }}>
                {totalSteps} steps total
              </span>
            </div>
          )}
        </>
      )}

      {/* ── Approval footer — always visible so user can approve without expanding ── */}
      {isApproval && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          gap: 6,
          padding: '10px 16px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          background: 'rgba(0,0,0,0.12)',
        }}>
          {/* Decline */}
          <button
            onClick={onReject}
            style={{
              padding: '6px 14px',
              fontSize: 11,
              fontWeight: 500,
              borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'transparent',
              color: 'var(--tx-secondary)',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = 'var(--tx-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--tx-secondary)' }}
          >
            Decline
          </button>

          {/* Approve */}
          <button
            onClick={onApprove}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 20px',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.05em',
              borderRadius: 8,
              border: 'none',
              background: 'var(--amber)',
              color: '#000',
              cursor: 'pointer',
              boxShadow: '0 0 18px rgba(234,179,8,0.18)',
              transition: 'transform 0.1s, box-shadow 0.14s',
              fontFamily: 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 0 28px rgba(234,179,8,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 0 18px rgba(234,179,8,0.18)' }}
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
