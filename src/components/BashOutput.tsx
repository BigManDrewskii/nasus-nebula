import { useState } from 'react'
import { Pxi } from './Pxi'

interface BashOutputProps {
  output: string
  command?: string
  exitCode?: number | null
  maxHeight?: number
}

export function BashOutput({ output, command, exitCode, maxHeight = 300 }: BashOutputProps) {
  const [expanded, setExpanded] = useState(false)
  const lines = output.split('\n')
  const isLong = output.length > 1000 || lines.length > 10

  return (
    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>
      {/* Command bar */}
      {command && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          background: 'rgba(0,0,0,0.4)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px 6px 0 0',
        }}>
          <span style={{ color: 'var(--amber)', fontSize: 10 }}>$</span>
          <span style={{
            color: 'var(--tx-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {command}
          </span>
        </div>
      )}

      {/* Output */}
      <div style={{
        background: 'rgba(0,0,0,0.3)',
        borderRadius: command ? '0 0 6px 6px' : 6,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        <pre style={{
          margin: 0,
          padding: '10px 12px',
          color: 'var(--tx-secondary)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          lineHeight: 1.5,
          maxHeight: expanded ? 'none' : maxHeight,
          overflow: expanded ? 'auto' : 'hidden',
          position: 'relative',
        }}>
          {output || '(no output)'}
        </pre>

        {/* Fade overlay for truncated output */}
        {isLong && !expanded && (
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 40,
            background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.8))',
            pointerEvents: 'none',
          }} />
        )}
      </div>

      {/* Expand button and exit status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 4,
        padding: '0 4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {exitCode !== undefined && (
            <span style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              padding: '1px 5px',
              borderRadius: 4,
              background: exitCode === 0 ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
              color: exitCode === 0 ? '#34d399' : '#f87171',
            }}>
              exit {exitCode}
            </span>
          )}
          <span style={{ fontSize: 10, color: 'var(--tx-tertiary)' }}>
            {lines.length} line{lines.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--tx-tertiary)',
              fontSize: 10,
              cursor: 'pointer',
              padding: '2px 6px',
              borderRadius: 4,
            }}
              className="hover-text-secondary"
            >
            {expanded ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Pxi name="chevron-up" size={8} /> Show less
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <Pxi name="chevron-down" size={8} /> Show full output
              </span>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
