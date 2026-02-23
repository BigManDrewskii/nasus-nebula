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
      const models = await tauriInvoke<string[]>('fetch_models', { apiBase: localBase, apiKey: localKey })
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
        if (!ok) { setErrors({ workspacePath: 'Path does not exist on disk' }); setPathChecking(false); return }
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
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.8)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ width: '100%', maxWidth: 448, borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', padding: 24, background: '#111', border: '1px solid rgba(255,255,255,0.08)' }}
        className="fade-in"
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
            <input
              type="text"
              value={localWorkspace}
              onChange={(e) => { setLocalWorkspace(e.target.value); setErrors((p) => ({ ...p, workspacePath: undefined })) }}
              placeholder="/Users/you/nasus-workspace"
              style={{
                width: '100%', padding: '8px 12px', borderRadius: 8, fontSize: 13, outline: 'none',
                color: 'var(--tx-primary)',
                background: '#0d0d0d',
                border: `1px solid ${errors.workspacePath ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)'}`,
                transition: 'border-color 0.12s',
              }}
              className="placeholder-[var(--tx-muted)]"
              onFocus={(e) => { e.currentTarget.style.borderColor = errors.workspacePath ? 'rgba(239,68,68,0.6)' : 'oklch(64% 0.214 40.1 / 0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = errors.workspacePath ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.08)' }}
            />
          </Field>
        </div>

        {/* Actions — 24px top margin */}
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', fontSize: 12, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer',
              /* Cancel: secondary #ababab ≈ 7.9:1 */
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
            ) : pathChecking ? (
              <><Pxi name="spinner-third" size={11} style={{ color: '#000' }} /> Checking…</>
            ) : saving ? (
              <><Pxi name="spinner-third" size={11} style={{ color: '#000' }} /> Saving…</>
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
