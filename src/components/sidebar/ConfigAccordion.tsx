/**
 * ConfigAccordion — Collapsible configuration sections in left sidebar
 *
 * Sections extracted from ContextPanel:
 *   1. Model selector with provider toggle and free/paid toggle
 *   2. Parameters (Temperature, Max Tokens)
 *   3. System prompt editor
 *   4. Conversation stats
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useAppStore } from '../../store'
import { Pxi } from '../Pxi'
import { familyMeta } from '../../lib/models'
import { formatTokenPrice } from '../../agent/llm'

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

interface ConfigAccordionProps {
  /** Whether the sidebar is collapsed (icon rail mode) */
  collapsed?: boolean
  /** Callback to expand sidebar and optionally open a specific section */
  onExpand?: (section?: string) => void
}

export function ConfigAccordion({ collapsed = false, onExpand }: ConfigAccordionProps) {
  const { configSections, setConfigSection } = useAppStore()

  // When sidebar is collapsed, show only icons
  if (collapsed) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-1)',
          padding: 'var(--space-2) 0',
          borderTop: '1px solid var(--sidebar-border)',
          marginTop: 'auto',
        }}
      >
        <ConfigRailIcon
          icon="sparkles"
          title="Model selector"
          onClick={() => onExpand?.('model')}
        />
        <ConfigRailIcon
          icon="sliders-h"
          title="Parameters"
          onClick={() => onExpand?.('parameters')}
        />
        <ConfigRailIcon
          icon="comment-dots"
          title="System prompt"
          onClick={() => onExpand?.('systemPrompt')}
        />
        <ConfigRailIcon
          icon="chart-bar"
          title="Conversation stats"
          onClick={() => onExpand?.('stats')}
        />
      </div>
    )
  }

  return (
    <div style={{ borderTop: '1px solid var(--sidebar-border)' }}>
      <ModelSection
        open={configSections.model}
        onToggle={() => setConfigSection('model', !configSections.model)}
      />
      <Divider />
      <ParametersSection
        open={configSections.parameters}
        onToggle={() => setConfigSection('parameters', !configSections.parameters)}
      />
      <Divider />
      <SystemPromptSection
        open={configSections.systemPrompt}
        onToggle={() => setConfigSection('systemPrompt', !configSections.systemPrompt)}
      />
      <Divider />
      <StatsSection
        open={configSections.stats}
        onToggle={() => setConfigSection('stats', !configSections.stats)}
      />
    </div>
  )
}

// ── Rail button (collapsed state icon) ────────────────────────────────────────

function ConfigRailIcon({ icon, title, onClick }: { icon: string; title?: string; onClick?: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 32, height: 32, margin: '0 auto',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 8, border: hov ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
        background: hov ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: hov ? 'var(--tx-secondary)' : 'var(--tx-muted)',
        cursor: 'pointer', flexShrink: 0,
        transition: 'background 0.12s, border-color 0.12s, color 0.12s',
      }}
    >
      <Pxi name={icon} size={11} />
    </button>
  )
}

function Divider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', margin: '0 var(--space-3)' }} />
}

// ── Section wrapper ────────────────────────────────────────────────────────────

