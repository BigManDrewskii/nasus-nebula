import { useState, useRef, useEffect } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

// ─── Provider definitions ──────────────────────────────────────────────────────

const PROVIDERS = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    base: 'https://openrouter.ai/api/v1',
    keyHint: <>Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-blue-300 transition-colors" style={{ color: '#3b82f6' }}>openrouter.ai/keys</a></>,
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
    keyHint: <>Get a key at <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-blue-300 transition-colors" style={{ color: '#3b82f6' }}>platform.openai.com</a></>,
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
  { value: 'anthropic/claude-3.5-sonnet',     label: 'Claude 3.5 Sonnet',  tag: 'Recommended' },
  { value: 'anthropic/claude-3.7-sonnet',     label: 'Claude 3.7 Sonnet',  tag: 'Latest' },
  { value: 'anthropic/claude-3-haiku',        label: 'Claude 3 Haiku',     tag: 'Fast' },
  { value: 'openai/gpt-4o',                   label: 'GPT-4o',             tag: null },
  { value: 'openai/gpt-4o-mini',              label: 'GPT-4o Mini',        tag: 'Fast' },
  { value: 'google/gemini-2.0-flash-001',     label: 'Gemini 2.0 Flash',   tag: 'Fast' },
  { value: 'google/gemini-2.5-pro-exp-03-25', label: 'Gemini 2.5 Pro',     tag: null },
  { value: 'meta-llama/llama-3.3-70b-instruct', label: 'Llama 3.3 70B',   tag: null },
  { value: 'deepseek/deepseek-r1',            label: 'DeepSeek R1',        tag: null },
]

interface SettingsPanelProps {
  onClose: () => void
}

