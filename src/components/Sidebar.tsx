import { useState, useEffect, useRef, useCallback } from 'react'
import { Pxi } from './Pxi'
import { NasusLogo } from './NasusLogo'
import { useAppStore } from '../store'
import type { Task } from '../types'
import { TaskListItem } from './TaskListItem'

interface SidebarProps {
  tasks: Task[]
  activeTaskId: string | null
  onSelectTask: (id: string) => void
  onNewTask: () => void
  onOpenSettings: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function todayLabel(): string {
  return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function groupTasks(tasks: Task[]): Array<{ label: string; date: string | null; items: Task[] }> {
  const now       = new Date()
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const weekAgo   = new Date(today.getTime() - 7 * 86_400_000)

  const groups: Record<string, Task[]> = {
    Today: [], Yesterday: [], 'This week': [], Older: [],
  }

  for (const task of tasks.filter((t) => !t.pinned)) {
    const d   = new Date(task.createdAt)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if      (day >= today)     groups['Today'].push(task)
    else if (day >= yesterday) groups['Yesterday'].push(task)
    else if (day >= weekAgo)   groups['This week'].push(task)
    else                       groups['Older'].push(task)
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({
      label,
      date: label === 'Today' ? todayLabel() : null,
      items,
    }))
}

// ── Main component ────────────────────────────────────────────────────────────

export function Sidebar({ tasks, activeTaskId, onSelectTask, onNewTask, onOpenSettings }: SidebarProps) {
  const { model }                       = useAppStore()
  const [search, setSearch]             = useState('')
  const [searchOpen, setSearchOpen]     = useState(false)
  const [collapsed, setCollapsed]       = useState<Set<string>>(new Set())
  const searchRef                       = useRef<HTMLInputElement>(null)

  const pinnedTasks = tasks.filter((t) => t.pinned)
  const groups      = groupTasks(tasks)

  const q      = search.trim().toLowerCase()
  const filter = (items: Task[]) =>
    q ? items.filter((t) => t.title.toLowerCase().includes(q)) : items

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setSearchOpen(true)
        setTimeout(() => searchRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setSearchOpen(false); setSearch('') }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const toggleGroup = useCallback((label: string) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      next.has(label) ? next.delete(label) : next.add(label)
      return next
    })
  }, [])

  const shortModel = model.includes('/') ? model.split('/').pop()! : model

  const noResults =
    q &&
    groups.every(({ items }) => filter(items).length === 0) &&
    filter(pinnedTasks).length === 0

  return (
    <aside
      style={{
        width: 224,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: '#090909',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        overflow: 'hidden',
      }}
    >
      <SidebarBrand />

      <div style={{ padding: '0 10px 8px' }}>
        <NewTaskButton onClick={onNewTask} />
      </div>

      <div style={{ padding: '0 10px 10px' }}>
        <SearchBar
          open={searchOpen}
          value={search}
          inputRef={searchRef}
          onChange={setSearch}
          onOpen={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
          onClose={() => { setSearch(''); setSearchOpen(false) }}
        />
      </div>

      <div style={{ height: 1, background: 'rgba(255,255,255,0.04)', margin: '0 10px 4px' }} />

      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 8,
          scrollbarWidth: 'thin',
        }}
      >
        {tasks.length === 0 ? (
          <EmptyState onNewTask={onNewTask} />
        ) : (
          <div style={{ padding: '4px 6px 0' }}>
            {pinnedTasks.length > 0 && (
              <SidebarSection
                label="Pinned"
                badge={pinnedTasks.length}
                collapsed={collapsed.has('Pinned')}
                onToggle={() => toggleGroup('Pinned')}
                accent="amber"
              >
                {filter(pinnedTasks).map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    isActive={task.id === activeTaskId}
                    onClick={() => onSelectTask(task.id)}
                  />
                ))}
              </SidebarSection>
            )}

            {groups.map(({ label, date, items }) => {
              const filtered = filter(items)
              if (q && filtered.length === 0) return null
              return (
                <SidebarSection
                  key={label}
                  label={label}
                  date={date ?? undefined}
                  badge={items.length}
                  collapsed={collapsed.has(label)}
                  onToggle={() => toggleGroup(label)}
                >
                  {filtered.map((task) => (
                    <TaskListItem
                      key={task.id}
                      task={task}
                      isActive={task.id === activeTaskId}
                      onClick={() => onSelectTask(task.id)}
                    />
                  ))}
                </SidebarSection>
              )
            })}

            {noResults && (
              <p
                style={{
                  fontSize: 11,
                  color: 'var(--tx-tertiary)',
                  textAlign: 'center',
                  marginTop: 28,
                  lineHeight: 1.5,
                  padding: '0 12px',
                }}
              >
                No tasks match<br />
                <span style={{ color: 'var(--tx-secondary)' }}>"{search}"</span>
              </p>
            )}
          </div>
        )}
      </div>

      <SidebarFooter model={shortModel} fullModel={model} onSettings={onOpenSettings} />
    </aside>
  )
}

