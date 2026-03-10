import React, { useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { ChatPanel } from './components/ChatPanel';
import { PreviewPane } from './components/PreviewPane';
import { Toolbar, SessionSidebar } from './components/Toolbar';
import { SettingsModal } from './components/SettingsModal';
import { useAppStore } from './store/appStore';
import type { AIModel, SettingsResponse } from './types';
import './styles/global.css';
import './styles/components.css';

export default function App() {
  const {
    sessions,
    activeSessionId,
    createSession,
    showSettings,
    setShowSettings,
    updateSettings,
    setAvailableModels,
    sidebarOpen,
  } = useAppStore();

  // Initialize default session on first mount
  useEffect(() => {
    if (sessions.length === 0) {
      createSession();
    } else if (!activeSessionId) {
      useAppStore.setState({ activeSessionId: sessions[0].id });
    }
  }, []);

  // Load settings from backend on mount
  useEffect(() => {
    invoke<SettingsResponse>('get_settings')
      .then((s) => {
        updateSettings({
          defaultModel: s.default_model,
          maxTokens: s.max_tokens,
        });
      })
      .catch(console.error);

    invoke<AIModel[]>('get_models')
      .then(setAvailableModels)
      .catch(console.error);
  }, []);

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMac = navigator.platform.toLowerCase().includes('mac');
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === ',') {
        e.preventDefault();
        setShowSettings(true);
      }

      if (e.key === 'Escape' && showSettings) {
        setShowSettings(false);
      }
    },
    [showSettings, setShowSettings]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="app-root">
      <Toolbar onOpenSettings={() => setShowSettings(true)} />

      <div className="app-body">
        {sidebarOpen && <SessionSidebar />}

        <main className="app-main">
          <div className="panel-chat">
            <ChatPanel />
          </div>
          <div className="panel-divider" />
          <div className="panel-preview">
            <PreviewPane />
          </div>
        </main>
      </div>

      {showSettings && (
        <SettingsModal onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
