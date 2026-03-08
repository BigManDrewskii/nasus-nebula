import { useState, useEffect, useRef } from 'react'
import type { WorkspaceFile } from '../hooks/useWorkspaceFiles'
import { PreviewPane } from './PreviewPane'
import { CodePane } from './CodePane'
import { FilesPane } from './FilesPane'
import { BrowserPreview } from './BrowserPreview'
import { Pxi } from './Pxi'
import { RailButton } from './sidebar/SidebarComponents'

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
  onExpand: _onExpand,
}: OutputPanelProps) {
  // Uncontrolled fallback if parent doesn't pass activeTab
  const [localTab, setLocalTab] = useState<Tab>('files')
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
  // Registered once at mount — no dependency on files.length to avoid accumulating listeners
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
            // Auto-switch to code for source files — only if not already on preview
            setLocalTab(prev => {
              if (prev === 'preview') return prev
              onTabChange?.('code')
              return 'code'
            })
            setNewContent(prev => ({ ...prev, code: true }))
          } else {
            // CSS, md, etc. — mark files tab as having new content but don't
            // switch away from preview/code if already there
            setNewContent(prev => ({ ...prev, files: true }))
            setLocalTab(prev => {
              if (prev === 'preview' || prev === 'code') return prev
              onTabChange?.('files')
              return 'files'
            })
          }
        }

        // Handle file reads — only update indicator, never force a tab switch
        if (tool === 'read_file') {
          if (path.endsWith('.tsx') || path.endsWith('.ts') || path.endsWith('.jsx') || path.endsWith('.js')) {
            setNewContent(prev => ({ ...prev, code: true }))
          } else {
            setNewContent(prev => ({ ...prev, files: true }))
          }
        }
      }

    window.addEventListener('nasus:tool-complete', handleToolComplete)
    return () => window.removeEventListener('nasus:tool-complete', handleToolComplete)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Track file count changes separately from the tool-complete listener
  useEffect(() => {
    if (files.length > prevFileCountRef.current) {
      setNewContent(prev => ({ ...prev, files: true }))
    }
    prevFileCountRef.current = files.length
  }, [files.length])

  // Clear new content indicator when viewing the tab
  useEffect(() => {
    setNewContent(prev => ({ ...prev, [tab]: false }))
  }, [tab])

  const hasFiles = files.length > 0
  const hasHtml  = files.some((f) => f.ext === 'html')
  const effectiveTab = tab === 'preview' && !hasHtml && hasFiles ? 'code' : tab

  const tabs: { id: Tab; icon: string; label: string; count?: number }[] = [
    { id: 'browser', icon: 'globe',   label: 'Browser' },
    { id: 'files',   icon: 'folder',  label: 'Files',   count: hasFiles ? files.length : undefined },
    { id: 'preview', icon: 'eye',     label: 'Preview' },
    { id: 'code',    icon: 'code',    label: 'Code'    },
  ]

  // ── Render always — use visibility to avoid unmounting BrowserPreview etc on collapse ──
  return (
    <div className="output-panel" style={collapsed ? { display: 'none' } : undefined}>
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
            <Pxi name={t.icon} size={11} />
            <span>{t.label}</span>
            {typeof t.count === 'number' && (
              <span className="output-tab-badge">{t.count}</span>
            )}
            {/* New content indicator dot */}
            {newContent[t.id] && effectiveTab !== t.id && (
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
                />
              )}
            </button>
        ))}

        <div className="output-panel-spacer" />

          {onCollapse && (
            <RailButton
              icon="angle-right"
              title="Collapse output panel (⌘⇧\)"
              onClick={onCollapse}
            />
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
