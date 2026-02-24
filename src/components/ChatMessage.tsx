import { useState, memo, useMemo } from 'react'
import type { Message, MessageAttachment, AttachmentCategory } from '../types'
import { AgentStepsView } from './AgentStepsView'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'
import { formatBytes } from '../hooks/useAttachments'

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, style }: { text: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(() => {})
  }

  return (
    <button
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 7px',
        borderRadius: 6,
        fontSize: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)',
        color: copied ? '#34d399' : 'var(--tx-tertiary)',
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
        ...style,
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = 'var(--tx-secondary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.color = 'var(--tx-tertiary)'
        }
      }}
    >
      <Pxi name={copied ? 'check' : 'copy'} size={9} />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-start gap-2.5 mt-2 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
    >
      <Pxi name="exclamation-triangle" size={12} style={{ color: '#f87171', flexShrink: 0, marginTop: 2 }} />
      <div className="flex-1 min-w-0">
        {/* #fca5a5 on the dark red tint still exceeds 4.5:1 */}
        <p className="leading-relaxed" style={{ fontSize: 12, color: '#fca5a5' }}>
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 mt-2 font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{
              fontSize: 11,
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
          >
            <Pxi name="refresh" size={10} />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Inline markdown ──────────────────────────────────────────────────────────

function inlineMarkdown(text: string, keyPrefix: string): React.ReactNode {
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|~~(.+?)~~|`([^`]+?)`|\[([^\]]+?)\]\(([^)]+?)\))/g
  const parts: React.ReactNode[] = []
  let last = 0
  let idx = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const full = match[0]
    const k = `${keyPrefix}-il-${idx++}`
    if (full.startsWith('***')) {
      parts.push(<strong key={k}><em>{match[2]}</em></strong>)
    } else if (full.startsWith('**') || full.startsWith('__')) {
      /* Bold: white — maximum contrast for emphasis */
      parts.push(<strong key={k} style={{ fontWeight: 600, color: '#ffffff' }}>{match[3] ?? match[4]}</strong>)
    } else if (full.startsWith('_') || full.startsWith('*')) {
      /* Italic: primary text, slightly raised */
      parts.push(<em key={k} style={{ fontStyle: 'italic', color: 'var(--tx-primary)' }}>{match[5] ?? match[6]}</em>)
    } else if (full.startsWith('~~')) {
      parts.push(<del key={k} style={{ textDecoration: 'line-through', opacity: 0.55 }}>{match[7]}</del>)
    } else if (full.startsWith('`')) {
      /* Inline code — amber-soft on a near-black tinted bg */
      parts.push(
        <code
          key={k}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--amber-soft)',   /* oklch(79% 0.164 30.1) ≈ high contrast on dark */
            fontSize: '0.8em',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: 4,
            lineHeight: 1,
          }}
        >
          {match[8]}
        </code>,
      )
    } else if (full.startsWith('[')) {
      parts.push(
        <a key={k} href={match[10]} target="_blank" rel="noopener noreferrer"
          style={{ color: 'var(--amber)', textDecorationColor: 'oklch(64% 0.214 40.1 / 0.4)', textDecoration: 'underline', textUnderlineOffset: 2 }}
          onMouseOver={(e) => { e.currentTarget.style.color = 'var(--amber-soft)' }}
          onMouseOut={(e) => { e.currentTarget.style.color = 'var(--amber)' }}
        >
          {match[9]}
        </a>,
      )
    }
    last = match.index + full.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

