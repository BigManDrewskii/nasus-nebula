import { useState } from 'react'
import type { AgentStep } from '../types'
import { Pxi } from './Pxi'

interface Props {
  steps: AgentStep[]
}

export function AgentStepsView({ steps }: Props) {
  if (!steps || steps.length === 0) return null
  const rows = buildRows(steps)

  return (
    <div style={{ marginBottom: 4 }}>
      {rows.map((row, i) => (
        <Row key={i} row={row} />
      ))}
    </div>
  )
}

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

function buildRows(steps: AgentStep[]): AnyRow[] {
  const rows: AnyRow[] = []
  for (const step of steps) {
    if (step.kind === 'thinking') {
      rows.push({ kind: 'thinking', step })
    } else if (step.kind === 'tool_call') {
      rows.push({ kind: 'tool_pair', call: step, result: null })
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
    }
  }
  return rows
}

// ─── Row dispatcher ───────────────────────────────────────────────────────────

function Row({ row }: { row: AnyRow }) {
  if (row.kind === 'thinking') return <ThinkingRow content={row.step.content} />
  if (row.kind === 'tool_pair') return <ToolPairRow pair={row} />
  if (row.kind === 'strike_escalation') return <StrikeRow step={row.step} />
  if (row.kind === 'context_compressed') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pxi name="refresh" size={10} style={{ color: 'var(--tx-tertiary)' }} />
          {/* #757575 on #0d0d0d ≈ 4.6:1 */}
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

function ThinkingRow({ content }: { content: string }) {
  const [open, setOpen] = useState(false)
  const preview = content.split('\n')[0].slice(0, 90)
  const isLong = content.length > 90 || content.includes('\n')

  return (
    <button
      onClick={() => isLong && setOpen((o) => !o)}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
        padding: '6px',
        borderRadius: 8,
        background: 'transparent',
        border: 'none',
        cursor: isLong ? 'pointer' : 'default',
        transition: 'background 0.12s',
      }}
      onMouseEnter={(e) => { if (isLong) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Thinking icon: tertiary #757575 ≈ 4.6:1 */}
      <Pxi name="face-thinking" size={12} style={{ color: 'var(--tx-tertiary)', marginTop: 2, flexShrink: 0 }} />
      {/* Thinking text: secondary #ababab ≈ 7.9:1 */}
      <span style={{ fontSize: 12, fontStyle: 'italic', lineHeight: 1.6, flex: 1, minWidth: 0, color: 'var(--tx-secondary)' }}>
        {open ? content : preview}
        {isLong && !open && '…'}
        {isLong && (
          <Pxi
            name={open ? 'chevron-up' : 'chevron-down'}
            size={10}
            style={{ color: 'var(--tx-tertiary)', marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}
          />
        )}
      </span>
    </button>
  )
}

// ─── Tool pair row ────────────────────────────────────────────────────────────

function ToolPairRow({ pair }: { pair: ToolPair }) {
  const [open, setOpen] = useState(false)
  const { call, result } = pair
  const isPending = result === null
  const isError = result?.isError ?? false
  const label = formatToolLabel(call.tool, call.input)

  return (
    <div style={{ borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 10px',
          borderRadius: 12,
          border: 'none',
          background: open ? 'rgba(255,255,255,0.04)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.12s',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.03)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Tool icon: tertiary */}
        <Pxi name={toolIcon(call.tool)} size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />

        {/* Tool name: secondary #ababab ≈ 7.9:1 */}
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 500, flexShrink: 0, color: 'var(--tx-secondary)' }}>
          {call.tool}
        </span>

        {/* Command preview: tertiary #757575 ≈ 4.6:1 — readable context */}
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--tx-tertiary)' }}>
          {label}
        </span>

        {/* Status indicator */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          {isPending ? (
            <span style={{ display: 'flex', gap: 3 }}>
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)', animation: 'typing-bounce 1.2s ease-in-out 0ms infinite', display: 'block' }} />
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)', animation: 'typing-bounce 1.2s ease-in-out 120ms infinite', display: 'block' }} />
              <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)', animation: 'typing-bounce 1.2s ease-in-out 240ms infinite', display: 'block' }} />
            </span>
          ) : isError ? (
            <Pxi name="times-circle" size={11} style={{ color: '#f87171' }} />
          ) : (
            <Pxi name="check-circle" size={11} style={{ color: '#34d399' }} />
          )}
        </span>

        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      </button>

      {/* Expanded detail */}
      {open && (
        <div
          className="expand-down"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderTop: 'none', borderRadius: '0 0 12px 12px' }}
        >
          {/* Input */}
          <div style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Pxi name="arrow-right" size={9} style={{ color: 'var(--tx-tertiary)' }} />
              {/* Section header: tertiary ≈ 4.6:1 */}
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: 'var(--tx-tertiary)', margin: 0 }}>Input</p>
            </div>
            <pre style={{
              fontSize: 11,
              borderRadius: 8,
              padding: 10,
              overflowX: 'auto',
              fontFamily: 'var(--font-mono)',
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              maxHeight: 192,
              overflowY: 'auto',
              background: 'rgba(0,0,0,0.35)',
              border: '1px solid rgba(255,255,255,0.05)',
              /* Output code: #ababab ≈ 7.9:1 */
              color: 'var(--tx-secondary)',
              margin: 0,
            }}>
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {result && (
            <div style={{
              padding: '10px 12px',
              borderTop: isError ? '1px solid rgba(239,68,68,0.18)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <Pxi name={isError ? 'times' : 'check'} size={9} style={{ color: isError ? '#f87171' : '#34d399' }} />
                <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500, color: isError ? '#f87171' : 'var(--tx-tertiary)', margin: 0 }}>
                  {isError ? 'Error' : 'Output'}
                </p>
              </div>
              <pre style={isError ? {
                fontSize: 11,
                borderRadius: 8,
                padding: 10,
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 224,
                overflowY: 'auto',
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                color: '#fca5a5',
                margin: 0,
              } : {
                fontSize: 11,
                borderRadius: 8,
                padding: 10,
                overflowX: 'auto',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                maxHeight: 224,
                overflowY: 'auto',
                background: 'rgba(0,0,0,0.35)',
                border: '1px solid rgba(255,255,255,0.05)',
                color: 'var(--tx-secondary)',
                margin: 0,
              }}>
                {result.output || '(no output)'}
              </pre>
            </div>
          )}
        </div>
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
        borderRadius: 12,
        padding: '10px 12px',
        margin: '4px 0',
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.15)',
      }}
    >
      <Pxi name="exclamation-triangle" size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#f87171', margin: 0 }}>
          Strike escalation on{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '0 4px', borderRadius: 4, background: 'rgba(239,68,68,0.15)' }}>
            {step.tool}
          </code>
        </p>
        {step.attempts.map((a, i) => (
          <p key={i} style={{ fontSize: 11, marginTop: 2, lineHeight: 1.5, color: 'rgba(248,113,113,0.65)' }}>
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
    case 'bash':       return 'bolt'
    case 'read_file':  return 'eye'
    case 'write_file': return 'pencil'
    case 'http_fetch': return 'globe'
    case 'list_files': return 'folder-open'
    case 'search_web': return 'search'
    default:           return 'cog'
  }
}

function formatToolLabel(tool: string, input: Record<string, unknown>): string {
  switch (tool) {
    case 'bash':
      return String(input.command ?? '').slice(0, 72)
    case 'read_file':
    case 'write_file':
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
