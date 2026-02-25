import { useState, memo, useMemo } from 'react'
import type { AgentStep } from '../types'
import { Pxi } from './Pxi'

interface Props {
  steps: AgentStep[]
}

export const AgentStepsView = memo(function AgentStepsView({ steps }: Props) {
  if (!steps || steps.length === 0) return null
  const rows = useMemo(() => buildRows(steps), [steps])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1, marginBottom: 4 }}>
      {rows.map((row, i) => (
        <Row key={i} row={row} />
      ))}
    </div>
  )
})

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolPair = {
  kind: 'tool_pair'
  call: Extract<AgentStep, { kind: 'tool_call' }>
  result: Extract<AgentStep, { kind: 'tool_result' }> | null
}

type AnyRow =
  | { kind: 'thinking'; step: Extract<AgentStep, { kind: 'thinking' }> }
  | ToolPair
  | { kind: 'strike_escalation'; step: Extract<AgentStep, { kind: 'strike_escalation' }> }
  | { kind: 'context_compressed'; step: Extract<AgentStep, { kind: 'context_compressed' }> }
  | { kind: 'search_status'; step: Extract<AgentStep, { kind: 'search_status' }> }
  | { kind: 'browser_action'; step: Extract<AgentStep, { kind: 'browser_action' }> }

function buildRows(steps: AgentStep[]): AnyRow[] {
  const rows: AnyRow[] = []
  for (const step of steps) {
    if (step.kind === 'thinking') {
      rows.push({ kind: 'thinking', step })
    } else if (step.kind === 'tool_call') {
      const embeddedResult = (step as typeof step & { result?: Extract<AgentStep, { kind: 'tool_result' }> }).result ?? null
      rows.push({ kind: 'tool_pair', call: step, result: embeddedResult })
    } else if (step.kind === 'tool_result') {
      const pairIdx = rows.findIndex(
        (r) => r.kind === 'tool_pair' && r.call.callId === step.callId && r.result === null,
      )
      if (pairIdx !== -1) {
        ;(rows[pairIdx] as ToolPair).result = step
      } else {
        rows.push({
          kind: 'tool_pair',
          call: { kind: 'tool_call', tool: 'unknown', input: {}, callId: step.callId },
          result: step,
        })
      }
    } else if (step.kind === 'strike_escalation') {
      rows.push({ kind: 'strike_escalation', step })
    } else if (step.kind === 'context_compressed') {
      rows.push({ kind: 'context_compressed', step })
    } else if (step.kind === 'search_status') {
      const existingIdx = (() => {
        for (let i = rows.length - 1; i >= 0; i--) {
          const r = rows[i]
          if (r.kind === 'search_status' && r.step.callId === step.callId) return i
        }
        return -1
      })()
      if (existingIdx !== -1) {
        rows[existingIdx] = { kind: 'search_status', step }
      } else {
        rows.push({ kind: 'search_status', step })
      }
    } else if (step.kind === 'browser_action') {
      rows.push({ kind: 'browser_action', step })
    }
  }
  return rows
}

// ─── Row dispatcher ───────────────────────────────────────────────────────────

function Row({ row }: { row: AnyRow }) {
  if (row.kind === 'thinking') return <ThinkingRow content={row.step.content} />
  if (row.kind === 'tool_pair') return <ToolPairRow pair={row} />
  if (row.kind === 'strike_escalation') return <StrikeRow step={row.step} />
  if (row.kind === 'search_status') return <SearchStatusRow step={row.step} />
  if (row.kind === 'browser_action') return <BrowserActionRow step={row.step} />
  if (row.kind === 'context_compressed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Pxi name="refresh" size={9} style={{ color: 'var(--tx-tertiary)' }} />
          context compressed · {row.step.removedCount} pairs trimmed
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>
    )
  }
  return null
}

// ─── Thinking row ─────────────────────────────────────────────────────────────

const ThinkingRow = memo(function ThinkingRow({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  const firstLine = content.split('\n').find((l) => l.trim()) ?? ''
  const preview = firstLine.length > 100 ? firstLine.slice(0, 100) + '…' : firstLine
  const isLong = content.length > 100 || content.includes('\n')

  return (
    <button
      onClick={() => isLong && setOpen((o) => !o)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        padding: '5px 2px',
        borderRadius: 8,
        background: 'transparent',
        border: 'none',
        cursor: isLong ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { if (isLong) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Left indicator line — amber */}
      <div style={{ width: 2, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch', minHeight: 16, background: 'oklch(64% 0.214 40.1 / 0.35)', marginTop: 2 }} />
      <span style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.65, flex: 1, minWidth: 0, color: 'var(--tx-tertiary)' }}>
        {open ? (
          <span style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{content}</span>
        ) : (
          preview
        )}
        {isLong && !open && (
          <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 10 }}>show more</span>
        )}
        {isLong && open && (
          <span style={{ marginLeft: 6, opacity: 0.5, fontSize: 10, display: 'block', marginTop: 3 }}>show less</span>
        )}
      </span>
    </button>
  )
})