function Section({
  icon, label, badge, open, onToggle, children,
}: {
  icon: string
  label: string
  badge?: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const [height, setHeight] = useState<number | 'auto'>(open ? 'auto' : 0)

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
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 6,
          padding: 'var(--space-2-5) var(--space-3)',
          background: 'transparent', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <Pxi name={icon} size={10} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
        <span style={{
          flex: 1, fontSize: 10, fontWeight: 600,
          fontFamily: 'var(--font-display)', letterSpacing: '-0.01em',
          color: 'var(--tx-tertiary)',
          userSelect: 'none',
        }}>
          {label}
        </span>
        {badge && <span style={{ flexShrink: 0 }}>{badge}</span>}
        <Pxi
          name="chevron-down"
          size={8}
          style={{
            color: 'var(--tx-muted)', flexShrink: 0,
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
        <div ref={bodyRef} style={{ padding: '0 var(--space-3) var(--space-3)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

// ── Model Section ──────────────────────────────────────────────────────────────

function ModelSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { model, setModel, openRouterModels, modelsLastFetched, routerConfig, routingPreview, provider } = useAppStore()
  const [dropdownOpen, setDropdownOpen] = useState(false)
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

  const providerLabel = provider === 'ollama' ? 'Local' : 'OpenRouter'
  const providerIcon = provider === 'ollama' ? 'server' : 'cloud'

  // Build model list
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

  // Group by family
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

  // Close on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false); setSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [dropdownOpen])

  useEffect(() => { if (dropdownOpen) setTimeout(() => searchRef.current?.focus(), 30) }, [dropdownOpen])

  return (
    <div ref={containerRef} style={{ padding: 'var(--space-2-5) var(--space-3) var(--space-1)' }}>
      {/* Compact summary row (shown when collapsed) */}
      {!open && (
        <button
          onClick={onToggle}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '7px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.05)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            transition: 'background 0.1s, border-color 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
        >
          {/* Provider icon */}
          <div style={{
            width: 20, height: 20, borderRadius: 5, flexShrink: 0,
            background: `${meta.color}18`, border: `1px solid ${meta.color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Pxi name={providerIcon} size={8} style={{ color: meta.color }} />
          </div>
          {/* Provider · Model */}
          <span style={{
            flex: 1,
            fontSize: 10.5,
            fontWeight: 500,
            fontFamily: 'var(--font-mono)',
            color: 'var(--tx-secondary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {providerLabel} · {shortModel}
          </span>
          {/* Free/Paid badge */}
          <span style={{
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.05em',
            padding: '2px 6px',
            borderRadius: 4,
            background: routerConfig?.budget === 'free' ? 'rgba(34,197,94,0.15)' : 'rgba(234,179,8,0.15)',
            color: routerConfig?.budget === 'free' ? '#4ade80' : 'var(--amber)',
            border: `1px solid ${routerConfig?.budget === 'free' ? 'rgba(34,197,94,0.25)' : 'rgba(234,179,8,0.25)'}`,
            flexShrink: 0,
          }}>
            {routerConfig?.budget === 'free' ? 'FREE' : 'PAID'}
          </span>
          {/* Expand chevron */}
          <Pxi
            name="chevron-down"
            size={8}
            style={{
              color: 'var(--tx-muted)',
              flexShrink: 0,
              transform: 'rotate(-90deg)',
              transition: 'transform 0.2s cubic-bezier(0.4,0,0.2,1)',
            }}
          />
        </button>
      )}

      {/* Dropdown popup */}
      {dropdownOpen && (
        <div style={{
          position: 'absolute',
          left: 'calc(100% + 6px)',
          top: 36,
          width: 280,
          zIndex: 300,
          borderRadius: 12,
          background: '#161616',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 20px 48px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: 360,
          overflow: 'hidden',
          animation: 'slideInLeft 0.14s ease',
        }}>
          {/* Dropdown header */}
          <div style={{ padding: '10px 10px 6px', flexShrink: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 10px', borderRadius: 8,
              background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              <Pxi name="search" size={9} style={{ color: 'var(--tx-tertiary)' }} />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
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
            {/* Free-only toggle */}
            <button
              type="button"
              onClick={() => setFreeOnly(f => !f)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '5px 6px', marginTop: 5, borderRadius: 6, width: '100%',
                background: freeOnly ? 'rgba(99,102,241,0.1)' : 'transparent',
                border: `1px solid ${freeOnly ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                cursor: 'pointer', fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              <div style={{
                width: 26, height: 14, borderRadius: 7, position: 'relative',
                background: freeOnly ? '#818cf8' : 'rgba(255,255,255,0.12)',
                flexShrink: 0, transition: 'background 0.15s',
              }}>
                <span style={{
                  position: 'absolute', top: 2, borderRadius: '50%',
                  width: 10, height: 10, background: '#fff',
                  left: freeOnly ? 'calc(100% - 12px)' : 2,
                  transition: 'left 0.15s',
                }} />
              </div>
              <span style={{ fontSize: 11, color: freeOnly ? '#818cf8' : 'var(--tx-secondary)' }}>
                Free only
              </span>
              {freeModels.length > 0 && (
                <span style={{
                  fontSize: 9.5, padding: '1px 5px', borderRadius: 4,
                  background: 'rgba(99,102,241,0.12)', color: '#818cf8',
                  marginLeft: 'auto', fontFamily: 'var(--font-mono)',
                }}>
                  {freeModels.length}
                </span>
              )}
            </button>
          </div>

          {/* Model list */}
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {grouped.size === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', fontSize: 11.5, color: 'var(--tx-tertiary)' }}>
                {allModels.length === 0 ? 'Add an API key to load models' : `No models match "${search}"`}
              </div>
            ) : [...grouped.entries()].map(([group, models]) => (
              <div key={group}>
                <div style={{
                  padding: '5px 12px 3px', fontSize: 9.5, fontWeight: 600,
                  letterSpacing: '0.09em', textTransform: 'uppercase', color: 'var(--tx-tertiary)',
                  borderTop: '1px solid rgba(255,255,255,0.04)',
                }}>
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
                      onClick={() => { setModel(m.id); setDropdownOpen(false); setSearch('') }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center',
                        padding: '6px 12px', textAlign: 'left', border: 'none', cursor: 'pointer',
                        gap: 8, fontSize: 11.5, fontFamily: 'inherit',
                        color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                        background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                        transition: 'background 0.08s',
                      }}
                      onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                      onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                    >
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.name}
                      </span>
                      <span style={{ fontSize: 9.5, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                        {ctx}
                      </span>
                      {isFree ? (
                        <span style={{
                          fontSize: 9, padding: '1px 5px', borderRadius: 4, flexShrink: 0,
                          background: 'rgba(99,102,241,0.12)', color: '#818cf8', fontWeight: 600,
                        }}>
                          FREE
                        </span>
                      ) : (
                        <span style={{ fontSize: 9.5, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>
                          {formatTokenPrice(m.pricing?.prompt)}/in
                        </span>
                      )}
                      {isSel && <Pxi name="check" size={9} style={{ color: 'var(--amber)', flexShrink: 0 }} />}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Dropdown footer */}
          <div style={{
            padding: '5px 10px', borderTop: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0, gap: 6,
          }}>
            {allModels.length > 0 ? (
              <>
                <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>
                  {allModels.length} models · OpenRouter
                </span>
                {freshLabel && (
                  <span style={{ fontSize: 9.5, color: 'var(--tx-muted)' }}>
                    {freshLabel}
                  </span>
                )}
              </>
            ) : (
              <span style={{ fontSize: 9.5, color: 'var(--tx-tertiary)' }}>
                Save API key in Settings to load all models
              </span>
            )}
          </div>
        </div>
      )}

      {/* Model trigger button */}
      <Section
        icon="sparkles"
        label="Model"
        open={open}
        onToggle={onToggle}
      >
        <button
          onClick={() => {
            const opening = !dropdownOpen
            setDropdownOpen(opening)
            if (opening && modelsLastFetched) {
              const age = Date.now() - modelsLastFetched
              if (age < 60_000) setFreshLabel('just now')
              else if (age < 3_600_000) setFreshLabel(`${Math.round(age / 60_000)}m ago`)
              else setFreshLabel(`${Math.round(age / 3_600_000)}h ago`)
            }
          }}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', borderRadius: 8,
            background: dropdownOpen ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
            border: `1px solid ${dropdownOpen ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.05)'}`,
            cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            transition: 'background 0.1s, border-color 0.1s',
            position: 'relative',
          }}
          onMouseEnter={e => { if (!dropdownOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' } }}
          onMouseLeave={e => { if (!dropdownOpen) { e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' } }}
        >
          {/* Family icon */}
          <div style={{
            width: 22, height: 22, borderRadius: 6, flexShrink: 0,
            background: `${meta.color}18`, border: `1px solid ${meta.color}28`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Pxi name="sparkles" size={9} style={{ color: meta.color }} />
          </div>
          {/* Name */}
          <span style={{
            flex: 1, fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-mono)',
            color: 'var(--tx-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>
            {shortModel}
          </span>
          <Pxi name="angle-down" size={9} style={{
            color: 'var(--tx-muted)', flexShrink: 0,
            transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s',
          }} />
        </button>

        {/* Provider family pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, marginTop: 'var(--space-1)',
          fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-display)',
          letterSpacing: '0.08em', textTransform: 'uppercase', color: meta.color, opacity: 0.75,
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: meta.color, flexShrink: 0, boxShadow: `0 0 5px ${meta.color}88` }} />
          {meta.label}
        </div>

        {/* Provider toggle */}
        <ProviderToggle />
      </Section>
    </div>
  )
}

// ── Provider Toggle ───────────────────────────────────────────────────────────

const PROVIDERS = [
  { id: 'openrouter', label: 'OpenRouter', icon: 'cloud', color: 'var(--amber)', desc: 'Cloud API' },
  { id: 'auto',       label: 'Auto',       icon: 'bolt',     color: '#22c55e', desc: 'Best route' },
] as const

function ProviderToggle() {
  const { routerConfig, setRouterConfig, gateways, gatewayHealth } = useAppStore()
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

  // Health dot
  function healthOf(gwId: string) {
    if (!gatewayHealth) return null
    return gatewayHealth.find(h => h.gatewayId === gwId)
  }

  return (
    <div style={{ marginTop: 'var(--space-2)' }}>
      {/* Segmented control for provider selection */}
      <div style={{ display: 'flex', gap: 4, padding: '4px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {PROVIDERS.map(p => {
          const isSel = activeProvider === p.id
          const health = healthOf(p.id)
          const isHealthy = !health || health.status === 'healthy'
          return (
            <button
              key={p.id}
              onClick={() => pickProvider(p.id)}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                padding: '6px 8px',
                borderRadius: 6,
                cursor: 'pointer',
                background: isSel ? `${p.color}20` : 'transparent',
                border: isSel ? `1px solid ${p.color}55` : '1px solid transparent',
                color: isSel ? p.color : 'var(--tx-secondary)',
                fontSize: 11,
                fontWeight: isSel ? 600 : 400,
                transition: 'all 0.12s',
                fontFamily: 'inherit',
                position: 'relative',
              }}
              onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
            >
              <Pxi name={p.icon} size={10} />
              <span>{p.label}</span>
              {/* Health indicator */}
              {health && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%', flexShrink: 0,
                  background: isHealthy ? '#22c55e' : health.status === 'degraded' ? 'var(--amber)' : '#f87171',
                  boxShadow: isHealthy ? '0 0 4px #22c55e88' : 'none',
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* Budget toggle (only when not auto) */}
      {activeProvider !== 'auto' && (
        <div style={{ marginTop: 'var(--space-2)', display: 'flex', gap: 5 }}>
          {(['free', 'paid'] as const).map(b => {
            const isSel = routerConfig?.budget === b
            return (
              <button key={b}
                onClick={() => setRouterConfig({ budget: b })}
                style={{
                  flex: 1, padding: '5px 8px', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit',
                  fontSize: 11, fontWeight: isSel ? 600 : 400,
                  border: `1px solid ${isSel ? (b === 'free' ? 'rgba(99,102,241,0.4)' : 'oklch(64% 0.214 40.1 / 0.4)') : 'rgba(255,255,255,0.07)'}`,
                  background: isSel ? (b === 'free' ? 'rgba(99,102,241,0.1)' : 'oklch(64% 0.214 40.1 / 0.1)') : 'transparent',
                  color: isSel ? (b === 'free' ? '#818cf8' : 'var(--amber)') : 'var(--tx-secondary)',
                  transition: 'all 0.12s',
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
              >
                {b === 'free' ? 'Free only' : 'Paid'}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Parameters Section ─────────────────────────────────────────────────────────

const DEFAULT_TEMP    = 0.7
const DEFAULT_MAXTOK  = 4096

function ParametersSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [temp, setTemp]       = useState<number>(() => loadPref(TEMP_KEY, DEFAULT_TEMP))
  const [maxTok, setMaxTok]   = useState<number>(() => loadPref(MAXTOK_KEY, DEFAULT_MAXTOK))

  // Persist on change
  useEffect(() => { savePref(TEMP_KEY, temp) },    [temp])
  useEffect(() => { savePref(MAXTOK_KEY, maxTok) }, [maxTok])

  function reset() { setTemp(DEFAULT_TEMP); setMaxTok(DEFAULT_MAXTOK) }
  const isDefault = temp === DEFAULT_TEMP && maxTok === DEFAULT_MAXTOK

  return (
    <Section
      icon="sliders-h"
      label="Parameters"
      open={open}
      onToggle={onToggle}
      badge={
        !isDefault && (
          <button
            onClick={e => { e.stopPropagation(); reset() }}
            title="Reset to defaults"
            style={{
              padding: '1px 6px', fontSize: 9, borderRadius: 4, cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'var(--tx-tertiary)', fontFamily: 'inherit',
              transition: 'color 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--tx-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
          >
            Reset
          </button>
        )
      }
    >
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
    <div style={{ marginBottom: 'var(--space-2)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 11, color: 'var(--tx-secondary)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {hint && <span style={{ fontSize: 9.5, color: hintColor ?? 'var(--tx-muted)' }}>{hint}</span>}
          <span style={{
            fontSize: 10, fontFamily: 'var(--font-mono)',
            color: 'var(--tx-primary)', background: 'rgba(255,255,255,0.06)',
            padding: '1px 5px', borderRadius: 4,
          }}>
            {format(value)}
          </span>
        </div>
      </div>
      <div style={{ position: 'relative', height: 20, display: 'flex', alignItems: 'center' }}>
        {/* Track */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 3, borderRadius: 2,
          background: 'rgba(255,255,255,0.08)',
        }}>
          <div style={{
            height: '100%', borderRadius: 2, width: `${pct}%`,
            background: 'oklch(64% 0.214 40.1)',
          }} />
        </div>
        <input
          type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          style={{
            position: 'absolute', left: 0, right: 0, width: '100%',
            appearance: 'none', background: 'transparent', cursor: 'pointer', height: 20,
          }}
        />
      </div>
    </div>
  )
}

// ── System Prompt Section ──────────────────────────────────────────────────────

function SystemPromptSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const [prompt, setPrompt] = useState<string>(() => loadPref(SYSTEM_PROMPT_KEY, ''))
  const [chars, setChars] = useState(prompt.length)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleChange = useCallback((v: string) => {
    setPrompt(v)
    setChars(v.length)
    savePref(SYSTEM_PROMPT_KEY, v)
    // Auto-resize
    const el = textareaRef.current
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px` }
  }, [])

  return (
    <Section icon="comment-dots" label="System Prompt" open={open} onToggle={onToggle}>
      <div style={{ position: 'relative' }}>
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={e => handleChange(e.target.value)}
          placeholder="Add a system prompt or persona for the AI…"
          rows={3}
          style={{
            width: '100%', resize: 'none', overflow: 'hidden',
            padding: '8px 10px', borderRadius: 8, fontSize: 11.5, lineHeight: 1.55,
            color: 'var(--tx-secondary)', background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            fontFamily: 'var(--font-sans)', outline: 'none',
            transition: 'border-color 0.12s',
            minHeight: 72, maxHeight: 200,
          }}
          onFocus={e => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.4)' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
        />
        {chars > 0 && (
          <span style={{
            position: 'absolute', bottom: 6, right: 8,
            fontSize: 9, color: 'var(--tx-muted)', fontFamily: 'var(--font-mono)',
            pointerEvents: 'none',
          }}>
            {chars}
          </span>
        )}
      </div>
      {prompt && (
        <button
          onClick={() => handleChange('')}
          style={{
            marginTop: 4, padding: '3px 8px', fontSize: 9.5, borderRadius: 4,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.06)',
            color: 'var(--tx-muted)', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'color 0.1s',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = '#f87171' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--tx-muted)' }}
        >
          Clear
        </button>
      )}
    </Section>
  )
}

// ── Stats Section ──────────────────────────────────────────────────────────────

function StatsSection({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { activeTaskId, taskRouterState, messages, routerConfig } = useAppStore()
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
    <Section icon="chart-bar" label="Stats" open={open} onToggle={onToggle}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1-5)' }}>
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
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 5,
                background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)',
              }}>
                <Pxi name="leaf" size={9} style={{ color: '#22c55e' }} />
                <span style={{ fontSize: 10, color: '#22c55e' }}>Running on free tier</span>
              </div>
            )}
          </>
        )}
        {routerConfig?.budget === 'free' && !stats && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 5,
            background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <Pxi name="info-circle" size={9} style={{ color: '#818cf8' }} />
            <span style={{ fontSize: 10, color: '#818cf8' }}>Free-only mode active</span>
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
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontSize: 11, color: 'var(--tx-tertiary)' }}>{label}</span>
      <span style={{
        fontSize: 11, color: valueColor ?? 'var(--tx-secondary)',
        fontFamily: mono ? 'var(--font-mono)' : 'inherit',
        fontVariantNumeric: 'tabular-nums',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140,
        textAlign: 'right',
      }}>
        {value}
      </span>
    </div>
  )
}
