// Orchids was here
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { Task } from './types'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { OutputPanel, type Tab } from './components/OutputPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pxi } from './components/Pxi'
import { useWorkspaceFiles } from './hooks/useWorkspaceFiles'
import { useModelSync } from './hooks/useModelSync'
import { PanelDivider } from './components/PanelDivider'
import { createLogger } from './lib/logger'
import { tauriInvoke } from './tauri'

const log = createLogger('App')

// Lazy-load panels not visible on initial render to reduce startup bundle parse time
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })))
const MemoryBrowser = lazy(() => import('./components/MemoryBrowser').then(m => ({ default: m.MemoryBrowser })))

const LAYOUT_KEY = 'nasus-layout-state'

interface LayoutState {
  leftCollapsed: boolean
  rightCollapsed: boolean
  rightActiveTab: Tab
  rightPanelWidth: number
  rightPanelVisible: boolean
  configSections: Record<string, boolean>
  sidebarPreference?: 'auto' | 'always-left' | 'always-right' | 'minimal'
}

function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return {
    leftCollapsed: false,
    rightCollapsed: false,
    rightActiveTab: 'preview',
    rightPanelWidth: 0.4,
    rightPanelVisible: true,
    configSections: { model: true, parameters: false, systemPrompt: false, stats: false },
    sidebarPreference: 'auto'
  }
}

