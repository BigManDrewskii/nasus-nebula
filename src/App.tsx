// Orchids was here
import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
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
import { PanelDivider } from './components/PanelDivider'

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
  const { tasks, activeTaskId, setActiveTaskId, addTask, onboardingComplete, workspacePath, routerConfig, settingsOpen, closeSettings, openSettings, checkSidecarInstalled, setBrowserActivityActive } = useAppStore(
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
      })),
    )

  const [pruneNotice, setPruneNotice] = useState<string | null>(null)

  // Layout state — loaded from localStorage BEFORE any effects that reference it
  const [savedLayout] = useState<LayoutState>(loadLayout)
  const [rightCollapsed, setRightCollapsed] = useState(savedLayout.rightCollapsed)
  const [rightActiveTab, setRightActiveTab] = useState<Tab>(savedLayout.rightActiveTab)
  const [sidebarPreference] = useState<'auto' | 'always-left' | 'always-right' | 'minimal'>(
    savedLayout.sidebarPreference ?? 'auto'
  )
  const [outputVisible, setOutputVisible] = useState(savedLayout.rightPanelVisible ?? true)
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

  // Listen for browser activity events and auto-open browser panel
  // Use refs for the setters so the handler is never stale without re-registering
  const outputVisibleRef = useRef(outputVisible)
  const rightCollapsedRef = useRef(rightCollapsed)
  useEffect(() => { outputVisibleRef.current = outputVisible }, [outputVisible])
  useEffect(() => { rightCollapsedRef.current = rightCollapsed }, [rightCollapsed])

  useEffect(() => {
    const handler = () => {
      setBrowserActivityActive(true)
      // Auto-open and show browser panel
      if (!outputVisibleRef.current) setOutputVisible(true)
      if (rightCollapsedRef.current) setRightCollapsed(false)
      setRightActiveTab('browser')
    }
    window.addEventListener('nasus:browser-activity', handler as EventListener)
    return () => window.removeEventListener('nasus:browser-activity', handler as EventListener)
  }, [setBrowserActivityActive])

  // Responsive hook for window-size-aware sidebar behavior
    const responsive = useSidebarResponsive({
      leftManual: false,
      rightManual: rightCollapsed,
      userPreference: sidebarPreference,
    })

    // Auto-collapse panels based on window size
    useEffect(() => {
      if (responsive.shouldAutoCollapseRight && !rightCollapsed) {
        setRightCollapsed(true)
      }
    }, [responsive.shouldAutoCollapseRight, rightCollapsed])

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
    saveLayout({ leftCollapsed: false, rightCollapsed, rightActiveTab, rightPanelWidth, rightPanelVisible: outputVisible, configSections: useAppStore.getState().configSections, sidebarPreference })
  }, [rightCollapsed, rightActiveTab, rightPanelWidth, outputVisible, sidebarPreference])

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
        // Toggle right panel: ⌘ .
        if (e.key === '.') { e.preventDefault(); setOutputVisible((v) => !v) }
        // Toggle right panel collapse: ⌘ Shift \
        if (e.key === '\\' && e.shiftKey) { e.preventDefault(); setRightCollapsed((v) => !v) }
        // Open model selector: ⌘ M
        if (e.key === 'm') { e.preventDefault(); window.dispatchEvent(new CustomEvent('nasus:open-model-selector')) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

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
          <div className="app-sidebar-left">
            <Sidebar
              tasks={tasks}
              activeTaskId={activeTaskId}
              onSelectTask={setActiveTaskId}
              onNewTask={handleNewTask}
              onOpenSettings={() => openSettings()}
            />
        </div>

        {/* ── Chat ── */}
        <main id="main-content" className="app-chat">
          <ChatView
              task={activeTask}
              onNewTask={handleNewTask}
              onOpenSettings={() => openSettings()}
              outputVisible={outputVisible}
              onShowOutput={() => {
                setOutputVisible(true)
                setRightCollapsed(false)
              }}
              workspaceFileCount={workspaceFiles.length}
              rightCollapsed={rightCollapsed}
              onToggleRight={toggleRight}
            />
        </main>

        {/* ── Right Output Panel ── */}
        {outputVisible && (
          <PanelDivider
            width={rightPanelWidth}
            onWidthChange={setRightPanelWidth}
            onCollapse={() => setRightCollapsed(true)}
            onExpand={() => setRightCollapsed(false)}
            previousWidth={0.4}
            collapsed={rightCollapsed}
            sidebarRef={sidebarRef}
          />
        )}

        {outputVisible && (
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
        )}

          {settingsOpen && <SettingsPanel onClose={closeSettings} />}

          {/* Floating re-open tab — shown when output panel is visible but collapsed to 0px */}
          {outputVisible && rightCollapsed && (
            <button
              onClick={toggleRight}
              title="Open workspace panel (⌘⇧\\)"
              style={{
                position: 'fixed',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                zIndex: 120,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                width: 20,
                paddingTop: 14,
                paddingBottom: 14,
                background: 'var(--sidebar-bg)',
                border: '1px solid var(--sidebar-border)',
                borderRight: 'none',
                borderRadius: '6px 0 0 6px',
                cursor: 'pointer',
                color: 'var(--tx-secondary)',
                writingMode: 'vertical-rl',
                fontSize: 10,
                fontWeight: 500,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-hover-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-primary)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--sidebar-bg)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--tx-secondary)' }}
            >
              Workspace
            </button>
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
    </ErrorBoundary>
  )
}

export default App
