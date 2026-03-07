/**
 * ContextPanel — Right sidebar
 *
 * Sections (all collapsible):
 *   1. Model selector (pinned top) — full upgraded picker
 *   2. Provider toggle: OpenRouter / Vercel / Auto
 *   3. Free-models toggle with count badge
 *   4. System prompt / persona editor
 *   5. Temperature + max-tokens sliders with reset
 *   6. Conversation stats: tokens, estimated cost, model info
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
import { Pxi } from './Pxi'
import { familyMeta } from '../lib/models'
import { formatTokenPrice } from '../agent/llm'

// ── Constants ──────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT_KEY = 'nasus-system-prompt'
const TEMP_KEY          = 'nasus-temperature'
const MAXTOK_KEY        = 'nasus-max-tokens'

function loadPref<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback } catch { return fallback }
}
function savePref(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch { /* ignore */ }
}

// ── Panel ──────────────────────────────────────────────────────────────────────

interface ContextPanelProps {
  collapsed?: boolean
  onToggle?: () => void
}

export function ContextPanel({ collapsed = false, onToggle }: ContextPanelProps) {
  if (collapsed) {
    return (
      <div className="context-rail-collapsed">
        <RailBtn icon="angle-left" title="Expand context panel (⌘⇧\\)" onClick={onToggle} />
        <RailBtn icon="sparkles"    title="Model selector"               onClick={onToggle} />
        <RailBtn icon="sliders-h"   title="Parameters"                   onClick={onToggle} />
        <RailBtn icon="comment-dots" title="System prompt"               onClick={onToggle} />
        <RailBtn icon="chart-bar"   title="Conversation stats"           onClick={onToggle} />
      </div>
    )
  }

  return (
    <div className="context-panel-root">
      {/* Header */}
      <div
        data-tauri-drag-region
        className="context-panel-header"
      >
        <span className="text-muted font-display context-panel-title">
          Context
        </span>
        <RailBtn icon="angle-right" title="Collapse (⌘⇧\\)" onClick={onToggle} />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin">
        <ModelSection />
        <Divider />
        <ProviderSection />
        <Divider />
        <ParametersSection />
        <Divider />
        <SystemPromptSection />
        <Divider />
        <StatsSection />
        <div className="h-4" />
      </div>
    </div>
  )
}

// ── Rail button (collapsed state icon) ────────────────────────────────────────

function RailBtn({ icon, title, onClick }: { icon: string; title?: string; onClick?: () => void }) {
  return (
    <button title={title} onClick={onClick} className="context-rail-btn">
      <Pxi name={icon} size={11} />
    </button>
  )
}

function Divider() {
  return <div className="mx-3 context-divider" />
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  icon, label, badge, defaultOpen = true, children,
}: {
  icon: string
  label: string
  badge?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(defaultOpen ? 'auto' : 0)

  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    if (open) {
      setHeight(el.scrollHeight)
      const id = setTimeout(() => setHeight('auto'), 220)
      return () => clearTimeout(id)
    } else {
      setHeight(el.scrollHeight)
      requestAnimationFrame(() => requestAnimationFrame(() => setHeight(0)))
    }
  }, [open])

    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className="section-trigger"
        >
          <Pxi name={icon} size={10} className="text-tertiary flex-shrink-0" />
          <span className="text-tertiary font-display section-label flex-1 select-none">
            {label}
          </span>
          {badge && <span className="flex-shrink-0">{badge}</span>}
          <Pxi
            name="chevron-down"
            size={8}
            className="text-muted flex-shrink-0"
            style={{
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
              transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </button>
        <div
          style={{
            height: height === 'auto' ? 'auto' : height,
            overflow: 'hidden',
            transition: height === 'auto' ? 'none' : 'height 0.22s cubic-bezier(0.4,0,0.2,1)',
            visibility: !open && height === 0 ? 'hidden' : 'visible',
          }}
        >
          <div ref={bodyRef} className="section-body">
            {children}
          </div>
        </div>
      </div>
    )
}

// ── Model Section ──────────────────────────────────────────────────────────────

