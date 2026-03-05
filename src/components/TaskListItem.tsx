import { useState, useRef, memo, useCallback } from 'react'
import type { Task } from '../types'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'
import { TaskActionMenu } from './TaskActionMenu'
import { getWorkspace } from '../agent/tools'

// ── Export helper ─────────────────────────────────────────────────────────────

function exportTask(task: Task) {
  const store = useAppStore.getState()
  const messages = store.getMessages(task.id)
  const lines: string[] = [
    `# ${task.title}`,
    ``,
    `**Exported:** ${new Date().toLocaleString()}`,
    `**Status:** ${task.status}`,
    ``,
    `---`,
    ``,
  ]

  for (const msg of messages) {
    if (msg.id === 'welcome') continue
    const role = msg.author === 'user' ? '**You**' : '**Nasus**'
    lines.push(`### ${role}`)
    if (msg.content) lines.push(msg.content)
    if (msg.error) lines.push(`\n> ⚠️ Error: ${msg.error}`)
    lines.push('')
  }

  // Append workspace files
  const ws = getWorkspace(task.id)
  if (ws.size > 0) {
    lines.push('---', '', '## Workspace files', '')
    for (const [path, content] of ws.entries()) {
      lines.push(`### \`${path}\``, '', '```', content.slice(0, 4000), '```', '')
    }
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${task.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-export.md`
  a.click()
  URL.revokeObjectURL(url)
}

interface TaskListItemProps {
  task: Task
  isActive: boolean
  onClick: () => void
}

// ── Task list item ────────────────────────────────────────────────────────────

export const TaskListItem = memo(function TaskListItem({ task, isActive, onClick }: TaskListItemProps) {
  const { deleteTask, updateTaskTitle, toggleTaskPin, duplicateTask } = useAppStore()
  const [hovered, setHovered] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(task.title)
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 })
  const inputRef = useRef<HTMLInputElement>(null)

  const startEdit = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    setEditValue(task.title)
    setEditing(true)
    setMenuOpen(false) // Close menu when starting edit
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

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const MENU_HEIGHT = 200
    const MENU_BOTTOM_SPACING = 8

    const wouldOverflow = rect.bottom + MENU_HEIGHT + MENU_BOTTOM_SPACING > window.innerHeight

    setMenuPosition({
      top: wouldOverflow ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      right: window.innerWidth - rect.right,
    })
    setMenuOpen(true)
  }, [])

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  const icon = taskTypeIcon(task.taskType)

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {editing ? (
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
              if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
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
        <div
          role="button"
          tabIndex={0}
          onClick={onClick}
          onDoubleClick={(e) => startEdit(e)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 8px 6px 8px',
            borderRadius: 7,
            cursor: 'pointer',
            fontFamily: 'inherit',
            textAlign: 'left',
            position: 'relative',
            overflow: 'hidden',
            transition: 'all 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
            background: isActive
              ? 'rgba(255,255,255,0.08)'
              : hovered
                ? 'rgba(255,255,255,0.04)'
                : 'transparent',
            border: isActive
              ? '1px solid rgba(255,255,255,0.12)'
              : '1px solid transparent',
            color: isActive || hovered ? 'var(--tx-primary)' : 'var(--tx-secondary)',
            boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none',
          }}
        >
          {isActive && (
            <span
              style={{
                position: 'absolute',
                left: -1,
                top: '25%',
                height: '50%',
                width: 3,
                borderRadius: '0 4px 4px 0',
                background: 'var(--amber)',
                boxShadow: '0 0 10px oklch(64% 0.214 40.1 / 0.7)',
              }}
            />
          )}

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
            <Pxi name={icon} size={12} />
          </span>

          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: 11.5,
              fontWeight: isActive ? 500 : 400,
              lineHeight: 1.35,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}
          >
            {task.title}
          </span>

          {task.budgetMode && (
            <span
              style={{
                flexShrink: 0,
                fontSize: 9,
                padding: '1px 5px',
                borderRadius: 4,
                fontWeight: 500,
                letterSpacing: '0.02em',
                background: task.budgetMode === 'free'
                  ? 'rgba(99,102,241,0.12)'
                  : 'rgba(234,179,8,0.12)',
                color: task.budgetMode === 'free'
                  ? '#818cf8'
                  : 'var(--amber-soft)',
                border: `1px solid ${
                  task.budgetMode === 'free'
                    ? 'rgba(99,102,241,0.25)'
                    : 'rgba(234,179,8,0.25)'
                }`,
              }}
            >
              {task.budgetMode === 'free' ? 'FREE' : 'PAID'}
            </span>
          )}

          {!hovered && <StatusDot status={task.status} />}

          {hovered && (
            <button
              onClick={openMenu}
              style={{
                flexShrink: 0,
                width: 24,
                height: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 5,
                border: 'none',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.06)',
                color: 'var(--tx-tertiary)',
                transition: 'all 0.1s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.12)'
                e.currentTarget.style.color = 'var(--tx-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                e.currentTarget.style.color = 'var(--tx-tertiary)'
              }}
            >
              <Pxi name="ellipses-vertical" size={12} />
            </button>
          )}
        </div>
      )}

      <TaskActionMenu
        task={task}
        isOpen={menuOpen && !editing}
        position={menuPosition}
        onClose={closeMenu}
        onPin={() => toggleTaskPin(task.id)}
        onDuplicate={() => duplicateTask(task.id)}
        onRename={startEdit}
        onDelete={() => deleteTask(task.id)}
        onExport={() => exportTask(task)}
      />
    </div>
  )
})

// ── Status dot ────────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: Task['status'] }) {
  if (status === 'pending') return null
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
        <Pxi name="check-circle" size={12} />
      </span>
    )
  }
  if (status === 'failed') {
    return (
      <span style={{ flexShrink: 0, display: 'flex', alignItems: 'center', color: '#f87171' }}>
        <Pxi name="times-circle" size={12} />
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
  return null
}

// ── Task type → icon name ─────────────────────────────────────────────────────

function taskTypeIcon(type: Task['taskType']): string {
  switch (type) {
    case 'research': return 'search'
    case 'code':     return 'code'
    case 'document': return 'file-import'
    case 'web':      return 'globe'
    case 'data':     return 'chart-line'
    default:         return 'bolt'
  }
}
