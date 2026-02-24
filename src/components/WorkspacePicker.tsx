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
  const containerRef = useRef<HTMLDivElement>(null)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  // Hidden file input for browser-mode folder picking
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      // In browser mode: validate_path is unavailable — use a simple heuristic
      setValid(trimmed.length > 1)
      return
    }

    setChecking(true)
    checkTimer.current = setTimeout(async () => {
      try {
        const ok = await tauriInvoke<boolean>('validate_path', { path: trimmed })
        setValid(ok)
      } catch {
        setValid(null)
      } finally {
        setChecking(false)
      }
    }, 500)
    return () => { if (checkTimer.current) clearTimeout(checkTimer.current) }
  }, [value])

  /** Open the folder picker — uses hidden file input in all environments */
  function handleBrowse() {
    fileInputRef.current?.click()
  }

  /** Handle browser-mode folder selection via the hidden file input */
  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    // webkitRelativePath: "FolderName/subdir/file.txt" — extract top folder name
    const first = files[0]
    const rel = first.webkitRelativePath
    if (rel) {
      const folderName = rel.split('/')[0]
      // In browser mode we can't get absolute path — use the folder name as identifier
      onChange(`/${folderName}`)
    }
    // Reset so the same folder can be re-selected
    e.target.value = ''
  }

  const borderColor = error
    ? 'rgba(239,68,68,0.4)'
    : valid === true
    ? 'rgba(52,211,153,0.4)'
    : 'rgba(255,255,255,0.09)'

  const hasRecent = recentWorkspacePaths.length > 0

  return (
    <div style={{ position: 'relative' }} ref={containerRef}>
      {/* Hidden folder input for browser-mode picking */}
      <input
        ref={fileInputRef}
        type="file"
        // @ts-expect-error webkitdirectory is not in standard typings
        webkitdirectory=""
        multiple
        style={{ display: 'none' }}
        onChange={handleFileInputChange}
        tabIndex={-1}
        aria-hidden="true"
      />

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
        {/* Browse button */}
        <button
          type="button"
          onClick={handleBrowse}
          title="Browse for folder"
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
            cursor: 'pointer',
            color: 'var(--amber)',
            fontSize: 11,
            fontWeight: 500,
            transition: 'color 0.12s, background 0.12s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <Pxi name="folder-open" size={10} style={{ color: 'var(--amber)' }} />
          Browse
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
              title="Recent workspaces"
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
