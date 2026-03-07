import { useState, useEffect, useMemo } from 'react'
import { NasusLogo } from './NasusLogo'

interface ThinkingIndicatorProps {
  /** Show or hide the indicator — drives the mount/unmount animation */
  visible: boolean
  /** Optional model/provider info to show what's currently working */
  activeModel?: {
    id: string
    displayName: string
    provider: string
  } | null
  /** Current tool being invoked — shows a contextual label when set */
  currentTool?: string | null
}

export function ThinkingIndicator({ visible, activeModel, currentTool }: ThinkingIndicatorProps) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!visible) {
      setElapsed(0)
      return
    }
    const start = Date.now()
    const id = setInterval(() => setElapsed(Date.now() - start), 500)
    return () => clearInterval(id)
  }, [visible])

  const label = useMemo(() => {
    if (currentTool) {
      const toolLabels: Record<string, string> = {
        search_web: 'Searching the web…',
        http_fetch: 'Fetching page…',
        write_file: 'Writing file…',
        read_file: 'Reading file…',
        bash_execute: 'Running in sandbox…',
        bash: 'Running command…',
        python_execute: 'Running Python…',
        browser_navigate: 'Navigating browser…',
        browser_extract: 'Extracting content…',
        patch_file: 'Editing file…',
        list_files: 'Listing files…',
      }
      return toolLabels[currentTool] || `Using ${currentTool}…`
    }
    if (elapsed > 12000) return 'Almost there…'
    if (elapsed > 8000) return 'Refining response…'
    if (elapsed > 5000) return 'Working on it…'
    if (elapsed > 3000) return 'Planning approach…'
    return 'Thinking…'
  }, [elapsed, currentTool])

  if (!visible) return null

  return (
    <div
      className="thinking-indicator"
      role="status"
      aria-live="polite"
      aria-label={label}
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
    >
      {/* Avatar — stable, no animation */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#111',
          border: '1px solid rgba(234,179,8,0.2)',
          marginTop: 2,
        }}
      >
        <NasusLogo size={15} fill="var(--amber)" />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          padding: '5px 12px',
          borderRadius: 10,
        }}>
          {/* Bouncing dots */}
          <div style={{ display: 'flex', gap: 3 }} aria-hidden="true">
            {[0, 0.16, 0.32].map((d) => (
              <span key={d} style={{
                width: 4, height: 4, borderRadius: '50%',
                background: 'var(--amber)',
                display: 'inline-block',
                animation: `thinkingBounce 1.4s ease-in-out ${d}s infinite`,
              }} />
            ))}
          </div>

          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx-secondary)' }}>
            {label}
          </span>

          {activeModel && (
            <>
              <span style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontWeight: 500 }}>
                {activeModel.displayName}
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
