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

function CopyButton({ text }: { text: string }) {
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
      title={copied ? 'Copied!' : 'Copy message'}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 8px',
        borderRadius: 6,
        fontSize: 10,
        border: '1px solid rgba(255,255,255,0.07)',
        background: copied ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.04)',
        color: copied ? '#34d399' : 'var(--tx-tertiary)',
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
        fontFamily: 'inherit',
      }}
      onMouseEnter={(e) => {
        if (!copied) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
          e.currentTarget.style.color = 'var(--tx-secondary)'
        }
      }}
      onMouseLeave={(e) => {
        if (!copied) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = 'var(--tx-tertiary)'
        }
      }}
    >
      <Pxi name={copied ? 'check' : 'copy'} size={11} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const isAuthError = error.includes('401') || error.includes('Authentication') || error.includes('API key')
  const isRateLimit = error.includes('429') || error.includes('Rate limit') || error.includes('Too many requests')
  const isQuotaError = error.includes('402') || error.includes('Payment Required') || error.includes('credits')
  const isModelUnavailable = error.includes('404') || error.includes('not found') || error.includes('unavailable')
  const isStreamError = error.includes('No output generated') || (error.includes('tool') && error.includes('must')) || error.includes('AI_Missing') || error.includes('Messages with role')

  const errorTitle = isAuthError ? 'Authentication Failed'
    : isRateLimit ? 'Rate Limit Reached'
    : isQuotaError ? 'Insufficient Credits'
    : isModelUnavailable ? 'Model Unavailable'
    : 'Generation Error'

  const icon = isAuthError ? 'key' : isRateLimit ? 'clock' : isQuotaError ? 'coin' : 'exclamation-triangle'

  const displayError = isStreamError
    ? 'The AI provider returned an error. Click "Try again" to retry — this usually resolves on the next attempt.'
    : error

  return (
    <div
      className="slide-down"
      style={{
        borderRadius: 12,
        border: '1px solid rgba(212,80,64,0.2)',
        background: 'rgba(212,80,64,0.06)',
        overflow: 'hidden',
        marginTop: 8,
      }}
    >
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '10px 14px 8px',
        borderBottom: '1px solid rgba(212,80,64,0.1)',
      }}>
        <Pxi name={icon} size={13} style={{ color: '#f87171', flexShrink: 0 }} />
        <span style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#f87171',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          fontFamily: 'var(--font-display)',
        }}>
          {errorTitle}
        </span>
      </div>

      {/* Body */}
      <div style={{ padding: '10px 14px 12px' }}>
        <p style={{
          fontSize: 12,
          lineHeight: 1.6,
          color: 'var(--tx-secondary)',
          margin: 0,
          marginBottom: onRetry ? 10 : 0,
        }}>
          {displayError}
        </p>

        {onRetry && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={onRetry}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 8,
                fontSize: 11,
                fontWeight: 500,
                background: 'rgba(234,179,8,0.12)',
                border: '1px solid rgba(234,179,8,0.25)',
                color: 'var(--amber)',
                cursor: 'pointer',
                transition: 'background 0.12s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
            >
              <Pxi name="refresh" size={11} />
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
    </div>
  )
}

