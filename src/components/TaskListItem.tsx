import { useState, useRef, memo, useCallback } from 'react'
import type { Task } from '../types'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

interface TaskListItemProps {
  task: Task
  isActive: boolean
  onClick: () => void
}

export const TaskListItem = memo(function TaskListItem({ task, isActive, onClick }: TaskListItemProps) {
  const { deleteTask, updateTaskTitle, toggleTaskPin, duplicateTask } = useAppStore()
  const [hovered,    setHovered]    = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [editing,    setEditing]    = useState(false)
  const [editValue,  setEditValue]  = useState(task.title)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const startEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    setEditValue(task.title)
    setEditing(true)
    setTimeout(() => { inputRef.current?.focus(); inputRef.current?.select() }, 0)
  }, [task.title])

  const commitEdit = useCallback(() => {
    const trimmed = editValue.trim()
    if (trimmed && trimmed !== task.title) updateTaskTitle(task.id, trimmed)
    setEditing(false)
  }, [editValue, task.title, task.id, updateTaskTitle])

  const cancelEdit = useCallback(() => {
    setEditValue(task.title)
    setEditing(false)
  }, [task.title])

  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirming) {
      setConfirming(true)
      confirmTimer.current = setTimeout(() => setConfirming(false), 2500)
      return
    }
    if (confirmTimer.current) clearTimeout(confirmTimer.current)
    deleteTask(task.id)
  }, [confirming, deleteTask, task.id])

  const handlePin = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    toggleTaskPin(task.id)
  }, [toggleTaskPin, task.id])

  const handleDuplicate = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    duplicateTask(task.id)
  }, [duplicateTask, task.id])

  const icon = taskTypeIcon(task.taskType)

  // How much space the action buttons take — drives the mask stop
  const ACTIONS_WIDTH = 72 // 3 × 22px + 2 × 2px gap

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false)
        if (!confirming) return
        if (confirmTimer.current) clearTimeout(confirmTimer.current)
        setConfirming(false)
      }}
    >
      {editing ? (
        /* ── Inline rename input ── */
        <div
          style={{
            padding: '5px 8px',
            borderRadius: 7,
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter')  { e.preventDefault(); commitEdit() }
              if (e.key === 'Escape') { e.preventDefault(); cancelEdit() }
            }}
            onBlur={commitEdit}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: 12,
              fontWeight: 500,
              color: 'var(--tx-primary)',
              fontFamily: 'inherit',
            }}
          />
        </div>
      ) : (
        /* ── Main row ── */
        <button
          onClick={onClick}
          onDoubleClick={startEdit}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            // Vertical padding slightly asymmetric — more bottom gives optical centering
            padding: '5px 8px 6px 8px',
            borderRadius: 7,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            position: 'relative',
            overflow: 'hidden',
            transition: 'background 0.1s, border-color 0.1s',
            background: isActive
              ? 'rgba(255,255,255,0.07)'
              : hovered
              ? 'rgba(255,255,255,0.04)'
              : 'transparent',
            border: isActive
              ? '1px solid rgba(255,255,255,0.09)'
              : '1px solid transparent',
            color: isActive || hovered ? 'var(--tx-primary)' : 'var(--tx-secondary)',
          }}
        >
          {/* Active left accent — glowing amber pip */}
          {isActive && (
            <span
              style={{
                position: 'absolute',
                left: 0,
                top: '20%',
                height: '60%',
                width: 2,
                borderRadius: '0 2px 2px 0',
                background: 'var(--amber)',
                boxShadow: '0 0 8px oklch(64% 0.214 40.1 / 0.6)',
              }}
            />
          )}

          {/* Type icon — dimmer when inactive, amber when active */}
          <span
            style={{
              display: 'flex',
              flexShrink: 0,
              color: isActive
                ? 'var(--amber)'
                : hovered
                ? 'var(--tx-tertiary)'
                : 'rgba(255,255,255,0.2)',
              transition: 'color 0.1s',
            }}
          >
            <Pxi name={icon} size={9} />
          </span>

          {/* Title with right-edge mask when hovered to make room for actions */}
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              fontWeight: isActive ? 500 : 400,
              lineHeight: 1.35,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: hovered ? 'clip' : 'ellipsis',
              transition: 'mask-image 0.1s',
              // Mask fades the last ~70px of title text when actions are visible
              maskImage: hovered
                ? `linear-gradient(to right, black calc(100% - ${ACTIONS_WIDTH + 8}px), transparent calc(100% - ${ACTIONS_WIDTH - 4}px))`
                : undefined,
              WebkitMaskImage: hovered
                ? `linear-gradient(to right, black calc(100% - ${ACTIONS_WIDTH + 8}px), transparent calc(100% - ${ACTIONS_WIDTH - 4}px))`
                : undefined,
            }}
          >
            {task.title}
          </span>

          {/* Status indicator — only when not hovered */}
          {!hovered && <StatusDot status={task.status} />}
        </button>
      )}

      {/* ── Hover action buttons ── */}
      {hovered && !editing && (
        <div
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            zIndex: 10,
          }}
        >
          <MicroBtn
            title={task.pinned ? 'Unpin' : 'Pin'}
            amber={!!task.pinned}
            onClick={handlePin}
          >
            <Pxi name="thumbtack" size={9} />
          </MicroBtn>
          <MicroBtn title="Duplicate" onClick={handleDuplicate}>
            <Pxi name="copy" size={9} />
          </MicroBtn>
          <MicroBtn
            title={confirming ? 'Click again to delete' : 'Delete'}
            danger
            active={confirming}
            onClick={handleDelete}
          >
            <Pxi name={confirming ? 'exclamation-triangle' : 'trash'} size={9} />
          </MicroBtn>
        </div>
      )}
    </div>
  )
})