function ModelSection() {
  const { model, setModel, openRouterModels, modelsLastFetched, routerConfig, routingPreview } = useAppStore(useShallow(s => ({
    model: s.model,
    setModel: s.setModel,
    openRouterModels: s.openRouterModels,
    modelsLastFetched: s.modelsLastFetched,
    routerConfig: s.routerConfig,
    routingPreview: s.routingPreview,
  })))
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [freeOnly, setFreeOnly] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)

  const isAutoMode = routerConfig?.mode === 'auto'
  const meta = isAutoMode ? { label: 'AUTO', color: 'var(--amber)' } : familyMeta(model)

  const shortModel = useMemo(() => {
    if (isAutoMode) {
      return routingPreview?.displayName
        ? `Auto: ${routingPreview.displayName}`
        : `Auto (${routerConfig?.budget === 'free' ? 'free' : 'paid'})`
    }
    return model.includes('/') ? model.split('/').pop()! : model
  }, [model, isAutoMode, routingPreview, routerConfig?.budget])

  const allModels = useMemo(() => {
    if (openRouterModels.length > 0) return openRouterModels
    return []
  }, [openRouterModels])

  const freeModels = useMemo(
    () => allModels.filter(m => m.pricing?.prompt === '0' || m.id.endsWith(':free')),
    [allModels]
  )

  const displayModels = useMemo(() => {
    const base = freeOnly ? freeModels : allModels
    if (!search.trim()) return base
    const q = search.toLowerCase()
    return base.filter(m => m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
  }, [allModels, freeModels, freeOnly, search])

  const grouped = useMemo(() => {
    const g = new Map<string, typeof allModels>()
    for (const m of displayModels) {
      const fam = m.id.split('/')[0] ?? 'Other'
      const key = fam.charAt(0).toUpperCase() + fam.slice(1)
      if (!g.has(key)) g.set(key, [])
      g.get(key)!.push(m)
    }
    return g
  }, [displayModels])

  const [freshLabel, setFreshLabel] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => { if (open) setTimeout(() => searchRef.current?.focus(), 30) }, [open])

    return (
      <div ref={containerRef} className="model-section-wrap">
        {/* Dropdown popup */}
        {open && (
          <div className="model-dropdown">
            {/* Dropdown header */}
            <div className="flex-shrink-0 model-dropdown-header">
              <div className="flex-v-center model-search-box">
                <Pxi name="search" size={9} className="text-tertiary" />
                <input
                  ref={searchRef}
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search models…"
                  className="model-search-input"
                />
                {search && (
                  <button type="button" onClick={() => setSearch('')}
                    className="text-tertiary cursor-pointer model-search-clear">
                    <Pxi name="times" size={9} />
                  </button>
                )}
              </div>
              {/* Free-only toggle */}
              <button
                type="button"
                onClick={() => setFreeOnly(f => !f)}
                className="free-toggle-btn"
                style={{
                  background: freeOnly ? 'rgba(99,102,241,0.1)' : 'transparent',
                  border: `1px solid ${freeOnly ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                }}
              >
                <div
                  className="free-toggle-track"
                  style={{ background: freeOnly ? '#818cf8' : 'rgba(255,255,255,0.12)' }}
                >
                  <span
                    className="free-toggle-thumb"
                    style={{ left: freeOnly ? 'calc(100% - 12px)' : 2 }}
                  />
                </div>
                <span style={{ fontSize: 11, color: freeOnly ? '#818cf8' : 'var(--tx-secondary)' }}>Free only</span>
                {freeModels.length > 0 && (
                  <span className="font-mono free-count-badge">
                    {freeModels.length}
                  </span>
                )}
              </button>
            </div>

            {/* Model list */}
            <div className="overflow-y-auto flex-1">
              {grouped.size === 0 ? (
                <div className="text-tertiary text-center model-empty">
                  {allModels.length === 0 ? 'Add an API key to load models' : `No models match "${search}"`}
                </div>
              ) : [...grouped.entries()].map(([group, models]) => (
                <div key={group}>
                  <div className="text-tertiary model-group-header">
                    {group}
                  </div>
                  {models.map(m => {
                    const isFree = m.pricing?.prompt === '0' || m.id.endsWith(':free')
                    const isSel = m.id === model
                    const ctx = m.context_length >= 1_000_000
                      ? `${(m.context_length / 1_000_000).toFixed(0)}M`
                      : m.context_length >= 1_000
                      ? `${Math.round(m.context_length / 1_000)}k`
                      : String(m.context_length)
                    return (
                      <button key={m.id} type="button"
                        onClick={() => { setModel(m.id); setOpen(false); setSearch('') }}
                          className="flex-v-center w-full cursor-pointer model-row hover-bg-app-3"
                          style={{
                            color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                            background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                          }}
                      >
                        <span className="flex-1 truncate">{m.name}</span>
                        <span className="text-muted font-mono flex-shrink-0 model-ctx">{ctx}</span>
                        {isFree ? (
                          <span className="model-free-badge">FREE</span>
                        ) : (
                          <span className="text-muted font-mono flex-shrink-0 model-ctx">
                            {formatTokenPrice(m.pricing?.prompt)}/in
                          </span>
                        )}
                        {isSel && <Pxi name="check" size={9} className="text-amber flex-shrink-0" />}
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>

            {/* Dropdown footer */}
            <div className="flex-v-center justify-between flex-shrink-0 model-dropdown-footer">
              {allModels.length > 0 ? (
                <>
                  <span className="text-tertiary model-footer-text">{allModels.length} models · OpenRouter</span>
                  {freshLabel && <span className="text-muted model-footer-text">{freshLabel}</span>}
                </>
              ) : (
                <span className="text-tertiary model-footer-text">Save API key in Settings to load all models</span>
              )}
            </div>
          </div>
        )}

        {/* Model trigger label */}
        <div className="flex-v-center text-tertiary font-display model-trigger-label">
          <Pxi name="sparkles" size={10} />
          Model
        </div>
        <button
          onClick={() => {
            const opening = !open
            setOpen(opening)
            if (opening && modelsLastFetched) {
              const age = Date.now() - modelsLastFetched
              if (age < 60_000) setFreshLabel('just now')
              else if (age < 3_600_000) setFreshLabel(`${Math.round(age / 60_000)}m ago`)
              else setFreshLabel(`${Math.round(age / 3_600_000)}h ago`)
            }
          }}
            className="model-trigger-btn hover-bg-app-3"
            style={{
              background: open ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
              border: `1px solid ${open ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
            }}
        >
          {/* Family icon */}
          <div
            className="flex-center flex-shrink-0 model-family-icon"
            style={{
              background: `${meta.color}18`,
              border: `1px solid ${meta.color}28`,
            }}
          >
            <Pxi name="sparkles" size={9} style={{ color: meta.color }} />
          </div>
          {/* Name */}
          <span className="flex-1 text-secondary font-mono truncate model-name">
            {shortModel}
          </span>
          <Pxi
            name="angle-down"
            size={9}
            className="text-muted flex-shrink-0"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.15s',
            }}
          />
        </button>

        {/* Provider family pill */}
        <div
          className="flex-v-center font-display model-family-pill"
          style={{ color: meta.color }}
        >
          <span
            className="flex-shrink-0 model-family-dot"
            style={{ background: meta.color, boxShadow: `0 0 5px ${meta.color}88` }}
          />
          {meta.label}
        </div>
      </div>
    )
}

