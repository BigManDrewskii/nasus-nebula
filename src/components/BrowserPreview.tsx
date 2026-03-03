/**
 * BrowserPreview.tsx
 *
 * Live browser preview panel for Nasus.
 * Shows the browser session with screenshots, URL bar, and controls.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Pxi } from './Pxi'
import { tauriInvoke } from '../tauri'

interface BrowserPreviewProps {
  className?: string
}

interface SessionInfo {
  session_id: string
  websocket_url: string
}

interface HistoryEntry {
  url: string
  title: string
  timestamp: number
}

type SidecarStatus = 'stopped' | 'starting' | 'running' | 'error'

export function BrowserPreview({ className = '' }: BrowserPreviewProps) {
  const [sidecarStatus, setSidecarStatus] = useState<SidecarStatus>('stopped')
  const [session, setSession] = useState<SessionInfo | null>(null)
  const [screenshot, setScreenshot] = useState<string | null>(null)
  const [, setCurrentUrl] = useState<string>('')
  const [, setCurrentTitle] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [agentDriving, setAgentDriving] = useState(false)
  const [userInControl, setUserInControl] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [stealthMode, setStealthMode] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<{ selector: string; until: number } | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [urlInputValue, setUrlInputValue] = useState('')

  const wsRef = useRef<WebSocket | null>(null)
  const screenshotIntervalRef = useRef<number | null>(null)
  const highlightTimeoutRef = useRef<number | null>(null)

  // Normalize URL - add https:// if missing
  const normalizeUrl = useCallback((url: string): string => {
    if (!url) return url
    const trimmed = url.trim()
    if (!trimmed) return trimmed
    if (!/^https?:\/\//i.test(trimmed)) {
      return `https://${trimmed}`
    }
    return trimmed
  }, [])

  // Check initial sidecar status
  useEffect(() => {
    tauriInvoke<boolean>('browser_is_sidecar_running')
      .then((running) => setSidecarStatus(running ? 'running' : 'stopped'))
      .catch(() => setSidecarStatus('stopped'))
  }, [])

  // Start the sidecar
  const startSidecar = useCallback(async () => {
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
      setCurrentUrl('')
      setUrlInputValue('')
    } catch (err) {
      setError(err as string)
    }
  }, [])

  // Start a new browser session
  const startSession = useCallback(async () => {
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

    ws.onerror = () => {
      console.error('[BrowserPreview] WebSocket error')
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
        setUrlInputValue(message.url)
        setCurrentTitle(message.title)
        setIsLoading(false)

        // Add to history
        const newEntry: HistoryEntry = {
          url: message.url,
          title: message.title || message.url,
          timestamp: Date.now(),
        }

        setHistory((prev) => {
          // Remove any entries after current index if we navigated from history
          const newHistory = historyIndex >= 0
            ? prev.slice(0, historyIndex + 1)
            : [...prev]

          // Don't duplicate the last entry
          if (newHistory.length > 0 && newHistory[newHistory.length - 1].url === message.url) {
            return newHistory
          }

          return [...newHistory, newEntry]
        })
        setHistoryIndex((prev) => prev === -1 ? history.length : prev + 1)
        break

      case 'click_result':
        // Show element highlighting
        if (message.selector) {
          setHighlightedElement({
            selector: message.selector,
            until: Date.now() + 2000,
          })

          if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current)
          }

          highlightTimeoutRef.current = window.setTimeout(() => {
            setHighlightedElement(null)
          }, 2000)
        }
        break

      case 'error':
        setError(message.message)
        setIsLoading(false)
        break

      case 'heartbeat':
        break

      default:
        console.log('[BrowserPreview] Unhandled message type:', message.type)
    }
  }, [history.length, historyIndex])

  // Navigate to a URL
  const navigate = useCallback(async (url: string) => {
    if (!session) return

    const normalizedUrl = normalizeUrl(url)
    setIsLoading(true)
    setCurrentUrl(normalizedUrl)
    setUrlInputValue(normalizedUrl)

    // Send via WebSocket
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'navigate',
        params: { url: normalizedUrl }
      }))
    } else {
      // Fallback to Tauri command
      try {
        const result = await tauriInvoke<string>('browser_navigate', {
          sessionId: session.session_id,
          url: normalizedUrl
        })
        if (result) {
          setCurrentUrl(result)
        }
      } catch (err) {
        setError(err as string)
        setIsLoading(false)
      }
    }
  }, [session, normalizeUrl])

  // Handle URL input submission
  const handleSubmitUrl = useCallback(() => {
    if (urlInputValue.trim()) {
      navigate(urlInputValue)
    }
  }, [urlInputValue, navigate])

  // Navigate back in history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const entry = history[historyIndex - 1]
      navigate(entry.url)
      setHistoryIndex(historyIndex - 1)
    }
  }, [history, historyIndex, navigate])

  // Navigate forward in history
  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const entry = history[historyIndex + 1]
      navigate(entry.url)
      setHistoryIndex(historyIndex + 1)
    }
  }, [history, historyIndex, navigate])

  // Toggle stealth mode
  const toggleStealth = useCallback(async () => {
    if (!session) return

    const newStealthMode = !stealthMode
    try {
      await tauriInvoke('browser_set_stealth', {
        sessionId: session.session_id,
        enabled: newStealthMode,
      })
      setStealthMode(newStealthMode)
    } catch (err) {
      setError(err as string)
    }
  }, [session, stealthMode])

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
      if (highlightTimeoutRef.current) {
        clearTimeout(highlightTimeoutRef.current)
      }
    }
  }, [])

  // Common button styles
  const buttonStyles = {
    base: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--space-1)',
      padding: 'var(--space-1) var(--space-2-5)',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      borderRadius: '7px',
      border: '1px solid transparent',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
    } as React.CSSProperties,
    primary: {
      background: 'var(--amber)',
      color: '#000',
      borderColor: 'var(--amber)',
    } as React.CSSProperties,
    secondary: {
      background: 'rgba(255,255,255,0.06)',
      borderColor: 'rgba(255,255,255,0.08)',
      color: 'var(--tx-primary)',
    } as React.CSSProperties,
    danger: {
      background: 'rgba(239,68,68,0.15)',
      borderColor: 'rgba(239,68,68,0.3)',
      color: '#f87171',
    } as React.CSSProperties,
    ghost: {
      background: 'transparent',
      borderColor: 'transparent',
      color: 'var(--tx-secondary)',
    } as React.CSSProperties,
  }

  const isHighlightActive = highlightedElement && Date.now() < highlightedElement.until

  return (
    <div className={`browser-preview ${className}`} style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      background: '#090909',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--space-2)',
        padding: 'var(--space-2) var(--space-2-5)',
        borderBottom: '1px solid var(--sidebar-border)',
      }}>
        {/* Status indicator */}
        <div style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: sidecarStatus === 'running' ? '#22c55e' :
                      sidecarStatus === 'starting' ? 'var(--amber)' :
                      sidecarStatus === 'error' ? '#ef4444' :
                      'var(--tx-dim)',
          flexShrink: 0,
        }} />

        {/* Controls */}
        {sidecarStatus === 'stopped' && (
          <button
            onClick={startSidecar}
            style={{ ...buttonStyles.base, ...buttonStyles.primary }}
          >
            <Pxi name="globe" size={10} />
            Start Browser
          </button>
        )}

        {sidecarStatus === 'running' && (
          <>
            {session && (
              <>
                {/* Back/Forward buttons */}
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    onClick={goBack}
                    disabled={historyIndex <= 0}
                    style={{
                      ...buttonStyles.base,
                      ...buttonStyles.ghost,
                      opacity: historyIndex > 0 ? 1 : 0.4,
                      cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                      padding: 'var(--space-1)',
                    }}
                    title="Back"
                  >
                    <Pxi name="angle-left" size={10} />
                  </button>
                  <button
                    onClick={goForward}
                    disabled={historyIndex >= history.length - 1}
                    style={{
                      ...buttonStyles.base,
                      ...buttonStyles.ghost,
                      opacity: historyIndex < history.length - 1 ? 1 : 0.4,
                      cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
                      padding: 'var(--space-1)',
                    }}
                    title="Forward"
                  >
                    <Pxi name="angle-right" size={10} />
                  </button>
                </div>

                {/* URL bar */}
                <div style={{
                  flex: 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                }}>
                  <input
                    type="text"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSubmitUrl()
                      }
                    }}
                    placeholder="example.com or https://..."
                    disabled={isLoading}
                    style={{
                      flex: 1,
                      padding: 'var(--space-1) var(--space-2)',
                      fontSize: 'var(--text-xs)',
                      borderRadius: '7px',
                      border: '1px solid rgba(255,255,255,0.08)',
                      background: 'rgba(255,255,255,0.03)',
                      color: 'var(--tx-primary)',
                      minWidth: 0,
                    }}
                  />
                  {isLoading && (
                    <div style={{
                      position: 'absolute',
                      right: 'var(--space-2)',
                      width: 14,
                      height: 14,
                      borderRadius: '50%',
                      border: '2px solid rgba(255,255,255,0.1)',
                      borderTopColor: 'var(--amber)',
                      animation: 'spin 0.8s linear infinite',
                    }} />
                  )}
                </div>

                {/* Navigate button */}
                <button
                  onClick={handleSubmitUrl}
                  disabled={isLoading || !urlInputValue.trim()}
                  style={{
                    ...buttonStyles.base,
                    ...buttonStyles.secondary,
                    opacity: (isLoading || !urlInputValue.trim()) ? 0.5 : 1,
                    cursor: (isLoading || !urlInputValue.trim()) ? 'not-allowed' : 'pointer',
                  }}
                >
                  Go
                </button>

                {/* History toggle */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    ...buttonStyles.base,
                    ...buttonStyles.secondary,
                    ...(showHistory ? { background: 'var(--sidebar-active-bg)' } : {}),
                  }}
                  title="Browse history"
                >
                  <Pxi name="clock" size={10} />
                  History
                  {history.length > 0 && (
                    <span style={{
                      marginLeft: 2,
                      padding: '0 4px',
                      borderRadius: 3,
                      fontSize: 'var(--text-2xs)',
                      background: 'rgba(255,255,255,0.1)',
                    }}>
                      {history.length}
                    </span>
                  )}
                </button>

                {/* Stealth mode indicator/toggle */}
                <button
                  onClick={toggleStealth}
                  style={{
                    ...buttonStyles.base,
                    ...buttonStyles.secondary,
                    ...(stealthMode ? {
                      borderColor: '#a855f7',
                      background: 'rgba(168, 85, 247, 0.15)',
                    } : {}),
                  }}
                  title={stealthMode ? 'Stealth mode enabled - hides automation' : 'Enable stealth mode'}
                >
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: stealthMode ? '#a855f7' : 'var(--tx-dim)',
                  }} />
                  {stealthMode ? 'Stealth' : 'Normal'}
                </button>

                {/* Refresh button */}
                <button
                  onClick={refreshScreenshot}
                  style={{ ...buttonStyles.base, ...buttonStyles.ghost }}
                  title="Refresh screenshot"
                >
                  <Pxi name="refresh" size={10} />
                </button>

                {/* Control toggle */}
                {userInControl ? (
                  <button
                    onClick={releaseControl}
                    style={{
                      ...buttonStyles.base,
                      ...buttonStyles.primary,
                      background: '#22c55e',
                      borderColor: '#22c55e',
                    }}
                  >
                    <Pxi name="check" size={10} />
                    Release
                  </button>
                ) : (
                  <button
                    onClick={takeControl}
                    disabled={agentDriving}
                    style={{
                      ...buttonStyles.base,
                      ...buttonStyles.secondary,
                      opacity: agentDriving ? 0.5 : 1,
                      cursor: agentDriving ? 'not-allowed' : 'pointer',
                    }}
                    title="Take manual control of browser"
                  >
                    <Pxi name="user" size={10} />
                    Take Control
                  </button>
                )}
              </>
            )}

            {/* Stop button */}
            <button
              onClick={stopSidecar}
              style={{
                ...buttonStyles.base,
                ...buttonStyles.danger,
                marginLeft: 'auto',
              }}
            >
              <Pxi name="times" size={10} />
              Stop
            </button>
          </>
        )}

        {sidecarStatus === 'starting' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            fontSize: 'var(--text-xs)',
            color: 'var(--tx-secondary)',
          }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.1)',
              borderTopColor: 'var(--amber)',
              animation: 'spin 0.8s linear infinite',
            }} />
            Starting browser...
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div style={{
          padding: 'var(--space-2) var(--space-2-5)',
          background: 'rgba(239, 68, 68, 0.12)',
          borderBottom: '1px solid rgba(239, 68, 68, 0.25)',
          color: '#f87171',
          fontSize: 'var(--text-xs)',
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1-5)',
        }}>
          <Pxi name="times-circle" size={12} />
          <span style={{ flex: 1 }}>{error}</span>
          <button
            onClick={() => setError(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'inherit',
              cursor: 'pointer',
              padding: 'var(--space-1)',
            }}
          >
            <Pxi name="times" size={10} />
          </button>
        </div>
      )}

      {/* Main content */}
      <div style={{
        flex: 1,
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        background: '#000',
      }}>
        {/* Browser preview area */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
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

              {/* Element highlighting overlay */}
              {isHighlightActive && (
                <div style={{
                  position: 'absolute',
                  top: 'var(--space-3)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: 'var(--space-1-5) var(--space-3)',
                  borderRadius: 20,
                  background: 'rgba(168, 85, 247, 0.9)',
                  color: '#fff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  animation: 'pulse 1s infinite',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#fff',
                  }} />
                  <span>Clicked: </span>
                  <code style={{
                    fontSize: 'var(--text-2xs)',
                    opacity: 0.9,
                    maxWidth: 200,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {highlightedElement.selector}
                  </code>
                </div>
              )}

              {/* Agent driving overlay */}
              {agentDriving && (
                <div style={{
                  position: 'absolute',
                  top: isHighlightActive ? 'var(--space-10)' : 'var(--space-3)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: 'var(--space-1-5) var(--space-3)',
                  borderRadius: 20,
                  background: 'rgba(0, 0, 0, 0.85)',
                  color: '#fff',
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  border: '1px solid ' + 'var(--sidebar-border)',
                  backdropFilter: 'blur(8px)',
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
              color: 'var(--tx-tertiary)',
              gap: 'var(--space-3)',
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--sidebar-border)',
              }}>
                <Pxi name="globe" size={20} style={{ opacity: 0.4 }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  {sidecarStatus === 'running'
                    ? 'Enter a URL to begin browsing'
                    : 'Start the browser to begin'}
                </p>
                <p style={{ margin: 'var(--space-1) 0 0', fontSize: 'var(--text-xs)', opacity: 0.7 }}>
                  The agent can navigate websites and interact with pages
                </p>
              </div>
            </div>
          )}
        </div>

        {/* History sidebar */}
        {showHistory && (
          <div style={{
            width: 260,
            background: '#090909',
            borderLeft: '1px solid var(--sidebar-border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: 'var(--space-2) var(--space-3)',
              borderBottom: '1px solid var(--sidebar-border)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              color: 'var(--tx-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-1-5)',
            }}>
              <Pxi name="clock" size={10} />
              Browse History
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
            }}>
              {history.length === 0 ? (
                <div style={{
                  padding: 'var(--space-8)',
                  textAlign: 'center',
                  fontSize: 'var(--text-xs)',
                  color: 'var(--tx-tertiary)',
                }}>
                  <Pxi name="clock" size={20} style={{ opacity: 0.3, marginBottom: 'var(--space-2)' }} />
                  No history yet
                </div>
              ) : (
                history.map((entry, index) => (
                  <button
                    key={entry.timestamp}
                    onClick={() => {
                      navigate(entry.url)
                      setHistoryIndex(index)
                    }}
                    style={{
                      width: '100%',
                      padding: 'var(--space-2) var(--space-3)',
                      textAlign: 'left',
                      border: 'none',
                      background: index === historyIndex ? 'var(--sidebar-active-bg)' : 'transparent',
                      color: index === historyIndex ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                      fontSize: 'var(--text-xs)',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      borderBottom: '1px solid var(--sidebar-border)',
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => {
                      if (index !== historyIndex) {
                        e.currentTarget.style.background = 'var(--sidebar-hover-bg)'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (index !== historyIndex) {
                        e.currentTarget.style.background = 'transparent'
                      }
                    }}
                  >
                    <span style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      fontWeight: index === historyIndex ? 500 : 400,
                    }}>
                      {entry.title}
                    </span>
                    <span style={{
                      fontSize: 'var(--text-2xs)',
                      opacity: 0.6,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {entry.url}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
