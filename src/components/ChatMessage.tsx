import type { Message } from '../types'
import { AgentStepsView } from './AgentStepsView'
import { Pxi } from './Pxi'

// ─── Error banner ─────────────────────────────────────────────────────────────

function ErrorBanner({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div
      className="flex items-start gap-2.5 mt-2 px-3 py-2.5 rounded-xl"
      style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)' }}
    >
      <Pxi name="exclamation-triangle" size={12} style={{ color: '#f87171', flexShrink: 0, marginTop: 1 }} />
      <div className="flex-1 min-w-0">
        <p className="text-[12px] leading-relaxed" style={{ color: '#fca5a5' }}>
          {error}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="flex items-center gap-1.5 mt-2 text-[11px] font-medium px-2.5 py-1 rounded-lg transition-all"
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: '#f87171',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.35)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'
            }}
          >
            <Pxi name="refresh" size={10} />
            Retry
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Inline markdown ──────────────────────────────────────────────────────────

function inlineMarkdown(text: string, keyPrefix: string): React.ReactNode {
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|__(.+?)__|_(.+?)_|\*(.+?)\*|~~(.+?)~~|`([^`]+?)`|\[([^\]]+?)\]\(([^)]+?)\))/g
  const parts: React.ReactNode[] = []
  let last = 0
  let idx = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index))
    const full = match[0]
    const k = `${keyPrefix}-il-${idx++}`
    if (full.startsWith('***')) {
      parts.push(<strong key={k}><em>{match[2]}</em></strong>)
    } else if (full.startsWith('**') || full.startsWith('__')) {
      parts.push(<strong key={k} className="font-semibold text-white">{match[3] ?? match[4]}</strong>)
    } else if (full.startsWith('_') || full.startsWith('*')) {
      parts.push(<em key={k} className="italic text-neutral-300">{match[5] ?? match[6]}</em>)
    } else if (full.startsWith('~~')) {
      parts.push(<del key={k} className="line-through opacity-50">{match[7]}</del>)
    } else if (full.startsWith('`')) {
      parts.push(
        <code key={k} className="bg-white/[0.08] border border-white/[0.08] text-blue-300/90 text-[11.5px] font-mono px-1.5 py-[2px] rounded-md leading-none">
          {match[8]}
        </code>,
      )
    } else if (full.startsWith('[')) {
      parts.push(
        <a key={k} href={match[10]} target="_blank" rel="noopener noreferrer"
          className="text-blue-400 underline underline-offset-2 decoration-blue-500/30 hover:text-blue-300 transition-colors">
          {match[9]}
        </a>,
      )
    }
    last = match.index + full.length
  }
  if (last < text.length) parts.push(text.slice(last))
  return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : <>{parts}</>
}

// ─── Block markdown renderer ──────────────────────────────────────────────────

