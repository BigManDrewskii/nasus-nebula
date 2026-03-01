import { useState } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'
import { WorkspacePicker } from './WorkspacePicker'

const PROVIDERS = [
  {
    id: 'openrouter',
    label: 'OpenRouter',
    description: 'Access 200+ models with one key',
    placeholder: 'sk-or-v1-…',
    apiBase: 'https://openrouter.ai/api/v1',
      defaultModel: 'anthropic/claude-3.7-sonnet',
    helpUrl: 'https://openrouter.ai/keys',
    helpLabel: 'openrouter.ai/keys',
    requiresKey: true,
    dot: '#a78bfa',
  },
  {
    id: 'openai',
    label: 'OpenAI',
    description: 'GPT-4o, o3, and more',
    placeholder: 'sk-…',
    apiBase: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o',
    helpUrl: 'https://platform.openai.com/api-keys',
    helpLabel: 'platform.openai.com',
    requiresKey: true,
    dot: '#34d399',
  },
  {
    id: 'litellm',
    label: 'LiteLLM',
    description: 'Local proxy to any model',
    placeholder: 'http://localhost:4000/v1',
    apiBase: '',
      defaultModel: 'anthropic/claude-3.7-sonnet',
      helpUrl: 'https://docs.litellm.ai/docs/proxy/quick_start',
    helpLabel: 'docs.litellm.ai',
    requiresKey: false,
    dot: '#60a5fa',
  },
  {
    id: 'custom',
    label: 'Custom',
    description: 'Any OpenAI-compatible endpoint',
    placeholder: 'https://your-api/v1',
    apiBase: '',
    defaultModel: '',
    helpUrl: '',
    helpLabel: '',
    requiresKey: false,
    dot: 'var(--tx-tertiary)',
  },
]

type Step = 'welcome' | 'provider' | 'workspace' | 'done'

const labelStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 5,
  marginBottom: 6,
  fontSize: 10.5,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.11em',
  color: 'var(--tx-secondary)',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  fontSize: 13,
  color: 'var(--tx-primary)',
  background: '#111',
  border: '1px solid rgba(255,255,255,0.09)',
  transition: 'border-color 0.12s',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

const ctaBtnStyle: React.CSSProperties = {
  padding: '11px 0',
  borderRadius: 12,
  fontSize: 12,
  fontWeight: 700,
  border: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'opacity 0.15s, box-shadow 0.15s',
}

const backBtnStyle: React.CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 12,
  border: '1px solid rgba(255,255,255,0.09)',
  background: 'transparent',
  cursor: 'pointer',
  color: 'var(--tx-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  transition: 'color 0.12s, border-color 0.12s',
}

