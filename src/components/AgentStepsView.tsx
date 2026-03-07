import { useState, memo, useMemo } from 'react'
import type { AgentStep } from '../types'
import { Pxi } from './Pxi'
import { BashOutput } from './BashOutput'
import { DiffView, DiffModeEnum } from '@git-diff-view/react'
import '@git-diff-view/react/styles/diff-view-pure.css'

interface Props {
  steps: AgentStep[]
  isStreaming?: boolean
}

export const AgentStepsView = memo(function AgentStepsView({ steps, isStreaming = false }: Props) {
  // Hooks must be called before any early returns (React Rules of Hooks)
  const [collapsed, setCollapsed] = useState(false)

  const rows = useMemo(() => buildRows(steps || []), [steps])

  // Separate memory rows from visible rows
  const memoryRows = useMemo(() => rows.filter(r =>
    r.kind === 'tool_pair' && isMemoryPath(String(r.call.input.path ?? ''))
  ) as ToolPair[], [rows])

  const visibleRows = useMemo(() => {
    const nonMemory = rows.filter(r =>
      !(r.kind === 'tool_pair' && isMemoryPath(String(r.call.input.path ?? '')))
    )
    // Batch consecutive same-type tool_pair operations (3+)
    const batched: ProcessedRow[] = []
    let i = 0
    while (i < nonMemory.length) {
      const row = nonMemory[i]
      if (row.kind !== 'tool_pair') {
        batched.push(row)
        i++
        continue
      }
      const tool = row.call.tool
      let j = i + 1
      while (j < nonMemory.length && nonMemory[j].kind === 'tool_pair' && (nonMemory[j] as ToolPair).call.tool === tool) {
        j++
      }
      const runLen = j - i
      if (runLen >= 3) {
        batched.push({ kind: 'tool_group', tool, pairs: nonMemory.slice(i, j) as ToolPair[] })
      } else {
        for (let k = i; k < j; k++) batched.push(nonMemory[k])
      }
      i = j
    }
    return batched
  }, [rows])

  // Derive count once — used in header label and badge
  const toolPairCount = useMemo(() => rows.filter(r => r.kind === 'tool_pair').length, [rows])

  // Count completed tool pairs (have a result)
  const completedCount = useMemo(() => rows.filter(r =>
    r.kind === 'tool_pair' && r.result !== null
  ).length, [rows])

  // Find the most recently active / pending action for the live header label
  const liveLabel = useMemo(() => {
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i]
      if (r.kind === 'tool_pair') {
        const { label } = formatActionLabel(r.call.tool, r.call.input)
        return label
      }
    }
    return 'Working…'
  }, [rows])

  const hasOnlyMemoryOps = useMemo(() => rows.every(r =>
    r.kind === 'tool_pair' && isMemoryPath(String(r.call.input.path ?? ''))
  ), [rows])

  const [memoryExpanded, setMemoryExpanded] = useState(false)

  // Early return after all hooks are called
  if (!steps || steps.length === 0) return null

  return (
    <div style={{ marginBottom: 6 }}>
      {/* Section header — collapsible */}
      <button
        onClick={() => setCollapsed(o => !o)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 8px 5px 6px',
          borderRadius: 7,
          background: 'transparent',
          border: '1px solid transparent',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
      >
        {/* Live status indicator */}
        <span style={{ flexShrink: 0, width: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isStreaming && !hasOnlyMemoryOps ? (
            <SpinnerDot />
          ) : (
            <Pxi name="check-circle" size={13} style={{ color: '#34d399' }} />
          )}
        </span>

        {/* Current action label */}
        <span style={{
          flex: 1,
          fontSize: 12,
          fontWeight: 500,
          color: isStreaming ? 'var(--tx-primary)' : 'var(--tx-secondary)',
          lineHeight: 1.4,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {isStreaming
            ? <>{liveLabel}<span style={{ margin: '0 5px', opacity: 0.35 }}>·</span><span style={{ fontWeight: 400, color: 'var(--tx-tertiary)', fontSize: 11 }}>{completedCount} of ~{toolPairCount}</span></>
            : `${toolPairCount} action${toolPairCount !== 1 ? 's' : ''} completed`}
        </span>

        {/* Step count badge */}
        {toolPairCount > 0 && (
          <span style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'var(--tx-tertiary)',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: '1px 6px',
            borderRadius: 4,
            flexShrink: 0,
          }}>
            {toolPairCount}
          </span>
        )}

        <Pxi
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={11}
          style={{ color: 'var(--tx-muted)', flexShrink: 0 }}
        />
      </button>

      {/* Step rows — hidden when collapsed */}
      {!collapsed && (
        <>
          <div style={{ marginLeft: 24, height: 1, background: 'rgba(255,255,255,0.04)', margin: '2px 0 4px 24px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, paddingLeft: 24, paddingTop: 0 }}>
            {/* Memory operations summary row */}
            {memoryRows.length > 0 && (
              <div>
                <button
                  onClick={() => setMemoryExpanded(o => !o)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 6px',
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>📋</span>
                  <span style={{ fontSize: 10, color: 'var(--tx-muted)', fontStyle: 'italic', flex: 1 }}>
                    {memoryRows.length} memory operation{memoryRows.length !== 1 ? 's' : ''}{' '}
                    ({[...new Set(memoryRows.map(r => String(r.call.input.path ?? '').split('/').pop()))].join(', ')})
                  </span>
                  <Pxi
                    name={memoryExpanded ? 'chevron-up' : 'chevron-down'}
                    size={9}
                    style={{ color: 'var(--tx-muted)', flexShrink: 0 }}
                  />
                </button>
                {memoryExpanded && (
                  <div style={{ paddingLeft: 4 }}>
                    {memoryRows.map((r, i) => <Row key={`mem-${i}`} row={r} />)}
                  </div>
                )}
              </div>
            )}
            {visibleRows.map((row, i) => (
              <ProcessedRowComponent key={i} row={row} />
            ))}
          </div>
        </>
      )}
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
    | { kind: 'verification'; step: Extract<AgentStep, { kind: 'verification' }> }
    | { kind: 'gateway_fallback'; step: Extract<AgentStep, { kind: 'gateway_fallback' }> }

type ToolGroup = {
  kind: 'tool_group'
  tool: string
  pairs: ToolPair[]
}

type ProcessedRow = AnyRow | ToolGroup

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
    } else if (step.kind === 'verification') {
      rows.push({ kind: 'verification', step })
    } else if (step.kind === 'gateway_fallback') {
      rows.push({ kind: 'gateway_fallback', step })
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
  if (row.kind === 'verification') return <VerificationRow step={row.step} />
  if (row.kind === 'gateway_fallback') return <FallbackRow step={row.step} />
  if (row.kind === 'context_compressed') {

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
        <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', display: 'flex', alignItems: 'center', gap: 5 }}>
          <Pxi name="refresh" size={12} style={{ color: 'var(--tx-tertiary)' }} />
          context compressed · {row.step.removedCount} pairs trimmed
        </span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
      </div>
    )
  }
  return null
}

// ─── Processed row dispatcher (handles ToolGroup) ─────────────────────────────

function ProcessedRowComponent({ row }: { row: ProcessedRow }) {
  if (row.kind === 'tool_group') return <ToolGroupRow group={row} />
  return <Row row={row} />
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
        gap: 8,
        padding: '4px 2px',
        borderRadius: 6,
        background: 'transparent',
        border: 'none',
        cursor: isLong ? 'pointer' : 'default',
      }}
      onMouseEnter={(e) => { if (isLong) e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
    >
      {/* Left accent line */}
      <div style={{ width: 2, borderRadius: 2, flexShrink: 0, alignSelf: 'stretch', minHeight: 14, background: 'oklch(64% 0.214 40.1 / 0.3)', marginTop: 2 }} />
      <span style={{ fontSize: 11.5, fontStyle: 'italic', lineHeight: 1.6, flex: 1, minWidth: 0, color: 'var(--tx-tertiary)' }}>
        {open ? (
          <span style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{content}</span>
        ) : (
          preview
        )}
        {isLong && !open && (
          <span style={{ marginLeft: 6, opacity: 0.45, fontSize: 9.5 }}>show more</span>
        )}
        {isLong && open && (
          <span style={{ marginLeft: 6, opacity: 0.45, fontSize: 9.5, display: 'block', marginTop: 2 }}>show less</span>
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
    ? 'rgba(255,255,255,0.15)'
    : toolIconColor(call.tool)

  // Error rows render as a prominent inline card
  if (isError) {
    return (
      <div style={{
        margin: '6px 0',
        padding: '10px 14px',
        borderRadius: 10,
        background: 'rgba(239,68,68,0.06)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderLeft: '3px solid #f87171',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <Pxi name="times-circle" size={14} style={{ color: '#f87171' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.06em', flex: 1 }}>
            {label} failed
          </span>
          <button
            onClick={() => setOpen(o => !o)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'rgba(248,113,113,0.6)', padding: 2 }}
          >
            <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} />
          </button>
        </div>
        {sublabel && (
          <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'rgba(248,113,113,0.5)', display: 'block', marginBottom: 6 }}>
            {sublabel}
          </span>
        )}
        <pre style={{
          fontSize: 11, fontFamily: 'var(--font-mono)', color: '#fca5a5',
          whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          margin: 0, maxHeight: 120, overflowY: 'auto',
        }}>
          {result?.output || 'Unknown error'}
        </pre>
        {open && (
          <div className="slide-down" style={{ marginTop: 8 }}>
            <ExpandedDetail call={call} result={result} isError={isError} isWriteFile={isWriteFile} isReadFile={isReadFile} isPatchFile={isPatchFile} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div style={{ borderRadius: 7, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 8px 5px 6px',
          borderRadius: open ? '7px 7px 0 0' : 7,
          border: `1px solid ${open ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          borderBottom: open ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
          background: open ? 'rgba(255,255,255,0.025)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        {/* Status dot */}
        <span style={{ flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isPending ? (
            <SpinnerDot />
          ) : (
            <Pxi name="check-circle" size={12} style={{ color: isMemoryFile ? 'rgba(52,211,153,0.2)' : '#34d399' }} />
          )}
        </span>

        {/* Tool icon */}
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', opacity: isMemoryFile ? 0.35 : 1 }}>
          <Pxi name={icon} size={13} style={{ color: iconColor }} />
        </span>

        {/* Label stack */}
        <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <span style={{
            fontSize: 12,
            fontWeight: isMemoryFile ? 400 : 500,
            color: isMemoryFile ? 'rgba(255,255,255,0.22)' : 'var(--tx-secondary)',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            lineHeight: 1.4,
          }}>
            {label}
          </span>
          {sublabel && (
            <span style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: isMemoryFile ? 'rgba(255,255,255,0.1)' : 'var(--tx-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.3,
            }}>
              {sublabel}
            </span>
          )}
        </span>

        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-muted)', flexShrink: 0, opacity: 0.5 }} />
      </button>

      {open && (
        <div className="slide-down">
          <ExpandedDetail call={call} result={result} isError={isError} isWriteFile={isWriteFile} isReadFile={isReadFile} isPatchFile={isPatchFile} />
        </div>
      )}
    </div>
  )
})

// ─── Tool group row (3+ consecutive same-type operations) ─────────────────────

function ToolGroupRow({ group }: { group: ToolGroup }) {
  const [open, setOpen] = useState(false)
  const { tool, pairs } = group
  const icon = toolIcon(tool)
  const iconColor = toolIconColor(tool)
  const allDone = pairs.every(p => p.result !== null)
  const hasError = pairs.some(p => p.result?.isError)

  const actionVerb = tool === 'write_file' ? 'Writing'
    : tool === 'read_file' ? 'Reading'
    : tool === 'patch_file' ? 'Editing'
    : tool === 'bash' || tool === 'bash_execute' ? 'Running'
    : tool === 'list_files' ? 'Listing'
    : tool === 'mkdir' ? 'Creating'
    : 'Processing'

  return (
    <div style={{ borderRadius: 7, overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 8px 5px 6px',
          borderRadius: open ? '7px 7px 0 0' : 7,
          border: `1px solid ${open ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          background: open ? 'rgba(255,255,255,0.025)' : 'transparent',
          cursor: 'pointer',
          transition: 'background 0.1s',
        }}
        onMouseEnter={(e) => { if (!open) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.background = 'transparent' }}
      >
        <span style={{ flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {!allDone ? (
            <SpinnerDot />
          ) : hasError ? (
            <Pxi name="times-circle" size={12} style={{ color: '#f87171' }} />
          ) : (
            <Pxi name="check-circle" size={12} style={{ color: '#34d399' }} />
          )}
        </span>
        <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>
          <Pxi name={icon} size={13} style={{ color: iconColor }} />
        </span>
        <span style={{ flex: 1, minWidth: 0, fontSize: 12, fontWeight: 500, color: 'var(--tx-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actionVerb} {pairs.length} files
        </span>
        {open && (
          <span style={{ fontSize: 9, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0, marginRight: 4 }}>
            expanded
          </span>
        )}
        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-muted)', flexShrink: 0, opacity: 0.5 }} />
      </button>
      {!open && (
        <div style={{ paddingLeft: 22, paddingBottom: 3 }}>
          {pairs.slice(0, 3).map((p, i) => {
            const subpath = String(p.call.input.path ?? p.call.input.command ?? '').split('/').pop() ?? ''
            return (
              <div key={i} style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-muted)', lineHeight: 1.7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {subpath || String(p.call.input.path ?? '').slice(0, 50)}
              </div>
            )
          })}
          {pairs.length > 3 && (
            <div style={{ fontSize: 10, color: 'var(--tx-muted)', fontStyle: 'italic' }}>
              +{pairs.length - 3} more
            </div>
          )}
        </div>
      )}
      {open && (
        <div className="slide-down" style={{
          background: 'rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderTop: 'none',
          borderRadius: '0 0 7px 7px',
          padding: '4px 0',
        }}>
          {pairs.map((p, i) => <ToolPairRow key={i} pair={p} />)}
        </div>
      )}
    </div>
  )
}

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
        background: 'rgba(0,0,0,0.12)',
        border: '1px solid rgba(255,255,255,0.07)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
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
          <div style={{ padding: '8px 12px' }}>
            <SectionLabel icon="arrow-right" label="Input" />
            <ScrollableCode content={JSON.stringify(call.input, null, 2)} maxHeight={160} />
          </div>
          {result && (
            <div style={{
              padding: '8px 12px',
              borderTop: isError ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(255,255,255,0.05)',
            }}>
              {call.tool === 'bash' || call.tool === 'bash_execute' ? (
                <BashOutput
                  output={result.output || '(no output)'}
                  command={String(call.input.command ?? '')}
                  exitCode={(result as { exitCode?: number })?.exitCode}
                  maxHeight={200}
                />
              ) : (
                <>
                  <SectionLabel icon={isError ? 'times' : 'check'} label={isError ? 'Error' : 'Output'} isError={isError} />
                  <ScrollableCode content={result.output || '(no output)'} maxHeight={200} isError={isError} />
                </>
              )}
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
      padding: '7px 12px 6px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      <Pxi name={icon} size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span style={{
        fontSize: 10.5,
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
          fontSize: 9,
          fontFamily: 'var(--font-mono)',
          color: 'var(--tx-tertiary)',
          background: 'rgba(255,255,255,0.07)',
          padding: '1px 5px',
          borderRadius: 4,
          flexShrink: 0,
        }}>
          {lang}
        </span>
      )}
      {success && (
        <Pxi name="check-circle" size={12} style={{ color: '#34d399', flexShrink: 0 }} />
      )}
    </div>
  )
}

// ─── Diff block ───────────────────────────────────────────────────────────────

/**
 * Build a minimal unified diff hunk from two string snippets.
 * The hunk header uses placeholder line numbers since we don't have the
 * actual file context here — the diff viewer just needs valid syntax.
 */
function buildUnifiedHunk(removed: string, added: string): string {
  const oldLines = removed.split('\n')
  const newLines = added.split('\n')
  const header = `@@ -1,${oldLines.length} +1,${newLines.length} @@`
  const body = [
    ...oldLines.map((l) => `-${l}`),
    ...newLines.map((l) => `+${l}`),
  ].join('\n')
  return `${header}\n${body}`
}

function DiffBlock({ removed, added }: { removed: string; added: string }) {
  const hunk = useMemo(() => buildUnifiedHunk(removed, added), [removed, added])

  return (
    <div style={{
      margin: '7px 12px',
      borderRadius: 7,
      overflow: 'hidden',
      border: '1px solid rgba(255,255,255,0.07)',
      fontSize: 11,
      // Override diff-view-pure.css tokens for dark theme
      '--diff-add-line-bg': 'rgba(52,211,153,0.08)',
      '--diff-del-line-bg': 'rgba(239,68,68,0.08)',
      '--diff-add-text-color': 'rgba(167,243,208,0.9)',
      '--diff-del-text-color': '#fca5a5',
      '--diff-font-size': '11px',
    } as React.CSSProperties}
    >
      <DiffView
        data={{
          oldFile: { content: removed },
          newFile: { content: added },
          hunks: [hunk],
        }}
        diffViewMode={DiffModeEnum.Unified}
        diffViewTheme="dark"
        diffViewFontSize={11}
        diffViewWrap
      />
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
          padding: '9px 12px',
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
          height: 24,
          background: isError
            ? 'linear-gradient(to bottom, transparent, rgba(20,5,5,0.8))'
            : 'linear-gradient(to bottom, transparent, rgba(10,10,10,0.85))',
          pointerEvents: 'none',
          borderRadius: '0 0 8px 8px',
        }} />
      )}
    </div>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ icon, label, isError = false }: { icon: string; label: string; isError?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
      <Pxi name={icon} size={12} style={{ color: isError ? '#f87171' : 'var(--tx-tertiary)' }} />
      <span style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.09em', fontWeight: 600, color: isError ? '#f87171' : 'var(--tx-tertiary)' }}>
        {label}
      </span>
    </div>
  )
}

function FallbackRow({ step }: { step: Extract<AgentStep, { kind: 'gateway_fallback' }> }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 8px',
      borderRadius: 8,
      background: 'rgba(234,179,8,0.04)',
      border: '1px solid rgba(234,179,8,0.12)',
    }}>
      <span style={{ flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Pxi name="bolt" size={12} style={{ color: 'var(--amber)' }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--amber)', flex: 1 }}>
        Switched: {step.fromGateway} &rarr; {step.toGateway}
      </span>
      <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(234,179,8,0.6)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {step.reason}
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
        border: '1.5px solid rgba(251,191,36,0.2)',
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

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 7,
      padding: '5px 8px',
      borderRadius: 7,
      background: isDone ? 'rgba(52,211,153,0.03)' : isFailed ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.015)',
      border: `1px solid ${isFailed ? 'rgba(239,68,68,0.1)' : isDone ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.055)'}`,
    }}>
      <span style={{ flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {isLive ? (
          <SpinnerDot />
        ) : (
          <Pxi name={isFailed ? 'times-circle' : 'check-circle'} size={12} style={{ color: isFailed ? '#f87171' : isDone ? '#34d399' : 'var(--amber)' }} />
        )}
      </span>

      <Pxi name="search" size={11} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />

      <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-secondary)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {message}
      </span>

      {/* Metadata pills */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        {query && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--tx-muted)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            padding: '1px 5px', borderRadius: 4, maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            &ldquo;{query}&rdquo;
          </span>
        )}
        {provider && provider !== 'none' && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--tx-muted)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            padding: '1px 5px', borderRadius: 4,
          }}>
            {provider}
          </span>
        )}
        {isDone && resultCount != null && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', color: '#34d399',
            background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.15)',
            padding: '1px 5px', borderRadius: 4,
          }}>
            {resultCount} results
          </span>
        )}
        {isDone && durationMs != null && (
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--tx-muted)',
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
            padding: '1px 5px', borderRadius: 4,
          }}>
            {durationMs}ms
          </span>
        )}
      </div>
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
  const subtitle = url ?? selector ?? detail ?? ''

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 8px',
      borderRadius: 8,
      background: 'rgba(255,255,255,0.015)',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.12)' : phase === 'done' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)'}`,
    }}>
      <span style={{ flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {phase === 'start' ? (
          <SpinnerDot />
        ) : (
          <Pxi name={isError ? 'times-circle' : 'check-circle'} size={12} style={{ color: isError ? '#f87171' : '#34d399' }} />
        )}
      </span>
      <Pxi name="browser" size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span style={{ fontSize: 12, fontWeight: 500, color: isError ? '#f87171' : 'var(--tx-secondary)', flexShrink: 0 }}>
        {label}
      </span>
      {subtitle && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
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
      gap: 9,
      borderRadius: 8,
      padding: '9px 11px',
      background: 'rgba(239,68,68,0.04)',
      border: '1px solid rgba(239,68,68,0.12)',
    }}>
      <Pxi name="exclamation-triangle" size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#f87171', margin: 0 }}>
          Repeated error on{' '}
          <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, padding: '0 4px', borderRadius: 4, background: 'rgba(239,68,68,0.12)' }}>
            {step.tool}
          </code>
        </p>
        {step.attempts.map((a, i) => (
          <p key={i} style={{ fontSize: 11, marginTop: 3, lineHeight: 1.5, color: 'rgba(248,113,113,0.5)' }}>
            Attempt {i + 1}: {a.slice(0, 140)}{a.length > 140 ? '…' : ''}
          </p>
        ))}
      </div>
    </div>
  )
}

// ─── Verification row ───────────────────────────────────────────────────────────

function VerificationRow({ step }: { step: Extract<AgentStep, { kind: 'verification' }> }) {
  const passed = step.status === 'passed'

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      padding: '5px 8px',
      borderRadius: 8,
      background: passed
        ? 'rgba(52,211,153,0.04)'
        : 'rgba(239,68,68,0.04)',
      border: passed
        ? '1px solid rgba(52,211,153,0.12)'
        : '1px solid rgba(239,68,68,0.12)',
    }}>
      <span style={{ flexShrink: 0, width: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Pxi
          name={passed ? 'shield-check' : 'shield-x'}
          size={12}
          style={{ color: passed ? '#34d399' : '#f87171' }}
        />
      </span>

      <Pxi name={passed ? 'check-circle' : 'x-circle'} size={12} style={{ color: passed ? '#34d399' : '#f87171', flexShrink: 0 }} />

      <span style={{ fontSize: 12, fontWeight: 500, color: passed ? '#34d399' : '#f87171', flex: 1 }}>
        Verification {passed ? 'passed' : 'failed'}
      </span>

      {step.error && (
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'rgba(248,113,113,0.7)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {step.error}
        </span>
      )}
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
    case 'patch_file':         return 'oklch(73% 0.17 55)'
    case 'read_file':          return 'oklch(72% 0.12 220)'
    case 'search_web':         return 'oklch(75% 0.14 145)'
    case 'http_fetch':         return 'oklch(72% 0.12 260)'
    case 'python_execute':
    case 'bash':
    case 'bash_execute':       return 'oklch(72% 0.12 185)'
    case 'browser_navigate':
    case 'browser_click':
    case 'browser_type':
    case 'browser_extract':
    case 'browser_screenshot': return 'oklch(72% 0.1 300)'
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
