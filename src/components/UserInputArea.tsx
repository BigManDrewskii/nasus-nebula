import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { Pxi } from './Pxi'
import { AttachmentPreviewBar } from './AttachmentPreviewBar'
import { ModelSelectorTrigger } from './ModelSelector/ModelSelectorTrigger'
import type { Attachment } from '../types'
import { useVoiceInput } from '../hooks/useVoiceInput'

// ── Input state machine ───────────────────────────────────────────────────────
export type InputState = 'idle' | 'processing' | 'streaming' | 'awaiting_input'

interface UserInputAreaProps {
  onSend: (message: string) => void
  onStop?: () => void
  onContentChange?: (content: string) => void
  disabled?: boolean
  isRunning?: boolean
  inputState?: InputState
  queuedMsg?: string | null
  autoFocus?: boolean
  attachments?: Attachment[]
  onAddFiles?: (files: File[]) => void
  onRemoveAttachment?: (id: string) => void
  isOverLimit?: boolean
  totalAttachmentSize?: number
}

export interface UserInputAreaHandle {
  prefill: (text: string) => void
}

// ── Main component ─────────────────────────────────────────────────────────────
export const UserInputArea = forwardRef<UserInputAreaHandle, UserInputAreaProps>(
  function UserInputArea({
    onSend, onStop, onContentChange, disabled, isRunning, inputState: inputStateProp, queuedMsg, autoFocus,
    attachments = [], onAddFiles, onRemoveAttachment, isOverLimit = false, totalAttachmentSize = 0,
  }, ref) {

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const inputState: InputState = inputStateProp ?? (isRunning ? 'streaming' : (disabled ? 'processing' : 'idle'))
  const isWorking = inputState === 'processing' || inputState === 'streaming'
  const isTextareaDisabled = disabled === true || inputState === 'processing'
  const hasAttachments = attachments.length > 0

  const placeholder = {
    idle:           'Message Nasus…',
    processing:     'Nasus is thinking…',
    streaming:      'Agent running — type to queue a follow-up…',
    awaiting_input: 'Nasus is waiting for your answer…',
  }[inputState]

  const effectivePlaceholder = (isWorking && queuedMsg)
    ? 'Message queued — will send when agent finishes'
    : placeholder

  useImperativeHandle(ref, () => ({
    prefill: (text: string) => {
      if (!textareaRef.current) return
      textareaRef.current.value = text
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 144) + 'px'
      textareaRef.current.focus()
      textareaRef.current.setSelectionRange(text.length, text.length)
    },
  }))

  const [isFocused, setIsFocused] = useState(false)

  // ── Voice input ─────────────────────────────────────────────────────────
  const { voiceState, isSupported: isVoiceSupported, toggle: toggleVoice } = useVoiceInput({
    onTranscript: (text) => {
      if (!textareaRef.current) return
      const ta = textareaRef.current
      const cur = ta.value
      ta.value = cur ? `${cur} ${text}` : text
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 144) + 'px'
      onContentChange?.(ta.value)
      ta.focus()
    },
    onInterim: (interim) => { void interim },
  })
  const micActive = voiceState === 'listening'

  function handleSend() {
    const trimmed = textareaRef.current?.value.trim() ?? ''
    if ((!trimmed && !hasAttachments) || isTextareaDisabled || isOverLimit) return
    onSend(trimmed)
    if (textareaRef.current) {
      textareaRef.current.value = ''
      textareaRef.current.style.height = 'auto'
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Escape' && isWorking && onStop) { e.preventDefault(); onStop(); return }
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 144) + 'px'
    onContentChange?.(ta.value)
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    if (!onAddFiles) return
    const items = Array.from(e.clipboardData.items)
    const fileItems = items.filter((item) => item.kind === 'file')
    if (fileItems.length === 0) return
    e.preventDefault()
    const files = fileItems.map((item) => {
      const file = item.getAsFile()
      if (!file) return null
      if ((file.name === 'image.png' || file.name === '') && file.type.startsWith('image/')) {
        const ts = new Date().toISOString().slice(11, 19).replace(/:/g, '-')
        const ext = file.type.split('/')[1] || 'png'
        return new File([file], `pasted-${ts}.${ext}`, { type: file.type })
      }
      return file
    }).filter((f): f is File => f !== null)
    if (files.length > 0) onAddFiles(files)
  }

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!onAddFiles || !e.target.files) return
    onAddFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  const canSend = !isTextareaDisabled && !isOverLimit

  // Border/glow driven by state
  const borderColor = (() => {
    if (inputState === 'awaiting_input') return 'var(--amber)'
    if (isFocused)                       return 'rgba(234,179,8,0.35)'
    if (inputState === 'streaming')      return 'rgba(234,179,8,0.12)'
    if (inputState === 'processing')     return 'rgba(255,255,255,0.04)'
    return 'rgba(255,255,255,0.08)'
  })()

  const boxShadow = (() => {
    if (inputState === 'awaiting_input') return '0 0 0 3px rgba(234,179,8,0.1), 0 8px 32px rgba(0,0,0,0.4)'
    if (isFocused)                       return '0 0 0 3px rgba(234,179,8,0.08), 0 6px 24px rgba(0,0,0,0.35)'
    return '0 2px 12px rgba(0,0,0,0.25)'
  })()

    return (
      <div
        style={{
          borderRadius: 12,
          border: `1px solid ${borderColor}`,
          background: inputState === 'processing' ? '#0f0f0f' : '#161616',
          transition: 'border-color 0.18s, box-shadow 0.18s',
          boxShadow,
          ...(inputState === 'awaiting_input' ? {
            borderLeft: '3px solid var(--amber)',
            animation: 'inputPulse 2s ease-in-out infinite',
          } : {}),
          ...(inputState === 'streaming' && !isFocused ? {
            animation: 'inputBreathing 3s ease-in-out infinite',
          } : {}),
        }}
        className={`user-input-area state-${inputState}`}
      >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.txt,.md,.csv,.xlsx,.xls,.tsv,.js,.ts,.jsx,.tsx,.py,.html,.css,.json,.yaml,.yml,.rs,.go,.c,.cpp,.java,.rb,.php,.swift,.zip"
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        aria-label="Attach files"
      />

      {/* Queued message banner */}
      {isWorking && queuedMsg && (
        <div style={{ padding: '8px 12px 0' }}>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            color: 'var(--amber)',
            background: 'rgba(234,179,8,0.07)',
            border: '1px solid rgba(234,179,8,0.16)',
            borderRadius: 5,
            padding: '3px 8px',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <Pxi name="clock" size={11} />
            Queued: {queuedMsg.length > 60 ? queuedMsg.slice(0, 60) + '…' : queuedMsg}
          </span>
        </div>
      )}

      {/* Attachment chips */}
      {hasAttachments && onRemoveAttachment && (
        <AttachmentPreviewBar
          attachments={attachments}
          onRemove={onRemoveAttachment}
          onAddMore={() => fileInputRef.current?.click()}
          isOverLimit={isOverLimit}
          totalSize={totalAttachmentSize}
        />
      )}

      {/* Textarea */}
      <div style={{ padding: '11px 14px 4px' }}>
        <textarea
          ref={textareaRef}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={effectivePlaceholder}
          rows={1}
          disabled={isTextareaDisabled}
          style={{
            width: '100%',
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 14,
              color: inputState === 'processing' ? 'var(--tx-tertiary)' : 'var(--tx-primary)',
              fontStyle: inputState === 'processing' ? 'italic' : 'normal',
              lineHeight: 1.6,
              minHeight: 32,
            maxHeight: 144,
            fontFamily: 'inherit',
            cursor: isTextareaDisabled ? 'not-allowed' : 'text',
            opacity: isWorking && queuedMsg ? 0.4 : 1,
            transition: 'color 0.15s, opacity 0.15s',
          }}
          className="placeholder-[var(--tx-muted)] disabled:opacity-60"
        />
      </div>

      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2px 8px 8px',
        gap: 6,
      }}>
        {/* Left: model selector + attach button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0, flex: 1 }}>
          <ModelSelectorTrigger />

          {onAddFiles && (
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isTextareaDisabled}
              title="Attach files"
              aria-label="Attach files"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: 6,
                border: 'none',
                background: 'transparent',
                color: 'var(--tx-muted)',
                cursor: isTextareaDisabled ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                padding: 0,
                transition: 'color 0.12s, background 0.12s',
              }}
              onMouseEnter={(e) => {
                if (!isTextareaDisabled) {
                  e.currentTarget.style.color = 'var(--tx-secondary)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--tx-muted)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <Pxi name="paperclip" size={13} />
            </button>
          )}

          {/* Mic button — only shown when Web Speech API is available */}
          {isVoiceSupported && (
            <button
              onClick={toggleVoice}
              disabled={isTextareaDisabled}
              title={micActive ? 'Stop recording' : 'Voice input'}
              aria-label={micActive ? 'Stop voice input' : 'Start voice input'}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: 6,
                border: 'none',
                background: micActive ? 'rgba(239,68,68,0.1)' : 'transparent',
                color: micActive ? 'var(--red-fg)' : 'var(--tx-muted)',
                cursor: isTextareaDisabled ? 'not-allowed' : 'pointer',
                flexShrink: 0,
                padding: 0,
                transition: 'color 0.12s, background 0.12s',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isTextareaDisabled && !micActive) {
                  e.currentTarget.style.color = 'var(--tx-secondary)'
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                }
              }}
              onMouseLeave={(e) => {
                if (!micActive) {
                  e.currentTarget.style.color = 'var(--tx-muted)'
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <MicIcon active={micActive} />
            </button>
          )}
        </div>

        {/* Right: send / stop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          {isWorking && onStop ? (
            <button
              onClick={onStop}
              title="Stop generating (Esc)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 500,
                background: 'rgba(239,68,68,0.07)',
                border: '1px solid rgba(239,68,68,0.22)',
                color: 'var(--red-fg)',
                cursor: 'pointer',
                transition: 'background 0.12s, border-color 0.12s',
                animation: 'buttonAppear 0.15s ease',
                flexShrink: 0,
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.14)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.42)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.07)'
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.22)'
              }}
            >
              <StopIcon />
              Stop
            </button>
          ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                title="Send (Enter) · Shift+Enter for newline"
                aria-label="Send message"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  border: 'none',
                  cursor: !canSend ? 'not-allowed' : 'pointer',
                  background: !canSend ? 'rgba(255,255,255,0.06)' : 'var(--amber)',
                  opacity: !canSend ? 0.35 : 1,
                  transition: 'background 0.12s, transform 0.1s, opacity 0.12s',
                  animation: 'buttonAppear 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  if (canSend) {
                    e.currentTarget.style.background = 'var(--amber-soft)'
                    e.currentTarget.style.transform = 'scale(1.06)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (canSend) {
                    e.currentTarget.style.background = 'var(--amber)'
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }}
              >
                <Pxi name="arrow-up" size={13} style={{ color: !canSend ? 'var(--tx-muted)' : '#000' }} />
              </button>
          )}
        </div>

          {/* Keyboard hints — fade in on focus */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 10,
            padding: '0 10px 6px',
            opacity: isFocused && !isWorking ? 0.7 : 0,
            transition: 'opacity 0.2s ease',
            pointerEvents: 'none',
          }}>
            <span style={{ fontSize: 9.5, color: 'var(--tx-ghost)' }}>
              <kbd style={{ fontFamily: 'var(--font-mono)', padding: '0 3px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>↵</kbd>
              {' '}send
            </span>
            <span style={{ fontSize: 9.5, color: 'var(--tx-ghost)' }}>
              <kbd style={{ fontFamily: 'var(--font-mono)', padding: '0 3px', borderRadius: 3, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>⇧↵</kbd>
              {' '}newline
            </span>
          </div>
      </div>
    </div>
  )
},
)

// ── Stop icon ──────────────────────────────────────────────────────────────────
function StopIcon() {
  return (
    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1.5" y="1.5" width="9" height="9" rx="2" fill="currentColor" />
    </svg>
  )
}

// ── Mic icon ───────────────────────────────────────────────────────────────────
function MicIcon({ active }: { active: boolean }) {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, ...(active ? { animation: 'micPulse 1s ease-in-out infinite' } : {}) }}
    >
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="21" x2="12" y2="17" />
      <line x1="8" y1="21" x2="16" y2="21" />
    </svg>
  )
}
