// Orchids was here
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { OutputPanel, type Tab } from './components/OutputPanel'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pxi } from './components/Pxi'
import { useWorkspaceFiles } from './hooks/useWorkspaceFiles'
import { useModelSync } from './hooks/useModelSync'
import { useAppEventListeners } from './hooks/useAppEventListeners'
import { useAppInit } from './hooks/useAppInit'
import { PanelDivider } from './components/PanelDivider'
import { createLogger } from './lib/logger'

const log = createLogger('App')

// Lazy-load panels not visible on initial render to reduce startup bundle parse time
const SettingsPanel = lazy(() => import('./components/SettingsPanel').then(m => ({ default: m.SettingsPanel })))
const OnboardingScreen = lazy(() => import('./components/OnboardingScreen').then(m => ({ default: m.OnboardingScreen })))
const InitializationScreen = lazy(() => import('./components/InitializationScreen').then(m => ({ default: m.InitializationScreen })))
const MemoryBrowser = lazy(() => import('./components/MemoryBrowser').then(m => ({ default: m.MemoryBrowser })))

const LAYOUT_KEY = 'nasus-layout-state'

function defaultPanelWidth(): number {
  const w = window.innerWidth
  if (w < 1100) return 0.28
  if (w < 1440) return 0.33
  return 0.38
}

// These values must match the --sidebar-width CSS custom property tiers
function getSidebarWidthPx(windowWidth: number): number {
  if (windowWidth < 1100) return 200
  if (windowWidth < 1440) return 230
  return 260
}

interface LayoutState {
  leftCollapsed: boolean
  rightCollapsed: boolean
  rightActiveTab: Tab
  rightPanelWidth: number
  rightPanelVisible: boolean
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
    rightPanelWidth: defaultPanelWidth(),
    rightPanelVisible: true,
    sidebarPreference: 'auto'
  }
}

function saveLayout(state: LayoutState) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

