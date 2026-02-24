import { useState, useCallback, useMemo } from 'react'
import { useShallow } from 'zustand/react/shallow'
import type { Task } from './types'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { SettingsPanel } from './components/SettingsPanel'
import { OnboardingScreen } from './components/OnboardingScreen'

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
  const activeTask = useMemo(
    () => tasks.find((t) => t.id === activeTaskId) ?? null,
    [tasks, activeTaskId],
  )

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
    return <OnboardingScreen />
  }

  return (
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
    </div>
  )
}

export default App
