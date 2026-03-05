import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Task } from '../types'
import { Pxi } from './Pxi'

interface Props {
  task: Task
  isOpen: boolean
  position: { top: number; right: number }
  onClose: () => void
  onPin: () => void
  onDuplicate: () => void
  onRename: () => void
  onDelete: () => void
  onExport: () => void
}

/** Context menu for task actions — renders via portal to document.body */
export function TaskActionMenu({
  task,
  isOpen,
  position,
  onClose,
  onPin,
  onDuplicate,
  onRename,
  onDelete,
  onExport,
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen, onClose])

  // Close on ESC key
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  // Reset delete confirmation when unmounting
  useEffect(() => {
    return () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
    }
  }, [])

  const handleDeleteClick = useCallback(() => {
    if (!confirmDelete) {
      setConfirmDelete(true)
      confirmTimer.current = setTimeout(() => setConfirmDelete(false), 2500)
    } else {
      if (confirmTimer.current) clearTimeout(confirmTimer.current)
      onDelete()
      onClose()
    }
  }, [confirmDelete, onDelete, onClose])

  const handleAction = useCallback((action: () => void) => {
    return (e: React.MouseEvent) => {
      e.stopPropagation()
      action()
      onClose()
    }
  }, [onClose])

  const handleRenameClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClose()
    onRename()
  }, [onClose, onRename])

  if (!isOpen) return null

  return createPortal(
    <div
      ref={menuRef}
      className="task-action-menu"
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        right: `${position.right}px`,
        zIndex: 1000,
        minWidth: 168,
      }}
    >
      <div style={menuStyles}>
        <MenuItem
          icon="thumbtack"
          label={task.pinned ? 'Unpin' : 'Pin'}
          onClick={handleAction(onPin)}
          variant={task.pinned ? 'amber' : 'default'}
        />
        <MenuItem
          icon="download"
          label="Export as Markdown"
          onClick={handleAction(onExport)}
          variant="default"
        />
        <MenuItem
          icon="copy"
          label="Duplicate"
          onClick={handleAction(onDuplicate)}
          variant="default"
        />
        <MenuItem
          icon="pencil"
          label="Rename"
          onClick={handleRenameClick}
          variant="default"
        />
        <div style={dividerStyles} />
        <MenuItem
          icon={confirmDelete ? 'exclamation-triangle' : 'trash'}
          label={confirmDelete ? 'Click again to delete' : 'Delete'}
          onClick={handleDeleteClick}
          variant={confirmDelete ? 'danger-active' : 'danger'}
        />
      </div>
    </div>,
    document.body,
  )
}

// ── Design system styles ─────────────────────────────────────────────────────

const menuStyles = {
  background: 'rgba(12, 12, 12, 0.96)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 10,
  boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.3)',
  overflow: 'hidden',
  padding: 'var(--space-1) 0',
  backdropFilter: 'blur(20px)',
  animation: 'dropUp 0.16s cubic-bezier(0.16, 1, 0.3, 1) forwards',
}

const dividerStyles = {
  height: 1,
  background: 'rgba(255, 255, 255, 0.08)',
  margin: 'var(--space-1) var(--space-2)',
}

// ── Menu Item ─────────────────────────────────────────────────────────────────

interface MenuItemProps {
  icon: string
  label: string
  onClick: (e: React.MouseEvent) => void
  variant: 'default' | 'amber' | 'danger' | 'danger-active'
}

type ItemStyle = { background: string; color: string }

const itemStyles: Record<string, ItemStyle> = {
  default: {
    background: 'transparent',
    color: 'var(--tx-secondary)',
  },
  hovered: {
    background: 'rgba(255, 255, 255, 0.06)',
    color: 'var(--tx-primary)',
  },
  amber: {
    background: 'transparent',
    color: 'var(--amber)',
  },
  hoveredAmber: {
    background: 'oklch(64% 0.214 40.1 / 0.08)',
    color: 'var(--amber-soft)',
  },
  danger: {
    background: 'transparent',
    color: '#f87171',
  },
  hoveredDanger: {
    background: 'rgba(239, 68, 68, 0.1)',
    color: '#fca5a5',
  },
  dangerActive: {
    background: 'rgba(239, 68, 68, 0.12)',
    color: '#ef4444',
  },
  hoveredDangerActive: {
    background: 'rgba(239, 68, 68, 0.2)',
    color: '#f87171',
  },
}

function MenuItem({ icon, label, onClick, variant }: MenuItemProps) {
  const [hovered, setHovered] = useState(false)

  const getStyle = () => {
    if (variant === 'amber') {
      return hovered ? itemStyles.hoveredAmber : itemStyles.amber
    }
    if (variant === 'danger-active') {
      return hovered ? itemStyles.hoveredDangerActive : itemStyles.dangerActive
    }
    if (variant === 'danger') {
      return hovered ? itemStyles.hoveredDanger : itemStyles.danger
    }
    return hovered ? itemStyles.hovered : itemStyles.default
  }

  const baseStyle = getStyle()

  return (
    <button
      type="button"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-1-5) var(--space-3)',
        border: 'none',
        background: baseStyle.background,
        color: baseStyle.color,
        fontSize: 'var(--text-xs)',
        fontFamily: 'var(--font-sans)',
        fontWeight: 500,
        cursor: 'pointer',
        transition: 'background 0.12s cubic-bezier(0.4, 0, 0.2, 1), color 0.12s cubic-bezier(0.4, 0, 0.2, 1)',
        textAlign: 'left',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <Pxi name={icon} size={12} style={{ fontSize: 'var(--icon-sm)' }} />
      </span>
      <span>{label}</span>
    </button>
  )
}
