import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
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
  /** Controlled collapse state — driven by the Panel's onResize callback */
  collapsed?: boolean
  onToggleCollapse?: () => void
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
      date: label === 'Today' ? todayStr : null,
      items,
    }))
}

// ── Main component ────────────────────────────────────────────────────────────

export function Sidebar({ tasks, activeTaskId, onSelectTask, onNewTask, onOpenSettings, collapsed = false, onToggleCollapse }: SidebarProps) {
  const model = useAppStore((s) => s.model)
  const [search, setSearch]                   = useState('')
  const [searchOpen, setSearchOpen]           = useState(false)
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set())
  const searchRef                             = useRef<HTMLInputElement>(null)

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
      className="sidebar"
      data-collapsed={collapsed ? 'true' : 'false'}
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
      {collapsed ? (
        /* ── Collapsed icon rail ── */
        <div className="sidebar-rail">
          <div
            className="rail-header"
            data-tauri-drag-region
            style={{ paddingTop: isTauri ? 18 : 14 }}
          >
              {/* Logo with ambient glow */}
                <div style={{ position: 'relative', lineHeight: 0 }}>
                  <div
                    style={{
                      position: 'absolute',
                      inset: -8,
                      borderRadius: 12,
                      background: 'radial-gradient(ellipse at 50% 50%, oklch(64% 0.214 40.1 / 0.25) 0%, transparent 70%)',
                      pointerEvents: 'none',
                    }}
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width={28}
                    height={28}
                    viewBox="0 0 256 256"
                    fill="none"
                    style={{ display: 'block', flexShrink: 0 }}
                  >
                    <path
                      d="M 0 192 C 0 227.346 28.654 256 64 256 L 256 256 L 256 64 C 256 28.654 227.346 0 192 0 L 0 0 Z M 178 128 C 150.386 128 128 150.386 128 178 L 128 192 L 64 192 L 64 128 L 78 128 C 105.614 128 128 105.614 128 78 L 128 64 L 192 64 L 192 128 Z"
                      fill="var(--amber)"
                    />
                  </svg>
                </div>

            <button
              onClick={onToggleCollapse}
              title="Expand sidebar"
              className="rail-toggle-btn"
            >
              <Pxi name="angle-right" size={11} />
            </button>
          </div>
        </div>
      ) : (
        /* ── Expanded full sidebar ── */
        <>
          <SidebarBrand onToggleCollapse={onToggleCollapse} />

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
              <div style={{ padding: '4px 10px 0' }}>
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

          <SidebarFooter model={shortModel} fullModel={model} onSettings={onOpenSettings} />
        </>
      )}
    </aside>
  )
}

// ── Brand ─────────────────────────────────────────────────────────────────────

// Traffic lights (Close/Minimise/Maximise) on macOS sit at x:16 y:16.
// When running inside Tauri with titleBarStyle:Overlay we need ~76px left padding
// to clear them. In web/browser mode no offset is needed.
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

function SidebarBrand({ onToggleCollapse }: { onToggleCollapse?: () => void }) {
  return (
    <div
      data-tauri-drag-region
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 9,
        padding: isTauri ? '10px 14px 10px 14px' : '14px 14px 10px',
        userSelect: 'none',
      }}
    >
        <div style={{ position: 'relative', flexShrink: 0, lineHeight: 0 }}>
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: 10,
              background: 'radial-gradient(ellipse at 40% 50%, oklch(64% 0.214 40.1 / 0.22) 0%, transparent 70%)',
              pointerEvents: 'none',
            }}
          />
          <NasusLogo size={22} fill="var(--amber)" />
        </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, flex: 1 }}>
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
      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          title="Collapse sidebar"
          className="rail-toggle-btn"
        >
          <Pxi name="angle-left" size={11} />
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

// Per-family accent colors derived from model ID prefix
const FAMILY_META: Record<string, { label: string; color: string }> = {
  anthropic:    { label: 'Anthropic',  color: '#d4a574' },
  openai:       { label: 'OpenAI',     color: '#74b9a0' },
  google:       { label: 'Google',     color: '#7ab4f5' },
  'meta-llama': { label: 'Meta',       color: '#6b9ef5' },
  deepseek:     { label: 'DeepSeek',   color: '#7c9ff7' },
  mistralai:    { label: 'Mistral',    color: '#b08ee0' },
  'x-ai':       { label: 'xAI',        color: '#a0b8a0' },
  qwen:         { label: 'Qwen',       color: '#f5a97f' },
  cohere:       { label: 'Cohere',     color: '#e0a0b0' },
  ollama:       { label: 'Ollama',     color: '#a0b080' },
}

