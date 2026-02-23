import { useState, useEffect } from 'react'
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

export function MemoryViewer({ taskId, workspacePath, onResume, onClose }: Props) {
  const [files, setFiles] = useState<MemoryFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    tauriInvoke<MemoryFiles>('read_memory_files', { taskId, workspacePath })
      .then((data) => { setFiles(data); setLoading(false) })
      .catch((e) => { setError(String(e)); setLoading(false) })
  }, [taskId, workspacePath])

  const currentTab = TABS.find((t) => t.id === activeTab)!
  const currentContent = files ? (files[currentTab.key] as string) : ''
  const isEmpty = !currentContent || !currentContent.trim()

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-[700px] max-w-[95vw] max-h-[82vh] flex flex-col rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: '#0f0f0f', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="flex items-center gap-2.5">
            <Pxi name="bookmark" size={13} style={{ color: '#555' }} />
            <div>
              <h2 className="text-[13px] font-semibold" style={{ color: '#d0d0d0' }}>Agent Memory</h2>
              <p className="text-[11px] mt-px" style={{ color: '#383838' }}>Persistent files in /workspace</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {files?.progress && (
              <button
                onClick={() => onResume(files.progress)}
                className="flex items-center gap-1.5 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-all"
                style={{
                  background: 'rgba(37,99,235,0.15)',
                  border: '1px solid rgba(37,99,235,0.25)',
                  color: '#60a5fa',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(37,99,235,0.25)'
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.4)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(37,99,235,0.15)'
                  e.currentTarget.style.borderColor = 'rgba(37,99,235,0.25)'
                }}
              >
                <Pxi name="refresh" size={10} />
                Resume Task
              </button>
            )}
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
        </div>

        {/* Tabs */}
        <div
          className="flex flex-shrink-0 px-3 gap-px pt-2"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-medium transition-all rounded-t-lg relative"
                style={{
                  color: isActive ? '#c0c0c0' : '#3a3a3a',
                  background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                  borderBottom: isActive ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
                  marginBottom: -1,
                }}
                onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.color = '#777' }}
                onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.color = '#3a3a3a' }}
              >
                <Pxi name={tab.icon} size={10} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto min-h-0 p-4">
          {loading ? (
            <div className="flex items-center justify-center gap-2 h-32" style={{ color: '#333' }}>
              <Pxi name="spinner-third" size={13} />
              <span className="text-[12px]">Loading memory files…</span>
            </div>
          ) : error ? (
            <div
              className="flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-[12px]"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.15)', color: '#fca5a5' }}
            >
              <Pxi name="exclamation-triangle" size={12} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
            ) : isEmpty ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2" style={{ color: '#444' }}>
                <Pxi name={currentTab.icon} size={20} />
                <span className="text-[12px] italic">No content yet — the agent will populate this file as it works.</span>
              </div>
          ) : (
            <pre className="text-[11.5px] font-mono leading-relaxed whitespace-pre-wrap break-words" style={{ color: '#888' }}>
              {currentContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-2.5 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
        >
            <p className="text-[10px] flex items-center gap-1.5" style={{ color: '#383838' }}>
            <Pxi name="folder-open" size={9} />
            <code style={{ color: '#333' }}>{workspacePath}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
