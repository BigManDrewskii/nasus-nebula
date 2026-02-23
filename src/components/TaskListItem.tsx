import { useState } from 'react'
import type { Task } from '../types'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

interface TaskListItemProps {
  task: Task
  isActive: boolean
  onClick: () => void
}

export function TaskListItem({ task, isActive, onClick }: TaskListItemProps) {
  const { deleteTask } = useAppStore()
  const [hovered, setHovered] = useState(false)
  const [confirming, setConfirming] = useState(false)

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      // Auto-cancel confirm after 3s if user doesn't click
      setTimeout(() => setConfirming(false), 3000)
      return
    }
    deleteTask(task.id)
  }

  return (
    <div
      className="relative group"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirming(false) }}
    >
      <button
        onClick={onClick}
        className="w-full text-left px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-2 min-w-0 pr-8"
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

      {/* Delete button — visible on hover */}
      {hovered && (
        <button
          onClick={handleDelete}
          title={confirming ? 'Click again to confirm' : 'Delete task'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded transition-all"
          style={{
            background: confirming ? 'rgba(239,68,68,0.15)' : 'transparent',
            color: confirming ? '#f87171' : '#3a3a3a',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = confirming ? '#fca5a5' : '#888'
            if (!confirming) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = confirming ? '#f87171' : '#3a3a3a'
            if (!confirming) e.currentTarget.style.background = 'transparent'
          }}
        >
          <Pxi name={confirming ? 'exclamation-triangle' : 'trash'} size={10} />
        </button>
      )}
    </div>
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
