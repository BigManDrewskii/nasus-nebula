/**
 * BrowserPreview.tsx
 *
 * Live browser preview panel for Nasus Eye.
 * Shows the browser session with screenshots, URL bar, and controls.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { tauriInvoke } from '../tauri'

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

interface BrowserPreviewProps {
  className?: string
}

interface SessionInfo {
  session_id: string
  websocket_url: string
}

type SidecarStatus = 'stopped' | 'starting' | 'running' | 'error'

export function BrowserPreview({ className = '' }: BrowserPreviewProps) {
  const [sidecarStatus, setSidecarStatus] = useState<SidecarStatus>('stopped')
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [_currentTitle, setCurrentTitle] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [agentDriving, setAgentDriving] = useState(false)
  const [userInControl, setUserInControl] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const screenshotIntervalRef = useRef<number | null>(null)

  // Check initial sidecar status
  useEffect(() => {
    if (!isTauri) return

    tauriInvoke<boolean>('browser_is_sidecar_running')
      .then((running) => setSidecarStatus(running ? 'running' : 'stopped'))
      .catch(() => setSidecarStatus('stopped'))
  }, [])

  // Start the sidecar
  const startSidecar = useCallback(async () => {
    if (!isTauri) return

    setSidecarStatus('starting')
    setError(null)

    try {
      await tauriInvoke('browser_start_sidecar')
      setSidecarStatus('running')

      // Give it a moment to fully start
      setTimeout(async () => {
        await startSession()
      }, 1000)
    } catch (err) {
      setError(err as string)
      setSidecarStatus('error')
    }
  }, [])

  // Stop the sidecar
  const stopSidecar = useCallback(async () => {
    if (!isTauri) return

    try {
      // Close WebSocket connection
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }

      // Clear screenshot interval
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current)
        screenshotIntervalRef.current = null
      }

      await tauriInvoke('browser_stop_sidecar')
      setSidecarStatus('stopped')
      setSession(null)
      setScreenshot(null)
    } catch (err) {
      setError(err as string)
    }
  }, [])

  // Start a new browser session
  const startSession = useCallback(async () => {
    if (!isTauri) return

    try {
      const result = await tauriInvoke<SessionInfo>('browser_start_session')
      if (result) {
        setSession(result)
        connectWebSocket(result.websocket_url)
      }
    } catch (err) {
      setError(err as string)
    }
  }, [])

  // Connect to the sidecar WebSocket
  const connectWebSocket = useCallback((wsUrl: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      console.log('[BrowserPreview] WebSocket connected')

      // Request screenshots every 500ms for smooth preview
      screenshotIntervalRef.current = window.setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'screenshot', params: {} }))
        }
      }, 500) as unknown as number
    }

    ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data)
        handleWebSocketMessage(message)
      } catch (err) {
        console.error('[BrowserPreview] Failed to parse WebSocket message:', err)
      }
    }

    ws.onerror = (event) => {
      console.error('[BrowserPreview] WebSocket error:', event)
      setError('WebSocket connection error')
    }

    ws.onclose = () => {
      console.log('[BrowserPreview] WebSocket disconnected')
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current)
        screenshotIntervalRef.current = null
      }
    }
  }, [])

  // Handle WebSocket messages from the sidecar
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'connected':
        console.log('[BrowserPreview] Sidecar connected:', message.sessionId)
        break

      case 'session_ready':
        console.log('[BrowserPreview] Session ready:', message.sessionId)
        setIsLoading(false)
        break

      case 'screenshot_result':
        setScreenshot(message.dataUrl)
        break

      case 'navigate_result':
        setCurrentUrl(message.url)
        setCurrentTitle(message.title)
        setIsLoading(false)
        break

      case 'error':
        setError(message.message)
        setIsLoading(false)
        break

      case 'heartbeat':
        // Keep-alive, no action needed
        break

      default:
        console.log('[BrowserPreview] Unhandled message type:', message.type)
    }
  }, [])

  // Navigate to a URL
  const navigate = useCallback(async (url: string) => {
    if (!isTauri || !session) return

    setIsLoading(true)
    setCurrentUrl(url)

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'navigate',
        params: { url }
      }))
    } else {
      // Fallback to Tauri command
      try {
        const result = await tauriInvoke<string>('browser_navigate', {
          sessionId: session.session_id,
          url
        })
        if (result) {
          setCurrentUrl(result)
        }
      } catch (err) {
        setError(err as string)
        setIsLoading(false)
      }
    }
  }, [session])

  // Take control (switch from agent to user)
  const takeControl = useCallback(() => {
    setUserInControl(true)
    setAgentDriving(false)
  }, [])

  // Give control back to agent
  const releaseControl = useCallback(() => {
    setUserInControl(false)
  }, [])

  // Refresh screenshot manually
  const refreshScreenshot = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'screenshot', params: {} }))
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current)
      }
    }
  }, [])

  // Render for non-Tauri (browser)
  if (!isTauri) {
    return (
      <div className={`browser-preview ${className}`}>
        <div style={{
          padding: 24,
          textAlign: 'center',
          color: 'var(--tx-secondary)',
        }}>
          <p style={{ marginBottom: 12, fontSize: 13 }}>
            Browser automation is only available in the desktop app.
          </p>
          <p style={{ fontSize: 12, opacity: 0.7 }}>
            Download Nasus Desktop to use this feature.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`browser-preview ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: 'var(--bg-elevated)',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        {/* Status indicator */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: sidecarStatus === 'running' ? '#22c55e' :
                      sidecarStatus === 'starting' ? '#f59e0b' :
                      sidecarStatus === 'error' ? '#ef4444' :
                      'var(--tx-dim)',
        }} />

        {/* Controls */}
        {sidecarStatus === 'stopped' && (
          <button
            onClick={startSidecar}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              borderRadius: 6,
              border: '1px solid var(--border-default)',
              background: 'var(--bg-default)',
              color: 'var(--tx-primary)',
              cursor: 'pointer',
            }}
          >
            Start Browser
          </button>
        )}

        {sidecarStatus === 'running' && (
          <>
            {session && (
              <>
                {/* URL bar */}
                <input
                  type="text"
                  value={currentUrl}
                  onChange={(e) => setCurrentUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      navigate(currentUrl)
                    }
                  }}
                  placeholder="Enter URL..."
                  disabled={isLoading}
                  style={{
                    flex: 1,
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--bg-default)',
                    color: 'var(--tx-primary)',
                    minWidth: 0,
                  }}
                />

                {/* Navigate button */}
                <button
                  onClick={() => navigate(currentUrl)}
                  disabled={isLoading}
                  style={{
                    padding: '4px 12px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-default)',
                    color: 'var(--tx-primary)',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.5 : 1,
                  }}
                >
                  Go
                </button>

                {/* Refresh button */}
                <button
                  onClick={refreshScreenshot}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-default)',
                    color: 'var(--tx-primary)',
                    cursor: 'pointer',
                  }}
                  title="Refresh screenshot"
                >
                  ↻
                </button>

                {/* Control toggle */}
                {userInControl ? (
                  <button
                    onClick={releaseControl}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid #22c55e',
                      background: 'rgba(34, 197, 94, 0.1)',
                      color: '#22c55e',
                      cursor: 'pointer',
                    }}
                  >
                    Release
                  </button>
                ) : (
                  <button
                    onClick={takeControl}
                    disabled={agentDriving}
                    style={{
                      padding: '4px 12px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid var(--border-default)',
                      background: 'var(--bg-default)',
                      color: 'var(--tx-primary)',
                      cursor: agentDriving ? 'not-allowed' : 'pointer',
                      opacity: agentDriving ? 0.5 : 1,
                    }}
                  >
                    Take Control
                  </button>
                )}
              </>
            )}

            {/* Stop button */}
            <button
              onClick={stopSidecar}
              style={{
                padding: '4px 12px',
                fontSize: 12,
                borderRadius: 4,
                border: '1px solid #ef4444',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444',
                cursor: 'pointer',
                marginLeft: 'auto',
              }}
            >
              Stop
            </button>
          </>
        )}

        {sidecarStatus === 'starting' && (
          <span style={{ fontSize: 12, color: 'var(--tx-secondary)' }}>
            Starting browser...
          </span>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: '8px 12px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          fontSize: 12,
        }}>
          {error}
        </div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#000',
      }}>
        {screenshot ? (
          <>
            <img
              src={screenshot}
              alt="Browser preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
              }}
            />

            {/* Agent driving overlay */}
            {agentDriving && (
              <div style={{
                position: 'absolute',
                top: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                padding: '6px 12px',
                borderRadius: 20,
                background: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                fontSize: 12,
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: '#22c55e',
                  animation: 'pulse 1s infinite',
                }} />
                Agent is driving
              </div>
            )}
          </>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--tx-dim)',
          }}>
            <p style={{ marginBottom: 8, fontSize: 13 }}>
              {sidecarStatus === 'running' ? 'Enter a URL to begin browsing' : 'Start the browser to begin'}
            </p>
            {isLoading && (
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: '2px solid var(--border-subtle)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 1s linear infinite',
              }} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
