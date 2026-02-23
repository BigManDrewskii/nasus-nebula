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
        className="w-full text-left px-3 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-2 min-w-0 pr-7"
        style={{
          background: isActive ? 'rgba(255,255,255,0.07)' : 'transparent',
          /* Active: #d0d0d0 on dark ≈ 11:1. Inactive: #ababab on #090909 ≈ 7.9:1 */
          color: isActive ? 'var(--tx-primary)' : 'var(--tx-secondary)',
        }}
        onMouseEnter={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            /* Hover: step between secondary and primary */
            e.currentTarget.style.color = '#c8c8c8'
          }
        }}
        onMouseLeave={(e) => {
          if (!isActive) {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.color = 'var(--tx-secondary)'
          }
        }}
      >
        <StatusIndicator status={task.status} />
        {/* 12px body text, medium weight */}
        <p className="font-medium truncate flex-1 leading-tight" style={{ fontSize: 12 }}>{task.title}</p>
      </button>

      {/* Delete button — visible on hover */}
      {hovered && (
        <button
          onClick={handleDelete}
          title={confirming ? 'Click again to confirm' : 'Delete task'}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded transition-all"
          style={{
            background: confirming ? 'rgba(239,68,68,0.15)' : 'transparent',
            /* Idle delete icon: #757575 ≈ 4.6:1 */
            color: confirming ? '#f87171' : 'var(--tx-tertiary)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = confirming ? '#fca5a5' : 'var(--tx-secondary)'
            if (!confirming) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = confirming ? '#f87171' : 'var(--tx-tertiary)'
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
        {/* amber ping — replaced blue-400 */}
        <span className="absolute inset-0 rounded-full animate-ping opacity-60"
          style={{ background: 'var(--amber)' }} />
        <span className="relative block w-[7px] h-[7px] rounded-full"
          style={{ background: 'var(--amber)' }} />
      </span>
    )
  }
  if (status === 'completed') {
    return <Pxi name="check-circle" size={11} style={{ color: '#34d399', flexShrink: 0 }} />
  }
  if (status === 'failed') {
    return <Pxi name="times-circle" size={11} style={{ color: '#f87171', flexShrink: 0 }} />
  }
  /* pending — subtle dot, just visible enough to parse */
  return <span className="w-[5px] h-[5px] rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.15)' }} />
}
