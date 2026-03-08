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
    description: 'Access 400+ models with one key',
    placeholder: 'sk-or-v1-…',
    apiBase: 'https://openrouter.ai/api/v1',
    defaultModel: 'anthropic/claude-sonnet-4-20250514',
    helpUrl: 'https://openrouter.ai/keys',
    helpLabel: 'openrouter.ai/keys',
    requiresKey: true,
    dot: '#a78bfa',
  },
  {
    id: 'requesty',
    label: 'Requesty',
    description: 'Smart LLM router with failover',
    placeholder: 'req_…',
    apiBase: 'https://router.requesty.ai/v1',
    defaultModel: 'anthropic/claude-sonnet-4-20250514',
    helpUrl: 'https://app.requesty.ai/getting-started',
    helpLabel: 'app.requesty.ai',
    requiresKey: true,
    dot: '#60a5fa',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek (Direct)',
    description: 'DeepSeek V3 & R1 — direct & cheap',
    placeholder: 'sk-…',
    apiBase: 'https://api.deepseek.com/v1',
    defaultModel: 'deepseek-chat',
    helpUrl: 'https://platform.deepseek.com/api-keys',
    helpLabel: 'platform.deepseek.com/api-keys',
    requiresKey: true,
    dot: '#f97316',
  },
  {
    id: 'ollama',
    label: 'Ollama (Local)',
    description: 'Run models locally',
    placeholder: 'http://localhost:11434/v1',
    apiBase: 'http://localhost:11434/v1',
    defaultModel: 'llama3.3',
    helpUrl: 'https://ollama.com',
    helpLabel: 'ollama.com',
    requiresKey: false,
    dot: '#34d399',
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

const FEATURE_PILLS = [
  { icon: 'globe',        label: 'Web browsing'    },
  { icon: 'code',         label: 'Code execution'  },
  { icon: 'folder-open',  label: 'File system'     },
  { icon: 'search',       label: 'Web search'      },
  { icon: 'robot',        label: 'Autonomous loops' },
]

const WORKSPACE_PREVIEW_FILES = [
  { name: 'task_plan.md', note: 'Planning', color: '#60a5fa' },
  { name: 'findings.md',  note: 'Research', color: '#34d399' },
  { name: 'index.html',   note: 'Output',   color: 'var(--amber)' },
]

export function OnboardingScreen() {
  const { setApiKey, setApiBase, setProvider, setWorkspacePath, addRecentWorkspacePath, setOnboardingComplete, updateGateway } = useAppStore()
  const [step, setStep] = useState<Step>('welcome')

  const [selectedProvider, setSelectedProvider] = useState(PROVIDERS[0])
  const [apiKey, setApiKeyLocal] = useState('')
  const [customBase, setCustomBase] = useState('')
  const [error, setError] = useState('')

  const [workspacePath, setWorkspacePathLocal] = useState('')
  const [workspaceError, setWorkspaceError] = useState('')
  const [saving, setSaving] = useState(false)

  const isOllamaOrCustom = selectedProvider.id === 'ollama' || selectedProvider.id === 'custom'
  const effectiveBase = isOllamaOrCustom ? customBase.trim() : selectedProvider.apiBase
  const canContinueProvider = isOllamaOrCustom ? effectiveBase.length > 0 : apiKey.trim().length > 0

    async function handleFinish() {
      setSaving(true)
      setWorkspaceError('')
      try {
        const key  = apiKey.trim()
        const path = workspacePath.trim()
        await tauriInvoke('save_config', {
          apiKey: key,
          model: selectedProvider.defaultModel || 'anthropic/claude-sonnet-4-20250514',
          workspacePath: path,
          apiBase: effectiveBase,
          provider: selectedProvider.id,
        })
        setApiKey(key)
        // Update the matching gateway with the entered key and enable it.
        // All known gateway IDs map 1:1 with provider IDs.
        const knownGateways = ['openrouter', 'requesty', 'deepseek', 'ollama']
        for (const gwId of knownGateways) {
          if (gwId === selectedProvider.id) {
            updateGateway(gwId, { apiKey: key, enabled: true })
          } else {
            // Disable non-selected gateways so resolveConnection always picks the right one
            updateGateway(gwId, { enabled: false })
          }
        }
        // Persist all gateways (with the updated key) to the Tauri secure store
        try {
          const { useAppStore: store } = await import('../store')
          const updatedGateways = store.getState().gateways
          await tauriInvoke('save_gateways', { gateways: updatedGateways })
        } catch { /* non-fatal */ }

        setApiBase(effectiveBase)
        setProvider(selectedProvider.id)
        if (path) {
          setWorkspacePath(path)
          addRecentWorkspacePath(path)
        }
        setStep('done')
        setTimeout(() => setOnboardingComplete(), 1200)
      } catch (err) {
        setWorkspaceError(String(err))
        setSaving(false)
      }
    }

  return (
    <div className="onboarding-root">
      {/* Ambient top glow */}
      <div className="onboarding-glow" />

      {/* Step pills */}
      {(step === 'provider' || step === 'workspace') && (
        <div className="onboarding-steps">
          {(['provider', 'workspace'] as const).map((s, i) => {
            const stepIdx = ['provider', 'workspace'].indexOf(step)
            const isDone   = i < stepIdx
            const isActive = i === stepIdx
            return (
              <div
                key={s}
                className="onboarding-step-pip"
                style={{
                  width: isActive ? 22 : 5,
                  background: isActive ? 'var(--amber)' : isDone ? 'rgba(234,179,8,0.45)' : 'rgba(255,255,255,0.12)',
                }}
              />
            )
          })}
        </div>
      )}

      <div className="onboarding-card">

        {/* ── WELCOME ─────────────────────────────────────── */}
        {step === 'welcome' && (
          <div className="flex-col items-center onboarding-welcome fade-in">
            <div className="flex-col items-center onboarding-welcome-top">
              <div className="relative flex-center">
                <div className="onboarding-logo-glow" />
                <div className="onboarding-logo-box">
                  <NasusLogo size={40} fill="var(--amber)" />
                </div>
              </div>

              <div>
                <h1 className="font-display font-bold onboarding-title">NASUS</h1>
                <p className="text-secondary onboarding-tagline">
                  Your autonomous AI agent. Browses the web, writes code, ships projects end-to-end.
                </p>
              </div>
            </div>

            <div className="onboarding-pills">
              {FEATURE_PILLS.map((f) => (
                <div key={f.label} className="text-secondary onboarding-pill">
                  <Pxi name={f.icon} size={10} className="text-tertiary" />
                  {f.label}
                </div>
              ))}
            </div>

            <button
              onClick={() => setStep('provider')}
              className="font-display onboarding-cta-btn hover-opacity-90"
            >
              Get started
              <Pxi name="arrow-right" size={12} style={{ color: '#000' }} />
            </button>
          </div>
        )}

        {/* ── PROVIDER ────────────────────────────────────── */}
        {step === 'provider' && (
          <div className="flex-col onboarding-step fade-in">
            <div className="text-center">
              <h2 className="font-display font-semibold onboarding-step-title">Connect your AI</h2>
              <p className="text-secondary onboarding-step-subtitle">Choose a provider and paste your API key</p>
            </div>

            <div className="flex-col onboarding-fields">
              {/* Provider grid */}
              <div className="onboarding-provider-grid">
                {PROVIDERS.map((p) => {
                  const isSel = selectedProvider.id === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => { setSelectedProvider(p); setApiKeyLocal(''); setCustomBase(''); setError('') }}
                      className="onboarding-provider-card hover-bg-app-3"
                      style={{
                        border: isSel ? '1px solid oklch(64% 0.214 40.1 / 0.45)' : '1px solid rgba(255,255,255,0.08)',
                        background: isSel ? 'oklch(64% 0.214 40.1 / 0.1)' : 'rgba(255,255,255,0.03)',
                      }}
                    >
                      <div className="flex-v-center onboarding-provider-name-row">
                        <div
                          className="onboarding-provider-dot"
                          style={{ background: p.dot, boxShadow: isSel ? `0 0 6px ${p.dot}` : 'none' }}
                        />
                        <span
                          className="onboarding-provider-name"
                          style={{ color: isSel ? 'var(--amber-soft)' : 'var(--tx-primary)' }}
                        >
                          {p.label}
                        </span>
                      </div>
                      <p className="text-tertiary onboarding-provider-desc">{p.description}</p>
                    </button>
                  )
                })}
              </div>

              {/* Base URL for proxy/custom */}
              {isOllamaOrCustom && (
                <div>
                  <label className="flex-v-center settings-label text-secondary">
                    <Pxi name="link" size={9} className="text-tertiary" />
                    API Base URL
                  </label>
                  <input
                    type="text"
                    value={customBase}
                    onChange={(e) => setCustomBase(e.target.value)}
                    placeholder={selectedProvider.placeholder}
                    autoFocus
                     className="onboarding-input placeholder-[var(--tx-muted)]"
                   />
                 </div>
               )}

               {/* API key */}
              <div>
                <label className="flex-v-center settings-label text-secondary">
                  <Pxi name="lock" size={9} className="text-tertiary" />
                  {isOllamaOrCustom ? 'API Key (optional)' : 'API Key'}
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => { setApiKeyLocal(e.target.value); setError('') }}
                  placeholder={isOllamaOrCustom ? 'Leave blank if auth disabled' : selectedProvider.placeholder}
                  autoFocus={!isOllamaOrCustom}
                    className="onboarding-input placeholder-[var(--tx-muted)]"
                    onKeyDown={(e) => { if (e.key === 'Enter' && canContinueProvider) setStep('workspace') }}
                />
                {error && <p className="onboarding-error">{error}</p>}
              </div>

              {/* Help link */}
              {selectedProvider.helpUrl && (
                <p className="text-tertiary onboarding-help-text">
                  Get a free key at{' '}
                  <a href={selectedProvider.helpUrl} target="_blank" rel="noopener noreferrer" className="onboarding-help-link">
                    {selectedProvider.helpLabel}
                  </a>
                </p>
              )}
            </div>

            <div className="flex onboarding-nav">
              <button
                onClick={() => setStep('welcome')}
                  className="onboarding-back-btn hover-text-primary hover-border-strong"
                >
                  <Pxi name="arrow-left" size={11} />
                </button>
                  <button
                    onClick={() => canContinueProvider && setStep('workspace')}
                  disabled={!canContinueProvider}
                  style={{
                    background: canContinueProvider ? 'linear-gradient(135deg, var(--amber) 0%, var(--amber-mid) 100%)' : 'rgba(255,255,255,0.07)',
                    color: canContinueProvider ? '#000' : 'var(--tx-secondary)',
                    boxShadow: canContinueProvider ? '0 4px 24px oklch(64% 0.214 40.1 / 0.25)' : 'none',
                    opacity: canContinueProvider ? 1 : 0.5,
                    cursor: canContinueProvider ? 'pointer' : 'not-allowed',
                  }}
                  className="flex-1 flex-v-center justify-center onboarding-cta-btn hover-opacity-90"
              >
                Continue
                <Pxi name="arrow-right" size={12} style={{ color: canContinueProvider ? '#000' : 'var(--tx-secondary)' }} />
              </button>
            </div>
          </div>
        )}

        {/* ── WORKSPACE ───────────────────────────────────── */}
        {step === 'workspace' && (
          <div className="flex-col onboarding-step fade-in">
            <div className="text-center">
              <h2 className="font-display font-semibold onboarding-step-title">Set your workspace</h2>
              <p className="text-secondary onboarding-step-subtitle">The directory where Nasus reads and writes files</p>
            </div>

            <div className="flex-col onboarding-fields">
              {/* File tree preview */}
              <div className="onboarding-tree-preview">
                <div className="flex-v-center onboarding-tree-root">
                  <Pxi name="folder-open" size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} />
                  <span className="font-mono text-secondary onboarding-tree-path">
                    {workspacePath.trim() || '/tmp/nasus-workspace'}
                  </span>
                </div>
                {WORKSPACE_PREVIEW_FILES.map((f) => (
                  <div key={f.name} className="flex-v-center onboarding-tree-row">
                    <div className="onboarding-tree-pipe" />
                    <Pxi name="file" size={9} style={{ color: f.color, flexShrink: 0, opacity: 0.7 }} />
                    <span className="font-mono text-tertiary flex-1 onboarding-tree-filename">{f.name}</span>
                    <span className="onboarding-tree-note">{f.note}</span>
                  </div>
                ))}
              </div>

              {/* Path input */}
              <div>
                <label className="flex-v-center settings-label text-secondary">
                  <Pxi name="folder" size={9} className="text-tertiary" />
                  Workspace path
                </label>
                <WorkspacePicker
                  value={workspacePath}
                  onChange={(v) => { setWorkspacePathLocal(v); setWorkspaceError('') }}
                  error={workspaceError || undefined}
                />
                {workspaceError && (
                  <p className="flex-v-center onboarding-error">
                    <Pxi name="exclamation-triangle" size={9} />
                    {workspaceError}
                  </p>
                )}
              </div>

              <p className="text-tertiary onboarding-workspace-hint">
                Leave blank to use <code className="font-mono text-secondary onboarding-code">/tmp/nasus-workspace</code>
              </p>
            </div>

            <div className="flex onboarding-nav">
              <button
                onClick={() => setStep('provider')}
                  className="onboarding-back-btn hover-text-primary hover-border-strong"
                >
                  <Pxi name="arrow-left" size={11} />
                </button>
                  <button
                    onClick={handleFinish}
                  disabled={saving}
                  style={{
                    background: 'linear-gradient(135deg, var(--amber) 0%, var(--amber-mid) 100%)',
                    color: '#000',
                    boxShadow: '0 4px 24px oklch(64% 0.214 40.1 / 0.25)',
                    opacity: saving ? 0.6 : 1,
                    cursor: saving ? 'not-allowed' : 'pointer',
                  }}
                  className="flex-1 flex-v-center justify-center onboarding-cta-btn hover-opacity-90"
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
          <div className="flex-col items-center onboarding-done fade-in">
            <div className="onboarding-done-icon">
              <Pxi name="check-circle" size={30} style={{ color: '#34d399' }} />
            </div>
            <div>
              <h2 className="font-display font-semibold onboarding-step-title">You're all set</h2>
              <p className="text-secondary onboarding-done-text">Nasus is ready. What would you like to build?</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
