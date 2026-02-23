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
    <div className="mb-1 space-y-px">
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
      <div className="flex items-center gap-2 py-2 px-1">
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex items-center gap-1.5">
          <Pxi name="refresh" size={10} style={{ color: '#333' }} />
          <span className="text-[10px] font-mono" style={{ color: '#333' }}>
            context compressed · {row.step.removedCount} pairs trimmed
          </span>
        </div>
        <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />
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
      className={`w-full text-left flex items-start gap-2 px-1.5 py-1.5 rounded-lg transition-colors ${isLong ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ background: 'transparent' }}
      onMouseEnter={(e) => { if (isLong) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      <Pxi name="face-thinking" size={12} style={{ color: '#3a3a3a', marginTop: 2, flexShrink: 0 }} />
      <span className="text-[12px] italic leading-relaxed flex-1 min-w-0" style={{ color: '#444' }}>
        {open ? content : preview}
        {isLong && !open && '…'}
        {isLong && (
          <Pxi
            name={open ? 'chevron-up' : 'chevron-down'}
            size={10}
            style={{ color: '#333', marginLeft: 4, display: 'inline-block', verticalAlign: 'middle' }}
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
    <div className="rounded-xl overflow-hidden fade-in">
      {/* Header */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-left flex items-center gap-2 px-2.5 py-2 rounded-xl transition-colors"
        style={{ background: open ? 'rgba(255,255,255,0.04)' : 'transparent' }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = 'transparent'
        }}
      >
        {/* Tool pixel icon */}
        <Pxi name={toolIcon(call.tool)} size={12} style={{ color: '#444', flexShrink: 0 }} />

        {/* Tool name */}
        <span className="text-[11px] font-mono font-medium flex-shrink-0" style={{ color: '#555' }}>
          {call.tool}
        </span>

        {/* Command preview */}
        <span className="text-[11.5px] font-mono truncate flex-1 text-left" style={{ color: '#333' }}>
          {label}
        </span>

        {/* Status */}
        <span className="flex-shrink-0 flex items-center gap-1.5 ml-1">
          {isPending ? (
            <span className="flex gap-[3px]">
              <span className="w-1 h-1 rounded-full bg-blue-500/70" style={{ animation: 'typing-bounce 1.2s ease-in-out 0ms infinite' }} />
              <span className="w-1 h-1 rounded-full bg-blue-500/70" style={{ animation: 'typing-bounce 1.2s ease-in-out 120ms infinite' }} />
              <span className="w-1 h-1 rounded-full bg-blue-500/70" style={{ animation: 'typing-bounce 1.2s ease-in-out 240ms infinite' }} />
            </span>
          ) : isError ? (
            <Pxi name="times-circle" size={11} style={{ color: '#f87171' }} />
          ) : (
            <Pxi name="check-circle" size={11} style={{ color: '#34d399' }} />
          )}
        </span>

        {/* Expand chevron */}
        <Pxi
          name={open ? 'chevron-up' : 'chevron-down'}
          size={10}
          style={{ color: '#2e2e2e', flexShrink: 0 }}
        />
      </button>

      {/* Expanded detail */}
      {open && (
        <div
          className="expand-down border border-t-0 rounded-b-xl"
          style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.05)' }}
        >
          {/* Input */}
          <div className="px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Pxi name="arrow-right" size={9} style={{ color: '#333' }} />
              <p className="text-[10px] uppercase tracking-[0.1em] font-medium" style={{ color: '#333' }}>Input</p>
            </div>
            <pre className="text-[11.5px] rounded-lg p-2.5 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all max-h-48 overflow-y-auto"
              style={{ background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.04)', color: '#888' }}>
              {JSON.stringify(call.input, null, 2)}
            </pre>
          </div>

          {/* Output */}
          {result && (
            <div
              className="px-3 py-2.5 border-t"
              style={{ borderColor: isError ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.04)' }}
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <Pxi
                  name={isError ? 'times' : 'check'}
                  size={9}
                  style={{ color: isError ? '#f87171' : '#34d399' }}
                />
                <p className="text-[10px] uppercase tracking-[0.1em] font-medium"
                  style={{ color: isError ? '#f87171' : '#333' }}>
                  {isError ? 'Error' : 'Output'}
                </p>
              </div>
              <pre
                className="text-[11.5px] rounded-lg p-2.5 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap break-all max-h-56 overflow-y-auto"
                style={isError
                  ? { background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }
                  : { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.04)', color: '#888' }
                }
              >
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
      className="flex items-start gap-2.5 rounded-xl px-3 py-2.5 my-1"
      style={{
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.15)',
      }}
    >
      <Pxi name="exclamation-triangle" size={13} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium" style={{ color: '#f87171' }}>
          Strike escalation on{' '}
          <code className="font-mono text-[11px] px-1 rounded" style={{ background: 'rgba(239,68,68,0.15)' }}>
            {step.tool}
          </code>
        </p>
        {step.attempts.map((a, i) => (
          <p key={i} className="text-[11px] mt-0.5 leading-relaxed" style={{ color: 'rgba(248,113,113,0.5)' }}>
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
