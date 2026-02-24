import React, { useState, useRef, useEffect } from 'react'
import { tauriInvoke } from '../tauri'
import { fetchModels as fetchModelsFromLlm } from '../agent/llm'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'
import { WorkspacePicker } from './WorkspacePicker'
import { getExtensionId, setExtensionId, pingExtension } from '../agent/browserBridge'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// ─── Provider definitions ──────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    keyHint: <>Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>openrouter.ai/keys</a></>,
    keyPrefix: 'sk-or-',
    keyPlaceholder: 'sk-or-v1-…',
  },
  {
    id: 'litellm',
    label: 'LiteLLM Proxy',
    base: 'http://localhost:4000/v1',
    keyHint: 'Your LiteLLM proxy master key, or leave blank if auth is disabled.',
    keyPrefix: null,
    keyPlaceholder: 'sk-… or leave blank',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    base: 'https://api.openai.com/v1',
    keyHint: <>Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>platform.openai.com</a></>,
    keyPrefix: 'sk-',
    keyPlaceholder: 'sk-…',
  },
  {
    id: 'custom',
    label: 'Custom',
    base: '',
    keyHint: 'API key for your custom endpoint.',
    keyPrefix: null,
    keyPlaceholder: 'Bearer token or API key',
  },
] as const

type ProviderId = (typeof PROVIDERS)[number]['id']

// ─── Default OpenRouter model list ────────────────────────────────────────────

const OPENROUTER_MODELS = [
  // Anthropic
  { value: 'anthropic/claude-sonnet-4',              label: 'Claude Sonnet 4',              tag: 'Newest' },
  { value: 'anthropic/claude-3.7-sonnet',            label: 'Claude 3.7 Sonnet',            tag: 'Recommended' },
  { value: 'anthropic/claude-3.7-sonnet:thinking',   label: 'Claude 3.7 Sonnet (Thinking)', tag: 'Extended thinking' },
  { value: 'anthropic/claude-3.5-sonnet',            label: 'Claude 3.5 Sonnet',            tag: null },
  { value: 'anthropic/claude-3-haiku',               label: 'Claude 3 Haiku',               tag: 'Fast & cheap' },
  // OpenAI
  { value: 'openai/gpt-4.1',                         label: 'GPT-4.1',                      tag: 'Newest' },
  { value: 'openai/gpt-4.1-mini',                    label: 'GPT-4.1 Mini',                 tag: 'Fast & cheap' },
  { value: 'openai/gpt-4o',                          label: 'GPT-4o',                       tag: null },
  { value: 'openai/gpt-4o-mini',                     label: 'GPT-4o Mini',                  tag: 'Fast & cheap' },
  { value: 'openai/o3-mini',                         label: 'o3-mini',                      tag: 'Reasoning' },
  { value: 'openai/o1',                              label: 'o1',                           tag: 'Reasoning' },
  // Google
  { value: 'google/gemini-2.5-pro-preview',          label: 'Gemini 2.5 Pro',               tag: 'Newest' },
  { value: 'google/gemini-2.0-flash-001',            label: 'Gemini 2.0 Flash',             tag: 'Fast' },
  { value: 'google/gemini-2.0-flash-thinking-exp',   label: 'Gemini 2.0 Flash (Thinking)',  tag: 'Experimental' },
  { value: 'google/gemini-1.5-pro',                  label: 'Gemini 1.5 Pro',               tag: null },
  // DeepSeek
  { value: 'deepseek/deepseek-chat',                 label: 'DeepSeek V3',                  tag: 'Budget' },
  { value: 'deepseek/deepseek-r1',                   label: 'DeepSeek R1',                  tag: 'Reasoning' },
  // Mistral
  { value: 'mistralai/mistral-large',                label: 'Mistral Large',                tag: null },
  { value: 'mistralai/mistral-small',                label: 'Mistral Small',                tag: 'Fast' },
  // Cohere
  { value: 'cohere/command-r-plus',                  label: 'Command R+',                   tag: null },
  { value: 'cohere/command-r',                       label: 'Command R',                    tag: 'Fast' },
  // Meta
  { value: 'meta-llama/llama-3.3-70b-instruct',      label: 'Llama 3.3 70B',               tag: 'Open source' },
  // Qwen
  { value: 'qwen/qwen-2.5-72b-instruct',             label: 'Qwen 2.5 72B',                tag: 'Open source' },
]

