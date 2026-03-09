/**
 * Chat view header bar + overlay toast system.
 *
 * Extracted from ChatView.tsx to keep that file focused on orchestration.
 * Contains: ChatHeader, StatusDot, SandboxPill, ToastOverlay
 */

import type { Task } from '../types'
import type { TaskRouterState } from '../store'
import type { GatewayHealth } from '../agent/gateway/gatewayTypes'
import type { ExecutionPlan } from '../agent/core/Agent'
import { useAppStore } from '../store'
import { useShallow } from 'zustand/react/shallow'
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
      <span style={{ fontSize: 'var(--text-2xs)', color: cfg.color }}>{cfg.label}</span>
    </div>
  )
}

// ─── Toast overlay ─────────────────────────────────────────────────────────────

const toastIcons = {
  amber: { icon: 'exclamation-triangle', color: 'var(--amber)' },
  red:   { icon: 'exclamation-triangle', color: '#f87171' },
  green: { icon: 'check-circle',         color: '#34d399' },
} as const

const toastClasses = {
  amber: 'ch-toast ch-toast--amber',
  red:   'ch-toast ch-toast--red',
  green: 'ch-toast ch-toast--green',
} as const

export function ToastOverlay() {
  const { toasts, removeToast } = useAppStore(
    useShallow((s) => ({ toasts: s.toasts, removeToast: s.removeToast }))
  )

  if (toasts.length === 0) return null

  return (
    <>
      {toasts.map((toast) => {
        const { icon, color } = toastIcons[toast.type]
        return (
          <div
            key={toast.id}
            className={toastClasses[toast.type]}
            onClick={() => removeToast(toast.id)}
            style={{ cursor: 'pointer' }}
          >
            <Pxi name={icon} size={14} style={{ color, flexShrink: 0 }} />
            <span className={toast.type === 'green' ? 'ch-toast-text ch-toast-text--mono' : 'ch-toast-text'}>
              {toast.message}
            </span>
          </div>
        )
      })}
    </>
  )
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
     /** The live model badge from the current run (replaces stale taskRouterState when active) */
     activeModelBadge?: { modelId: string; displayName: string; reason: string; isFree?: boolean } | null
     gatewayHealth?: GatewayHealth[]
     messageCount?: number
     userTurns?: number
     rightCollapsed?: boolean
     onToggleRight?: () => void
     onToggleSidebar?: () => void
     /** Current execution plan — shows the Plan chip when set */
     currentPlan?: ExecutionPlan | null
     currentPhase?: number
     currentStep?: number
     onPlanClick?: () => void
   }

   export function ChatHeader({
     task,
     isActive,
     iteration,
     tokenCount,
     model: manualModel,
     provider: manualProvider,
     routingMode,
       routerConfig: _routerConfig,
     sandboxStatus,
     outputVisible,
     workspaceFileCount = 0,
     onShowOutput,
     onStop,
     taskRouterState,
     activeModelBadge,
     gatewayHealth = [],
     messageCount: _messageCount = 0,
     userTurns: _userTurns = 0,
     rightCollapsed,
     onToggleRight,
       onToggleSidebar: _onToggleSidebar,
     currentPlan,
     currentPhase = 0,
     onPlanClick,
   }: ChatHeaderProps) {
     const liveRouterEntry = isActive && routingMode === 'auto' ? activeModelBadge ?? taskRouterState : null
     const activeModelId = liveRouterEntry?.modelId || manualModel
     const activeModelName = liveRouterEntry?.displayName || (manualModel.split('/').pop() || manualModel)
     const isAutoFree = routingMode === 'auto-free' || (isActive && (liveRouterEntry?.isFree ?? false))

      const isVercel = activeModelId.includes('vercel') || manualProvider === 'vercel'
      const providerLabel = isVercel ? 'Vercel AI' : manualProvider === 'ollama' ? 'Local' : 'OpenRouter'

      const health = gatewayHealth.find(h => h.status !== 'unknown' && h.status !== 'healthy') || gatewayHealth[0]
      const healthStatus = health?.status || 'healthy'
      const healthColors: Record<string, string> = { healthy: '#34d399', degraded: '#fbbf24', down: '#f87171', unknown: 'var(--tx-muted)' }
      const healthColor = healthColors[healthStatus]

    return (
      <header className="flex-shrink-0 flex items-center justify-between ch-header">
        {/* Left cluster — task title */}
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2
            className="font-display font-medium truncate ch-title"
            title={task?.title || 'New Chat'}
          >
            {task?.title || 'New Chat'}
          </h2>
        </div>

        {/* Center — compact model + cost pill + plan chip */}
        <div className="ch-center">
          <div
            title={[
              `${providerLabel} · ${activeModelName}`,
              tokenCount > 0 ? `Tokens: ${(tokenCount / 1000).toFixed(1)}k` : null,
              tokenCount > 0 ? `Cost: ${estimateCost(activeModelId, tokenCount)}` : null,
              taskRouterState?.tokenUsage ? `Context: ${Math.round(taskRouterState.tokenUsage.contextUtilization * 100)}%` : null,
              iteration > 0 ? `Iteration: ${iteration}` : null,
            ].filter(Boolean).join('\n')}
            className="ch-model-pill"
          >
            <span className="ch-health-dot" style={{ background: healthColor, boxShadow: `0 0 4px ${healthColor}` }} />
            <span className="ch-model-name">{activeModelName}</span>
            {isAutoFree && <span className="ch-free-badge">FREE</span>}
            {tokenCount > 0 && (
              <>
                <span className="ch-pill-divider" />
                <span className="ch-cost-label">{estimateCost(activeModelId, tokenCount)}</span>
              </>
            )}
            {isActive && iteration > 0 && (
              <>
                <span className="ch-pill-divider" />
                <Pxi name="refresh" size={9} style={{ color: 'var(--amber)', animation: 'spin 1s linear infinite' }} />
              </>
            )}
          </div>

          {/* Plan chip — visible whenever a plan is active */}
          {currentPlan && (
            <button className="ch-plan-chip" onClick={onPlanClick} title="View execution plan">
              <Pxi name="cpu" size={9} />
              <span>Plan</span>
              <span className="ch-plan-phase">{currentPhase + 1}/{currentPlan.phases.length}</span>
              <span className="ch-plan-pulse" />
            </button>
          )}
        </div>

        {/* Right cluster — sandbox + stop */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-1 justify-end">
          {/* Sandbox pill — only when relevant */}
          {isActive && sandboxStatus === 'starting' && (
            <div className="ch-sandbox-starting">
              <span className="ch-sandbox-dot" />
              <span className="ch-sandbox-label">Starting</span>
            </div>
          )}
          {sandboxStatus === 'ready' && <SandboxPill status={sandboxStatus} />}
          {sandboxStatus === 'error' && <SandboxPill status={sandboxStatus} />}

          {/* Files pill */}
          {!outputVisible && workspaceFileCount > 0 && onShowOutput && (
            <button
              onClick={onShowOutput}
              title="Show output panel"
              className="header-action-btn"
            >
              <Pxi name="folder" size={12} />
              <span className="ch-files-count">{workspaceFileCount}</span>
            </button>
          )}

          {/* Workspace panel toggle */}
          {onToggleRight && (
            <button
              onClick={onToggleRight}
              title={rightCollapsed ? 'Show workspace panel (⌘⇧\\)' : 'Hide workspace panel (⌘⇧\\)'}
              aria-label={rightCollapsed ? 'Show workspace panel' : 'Hide workspace panel'}
              className="ch-panel-toggle hover-bg-app-3"
            >
              <Pxi name="columns" size={12} />
            </button>
          )}

            {/* Stop / status */}
            {isActive ? (
              <button
                onClick={onStop}
                className="header-stop-btn"
                title="Stop agent (Esc)"
                aria-label="Stop generation"
              >
              <Pxi name="times-circle" size={13} />
              <span>Stop</span>
            </button>
          ) : (
            <StatusDot status={task?.status || 'idle'} />
          )}
        </div>
      </header>
    )
}
