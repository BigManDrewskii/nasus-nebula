import { useState, memo, useMemo } from 'react'
import type { Message, MessageAttachment, AttachmentCategory, OutputCardFile } from '../types'
import { AgentStepsView } from './AgentStepsView'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'
import { ThinkingIndicator } from './ThinkingIndicator'
import { formatBytes } from '../hooks/useAttachments'
import { OutputCardRenderer } from './OutputCards'
import { useDebouncedStreaming } from '../hooks/useStreaming'
import { logger } from '../lib/logger'
import { MarkdownRenderer } from './MarkdownRenderer'

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyButton({ text, style }: { text: string; style?: React.CSSProperties }) {
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }).catch(err => {
      logger.warn('ChatMessage', 'Failed to copy to clipboard', err)
    })
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
      <Pxi name={copied ? 'check' : 'copy'} size={12} />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const isAuthError = error.includes('401') || error.includes('Authentication') || error.includes('API key')
  const isRateLimit = error.includes('429') || error.includes('Rate limit') || error.includes('Too many requests')
  const isQuotaError = error.includes('402') || error.includes('Payment Required') || error.includes('credits')
  const isModelUnavailable = error.includes('404') || error.includes('not found') || error.includes('unavailable')

  const errorTitle = isAuthError ? 'Authentication Failed' 
    : isRateLimit ? 'Rate Limit Reached' 
    : isQuotaError ? 'Insufficient Credits' 
    : isModelUnavailable ? 'Model Unavailable' 
    : 'Generation Error'

  const icon = isAuthError ? 'key' : isRateLimit ? 'clock' : isQuotaError ? 'coin' : 'exclamation-triangle'

  return (
    <div
      className="flex flex-col gap-3 mt-3 px-4 py-3 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200"
      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.12)' }}
    >
      <div className="flex items-center gap-2">
        <Pxi name={icon} size={14} style={{ color: '#f87171' }} />
        <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
          {errorTitle}
        </span>
      </div>
      
      <p className="leading-relaxed" style={{ fontSize: 12, color: 'var(--tx-secondary)' }}>
        {error}
      </p>

      {onRetry && (
        <div className="flex items-center gap-2 mt-1">
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 font-semibold px-3 py-1.5 rounded-lg transition-all active:scale-95"
            style={{
              fontSize: 11,
              background: '#f87171',
              color: '#000',
            }}
          >
            <Pxi name="refresh" size={12} />
            Try again
          </button>
          
          {isQuotaError && (
            <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontStyle: 'italic' }}>
              Switching to a free model might help.
            </span>
          )}
        </div>
      )}
    </div>
  )
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
            <Pxi name={icon} size={14} style={{ color, flexShrink: 0 }} />
            <div style={{ minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--tx-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {att.name}
              </p>
                <p style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>{formatBytes(att.size)}</p>
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
            fontSize: 13.5,
            lineHeight: 1.65,
            padding: '9px 13px',
            borderRadius: '12px 12px 3px 12px',
            background: '#1d1d1f',
            border: '1px solid rgba(255,255,255,0.09)',
          }}
        >
    {isSimple
          ? <span style={{ whiteSpace: 'pre-wrap' }}>{content}</span>
          : <div style={{ whiteSpace: 'pre-wrap' }}><MarkdownRenderer content={content} /></div>
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
  const hasSteps    = (message.steps?.length ?? 0) > 0
  const hasContent  = message.content.trim().length > 0
  const isStreaming = message.streaming
  const hasError    = !!message.error
  const isWaiting   = !hasContent && !hasSteps && isStreaming && !hasError

  // Debounce streaming content to reduce re-renders during rapid token updates
  const debouncedContent = useDebouncedStreaming(message.content, isStreaming ?? false, 50)

  const renderedContent = useMemo(
    () => hasContent ? <MarkdownRenderer content={debouncedContent} /> : null,
    [debouncedContent, hasContent],
  )

  const outputCardFiles = useMemo<OutputCardFile[]>(() => {
    if (!message.steps) return []
    for (let i = message.steps.length - 1; i >= 0; i--) {
      const s = message.steps[i]
      if (s.kind === 'output_cards') return s.files
    }
    return []
  }, [message.steps])

  if (isWaiting) {
    return <ThinkingIndicator
      visible={true}
      activeModel={message.modelId ? {
        id: message.modelId,
        displayName: message.modelName || message.modelId,
        provider: message.provider || 'AI'
      } : null}
    />
  }

  const showBetweenDots = hasSteps && !hasContent && isStreaming && !hasError && (() => {
    const lastStep = message.steps![message.steps!.length - 1]
    const lastIsPendingTool = lastStep?.kind === 'tool_call' && !(lastStep as { result?: unknown }).result
    return !lastIsPendingTool
  })()

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div style={{ marginTop: 2, flexShrink: 0 }}>
        <NasusAvatar />
      </div>

        {/* Content column */}
        <div style={{ flex: 1, minWidth: 0, paddingTop: 1 }}>
          {/* Model info badge — shown when content starts appearing or steps are present */}
          {(hasContent || hasSteps) && message.modelName && (
            <div style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--tx-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                {message.modelName}
              </span>
              <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--tx-muted)', opacity: 0.4 }} />
              <span style={{ fontSize: 9, color: 'var(--tx-muted)', opacity: 0.6, letterSpacing: '0.03em' }}>
                {message.provider || 'AI'}
              </span>
            </div>
          )}

          {/* Steps (tool calls) */}

        {hasSteps && <AgentStepsView steps={message.steps!} isStreaming={isStreaming} />}

        {/* Between-turn typing indicator */}
        {showBetweenDots && (
          <div style={{ marginTop: hasSteps ? 6 : 0 }}>
            <TypingDots />
          </div>
        )}

        {/* Final text response */}
        {hasContent && (
          <div style={hasSteps ? {
            marginTop: 14,
            paddingTop: 14,
            borderTop: '1px solid rgba(255,255,255,0.05)',
          } : {}}>
            {renderedContent}
            {isStreaming && (
              <span
                style={{
                  display: 'inline-block',
                  width: 2, height: 13,
                  borderRadius: 1,
                  marginLeft: 2,
                  verticalAlign: 'text-bottom',
                  background: 'var(--amber)',
                  opacity: 0.8,
                  animation: 'cursorPulse 1.2s ease-in-out infinite',
                }}
              />
            )}
          </div>
        )}

        {hasError && (
          <ErrorBanner error={message.error!} onRetry={onRetry} />
        )}

        {!isStreaming && outputCardFiles.length > 0 && (
          <OutputCardRenderer files={outputCardFiles} />
        )}

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

