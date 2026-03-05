import { useState, useEffect } from 'react'
import { useAppStore } from '../store'
import { Pxi } from './Pxi'

interface Props {
  onInstallComplete?: () => void
  onSkip?: () => void
}

export function SidecarPrompt({ onInstallComplete, onSkip }: Props) {
  const {
    sidecarInstalled,
    sidecarInstallProgress,
    setSidecarPromptShown,
    installSidecar,
  } = useAppStore()

  const [dontShowAgain, setDontShowAgain] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [installing, setInstalling] = useState(false)

  // Check installation status on mount
  useEffect(() => {
    if (sidecarInstalled) {
      onInstallComplete?.()
    }
  }, [sidecarInstalled, onInstallComplete])

  const handleInstall = async () => {
    setInstalling(true)
    setError(null)
    try {
      await installSidecar()
      onInstallComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Installation failed')
    } finally {
      setInstalling(false)
    }
  }

  const handleSkip = () => {
    if (dontShowAgain) {
      setSidecarPromptShown(true)
    }
    onSkip?.()
  }

  // If already installed, don't show
  if (sidecarInstalled) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 2000,
        animation: 'fadeIn 0.16s ease-out',
      }}
    >
      <div
        style={{
          background: 'rgba(18, 18, 18, 0.96)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 12,
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.3)',
          padding: 'var(--space-6)',
          maxWidth: 420,
          width: '90%',
          animation: 'dropUp 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }}
      >
        {/* Header with icon */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: 'linear-gradient(135deg, oklch(64% 0.214 40.1 / 0.15), oklch(64% 0.214 40.1 / 0.05))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid oklch(64% 0.214 40.1 / 0.2)',
            }}
          >
            <Pxi name="globe" size={18} style={{ color: 'var(--amber)' }} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--tx-primary)',
                lineHeight: 1.3,
              }}
            >
              Browser Automation Required
            </h2>
          </div>
        </div>

        {/* Message */}
        <p
          style={{
            margin: '0 0 var(--space-4)',
            fontSize: 'var(--text-sm)',
            color: 'var(--tx-secondary)',
            lineHeight: 1.6,
          }}
        >
          Browser features require Chromium (~300MB). This will be downloaded once and reused for future sessions.
        </p>

        {/* Progress */}
        {installing && sidecarInstallProgress && (
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 8,
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(234, 179, 8, 0.3)',
                borderTopColor: 'var(--amber)',
                animation: 'spin 1s linear infinite',
              }}
            />
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--amber-soft)' }}>
              {sidecarInstallProgress}
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 'var(--space-4)',
              padding: 'var(--space-2) var(--space-3)',
              borderRadius: 8,
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              fontSize: 'var(--text-xs)',
              color: '#fca5a5',
            }}
          >
            {error}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
          <button
            onClick={handleInstall}
            disabled={installing}
            style={{
              flex: 1,
              padding: 'var(--space-2-5) var(--space-4)',
              borderRadius: 8,
              border: 'none',
              background: installing ? 'rgba(234, 179, 8, 0.3)' : 'var(--amber)',
              color: '#000',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: installing ? 'wait' : 'pointer',
              transition: 'all 0.12s ease',
              opacity: installing ? 0.7 : 1,
            }}
            onMouseEnter={(e) => {
              if (!installing) e.currentTarget.style.background = 'oklch(64% 0.214 40.1 / 0.9)'
            }}
            onMouseLeave={(e) => {
              if (!installing) e.currentTarget.style.background = 'var(--amber)'
            }}
          >
            {installing ? 'Installing...' : 'Download Chromium'}
          </button>
          <button
            onClick={handleSkip}
            disabled={installing}
            style={{
              padding: 'var(--space-2-5) var(--space-4)',
              borderRadius: 8,
              border: '1px solid rgba(255, 255, 255, 0.1)',
              background: 'transparent',
              color: 'var(--tx-secondary)',
              fontSize: 'var(--text-sm)',
              fontWeight: 500,
              cursor: installing ? 'not-allowed' : 'pointer',
              transition: 'all 0.12s ease',
              opacity: installing ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (!installing) {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)'
                e.currentTarget.style.color = 'var(--tx-primary)'
              }
            }}
            onMouseLeave={(e) => {
              if (!installing) {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)'
                e.currentTarget.style.color = 'var(--tx-secondary)'
              }
            }}
          >
            Skip
          </button>
        </div>

        {/* Don't show again checkbox */}
        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--tx-tertiary)',
            cursor: installing ? 'not-allowed' : 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            disabled={installing}
            style={{
              width: 14,
              height: 14,
              borderRadius: 3,
              cursor: installing ? 'not-allowed' : 'pointer',
            }}
          />
          Don't ask again this session
        </label>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes dropUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
