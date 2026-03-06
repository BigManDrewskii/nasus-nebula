import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { Pxi } from './Pxi'
import { NasusLogo } from './NasusLogo'
import type { Task } from '../types'
import { useAppStore } from '../store'
import { TaskListItem } from './TaskListItem'
import { SidebarEmptyState } from './sidebar/SidebarComponents'

interface SidebarProps {
  tasks: Task[]
  activeTaskId: string | null
  onSelectTask: (id: string) => void
  onNewTask: () => void
  onOpenSettings: () => void
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupTasks(tasks: Task[]): Array<{ label: string; date: string | null; items: Task[] }> {
  const now       = new Date()
  const todayStr  = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  const today     = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86_400_000)
  const weekAgo   = new Date(today.getTime() - 7 * 86_400_000)

  const groups: Record<string, Task[]> = {
    Today: [], Yesterday: [], 'This week': [], Older: [],
  }

  for (const task of tasks.filter((t) => !t.pinned)) {
    // createdAt is a Date at runtime but may be a string after zustand rehydration from JSON
    const d = new Date(task.createdAt)
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
      date: label === 'Today' ? todayStr : null,
      items,
    }))
}

// ── Main component ────────────────────────────────────────────────────────────

export function Sidebar({ tasks, activeTaskId, onSelectTask, onNewTask, onOpenSettings }: SidebarProps) {
  const [search, setSearch]         = useState('')
  const [searchOpen, setSearchOpen] = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const searchRef                   = useRef<HTMLInputElement>(null)

  const pinnedTasks = useMemo(() => tasks.filter((t) => t.pinned), [tasks])
  const groups      = useMemo(() => groupTasks(tasks), [tasks])

  const q      = search.trim().toLowerCase()
  const filter = useCallback((items: Task[]) =>
    q ? items.filter((t) => t.title.toLowerCase().includes(q)) : items,
  [q])

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
    setCollapsedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(label)) { next.delete(label) } else { next.add(label) }
      return next
    })
  }, [])

  const noResults =
    q &&
    groups.every(({ items }) => filter(items).length === 0) &&
    filter(pinnedTasks).length === 0

    return (
      <aside
        className="sidebar"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          width: '100%',
          background: '#090909',
          borderRight: '1px solid rgba(255,255,255,0.05)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* ── Expanded full sidebar ── */}
        <SidebarBrand />

        <div style={{ padding: '0 var(--space-2-5) var(--space-2)' }}>
          <NewTaskButton onClick={onNewTask} />
        </div>

        <div style={{ padding: '0 var(--space-2-5) var(--space-2-5)' }}>
          <SearchBar
            open={searchOpen}
            value={search}
            inputRef={searchRef}
            onChange={setSearch}
            onOpen={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
            onClose={() => { setSearch(''); setSearchOpen(false) }}
          />
        </div>

        <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '0 var(--space-2-5) var(--space-1)' }} />

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            paddingBottom: 'var(--space-2)',
            scrollbarWidth: 'thin',
          }}
        >
          {tasks.length === 0 ? (
            <SidebarEmptyState
              icon="sparkles"
              title="No tasks yet"
              subtitle="Create your first task to get started"
              action={{ label: 'New task', onClick: onNewTask }}
            />
          ) : (
            <div style={{ padding: 'var(--space-1) var(--space-2-5) 0' }}>
                {pinnedTasks.length > 0 && (
                  <SidebarSection
                    label="Pinned"
                    badge={pinnedTasks.length}
                    collapsed={collapsedGroups.has('Pinned')}
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
                    collapsed={collapsedGroups.has(label)}
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

          <SidebarFooter onSettings={onOpenSettings} />
      </aside>
    )
}

// ── Brand ─────────────────────────────────────────────────────────────────────

// Traffic lights (Close/Minimise/Maximise) on macOS sit at x:16 y:16.
// When running inside Tauri with titleBarStyle:Overlay we need ~76px left padding
// to clear them.
function SidebarBrand() {
  return (
    <div
      data-tauri-drag-region
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2-5)',
        padding: 'var(--space-2-5) var(--space-3-5) var(--space-2-5)',
        userSelect: 'none',
        background: 'linear-gradient(to bottom, rgba(255,255,255,0.03) 0%, transparent 100%)',
      }}
    >
        <div style={{ position: 'relative', flexShrink: 0, lineHeight: 0 }}>
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 10,
              background: 'radial-gradient(ellipse at 40% 50%, oklch(64% 0.214 40.1 / 0.3) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <NasusLogo size={22} fill="var(--amber)" />
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-1-5)', flex: 1 }}>
          <span
            className="font-display"
            style={{
              fontSize: 12.5,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: 'var(--amber-light)',
              lineHeight: 1,
              textShadow: '0 0 12px oklch(64% 0.214 40.1 / 0.3)',
            }}
          >
            NASUS
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
        gap: 'var(--space-1-5)',
        padding: 'var(--space-1-5) var(--space-2-5)',
        borderRadius: 8,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: 'inherit',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        color: hov ? 'var(--amber-light)' : 'var(--tx-tertiary)',
        background: hov ? 'oklch(64% 0.214 40.1 / 0.09)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? 'oklch(64% 0.214 40.1 / 0.35)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hov ? '0 0 16px oklch(64% 0.214 40.1 / 0.12)' : 'none',
      }}
    >
        <Pxi name="plus" size={12} style={{ flexShrink: 0, transform: hov ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        <span style={{ flex: 1, textAlign: 'left', letterSpacing: '0.01em' }}>New task</span>
        <kbd
          style={{
            fontSize: 9,
            color: 'inherit',
            opacity: 0.55,
            fontFamily: 'var(--font-mono)',
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
    inputRef: React.RefObject<HTMLInputElement | null>
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
          gap: 'var(--space-1-5)',
          padding: 'var(--space-1) var(--space-2-5)',
          borderRadius: 7,
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.11)',
        }}
      >
        <Pxi name="search" size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tasks…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            fontSize: 11.5,
            color: 'var(--tx-primary)',
            fontFamily: 'inherit',
          }}
          onBlur={() => { if (!value) onClose() }}
        />
        {value && (
          <button
            onClick={onClose}
            aria-label="Clear search"
            style={{
              display: 'flex', background: 'none', border: 'none',
              padding: 0, cursor: 'pointer', color: 'var(--tx-tertiary)',
            }}
          >
            <Pxi name="times" size={12} />
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
        gap: 'var(--space-1-5)',
        padding: 'var(--space-1) var(--space-2-5)',
        borderRadius: 7,
        background: hov ? 'var(--sidebar-hover-bg)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
        cursor: 'text',
        transition: 'background 0.1s, border-color 0.1s',
        fontFamily: 'inherit',
      }}
    >
      <Pxi name="search" size={12} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />
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
    <div style={{ marginBottom: 'var(--space-2-5)' }}>

      {/* Header */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        aria-expanded={!collapsed}
        aria-controls={`section-${label.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          padding: '4px 4px 4px 10px',
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
              fontFamily: 'var(--font-display)',
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
              fontFamily: 'var(--font-mono)',
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
          <Pxi name="chevron-down" size={10} />
        </span>
      </button>

      {/* Collapsible body */}
      <div
        id={`section-${label.toLowerCase().replace(/\s+/g, '-')}`}
        style={{
          height: height === 'auto' ? 'auto' : height,
          overflow: 'hidden',
          transition: height === 'auto' ? 'none' : 'height 0.2s cubic-bezier(0.4,0,0.2,1)',
          visibility: collapsed && height === 0 ? 'hidden' : 'visible',
          willChange: height !== 'auto' ? 'height' : 'auto',
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

function SidebarFooter({ onSettings }: { onSettings: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        borderTop: '1px solid var(--sidebar-border)',
        padding: '6px 8px 8px',
      }}
    >
      {/* Unified single-row footer: health dot · provider · model name · ⌘, · gear */}
      <button
        onClick={onSettings}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title="Settings (⌘,)"
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 8px',
          borderRadius: 6,
          background: hov ? 'rgba(255,255,255,0.04)' : 'transparent',
          border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'transparent'}`,
          cursor: 'pointer',
          transition: 'background 0.12s, border-color 0.12s',
          textAlign: 'left',
        }}
      >
        <FooterModelInfo />
        <span
          style={{
            marginLeft: 'auto',
            fontSize: 9,
            color: hov ? 'var(--tx-muted)' : 'var(--tx-tertiary)',
            fontFamily: 'var(--font-mono)',
            letterSpacing: '0.02em',
            flexShrink: 0,
            transition: 'color 0.12s',
          }}
        >
          ⌘,
        </span>
        <Pxi
          name="cog"
          size={12}
          style={{
            color: hov ? 'var(--tx-primary)' : 'var(--tx-muted)',
            transition: 'color 0.12s, transform 0.35s',
            transform: hov ? 'rotate(60deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>
    </div>
  )
}

