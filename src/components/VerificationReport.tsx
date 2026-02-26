/**
 * Verification Report — Displays verification results to the user.
 *
 * Shows:
 * - Verification status (passed/failed)
 * - Checklist results
 * - Issues found with corrections
 * - Confidence score
 */

import { memo } from 'react'
import { Pxi } from './Pxi'

export interface VerificationIssue {
  type: 'error' | 'warning' | 'suggestion'
  message: string
  correction?: string
}

export interface VerificationReportData {
  passed: boolean
  confidence: number
  checklist: {
    filesCreated: boolean
    syntaxValid: boolean
    planCompliant: boolean
    errorsResolved: boolean
  }
  issues: VerificationIssue[]
  corrections: string[]
}

interface VerificationReportProps {
  result: VerificationReportData
  attempt?: number
  maxAttempts?: number
}

const VerificationChecklist = memo(({ result }: { result: VerificationReportData }) => {
  const items = [
    { key: 'filesCreated', label: 'Files Created', checked: result.checklist.filesCreated },
    { key: 'syntaxValid', label: 'Syntax Valid', checked: result.checklist.syntaxValid },
    { key: 'planCompliant', label: 'Plan Compliant', checked: result.checklist.planCompliant },
    { key: 'errorsResolved', label: 'Errors Resolved', checked: result.checklist.errorsResolved },
  ]

  return (
    <div className="space-y-1">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2 text-sm">
          <Pxi
            name={item.checked ? 'check-circle' : 'x-circle'}
            className={`w-4 h-4 ${item.checked ? 'text-green-500' : 'text-red-500'}`}
          />
          <span className={item.checked ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400 line-through'}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  )
})

const VerificationIssues = memo(({ issues }: { issues: VerificationIssue[] }) => {
  if (issues.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
        No issues found
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {issues.map((issue, idx) => {
        const icon = issue.type === 'error' ? 'x-circle' : issue.type === 'warning' ? 'alert-triangle' : 'info'
        const colors = {
          error: 'text-red-500 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800',
          warning: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800',
          suggestion: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
        }

        return (
          <div key={idx} className={`p-3 rounded-lg border ${colors[issue.type]}`}>
            <div className="flex items-start gap-2">
              <Pxi name={icon} className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{issue.message}</p>
                {issue.correction && (
                  <p className="text-xs mt-1 opacity-80">{issue.correction}</p>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
})

export const VerificationReport = memo(({ result, attempt = 1, maxAttempts = 3 }: VerificationReportProps) => {
  const confidencePercent = Math.round(result.confidence * 100)

  return (
    <div className="rounded-lg border bg-white dark:bg-gray-900 overflow-hidden">
      {/* Header */}
      <div className={`px-4 py-3 border-b ${
        result.passed
          ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
          : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pxi
              name={result.passed ? 'check-circle' : 'x-circle'}
              className={`w-5 h-5 ${result.passed ? 'text-green-500' : 'text-red-500'}`}
            />
            <h4 className="font-semibold">
              {result.passed ? 'Verification Passed' : 'Verification Failed'}
            </h4>
          </div>
          <div className="text-sm font-medium">
            {confidencePercent}% confidence
          </div>
        </div>
        {attempt > 1 && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Correction attempt {attempt} of {maxAttempts}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Checklist */}
        <div>
          <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Verification Checklist</h5>
          <VerificationChecklist result={result} />
        </div>

        {/* Issues */}
        {!result.passed && result.issues.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Issues Found</h5>
            <VerificationIssues issues={result.issues} />
          </div>
        )}

        {/* Corrections */}
        {!result.passed && result.corrections.length > 0 && (
          <div>
            <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Suggested Corrections</h5>
            <ol className="space-y-1">
              {result.corrections.map((correction, idx) => (
                <li key={idx} className="text-sm text-gray-600 dark:text-gray-400 flex gap-2">
                  <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{idx + 1}.</span>
                  <span>{correction}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  )
})

/**
 * Compact verification badge for use in step cards.
 */
export const VerificationBadge = memo(({ result }: { result: VerificationReportData }) => {
  const confidencePercent = Math.round(result.confidence * 100)

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
      result.passed
        ? 'bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-400'
        : 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400'
    }`}>
      <Pxi name={result.passed ? 'check' : 'alert-triangle'} className="w-3 h-3" />
      <span>{result.passed ? 'Passed' : 'Failed'}</span>
      <span className="opacity-60">· {confidencePercent}%</span>
    </div>
  )
})
