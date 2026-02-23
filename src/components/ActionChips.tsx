import { Pxi } from './Pxi'

interface ActionChip {
  label: string
  prompt: string
  icon: string  // pixel icon name
  description: string
}

const chips: ActionChip[] = [
  {
    label: 'Build a website',
    prompt: 'Build me a polished HTML/CSS/JS website with a modern design. Include responsive layout, clean typography, and subtle animations. Save all files to /workspace.',
    icon: 'globe',
    description: 'HTML, CSS, JS',
  },
  {
    label: 'Write a script',
    prompt: 'Write a Python script that ',
    icon: 'code',
    description: 'Python, Bash, JS',
  },
  {
    label: 'Research a topic',
    prompt: 'Research the following topic thoroughly, saving findings to findings.md as you go: ',
    icon: 'search',
    description: 'Web search',
  },
  {
    label: 'Analyze data',
    prompt: 'Analyze the following data and produce a detailed summary with insights and charts where applicable: ',
    icon: 'chart-line',
    description: 'Stats, charts',
  },
  {
    label: 'Write a document',
    prompt: 'Write a comprehensive, well-structured document about: ',
    icon: 'pen-nib',
    description: 'Markdown',
  },
  {
    label: 'Automate a task',
    prompt: 'Automate the following task using a script or tool: ',
    icon: 'bolt',
    description: 'Scripts, APIs',
  },
]

interface ActionChipsProps {
  onSelect: (prompt: string) => void
  centered?: boolean
}

export function ActionChips({ onSelect, centered }: ActionChipsProps) {
  return (
    <div className={`flex flex-wrap gap-1.5 ${centered ? 'justify-center' : ''}`}>
      {chips.map((chip) => (
        <button
          key={chip.label}
          onClick={() => onSelect(chip.prompt)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[12px] transition-all"
          style={{
            background: 'rgba(255,255,255,0.035)',
            border: '1px solid rgba(255,255,255,0.06)',
            color: '#666',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.color = '#aaa'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.11)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
            e.currentTarget.style.color = '#666'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          <Pxi name={chip.icon} size={12} />
          <span>{chip.label}</span>
        </button>
      ))}
    </div>
  )
}
