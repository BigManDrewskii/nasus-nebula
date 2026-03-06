import { Pxi } from './Pxi'

interface ActionChip {
  label: string
  prompt: string
  icon: string
  description: string
  autoSend?: boolean
}

const chips: ActionChip[] = [
  {
    label: 'Build a website',
    prompt: 'Build me a polished HTML/CSS/JS website with a modern design. Include responsive layout, clean typography, and subtle animations. Save all files to /workspace.',
    icon: 'globe',
    description: 'HTML, CSS, JS',
    autoSend: true,
  },
  {
    label: 'Write a script',
    prompt: 'Write a Python script that ',
    icon: 'code',
    description: 'Python, Bash, JS',
    autoSend: false,
  },
  {
    label: 'Research a topic',
    prompt: 'Research the following topic thoroughly, saving findings to findings.md as you go: ',
    icon: 'search',
    description: 'Web search',
    autoSend: false,
  },
  {
    label: 'Analyze data',
    prompt: 'Analyze the following data and produce a detailed summary with insights and charts where applicable: ',
    icon: 'chart-line',
    description: 'Stats, charts',
    autoSend: false,
  },
]

interface ActionChipsProps {
  onSend: (prompt: string) => void
  onPrefill: (prompt: string) => void
}

export function ActionChips({ onSend, onPrefill }: ActionChipsProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, width: '100%' }}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => chip.autoSend ? onSend(chip.prompt) : onPrefill(chip.prompt)}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 9,
            padding: '8px 11px',
            borderRadius: 8,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.025)',
            cursor: 'pointer',
            color: 'var(--tx-secondary)',
            textAlign: 'left',
            transition: 'background 0.12s, border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(234,179,8,0.06)'
            e.currentTarget.style.borderColor = 'rgba(234,179,8,0.18)'
            e.currentTarget.style.color = 'var(--tx-primary)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.color = 'var(--tx-secondary)'
          }}
        >
          {/* Icon */}
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(234,179,8,0.08)',
            border: '1px solid rgba(234,179,8,0.14)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}>
            <Pxi name={chip.icon} size={12} style={{ color: 'var(--amber)' }} />
          </div>

          {/* Label + description */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {chip.label}
            </div>
            <div style={{ fontSize: 10, color: 'var(--tx-muted)', marginTop: 1, letterSpacing: '0.01em' }}>
              {chip.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
