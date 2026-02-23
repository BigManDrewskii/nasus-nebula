import { Pxi } from './Pxi'
import type { Task } from '../types'
import { TaskListItem } from './TaskListItem'

interface SidebarProps {
  tasks: Task[]
  activeTaskId: string | null
  onSelectTask: (id: string) => void
  onNewTask: () => void
  onOpenSettings: () => void
}

function groupTasks(tasks: Task[]): Array<{ label: string; items: Task[] }> {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400_000)
  const weekAgo = new Date(today.getTime() - 7 * 86400_000)

  const groups: Record<string, Task[]> = {
    Today: [],
    Yesterday: [],
    'This week': [],
    Older: [],
  }

  for (const task of tasks) {
    const d = new Date(task.createdAt)
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate())
    if (day >= today) groups['Today'].push(task)
    else if (day >= yesterday) groups['Yesterday'].push(task)
    else if (day >= weekAgo) groups['This week'].push(task)
    else groups['Older'].push(task)
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, items]) => ({ label, items }))
}

export function Sidebar({ tasks, activeTaskId, onSelectTask, onNewTask, onOpenSettings }: SidebarProps) {
  const groups = groupTasks(tasks)

  return (
    <aside
      className="w-56 flex-shrink-0 flex flex-col h-full"
      style={{
        background: '#090909',
        borderRight: '1px solid rgba(255,255,255,0.05)',
      }}
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5 px-4 pt-4 pb-3">
        <div
          className="w-6 h-6 rounded-[7px] flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}
        >
          <span className="text-white font-bold text-[11px]">N</span>
        </div>
        <span className="text-[13px] font-semibold text-neutral-300 tracking-tight">Nasus</span>
      </div>

      {/* New task */}
      <div className="px-3 pb-2">
        <button
          onClick={onNewTask}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
          style={{
            color: '#4a4a4a',
            border: '1px solid rgba(255,255,255,0.06)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
            e.currentTarget.style.color = '#999'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = '#4a4a4a'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'
          }}
        >
          <Pxi name="plus" size={12} />
          New task
        </button>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 mt-8 px-4">
            <Pxi name="sparkles" size={18} className="opacity-20" />
            <p className="text-[11px] text-center leading-relaxed" style={{ color: '#333' }}>
              No tasks yet
            </p>
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label} className="mb-3">
              <p
                className="text-[10px] uppercase tracking-[0.12em] font-medium px-3 pb-1.5 pt-2"
                style={{ color: '#2e2e2e' }}
              >
                {label}
              </p>
              <div className="space-y-px">
                {items.map((task) => (
                  <TaskListItem
                    key={task.id}
                    task={task}
                    isActive={task.id === activeTaskId}
                    onClick={() => onSelectTask(task.id)}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div
        className="px-3 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <span className="text-[10px]" style={{ color: '#252525' }}>v0.1.0</span>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg transition-colors flex items-center justify-center"
          style={{ color: '#2e2e2e' }}
          title="Settings"
          onMouseEnter={(e) => { e.currentTarget.style.color = '#777' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#2e2e2e' }}
        >
          <Pxi name="cog" size={14} />
        </button>
      </div>
    </aside>
  )
}
