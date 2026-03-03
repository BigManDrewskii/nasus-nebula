// Orchids was here
import { useState, useCallback, useMemo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { Task } from './types'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { OutputPanel, type Tab } from './components/OutputPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { OnboardingScreen } from './components/OnboardingScreen'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pxi } from './components/Pxi'
import { useWorkspaceFiles } from './hooks/useWorkspaceFiles'
import { useModelSync } from './hooks/useModelSync'
import { useSidebarResponsive } from './hooks/useSidebarResponsive'
import { ContextPanel } from './components/ContextPanel'

const LAYOUT_KEY = 'nasus-layout-state'

interface LayoutState {
  leftCollapsed: boolean
  rightCollapsed: boolean
  contextCollapsed: boolean
  rightActiveTab: Tab
  sidebarPreference?: 'auto' | 'always-left' | 'always-right' | 'minimal'
}

function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { leftCollapsed: false, rightCollapsed: false, contextCollapsed: false, rightActiveTab: 'preview', sidebarPreference: 'auto' }
}

function saveLayout(state: LayoutState) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function App() {
  const { tasks, activeTaskId, setActiveTaskId, addTask, onboardingComplete, workspacePath, routerConfig } = useAppStore(
    useShallow((s) => ({
      tasks: s.tasks,
      activeTaskId: s.activeTaskId,
      setActiveTaskId: s.setActiveTaskId,
      addTask: s.addTask,
      onboardingComplete: s.onboardingComplete,
      workspacePath: s.workspacePath,
      routerConfig: s.routerConfig,
    })),
  )
  
  // Sync global workspace path to manager
    useEffect(() => {
      if (workspacePath) {
        import('./agent/workspace/WorkspaceManager').then((mod) => {
          const manager = mod.workspaceManager || mod.default
          if (manager) {
            manager.init(workspacePath)
          }
        }).catch(console.error)
      }
    }, [workspacePath])

    // Initialize gateway service on startup
    useEffect(() => {
      const store = useAppStore.getState()

      // gateways are NOT persisted, so gateways[0].apiKey = '' on every cold start.
      // store.apiKey IS persisted via zustand. Seed it in synchronously so the first
      // LLM call (which may happen before loadGatewayConfig resolves) has a valid key.
      if (store.apiKey) {
        store.updateGateway('openrouter', { apiKey: store.apiKey })
      }

      store.initGatewayService()
      store.loadGatewayConfig().catch(console.error)
    }, [])

  const [showSettings, setShowSettings] = useState(false)
  const [pruneNotice, setPruneNotice] = useState<string | null>(null)

  // Layout state — loaded from localStorage
  const [savedLayout] = useState<LayoutState>(loadLayout)
  const [leftCollapsed, setLeftCollapsed] = useState(savedLayout.leftCollapsed)
  const [rightCollapsed, setRightCollapsed] = useState(savedLayout.rightCollapsed)
  const [contextCollapsed, setContextCollapsed] = useState(savedLayout.contextCollapsed ?? false)
  const [rightActiveTab, setRightActiveTab] = useState<Tab>(savedLayout.rightActiveTab)
  const [sidebarPreference] = useState<'auto' | 'always-left' | 'always-right' | 'minimal'>(
    savedLayout.sidebarPreference ?? 'auto'
  )
  const [outputVisible, setOutputVisible] = useState(true)

  // Responsive hook for window-size-aware sidebar behavior
  // Note: Responsive recommendations are available but manual state currently takes precedence
  const responsive = useSidebarResponsive({
    leftManual: leftCollapsed,
    rightManual: rightCollapsed,
    userPreference: sidebarPreference,
  })

  // Log responsive state for debugging (can be removed in production)
  useEffect(() => {
    if (responsive.shouldAutoCollapse && !leftCollapsed) {
      // Window is too tight - could auto-collapse here
    }
  }, [responsive.shouldAutoCollapse, leftCollapsed, responsive.windowWidth])

  // Silently keep the OpenRouter model list fresh in the background
  useModelSync()

  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  )

  // Workspace files for the active task (reactive — updates on agent writes)
  const workspaceFiles = useWorkspaceFiles(activeTaskId)

  // Persist layout state whenever it changes
  useEffect(() => {
    saveLayout({ leftCollapsed, rightCollapsed, contextCollapsed, rightActiveTab, sidebarPreference })
  }, [leftCollapsed, rightCollapsed, contextCollapsed, rightActiveTab, sidebarPreference])

    // Auto-show + expand right panel when the agent creates its first file,
    // or when switching to a task that already has files.
    useEffect(() => {
      if (workspaceFiles.length > 0) {
        if (!outputVisible) setOutputVisible(true)
        if (rightCollapsed) setRightCollapsed(false)
      }
    }, [workspaceFiles.length, activeTaskId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (!mod) return
      if (e.key === '\\' && !e.shiftKey) { e.preventDefault(); setLeftCollapsed((v) => !v) }
      if (e.key === '\\' && e.shiftKey)  { e.preventDefault(); setRightCollapsed((v) => !v) }
      if (e.key === 'j'  && e.shiftKey)  { e.preventDefault(); setContextCollapsed((v) => !v) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleLeft    = useCallback(() => setLeftCollapsed((v) => !v),    [])
  const toggleRight   = useCallback(() => setRightCollapsed((v) => !v),   [])
  const toggleContext = useCallback(() => setContextCollapsed((v) => !v), [])

  useEffect(() => {
    function onPruned(e: Event) {
      const count = (e as CustomEvent).detail?.count ?? 1
      const msg = `${count} oldest task${count > 1 ? 's were' : ' was'} removed to stay under the 50-task limit.`
      setPruneNotice(msg)
      setTimeout(() => setPruneNotice(null), 5000)
    }
    window.addEventListener('nasus:tasks-pruned', onPruned)
    return () => window.removeEventListener('nasus:tasks-pruned', onPruned)
  }, [])

  // When serve_preview signals a live dev server, auto-switch the Output panel to Preview
  useEffect(() => {
    function onPreviewReady() {
      setRightActiveTab('preview')
      setRightCollapsed(false)
      setOutputVisible(true)
    }
    window.addEventListener('nasus:preview-ready', onPreviewReady)
    return () => window.removeEventListener('nasus:preview-ready', onPreviewReady)
  }, [])

  const [isOffline, setIsOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline  = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  const handleNewTask = useCallback(() => {
    const task: Task = {
      id: crypto.randomUUID(),
      title: 'New task',
      status: 'pending',
      createdAt: new Date(),
      budgetMode: routerConfig.budget === 'free' ? 'free' : 'paid',
    }
    addTask(task)
    setActiveTaskId(task.id)
  }, [addTask, setActiveTaskId, routerConfig.budget])

  const openSettings  = useCallback(() => setShowSettings(true),  [])
  const closeSettings = useCallback(() => setShowSettings(false), [])

  if (!onboardingComplete) {
    return (
      <ErrorBoundary>
        <OnboardingScreen />
      </ErrorBoundary>
    )
  }

    return (
      <ErrorBoundary>
        {/* Skip link for keyboard users */}
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <div className="app-root">
          {/* Tauri title bar drag region */}
          <div data-tauri-drag-region style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 28, zIndex: 9999, WebkitAppRegion: 'drag' } as React.CSSProperties} />
          <div style={{ position: 'fixed', top: 28, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)', zIndex: 9998, pointerEvents: 'none' }} />

        {/* ── Left Sidebar ── */}
        <div className={`app-sidebar-left${leftCollapsed ? ' app-sidebar--collapsed' : ''}`}>
          <Sidebar
            tasks={tasks}
            activeTaskId={activeTaskId}
            onSelectTask={setActiveTaskId}
            onNewTask={handleNewTask}
            onOpenSettings={openSettings}
            onToggleContext={toggleContext}
            contextOpen={!contextCollapsed}
            collapsed={leftCollapsed}
            onToggleCollapse={toggleLeft}
          />
        </div>

        {/* ── Chat ── */}
        <main id="main-content" className="app-chat">
          <ChatView
            task={activeTask}
            onNewTask={handleNewTask}
            onOpenSettings={openSettings}
            outputVisible={outputVisible}
            onShowOutput={() => {
              setOutputVisible(true)
              setRightCollapsed(false)
            }}
            workspaceFileCount={workspaceFiles.length}
            leftCollapsed={leftCollapsed}
            rightCollapsed={rightCollapsed}
            onToggleLeft={toggleLeft}
            onToggleRight={toggleRight}
          />
        </main>

        {/* ── Right Output Panel ── */}
        {outputVisible && (
          <div className={`app-sidebar-right${rightCollapsed ? ' app-sidebar--collapsed' : ''}`}>
            <OutputPanel
              key={activeTaskId ?? 'none'}
              files={workspaceFiles}
              collapsed={rightCollapsed}
              activeTab={rightActiveTab}
              onTabChange={setRightActiveTab}
              onCollapse={toggleRight}
              onExpand={(tab) => {
                if (tab) setRightActiveTab(tab)
                setRightCollapsed(false)
              }}
            />
          </div>
        )}

        {/* ── Context / Settings Panel ── */}
        <div className={`app-context-panel${contextCollapsed ? ' app-sidebar--collapsed' : ''}`}>
          <ContextPanel
            collapsed={contextCollapsed}
            onToggle={toggleContext}
          />
        </div>

        {showSettings && <SettingsPanel onClose={closeSettings} />}

        {/* Offline banner */}
        {isOffline && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              zIndex: 300,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              padding: '6px 16px',
              background: 'rgba(239,68,68,0.12)',
              borderBottom: '1px solid rgba(239,68,68,0.25)',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Pxi name="wifi" size={11} style={{ color: '#f87171' }} />
            <span style={{ fontSize: 11.5, color: '#f87171', fontWeight: 500 }}>
              No internet connection — agent cannot run until connectivity is restored
            </span>
          </div>
        )}

        {/* Task prune notice */}
        {pruneNotice && (
          <div
            style={{
              position: 'fixed',
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 200,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 12,
              background: 'rgba(13,13,13,0.96)',
              border: '1px solid rgba(234,179,8,0.3)',
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.18s ease',
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            <Pxi name="info-circle" size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'var(--tx-secondary)' }}>{pruneNotice}</span>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}

export default App
