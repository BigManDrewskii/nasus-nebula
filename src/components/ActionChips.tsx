import { Pxi } from './Pxi'

interface ActionChip {
  label: string
  prompt: string
  icon: string
  description: string
  autoSend?: boolean  // true = complete prompt, fire immediately; false = prefill textarea
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
  {
    label: 'Write a document',
    prompt: 'Write a comprehensive, well-structured document about: ',
    icon: 'pen-nib',
    description: 'Markdown',
    autoSend: false,
  },
  {
    label: 'Automate a task',
    prompt: 'Automate the following task using a script or tool: ',
    icon: 'bolt',
    description: 'Scripts, APIs',
    autoSend: false,
  },
]

interface ActionChipsProps {
  onSend: (prompt: string) => void
  onPrefill: (prompt: string) => void
  centered?: boolean
}

export function ActionChips({ onSend, onPrefill, centered }: ActionChipsProps) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: centered ? 'center' : 'flex-start' }}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => chip.autoSend ? onSend(chip.prompt) : onPrefill(chip.prompt)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 12,
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'rgba(255,255,255,0.035)',
            cursor: 'pointer',
            /* Chips at rest: secondary #ababab ≈ 7.9:1 */
            color: 'var(--tx-secondary)',
            transition: 'background 0.12s, color 0.12s, border-color 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'oklch(64% 0.214 40.1 / 0.1)'
            e.currentTarget.style.color = 'var(--amber-soft)'
            e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.28)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
            e.currentTarget.style.color = 'var(--tx-secondary)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          }}
        >
          <Pxi name={chip.icon} size={14} />
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  )
}
