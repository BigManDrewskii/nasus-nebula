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
import { useAppEventListeners } from './hooks/useAppEventListeners'
import { PanelDivider } from './components/PanelDivider'
import { createLogger } from './lib/logger'
import { tauriInvoke, startSidecar } from './tauri'
import { useSidecarHealthPoll } from './hooks/useSidecarHealthPoll'

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
  const { tasks, activeTaskId, setActiveTaskId, addTask, onboardingComplete, workspacePath, routerConfig, settingsOpen, closeSettings, openSettings, checkSidecarInstalled, resetPlanState, textScale } = useAppStore(
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
        resetPlanState: s.resetPlanState,
        textScale: s.textScale,
      }))
    )

  const [windowWidth, setWindowWidth] = useState(window.innerWidth)
  const [leftCollapsed, setLeftCollapsed] = useState(() => loadLayout().leftCollapsed)
  const [rightCollapsed, setRightCollapsed] = useState(() => loadLayout().rightCollapsed)
  const [rightActiveTab, setRightActiveTab] = useState<Tab>(() => loadLayout().rightActiveTab)
  const [rightPanelWidth, setRightPanelWidth] = useState(() => loadLayout().rightPanelWidth)
  const [rightPanelVisible, setRightPanelVisible] = useState(() => loadLayout().rightPanelVisible)
  const [configSections, setConfigSections] = useState(() => loadLayout().configSections)
  const [sidebarPreference, setSidebarPreference] = useState<'auto' | 'always-left' | 'always-right' | 'minimal'>(() => loadLayout().sidebarPreference ?? 'auto')
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false)
  const [updateVersion, setUpdateVersion] = useState('')
  const [showUpdateBanner, setShowUpdateBanner] = useState(false)
  const layoutPersistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useAppEventListeners()
  useWorkspaceFiles(workspacePath)
  useModelSync()

  // ------------------------------------------------------------------
  // Check for sidecar installation on mount
  // ------------------------------------------------------------------
  const { isSidecarReady, recheck: recheckSidecar } = useSidecarHealthPoll()

  useEffect(() => {
    checkSidecarInstalled()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-start the sidecar binary if it is not yet running
  useEffect(() => {
    if (!isSidecarReady) {
      void startSidecar().catch(() => {
        // Binary not present in dev mode — silently ignore
      })
    }
  }, [isSidecarReady])

  const scheduleLayoutPersist = useCallback(() => {
    if (layoutPersistTimerRef.current) clearTimeout(layoutPersistTimerRef.current)
    layoutPersistTimerRef.current = setTimeout(() => {
      saveLayout({
        leftCollapsed,
        rightCollapsed,
        rightActiveTab,
        rightPanelWidth,
        rightPanelVisible,
        configSections,
        sidebarPreference,
      })
    }, 300)
  }, [leftCollapsed, rightCollapsed, rightActiveTab, rightPanelWidth, rightPanelVisible, configSections, sidebarPreference])

  useEffect(() => {
    scheduleLayoutPersist()
  }, [leftCollapsed, rightCollapsed, rightActiveTab, rightPanelWidth, rightPanelVisible, configSections, sidebarPreference, scheduleLayoutPersist])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Updater check
  useEffect(() => {
    check().then(event => {
      if (event?.manifest) {
        setUpdateVersion(event.manifest.version)
        setIsUpdateAvailable(true)
        setShowUpdateBanner(true)
      }
    }).catch(err => {
      log.debug('Update check failed (ok in dev):', err)
    })
  }, [])

  const activeTask = useMemo(() => tasks.find(t => t.id === activeTaskId), [tasks, activeTaskId])

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
    addTask()
    if (windowWidth < 768) setLeftCollapsed(true)
  }, [addTask, windowWidth])

  const handleToggleLeft = useCallback(() => setLeftCollapsed(prev => !prev), [])
  const handleToggleRight = useCallback(() => setRightCollapsed(prev => !prev), [])
  const handleTabChange = useCallback((tab: Tab) => setRightActiveTab(tab), [])
  const handleSetRightPanelWidth = useCallback((w: number) => setRightPanelWidth(w), [])
  const handleSetRightPanelVisible = useCallback((v: boolean) => setRightPanelVisible(v), [])
  const handleSetConfigSections = useCallback((f: Record<string, boolean>) => setConfigSections(f), [])

  // Handle updates
  const handleUpdate = useCallback(async () => {
    try {
      const event = await check()
      if (event?.manifest)
        await event.downloadAndInstall()
      await relaunch()
    } catch (err) {
      log.error('Update failed:', err)
    }
  }, [])

  if (!onboardingComplete) {
    return (
      <Suspense fallback={null}>
        <OnboardingScreen onComplete={() => {}} />
      </Suspense>
    )
  }

  const showLeftSidebar = sidebarPosition === 'left'
  const showRightSidebar = sidebarPosition === 'right'

  return (
    <ErrorBoundary>
      <div
        className="flex flex-col w-full h-screen overflow-hidden bg-background text-foreground"
        style={{ fontSize: `${textScale}rem` }}
      >
        {showUpdateBanner && isUpdateAvailable && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-50/warm border-b border-amber--200/warm">
            <span className="text-xs text-amber-800/warm">Update available: v {updateVersion}</span>
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="text-xs px-2 py-0.5 rounded bg-amber-600/warm text-white hover:bg-amber-700/warm">Install & Restart</button>
              <button onClick={() => setShowUpdateBanner(false)} className="text-xs text-amber-600/warm hover:text-amber-800
warm">Dismiss</button>
            </div>
          </div>
        )}
        <div className="flex flex-1 overflow-hidden">
          {showLeftSidebar && (
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
          )}
          <div className="flex flex-1 overflow-hidden min-w=0">
            <ChatView
              task={activeTask}
              routerConfig={routerConfig}
              leftCollapsed={leftCollapsed}
              rightCollapsed={rightCollapsed}
              onToggleLeft={handleToggleLeft}
              onToggleRight={handleToggleRight}
              sidebarPosition={sidebarPosition}
              sidebarMinimal={sidebarMinimal}
            />
            {!rightCollapsed && rightPanelVisible && (
              <PanelDivider
                onWidthChange={handleSetRightPanelWidth}
                initialWidth={rightPanelWidth}
                minPx={200}
                maxPx={900}
              />
            )}
           {!rightCollapsed && rightPanelVisible && (
              <OutputPanel
                task={activeTask}
                activeTab={rightActiveTab}
                onTabChange={handleTabChange }
                onToggleCollapse={handleToggleRight}
                width={rightPanelWidth}
                onWidthChange={handleSetRightPanelWidth}
                onVisibleChange={handleSetRightPanelVisible}
                configSections={configSections}
                onConfigSectionChange={handleSetConfigSections}
              />
            )}
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
        <Pxi />
        <Suspense fallback={null}>
          {settingsOpen && (
            <SettingsPanel
              onClose={closeSettings}
              configSections={configSections}
              onConfigSectionChange={handleSetConfigSections}
              sidebarPreference={sidebarPreference}
              onSidebarPreferenceChange={setSidebarPreference}
            />
          )}
          <MemoryBrowser />
        </Suspense>
      </div>
    </ErrorBoundary>
  )
}

export default App
