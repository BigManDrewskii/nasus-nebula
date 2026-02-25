import { useMemo } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { Pxi } from './Pxi'

interface PreviewPaneProps {
  files: WorkspaceFile[]
}

/** Pick the best entry-point HTML file from the workspace */
function pickHtmlEntry(files: WorkspaceFile[]): WorkspaceFile | null {
  const priority = ['index.html', 'output.html', 'main.html']
  for (const name of priority) {
    const f = files.find((f) => f.name === name || f.name.endsWith(`/${name}`))
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

  const srcDoc = useMemo(() => {
    if (!htmlFile) return null
    return inlineAssets(htmlFile.content, files)
  }, [htmlFile, files])

  if (!htmlFile || !srcDoc) {
    return (
      <div className="preview-empty">
        <Pxi name="browser" size={24} style={{ color: 'var(--tx-muted)', marginBottom: 10 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-tertiary)' }}>
          No HTML file in workspace yet
        </span>
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>
          The agent will write an index.html when ready
        </span>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
      {/* Filename badge */}
      <div
        style={{
          padding: '4px 10px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <Pxi name="globe" size={9} style={{ color: 'var(--tx-tertiary)' }} />
        <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)' }}>
          {htmlFile.name}
        </span>
      </div>

      <iframe
        key={srcDoc}
        srcDoc={srcDoc}
        sandbox="allow-scripts allow-forms allow-modals"
        style={{
          flex: 1,
          border: 'none',
          background: '#fff',
          width: '100%',
          height: '100%',
          minHeight: 0,
        }}
        title="Preview"
      />
    </div>
  )
}