// ── Micro action button ───────────────────────────────────────────────────────

function MicroBtn({
  children, title, onClick, danger, active, amber,
}: {
  children: React.ReactNode
  title: string
  onClick: (e: React.MouseEvent) => void
  danger?: boolean
  active?: boolean
  amber?: boolean
}) {
  const [hov, setHov] = useState(false)

  let bg: string
  let color: string

  if (danger) {
    bg    = active ? 'rgba(239,68,68,0.22)' : hov ? 'rgba(239,68,68,0.14)' : 'rgba(239,68,68,0.07)'
    color = active || hov ? '#fca5a5' : '#f87171'
  } else if (amber) {
    bg    = hov ? 'oklch(64% 0.214 40.1 / 0.18)' : 'oklch(64% 0.214 40.1 / 0.10)'
    color = 'var(--amber)'
  } else {
    bg    = hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)'
    color = hov ? 'var(--tx-secondary)' : 'var(--tx-tertiary)'
  }

  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 22,
        height: 22,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 5,
        border: 'none',
        cursor: 'pointer',
        background: bg,
        color,
        transition: 'background 0.1s, color 0.1s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  )
}

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Task['status'] }) {
  if (status === 'in_progress') {
    return (
      <span
        style={{
          position: 'relative',
          flexShrink: 0,
          width: 7,
          height: 7,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'var(--amber)',
            opacity: 0.35,
            animation: 'ping 1.4s cubic-bezier(0,0,0.2,1) infinite',
          }}
        />
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--amber)',
            flexShrink: 0,
          }}
        />
      </span>
    )
  }
  if (status === 'completed') {
    return (
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: '#4ade80' }}>
        <Pxi name="check-circle" size={10} />
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: '#f87171' }}>
        <Pxi name="times-circle" size={10} />
      </span>
    )
  }
  if (status === 'stopped') {
    return (
      <span
        style={{
          flexShrink: 0,
          width: 5,
          height: 5,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.15)',
          display: 'inline-block',
        }}
      />
    )
  }
  // idle / pending — nearly invisible dot
  return (
    <span
      style={{
        flexShrink: 0,
        width: 4,
        height: 4,
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.08)',
        display: 'inline-block',
      }}
    />
  )
}

// ── Task type → icon name ─────────────────────────────────────────────────────

function taskTypeIcon(type: Task['taskType']): string {
  switch (type) {
    case 'research': return 'search'
    case 'code':     return 'code'
    case 'document': return 'file-text'
    case 'web':      return 'globe'
    case 'data':     return 'chart-bar'
    default:         return 'bolt'
  }
}
