import { useState } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

const PROVIDERS = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    placeholder: 'sk-or-v1-…',
    apiBase: 'https://openrouter.ai/api/v1',
    helpText: 'Get a key at',
    helpUrl: 'https://openrouter.ai/keys',
    helpLabel: 'openrouter.ai/keys',
    requiresKey: true,
  },
  {
    id: 'openai',
    label: 'OpenAI',
    placeholder: 'sk-…',
    apiBase: 'https://api.openai.com/v1',
    helpText: 'Get a key at',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com',
    requiresKey: true,
  },
  {
    id: 'litellm',
    label: 'LiteLLM proxy',
    placeholder: 'http://localhost:4000/v1',
    apiBase: '',
    helpText: 'Run',
    helpUrl: 'https://docs.litellm.ai/docs/proxy/quick_start',
    helpLabel: 'litellm --config config.yaml',
    requiresKey: false,
  },
  {
    id: 'custom',
    label: 'Custom',
    placeholder: 'https://your-api/v1',
    apiBase: '',
    helpText: 'Any OpenAI-compatible endpoint',
    helpUrl: '',
    helpLabel: '',
    requiresKey: false,
  },
]

export function OnboardingScreen() {
  const { setApiKey, setApiBase, setProvider } = useAppStore()
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0])
  const [apiKey, setApiKeyLocal] = useState('')
  const [customBase, setCustomBase] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const isLiteLLMOrCustom = selectedProvider.id === 'litellm' || selectedProvider.id === 'custom'
  const effectiveBase = isLiteLLMOrCustom ? customBase.trim() : selectedProvider.apiBase
  const canContinue = isLiteLLMOrCustom
    ? effectiveBase.length > 0
    : apiKey.trim().length > 0

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!canContinue) return
    setSaving(true)
    setError('')
    try {
      const key = apiKey.trim()
      await tauriInvoke('save_config', {
        apiKey: key,
        model: selectedProvider.id === 'openai' ? 'gpt-4o' : 'anthropic/claude-3.5-sonnet',
        workspacePath: '',
        apiBase: effectiveBase,
        provider: selectedProvider.id,
      })
      setApiKey(key)
      setApiBase(effectiveBase)
      setProvider(selectedProvider.id)
    } catch (err) {
      setError(String(err))
      setSaving(false)
    }
  }

  return (
    <div
      className="flex h-screen w-screen items-center justify-center overflow-hidden"
      style={{ background: '#080808' }}
    >
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(59,130,246,0.07) 0%, transparent 100%)',
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col gap-8">
        {/* Logo + title */}
        <div className="flex flex-col items-center gap-5 text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: '0 0 40px rgba(37,99,235,0.3), 0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <span className="text-white font-bold text-xl tracking-tight">N</span>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight" style={{ color: '#f0f0f0' }}>
              Nasus
            </h1>
            <p className="mt-2 text-[13px] leading-relaxed" style={{ color: '#555' }}>
              Autonomous AI agent with a real sandbox.<br />
              Browses, codes, ships.
            </p>
          </div>
        </div>

        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Provider selector */}
          <div className="flex flex-col gap-2">
            <label
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest"
              style={{ color: '#555' }}
            >
              <Pxi name="plug" size={10} style={{ color: '#444' }} />
              Provider
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(p)
                    setApiKeyLocal('')
                    setCustomBase('')
                    setError('')
                  }}
                  className="px-3 py-2 rounded-xl text-[12px] font-medium transition-all text-left"
                  style={{
                    background: selectedProvider.id === p.id ? 'rgba(37,99,235,0.15)' : '#111',
                    border: selectedProvider.id === p.id
                      ? '1px solid rgba(59,130,246,0.4)'
                      : '1px solid rgba(255,255,255,0.07)',
                    color: selectedProvider.id === p.id ? '#93c5fd' : '#555',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* API Base URL — for LiteLLM / Custom */}
          {isLiteLLMOrCustom && (
            <div className="flex flex-col gap-2">
              <label
                className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest"
                style={{ color: '#555' }}
              >
                <Pxi name="link" size={10} style={{ color: '#444' }} />
                API Base URL
              </label>
              <input
                type="text"
                value={customBase}
                onChange={(e) => setCustomBase(e.target.value)}
                placeholder={selectedProvider.placeholder}
                autoFocus
                className="w-full px-4 py-3 rounded-xl text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none transition-all"
                style={{
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
              />
            </div>
          )}

          {/* API Key */}
          <div className="flex flex-col gap-2">
            <label
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest"
              style={{ color: '#555' }}
            >
              <Pxi name="lock" size={10} style={{ color: '#444' }} />
              {isLiteLLMOrCustom ? 'API Key (optional)' : 'API Key'}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder={isLiteLLMOrCustom ? 'Leave blank if auth is disabled' : selectedProvider.placeholder}
              autoFocus={!isLiteLLMOrCustom}
              className="w-full px-4 py-3 rounded-xl text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none transition-all"
              style={{
                background: '#111',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
            />
            {error && <p className="text-[12px] text-red-400">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={!canContinue || saving}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: saving || !canContinue
                ? '#1e3a8a'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: canContinue && !saving ? '0 4px 20px rgba(37,99,235,0.25)' : 'none',
            }}
          >
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <Pxi name="spinner-third" size={13} style={{ color: 'white' }} />
                Saving…
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Continue
                <Pxi name="arrow-right" size={13} style={{ color: 'white' }} />
              </span>
            )}
          </button>

          {/* Help link */}
          {selectedProvider.helpUrl ? (
            <p className="text-center text-[11px]" style={{ color: '#555' }}>
                {selectedProvider.helpText}{' '}
                <a
                  href={selectedProvider.helpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-2 transition-colors hover:text-neutral-400"
                  style={{ color: '#666' }}
                >
                  {selectedProvider.helpLabel}
                </a>
              </p>
            ) : (
              <p className="text-center text-[11px]" style={{ color: '#555' }}>
                {selectedProvider.helpText}
              </p>
          )}
        </form>
      </div>
    </div>
  )
}
