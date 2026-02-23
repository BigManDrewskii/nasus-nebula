import { useState } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { NasusLogo } from './NasusLogo'
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
  const canContinue = isLiteLLMOrCustom ? effectiveBase.length > 0 : apiKey.trim().length > 0

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
      style={{ display: 'flex', height: '100vh', width: '100vw', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: '#080808' }}
    >
      {/* Amber radial glow */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 55% 35% at 50% 0%, oklch(64% 0.214 40.1 / 0.08) 0%, transparent 100%)',
        }}
      />

      <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: 360, padding: '0 24px', display: 'flex', flexDirection: 'column', gap: 32 }}>

        {/* Logo + title */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#0f0f0f',
              border: '1px solid oklch(64% 0.214 40.1 / 0.28)',
              boxShadow: '0 0 40px oklch(64% 0.214 40.1 / 0.15), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <NasusLogo size={36} fill="var(--amber)" />
          </div>
          <div>
            <h1
              className="font-display font-semibold"
              style={{ fontSize: 22, color: 'var(--amber-light)', letterSpacing: '-0.03em', margin: 0 }}
            >
              NASUS
            </h1>
            {/* Subtitle: secondary #ababab on #080808 ≈ 7.4:1 */}
            <p style={{ marginTop: 8, fontSize: 13, lineHeight: 1.6, color: 'var(--tx-secondary)' }}>
              Autonomous AI agent with a real sandbox.<br />
              Browses, codes, ships.
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: 'oklch(64% 0.214 40.1 / 0.1)' }} />

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Provider selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tx-secondary)' }}>
              <Pxi name="plug" size={10} style={{ color: 'var(--tx-tertiary)' }} />
              Provider
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {PROVIDERS.map((p) => {
                const isSelected = selectedProvider.id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { setSelectedProvider(p); setApiKeyLocal(''); setCustomBase(''); setError('') }}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      fontWeight: 500,
                      textAlign: 'left',
                      border: isSelected
                        ? '1px solid oklch(64% 0.214 40.1 / 0.45)'
                        : '1px solid rgba(255,255,255,0.08)',
                      background: isSelected ? 'oklch(64% 0.214 40.1 / 0.12)' : '#111',
                      cursor: 'pointer',
                      transition: 'background 0.12s, border-color 0.12s, color 0.12s',
                      /* Selected: amber-soft. Inactive: secondary #ababab ≈ 7.9:1 */
                      color: isSelected ? 'var(--amber-soft)' : 'var(--tx-secondary)',
                    }}
                  >
                    {p.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* API Base URL — LiteLLM / Custom */}
          {isLiteLLMOrCustom && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tx-secondary)' }}>
                <Pxi name="link" size={10} style={{ color: 'var(--tx-tertiary)' }} />
                API Base URL
              </label>
              <input
                type="text"
                value={customBase}
                onChange={(e) => setCustomBase(e.target.value)}
                placeholder={selectedProvider.placeholder}
                autoFocus
                style={{
                  width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 13, outline: 'none',
                  color: 'var(--tx-primary)',
                  background: '#111',
                  border: '1px solid rgba(255,255,255,0.09)',
                  transition: 'border-color 0.12s',
                  fontFamily: 'inherit',
                }}
                className="placeholder-[var(--tx-muted)]"
                onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
              />
            </div>
          )}

          {/* API Key */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--tx-secondary)' }}>
              <Pxi name="lock" size={10} style={{ color: 'var(--tx-tertiary)' }} />
              {isLiteLLMOrCustom ? 'API Key (optional)' : 'API Key'}
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKeyLocal(e.target.value)}
              placeholder={isLiteLLMOrCustom ? 'Leave blank if auth is disabled' : selectedProvider.placeholder}
              autoFocus={!isLiteLLMOrCustom}
              style={{
                width: '100%', padding: '12px 16px', borderRadius: 12, fontSize: 13, outline: 'none',
                color: 'var(--tx-primary)',
                background: '#111',
                border: '1px solid rgba(255,255,255,0.09)',
                transition: 'border-color 0.12s',
                fontFamily: 'inherit',
              }}
              className="placeholder-[var(--tx-muted)]"
              onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
            />
            {error && <p style={{ fontSize: 12, color: '#f87171', margin: 0 }}>{error}</p>}
          </div>

          {/* CTA */}
          <button
            type="submit"
            disabled={!canContinue || saving}
            className="font-display"
            style={{
              width: '100%',
              padding: '12px 0',
              borderRadius: 12,
              fontSize: 12,
              fontWeight: 600,
              border: 'none',
              cursor: (canContinue && !saving) ? 'pointer' : 'not-allowed',
              letterSpacing: '-0.01em',
              background: (canContinue && !saving)
                ? 'linear-gradient(135deg, var(--amber) 0%, var(--amber-mid) 100%)'
                : 'rgba(255,255,255,0.06)',
              /* Black text on amber — high contrast. Secondary on disabled bg. */
              color: (canContinue && !saving) ? '#000' : 'var(--tx-secondary)',
              boxShadow: (canContinue && !saving) ? '0 4px 24px oklch(64% 0.214 40.1 / 0.3)' : 'none',
              opacity: (!canContinue || saving) ? 0.5 : 1,
              transition: 'background 0.15s, box-shadow 0.15s, opacity 0.15s',
            }}
          >
            {saving ? (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Pxi name="spinner-third" size={13} style={{ color: '#000' }} />
                Saving…
              </span>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                CONTINUE
                <Pxi name="arrow-right" size={13} style={{ color: (canContinue && !saving) ? '#000' : 'var(--tx-secondary)' }} />
              </span>
            )}
          </button>

          {/* Help link — tertiary #757575 ≈ 4.6:1 */}
          {selectedProvider.helpUrl ? (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--tx-tertiary)', margin: 0 }}>
              {selectedProvider.helpText}{' '}
              <a
                href={selectedProvider.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2, transition: 'color 0.12s' }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'var(--amber-soft)' }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--amber)' }}
              >
                {selectedProvider.helpLabel}
              </a>
            </p>
          ) : (
            <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--tx-tertiary)', margin: 0 }}>
              {selectedProvider.helpText}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
