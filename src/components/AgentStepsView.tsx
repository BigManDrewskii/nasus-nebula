import { useState, useRef, memo, useMemo } from 'react'
import type { AgentStep } from '../types'
import { Pxi } from './Pxi'

interface Props {
  steps: AgentStep[]
}

export const AgentStepsView = memo(function AgentStepsView({ steps }: Props) {
  if (!steps || steps.length === 0) return null
  const rows = useMemo(() => buildRows(steps), [steps])

  return (
    <div style={{ marginBottom: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
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
        // The store's updateStep embeds the tool_result directly onto the tool_call
        // step as a `.result` property (a runtime addition not in the type). Check for
        // it so we can render the pair as completed rather than forever pending.
        const embeddedResult = (step as typeof step & { result?: Extract<AgentStep, { kind: 'tool_result' }> }).result ?? null
        rows.push({ kind: 'tool_pair', call: step, result: embeddedResult })
      } else if (step.kind === 'tool_result') {
        // Fallback: handle orphan tool_result steps (e.g. from Tauri backend events
        // that arrive as separate steps rather than being merged).
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
      // output_cards is intentionally skipped here — rendered by ChatMessage via OutputCardRenderer
    }
    return rows
  }

// ─── Row dispatcher ───────────────────────────────────────────────────────────

function Row({ row }: { row: AnyRow }) {
  if (row.kind === 'thinking') return <ThinkingRow content={row.step.content} />
  if (row.kind === 'tool_pair') return <ToolPairRow pair={row} />
  if (row.kind === 'strike_escalation') return <StrikeRow step={row.step} />
  if (row.kind === 'search_status') return <SearchStatusChip step={row.step} />
  if (row.kind === 'browser_action') return <BrowserActionRow step={row.step} />
  if (row.kind === 'context_compressed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pxi name="refresh" size={10} style={{ color: 'var(--tx-tertiary)' }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)' }}>
            context compressed · {row.step.removedCount} pairs trimmed
          </span>
        </div>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
      </div>
    )
  }
  return null
}

// ─── Thinking row ─────────────────────────────────────────────────────────────

