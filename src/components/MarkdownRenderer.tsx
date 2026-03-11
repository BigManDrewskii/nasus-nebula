/**
 * MarkdownRenderer — renders agent/user markdown with syntax-highlighted code blocks.
 *
 * Uses react-markdown v10 + remark-gfm + react-shiki/core (JS regex engine, no WASM).
 * Styled to match the existing NASUS dark-mode design system (CSS variables, not prose).
 *
 * The shiki highlighter is loaded once from the shared singleton in src/lib/shiki.ts
 * and passed to ShikiHighlighter via the `highlighter` prop so no WASM or CDN is needed.
 */

import { useEffect, useState, memo, useMemo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { HighlighterCore } from 'shiki/core'
import type { Components } from 'react-markdown'
import { ShikiHighlighter, highlighterPromise } from '../lib/shiki'
import { isInlineCode } from 'react-shiki/core'
import type { Element } from 'react-shiki/core'

// ─── Copy button ──────────────────────────────────────────────────────────────

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        })
      }}
      title={copied ? 'Copied!' : 'Copy'}
      className={`md-copy-btn${copied ? ' md-copy-btn--copied' : ''}`}
    >
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  )
}

// ─── Code block wrapper ───────────────────────────────────────────────────────

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div className="md-code-block">
      <div className="md-code-header">
        {language && <span className="md-code-lang">{language}</span>}
        <CopyBtn text={code} />
      </div>
      <div className="md-code-body">
        <ShikiHighlighter language={language || 'text'} theme="one-dark-pro" addDefaultStyles={false}>
          {code}
        </ShikiHighlighter>
      </div>
    </div>
  )
}

// ─── MarkdownRenderer ─────────────────────────────────────────────────────────

interface MarkdownRendererProps {
  content: string
}

function MarkdownRendererInner({ content }: MarkdownRendererProps) {
  const [highlighter, setHighlighter] = useState<HighlighterCore | null>(null)

  useEffect(() => {
    highlighterPromise.then(setHighlighter)
  }, [])

  const components = useMemo<Components>(() => ({
    // ── Code: inline vs block ─────────────────────────────────────────────────
    code({ className, children, node, ...props }) {
      const lang = className?.match(/language-(\w+)/)?.[1] ?? ''
      const isInline = node ? isInlineCode(node as Element) : !lang

      if (!isInline) {
        const codeText = String(children).trimEnd()
        if (highlighter) {
          return (
            <CodeBlockWithHighlighter
              language={lang}
              code={codeText}
              highlighter={highlighter}
            />
          )
        }
        return <CodeBlock language={lang} code={codeText} />
      }

      // Inline code
      return (
        <code className="md-inline-code" {...props}>
          {children}
        </code>
      )
    },

    // Strip the default <pre> wrapper
    pre({ children }) {
      return <>{children}</>
    },

    // ── Headings ──────────────────────────────────────────────────────────────
    h1({ children }) {
      return <h1 className="md-h1">{children}</h1>
    },
    h2({ children }) {
      return <h2 className="md-h2">{children}</h2>
    },
    h3({ children }) {
      return <h3 className="md-h3">{children}</h3>
    },

    // ── Paragraphs ────────────────────────────────────────────────────────────
    p({ children }) {
      return <p className="md-p">{children}</p>
    },

    // ── Lists ─────────────────────────────────────────────────────────────────
    ul({ children }) {
      return <ul className="md-ul">{children}</ul>
    },
    ol({ children }) {
      return <ol className="md-ol">{children}</ol>
    },
    li({ children, ...props }) {
      const isOrdered = 'index' in props
      return (
        <li className="md-li">
          {isOrdered
            ? (
              <span className="md-li-num">
                {(props as { index: number }).index + 1}.
              </span>
            )
            : <span className="md-li-dot" />
          }
          <span>{children}</span>
        </li>
      )
    },

    // ── Blockquote ────────────────────────────────────────────────────────────
    blockquote({ children }) {
      return <blockquote className="md-blockquote">{children}</blockquote>
    },

    // ── Horizontal rule ───────────────────────────────────────────────────────
    hr() {
      return <hr className="md-hr" />
    },

    // ── Links ─────────────────────────────────────────────────────────────────
    a({ href, children }) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className="md-link">
          {children}
        </a>
      )
    },

    // ── Strong / Em / Del ─────────────────────────────────────────────────────
    strong({ children }) {
      return <strong className="md-strong">{children}</strong>
    },
    em({ children }) {
      return <em className="md-em">{children}</em>
    },
    del({ children }) {
      return <del className="md-del">{children}</del>
    },

    // ── GFM Tables ────────────────────────────────────────────────────────────
    table({ children }) {
      return (
        <div className="md-table-wrap">
          <table className="md-table">{children}</table>
        </div>
      )
    },
    th({ children }) {
      return <th className="md-th">{children}</th>
    },
    td({ children }) {
      return <td className="md-td">{children}</td>
    },
  }), [highlighter])

  return (
    <div>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  )
}

// ─── Code block with pre-loaded highlighter ───────────────────────────────────

function CodeBlockWithHighlighter({
  language,
  code,
  highlighter,
}: {
  language: string
  code: string
  highlighter: HighlighterCore
}) {
  return (
    <div className="md-code-block">
      <div className="md-code-header">
        {language && <span className="md-code-lang">{language}</span>}
        <CopyBtn text={code} />
      </div>
      <div className="md-code-body">
        <ShikiHighlighter
          language={language || 'text'}
          theme="one-dark-pro"
          addDefaultStyles={false}
          highlighter={highlighter as unknown as import('shiki').HighlighterCore}
        >
          {code}
        </ShikiHighlighter>
      </div>
    </div>
  )
}

export const MarkdownRenderer = memo(MarkdownRendererInner)
