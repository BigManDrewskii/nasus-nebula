/**
 * PlanView — Displays the execution plan for user approval or during execution.
 * Integrated directly into the chat for a better UX.
 */

import { memo } from 'react'
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
    <div className={`group flex items-start gap-3 py-2 px-3.5 rounded-xl transition-all duration-300 ${
      isCurrent ? 'bg-amber-500/10 border border-amber-500/20 shadow-[0_0_15px_rgba(234,179,8,0.05)]' : 'hover:bg-white/[0.03] border border-transparent'
    }`}>
      <span className={`flex-shrink-0 w-5 h-5 mt-0.5 flex items-center justify-center text-[10px] font-bold rounded-lg font-numeric transition-all duration-300 ${
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
                className={`px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase rounded-md transition-colors duration-300 ${
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
      <div className="flex items-center gap-3.5 px-4.5 py-3.5">
        <div className={`flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-xl font-bold font-numeric text-xs transition-all duration-500 ${
          isCompleted 
            ? 'bg-amber-500/10 text-amber-500' 
            : isCurrent 
            ? 'bg-amber-500 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)] ring-2 ring-amber-500/20' 
            : 'bg-white/5 text-white/30 border border-white/5'
        }`}>
          {isCompleted ? <Pxi name="check" size={14} /> : phaseNumber}
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className={`text-[13px] font-bold font-display tracking-tight transition-colors duration-500 ${
            isCurrent ? 'text-white' : 'text-white/50'
          }`}>
            {phase.title}
          </h4>
          {isCurrent && phase.description && (
            <p className="text-[11px] text-white/40 mt-1 line-clamp-1 italic font-medium">
              {phase.description}
            </p>
          )}
        </div>
        
        <div className={`text-[10px] font-bold font-numeric uppercase tracking-widest px-2.5 py-1 rounded-lg transition-all duration-500 ${
            isCurrent ? 'bg-amber-500/10 text-amber-500/60 border border-amber-500/20' : 'bg-white/5 text-white/20'
        }`}>
          {phase.steps.length} {phase.steps.length === 1 ? 'STEP' : 'STEPS'}
        </div>
      </div>
      
      {isCurrent && (
        <div className="px-3 pb-3 pt-0.5 space-y-1 animate-in fade-in slide-in-from-top-3 duration-500">
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
  const isApprovalMode = !!onApprove && !!onReject && !isReadOnly
  const totalSteps = plan.phases.reduce((sum, p) => sum + p.steps.length, 0)

  return (
    <div className={`w-full overflow-hidden rounded-[24px] border transition-all duration-700 animate-in fade-in slide-in-from-bottom-8 ${
      isApprovalMode 
        ? 'border-amber-500/40 bg-black/40 shadow-[0_0_50px_rgba(0,0,0,0.5),0_0_20px_rgba(234,179,8,0.05)]' 
        : 'border-white/10 bg-white/[0.02] shadow-2xl shadow-black/40'
    } backdrop-blur-xl`}>
      {/* Header */}
      <div className={`relative px-6 py-5 border-b overflow-hidden ${
        isApprovalMode ? 'bg-amber-500/[0.03] border-amber-500/20' : 'bg-white/[0.03] border-white/10'
      }`}>
        {/* Decorative background pulse for approval mode */}
        {isApprovalMode && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-[40px] rounded-full -mr-16 -mt-16 animate-pulse" />
        )}

        <div className="flex items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-2xl transition-all duration-500 ${
              isApprovalMode ? 'bg-amber-500 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'bg-white/10 shadow-inner ring-1 ring-white/5'
            }`}>
              <Pxi name="list-checks" className={`w-5.5 h-5.5 ${
                isApprovalMode ? 'text-black' : 'text-white/70'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-black font-display text-white tracking-widest uppercase">
                    {isApprovalMode ? 'Mission Strategy' : 'Execution Engine'}
                </h2>
                {isApprovalMode && (
                    <span className="bg-amber-500/20 text-amber-500 text-[9px] font-black px-1.5 py-0.5 rounded-md border border-amber-500/20 tracking-tighter animate-pulse">
                        AWAITING APPROVAL
                    </span>
                )}
              </div>
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.2em] mt-1 line-clamp-1">
                {plan.title}
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <div className={`text-2xl font-black font-numeric leading-none ${
              isApprovalMode ? 'text-amber-500' : 'text-white/80'
            }`}>{plan.phases.length}</div>
            <div className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mt-0.5">PHASES</div>
          </div>
        </div>
        
        {isApprovalMode && plan.description && (
          <p className="mt-4 text-[13px] text-white/70 leading-relaxed font-medium bg-black/20 p-3.5 rounded-2xl border border-white/5 shadow-inner">
            <span className="text-amber-500/50 mr-2 text-lg leading-none font-serif">“</span>
            {plan.description}
            <span className="text-amber-500/50 ml-1 text-lg leading-none font-serif">”</span>
          </p>
        )}
      </div>

      {/* Plan Content */}
      <div className={`max-h-[440px] overflow-y-auto p-5 space-y-4 custom-scrollbar transition-colors duration-700 ${
        isApprovalMode ? 'bg-amber-500/[0.01]' : 'bg-black/10'
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
      <div className={`px-6 py-5 border-t transition-all duration-700 ${
        isApprovalMode ? 'bg-amber-500/[0.04] border-amber-500/20' : 'bg-white/[0.02] border-white/10'
      }`}>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Efficiency Metrics</span>
              <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <Pxi name="bolt" className="w-3 h-3 text-amber-500/40" />
                    <span className="text-[11px] font-black text-white/80 font-numeric tracking-wider">{totalSteps} Steps</span>
                  </div>
                  <div className="w-1 h-1 rounded-full bg-white/10" />
                  {plan.estimatedSteps > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Pxi name="clock" className="w-3 h-3 text-amber-500/40" />
                      <span className="text-[11px] font-black text-amber-500/70 font-numeric tracking-wider">~{plan.estimatedSteps}s</span>
                    </div>
                  )}
              </div>
            </div>
          </div>

          {isApprovalMode ? (
            <div className="flex gap-3 w-full sm:w-auto">
              <button
                onClick={onReject}
                className="flex-1 sm:flex-none group relative px-6 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/10 text-white/40 hover:text-white/90 hover:bg-white/[0.05] hover:border-white/20 transition-all active:scale-95 overflow-hidden"
              >
                <span className="relative z-10">REJECT</span>
              </button>
              <button
                onClick={onApprove}
                className="flex-1 sm:flex-none group relative px-8 py-2.5 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl bg-amber-500 text-black hover:bg-amber-400 transition-all active:scale-[0.98] shadow-[0_10px_30px_rgba(234,179,8,0.2)] hover:shadow-[0_15px_40px_rgba(234,179,8,0.4)] flex items-center justify-center gap-2.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-[1.5s]" />
                <Pxi name="play" className="w-3.5 h-3.5" />
                <span className="relative z-10">INITIATE STRATEGY</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 py-1.5 px-4 rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-inner">
              <div className="flex gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              </div>
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">ENGAGED</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

// Legacy Export — deprecated but kept for compatibility
export const PlanConfirmationModal = memo(({ plan, onApprove, onReject }: { plan: ExecutionPlan, onApprove: () => void, onReject: () => void }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-xl animate-in fade-in duration-500">
      <div className="w-full max-w-2xl shadow-3xl transform animate-in slide-in-from-bottom-12 duration-700">
        <PlanView plan={plan} onApprove={onApprove} onReject={onReject} />
      </div>
    </div>
  )
})

export const CompactPlanView = memo(({ plan, currentPhase, currentStep }: { plan: ExecutionPlan, currentPhase?: number, currentStep?: number }) => {
  return <PlanView plan={plan} currentPhase={currentPhase} currentStep={currentStep} isReadOnly />
})
