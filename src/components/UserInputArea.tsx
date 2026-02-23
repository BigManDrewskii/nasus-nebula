import { useRef, useEffect } from 'react'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

interface UserInputAreaProps {
  onSend: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  autoFocus?: boolean
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

export function UserInputArea({ onSend, onStop, disabled, autoFocus }: UserInputAreaProps) {
  const { model, setModel, dynamicModels } = useAppStore()

  const models: Array<{ value: string; label: string }> = dynamicModels.length > 0
    ? dynamicModels.map((id) => {
        const staticEntry = STATIC_MODELS.find((m) => m.value === id)
        return { value: id, label: staticEntry?.label ?? shortLabel(id) }
      })
    : STATIC_MODELS

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function handleSend() {
    const trimmed = textareaRef.current?.value.trim() ?? ''
    if (!trimmed || disabled) return
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

  useEffect(() => {
    if (autoFocus) textareaRef.current?.focus()
  }, [autoFocus])

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.09)'}`,
        background: '#131313',
        transition: 'border-color 0.15s',
      }}
    >
      {/* Textarea */}
      <div style={{ padding: '14px 16px 4px' }}>
        <textarea
          ref={textareaRef}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Agent is running…' : 'Message Nasus…'}
          rows={1}
          disabled={disabled}
          style={{
            width: '100%',
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 13,
            /* Body text: primary #e2e2e2 ≈ 14.6:1 */
            color: 'var(--tx-primary)',
            lineHeight: 1.65,
            minHeight: 26,
            maxHeight: 220,
            fontFamily: 'inherit',
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          className="placeholder-[var(--tx-muted)] disabled:opacity-60"
        />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 12px 12px', gap: 8 }}>

        {/* Model selector — #ababab at rest ≈ 7.9:1 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
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
              /* secondary contrast: #ababab ≈ 7.9:1 */
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

        {/* Right side: keyboard hint + send/stop */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!disabled && (
            /* Keyboard hint: tertiary #757575 ≈ 4.6:1 — informational, passes AA */
            <span style={{ fontSize: 10, userSelect: 'none', color: 'var(--tx-tertiary)' }} className="hidden sm:block">
              ↵ send · ⇧↵ newline
            </span>
          )}

          {disabled && onStop ? (
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
              disabled={disabled}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                width: 28, height: 28,
                borderRadius: 8,
                border: 'none',
                cursor: disabled ? 'not-allowed' : 'pointer',
                background: disabled ? '#1a1a1a' : 'var(--amber)',
                opacity: disabled ? 0.25 : 1,
                transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--amber-soft)' }}
              onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = 'var(--amber)' }}
              title="Send (Enter)"
            >
              <Pxi name="arrow-up" size={12} style={{ color: disabled ? 'var(--tx-muted)' : '#000' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
