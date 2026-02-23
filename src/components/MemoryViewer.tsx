import { useState, useEffect } from 'react'
import { tauriInvoke } from '../tauri'
import type { MemoryFiles } from '../types'

interface Props {
  taskId: string
  workspacePath: string
  onResume: (progressContent: string) => void
  onClose: () => void
}

type Tab = 'plan' | 'findings' | 'progress'

export function MemoryViewer({ taskId, workspacePath, onResume, onClose }: Props) {
  const [files, setFiles] = useState<MemoryFiles | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('plan')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    tauriInvoke<MemoryFiles>('read_memory_files', {
      taskId,
      workspacePath,
    })
      .then((data) => {
        setFiles(data)
        setLoading(false)
      })
      .catch((e) => {
        setError(String(e))
        setLoading(false)
      })
  }, [taskId, workspacePath])

  const tabs: { id: Tab; label: string; icon: string; key: keyof MemoryFiles }[] = [
    { id: 'plan', label: 'Task Plan', icon: '📋', key: 'task_plan' },
    { id: 'findings', label: 'Findings', icon: '🔍', key: 'findings' },
    { id: 'progress', label: 'Progress', icon: '📊', key: 'progress' },
  ]

  const currentContent = files ? files[tabs.find((t) => t.id === activeTab)!.key] as string : ''
  const isEmpty = !currentContent || currentContent.trim() === ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-[700px] max-w-[95vw] max-h-[80vh] flex flex-col bg-neutral-900 border border-neutral-700 rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-700 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-neutral-100">Agent Memory</h2>
            <p className="text-xs text-neutral-500 mt-0.5">Persistent files in /workspace</p>
          </div>
          <div className="flex items-center gap-2">
            {files?.progress && (
              <button
                onClick={() => onResume(files.progress)}
                className="text-xs px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors"
              >
                Resume Task
              </button>
            )}
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-neutral-700 text-neutral-400 hover:text-neutral-200 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-700 flex-shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-300'
                  : 'border-transparent text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-neutral-500 text-sm">
              Loading memory files…
            </div>
          ) : error ? (
            <div className="text-xs text-red-400 p-3 bg-red-950/30 rounded border border-red-800/40">
              {error}
            </div>
          ) : isEmpty ? (
            <div className="flex items-center justify-center h-32 text-neutral-600 text-sm italic">
              No content yet — the agent will populate this file as it works.
            </div>
          ) : (
            <pre className="text-xs text-neutral-300 whitespace-pre-wrap break-words font-mono leading-relaxed">
              {currentContent}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-neutral-700 flex-shrink-0">
          <p className="text-xs text-neutral-600">
            Workspace: <code className="text-neutral-500">{workspacePath}</code>
          </p>
        </div>
      </div>
    </div>
  )
}
