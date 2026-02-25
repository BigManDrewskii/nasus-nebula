import { useState } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { PreviewPane } from './PreviewPane'
import { CodePane } from './CodePane'
import { FilesPane } from './FilesPane'
import { Pxi } from './Pxi'

type Tab = 'preview' | 'code' | 'files'

interface OutputPanelProps {
  files: WorkspaceFile[]
  /** Called when the user clicks the collapse/hide button */
  onCollapse?: () => void
}

export function OutputPanel({ files, onCollapse }: OutputPanelProps) {
  const [tab, setTab] = useState<Tab>('preview')

  const hasFiles = files.length > 0
  const hasHtml = files.some((f) => f.ext === 'html')

  // Auto-prefer code tab if no HTML is present and there are files
  const effectiveTab = tab === 'preview' && !hasHtml && hasFiles ? 'code' : tab

  const tabs: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: 'preview', icon: 'browser', label: 'Preview' },
    { id: 'code', icon: 'code', label: 'Code' },
    { id: 'files', icon: 'folder', label: 'Files', count: hasFiles ? files.length : undefined },
  ]

  return (
    <div className="output-panel">
      <div className="output-panel-tabs" role="tablist" aria-label="Output tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`output-tab${effectiveTab === t.id ? ' output-tab--active' : ''}`}
            role="tab"
            aria-selected={effectiveTab === t.id}
          >
            <Pxi name={t.icon} size={10} />
            <span>{t.label}</span>
            {typeof t.count === 'number' && <span className="output-tab-badge">{t.count}</span>}
          </button>
        ))}

        <div className="output-panel-spacer" />

        {onCollapse && (
          <button
            onClick={onCollapse}
            title="Hide output panel"
            className="output-tab output-tab--icon"
            aria-label="Hide output panel"
          >
            <Pxi name="chevron-right" size={10} />
          </button>
        )}
      </div>

      <div className="output-panel-body">
        {effectiveTab === 'preview' && <PreviewPane files={files} />}
        {effectiveTab === 'code' && <CodePane files={files} />}
        {effectiveTab === 'files' && <FilesPane files={files} />}
      </div>
    </div>
  )
}