// ─── Tool pair row ────────────────────────────────────────────────────────────

const ToolPairRow = memo(function ToolPairRow({ pair }: { pair: ToolPair }) {
  const [open, setOpen] = useState(false)
  const { call, result } = pair
  const isPending = result === null
  const isError = result?.isError ?? false

  const isMemoryFile = call.tool === 'write_file' && isMemoryPath(String(call.input.path ?? ''))
  const isWriteFile = call.tool === 'write_file'
  const isReadFile = call.tool === 'read_file'
  const isPatchFile = call.tool === 'patch_file'

  const { label, sublabel } = formatActionLabel(call.tool, call.input)
  const icon = toolIcon(call.tool)
  const iconColor = isError
    ? '#f87171'
    : isMemoryFile
    ? 'rgba(255,255,255,0.2)'
    : toolIconColor(call.tool)

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 9,
          padding: '7px 10px 7px 8px',
          borderRadius: open ? '10px 10px 0 0' : 10,
          border: open ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          borderBottom: open ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
          background: open ? 'rgba(255,255,255,0.035)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Status indicator dot/icon */}
        <span style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPending ? (
            <SpinnerDot />
          ) : isError ? (
            <Pxi name="times-circle" size={11} style={{ color: '#f87171' }} />
          ) : (
            <Pxi name="check-circle" size={11} style={{ color: isMemoryFile ? 'rgba(52,211,153,0.3)' : '#34d399' }} />
          )}
        </span>

        {/* Tool icon */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Pxi name={icon} size={12} style={{ color: iconColor }} />
        </span>

        {/* Action label + sublabel */}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 1 }}>
          <span style={{
            fontSize: 12.5,
            fontWeight: 500,
            color: isMemoryFile ? 'rgba(255,255,255,0.3)' : isError ? '#f87171' : 'var(--tx-primary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}>
            {label}
          </span>
          {sublabel && (
            <span style={{
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              color: isMemoryFile ? 'rgba(255,255,255,0.18)' : 'var(--tx-tertiary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}>
              {sublabel}
            </span>
          )}
        </span>

        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0, opacity: 0.5 }} />
      </button>

      {open && (
        <ExpandedDetail call={call} result={result} isError={isError} isWriteFile={isWriteFile} isReadFile={isReadFile} isPatchFile={isPatchFile} />
      )}
    </div>
  )
})

// ─── Expanded detail ──────────────────────────────────────────────────────────

