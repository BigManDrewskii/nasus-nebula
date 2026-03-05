/**
 * browserBridge.ts
 * Communicates with the Nasus browser automation via Tauri backend.
 *
 * In Tauri desktop app: routes to Rust backend with Node.js sidecar.
 */

import { tauriInvoke, tauriInvokeOrThrow } from '../tauri'
import { createLogger } from '../lib/logger'

const log = createLogger('browserBridge')

// ─── Public API ───────────────────────────────────────────────────────────────

// Shared session ID for all browser operations
let tauriSessionId: string | null = null

/** Emit browser activity event for UI to open browser panel */
function emitBrowserActivity(type: string, detail?: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent('nasus:browser-activity', {
    detail: { type, ...detail }
  }))
}

/** Ensure the sidecar is running before browser operations */
async function ensureSidecarRunning(): Promise<void> {
  const isRunning = await tauriInvoke<boolean>('browser_is_sidecar_running')
  if (isRunning) return

  // Check if installed first
  const { browserCheckSidecarInstalled } = await import('../tauri')
  const status = await browserCheckSidecarInstalled()
  if (!status.installed) {
    throw new Error(
      'Browser automation requires Chromium (~300MB). Please install it from the browser panel in the right sidebar.'
    )
  }

  log.info('Starting browser sidecar...')
  await tauriInvoke('browser_start_sidecar')
  // Give it a moment to start
  await new Promise(resolve => setTimeout(resolve, 1500))
  log.info('Browser sidecar started')
}

async function getTauriSession(): Promise<string> {
  await ensureSidecarRunning()

  if (!tauriSessionId) {
    try {
      const result = await tauriInvoke<{ session_id: string }>('browser_start_session')
      if (result) {
        tauriSessionId = result.session_id
        emitBrowserActivity('session_started', { sessionId: result.session_id })
      } else {
        throw new Error('No session ID returned')
      }
    } catch (err) {
      log.error('Failed to create session', err)
      throw new Error('Failed to create browser session')
    }
  }
  return tauriSessionId
}

/** Check if the browser sidecar is running */
export async function pingExtension(): Promise<boolean> {
  try {
    return (await tauriInvoke<boolean>('browser_is_sidecar_running')) ?? false
  } catch {
    return false
  }
}

export interface NavigateResult {
  success: boolean
  tabId: number
  url: string
  title: string
}

export async function browserNavigate(url: string, _newTab = false): Promise<NavigateResult> {
  const sessionId = await getTauriSession()
  emitBrowserActivity('navigate', { url })
  await tauriInvoke('browser_navigate', { sessionId, url })
  return {
    success: true,
    tabId: 0,
    url,
    title: '',
  }
}

export interface ClickResult {
  success?: boolean
  error?: string
  tag?: string
  text?: string
}

export async function browserClick(
  params: { tabId?: number; selector?: string; x?: number; y?: number }
): Promise<ClickResult> {
  const sessionId = await getTauriSession()
  emitBrowserActivity('click', { selector: params.selector })
  return await tauriInvokeOrThrow<ClickResult>('browser_click', { sessionId, ...params })
}

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
  return {
    success: true,
    dataUrl,
  }
}

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

export interface TabInfo {
  id: number
  url: string
  title: string
  active: boolean
}

export async function browserGetTabs(): Promise<TabInfo[]> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<TabInfo[]>('browser_get_tabs', { sessionId })
}

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

export interface EvalResult {
  success?: boolean
  result?: unknown
  error?: string
}

export async function browserEval(
  params: { tabId?: number; expression: string; awaitPromise?: boolean }
): Promise<EvalResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<EvalResult>('browser_eval', { sessionId, ...params })
}

export interface SelectResult {
  success?: boolean
  selectedValue?: string
  error?: string
}

export async function browserSelect(
  params: { tabId?: number; selector: string; value?: string | number; label?: string }
): Promise<SelectResult> {
  const sessionId = await getTauriSession()
  return await tauriInvokeOrThrow<SelectResult>('browser_select', { sessionId, ...params })
}
