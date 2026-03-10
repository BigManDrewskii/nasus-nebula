import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import {
  Plus,
  Settings,
  Download,
  ChevronDown,
  Trash2,
  PanelLeft,
  Zap,
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import type { AIModel } from '../types';

interface ToolbarProps {
  onOpenSettings: () => void;
}

export function Toolbar({ onOpenSettings }: ToolbarProps) {
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const {
    sessions,
    activeSessionId,
    activeSession,
    createSession,
    setActiveSession,
    deleteSession,
    settings,
    availableModels,
    setAvailableModels,
    sidebarOpen,
    setSidebarOpen,
  } = useAppStore();

  const session = activeSession();
  const currentModel = session?.model ?? settings.defaultModel;

  // Load models on mount
  useEffect(() => {
    invoke<AIModel[]>('get_models')
      .then(setAvailableModels)
      .catch(console.error);
  }, []);

  const handleNewSession = () => {
    createSession(currentModel);
  };

  const handleModelSelect = (modelId: string) => {
    // Update current session model via store update
    if (activeSessionId && session) {
      useAppStore.setState((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === activeSessionId ? { ...s, model: modelId } : s
        ),
      }));
    }
    useAppStore.getState().updateSettings({ defaultModel: modelId });
    setModelDropdownOpen(false);
  };

  const handleExport = async () => {
    if (!session?.currentHtml) {
      setExportStatus('Nothing to export yet.');
      setTimeout(() => setExportStatus(null), 2500);
      return;
    }
    setIsExporting(true);
    try {
      const projectName = session.name.replace(/\s+/g, '-').toLowerCase() || 'nasus-project';
      const path = await invoke<string>('export_project', {
        html: session.currentHtml,
        css: session.currentCss,
        js: session.currentJs,
        projectName,
      });
      setExportStatus(`Saved to Downloads`);
    } catch (err) {
      setExportStatus('Export failed');
    } finally {
      setIsExporting(false);
      setTimeout(() => setExportStatus(null), 3000);
    }
  };

  const groupedModels = {
    deepseek: availableModels.filter((m) => m.provider === 'deepseek'),
    openrouter: availableModels.filter((m) => m.provider === 'openrouter'),
  };

  const currentModelName =
    availableModels.find((m) => m.id === currentModel)?.name ?? currentModel;

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <button
          className="toolbar-sidebar-toggle"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          <PanelLeft size={18} />
        </button>

        <div className="toolbar-logo">
          <Zap size={20} className="logo-icon" />
          <span className="logo-text">Nasus</span>
          <span className="logo-sub">Web Designer</span>
        </div>
      </div>

      <div className="toolbar-center">
        {/* Model Selector */}
        <div className="model-selector">
          <button
            className="model-selector-btn"
            onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
          >
            <span className="model-selector-name">{currentModelName}</span>
            <ChevronDown size={14} className={`model-chevron ${modelDropdownOpen ? 'model-chevron--open' : ''}`} />
          </button>

          {modelDropdownOpen && (
            <>
              <div className="dropdown-backdrop" onClick={() => setModelDropdownOpen(false)} />
              <div className="model-dropdown">
                {groupedModels.deepseek.length > 0 && (
                  <div className="dropdown-group">
                    <div className="dropdown-group-label">DeepSeek</div>
                    {groupedModels.deepseek.map((model) => (
                      <button
                        key={model.id}
                        className={`dropdown-item ${model.id === currentModel ? 'dropdown-item--active' : ''}`}
                        onClick={() => handleModelSelect(model.id)}
                      >
                        <span className="dropdown-item-name">{model.name}</span>
                        <span className="dropdown-item-ctx">
                          {(model.contextWindow / 1000).toFixed(0)}K ctx
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {groupedModels.openrouter.length > 0 && (
                  <div className="dropdown-group">
                    <div className="dropdown-group-label">OpenRouter</div>
                    {groupedModels.openrouter.map((model) => (
                      <button
                        key={model.id}
                        className={`dropdown-item ${model.id === currentModel ? 'dropdown-item--active' : ''}`}
                        onClick={() => handleModelSelect(model.id)}
                      >
                        <span className="dropdown-item-name">{model.name}</span>
                        <span className="dropdown-item-ctx">
                          {(model.contextWindow / 1000).toFixed(0)}K ctx
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {availableModels.length === 0 && (
                  <div className="dropdown-empty">
                    Add API keys in Settings to load models.
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="toolbar-right">
        {exportStatus && (
          <span className="export-status">{exportStatus}</span>
        )}
        <button
          className="toolbar-btn"
          onClick={handleExport}
          disabled={isExporting || !session?.currentHtml}
          title="Export project"
        >
          <Download size={16} />
          <span>{isExporting ? 'Exporting...' : 'Export'}</span>
        </button>

        <button
          className="toolbar-btn toolbar-btn--primary"
          onClick={handleNewSession}
          title="New session"
        >
          <Plus size={16} />
          <span>New</span>
        </button>

        <button
          className="toolbar-btn toolbar-btn--icon"
          onClick={onOpenSettings}
          title="Settings (Ctrl+,)"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}

export function SessionSidebar() {
  const { sessions, activeSessionId, setActiveSession, deleteSession, sidebarOpen } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="session-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Sessions</span>
        <span className="sidebar-count">{sessions.length}</span>
      </div>
      <div className="sidebar-list">
        {sessions.length === 0 ? (
          <div className="sidebar-empty">No sessions yet</div>
        ) : (
          sessions.map((session) => (
            <div
              key={session.id}
              className={`sidebar-item ${session.id === activeSessionId ? 'sidebar-item--active' : ''}`}
              onClick={() => setActiveSession(session.id)}
            >
              <div className="sidebar-item-content">
                <span className="sidebar-item-name">{session.name}</span>
                <span className="sidebar-item-date">
                  {new Date(session.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <button
                className="sidebar-item-delete"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSession(session.id);
                }}
                title="Delete session"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))
        )}
      </div>
    </aside>
  );
}
