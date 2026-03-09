import { useState } from 'react'
import { Pxi } from './Pxi'

interface ExpandableOutputProps {
  output: string
  maxHeight?: number
  isError?: boolean
  fileName?: string
}

export function ExpandableOutput({ output, maxHeight = 200, isError = false, fileName }: ExpandableOutputProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = output.length > 1000

  // Format byte size for display
  function formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
  }

  return (
    <div style={{
      borderRadius: 6,
      overflow: 'hidden',
      border: `1px solid ${isError ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.08)'}`,
    }}>
      {/* Header bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 10px',
        background: isError ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
        borderBottom: `1px solid ${isError ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.05)'}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Pxi name={isError ? 'alert-circle' : 'file-text'} size={14} style={{ color: isError ? '#f87171' : 'var(--tx-tertiary)' }} />
          {fileName && (
            <span style={{
              fontSize: 'var(--text-xs)',
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-secondary)',
              maxWidth: 150,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {fileName}
            </span>
          )}
          <span style={{ fontSize: 'var(--text-2xs)', color: 'var(--tx-tertiary)' }}>
            {formatBytes(output.length)}
          </span>
        </div>

        {isLong && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--amber)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: 4,
            }}
              className="hover-bg-amber-soft"
            >
            Show all
          </button>
        )}
      </div>

      {/* Content */}
      <pre style={{
        margin: 0,
        padding: '10px 12px',
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-mono)',
        lineHeight: 1.5,
        color: isError ? '#fca5a5' : 'var(--tx-secondary)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        maxHeight: expanded ? 'none' : maxHeight,
        overflow: expanded ? 'auto' : 'hidden',
        background: isError ? 'rgba(239,68,68,0.02)' : 'transparent',
      }}>
        {output || '(empty)'}
      </pre>

      {/* Fade overlay */}
      {isLong && !expanded && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: 50,
          background: 'linear-gradient(to bottom, transparent, var(--bg-primary, #0d0d0d))',
          pointerEvents: 'none',
        }} />
      )}

      {/* Footer when expanded */}
      {expanded && (
        <div style={{
          padding: '6px 10px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          justifyContent: 'flex-end',
        }}>
          <button
            onClick={() => setExpanded(false)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--tx-tertiary)',
              fontSize: 'var(--text-xs)',
              cursor: 'pointer',
              padding: '3px 10px',
              borderRadius: 4,
            }}
              className="hover-text-secondary"
            >
            <Pxi name="chevron-up" size={10} /> Collapse
          </button>
        </div>
      )}
    </div>
  )
}