// ── FooterModelInfo — inline health dot + provider + model ────────────────────

function FooterModelInfo() {
  const { provider, model, gatewayHealth } = useAppStore(
    useShallow((s) => ({
      provider: s.provider,
      model: s.model,
      gatewayHealth: s.gatewayHealth,
    }))
  )

  const healthStatus = gatewayHealth.find((h) => h.gatewayId === provider)?.status ?? 'unknown'
  const healthColor  = {
    healthy:  '#22c55e',
    degraded: '#f59e0b',
    down:     '#f87171',
    unknown:  'rgba(255,255,255,0.2)',
  }[healthStatus]

  const shortModel   = model.includes('/') ? model.split('/').pop()! : model
  const displayModel = shortModel.length > 22 ? shortModel.slice(0, 20) + '…' : shortModel

  const providerLabel =
    provider === 'ollama' ? 'Local'      :
    provider === 'vercel' ? 'Vercel'     :
                            'OpenRouter'

  return (
    <>
      <span
        style={{
          width: 5, height: 5,
          borderRadius: '50%',
          flexShrink: 0,
          backgroundColor: healthColor,
          boxShadow: healthStatus === 'healthy' ? `0 0 5px ${healthColor}90` : undefined,
        }}
      />
      <span style={{ fontSize: 10.5, fontWeight: 500, color: 'var(--tx-tertiary)', fontFamily: 'var(--font-mono)', flexShrink: 0, whiteSpace: 'nowrap' }}>
        {providerLabel}
      </span>
      <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.12)', flexShrink: 0 }}>·</span>
      <span style={{ flex: 1, fontSize: 10.5, fontWeight: 500, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {displayModel}
      </span>
    </>
  )
}