// ── Brand ─────────────────────────────────────────────────────────────────────

function SidebarBrand() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: '14px 14px 10px',
        userSelect: 'none',
      }}
    >
      <div style={{ position: 'relative', flexShrink: 0, lineHeight: 0 }}>
        <div
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: 8,
            background: 'radial-gradient(ellipse at 40% 50%, oklch(64% 0.214 40.1 / 0.22) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <NasusLogo size={16} fill="var(--amber)" />
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          className="font-display"
          style={{
            fontSize: 12.5,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--amber-light)',
            lineHeight: 1,
          }}
        >
          NASUS
        </span>
        <span
          style={{
            fontSize: 8.5,
            fontWeight: 500,
            letterSpacing: '0.06em',
            color: 'var(--tx-muted)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1,
          }}
        >
          v1
        </span>
      </div>
    </div>
  )
}

// ── New task button ───────────────────────────────────────────────────────────

function NewTaskButton({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        padding: '6px 10px',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'background 0.12s, border-color 0.12s, color 0.12s',
        color: hov ? 'var(--amber-soft)' : 'var(--tx-tertiary)',
        background: hov ? 'oklch(64% 0.214 40.1 / 0.07)' : 'transparent',
        border: `1px solid ${hov ? 'oklch(64% 0.214 40.1 / 0.22)' : 'rgba(255,255,255,0.07)'}`,
      }}
    >
      <Pxi name="plus" size={10} style={{ flexShrink: 0 }} />
      <span style={{ flex: 1, textAlign: 'left' }}>New task</span>
      <kbd
        style={{
          fontSize: 9,
          color: 'inherit',
          opacity: 0.55,
          fontFamily: 'inherit',
          background: 'none',
          border: 'none',
          padding: 0,
        }}
      >
        ⌘N
      </kbd>
    </button>
  )
}

// ── Search bar ────────────────────────────────────────────────────────────────

function SearchBar({
  open, value, inputRef, onChange, onOpen, onClose,
}: {
  open: boolean
  value: string
  inputRef: React.RefObject<HTMLInputElement>
  onChange: (v: string) => void
  onOpen: () => void
  onClose: () => void
}) {
  const [hov, setHov] = useState(false)

  if (open) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 9px',
          borderRadius: 7,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.11)',
        }}
      >
        <Pxi name="search" size={10} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tasks…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: 11.5,
            color: 'var(--tx-primary)',
            fontFamily: 'inherit',
          }}
          onBlur={() => { if (!value) onClose() }}
        />
        {value && (
          <button
            onClick={onClose}
            style={{
              display: 'flex', background: 'none', border: 'none',
              padding: 0, cursor: 'pointer', color: 'var(--tx-tertiary)',
            }}
          >
            <Pxi name="times" size={9} />
          </button>
        )}
      </div>
    )
  }

  return (
    <button
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '5px 9px',
        borderRadius: 7,
        background: hov ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        cursor: 'text',
        transition: 'background 0.1s, border-color 0.1s',
        fontFamily: 'inherit',
      }}
    >
      <Pxi name="search" size={10} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />
      <span style={{ fontSize: 11.5, color: 'var(--tx-muted)', flex: 1, textAlign: 'left' }}>
        Search
      </span>
      <kbd style={{ fontSize: 9, color: 'var(--tx-muted)', fontFamily: 'inherit', background: 'none', border: 'none', padding: 0 }}>
        ⌘K
      </kbd>
    </button>
  )
}