function familyMeta(modelId: string) {
  const prefix = modelId.split('/')[0] ?? ''
  return FAMILY_META[prefix] ?? { label: prefix || 'Model', color: 'var(--tx-muted)' }
}

function SidebarFooter({ model, fullModel, onSettings }: {
  model: string
  fullModel: string
  onSettings: () => void
}) {
  const { setModel, openRouterModels, modelsLastFetched } = useAppStore()
  const [open, setOpen]         = useState(false)
  const [search, setSearch]     = useState('')
  const [gearHov, setGearHov]   = useState(false)
  const containerRef            = useRef<HTMLDivElement>(null)
  const searchRef               = useRef<HTMLInputElement>(null)

  const meta = familyMeta(fullModel)

  // ── Build model list (same logic as UserInputArea) ──────────────────────────
  const STATIC_MODELS = [
    { value: 'anthropic/claude-3.7-sonnet',           label: 'Claude 3.7 Sonnet',           group: 'Anthropic' },
    { value: 'anthropic/claude-3.7-sonnet:thinking',  label: 'Claude 3.7 Sonnet (Thinking)', group: 'Anthropic' },
    { value: 'anthropic/claude-3.5-sonnet',           label: 'Claude 3.5 Sonnet',           group: 'Anthropic' },
    { value: 'anthropic/claude-3.5-haiku',            label: 'Claude 3.5 Haiku',            group: 'Anthropic' },
    { value: 'openai/gpt-4.1',                        label: 'GPT-4.1',                     group: 'OpenAI' },
    { value: 'openai/gpt-4o',                         label: 'GPT-4o',                      group: 'OpenAI' },
    { value: 'openai/gpt-4o-mini',                    label: 'GPT-4o Mini',                 group: 'OpenAI' },
    { value: 'openai/o3-mini',                        label: 'o3-mini',                     group: 'OpenAI' },
    { value: 'google/gemini-2.5-pro-preview',         label: 'Gemini 2.5 Pro',              group: 'Google' },
    { value: 'google/gemini-2.0-flash-001',           label: 'Gemini 2.0 Flash',            group: 'Google' },
    { value: 'meta-llama/llama-3.3-70b-instruct',    label: 'Llama 3.3 70B',               group: 'Meta' },
    { value: 'deepseek/deepseek-r1',                  label: 'DeepSeek R1',                 group: 'DeepSeek' },
    { value: 'deepseek/deepseek-chat',                label: 'DeepSeek V3',                 group: 'DeepSeek' },
    { value: 'x-ai/grok-3',                          label: 'Grok 3',                      group: 'xAI' },
    { value: 'mistralai/mistral-large',               label: 'Mistral Large',               group: 'Mistral' },
    { value: 'qwen/qwq-32b',                         label: 'QwQ 32B',                     group: 'Qwen' },
  ]

  const isLive = openRouterModels.length > 0
  const allModels = isLive
    ? openRouterModels.map((m) => ({
        value: m.id,
        label: m.name,
        group: familyMeta(m.id).label,
      }))
    : STATIC_MODELS

  const q = search.trim().toLowerCase()
  const filtered = q
    ? allModels.filter((m) => m.label.toLowerCase().includes(q) || m.value.toLowerCase().includes(q))
    : allModels

  const grouped = new Map<string, typeof allModels>()
  for (const m of filtered) {
    if (!grouped.has(m.group)) grouped.set(m.group, [])
    grouped.get(m.group)!.push(m)
  }

  const freshLabel = (() => {
    if (!isLive) return null
    const age = Date.now() - modelsLastFetched
    if (age < 60_000) return 'just now'
    if (age < 3_600_000) return `${Math.round(age / 60_000)}m ago`
    return `${Math.round(age / 3_600_000)}h ago`
  })()

  // Close on outside click
  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30)
  }, [open])

  return (
    <div
      ref={containerRef}
      style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
          padding: '6px 10px 10px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        position: 'relative',
      }}
    >
      {/* ── Inline model switcher dropdown ─────────────────────────── */}
      {open && (
        <div
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 6px)',
              left: 10,
              right: 10,
            zIndex: 200,
            borderRadius: 12,
            background: '#161616',
            border: '1px solid rgba(255,255,255,0.09)',
            boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 300,
            overflow: 'hidden',
            animation: 'dropUp 0.14s ease',
          }}
        >
          {/* Search */}
          <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Pxi name="search" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search models…"
                style={{
                  flex: 1, background: 'transparent', border: 'none', outline: 'none',
                  fontSize: 11.5, color: 'var(--tx-primary)', fontFamily: 'inherit',
                }}
              />
              {search && (
                <button type="button" onClick={() => setSearch('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', padding: 0 }}>
                  <Pxi name="times" size={9} />
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {grouped.size === 0 ? (
              <div style={{ padding: '14px 12px', textAlign: 'center', fontSize: 11.5, color: 'var(--tx-tertiary)' }}>
                No models match "{search}"
              </div>
            ) : [...grouped.entries()].map(([group, models]) => (
              <div key={group}>
                <div style={{
                  padding: '5px 12px 3px', fontSize: 9.5, fontWeight: 600,
                  letterSpacing: '0.09em', textTransform: 'uppercase',
                  color: 'var(--tx-tertiary)', borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>{group}</div>
                {models.map((m) => {
                  const isSel = m.value === fullModel
                  return (
                    <button key={m.value} type="button"
                      onClick={() => { setModel(m.value); setOpen(false); setSearch('') }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        justifyContent: 'space-between', padding: '6px 12px',
                        textAlign: 'left', border: 'none', cursor: 'pointer', gap: 8,
                        fontSize: 11.5, fontFamily: 'inherit',
                        color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                        background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                        {m.label}
                      </span>
                      {isSel && <Pxi name="check" size={9} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            padding: '5px 10px', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, gap: 6,
          }}>
            {isLive ? (
              <>
                <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>{openRouterModels.length} models · OpenRouter</span>
                <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>Updated {freshLabel}</span>
              </>
            ) : (
              <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>Curated list · add API key to load all</span>
            )}
          </div>
        </div>
      )}

      {/* ── Top row: family badge + settings gear ──────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', padding: '0 2px',
      }}>
        {/* Provider family pill */}
        <span style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-display)',
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: meta.color, opacity: 0.75,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%',
            background: meta.color, flexShrink: 0,
            boxShadow: `0 0 5px ${meta.color}88`,
          }} />
          {meta.label}
        </span>

        {/* Settings gear */}
        <button
          onClick={onSettings}
          onMouseEnter={() => setGearHov(true)}
          onMouseLeave={() => setGearHov(false)}
          title="Settings (⌘,)"
          style={{
            width: 22, height: 22, display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            borderRadius: 5,
            border: `1px solid ${gearHov ? 'rgba(255,255,255,0.1)' : 'transparent'}`,
            background: gearHov ? 'rgba(255,255,255,0.06)' : 'transparent',
            color: gearHov ? 'var(--tx-secondary)' : 'var(--tx-muted)',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background 0.1s, border-color 0.1s, color 0.1s',
          }}
        >
          <Pxi name="cog" size={11} />
        </button>
      </div>

      {/* ── Model selector button ───────────────────────────────────── */}
      <button
        onClick={() => setOpen((o) => !o)}
        title={`Model: ${fullModel}\nClick to switch`}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 8px', borderRadius: 7,
          background: open ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.025)',
          border: `1px solid ${open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
          cursor: 'pointer', fontFamily: 'inherit',
          transition: 'background 0.1s, border-color 0.1s', textAlign: 'left',
        }}
        onMouseEnter={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)'
          }
        }}
      >
        {/* Model family icon badge */}
        <div style={{
          width: 20, height: 20, borderRadius: 5,
          background: `${meta.color}18`, border: `1px solid ${meta.color}28`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Pxi name="sparkles" size={9} style={{ color: meta.color }} />
        </div>

        {/* Model name */}
        <span style={{
          flex: 1, fontSize: 11, fontWeight: 500,
          fontFamily: 'var(--font-mono)',
          color: open ? 'var(--tx-primary)' : 'var(--tx-secondary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          transition: 'color 0.1s', letterSpacing: '-0.01em',
        }}>
          {model}
        </span>

        {/* Chevron */}
        <Pxi name="angle-down" size={9} style={{
          color: 'var(--tx-muted)', flexShrink: 0,
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.15s',
        }} />
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