function ExpandedDetail({
  call, result, isError, isWriteFile, isReadFile, isPatchFile,
}: {
  call: ToolPair['call']
  result: ToolPair['result']
  isError: boolean
  isWriteFile: boolean
  isReadFile: boolean
  isPatchFile: boolean
}) {
  const filePath = isWriteFile || isReadFile || isPatchFile ? String(call.input.path ?? '') : null
  const fileContent = isWriteFile ? String(call.input.content ?? '') : null
  const patchOld = isPatchFile ? String(call.input.old_str ?? '') : null
  const patchNew = isPatchFile ? String(call.input.new_str ?? '') : null
  const lang = filePath ? detectLang(filePath) : null

  return (
    <div
      className="expand-down"
      style={{
        background: 'rgba(0,0,0,0.15)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
      }}
    >
      {/* write_file */}
      {isWriteFile && filePath && (
        <div>
          <FilePathBar path={filePath} lang={lang} success={!!(result && !isError)} icon="pencil" />
          <ScrollableCode content={fileContent ?? ''} maxHeight={220} />
        </div>
      )}

      {/* patch_file */}
      {isPatchFile && filePath && (
        <div>
          <FilePathBar path={filePath} lang={lang} success={!!(result && !isError)} icon="edit" />
          {patchOld !== null && <DiffBlock removed={patchOld} added={patchNew ?? ''} />}
        </div>
      )}

      {/* read_file */}
      {isReadFile && filePath && (
        <div>
          <FilePathBar path={filePath} lang={lang} success={false} icon="eye" />
          {result && <ScrollableCode content={result.output} maxHeight={180} isError={isError} />}
        </div>
      )}

      {/* generic tools */}
      {!isWriteFile && !isReadFile && !isPatchFile && (
        <div>
          <div style={{ padding: '10px 14px' }}>
            <SectionLabel icon="arrow-right" label="Input" />
            <ScrollableCode content={JSON.stringify(call.input, null, 2)} maxHeight={160} />
          </div>
          {result && (
            <div style={{
              padding: '10px 14px',
              borderTop: isError ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              <SectionLabel icon={isError ? 'times' : 'check'} label={isError ? 'Error' : 'Output'} isError={isError} />
              <ScrollableCode content={result.output || '(no output)'} maxHeight={200} isError={isError} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── File path bar ────────────────────────────────────────────────────────────

function FilePathBar({ path, lang, success, icon }: { path: string; lang: string | null; success: boolean; icon: string }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '8px 14px 7px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <Pxi name={icon} size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span style={{
        fontSize: 11,
        fontFamily: 'var(--font-mono)',
        color: 'var(--tx-secondary)',
        flex: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {path}
      </span>
      {lang && (
        <span style={{
          fontSize: 9.5,
          fontFamily: 'var(--font-mono)',
          color: 'var(--tx-tertiary)',
          background: 'rgba(255,255,255,0.07)',
          padding: '1px 6px',
          borderRadius: 4,
          flexShrink: 0,
        }}>
          {lang}
        </span>
      )}
      {success && (
        <Pxi name="check-circle" size={10} style={{ color: '#34d399', flexShrink: 0 }} />
      )}
    </div>
  )
}

// ─── Diff block ───────────────────────────────────────────────────────────────

function DiffBlock({ removed, added }: { removed: string; added: string }) {
  return (
    <div style={{ padding: '8px 14px', display: 'flex', flexDirection: 'column', gap: 5 }}>
      <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 7, padding: '7px 10px' }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(248,113,113,0.5)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>removed</span>
        <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#fca5a5', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.55, maxHeight: 96, overflowY: 'auto' }}>
          {removed}
        </pre>
      </div>
      <div style={{ background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.1)', borderRadius: 7, padding: '7px 10px' }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(52,211,153,0.5)', display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>added</span>
        <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(167,243,208,0.85)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.55, maxHeight: 96, overflowY: 'auto' }}>
          {added}
        </pre>
      </div>
    </div>
  )
}

// ─── Scrollable code block ────────────────────────────────────────────────────

function ScrollableCode({ content, maxHeight, isError = false }: { content: string; maxHeight: number; isError?: boolean }) {
  const lines = content.split('\n').length
  return (
    <div style={{ position: 'relative' }}>
      <pre
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight,
          overflowY: 'auto',
          margin: 0,
          padding: '10px 14px',
          color: isError ? '#fca5a5' : 'var(--tx-secondary)',
          background: isError ? 'rgba(239,68,68,0.03)' : 'transparent',
        }}
      >
        {content}
      </pre>
      {lines > 8 && (
        <div style={{
          position: 'absolute',
          bottom: 0, left: 0, right: 0,
          height: 28,
          background: isError
            ? 'linear-gradient(to bottom, transparent, rgba(20,5,5,0.8))'
            : 'linear-gradient(to bottom, transparent, rgba(10,10,10,0.85))',
          pointerEvents: 'none',
          borderRadius: '0 0 10px 10px',
        }} />
      )}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, isError = false }: { icon: string; label: string; isError?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
      <Pxi name={icon} size={9} style={{ color: isError ? '#f87171' : 'var(--tx-tertiary)' }} />
      <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: isError ? '#f87171' : 'var(--tx-tertiary)' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Spinner dot (pending) ────────────────────────────────────────────────────

function SpinnerDot() {
  return (
    <span
      style={{
        width: 8,
        height: 8,
        borderRadius: '50%',
        display: 'block',
        border: '1.5px solid rgba(251,191,36,0.25)',
        borderTopColor: 'var(--amber)',
        animation: 'spin 0.7s linear infinite',
        flexShrink: 0,
      }}
    />
  )
}

// ─── Search status row ────────────────────────────────────────────────────────

function SearchStatusRow({ step }: { step: Extract<AgentStep, { kind: 'search_status' }> }) {
  const { phase, provider, query, message, resultCount, durationMs } = step

  const isLive = phase === 'searching' || phase === 'fallback'
  const isFailed = phase === 'all_failed' || phase === 'no_results'
  const isDone = phase === 'complete'

  const accentColor = isFailed ? '#f87171' : isDone ? '#34d399' : 'var(--amber)'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '7px 10px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.015)',
      border: `1px solid ${isFailed ? 'rgba(239,68,68,0.12)' : isDone ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      {/* Status icon */}
      <span style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLive ? (
          <SpinnerDot />
        ) : (
          <Pxi name={isFailed ? 'times-circle' : 'check-circle'} size={11} style={{ color: accentColor }} />
        )}
      </span>

      <Pxi name="search" size={11} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />

      <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--tx-primary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {message}
      </span>

      {query && (
        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flexShrink: 0, maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          &ldquo;{query}&rdquo;
        </span>
      )}
      {provider && provider !== 'none' && (
        <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', background: 'rgba(255,255,255,0.06)', padding: '1px 6px', borderRadius: 4, flexShrink: 0 }}>
          {provider}
        </span>
      )}
      {isDone && resultCount != null && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: '#34d399', flexShrink: 0 }}>
          {resultCount} result{resultCount !== 1 ? 's' : ''}
        </span>
      )}
      {isDone && durationMs != null && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flexShrink: 0 }}>
          {durationMs}ms
        </span>
      )}
    </div>
  )
}

// ─── Browser action row ───────────────────────────────────────────────────────

function BrowserActionRow({ step }: { step: Extract<AgentStep, { kind: 'browser_action' }> }) {
  const { action, url, selector, phase, detail } = step

  const LABELS: Record<string, string> = {
    browser_navigate: 'Navigate to',
    browser_click: 'Click',
    browser_type: 'Type into',
    browser_extract: 'Extract page content',
    browser_screenshot: 'Take screenshot',
    browser_scroll: 'Scroll',
  }

  const label = LABELS[action] ?? action
  const isError = phase === 'error'
  const isDone = phase === 'done'
  const subtitle = url ?? selector ?? detail ?? ''

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 9,
      padding: '7px 10px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.015)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.12)' : isDone ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      <span style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'start' ? (
          <SpinnerDot />
        ) : (
          <Pxi name={isError ? 'times-circle' : 'check-circle'} size={11} style={{ color: isError ? '#f87171' : '#34d399' }} />
        )}
      </span>
      <Pxi name="browser" size={11} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span style={{ fontSize: 12.5, fontWeight: 500, color: isError ? '#f87171' : 'var(--tx-primary)', flexShrink: 0 }}>
        {label}
      </span>
      {subtitle && (
        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
          {subtitle.length > 60 ? subtitle.slice(0, 60) + '…' : subtitle}
        </span>
      )}
    </div>
  )
}

// ─── Strike row ───────────────────────────────────────────────────────────────

function StrikeRow({ step }: { step: Extract<AgentStep, { kind: 'strike_escalation' }> }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      borderRadius: 10,
      padding: '10px 12px',
      background: 'rgba(239,68,68,0.04)',
      border: '1px solid rgba(239,68,68,0.12)',
    }}>
      <Pxi name="exclamation-triangle" size={12} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#f87171', margin: 0 }}>
          Repeated error on{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, padding: '0 4px', borderRadius: 4, background: 'rgba(239,68,68,0.12)' }}>
            {step.tool}
          </code>
        </p>
        {step.attempts.map((a, i) => (
          <p key={i} style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.5, color: 'rgba(248,113,113,0.55)' }}>
            Attempt {i + 1}: {a.slice(0, 140)}{a.length > 140 ? '…' : ''}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Human-readable action label + sublabel per tool call */
function formatActionLabel(tool: string, input: Record<string, unknown>): { label: string; sublabel: string | null } {
  const path = String(input.path ?? '')
  const url = String(input.url ?? '')
  const command = String(input.command ?? '')
  const query = String(input.query ?? '')
  const fileName = path.split('/').pop() ?? path

  switch (tool) {
    case 'write_file':
      if (isMemoryPath(path)) {
        const memLabels: Record<string, string> = { 'task_plan.md': 'Writing task plan', 'findings.md': 'Saving findings', 'progress.md': 'Updating progress' }
        const baseName = path.split('/').pop() ?? ''
        return { label: memLabels[baseName] ?? 'Writing memory file', sublabel: path }
      }
      return { label: `Writing ${fileName}`, sublabel: path !== fileName ? path : null }

    case 'read_file':
      if (isMemoryPath(path)) {
        const memLabels: Record<string, string> = { 'task_plan.md': 'Reading task plan', 'findings.md': 'Reading findings', 'progress.md': 'Reading progress' }
        const baseName = path.split('/').pop() ?? ''
        return { label: memLabels[baseName] ?? 'Reading memory file', sublabel: path }
      }
      return { label: `Reading ${fileName}`, sublabel: path !== fileName ? path : null }

    case 'patch_file':
      return { label: `Editing ${fileName}`, sublabel: path !== fileName ? path : null }

    case 'list_files':
      return { label: 'Listing files', sublabel: String(input.path ?? '/workspace') }

    case 'bash': {
      const cmd = command.trim().slice(0, 60)
      // Describe common patterns
      if (command.startsWith('mkdir')) return { label: 'Creating directory', sublabel: cmd }
      if (command.startsWith('cat')) return { label: 'Reading file', sublabel: cmd }
      if (command.startsWith('echo')) return { label: 'Writing output', sublabel: cmd }
      if (command.startsWith('ls')) return { label: 'Listing directory', sublabel: cmd }
      return { label: 'Running command', sublabel: cmd }
    }

    case 'http_fetch':
      try {
        const u = new URL(url)
        return { label: `Fetching ${u.hostname}`, sublabel: url.length > 55 ? url.slice(0, 55) + '…' : url }
      } catch {
        return { label: 'Fetching URL', sublabel: url.slice(0, 55) }
      }

    case 'search_web':
      return { label: 'Searching the web', sublabel: query ? `"${query.slice(0, 60)}"` : null }

    case 'python_execute':
      return { label: 'Running Python', sublabel: String(input.code ?? '').split('\n')[0].slice(0, 60) || null }

    case 'bash_execute':
      return { label: 'Running in cloud sandbox', sublabel: command.trim().slice(0, 60) }

    case 'browser_navigate':
      try {
        const u = new URL(String(input.url ?? ''))
        return { label: `Navigating to ${u.hostname}`, sublabel: String(input.url ?? '') }
      } catch {
        return { label: 'Navigating browser', sublabel: String(input.url ?? '') }
      }

    case 'browser_screenshot':
      return { label: 'Taking screenshot', sublabel: null }

    case 'browser_extract':
      return { label: 'Extracting page content', sublabel: null }

    case 'browser_click':
      return { label: 'Clicking element', sublabel: String(input.selector ?? '') }

    case 'browser_type':
      return { label: 'Typing into field', sublabel: String(input.selector ?? '') }

    default:
      return { label: tool, sublabel: null }
  }
}

function toolIcon(tool: string): string {
  switch (tool) {
    case 'bash':               return 'bolt'
    case 'bash_execute':       return 'bolt'
    case 'read_file':          return 'eye'
    case 'write_file':         return 'pencil'
    case 'patch_file':         return 'edit'
    case 'http_fetch':         return 'globe'
    case 'list_files':         return 'folder-open'
    case 'search_web':         return 'search'
    case 'python_execute':     return 'code'
    case 'browser_navigate':   return 'browser'
    case 'browser_click':      return 'cursor'
    case 'browser_type':       return 'keyboard'
    case 'browser_extract':    return 'file-lines'
    case 'browser_screenshot': return 'camera'
    case 'browser_scroll':     return 'arrows-up-down'
    default:                   return 'cog'
  }
}

function toolIconColor(tool: string): string {
  switch (tool) {
    case 'write_file':
    case 'patch_file':         return 'oklch(73% 0.17 55)'   // warm amber-orange
    case 'read_file':          return 'oklch(72% 0.12 220)'   // muted blue
    case 'search_web':         return 'oklch(75% 0.14 145)'   // soft green
    case 'http_fetch':         return 'oklch(72% 0.12 260)'   // soft indigo
    case 'python_execute':
    case 'bash':
    case 'bash_execute':       return 'oklch(72% 0.12 185)'   // teal
    case 'browser_navigate':
    case 'browser_click':
    case 'browser_type':
    case 'browser_extract':
    case 'browser_screenshot': return 'oklch(72% 0.1 300)'    // soft purple
    default:                   return 'var(--tx-tertiary)'
  }
}

function isMemoryPath(path: string): boolean {
  const name = path.split('/').pop() ?? ''
  return name === 'task_plan.md' || name === 'findings.md' || name === 'progress.md'
}

function detectLang(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    html: 'html', htm: 'html', css: 'css', scss: 'scss',
    js: 'js', jsx: 'jsx', ts: 'ts', tsx: 'tsx',
    json: 'json', md: 'md', txt: 'txt',
    py: 'python', rs: 'rust', go: 'go',
    sh: 'bash', yaml: 'yaml', yml: 'yaml',
    toml: 'toml', xml: 'xml', svg: 'svg',
  }
  return ext ? (map[ext] ?? null) : null
}

// Kept for potential external use
function formatToolActionLabel(tool: string, input: Record<string, unknown>): string {
  return formatActionLabel(tool, input).label
}
export { formatToolActionLabel }
