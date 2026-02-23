import { useRef, useEffect } from 'react'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

interface UserInputAreaProps {
  onSend: (message: string) => void
  onStop?: () => void
  disabled?: boolean
  autoFocus?: boolean
}

const MODELS = [
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

export function UserInputArea({ onSend, onStop, disabled, autoFocus }: UserInputAreaProps) {
  const { model, setModel } = useAppStore()
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
      className="rounded-2xl border transition-colors duration-150"
      style={{
        background: '#131313',
        borderColor: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.08)',
      }}
    >
      {/* Textarea */}
      <div className="px-4 pt-3.5 pb-1">
        <textarea
          ref={textareaRef}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Agent is running…' : 'Message Nasus…'}
          rows={1}
          disabled={disabled}
          className="w-full resize-none bg-transparent text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none min-h-[26px] max-h-[220px] leading-relaxed disabled:cursor-not-allowed"
        />
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 pb-3 pt-1 gap-2">

        {/* Model selector */}
        <div className="flex items-center gap-1.5 min-w-0">
          <Pxi name="sparkles" size={11} className="flex-shrink-0" style={{ color: '#3a3a3a' }} />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="text-[11px] bg-transparent focus:outline-none cursor-pointer appearance-none truncate max-w-[130px]"
            style={{ color: '#3a3a3a' }}
            title="Select model"
            onMouseEnter={(e) => { e.currentTarget.style.color = '#777' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#3a3a3a' }}
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value} style={{ background: '#1a1a1a', color: '#ccc' }}>
                {m.label}
              </option>
            ))}
          </select>
          <Pxi name="angle-down" size={10} style={{ color: '#2a2a2a' }} />
        </div>

        {/* Right side: hint + send/stop */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {!disabled && (
            <span className="text-[10px] select-none hidden sm:block" style={{ color: '#2a2a2a' }}>
              ↵ send · ⇧↵ newline
            </span>
          )}

          {disabled && onStop ? (
            <button
              onClick={onStop}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all"
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
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
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              style={{
                background: disabled ? '#1a1a1a' : '#2563eb',
              }}
              onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.background = '#3b82f6' }}
              onMouseLeave={(e) => { if (!disabled) e.currentTarget.style.background = '#2563eb' }}
              title="Send (Enter)"
            >
              <Pxi name="arrow-up" size={12} style={{ color: 'white' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
