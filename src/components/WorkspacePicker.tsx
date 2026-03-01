import { useState, useRef, useEffect } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

interface WorkspacePickerProps {
  value: string
  onChange: (path: string) => void
  error?: string
}

export function WorkspacePicker({ value, onChange, error }: WorkspacePickerProps) {
  const { recentWorkspacePaths } = useAppStore()
  const [showRecent, setShowRecent] = useState(false)
  const [checking, setChecking] = useState(false)
  const [valid, setValid] = useState<boolean | null>(null)
  const [picking, setPicking] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close recent dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowRecent(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Debounced path validation
  useEffect(() => {
    if (checkTimer.current) clearTimeout(checkTimer.current)
    const trimmed = value.trim()
    if (!trimmed || !trimmed.startsWith('/')) { setValid(null); setChecking(false); return }

    if (!isTauri) {
      setValid(trimmed.length > 1)
      return
    }

    setChecking(true)
      checkTimer.current = setTimeout(async () => {
        try {
          const ok = await tauriInvoke<boolean>('validate_path', { path: trimmed })
          setValid(ok ?? null)
        } catch {
          setValid(null)
        } finally {
          setChecking(false)
        }
      }, 500)

    return () => { if (checkTimer.current) clearTimeout(checkTimer.current) }
  }, [value])

  /** Open the native macOS folder picker via Tauri dialog plugin */
  async function handleBrowse() {
    if (!isTauri) return
    if (picking) return
    setPicking(true)
    try {
      const selected = await tauriInvoke<string | null>('pick_folder')
      if (selected) {
        onChange(selected)
      }
    } catch (err) {
      console.error('pick_folder error:', err)
    } finally {
      setPicking(false)
    }
  }

  const borderColor = error
    ? 'rgba(239,68,68,0.4)'
    : valid === true
    ? 'rgba(52,211,153,0.4)'
    : 'rgba(255,255,255,0.09)'

  const hasRecent = recentWorkspacePaths.length > 0

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: 10,
          border: `1px solid ${borderColor}`,
          background: '#0d0d0d',
          transition: 'border-color 0.12s',
          overflow: 'hidden',
        }}
      >
        {/* Browse button — opens native macOS folder picker */}
          <button
            type="button"
            onClick={handleBrowse}
            disabled={!isTauri || picking}
            title={isTauri ? 'Browse for folder' : 'Folder picker only available in the desktop app'}
            style={{
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              padding: '0 10px',
              height: 36,
              background: 'transparent',
              border: 'none',
              borderRight: '1px solid rgba(255,255,255,0.07)',
              cursor: isTauri && !picking ? 'pointer' : 'default',
              color: isTauri ? 'var(--amber)' : 'var(--tx-tertiary)',
              fontSize: 11,
              fontWeight: 500,
              transition: 'color 0.12s, background 0.12s',
              opacity: picking ? 0.6 : 1,
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => { if (isTauri && !picking) e.currentTarget.style.background = 'rgba(234,179,8,0.08)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
          >
            <Pxi name={picking ? 'spinner-third' : 'folder-open'} size={10} style={{ color: isTauri ? 'var(--amber)' : 'var(--tx-tertiary)' }} />
            {picking ? 'Opening…' : 'Browse'}
          </button>

        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setValid(null) }}
          placeholder="/Users/you/my-project"
          style={{
            flex: 1,
            padding: '8px 10px',
            fontSize: 13,
            outline: 'none',
            background: 'transparent',
            border: 'none',
            color: 'var(--tx-primary)',
            fontFamily: 'var(--font-mono)',
            minWidth: 0,
          }}
          className="placeholder-[var(--tx-muted)]"
          onFocus={(e) => { e.currentTarget.parentElement!.style.borderColor = error ? 'rgba(239,68,68,0.6)' : 'oklch(64% 0.214 40.1 / 0.5)' }}
          onBlur={(e) => { e.currentTarget.parentElement!.style.borderColor = borderColor }}
        />

        {/* Status indicator + recent dropdown trigger */}
        <div style={{ paddingRight: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
          {checking && (
            <Pxi name="spinner-third" size={11} style={{ color: 'var(--tx-tertiary)' }} />
          )}
          {!checking && valid === true && (
            <Pxi name="check-circle" size={11} style={{ color: '#34d399' }} />
          )}
          {!checking && valid === false && (
            <Pxi name="exclamation-triangle" size={11} style={{ color: '#f87171' }} />
          )}

          {hasRecent && (
            <button
              type="button"
              onClick={() => setShowRecent((o) => !o)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setShowRecent((o) => !o)
                }
              }}
              title="Recent workspaces"
              aria-label="Toggle recent workspaces"
              aria-expanded={showRecent}
              style={{
                width: 26,
                height: 26,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 6,
                border: 'none',
                background: showRecent ? 'rgba(255,255,255,0.08)' : 'transparent',
                color: showRecent ? 'var(--amber)' : 'var(--tx-tertiary)',
                cursor: 'pointer',
                transition: 'color 0.12s, background 0.12s',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber-soft)' }}
              onMouseLeave={(e) => { if (!showRecent) e.currentTarget.style.color = 'var(--tx-tertiary)' }}
            >
              <Pxi name={showRecent ? 'chevron-up' : 'chevron-down'} size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Recent paths dropdown */}
      {showRecent && hasRecent && (
        <div
          style={{
            position: 'absolute',
            zIndex: 20,
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            borderRadius: 10,
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '6px 10px 4px', fontSize: 9.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tx-tertiary)' }}>
            Recent
          </div>
          {recentWorkspacePaths.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { onChange(p); setShowRecent(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '7px 10px',
                textAlign: 'left',
                fontSize: 12,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--tx-secondary)',
                transition: 'background 0.1s',
                fontFamily: 'var(--font-mono)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
              title={p}
            >
              <Pxi name="folder" size={10} style={{ color: 'var(--amber)', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
