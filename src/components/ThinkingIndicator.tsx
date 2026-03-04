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
}

export function ThinkingIndicator({ visible, activeModel }: ThinkingIndicatorProps) {
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
    if (elapsed > 12000) return 'Almost there…'
    if (elapsed > 8000) return 'Refining response…'
    if (elapsed > 5000) return 'Analyzing patterns…'
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
      style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}
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
          marginTop: 2,
        }}
      >
        <NasusLogo size={16} fill="var(--amber)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Pill */}
        <div className="thinking-pill" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '4px 10px', borderRadius: 12 }}>
          {/* Bouncing dots */}
          <div className="thinking-dots" aria-hidden="true" style={{ display: 'flex', gap: 3 }}>
            {[0, 0.16, 0.32].map((d) => (
              <span key={d} className="thinking-dot" style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)', animation: `thinking-bounce 1.4s ease-in-out ${d}s infinite` }} />
            ))}
          </div>

          {/* Shimmer label */}
          <span className="thinking-label" style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx-secondary)', opacity: 0.8 }}>{label}</span>

          {activeModel && (
            <>
              <div style={{ width: 1, height: 10, background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontWeight: 600, letterSpacing: '0.02em' }}>
                  {activeModel.displayName}
                </span>
                <span style={{ fontSize: 9, color: 'var(--tx-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeModel.provider}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Skeleton lines — appearing shortly after "Thinking" starts */}
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 500 }}>
          <div className="skeleton-line" style={{ width: '85%', height: 10, borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear' }} />
          <div className="skeleton-line" style={{ width: '60%', height: 10, borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear', animationDelay: '0.2s' }} />
          {elapsed > 2000 && (
            <div className="skeleton-line" style={{ width: '75%', height: 10, borderRadius: 4, background: 'linear-gradient(90deg, rgba(255,255,255,0.03) 25%, rgba(255,255,255,0.06) 50%, rgba(255,255,255,0.03) 75%)', backgroundSize: '200% 100%', animation: 'shimmer 2s infinite linear', animationDelay: '0.4s' }} />
          )}
        </div>
      </div>
    </div>
  )
}
