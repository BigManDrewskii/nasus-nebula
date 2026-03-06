/**
 * MarkdownRenderer — renders agent/user markdown with syntax-highlighted code blocks.
 *
 * Uses react-markdown v10 + remark-gfm + react-shiki/core (JS regex engine, no WASM).
 * Styled to match the existing NASUS dark-mode design system (CSS variables, not prose).
 *
 * The shiki highlighter is loaded once from the shared singleton in src/lib/shiki.ts
 * and passed to ShikiHighlighter via the `highlighter` prop so no WASM or CDN is needed.
 */

import { useEffect, useState, memo } from 'react'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { HighlighterCore } from 'shiki/core'
import type { Components } from 'react-markdown'
import { ShikiHighlighter, highlighterPromise } from '../lib/shiki'
import { isInlineCode } from 'react-shiki/core'
import type { Element } from 'react-shiki/core'

// ─── Copy button (reused from ChatMessage) ────────────────────────────────────

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
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '3px 7px',
        borderRadius: 6,
        fontSize: 10,
        border: '1px solid rgba(255,255,255,0.08)',
        background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.06)',
        color: copied ? '#34d399' : 'var(--tx-tertiary)',
        cursor: 'pointer',
        transition: 'background 0.12s, color 0.12s',
        whiteSpace: 'nowrap',
        flexShrink: 0,
      }}
    >
      {copied ? '✓ Copied!' : 'Copy'}
    </button>
  )
}

// ─── Code block wrapper with language badge + copy button ─────────────────────

function CodeBlock({ language, code }: { language: string; code: string }) {
  return (
    <div
      style={{
        margin: '14px 0',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: '7px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {language && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {language}
          </span>
        )}
        <CopyBtn text={code} />
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.65 }}>
        {/* ShikiHighlighter renders the code with syntax colouring */}
        {/* addDefaultStyles=false — we control the wrapper above */}
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

  const components: Components = {
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
        // Fallback while highlighter loads — plain styled pre
        return <CodeBlock language={lang} code={codeText} />
      }

      // Inline code
      return (
        <code
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--amber-soft)',
            fontSize: '0.8em',
            fontFamily: 'var(--font-mono)',
            padding: '1px 5px',
            borderRadius: 4,
            lineHeight: 1,
          }}
          {...props}
        >
          {children}
        </code>
      )
    },

    // Strip the default <pre> wrapper — CodeBlock provides its own
    pre({ children }) {
      return <>{children}</>
    },

    // ── Headings ──────────────────────────────────────────────────────────────
    h1({ children }) {
      return (
        <h1 style={{ fontSize: 16, fontWeight: 600, color: '#ffffff', marginTop: 20, marginBottom: 6, lineHeight: 1.35 }}>
          {children}
        </h1>
      )
    },
    h2({ children }) {
      return (
        <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-primary)', marginTop: 16, marginBottom: 4, lineHeight: 1.35 }}>
          {children}
        </h2>
      )
    },
    h3({ children }) {
      return (
        <h3 style={{ fontSize: 13, fontWeight: 500, color: 'var(--tx-primary)', marginTop: 12, marginBottom: 4, lineHeight: 1.35 }}>
          {children}
        </h3>
      )
    },

    // ── Paragraphs ────────────────────────────────────────────────────────────
    p({ children }) {
      return (
        <p style={{ fontSize: 13, lineHeight: 1.8, color: 'var(--tx-secondary)', margin: '0 0 8px 0' }}>
          {children}
        </p>
      )
    },

    // ── Lists ─────────────────────────────────────────────────────────────────
    ul({ children }) {
      return (
        <ul style={{ margin: '10px 0', listStyle: 'none', padding: 0 }}>
          {children}
        </ul>
      )
    },
    ol({ children }) {
      return (
        <ol style={{ margin: '10px 0', listStyle: 'none', padding: 0, counterReset: 'md-list' }}>
          {children}
        </ol>
      )
    },
    li({ children, ...props }) {
      // Detect ordered vs unordered via parent context — use data attribute trick
      const isOrdered = 'index' in props
      return (
        <li
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 8,
            fontSize: 13,
            lineHeight: 1.75,
            color: 'var(--tx-secondary)',
          }}
        >
          {isOrdered
            ? (
              <span
                style={{
                  fontSize: 11,
                  fontFamily: 'var(--font-mono)',
                  color: 'var(--tx-tertiary)',
                  flexShrink: 0,
                  minWidth: 16,
                  textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {(props as { index: number }).index + 1}.
              </span>
            )
            : (
              <span
                style={{
                  marginTop: '0.5em',
                  width: 4,
                  height: 4,
                  borderRadius: '50%',
                  background: 'var(--amber)',
                  flexShrink: 0,
                }}
              />
            )
          }
          <span>{children}</span>
        </li>
      )
    },

    // ── Blockquote ────────────────────────────────────────────────────────────
    blockquote({ children }) {
      return (
        <blockquote style={{ borderLeft: '2px solid oklch(64% 0.214 40.1 / 0.45)', paddingLeft: 14, margin: '12px 0' }}>
          {children}
        </blockquote>
      )
    },

    // ── Horizontal rule ───────────────────────────────────────────────────────
    hr() {
      return <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '16px 0' }} />
    },

    // ── Links ─────────────────────────────────────────────────────────────────
    a({ href, children }) {
      return (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          {children}
        </a>
      )
    },

    // ── Strong / Em / Del ─────────────────────────────────────────────────────
    strong({ children }) {
      return <strong style={{ fontWeight: 600, color: '#ffffff' }}>{children}</strong>
    },
    em({ children }) {
      return <em style={{ fontStyle: 'italic', color: 'var(--tx-primary)' }}>{children}</em>
    },
    del({ children }) {
      return <del style={{ textDecoration: 'line-through', opacity: 0.55 }}>{children}</del>
    },

    // ── GFM Tables ────────────────────────────────────────────────────────────
    table({ children }) {
      return (
        <div style={{ overflowX: 'auto', margin: '12px 0' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            {children}
          </table>
        </div>
      )
    },
    th({ children }) {
      return (
        <th
          style={{
            padding: '6px 10px',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: 11,
            color: 'var(--tx-tertiary)',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap',
          }}
        >
          {children}
        </th>
      )
    },
    td({ children }) {
      return (
        <td
          style={{
            padding: '5px 10px',
            color: 'var(--tx-secondary)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
          }}
        >
          {children}
        </td>
      )
    },
  }

  return (
    <div>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  )
}

// ─── Code block that uses the pre-loaded highlighter instance ─────────────────

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
    <div
      style={{
        margin: '14px 0',
        borderRadius: 12,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.07)',
        background: '#0a0a0a',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 6,
          padding: '7px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        {language && (
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--tx-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            {language}
          </span>
        )}
        <CopyBtn text={code} />
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.65 }}>
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