// ── Section wrapper ───────────────────────────────────────────────────────────

interface SectionProps {
  label: string
  date?: string
  badge: number
  collapsed: boolean
  onToggle: () => void
  accent?: 'amber'
  children: React.ReactNode
}

function SidebarSection({ label, date, badge, collapsed, onToggle, accent, children }: SectionProps) {
  const [hov, setHov]       = useState(false)
  const bodyRef             = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>('auto')
  const isAmber             = accent === 'amber'

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      if (!collapsed) setHeight(el.scrollHeight)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [collapsed])

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (collapsed) {
      setHeight(el.scrollHeight)
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight(0)))
    } else {
      setHeight(el.scrollHeight)
      const id = setTimeout(() => setHeight('auto'), 220)
      return () => clearTimeout(id)
    }
  }, [collapsed])

  return (
    <div style={{ marginBottom: 10 }}>

      {/* Header */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        aria-expanded={!collapsed}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 4px 4px 6px',
          borderRadius: 5,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          marginBottom: 2,
          transition: 'background 0.1s',
        }}
      >
        {/* Pinned accent pip */}
        {isAmber && (
          <span
            style={{
              width: 2,
              height: 10,
              borderRadius: 1,
              background: 'var(--amber)',
              flexShrink: 0,
              marginRight: 6,
              opacity: 0.75,
            }}
          />
        )}

        {/* Label */}
        <span
          style={{
            flex: 1,
            textAlign: 'left',
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.07em',
            textTransform: 'uppercase',
            color: isAmber
              ? 'var(--amber)'
              : hov ? 'var(--tx-tertiary)' : 'var(--tx-muted)',
            lineHeight: 1,
            userSelect: 'none',
            transition: 'color 0.1s',
          }}
        >
          {label}
        </span>

        {/* Date — Today only */}
        {date && (
          <span
            style={{
              fontSize: 9.5,
              color: hov ? 'var(--tx-tertiary)' : 'var(--tx-muted)',
              flexShrink: 0,
              marginRight: 5,
              fontVariantNumeric: 'tabular-nums',
              transition: 'color 0.1s',
            }}
          >
            {date}
          </span>
        )}

        {/* Count */}
        <span
          style={{
            fontSize: 8.5,
            fontFamily: 'var(--font-mono)',
            lineHeight: '13px',
            padding: '0 3.5px',
            borderRadius: 3,
            flexShrink: 0,
            marginRight: 4,
            color: isAmber ? 'var(--amber)' : 'var(--tx-muted)',
            background: isAmber ? 'oklch(64% 0.214 40.1 / 0.12)' : 'rgba(255,255,255,0.05)',
            transition: 'color 0.1s',
          }}
        >
          {badge}
        </span>

        {/* Chevron */}
        <span
          style={{
            display: 'flex',
            flexShrink: 0,
            color: hov ? 'var(--tx-tertiary)' : 'var(--tx-muted)',
            transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1), color 0.1s',
            transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
          }}
        >
          <Pxi name="chevron-down" size={8} />
        </span>
      </button>

      {/* Collapsible body */}
      <div
        style={{
          height: height === 'auto' ? 'auto' : height,
          overflow: 'hidden',
          transition: height === 'auto' ? 'none' : 'height 0.2s cubic-bezier(0.4,0,0.2,1)',
          visibility: collapsed && height === 0 ? 'hidden' : 'visible',
        }}
        aria-hidden={collapsed}
      >
        <div
          ref={bodyRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────

const PROVIDER_META: Record<string, { label: string; color: string }> = {
  openrouter: { label: 'OpenRouter', color: '#7c6ff7' },
  anthropic:  { label: 'Anthropic',  color: '#d4a574' },
  openai:     { label: 'OpenAI',     color: '#74b9a0' },
  google:     { label: 'Google',     color: '#7ab4f5' },
  ollama:     { label: 'Ollama',     color: '#a0b080' },
  litellm:    { label: 'LiteLLM',   color: '#9b8ec4' },
}

function SidebarFooter({ model, fullModel, onSettings }: {
  model: string
  fullModel: string
  onSettings: () => void
}) {
  const { provider }            = useAppStore()
  const [modelHov, setModelHov] = useState(false)
  const [gearHov,  setGearHov]  = useState(false)
  const meta = PROVIDER_META[provider] ?? { label: provider, color: 'var(--tx-muted)' }

  return (
    <div
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '6px 8px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2px',
        }}
      >
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 9,
            fontWeight: 600,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: meta.color,
            opacity: 0.75,
          }}
        >
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: meta.color,
              flexShrink: 0,
              boxShadow: `0 0 5px ${meta.color}88`,
            }}
          />
          {meta.label}
        </span>

        <button
          onClick={onSettings}
          onMouseEnter={() => setGearHov(true)}
          onMouseLeave={() => setGearHov(false)}
          title="Settings (⌘,)"
          style={{
            width: 22,
            height: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 5,
            border: `1px solid ${gearHov ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
            background: gearHov ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: gearHov ? 'var(--tx-secondary)' : 'var(--tx-muted)',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.1s, border-color 0.1s, color 0.1s',
          }}
        >
          <Pxi name="cog" size={11} />
        </button>
      </div>

      <button
        onClick={onSettings}
        onMouseEnter={() => setModelHov(true)}
        onMouseLeave={() => setModelHov(false)}
        title={`Model: ${fullModel}\nClick to change`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 8px',
          borderRadius: 7,
          background: modelHov ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${modelHov ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.05)'}`,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'background 0.1s, border-color 0.1s',
          textAlign: 'left',
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: `${meta.color}18`,
            border: `1px solid ${meta.color}28`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Pxi name="robot" size={9} style={{ color: meta.color }} />
        </div>
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 500,
            color: modelHov ? 'var(--tx-primary)' : 'var(--tx-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            transition: 'color 0.1s',
            letterSpacing: '-0.01em',
          }}
        >
          {model}
        </span>
        <span
          style={{
            display: 'flex',
            color: 'var(--tx-muted)',
            flexShrink: 0,
            opacity: modelHov ? 0.8 : 0.35,
            transition: 'opacity 0.1s',
          }}
        >
          <Pxi name="sort" size={9} />
        </span>
      </button>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onNewTask }: { onNewTask: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        marginTop: 40,
        padding: '0 20px',
      }}
    >
      <NasusLogo size={20} fill="rgba(255,255,255,0.06)" />
      <p style={{ fontSize: 11, color: 'var(--tx-muted)', textAlign: 'center', lineHeight: 1.5, margin: 0 }}>
        No tasks yet
      </p>
      <button
        onClick={onNewTask}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 12px',
          borderRadius: 7,
          fontSize: 11,
          fontWeight: 500,
          fontFamily: 'inherit',
          cursor: 'pointer',
          color: 'var(--amber-soft)',
          background: hov ? 'oklch(64% 0.214 40.1 / 0.12)' : 'oklch(64% 0.214 40.1 / 0.07)',
          border: `1px solid ${hov ? 'oklch(64% 0.214 40.1 / 0.30)' : 'oklch(64% 0.214 40.1 / 0.16)'}`,
          transition: 'background 0.12s, border-color 0.12s',
        }}
      >
        <Pxi name="plus" size={10} />
        Start your first task
      </button>
    </div>
  )
}
