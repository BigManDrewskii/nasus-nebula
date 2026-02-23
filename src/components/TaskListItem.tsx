import type { Task } from '../types'
import { Pxi } from './Pxi'

interface TaskListItemProps {
  task: Task
  isActive: boolean
  onClick: () => void
}

export function TaskListItem({ task, isActive, onClick }: TaskListItemProps) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 min-w-0"
      style={{
        background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: isActive ? '#c8c8c8' : '#4a4a4a',
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          e.currentTarget.style.color = '#888'
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.color = '#4a4a4a'
        }
      }}
    >
      <StatusIndicator status={task.status} />
      <p className="text-[12px] font-medium truncate flex-1 leading-tight">{task.title}</p>
    </button>
  )
}

function StatusIndicator({ status }: { status: Task['status'] }) {
  if (status === 'in_progress') {
    return (
      <span className="relative flex-shrink-0 w-[7px] h-[7px]">
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-50" />
        <span className="relative block w-[7px] h-[7px] rounded-full bg-blue-400" />
      </span>
    )
  }
  if (status === 'completed') {
    return <Pxi name="check-circle" size={11} style={{ color: '#22c55e', flexShrink: 0 }} />
  }
  if (status === 'failed') {
    return <Pxi name="times-circle" size={11} style={{ color: '#ef4444', flexShrink: 0 }} />
  }
  // pending
  return <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: '#252525' }} />
}