// ── Provider Section ───────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', icon: 'cloud',     color: 'var(--amber)', desc: 'Cloud API'  },
  { id: 'vercel',     label: 'Vercel AI',  icon: 'triangle',  color: '#818cf8',      desc: 'AI Gateway' },
  { id: 'auto',       label: 'Auto',       icon: 'bolt',      color: '#22c55e',      desc: 'Best route' },
] as const

function ProviderSection() {
  const { routerConfig, setRouterConfig, gateways, gatewayHealth } = useAppStore(useShallow(s => ({
    routerConfig: s.routerConfig,
    setRouterConfig: s.setRouterConfig,
    gateways: s.gateways,
    gatewayHealth: s.gatewayHealth,
  })))
  const activeProvider = routerConfig?.mode === 'auto'
    ? 'auto'
    : gateways?.find(g => g.enabled)?.type ?? 'openrouter'

  function pickProvider(id: string) {
    if (id === 'auto') {
      setRouterConfig({ mode: 'auto' })
    } else {
      setRouterConfig({ mode: 'manual' })
    }
  }

  function healthOf(gwId: string) {
    if (!gatewayHealth) return null
    return gatewayHealth.find(h => h.gatewayId === gwId)
  }

    return (
      <Section icon="cloud" label="Provider">
        <div className="flex gap-1-25">
          {PROVIDERS.map(p => {
            const isSel = activeProvider === p.id
            const health = healthOf(p.id)
            const isHealthy = !health || health.status === 'healthy'
            return (
              <button
                  key={p.id}
                  onClick={() => pickProvider(p.id)}
                  className="flex-col items-center cursor-pointer provider-btn hover-bg-app-3"
                  style={{
                    background: isSel ? `${p.color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${isSel ? p.color + '55' : 'rgba(255,255,255,0.07)'}`,
                  }}
              >
                <div className="relative">
                  <Pxi name={p.icon} size={12} style={{ color: isSel ? p.color : 'var(--tx-tertiary)' }} />
                  {health && (
                    <span
                      className="provider-health-dot"
                      style={{
                        background: isHealthy ? '#22c55e' : health.status === 'degraded' ? 'var(--amber)' : '#f87171',
                        boxShadow: isHealthy ? '0 0 4px #22c55e88' : 'none',
                      }}
                    />
                  )}
                </div>
                <span
                  className="provider-label"
                  style={{
                    fontWeight: isSel ? 600 : 400,
                    color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                  }}
                >
                  {p.label}
                </span>
                <span className="text-muted provider-desc">{p.desc}</span>
              </button>
            )
          })}
        </div>

        {activeProvider !== 'auto' && (
          <div className="flex mt-2 gap-1-25">
            {(['free', 'paid'] as const).map(b => {
              const isSel = routerConfig?.budget === b
              return (
                <button key={b}
                    onClick={() => setRouterConfig({ budget: b })}
                    className="budget-btn hover-bg-app-3"
                    style={{
                      fontWeight: isSel ? 600 : 400,
                      border: `1px solid ${isSel ? (b === 'free' ? 'rgba(99,102,241,0.4)' : 'oklch(64% 0.214 40.1 / 0.4)') : 'rgba(255,255,255,0.07)'}`,
                      background: isSel ? (b === 'free' ? 'rgba(99,102,241,0.1)' : 'oklch(64% 0.214 40.1 / 0.1)') : 'transparent',
                      color: isSel ? (b === 'free' ? '#818cf8' : 'var(--amber)') : 'var(--tx-secondary)',
                    }}
                >
                  {b === 'free' ? 'Free only' : 'Paid'}
                </button>
              )
            })}
          </div>
        )}
      </Section>
    )
}

