/**
 * Compact model indicator row for sidebar footer.
 * Displays current provider, model, and budget mode.
 * Clicking opens the Settings modal on the Model tab.
 */

import { useAppStore } from '../store'

export function ModelIndicatorRow() {
  const provider = useAppStore((s) => s.provider)
  const model = useAppStore((s) => s.model)
  const routerConfig = useAppStore((s) => s.routerConfig)
  const gatewayHealth = useAppStore((s) => s.gatewayHealth)
  const openSettings = useAppStore((s) => s.openSettings)

  const isFree = routerConfig.budget === 'free'

  // Get health status for current provider
  const healthStatus = gatewayHealth.find((h) => h.gatewayId === provider)?.status ?? 'unknown'

  const healthColor = {
    healthy: '#22c55e',
    degraded: '#fbbf24',
    down: '#f87171',
    unknown: 'var(--tx-muted)',
  }[healthStatus]

  // Truncate model name if too long
  const displayName = model.includes('/')
    ? model.split('/').pop() ?? model
    : model
  const displayModel = displayName.length > 18 ? displayName.slice(0, 16) + '…' : displayName

  const providerLabel = provider === 'ollama' ? 'Local' : provider === 'vercel' ? 'Vercel AI' : 'OpenRouter'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => openSettings('model')}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          borderRadius: 7,
          background: 'rgba(255, 255, 255, 0.025)',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          cursor: 'pointer',
          transition: 'background 0.12s ease, border-color 0.12s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)'
          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
        }}
        title="Open model settings"
      >
        {/* Health dot */}
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: healthColor,
            boxShadow: healthStatus === 'healthy' ? `0 0 4px ${healthColor}80` : undefined,
          }}
        />

        {/* Provider + Model */}
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 500,
            fontFamily: 'var(--font-mono)',
            color: 'var(--tx-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            textAlign: 'left',
          }}
        >
          {providerLabel} · {displayModel}
        </span>

        {/* Budget badge */}
        <span
          style={{
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            padding: '2px 5px',
            borderRadius: 4,
            background: isFree ? 'rgba(34, 197, 94, 0.12)' : 'oklch(64% 0.214 40.1 / 0.12)',
            color: isFree ? '#22c55e' : 'oklch(64% 0.214 40.1)',
            border: `1px solid ${isFree ? 'rgba(34, 197, 94, 0.2)' : 'oklch(64% 0.214 40.1 / 0.2)'}`,
            flexShrink: 0,
          }}
        >
          {isFree ? 'Free' : 'Paid'}
        </span>

        {/* Settings gear icon */}
        <svg
          width="11"
          height="11"
          viewBox="0 0 11 11"
          fill="none"
          style={{
            flexShrink: 0,
            color: 'var(--tx-tertiary)',
          }}
        >
          <path
            d="M5.5 1.5a1.5 1.5 0 0 1 1.5 1.5H4a1.5 1.5 0 0 1 1.5-1.5zm0 8a1.5 1.5 0 0 1-1.5-1.5h3a1.5 1.5 0 0 1 1.5 1.5zm4-4h-8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </button>
    </div>
  )
}
