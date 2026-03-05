import { useState, useMemo, memo } from 'react'
import type { OutputCardFile } from '../types'
import { Pxi } from './Pxi'

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type CardTier = 'preview' | 'code' | 'file'

const PREVIEW_EXTS = new Set(['html', 'htm'])
const CODE_EXTS = new Set([
  'js', 'jsx', 'ts', 'tsx', 'py', 'css', 'scss', 'sass',
  'sh', 'bash', 'sql', 'yaml', 'yml', 'json', 'toml', 'xml',
  'md', 'mdx', 'rs', 'go', 'rb', 'php', 'java', 'c', 'cpp',
  'h', 'cs', 'swift', 'kt', 'r', 'tf', 'dockerfile',
])
const MEMORY_FILES = new Set(['task_plan.md', 'findings.md', 'progress.md'])

function getExt(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() ?? ''
}

function getTier(filename: string): CardTier {
  const ext = getExt(filename)
  if (PREVIEW_EXTS.has(ext)) return 'preview'
  if (CODE_EXTS.has(ext)) return 'code'
  // Markdown is code tier — shown in preview-styled code block
  return 'file'
}

function isMemoryFile(filename: string): boolean {
  return MEMORY_FILES.has(filename)
}

// Should this set of files be grouped as a bundle?
function shouldBundle(files: OutputCardFile[]): boolean {
  if (files.length >= 3) return true
  // HTML + companion CSS/JS = bundle
  const hasHtml = files.some((f) => PREVIEW_EXTS.has(getExt(f.filename)))
  const hasCompanion = files.some((f) => ['css', 'js', 'ts', 'scss'].includes(getExt(f.filename)))
  return hasHtml && hasCompanion && files.length >= 2
}

// ─── File type meta ───────────────────────────────────────────────────────────

interface FileMeta { icon: string; color: string; label: string }

function fileMeta(filename: string): FileMeta {
  const ext = getExt(filename)
  switch (ext) {
    case 'html': case 'htm': return { icon: 'globe',        color: '#f97316', label: 'HTML'       }
    case 'css': case 'scss': return { icon: 'palette',      color: '#60a5fa', label: 'CSS'        }
    case 'js': case 'jsx':   return { icon: 'code',         color: '#fbbf24', label: 'JavaScript' }
    case 'ts': case 'tsx':   return { icon: 'code',         color: '#60a5fa', label: 'TypeScript' }
    case 'py':               return { icon: 'code',         color: '#4ade80', label: 'Python'     }
    case 'md': case 'mdx':   return { icon: 'file-alt',     color: '#e2e8f0', label: 'Markdown'   }
    case 'json':             return { icon: 'brackets-curly', color: '#a78bfa', label: 'JSON'     }
    case 'yaml': case 'yml': return { icon: 'file-alt',     color: '#fb923c', label: 'YAML'       }
    case 'sql':              return { icon: 'database',     color: '#34d399', label: 'SQL'        }
    case 'sh': case 'bash':  return { icon: 'bolt',         color: '#fbbf24', label: 'Shell'      }
    case 'svg':              return { icon: 'vector-square',color: '#f472b6', label: 'SVG'        }
    case 'toml':             return { icon: 'file-alt',     color: '#fb923c', label: 'TOML'       }
    case 'rs':               return { icon: 'code',         color: '#f97316', label: 'Rust'       }
    case 'go':               return { icon: 'code',         color: '#60a5fa', label: 'Go'         }
    default:                 return { icon: 'file',         color: 'var(--tx-tertiary)', label: ext.toUpperCase() || 'File' }
  }
}

// ─── Download helpers ─────────────────────────────────────────────────────────

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

