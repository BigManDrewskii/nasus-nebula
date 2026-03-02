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
    <div className={`group flex items-start gap-3 py-2.5 px-3.5 rounded-xl transition-all duration-300 ${
      isCurrent ? 'bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(234,179,8,0.05)]' : 'hover:bg-white/[0.03] border border-transparent'
    }`}>
      <span className={`flex-shrink-0 w-5.5 h-5.5 mt-0.5 flex items-center justify-center text-[10px] font-bold rounded-lg font-numeric transition-all duration-300 ${
        isCompleted 
          ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' 
          : isCurrent 
          ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(234,179,8,0.3)]' 
          : 'bg-white/5 text-white/30 border border-white/10'
      }`}>
        {isCompleted ? <Pxi name="check" size={8} /> : stepNumber}
      </span>
      
      <div className="flex-1 min-w-0">
        <span className={`text-[12px] leading-relaxed block transition-all duration-300 ${
          isCompleted ? 'text-white/30 line-through' : isCurrent ? 'text-white font-medium' : 'text-white/60'
        }`}>
          {step.description}
        </span>
        
        {step.tools && step.tools.length > 0 && !isCompleted && (
          <div className="flex gap-1.5 mt-2 flex-wrap">
            {step.tools.map((tool) => (
              <span
                key={tool}
                className={`px-1.5 py-0.5 text-[9px] font-black tracking-widest uppercase rounded-md transition-colors duration-300 ${
                    isCurrent ? 'bg-amber-500/10 text-amber-500/70 border border-amber-500/20' : 'bg-white/5 border border-white/10 text-white/30'
                }`}
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
    <div className={`rounded-2xl border transition-all duration-500 ${
      isCurrent 
        ? 'bg-white/[0.04] border-white/10 shadow-2xl shadow-black/40 ring-1 ring-white/5' 
        : isCompleted 
        ? 'bg-white/[0.01] border-white/5 opacity-50' 
        : 'bg-white/[0.02] border-white/5'
    }`}>
      <div className="flex items-center gap-3.5 px-4.5 py-4">
        <div className={`flex-shrink-0 w-8.5 h-8.5 flex items-center justify-center rounded-xl font-bold font-numeric text-xs transition-all duration-500 ${
          isCompleted 
            ? 'bg-amber-500/10 text-amber-500' 
            : isCurrent 
            ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-2 ring-amber-500/20' 
            : 'bg-white/5 text-white/30 border border-white/5'
        }`}>
          {isCompleted ? <Pxi name="check" size={14} /> : phaseNumber}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-[13px] font-black font-display tracking-[0.1em] transition-colors duration-500 uppercase ${
            isCurrent ? 'text-white' : 'text-white/50'
          }`}>
            {phase.title}
          </h4>
          {isCurrent && phase.description && (
            <p className="text-[11px] text-white/40 mt-1.5 line-clamp-1 italic font-medium tracking-wide">
              {phase.description}
            </p>
          )}
        </div>
        
        <div className={`text-[10px] font-black font-numeric uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg transition-all duration-500 ${
            isCurrent ? 'bg-amber-500/10 text-amber-500/60 border border-amber-500/20' : 'bg-white/5 text-white/20'
        }`}>
          {phase.steps.length} {phase.steps.length === 1 ? 'STEP' : 'STEPS'}
        </div>
      </div>
      
      {isCurrent && (
        <div className="px-3 pb-3.5 pt-0.5 space-y-1 animate-in fade-in slide-in-from-top-3 duration-500">
          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent mx-4 mb-3" />
          <div className="space-y-0.5 px-1.5">
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
    <div className={`w-full overflow-hidden rounded-[24px] border transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 ${
      isApprovalMode 
        ? 'border-amber-500/40 bg-black/60 shadow-[0_0_60px_rgba(0,0,0,0.6),0_0_30px_rgba(234,179,8,0.08)]' 
        : 'border-white/10 bg-white/[0.04] shadow-2xl shadow-black/80'
    } backdrop-blur-3xl relative group`}>
      {/* Decorative scanline for "Mission Control" look */}
      {!isCollapsed && (
        <div className="absolute inset-0 pointer-events-none opacity-[0.04] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.3)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-50 bg-[length:100%_2px,3px_100%]" />
      )}

      {/* Header */}
      <div 
        className={`relative px-6 py-5 border-b overflow-hidden cursor-pointer flex items-center justify-between gap-6 ${
          isApprovalMode ? 'bg-amber-500/[0.04] border-amber-500/20' : 'bg-white/[0.04] border-white/10'
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {/* Decorative background pulse for approval mode */}
        {isApprovalMode && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full -mr-16 -mt-16 animate-pulse" />
        )}

        <div className="flex items-center gap-5 relative z-10 flex-1">
          <div className={`p-3 rounded-2xl transition-all duration-500 ${
            isApprovalMode ? 'bg-amber-500 shadow-[0_0_25px_rgba(234,179,8,0.3)]' : 'bg-white/10 shadow-inner ring-1 ring-white/5'
          }`}>
            <Pxi name={isApprovalMode ? 'shield-check' : 'cpu'} className={`w-6 h-6 ${
              isApprovalMode ? 'text-black' : 'text-white/80'
            }`} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3.5">
              <h2 className="text-[14px] font-black font-display text-white tracking-[0.25em] uppercase">
                  {isApprovalMode ? 'Mission Strategy' : 'Execution Engine'}
              </h2>
              {isApprovalMode && (
                  <span className="bg-amber-500/20 text-amber-500 text-[9px] font-black px-2 py-0.5 rounded-md border border-amber-500/30 tracking-widest animate-pulse">
                      PENDING APPROVAL
                  </span>
              )}
              {!isApprovalMode && !isCollapsed && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500/50 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
                  <span className="text-[10px] font-black text-amber-500/60 uppercase tracking-[0.2em]">Operational</span>
                </div>
              )}
            </div>
            <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.3em] mt-1.5 line-clamp-1">
              {plan.title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-7 relative z-10">
          {!isCollapsed && (
            <div className="text-right hidden sm:block">
              <div className={`text-2xl font-black font-numeric leading-none tracking-tighter ${
                isApprovalMode ? 'text-amber-500' : 'text-white/90'
              }`}>{plan.phases.length}</div>
              <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.25em] mt-1">PHASES</div>
            </div>
          )}

          <div className={`p-2.5 rounded-xl transition-all duration-300 ${isCollapsed ? 'bg-white/5' : 'bg-transparent'}`}>
            <Pxi name={isCollapsed ? 'chevron-down' : 'chevron-up'} className="w-4 h-4 text-white/30" />
          </div>
        </div>
        
        {/* Progress bar (top) — always visible when not approval mode */}
        {!isApprovalMode && (
          <div className="absolute bottom-0 left-0 h-[3px] bg-amber-500/10 w-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(234,179,8,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}
      </div>

      {!isCollapsed && (
        <>
          {isApprovalMode && plan.description && (
            <div className="px-7 pt-6">
              <p className="text-[13px] text-white/80 leading-relaxed font-medium bg-black/50 p-5 rounded-2xl border border-white/10 shadow-inner">
                <span className="text-amber-500/60 mr-2.5 text-xl leading-none font-serif opacity-50">“</span>
                {plan.description}
                <span className="text-amber-500/60 ml-1.5 text-xl leading-none font-serif opacity-50">”</span>
              </p>
            </div>
          )}

          {/* Plan Content */}
          <div className={`max-h-[450px] overflow-y-auto p-6 space-y-5 custom-scrollbar transition-colors duration-700 ${
            isApprovalMode ? 'bg-amber-500/[0.01]' : 'bg-black/20'
          }`}>
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
          <div className={`px-7 py-6 border-t transition-all duration-700 ${
            isApprovalMode ? 'bg-amber-500/[0.06] border-amber-500/30' : 'bg-white/[0.03] border-white/10'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-7">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-1.5">System Metrics</span>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Pxi name="zap" className="w-3.5 h-3.5 text-amber-500/50" />
                        <span className="text-[11px] font-black text-white font-numeric tracking-widest">{totalSteps} NODES</span>
                      </div>
                      <div className="w-1 h-1 rounded-full bg-white/10" />
                      {plan.estimatedSteps > 0 && (
                        <div className="flex items-center gap-2">
                          <Pxi name="timer" className="w-3.5 h-3.5 text-amber-500/50" />
                          <span className="text-[11px] font-black text-amber-500/80 font-numeric tracking-widest">~{plan.estimatedSteps}SEC</span>
                        </div>
                      )}
                  </div>
                </div>
              </div>

              {isApprovalMode ? (
                <div className="flex gap-3.5 w-full sm:w-auto">
                  <button
                    onClick={onReject}
                    className="flex-1 sm:flex-none group relative px-7 py-3 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl border border-white/10 text-white/50 hover:text-white/90 hover:bg-white/[0.05] hover:border-white/20 transition-all active:scale-95 overflow-hidden"
                  >
                    <span className="relative z-10">REJECT</span>
                  </button>
                  <button
                    onClick={onApprove}
                    className="flex-1 sm:flex-none group relative px-9 py-3 text-[11px] font-black uppercase tracking-[0.3em] rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98] shadow-[0_15px_40px_rgba(234,179,8,0.25)] hover:shadow-[0_20px_50px_rgba(234,179,8,0.45)] flex items-center justify-center gap-3 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/40 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]" />
                    <Pxi name="play" className="w-4 h-4" />
                    <span className="relative z-10">INITIATE MISSION</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-4 py-2.5 px-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 shadow-[inset_0_0_20px_rgba(234,179,8,0.1)]">
                  <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/30" />
                  </div>
                  <span className="text-[11px] font-black text-amber-500 uppercase tracking-[0.5em] translate-y-px">DEPLOYED</span>
                </div>
              )}
            </div>
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
