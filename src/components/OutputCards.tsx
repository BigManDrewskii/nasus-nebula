import { useState, useMemo, memo, useRef, useEffect } from 'react'
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
  return 'file'
}

function isMemoryFile(filename: string): boolean {
  return MEMORY_FILES.has(filename)
}

function shouldBundle(files: OutputCardFile[]): boolean {
  if (files.length >= 3) return true
  const hasHtml = files.some((f) => PREVIEW_EXTS.has(getExt(f.filename)))
  const hasCompanion = files.some((f) => ['css', 'js', 'ts', 'tsx', 'jsx', 'scss'].includes(getExt(f.filename)))
  return hasHtml && hasCompanion && files.length >= 2
}

// ─── File type meta ───────────────────────────────────────────────────────────

interface FileMeta { icon: string; color: string; label: string }

function fileMeta(filename: string): FileMeta {
  const ext = getExt(filename)
  switch (ext) {
    case 'html': case 'htm': return { icon: 'globe',          color: '#f97316', label: 'HTML'       }
    case 'css': case 'scss': return { icon: 'palette',        color: '#60a5fa', label: 'CSS'        }
    case 'js': case 'jsx':   return { icon: 'code',           color: '#fbbf24', label: 'JavaScript' }
    case 'ts': case 'tsx':   return { icon: 'code',           color: '#60a5fa', label: 'TypeScript' }
    case 'py':               return { icon: 'code',           color: '#4ade80', label: 'Python'     }
    case 'md': case 'mdx':   return { icon: 'file-alt',       color: '#e2e8f0', label: 'Markdown'   }
    case 'json':             return { icon: 'brackets-curly', color: '#a78bfa', label: 'JSON'       }
    case 'yaml': case 'yml': return { icon: 'file-alt',       color: '#fb923c', label: 'YAML'       }
    case 'sql':              return { icon: 'database',       color: '#34d399', label: 'SQL'        }
    case 'sh': case 'bash':  return { icon: 'bolt',           color: '#fbbf24', label: 'Shell'      }
    case 'svg':              return { icon: 'vector-square',  color: '#f472b6', label: 'SVG'        }
    case 'toml':             return { icon: 'file-alt',       color: '#fb923c', label: 'TOML'       }
    case 'rs':               return { icon: 'code',           color: '#f97316', label: 'Rust'       }
    case 'go':               return { icon: 'code',           color: '#60a5fa', label: 'Go'         }
    default:                 return { icon: 'file',           color: 'var(--tx-tertiary)', label: ext.toUpperCase() || 'File' }
  }
}

// ─── Asset inliner ────────────────────────────────────────────────────────────
// Inlines CSS <link> and <script src> references using the bundle's own files,
// so the iframe renders with correct styles even inside a blob URL sandbox.