// ── Parameters Section ─────────────────────────────────────────────────────────

const DEFAULT_TEMP    = 0.7
const DEFAULT_MAXTOK  = 4096

function ParametersSection() {
  const [temp, setTemp]     = useState<number>(() => loadPref(TEMP_KEY, DEFAULT_TEMP))
  const [maxTok, setMaxTok] = useState<number>(() => loadPref(MAXTOK_KEY, DEFAULT_MAXTOK))

  useEffect(() => { savePref(TEMP_KEY, temp) },    [temp])
  useEffect(() => { savePref(MAXTOK_KEY, maxTok) }, [maxTok])

  function reset() { setTemp(DEFAULT_TEMP); setMaxTok(DEFAULT_MAXTOK) }
  const isDefault = temp === DEFAULT_TEMP && maxTok === DEFAULT_MAXTOK

  return (
    <Section icon="sliders-h" label="Parameters" badge={
      !isDefault && (
        <button
          onClick={e => { e.stopPropagation(); reset() }}
          title="Reset to defaults"
            className="param-reset-btn hover-text-primary"
        >
          Reset
        </button>
      )
    }>
      <SliderRow
        label="Temperature"
        value={temp}
        min={0} max={2} step={0.05}
        format={v => v.toFixed(2)}
        onChange={setTemp}
        hint={temp < 0.5 ? 'Precise' : temp < 1 ? 'Balanced' : 'Creative'}
        hintColor={temp < 0.5 ? '#818cf8' : temp < 1 ? 'var(--amber)' : '#f87171'}
      />
      <SliderRow
        label="Max Tokens"
        value={maxTok}
        min={256} max={32768} step={256}
        format={v => v >= 1000 ? `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k` : String(v)}
        onChange={setMaxTok}
      />
    </Section>
  )
}

