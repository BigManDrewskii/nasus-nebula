/**
 * browserBridge.ts
 * Communicates with the Nasus Browser Bridge Chrome extension OR Tauri backend.
 *
 * - In Tauri (desktop app): routes to Rust backend with Node.js sidecar
 * - In browser: uses Chrome extension via chrome.runtime.sendMessage
 */

import { tauriInvoke } from '../tauri'

// Detect if running in Tauri desktop app
const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

// The extension ID is fixed via the manifest key field.
// In development, the user loads the extension unpacked and the ID may vary —
// we store it in localStorage after first connection so the user only sets it once.
const STORAGE_KEY = "nasus_extension_id";
const STORAGE_KEY_CANDIDATES = "nasus_extension_id_candidates";
const DEFAULT_EXTENSION_ID = ""; // populated after first successful ping or user sets it

// Common unpacked extension ID patterns for development
// Chrome generates these deterministically based on the extension path
const DEV_EXTENSION_ID_PATTERNS: string[] = [
  // Add your local extension ID here when developing
  // Chrome generates: 32-character alphanumeric string
  // You can find it at chrome://extensions when loaded unpacked
];

// Default timeout for all extension calls (ms). Most operations should be fast;
// navigate + waitForLoad can take longer so callers may override.
const DEFAULT_TIMEOUT_MS = 20_000;

export function getExtensionId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_EXTENSION_ID;
}

export function setExtensionId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id.trim());
}

function getCandidateIds(): string[] {
  const stored = localStorage.getItem(STORAGE_KEY_CANDIDATES);
  return stored ? JSON.parse(stored) : [...DEV_EXTENSION_ID_PATTERNS];
}

function addCandidateId(id: string): void {
  const candidates = getCandidateIds();
  if (!candidates.includes(id)) {
    candidates.push(id);
    localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(candidates));
  }
}

/** Returns true if the Chrome extension runtime API is available */
function hasChromeRuntime(): boolean {
  // In Tauri, we use the backend, not the extension
  if (isTauri) return false;

  const available = typeof window !== "undefined" &&
    typeof (window as any).chrome !== "undefined" &&
    typeof (window as any).chrome.runtime !== "undefined";
  console.log("[browserBridge] Chrome runtime available:", available);
  if (available) {
    console.log("[browserBridge] chrome.runtime.sendMessage exists:", typeof (window as any).chrome.runtime.sendMessage);
  }
  return available;
}

// Log startup status
setTimeout(() => {
  console.log("[browserBridge] Startup check:");
  console.log("  - window.chrome exists:", typeof (window as any).chrome !== "undefined");
  console.log("  - chrome.runtime exists:", typeof (window as any).chrome?.runtime !== "undefined");
  console.log("  - chrome.runtime.sendMessage exists:", typeof (window as any).chrome?.runtime?.sendMessage);
  console.log("  - Stored extension ID:", getExtensionId());
  console.log("  - Current page origin:", window.location.origin);
}, 1000);

/**
 * Auto-detect extension by trying all candidate IDs.
 * Returns the detected ID or null if none work.
 */
export async function autoDetectExtensionId(): Promise<string | null> {
  if (!hasChromeRuntime()) {
    return null;
  }

  const candidates = getCandidateIds();

  for (const id of candidates) {
    if (!id) continue;

    try {
      const response = await testExtensionId(id, 2000);
      if (response?.pong === true) {
        addCandidateId(id); // Remember this working ID for future
        setExtensionId(id);
        return id;
      }
    } catch {
      // This ID didn't work, try next one
      continue;
    }
  }

  return null;
}

/**
 * Test a specific extension ID with a ping.
 */
async function testExtensionId(extId: string, timeoutMs = 2000): Promise<{ pong?: boolean } | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    (window as any).chrome.runtime.sendMessage(
      extId,
      { action: "ping" },
      (response: any) => {
        clearTimeout(timer);
        const err = (window as any).chrome.runtime.lastError;
        if (err) {
          resolve(null);
          return;
        }
        resolve(response);
      }
    );
  });
}

