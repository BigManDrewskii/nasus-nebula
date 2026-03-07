/**
 * Verification Report — Displays verification results to the user.
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
    <div className="flex-col vr-checklist">
      {items.map((item) => (
        <div key={item.key} className="flex-v-center vr-check-row">
            <Pxi
              name={item.checked ? 'check-circle' : 'times-circle'}
              style={{ color: item.checked ? 'var(--tok-str)' : 'var(--red-fg)', flexShrink: 0 }}
              size={13}
            />
          <span className="vr-check-label" style={{
            color: item.checked ? 'var(--tx-secondary)' : 'var(--tx-muted)',
            textDecoration: item.checked ? 'none' : 'line-through',
          }}>
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
      <div className="vr-no-issues text-muted">No issues found</div>
    )
  }

  const styles: Record<string, { color: string; bg: string; border: string }> = {
    error:      { color: 'var(--red-fg)',  bg: 'var(--red-a07)',    border: 'rgba(239,68,68,0.2)'   },
    warning:    { color: 'var(--amber)',   bg: 'var(--amber-a08)',  border: 'rgba(234,179,8,0.2)'   },
    suggestion: { color: 'var(--tok-key)', bg: 'rgba(125,211,252,0.08)', border: 'rgba(125,211,252,0.2)' },
  }

  return (
    <div className="flex-col vr-issues-list">
      {issues.map((issue, idx) => {
        const s = styles[issue.type] ?? styles.suggestion
        return (
          <div
            key={idx}
            className="vr-issue-item"
            style={{ background: s.bg, border: `1px solid ${s.border}`, borderRadius: 6, padding: '8px 10px' }}
          >
            <div className="flex-v-center vr-issue-header" style={{ gap: 6 }}>
              <Pxi
                name={issue.type === 'error' ? 'times-circle' : issue.type === 'warning' ? 'exclamation-triangle' : 'info-circle'}
                size={12}
                style={{ color: s.color, flexShrink: 0 }}
              />
              <span style={{ fontSize: 12, fontWeight: 600, color: s.color }}>{issue.message}</span>
            </div>
            {issue.correction && (
              <p className="vr-issue-correction" style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>
                {issue.correction}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
})

export const VerificationReport = memo(({ result, attempt = 1, maxAttempts = 3 }: VerificationReportProps) => {
  const confidencePercent = Math.round(result.confidence * 100)
  const passed = result.passed

  return (
    <div className="flex-col vr-card" style={{
      borderRadius: 8,
      border: `1px solid ${passed ? 'rgba(134,239,172,0.2)' : 'var(--red-a22)'}`,
      background: 'var(--bg-app-2)',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div
        className="flex-v-center justify-between vr-header"
        style={{
          padding: '10px 14px',
          borderBottom: `1px solid ${passed ? 'rgba(134,239,172,0.15)' : 'var(--red-a13)'}`,
          background: passed ? 'rgba(134,239,172,0.06)' : 'var(--red-a07)',
        }}
      >
        <div className="flex-v-center" style={{ gap: 6 }}>
          <Pxi
            name={passed ? 'check-circle' : 'times-circle'}
            size={14}
            style={{ color: passed ? 'var(--tok-str)' : 'var(--red-fg)' }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: passed ? 'var(--tok-str)' : 'var(--red-fg)' }}>
            {passed ? 'Verification Passed' : 'Verification Failed'}
          </span>
          {attempt > 1 && (
            <span style={{ fontSize: 10, color: 'var(--tx-muted)', marginLeft: 4 }}>
              attempt {attempt}/{maxAttempts}
            </span>
          )}
        </div>
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', fontVariantNumeric: 'tabular-nums' }}>
          {confidencePercent}% confidence
        </span>
      </div>

      {/* Content */}
      <div className="flex-col vr-body" style={{ padding: '12px 14px', gap: 12 }}>
        {/* Checklist */}
        <div>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Checklist
          </span>
          <VerificationChecklist result={result} />
        </div>

        {/* Issues */}
        {!passed && result.issues.length > 0 && (
          <div className="flex-col" style={{ gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Issues Found
            </span>
            <VerificationIssues issues={result.issues} />
          </div>
        )}

        {/* Corrections */}
        {!passed && result.corrections.length > 0 && (
          <div className="flex-col" style={{ gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--tx-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Suggested Corrections
            </span>
            <ol style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {result.corrections.map((correction, idx) => (
                <li key={idx} className="flex-v-center" style={{ gap: 6, fontSize: 12, color: 'var(--tx-secondary)' }}>
                  <span style={{ color: 'var(--tx-muted)', minWidth: 16, textAlign: 'right', flexShrink: 0 }}>{idx + 1}.</span>
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
  const passed = result.passed

  return (
    <div
      className="flex-v-center"
      style={{
        display: 'inline-flex',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 600,
          background: passed ? 'rgba(134,239,172,0.12)' : 'var(--red-a13)',
          color: passed ? 'var(--tok-str)' : 'var(--red-fg)',
          border: `1px solid ${passed ? 'rgba(134,239,172,0.25)' : 'var(--red-a22)'}`,
      }}
    >
      <Pxi name={passed ? 'check' : 'exclamation-triangle'} size={10} />
      <span>{passed ? 'Passed' : 'Failed'}</span>
      <span style={{ opacity: 0.6 }}>· {confidencePercent}%</span>
    </div>
  )
})