function saveLayout(state: LayoutState) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function App() {
  const { tasks, activeTaskId, setActiveTaskId, addTask, onboardingComplete, workspacePath, routerConfig, settingsOpen, closeSettings, openSettings, checkSidecarInstalled, setBrowserActivityActive, resetPlanState } = useAppStore(
      useShallow((s) => ({
        tasks: s.tasks,
        activeTaskId: s.activeTaskId,
        setActiveTaskId: s.setActiveTaskId,
        addTask: s.addTask,
        onboardingComplete: s.onboardingComplete,
        workspacePath: s.workspacePath,
        routerConfig: s.routerConfig,
        settingsOpen: s.settingsOpen,
        closeSettings: s.closeSettings,
        openSettings: s.openSettings,
        checkSidecarInstalled: s.checkSidecarInstalled,
        setBrowserActivityActive: s.setBrowserActivityActive,
        resetPlanState: s.resetPlanState,
      })),
    )

  const [pruneNotice, setPruneNotice] = useState<string | null>(null)
  const [memoryBrowserOpen, setMemoryBrowserOpen] = useState(false)

  // Layout state — loaded from localStorage BEFORE any effects that reference it
  const [savedLayout] = useState<LayoutState>(loadLayout)
  const [leftCollapsed, setLeftCollapsed] = useState(savedLayout.leftCollapsed)
  const [rightCollapsed, setRightCollapsed] = useState(savedLayout.rightCollapsed)
  const [rightActiveTab, setRightActiveTab] = useState<Tab>(savedLayout.rightActiveTab)
  const [sidebarPreference] = useState<'auto' | 'always-left' | 'always-right' | 'minimal'>(
    savedLayout.sidebarPreference ?? 'auto'
  )
  const [rightPanelWidth, setRightPanelWidth] = useState(savedLayout.rightPanelWidth ?? 0.4)

  // Ref for the right sidebar element, used by PanelDivider to toggle resize class
  const sidebarRef = useRef<HTMLDivElement>(null)

  // Sync global workspace path to manager
  useEffect(() => {
    if (workspacePath) {
      import('./agent/workspace/WorkspaceManager').then((mod) => {
        const manager = mod.workspaceManager || mod.default
        if (manager) {
          manager.init(workspacePath)
        }
        }).catch(err => log.error('WorkspaceManager init failed', err))
    }
  }, [workspacePath])

    // Initialize gateway service on startup
    useEffect(() => {
      const store = useAppStore.getState()
      store.initGatewayService()
      store.loadGatewayConfig().catch(err => log.error('loadGatewayConfig failed', err))

      // Load Exa API key from OS keyring — never stored in localStorage
      tauriInvoke<string>('get_exa_key')
        .then((key) => { if (key) store.setExaKey(key) })
        .catch(err => log.error('get_exa_key failed', err))

    // Initialize config sections from saved layout (use the action, not direct mutation)
    if (savedLayout.configSections) {
      Object.entries(savedLayout.configSections).forEach(([key, value]) => {
        store.setConfigSection(key, value as boolean)
      })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Check sidecar installation status on startup
  useEffect(() => {
    checkSidecarInstalled()
  }, [checkSidecarInstalled])

  // Check for updates on startup (production only — no update.json exists in dev)
  useEffect(() => {
    if (import.meta.env.DEV) return
    const doUpdateCheck = async () => {
      try {
        const update = await check()
        if (update) {
          await update.install()
          await relaunch()
        }
      } catch {
        // No update available or network unreachable — silent in production too
      }
    }
    doUpdateCheck()
  }, [])

  // Listen for browser activity events and auto-open browser panel
  const rightCollapsedRef = useRef(rightCollapsed)
  useEffect(() => { rightCollapsedRef.current = rightCollapsed }, [rightCollapsed])

  useEffect(() => {
    const handler = () => {
      setBrowserActivityActive(true)
      // Auto-open and show browser panel
      if (rightCollapsedRef.current) setRightCollapsed(false)
      setRightActiveTab('browser')
    }
    window.addEventListener('nasus:browser-activity', handler as EventListener)
    return () => window.removeEventListener('nasus:browser-activity', handler as EventListener)
  }, [setBrowserActivityActive])





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
    saveLayout({ leftCollapsed, rightCollapsed, rightActiveTab, rightPanelWidth, rightPanelVisible: !rightCollapsed, configSections: useAppStore.getState().configSections, sidebarPreference })
  }, [leftCollapsed, rightCollapsed, rightActiveTab, rightPanelWidth, sidebarPreference])

    // Auto-show + expand right panel when the agent creates its first file,
    // or when switching to a task that already has files.
    useEffect(() => {
      if (workspaceFiles.length > 0) {
        if (rightCollapsed) setRightCollapsed(false)
      }
    }, [workspaceFiles.length, activeTaskId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard shortcuts
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
        if (!mod) return
          // New task: ⌘ N
          if (e.key === 'n') { e.preventDefault(); handleNewTask() }
          // Toggle left sidebar: ⌘ B
        if (e.key === 'b') { e.preventDefault(); setLeftCollapsed((v) => !v) }
        // Toggle right panel: ⌘ . or ⌘ Shift \
        if (e.key === '.') { e.preventDefault(); setRightCollapsed((v) => !v) }
        // Toggle right panel collapse: ⌘ Shift \
        if (e.key === '\\' && e.shiftKey) { e.preventDefault(); setRightCollapsed((v) => !v) }
          // Open model selector: ⌘ M
          if (e.key === 'm') { e.preventDefault(); window.dispatchEvent(new CustomEvent('nasus:open-model-selector')) }
          // Open settings: ⌘ ,
          if (e.key === ',') { e.preventDefault(); openSettings() }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [openSettings])

  const toggleLeft   = useCallback(() => setLeftCollapsed((v) => !v),   [])
  const toggleRight   = useCallback(() => setRightCollapsed((v) => !v),   [])

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
    }
    window.addEventListener('nasus:preview-ready', onPreviewReady)
    return () => window.removeEventListener('nasus:preview-ready', onPreviewReady)
  }, [])

  // Allow other components to open MemoryBrowser via a custom event
  useEffect(() => {
    const open = () => setMemoryBrowserOpen(true)
    window.addEventListener('nasus:open-memory-browser', open)
    return () => window.removeEventListener('nasus:open-memory-browser', open)
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
    resetPlanState()
    setActiveTaskId(task.id)
  }, [addTask, setActiveTaskId, resetPlanState, routerConfig.budget])

  const handleSelectTask = useCallback((id: string) => {
    resetPlanState()
    setActiveTaskId(id)
  }, [resetPlanState, setActiveTaskId])

    if (!onboardingComplete) {
      return (
        <ErrorBoundary>
          <Suspense fallback={<div className="app-loading" />}>
            <OnboardingScreen />
          </Suspense>
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
          {!settingsOpen && (
            <div data-tauri-drag-region style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 28, zIndex: 9999, WebkitAppRegion: 'drag' } as React.CSSProperties} />
          )}
          <div style={{ position: 'fixed', top: 28, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)', zIndex: 9998, pointerEvents: 'none' }} />

          {/* ── Left Sidebar ── */}
          <div className={`app-sidebar-left${leftCollapsed ? ' app-sidebar--collapsed' : ''}`}>
            <Sidebar
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectTask={handleSelectTask}
              onNewTask={handleNewTask}
              onOpenSettings={() => openSettings()}
              collapsed={leftCollapsed}
              onToggleCollapse={toggleLeft}
            />
        </div>



        {/* ── Chat ── */}
        <main id="main-content" className="app-chat">
          <ChatView
              task={activeTask}
              onNewTask={handleNewTask}
              onOpenSettings={(tab) => openSettings(tab)}
              outputVisible={!rightCollapsed}
              onShowOutput={() => setRightCollapsed(false)}
              workspaceFileCount={workspaceFiles.length}
              rightCollapsed={rightCollapsed}
              onToggleRight={toggleRight}
            />
        </main>

          {/* ── Right Output Panel ── */}
          {!rightCollapsed && (
            <PanelDivider
              width={rightPanelWidth}
              onWidthChange={setRightPanelWidth}
              onCollapse={() => setRightCollapsed(true)}
              onExpand={() => setRightCollapsed(false)}
              previousWidth={0.4}
              collapsed={false}
              sidebarRef={sidebarRef}
            />
          )}

        <div
          ref={sidebarRef}
          className={`app-sidebar-right${rightCollapsed ? ' app-sidebar--collapsed' : ''}`}
          style={rightCollapsed ? undefined : { width: `${rightPanelWidth * 100}%` }}
        >
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

          {settingsOpen && (
              <Suspense fallback={null}>
                <SettingsPanel onClose={closeSettings} />
              </Suspense>
            )}

            {memoryBrowserOpen && (
              <Suspense fallback={null}>
                <MemoryBrowser onClose={() => setMemoryBrowserOpen(false)} />
              </Suspense>
            )}



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

      {/* ── Reopen tabs — outside app-root so position:fixed is viewport-anchored ── */}
      {leftCollapsed && (
        <button onClick={toggleLeft} title="Open sidebar (⌘B)" className="sidebar-reopen-tab">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="tab-label">Tasks</span>
        </button>
      )}
      {rightCollapsed && (
        <button
          onClick={() => {
            setRightCollapsed(false)
            if (workspaceFiles.length > 0) {
              const hasHtml = workspaceFiles.some(f => f.ext === 'html')
              setRightActiveTab(hasHtml ? 'preview' : 'files')
            }
          }}
          title="Open workspace panel (⌘⇧\\)"
          className="workspace-reopen-tab"
        >
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="tab-label">Workspace</span>
        </button>
      )}
    </ErrorBoundary>
  )
}

export default App
