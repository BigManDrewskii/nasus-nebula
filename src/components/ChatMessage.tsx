import { useState, memo, useMemo } from 'react'
import type { Message, MessageAttachment, AttachmentCategory, OutputCardFile, AgentStep } from '../types'
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

function getErrorMessage(error: string): { title: string; body: string; icon: string } {
  const e = error.toLowerCase()

  if (e.includes('401') || e.includes('authentication') || e.includes('api key') || e.includes('unauthorized')) {
    return {
      title: 'Authentication Failed',
      body: 'Your API key is invalid or expired. Open Settings → Model tab and check your key.',
      icon: 'key',
    }
  }
  if (e.includes('429') || e.includes('rate limit') || e.includes('too many requests')) {
    return {
      title: 'Rate Limit Reached',
      body: 'The AI provider is rate-limiting requests. Wait a moment and click "Try again", or switch to a different model in Settings.',
      icon: 'clock',
    }
  }
  if (e.includes('402') || e.includes('payment required') || e.includes('credits') || e.includes('quota')) {
    return {
      title: 'Insufficient Credits',
      body: 'Your account is out of credits. Top up your balance or switch to a free model in Settings.',
      icon: 'coin',
    }
  }
  if (e.includes('404') || e.includes('model not found') || e.includes('unavailable') || e.includes('not found')) {
    return {
      title: 'Model Unavailable',
      body: 'This model is temporarily unavailable or has been removed. Switch to a different model in Settings → Model tab.',
      icon: 'exclamation-triangle',
    }
  }
  if (e.includes('timeout') || e.includes('econnrefused') || e.includes('network') || e.includes('fetch failed')) {
    return {
      title: 'Connection Error',
      body: 'Could not reach the AI provider. Check your internet connection and click "Try again".',
      icon: 'exclamation-triangle',
    }
  }
  if (
    e.includes('tool') && (e.includes('tool_calls') || e.includes('must be a response')) ||
    e.includes('ai_missing') ||
    e.includes('messages with role') ||
    e.includes('invalid prompt')
  ) {
    return {
      title: 'Message History Error',
      body: 'The conversation history became inconsistent (a known provider edge case). The sanitizer has been applied — click "Try again" to continue.',
      icon: 'refresh',
    }
  }
  if (e.includes('no output generated') || e.includes('ai_nooutput')) {
    return {
      title: 'Empty Response',
      body: 'The model returned an empty response. This usually resolves on retry — it can happen under high server load or with certain rate-limit patterns.',
      icon: 'exclamation-triangle',
    }
  }
  if (e.includes('context length') || e.includes('maximum context') || e.includes('token limit')) {
    return {
      title: 'Context Too Long',
      body: 'The conversation is too long for this model\'s context window. Start a new task or switch to a model with a larger context (e.g. Gemini 2.0 Flash).',
      icon: 'exclamation-triangle',
    }
  }

  // Fallback — show the raw error, truncated
  const display = error.length > 280 ? error.slice(0, 280) + '…' : error
  return {
    title: 'Generation Error',
    body: display,
    icon: 'exclamation-triangle',
  }
}

function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  const { title, body, icon } = getErrorMessage(error)
  const isQuotaError = error.toLowerCase().includes('402') || error.toLowerCase().includes('credits')

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
          {title}
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
          {body}
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
      border: '1px solid rgba(255,255,255,0.08)',
    }}>
      <NasusLogo size={13} fill="var(--amber)" />
    </div>
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
      <div style={{ maxWidth: '72%', minWidth: 0 }}>
        <div
          style={{
            color: 'var(--tx-primary)',
            fontSize: 13.5,
            lineHeight: 1.65,
            padding: '9px 14px',
            borderRadius: 12,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
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

        {/* Label on hover */}
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
        const lastToolStep = message.steps?.findLast((s: AgentStep) => s.kind === 'tool_call')
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
        <div style={{ flexShrink: 0, paddingTop: 1 }}>
          <NasusAvatar isStreaming={isStreaming} />
        </div>

        {/* Content column */}
        <div style={{ flex: 1, minWidth: 0 }}>
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
              marginTop: 14,
              paddingTop: 14,
              borderTop: '1px solid rgba(255,255,255,0.05)',
            } : { marginTop: 2 }}>
              <div style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: 'var(--tx-primary)',
                letterSpacing: '-0.005em',
                maxWidth: 680,
              }}
              className="agent-prose"
              >
                {renderedContent}
              </div>
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
