/**
 * ModelItem — Single model row in the model selector.
 */

import { useMemo } from 'react'
import type { DisplayModel } from './types'

interface ModelItemProps {
  model: DisplayModel
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
}

export function ModelItem({ model, isSelected, isHighlighted, onSelect }: ModelItemProps) {
  const costText = useMemo(() => {
    if (model.isFree) return 'Free'
    if (model.inputCost === 0 && model.outputCost === 0) return 'Free'
    if (model.inputCost === model.outputCost) {
      return `$${model.inputCost.toFixed(2)}/1M`
    }
    return `$${model.inputCost.toFixed(2)}/$${model.outputCost.toFixed(2)}`
  }, [model])

  const formatContext = (tokens: number): string => {
    if (tokens >= 1_000_000) return `${(tokens / 1_000_000).toFixed(1)}M`
    if (tokens >= 1_000) return `${(tokens / 1_000).toFixed(0)}k`
    return `${tokens}`
  }

  const displayName = model.id.includes('/')
    ? model.id.split('/').pop()!
    : model.id

  return (
    <div
      onClick={onSelect}
      className="model-item-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 6,
        cursor: 'pointer',
        background: isSelected
          ? 'oklch(64% 0.214 40.1 / 0.1)'
          : isHighlighted
            ? 'rgba(255, 255, 255, 0.04)'
            : 'transparent',
        borderLeft: isSelected ? '2px solid oklch(64% 0.214 40.1)' : '2px solid transparent',
        transition: 'background 0.1s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              color: isSelected ? 'var(--tx-primary)' : 'var(--tx-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={model.name}
          >
            {model.name}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 'var(--text-xs)', marginTop: 1 }}>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-tertiary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
            title={model.id}
          >
            {displayName}
          </span>
          <span style={{ color: 'var(--tx-muted)', flexShrink: 0 }}>
            {formatContext(model.contextWindow)}
          </span>
          <span
            style={{
              color: model.isFree ? '#22c55e' : 'var(--tx-tertiary)',
              flexShrink: 0,
              marginLeft: 'auto',
            }}
          >
            {costText}
          </span>
        </div>
      </div>

      {isSelected && (
        <svg
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          style={{ flexShrink: 0, color: 'oklch(64% 0.214 40.1)' }}
        >
          <circle cx="6" cy="6" r="5" fill="currentColor" fillOpacity="0.2" />
          <path
            d="M4 6l1.5 1.5L8 5"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </div>
  )
}