const ThinkingRow = memo(function ThinkingRow({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  // Show up to the first 120 chars of the first non-empty line as preview
  const firstLine = content.split('\n').find((l) => l.trim()) ?? ''
  const preview = firstLine.length > 120 ? firstLine.slice(0, 120) + '…' : firstLine
  const isLong = content.length > 120 || content.includes('\n')

  return (
    <button
      onClick={() => isLong && setOpen((o) => !o)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '4px 6px',
        borderRadius: 8,
        background: 'transparent',
        border: 'none',
        cursor: isLong ? 'pointer' : 'default',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { if (isLong) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <Pxi name="lightbulb" size={11} style={{ color: 'rgba(255,200,80,0.45)', marginTop: 3, flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, fontStyle: 'italic', lineHeight: 1.6, flex: 1, minWidth: 0, color: 'var(--tx-tertiary)' }}>
        {open ? (
          <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
        ) : (
          <>
            {preview}
            {isLong && (
              <Pxi
                name="chevron-down"
                size={9}
                style={{ color: 'var(--tx-tertiary)', marginLeft: 5, display: 'inline-block', verticalAlign: 'middle', opacity: 0.5 }}
              />
            )}
          </>
        )}
        {open && isLong && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginLeft: 6, opacity: 0.5 }}>
            <Pxi name="chevron-up" size={9} style={{ color: 'var(--tx-tertiary)' }} />
          </span>
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
  const label = formatToolLabel(call.tool, call.input)

  // Memory files: task_plan / findings / progress — de-emphasize in header
  const isMemoryFile = call.tool === 'write_file' && isMemoryPath(String(call.input.path ?? ''))
  const isWriteFile = call.tool === 'write_file'
  const isReadFile = call.tool === 'read_file'
  const isPatchFile = call.tool === 'patch_file'

  return (
    <div style={{ borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '7px 10px',
          borderRadius: open ? '10px 10px 0 0' : 10,
          border: open ? '1px solid rgba(255,255,255,0.07)' : '1px solid transparent',
          borderBottom: open ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
          background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.12s, border-color 0.12s',
        }}
        onMouseEnter={(e) => { if (!open) { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' } }}
        onMouseLeave={(e) => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' } }}
      >
        {/* Tool icon */}
        <Pxi
          name={toolIcon(call.tool)}
          size={11}
          style={{ color: isError ? '#f87171' : isMemoryFile ? 'rgba(255,255,255,0.2)' : 'var(--tx-tertiary)', flexShrink: 0 }}
        />

        {/* Tool name */}
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          fontWeight: 500,
          flexShrink: 0,
          color: isMemoryFile ? 'rgba(255,255,255,0.3)' : 'var(--tx-secondary)',
        }}>
          {call.tool}
        </span>

        {/* Label / path preview */}
        <span style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: isMemoryFile ? 'rgba(255,255,255,0.2)' : 'var(--tx-tertiary)',
        }}>
          {label}
        </span>

        {/* Status */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 5, marginLeft: 2 }}>
          {isPending ? (
            <PendingDots />
          ) : isError ? (
            <Pxi name="times-circle" size={10} style={{ color: '#f87171' }} />
          ) : (
            <Pxi name="check-circle" size={10} style={{ color: isMemoryFile ? 'rgba(52,211,153,0.4)' : '#34d399' }} />
          )}
        </span>

        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      </button>

      {/* Expanded detail */}
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
        background: 'rgba(255,255,255,0.015)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none',
        borderRadius: '0 0 10px 10px',
      }}
    >
      {/* ── write_file: path header + content preview ── */}
      {isWriteFile && filePath && (
        <div>
          {/* File path bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Pxi name="pencil" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
            <span style={{
              fontSize: 11,
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-secondary)',
              flex: 1,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {filePath}
            </span>
            {lang && (
              <span style={{
                fontSize: 9.5,
                fontFamily: 'var(--font-mono)',
                color: 'var(--tx-tertiary)',
                background: 'rgba(255,255,255,0.06)',
                padding: '1px 5px',
                borderRadius: 4,
                flexShrink: 0,
              }}>
                {lang}
              </span>
            )}
            {result && !isError && (
              <Pxi name="check-circle" size={10} style={{ color: '#34d399', flexShrink: 0 }} />
            )}
          </div>
          {/* Content */}
          <ScrollableCode content={fileContent ?? ''} maxHeight={200} />
        </div>
      )}

      {/* ── patch_file: diff-style old/new ── */}
      {isPatchFile && filePath && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Pxi name="edit" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filePath}
            </span>
            {result && !isError && <Pxi name="check-circle" size={10} style={{ color: '#34d399', flexShrink: 0 }} />}
          </div>
          {patchOld !== null && (
            <DiffBlock removed={patchOld} added={patchNew ?? ''} />
          )}
        </div>
      )}

      {/* ── read_file: show result content ── */}
      {isReadFile && filePath && (
        <div>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 12px 6px',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}>
            <Pxi name="eye" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
            <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {filePath}
            </span>
            {lang && (
              <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
                {lang}
              </span>
            )}
          </div>
          {result && (
            <ScrollableCode content={isError ? result.output : result.output} maxHeight={180} isError={isError} />
          )}
        </div>
      )}

      {/* ── generic tools: show raw input + output ── */}
      {!isWriteFile && !isReadFile && !isPatchFile && (
        <div>
          <div style={{ padding: '9px 12px' }}>
            <SectionLabel icon="arrow-right" label="Input" />
            <ScrollableCode content={JSON.stringify(call.input, null, 2)} maxHeight={160} />
          </div>
          {result && (
            <div style={{
              padding: '9px 12px',
              borderTop: isError ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(255,255,255,0.05)',
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

// ─── Diff block (patch_file) ──────────────────────────────────────────────────

function DiffBlock({ removed, added }: { removed: string; added: string }) {
  return (
    <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.12)',
        borderRadius: 6,
        padding: '6px 10px',
      }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(248,113,113,0.6)', display: 'block', marginBottom: 3 }}>REMOVED</span>
        <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: '#fca5a5', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }}>
          {removed}
        </pre>
      </div>
      <div style={{
        background: 'rgba(52,211,153,0.05)',
        border: '1px solid rgba(52,211,153,0.12)',
        borderRadius: 6,
        padding: '6px 10px',
      }}>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'rgba(52,211,153,0.6)', display: 'block', marginBottom: 3 }}>ADDED</span>
        <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'rgba(167,243,208,0.9)', margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', lineHeight: 1.5, maxHeight: 96, overflowY: 'auto' }}>
          {added}
        </pre>
      </div>
    </div>
  )
}

// ─── Scrollable code block ────────────────────────────────────────────────────

function ScrollableCode({ content, maxHeight, isError = false }: { content: string; maxHeight: number; isError?: boolean }) {
  const ref = useRef<HTMLPreElement>(null)
  const lines = content.split('\n').length

  return (
    <div style={{ position: 'relative' }}>
      <pre
        ref={ref}
        style={{
          fontSize: 11,
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight,
          overflowY: 'auto',
          margin: 0,
          padding: '8px 12px',
          color: isError ? '#fca5a5' : 'var(--tx-secondary)',
          background: isError ? 'rgba(239,68,68,0.04)' : 'transparent',
        }}
      >
        {content}
      </pre>
      {lines > 8 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 28,
          background: isError
            ? 'linear-gradient(to bottom, transparent, rgba(30,8,8,0.7))'
            : 'linear-gradient(to bottom, transparent, rgba(18,18,18,0.7))',
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <Pxi name={icon} size={9} style={{ color: isError ? '#f87171' : 'var(--tx-tertiary)' }} />
      <span style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 600, color: isError ? '#f87171' : 'var(--tx-tertiary)' }}>
        {label}
      </span>
    </div>
  )
}

