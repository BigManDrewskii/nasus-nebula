/**
 * BrowserPreview.tsx
 *
 * Live browser preview panel for Nasus.
 * Shows the browser session with screenshots, URL bar, and controls.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { Pxi } from './Pxi'
import { SidecarPrompt } from './SidecarPrompt'
import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'
import { createLogger } from '../lib/logger'

const log = createLogger('BrowserPreview')

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
  const { sidecarInstalled, sidecarPromptShown, checkSidecarInstalled, setSidecarInstalled } = useAppStore()
  const [sidecarStatus, setSidecarStatus] = useState<SidecarStatus>('stopped')
  const [showPrompt, setShowPrompt] = useState(false)
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

  // Connect to the sidecar WebSocket
  const connectWebSocket = useCallback((wsUrl: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return
    }

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
        log.info('WebSocket connected')
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
          log.error('Failed to parse WebSocket message', err)
      }
    }

    ws.onerror = () => {
      log.error('WebSocket error')
      setError('WebSocket connection error')
    }

    ws.onclose = () => {
      log.info('WebSocket disconnected')
      if (screenshotIntervalRef.current) {
        clearInterval(screenshotIntervalRef.current)
        screenshotIntervalRef.current = null
      }
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [connectWebSocket])

  const startSessionRef = useRef(startSession)
  useEffect(() => { startSessionRef.current = startSession }, [startSession])

  const startSidecar = useCallback(async () => {
    if (!sidecarInstalled) {
      const isInstalled = await checkSidecarInstalled()
      if (!isInstalled && !sidecarPromptShown) {
        setShowPrompt(true)
        return
      }
    }

    setSidecarStatus('starting')
    setError(null)

    try {
      await tauriInvoke('browser_start_sidecar')
      setSidecarStatus('running')
      setTimeout(() => { startSessionRef.current() }, 1000)
    } catch (err) {
      setError(err as string)
      setSidecarStatus('error')
    }
  }, [sidecarInstalled, sidecarPromptShown, checkSidecarInstalled])

  const stopSidecar = useCallback(async () => {
    try {
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
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

  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'connected':
          log.info('Sidecar connected', { sessionId: message.sessionId })
        break
      case 'session_ready':
          log.info('Session ready', { sessionId: message.sessionId })
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
        setHistory((prev) => {
          const newEntry: HistoryEntry = {
            url: message.url,
            title: message.title || message.url,
            timestamp: Date.now(),
          }
          if (prev.length > 0 && prev[prev.length - 1].url === message.url) {
            return prev
          }
          return [...prev, newEntry]
        })
        setHistoryIndex((prev) => prev + 1)
        break
      case 'click_result':
        if (message.selector) {
          setHighlightedElement({ selector: message.selector, until: Date.now() + 2000 })
          if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
          highlightTimeoutRef.current = window.setTimeout(() => setHighlightedElement(null), 2000)
        }
        break
      case 'error':
        setError(message.message)
        setIsLoading(false)
        break
      case 'heartbeat':
        break
      default:
          log.debug('Unhandled message type', { type: message.type })
    }
  }, [])

  const navigate = useCallback(async (url: string) => {
    if (!session) return
    const normalizedUrl = normalizeUrl(url)
    setIsLoading(true)
    setCurrentUrl(normalizedUrl)
    setUrlInputValue(normalizedUrl)

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'navigate', params: { url: normalizedUrl } }))
    } else {
      try {
        const result = await tauriInvoke<string>('browser_navigate', { sessionId: session.session_id, url: normalizedUrl })
        if (result) setCurrentUrl(result)
      } catch (err) {
        setError(err as string)
        setIsLoading(false)
      }
    }
  }, [session, normalizeUrl])

  const handleSubmitUrl = useCallback(() => {
    if (urlInputValue.trim()) navigate(urlInputValue)
  }, [urlInputValue, navigate])

  const goBack = useCallback(() => {
    if (historyIndex > 0) { navigate(history[historyIndex - 1].url); setHistoryIndex(historyIndex - 1) }
  }, [history, historyIndex, navigate])

  const goForward = useCallback(() => {
    if (historyIndex < history.length - 1) { navigate(history[historyIndex + 1].url); setHistoryIndex(historyIndex + 1) }
  }, [history, historyIndex, navigate])

  const toggleStealth = useCallback(async () => {
    if (!session) return
    const newStealthMode = !stealthMode
    try {
      await tauriInvoke('browser_set_stealth', { sessionId: session.session_id, enabled: newStealthMode })
      setStealthMode(newStealthMode)
    } catch (err) { setError(err as string) }
  }, [session, stealthMode])

  const takeControl = useCallback(() => { setUserInControl(true); setAgentDriving(false) }, [])
  const releaseControl = useCallback(() => { setUserInControl(false) }, [])
  const refreshScreenshot = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'screenshot', params: {} }))
    }
  }, [])

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close()
      if (screenshotIntervalRef.current) clearInterval(screenshotIntervalRef.current)
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    const handleBrowserActivity = (e: Event) => {
      const detail = (e as CustomEvent).detail as { type: string; sessionId?: string }
      if (detail.type === 'session_started' && detail.sessionId) {
        const agentSessionId = detail.sessionId
        const wsUrl = `ws://localhost:4750/ws/${agentSessionId}`
        setSession({ session_id: agentSessionId, websocket_url: wsUrl })
        setSidecarStatus('running')
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) connectWebSocket(wsUrl)
      } else if (detail.type === 'navigate' && detail.sessionId) {
        if (!session || session.session_id !== detail.sessionId) {
          const wsUrl = `ws://localhost:4750/ws/${detail.sessionId}`
          setSession({ session_id: detail.sessionId, websocket_url: wsUrl })
          if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) connectWebSocket(wsUrl)
        }
        setAgentDriving(true)
      } else if (['click', 'type', 'scroll'].includes(detail.type)) {
        setAgentDriving(true)
      }
    }
    window.addEventListener('nasus:browser-activity', handleBrowserActivity)
    return () => window.removeEventListener('nasus:browser-activity', handleBrowserActivity)
  }, [session, connectWebSocket])

  const agentDrivingTimerRef = useRef<number | null>(null)
  useEffect(() => {
    if (agentDriving && !userInControl) {
      if (agentDrivingTimerRef.current) clearTimeout(agentDrivingTimerRef.current)
      agentDrivingTimerRef.current = window.setTimeout(() => setAgentDriving(false), 3000)
    }
    return () => { if (agentDrivingTimerRef.current) clearTimeout(agentDrivingTimerRef.current) }
  }, [agentDriving, userInControl])

  const isHighlightActive = highlightedElement && Date.now() < highlightedElement.until

  const statusDotColor =
    sidecarStatus === 'running'  ? '#22c55e' :
    sidecarStatus === 'starting' ? 'var(--amber)' :
    sidecarStatus === 'error'    ? '#ef4444' :
    'var(--tx-dim)'

  return (
    <div className={`browser-preview bp-root ${className}`}>
      {/* Header */}
      <div className="bp-header">
        {/* Status indicator */}
        <div className="bp-status-dot" style={{ background: statusDotColor }} />

        {/* Controls */}
        {sidecarStatus === 'stopped' && (
          <button onClick={startSidecar} className="bp-btn bp-btn--primary">
            <Pxi name="globe" size={12} />
            Start Browser
          </button>
        )}

        {sidecarStatus === 'running' && (
          <>
            {session && (
              <>
                {/* Back/Forward */}
                <div className="bp-nav-btns">
                  <button
                    onClick={goBack}
                    disabled={historyIndex <= 0}
                    style={{ opacity: historyIndex > 0 ? 1 : 0.4, cursor: historyIndex > 0 ? 'pointer' : 'not-allowed' }}
                    className="bp-btn bp-btn--ghost bp-nav-btn"
                    title="Back"
                  >
                    <Pxi name="angle-left" size={12} />
                  </button>
                  <button
                    onClick={goForward}
                    disabled={historyIndex >= history.length - 1}
                    style={{ opacity: historyIndex < history.length - 1 ? 1 : 0.4, cursor: historyIndex < history.length - 1 ? 'pointer' : 'not-allowed' }}
                    className="bp-btn bp-btn--ghost bp-nav-btn"
                    title="Forward"
                  >
                    <Pxi name="angle-right" size={12} />
                  </button>
                </div>

                {/* URL bar */}
                <div className="bp-url-bar">
                  <input
                    type="text"
                    value={urlInputValue}
                    onChange={(e) => setUrlInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSubmitUrl() }}
                    placeholder="example.com or https://..."
                    disabled={isLoading}
                    className="bp-url-input"
                  />
                  {isLoading && <div className="bp-spinner" />}
                </div>

                <button
                  onClick={handleSubmitUrl}
                  disabled={isLoading || !urlInputValue.trim()}
                  className="bp-btn bp-btn--secondary"
                  style={{ opacity: (isLoading || !urlInputValue.trim()) ? 0.5 : 1, cursor: (isLoading || !urlInputValue.trim()) ? 'not-allowed' : 'pointer' }}
                >
                  Go
                </button>

                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className={`bp-btn bp-btn--secondary${showHistory ? ' bp-btn--active' : ''}`}
                  title="Browse history"
                >
                  <Pxi name="clock" size={12} />
                  History
                  {history.length > 0 && (
                    <span className="bp-history-count">{history.length}</span>
                  )}
                </button>

                <button
                  onClick={toggleStealth}
                  className={`bp-btn bp-btn--secondary${stealthMode ? ' bp-btn--stealth' : ''}`}
                  title={stealthMode ? 'Stealth mode enabled' : 'Enable stealth mode'}
                >
                  <span
                    className="bp-stealth-dot"
                    style={{ background: stealthMode ? '#a855f7' : 'var(--tx-dim)' }}
                  />
                  {stealthMode ? 'Stealth' : 'Normal'}
                </button>

                <button onClick={refreshScreenshot} className="bp-btn bp-btn--ghost" title="Refresh screenshot">
                  <Pxi name="refresh" size={12} />
                </button>

                {userInControl ? (
                  <button onClick={releaseControl} className="bp-btn bp-btn--release">
                    <Pxi name="check" size={12} />
                    Release
                  </button>
                ) : (
                  <button
                    onClick={takeControl}
                    disabled={agentDriving}
                    className="bp-btn bp-btn--secondary"
                    style={{ opacity: agentDriving ? 0.5 : 1, cursor: agentDriving ? 'not-allowed' : 'pointer' }}
                    title="Take manual control of browser"
                  >
                    <Pxi name="user" size={12} />
                    Take Control
                  </button>
                )}
              </>
            )}

            <button onClick={stopSidecar} className="bp-btn bp-btn--danger bp-stop-btn">
              <Pxi name="times" size={12} />
              Stop
            </button>
          </>
        )}

        {sidecarStatus === 'starting' && (
          <div className="bp-starting">
            <div className="bp-spinner" />
            Starting browser...
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bp-error-bar">
          <Pxi name="times-circle" size={14} />
          <span className="bp-error-text">{error}</span>
          <button onClick={() => setError(null)} className="bp-error-dismiss">
            <Pxi name="times" size={12} />
          </button>
        </div>
      )}

      {/* Sidecar installation prompt */}
      {showPrompt && (
        <SidecarPrompt
          onInstallComplete={() => {
            setShowPrompt(false)
            setSidecarInstalled(true)
            startSidecar()
          }}
          onSkip={() => setShowPrompt(false)}
        />
      )}

      {/* Main content area */}
      {!showPrompt && (
        <div className="bp-content">
          {/* Browser preview area */}
          <div className="bp-viewport">
            {screenshot ? (
              <>
                <img src={screenshot} alt="Browser preview" className="bp-screenshot" />

                {/* Element highlighting overlay */}
                {isHighlightActive && (
                  <div className="bp-highlight-overlay">
                    <span className="bp-highlight-dot" />
                    <span>Clicked: </span>
                    <code className="bp-highlight-selector">
                      {highlightedElement.selector}
                    </code>
                  </div>
                )}

                {/* Agent driving overlay */}
                {agentDriving && (
                  <div
                    className="bp-agent-driving"
                    style={{ top: isHighlightActive ? 'var(--space-10)' : 'var(--space-3)' }}
                  >
                    <span className="bp-agent-dot" />
                    Agent is driving
                  </div>
                )}
              </>
            ) : (
              <div className="preview-empty">
                <Pxi name="globe" size={28} style={{ color: 'var(--tx-dim)', marginBottom: 12 }} />
                <span className="bp-empty-title">
                  {sidecarStatus === 'running' ? 'Enter a URL to browse' : 'Browser not started'}
                </span>
                <span className="bp-empty-subtitle">
                  {sidecarStatus === 'running'
                    ? 'Type a URL above and press Enter,\nor let the agent navigate for you.'
                    : 'Click "Start Browser" above to launch\nthe agent-controlled browser session.'}
                </span>
              </div>
            )}
          </div>

          {/* History sidebar */}
          {showHistory && (
            <div className="bp-history-sidebar">
              <div className="bp-history-header">
                <Pxi name="clock" size={12} />
                Browse History
              </div>
              <div className="bp-history-list">
                {history.length === 0 ? (
                  <div className="bp-history-empty">
                    <Pxi name="clock" size={20} style={{ opacity: 0.3, marginBottom: 'var(--space-2)' }} />
                    No history yet
                  </div>
                ) : (
                    history.map((entry, index) => (
                      <button
                        key={entry.timestamp}
                        onClick={() => { navigate(entry.url); setHistoryIndex(index) }}
                        className={`bp-history-item${index === historyIndex ? ' active' : ''}`}
                        style={{
                          background: index === historyIndex ? 'var(--sidebar-active-bg)' : 'transparent',
                          color: index === historyIndex ? 'var(--tx-primary)' : 'var(--tx-secondary)',
                        }}
                      >
                      <span className="bp-history-title" style={{ fontWeight: index === historyIndex ? 500 : 400 }}>
                        {entry.title}
                      </span>
                      <span className="bp-history-url">{entry.url}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
