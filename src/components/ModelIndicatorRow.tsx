/**
 * Compact model indicator row for sidebar footer.
 * Displays current provider, model, and budget mode.
 * Clicking opens the ModelSelector popover for quick model switching.
 */

import { useRef, useState } from 'react'
import { useAppStore } from '../store'
import { ModelSelector } from './ModelSelector/ModelSelector'

export function ModelIndicatorRow() {
  const [selectorOpen, setSelectorOpen] = useState(false)
  const rowRef = useRef<HTMLButtonElement>(null)

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
    <div className="relative" style={{ position: 'relative' }}>
      {/* Popover — positioned above the row */}
      {selectorOpen && (
        <ModelSelector
          anchor={rowRef}
          position="above"
          onSelect={(modelId) => {
            useAppStore.getState().setModel(modelId)
            setSelectorOpen(false)
          }}
          onClose={() => setSelectorOpen(false)}
        />
      )}

      <button
        ref={rowRef}
        onClick={() => setSelectorOpen(!selectorOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '7px 10px',
          borderRadius: 7,
          background: selectorOpen ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.025)',
          border: selectorOpen ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(255, 255, 255, 0.05)',
          cursor: 'pointer',
          transition: 'background 0.12s ease, border-color 0.12s ease',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          if (!selectorOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)'
          }
        }}
        onMouseLeave={(e) => {
          if (!selectorOpen) {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.025)'
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.05)'
          }
        }}
        title="Click to change model"
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
            color: selectorOpen ? 'var(--tx-primary)' : 'var(--tx-secondary)',
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

        {/* Dropdown indicator */}
        <svg
          width="9"
          height="9"
          viewBox="0 0 9 9"
          style={{
            flexShrink: 0,
            color: selectorOpen ? 'var(--tx-secondary)' : 'var(--tx-tertiary)',
            transform: selectorOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.14s ease',
          }}
        >
          <path
            d="M2 3.5l2.5 2.5 2.5-2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Settings button — separate from model selector */}
      <button
        onClick={() => openSettings('model')}
        style={{
          position: 'absolute',
          right: -28,
          top: '50%',
          transform: 'translateY(-50%)',
          width: 22,
          height: 22,
          borderRadius: 5,
          border: 'none',
          background: 'transparent',
          color: 'var(--tx-tertiary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: 0,
          transition: 'opacity 0.12s ease, color 0.12s ease',
        }}
        className="model-settings-btn"
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = '1'
          e.currentTarget.style.color = 'var(--tx-secondary)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.opacity = '0'
          e.currentTarget.style.color = 'var(--tx-tertiary)'
        }}
        title="Open model settings"
      >
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path
            d="M5.5 1.5a1.5 1.5 0 0 1 1.5 1.5H4a1.5 1.5 0 0 1 1.5-1.5zm0 8a1.5 1.5 0 0 1-1.5-1.5h3a1.5 1.5 0 0 1-1.5 1.5zm4-4h-8"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
          />
        </svg>
      </button>

      {/* Show settings button on hover of parent */}
      <style>{`
        .model-settings-btn { display: none; }
      `}</style>
    </div>
  )
}
