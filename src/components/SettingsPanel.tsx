import React, { useState, useRef, useEffect, useMemo } from 'react'
import { tauriInvoke } from '../tauri'
import { fetchOpenRouterModels, formatTokenPrice, type OpenRouterModel } from '../agent/llm'
import { useAppStore, type RouterConfig } from '../store'
import { Pxi } from './Pxi'
import { WorkspacePicker } from './WorkspacePicker'
import { getExtensionId, setExtensionId, pingExtension } from '../agent/browserBridge'

// ─── Curated fallback models (shown before user fetches the full list) ─────────

const FALLBACK_MODELS: OpenRouterModel[] = [
  { id: 'anthropic/claude-3.7-sonnet',          name: 'Claude 3.7 Sonnet',          description: 'Recommended — best coding + reasoning balance', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',  completion: '0.000015'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3.7-sonnet:thinking', name: 'Claude 3.7 Sonnet (Thinking)', description: 'Extended thinking mode', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',  completion: '0.000015'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3.5-sonnet',          name: 'Claude 3.5 Sonnet',          description: '', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000003',  completion: '0.000015'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'anthropic/claude-3-haiku',             name: 'Claude 3 Haiku',             description: 'Fast & cheap', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000025', completion: '0.00000125' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/gpt-4.1',                       name: 'GPT-4.1',                   description: 'Newest OpenAI flagship', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000002',  completion: '0.000008'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/gpt-4.1-mini',                  name: 'GPT-4.1 Mini',              description: 'Fast & cheap', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000004', completion: '0.0000016' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/gpt-4o',                        name: 'GPT-4o',                    description: '', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000025', completion: '0.00001'   }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'openai/o3-mini',                       name: 'o3-mini',                   description: 'Reasoning', context_length: 200000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000011', completion: '0.0000044' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'google/gemini-2.5-pro-preview',        name: 'Gemini 2.5 Pro',            description: 'Newest Google flagship', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000125', completion: '0.000010' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'google/gemini-2.0-flash-001',          name: 'Gemini 2.0 Flash',          description: 'Fast', context_length: 1000000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.0000001', completion: '0.0000004' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'deepseek/deepseek-chat',               name: 'DeepSeek V3',               description: 'Budget', context_length: 64000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000027', completion: '0.0000011' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'deepseek/deepseek-r1',                 name: 'DeepSeek R1',               description: 'Reasoning, open source', context_length: 64000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000055', completion: '0.00000219' }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'mistralai/mistral-large',              name: 'Mistral Large',             description: '', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.000002',  completion: '0.000006'  }, top_provider: { context_length: null, is_moderated: false } },
  { id: 'meta-llama/llama-3.3-70b-instruct',   name: 'Llama 3.3 70B',            description: 'Open source', context_length: 128000, architecture: { tokenizer: '', instruct_type: null, input_modalities: ['text'], output_modalities: ['text'] }, pricing: { prompt: '0.00000012', completion: '0.0000003' }, top_provider: { context_length: null, is_moderated: false } },
]

