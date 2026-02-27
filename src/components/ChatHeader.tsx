/**
 * Chat view header bar + overlay toast system.
 *
 * Extracted from ChatView.tsx to keep that file focused on orchestration.
 * Contains: ChatHeader, StatusDot, SandboxPill, ToastOverlay
 */

import type { Task } from '../types'
import { Pxi } from './Pxi'
import { estimateCost } from '../lib/costEstimate'

// ─── Status dot ────────────────────────────────────────────────────────────────

export function StatusDot({ status }: { status: Task['status'] }) {
  if (status === 'pending') return null
  if (status === 'completed') {
    return <Pxi name="check-circle" size={13} style={{ color: '#34d399', flexShrink: 0 }} title="Done" />
  }
  if (status === 'failed') {
    return <Pxi name="times-circle" size={13} style={{ color: '#f87171', flexShrink: 0 }} title="Failed" />
  }
  if (status === 'stopped') {
    return <Pxi name="stop-circle" size={13} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} title="Stopped" />
  }
  if (status === 'in_progress') {
    return (
      <span
        className="w-2 h-2 rounded-full flex-shrink-0"
        style={{ background: 'var(--amber)', animation: 'pulseGlow 1.6s ease-in-out infinite' }}
        title="Running"
      />
    )
  }
  return null
}

// ─── Sandbox pill ──────────────────────────────────────────────────────────────

export function SandboxPill({ status }: { status: 'idle' | 'starting' | 'ready' | 'stopped' }) {
  if (status === 'idle') return null

  const cfg = {
    starting: { icon: 'circle-notch', label: 'Starting',      color: 'var(--amber)' },
    ready:    { icon: 'check-circle', label: 'Sandbox ready', color: '#34d399' },
    stopped:  { icon: 'times-circle', label: 'Stopped',       color: 'var(--tx-secondary)' },
  }[status]

  if (!cfg) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Pxi name={cfg.icon} size={10} style={{ color: cfg.color }} />
      <span style={{ fontSize: 10, color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}

// ─── Toast overlay ─────────────────────────────────────────────────────────────

interface ToastOverlayProps {
  workspaceWarning: string | null
  rateLimitWarning: string | null
  folderDropConfirm: string | null
}

export function ToastOverlay({ workspaceWarning, rateLimitWarning, folderDropConfirm }: ToastOverlayProps) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    top: 16,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 60,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '8px 14px',
    borderRadius: 12,
    background: 'rgba(13,13,13,0.95)',
    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
    backdropFilter: 'blur(8px)',
    animation: 'fadeIn 0.18s ease',
    pointerEvents: 'none',
    maxWidth: 'calc(100% - 48px)',
  }

  if (workspaceWarning) {
    return (
      <div style={{ ...baseStyle, border: '1px solid rgba(234,179,8,0.35)' }}>
        <Pxi name="exclamation-triangle" size={11} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-primary)' }}>{workspaceWarning}</span>
      </div>
    )
  }

  if (rateLimitWarning) {
    return (
      <div style={{ ...baseStyle, border: '1px solid rgba(239,68,68,0.35)' }}>
        <Pxi name="exclamation-triangle" size={11} style={{ color: '#f87171', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-primary)' }}>{rateLimitWarning}</span>
      </div>
    )
  }

  if (folderDropConfirm) {
    return (
      <div style={{ ...baseStyle, border: '1px solid rgba(52,211,153,0.35)' }}>
        <Pxi name="check-circle" size={11} style={{ color: '#34d399', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-primary)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          Workspace set to {folderDropConfirm}
        </span>
      </div>
    )
  }

  return null
}

// ─── Header bar ────────────────────────────────────────────────────────────────

interface ChatHeaderProps {
  task: Task
  isActive: boolean
  iteration: number
  tokenCount: number
  model: string
  sandboxStatus: 'idle' | 'starting' | 'ready' | 'stopped'
  outputVisible?: boolean
  workspaceFileCount?: number
  onShowOutput?: () => void
  onShowMemory: () => void
  onStop: () => void
}

export function ChatHeader({
  task,
  isActive,
  iteration,
  tokenCount,
  model,
  sandboxStatus,
  outputVisible,
  workspaceFileCount = 0,
  onShowOutput,
  onShowMemory,
  onStop,
}: ChatHeaderProps) {
  return (
    <header
      className="flex-shrink-0 flex items-center justify-between"
      style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: '#0d0d0d',
        minHeight: 44,
        padding: '0 12px',
      }}
    >
      {/* Left cluster */}
      <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2
            className="font-display font-medium truncate"
            style={{ fontSize: 10.5, color: 'var(--tx-secondary)', letterSpacing: '-0.01em' }}
          >
            {task?.title || 'New Chat'}
          </h2>
        {isActive && iteration > 0 && (
          <span className="flex items-center gap-1 flex-shrink-0">
            <Pxi name="refresh" size={8} style={{ color: 'var(--tx-muted)', animation: 'spin 1s linear infinite' }} />
            <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--tx-muted)' }}>{iteration}</span>
          </span>
        )}
        {tokenCount > 0 && (
          <span className="font-mono flex-shrink-0" style={{ fontSize: 9.5, color: 'var(--tx-muted)' }}>
            {(tokenCount / 1000).toFixed(1)}k · {estimateCost(model, tokenCount)}
          </span>
        )}
      </div>

      {/* Right cluster */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {(isActive || sandboxStatus === 'ready') && sandboxStatus !== 'idle' && (
          <SandboxPill status={sandboxStatus} />
        )}

        {/* Files pill — shown when output panel is hidden but files exist */}
        {!outputVisible && workspaceFileCount > 0 && onShowOutput && (
          <button
            onClick={onShowOutput}
            title="Show output panel"
            className="header-action-btn"
          >
            <Pxi name="folder" size={11} />
            <span style={{ fontSize: 10.5, fontWeight: 500 }}>{workspaceFileCount}</span>
          </button>
        )}

        {/* Memory */}
        <button
          onClick={onShowMemory}
          title="Agent memory"
          className="header-sidebar-toggle"
        >
          <Pxi name="bookmark" size={12} />
        </button>

        {/* Stop / status */}
        {isActive ? (
          <button
            onClick={onStop}
            className="header-stop-btn"
            title="Stop agent (Esc)"
          >
            <Pxi name="times-circle" size={11} />
            <span>Stop</span>
          </button>
          ) : (
            <StatusDot status={task?.status || 'idle'} />
          )}
      </div>
    </header>
  )
}