/** Send a message to the extension. Rejects with a user-friendly error if unavailable. */
async function send<T>(
  action: string,
  params: Record<string, unknown> = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  if (!hasChromeRuntime()) {
    throw new Error(
      "Browser extension not available. Please:\n" +
      "1. Install the Nasus Browser Bridge extension from browser-extension/\n" +
      "2. Load it unpacked in Chrome (chrome://extensions → Developer mode → Load unpacked)\n" +
      "3. Copy the extension ID and paste it in Settings → Browser Access"
    );
  }

  const extId = getExtensionId();
  if (!extId) {
    throw new Error(
      "Nasus Browser Bridge extension ID not configured.\n\n" +
      "To set up:\n" +
      "1. Go to chrome://extensions\n" +
      "2. Enable 'Developer mode'\n" +
      "3. Click 'Load unpacked' and select the browser-extension/ folder\n" +
      "4. Copy the Extension ID (32-character string like 'abcdefghijklmnopqrstabcdefghijkl')\n" +
      "5. Paste it in Settings → Browser Access → Extension ID"
    );
  }

  // Quick pre-flight check for expensive operations to fail fast
  // This prevents long timeouts if the extension is not responding
  if (["browser_navigate", "browser_screenshot", "browser_extract"].includes(action)) {
    try {
      const quickCheck = await testExtensionId(extId, 2000);
      if (!quickCheck?.pong) {
        throw new Error(
          "Extension is not responding. Please check that:\n" +
          "- The Nasus Browser Bridge extension is enabled at chrome://extensions\n" +
          "- The Extension ID in Settings matches the one shown in chrome://extensions\n" +
          "- Try clicking 'Test' in Settings → Browser Access"
        );
      }
    } catch {
      throw new Error(
        "Extension is not responding. Please check that:\n" +
        "- The Nasus Browser Bridge extension is enabled at chrome://extensions\n" +
        "- The Extension ID in Settings matches the one shown in chrome://extensions\n" +
        "- Try clicking 'Test' in Settings → Browser Access"
      );
    }
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Extension call '${action}' timed out after ${timeoutMs / 1000}s.\n\n` +
        `The extension may be hung. Try:\n` +
        `- Reloading the extension at chrome://extensions\n` +
        `- Refreshing this page and trying again`));
    }, timeoutMs);

    (window as any).chrome.runtime.sendMessage(
      extId,
      { action, params },
      (response: any) => {
        clearTimeout(timer);
        const err = (window as any).chrome.runtime.lastError;
        if (err) {
          reject(new Error(
            "Extension not reachable: " + err.message + "\n\n" +
            "Make sure:\n" +
            "- The Nasus Browser Bridge extension is installed and enabled\n" +
            "- The Extension ID in Settings matches the one at chrome://extensions\n" +
            "- You've refreshed this page after installing the extension"
          ));
          return;
        }
        if (response?.error) {
          reject(new Error("Extension error: " + response.error));
          return;
        }
        resolve(response?.result as T);
      }
    );
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

// For Tauri, we use a shared session ID for all browser operations
let tauriSessionId: string | null = null;

async function getTauriSession(): Promise<string> {
  if (!tauriSessionId) {
    try {
      const result = await tauriInvoke<{ session_id: string }>('browser_start_session');
      if (result) {
        tauriSessionId = result.session_id;
      } else {
        throw new Error('No session ID returned');
      }
    } catch (err) {
      console.error('[browserBridge] Failed to create session:', err);
      throw new Error('Failed to create browser session');
    }
  }
  return tauriSessionId;
}

/** Check if the extension/sidecar is installed and responding */
export async function pingExtension(): Promise<boolean> {
  // In Tauri, check if the sidecar is running
  if (isTauri) {
    try {
      return (await tauriInvoke<boolean>('browser_is_sidecar_running')) ?? false;
    } catch {
      return false;
    }
  }

  // In browser, use the extension
  try {
    const extId = getExtensionId();
    console.log("[browserBridge] Pinging extension ID:", extId);
    const res = await send<{ pong: boolean }>("ping", {}, 3000);
    console.log("[browserBridge] Ping response:", res);
    return res?.pong === true;
  } catch (err) {
    console.log("[browserBridge] Ping failed:", err);
    return false;
  }
}

export interface NavigateResult {
  success: boolean;
  tabId: number;
  url: string;
  title: string;
}

export async function browserNavigate(url: string, newTab = false): Promise<NavigateResult> {
  if (isTauri) {
    const sessionId = await getTauriSession();
    await tauriInvoke('browser_navigate', { sessionId, url });
    // For now, return a basic result. In Phase 2, we'll get the actual result from WebSocket
    return {
      success: true,
      tabId: 0,
      url,
      title: '',
    };
  }
  // Navigation can be slow — give it extra time
  return send<NavigateResult>("browser_navigate", { url, newTab }, 30_000);
}

