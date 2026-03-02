import { useState, useEffect, useRef } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { PreviewPane } from './PreviewPane'
import { CodePane } from './CodePane'
import { FilesPane } from './FilesPane'
import { BrowserPreview } from './BrowserPreview'
import { Pxi } from './Pxi'

export type Tab = 'preview' | 'code' | 'files' | 'browser'

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

interface NewContentState {
  preview: boolean
  code: boolean
  files: boolean
  browser: boolean
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

  // Track new content indicators
  const [newContent, setNewContent] = useState<NewContentState>({
    preview: false,
    code: false,
    files: false,
    browser: false,
  })

  // Track previous file count for detecting changes
  const prevFileCountRef = useRef(0)

  function setTab(t: Tab) {
    setLocalTab(t)
    onTabChange?.(t)
    // Clear new content indicator for the selected tab
    setNewContent(prev => ({ ...prev, [t]: false }))
  }

  // Smart tab auto-switching based on file creation events
  useEffect(() => {
    const handleToolComplete = (e: Event) => {
      const detail = (e as CustomEvent<{
        taskId: string
        tool: string
        input: Record<string, unknown>
        output: string
      }>).detail

      if (!detail) return

      const { tool, input } = detail
      const path = String(input.path ?? '')

      // Auto-switch based on file type created
      if (tool === 'write_file' || tool === 'patch_file') {
        if (path.endsWith('.html')) {
          setNewContent(prev => ({ ...prev, preview: true }))
          // Auto-switch to preview for HTML files
          setTab('preview')
        } else if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
          setNewContent(prev => ({ ...prev, code: true }))
          // Auto-switch to code for source files
          setTab('code')
        } else {
          setNewContent(prev => ({ ...prev, files: true }))
          setTab('files')
        }
      }

      // Handle file reads
      if (tool === 'read_file') {
        if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
          setNewContent(prev => ({ ...prev, code: true }))
        } else {
          setNewContent(prev => ({ ...prev, files: true }))
        }
      }
    }

    // Track file count changes
    if (files.length > prevFileCountRef.current) {
      setNewContent(prev => ({ ...prev, files: true }))
    }
    prevFileCountRef.current = files.length

    window.addEventListener('nasus:tool-complete', handleToolComplete)
    return () => window.removeEventListener('nasus:tool-complete', handleToolComplete)
  }, [files.length])

  // Clear new content indicator when viewing the tab
  useEffect(() => {
    setNewContent(prev => ({ ...prev, [tab]: false }))
  }, [tab])

  const hasFiles = files.length > 0
  const hasHtml  = files.some((f) => f.ext === 'html')
  const effectiveTab = tab === 'preview' && !hasHtml && hasFiles ? 'code' : tab

  const tabs: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: 'preview', icon: 'browser',  label: 'Preview' },
    { id: 'code',    icon: 'code',     label: 'Code'    },
    { id: 'files',   icon: 'folder',   label: 'Files',  count: hasFiles ? files.length : undefined },
    { id: 'browser', icon: 'desktop',  label: 'Browser' },
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
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`output-tab${effectiveTab === t.id ? ' output-tab--active' : ''}`}
            role="tab"
            aria-selected={effectiveTab === t.id}
            aria-controls={`panel-${t.id}`}
            style={{ position: 'relative' }}
          >
            <Pxi name={t.icon} size={10} />
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span className="output-tab-badge">{t.count}</span>
            )}
            {/* New content indicator dot */}
            {newContent[t.id] && !effectiveTab.includes(t.id) && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 5,
                  height: 5,
                  borderRadius: '50%',
                  background: 'var(--amber)',
                  boxShadow: '0 0 6px rgba(234,179,8,0.5)',
                  animation: 'contentPulse 2s ease-in-out infinite',
                }}
              >
                <style>{`
                  @keyframes contentPulse {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(0.85); }
                  }
                `}</style>
              </span>
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

      <div className="output-panel-body" role="tabpanel" aria-labelledby={`tab-${effectiveTab}`}>
        {effectiveTab === 'preview' && <PreviewPane files={files} />}
        {effectiveTab === 'code'    && <CodePane files={files} />}
        {effectiveTab === 'files'   && <FilesPane files={files} />}
        {effectiveTab === 'browser' && <BrowserPreview />}
      </div>
    </div>
  )
}
