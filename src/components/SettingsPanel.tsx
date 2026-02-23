import { useState } from 'react'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

const MODELS = [
  { value: 'anthropic/claude-3.5-sonnet',        label: 'Claude 3.5 Sonnet' },
  { value: 'anthropic/claude-3-haiku',            label: 'Claude 3 Haiku' },
  { value: 'anthropic/claude-3.7-sonnet',         label: 'Claude 3.7 Sonnet' },
  { value: 'openai/gpt-4o',                       label: 'GPT-4o' },
  { value: 'openai/gpt-4o-mini',                  label: 'GPT-4o Mini' },
  { value: 'google/gemini-2.0-flash-001',         label: 'Gemini 2.0 Flash' },
  { value: 'google/gemini-2.5-pro-exp-03-25',     label: 'Gemini 2.5 Pro' },
  { value: 'meta-llama/llama-3.3-70b-instruct',  label: 'Llama 3.3 70B' },
  { value: 'deepseek/deepseek-r1',                label: 'DeepSeek R1' },
]

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const { apiKey, model, workspacePath, setApiKey, setModel, setWorkspacePath } = useAppStore()
  const [localKey, setLocalKey] = useState(apiKey)
  const [localModel, setLocalModel] = useState(model)
  const [localWorkspace, setLocalWorkspace] = useState(workspacePath)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function handleSave() {
    setSaving(true)
    setApiKey(localKey)
    setModel(localModel)
    setWorkspacePath(localWorkspace)
    await tauriInvoke('save_config', {
      apiKey: localKey,
      model: localModel,
      workspacePath: localWorkspace,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => {
      setSaved(false)
      onClose()
    }, 1000)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl shadow-2xl p-6"
        style={{
          background: '#111',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
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
          {/* API Key */}
          <Field
            label="OpenRouter API Key"
            icon="lock"
            hint={<>Get a free key at <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-neutral-400 transition-colors" style={{ color: '#3b82f6' }}>openrouter.ai/keys</a></>}
          >
            <input
              type="password"
              value={localKey}
              onChange={(e) => setLocalKey(e.target.value)}
              placeholder="sk-or-v1-…"
              className="w-full px-3 py-2 rounded-lg text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none transition-colors"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            />
          </Field>

          {/* Model */}
          <Field label="Model" icon="sparkles">
            <select
              value={localModel}
              onChange={(e) => setLocalModel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-[13px] text-neutral-200 focus:outline-none appearance-none transition-colors"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
            >
              {MODELS.map((m) => (
                <option key={m.value} value={m.value} style={{ background: '#1a1a1a', color: '#ccc' }}>
                  {m.label}
                </option>
              ))}
            </select>
          </Field>

          {/* Workspace Path */}
          <Field
            label="Workspace Path"
            icon="folder-open"
            hint={<>Host directory mounted into the agent sandbox at <code className="font-mono text-[11px]" style={{ color: '#888' }}>/workspace</code></>}
          >
            <input
              type="text"
              value={localWorkspace}
              onChange={(e) => setLocalWorkspace(e.target.value)}
              placeholder="/Users/you/nasus-workspace"
              className="w-full px-3 py-2 rounded-lg text-[13px] text-neutral-200 placeholder-neutral-700 focus:outline-none transition-colors"
              style={{ background: '#0d0d0d', border: '1px solid rgba(255,255,255,0.07)' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' }}
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
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-[12px] font-medium rounded-lg transition-all disabled:opacity-40"
            style={{ background: '#2563eb', color: 'white' }}
            onMouseEnter={(e) => { if (!saving) e.currentTarget.style.background = '#3b82f6' }}
            onMouseLeave={(e) => { if (!saving) e.currentTarget.style.background = '#2563eb' }}
          >
            {saved ? (
              <>
                <Pxi name="check" size={11} style={{ color: 'white' }} />
                Saved
              </>
            ) : saving ? (
              <>
                <Pxi name="spinner-third" size={11} style={{ color: 'white' }} />
                Saving…
              </>
            ) : (
              'Save settings'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Field wrapper ────────────────────────────────────────────────────────────

function Field({
  label,
  icon,
  hint,
  children,
}: {
  label: string
  icon: string
  hint?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.1em] mb-1.5" style={{ color: '#444' }}>
        <Pxi name={icon} size={10} style={{ color: '#3a3a3a' }} />
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-[11px] leading-relaxed" style={{ color: '#444' }}>{hint}</p>}
    </div>
  )
}