// ─── Default models per provider ──────────────────────────────────────────────

const PROVIDER_DEFAULT_MODELS: Record<string, string> = {
  openrouter: 'anthropic/claude-3.7-sonnet',
  openai:     'gpt-4o',
  litellm:    'gpt-4o',
  custom:     'gpt-4o',
}

// ─── Default model lists for non-OpenRouter providers ─────────────────────────

const OPENAI_MODELS = [
  { value: 'gpt-4.1',      label: 'GPT-4.1',      tag: 'Newest' },
  { value: 'gpt-4.1-mini', label: 'GPT-4.1 Mini', tag: 'Fast & cheap' },
  { value: 'gpt-4o',       label: 'GPT-4o',       tag: 'Recommended' },
  { value: 'gpt-4o-mini',  label: 'GPT-4o Mini',  tag: 'Fast & cheap' },
  { value: 'o3-mini',      label: 'o3-mini',      tag: 'Reasoning' },
  { value: 'o1',           label: 'o1',           tag: 'Reasoning' },
]

interface SettingsPanelProps {
  onClose: () => void
}

type ValidationErrors = Partial<Record<'apiKey' | 'workspacePath' | 'apiBase', string>>

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    apiKey, model, workspacePath, apiBase, provider,
    setApiKey, setModel, setWorkspacePath, setApiBase, setProvider, setDynamicModels,
    braveSearchKey, setBraveSearchKey,
    googleCseKey, setGoogleCseKey,
    googleCseId, setGoogleCseId,
    searchProvider, setSearchProvider,
    maxIterations, setMaxIterations,
    addRecentWorkspacePath,
  } = useAppStore()

  const [localKey, setLocalKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model)
  const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
  const [localProvider, setLocalProvider] = useState<ProviderId>((provider as ProviderId) || 'openrouter')
  const [localBase, setLocalBase] = useState(apiBase || 'https://openrouter.ai/api/v1')
  const [localBraveKey, setLocalBraveKey] = useState(braveSearchKey || '')
  const [localGoogleCseKey, setLocalGoogleCseKey] = useState(googleCseKey || '')
  const [localGoogleCseId, setLocalGoogleCseId] = useState(googleCseId || '')
  const [localSearchProvider, setLocalSearchProvider] = useState(searchProvider || 'auto')
    const [localMaxIterations, setLocalMaxIterations] = useState(String(maxIterations ?? 50))

    // Code execution state
    const {
      e2bApiKey, setE2bApiKey,
      daytonaApiKey, setDaytonaApiKey,
      daytonaApiUrl, setDaytonaApiUrl,
      executionMode, setExecutionMode,
    } = useAppStore()
    const [localE2bKey, setLocalE2bKey] = useState(e2bApiKey || '')
    const [localDaytonaKey, setLocalDaytonaKey] = useState(daytonaApiKey || '')
    const [localDaytonaUrl, setLocalDaytonaUrl] = useState(daytonaApiUrl || '')
    const [localExecutionMode, setLocalExecutionMode] = useState(executionMode || 'auto')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})

  const [modelOpen, setModelOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)

  const [fetchedModels, setFetchedModels] = useState<string[] | null>(null)
  const [fetchingModels, setFetchingModels] = useState(false)
  const [fetchModelsError, setFetchModelsError] = useState<string | null>(null)

  const [providerOpen, setProviderOpen] = useState(false)
  const providerRef = useRef<HTMLDivElement>(null)

  const providerDef = PROVIDERS.find((p) => p.id === localProvider) ?? PROVIDERS[0]

    useEffect(() => {
      if (localProvider !== 'custom' && providerDef.base) setLocalBase(providerDef.base)
      setFetchedModels(null)
      setDynamicModels([])
      setFetchModelsError(null)
      // Set a sensible default model when switching providers
      const defaultModel = PROVIDER_DEFAULT_MODELS[localProvider]
      if (defaultModel) setLocalModel(defaultModel)
    }, [localProvider]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false)
      if (providerRef.current && !providerRef.current.contains(e.target as Node)) setProviderOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

    async function handleFetchModels() {
      setFetchingModels(true)
      setFetchModelsError(null)
      try {
        const models = isTauri
          ? await tauriInvoke<string[]>('fetch_models', { apiBase: localBase, apiKey: localKey })
          : await fetchModelsFromLlm(localBase, localKey)
        const sorted = models.sort()
        setFetchedModels(sorted)
        setDynamicModels(sorted)
        if (models.length > 0 && !models.includes(localModel)) setLocalModel(models[0])
      } catch (e) {
        setFetchModelsError(String(e))
      } finally {
        setFetchingModels(false)
      }
    }

    const modelList: { value: string; label: string; tag?: string | null }[] =
      fetchedModels
        ? fetchedModels.map((v) => ({ value: v, label: v, tag: null }))
        : localProvider === 'openrouter'
        ? OPENROUTER_MODELS
        : localProvider === 'openai'
        ? OPENAI_MODELS
        : []

  const selectedModel = modelList.find((m) => m.value === localModel) ?? { value: localModel, label: localModel, tag: null }

  function validate(): ValidationErrors {
    const errs: ValidationErrors = {}
    if (!localKey.trim() && localProvider !== 'litellm') {
      errs.apiKey = 'API key is required'
    } else if (localProvider === 'openrouter' && localKey.trim() && !localKey.trim().startsWith('sk-or-')) {
      errs.apiKey = 'OpenRouter keys start with sk-or-…  Get one at openrouter.ai/keys'
    } else if (localProvider === 'openai' && localKey.trim() && !localKey.trim().startsWith('sk-')) {
      errs.apiKey = 'OpenAI keys start with sk-…'
    }
    if (!localBase.trim()) {
      errs.apiBase = 'API base URL is required'
    } else if (!localBase.trim().startsWith('http')) {
      errs.apiBase = 'Must start with http:// or https://'
    }
    if (localWorkspace.trim() && !localWorkspace.trim().startsWith('/')) {
      errs.workspacePath = 'Must be an absolute path (starting with /)'
    }
    return errs
  }

  function handleReset() {
    if (!confirm('Reset all settings to defaults? This will clear your API keys and preferences.')) return
    setLocalProvider('openrouter')
    setLocalBase('https://openrouter.ai/api/v1')
    setLocalKey('')
    setLocalModel('anthropic/claude-3.7-sonnet')
    setLocalWorkspace('')
    setLocalBraveKey('')
    setLocalGoogleCseKey('')
    setLocalGoogleCseId('')
    setLocalSearchProvider('auto')
    setLocalMaxIterations('50')
    setLocalE2bKey('')
    setLocalDaytonaKey('')
    setLocalDaytonaUrl('')
    setLocalExecutionMode('auto')
    // Also clear the extension ID from localStorage and local state
    setExtensionId('')
    try { localStorage.removeItem('nasus_extension_id') } catch { /* ignore */ }
    setFetchedModels(null)
    setErrors({})
  }

  async function checkAndSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSaving(true)
      const trimBase = localBase.trim().replace(/\/$/, '')
        setApiKey(localKey.trim())
        setModel(localModel)
        setWorkspacePath(localWorkspace.trim())
        if (localWorkspace.trim()) addRecentWorkspacePath(localWorkspace.trim())
        setApiBase(trimBase)
      setProvider(localProvider)
      setBraveSearchKey(localBraveKey.trim())
      setGoogleCseKey(localGoogleCseKey.trim())
      setGoogleCseId(localGoogleCseId.trim())
        setSearchProvider(localSearchProvider)
        const parsedIter = Math.max(1, Math.min(200, parseInt(localMaxIterations, 10) || 50))
        setMaxIterations(parsedIter)
        setE2bApiKey(localE2bKey.trim())
        setDaytonaApiKey(localDaytonaKey.trim())
        setDaytonaApiUrl(localDaytonaUrl.trim())
        setExecutionMode(localExecutionMode)
      await tauriInvoke('save_config', {
      apiKey: localKey.trim(),
      model: localModel,
      workspacePath: localWorkspace.trim(),
      apiBase: trimBase,
      provider: localProvider,
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
              {/* Heading: primary #e2e2e2 ≈ 14.6:1 */}
              <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--tx-primary)', margin: 0 }}>Settings</h2>
            </div>
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', transition: 'color 0.12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
            >
              <Pxi name="times" size={13} />
            </button>
          </div>

          {/* Scrollable content */}
          <div style={{ overflowY: 'auto', flex: 1, padding: '0 24px', minHeight: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 4 }}>

          {/* ── Provider ── */}
          <Field label="Provider" icon="server">
            <div style={{ position: 'relative' }} ref={providerRef}>
              <button
                type="button"
                onClick={() => setProviderOpen((o) => !o)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none', cursor: 'pointer',
                  background: '#0d0d0d',
                  border: `1px solid ${providerOpen ? 'oklch(64% 0.214 40.1 / 0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: 'var(--tx-primary)',
                  transition: 'border-color 0.12s',
                }}
              >
                <span>{providerDef.label}</span>
                <Pxi name={providerOpen ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)' }} />
              </button>
              {providerOpen && (
                <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}>
                  {PROVIDERS.map((p) => {
                    const isSel = p.id === localProvider
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setLocalProvider(p.id); setProviderOpen(false) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          padding: '8px 12px', textAlign: 'left', fontSize: 13, border: 'none', cursor: 'pointer',
                          /* Selected: primary. Inactive: secondary #ababab ≈ 7.9:1 */
                          color: isSel ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                          background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                          transition: 'background 0.1s',
                        }}
                        onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                        onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span>{p.label}</span>
                        {isSel && <Pxi name="check" size={10} style={{ color: 'var(--amber)' }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </Field>

          {/* ── API Base URL ── */}
          <Field
            label="API Base URL"
            icon="link"
            hint={localProvider === 'litellm'
              ? 'Point this at your LiteLLM proxy (e.g. http://localhost:4000/v1)'
              : localProvider === 'custom'
              ? 'Any OpenAI-compatible endpoint'
              : undefined}
            error={errors.apiBase}
          >
            <input
              type="text"
              value={localBase}
              onChange={(e) => { setLocalBase(e.target.value); setErrors((p) => ({ ...p, apiBase: undefined })) }}
              placeholder="https://…/v1"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                fontFamily: 'var(--font-mono)',
                color: 'var(--tx-primary)',
                background: '#0d0d0d',
                border: `1px solid ${errors.apiBase ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'border-color 0.12s',
              }}
              className="placeholder-[var(--tx-muted)]"
              onFocus={(e) => { e.currentTarget.style.borderColor = errors.apiBase ? 'rgba(239,68,68,0.6)' : 'oklch(64% 0.214 40.1 / 0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.apiBase ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
          </Field>

          {/* ── API Key ── */}
          <Field label="API Key" icon="lock" hint={providerDef.keyHint} error={errors.apiKey}>
            <input
              type="password"
              value={localKey}
              onChange={(e) => { setLocalKey(e.target.value); setErrors((p) => ({ ...p, apiKey: undefined })) }}
              placeholder={providerDef.keyPlaceholder}
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                color: 'var(--tx-primary)',
                background: '#0d0d0d',
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
              {/* Fetch models row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !localBase.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '4px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    background: 'rgba(255,255,255,0.07)',
                    border: 'none',
                    cursor: fetchingModels ? 'default' : 'pointer',
                    /* secondary contrast: #ababab ≈ 7.9:1 */
                    color: 'var(--tx-secondary)',
                    transition: 'color 0.12s',
                    opacity: (fetchingModels || !localBase.trim()) ? 0.45 : 1,
                  }}
                  onMouseEnter={(e) => { if (!fetchingModels) e.currentTarget.style.color = 'var(--tx-primary)' }}
                  onMouseLeave={(e) => { if (!fetchingModels) e.currentTarget.style.color = 'var(--tx-secondary)' }}
                  title="Fetch available models from the configured endpoint"
                >
                  <Pxi name={fetchingModels ? 'spinner-third' : 'arrow-rotate-right'} size={9} />
                  {fetchingModels ? 'Fetching…' : 'Fetch models'}
                </button>
                {fetchModelsError && (
                  <span style={{ fontSize: 11, color: '#f87171' }}>{fetchModelsError}</span>
                )}
                {fetchedModels && !fetchModelsError && (
                  /* tertiary: #757575 ≈ 4.6:1 — supplemental count */
                  <span style={{ fontSize: 11, color: 'var(--tx-tertiary)' }}>{fetchedModels.length} models</span>
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
                    color: 'var(--tx-primary)',
                    transition: 'border-color 0.12s',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedModel.label}</span>
                  <Pxi name={modelOpen ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: 'var(--tx-tertiary)' }} />
                </button>
                {modelOpen && (
                  <div style={{ position: 'absolute', zIndex: 10, width: '100%', marginTop: 4, borderRadius: 12, overflow: 'hidden', boxShadow: '0 16px 40px rgba(0,0,0,0.5)', background: '#161616', border: '1px solid rgba(255,255,255,0.08)', maxHeight: 208, overflowY: 'auto' }}>
                    {modelList.length === 0 ? (
                      <div style={{ padding: '10px 12px', fontSize: 12, color: 'var(--tx-tertiary)' }}>
                        Click "Fetch models" above to load available models
                      </div>
                    ) : modelList.map((m) => {
                      const isSelected = m.value === localModel
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => { setLocalModel(m.value); setModelOpen(false) }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '8px 12px', textAlign: 'left', fontSize: 13, border: 'none', cursor: 'pointer',
                            color: isSelected ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                            background: isSelected ? 'oklch(64% 0.214 40.1 / 0.1)' : 'transparent',
                            transition: 'background 0.1s',
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.label}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                            {m.tag && (
                              <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 6, fontWeight: 500, background: 'oklch(64% 0.214 40.1 / 0.12)', color: 'var(--amber-soft)' }}>
                                {m.tag}
                              </span>
                            )}
                            {isSelected && <Pxi name="check" size={10} style={{ color: 'var(--amber)' }} />}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </Field>

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
              />

              {/* ── Code Execution ── */}
              <ExecutionSection
                executionMode={localExecutionMode}
                onExecutionModeChange={setLocalExecutionMode}
                e2bKey={localE2bKey}
                onE2bKeyChange={setLocalE2bKey}
                daytonaKey={localDaytonaKey}
                onDaytonaKeyChange={setLocalDaytonaKey}
                daytonaUrl={localDaytonaUrl}
                onDaytonaUrlChange={setLocalDaytonaUrl}
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
                    color: 'var(--tx-primary)',
                    background: '#0d0d0d',
                    border: '1px solid rgba(255,255,255,0.08)',
                    transition: 'border-color 0.12s',
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
              {/* Reset */}
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
                Reset to defaults
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={onClose}
              style={{
                padding: '8px 16px', fontSize: 12, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer',
                color: 'var(--tx-secondary)',
                transition: 'color 0.12s',
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
                background: 'var(--amber)',
                color: '#000',
                opacity: busy ? 0.45 : 1,
                transition: 'background 0.12s',
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
              </div>{/* end Cancel+Save group */}
            </div>
          </div>
        </div>
      )
    }

// ─── SearchSection ────────────────────────────────────────────────────────────

const SEARCH_PROVIDERS = [
  { id: 'auto',      label: 'Auto',         desc: 'Brave → Google CSE → SearXNG → DuckDuckGo (best available)' },
  { id: 'brave',     label: 'Brave Search', desc: '2 000 req/mo free — best real-web results' },
  { id: 'google',    label: 'Google CSE',   desc: '100 req/day free — Google results via Custom Search' },
  { id: 'searxng',   label: 'SearXNG',      desc: 'Free, no key — public meta-search instances' },
  { id: 'wikipedia', label: 'Wikipedia',    desc: 'Free, no key — encyclopedic facts only' },
  { id: 'ddg',       label: 'DuckDuckGo',  desc: 'Free, no key — Instant Answers only (limited)' },
] as const

type SearchProviderId = (typeof SEARCH_PROVIDERS)[number]['id']

function SearchSection({
  searchProvider, onSearchProviderChange,
  braveKey, onBraveKeyChange,
  googleCseKey, onGoogleCseKeyChange,
  googleCseId, onGoogleCseIdChange,
}: {
  searchProvider: string
  onSearchProviderChange: (v: string) => void
  braveKey: string
  onBraveKeyChange: (v: string) => void
  googleCseKey: string
  onGoogleCseKeyChange: (v: string) => void
  googleCseId: string
  onGoogleCseIdChange: (v: string) => void
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

      {/* Brave key — show when provider is 'brave' or 'auto' */}
      {(searchProvider === 'brave' || searchProvider === 'auto') && (
        <Field label="Brave Search API Key" icon="key"
          hint={<>2 000 req/mo free. Get a key at <a href="https://brave.com/search/api/" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>brave.com/search/api</a>{searchProvider === 'auto' ? ' (optional — used first in Auto mode)' : ''}</>}
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
    </div>
  )
}

// ─── ExecutionSection ─────────────────────────────────────────────────────────

const EXECUTION_MODES = [
  { id: 'auto',     label: 'Auto',           desc: 'E2B → Daytona → Pyodide (best available)' },
  { id: 'e2b',      label: 'E2B',            desc: 'Cloud sandbox — full Linux + all packages' },
  { id: 'daytona',  label: 'Daytona',        desc: 'Cloud sandbox — full Linux + all packages' },
  { id: 'pyodide',  label: 'Pyodide',        desc: 'Browser WebAssembly — no keys required, Python only' },
  { id: 'disabled', label: 'Disabled',       desc: 'Code execution is turned off' },
] as const

type ExecutionModeId = (typeof EXECUTION_MODES)[number]['id']

function ExecutionSection({
  executionMode, onExecutionModeChange,
  e2bKey, onE2bKeyChange,
  daytonaKey, onDaytonaKeyChange,
  daytonaUrl, onDaytonaUrlChange,
}: {
  executionMode: string
  onExecutionModeChange: (v: string) => void
  e2bKey: string
  onE2bKeyChange: (v: string) => void
  daytonaKey: string
  onDaytonaKeyChange: (v: string) => void
  daytonaUrl: string
  onDaytonaUrlChange: (v: string) => void
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

  const showE2b = executionMode === 'e2b' || executionMode === 'auto'
  const showDaytona = executionMode === 'daytona' || executionMode === 'auto'

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

      {showE2b && (
        <Field label="E2B API Key" icon="key"
          hint={<>Free $100 credit · No credit card · <a href="https://e2b.dev" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>e2b.dev</a>{executionMode === 'auto' ? ' (optional — used first in Auto mode)' : ''}</>}
        >
          <input type="password" value={e2bKey} onChange={(e) => onE2bKeyChange(e.target.value)}
            placeholder="e2b_…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
            onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
            onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          />
        </Field>
      )}

      {showDaytona && (
        <>
          <Field label="Daytona API Key" icon="key"
            hint={<>Free $200 credit · No credit card · <a href="https://app.daytona.io" target="_blank" rel="noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>app.daytona.io</a>{executionMode === 'auto' ? ' (optional — used as fallback)' : ''}</>}
          >
            <input type="password" value={daytonaKey} onChange={(e) => onDaytonaKeyChange(e.target.value)}
              placeholder="dtn_…" style={inputStyle} className="placeholder-[var(--tx-muted)]"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
          </Field>
          {executionMode === 'daytona' && (
            <Field label="Daytona API URL" icon="link"
              hint="Leave blank to use the default: https://app.daytona.io/api"
            >
              <input type="text" value={daytonaUrl} onChange={(e) => onDaytonaUrlChange(e.target.value)}
                placeholder="https://app.daytona.io/api" style={inputStyle} className="placeholder-[var(--tx-muted)]"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </Field>
          )}
        </>
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
          fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.1em',
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
