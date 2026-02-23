import { Pxi } from './Pxi'
import { NasusLogo } from './NasusLogo'
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
      {/* Brand — 16px vertical padding each side, 16px horizontal */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <NasusLogo size={20} fill="var(--amber)" />
        <span
          className="font-display font-semibold"
          style={{ fontSize: 12, color: 'var(--amber-light)', letterSpacing: '0.04em' }}
        >
          NASUS
        </span>
      </div>

      {/* New task button — 12px h-padding, 8px v-padding */}
      <div className="px-3 pb-3">
        <button
          onClick={onNewTask}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all"
          style={{
            fontSize: 12,
            fontWeight: 500,
            /* #757575 on #090909 ≈ 4.6:1 — just passes AA */
            color: 'var(--tx-tertiary)',
            border: '1px solid rgba(255,255,255,0.07)',
            background: 'transparent',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'oklch(64% 0.214 40.1 / 0.08)'
            e.currentTarget.style.color = 'var(--amber-soft)'
            e.currentTarget.style.borderColor = 'oklch(64% 0.214 40.1 / 0.25)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--tx-tertiary)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
          }}
        >
          <Pxi name="plus" size={12} />
          New task
        </button>
      </div>

      {/* Task list — 8px horizontal pad on scroll container */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 mt-10 px-4">
            <NasusLogo size={18} fill="rgba(255,255,255,0.08)" />
            {/* #757575 on #090909 ≈ 4.6:1 */}
            <p className="text-center leading-relaxed" style={{ fontSize: 11, color: 'var(--tx-tertiary)' }}>
              No tasks yet
            </p>
          </div>
        ) : (
          groups.map(({ label, items }) => (
            <div key={label} className="mb-4">
              {/* Group label — 10px, #757575, all-caps, 12px tracking */}
              <p
                className="uppercase font-medium px-3 pb-1.5 pt-2"
                style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--tx-tertiary)' }}
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

      {/* Footer — 12px vertical padding */}
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex flex-col gap-0.5">
          {/* Version: #757575 on #090909 ≈ 4.6:1 */}
          <span className="font-display" style={{ fontSize: 9, color: 'var(--tx-tertiary)' }}>v0.1.0</span>
          {/* Keyboard hints: #757575 — still passes AA for supplemental text */}
          <span style={{ fontSize: 9, color: 'var(--tx-tertiary)' }}>⌘N new · ⌘, settings</span>
        </div>
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-lg transition-colors flex items-center justify-center"
          /* #757575 at rest */
          style={{ color: 'var(--tx-tertiary)' }}
          title="Settings (⌘,)"
          onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--amber)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--tx-tertiary)' }}
        >
          <Pxi name="cog" size={14} />
        </button>
      </div>
    </aside>
  )
}