// ─── Pending dots ─────────────────────────────────────────────────────────────

function PendingDots() {
  return (
    <span style={{ display: 'flex', gap: 3 }}>
      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--amber)', animation: 'typing-bounce 1.2s ease-in-out 0ms infinite', display: 'block' }} />
      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--amber)', animation: 'typing-bounce 1.2s ease-in-out 120ms infinite', display: 'block' }} />
      <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--amber)', animation: 'typing-bounce 1.2s ease-in-out 240ms infinite', display: 'block' }} />
    </span>
  )
}

// ─── Search status chip ───────────────────────────────────────────────────────

function SearchStatusChip({ step }: { step: Extract<AgentStep, { kind: 'search_status' }> }) {
  const { phase, provider, query, message, resultCount, durationMs } = step

  const isLive = phase === 'searching' || phase === 'fallback'
  const isFailed = phase === 'all_failed' || phase === 'no_results'
  const isDone = phase === 'complete'

  const dotColor = isFailed ? '#f87171' : isDone ? '#34d399' : 'var(--amber)'
  const borderColor = isFailed
    ? 'rgba(239,68,68,0.15)'
    : isDone
    ? 'rgba(52,211,153,0.12)'
    : 'rgba(255,255,255,0.06)'
  const bg = isFailed
    ? 'rgba(239,68,68,0.03)'
    : isDone
    ? 'rgba(52,211,153,0.03)'
    : 'rgba(255,255,255,0.02)'

  const providerLabel = provider !== 'none' ? provider : null
  const durationLabel = durationMs != null ? `${durationMs}ms` : null
  const countLabel = resultCount != null ? `${resultCount} result${resultCount !== 1 ? 's' : ''}` : null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '5px 10px',
      borderRadius: 8,
      border: `1px solid ${borderColor}`,
      background: bg,
    }}>
      {isLive ? (
        <PendingDots />
      ) : (
        <Pxi name={isFailed ? 'times-circle' : 'check-circle'} size={10} style={{ color: dotColor, flexShrink: 0 }} />
      )}

      <Pxi name="search" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />

      <span style={{ fontSize: 11, color: 'var(--tx-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {message}
      </span>

      {query && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flexShrink: 0, maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          &ldquo;{query}&rdquo;
        </span>
      )}

      {providerLabel && (
        <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4, flexShrink: 0 }}>
          {providerLabel}
        </span>
      )}
      {countLabel && isDone && (
        <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: '#34d399', flexShrink: 0 }}>
          {countLabel}
        </span>
      )}
      {durationLabel && isDone && (
        <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flexShrink: 0 }}>
          {durationLabel}
        </span>
      )}
    </div>
  )
}

// ─── Browser action row ───────────────────────────────────────────────────────

