import { useState, useCallback, useMemo, useEffect } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { Task } from './types'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { SettingsPanel } from './components/SettingsPanel'
import { OnboardingScreen } from './components/OnboardingScreen'
import { ErrorBoundary } from './components/ErrorBoundary'
import { Pxi } from './components/Pxi'

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
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  )

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

  // Show onboarding until the user explicitly completes it
  if (!onboardingComplete) {
    return (
      <ErrorBoundary>
        <OnboardingScreen />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
        <Sidebar
          tasks={tasks}
          activeTaskId={activeTaskId}
          onSelectTask={setActiveTaskId}
          onNewTask={handleNewTask}
          onOpenSettings={openSettings}
        />
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: '#0d0d0d' }}>
          <ChatView
            task={activeTask}
            onNewTask={handleNewTask}
            onOpenSettings={openSettings}
          />
        </main>
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
