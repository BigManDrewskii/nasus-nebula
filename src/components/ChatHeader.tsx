/**
 * Chat view header bar + overlay toast system.
 *
 * Extracted from ChatView.tsx to keep that file focused on orchestration.
 * Contains: ChatHeader, StatusDot, SandboxPill, ToastOverlay
 */

import type { Task } from '../types'
import type { TaskRouterState } from '../store'
import type { GatewayHealth } from '../agent/gateway/gatewayTypes'
import { Pxi } from './Pxi'
import { estimateCost } from '../lib/costEstimate'

// ─── Status dot ────────────────────────────────────────────────────────────────

export function StatusDot({ status }: { status: Task['status'] }) {
  if (status === 'pending') return null
  if (status === 'completed') {
    return <Pxi name="check-circle" size={14} style={{ color: '#34d399', flexShrink: 0 }} title="Done" />
  }
  if (status === 'failed') {
    return <Pxi name="times-circle" size={14} style={{ color: '#f87171', flexShrink: 0 }} title="Failed" />
  }
  if (status === 'stopped') {
    return <Pxi name="stop-circle" size={14} style={{ color: 'var(--tx-tertiary)', flexShrink: 0 }} title="Stopped" />
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

export function SandboxPill({ status }: { status: 'idle' | 'starting' | 'ready' | 'stopped' | 'error' }) {
  if (status === 'idle') return null

  const cfg = {
    starting: { icon: 'circle-notch', label: 'Starting',      color: 'var(--amber)' },
    ready:    { icon: 'check-circle', label: 'Sandbox ready', color: '#34d399' },
    stopped:  { icon: 'times-circle', label: 'Stopped',       color: 'var(--tx-secondary)' },
    error:    { icon: 'triangle-exclamation', label: 'Sandbox error', color: '#f87171' },
  }[status]

  if (!cfg) return null

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <Pxi name={cfg.icon} size={12} style={{ color: cfg.color }} />
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
        <Pxi name="exclamation-triangle" size={14} style={{ color: 'var(--amber)', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-primary)' }}>{workspaceWarning}</span>
      </div>
    )
  }

  if (rateLimitWarning) {
    return (
      <div style={{ ...baseStyle, border: '1px solid rgba(239,68,68,0.35)' }}>
        <Pxi name="exclamation-triangle" size={14} style={{ color: '#f87171', flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: 'var(--tx-primary)' }}>{rateLimitWarning}</span>
      </div>
    )
  }

  if (folderDropConfirm) {
    return (
      <div style={{ ...baseStyle, border: '1px solid rgba(52,211,153,0.35)' }}>
        <Pxi name="check-circle" size={14} style={{ color: '#34d399', flexShrink: 0 }} />
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
    provider: string
    routingMode: string
    routerConfig?: { budget: string }
    sandboxStatus: 'idle' | 'starting' | 'ready' | 'stopped' | 'error'
    outputVisible?: boolean
    workspaceFileCount?: number
    onShowOutput?: () => void
    onStop: () => void
    taskRouterState?: TaskRouterState | null
    gatewayHealth?: GatewayHealth[]
    messageCount?: number
    userTurns?: number
    rightCollapsed?: boolean
    onToggleRight?: () => void
    onToggleSidebar?: () => void
  }

  export function ChatHeader({
    task,
    isActive,
    iteration,
    tokenCount,
    model: manualModel,
    provider: manualProvider,
    routingMode,
    routerConfig,
    sandboxStatus,
    outputVisible,
    workspaceFileCount = 0,
    onShowOutput,
    onStop,
    taskRouterState,
    gatewayHealth = [],
    messageCount = 0,
    userTurns = 0,
    rightCollapsed,
    onToggleRight,
    onToggleSidebar,
  }: ChatHeaderProps) {
    // Current model info from either the live task state or the store defaults
    const activeModelId = taskRouterState?.modelId || manualModel
    const activeModelName = taskRouterState?.displayName || (manualModel.split('/').pop() || manualModel)
    const isAutoFree = routingMode === 'auto-free' || taskRouterState?.isFree

    // Provider info
    const isVercel = activeModelId.includes('vercel') || manualProvider === 'vercel'
    const providerLabel = isVercel ? 'Vercel AI' : manualProvider === 'ollama' ? 'Local' : 'OpenRouter'
    const providerIcon = manualProvider === 'ollama' ? 'server' : 'cloud'

    // Health status for the primary provider
    const health = gatewayHealth.find(h => h.status !== 'unknown' && h.status !== 'healthy') || gatewayHealth[0]
    const healthStatus = health?.status || 'healthy'
    const healthColors: Record<string, string> = { healthy: '#34d399', degraded: '#fbbf24', down: '#f87171', unknown: 'var(--tx-muted)' }
    const healthColor = healthColors[healthStatus]

    const healthTooltip = health ? `
${health.gatewayId}: ${healthStatus.toUpperCase()}
Success rate: ${Math.round((health.successRate || 0) * 100)}%
Avg latency: ${(health.avgLatencyMs / 1000).toFixed(1)}s
Requests: ${health.requestCount || 0}
`.trim() : `Gateway health: ${healthStatus}`

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

            {/* Provider + Model Badge */}
            <div
              title={healthTooltip}
              style={{
                display: 'flex', alignItems: 'center', gap: 5, padding: '2px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'var(--tx-secondary)',
                flexShrink: 0,
                cursor: 'help',
              }}
            >
              {/* Health dot */}
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: healthColor, boxShadow: `0 0 4px ${healthColor}` }} />
              <Pxi name={providerIcon} size={10} style={{ opacity: 0.6 }} />
              <span style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.02em' }}>{providerLabel}</span>
              <div style={{ width: 1, height: 8, background: 'rgba(255,255,255,0.1)' }} />
              <span style={{ fontSize: 9, fontWeight: 500, color: 'var(--tx-tertiary)' }}>{activeModelName}</span>
              {isAutoFree && <span style={{ fontSize: 8, color: '#4ade80', fontWeight: 600, marginLeft: 2 }}>free</span>}
            </div>

            {/* Route Badge — hidden, info already in provider badge */}

          {isActive && iteration > 0 && (
            <span
              className="flex items-center gap-1 flex-shrink-0"
              title={`Iteration ${iteration}${messageCount > 0 ? `\nMessages: ${messageCount}` : ''}${userTurns > 0 ? `\nUser turns: ${userTurns}` : ''}`}
              style={{ cursor: 'help' }}
            >
              <Pxi name="refresh" size={10} style={{ color: 'var(--tx-muted)', animation: 'spin 1s linear infinite' }} />
              <span className="font-mono" style={{ fontSize: 9.5, color: 'var(--tx-muted)' }}>{iteration}</span>
            </span>
          )}

        {tokenCount > 0 && (
          <span className="font-mono flex-shrink-0" style={{ fontSize: 9.5, color: 'var(--tx-muted)' }}>
            {(tokenCount / 1000).toFixed(1)}k · {estimateCost(activeModelId, tokenCount)}
            {taskRouterState?.tokenUsage && (
              <span 
                style={{ 
                  marginLeft: 6,
                  color: taskRouterState.tokenUsage.contextUtilization > 0.85 ? '#f87171' : 
                         taskRouterState.tokenUsage.contextUtilization > 0.7 ? 'var(--amber)' : 
                         'var(--tx-muted)'
                }}
                title={`Context utilization: ${Math.round(taskRouterState.tokenUsage.contextUtilization * 100)}%`}
              >
                ctx: {Math.round(taskRouterState.tokenUsage.contextUtilization * 100)}%
              </span>
            )}
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
            <Pxi name="folder" size={12} />
            <span style={{ fontSize: 10.5, fontWeight: 500 }}>{workspaceFileCount}</span>
          </button>
        )}

        {/* Workspace panel toggle [◧] */}
        {onToggleRight && (
          <button
            onClick={onToggleRight}
            title={rightCollapsed ? 'Show workspace panel (⌘⇧\\)' : 'Hide workspace panel (⌘⇧\\)'}
            className="header-sidebar-toggle"
          >
            <Pxi name={rightCollapsed ? 'columns' : 'angle-right'} size={14} />
          </button>
        )}

        {/* Stop / status */}
        {isActive ? (
          <button
            onClick={onStop}
            className="header-stop-btn"
            title="Stop agent (Esc)"
          >
            <Pxi name="times-circle" size={14} />
            <span>Stop</span>
          </button>
          ) : (
            <StatusDot status={task?.status || 'idle'} />
          )}
      </div>
    </header>
  )
}
