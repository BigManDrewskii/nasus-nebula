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
  const [previewing, setPreviewing] = useState<string | null>(null)

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
        <Pxi name="folder-open" size={28} style={{ color: 'var(--tx-dim)', marginBottom: 12 }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-secondary)', fontWeight: 500 }}>No files yet</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx-muted)', marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
          Files the agent creates will appear here.<br />You can preview and download them.
        </span>
      </div>
    )
  }

  const selectedCount = checked.size

  return (
    <div className="output-files-layout">
      <div className="output-files-toolbar">
        <label className="output-files-select-all">
          <input
            type="checkbox"
            checked={allChecked}
            onChange={toggleAll}
            className="output-checkbox"
          />
          <span>{selectedCount > 0 ? `${selectedCount} selected` : 'Select all'}</span>
        </label>

        <div className="output-panel-spacer" />

        {selectedCount > 1 && (
          <button onClick={downloadZip} disabled={zipping} className="output-files-zip-btn">
            <Pxi
              name={zipping ? 'circle-notch' : 'download'}
              size={10}
              style={zipping ? { animation: 'spin 1s linear infinite' } : {}}
            />
            {zipping ? 'Zipping...' : `Download ZIP (${selectedCount})`}
          </button>
        )}
      </div>

      <div className="output-files-list">
        {files.map((f) => {
          const isChecked = checked.has(f.name)
          const isPreviewing = previewing === f.name
          const canPreview = ['html', 'svg'].includes(f.ext)
          const bytes = new TextEncoder().encode(f.content).length
          return (
            <div key={f.name} className={`output-file-row${isChecked ? ' output-file-row--selected' : ''}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(f.name)}
                className="output-checkbox"
              />

              <Pxi name="file-alt" size={10} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />

              <span className="output-file-row-name" title={f.name}>
                {f.name}
              </span>

              <span className="output-file-row-size">{formatBytes(bytes)}</span>

              {canPreview && (
                <button
                  onClick={() => setPreviewing(isPreviewing ? null : f.name)}
                  className={`output-file-row-preview${isPreviewing ? ' output-file-row-preview--active' : ''}`}
                  title={isPreviewing ? 'Close Preview' : 'Preview Artifact'}
                >
                  <Pxi name={isPreviewing ? 'eye-slash' : 'eye'} size={11} />
                  {isPreviewing ? 'Hide' : 'Preview'}
                </button>
              )}

              <button
                onClick={() => downloadSingle(f)}
                title={`Download ${f.name}`}
                className="output-file-row-download"
              >
                <Pxi name="download" size={11} />
              </button>

              {isPreviewing && (
                <div className="artifact-preview-container">
                  <iframe
                    srcDoc={f.content}
                    sandbox="allow-scripts allow-forms"
                    className="artifact-preview-iframe"
                    title={`Preview of ${f.name}`}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="output-files-footer">
        <span>
          {files.length} file{files.length !== 1 ? 's' : ''} ·{' '}
          {formatBytes(files.reduce((a, f) => a + new TextEncoder().encode(f.content).length, 0))} total
        </span>
      </div>
    </div>
  )
}
