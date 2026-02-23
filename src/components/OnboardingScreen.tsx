import { useState } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

export function OnboardingScreen() {
  const { setApiKey } = useAppStore()
  const [key, setKey] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = key.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    try {
      await tauriInvoke('save_config', {
        apiKey: trimmed,
        model: 'anthropic/claude-3.5-sonnet',
        workspacePath: '',
      })
      setApiKey(trimmed)
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

      <div className="relative z-10 w-full max-w-sm px-6 flex flex-col gap-10">
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

        {/* Divider */}
        <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-widest"
              style={{ color: '#555' }}
            >
              <Pxi name="lock" size={10} style={{ color: '#444' }} />
              OpenRouter API Key
            </label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="sk-or-v1-…"
              autoFocus
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
            disabled={!key.trim() || saving}
            className="w-full py-3 rounded-xl text-[13px] font-medium text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{
              background: saving || !key.trim()
                ? '#1e3a8a'
                : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              boxShadow: key.trim() && !saving ? '0 4px 20px rgba(37,99,235,0.25)' : 'none',
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

          <p className="text-center text-[11px]" style={{ color: '#3a3a3a' }}>
            No key?{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition-colors hover:text-neutral-400"
              style={{ color: '#4a4a4a' }}
            >
              openrouter.ai/keys
            </a>
          </p>
        </form>
      </div>
    </div>
  )
}
