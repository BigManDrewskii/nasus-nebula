import { useState, useEffect, useMemo } from 'react'
import { NasusLogo } from './NasusLogo'

interface ThinkingIndicatorProps {
  /** Show or hide the indicator — drives the mount/unmount animation */
  visible: boolean
}

export function ThinkingIndicator({ visible }: ThinkingIndicatorProps) {
  // Track how long we've been in the thinking state so we can upgrade the label
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
    if (elapsed > 8000) return 'Still working on this…'
    if (elapsed > 5000) return 'Analyzing the problem…'
    if (elapsed > 3000) return 'Planning approach…'
    return 'Thinking…'
  }, [elapsed])

  if (!visible) return null

  return (
    <div
      className="thinking-indicator"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {/* Avatar */}
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
          border: '1px solid oklch(64% 0.214 40.1 / 0.28)',
          boxShadow: '0 2px 8px oklch(64% 0.214 40.1 / 0.12)',
        }}
      >
        <NasusLogo size={16} fill="var(--amber)" />
      </div>

      {/* Pill */}
      <div className="thinking-pill">
        {/* Bouncing dots */}
        <div className="thinking-dots" aria-hidden="true">
          <span className="thinking-dot" style={{ animationDelay: '0s' }} />
          <span className="thinking-dot" style={{ animationDelay: '0.16s' }} />
          <span className="thinking-dot" style={{ animationDelay: '0.32s' }} />
        </div>

        {/* Shimmer label */}
        <span className="thinking-label">{label}</span>
      </div>
    </div>
  )
}
