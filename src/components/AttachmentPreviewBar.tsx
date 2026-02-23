/**
 * AttachmentPreviewBar — renders the queued attachment chips above the input area.
 */

import type { Attachment, AttachmentCategory } from '../types'
import { formatBytes } from '../hooks/useAttachments'
import { Pxi } from './Pxi'

// ── Category icon + color ─────────────────────────────────────────────────────

function categoryIcon(cat: AttachmentCategory): { icon: string; color: string } {
  switch (cat) {
    case 'image':       return { icon: 'image',          color: '#60a5fa' }
    case 'document':    return { icon: 'file-alt',       color: '#a78bfa' }
    case 'spreadsheet': return { icon: 'table',          color: '#34d399' }
    case 'code':        return { icon: 'code',           color: 'var(--amber-soft)' }
    case 'archive':     return { icon: 'file-archive',   color: '#fb923c' }
    default:            return { icon: 'file',           color: 'var(--tx-tertiary)' }
  }
}

// ── Language tag for code files ────────────────────────────────────────────────

function langTag(name: string): string | null {
  const ext = name.slice(name.lastIndexOf('.') + 1).toUpperCase()
  const known = ['JS', 'TS', 'TSX', 'JSX', 'PY', 'HTML', 'CSS', 'JSON', 'YAML', 'YML', 'GO', 'RS', 'RB', 'PHP', 'JAVA', 'CPP', 'C', 'SWIFT', 'MD']
  return known.includes(ext) ? ext : null
}

// ── Individual chip ────────────────────────────────────────────────────────────

interface ChipProps {
  attachment: Attachment
  onRemove: (id: string) => void
}

function AttachmentChip({ attachment, onRemove }: ChipProps) {
  const { id, name, size, category, status, previewUrl, error } = attachment
  const isError = status === 'error'
  const { icon, color } = categoryIcon(category)
  const tag = category === 'code' ? langTag(name) : null

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 8px',
        borderRadius: 10,
        background: isError ? 'rgba(239,68,68,0.07)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isError ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`,
        maxWidth: 180,
        minWidth: 0,
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Thumbnail (images only) */}
      {category === 'image' && previewUrl ? (
        <img
          src={previewUrl}
          alt={name}
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            objectFit: 'cover',
            flexShrink: 0,
            background: 'rgba(255,255,255,0.06)',
          }}
        />
      ) : (
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(255,255,255,0.04)',
            flexShrink: 0,
          }}
        >
          <Pxi name={isError ? 'exclamation-triangle' : icon} size={14} style={{ color: isError ? '#f87171' : color }} />
        </div>
      )}

      {/* Name + size / error */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <span
            style={{
              fontSize: 11,
              fontWeight: 500,
              color: isError ? '#fca5a5' : 'var(--tx-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: 90,
            }}
          >
            {name}
          </span>
          {tag && (
            <span
              style={{
                fontSize: 9,
                fontFamily: 'var(--font-mono)',
                color: 'var(--amber-soft)',
                background: 'rgba(234,179,8,0.1)',
                border: '1px solid rgba(234,179,8,0.18)',
                borderRadius: 3,
                padding: '1px 4px',
                flexShrink: 0,
              }}
            >
              {tag}
            </span>
          )}
        </div>
        <span style={{ fontSize: 10, color: isError ? '#f87171' : 'var(--tx-tertiary)' }}>
          {isError ? error : formatBytes(size)}
        </span>
      </div>

      {/* Remove button */}
      <button
        onClick={() => onRemove(id)}
        aria-label={`Remove ${name}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 16,
          height: 16,
          borderRadius: 4,
          border: 'none',
          background: 'transparent',
          color: 'var(--tx-tertiary)',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
          transition: 'color 0.12s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171' }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
      >
        <Pxi name="times" size={9} />
      </button>
    </div>
  )
}

// ── Bar ────────────────────────────────────────────────────────────────────────

interface AttachmentPreviewBarProps {
  attachments: Attachment[]
  onRemove: (id: string) => void
  onAddMore: () => void
  isOverLimit: boolean
  totalSize: number
}

export function AttachmentPreviewBar({
  attachments,
  onRemove,
  onAddMore,
  isOverLimit,
  totalSize,
}: AttachmentPreviewBarProps) {
  if (attachments.length === 0) return null

  return (
    <div
      style={{ padding: '10px 14px 0' }}
      role="list"
      aria-label="Queued attachments"
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        {attachments.map((att) => (
          <div key={att.id} role="listitem">
            <AttachmentChip attachment={att} onRemove={onRemove} />
          </div>
        ))}

        {/* Add more button — only if under the limit */}
        {attachments.length < 10 && (
          <button
            onClick={onAddMore}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px dashed rgba(255,255,255,0.12)',
              background: 'transparent',
              color: 'var(--tx-tertiary)',
              fontSize: 11,
              cursor: 'pointer',
              transition: 'border-color 0.12s, color 0.12s',
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.25)'
              e.currentTarget.style.color = 'var(--tx-secondary)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
              e.currentTarget.style.color = 'var(--tx-tertiary)'
            }}
          >
            <Pxi name="plus" size={9} />
            Add
          </button>
        )}
      </div>

      {/* Over-limit warning */}
      {isOverLimit && (
        <p style={{ fontSize: 10, color: '#f87171', marginTop: 6 }}>
          Total size ({formatBytes(totalSize)}) exceeds 50 MB — remove some files before sending.
        </p>
      )}
    </div>
  )
}
