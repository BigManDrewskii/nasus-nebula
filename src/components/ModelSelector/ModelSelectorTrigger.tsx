/**
 * ModelSelectorTrigger — Compact pill button for chat input area.
 *
 * Displays the current model in a truncated form (e.g., "claude-3.7")
 * with a dropdown chevron. Clicking opens the ModelSelector popover.
 *
 * Also responds to 'nasus:open-model-selector' custom event for
 * global keyboard shortcut (⌘M / Ctrl+M).
 */

import { useRef, useState, useMemo, useEffect } from 'react'
import { useAppStore } from '../../store'
import { ModelSelector } from './ModelSelector'

export function ModelSelectorTrigger() {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  // Listen for global keyboard shortcut event
  useEffect(() => {
    const handleOpenModelSelector = () => {
      setOpen(true)
      triggerRef.current?.focus()
    }

    window.addEventListener('nasus:open-model-selector', handleOpenModelSelector)
    return () => {
      window.removeEventListener('nasus:open-model-selector', handleOpenModelSelector)
    }
  }, [])

  const model = useAppStore((s) => s.model)

  // Shorten model name for display
  const shortName = useMemo(() => {
    // Remove provider prefix
    let name = model.includes('/') ? model.split('/').pop()! : model

    // Remove date suffix (e.g., -20250514)
    name = name.replace(/-\d{8}$/, '')

    // Remove common suffixes
    name = name.replace(/-preview$/, '')
    name = name.replace(/-instruct$/, '')
    name = name.replace(/-chat$/, '')

    // Truncate if still too long
    if (name.length > 16) {
      name = name.slice(0, 14) + '…'
    }

    return name
  }, [model])

  return (
    <div style={{ position: 'relative' }}>
      {open && (
        <ModelSelector
          anchor={triggerRef}
          position="above"
          onSelect={(modelId) => {
            useAppStore.getState().setModel(modelId)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}

        <button
          ref={triggerRef}
          onClick={() => setOpen(!open)}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            borderRadius: 6,
            background: open ? 'rgba(234,179,8,0.1)' : 'rgba(234,179,8,0.05)',
            border: open ? '1px solid rgba(234,179,8,0.28)' : '1px solid rgba(234,179,8,0.14)',
            cursor: 'pointer',
            transition: 'background 0.12s ease, border-color 0.12s ease',
          }}
          onMouseEnter={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'rgba(234,179,8,0.08)'
              e.currentTarget.style.borderColor = 'rgba(234,179,8,0.22)'
            }
          }}
          onMouseLeave={(e) => {
            if (!open) {
              e.currentTarget.style.background = 'rgba(234,179,8,0.05)'
              e.currentTarget.style.borderColor = 'rgba(234,179,8,0.14)'
            }
          }}
          title={model}
        >
          <span
            style={{
              fontSize: 10.5,
              fontFamily: 'var(--font-mono)',
              color: open ? 'var(--amber)' : 'rgba(234,179,8,0.85)',
              maxWidth: 100,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '-0.01em',
            }}
          >
            {shortName}
          </span>
          <svg
            width="7"
            height="7"
            viewBox="0 0 8 8"
            style={{
              flexShrink: 0,
              color: open ? 'var(--amber)' : 'rgba(234,179,8,0.6)',
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.14s ease',
            }}
          >
            <path
              d="M1 3l3 3 3-3"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
    </div>
  )
}
