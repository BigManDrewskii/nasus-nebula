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
  onNewTask?: () => void
  onNewChat?: () => void
  onOpenSettings?: (tab?: 'general' | 'model' | 'execution' | 'browser' | 'search' | 'about') => void
  collapsed?: boolean
  onToggleCollapse?: () => void
  position?: 'left' | 'right'
  minimal?: boolean
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

export function Sidebar({ tasks, activeTaskId, onSelectTask, onNewTask, onNewChat, onOpenSettings, collapsed: _collapsed, onToggleCollapse, position: _position, minimal: _minimal }: SidebarProps) {
  const handleNewTask = useCallback(() => {
    const fn = onNewChat ?? onNewTask
    if (fn) fn()
  }, [onNewChat, onNewTask])

  const handleOpenSettings = useCallback(() => {
    if (onOpenSettings) onOpenSettings()
  }, [onOpenSettings])
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
      <aside className="sidebar sb-root">
        {/* ── Expanded full sidebar ── */}
        <SidebarBrand onCollapse={onToggleCollapse} />

        <div className="sb-new-task-wrap">
          <NewTaskButton onClick={() => handleNewTask()} />
        </div>

        <div className="sb-search-wrap">
          <SearchBar
            open={searchOpen}
            value={search}
            inputRef={searchRef}
            onChange={setSearch}
            onOpen={() => { setSearchOpen(true); setTimeout(() => searchRef.current?.focus(), 50) }}
            onClose={() => { setSearch(''); setSearchOpen(false) }}
          />
        </div>

        <div className="sb-divider" />

        <div className="sb-task-list">
          {tasks.length === 0 ? (
            <SidebarEmptyState
              icon="sparkles"
              title="No tasks yet"
              subtitle="Create your first task to get started"
              action={{ label: 'New task', onClick: () => (onNewChat ?? onNewTask)?.() }}
            />
          ) : (
            <div className="sb-task-list-inner">
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
                <p className="sb-no-results">
                  No tasks match<br />
                  <span className="sb-no-results-term">"{search}"</span>
                </p>
              )}
            </div>
          )}
        </div>

          <SidebarFooter onSettings={handleOpenSettings} />
      </aside>
    )
}

// ── Brand ─────────────────────────────────────────────────────────────────────

function SidebarBrand({ onCollapse }: { onCollapse?: () => void }) {
  return (
    <div data-tauri-drag-region className="sb-brand">
        <div className="sb-brand-logo-wrap">
          <div className="sb-brand-glow" />
          <NasusLogo size={22} fill="var(--amber)" />
        </div>
        <div className="sb-brand-text-wrap">
          <span className="font-display sb-brand-name">NASUS</span>
        </div>
        {onCollapse && (
          <button
              onClick={onCollapse}
              title="Collapse sidebar (⌘B)"
              aria-label="Collapse sidebar"
              className="sb-collapse-btn"
            >
              <Pxi name="chevron-left" size={11} />
            </button>
        )}
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
      className="sb-new-task-btn"
      style={{
        color: hov ? 'var(--amber-light)' : 'var(--tx-tertiary)',
        background: hov ? 'oklch(64% 0.214 40.1 / 0.09)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? 'oklch(64% 0.214 40.1 / 0.35)' : 'rgba(255,255,255,0.06)'}`,
        boxShadow: hov ? '0 0 16px oklch(64% 0.214 40.1 / 0.12)' : 'none',
      }}
    >
        <Pxi
          name="plus"
          size={12}
          style={{ flexShrink: 0, transform: hov ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
        />
        <span className="sb-new-task-label">New task</span>
        <kbd className="sb-new-task-kbd">⌘N</kbd>
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
      <div className="sb-search-open">
        <Pxi name="search" size={12} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search tasks…"
          className="sb-search-input"
          onBlur={() => { if (!value) onClose() }}
        />
        {value && (
          <button onClick={onClose} aria-label="Clear search" className="sb-search-clear">
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
      className="sb-search-btn"
      style={{
        background: hov ? 'var(--sidebar-hover-bg)' : 'rgba(255,255,255,0.02)',
        border: `1px solid ${hov ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
      }}
    >
      <Pxi name="search" size={12} style={{ color: 'var(--tx-muted)', flexShrink: 0 }} />
      <span className="sb-search-placeholder">Search</span>
      <kbd className="sb-search-kbd">⌘K</kbd>
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
    <div className="sb-section">
      {/* Header */}
      <button
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        aria-expanded={!collapsed}
        aria-controls={`section-${label.toLowerCase().replace(/\s+/g, '-')}`}
        className="sb-section-header"
      >
        {/* Pinned accent pip */}
        {isAmber && <span className="sb-section-pip" />}

          {/* Label */}
          <span
            className="sb-section-label"
            style={{
              color: isAmber
                ? 'var(--amber)'
                : hov ? 'var(--tx-muted)' : 'var(--tx-ghost)',
            }}
          >
            {label}
          </span>

        {/* Date — Today only */}
        {date && (
          <span
            className="sb-section-date"
            style={{ color: hov ? 'var(--tx-tertiary)' : 'var(--tx-muted)' }}
          >
            {date}
          </span>
        )}

        {/* Count */}
        <span
          className="sb-section-count"
          style={{
            color: isAmber ? 'var(--amber)' : 'var(--tx-muted)',
            background: isAmber ? 'oklch(64% 0.214 40.1 / 0.12)' : 'rgba(255,255,255,0.05)',
          }}
        >
          {badge}
        </span>

        {/* Chevron */}
        <span
          className="sb-section-chevron"
          style={{
            color: hov ? 'var(--tx-tertiary)' : 'var(--tx-muted)',
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
        <div ref={bodyRef} className="sb-section-body">
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
    <div className="sb-footer">
      <button
        onClick={onSettings}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        title="Settings (⌘,)"
        className={`sb-footer-btn${hov ? ' sb-footer-btn--hov' : ''}`}
      >
        <FooterModelInfo hov={hov} />
        <span className="sb-footer-actions">
          <span className="sb-footer-shortcut">⌘,</span>
          <Pxi
            name="cog"
            size={12}
            style={{
              transition: 'color 0.15s, transform 0.35s',
              transform: hov ? 'rotate(60deg)' : 'rotate(0deg)',
              flexShrink: 0,
            }}
          />
        </span>
      </button>
    </div>
  )
}

// ── FooterModelInfo ────────────────────────────────────────────────────────────

function FooterModelInfo({ hov }: { hov: boolean }) {
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
  const displayModel = shortModel.length > 20 ? shortModel.slice(0, 18) + '…' : shortModel

  const providerLabel =
    provider === 'ollama' ? 'Local'      :
    provider === 'vercel' ? 'Vercel'     :
                            'OpenRouter'

  return (
    <span className="sb-footer-model-info">
      <span
        className="sb-health-dot"
        style={{
          backgroundColor: healthColor,
          boxShadow: healthStatus === 'healthy' ? `0 0 6px ${healthColor}80` : undefined,
          opacity: hov ? 1 : 0.85,
        }}
      />
      <span className="sb-footer-provider">{providerLabel}</span>
      <span className="sb-footer-sep">·</span>
      <span className="sb-footer-model">{displayModel}</span>
    </span>
  )
}
