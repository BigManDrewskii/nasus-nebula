import { Component, type ReactNode, type ErrorInfo } from 'react'
import { NasusLogo } from './NasusLogo'
import { createLogger } from '../lib/logger'

const log = createLogger('ErrorBoundary')

interface Props {
  children: ReactNode
}

interface State {
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })
    log.error('Uncaught render error', error, { componentStack: errorInfo.componentStack })
  }

  /** Try to delete the active task and reset the boundary without a full reload. */
  handleDeleteAndRecover() {
    try {
      const raw = localStorage.getItem('nasus-store-v2')
      if (raw) {
        const data = JSON.parse(raw)
        const state = data?.state ?? data
        const activeId: string | null = state.activeTaskId ?? null
        if (activeId && state.tasks) {
          state.tasks = (state.tasks as Array<{ id: string }>).filter((t) => t.id !== activeId)
          if (state.messages) delete state.messages[activeId]
          if (state.rawHistory) delete state.rawHistory[activeId]
          state.activeTaskId = state.tasks[0]?.id ?? null
          if (data?.state !== undefined) {
            data.state = state
          } else {
            Object.assign(data, state)
          }
          localStorage.setItem('nasus-store-v2', JSON.stringify(data))
        }
      }
    } catch {
      /* best-effort — if this fails, fall back to full reload */
    }
    this.setState({ error: null, errorInfo: null })
  }

  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            background: '#0a0a0a',
            padding: '0 32px',
            gap: 20,
          }}
        >
          <NasusLogo size={28} fill="rgba(239,68,68,0.6)" />
          <div style={{ textAlign: 'center', maxWidth: 480 }}>
            <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: '#f87171', margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 'var(--text-base)', color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
              {this.state.error.message}
            </p>
          </div>

          <details
            style={{
              maxWidth: 560,
              width: '100%',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                padding: '8px 16px',
                fontSize: 'var(--text-xs)',
                color: 'rgba(255,255,255,0.35)',
                cursor: 'pointer',
                userSelect: 'none',
              }}
            >
              Stack trace
            </summary>
            <pre
              style={{
                margin: 0,
                padding: '8px 16px',
                fontSize: 'var(--text-xs)',
                color: 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-mono)',
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
                borderTop: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {this.state.errorInfo?.componentStack ?? this.state.error.stack}
            </pre>
          </details>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => this.handleDeleteAndRecover()}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Delete broken task &amp; recover
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                fontSize: 'var(--text-base)',
                fontWeight: 500,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: 'rgba(255,255,255,0.7)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Reload app
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