async function downloadZip(files: OutputCardFile[]) {
  // Use JSZip if available, otherwise fall back to sequential downloads
  try {
    // Dynamic import — only load if actually used
    const JSZip = await import('jszip').then((m) => m.default).catch(() => null)
    if (JSZip) {
      const zip = new JSZip()
      for (const f of files) zip.file(f.filename, f.content)
      const blob = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = 'nasus-output.zip'; a.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      return
    }
  } catch { /* fall through */ }
  // Fallback: download individually
  for (const f of files) downloadFile(f.filename, f.content)
}

// ─── Copy button (local, lightweight) ────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text).catch(() => {}); setCopied(true); setTimeout(() => setCopied(false), 1500) }}
      title={copied ? 'Copied!' : 'Copy'}
      style={{
        display: 'flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', borderRadius: 5, fontSize: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
        color: copied ? '#34d399' : 'var(--tx-tertiary)',
        cursor: 'pointer', transition: 'all 0.12s',
      }}
    >
      <Pxi name={copied ? 'check' : 'copy'} size={12} />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

// ─── Base card shell ──────────────────────────────────────────────────────────

function CardShell({
  children, accent = false, style,
}: { children: React.ReactNode; accent?: boolean; style?: React.CSSProperties }) {
  return (
    <div
      className="output-card"
      style={{
        borderRadius: 12,
        overflow: 'hidden',
        border: `1px solid ${accent ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)'}`,
        background: '#0c0c0c',
        boxShadow: accent ? '0 0 0 1px rgba(251,191,36,0.06) inset' : undefined,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

// ─── Card header ──────────────────────────────────────────────────────────────

function CardHeader({
  icon, iconColor, filename, label, size, actions,
}: {
  icon: string
  iconColor: string
  filename: string
  label: string
  size: number
  actions?: React.ReactNode
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '9px 12px',
      borderBottom: '1px solid rgba(255,255,255,0.05)',
      background: 'rgba(255,255,255,0.02)',
    }}>
      {/* File type icon with subtle glow */}
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${iconColor}14`,
        border: `1px solid ${iconColor}28`,
        flexShrink: 0,
      }}>
        <Pxi name={icon} size={14} style={{ color: iconColor }} />
      </div>

      {/* Filename + type badge */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{
            fontSize: 12, fontWeight: 500, color: 'var(--tx-primary)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {filename}
          </span>
          <span style={{
            fontSize: 9, fontFamily: 'var(--font-mono)', color: iconColor,
            background: `${iconColor}14`, border: `1px solid ${iconColor}28`,
            padding: '1px 5px', borderRadius: 4, flexShrink: 0,
            textTransform: 'uppercase', letterSpacing: '0.06em',
          }}>
            {label}
          </span>
        </div>
        <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)' }}>
          {formatBytes(size)}
        </span>
      </div>

      {/* Action buttons */}
      {actions && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
          {actions}
        </div>
      )}
    </div>
  )
}

// ─── File card (Tier 1) ───────────────────────────────────────────────────────

function FileCard({ file }: { file: OutputCardFile }) {
  const meta = fileMeta(file.filename)
  return (
    <CardShell>
      <CardHeader
        icon={meta.icon}
        iconColor={meta.color}
        filename={file.filename}
        label={meta.label}
        size={file.size}
        actions={
          <>
            <CopyBtn text={file.content} />
            <button
              onClick={() => downloadFile(file.filename, file.content)}
              title="Download"
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '2px 7px', borderRadius: 5, fontSize: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--tx-tertiary)', cursor: 'pointer',
              }}
            >
              <Pxi name="download" size={12} />
              Save
            </button>
          </>
        }
      />
    </CardShell>
  )
}

// ─── Code card (Tier 2) ───────────────────────────────────────────────────────

const CodeCard = memo(function CodeCard({ file }: { file: OutputCardFile }) {
  const meta = fileMeta(file.filename)
  const [expanded, setExpanded] = useState(false)
  const lines = file.content.split('\n')
  const PREVIEW_LINES = 12
  const shown = expanded ? file.content : lines.slice(0, PREVIEW_LINES).join('\n')
  const hasMore = lines.length > PREVIEW_LINES

  return (
    <CardShell>
      <CardHeader
        icon={meta.icon}
        iconColor={meta.color}
        filename={file.filename}
        label={meta.label}
        size={file.size}
        actions={
          <>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)' }}>
              {lines.length} lines
            </span>
            <CopyBtn text={file.content} />
            <button
              onClick={() => downloadFile(file.filename, file.content)}
              title="Download"
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '2px 7px', borderRadius: 5, fontSize: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--tx-tertiary)', cursor: 'pointer',
              }}
            >
              <Pxi name="download" size={12} />
              Save
            </button>
          </>
        }
      />

      {/* Code body */}
      <div style={{ position: 'relative' }}>
        <pre style={{
          margin: 0, padding: '12px 14px',
          fontSize: 11.5, fontFamily: 'var(--font-mono)',
          lineHeight: 1.65, color: '#c8c8c8',
          overflowX: 'auto', maxHeight: expanded ? 600 : undefined,
          overflowY: expanded ? 'auto' : 'hidden',
          whiteSpace: 'pre',
          background: 'transparent',
        }}>
          <code>{shown}</code>
          {!expanded && hasMore && (
            // Fade-out gradient over last 2 lines
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 52,
              background: 'linear-gradient(to bottom, transparent, #0c0c0c)',
              pointerEvents: 'none',
            }} />
          )}
        </pre>

        {/* Expand / collapse toggle */}
        {hasMore && (
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              width: '100%', padding: '7px 0',
              background: 'rgba(255,255,255,0.03)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              border: 'none', cursor: 'pointer',
              fontSize: 10.5, color: 'var(--tx-tertiary)',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--tx-secondary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--tx-tertiary)' }}
          >
            <Pxi name={expanded ? 'chevron-up' : 'chevron-down'} size={12} />
            {expanded ? 'Collapse' : `Show all ${lines.length} lines`}
          </button>
        )}
      </div>
    </CardShell>
  )
})

// ─── Preview card (Tier 3 — HTML) ────────────────────────────────────────────

const PreviewCard = memo(function PreviewCard({ file }: { file: OutputCardFile }) {
  const meta = fileMeta(file.filename)
  const [mode, setMode] = useState<'preview' | 'code'>('preview')
  const [expanded, setExpanded] = useState(false)
  const lines = file.content.split('\n')

  // Create a blob URL for the iframe src so scripts/styles resolve correctly
  const blobUrl = useMemo(() => {
    const blob = new Blob([file.content], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [file.content])

  return (
    <CardShell accent>
      <CardHeader
        icon={meta.icon}
        iconColor={meta.color}
        filename={file.filename}
        label={meta.label}
        size={file.size}
        actions={
          <>
            {/* Mode toggle */}
            <div style={{
              display: 'flex', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)',
              overflow: 'hidden',
            }}>
              {(['preview', 'code'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '2px 8px', fontSize: 10, cursor: 'pointer', border: 'none',
                    background: mode === m ? 'rgba(251,191,36,0.15)' : 'transparent',
                    color: mode === m ? 'var(--amber-soft)' : 'var(--tx-tertiary)',
                    transition: 'all 0.12s',
                    textTransform: 'capitalize',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
            <CopyBtn text={file.content} />
            <button
              onClick={() => downloadFile(file.filename, file.content)}
              title="Download"
              style={{
                display: 'flex', alignItems: 'center', gap: 3,
                padding: '2px 7px', borderRadius: 5, fontSize: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--tx-tertiary)', cursor: 'pointer',
              }}
            >
              <Pxi name="download" size={12} />
              Save
            </button>
          </>
        }
      />

      {mode === 'preview' ? (
        <div style={{ position: 'relative' }}>
          <div
            style={{
              height: expanded ? 520 : 260,
              transition: 'height 0.2s ease',
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <iframe
              src={blobUrl}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title={file.filename}
            />
          </div>
          {/* Expand toggle */}
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              width: '100%', padding: '7px 0',
              background: 'rgba(255,255,255,0.03)',
              borderTop: '1px solid rgba(255,255,255,0.05)',
              border: 'none', cursor: 'pointer',
              fontSize: 10.5, color: 'var(--tx-tertiary)',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--tx-secondary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--tx-tertiary)' }}
          >
            <Pxi name={expanded ? 'compress' : 'expand'} size={12} />
            {expanded ? 'Collapse preview' : 'Expand preview'}
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <pre style={{
            margin: 0, padding: '12px 14px',
            fontSize: 11.5, fontFamily: 'var(--font-mono)', lineHeight: 1.65,
            color: '#c8c8c8', overflowX: 'auto', maxHeight: 400, overflowY: 'auto',
            whiteSpace: 'pre', background: 'transparent',
          }}>
            <code>{file.content}</code>
          </pre>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
            padding: '6px 12px',
            borderTop: '1px solid rgba(255,255,255,0.05)',
          }}>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)' }}>
              {lines.length} lines
            </span>
          </div>
        </div>
      )}
    </CardShell>
  )
})

// ─── Bundle card (Tier 4) ─────────────────────────────────────────────────────

const BundleCard = memo(function BundleCard({ files }: { files: OutputCardFile[] }) {
  const [expanded, setExpanded] = useState(false)
  const [activeFile, setActiveFile] = useState<OutputCardFile>(files[0])
  const totalSize = files.reduce((s, f) => s + f.size, 0)

  // Determine if there's an HTML file to preview
  const htmlFile = files.find((f) => PREVIEW_EXTS.has(getExt(f.filename)))
  const [mode, setMode] = useState<'preview' | 'files'>(htmlFile ? 'preview' : 'files')

  const blobUrl = useMemo(() => {
    if (!htmlFile) return null
    const blob = new Blob([htmlFile.content], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [htmlFile])

  return (
    <CardShell accent>
      {/* Bundle header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'rgba(255,255,255,0.02)',
      }}>
        {/* Bundle icon */}
        <div style={{
          width: 26, height: 26, borderRadius: 7, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(251,191,36,0.1)',
          border: '1px solid rgba(251,191,36,0.2)',
        }}>
          <Pxi name="folder-open" size={14} style={{ color: 'var(--amber)' }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--tx-primary)' }}>
              Output Bundle
            </span>
            <span style={{
              fontSize: 9, fontFamily: 'var(--font-mono)',
              color: 'var(--amber)', background: 'rgba(251,191,36,0.1)',
              border: '1px solid rgba(251,191,36,0.2)',
              padding: '1px 5px', borderRadius: 4,
            }}>
              {files.length} files
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)' }}>
            {formatBytes(totalSize)} total
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {/* Mode toggle — only show if there's HTML to preview */}
          {htmlFile && (
            <div style={{
              display: 'flex', borderRadius: 6,
              border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
            }}>
              {(['preview', 'files'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  style={{
                    padding: '2px 8px', fontSize: 10, cursor: 'pointer', border: 'none',
                    background: mode === m ? 'rgba(251,191,36,0.15)' : 'transparent',
                    color: mode === m ? 'var(--amber-soft)' : 'var(--tx-tertiary)',
                    transition: 'all 0.12s', textTransform: 'capitalize',
                  }}
                >
                  {m}
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => downloadZip(files)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '4px 9px', borderRadius: 6, fontSize: 10.5,
              border: '1px solid rgba(251,191,36,0.25)',
              background: 'rgba(251,191,36,0.08)',
              color: 'var(--amber-soft)', cursor: 'pointer',
              transition: 'all 0.12s', fontWeight: 500,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(251,191,36,0.08)' }}
          >
            <Pxi name="download" size={12} />
            Download all
          </button>
        </div>
      </div>

      {/* Mode: live HTML preview */}
      {mode === 'preview' && blobUrl && (
        <div style={{ position: 'relative' }}>
          <div style={{ height: expanded ? 520 : 280, transition: 'height 0.2s ease', background: '#fff', overflow: 'hidden' }}>
            <iframe
              src={blobUrl}
              sandbox="allow-scripts allow-same-origin"
              style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              title="Preview"
            />
          </div>
          <button
            onClick={() => setExpanded((e) => !e)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              width: '100%', padding: '7px 0',
              background: 'rgba(255,255,255,0.03)', borderTop: '1px solid rgba(255,255,255,0.05)',
              border: 'none', cursor: 'pointer', fontSize: 10.5, color: 'var(--tx-tertiary)',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'var(--tx-secondary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = 'var(--tx-tertiary)' }}
          >
            <Pxi name={expanded ? 'compress' : 'expand'} size={12} />
            {expanded ? 'Collapse' : 'Expand preview'}
          </button>
        </div>
      )}

      {/* Mode: file browser */}
      {mode === 'files' && (
        <div style={{ display: 'flex', minHeight: 220, maxHeight: 380 }}>
          {/* File list sidebar */}
          <div style={{
            width: 160, flexShrink: 0,
            borderRight: '1px solid rgba(255,255,255,0.05)',
            overflowY: 'auto', padding: '6px 4px',
            display: 'flex', flexDirection: 'column', gap: 1,
          }}>
            {files.map((f) => {
              const m = fileMeta(f.filename)
              const active = f.path === activeFile.path
              return (
                <button
                  key={f.path}
                  onClick={() => setActiveFile(f)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '5px 8px', borderRadius: 6, width: '100%',
                    textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: active ? 'rgba(251,191,36,0.1)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent' }}
                >
                  <Pxi name={m.icon} size={12} style={{ color: active ? 'var(--amber)' : m.color, flexShrink: 0 }} />
                  <span style={{
                    fontSize: 11, color: active ? 'var(--amber-soft)' : 'var(--tx-secondary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {f.filename}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Active file code view */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)',
              background: 'rgba(255,255,255,0.015)',
            }}>
              <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flex: 1 }}>
                {activeFile.filename}
              </span>
              <CopyBtn text={activeFile.content} />
              <button
                onClick={() => downloadFile(activeFile.filename, activeFile.content)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  padding: '2px 6px', borderRadius: 4, fontSize: 9.5,
                  border: '1px solid rgba(255,255,255,0.06)',
                  background: 'transparent', color: 'var(--tx-tertiary)', cursor: 'pointer',
                }}
              >
                <Pxi name="download" size={10} />
              </button>
            </div>
            <pre style={{
              flex: 1, margin: 0, padding: '10px 12px',
              fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.65,
              color: '#c8c8c8', overflowY: 'auto', overflowX: 'auto',
              whiteSpace: 'pre', background: 'transparent',
            }}>
              <code>{activeFile.content}</code>
            </pre>
          </div>
        </div>
      )}
    </CardShell>
  )
})

// ─── Main renderer ─────────────────────────────────────────────────────────────

export const OutputCardRenderer = memo(function OutputCardRenderer({ files }: { files: OutputCardFile[] }) {
  // Filter out memory/planning files — those are internal agent state, not deliverables
  const deliverables = files.filter((f) => !isMemoryFile(f.filename))
  if (deliverables.length === 0) return null

  // Determine if we should bundle
  const bundle = shouldBundle(deliverables)
  if (bundle) {
    return (
      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <BundleCard files={deliverables} />
      </div>
    )
  }

  return (
    <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {deliverables.map((file) => {
        const tier = getTier(file.filename)
        if (tier === 'preview') return <PreviewCard key={file.path} file={file} />
        if (tier === 'code') return <CodeCard key={file.path} file={file} />
        return <FileCard key={file.path} file={file} />
      })}
    </div>
  )
})