// ─── Block markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = []
  let key = 0
  const k = () => `md-${key++}`

  const fencedParts = text.split(/(```[\w]*\n[\s\S]*?```)/g)

  for (const part of fencedParts) {
    if (part.startsWith('```')) {
      const rest = part.slice(3)
      const nlIdx = rest.indexOf('\n')
      const lang = nlIdx !== -1 ? rest.slice(0, nlIdx).trim() : ''
      const code = nlIdx !== -1 ? rest.slice(nlIdx + 1).replace(/```$/, '').trimEnd() : rest.replace(/```$/, '').trimEnd()
      nodes.push(
        <div key={k()} style={{ margin: '14px 0', borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.07)', background: '#0a0a0a' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, padding: '7px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Pxi name="code-block" size={11} style={{ color: 'var(--tx-tertiary)' }} />
              {lang && (
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  {lang}
                </span>
              )}
            </div>
            <CopyButton text={code} />
          </div>
          {/* Code body: #c8c8c8 on #0a0a0a ≈ 10.4:1 */}
          <pre style={{ overflow: 'auto', fontSize: 12, fontFamily: 'var(--font-mono)', color: '#c8c8c8', padding: '14px 16px', lineHeight: 1.65, margin: 0 }}>
            <code>{code}</code>
          </pre>
        </div>,
      )
      continue
    }

    const lines = part.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]
      if (!line.trim()) { i++; continue }

      if (/^[-*_]{3,}\s*$/.test(line)) {
        nodes.push(<hr key={k()} style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />)
        i++; continue
      }

      const h3 = line.match(/^###\s+(.+)/)
      const h2 = line.match(/^##\s+(.+)/)
      const h1 = line.match(/^#\s+(.+)/)
      if (h1) {
        /* h1: white, 16px */
        nodes.push(<h1 key={k()} style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginTop: 20, marginBottom: 8, lineHeight: 1.35 }}>{inlineMarkdown(h1[1], k())}</h1>)
        i++; continue
      }
      if (h2) {
        nodes.push(<h2 key={k()} style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-primary)', marginTop: 16, marginBottom: 6, lineHeight: 1.35 }}>{inlineMarkdown(h2[1], k())}</h2>)
        i++; continue
      }
      if (h3) {
        nodes.push(<h3 key={k()} style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-primary)', marginTop: 12, marginBottom: 4, lineHeight: 1.35 }}>{inlineMarkdown(h3[1], k())}</h3>)
        i++; continue
      }

      if (line.startsWith('> ')) {
        const quoteLines: string[] = []
        while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].slice(2)); i++ }
        nodes.push(
          <blockquote key={k()} style={{ borderLeft: '2px solid oklch(64% 0.214 40.1 / 0.45)', paddingLeft: 14, margin: '12px 0' }}>
            {quoteLines.map((ql, qi) => (
              /* Blockquote text: #ababab on #0d0d0d ≈ 7.9:1 */
              <p key={qi} style={{ fontSize: 13, color: 'var(--tx-secondary)', fontStyle: 'italic', lineHeight: 1.7, margin: '2px 0' }}>{inlineMarkdown(ql, `bq-${qi}`)}</p>
            ))}
          </blockquote>,
        ); continue
      }

      if (/^[-*+]\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^[-*+]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*+]\s/, '')); i++ }
        nodes.push(
          <ul key={k()} style={{ margin: '10px 0', listStyle: 'none', padding: 0 }}>
            {items.map((item, ii) => (
              <li key={ii} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, lineHeight: 1.75, color: 'var(--tx-secondary)' }}>
                {/* Bullet: amber — visible without being noisy */}
                <span style={{ marginTop: '0.5em', width: 4, height: 4, borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 }} />
                <span>{inlineMarkdown(item, `ul-${ii}`)}</span>
              </li>
            ))}
          </ul>,
        ); continue
      }

      if (/^\d+\.\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++ }
        nodes.push(
          <ol key={k()} style={{ margin: '10px 0', listStyle: 'none', padding: 0 }}>
            {items.map((item, ii) => (
              <li key={ii} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 13, lineHeight: 1.75, color: 'var(--tx-secondary)' }}>
                {/* Number: tertiary (#757575 ≈ 4.6:1) — clearly readable */}
                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flexShrink: 0, minWidth: 16, textAlign: 'right', tabularNums: 'tabular-nums' } as React.CSSProperties}>{ii + 1}.</span>
                <span>{inlineMarkdown(item, `ol-${ii}`)}</span>
              </li>
            ))}
          </ol>,
        ); continue
      }

      const paraLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,3}\s|> |[-*+]\s|\d+\. |```|[-*_]{3,})/.test(lines[i])
      ) { paraLines.push(lines[i]); i++ }

      if (paraLines.length > 0) {
        nodes.push(
          /* Body paragraphs: #ababab on #0d0d0d ≈ 7.9:1 */
          <p key={k()} style={{ fontSize: 13, lineHeight: 1.75, color: 'var(--tx-secondary)', margin: '4px 0' }}>
            {paraLines.map((pl, pi) => (
              <span key={pi}>
                {inlineMarkdown(pl, `p-${pi}`)}
                {pi < paraLines.length - 1 && <br />}
              </span>
            ))}
          </p>,
        )
      }
    }
  }

  return <>{nodes}</>
}

// ─── Sent attachment grid ─────────────────────────────────────────────────────

function attachmentIcon(cat: AttachmentCategory): { icon: string; color: string } {
  switch (cat) {
    case 'image':       return { icon: 'image',        color: '#60a5fa' }
    case 'document':    return { icon: 'file-alt',     color: '#a78bfa' }
    case 'spreadsheet': return { icon: 'table',        color: '#34d399' }
    case 'code':        return { icon: 'code',         color: 'var(--amber-soft)' }
    case 'archive':     return { icon: 'file-archive', color: '#fb923c' }
    default:            return { icon: 'file',         color: 'var(--tx-tertiary)' }
  }
}

function AttachmentGrid({ attachments }: { attachments: MessageAttachment[] }) {
  const images = attachments.filter((a) => a.category === 'image')
  const files  = attachments.filter((a) => a.category !== 'image')

  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {/* Image thumbnails */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {images.map((att) => (
            <div
              key={att.id}
              style={{
                width: 80,
                height: 80,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                flexShrink: 0,
              }}
            >
              {att.previewUrl ? (
                <img
                  src={att.previewUrl}
                  alt={att.name}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pxi name="image" size={24} style={{ color: '#60a5fa', opacity: 0.5 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File chips */}
      {files.map((att) => {
        const { icon, color } = attachmentIcon(att.category)
        return (
          <div
            key={att.id}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '5px 10px',
              borderRadius: 8,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              maxWidth: 260,
            }}
          >
            <Pxi name={icon} size={12} style={{ color, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.name}
              </p>
              <p style={{ fontSize: 10, color: 'var(--tx-tertiary)' }}>{formatBytes(att.size)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function NasusAvatar() {
  return (
    <div
      style={{
        width: 28, height: 28,
        borderRadius: 8,
        flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#111',
        border: '1px solid oklch(64% 0.214 40.1 / 0.28)',
        boxShadow: '0 2px 8px oklch(64% 0.214 40.1 / 0.12)',
      }}
    >
      <NasusLogo size={16} fill="var(--amber)" />
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, height: 28 }}>
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          style={{
            width: 5, height: 5, borderRadius: '50%',
            /* #757575 dots — 4.6:1, clearly readable */
            background: 'var(--tx-tertiary)',
            animation: `typing-bounce 1.2s ease-in-out ${delay}ms infinite`,
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}

// ─── User bubble ──────────────────────────────────────────────────────────────

function UserBubble({ content, attachments }: { content: string; attachments?: MessageAttachment[] }) {
  const isSimple = !content.includes('\n') && !/^[#>`\-*]/.test(content.trim())

  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
      <div style={{ maxWidth: '72%', minWidth: 0 }}>
        <div
          style={{
            /* User bubble text: #e2e2e2 on #1c1c1e ≈ 11.5:1 */
            color: 'var(--tx-primary)',
            fontSize: 13,
            lineHeight: 1.7,
            padding: '10px 14px',
            borderRadius: '14px 14px 4px 14px',
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          {isSimple
            ? <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
            : <div style={{ whiteSpace: 'pre-wrap' }}>{renderMarkdown(content)}</div>
          }
          {attachments && attachments.length > 0 && (
            <AttachmentGrid attachments={attachments} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Agent message ────────────────────────────────────────────────────────────

const AgentMessage = memo(function AgentMessage({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  const [hovered, setHovered] = useState(false)
  const hasSteps   = (message.steps?.length ?? 0) > 0
  const hasContent = message.content.trim().length > 0
  const isStreaming = message.streaming
  const hasError   = !!message.error
  const isWaiting  = !hasContent && !hasSteps && isStreaming && !hasError

  const renderedContent = useMemo(
    () => hasContent ? renderMarkdown(message.content) : null,
    [message.content, hasContent],
  )

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        <NasusAvatar />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {isWaiting && <TypingDots />}
        {hasSteps && <AgentStepsView steps={message.steps!} />}
        {hasContent && (
            <div style={hasSteps ? { marginTop: 12 } : {}}>
              {renderedContent}
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2, height: 13,
                  borderRadius: 2,
                  marginLeft: 2,
                  verticalAlign: 'middle',
                  background: 'var(--amber)',
                  opacity: 0.9,
                  animation: 'cursor-blink 1s step-start infinite',
                }}
              />
            )}
          </div>
        )}
        {hasSteps && !hasContent && isStreaming && !hasError && (
          <div style={{ marginTop: 8 }}>
            <TypingDots />
          </div>
        )}
        {hasError && (
          <ErrorBanner error={message.error!} onRetry={onRetry} />
        )}
        {/* Copy message action — hover reveal, only when content exists and not streaming */}
          {hasContent && !isStreaming && !hasError && hovered && (
          <div style={{ marginTop: 8 }}>
            <CopyButton text={message.content} />
          </div>
        )}
      </div>
    </div>
  )
})

// ─── Export ───────────────────────────────────────────────────────────────────

export const ChatMessage = memo(function ChatMessage({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  if (message.author === 'user') return <UserBubble content={message.content} attachments={message.attachments} />
  return <AgentMessage message={message} onRetry={onRetry} />
})
