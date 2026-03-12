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
  hydrating_store: 'Preparing workspace',
  init_gateway: 'Connecting to gateway',
  checking_sidecar: 'Starting services',
  warming_embeddings: 'Warming up models',
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
      <div className="initialization-glow" />

      <div className="initialization-card">
        {/* Logo */}
        <div className="initialization-logo-container">
          <div className="initialization-logo-glow" />
          <NasusLogo size={32} fill="var(--amber)" className={hasError ? '' : 'spin-slow'} />
        </div>

        {/* Status */}
        <div className="initialization-status">
          <h2 className="initialization-title">
            {hasError ? 'Something went wrong' : 'Nasus'}
          </h2>
          <p className="initialization-subtitle">
            {hasError ? error?.message : PHASE_LABELS[phase]}
          </p>
        </div>

        {/* Progress bar */}
        {!hasError && (
          <div className="initialization-progress-bar">
            <div
              className="initialization-progress-fill"
              style={{ width: `${progress}%` }}
            />
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

        {/* Skip */}
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
