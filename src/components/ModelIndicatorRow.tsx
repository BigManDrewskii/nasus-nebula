/**
 * Compact model indicator row for sidebar footer.
 * Shows provider · model with a health dot. Clicking opens model settings.
 */

import { useAppStore } from '../store'
import { Pxi } from './Pxi'

export function ModelIndicatorRow() {
  const provider      = useAppStore((s) => s.provider)
  const model         = useAppStore((s) => s.model)
  const routerConfig  = useAppStore((s) => s.routerConfig)
  const gatewayHealth = useAppStore((s) => s.gatewayHealth)
  const openSettings  = useAppStore((s) => s.openSettings)

  const isFree = routerConfig.budget === 'free'

  const healthStatus = gatewayHealth.find((h) => h.gatewayId === provider)?.status ?? 'unknown'
  const healthColor  = {
    healthy: '#22c55e',
    degraded: '#f59e0b',
    down: '#f87171',
    unknown: 'rgba(255,255,255,0.2)',
  }[healthStatus]

  // Strip org prefix (e.g. "deepseek/deepseek-r1" → "deepseek-r1")
  const shortModel = (model.includes('/') ? model.split('/').pop()! : model)
  const displayModel = shortModel.length > 20 ? shortModel.slice(0, 18) + '…' : shortModel

  const providerLabel =
    provider === 'ollama'  ? 'Local'      :
    provider === 'vercel'  ? 'Vercel'     :
                             'OpenRouter'

  return (
    <button
      onClick={() => openSettings('model')}
      title="Change model"
      className="model-indicator-row"
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 9px',
        borderRadius: 6,
        background: 'transparent',
        border: '1px solid transparent',
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s',
        textAlign: 'left',
      }}
    >
      {/* Health dot */}
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: healthColor,
          boxShadow: healthStatus === 'healthy' ? `0 0 5px ${healthColor}90` : undefined,
        }}
      />

      {/* Provider */}
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 500,
          color: 'var(--tx-tertiary)',
          fontFamily: 'var(--font-mono)',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {providerLabel}
      </span>

      {/* Divider */}
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>·</span>

      {/* Model name */}
      <span
        style={{
          flex: 1,
          fontSize: 10.5,
          fontWeight: 500,
          fontFamily: 'var(--font-mono)',
          color: 'var(--tx-secondary)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {displayModel}
      </span>

      {/* Free / Paid pill — only meaningful indicator */}
      <span
        style={{
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: '0.04em',
          padding: '1px 4px',
          borderRadius: 3,
          flexShrink: 0,
          color:      isFree ? '#22c55e'                 : 'oklch(64% 0.214 40.1)',
          background: isFree ? 'rgba(34,197,94,0.1)'    : 'oklch(64% 0.214 40.1 / 0.1)',
          border:    `1px solid ${isFree ? 'rgba(34,197,94,0.18)' : 'oklch(64% 0.214 40.1 / 0.18)'}`,
        }}
      >
        {isFree ? 'free' : 'paid'}
      </span>

      <Pxi name="chevron-right" size={9} style={{ flexShrink: 0, color: 'var(--tx-muted)', opacity: 0.5 }} />
    </button>
  )
}
