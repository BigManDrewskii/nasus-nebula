import { useState, useEffect, useMemo } from 'react'
import { NasusLogo } from './NasusLogo'

interface ThinkingIndicatorProps {
  visible: boolean
  activeModel?: { id: string; displayName: string; provider: string } | null
  currentTool?: string | null
  currentPhaseName?: string
}

export function ThinkingIndicator({ visible, activeModel, currentTool, currentPhaseName }: ThinkingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0)
  const [dotPhase, setDotPhase] = useState(0)

  useEffect(() => {
    if (!visible) { setElapsed(0); return }
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 400)
    return () => clearInterval(id)
  }, [visible])

  // Rotate dot phase 0→1→2→0 for manual CSS-less animation
  useEffect(() => {
    if (!visible) return
    const id = setInterval(() => setDotPhase(p => (p + 1) % 3), 500)
    return () => clearInterval(id)
  }, [visible])

  const label = useMemo(() => {
    if (currentTool) {
      const toolLabels: Record<string, string> = {
        search_web:       'Searching…',
        http_fetch:       'Fetching page…',
        write_file:       'Writing file…',
        read_file:        'Reading file…',
        bash_execute:     'Running…',
        bash:             'Running…',
        python_execute:   'Running Python…',
        browser_navigate: 'Navigating…',
        browser_extract:  'Extracting…',
        patch_file:       'Editing file…',
        list_files:       'Listing files…',
      }
      return toolLabels[currentTool] || `Using ${currentTool}…`
    }
    if (currentPhaseName) return currentPhaseName
    if (elapsed > 12000) return 'Almost there…'
    if (elapsed > 8000)  return 'Refining…'
    if (elapsed > 5000)  return 'Working on it…'
    if (elapsed > 3000)  return 'Planning…'
    return 'Thinking…'
  }, [elapsed, currentTool, currentPhaseName])

  if (!visible) return null

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        animation: 'fadeInUp 0.22s cubic-bezier(0.22,1,0.36,1) forwards',
      }}
    >
      {/* Avatar */}
      <div style={{
        width: 26, height: 26,
        borderRadius: 7,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#111',
        border: '1px solid rgba(234,179,8,0.18)',
        marginTop: 1,
      }}>
        <NasusLogo size={13} fill="var(--amber)" />
      </div>

      {/* Pill */}
      <div style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        paddingTop: 3,
      }}>
        {/* Three dots — manual animation via dotPhase */}
        <div style={{ display: 'flex', gap: 3 }} aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span key={i} style={{
              width: 3, height: 3,
              borderRadius: '50%',
              display: 'block',
              background: i === dotPhase ? 'var(--amber)' : 'rgba(234,179,8,0.25)',
              transition: 'background 0.2s',
              flexShrink: 0,
            }} />
          ))}
        </div>

        <span style={{
          fontSize: 'var(--text-sm)',
          color: 'var(--tx-secondary)',
          fontWeight: 400,
          letterSpacing: '-0.005em',
        }}>
          {label}
        </span>

        {activeModel && (
          <span style={{
            fontSize: 'var(--text-xs)',
            color: 'var(--tx-muted)',
            fontFamily: 'var(--font-mono)',
            paddingLeft: 4,
            borderLeft: '1px solid rgba(255,255,255,0.07)',
          }}>
            {activeModel.displayName}
          </span>
        )}
      </div>
    </div>
  )
}