function inlineAssetsForBundle(html: string, files: OutputCardFile[]): string {
  const byName = new Map(files.map(f => [f.filename, f]))
  function resolve(ref: string): OutputCardFile | undefined {
    return byName.get(ref.replace(/^\.\//, ''))
  }
  let result = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi,
    (_m, href) => { const f = resolve(href); return f ? `<style>${f.content}</style>` : _m },
  )
  result = result.replace(
    /<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (_m, pre, src, post) => {
      const f = resolve(src)
      if (!f) return _m
      return `<script${(pre + post).replace(/type=["']module["']/gi, '')}>${f.content}</script>`
    },
  )
  return result
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
  try {
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
  for (const f of files) downloadFile(f.filename, f.content)
}

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).catch(() => {})
        setCopied(true)
        if (timerRef.current) clearTimeout(timerRef.current)
        timerRef.current = setTimeout(() => setCopied(false), 1500)
      }}
      title={copied ? 'Copied!' : 'Copy'}
      className="oc-action-btn"
      style={{
        background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.05)',
        color: copied ? '#34d399' : 'var(--tx-tertiary)',
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
      className="output-card oc-shell"
      style={{
        border: `1px solid ${accent ? 'rgba(251,191,36,0.18)' : 'rgba(255,255,255,0.07)'}`,
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
    <div className="flex-v-center oc-header">
      <div
        className="flex-center flex-shrink-0 oc-file-icon"
        style={{ background: `${iconColor}14`, border: `1px solid ${iconColor}28` }}
      >
        <Pxi name={icon} size={14} style={{ color: iconColor }} />
      </div>

      <div className="flex-1 oc-file-info">
        <div className="flex-v-center oc-file-name-row">
          <span className="oc-filename">{filename}</span>
          <span
            className="font-mono oc-file-type-badge"
            style={{ color: iconColor, background: `${iconColor}14`, border: `1px solid ${iconColor}28` }}
          >
            {label}
          </span>
        </div>
        <span className="text-tertiary font-mono oc-file-size">{formatBytes(size)}</span>
      </div>

      {actions && (
        <div className="flex-v-center flex-shrink-0 oc-actions">
          {actions}
        </div>
      )}
    </div>
  )
}

// ─── Shared download button ───────────────────────────────────────────────────

function DownloadBtn({ filename, content, size = 12 }: { filename: string; content: string; size?: number }) {
  return (
    <button
      onClick={() => downloadFile(filename, content)}
      title="Download"
      className="flex-v-center oc-action-btn"
    >
      <Pxi name="download" size={size} />
      Save
    </button>
  )
}

// ─── Expand / collapse toggle ─────────────────────────────────────────────────

function ExpandBtn({ expanded, label, onToggle }: { expanded: boolean; label: string; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
        className="flex-v-center justify-center oc-expand-btn hover-bg-app-3 hover-text-secondary"
    >
      <Pxi name={expanded ? 'chevron-up' : 'chevron-down'} size={12} />
      {label}
    </button>
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
            <DownloadBtn filename={file.filename} content={file.content} />
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
            <span className="font-mono oc-line-count">{lines.length} lines</span>
            <CopyBtn text={file.content} />
            <DownloadBtn filename={file.filename} content={file.content} />
          </>
        }
      />

      <div className="relative">
        <pre className="oc-pre" style={{ maxHeight: expanded ? 600 : undefined, overflowY: expanded ? 'auto' : 'hidden' }}>
          <code>{shown}</code>
          {!expanded && hasMore && (
            <div className="oc-fade-out pointer-events-none" />
          )}
        </pre>

        {hasMore && (
          <ExpandBtn
            expanded={expanded}
            label={expanded ? 'Collapse' : `Show all ${lines.length} lines`}
            onToggle={() => setExpanded((e) => !e)}
          />
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
            <ModeToggle mode={mode} setMode={setMode} options={['preview', 'code']} />
            <CopyBtn text={file.content} />
            <DownloadBtn filename={file.filename} content={file.content} />
          </>
        }
      />

      {mode === 'preview' ? (
        <div className="relative">
          <div
            className="oc-iframe-wrap"
            style={{ height: expanded ? 520 : 260 }}
          >
            <iframe
              src={blobUrl}
              sandbox="allow-scripts allow-same-origin"
              className="oc-iframe"
              title={file.filename}
            />
          </div>
          <ExpandBtn
            expanded={expanded}
            label={expanded ? 'Collapse preview' : 'Expand preview'}
            onToggle={() => setExpanded((e) => !e)}
          />
        </div>
      ) : (
        <div className="relative">
          <pre className="oc-pre oc-pre--scrollable">
            <code>{file.content}</code>
          </pre>
          <div className="flex-v-center justify-end oc-code-footer">
            <span className="font-mono oc-line-count">{lines.length} lines</span>
          </div>
        </div>
      )}
    </CardShell>
  )
})

// ─── Mode toggle ──────────────────────────────────────────────────────────────

