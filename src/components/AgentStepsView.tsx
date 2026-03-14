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

  // Derive count once
  const toolPairCount = useMemo(() => rows.filter(r => r.kind === 'tool_pair').length, [rows])

  // Find the most recently active / pending action for the live header label
  const liveAction = useMemo(() => {
    for (let i = rows.length - 1; i >= 0; i--) {
      const r = rows[i]
      if (r.kind === 'tool_pair') {
        const { label, sublabel } = formatActionLabel(r.call.tool, r.call.input)
        return { label, sublabel }
      }
    }
    return { label: 'Working…', sublabel: null }
  }, [rows])

  const hasOnlyMemoryOps = useMemo(() => rows.every(r =>
    r.kind === 'tool_pair' && isMemoryPath(String(r.call.input.path ?? ''))
  ), [rows])

  const [memoryExpanded, setMemoryExpanded] = useState(false)

  // Early return after all hooks are called
  if (!steps || steps.length === 0) return null

  return (
    <div className="steps-wrapper">
      {/* Section header — collapsible */}
      <button
        onClick={() => setCollapsed(o => !o)}
        className="steps-header-btn"
      >
        {/* Status indicator */}
        <span className="status-dot">
          {isStreaming && !hasOnlyMemoryOps
            ? <SpinnerDot />
            : <Pxi name="check-circle" size={12} style={{ color: '#34d399' }} />
          }
        </span>

        {/* Label */}
        <span
          className="steps-label"
          style={{ color: isStreaming ? 'var(--tx-secondary)' : 'var(--tx-tertiary)' }}
        >
          {isStreaming
            ? liveAction.label
            : `${toolPairCount} action${toolPairCount !== 1 ? 's' : ''}`
          }
        </span>

        {/* Sublabel — shown only while streaming */}
        {isStreaming && liveAction.sublabel && (
          <span className="steps-sublabel">
            {liveAction.sublabel}
          </span>
        )}

        {/* Count badge — shown when not streaming */}
        {!isStreaming && toolPairCount > 0 && (
          <span className="steps-count">
            {toolPairCount}
          </span>
        )}

        <Pxi
          name={collapsed ? 'chevron-down' : 'chevron-up'}
          size={9}
          style={{ color: 'var(--tx-ghost)', flexShrink: 0 }}
        />
      </button>

      {/* Step rows — hidden when collapsed */}
      {!collapsed && (
        <div className="steps-list">
          <div className="steps-divider" />
          <div className="steps-rows">
            {/* Memory operations summary row */}
            {memoryRows.length > 0 && (
              <div>
                <button
                  onClick={() => setMemoryExpanded(o => !o)}
                  className="steps-memory-btn"
                >
                  <span className="steps-memory-label">
                    {memoryRows.length} memory op{memoryRows.length !== 1 ? 's' : ''}{' '}
                    ({[...new Set(memoryRows.map(r => String(r.call.input.path ?? '').split('/').pop()))].join(', ')})
                  </span>
                  <Pxi name={memoryExpanded ? 'chevron-up' : 'chevron-down'} size={8} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />
                </button>
                {memoryExpanded && (
                  <div className="steps-memory-indent">
                    {memoryRows.map((r, i) => <Row key={`mem-${i}`} row={r} />)}
                  </div>
                )}
              </div>
            )}
            {visibleRows.map((row, i) => (
              <ProcessedRowComponent key={i} row={row} />
            ))}
          </div>
        </div>
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
        <div className="steps-compressed">
          <div className="steps-rule" />
          <span className="steps-compressed-label">
            <Pxi name="refresh" size={12} style={{ color: 'var(--tx-tertiary)' }} />
            context compressed · {row.step.removedCount} pairs trimmed
          </span>
          <div className="steps-rule" />
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
      className="thinking-btn"
      style={{ cursor: isLong ? 'pointer' : 'default' }}
    >
      {/* Left accent line */}
      <div className="thinking-accent" />
      <span className="thinking-content">
        {open ? (
          <span style={{ whiteSpace: 'pre-wrap', display: 'block' }}>{content}</span>
        ) : (
          preview
        )}
        {isLong && !open && (
          <span className="thinking-toggle">show more</span>
        )}
        {isLong && open && (
          <span className="thinking-toggle" style={{ display: 'block', marginTop: 2 }}>show less</span>
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
        <div className="tool-error-card">
          <div className="tool-error-header">
            <Pxi name="times-circle" size={14} style={{ color: '#f87171' }} />
            <span className="tool-error-label">
              {label} failed
            </span>
            <button
              onClick={() => setOpen(o => !o)}
              className="tool-error-toggle"
            >
              <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} />
            </button>
          </div>
          {sublabel && (
            <span className="tool-error-sublabel">
              {sublabel}
            </span>
          )}
          <pre className="tool-error-pre">
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

    // Determine if this tool's output is worth expanding
    const isExpandable = isError || open || call.tool === 'bash_execute' || call.tool === 'python_execute' || call.tool === 'bash'

    return (
      <div style={{ borderRadius: 6, overflow: 'hidden' }}>
        <button
          onClick={() => setOpen((o) => !o)}
          className="tool-row-btn"
          style={{
            borderRadius: open ? '6px 6px 0 0' : 6,
            border: `1px solid ${open ? 'rgba(255,255,255,0.07)' : 'transparent'}`,
            borderBottom: open ? '1px solid rgba(255,255,255,0.04)' : '1px solid transparent',
            background: open ? 'rgba(255,255,255,0.02)' : 'transparent',
          }}
        >
          {/* Status dot */}
          <span className="status-dot">
            {isPending ? (
              <SpinnerDot />
            ) : (
              <Pxi name="check-circle" size={11} style={{ color: isMemoryFile ? 'rgba(52,211,153,0.2)' : '#34d399' }} />
            )}
          </span>

          {/* Tool icon */}
          <span className="tool-icon" style={{ opacity: isMemoryFile ? 0.25 : 0.7 }}>
            <Pxi name={icon} size={12} style={{ color: iconColor }} />
          </span>

          {/* Inline label + sublabel */}
          <span
            className="tool-label"
            style={{
              fontWeight: isMemoryFile ? 400 : 500,
              color: isMemoryFile ? 'rgba(255,255,255,0.22)' : isError ? '#f87171' : 'var(--tx-tertiary)',
            }}
          >
            {label}
              {sublabel && !isMemoryFile && (
                <span className="tool-sublabel" title={sublabel}>
                  {sublabel}
                </span>
              )}
          </span>

          {isExpandable && (
            <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={9} style={{ color: 'var(--tx-ghost)', flexShrink: 0 }} />
          )}
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
        className="tool-group-btn"
        style={{
          borderRadius: open ? '7px 7px 0 0' : 7,
          border: `1px solid ${open ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          background: open ? 'rgba(255,255,255,0.025)' : 'transparent',
        }}
      >
        <span className="status-dot">
          {!allDone ? (
            <SpinnerDot />
          ) : hasError ? (
            <Pxi name="times-circle" size={12} style={{ color: '#f87171' }} />
          ) : (
            <Pxi name="check-circle" size={12} style={{ color: '#34d399' }} />
          )}
        </span>
        <span className="tool-icon" style={{ opacity: 1 }}>
          <Pxi name={icon} size={13} style={{ color: iconColor }} />
        </span>
          <span className="tool-label" style={{ fontSize: 'var(--text-xs)', color: 'var(--tx-secondary)' }}>
              {actionVerb} {pairs.length} files
            </span>
        {open && (
          <span className="tool-group-badge">
            expanded
          </span>
        )}
        <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-muted)', flexShrink: 0, opacity: 0.5 }} />
      </button>
      {!open && (
        <div className="tool-group-files">
          {pairs.slice(0, 3).map((p, i) => {
            const subpath = String(p.call.input.path ?? p.call.input.command ?? '').split('/').pop() ?? ''
            return (
              <div key={i} className="tool-group-file">
                {subpath || String(p.call.input.path ?? '').slice(0, 50)}
              </div>
            )
          })}
          {pairs.length > 3 && (
            <div className="tool-group-more">
              +{pairs.length - 3} more
            </div>
          )}
        </div>
      )}
      {open && (
        <div className="slide-down tool-group-expanded">
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
            <div className="detail-pad">
              <SectionLabel icon="arrow-right" label="Input" />
              <ScrollableCode content={JSON.stringify(call.input, null, 2)} maxHeight={160} />
            </div>
            {result && (
              <div
                className="detail-pad"
                style={{ borderTop: isError ? '1px solid rgba(239,68,68,0.12)' : '1px solid rgba(255,255,255,0.05)' }}
              >
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
    <div className="filepath-bar">
      <Pxi name={icon} size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span className="filepath-text" title={path}>
        {path}
      </span>
      {lang && (
        <span className="filepath-lang">
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
    <div
      className="diff-block"
      style={{
        '--diff-add-line-bg': 'rgba(52,211,153,0.08)',
        '--diff-del-line-bg': 'rgba(239,68,68,0.08)',
        '--diff-add-text-color': 'rgba(167,243,208,0.9)',
        '--diff-del-text-color': '#fca5a5',
        '--diff-font-size': 'var(--text-2xs)',
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
          fontSize: 'var(--text-2xs)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.65,
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxHeight,
          overflowY: 'auto',
          margin: 0,
          padding: '8px 12px',
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
    <div className="section-label">
      <Pxi name={icon} size={12} style={{ color: isError ? '#f87171' : 'var(--tx-tertiary)' }} />
      <span className="section-label-text" style={{ color: isError ? '#f87171' : 'var(--tx-tertiary)' }}>
        {label}
      </span>
    </div>
  )
}

function FallbackRow({ step }: { step: Extract<AgentStep, { kind: 'gateway_fallback' }> }) {
  return (
    <div className="fallback-row">
      <span className="status-dot">
        <Pxi name="bolt" size={12} style={{ color: 'var(--amber)' }} />
      </span>
      <span className="fallback-label">
        Switched: {step.fromGateway} &rarr; {step.toGateway}
      </span>
      <span className="fallback-reason">
        {step.reason}
      </span>
    </div>
  )
}

// ─── Spinner dot (pending) ────────────────────────────────────────────────────

function SpinnerDot() {
  return (
    <span className="spinner-dot" />
  )
}

// ─── Search status row ────────────────────────────────────────────────────────

function SearchStatusRow({ step }: { step: Extract<AgentStep, { kind: 'search_status' }> }) {
  const { phase, provider, query, message, resultCount, durationMs } = step

  const isLive = phase === 'searching' || phase === 'fallback'
  const isFailed = phase === 'all_failed' || phase === 'no_results'
  const isDone = phase === 'complete'

  return (
    <div
      className="search-row"
      style={{
        background: isDone ? 'rgba(52,211,153,0.03)' : isFailed ? 'rgba(239,68,68,0.03)' : 'rgba(255,255,255,0.015)',
        border: `1px solid ${isFailed ? 'rgba(239,68,68,0.1)' : isDone ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.055)'}`,
      }}
    >
      <span className="status-dot">
        {isLive ? (
          <SpinnerDot />
        ) : (
          <Pxi name={isFailed ? 'times-circle' : 'check-circle'} size={12} style={{ color: isFailed ? '#f87171' : isDone ? '#34d399' : 'var(--amber)' }} />
        )}
      </span>

      <Pxi name="search" size={11} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />

      <span className="search-label">
        {message}
      </span>

      {/* Metadata pills */}
      <div className="meta-pills">
        {query && (
          <span className="meta-pill meta-pill-query">
            &ldquo;{query}&rdquo;
          </span>
        )}
        {provider && provider !== 'none' && (
          <span className="meta-pill">
            {provider}
          </span>
        )}
        {isDone && resultCount != null && (
          <span className="meta-pill-success">
            {resultCount} results
          </span>
        )}
        {isDone && durationMs != null && (
          <span className="meta-pill">
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
    <div
      className="browser-row"
      style={{ border: `1px solid ${isError ? 'rgba(239,68,68,0.12)' : phase === 'done' ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)'}` }}
    >
      <span className="status-dot">
        {phase === 'start' ? (
          <SpinnerDot />
        ) : (
          <Pxi name={isError ? 'times-circle' : 'check-circle'} size={12} style={{ color: isError ? '#f87171' : '#34d399' }} />
        )}
      </span>
      <Pxi name="browser" size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
      <span className="browser-label" style={{ color: isError ? '#f87171' : 'var(--tx-secondary)' }}>
        {label}
      </span>
      {subtitle && (
        <span className="browser-subtitle" title={subtitle}>
          {subtitle}
        </span>
      )}
    </div>
  )
}

// ─── Strike row ───────────────────────────────────────────────────────────────

function StrikeRow({ step }: { step: Extract<AgentStep, { kind: 'strike_escalation' }> }) {
  return (
    <div className="strike-row">
      <Pxi name="exclamation-triangle" size={14} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p className="strike-title">
          Repeated error on{' '}
          <code className="strike-code">
            {step.tool}
          </code>
        </p>
        {step.attempts.map((a, i) => (
          <p key={i} className="strike-attempt">
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
    <div
      className="verify-row"
      style={{
        background: passed ? 'rgba(52,211,153,0.04)' : 'rgba(239,68,68,0.04)',
        border: passed ? '1px solid rgba(52,211,153,0.12)' : '1px solid rgba(239,68,68,0.12)',
      }}
    >
      <span className="status-dot">
        <Pxi
          name={passed ? 'shield-check' : 'shield-x'}
          size={12}
          style={{ color: passed ? '#34d399' : '#f87171' }}
        />
      </span>

      <Pxi name={passed ? 'check-circle' : 'x-circle'} size={12} style={{ color: passed ? '#34d399' : '#f87171', flexShrink: 0 }} />

      <span className="verify-label" style={{ color: passed ? '#34d399' : '#f87171' }}>
        Verification {passed ? 'passed' : 'failed'}
      </span>

      {step.error && (
        <span className="verify-error">
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
    case 'edit_file':
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
    case 'patch_file':
    case 'edit_file':          return 'edit'
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
    case 'patch_file':
    case 'edit_file':          return 'oklch(73% 0.17 55)'
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
// eslint-disable-next-line react-refresh/only-export-components
export { formatToolActionLabel }
