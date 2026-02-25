import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { Pxi } from './Pxi'

interface FilesPaneProps {
  files: WorkspaceFile[]
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function guessMime(ext: string): string {
  const map: Record<string, string> = {
    html: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    jsx: 'text/javascript',
    json: 'application/json',
    md: 'text/markdown',
    txt: 'text/plain',
    py: 'text/x-python',
    svg: 'image/svg+xml',
    csv: 'text/csv',
  }
  return map[ext] ?? 'text/plain'
}

export function FilesPane({ files }: FilesPaneProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [zipping, setZipping] = useState(false)

  const allChecked = files.length > 0 && files.every((f) => checked.has(f.name))

  function toggleAll() {
    if (allChecked) {
      setChecked(new Set())
    } else {
      setChecked(new Set(files.map((f) => f.name)))
    }
  }

  function toggle(name: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  function downloadSingle(file: WorkspaceFile) {
    const mime = guessMime(file.ext)
    const blob = new Blob([file.content], { type: mime })
    const filename = file.name.split('/').pop() ?? file.name
    downloadBlob(blob, filename)
  }

  const downloadZip = useCallback(async () => {
    const targets = files.filter((f) => checked.has(f.name))
    if (targets.length === 0) return
    setZipping(true)
    try {
      const zip = new JSZip()
      for (const f of targets) {
        zip.file(f.name, f.content)
      }
      const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' })
      downloadBlob(blob, 'workspace.zip')
    } finally {
      setZipping(false)
    }
  }, [files, checked])

  if (files.length === 0) {
    return (
      <div className="preview-empty">
        <Pxi name="folder-open" size={24} style={{ color: 'var(--tx-muted)', marginBottom: 10 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-tertiary)' }}>No files yet</span>
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>
          Agent-created files will appear here for download
        </span>
      </div>
    )
  }

  const selectedCount = checked.size

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Toolbar */}
      <div
        style={{
          padding: '7px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            style={{ accentColor: 'var(--amber)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 11, color: 'var(--tx-tertiary)' }}>
            {selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}
          </span>
        </label>

        <div style={{ flex: 1 }} />

        {selectedCount > 1 && (
          <button
            onClick={downloadZip}
            disabled={zipping}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              padding: '4px 10px',
              borderRadius: 7,
              background: 'rgba(234,179,8,0.1)',
              border: '1px solid rgba(234,179,8,0.25)',
              color: 'var(--amber)',
              fontSize: 11,
              fontWeight: 500,
              cursor: zipping ? 'wait' : 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.18)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(234,179,8,0.1)' }}
          >
            <Pxi name={zipping ? 'circle-notch' : 'download'} size={10} style={zipping ? { animation: 'spin 1s linear infinite' } : {}} />
            {zipping ? 'Zipping…' : `Download ZIP (${selectedCount})`}
          </button>
        )}
      </div>

      {/* File list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {files.map((f) => {
          const isChecked = checked.has(f.name)
          const bytes = new TextEncoder().encode(f.content).length
          return (
            <div
              key={f.name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                background: isChecked ? 'rgba(234,179,8,0.05)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isChecked) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
              }}
              onMouseLeave={(e) => {
                if (!isChecked) e.currentTarget.style.background = 'transparent'
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(f.name)}
                style={{ accentColor: 'var(--amber)', cursor: 'pointer', flexShrink: 0 }}
              />

              <Pxi name="file-alt" size={10} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />

              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--tx-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={f.name}
              >
                {f.name}
              </span>

              <span style={{ fontSize: 10, color: 'var(--tx-muted)', flexShrink: 0 }}>
                {formatBytes(bytes)}
              </span>

              <button
                onClick={() => downloadSingle(f)}
                title={`Download ${f.name}`}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--tx-tertiary)',
                  padding: 3,
                  borderRadius: 5,
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'color 0.1s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
              >
                <Pxi name="download" size={11} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Footer summary */}
      <div
        style={{
          padding: '6px 12px',
          borderTop: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
          {files.length} file{files.length !== 1 ? 's' : ''} ·{' '}
          {formatBytes(files.reduce((a, f) => a + new TextEncoder().encode(f.content).length, 0))} total
        </span>
      </div>
    </div>
  )
}
