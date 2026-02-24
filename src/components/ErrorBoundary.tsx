import { Component, type ReactNode, type ErrorInfo } from 'react'
import { NasusLogo } from './NasusLogo'

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
    console.error('[Nasus] Uncaught render error:', error, errorInfo)
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
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#f87171', margin: '0 0 8px' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, margin: 0 }}>
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
                padding: '8px 14px',
                fontSize: 11,
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
                padding: '10px 14px',
                fontSize: 10,
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

          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              fontSize: 13,
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
      )
    }

    return this.props.children
  }
}
