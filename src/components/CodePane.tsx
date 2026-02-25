import { useState } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { Pxi } from './Pxi'

interface CodePaneProps {
  files: WorkspaceFile[]
}

/** Very lightweight syntax token colorizer — covers the most common cases */
function tokenize(code: string, ext: string): string {
  // Escape HTML first
  const escaped = code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  if (['json'].includes(ext)) return colorizeJson(escaped)
  if (['md', 'markdown', 'txt'].includes(ext)) return escaped
  return colorizeCode(escaped, ext)
}

function colorizeJson(s: string): string {
  return s.replace(
    /("(?:\\.|[^"\\])*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g,
    (m, str, colon, kw, num) => {
      if (str && colon) return `<span class="tok-key">${str}</span>${colon}`
      if (str) return `<span class="tok-str">${str}</span>`
      if (kw)  return `<span class="tok-kw">${kw}</span>`
      if (num) return `<span class="tok-num">${num}</span>`
      return m
    },
  )
}

const KW_RE =
  /\b(const|let|var|function|return|if|else|for|while|class|import|export|from|default|new|this|typeof|instanceof|async|await|try|catch|throw|null|undefined|true|false|void|static|type|interface|extends|implements|public|private|protected|readonly|enum|namespace|module|require|yield|break|continue|switch|case|do|of|in|delete)\b/g

function colorizeCode(s: string, ext: string): string {
  // Strings
  let r = s.replace(/(&#x27;[^&#]*?&#x27;|&quot;[^&]*?&quot;|`[^`]*?`)/g, '<span class="tok-str">$1</span>')
  // Comments
  if (['js', 'ts', 'tsx', 'jsx', 'css', 'scss'].includes(ext)) {
    r = r.replace(/(\/\/[^\n]*)/g, '<span class="tok-comment">$1</span>')
    r = r.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="tok-comment">$1</span>')
  }
  if (['py'].includes(ext)) {
    r = r.replace(/(#[^\n]*)/g, '<span class="tok-comment">$1</span>')
  }
  if (['html', 'xml'].includes(ext)) {
    r = r
      .replace(/(&lt;\/?)(\w[\w.-]*)/g, '$1<span class="tok-tag">$2</span>')
      .replace(/(\s)([\w-]+)(=)/g, '$1<span class="tok-attr">$2</span>$3')
  } else {
    r = r.replace(KW_RE, '<span class="tok-kw">$1</span>')
    // Numbers
    r = r.replace(/\b(\d+(?:\.\d+)?)\b/g, '<span class="tok-num">$1</span>')
  }
  return r
}

const LANG_ICON: Record<string, string> = {
  html: 'code',
  css: 'code',
  js: 'code',
  ts: 'code',
  tsx: 'code',
  jsx: 'code',
  json: 'code',
  py: 'code',
  md: 'bookmark',
  txt: 'file-alt',
  svg: 'image',
  csv: 'table',
}

function fileIcon(ext: string) {
  return LANG_ICON[ext] ?? 'file'
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function CodePane({ files }: CodePaneProps) {
  const [selected, setSelected] = useState<string | null>(
    files.length > 0 ? files[0].name : null,
  )

  // Keep selection valid as file list changes
  const activeFile = files.find((f) => f.name === selected) ?? files[0] ?? null

  if (files.length === 0) {
    return (
      <div className="preview-empty">
        <Pxi name="folder-open" size={24} style={{ color: 'var(--tx-muted)', marginBottom: 10 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-tertiary)' }}>Workspace is empty</span>
        <span style={{ fontSize: 11, color: 'var(--tx-muted)', marginTop: 4 }}>
          Files the agent creates will appear here
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flex: 1, overflow: 'hidden', height: '100%' }}>
      {/* File tree */}
      <div
        style={{
          width: 180,
          flexShrink: 0,
          borderRight: '1px solid rgba(255,255,255,0.06)',
          overflowY: 'auto',
          padding: '6px 0',
        }}
      >
        {files.map((f) => {
          const isActive = f.name === activeFile?.name
          return (
            <button
              key={f.name}
              onClick={() => setSelected(f.name)}
              title={f.name}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 10px',
                background: isActive ? 'rgba(234,179,8,0.08)' : 'transparent',
                borderLeft: isActive ? '2px solid var(--amber)' : '2px solid transparent',
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = 'transparent'
              }}
            >
              <Pxi name={fileIcon(f.ext)} size={10} style={{ color: isActive ? 'var(--amber)' : 'var(--tx-tertiary)', flexShrink: 0 }} />
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: isActive ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {f.name.split('/').pop()}
              </span>
            </button>
          )
        })}
      </div>

      {/* Code viewer */}
      {activeFile ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* File meta bar */}
          <div
            style={{
              padding: '4px 12px',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)' }}>
              {activeFile.name}
            </span>
            <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
              {formatBytes(new TextEncoder().encode(activeFile.content).length)}
            </span>
            <span style={{ fontSize: 10, color: 'var(--tx-muted)' }}>
              {activeFile.content.split('\n').length} lines
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto' }}>
            <pre
              style={{
                margin: 0,
                padding: '14px 16px',
                fontFamily: 'var(--font-mono)',
                fontSize: 11.5,
                lineHeight: 1.65,
                color: 'var(--tx-secondary)',
                whiteSpace: 'pre',
                minHeight: '100%',
              }}
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: tokenize(activeFile.content, activeFile.ext) }}
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
