import { useState, useEffect, useCallback } from 'react'
import { tauriInvoke } from '../tauri'
import type { MemoryFiles } from '../types'
import { Pxi } from './Pxi'

interface Props {
  taskId: string
  workspacePath: string
  onResume: (progressContent: string) => void
  onClose: () => void
}

type Tab = 'plan' | 'findings' | 'progress'

const TABS: { id: Tab; label: string; icon: string; key: keyof MemoryFiles }[] = [
  { id: 'plan',     label: 'Task Plan', icon: 'check-list',  key: 'task_plan' },
  { id: 'findings', label: 'Findings',  icon: 'search',      key: 'findings'  },
  { id: 'progress', label: 'Progress',  icon: 'chart-line',  key: 'progress'  },
]

// ── Download helpers ──────────────────────────────────────────────────────────

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function downloadSingleFile(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  triggerDownload(blob, filename)
}

// ─────────────────────────────────────────────────────────────────────────────

export function MemoryViewer({ taskId, workspacePath, onResume, onClose }: Props) {
  const [files, setFiles] = useState<MemoryFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const [error, setError] = useState<string | null>(null)

  const loadFiles = useCallback(() => {
    setLoading(true)
    setError(null)
    tauriInvoke<MemoryFiles>('read_memory_files', { taskId, workspacePath })
      .then((data) => { setFiles(data ?? null); setLoading(false) })
      .catch((e) => { setError(String(e)); setLoading(false) })
  }, [taskId, workspacePath])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  const currentTab = TABS.find((t) => t.id === activeTab)!
  const currentContent = files ? (files[currentTab.key] as string) : ''
  const isEmpty = !currentContent || !currentContent.trim()

  const currentFilename = activeTab === 'plan' ? 'task_plan.md' : activeTab === 'findings' ? 'findings.md' : 'progress.md'

  return (
    <div className="mv-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="mv-modal">
        {/* Header */}
        <div className="mv-header">
          <div className="mv-header-left">
            <Pxi name="bookmark" size={14} style={{ color: 'var(--tx-tertiary)' }} />
            <div>
              <h2 className="mv-title">Agent Memory</h2>
              <p className="mv-subtitle">Persistent files in /workspace</p>
            </div>
          </div>
          <div className="mv-header-actions">
            {/* Refresh button */}
            <button
              onClick={loadFiles}
              title="Refresh"
              aria-label="Refresh memory files"
                className="mv-icon-btn hover-text-primary"
            >
              <Pxi name="refresh" size={14} />
            </button>

            {files?.progress && (
              <button
                onClick={() => onResume(files.progress)}
                  className="mv-resume-btn hover-bg-amber"
              >
                <Pxi name="refresh" size={12} />
                Resume Task
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close memory viewer"
              className="mv-close-btn hover-text-primary"
            >
              <Pxi name="times" size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div role="tablist" aria-label="Memory file tabs" className="mv-tabs">
          {TABS.map((tab) => {
            const isActiveTab = activeTab === tab.id
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={isActiveTab}
                aria-controls={`panel-${tab.id}`}
                  className={`mv-tab${isActiveTab ? ' mv-tab--active' : ''} hover-text-primary`}
              >
                <Pxi name={tab.icon} size={12} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="mv-content"
        >
          {loading ? (
            <div className="mv-loading">
              <Pxi name="spinner-third" size={14} />
              <span className="mv-loading-text">Loading memory files…</span>
            </div>
          ) : error ? (
            <div className="mv-error">
              <Pxi name="exclamation-triangle" size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          ) : isEmpty ? (
            <div className="mv-empty">
              <Pxi name={currentTab.icon} size={24} />
              <span className="mv-empty-text">No content yet — the agent will populate this file as it works.</span>
            </div>
          ) : (
            <pre className="mv-pre">{currentContent}</pre>
          )}
        </div>

        {/* Footer */}
        <div className="mv-footer">
          <p className="mv-workspace-path">
            <Pxi name="folder-open" size={12} />
            <code className="mv-workspace-code">{workspacePath}</code>
          </p>
          {!isEmpty && currentContent && (
            <button
              onClick={() => downloadSingleFile(currentFilename, currentContent)}
                className="mv-download-btn hover-text-secondary"
            >
              <Pxi name="download" size={12} />
              Download {currentFilename}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