/**
 * Memoized ChatMessage with custom comparison to prevent unnecessary re-renders.
 * Only re-renders when:
 * - Message ID changes (different message)
 * - Content changes (for user messages or final agent response)
 * - Streaming state changes (toggles cursor, typing indicator)
 * - Error state changes
 * - Steps array length changes (new tool calls)
 *
 * During streaming, we avoid re-rendering on every content chunk by only
 * checking if streaming state toggles on/off, not the content itself.
 */
export const ChatMessage = memo(function ChatMessage({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  if (message.author === 'user') return <UserBubble content={message.content} attachments={message.attachments} />
  return <AgentMessage message={message} onRetry={onRetry} />
}, (prevProps, nextProps) => {
  const prev = prevProps.message
  const next = nextProps.message

  // Different message entirely
  if (prev.id !== next.id) return false

  // Author changed (shouldn't happen but handle it)
  if (prev.author !== next.author) return false

  // Streaming state toggled
  if (prev.streaming !== next.streaming) return false

  // Error state changed
  if (prev.error !== next.error) return false

  // Steps array length changed (new/removed tool calls)
  const prevStepsLen = prev.steps?.length ?? 0
  const nextStepsLen = next.steps?.length ?? 0
  if (prevStepsLen !== nextStepsLen) return false

  // Last step content changed (e.g. tool_result embedded into tool_call, or search_status phase update)
  // Compare by reference so any mutation to the last step triggers a re-render
  if (prevStepsLen > 0 && nextStepsLen > 0) {
    const prevLast = prev.steps![prevStepsLen - 1]
    const nextLast = next.steps![nextStepsLen - 1]
    if (prevLast !== nextLast) return false
  }

  // For user messages: content change triggers re-render
  if (prev.author === 'user' && prev.content !== next.content) return false

  // For agent messages: only re-render content when NOT streaming
  // This prevents janky re-renders during content streaming
  if (prev.author === 'agent' && !prev.streaming && !next.streaming && prev.content !== next.content) {
    return false
  }

  // Attachments changed
  if (prev.attachments?.length !== next.attachments?.length) return false

  // Props are equivalent - skip re-render
  return true
})
