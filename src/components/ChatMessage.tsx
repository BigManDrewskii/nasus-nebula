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

// ─── Agent content normalizer ─────────────────────────────────────────────────
// The model often emits a long run-on stream with colons as separators between
// narration steps, e.g.:
//   "Now I'll fetch the file:Now let me create the structure:Let me update..."
// This normalizer:
//   1. Inserts \n\n before any colon-joined narration openers so each step
//      becomes its own paragraph for the markdown renderer.
//   2. Adds a missing space after sentence-ending punctuation before a capital.
//   3. Strips up to 2 pure-narration opener sentences from the very beginning
//      (the ones with no substance, just "Now I'll…").

// Narration openers we split on (after a colon or period with no space)
const NARRATION_OPENER =
  /(?<=\S):(?=(?:Now I(?:'ll| will| can| need to| should)\b|Let me\b|I(?:'ll| will| need to| should| am going to)\b|Next[, ]I(?:'ll| will)\b|First[, ]I(?:'ll| will)\b|Now let(?:'s| me)\b|I've just\b|I have just\b|I(?:'ll| will) now\b))/g

// Leading pure-narration sentence (no substantive content — just an action opener)
const LEADING_NARRATION_RE =
  /^(?:Now I(?:'ll| will| can| need to| should)|Let me|I(?:'ll| will| can| need to| should| am going to)|Next[, ]I(?:'ll| will)|First[, ]I(?:'ll| will)|Now let(?:'s| me)|I've just|I have just|I(?:'ll| will) now|Everything looks)[^.!?\n]*[.!?]\s*/i

function normalizeAgentContent(text: string): string {
  if (!text.trim()) return text

  // Step 1: split colon-joined narration runs into separate paragraphs
  let s = text.replace(NARRATION_OPENER, '\n\n')

  // Step 2: ensure space after sentence-ending punctuation before capital letter
  // e.g. "done.Now" → "done. Now"
  s = s.replace(/([.!?])([A-Z])/g, '$1 $2')

  // Step 3: strip leading pure-narration openers (up to 3) and orphaned fragments
  // (short tail text left after a colon split, e.g. " css file\n\nNow I'll…")
  s = s.trimStart()
  for (let i = 0; i < 3; i++) {
    // Match a leading narration sentence
    const m = s.match(LEADING_NARRATION_RE)
    if (m) {
      s = s.slice(m[0].length).trimStart()
      continue
    }
    // If the leading "paragraph" (before first \n\n) is a short orphaned fragment
    // (< 40 chars, no verb, likely a dangling noun phrase), drop it
    const paraEnd = s.indexOf('\n\n')
    if (paraEnd !== -1 && paraEnd < 40) {
      const frag = s.slice(0, paraEnd).trim()
      // Only drop if it looks like a fragment (no period/sentence structure)
      if (frag.length < 35 && !/[.!?]$/.test(frag)) {
        s = s.slice(paraEnd).trimStart()
        continue
      }
    }
    break
  }

  return s.trim()
}

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
        className={`cm-copy-btn${copied ? ' cm-copy-btn--copied' : ''} hover-bg-app-3 hover-text-secondary`}
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
                className="cm-retry-btn hover-bg-amber"
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

      // Normalize agent content: split colon-joined narration runs into paragraphs,
      // fix missing spaces after punctuation, strip pure-opener sentences.
      // Applied always (streaming too) so the text doesn't reflow on settle.
      const cleanedContent = useMemo(() => {
        return normalizeAgentContent(debouncedContent)
      }, [debouncedContent])

    const renderedContent = useMemo(
      () => hasContent ? <MarkdownRenderer content={cleanedContent} /> : null,
      [cleanedContent, hasContent],
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
        currentTool={lastToolStep?.kind === 'tool_call' ? lastToolStep.tool : null}
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