export interface ClickResult {
  success?: boolean;
  error?: string;
  tag?: string;
  text?: string;
}

export async function browserClick(
  params: { tabId?: number; selector?: string; x?: number; y?: number }
): Promise<ClickResult> {
  return send<ClickResult>("browser_click", params);
}

export interface TypeResult {
  success: boolean;
  typed: string;
}

export async function browserType(
  params: { tabId?: number; selector?: string; text: string; clearFirst?: boolean }
): Promise<TypeResult> {
  return send<TypeResult>("browser_type", params);
}

export interface ExtractResult {
  url: string;
  title: string;
  content: string;
  length: number;
  readyState?: string;
  error?: string;
}

export async function browserExtract(
  params: { tabId?: number; selector?: string }
): Promise<ExtractResult> {
  return send<ExtractResult>("browser_extract", params);
}

export interface ScreenshotResult {
  success: boolean;
  dataUrl: string;
}

export async function browserScreenshot(
  params: { tabId?: number; fullPage?: boolean }
): Promise<ScreenshotResult> {
  if (isTauri) {
    const sessionId = await getTauriSession();
    const dataUrl = await tauriInvoke<string>('browser_screenshot', {
      sessionId,
      fullPage: params.fullPage ?? false,
    });
    return {
      success: true,
      dataUrl: dataUrl ?? 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    };
  }
  return send<ScreenshotResult>("browser_screenshot", params, 30_000);
}

export interface ScrollResult {
  success: boolean;
  scrolled: number;
}

export async function browserScroll(
  params: { tabId?: number; direction: "up" | "down"; amount?: number }
): Promise<ScrollResult> {
  return send<ScrollResult>("browser_scroll", params);
}

export interface TabInfo {
  id: number;
  url: string;
  title: string;
  active: boolean;
}

export async function browserGetTabs(): Promise<TabInfo[]> {
  return send<TabInfo[]>("browser_get_tabs", {});
}

export interface WaitForResult {
  success: boolean;
  matched?: "selector" | "url";
  selector?: string;
  url?: string;
  error?: string;
}

export async function browserWaitFor(
  params: { tabId?: number; selector?: string; urlPattern?: string; timeoutMs?: number }
): Promise<WaitForResult> {
  const timeoutMs = params.timeoutMs ?? 10_000;
  // Add a buffer so the outer Promise timeout doesn't fire before the inner one
  return send<WaitForResult>("browser_wait_for", params, timeoutMs + 3000);
}

export interface EvalResult {
  success?: boolean;
  result?: unknown;
  error?: string;
}

export async function browserEval(
  params: { tabId?: number; expression: string; awaitPromise?: boolean }
): Promise<EvalResult> {
  return send<EvalResult>("browser_eval", params);
}

export interface SelectResult {
  success?: boolean;
  selectedValue?: string;
  error?: string;
}

export async function browserSelect(
  params: { tabId?: number; selector: string; value?: string | number; label?: string }
): Promise<SelectResult> {
  return send<SelectResult>("browser_select", params);
}

// ─── Connection Status ─────────────────────────────────────────────────────────

export interface ExtensionStatus {
  status: string;
  version: string;
  attachedTabs: number[];
  availableActions: string[];
}

export async function getConnectionStatus(): Promise<{
  connected: boolean;
  version?: string;
  attachedTabs?: number[];
  availableActions?: string[];
}> {
  try {
    const result = await send<ExtensionStatus>("status", {}, 2000);
    return {
      connected: true,
      version: result.version,
      attachedTabs: result.attachedTabs,
      availableActions: result.availableActions,
    };
  } catch {
    return { connected: false };
  }
}

let statusPollInterval: number | undefined;

export function startStatusPolling(
  callback: (status: {
    connected: boolean;
    version?: string;
    attachedTabs?: number[];
  }) => void
) {
  const check = async () => {
    const status = await getConnectionStatus();
    callback(status);
  };
  check();
  // Poll every 30 seconds
  statusPollInterval = setInterval(check, 30000) as unknown as number;
}

export function stopStatusPolling() {
  if (statusPollInterval !== undefined) {
    clearInterval(statusPollInterval);
    statusPollInterval = undefined;
  }
}