function SliderRow({
  label, value, min, max, step, format, onChange, hint, hintColor,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  onChange: (v: number) => void
  hint?: string
  hintColor?: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div className="slider-row">
      <div className="flex-v-center justify-between slider-row-header">
        <span className="text-secondary slider-label">{label}</span>
        <div className="flex-v-center gap-1-25">
          {hint && <span className="slider-hint" style={{ color: hintColor ?? 'var(--tx-muted)' }}>{hint}</span>}
          <span className="text-primary font-mono slider-value">
            {format(value)}
          </span>
        </div>
      </div>
      <div className="relative flex-v-center slider-track-wrap">
        <div className="absolute inset-x-0 slider-track">
          <div style={{ height: '100%', borderRadius: 2, width: `${pct}%`, background: 'oklch(64% 0.214 40.1)' }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="absolute inset-x-0 w-full cursor-pointer slider-input"
        />
      </div>
    </div>
  )
}

// ── System Prompt Section ──────────────────────────────────────────────────────

function SystemPromptSection() {
  const [prompt, setPrompt] = useState<string>(() => loadPref(SYSTEM_PROMPT_KEY, ''))
  const [chars, setChars] = useState(prompt.length)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback((v: string) => {
    setPrompt(v)
    setChars(v.length)
    savePref(SYSTEM_PROMPT_KEY, v)
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
  }, [])

  return (
    <Section icon="comment-dots" label="System Prompt" defaultOpen={false}>
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={e => handleChange(e.target.value)}
          placeholder="Add a system prompt or persona for the AI…"
          rows={3}
          className="system-prompt-textarea"
          onFocus={e => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
        />
        {chars > 0 && (
          <span className="text-muted font-mono absolute pointer-events-none system-prompt-char-count">
            {chars}
          </span>
        )}
      </div>
      {prompt && (
        <button
          onClick={() => handleChange('')}
            className="text-muted cursor-pointer system-prompt-clear hover-text-danger"
        >
          Clear
        </button>
      )}
    </Section>
  )
}

// ── Stats Section ──────────────────────────────────────────────────────────────

function StatsSection() {
  const { activeTaskId, taskRouterState, messages, routerConfig } = useAppStore(useShallow(s => ({
    activeTaskId: s.activeTaskId,
    taskRouterState: s.taskRouterState,
    messages: s.messages,
    routerConfig: s.routerConfig,
  })))
  const stats = activeTaskId ? taskRouterState[activeTaskId] : null
  const msgCount = activeTaskId ? (messages[activeTaskId]?.length ?? 0) : 0
  const userMsgs = activeTaskId
    ? (messages[activeTaskId] ?? []).filter(m => m.author === 'user').length
    : 0

  if (!stats && msgCount === 0) return null

  function fmtCost(usd: number) {
    if (usd === 0) return 'Free'
    if (usd < 0.001) return `$${(usd * 1000).toFixed(3)}m`
    return `$${usd.toFixed(4)}`
  }

  function fmtToks(n: number) {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`
    return String(n)
  }

  return (
      <Section icon="chart-bar" label="Stats" defaultOpen={false}>
        <div className="flex-col gap-1-5">
          <StatRow label="Messages" value={String(msgCount)} />
          <StatRow label="User turns" value={String(userMsgs)} />
          {stats && (
            <>
              <StatRow label="Model" value={stats.displayName || stats.modelId} mono />
              <StatRow label="Calls" value={String(stats.callCount)} />
              <StatRow label="Input tokens" value={fmtToks(stats.totalInputTokens)} />
              <StatRow label="Output tokens" value={fmtToks(stats.totalOutputTokens)} />
              <StatRow
                label="Est. cost"
                value={fmtCost(stats.totalCostUsd)}
                valueColor={stats.isFree ? '#22c55e' : stats.totalCostUsd > 0.05 ? 'var(--amber)' : undefined}
              />
              {stats.isFree && (
                <div className="flex-v-center stats-badge stats-badge--green">
                  <Pxi name="leaf" size={9} style={{ color: '#22c55e' }} />
                  <span className="stats-badge-text" style={{ color: '#22c55e' }}>Running on free tier</span>
                </div>
              )}
            </>
          )}
          {routerConfig?.budget === 'free' && !stats && (
            <div className="flex-v-center stats-badge stats-badge--indigo">
              <Pxi name="info-circle" size={9} style={{ color: '#818cf8' }} />
              <span className="stats-badge-text" style={{ color: '#818cf8' }}>Free-only mode active</span>
            </div>
          )}
        </div>
      </Section>
  )
}

function StatRow({ label, value, mono, valueColor }: {
  label: string
  value: string
  mono?: boolean
  valueColor?: string
}) {
  return (
    <div className="flex-v-center justify-between">
      <span className="text-tertiary stat-label">{label}</span>
      <span
        className="stat-value"
        style={{
          color: valueColor ?? 'var(--tx-secondary)',
          fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        }}
      >
        {value}
      </span>
    </div>
  )
}