function ModeToggle<T extends string>({
  mode, setMode, options,
}: { mode: T; setMode: (m: T) => void; options: readonly T[] }) {
  return (
    <div className="oc-mode-toggle">
      {options.map((m) => (
        <button
          key={m}
          onClick={() => setMode(m)}
          className="oc-mode-btn"
          style={{
            background: mode === m ? 'rgba(251,191,36,0.15)' : 'transparent',
            color: mode === m ? 'var(--amber-soft)' : 'var(--tx-tertiary)',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  )
}

// ─── Bundle card (Tier 4) ─────────────────────────────────────────────────────

const BundleCard = memo(function BundleCard({ files }: { files: OutputCardFile[] }) {
  const [expanded, setExpanded] = useState(false)
  const [activeFile, setActiveFile] = useState<OutputCardFile>(files[0])
  const totalSize = files.reduce((s, f) => s + f.size, 0)

  const htmlFile = files.find((f) => PREVIEW_EXTS.has(getExt(f.filename)))
  const [mode, setMode] = useState<'preview' | 'files'>(htmlFile ? 'preview' : 'files')

  const blobUrl = useMemo(() => {
    if (!htmlFile) return null
    const inlined = inlineAssetsForBundle(htmlFile.content, files)
    const blob = new Blob([inlined], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }, [htmlFile, files])

  return (
    <CardShell accent>
      {/* Bundle header */}
      <div className="flex-v-center oc-header">
        <div className="flex-center flex-shrink-0 oc-bundle-icon">
          <Pxi name="folder-open" size={14} className="text-amber" />
        </div>

        <div className="flex-1 oc-file-info">
          <div className="flex-v-center oc-file-name-row">
            <span className="oc-filename">Output Bundle</span>
            <span className="font-mono oc-bundle-count-badge">{files.length} files</span>
          </div>
          <span className="text-tertiary font-mono oc-file-size">{formatBytes(totalSize)} total</span>
        </div>

        <div className="flex-v-center oc-actions">
          {htmlFile && <ModeToggle mode={mode} setMode={setMode} options={['preview', 'files'] as const} />}
          <button
            onClick={() => downloadZip(files)}
              className="flex-v-center oc-download-all-btn hover-bg-app-3"
          >
            <Pxi name="download" size={12} />
            Download all
          </button>
        </div>
      </div>

      {/* Live HTML preview */}
      {mode === 'preview' && blobUrl && (
        <div className="relative">
          <div
            className="oc-iframe-wrap"
            style={{ height: expanded ? 520 : 280 }}
          >
            <iframe
              src={blobUrl}
              sandbox="allow-scripts allow-same-origin"
              className="oc-iframe"
              title="Preview"
            />
          </div>
          <ExpandBtn
            expanded={expanded}
            label={expanded ? 'Collapse' : 'Expand preview'}
            onToggle={() => setExpanded((e) => !e)}
          />
        </div>
      )}

      {/* File browser */}
      {mode === 'files' && (
        <div className="flex oc-file-browser">
          {/* Sidebar */}
          <div className="oc-file-sidebar">
            {files.map((f) => {
              const m = fileMeta(f.filename)
              const active = f.path === activeFile.path
              return (
                <button
                  key={f.path}
                  onClick={() => setActiveFile(f)}
                    className="flex-v-center oc-file-sidebar-btn hover-bg-app-3"
                    style={{ background: active ? 'rgba(251,191,36,0.1)' : 'transparent' }}
                >
                  <Pxi name={m.icon} size={12} style={{ color: active ? 'var(--amber)' : m.color, flexShrink: 0 }} />
                  <span
                    className="truncate oc-file-sidebar-name"
                    style={{ color: active ? 'var(--amber-soft)' : 'var(--tx-secondary)' }}
                  >
                    {f.filename}
                  </span>
                </button>
              )
            })}
          </div>

          {/* Code pane */}
          <div className="flex-1 flex-col oc-code-pane">
            <div className="flex-v-center oc-code-pane-header">
              <span className="font-mono text-tertiary flex-1 oc-code-pane-filename">{activeFile.filename}</span>
              <CopyBtn text={activeFile.content} />
              <button
                onClick={() => downloadFile(activeFile.filename, activeFile.content)}
                className="flex-v-center oc-action-btn oc-action-btn--sm"
              >
                <Pxi name="download" size={10} />
              </button>
            </div>
            <pre className="flex-1 oc-pre oc-pre--pane">
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
  const deliverables = files.filter((f) => !isMemoryFile(f.filename))
  if (deliverables.length === 0) return null

  const bundle = shouldBundle(deliverables)
  if (bundle) {
    return (
      <div className="oc-renderer">
        <BundleCard files={deliverables} />
      </div>
    )
  }

  return (
    <div className="oc-renderer">
      {deliverables.map((file) => {
        const tier = getTier(file.filename)
        if (tier === 'preview') return <PreviewCard key={file.path} file={file} />
        if (tier === 'code') return <CodeCard key={file.path} file={file} />
        return <FileCard key={file.path} file={file} />
      })}
    </div>
  )
})
