import { useState, useEffect } from 'react'
import { tauriInvoke } from '../tauri'
import { getWorkspace } from '../agent/tools'
import type { MemoryFiles } from '../types'
import { Pxi } from './Pxi'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

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

export function MemoryViewer({ taskId, workspacePath, onResume, onClose }: Props) {
  const [files, setFiles] = useState<MemoryFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)

    if (isTauri) {
      // Desktop: read from real filesystem via Tauri
      tauriInvoke<MemoryFiles>('read_memory_files', { taskId, workspacePath })
        .then((data) => { setFiles(data); setLoading(false) })
        .catch((e) => { setError(String(e)); setLoading(false) })
    } else {
      // Browser: read from in-memory workspace store
      try {
        const ws = getWorkspace(taskId)
        const data: MemoryFiles = {
          task_plan: ws.get('task_plan.md') ?? '',
          findings: ws.get('findings.md') ?? '',
          progress: ws.get('progress.md') ?? '',
        }
        setFiles(data)
      } catch (e) {
        setError(String(e))
      } finally {
        setLoading(false)
      }
    }
  }, [taskId, workspacePath])

  const currentTab = TABS.find((t) => t.id === activeTab)!
  const currentContent = files ? (files[currentTab.key] as string) : ''
  const isEmpty = !currentContent || !currentContent.trim()

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        style={{ width: 700, maxWidth: '95vw', maxHeight: '82vh', display: 'flex', flexDirection: 'column', borderRadius: 20, boxShadow: '0 32px 80px rgba(0,0,0,0.6)', overflow: 'hidden', background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', flexShrink: 0, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Pxi name="bookmark" size={13} style={{ color: 'var(--tx-tertiary)' }} />
            <div>
              <h2 style={{ fontSize: 13, fontWeight: 600, color: 'var(--tx-primary)', margin: 0 }}>Agent Memory</h2>
              <p style={{ fontSize: 11, marginTop: 1, color: 'var(--tx-tertiary)', margin: 0 }}>Persistent files in /workspace</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {files?.progress && (
              <button
                onClick={() => onResume(files.progress)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  fontSize: 11, fontWeight: 500,
                  padding: '6px 12px',
                  borderRadius: 8,
                  cursor: 'pointer',
                  background: 'oklch(64% 0.214 40.1 / 0.12)',
                  border: '1px solid oklch(64% 0.214 40.1 / 0.28)',
                  color: 'var(--amber-soft)',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'oklch(64% 0.214 40.1 / 0.2)'
                  e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.45)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'oklch(64% 0.214 40.1 / 0.12)'
                  e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.28)'
                }}
              >
                <Pxi name="refresh" size={10} />
                Resume Task
              </button>
            )}
            <button
              onClick={onClose}
              style={{ padding: 6, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tx-tertiary)', transition: 'color 0.12s' }}
              onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--tx-primary)' }}
              onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
            >
              <Pxi name="times" size={13} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{ display: 'flex', flexShrink: 0, padding: '8px 12px 0', gap: 2, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px',
                  fontSize: 11,
                  fontWeight: 500,
                  borderRadius: '8px 8px 0 0',
                  border: 'none',
                  cursor: 'pointer',
                  background: isActive ? 'oklch(64% 0.214 40.1 / 0.07)' : 'transparent',
                  color: isActive ? 'var(--amber-soft)' : 'var(--tx-secondary)',
                  borderBottom: isActive ? '2px solid oklch(64% 0.214 40.1 / 0.6)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.12s, background 0.12s',
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--tx-primary)' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = 'var(--tx-secondary)' }}
              >
                <Pxi name={tab.icon} size={10} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: 16 }}>
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 128, color: 'var(--tx-tertiary)' }}>
              <Pxi name="spinner-third" size={13} />
              <span style={{ fontSize: 12 }}>Loading memory files…</span>
            </div>
          ) : error ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 12, fontSize: 12, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }}>
              <Pxi name="exclamation-triangle" size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          ) : isEmpty ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 128, gap: 8, color: 'var(--tx-secondary)' }}>
              <Pxi name={currentTab.icon} size={20} />
              <span style={{ fontSize: 12, fontStyle: 'italic' }}>No content yet — the agent will populate this file as it works.</span>
            </div>
          ) : (
            <pre style={{ fontSize: 11, fontFamily: 'var(--font-mono)', lineHeight: 1.65, whiteSpace: 'pre-wrap', wordBreak: 'break-words', color: 'var(--tx-secondary)', margin: 0 }}>
              {currentContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '8px 20px 10px', flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <p style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 6, color: 'var(--tx-tertiary)', margin: 0 }}>
            <Pxi name="folder-open" size={9} />
            <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--tx-tertiary)' }}>{isTauri ? workspacePath : '/workspace (in-memory)'}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
