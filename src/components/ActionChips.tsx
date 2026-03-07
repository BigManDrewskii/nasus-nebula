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
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, width: '100%' }}>
        {chips.map((chip) => (
          <button
            key={chip.label}
            onClick={() => chip.autoSend ? onSend(chip.prompt) : onPrefill(chip.prompt)}
            className="chip-interactive"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '9px 12px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.025)',
              cursor: 'pointer',
              color: 'var(--tx-secondary)',
              textAlign: 'left',
              transition: 'background 0.12s, border-color 0.12s, color 0.12s',
            }}
          >
          {/* Icon */}
          <div style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.09)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            marginTop: 1,
          }}>
            <Pxi name={chip.icon} size={12} style={{ color: 'var(--tx-secondary)' }} />
          </div>

          {/* Label + description */}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {chip.label}
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--tx-tertiary)', marginTop: 1 }}>
              {chip.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
