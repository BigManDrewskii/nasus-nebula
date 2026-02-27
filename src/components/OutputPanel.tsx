import { useState } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { PreviewPane } from './PreviewPane'
import { CodePane } from './CodePane'
import { FilesPane } from './FilesPane'
import { Pxi } from './Pxi'

type Tab = 'preview' | 'code' | 'files'

interface OutputPanelProps {
  files: WorkspaceFile[]
  collapsed?: boolean
  activeTab?: Tab
  onTabChange?: (tab: Tab) => void
  /** Called when the panel's own close/collapse button is clicked */
  onCollapse?: () => void
  /** Called when a collapsed-rail icon is clicked; optional tab argument sets active tab first */
  onExpand?: (tab?: Tab) => void
}

export function OutputPanel({
  files,
  collapsed = false,
  activeTab: activeTabProp,
  onTabChange,
  onCollapse,
  onExpand,
}: OutputPanelProps) {
  // Uncontrolled fallback if parent doesn't pass activeTab
  const [localTab, setLocalTab] = useState<Tab>('preview')
  const tab = activeTabProp ?? localTab

  function setTab(t: Tab) {
    setLocalTab(t)
    onTabChange?.(t)
  }

  const hasFiles = files.length > 0
  const hasHtml  = files.some((f) => f.ext === 'html')
  const effectiveTab = tab === 'preview' && !hasHtml && hasFiles ? 'code' : tab

  const tabs: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: 'preview', icon: 'browser',  label: 'Preview' },
    { id: 'code',    icon: 'code',     label: 'Code'    },
    { id: 'files',   icon: 'folder',   label: 'Files',  count: hasFiles ? files.length : undefined },
  ]

  // ── Collapsed icon rail ─────────────────────────────────────────────────────
  if (collapsed) {
    return (
      <div className="output-collapsed-rail" role="complementary" aria-label="Output panel (collapsed)">
        <div className="rail-header">
          <button
            className="rail-toggle-btn"
            onClick={() => onExpand?.()}
            title="Expand output panel (⌘⇧\\)"
            aria-label="Expand output panel"
          >
            <Pxi name="angle-left" size={11} />
          </button>
        </div>
      </div>
    )
  }

  // ── Expanded panel ──────────────────────────────────────────────────────────
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
            {typeof t.count === 'number' && (
              <span className="output-tab-badge">{t.count}</span>
            )}
          </button>
        ))}

        <div className="output-panel-spacer" />

          {onCollapse && (
            <button
              onClick={onCollapse}
              title="Collapse output panel (⌘⇧\\)"
              aria-label="Collapse output panel"
              className="rail-toggle-btn"
            >
              <Pxi name="angle-right" size={11} />
            </button>
          )}
      </div>

      <div className="output-panel-body">
        {effectiveTab === 'preview' && <PreviewPane files={files} />}
        {effectiveTab === 'code'    && <CodePane files={files} />}
        {effectiveTab === 'files'   && <FilesPane files={files} />}
      </div>
    </div>
  )
}
