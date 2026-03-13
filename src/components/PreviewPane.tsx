import { useMemo, useState, useEffect } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { Pxi } from './Pxi'

interface PreviewPaneProps {
  files: WorkspaceFile[]
}

type ViewportMode = 'desktop' | 'tablet' | 'mobile'

const VIEWPORT_WIDTHS: Record<ViewportMode, string> = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
}

const VIEWPORT_ICONS: Record<ViewportMode, string> = {
  desktop: 'desktop',
  mobile:  'mobile',
  tablet:  'mobile',
}

/** Pick the best entry-point HTML file from the workspace */
function pickHtmlEntry(files: WorkspaceFile[]): WorkspaceFile | null {
  const priority = ['index.html', 'output.html', 'main.html']
  for (const name of priority) {
    const f = files.find((file) => file.name === name || file.name.endsWith(`/${name}`))
    if (f) return f
  }
  return files.find((f) => f.ext === 'html') ?? null
}

/**
 * Inline CSS and JS file references found in an HTML string with their
 * content from the workspace (best-effort, path-normalised).
 */
function inlineAssets(html: string, files: WorkspaceFile[]): string {
  const byName = new Map(files.map((f) => [f.name, f]))

  function resolve(ref: string): WorkspaceFile | undefined {
    const clean = ref.replace(/^\.\//, '').replace(/^\/workspace\//, '')
    return byName.get(clean)
  }

  // Strip CSP meta tags — the AI often emits <meta http-equiv="Content-Security-Policy">
  // with restrictive policies (e.g. "default-src 'self'") that block CDN scripts in the iframe.
  let result = html.replace(
    /<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*\/?>/gi,
    '',
  )

  result = result.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi,
    (_match, href) => {
      const f = resolve(href)
      if (!f) return _match
      return `<style>${f.content}</style>`
    },
  )

  result = result.replace(
    /<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (_match, pre, src, post) => {
      const f = resolve(src)
      if (!f) return _match
      const attrs = (pre + post).replace(/type=["']module["']/gi, '')
      return `<script${attrs}>${f.content}</script>`
    },
  )

  return result
}

export function PreviewPane({ files }: PreviewPaneProps) {
  const htmlFile = pickHtmlEntry(files)
  const [refreshKey, setRefreshKey] = useState(0)
  const [viewportMode, setViewportMode] = useState<ViewportMode>('desktop')

  useEffect(() => {
    const handleToolComplete = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        tool: string
        input: Record<string, unknown>
        output: string
      }>).detail

      if (!detail) return

      const { tool, input } = detail
      const path = String(input.path ?? '')

      if (tool === 'write_file' || tool === 'patch_file') {
        const isHtmlFile = path.endsWith('.html')
        const isCssFile = path.endsWith('.css')
        const isJsFile = path.endsWith('.js') || path.endsWith('.ts') || path.endsWith('.tsx')

        if (isHtmlFile || isCssFile || isJsFile) {
          setRefreshKey(k => k + 1)
        }
      }
    }

    window.addEventListener('nasus:tool-complete', handleToolComplete)
    return () => window.removeEventListener('nasus:tool-complete', handleToolComplete)
  }, [])

  const srcDoc = useMemo(() => {
    if (!htmlFile) return null
    void refreshKey
    return inlineAssets(htmlFile.content, files)
  }, [htmlFile, files, refreshKey])

  if (!htmlFile || !srcDoc) {
    return (
      <div className="preview-empty">
        <Pxi name="browser" size={28} style={{ color: 'var(--tx-dim)', marginBottom: 12 }} />
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-secondary)', fontWeight: 500 }}>No preview yet</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx-muted)', marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
          Ask the agent to build an HTML page<br />and it will render live here.
        </span>
      </div>
    )
  }

  function openInTab() {
    const tab = window.open()
    if (tab) {
      tab.document.open()
      tab.document.write(srcDoc!)
      tab.document.close()
    }
  }

  return (
    <div className="output-preview-layout">
      {/* Meta bar: file path + viewport controls + open-in-tab */}
      <div className="output-pane-meta">
        <Pxi name="globe" size={10} style={{ color: 'var(--tx-tertiary)' }} />
        <span className="output-pane-meta-path">{htmlFile.name}</span>

        <div className="preview-vp-bar">
          {(['desktop', 'tablet', 'mobile'] as ViewportMode[]).map(v => (
            <button
              key={v}
              onClick={() => setViewportMode(v)}
              className={`preview-vp-btn${viewportMode === v ? ' preview-vp-btn--active' : ''}`}
              title={v.charAt(0).toUpperCase() + v.slice(1)}
            >
              <Pxi name={VIEWPORT_ICONS[v]} size={10} />
              <span className="preview-vp-label">{v}</span>
            </button>
          ))}
        </div>

        <button
          onClick={openInTab}
          className="preview-open-btn"
          title="Open in new tab"
        >
          <Pxi name="external-link" size={10} />
          Open
        </button>
      </div>

      {/* Viewport-constrained iframe wrapper */}
      <div className="preview-viewport-wrap">
        <iframe
          key={srcDoc}
          srcDoc={srcDoc}
          sandbox="allow-scripts allow-forms allow-modals"
          className="output-preview-iframe"
          style={{ width: VIEWPORT_WIDTHS[viewportMode], maxWidth: '100%' }}
          title="Preview"
        />
      </div>
    </div>
  )
}
