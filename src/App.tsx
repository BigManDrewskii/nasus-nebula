import { useState, useCallback, useMemo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { invoke } from '@tauri-apps/api/core'
import type { Task } from './types'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { OutputPanel } from './components/OutputPanel'
import { SettingsPanel } from './components/SettingsPanel'
import { OnboardingScreen } from './components/OnboardingScreen'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pxi } from './components/Pxi'
import { useWorkspaceFiles } from './hooks/useWorkspaceFiles'
import { useModelSync } from './hooks/useModelSync'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const LAYOUT_KEY = 'nasus-layout-state'

interface LayoutState {
  leftCollapsed: boolean
  rightCollapsed: boolean
  rightActiveTab: 'preview' | 'code' | 'files'
}

function loadLayout(): LayoutState {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY)
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { leftCollapsed: false, rightCollapsed: false, rightActiveTab: 'preview' }
}

function saveLayout(state: LayoutState) {
  try { localStorage.setItem(LAYOUT_KEY, JSON.stringify(state)) } catch { /* ignore */ }
}

interface DockerStatus {
  available: boolean
  message: string
  download_url: string
}

function App() {
  const { tasks, activeTaskId, setActiveTaskId, addTask, onboardingComplete } = useAppStore(
    useShallow((s) => ({
      tasks: s.tasks,
      activeTaskId: s.activeTaskId,
      setActiveTaskId: s.setActiveTaskId,
      addTask: s.addTask,
      onboardingComplete: s.onboardingComplete,
    })),
  )
  const [showSettings, setShowSettings] = useState(false)
  const [pruneNotice, setPruneNotice] = useState<string | null>(null)
  const [dockerStatus, setDockerStatus] = useState<DockerStatus | null>(null)

  // Layout state — loaded from localStorage
  const [savedLayout] = useState<LayoutState>(loadLayout)
  const [leftCollapsed, setLeftCollapsed] = useState(savedLayout.leftCollapsed)
  const [rightCollapsed, setRightCollapsed] = useState(savedLayout.rightCollapsed)
  const [rightActiveTab, setRightActiveTab] = useState<'preview' | 'code' | 'files'>(savedLayout.rightActiveTab)
  const [outputVisible, setOutputVisible] = useState(true)

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
    saveLayout({ leftCollapsed, rightCollapsed, rightActiveTab })
  }, [leftCollapsed, rightCollapsed, rightActiveTab])

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
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const toggleLeft  = useCallback(() => setLeftCollapsed((v) => !v),  [])
  const toggleRight = useCallback(() => setRightCollapsed((v) => !v), [])

  useEffect(() => {
    if (!isTauri) return
    invoke<DockerStatus>('check_docker')
      .then(setDockerStatus)
      .catch(() =>
        setDockerStatus({
          available: false,
          message: 'Could not reach Docker. Make sure Docker Desktop is running.',
          download_url: 'https://www.docker.com/products/docker-desktop/',
        }),
      )
  }, [])

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
    }
    addTask(task)
    setActiveTaskId(task.id)
  }, [addTask, setActiveTaskId])

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
        <div className="app-root">
          {isTauri && (
            <>
              <div data-tauri-drag-region style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 28, zIndex: 9999, WebkitAppRegion: 'drag' } as React.CSSProperties} />
              <div style={{ position: 'fixed', top: 28, left: 0, right: 0, height: 1, background: 'rgba(255,255,255,0.06)', zIndex: 9998, pointerEvents: 'none' }} />
            </>
          )}
        {/* ── Left Sidebar ── */}
        <div className={`app-sidebar-left${leftCollapsed ? ' app-sidebar--collapsed' : ''}`}>
          <Sidebar
            tasks={tasks}
            activeTaskId={activeTaskId}
            onSelectTask={setActiveTaskId}
            onNewTask={handleNewTask}
            onOpenSettings={openSettings}
            collapsed={leftCollapsed}
            onToggleCollapse={toggleLeft}
          />
        </div>

        {/* ── Chat ── */}
        <main className="app-chat">
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

        {showSettings && <SettingsPanel onClose={closeSettings} />}

        {/* Docker unavailable modal */}
        {dockerStatus && !dockerStatus.available && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0,0,0,0.72)',
              backdropFilter: 'blur(12px)',
            }}
          >
            <div
              style={{
                width: 420,
                borderRadius: 16,
                background: '#111',
                border: '1px solid rgba(255,255,255,0.09)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
                padding: '32px 32px 28px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(239,68,68,0.12)',
                    border: '1px solid rgba(239,68,68,0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Pxi name="exclamation-triangle" size={18} style={{ color: '#f87171' }} />
                </div>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 600, color: 'var(--tx-primary)', letterSpacing: '-0.01em' }}>
                    Docker Required
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--tx-tertiary)', marginTop: 2 }}>
                    Nasus runs code in a secure Docker sandbox
                  </div>
                </div>
              </div>

              <p style={{ fontSize: 13, color: 'var(--tx-secondary)', lineHeight: 1.6, margin: 0 }}>
                {dockerStatus.message}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <a
                  href={dockerStatus.download_url}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 10,
                    background: 'var(--accent)',
                    color: '#000',
                    fontSize: 13,
                    fontWeight: 600,
                    fontFamily: 'var(--font-display)',
                    textDecoration: 'none',
                    letterSpacing: '-0.01em',
                  }}
                >
                  <Pxi name="external-link" size={12} />
                  Download Docker Desktop
                </a>
                <button
                  onClick={() =>
                    invoke<DockerStatus>('check_docker')
                      .then(setDockerStatus)
                      .catch(() => {})
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '9px 16px',
                    borderRadius: 10,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: 'var(--tx-secondary)',
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  <Pxi name="refresh" size={12} />
                  Try again
                </button>
              </div>
            </div>
          </div>
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
