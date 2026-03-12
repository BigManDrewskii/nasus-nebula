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
    streaming:      'Agent running — type to queue…',
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

  // Border driven by state
  const borderColor = (() => {
    if (inputState === 'awaiting_input') return 'rgba(234,179,8,0.55)'
    if (isFocused)                       return 'rgba(255,255,255,0.14)'
    if (inputState === 'streaming')      return 'rgba(255,255,255,0.07)'
    if (inputState === 'processing')     return 'rgba(255,255,255,0.04)'
    return 'rgba(255,255,255,0.08)'
  })()

  const boxShadow = (() => {
    if (inputState === 'awaiting_input') return '0 0 0 3px rgba(234,179,8,0.08), 0 4px 20px rgba(0,0,0,0.35)'
    if (isFocused)                       return '0 0 0 3px rgba(255,255,255,0.04), 0 4px 20px rgba(0,0,0,0.3)'
    return '0 2px 8px rgba(0,0,0,0.2)'
  })()

    return (
      <div className="uia-root">
      <div
        style={{
          borderRadius: 14,
          border: `1px solid ${borderColor}`,
          background: inputState === 'processing' ? '#101010' : '#141414',
          transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
          boxShadow,
          ...(inputState === 'awaiting_input' ? {
            borderLeft: '2px solid rgba(234,179,8,0.7)',
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
        <div className="uia-queued-wrap">
          <span className="uia-queued-banner">
            <Pxi name="clock" size={10} />
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
      <div className="uia-textarea-wrap">
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
            fontSize: 'var(--text-base)',
            color: inputState === 'processing' ? 'var(--tx-tertiary)' : 'var(--tx-primary)',
            fontStyle: inputState === 'processing' ? 'italic' : 'normal',
            lineHeight: 1.6,
            minHeight: 28,
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
      <div className="uia-toolbar">
        {/* Left: model selector + utility buttons */}
        <div className="uia-toolbar-left">
          <ModelSelectorTrigger />

          {onAddFiles && (
            <ToolbarButton
              onClick={() => fileInputRef.current?.click()}
              disabled={isTextareaDisabled}
              title="Attach files"
              aria-label="Attach files"
            >
              <Pxi name="paperclip" size={13} />
            </ToolbarButton>
          )}

          {isVoiceSupported && (
            <ToolbarButton
              onClick={toggleVoice}
              disabled={isTextareaDisabled}
              title={micActive ? 'Stop recording' : 'Voice input'}
              aria-label={micActive ? 'Stop voice input' : 'Start voice input'}
              active={micActive}
              activeColor="rgba(239,68,68,0.1)"
              activeTextColor="var(--red-fg)"
            >
              <MicIcon active={micActive} />
            </ToolbarButton>
          )}
        </div>

        {/* Right: send / stop */}
        <div className="uia-toolbar-right">
          {isWorking && onStop ? (
              <button
                onClick={onStop}
                title="Stop generating (Esc)"
                className="btn-stop-agent"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 11px',
                  borderRadius: 8,
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  background: 'rgba(239,68,68,0.07)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: 'var(--red-fg)',
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s',
                  animation: 'buttonAppear 0.15s ease',
                  flexShrink: 0,
                  letterSpacing: '0.01em',
                  fontFamily: 'inherit',
                }}
              >
              <StopIcon />
              Stop
            </button>
          ) : (
            <button
              onClick={handleSend}
              disabled={!canSend}
              title="Send (Enter)"
              aria-label="Send message"
              className="btn-send-message"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 30,
                height: 30,
                borderRadius: 8,
                border: 'none',
                cursor: !canSend ? 'not-allowed' : 'pointer',
                background: !canSend ? 'rgba(255,255,255,0.06)' : 'var(--amber)',
                color: !canSend ? 'var(--tx-muted)' : '#000',
                opacity: !canSend ? 0.4 : 1,
                transition: 'background 0.12s, transform 0.1s, opacity 0.12s',
                animation: 'buttonAppear 0.15s ease',
                flexShrink: 0,
              }}
            >
              <Pxi name="arrow-up" size={12} />
            </button>
          )}
        </div>
      </div>
    </div>

      {/* Keyboard hints */}
      <div
        className="uia-kbd-hints"
        style={{ opacity: isFocused && !isWorking ? 0.55 : 0 }}
      >
      <KbdHint shortcut="↵" label="send" />
      <KbdHint shortcut="⇧↵" label="newline" />
    </div>
  </div>
  )
},
)

// ── Shared toolbar icon button ─────────────────────────────────────────────────
function ToolbarButton({
  children, onClick, disabled, title, 'aria-label': ariaLabel,
  active = false, activeColor, activeTextColor,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled: boolean
  title?: string
  'aria-label'?: string
  active?: boolean
  activeColor?: string
  activeTextColor?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={ariaLabel}
      className="btn-attach-file"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 6,
        border: 'none',
        background: active && activeColor ? activeColor : 'transparent',
        color: active && activeTextColor ? activeTextColor : 'var(--tx-tertiary)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0,
        padding: 0,
        transition: 'color 0.12s, background 0.12s',
      }}
    >
      {children}
    </button>
  )
}

// ── Keyboard hint chip ─────────────────────────────────────────────────────────
function KbdHint({ shortcut, label }: { shortcut: string; label: string }) {
  return (
    <span className="uia-kbd-hint">
      <kbd className="uia-kbd">{shortcut}</kbd>
      <span className="uia-kbd-label">{label}</span>
    </span>
  )
}

// ── Stop icon ──────────────────────────────────────────────────────────────────
function StopIcon() {
  return (
    <svg width="8" height="8" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
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