type ValidationErrors = Partial<Record<'apiKey' | 'workspacePath' | 'apiBase', string>>

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    apiKey, model, workspacePath, apiBase, provider,
    setApiKey, setModel, setWorkspacePath, setApiBase, setProvider, setDynamicModels,
  } = useAppStore()

  const [localKey, setLocalKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model)
  const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
  const [localProvider, setLocalProvider] = useState<ProviderId>((provider as ProviderId) || 'openrouter')
  const [localBase, setLocalBase] = useState(apiBase || 'https://openrouter.ai/api/v1')

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [pathChecking, setPathChecking] = useState(false)

  // Model dropdown
  const [modelOpen, setModelOpen] = useState(false)
  const modelRef = useRef<HTMLDivElement>(null)

    // Dynamic model list (from fetch) — local to this panel for display;
    // also written to the store so UserInputArea stays in sync.
    const [fetchedModels, setFetchedModels] = useState<string[] | null>(null)
    const [fetchingModels, setFetchingModels] = useState(false)
    const [fetchModelsError, setFetchModelsError] = useState<string | null>(null)

  // Provider dropdown
  const [providerOpen, setProviderOpen] = useState(false)
  const providerRef = useRef<HTMLDivElement>(null)

  const providerDef = PROVIDERS.find((p) => p.id === localProvider) ?? PROVIDERS[0]

  // When provider changes, auto-fill the base URL (unless custom)
  useEffect(() => {
    if (localProvider !== 'custom' && providerDef.base) {
      setLocalBase(providerDef.base)
    }
    // Reset dynamic models when switching providers
      setFetchedModels(null)
      setDynamicModels([])
      setFetchModelsError(null)
  }, [localProvider]) // eslint-disable-line react-hooks/exhaustive-deps

  // Close dropdowns on outside click
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
      const models = await tauriInvoke<string[]>('fetch_models', {
        apiBase: localBase,
        apiKey: localKey,
      })
      const sorted = models.sort()
      setFetchedModels(sorted)
      setDynamicModels(sorted) // sync to store so UserInputArea sees them
      if (models.length > 0 && !models.includes(localModel)) {
        setLocalModel(models[0])
      }
    } catch (e) {
      setFetchModelsError(String(e))
    } finally {
      setFetchingModels(false)
    }
  }

    // The model list shown in the dropdown.
    // For OpenRouter: always show the curated list (with fetched list overriding it).
    // For other providers: only show fetched models; if none fetched yet, show an empty
    // list with a placeholder row so the user knows to click "Fetch models".
    const modelList: { value: string; label: string; tag?: string | null }[] =
      fetchedModels
        ? fetchedModels.map((v) => ({ value: v, label: v, tag: null }))
        : localProvider === 'openrouter'
        ? OPENROUTER_MODELS
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

  async function checkAndSave() {
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})

    if (localWorkspace.trim()) {
      setPathChecking(true)
      try {
        const ok = await tauriInvoke<boolean>('validate_path', { path: localWorkspace.trim() })
        if (!ok) {
          setErrors({ workspacePath: 'Path does not exist on disk' })
          setPathChecking(false)
          return
        }
      } catch { /* command not registered yet, skip */ }
      setPathChecking(false)
    }

    setSaving(true)
    const trimBase = localBase.trim().replace(/\/$/, '')
    setApiKey(localKey.trim())
    setModel(localModel)
    setWorkspacePath(localWorkspace.trim())
    setApiBase(trimBase)
    setProvider(localProvider)
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

  const busy = saving || pathChecking

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6 fade-in"
        style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Pxi name="cog" size={13} style={{ color: '#555' }} />
            <h2 className="text-[14px] font-semibold" style={{ color: '#d0d0d0' }}>Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: '#444' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#999' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#444' }}
          >
            <Pxi name="times" size={13} />
          </button>
        </div>

        <div className="space-y-5">

          {/* ── Provider ── */}
          <Field label="Provider" icon="server">
            <div className="relative" ref={providerRef}>
              <button
                type="button"
                onClick={() => setProviderOpen((o) => !o)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-neutral-200 focus:outline-none"
                style={{
                  background: '#0d0d0d',
                  border: `1px solid ${providerOpen ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
                }}
              >
                <span>{providerDef.label}</span>
                <Pxi name={providerOpen ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: '#555' }} />
              </button>

              {providerOpen && (
                <div
                  className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-2xl"
                  style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                  {PROVIDERS.map((p) => {
                    const isSel = p.id === localProvider
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => { setLocalProvider(p.id); setProviderOpen(false) }}
                        className="w-full flex items-center justify-between px-3 py-2 text-left text-[13px] transition-colors"
                        style={{
                          color: isSel ? '#e0e0e0' : '#888',
                          background: isSel ? 'rgba(37,99,235,0.12)' : 'transparent',
                        }}
                        onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                        onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = 'transparent' }}
                      >
                        <span>{p.label}</span>
                        {isSel && <Pxi name="check" size={10} style={{ color: '#3b82f6' }} />}
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
              className="w-full px-3 py-2 rounded-lg text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none font-mono"
              style={{
                background: '#0d0d0d',
                border: `1px solid ${errors.apiBase ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = errors.apiBase ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.apiBase ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)' }}
            />
          </Field>

          {/* ── API Key ── */}
          <Field
            label="API Key"
            icon="lock"
            hint={providerDef.keyHint}
            error={errors.apiKey}
          >
            <input
              type="password"
              value={localKey}
              onChange={(e) => { setLocalKey(e.target.value); setErrors((p) => ({ ...p, apiKey: undefined })) }}
              placeholder={providerDef.keyPlaceholder}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none transition-colors"
              style={{
                background: '#0d0d0d',
                border: `1px solid ${errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = errors.apiKey ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.apiKey ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)' }}
            />
          </Field>

          {/* ── Model ── */}
          <Field label="Model" icon="sparkles">
            <div className="space-y-2">
              {/* Fetch models row */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleFetchModels}
                  disabled={fetchingModels || !localBase.trim()}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-lg transition-colors disabled:opacity-40"
                  style={{ background: 'rgba(255,255,255,0.06)', color: '#777' }}
                  onMouseEnter={(e) => { if (!fetchingModels) e.currentTarget.style.color = '#bbb' }}
                  onMouseLeave={(e) => { if (!fetchingModels) e.currentTarget.style.color = '#777' }}
                  title="Fetch available models from the configured endpoint"
                >
                  <Pxi name={fetchingModels ? 'spinner-third' : 'arrow-rotate-right'} size={9} />
                  {fetchingModels ? 'Fetching…' : 'Fetch models'}
                </button>
                {fetchModelsError && (
                  <span className="text-[11px]" style={{ color: '#f87171' }}>
                    {fetchModelsError}
                  </span>
                )}
                  {fetchedModels && !fetchModelsError && (
                    <span className="text-[11px]" style={{ color: '#555' }}>
                      {fetchedModels.length} models
                    </span>
                  )}
              </div>

              {/* Model dropdown */}
              <div className="relative" ref={modelRef}>
                <button
                  type="button"
                  onClick={() => setModelOpen((o) => !o)}
                  className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] text-neutral-200 focus:outline-none transition-colors"
                  style={{
                    background: '#0d0d0d',
                    border: `1px solid ${modelOpen ? 'rgba(59,130,246,0.5)' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <span className="truncate">{selectedModel.label}</span>
                  <Pxi name={modelOpen ? 'chevron-up' : 'chevron-down'} size={10} style={{ color: '#555' }} />
                </button>

                  {modelOpen && (
                    <div
                      className="absolute z-10 w-full mt-1 rounded-xl overflow-hidden shadow-2xl max-h-52 overflow-y-auto"
                      style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      {modelList.length === 0 ? (
                        <div className="px-3 py-2.5 text-[12px]" style={{ color: '#555' }}>
                          Click "Fetch models" above to load available models
                        </div>
                      ) : modelList.map((m) => {
                      const isSelected = m.value === localModel
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => { setLocalModel(m.value); setModelOpen(false) }}
                          className="w-full flex items-center justify-between px-3 py-2 text-left text-[13px] transition-colors"
                          style={{
                            color: isSelected ? '#e0e0e0' : '#888',
                            background: isSelected ? 'rgba(37,99,235,0.12)' : 'transparent',
                          }}
                          onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                          onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
                        >
                          <span className="truncate">{m.label}</span>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            {m.tag && (
                              <span
                                className="text-[10px] px-1.5 py-[2px] rounded-md font-medium"
                                style={{ background: 'rgba(59,130,246,0.12)', color: '#60a5fa' }}
                              >
                                {m.tag}
                              </span>
                            )}
                            {isSelected && <Pxi name="check" size={10} style={{ color: '#3b82f6' }} />}
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
            hint={<>Host directory mounted into the sandbox at <code className="font-mono text-[11px]" style={{ color: '#777' }}>/workspace</code></>}
            error={errors.workspacePath}
          >
            <input
              type="text"
              value={localWorkspace}
              onChange={(e) => { setLocalWorkspace(e.target.value); setErrors((p) => ({ ...p, workspacePath: undefined })) }}
              placeholder="/Users/you/nasus-workspace"
              className="w-full px-3 py-2 rounded-lg text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none transition-colors"
              style={{
                background: '#0d0d0d',
                border: `1px solid ${errors.workspacePath ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)'}`,
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = errors.workspacePath ? 'rgba(239,68,68,0.6)' : 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.workspacePath ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.07)' }}
            />
          </Field>
        </div>

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-[12px] rounded-lg transition-colors"
            style={{ color: '#555' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#999' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#555' }}
          >
            Cancel
          </button>
          <button
            onClick={checkAndSave}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-lg transition-all disabled:opacity-40"
            style={{ background: '#2563eb', color: 'white' }}
            onMouseEnter={(e) => { if (!busy) e.currentTarget.style.background = '#3b82f6' }}
            onMouseLeave={(e) => { if (!busy) e.currentTarget.style.background = '#2563eb' }}
          >
            {saved ? (
              <><Pxi name="check" size={11} style={{ color: 'white' }} /> Saved</>
            ) : pathChecking ? (
              <><Pxi name="spinner-third" size={11} style={{ color: 'white' }} /> Checking…</>
            ) : saving ? (
              <><Pxi name="spinner-third" size={11} style={{ color: 'white' }} /> Saving…</>
            ) : (
              'Save settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field wrapper ─────────────────────────────────────────────────────────────

function Field({
  label,
  icon,
  hint,
  error,
  children,
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
        className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] mb-1.5"
        style={{ color: '#555' }}
      >
        <Pxi name={icon} size={10} style={{ color: '#444' }} />
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-[11px] flex items-center gap-1 leading-relaxed" style={{ color: '#f87171' }}>
          <Pxi name="exclamation-triangle" size={9} />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] leading-relaxed" style={{ color: '#444' }}>{hint}</p>
      ) : null}
    </div>
  )
}