function App() {
  const { tasks, activeTaskId, setActiveTaskId, addTask, onboardingComplete, settingsOpen, closeSettings, openSettings, checkSidecarInstalled, textScale } = useAppStore(
      useShallow((s) => ({
        tasks: s.tasks,
        activeTaskId: s.activeTaskId,
        setActiveTaskId: s.setActiveTaskId,
        addTask: s.addTask,
        onboardingComplete: s.onboardingComplete,
        settingsOpen: s.settingsOpen,
        closeSettings: s.closeSettings,
        openSettings: s.openSettings,
        checkSidecarInstalled: s.checkSidecarInstalled,
        textScale: s.textScale,
      }))
    )

  // App initialization orchestration
  const { status: initStatus, isReady: isAppReady, retry: retryInit } = useAppInit()

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [leftCollapsed, setLeftCollapsed] = useState(() => loadLayout().leftCollapsed)
  const [rightCollapsed, setRightCollapsed] = useState(() => loadLayout().rightCollapsed)
  const [rightActiveTab, setRightActiveTab] = useState<Tab>(() => loadLayout().rightActiveTab)
  const [rightPanelWidth, _setRightPanelWidth] = useState(() => loadLayout().rightPanelWidth)
  const [rightPanelVisible, _setRightPanelVisible] = useState(() => loadLayout().rightPanelVisible)
  const [sidebarPreference, _setSidebarPreference] = useState<'auto' | 'always-left' | 'always-right' | 'minimal'>(() => loadLayout().sidebarPreference ?? 'auto')
  const [pruneNotice, setPruneNotice] = useState<string | null>(null)
  const [memoryBrowserOpen, setMemoryBrowserOpen] = useState(false)
  const [isOffline, setIsOffline] = useState(false)
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const layoutPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const outputPanelRef = useRef<HTMLDivElement>(null)

  useAppEventListeners({
    setRightCollapsed,
    setRightActiveTab,
    setPruneNotice,
    setMemoryBrowserOpen,
    setIsOffline,
  })
  const workspaceFiles = useWorkspaceFiles(activeTaskId)
  useModelSync()

  // ------------------------------------------------------------------
  // Check for sidecar installation on mount
  // ------------------------------------------------------------------

  useEffect(() => {
    checkSidecarInstalled()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleLayoutPersist = useCallback(() => {
    if (layoutPersistTimerRef.current) clearTimeout(layoutPersistTimerRef.current)
    layoutPersistTimerRef.current = setTimeout(() => {
      saveLayout({
        leftCollapsed,
        rightCollapsed,
        rightActiveTab,
        rightPanelWidth,
        rightPanelVisible,
        sidebarPreference,
      })
    }, 300)
  }, [leftCollapsed, rightCollapsed, rightActiveTab, rightPanelWidth, rightPanelVisible, sidebarPreference])

  useEffect(() => {
    scheduleLayoutPersist()
  }, [leftCollapsed, rightCollapsed, rightActiveTab, rightPanelWidth, rightPanelVisible, sidebarPreference, scheduleLayoutPersist])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Updater check
  useEffect(() => {
    check().then(update => {
      if (update) {
        setUpdateVersion(update.version)
        setIsUpdateAvailable(true)
        setShowUpdateBanner(true)
      }
    }).catch(err => {
      log.debug('Update check failed (ok in dev):', err)
    })
  }, [])

  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId) ?? null, [tasks, activeTaskId])

  const sidebarPosition = useMemo(() => {
    if (sidebarPreference === 'always-left') return 'left'
    if (sidebarPreference === 'always-right') return 'right'
    return windowWidth >= 1024 ? 'left' : 'right'
  }, [sidebarPreference, windowWidth])

  const sidebarMinimal = sidebarPreference === 'minimal'

  const handleSelectTask = useCallback((taskId: string) => {
    setActiveTaskId(taskId)
    if (windowWidth < 768) setLeftCollapsed(true)
  }, [setActiveTaskId, windowWidth])

  const handleNewChat = useCallback(() => {
    const newTask = {
      id: crypto.randomUUID(),
      title: 'New Task',
      status: 'pending' as const,
      createdAt: new Date(),
    }
    addTask(newTask)
    setActiveTaskId(newTask.id)
    if (windowWidth < 768) setLeftCollapsed(true)
  }, [addTask, setActiveTaskId, windowWidth])

  const handleToggleLeft = useCallback(() => setLeftCollapsed(prev => !prev), [])
  const handleToggleRight = useCallback(() => setRightCollapsed(prev => !prev), [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key === 'n') { e.preventDefault(); handleNewChat() }
      if (mod && e.key === 'b') { e.preventDefault(); handleToggleLeft() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleNewChat, handleToggleLeft])
  const handleTabChange = useCallback((tab: Tab) => setRightActiveTab(tab), [])
  const handleSetRightPanelWidth = useCallback((w: number) => _setRightPanelWidth(w), [])

  // Compute the right panel's pixel width, clamped to the actual inner row space.
  // rightPanelWidth is a fraction of windowWidth (full viewport), but the panel
  // lives in an inner row that's (windowWidth - left_sidebar) wide. Without this
  // clamp the panel overflows its container and overflow:hidden clips the right edge.
  const rightPanelPx = useMemo(() => {
    const rawPx = Math.round(rightPanelWidth * windowWidth)
    if (sidebarPosition !== 'left' || leftCollapsed) return rawPx
    const innerRowPx = windowWidth - getSidebarWidthPx(windowWidth)
    const maxPx = Math.max(300, innerRowPx - 380 - 4) // 380 chat min + 4 divider
    return Math.min(rawPx, maxPx)
  }, [rightPanelWidth, windowWidth, sidebarPosition, leftCollapsed])

  // Handle updates
  const handleUpdate = useCallback(async () => {
    try {
      const update = await check()
      if (update)
        await update.downloadAndInstall()
      await relaunch()
    } catch (err) {
      log.error('Update failed', err instanceof Error ? err : new Error(String(err)))
    }
  }, [])

  // Sync window size tier to html[data-size] so CSS tier overrides activate
  useEffect(() => {
    document.documentElement.dataset.size =
      windowWidth < 1100 ? 'compact' :
      windowWidth < 1440 ? 'regular' : 'wide'
  }, [windowWidth])

  // Sync text scale to html[data-scale] so CSS compact overrides activate
  useEffect(() => {
    document.documentElement.dataset.scale = textScale === 'compact' ? 'compact' : ''
  }, [textScale])

  // Auto-select the most recently created task if none is active on startup
  useEffect(() => {
    if (isAppReady && onboardingComplete && tasks.length > 0 && !activeTaskId) {
      const latest = [...tasks].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )[0]
      setActiveTaskId(latest.id)
    }
  }, [isAppReady, onboardingComplete]) // eslint-disable-line react-hooks/exhaustive-deps

  // Show initialization screen while services are starting up
  if (!isAppReady) {
    return (
      <Suspense fallback={null}>
        <InitializationScreen
          phase={initStatus.phase}
          error={initStatus.error}
          progress={initStatus.progress}
          onRetry={retryInit}
          onSkip={() => {
            log.debug('Initialization skipped by user')
          }}
        />
      </Suspense>
    )
  }

  if (!onboardingComplete) {
    return (
      <Suspense fallback={null}>
        <OnboardingScreen />
      </Suspense>
    )
  }

  const showLeftSidebar = sidebarPosition === 'left'
  const showRightSidebar = sidebarPosition === 'right'

  return (
    <ErrorBoundary>
      <div
        className="flex flex-col w-full h-screen overflow-hidden"
        style={{ background: 'var(--bg-base)', color: 'var(--tx-primary)' }}
      >
        {/* Dedicated titlebar drag region — covers traffic lights zone, uniform height across all panels */}
        <div className="app-titlebar" data-tauri-drag-region />
        {showUpdateBanner && isUpdateAvailable && (
          <div
            className="flex items-center justify-between px-3 py-1.5 flex-shrink-0"
            style={{ background: 'rgba(120,60,0,0.18)', borderBottom: '1px solid rgba(234,179,8,0.18)' }}
          >
            <span className="text-xs" style={{ color: 'var(--amber-soft)' }}>
              Update available: v{updateVersion}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleUpdate}
                className="text-xs px-2 py-0.5 rounded font-medium"
                style={{ background: 'var(--amber)', color: '#000' }}
              >
                Install & Restart
              </button>
              <button
                onClick={() => setShowUpdateBanner(false)}
                className="text-xs"
                style={{ color: 'var(--tx-tertiary)' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {isOffline && (
          <div
            className="flex items-center justify-center gap-2 px-3 py-1 flex-shrink-0"
            style={{ background: 'rgba(239,68,68,0.1)', borderBottom: '1px solid rgba(239,68,68,0.2)' }}
          >
            <Pxi name="wifi-slash" size={11} style={{ color: '#f87171' }} />
            <span className="text-xs" style={{ color: '#fca5a5' }}>You're offline — agent features unavailable</span>
          </div>
        )}
        {pruneNotice && (
          <div
            className="flex items-center justify-between px-3 py-1 flex-shrink-0"
            style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            <span className="text-xs" style={{ color: 'var(--tx-secondary)' }}>{pruneNotice}</span>
            <button
              onClick={() => setPruneNotice(null)}
              className="text-xs"
              style={{ color: 'var(--tx-muted)', marginLeft: 8 }}
            >✕</button>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden relative">
          {showLeftSidebar && (
            <div className={`app-sidebar-left${leftCollapsed ? ' app-sidebar--collapsed' : ''}`}>
              <Sidebar
                position="left"
                tasks={tasks}
                activeTaskId={activeTaskId}
                onSelectTask={handleSelectTask}
                onNewChat={handleNewChat}
                collapsed={leftCollapsed}
                onToggleCollapse={handleToggleLeft}
                minimal={sidebarMinimal}
                onOpenSettings={openSettings}
              />
            </div>
          )}
          {showLeftSidebar && leftCollapsed && (
            <button
              className="sidebar-reopen-tab"
              onClick={handleToggleLeft}
              title="Open sidebar (⌘B)"
              aria-label="Open sidebar"
            >
              <Pxi name="chevron-right" size={11} />
              <span className="tab-label">Tasks</span>
            </button>
          )}
          {rightCollapsed && rightPanelVisible && (
            <button
              className="workspace-reopen-tab"
              onClick={handleToggleRight}
              title="Open workspace panel (⌘⇧\)"
              aria-label="Open workspace panel"
            >
              <Pxi name="chevron-left" size={11} />
              <span className="tab-label">Workspace</span>
            </button>
          )}
          <div className="flex flex-1 overflow-hidden min-w-0">
            <div className="flex-1 overflow-hidden flex flex-col" style={{ minWidth: 380 }}>
              <ChatView
                task={activeTask}
                onOpenSettings={openSettings}
                workspaceFileCount={workspaceFiles.length}
                rightCollapsed={rightCollapsed}
                onToggleRight={handleToggleRight}
              />
            </div>
            {!rightCollapsed && rightPanelVisible && (
              <PanelDivider
                width={rightPanelWidth}
                onWidthChange={handleSetRightPanelWidth}
                onCollapse={handleToggleRight}
                onExpand={() => _setRightPanelVisible(true)}
                collapsed={rightCollapsed}
                sidebarRef={outputPanelRef}
              />
            )}
            <div
              ref={outputPanelRef}
              className={`app-sidebar-right${(rightCollapsed || !rightPanelVisible) ? ' app-sidebar--collapsed' : ''}`}
              style={{ width: `${rightPanelPx}px` }}
            >
              <OutputPanel
                files={workspaceFiles}
                activeTab={rightActiveTab}
                onTabChange={handleTabChange}
                onCollapse={handleToggleRight}
                onExpand={() => _setRightPanelVisible(true)}
              />
            </div>
          </div>
          {showRightSidebar && (
            <Sidebar
              position="right"
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectTask={handleSelectTask}
              onNewChat={handleNewChat}
              collapsed={rightCollapsed}
              onToggleCollapse={handleToggleRight}
              minimal={sidebarMinimal}
              onOpenSettings={openSettings}
            />
          )}
        </div>
        <Pxi name="nasus" />
        <Suspense fallback={null}>
          {settingsOpen && (
            <SettingsPanel
              onClose={closeSettings}
            />
          )}
          {memoryBrowserOpen && (
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 360, zIndex: 200, display: 'flex', flexDirection: 'column', background: '#0d0d0d', borderLeft: '1px solid var(--glass-border)' }}>
              <MemoryBrowser onClose={() => setMemoryBrowserOpen(false)} />
            </div>
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default App