export function OnboardingScreen() {
  const { setApiKey, setApiBase, setProvider, setWorkspacePath, addRecentWorkspacePath, setOnboardingComplete } = useAppStore()
  const [step, setStep] = useState<Step>('welcome')

  // Provider step
  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0])
  const [apiKey, setApiKeyLocal] = useState('')
  const [customBase, setCustomBase] = useState('')
  const [error, setError] = useState('')

  // Workspace step
  const [workspacePath, setWorkspacePathLocal] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')

  const [saving, setSaving] = useState(false)

  const isLiteLLMOrCustom = selectedProvider.id === 'litellm' || selectedProvider.id === 'custom'
  const effectiveBase = isLiteLLMOrCustom ? customBase.trim() : selectedProvider.apiBase
  const canContinueProvider = isLiteLLMOrCustom ? effectiveBase.length > 0 : apiKey.trim().length > 0

  async function handleFinish() {
    setSaving(true)
    setWorkspaceError('')
    try {
      const key = apiKey.trim()
      const path = workspacePath.trim()
      await tauriInvoke('save_config', {
        apiKey: key,
          model: selectedProvider.defaultModel || 'anthropic/claude-3.7-sonnet',
        workspacePath: path,
        apiBase: effectiveBase,
        provider: selectedProvider.id,
      })
        setApiKey(key)
        setApiBase(effectiveBase)
        setProvider(selectedProvider.id)
        if (path) {
          setWorkspacePath(path)
          addRecentWorkspacePath(path)
        }
        setStep('done')
        // Brief "done" flash before entering the app
        setTimeout(() => setOnboardingComplete(), 1200)
    } catch (err) {
      setWorkspaceError(String(err))
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        width: '100vw',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: '#080808',
        position: 'relative',
      }}
    >
      {/* Ambient top glow */}
      <div
        style={{
          pointerEvents: 'none',
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 60% 40% at 50% -5%, oklch(64% 0.214 40.1 / 0.07) 0%, transparent 100%)',
        }}
      />

      {/* Step pills */}
      {(step === 'provider' || step === 'workspace') && (
        <div
          style={{
            position: 'absolute',
            top: 28,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          {(['provider', 'workspace'] as const).map((s, i) => {
            const stepIdx = ['provider', 'workspace'].indexOf(step)
            const isDone = i < stepIdx
            const isActive = i === stepIdx
            return (
              <div
                key={s}
                style={{
                  height: 5,
                  width: isActive ? 22 : 5,
                  borderRadius: 3,
                  background: isActive ? 'var(--amber)' : isDone ? 'rgba(234,179,8,0.45)' : 'rgba(255,255,255,0.12)',
                  transition: 'width 0.25s ease, background 0.2s ease',
                }}
              />
            )
          })}
        </div>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 10,
          width: '100%',
          maxWidth: 380,
          padding: '0 24px',
        }}
      >

        {/* ── WELCOME ─────────────────────────────────────── */}
        {step === 'welcome' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 32, textAlign: 'center' }}
            className="fade-in"
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18 }}>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div
                  style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, oklch(64% 0.214 40.1 / 0.15) 0%, transparent 70%)',
                    pointerEvents: 'none',
                  }}
                />
                <div
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#0f0f0f',
                    border: '1px solid oklch(64% 0.214 40.1 / 0.3)',
                    boxShadow: '0 0 40px oklch(64% 0.214 40.1 / 0.12), 0 12px 40px rgba(0,0,0,0.5)',
                  }}
                >
                  <NasusLogo size={40} fill="var(--amber)" />
                </div>
              </div>

              <div>
                <h1
                  className="font-display font-bold"
                  style={{ fontSize: 26, color: 'var(--amber-light)', letterSpacing: '-0.04em', margin: 0, userSelect: 'none' }}
                >
                  NASUS
                </h1>
                <p style={{ marginTop: 10, fontSize: 13.5, lineHeight: 1.65, color: 'var(--tx-secondary)', maxWidth: 260, margin: '10px auto 0' }}>
                  Your autonomous AI agent. Browses the web, writes code, ships projects end-to-end.
                </p>
              </div>
            </div>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
              {[
                { icon: 'globe', label: 'Web browsing' },
                { icon: 'code', label: 'Code execution' },
                { icon: 'folder-open', label: 'File system' },
                { icon: 'search', label: 'Web search' },
                { icon: 'robot', label: 'Autonomous loops' },
              ].map((f) => (
                <div
                  key={f.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '5px 10px',
                    borderRadius: 8,
                    fontSize: 11,
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    color: 'var(--tx-secondary)',
                    userSelect: 'none',
                  }}
                >
                  <Pxi name={f.icon} size={10} style={{ color: 'var(--tx-tertiary)' }} />
                  {f.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('provider')}
              className="font-display"
              style={{
                width: '100%',
                padding: '13px 0',
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
                letterSpacing: '0.01em',
                border: 'none',
                cursor: 'pointer',
                background: 'linear-gradient(135deg, var(--amber) 0%, var(--amber-mid) 100%)',
                color: '#000',
                boxShadow: '0 4px 28px oklch(64% 0.214 40.1 / 0.28)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
            >
              Get started
              <Pxi name="arrow-right" size={12} style={{ color: '#000' }} />
            </button>
          </div>
        )}

        {/* ── PROVIDER ────────────────────────────────────── */}
        {step === 'provider' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
            <div style={{ textAlign: 'center' }}>
              <h2 className="font-display font-semibold" style={{ fontSize: 17, color: 'var(--tx-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Connect your AI
              </h2>
              <p style={{ marginTop: 7, fontSize: 12.5, color: 'var(--tx-secondary)', lineHeight: 1.5, margin: '7px 0 0' }}>
                Choose a provider and paste your API key
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Provider grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {PROVIDERS.map((p) => {
                  const isSel = selectedProvider.id === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProvider(p); setApiKeyLocal(''); setCustomBase(''); setError('') }}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 12,
                        textAlign: 'left',
                        border: isSel ? '1px solid oklch(64% 0.214 40.1 / 0.45)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'rgba(255,255,255,0.03)',
                        cursor: 'pointer',
                        transition: 'all 0.12s',
                      }}
                      onMouseEnter={(e) => { if (!isSel) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.13)' } }}
                      onMouseLeave={(e) => { if (!isSel) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' } }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.dot, flexShrink: 0, boxShadow: isSel ? `0 0 6px ${p.dot}` : 'none' }} />
                        <span style={{ fontSize: 12, fontWeight: 600, color: isSel ? 'var(--amber-soft)' : 'var(--tx-primary)' }}>{p.label}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 10.5, color: 'var(--tx-tertiary)', lineHeight: 1.4 }}>{p.description}</p>
                    </button>
                  )
                })}
              </div>

              {/* Base URL for proxy/custom */}
              {isLiteLLMOrCustom && (
                <div>
                  <label style={labelStyle}>
                    <Pxi name="link" size={9} style={{ color: 'var(--tx-tertiary)' }} />
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={customBase}
                    onChange={(e) => setCustomBase(e.target.value)}
                    placeholder={selectedProvider.placeholder}
                    autoFocus
                    style={inputStyle}
                    className="placeholder-[var(--tx-muted)]"
                    onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                  />
                </div>
              )}

              {/* API key */}
              <div>
                <label style={labelStyle}>
                  <Pxi name="lock" size={9} style={{ color: 'var(--tx-tertiary)' }} />
                  {isLiteLLMOrCustom ? 'API Key (optional)' : 'API Key'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKeyLocal(e.target.value); setError('') }}
                  placeholder={isLiteLLMOrCustom ? 'Leave blank if auth disabled' : selectedProvider.placeholder}
                  autoFocus={!isLiteLLMOrCustom}
                  style={inputStyle}
                  className="placeholder-[var(--tx-muted)]"
                  onFocus={(e) => { e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.5)' }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canContinueProvider) setStep('workspace') }}
                />
                {error && <p style={{ fontSize: 11, color: '#f87171', margin: '5px 0 0' }}>{error}</p>}
              </div>

              {/* Help link */}
              {selectedProvider.helpUrl && (
                <p style={{ textAlign: 'center', fontSize: 11, color: 'var(--tx-tertiary)', margin: 0 }}>
                  Get a free key at{' '}
                  <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--amber)', textDecoration: 'underline', textUnderlineOffset: 2 }}>
                    {selectedProvider.helpLabel}
                  </a>
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep('welcome')}
                style={backBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
              >
                <Pxi name="arrow-left" size={11} />
              </button>
              <button
                onClick={() => canContinueProvider && setStep('workspace')}
                disabled={!canContinueProvider}
                style={{
                  ...ctaBtnStyle,
                  flex: 1,
                  gap: 8,
                  background: canContinueProvider ? 'linear-gradient(135deg, var(--amber) 0%, var(--amber-mid) 100%)' : 'rgba(255,255,255,0.07)',
                  color: canContinueProvider ? '#000' : 'var(--tx-secondary)',
                  boxShadow: canContinueProvider ? '0 4px 24px oklch(64% 0.214 40.1 / 0.25)' : 'none',
                  opacity: canContinueProvider ? 1 : 0.5,
                  cursor: canContinueProvider ? 'pointer' : 'not-allowed',
                }}
                onMouseEnter={(e) => { if (canContinueProvider) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { if (canContinueProvider) e.currentTarget.style.opacity = '1' }}
              >
                Continue
                <Pxi name="arrow-right" size={12} style={{ color: canContinueProvider ? '#000' : 'var(--tx-secondary)' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── WORKSPACE ───────────────────────────────────── */}
        {step === 'workspace' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }} className="fade-in">
            <div style={{ textAlign: 'center' }}>
              <h2 className="font-display font-semibold" style={{ fontSize: 17, color: 'var(--tx-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Set your workspace
              </h2>
              <p style={{ marginTop: 7, fontSize: 12.5, color: 'var(--tx-secondary)', lineHeight: 1.5, margin: '7px 0 0' }}>
                The directory where Nasus reads and writes files
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* File tree preview */}
              <div
                style={{
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)',
                }}
              >
                {/* Root dir */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                  <Pxi name="folder-open" size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                  <span style={{ fontSize: 11.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)' }}>
                    {workspacePath.trim() || '/tmp/nasus-workspace'}
                  </span>
                </div>
                {[
                  { name: 'task_plan.md', note: 'Planning', color: '#60a5fa' },
                  { name: 'findings.md', note: 'Research', color: '#34d399' },
                  { name: 'index.html', note: 'Output', color: 'var(--amber)' },
                ].map((f) => (
                  <div key={f.name} style={{ display: 'flex', alignItems: 'center', gap: 7, paddingLeft: 16, marginBottom: 4 }}>
                    <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)', marginRight: 4 }} />
                    <Pxi name="file" size={9} style={{ color: f.color, flexShrink: 0, opacity: 0.7 }} />
                    <span style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)', flex: 1 }}>{f.name}</span>
                    <span style={{ fontSize: 9.5, color: 'rgba(255,255,255,0.2)' }}>{f.note}</span>
                  </div>
                ))}
              </div>

              {/* Path input */}
                <div>
                  <label style={labelStyle}>
                    <Pxi name="folder" size={9} style={{ color: 'var(--tx-tertiary)' }} />
                    Workspace path
                  </label>
                  <WorkspacePicker
                    value={workspacePath}
                    onChange={(v) => { setWorkspacePathLocal(v); setWorkspaceError('') }}
                    error={workspaceError || undefined}
                  />
                  {workspaceError && (
                    <p style={{ fontSize: 11, color: '#f87171', margin: '5px 0 0', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Pxi name="exclamation-triangle" size={9} />
                      {workspaceError}
                    </p>
                  )}
                </div>

              <p style={{ fontSize: 11, color: 'var(--tx-tertiary)', margin: 0, lineHeight: 1.55, textAlign: 'center' }}>
                Leave blank to use <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--tx-secondary)', fontSize: 10.5 }}>/tmp/nasus-workspace</code>
              </p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setStep('provider')}
                style={backBtnStyle}
                onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-secondary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)' }}
              >
                <Pxi name="arrow-left" size={11} />
              </button>
              <button
                onClick={handleFinish}
                disabled={saving}
                style={{
                  ...ctaBtnStyle,
                  flex: 1,
                  gap: 8,
                  background: 'linear-gradient(135deg, var(--amber) 0%, var(--amber-mid) 100%)',
                  color: '#000',
                  boxShadow: '0 4px 24px oklch(64% 0.214 40.1 / 0.25)',
                  opacity: saving ? 0.6 : 1,
                  cursor: saving ? 'not-allowed' : 'pointer',
                }}
                onMouseEnter={(e) => { if (!saving) e.currentTarget.style.opacity = '0.9' }}
                onMouseLeave={(e) => { if (!saving) e.currentTarget.style.opacity = '1' }}
              >
                {saving ? (
                  <><Pxi name="spinner-third" size={12} style={{ color: '#000' }} /> Saving…</>
                ) : (
                  <><Pxi name="play" size={12} style={{ color: '#000' }} /> Launch Nasus</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── DONE ────────────────────────────────────────── */}
        {step === 'done' && (
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, textAlign: 'center' }}
            className="fade-in"
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(52,211,153,0.09)',
                border: '1px solid rgba(52,211,153,0.28)',
                boxShadow: '0 0 28px rgba(52,211,153,0.12)',
              }}
            >
              <Pxi name="check-circle" size={30} style={{ color: '#34d399' }} />
            </div>
            <div>
              <h2 className="font-display font-semibold" style={{ fontSize: 18, color: 'var(--tx-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                You're all set
              </h2>
              <p style={{ marginTop: 8, fontSize: 13, color: 'var(--tx-secondary)', lineHeight: 1.55 }}>
                Nasus is ready. What would you like to build?
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
