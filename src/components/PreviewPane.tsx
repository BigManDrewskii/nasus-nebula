import { useMemo, useState, useEffect } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { Pxi } from './Pxi'

interface PreviewPaneProps {
  files: WorkspaceFile[]
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

  // Resolve a src/href reference to a WorkspaceFile
  function resolve(ref: string): WorkspaceFile | undefined {
    const clean = ref.replace(/^\.\//, '').replace(/^\/workspace\//, '')
    return byName.get(clean)
  }

    // Inline <link rel="stylesheet" href="...">
  let result = html.replace(
    /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["'][^>]*\/?>/gi,
    (_match, href) => {
      const f = resolve(href)
      if (!f) return _match
      return `<style>${f.content}</style>`
    },
  )

  // Inline <script src="...">
  result = result.replace(
    /<script([^>]*)src=["']([^"']+)["']([^>]*)><\/script>/gi,
    (_match, pre, src, post) => {
      const f = resolve(src)
      if (!f) return _match
      // Strip type="module" so it runs in the sandboxed iframe context
      const attrs = (pre + post).replace(/type=["']module["']/gi, '')
      return `<script${attrs}>${f.content}</script>`
    },
  )

  return result
}

export function PreviewPane({ files }: PreviewPaneProps) {
  const htmlFile = pickHtmlEntry(files)

  // Auto-refresh preview when files are modified by agent tools
  const [refreshKey, setRefreshKey] = useState(0)

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

      // Refresh preview when HTML or related assets are written/patched
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
    return inlineAssets(htmlFile.content, files)
  }, [htmlFile, files, refreshKey])

  if (!htmlFile || !srcDoc) {
    return (
      <div className="preview-empty">
        <Pxi name="browser" size={28} style={{ color: 'var(--tx-dim)', marginBottom: 12 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-secondary)', fontWeight: 500 }}>No preview yet</span>
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 6, textAlign: 'center', lineHeight: 1.5 }}>
          Ask the agent to build an HTML page<br />and it will render live here.
        </span>
      </div>
    )
  }

  return (
    <div className="output-preview-layout">
      <div className="output-pane-meta">
        <Pxi name="globe" size={10} style={{ color: 'var(--tx-tertiary)' }} />
        <span className="output-pane-meta-path">{htmlFile.name}</span>
      </div>

      <iframe
        key={srcDoc}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-forms allow-modals"
        className="output-preview-iframe"
        title="Preview"
      />
    </div>
  )
}
