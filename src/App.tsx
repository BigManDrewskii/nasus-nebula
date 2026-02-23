import { useState } from 'react'
import type { Task } from './types'
import { useAppStore } from './store'
import { Sidebar } from './components/Sidebar'
import { ChatView } from './components/ChatView'
import { SettingsPanel } from './components/SettingsPanel'
import { OnboardingScreen } from './components/OnboardingScreen'

function App() {
  const { tasks, activeTaskId, setActiveTaskId, addTask, apiBase } = useAppStore()
  const [showSettings, setShowSettings] = useState(false)
  const activeTask = tasks.find((t) => t.id === activeTaskId) ?? null

  // Show onboarding if no provider has been configured yet.
  // LiteLLM/custom users may have a blank apiKey (auth disabled proxy) —
  // so we gate on apiBase being set, not apiKey.
  const isConfigured = apiBase.length > 0
  if (!isConfigured) {
    return <OnboardingScreen />
  }

  function handleNewTask() {
    const task: Task = {
      id: crypto.randomUUID(),
      title: 'New task',
      status: 'pending',
      createdAt: new Date(),
    }
    addTask(task)
    setActiveTaskId(task.id)
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ background: '#0a0a0a' }}>
      <Sidebar
        tasks={tasks}
        activeTaskId={activeTaskId}
        onSelectTask={setActiveTaskId}
        onNewTask={handleNewTask}
        onOpenSettings={() => setShowSettings(true)}
      />
        <main className="flex-1 overflow-hidden flex flex-col" style={{ background: '#0d0d0d' }}>
          <ChatView
            task={activeTask}
            onNewTask={handleNewTask}
            onOpenSettings={() => setShowSettings(true)}
          />
        </main>
      {showSettings && <SettingsPanel onClose={() => setShowSettings(false)} />}
    </div>
  )
}

export default App
