/**
 * InitializationScreen.tsx
 *
 * Loading screen shown during app initialization.
 * Displays progress through init phases with error recovery.
 */

import type { InitPhase, InitError } from '../hooks/useAppInit'
import { NasusLogo } from './NasusLogo'
import { Pxi } from './Pxi'

const PHASE_LABELS: Record<InitPhase, string> = {
  hydrating_store: 'Preparing workspace...',
  init_gateway: 'Connecting to AI gateway...',
  checking_sidecar: 'Starting services...',
  warming_embeddings: 'Warming up models...',
  complete: 'Ready',
  error: 'Initialization failed',
}

const NON_BLOCKING_PHASES: InitPhase[] = ['checking_sidecar', 'warming_embeddings']

interface Props {
  phase: InitPhase
  error: InitError | null
  progress: number
  onRetry: () => void
  onSkip: () => void
}

export function InitializationScreen({ phase, error, progress, onRetry, onSkip }: Props) {
  const canSkip = NON_BLOCKING_PHASES.includes(phase)
  const hasError = phase === 'error' && error !== null

  return (
    <div className="initialization-root">
      {/* Ambient top glow */}
      <div className="initialization-glow" />

      <div className="initialization-card">
        {/* Logo with glow */}
        <div className="initialization-logo-container">
          <div className="initialization-logo-glow" />
          <div className="initialization-logo-box">
            <NasusLogo size={36} fill="var(--amber)" className={hasError ? '' : 'spin-slow'} />
          </div>
        </div>

        {/* Status message */}
        <div className="initialization-status">
          <h2 className="initialization-title">
            {hasError ? 'Initialization Failed' : 'Nasus is starting...'}
          </h2>
          <p className="initialization-subtitle">
            {hasError ? error?.message : PHASE_LABELS[phase]}
          </p>
        </div>

        {/* Progress bar */}
        {!hasError && (
          <div className="initialization-progress-container">
            <div className="initialization-progress-bar">
              <div
                className="initialization-progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="initialization-progress-text">{progress}%</span>
          </div>
        )}

        {/* Phase indicators */}
        {!hasError && (
          <div className="initialization-phases">
            {(['hydrating_store', 'init_gateway', 'checking_sidecar', 'warming_embeddings'] as InitPhase[]).map(
              (p, i) => {
                const phaseIndex = ['hydrating_store', 'init_gateway', 'checking_sidecar', 'warming_embeddings'].indexOf(
                  phase
                )
                const isDone = i < phaseIndex
                const isCurrent = i === phaseIndex

                return (
                  <div
                    key={p}
                    className="initialization-phase-dot"
                    data-status={isDone ? 'done' : isCurrent ? 'current' : 'pending'}
                  />
                )
              }
            )}
          </div>
        )}

        {/* Error actions */}
        {hasError && (
          <div className="initialization-error-actions fade-in">
            {error?.recoverable && (
              <button
                onClick={onRetry}
                className="initialization-retry-btn font-display hover-opacity-90"
              >
                <Pxi name="refresh" size={11} style={{ color: '#000' }} />
                Try Again
              </button>
            )}
            <div className="initialization-error-details text-tertiary">
              Phase: {error?.phase.replace(/_/g, ' ')}
            </div>
          </div>
        )}

        {/* Skip button for non-blocking phases */}
        {canSkip && !hasError && (
          <button
            onClick={onSkip}
            className="initialization-skip-btn text-tertiary hover-text-primary"
          >
            Skip
          </button>
        )}
      </div>
    </div>
  )
}