function renderMarkdown(text: string): React.ReactNode {
  const nodes: React.ReactNode[] = []
  let key = 0
  const k = () => `md-${key++}`

  const fencedParts = text.split(/(```[\w]*\n[\s\S]*?```)/g)

  for (const part of fencedParts) {
    if (part.startsWith('```')) {
      const rest = part.slice(3)
      const nlIdx = rest.indexOf('\n')
      const lang = nlIdx !== -1 ? rest.slice(0, nlIdx).trim() : ''
      const code = nlIdx !== -1 ? rest.slice(nlIdx + 1).replace(/```$/, '').trimEnd() : rest.replace(/```$/, '').trimEnd()
      nodes.push(
        <div key={k()} className="my-3.5 rounded-xl overflow-hidden border border-white/[0.07] bg-[#0d0d0d]">
          {lang && (
            <div className="flex items-center gap-2 px-3.5 py-2 border-b border-white/[0.05]">
              <Pxi name="code-block" size={11} style={{ color: '#444' }} />
              <span className="text-[10px] font-mono text-neutral-600 uppercase tracking-[0.1em]">{lang}</span>
            </div>
          )}
          <pre className="overflow-x-auto text-[12px] font-mono text-neutral-200 px-4 py-3.5 leading-[1.65]">
            <code>{code}</code>
          </pre>
        </div>,
      )
      continue
    }

    const lines = part.split('\n')
    let i = 0
    while (i < lines.length) {
      const line = lines[i]

      if (!line.trim()) { i++; continue }

      if (/^[-*_]{3,}\s*$/.test(line)) {
        nodes.push(<hr key={k()} className="border-white/[0.07] my-4" />)
        i++; continue
      }

      const h3 = line.match(/^###\s+(.+)/)
      const h2 = line.match(/^##\s+(.+)/)
      const h1 = line.match(/^#\s+(.+)/)
      if (h1) { nodes.push(<h1 key={k()} className="text-[15px] font-semibold text-white mt-5 mb-2 leading-snug">{inlineMarkdown(h1[1], k())}</h1>); i++; continue }
      if (h2) { nodes.push(<h2 key={k()} className="text-[14px] font-semibold text-neutral-100 mt-4 mb-1.5 leading-snug">{inlineMarkdown(h2[1], k())}</h2>); i++; continue }
      if (h3) { nodes.push(<h3 key={k()} className="text-[13px] font-medium text-neutral-200 mt-3 mb-1 leading-snug">{inlineMarkdown(h3[1], k())}</h3>); i++; continue }

      if (line.startsWith('> ')) {
        const quoteLines: string[] = []
        while (i < lines.length && lines[i].startsWith('> ')) { quoteLines.push(lines[i].slice(2)); i++ }
        nodes.push(
          <blockquote key={k()} className="border-l-[2px] border-blue-500/30 pl-3.5 my-3 space-y-1">
            {quoteLines.map((ql, qi) => (
              <p key={qi} className="text-[13px] text-neutral-400 italic leading-relaxed">{inlineMarkdown(ql, `bq-${qi}`)}</p>
            ))}
          </blockquote>,
        ); continue
      }

      if (/^[-*+]\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^[-*+]\s/.test(lines[i])) { items.push(lines[i].replace(/^[-*+]\s/, '')); i++ }
        nodes.push(
          <ul key={k()} className="my-2.5 space-y-[5px]">
            {items.map((item, ii) => (
              <li key={ii} className="flex items-baseline gap-2 text-[13px] leading-[1.7] text-neutral-200">
                <span className="mt-[0.5em] w-[3px] h-[3px] rounded-full bg-neutral-600 flex-shrink-0" />
                <span>{inlineMarkdown(item, `ul-${ii}`)}</span>
              </li>
            ))}
          </ul>,
        ); continue
      }

      if (/^\d+\.\s/.test(line)) {
        const items: string[] = []
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) { items.push(lines[i].replace(/^\d+\.\s+/, '')); i++ }
        nodes.push(
          <ol key={k()} className="my-2.5 space-y-[5px]">
            {items.map((item, ii) => (
              <li key={ii} className="flex items-baseline gap-2 text-[13px] leading-[1.7] text-neutral-200">
                <span className="text-[11px] text-neutral-600 font-mono flex-shrink-0 min-w-[16px] text-right tabular-nums">{ii + 1}.</span>
                <span>{inlineMarkdown(item, `ol-${ii}`)}</span>
              </li>
            ))}
          </ol>,
        ); continue
      }

      const paraLines: string[] = []
      while (
        i < lines.length &&
        lines[i].trim() &&
        !/^(#{1,3}\s|> |[-*+]\s|\d+\. |```|[-*_]{3,})/.test(lines[i])
      ) { paraLines.push(lines[i]); i++ }

      if (paraLines.length > 0) {
        nodes.push(
          <p key={k()} className="text-[13px] leading-[1.75] text-neutral-200 my-[3px]">
            {paraLines.map((pl, pi) => (
              <span key={pi}>
                {inlineMarkdown(pl, `p-${pi}`)}
                {pi < paraLines.length - 1 && <br />}
              </span>
            ))}
          </p>,
        )
      }
    }
  }

  return <>{nodes}</>
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function NasusAvatar() {
  return (
    <div
      className="w-[26px] h-[26px] rounded-[7px] flex-shrink-0 flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        boxShadow: '0 0 0 1px rgba(37,99,235,0.25), 0 2px 8px rgba(37,99,235,0.15)',
      }}
    >
      <span className="text-white font-bold text-[11px] tracking-tight">N</span>
    </div>
  )
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingDots() {
  return (
    <div className="flex items-center gap-[5px] h-[26px]">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="w-[5px] h-[5px] rounded-full"
          style={{
            background: '#505050',
            animation: `typing-bounce 1.2s ease-in-out ${delay}ms infinite`,
          }}
        />
      ))}
    </div>
  )
}

// ─── User bubble ──────────────────────────────────────────────────────────────

function UserBubble({ content }: { content: string }) {
  const isSimple = !content.includes('\n') && !/^[#>`\-*]/.test(content.trim())

  return (
    <div className="flex justify-end">
      <div className="max-w-[72%] min-w-0">
        <div
          className="text-neutral-100 text-[13px] leading-[1.7] px-3.5 py-2.5 rounded-[14px] rounded-tr-[4px]"
          style={{
            background: '#1c1c1e',
            border: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          {isSimple
            ? <span className="whitespace-pre-wrap">{content}</span>
            : <div className="whitespace-pre-wrap">{renderMarkdown(content)}</div>
          }
        </div>
      </div>
    </div>
  )
}

// ─── Agent message ────────────────────────────────────────────────────────────

function AgentMessage({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  const hasSteps = (message.steps?.length ?? 0) > 0
  const hasContent = message.content.trim().length > 0
  const isStreaming = message.streaming
  const hasError = !!message.error
  const isWaiting = !hasContent && !hasSteps && isStreaming && !hasError

  return (
    <div className="flex items-start gap-2.5">
      <div className="mt-[1px] flex-shrink-0">
        <NasusAvatar />
      </div>
      <div className="flex-1 min-w-0">
        {isWaiting && <TypingDots />}
        {hasSteps && <AgentStepsView steps={message.steps!} />}
        {hasContent && (
          <div className={hasSteps ? 'mt-3' : ''}>
            {renderMarkdown(message.content)}
            {isStreaming && (
              <span
                className="inline-block w-[2px] h-[13px] bg-blue-400/80 rounded-sm ml-[2px] align-middle"
                style={{ animation: 'cursor-blink 1s step-start infinite' }}
              />
            )}
          </div>
        )}
        {hasSteps && !hasContent && isStreaming && !hasError && (
          <div className="mt-2">
            <TypingDots />
          </div>
        )}
        {hasError && (
          <ErrorBanner error={message.error!} onRetry={onRetry} />
        )}
      </div>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function ChatMessage({ message, onRetry }: { message: Message; onRetry?: () => void }) {
  if (message.author === 'user') return <UserBubble content={message.content} />
  return <AgentMessage message={message} onRetry={onRetry} />
}
