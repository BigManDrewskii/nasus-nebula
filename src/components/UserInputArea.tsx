import { useRef, useEffect, useImperativeHandle, forwardRef } from 'react'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'
import { AttachmentPreviewBar } from './AttachmentPreviewBar'
import type { Attachment } from '../types'

interface UserInputAreaProps {
  onSend: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  isRunning?: boolean
  queuedMsg?: string | null
  autoFocus?: boolean
  // Attachment props
  attachments?: Attachment[]
  onAddFiles?: (files: File[]) => void
  onRemoveAttachment?: (id: string) => void
  isOverLimit?: boolean
  totalAttachmentSize?: number
}

export interface UserInputAreaHandle {
  prefill: (text: string) => void
}

const STATIC_MODELS = [
  { value: 'anthropic/claude-3.5-sonnet',        label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-haiku',            label: 'Claude 3 Haiku' },
  { value: 'anthropic/claude-3.7-sonnet',         label: 'Claude 3.7 Sonnet' },
  { value: 'openai/gpt-4o',                       label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini',                  label: 'GPT-4o Mini' },
  { value: 'google/gemini-2.0-flash-001',         label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-2.5-pro-exp-03-25',     label: 'Gemini 2.5 Pro' },
  { value: 'meta-llama/llama-3.3-70b-instruct',  label: 'Llama 3.3 70B' },
  { value: 'deepseek/deepseek-r1',                label: 'DeepSeek R1' },
]

function shortLabel(modelId: string): string {
  const slash = modelId.indexOf('/')
  return slash >= 0 ? modelId.slice(slash + 1) : modelId
}

export const UserInputArea = forwardRef<UserInputAreaHandle, UserInputAreaProps>(
  function UserInputArea({
    onSend, onStop, disabled, isRunning, queuedMsg, autoFocus,
    attachments = [], onAddFiles, onRemoveAttachment, isOverLimit = false, totalAttachmentSize = 0,
  }, ref) {
    const { model, setModel, dynamicModels } = useAppStore()

    const models: Array<{ value: string; label: string }> = dynamicModels.length > 0
      ? dynamicModels.map((id) => {
          const staticEntry = STATIC_MODELS.find((m) => m.value === id)
          return { value: id, label: staticEntry?.label ?? shortLabel(id) }
        })
      : STATIC_MODELS

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const isDisabled = disabled === true
    const hasAttachments = attachments.length > 0

    useImperativeHandle(ref, () => ({
      prefill: (text: string) => {
        if (!textareaRef.current) return
        textareaRef.current.value = text
        textareaRef.current.style.height = 'auto'
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 220) + 'px'
        textareaRef.current.focus()
        const len = text.length
        textareaRef.current.setSelectionRange(len, len)
      },
    }))

    function handleSend() {
      const trimmed = textareaRef.current?.value.trim() ?? ''
      // Allow send with attachments even if no text
      if ((!trimmed && !hasAttachments) || isDisabled || isOverLimit) return
      onSend(trimmed)
      if (textareaRef.current) {
        textareaRef.current.value = ''
        textareaRef.current.style.height = 'auto'
      }
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleSend()
      }
    }

    function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
      const ta = e.target
      ta.style.height = 'auto'
      ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'
    }

    // Clipboard paste — capture image/file pastes
    function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
      if (!onAddFiles) return
      const items = Array.from(e.clipboardData.items)
      const fileItems = items.filter((item) => item.kind === 'file')
      if (fileItems.length === 0) return // let normal text paste through

      e.preventDefault()
      const files = fileItems.map((item) => {
        const file = item.getAsFile()
        if (!file) return null
        // Give clipboard images a meaningful name
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
      // Reset so the same file can be re-selected
      e.target.value = ''
    }

    useEffect(() => {
      if (autoFocus) textareaRef.current?.focus()
    }, [autoFocus])

    const placeholder = isRunning
      ? queuedMsg
        ? 'Message queued — will send when agent finishes'
        : 'Agent running — type to queue a follow-up…'
      : 'Message Nasus…'

    const canSend = !isDisabled && !isOverLimit

    return (
      <div
        style={{
          borderRadius: 16,
          border: `1px solid ${isDisabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'}`,
          background: '#131313',
          transition: 'border-color 0.15s',
        }}
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
        {isRunning && queuedMsg && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px 0' }}>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11,
                color: 'var(--amber)',
                background: 'rgba(234,179,8,0.08)',
                border: '1px solid rgba(234,179,8,0.18)',
                borderRadius: 6,
                padding: '3px 8px',
                maxWidth: '100%',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <Pxi name="clock" size={9} />
              Queued: {queuedMsg.length > 60 ? queuedMsg.slice(0, 60) + '…' : queuedMsg}
            </span>
          </div>
        )}

        {/* Attachment preview chips */}
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
        <div style={{ padding: '14px 16px 4px' }}>
          <textarea
            ref={textareaRef}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={placeholder}
            rows={1}
            disabled={isDisabled}
            style={{
              width: '100%',
              resize: 'none',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 13,
              color: 'var(--tx-primary)',
              lineHeight: 1.65,
              minHeight: 26,
              maxHeight: 220,
              fontFamily: 'inherit',
              cursor: isDisabled ? 'not-allowed' : 'text',
              opacity: isRunning && queuedMsg ? 0.4 : 1,
            }}
            className="placeholder-[var(--tx-muted)] disabled:opacity-60"
          />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 12px', gap: 8 }}>

          {/* Left: attach + model */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            {/* Attach button */}
            {onAddFiles && (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isDisabled}
                title="Attach files"
                aria-label="Attach files"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 6,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--tx-tertiary)',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'color 0.12s',
                }}
                onMouseEnter={(e) => { if (!isDisabled) e.currentTarget.style.color = 'var(--amber-soft)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
              >
                <Pxi name="paperclip" size={12} />
              </button>
            )}

            {/* Model selector */}
            <Pxi name="sparkles" size={11} style={{ flexShrink: 0, color: 'var(--tx-secondary)' }} />
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              style={{
                fontSize: 11,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                cursor: 'pointer',
                appearance: 'none',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: 130,
                color: 'var(--tx-secondary)',
                fontFamily: 'inherit',
                transition: 'color 0.12s',
              }}
              title="Select model"
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber-soft)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)' }}
            >
              {models.map((m) => (
                <option key={m.value} value={m.value} style={{ background: '#1a1a1a', color: '#ccc' }}>
                  {m.label}
                </option>
              ))}
            </select>
            <Pxi name="angle-down" size={10} style={{ color: 'var(--tx-tertiary)' }} />
          </div>

          {/* Right side: hint + send/stop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {!isRunning && !isDisabled && (
              <span style={{ fontSize: 10, userSelect: 'none', color: 'var(--tx-tertiary)' }} className="hidden sm:block">
                ↵ send · ⇧↵ newline
              </span>
            )}

            {isRunning && onStop ? (
              <button
                onClick={onStop}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.14)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
                }}
              >
                <Pxi name="times-circle" size={11} />
                Stop
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!canSend}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 28, height: 28,
                  borderRadius: 8,
                  border: 'none',
                  cursor: !canSend ? 'not-allowed' : 'pointer',
                  background: !canSend ? '#1a1a1a' : isRunning ? 'rgba(234,179,8,0.25)' : 'var(--amber)',
                  opacity: !canSend ? 0.25 : 1,
                  transition: 'background 0.12s',
                }}
                onMouseEnter={(e) => { if (canSend && !isRunning) e.currentTarget.style.background = 'var(--amber-soft)' }}
                onMouseLeave={(e) => { if (canSend && !isRunning) e.currentTarget.style.background = 'var(--amber)' }}
                title={isRunning ? 'Queue message (sends when agent finishes)' : 'Send (Enter)'}
              >
                <Pxi name={isRunning ? 'clock' : 'arrow-up'} size={12} style={{ color: !canSend ? 'var(--tx-muted)' : '#000' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  }
)
