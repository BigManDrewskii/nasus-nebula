/**
 * ModelList — Scrollable, filterable, grouped list of models.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useAppStore } from '../../store'
import { getModelsForGateway } from '../../agent/gateway/modelRegistry'
import type { GatewayType } from '../../agent/gateway/gatewayTypes'
import { ModelItem } from './ModelItem'
import type { DisplayModel } from './types'
import { Pxi } from '../Pxi'

interface ModelListProps {
  currentModelId: string
  currentProvider: string
  routingMode: 'auto-free' | 'auto-paid' | 'manual'
  onSelect: (modelId: string) => void
  onClose: () => void
}

export function ModelList({
  currentModelId,
  currentProvider,
  routingMode,
  onSelect,
  onClose,
}: ModelListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const openRouterModels = useAppStore((s) => s.openRouterModels)
  const ollamaModels = useAppStore((s) => s.ollamaModels)

  // Resolve actual gateway type from provider label
  const gatewayType: GatewayType = useMemo(() => {
    const normalized = currentProvider.toLowerCase()
    if (normalized.includes('ollama') || normalized.includes('local')) return 'ollama'
    return 'openrouter'
  }, [currentProvider])

    // Build display models by merging registry with live data
    const displayModels = useMemo((): DisplayModel[] => {
      const registryModels = getModelsForGateway(gatewayType)

      // For OpenRouter, use all live models
      if (gatewayType === 'openrouter' && openRouterModels.length > 0) {
        return openRouterModels.map((m) => {
          // Try to find matching registry model for tier
          const registryModel = registryModels.find((r) => r.ids.openrouter === m.id)

          const promptPrice = parseFloat(m.pricing?.prompt ?? '0')
          const completionPrice = parseFloat(m.pricing?.completion ?? '0')

          return {
            id: m.id,
            name: m.name || m.id.split('/').pop() || m.id,
            provider: 'openrouter',
            tier: registryModel?.tier ?? 'general',
            contextWindow: m.context_length ?? registryModel?.contextWindow ?? 128000,
            isFree: promptPrice === 0,
            inputCost: promptPrice * 1_000_000,
            outputCost: completionPrice * 1_000_000,
            isAvailable: true,
          }
        })
      }

      // For Ollama, use the fetched models list
      if (gatewayType === 'ollama' && ollamaModels.length > 0) {
        return ollamaModels.map((m) => ({
          id: m.name,
          name: m.name,
          provider: 'ollama',
          tier: 'general',
          contextWindow: 4096, // Ollama doesn't always provide this in the API response
          isFree: true,
          inputCost: 0,
          outputCost: 0,
          isAvailable: true,
        }))
      }

    // For other providers, use registry only
    return registryModels.map((m) => ({
      id: m.ids[gatewayType]!,
      name: m.canonicalName,
      provider: gatewayType,
      tier: m.tier,
      contextWindow: m.contextWindow,
      isFree: m.freeOn[gatewayType] ?? false,
      inputCost: m.inputCostPer1M,
      outputCost: m.outputCostPer1M,
      isAvailable: true,
    }))
  }, [gatewayType, openRouterModels])

  // Filter by search query
  const filteredModels = useMemo(() => {
    if (!searchQuery.trim()) return displayModels

    const query = searchQuery.toLowerCase()
    return displayModels.filter(
      (m) =>
        m.name.toLowerCase().includes(query) ||
        m.id.toLowerCase().includes(query) ||
        m.tier.toLowerCase().includes(query),
    )
  }, [displayModels, searchQuery])

  // Group into free and paid
  const groupedModels = useMemo(() => {
    const free = filteredModels.filter((m) => m.isFree)
    const paid = filteredModels.filter((m) => !m.isFree)

    // Order depends on routing mode
    if (routingMode === 'auto-free') {
      return { free, paid }
    }
    return { paid, free }
  }, [filteredModels, routingMode])

  // Flatten for keyboard navigation
  const flatModels = useMemo(() => {
    const result: Array<{ model: DisplayModel; section: 'free' | 'paid' }> = []
    if (groupedModels.free.length > 0) {
      result.push(...groupedModels.free.map((m) => ({ model: m, section: 'free' as const })))
    }
    if (groupedModels.paid.length > 0) {
      result.push(...groupedModels.paid.map((m) => ({ model: m, section: 'paid' as const })))
    }
    return result
  }, [groupedModels])

  // Reset highlighted index when filtered models change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [searchQuery])

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setHighlightedIndex((i) => Math.min(i + 1, flatModels.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setHighlightedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (flatModels[highlightedIndex]) {
            onSelect(flatModels[highlightedIndex].model.id)
          }
          break
        case 'Escape':
          e.preventDefault()
          onClose()
          break
      }
    },
    [flatModels, highlightedIndex, onSelect, onClose],
  )

  // Scroll highlighted item into view
  useEffect(() => {
    const highlightedElement = itemRefs.current.get(highlightedIndex)
    if (highlightedElement && listRef.current) {
      highlightedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    }
  }, [highlightedIndex])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      }}
      onKeyDown={handleKeyDown}
    >
      {/* Search bar */}
      <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
        <div style={{ position: 'relative' }}>
          <Pxi
            name="search"
            size={11}
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--tx-tertiary)',
              pointerEvents: 'none',
            }}
          />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search models..."
              autoFocus
              className="model-list-input"
              style={{
                width: '100%',
                padding: '6px 10px 6px 30px',
                borderRadius: 6,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                background: '#111',
                color: 'var(--tx-primary)',
                fontSize: 'var(--text-sm)',
                outline: 'none',
              }}
            />
        </div>
      </div>

      {/* Scrollable list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '0 10px 10px',
          minHeight: 0,
        }}
      >
        {flatModels.length === 0 ? (
          <div
            style={{
              padding: '24px 10px',
              textAlign: 'center',
              color: 'var(--tx-tertiary)',
              fontSize: 'var(--text-sm)',
            }}
          >
            {searchQuery ? `No models found for "${searchQuery}"` : 'No models available'}
          </div>
        ) : (
          <>
            {/* Free section */}
            {groupedModels.free.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 0 4px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: '#22c55e',
                  }}
                >
                  <Pxi name="leaf" size={10} />
                  <span>Free</span>
                </div>
                {groupedModels.free.map((model, idx) => {
                  const flatIdx = idx
                  return (
                    <div
                      key={model.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(flatIdx, el)
                      }}
                    >
                      <ModelItem
                        model={model}
                        isSelected={model.id === currentModelId}
                        isHighlighted={flatIdx === highlightedIndex}
                        onSelect={() => onSelect(model.id)}
                      />
                    </div>
                  )
                })}
              </>
            )}

            {/* Paid section */}
            {groupedModels.paid.length > 0 && (
              <>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: groupedModels.free.length > 0 ? '12px 0 4px' : '8px 0 4px',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    color: 'oklch(64% 0.214 40.1)',
                  }}
                >
                  <Pxi name="coins" size={10} />
                  <span>Paid</span>
                </div>
                {groupedModels.paid.map((model, idx) => {
                  const flatIdx = groupedModels.free.length + idx
                  return (
                    <div
                      key={model.id}
                      ref={(el) => {
                        if (el) itemRefs.current.set(flatIdx, el)
                      }}
                    >
                      <ModelItem
                        model={model}
                        isSelected={model.id === currentModelId}
                        isHighlighted={flatIdx === highlightedIndex}
                        onSelect={() => onSelect(model.id)}
                      />
                    </div>
                  )
                })}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
