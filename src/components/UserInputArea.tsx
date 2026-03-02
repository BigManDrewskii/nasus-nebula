import { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'
import { AttachmentPreviewBar } from './AttachmentPreviewBar'
import type { Attachment } from '../types'
import { STATIC_MODELS, familyLabel, shortModelLabel } from '../lib/models'

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

// ── Model dropdown ─────────────────────────────────────────────────────────────
function ModelDropdown({
  value,
  onChange,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  disabled: boolean
}) {
  const { openRouterModels, modelsLastFetched, routerConfig, routingPreview } = useAppStore()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listboxRef = useRef<HTMLDivElement>(null)

  const isLive = openRouterModels.length > 0

  // Build display list: rich OR models if available, else static fallback
  const allModels: Array<{ value: string; label: string; group: string }> =
    isLive
      ? openRouterModels.map((m) => ({
          value: m.id,
          label: m.name,
          group: familyLabel(m.id),
        }))
      : STATIC_MODELS

  // Filter
  const q = search.trim().toLowerCase()
  const filtered = q
    ? allModels.filter(
        (m) => m.label.toLowerCase().includes(q) || m.value.toLowerCase().includes(q),
      )
    : allModels

  // Group
  const grouped = new Map<string, typeof allModels>()
  for (const m of filtered) {
    if (!grouped.has(m.group)) grouped.set(m.group, [])
    grouped.get(m.group)!.push(m)
  }

  // Flatten for keyboard navigation
  const flatOptions = filtered

  const selected = allModels.find((m) => m.value === value)

  // Determine display label based on routing mode and preview
  let displayLabel: string

  if (routerConfig?.mode === 'auto') {
    if (routingPreview?.displayName) {
      // Show the routing preview result
      const budgetLabel = routerConfig.budget === 'free' ? 'free' : 'paid'
      displayLabel = `Auto: ${routingPreview.displayName} (${budgetLabel})`
    } else {
      // No preview yet, show generic auto mode label
      const budgetLabel = routerConfig.budget === 'free' ? 'free' : 'paid'
      displayLabel = `Auto (${budgetLabel} models)`
    }
  } else {
    // Manual mode - show selected model
    displayLabel = selected?.label ?? shortModelLabel(value)
  }

  // Get the id of the currently focused option
  const focusedOptionId = focusedIndex >= 0 && focusedIndex < flatOptions.length
    ? `model-option-${flatOptions[focusedIndex].value.replace(/[^a-zA-Z0-9]/g, '-')}`
    : undefined

  // Reset focused index when options change
  useEffect(() => {
    setFocusedIndex(-1)
  }, [search])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
        setFocusedIndex(-1)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Focus search on open
  useEffect(() => {
    if (open) {
      setTimeout(() => searchRef.current?.focus(), 30)
      // Focus the first option after the selected one, or first option
      const selectedIndex = flatOptions.findIndex((m) => m.value === value)
      setFocusedIndex(selectedIndex >= 0 ? selectedIndex : 0)
    }
  }, [open])

  // Keyboard navigation for the trigger button
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault()
        setOpen((o) => !o)
        break
      case 'ArrowDown':
        e.preventDefault()
        if (!open) {
          setOpen(true)
        } else {
          setFocusedIndex((i) => Math.min(i + 1, flatOptions.length - 1))
        }
        break
      case 'ArrowUp':
        e.preventDefault()
        if (open) {
          setFocusedIndex((i) => Math.max(i - 1, 0))
        }
        break
      case 'Home':
        e.preventDefault()
        if (open) setFocusedIndex(0)
        break
      case 'End':
        e.preventDefault()
        if (open) setFocusedIndex(flatOptions.length - 1)
        break
      case 'Escape':
        e.preventDefault()
        setOpen(false)
        setFocusedIndex(-1)
        triggerRef.current?.focus()
        break
    }
  }

  // Select an option by index
  const selectOption = (index: number) => {
    if (index >= 0 && index < flatOptions.length) {
      onChange(flatOptions[index].value)
      setOpen(false)
      setSearch('')
      setFocusedIndex(-1)
      triggerRef.current?.focus()
    }
  }

  // Human-readable "last fetched" label
  const freshLabel = (() => {
    if (!isLive) return null
    const ageMs = Date.now() - modelsLastFetched
    if (ageMs < 60_000) return 'just now'
    if (ageMs < 3_600_000) return `${Math.round(ageMs / 60_000)}m ago`
    return `${Math.round(ageMs / 3_600_000)}h ago`
  })()

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'flex', alignItems: 'center', minWidth: 0 }}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => { if (!disabled) setOpen((o) => !o) }}
        onKeyDown={handleTriggerKeyDown}
        disabled={disabled}
        aria-label="Select model"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls="model-listbox"
        aria-activedescendant={focusedOptionId}
        id="model-dropdown-trigger"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 5,
          background: 'transparent',
          border: 'none',
          padding: '2px 4px 2px 2px',
          borderRadius: 6,
          cursor: disabled ? 'not-allowed' : 'pointer',
          color: open ? 'var(--tx-primary)' : 'var(--tx-secondary)',
          minWidth: 0,
          maxWidth: 148,
          transition: 'color 0.12s',
        }}
        onMouseEnter={(e) => { if (!disabled && !open) e.currentTarget.style.color = 'var(--amber-soft)' }}
        onMouseLeave={(e) => { if (!open) e.currentTarget.style.color = 'var(--tx-secondary)' }}
        title={routerConfig?.mode === 'auto' && routingPreview?.reason ? routingPreview.reason : value}
      >
          <span style={{
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          flex: 1,
          textAlign: 'left',
          fontWeight: 450,
          letterSpacing: '-0.01em',
        }}>
          {displayLabel}
        </span>
        <Pxi
          name="angle-down"
          size={9}
          style={{
            flexShrink: 0,
            color: 'var(--tx-tertiary)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={listboxRef}
          id="model-listbox"
          role="listbox"
          aria-labelledby="model-dropdown-trigger"
          tabIndex={-1}
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            zIndex: 100,
            width: 264,
            borderRadius: 12,
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 320,
            overflow: 'hidden',
            animation: 'dropUp 0.14s ease',
          }}
          onKeyDown={(e) => {
            switch (e.key) {
              case 'ArrowDown':
                e.preventDefault()
                setFocusedIndex((i) => Math.min(i + 1, flatOptions.length - 1))
                break
              case 'ArrowUp':
                e.preventDefault()
                setFocusedIndex((i) => Math.max(i - 1, 0))
                break
              case 'Home':
                e.preventDefault()
                setFocusedIndex(0)
                break
              case 'End':
                e.preventDefault()
                setFocusedIndex(flatOptions.length - 1)
                break
              case 'Enter':
              case ' ':
                e.preventDefault()
                if (focusedIndex >= 0) selectOption(focusedIndex)
                break
              case 'Escape':
                e.preventDefault()
                setOpen(false)
                setFocusedIndex(-1)
                triggerRef.current?.focus()
                break
            }
          }}
        >
          {/* Search bar */}
          <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 8,
              background: '#0d0d0d',
              border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Pxi name="search" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models…"
                style={{
                  flex: 1,
                  background: 'transparent',
                  border: 'none',
                  fontSize: 12,
                  color: 'var(--tx-primary)',
                  fontFamily: 'inherit',
                }}
                className="placeholder-[var(--tx-muted)]"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear model search"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', padding: 0, lineHeight: 1 }}
                >
                  <Pxi name="times" size={9} />
                </button>
              )}
            </div>
          </div>

          {/* Model list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {grouped.size === 0 ? (
              <div style={{ padding: '16px 12px', textAlign: 'center', fontSize: 12, color: 'var(--tx-tertiary)' }}>
                No models match "{search}"
              </div>
            ) : [...grouped.entries()].map(([group, models]) => (
              <div key={group}>
                {/* Group header */}
                <div style={{
                  padding: '5px 12px 3px',
                  fontSize: 9.5,
                  fontWeight: 600,
                  letterSpacing: '0.09em',
                  textTransform: 'uppercase',
                  color: 'var(--tx-tertiary)',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
                  {group}
                </div>
                  {models.map((m) => {
                    const isSel = m.value === value

                  const globalIndex = flatOptions.findIndex((opt) => opt.value === m.value)
                  const isFocused = globalIndex === focusedIndex
                  const optionId = `model-option-${m.value.replace(/[^a-zA-Z0-9]/g, '-')}`
                  return (
                    <button
                      key={m.value}
                      id={optionId}
                      type="button"
                      role="option"
                      aria-selected={isSel}
                      onClick={() => {
                        onChange(m.value)
                        setOpen(false)
                        setSearch('')
                      }}
                      onMouseEnter={() => setFocusedIndex(globalIndex)}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '6px 12px',
                        textAlign: 'left',
                        border: 'none',
                        cursor: 'pointer',
                        gap: 8,
                        fontSize: 12,
                        fontFamily: 'inherit',
                        color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                        background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : isFocused ? 'rgba(255,255,255,0.08)' : 'transparent',
                        transition: 'background 0.08s',
                      }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {m.label}
                      </span>
                      {isSel && (
                        <Pxi name="check" size={9} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer: source + freshness */}
          <div style={{
            padding: '5px 10px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0,
            gap: 6,
          }}>
            {isLive ? (
              <>
                <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>
                  {openRouterModels.length} models · OpenRouter
                </span>
                <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>
                  Updated {freshLabel}
                </span>
              </>
            ) : (
              <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>
                Curated list · add API key to load all
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
  export const UserInputArea = forwardRef<UserInputAreaHandle, UserInputAreaProps>(
    function UserInputArea({
      onSend, onStop, onContentChange, disabled, isRunning, inputState: inputStateProp, queuedMsg, autoFocus,
      attachments = [], onAddFiles, onRemoveAttachment, isOverLimit = false, totalAttachmentSize = 0,
    }, ref) {

    const { model, setModel, routerConfig, setRouterConfig } = useAppStore()

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
        textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 220) + 'px'
        textareaRef.current.focus()
        textareaRef.current.setSelectionRange(text.length, text.length)
      },
    }))

    const [isFocused, setIsFocused] = useState(false)

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
      ta.style.height = Math.min(ta.scrollHeight, 220) + 'px'
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
      if (inputState === 'streaming')      return 'rgba(234,179,8,0.22)'
      if (inputState === 'processing')     return 'rgba(255,255,255,0.05)'
      return 'rgba(255,255,255,0.09)'
    })()

    const containerStyle: React.CSSProperties = {
      borderRadius: 16,
      border: `1px solid ${borderColor}`,
      background: inputState === 'processing' ? '#0f0f0f' : '#131313',
      transition: 'border-color 0.2s, box-shadow 0.2s',
      ...(inputState === 'awaiting_input' ? {
        borderLeft: '3px solid var(--amber)',
        boxShadow: '0 0 0 2px rgba(234,179,8,0.1)',
        animation: 'inputPulse 2s ease-in-out infinite',
      } : inputState === 'streaming' ? {
        boxShadow: '0 0 0 1px rgba(234,179,8,0.08)',
      } : {}),
    }

    return (
      <div
        style={{
          ...containerStyle,
          boxShadow: isFocused ? '0 0 0 2px rgba(234,179,8,0.15), 0 8px 32px rgba(0,0,0,0.4)' : containerStyle.boxShadow,
          borderColor: isFocused ? 'rgba(234,179,8,0.4)' : borderColor,
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
          <div style={{ padding: '7px 14px 0' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              color: 'var(--amber)',
              background: 'rgba(234,179,8,0.07)',
              border: '1px solid rgba(234,179,8,0.16)',
              borderRadius: 6,
              padding: '3px 8px',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              <Pxi name="clock" size={9} />
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
        <div style={{ padding: '12px 14px 6px' }}>
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
              fontSize: 13,
              color: inputState === 'processing' ? 'var(--tx-tertiary)' : 'var(--tx-primary)',
              fontStyle: inputState === 'processing' ? 'italic' : 'normal',
              lineHeight: 1.65,
              minHeight: 26,
              maxHeight: 220,
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
          padding: '2px 10px 10px',
          gap: 8,
        }}>
          {/* Left: attach + model selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
            {/* Attach */}
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
                  width: 44,
                  height: 44,
                  borderRadius: 7,
                  border: 'none',
                  background: 'transparent',
                  color: 'var(--tx-tertiary)',
                  cursor: isTextareaDisabled ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                  padding: 0,
                  transition: 'color 0.12s, background 0.12s',
                }}
                onMouseEnter={(e) => {
                  if (!isTextareaDisabled) {
                    e.currentTarget.style.color = 'var(--tx-secondary)'
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--tx-tertiary)'
                  e.currentTarget.style.background = 'transparent'
                }}
              >
                <Pxi name="paperclip" size={12} />
              </button>
            )}

            {/* Divider */}
            <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.07)', flexShrink: 0, margin: '0 2px' }} />

            {/* Model dropdown */}
              <ModelDropdown
                value={model}
                onChange={(v) => {
                  setModel(v)
                  // Explicitly picking a model from the dropdown switches to manual mode
                  if (routerConfig.mode === 'auto') {
                    setRouterConfig({ mode: 'manual' })
                  }
                }}
                disabled={isWorking}
              />
          </div>

          {/* Right: hint + send/stop */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {isWorking ? (
              <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', userSelect: 'none', whiteSpace: 'nowrap' }} className="hidden sm:block">
                Esc to stop
              </span>
            ) : (
              <span style={{ fontSize: 10, userSelect: 'none', color: 'var(--tx-tertiary)' }} className="hidden sm:block">
                ↵ send · ⇧↵ newline
              </span>
            )}

            {/* Stop */}
            {isWorking && onStop ? (
              <button
                onClick={onStop}
                title="Stop generating (Esc)"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 10px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 500,
                  background: 'rgba(239,68,68,0.08)',
                  border: '1.5px solid rgba(239,68,68,0.28)',
                  color: '#f87171',
                  cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s, transform 0.1s',
                  animation: 'buttonAppear 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.16)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
                  e.currentTarget.style.transform = 'scale(1.04)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                  e.currentTarget.style.borderColor = 'rgba(239,68,68,0.28)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                <StopIcon />
                Stop
              </button>
            ) : (
              /* Send */
              <button
                onClick={handleSend}
                disabled={!canSend}
                title="Send (Enter)"
                aria-label="Send message"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  border: 'none',
                  cursor: !canSend ? 'not-allowed' : 'pointer',
                  background: !canSend ? 'rgba(255,255,255,0.06)' : inputState === 'awaiting_input' ? 'var(--amber)' : 'var(--amber)',
                  opacity: !canSend ? 0.3 : 1,
                  transition: 'background 0.12s, transform 0.1s, opacity 0.12s',
                  animation: 'buttonAppear 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (canSend) { e.currentTarget.style.background = 'var(--amber-soft)'; e.currentTarget.style.transform = 'scale(1.06)' } }}
                onMouseLeave={(e) => { if (canSend) { e.currentTarget.style.background = 'var(--amber)'; e.currentTarget.style.transform = 'scale(1)' } }}
              >
                <Pxi name="arrow-up" size={12} style={{ color: !canSend ? 'var(--tx-muted)' : '#000' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    )
  },
)

// ── Stop icon ──────────────────────────────────────────────────────────────────
function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
      <rect x="1" y="1" width="10" height="10" rx="2" fill="currentColor" />
    </svg>
  )
}