/** Format context length to human-readable (200K, 1M, etc.) */
function fmtCtx(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M ctx`
  if (n >= 1_000)     return `${Math.round(n / 1_000)}K ctx`
  return `${n} ctx`
}

/** Extract the provider family name from a model ID (e.g. "anthropic/…" → "Anthropic") */
function familyLabel(id: string): string {
  const prefix = id.split('/')[0] ?? id
  return prefix.charAt(0).toUpperCase() + prefix.slice(1).replace(/-/g, ' ')
}

interface SettingsPanelProps {
  onClose: () => void
}

type ValidationErrors = Partial<Record<'apiKey' | 'workspacePath', string>>

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
      apiKey, model, workspacePath,
      setApiKey, setModel, setWorkspacePath, setApiBase, setProvider,
      openRouterModels, setOpenRouterModels,
      braveSearchKey, setBraveSearchKey,
      googleCseKey, setGoogleCseKey,
      googleCseId, setGoogleCseId,
      serperKey, setSerperKey,
      tavilyKey, setTavilyKey,
      searxngUrl, setSearxngUrl,
      searchProvider, setSearchProvider,
      maxIterations, setMaxIterations,
      addRecentWorkspacePath,
      routerConfig, setRouterConfig,
    } = useAppStore()

  const [localKey, setLocalKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model)
  const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
  const [localBraveKey, setLocalBraveKey] = useState(braveSearchKey || '')
  const [localGoogleCseKey, setLocalGoogleCseKey] = useState(googleCseKey || '')
  const [localGoogleCseId, setLocalGoogleCseId] = useState(googleCseId || '')
  const [localSerperKey, setLocalSerperKey] = useState(serperKey || '')
  const [localTavilyKey, setLocalTavilyKey] = useState(tavilyKey || '')
  const [localSearxngUrl, setLocalSearxngUrl] = useState(searxngUrl || '')
  const [localSearchProvider, setLocalSearchProvider] = useState(searchProvider || 'auto')
  const [localMaxIterations, setLocalMaxIterations] = useState(String(maxIterations ?? 50))

  // Code execution state
  const {
    e2bApiKey, setE2bApiKey,
    executionMode, setExecutionMode,
    sandboxStatus, sandboxStatusMessage,
  } = useAppStore()
  const [localE2bKey, setLocalE2bKey] = useState(e2bApiKey || '')
  const [localExecutionMode, setLocalExecutionMode] = useState(executionMode || 'e2b')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  // Local router config state
  const [localRouterMode, setLocalRouterMode] = useState(routerConfig.mode)
  const [localRouterBudget, setLocalRouterBudget] = useState(routerConfig.budget)
  const [localModelOverrides, setLocalModelOverrides] = useState<Record<string, boolean>>(routerConfig.modelOverrides)

  const [modelOpen, setModelOpen] = useState(false)
  const [modelSearch, setModelSearch] = useState('')
  const modelRef = useRef<HTMLDivElement>(null)
  const modelSearchRef = useRef<HTMLInputElement>(null)

  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null)
  const [fetchedCount, setFetchedCount] = useState<number | null>(
    openRouterModels.length > 0 ? openRouterModels.length : null
  )

  // The active model list: fetched rich list if available, else curated fallback
  const modelList: OpenRouterModel[] = openRouterModels.length > 0 ? openRouterModels : FALLBACK_MODELS

  // Filter + group models by family
  const filteredModels = useMemo(() => {
    const q = modelSearch.trim().toLowerCase()
    if (!q) return modelList
    return modelList.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        (m.description ?? '').toLowerCase().includes(q),
    )
  }, [modelList, modelSearch])

  const groupedModels = useMemo(() => {
    const groups = new Map<string, OpenRouterModel[]>()
    for (const m of filteredModels) {
      const family = familyLabel(m.id)
      if (!groups.has(family)) groups.set(family, [])
      groups.get(family)!.push(m)
    }
    return groups
  }, [filteredModels])

  const selectedModelObj = modelList.find((m) => m.id === localModel)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelOpen(false)
        setModelSearch('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (modelOpen) {
      setTimeout(() => modelSearchRef.current?.focus(), 50)
    }
  }, [modelOpen])

  async function handleFetchModels() {
    if (!localKey.trim()) {
      setFetchModelsError('Enter your OpenRouter API key first')
      return
    }
    setFetchingModels(true)
    setFetchModelsError(null)
    try {
      // Always use the OR fetch function directly — Tauri path also calls OR
      const models = await fetchOpenRouterModels(localKey.trim())
      setOpenRouterModels(models)
      setFetchedCount(models.length)
      setFetchModelsError(null)
      // If current model not in new list, keep it anyway — user may have typed custom ID
    } catch (e) {
      setFetchModelsError(e instanceof Error ? e.message : String(e))
    } finally {
      setFetchingModels(false)
    }
  }

  function validate(): ValidationErrors {
    const errs: ValidationErrors = {}
    if (!localKey.trim()) {
      errs.apiKey = 'API key is required'
    } else if (!localKey.trim().startsWith('sk-or-')) {
      errs.apiKey = 'OpenRouter keys start with sk-or-… — get one at openrouter.ai/keys'
    }
    if (localWorkspace.trim() && !localWorkspace.trim().startsWith('/')) {
      errs.workspacePath = 'Must be an absolute path (starting with /)'
    }
    return errs
  }

  function handleReset() {
    if (!confirm('Reset all settings to defaults? This will clear your API keys and preferences.')) return
    setLocalKey('')
    setLocalModel('anthropic/claude-3.7-sonnet')
    setLocalWorkspace('')
    setLocalBraveKey('')
    setLocalGoogleCseKey('')
    setLocalGoogleCseId('')
    setLocalSerperKey('')
    setLocalTavilyKey('')
    setLocalSearxngUrl('')
    setLocalSearchProvider('auto')
    setLocalMaxIterations('50')
    setLocalE2bKey('')
    setLocalExecutionMode('e2b')
    setLocalRouterMode('auto')
    setLocalRouterBudget('paid')
    setLocalModelOverrides({})
    setExtensionId('')
    try { localStorage.removeItem('nasus_extension_id') } catch { /* ignore */ }
    setErrors({})
  }

  async function checkAndSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
    const OR_BASE = 'https://openrouter.ai/api/v1'
    setApiKey(localKey.trim())
    setModel(localModel)
    setWorkspacePath(localWorkspace.trim())
    if (localWorkspace.trim()) addRecentWorkspacePath(localWorkspace.trim())
    setApiBase(OR_BASE)
    setProvider('openrouter')
    setBraveSearchKey(localBraveKey.trim())
    setGoogleCseKey(localGoogleCseKey.trim())
    setGoogleCseId(localGoogleCseId.trim())
    setSerperKey(localSerperKey.trim())
    setTavilyKey(localTavilyKey.trim())
    setSearxngUrl(localSearxngUrl.trim())
    setSearchProvider(localSearchProvider)
    const parsedIter = Math.max(1, Math.min(200, parseInt(localMaxIterations, 10) || 50))
    setMaxIterations(parsedIter)
    setE2bApiKey(localE2bKey.trim())
    setExecutionMode(localExecutionMode)
    // Save router config
    setRouterConfig({
      mode: localRouterMode,
      budget: localRouterBudget,
      modelOverrides: localModelOverrides,
    })
    await tauriInvoke('save_router_settings', {
      mode: localRouterMode,
      budget: localRouterBudget,
      modelOverrides: localModelOverrides,
    }).catch(() => { /* non-blocking */ })
    await tauriInvoke('save_config', {
      apiKey: localKey.trim(),
      model: localModel,
      workspacePath: localWorkspace.trim(),
      apiBase: OR_BASE,
      provider: 'openrouter',
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setSaved(false); onClose() }, 900)
  }

  const busy = saving

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ width: '100%', maxWidth: 448, borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', background: '#111', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 80px)' }}
        className="fade-in"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Pxi name="cog" size={13} style={{ color: 'var(--tx-tertiary)' }} />
            <h2 style={{ fontSize: 14, fontWeight: 600, fontFamily: 'var(--font-display)', letterSpacing: '-0.01em', color: 'var(--tx-primary)', margin: 0 }}>Settings</h2>
          </div>
          {/* OpenRouter badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 6, background: 'oklch(64% 0.214 40.1 / 0.12)', color: 'var(--amber-soft)', fontWeight: 500, letterSpacing: '0.04em' }}>
              OpenRouter
            </span>
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', transition: 'color 0.12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
            >
              <Pxi name="times" size={13} />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px', minHeight: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 4 }}>

            {/* ── API Key ── */}
            <Field label="OpenRouter API Key" icon="lock"
              hint={<>Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>openrouter.ai/keys</a></>}
              error={errors.apiKey}
            >
              <input
                type="password"
                value={localKey}
                onChange={(e) => { setLocalKey(e.target.value); setErrors((p) => ({ ...p, apiKey: undefined })) }}
                placeholder="sk-or-v1-…"
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                  color: 'var(--tx-primary)', background: '#0d0d0d',
                  border: `1px solid ${errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  transition: 'border-color 0.12s',
                }}
                className="placeholder-[var(--tx-muted)]"
                onFocus={(e) => { e.currentTarget.style.borderColor = errors.apiKey ? 'rgba(239,68,68,0.6)' : 'oklch(64% 0.214 40.1 / 0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
              />
            </Field>

            {/* ── Model ── */}
            <Field label="Model" icon="sparkles">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Fetch row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={handleFetchModels}
                    disabled={fetchingModels}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '4px 10px', borderRadius: 8, fontSize: 11,
                      background: 'rgba(255,255,255,0.07)', border: 'none',
                      cursor: fetchingModels ? 'default' : 'pointer',
                      color: 'var(--tx-secondary)', transition: 'color 0.12s',
                      opacity: fetchingModels ? 0.45 : 1,
                    }}
                    onMouseEnter={(e) => { if (!fetchingModels) e.currentTarget.style.color = 'var(--tx-primary)' }}
                    onMouseLeave={(e) => { if (!fetchingModels) e.currentTarget.style.color = 'var(--tx-secondary)' }}
                    title="Fetch all available models from OpenRouter"
                  >
                    <Pxi name={fetchingModels ? 'spinner-third' : 'arrow-rotate-right'} size={9} />
                    {fetchingModels ? 'Fetching…' : 'Fetch all models'}
                  </button>
                  {fetchModelsError && (
                    <span style={{ fontSize: 11, color: '#f87171', flex: 1 }}>{fetchModelsError}</span>
                  )}
                  {fetchedCount !== null && !fetchModelsError && (
                    <span style={{ fontSize: 11, color: 'var(--tx-tertiary)' }}>{fetchedCount} models</span>
                  )}
                  {openRouterModels.length === 0 && !fetchedCount && !fetchModelsError && (
                    <span style={{ fontSize: 11, color: 'var(--tx-tertiary)' }}>Showing curated list</span>
                  )}
                </div>

                {/* Model dropdown */}
                <div style={{ position: 'relative' }} ref={modelRef}>
                  <button
                    type="button"
                    onClick={() => setModelOpen((o) => !o)}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', cursor: 'pointer',
                      background: '#0d0d0d',
                      border: `1px solid ${modelOpen ? 'oklch(64% 0.214 40.1 / 0.5)' : 'rgba(255,255,255,0.08)'}`,
                      color: 'var(--tx-primary)', transition: 'border-color 0.12s',
                      gap: 8,
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                      {selectedModelObj?.name ?? localModel}
                    </span>
                    {selectedModelObj && (
                      <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {fmtCtx(selectedModelObj.context_length)} · {formatTokenPrice(selectedModelObj.pricing?.completion)}/tok out
                      </span>
                    )}
                    <Pxi name={modelOpen ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
                  </button>

                  {modelOpen && (
                    <div style={{
                      position: 'absolute', zIndex: 20, width: '100%', marginTop: 4, borderRadius: 12,
                      boxShadow: '0 16px 40px rgba(0,0,0,0.5)', background: '#161616',
                      border: '1px solid rgba(255,255,255,0.08)',
                      display: 'flex', flexDirection: 'column',
                      maxHeight: 320,
                    }}>
                      {/* Search */}
                      <div style={{ padding: '8px 8px 4px', flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 8, background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <Pxi name="search" size={9} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} />
                          <input
                            ref={modelSearchRef}
                            type="text"
                            value={modelSearch}
                            onChange={(e) => setModelSearch(e.target.value)}
                            placeholder="Search models…"
                            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: 'var(--tx-primary)' }}
                            className="placeholder-[var(--tx-muted)]"
                          />
                          {modelSearch && (
                            <button type="button" onClick={() => setModelSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', padding: 0, lineHeight: 1 }}>
                              <Pxi name="times" size={9} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Grouped list */}
                      <div style={{ overflowY: 'auto', flex: 1 }}>
                        {groupedModels.size === 0 ? (
                          <div style={{ padding: '12px', fontSize: 12, color: 'var(--tx-tertiary)', textAlign: 'center' }}>
                            No models match "{modelSearch}"
                          </div>
                        ) : [...groupedModels.entries()].map(([family, models]) => (
                          <div key={family}>
                            {/* Group header */}
                            <div style={{
                              padding: '6px 12px 3px',
                              fontSize: 10, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
                              color: 'var(--tx-tertiary)',
                              borderTop: '1px solid rgba(255,255,255,0.04)',
                            }}>
                              {family}
                            </div>
                            {models.map((m) => {
                              const isSelected = m.id === localModel
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => { setLocalModel(m.id); setModelOpen(false); setModelSearch('') }}
                                  style={{
                                    width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                                    padding: '7px 12px', textAlign: 'left', border: 'none', cursor: 'pointer', gap: 2,
                                    color: isSelected ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                                    background: isSelected ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                                    transition: 'background 0.1s',
                                  }}
                                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 8 }}>
                                    <span style={{ fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{m.name}</span>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                                      <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', whiteSpace: 'nowrap' }}>
                                        {fmtCtx(m.context_length)}
                                      </span>
                                      <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', whiteSpace: 'nowrap' }}>
                                        {formatTokenPrice(m.pricing?.completion)}/tok
                                      </span>
                                      {isSelected && <Pxi name="check" size={10} style={{ color: 'var(--amber)' }} />}
                                    </div>
                                  </div>
                                  {m.description && (
                                    <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', lineHeight: 1.4 }}>{m.description}</span>
                                  )}
                                </button>
                              )
                            })}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Field>

              {/* ── Model Router ── */}
              <ModelRouterSection
                mode={localRouterMode}
                onModeChange={setLocalRouterMode}
                budget={localRouterBudget}
                onBudgetChange={setLocalRouterBudget}
                modelOverrides={localModelOverrides}
                onModelOverridesChange={setLocalModelOverrides}
              />

              {/* ── Workspace Path ── */}
            <Field
              label="Workspace Path"
              icon="folder-open"
              hint={<>Host directory mounted into the sandbox at <code style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--tx-secondary)' }}>/workspace</code></>}
              error={errors.workspacePath}
            >
              <WorkspacePicker
                value={localWorkspace}
                onChange={(v) => { setLocalWorkspace(v); setErrors((p) => ({ ...p, workspacePath: undefined })) }}
                error={errors.workspacePath}
              />
            </Field>

              {/* ── Web Search ── */}
              <SearchSection
                searchProvider={localSearchProvider}
                onSearchProviderChange={setLocalSearchProvider}
                braveKey={localBraveKey}
                onBraveKeyChange={setLocalBraveKey}
                googleCseKey={localGoogleCseKey}
                onGoogleCseKeyChange={setLocalGoogleCseKey}
                googleCseId={localGoogleCseId}
                onGoogleCseIdChange={setLocalGoogleCseId}
                serperKey={localSerperKey}
                onSerperKeyChange={setLocalSerperKey}
                tavilyKey={localTavilyKey}
                onTavilyKeyChange={setLocalTavilyKey}
                searxngUrl={localSearxngUrl}
                onSearxngUrlChange={setLocalSearxngUrl}
              />

            {/* ── Code Execution ── */}
            <ExecutionSection
              executionMode={localExecutionMode}
              onExecutionModeChange={setLocalExecutionMode}
              e2bKey={localE2bKey}
              onE2bKeyChange={setLocalE2bKey}
              sandboxStatus={sandboxStatus}
              sandboxStatusMessage={sandboxStatusMessage}
            />

            {/* ── Browser Access ── */}
            <BrowserAccessSection />

            {/* ── Max Iterations ── */}
            <Field label="Max Iterations" icon="repeat" hint="Max agent loop iterations per task (1–200). Higher values let the agent work longer on complex tasks.">
              <input
                type="number"
                min={1}
                max={200}
                value={localMaxIterations}
                onChange={(e) => setLocalMaxIterations(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                  color: 'var(--tx-primary)', background: '#0d0d0d',
                  border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.12s',
                }}
                className="placeholder-[var(--tx-muted)]"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </Field>

          </div>
        </div>{/* end scrollable */}

        {/* Actions */}
        <div style={{ padding: '12px 24px 20px', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <button
            onClick={handleReset}
            style={{
              padding: '8px 14px', fontSize: 11, borderRadius: 8, background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer',
              color: 'var(--tx-tertiary)', transition: 'color 0.12s, border-color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.3)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            title="Reset all settings to defaults"
          >
            Reset
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 16px', fontSize: 12, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--tx-secondary)', transition: 'color 0.12s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={checkAndSave}
              disabled={busy}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', fontSize: 12, fontWeight: 600, borderRadius: 8, border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
                background: 'var(--amber)', color: '#000',
                opacity: busy ? 0.45 : 1, transition: 'background 0.12s',
              }}
              onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = 'var(--amber-soft)' }}
              onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = 'var(--amber)' }}
            >
              {saved ? (
                <><Pxi name="check" size={11} style={{ color: '#000' }} /> Saved</>
              ) : saving ? (
                <><Pxi name="spinner-third" size={11} style={{ color: '#000' }} /> Saving…</>
              ) : (
                'Save settings'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── SearchSection ────────────────────────────────────────────────────────────

const SEARCH_PROVIDERS = [
  { id: 'auto',      label: 'Auto',         desc: 'Best available: Serper → Tavily → Brave → Google CSE → SearXNG → DuckDuckGo' },
  { id: 'serper',    label: 'Serper',        desc: 'Google results via Serper API — 2,500 free queries, then $1/1K' },
  { id: 'tavily',    label: 'Tavily',        desc: 'AI-optimized results with direct answers — 1,000 free credits/month' },
  { id: 'brave',     label: 'Brave Search',  desc: '2,000 req/mo free — real web index' },
  { id: 'google',    label: 'Google CSE',    desc: '100 req/day free — Google results via Custom Search' },
  { id: 'searxng',   label: 'SearXNG',       desc: 'Free, no key — public meta-search instances (or self-hosted)' },
  { id: 'wikipedia', label: 'Wikipedia',     desc: 'Free, no key — encyclopedic facts only' },
  { id: 'ddg',       label: 'DuckDuckGo',   desc: 'Free, no key — Instant Answers only (limited)' },
] as const

type SearchProviderId = (typeof SEARCH_PROVIDERS)[number]['id']

function SearchSection({
  searchProvider, onSearchProviderChange,
  braveKey, onBraveKeyChange,
  googleCseKey, onGoogleCseKeyChange,
  googleCseId, onGoogleCseIdChange,
  serperKey, onSerperKeyChange,
  tavilyKey, onTavilyKeyChange,
  searxngUrl, onSearxngUrlChange,
}: {
  searchProvider: string
  onSearchProviderChange: (v: string) => void
  braveKey: string
  onBraveKeyChange: (v: string) => void
  googleCseKey: string
  onGoogleCseKeyChange: (v: string) => void
  googleCseId: string
  onGoogleCseIdChange: (v: string) => void
  serperKey: string
  onSerperKeyChange: (v: string) => void
  tavilyKey: string
  onTavilyKeyChange: (v: string) => void
  searxngUrl: string
  onSearxngUrlChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = SEARCH_PROVIDERS.find((p) => p.id === searchProvider) ?? SEARCH_PROVIDERS[0]

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
    color: 'var(--tx-primary)', background: '#0d0d0d',
    border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.12s',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Provider row */}
      <Field label="Web Search" icon="search"
        hint={<span style={{ color: 'var(--tx-tertiary)' }}>{selected.desc}</span>}
      >
        <div style={{ position: 'relative' }} ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', cursor: 'pointer',
              background: '#0d0d0d',
              border: `1px solid ${open ? 'oklch(64% 0.214 40.1 / 0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: 'var(--tx-primary)', transition: 'border-color 0.12s',
            }}
          >
            <span>{selected.label}</span>
            <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)' }} />
          </button>
          {open && (
            <div style={{
              position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, borderRadius: 12,
              overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {SEARCH_PROVIDERS.map((p) => {
                const isSel = p.id === (searchProvider as SearchProviderId)
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { onSearchProviderChange(p.id); setOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '8px 12px', textAlign: 'left', fontSize: 13, border: 'none', cursor: 'pointer',
                      color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                      background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                      transition: 'background 0.1s', gap: 2,
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{p.label}</span>
                      {isSel && <Pxi name="check" size={10} style={{ color: 'var(--amber)' }} />}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', lineHeight: 1.4 }}>{p.desc}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Field>

      {/* Serper key — show when provider is 'serper' or 'auto' */}
      {(searchProvider === 'serper' || searchProvider === 'auto') && (
        <Field label="Serper API Key" icon="key"
          hint={<>2,500 free queries, then $1/1K. Get a key at <a href="https://serper.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>serper.dev</a>{searchProvider === 'auto' ? ' (optional — used first in Auto mode)' : ''}</>}
        >
          <input type="password" value={serperKey} onChange={(e) => onSerperKeyChange(e.target.value)}
            placeholder="serper API key…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </Field>
      )}

      {/* Tavily key — show when provider is 'tavily' or 'auto' */}
      {(searchProvider === 'tavily' || searchProvider === 'auto') && (
        <Field label="Tavily API Key" icon="key"
          hint={<>1,000 free credits/month, $0.008/credit after. Get a key at <a href="https://tavily.com" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>tavily.com</a>{searchProvider === 'auto' ? ' (optional — used second in Auto mode)' : ''}</>}
        >
          <input type="password" value={tavilyKey} onChange={(e) => onTavilyKeyChange(e.target.value)}
            placeholder="tvly-…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </Field>
      )}

      {/* Brave key — show when provider is 'brave' or 'auto' */}
      {(searchProvider === 'brave' || searchProvider === 'auto') && (
        <Field label="Brave Search API Key" icon="key"
          hint={<>2,000 req/mo free. Get a key at <a href="https://brave.com/search/api/" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>brave.com/search/api</a>{searchProvider === 'auto' ? ' (optional — used as fallback)' : ''}</>}
        >
          <input type="password" value={braveKey} onChange={(e) => onBraveKeyChange(e.target.value)}
            placeholder="BSA…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </Field>
      )}

      {/* Google CSE — show when provider is 'google' or 'auto' */}
      {(searchProvider === 'google' || searchProvider === 'auto') && (
        <>
          <Field label="Google CSE API Key" icon="key"
            hint={<>100 req/day free. Get a key at <a href="https://developers.google.com/custom-search/v1/introduction" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>developers.google.com/custom-search</a>{searchProvider === 'auto' ? ' (optional — used as fallback)' : ''}</>}
          >
            <input type="password" value={googleCseKey} onChange={(e) => onGoogleCseKeyChange(e.target.value)}
              placeholder="AIza…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </Field>
          <Field label="Google CSE Engine ID" icon="magnifying-glass"
            hint="The 'cx' search engine ID from your Programmable Search Engine dashboard."
          >
            <input type="text" value={googleCseId} onChange={(e) => onGoogleCseIdChange(e.target.value)}
              placeholder="017576662512468239146:omuauf_lfve" style={inputStyle} className="placeholder-[var(--tx-muted)]"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </Field>
          </>
        )}

      {/* SearXNG URL — show when provider is 'searxng' or 'auto' */}
      {(searchProvider === 'searxng' || searchProvider === 'auto') && (
        <Field label="SearXNG Instance URL" icon="server"
          hint={<>Optional. Your self-hosted or private SearXNG instance URL (e.g. <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--tx-secondary)' }}>http://localhost:8080</code>). Leave blank to use public instances.</>}
        >
          <input type="text" value={searxngUrl} onChange={(e) => onSearxngUrlChange(e.target.value)}
            placeholder="http://localhost:8080" style={inputStyle} className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </Field>
      )}
    </div>
    )
}

// ─── ExecutionSection ─────────────────────────────────────────────────────────

const EXECUTION_MODES = [
  { id: 'e2b',      label: 'E2B',      desc: 'Cloud sandbox — full Linux + all packages' },
  { id: 'pyodide',  label: 'Pyodide',  desc: 'Browser WebAssembly — no keys required, Python only' },
  { id: 'disabled', label: 'Disabled', desc: 'Code execution is turned off' },
] as const

type ExecutionModeId = (typeof EXECUTION_MODES)[number]['id']

function ExecutionSection({
  executionMode, onExecutionModeChange,
  e2bKey, onE2bKeyChange,
  sandboxStatus, sandboxStatusMessage,
}: {
  executionMode: string
  onExecutionModeChange: (v: string) => void
  e2bKey: string
  onE2bKeyChange: (v: string) => void
  sandboxStatus: 'idle' | 'starting' | 'ready' | 'error'
  sandboxStatusMessage: string
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const selected = EXECUTION_MODES.find((m) => m.id === executionMode) ?? EXECUTION_MODES[0]

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
    color: 'var(--tx-primary)', background: '#0d0d0d',
    border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.12s',
  }

  const statusColor =
    sandboxStatus === 'ready' ? '#22c55e' :
    sandboxStatus === 'starting' ? 'var(--amber)' :
    sandboxStatus === 'error' ? '#f87171' :
    'rgba(255,255,255,0.2)'

  const statusLabel =
    sandboxStatus === 'ready' ? 'Sandbox ready' :
    sandboxStatus === 'starting' ? (sandboxStatusMessage || 'Starting sandbox…') :
    sandboxStatus === 'error' ? (sandboxStatusMessage || 'Sandbox error') :
    e2bKey.trim() ? 'Idle — will start on first use' : 'No API key'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field label="Code Execution" icon="terminal"
        hint={<span style={{ color: 'var(--tx-tertiary)' }}>{selected.desc}</span>}
      >
        <div style={{ position: 'relative' }} ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', cursor: 'pointer',
              background: '#0d0d0d',
              border: `1px solid ${open ? 'oklch(64% 0.214 40.1 / 0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: 'var(--tx-primary)', transition: 'border-color 0.12s',
            }}
          >
            <span>{selected.label}</span>
            <Pxi name={open ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)' }} />
          </button>
          {open && (
            <div style={{
              position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, borderRadius: 12,
              overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)',
              background: '#161616', border: '1px solid rgba(255,255,255,0.08)',
            }}>
              {EXECUTION_MODES.map((m) => {
                const isSel = m.id === (executionMode as ExecutionModeId)
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => { onExecutionModeChange(m.id); setOpen(false) }}
                    style={{
                      width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
                      padding: '8px 12px', textAlign: 'left', fontSize: 13, border: 'none', cursor: 'pointer',
                      color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                      background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                      transition: 'background 0.1s', gap: 2,
                    }}
                    onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                    onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                      <span>{m.label}</span>
                      {isSel && <Pxi name="check" size={10} style={{ color: 'var(--amber)' }} />}
                    </div>
                    <span style={{ fontSize: 10, color: 'var(--tx-tertiary)', lineHeight: 1.4 }}>{m.desc}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </Field>

      {executionMode === 'e2b' && (
        <Field label="E2B API Key" icon="key"
          hint={<>Free $100 credit · No credit card needed · <a href="https://e2b.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>e2b.dev</a></>}
        >
          <input type="password" value={e2bKey} onChange={(e) => onE2bKeyChange(e.target.value)}
            placeholder="e2b_…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          {/* Sandbox status pill */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: statusColor,
              boxShadow: sandboxStatus === 'starting' ? `0 0 6px ${statusColor}` : undefined,
            }} />
            <span style={{ fontSize: 10, color: 'var(--tx-tertiary)' }}>{statusLabel}</span>
          </div>
        </Field>
      )}
    </div>
  )
}

// ─── BrowserAccessSection ─────────────────────────────────────────────────────

function BrowserAccessSection() {
  const [extId, setExtId] = useState(() => getExtensionId())
  const [status, setStatus] = useState<'idle' | 'checking' | 'connected' | 'error'>('idle')
  const [localId, setLocalId] = useState(extId)

  async function handleTest() {
    setStatus('checking')
    setExtensionId(localId)
    setExtId(localId)
    const ok = await pingExtension()
    setStatus(ok ? 'connected' : 'error')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 12, outline: 'none',
    color: 'var(--tx-primary)', background: '#0d0d0d', fontFamily: 'var(--font-mono)',
    border: '1px solid rgba(255,255,255,0.08)', transition: 'border-color 0.12s',
  }

  const statusColor = status === 'connected' ? '#22c55e' : status === 'error' ? '#f87171' : 'var(--tx-tertiary)'
  const statusLabel = status === 'connected' ? 'Connected' : status === 'error' ? 'Not reachable' : status === 'checking' ? 'Checking…' : extId ? 'Not tested' : 'Not configured'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Field label="Browser Access" icon="browser"
        hint="Let Nasus control your real Chrome browser. Requires the Nasus Browser Bridge extension installed in Chrome."
      >
        {/* Status pill */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: statusColor }}>{statusLabel}</span>
        </div>

        {/* Extension ID input */}
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            value={localId}
            onChange={(e) => { setLocalId(e.target.value); setStatus('idle') }}
            placeholder="Extension ID (e.g. abcdefghijklmnopqrstuvwxyzabcdef)"
            style={{ ...inputStyle, flex: 1 }}
            className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
          <button
            type="button"
            onClick={handleTest}
            disabled={!localId.trim() || status === 'checking'}
            style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px',
              borderRadius: 8, fontSize: 12, border: 'none', cursor: (!localId.trim() || status === 'checking') ? 'not-allowed' : 'pointer',
              background: 'rgba(255,255,255,0.07)', color: 'var(--tx-secondary)',
              opacity: (!localId.trim() || status === 'checking') ? 0.45 : 1,
              transition: 'color 0.12s', flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)' }}
          >
            <Pxi name={status === 'checking' ? 'spinner-third' : 'plug'} size={10} />
            Test
          </button>
        </div>
      </Field>

      {/* Install instructions */}
      <div style={{
        padding: '10px 12px', borderRadius: 10, background: '#0d0d0d',
        border: '1px solid rgba(255,255,255,0.06)',
        fontSize: 11, color: 'var(--tx-tertiary)', lineHeight: 1.6,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <div style={{ color: 'var(--tx-secondary)', fontWeight: 500, marginBottom: 2 }}>How to install:</div>
        <div>1. Open Chrome → <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>chrome://extensions</code></div>
        <div>2. Enable <strong style={{ color: 'var(--tx-secondary)' }}>Developer mode</strong> (top right toggle)</div>
        <div>3. Click <strong style={{ color: 'var(--tx-secondary)' }}>Load unpacked</strong> → select the <code style={{ fontFamily: 'var(--font-mono)', fontSize: 10 }}>browser-extension/</code> folder in the Nasus project</div>
        <div>4. Copy the Extension ID shown on the card and paste it above</div>
        <div>5. Click <strong style={{ color: 'var(--tx-secondary)' }}>Test</strong> to verify the connection</div>
      </div>
    </div>
  )
}

// ─── ModelRouterSection ───────────────────────────────────────────────────────

const TIER_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  premium:  { bg: 'rgba(168,85,247,0.12)', color: '#c084fc', label: 'Premium'  },
  standard: { bg: 'rgba(234,179,8,0.1)',   color: 'var(--amber)', label: 'Standard' },
  budget:   { bg: 'rgba(34,197,94,0.1)',   color: '#4ade80',      label: 'Budget'   },
  free:     { bg: 'rgba(99,102,241,0.1)',  color: '#818cf8',      label: 'Free'     },
}

function ModelRouterSection({
  mode, onModeChange,
  budget, onBudgetChange,
  modelOverrides, onModelOverridesChange,
}: {
  mode: string
  onModeChange: (v: string) => void
  budget: string
  onBudgetChange: (v: string) => void
  modelOverrides: Record<string, boolean>
  onModelOverridesChange: (v: Record<string, boolean>) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const { routerConfig } = useAppStore()

  // Use registry from store if available, else fallback to empty
  const registry = routerConfig.registry || []

  // Map backend ModelInfo to UI format
  const allModels = registry.map((m) => ({
    id: m.id,
    name: m.display_name,
    tier: m.cost_tier.toLowerCase() as 'premium' | 'standard' | 'budget' | 'free',
    provider: m.provider as string,
  }))

  // Which models to show based on budget
  const visibleModels = budget === 'free'
    ? allModels.filter((m) => m.tier === 'free')
    : allModels.filter((m) => m.tier !== 'free')

  function isEnabled(modelId: string): boolean {
    if (modelId in modelOverrides) return modelOverrides[modelId]
    return true // default: all enabled
  }

  function toggleModel(modelId: string) {
    const current = isEnabled(modelId)
    onModelOverridesChange({ ...modelOverrides, [modelId]: !current })
  }

  const isAutoMode = mode === 'auto'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header row */}
      <label style={{
        display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2,
        fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-display)',
        textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--tx-secondary)',
      }}>
        <Pxi name="route" size={10} style={{ color: 'var(--tx-tertiary)' }} />
        Model Router
      </label>

      {/* Mode: Auto vs Manual */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          { id: 'auto', label: 'Auto', desc: 'Nasus picks the best model per task' },
          { id: 'manual', label: 'Manual', desc: 'Always use the model selected above' },
        ].map((opt) => {
          const isSel = isAutoMode ? opt.id === 'auto' : opt.id === 'manual'
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onModeChange(opt.id === 'auto' ? 'auto' : mode === 'auto' ? 'anthropic/claude-3.7-sonnet' : mode)}
              title={opt.desc}
              style={{
                flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12,
                border: `1px solid ${isSel ? 'oklch(64% 0.214 40.1 / 0.4)' : 'rgba(255,255,255,0.08)'}`,
                background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                color: isSel ? 'var(--amber)' : 'var(--tx-secondary)',
                cursor: 'pointer', transition: 'all 0.12s', fontWeight: isSel ? 600 : 400,
              }}
              onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
              onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Budget: Free vs Paid (only in Auto mode) */}
      {isAutoMode && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--tx-tertiary)', marginBottom: 6, letterSpacing: '0.04em' }}>
            Budget
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { id: 'paid', label: 'Paid', desc: 'Best models — requires credits on OpenRouter' },
              { id: 'free', label: 'Free only', desc: 'Only models with $0 cost — no credits needed' },
            ].map((opt) => {
              const isSel = budget === opt.id
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onBudgetChange(opt.id)}
                  title={opt.desc}
                  style={{
                    flex: 1, padding: '6px 8px', borderRadius: 8, fontSize: 12,
                    border: `1px solid ${isSel ? (opt.id === 'free' ? 'rgba(129,140,248,0.4)' : 'oklch(64% 0.214 40.1 / 0.4)') : 'rgba(255,255,255,0.08)'}`,
                    background: isSel ? (opt.id === 'free' ? 'rgba(99,102,241,0.1)' : 'oklch(64% 0.214 40.1 / 0.1)') : 'transparent',
                    color: isSel ? (opt.id === 'free' ? '#818cf8' : 'var(--amber)') : 'var(--tx-secondary)',
                    cursor: 'pointer', transition: 'all 0.12s', fontWeight: isSel ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Hint about free tier */}
      {isAutoMode && budget === 'free' && (
        <div style={{
          padding: '8px 10px', borderRadius: 8, fontSize: 11,
          background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)',
          color: '#a5b4fc', lineHeight: 1.55,
        }}>
          Free models are rate-limited by OpenRouter (typically ~50 req/day). No API credits needed.
        </div>
      )}

      {/* Enabled models list — collapsible */}
      {isAutoMode && (
        <div>
          <button
            type="button"
            onClick={() => setExpanded((o) => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 11, color: 'var(--tx-tertiary)', padding: '2px 0',
              transition: 'color 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
          >
            <Pxi name={expanded ? 'chevron-down' : 'chevron-right'} size={9} />
            <span>{expanded ? 'Hide' : 'Customize'} enabled models ({visibleModels.filter((m) => isEnabled(m.id)).length}/{visibleModels.length})</span>
          </button>

          {expanded && (
            <div style={{
              marginTop: 8, borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              overflow: 'hidden',
            }}>
              {visibleModels.map((m, i) => {
                const tier = TIER_COLORS[m.tier] ?? TIER_COLORS.standard
                const enabled = isEnabled(m.id)
                return (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 12px',
                      background: enabled ? 'transparent' : 'rgba(0,0,0,0.2)',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : undefined,
                      transition: 'background 0.1s',
                    }}
                  >
                    {/* Toggle */}
                    <button
                      type="button"
                      onClick={() => toggleModel(m.id)}
                      style={{
                        width: 28, height: 16, borderRadius: 8, flexShrink: 0,
                        border: 'none', cursor: 'pointer', position: 'relative',
                        background: enabled ? 'var(--amber)' : 'rgba(255,255,255,0.12)',
                        transition: 'background 0.15s',
                        padding: 0,
                      }}
                    >
                      <span style={{
                        position: 'absolute', top: 2, borderRadius: '50%',
                        width: 12, height: 12,
                        background: '#fff',
                        left: enabled ? 'calc(100% - 14px)' : 2,
                        transition: 'left 0.15s',
                        display: 'block',
                      }} />
                    </button>

                    {/* Model info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 12, color: enabled ? 'var(--tx-primary)' : 'var(--tx-tertiary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        transition: 'color 0.1s',
                      }}>
                        {m.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--tx-tertiary)', marginTop: 1 }}>
                        {m.provider}
                      </div>
                    </div>

                    {/* Tier badge */}
                    <span style={{
                      fontSize: 9.5, padding: '2px 6px', borderRadius: 5, flexShrink: 0,
                      background: tier.bg, color: tier.color, fontWeight: 500,
                    }}>
                      {tier.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label, icon, hint, error, children,
}: {
  label: string
  icon: string
  hint?: React.ReactNode
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
        <label
          style={{
            display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6,
            fontSize: 11, fontWeight: 500, fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.1em',
            /* Label: secondary #ababab ≈ 7.9:1 */
            color: 'var(--tx-secondary)',
          }}
        >
        <Pxi name={icon} size={10} style={{ color: 'var(--tx-tertiary)' }} />
        {label}
      </label>
      {children}
      {error ? (
        <p style={{ marginTop: 4, fontSize: 11, display: 'flex', alignItems: 'center', gap: 4, lineHeight: 1.5, color: '#f87171' }}>
          <Pxi name="exclamation-triangle" size={9} />
          {error}
        </p>
      ) : hint ? (
        /* Hint: tertiary #757575 ≈ 4.6:1 — clearly legible supplemental text */
        <p style={{ marginTop: 4, fontSize: 11, lineHeight: 1.55, color: 'var(--tx-tertiary)' }}>{hint}</p>
      ) : null}
    </div>
  )
}