// ─── Attachment grid ──────────────────────────────────────────────────────────

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
    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
      {images.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {images.map((att) => (
            <div
              key={att.id}
              style={{
                width: 80, height: 80,
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.04)',
                flexShrink: 0,
              }}
            >
              {att.previewUrl ? (
                <img src={att.previewUrl} alt={att.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Pxi name="image" size={24} style={{ color: '#60a5fa', opacity: 0.5 }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
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
              <p style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                {formatBytes(att.size)}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ─── Nasus avatar ─────────────────────────────────────────────────────────────

function NasusAvatar({ isStreaming: _isStreaming }: { isStreaming?: boolean }) {
  return (
    <div style={{
      width: 28,
      height: 28,
      borderRadius: 8,
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#111',
      border: '1px solid rgba(234,179,8,0.2)',
    }}>
      <NasusLogo size={15} fill="var(--amber)" />
    </div>
  )
}

// ─── Streaming status dot ─────────────────────────────────────────────────────

function StreamingDot() {
  return (
    <span
      style={{
        width: 5, height: 5,
        borderRadius: '50%',
        background: '#4ade80',
        display: 'inline-block',
        flexShrink: 0,
        animation: 'statusPulse 1.6s ease-in-out infinite',
      }}
    />
  )
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      padding: '5px 10px',
      borderRadius: 10,
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="typing-dot"
          style={{
            width: 4, height: 4,
            borderRadius: '50%',
            background: 'var(--amber)',
            display: 'block',
          }}
        />
      ))}
    </div>
  )
}

// ─── Model badge ──────────────────────────────────────────────────────────────

function ModelBadge({ modelName, provider, isStreaming }: { modelName: string; provider?: string; isStreaming?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      marginBottom: 6,
      height: 18,
    }}>
      <span style={{
        fontSize: 10,
        fontWeight: 600,
        color: 'var(--tx-muted)',
        letterSpacing: '0.02em',
      }}>
        {modelName}
      </span>
      {provider && (
        <>
          <span style={{ width: 2, height: 2, borderRadius: '50%', background: 'var(--tx-ghost)' }} />
          <span style={{ fontSize: 9, color: 'var(--tx-ghost)', fontFamily: 'var(--font-mono)' }}>
            {provider}
          </span>
        </>
      )}
      {isStreaming && (
        <span style={{
          width: 5, height: 5, borderRadius: '50%',
          background: '#4ade80',
          animation: 'statusPulse 1.6s ease-in-out infinite',
          flexShrink: 0,
        }} />
      )}
    </div>
  )
}

// ─── User bubble ──────────────────────────────────────────────────────────────

function UserBubble({ content, attachments }: { content: string; attachments?: MessageAttachment[] }) {
  const [hovered, setHovered] = useState(false)
  const isSimple = !content.includes('\n') && !/^[#>`\-*]/.test(content.trim())

  return (
    <div
      style={{ display: 'flex', justifyContent: 'flex-end' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{ maxWidth: '75%', minWidth: 0 }}>
        <div
          style={{
            color: 'var(--tx-primary)',
            fontSize: 13.5,
            lineHeight: 1.65,
            padding: '10px 16px',
            borderRadius: '18px 18px 4px 18px',
            background: 'rgba(234,179,8,0.06)',
            border: '1px solid rgba(234,179,8,0.12)',
            maxWidth: '100%',
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

        {/* Timestamp on hover */}
        <div style={{
          textAlign: 'right',
          marginTop: 3,
          opacity: hovered ? 1 : 0,
          transition: 'opacity 0.15s',
          pointerEvents: 'none',
        }}>
          <span style={{ fontSize: 10, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)' }}>
            you
          </span>
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
      const lastToolStep = message.steps?.findLast(s => s.kind === 'tool_call')
      return <ThinkingIndicator
        visible={true}
        activeModel={message.modelId ? {
          id: message.modelId,
          displayName: message.modelName || message.modelId,
          provider: message.provider || 'AI'
        } : null}
        currentTool={lastToolStep?.kind === 'tool_call' ? (lastToolStep as any).tool : null}
      />
    }

  const showBetweenDots = hasSteps && !hasContent && isStreaming && !hasError && (() => {
    const lastStep = message.steps![message.steps!.length - 1]
    const lastIsPendingTool = lastStep?.kind === 'tool_call' && !(lastStep as { result?: unknown }).result
    return !lastIsPendingTool
  })()

  return (
    <div
      style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Avatar */}
      <div style={{ marginTop: 1, flexShrink: 0 }}>
        <NasusAvatar isStreaming={isStreaming} />
      </div>

      {/* Content column */}
      <div style={{ flex: 1, minWidth: 0, paddingTop: 0 }}>
        {/* Model badge row */}
        {(hasContent || hasSteps) && message.modelName && (
          <ModelBadge
            modelName={message.modelName}
            provider={message.provider}
            isStreaming={isStreaming}
          />
        )}

        {/* Steps (tool calls) */}
        {hasSteps && <AgentStepsView steps={message.steps!} isStreaming={isStreaming} />}

        {/* Between-turn typing dots */}
        {showBetweenDots && (
          <div style={{ marginTop: hasSteps ? 8 : 0 }}>
            <TypingDots />
          </div>
        )}

        {/* Final text response */}
        {hasContent && (
          <div style={hasSteps ? {
            marginTop: 16,
            paddingTop: 16,
            borderTop: '1px solid rgba(255,255,255,0.06)',
          } : {}}>
            <div style={{ fontSize: 13.5, lineHeight: 1.7, color: 'var(--tx-secondary)' }}>
              {renderedContent}
            </div>
              {isStreaming && (
                <span
                  style={{
                    display: 'inline-block',
                    width: 2, height: 15,
                    borderRadius: 1,
                    marginLeft: 2,
                    verticalAlign: 'text-bottom',
                    background: 'var(--amber)',
                    animation: 'cursorBlink 1s steps(2) infinite',
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

        {/* Hover action bar */}
        {hasContent && !isStreaming && !hasError && hovered && (
          <div
            className="slide-down"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
            }}
          >
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
}, (prevProps, nextProps) => {
  const prev = prevProps.message
  const next = nextProps.message

  if (prev.id !== next.id) return false
  if (prev.author !== next.author) return false
  if (prev.streaming !== next.streaming) return false
  if (prev.error !== next.error) return false

  const prevStepsLen = prev.steps?.length ?? 0
  const nextStepsLen = next.steps?.length ?? 0
  if (prevStepsLen !== nextStepsLen) return false

  if (prevStepsLen > 0 && nextStepsLen > 0) {
    const prevLast = prev.steps![prevStepsLen - 1]
    const nextLast = next.steps![nextStepsLen - 1]
    if (prevLast !== nextLast) return false
  }

  if (prev.author === 'user' && prev.content !== next.content) return false

  if (prev.author === 'agent' && !prev.streaming && !next.streaming && prev.content !== next.content) {
    return false
  }

  if (prev.attachments?.length !== next.attachments?.length) return false

  return true
})
