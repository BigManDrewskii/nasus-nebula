/**
 * Plan Confirmation Modal — Displays the execution plan for user approval.
 *
 * Shown when the Planning Agent generates a plan. The user can:
 * - Approve: Proceed with execution
 * - Reject: Cancel the task
 * - Edit: Modify the plan (future feature)
 */

import { memo } from 'react'
import type { ExecutionPlan, PlanPhase, PlanStep } from '../agent/core/Agent'
import { Pxi } from './Pxi'

interface PlanConfirmationProps {
  plan: ExecutionPlan
  onApprove: () => void
  onReject: () => void
}

// ── Plan Step Card ────────────────────────────────────────────────────────────────

interface PlanStepCardProps {
  step: PlanStep
  stepNumber: number
  phaseNumber: number
}

const PlanStepCard = memo(({ step, stepNumber }: PlanStepCardProps) => {
  return (
    <div className="flex items-start gap-2 py-1.5 px-3 rounded-md bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 transition-colors">
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
        {stepNumber}
      </span>
      <span className="flex-1 text-sm text-gray-700 dark:text-gray-300">
        {step.description}
      </span>
      {step.tools && step.tools.length > 0 && (
        <div className="flex gap-1 flex-shrink-0">
          {step.tools.slice(0, 3).map((tool) => (
            <span
              key={tool}
              className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
              title={tool}
            >
              {tool}
            </span>
          ))}
          {step.tools.length > 3 && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500">
              +{step.tools.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  )
})

// ── Plan Phase Card ───────────────────────────────────────────────────────────────

interface PlanPhaseCardProps {
  phase: PlanPhase
  phaseNumber: number
}

const PlanPhaseCard = memo(({ phase, phaseNumber }: PlanPhaseCardProps) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
        <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-sm font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
          {phaseNumber}
        </span>
        <h4 className="font-medium text-gray-900 dark:text-gray-100">{phase.title}</h4>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {phase.steps.length} {phase.steps.length === 1 ? 'step' : 'steps'}
        </span>
      </div>
      {phase.description && (
        <p className="px-4 pt-2 text-sm text-gray-600 dark:text-gray-400">
          {phase.description}
        </p>
      )}
      <div className="p-3 space-y-1">
        {phase.steps.map((step, idx) => (
          <PlanStepCard
            key={step.id}
            step={step}
            stepNumber={idx + 1}
            phaseNumber={phaseNumber}
          />
        ))}
      </div>
    </div>
  )
})

// ── Plan Confirmation Modal ───────────────────────────────────────────────────────

export const PlanConfirmationModal = memo(({ plan, onApprove, onReject }: PlanConfirmationProps) => {
  const totalSteps = plan.phases.reduce((sum, p) => sum + p.steps.length, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-950/50 dark:to-blue-950/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <Pxi name="list-checks" className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Execution Plan
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                  {plan.title}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{plan.phases.length}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">phases</div>
            </div>
          </div>
          {plan.description && (
            <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
              {plan.description}
            </p>
          )}
        </div>

        {/* Plan Content */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3 bg-gray-50/50 dark:bg-gray-800/30">
          {plan.phases.map((phase, idx) => (
            <PlanPhaseCard key={phase.id} phase={phase} phaseNumber={idx + 1} />
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              <span className="font-medium text-gray-700 dark:text-gray-300">{totalSteps}</span>
              {' '}estimated steps
              {plan.estimatedSteps > 0 && (
                <span className="ml-3">
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    ~{Math.ceil(plan.estimatedSteps * 0.5)}-{plan.estimatedSteps * 2}
                  </span>
                  {' '}seconds
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onReject}
                className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Reject
              </button>
              <button
                onClick={onApprove}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors flex items-center gap-2"
              >
                <Pxi name="play" className="w-4 h-4" />
                Approve & Execute
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

// ── Compact Plan View (for inline display) ───────────────────────────────────────────

interface CompactPlanViewProps {
  plan: ExecutionPlan
  currentPhase?: number
  currentStep?: number
}

export const CompactPlanView = memo(({ plan, currentPhase, currentStep }: CompactPlanViewProps) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{plan.title}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {plan.phases.length} phases · {plan.estimatedSteps} steps
        </span>
      </div>
      <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
        {plan.phases.map((phase, pIdx) => (
          <div key={phase.id} className="text-sm">
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <span className={`w-4 h-4 flex items-center justify-center text-xs rounded-full ${
                pIdx < (currentPhase ?? 0)
                  ? 'bg-green-500 text-white'
                  : pIdx === (currentPhase ?? 0)
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
              }`}>
                {pIdx < (currentPhase ?? 0) ? '✓' : pIdx + 1}
              </span>
              <span className={pIdx === (currentPhase ?? 0) ? 'font-medium' : ''}>{phase.title}</span>
            </div>
            {pIdx === (currentPhase ?? 0) && currentStep !== undefined && phase.steps.length > 0 && (
              <div className="ml-6 mt-1 space-y-0.5">
                {phase.steps.map((step, sIdx) => (
                  <div key={step.id} className={`text-xs ${
                    sIdx < currentStep
                      ? 'text-gray-400 line-through'
                      : sIdx === currentStep
                      ? 'text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    {step.description}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
})
