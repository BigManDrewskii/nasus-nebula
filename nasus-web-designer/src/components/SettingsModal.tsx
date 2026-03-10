import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { X, Eye, EyeOff, Save, Key, Sliders } from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { SettingsResponse, AIModel } from '../types';

const MODEL_OPTIONS = [
  { id: 'deepseek-chat', name: 'DeepSeek Chat (V3)', provider: 'deepseek' },
  { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner (R1)', provider: 'deepseek' },
  { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'openrouter' },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openrouter' },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openrouter' },
  { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', provider: 'openrouter' },
  { id: 'google/gemini-pro-1.5', name: 'Gemini Pro 1.5', provider: 'openrouter' },
];

interface SettingsModalProps {
  onClose: () => void;
}

export function SettingsModal({ onClose }: SettingsModalProps) {
  const { settings, updateSettings, setAvailableModels } = useAppStore();

  const [deepseekKey, setDeepseekKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [defaultModel, setDefaultModel] = useState(settings.defaultModel);
  const [maxTokens, setMaxTokens] = useState(settings.maxTokens);
  const [showDeepseek, setShowDeepseek] = useState(false);
  const [showOpenrouter, setShowOpenrouter] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [serverSettings, setServerSettings] = useState<SettingsResponse | null>(null);

  useEffect(() => {
    invoke<SettingsResponse>('get_settings')
      .then(setServerSettings)
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await invoke('update_settings', {
        deepseekKey: deepseekKey || null,
        openrouterKey: openrouterKey || null,
        defaultModel,
        maxTokens,
      });

      updateSettings({
        defaultModel,
        maxTokens,
        deepseekKey: deepseekKey || settings.deepseekKey,
        openrouterKey: openrouterKey || settings.openrouterKey,
      });

      // Refresh model list
      const models = await invoke<AIModel[]>('get_models');
      setAvailableModels(models);

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);

      // Refresh server settings display
      const updated = await invoke<SettingsResponse>('get_settings');
      setServerSettings(updated);

      setDeepseekKey('');
      setOpenrouterKey('');
    } catch (err) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modal-backdrop" onClick={handleBackdropClick}>
      <div className="modal-container" role="dialog" aria-modal="true" aria-label="Settings">
        <div className="modal-header">
          <div className="modal-title">
            <Sliders size={18} />
            <span>Settings</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close settings">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <section className="settings-section">
            <h3 className="settings-section-title">
              <Key size={15} />
              API Keys
            </h3>

            <div className="settings-field">
              <label className="settings-label" htmlFor="deepseek-key">
                DeepSeek API Key
                {serverSettings?.deepseek_key_set && (
                  <span className="key-badge key-badge--set">
                    {serverSettings.deepseek_key_preview}
                  </span>
                )}
              </label>
              <div className="settings-input-group">
                <input
                  id="deepseek-key"
                  type={showDeepseek ? 'text' : 'password'}
                  className="settings-input"
                  value={deepseekKey}
                  onChange={(e) => setDeepseekKey(e.target.value)}
                  placeholder={serverSettings?.deepseek_key_set ? 'Enter new key to update' : 'sk-...'}
                  autoComplete="off"
                />
                <button
                  className="settings-eye-btn"
                  onClick={() => setShowDeepseek(!showDeepseek)}
                  type="button"
                >
                  {showDeepseek ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="settings-hint">
                Get your key at{' '}
                <a href="https://platform.deepseek.com" target="_blank" rel="noopener noreferrer">
                  platform.deepseek.com
                </a>
              </p>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="openrouter-key">
                OpenRouter API Key
                {serverSettings?.openrouter_key_set && (
                  <span className="key-badge key-badge--set">
                    {serverSettings.openrouter_key_preview}
                  </span>
                )}
              </label>
              <div className="settings-input-group">
                <input
                  id="openrouter-key"
                  type={showOpenrouter ? 'text' : 'password'}
                  className="settings-input"
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder={serverSettings?.openrouter_key_set ? 'Enter new key to update' : 'sk-or-...'}
                  autoComplete="off"
                />
                <button
                  className="settings-eye-btn"
                  onClick={() => setShowOpenrouter(!showOpenrouter)}
                  type="button"
                >
                  {showOpenrouter ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              <p className="settings-hint">
                Get your key at{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                  openrouter.ai/keys
                </a>
              </p>
            </div>
          </section>

          <section className="settings-section">
            <h3 className="settings-section-title">
              <Sliders size={15} />
              Model Configuration
            </h3>

            <div className="settings-field">
              <label className="settings-label" htmlFor="default-model">
                Default Model
              </label>
              <select
                id="default-model"
                className="settings-select"
                value={defaultModel}
                onChange={(e) => setDefaultModel(e.target.value)}
              >
                <optgroup label="DeepSeek (Fast & Cheap)">
                  {MODEL_OPTIONS.filter((m) => m.provider === 'deepseek').map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
                <optgroup label="OpenRouter (Multiple Providers)">
                  {MODEL_OPTIONS.filter((m) => m.provider === 'openrouter').map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="settings-field">
              <label className="settings-label" htmlFor="max-tokens">
                Max Tokens
                <span className="settings-label-hint">({maxTokens.toLocaleString()})</span>
              </label>
              <input
                id="max-tokens"
                type="range"
                className="settings-range"
                min={1024}
                max={32768}
                step={512}
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
              />
              <div className="settings-range-labels">
                <span>1K</span>
                <span>8K</span>
                <span>16K</span>
                <span>32K</span>
              </div>
            </div>
          </section>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className={`btn-primary ${isSaving ? 'btn-loading' : ''} ${saveStatus === 'saved' ? 'btn-success' : ''} ${saveStatus === 'error' ? 'btn-error' : ''}`}
            onClick={handleSave}
            disabled={isSaving}
          >
            <Save size={15} />
            {saveStatus === 'saved' ? 'Saved!' : saveStatus === 'error' ? 'Error' : isSaving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
}
