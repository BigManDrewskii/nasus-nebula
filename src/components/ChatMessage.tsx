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
      className={`cm-copy-btn${copied ? ' cm-copy-btn--copied' : ''}`}
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
    <div className="cm-error-banner slide-down">
      {/* Header row */}
      <div className="cm-error-header">
        <Pxi name={icon} size={13} className="cm-error-icon" />
        <span className="cm-error-title">{title}</span>
      </div>

      {/* Body */}
      <div className="cm-error-body">
        <p
          className="cm-error-text"
          style={{ marginBottom: onRetry ? 10 : 0 }}
        >
          {body}
        </p>

        {onRetry && (
          <div className="cm-error-actions">
            <button
              onClick={onRetry}
              className="cm-retry-btn"
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.2)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.12)' }}
            >
              <Pxi name="refresh" size={11} />
              Try again
            </button>

            {isQuotaError && (
              <span className="cm-quota-hint">
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
    <div className="cm-attachment-grid">
      {images.length > 0 && (
        <div className="cm-attachment-images">
          {images.map((att) => (
            <div key={att.id} className="cm-attachment-thumb">
              {att.previewUrl ? (
                <img src={att.previewUrl} alt={att.name} className="cm-attachment-img" />
              ) : (
                <div className="cm-attachment-placeholder">
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
          <div key={att.id} className="cm-attachment-file">
            <Pxi name={icon} size={14} style={{ color, flexShrink: 0 }} />
            <div className="cm-attachment-file-info">
              <p className="cm-attachment-name">{att.name}</p>
              <p className="cm-attachment-size">{formatBytes(att.size)}</p>
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
    <div className="cm-avatar">
      <NasusLogo size={13} fill="var(--amber)" />
    </div>
  )
}

// ─── Typing dots ──────────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="cm-typing-dots">
      {[0, 1, 2].map((i) => (
        <span key={i} className="typing-dot cm-typing-dot" />
      ))}
    </div>
  )
}

// ─── Model badge ──────────────────────────────────────────────────────────────

function ModelBadge({ modelName, provider, isStreaming }: { modelName: string; provider?: string; isStreaming?: boolean }) {
  return (
    <div className="cm-model-badge">
      <span className="cm-model-name">{modelName}</span>
      {provider && (
        <>
          <span className="cm-model-dot" />
          <span className="cm-model-provider">{provider}</span>
        </>
      )}
      {isStreaming && (
        <span className="cm-streaming-dot" />
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
      className="cm-user-row"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="cm-user-col">
        <div className="cm-user-bubble">
          {isSimple
            ? <span className="cm-user-text">{content}</span>
            : <div className="cm-user-text"><MarkdownRenderer content={content} /></div>
          }
          {attachments && attachments.length > 0 && (
            <AttachmentGrid attachments={attachments} />
          )}
        </div>

        {/* Label on hover */}
        <div
          className="cm-user-label"
          style={{ opacity: hovered ? 1 : 0 }}
        >
          <span className="cm-user-label-text">you</span>
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
        className="cm-agent-row"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Avatar */}
        <div className="cm-agent-avatar-col">
          <NasusAvatar isStreaming={isStreaming} />
        </div>

        {/* Content column */}
        <div className="cm-agent-content">
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
            <div className={hasSteps ? 'cm-response-divider' : 'cm-response-start'}>
              <div className="cm-prose agent-prose">
                {renderedContent}
              </div>
              {isStreaming && (
                <span className="cm-cursor" />
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
          <div className="cm-action-bar slide-down">
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