function BrowserActionRow({ step }: { step: Extract<AgentStep, { kind: 'browser_action' }> }) {
  const { action, url, selector, phase, detail } = step

  const BROWSER_ACTION_LABELS: Record<string, string> = {
    browser_navigate: 'Navigate',
    browser_click: 'Click',
    browser_type: 'Type',
    browser_extract: 'Extract page',
    browser_screenshot: 'Screenshot',
    browser_scroll: 'Scroll',
  }

  const label = BROWSER_ACTION_LABELS[action] ?? action
  const isError = phase === 'error'
  const isDone = phase === 'done'
  const dotColor = isError ? '#f87171' : isDone ? '#34d399' : 'var(--amber)'
  const borderColor = isError ? 'rgba(239,68,68,0.15)' : isDone ? 'rgba(52,211,153,0.12)' : 'rgba(255,255,255,0.06)'
  const bg = isError ? 'rgba(239,68,68,0.03)' : isDone ? 'rgba(52,211,153,0.03)' : 'rgba(255,255,255,0.02)'
  const subtitle = url ?? selector ?? detail ?? ''

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 7,
      padding: '5px 10px', borderRadius: 8,
      background: bg, border: `1px solid ${borderColor}`,
    }}>
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
      <Pxi name="browser" size={10} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span style={{ fontSize: 11, fontWeight: 500, color: isError ? '#f87171' : isDone ? '#34d399' : 'var(--tx-secondary)', flexShrink: 0 }}>
        {label}
      </span>
      {subtitle && (
        <span style={{
          fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
        }}>
          {subtitle.length > 60 ? subtitle.slice(0, 60) + '…' : subtitle}
        </span>
      )}
      {phase === 'start' && (
        <span style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <PendingDots />
        </span>
      )}
    </div>
  )
}

// ─── Strike escalation ────────────────────────────────────────────────────────

function StrikeRow({ step }: { step: Extract<AgentStep, { kind: 'strike_escalation' }> }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        borderRadius: 10,
        padding: '10px 12px',
        background: 'rgba(239,68,68,0.04)',
        border: '1px solid rgba(239,68,68,0.13)',
      }}
    >
      <Pxi name="exclamation-triangle" size={12} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 11.5, fontWeight: 500, color: '#f87171', margin: 0 }}>
          Strike escalation on{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, padding: '0 4px', borderRadius: 4, background: 'rgba(239,68,68,0.13)' }}>
            {step.tool}
          </code>
        </p>
        {step.attempts.map((a, i) => (
          <p key={i} style={{ fontSize: 11, marginTop: 3, lineHeight: 1.5, color: 'rgba(248,113,113,0.6)' }}>
            Strike {i + 1}: {a.slice(0, 140)}{a.length > 140 ? '…' : ''}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toolIcon(tool: string): string {
  switch (tool) {
    case 'bash':               return 'bolt'
    case 'read_file':          return 'eye'
    case 'write_file':         return 'pencil'
    case 'patch_file':         return 'edit'
    case 'http_fetch':         return 'globe'
    case 'list_files':         return 'folder-open'
    case 'search_web':         return 'search'
    case 'browser_navigate':   return 'browser'
    case 'browser_click':      return 'cursor'
    case 'browser_type':       return 'keyboard'
    case 'browser_extract':    return 'file-lines'
    case 'browser_screenshot': return 'camera'
    case 'browser_scroll':     return 'arrows-up-down'
    default:                   return 'cog'
  }
}

function formatToolLabel(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case 'bash':
      return String(input.command ?? '').slice(0, 72)
    case 'read_file':
    case 'write_file':
    case 'patch_file':
      return String(input.path ?? '')
    case 'list_files':
      return String(input.path ?? '/workspace')
    case 'http_fetch':
      return String(input.url ?? '')
    case 'search_web':
      return `"${String(input.query ?? '')}"`
    default:
      return ''
  }
}

function isMemoryPath(path: string): boolean {
  const name = path.split('/').pop() ?? ''
  return name === 'task_plan.md' || name === 'findings.md' || name === 'progress.md'
}

function detectLang(path: string): string | null {
  const ext = path.split('.').pop()?.toLowerCase()
  const map: Record<string, string> = {
    html: 'html', htm: 'html',
    css: 'css', scss: 'scss',
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
  switch (tool) {
    case 'bash':       return `Running: ${String(input.command ?? '').slice(0, 60)}`
    case 'read_file':  return `Reading: ${String(input.path ?? '')}`
    case 'write_file': return `Writing: ${String(input.path ?? '')}`
    case 'patch_file': return `Patching: ${String(input.path ?? '')}`
    case 'list_files': return `Listing: ${String(input.path ?? '/workspace')}`
    case 'http_fetch': return `Fetching: ${String(input.url ?? '')}`
    case 'search_web': return `Searching: "${String(input.query ?? '')}"`
    default:           return tool
  }
}

// Suppress unused warning — exported for potential consumers
export { formatToolActionLabel }
