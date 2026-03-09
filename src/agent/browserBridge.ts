/**
 * browserBridge.ts
 * Communicates with the Nasus browser automation via Tauri backend.
 *
 * Session architecture: one persistent WebSocket connection per session,
 * managed in the Rust sidecar layer. The TS side just invokes Tauri commands
 * and holds a single session ID for the lifetime of the agent run.
 */

import { tauriInvoke, tauriInvokeOrThrow } from '../tauri'
import { createLogger } from '../lib/logger'

const log = createLogger('browserBridge')

// Shared session ID for all browser operations in this agent run
let tauriSessionId: string | null = null

/** Emit browser activity event for UI to open browser panel */
function emitBrowserActivity(type: string, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('nasus:browser-activity', {
    detail: { type, ...detail }
  }))
}

/** Ensure the sidecar process is running */
async function ensureSidecarRunning(): Promise<void> {
  const isRunning = await tauriInvoke<boolean>('browser_is_sidecar_running')
  if (isRunning) return

  log.info('Starting browser sidecar...')
  await tauriInvoke('browser_start_sidecar')
  // Give the Node.js process time to bind the WebSocket port
  await new Promise(resolve => setTimeout(resolve, 1000))
  log.info('Browser sidecar started')
  emitBrowserActivity('sidecar_started')
}

/** Get (or create) the persistent session for this agent run */
async function getTauriSession(): Promise<string> {
  await ensureSidecarRunning()

  if (!tauriSessionId) {
    try {
      const result = await tauriInvoke<{ session_id: string }>('browser_start_session')
      if (!result?.session_id) throw new Error('No session ID returned from browser_start_session')
      tauriSessionId = result.session_id
      emitBrowserActivity('session_started', { sessionId: tauriSessionId })
      log.info('Browser session created:', tauriSessionId)
    } catch (err) {
      log.error('Failed to create browser session', err)
      throw new Error(`Failed to create browser session: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return tauriSessionId
}

/** Expose the current session ID for tools that need it directly */
export async function getTauriSessionId(): Promise<string> {
  return getTauriSession()
}

/** Check if the browser sidecar is running */
export async function pingExtension(): Promise<boolean> {
  try {
    return (await tauriInvoke<boolean>('browser_is_sidecar_running')) ?? false
  } catch {
    return false
  }
}

// ─── Navigate ─────────────────────────────────────────────────────────────────

export interface NavigateResult {
  success: boolean
  tabId: number
  url: string
  title: string
  status?: number
}

export async function browserNavigate(
  url: string,
  _newTab = false,
  timeoutMs?: number,
): Promise<NavigateResult> {
  const sessionId = await getTauriSession()
  emitBrowserActivity('navigate', { url, sessionId })
  const params: Record<string, unknown> = { sessionId, url }
  if (timeoutMs) params.timeoutMs = timeoutMs
  const response = await tauriInvoke<{ url?: string; title?: string; status?: number }>(
    'browser_navigate', params
  )
  return {
    success: true,
    tabId: 0,
    url: response?.url ?? url,
    title: response?.title ?? '',
    status: response?.status,
  }
}

// ─── Click ────────────────────────────────────────────────────────────────────

export interface ClickResult {
  success?: boolean
  clicked?: boolean
  error?: string
  tag?: string
  text?: string
  href?: string
  selector?: string
  x?: number
  y?: number
}

export async function browserClick(
  params: { tabId?: number; selector?: string; x?: number; y?: number }
): Promise<ClickResult> {
  const sessionId = await getTauriSession()
  emitBrowserActivity('click', { selector: params.selector })
  // browser_click now returns serde_json::Value (was () which became null)
  const result = await tauriInvokeOrThrow<ClickResult>(
    'browser_click',
    { sessionId, selector: params.selector, x: params.x, y: params.y }
  )
  return result ?? { success: true, clicked: true }
}

// ─── Type ─────────────────────────────────────────────────────────────────────

export interface TypeResult {
  success: boolean
  typed: string
}

export async function browserType(
  params: { tabId?: number; selector?: string; text: string; clearFirst?: boolean }
): Promise<TypeResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<TypeResult>('browser_type', { sessionId, ...params })
}

// ─── Extract ──────────────────────────────────────────────────────────────────

export interface ExtractResult {
  url: string
  title: string
  content: string
  length: number
  readyState?: string
  error?: string
}

export async function browserExtract(
  params: { tabId?: number; selector?: string }
): Promise<ExtractResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<ExtractResult>('browser_extract', { sessionId, ...params })
}

/** Read a page in one call: navigate + wait + extract (Markdown). */
export async function browserReadPage(params: {
  url: string
  timeoutMs?: number
  selector?: string
}): Promise<ExtractResult> {
  const sessionId = await getTauriSession()
  emitBrowserActivity('read_page', { url: params.url, sessionId })
  return await tauriInvokeOrThrow<ExtractResult>('browser_read_page', { sessionId, ...params })
}

// ─── Screenshot ───────────────────────────────────────────────────────────────

export interface ScreenshotResult {
  success: boolean
  dataUrl: string
}

export async function browserScreenshot(
  params: { tabId?: number; fullPage?: boolean }
): Promise<ScreenshotResult> {
  const sessionId = await getTauriSession()
  const dataUrl = await tauriInvokeOrThrow<string>('browser_screenshot', {
    sessionId,
    full_page: params.fullPage ?? false,
  })
  return { success: true, dataUrl }
}

// ─── Scroll ───────────────────────────────────────────────────────────────────

export interface ScrollResult {
  success: boolean
  scrolled: number
}

export async function browserScroll(
  params: { tabId?: number; direction: 'up' | 'down'; amount?: number }
): Promise<ScrollResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<ScrollResult>('browser_scroll', { sessionId, ...params })
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

export interface TabInfo {
  id: number
  url: string
  title: string
  active: boolean
}

export async function browserGetTabs(): Promise<TabInfo[]> {
  const sessionId = await getTauriSession()
  const result = await tauriInvokeOrThrow<{ tabs: TabInfo[] }>('browser_get_tabs', { sessionId })
  return result.tabs ?? []
}

// ─── Wait For ─────────────────────────────────────────────────────────────────

export interface WaitForResult {
  success: boolean
  matched?: 'selector' | 'url'
  selector?: string
  url?: string
  error?: string
}

export async function browserWaitFor(
  params: { tabId?: number; selector?: string; urlPattern?: string; timeoutMs?: number }
): Promise<WaitForResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<WaitForResult>('browser_wait_for', { sessionId, ...params })
}

// ─── Eval ─────────────────────────────────────────────────────────────────────

export interface EvalResult {
  success?: boolean
  result?: unknown
  error?: string
}

export async function browserEval(
  params: { tabId?: number; expression: string; awaitPromise?: boolean }
): Promise<EvalResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<EvalResult>('browser_execute', { sessionId, ...params })
}

// ─── Select ───────────────────────────────────────────────────────────────────

export interface SelectResult {
  success?: boolean
  selectedValue?: string
  error?: string
}

export async function browserSelect(
  params: { tabId?: number; selector: string; value?: string | number; label?: string }
): Promise<SelectResult> {
  const sessionId = await getTauriSession()
  const { selector, value, label } = params
  return await tauriInvokeOrThrow<SelectResult>('browser_select', {
    sessionId,
    selector,
    value: value !== undefined ? String(value) : undefined,
    label,
  })
}
