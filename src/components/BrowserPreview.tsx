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
  const [currentUrl, setCurrentUrl] = useState<string>('')
  const [currentTitle, setCurrentTitle] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [agentDriving, setAgentDriving] = useState(false)
  const [userInControl, setUserInControl] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [stealthMode, setStealthMode] = useState(false)
  const [highlightedElement, setHighlightedElement] = useState<{ selector: string; until: number } | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const wsRef = useRef<WebSocket | null>(null)
  const screenshotIntervalRef = useRef<number | null>(null)
  const highlightTimeoutRef = useRef<number | null>(null)

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
            until: Date.now() + 2000, // Highlight for 2 seconds
          })

          // Clear previous timeout
          if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current)
          }

          // Set new timeout
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
        // Keep-alive, no action needed
        break

      default:
        console.log('[BrowserPreview] Unhandled message type:', message.type)
    }
  }, [history.length, historyIndex])

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
    if (!isTauri || !session) return

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
                {/* Back/Forward buttons */}
                <div style={{ display: 'flex', gap: 2 }}>
                  <button
                    onClick={goBack}
                    disabled={historyIndex <= 0}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-default)',
                      color: historyIndex > 0 ? 'var(--tx-primary)' : 'var(--tx-dim)',
                      cursor: historyIndex > 0 ? 'pointer' : 'not-allowed',
                      opacity: historyIndex > 0 ? 1 : 0.5,
                    }}
                    title="Back"
                  >
                    ←
                  </button>
                  <button
                    onClick={goForward}
                    disabled={historyIndex >= history.length - 1}
                    style={{
                      padding: '4px 8px',
                      fontSize: 12,
                      borderRadius: 4,
                      border: '1px solid var(--border-subtle)',
                      background: 'var(--bg-default)',
                      color: historyIndex < history.length - 1 ? 'var(--tx-primary)' : 'var(--tx-dim)',
                      cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed',
                      opacity: historyIndex < history.length - 1 ? 1 : 0.5,
                    }}
                    title="Forward"
                  >
                    →
                  </button>
                </div>

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

                {/* History toggle */}
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  style={{
                    padding: '4px 8px',
                    fontSize: 12,
                    borderRadius: 4,
                    border: showHistory ? '1px solid var(--accent)' : '1px solid var(--border-default)',
                    background: showHistory ? 'var(--accent-container)' : 'var(--bg-default)',
                    color: showHistory ? 'var(--accent)' : 'var(--tx-primary)',
                    cursor: 'pointer',
                  }}
                  title="Browse history"
                >
                  History
                </button>

                {/* Stealth mode indicator/toggle */}
                <button
                  onClick={toggleStealth}
                  style={{
                    padding: '4px 8px',
                    fontSize: 11,
                    borderRadius: 4,
                    border: stealthMode ? '1px solid #a855f7' : '1px solid var(--border-subtle)',
                    background: stealthMode ? 'rgba(168, 85, 247, 0.1)' : 'var(--bg-default)',
                    color: stealthMode ? '#a855f7' : 'var(--tx-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                  title={stealthMode ? 'Stealth mode enabled' : 'Enable stealth mode'}
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
              {highlightedElement && Date.now() < highlightedElement.until && (
                <div style={{
                  position: 'absolute',
                  top: 12,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  padding: '6px 12px',
                  borderRadius: 20,
                  background: 'rgba(168, 85, 247, 0.9)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  animation: 'pulse 1s infinite',
                }}>
                  <span style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#fff',
                  }} />
                  Clicked: {highlightedElement.selector}
                </div>
              )}

              {/* Agent driving overlay */}
              {agentDriving && (
                <div style={{
                  position: 'absolute',
                  top: highlightedElement ? 48 : 12,
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

        {/* History sidebar */}
        {showHistory && (
          <div style={{
            width: 240,
            background: 'var(--bg-elevated)',
            borderLeft: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 12px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 12,
              fontWeight: 600,
              color: 'var(--tx-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}>
              Browse History
            </div>
            <div style={{
              flex: 1,
              overflowY: 'auto',
            }}>
              {history.length === 0 ? (
                <div style={{
                  padding: 12,
                  textAlign: 'center',
                  fontSize: 12,
                  color: 'var(--tx-dim)',
                }}>
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
                      padding: '8px 12px',
                      textAlign: 'left',
                      border: 'none',
                      background: index === historyIndex ? 'var(--accent-container)' : 'transparent',
                      color: index === historyIndex ? 'var(--accent)' : 'var(--tx-secondary)',
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 2,
                      borderBottom: '1px solid var(--border-subtle)',
                    }}
                    onMouseEnter={(e) => {
                      if (index !== historyIndex) {
                        e.currentTarget.style.background = 'var(--bg-hover)'
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
                      fontSize: 11,
                      opacity: 0.7,
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
