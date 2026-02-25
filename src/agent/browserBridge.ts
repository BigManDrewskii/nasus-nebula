/**
 * browserBridge.ts
 * Communicates with the Nasus Browser Bridge Chrome extension.
 * All browser tool calls go through here — gracefully degrades if extension is not installed.
 */

// The extension ID is fixed via the manifest key field.
// In development, the user loads the extension unpacked and the ID may vary —
// we store it in localStorage after first connection so the user only sets it once.
const STORAGE_KEY = "nasus_extension_id";
const DEFAULT_EXTENSION_ID = ""; // populated after first successful ping or user sets it

// Default timeout for all extension calls (ms). Most operations should be fast;
// navigate + waitForLoad can take longer so callers may override.
const DEFAULT_TIMEOUT_MS = 20_000;

export function getExtensionId(): string {
  return localStorage.getItem(STORAGE_KEY) ?? DEFAULT_EXTENSION_ID;
}

export function setExtensionId(id: string): void {
  localStorage.setItem(STORAGE_KEY, id.trim());
}

/** Returns true if the Chrome extension runtime API is available */
function hasChromeRuntime(): boolean {
  return typeof window !== "undefined" &&
    typeof (window as any).chrome !== "undefined" &&
    typeof (window as any).chrome.runtime !== "undefined";
}

/** Send a message to the extension. Rejects with a user-friendly error if unavailable. */
async function send<T>(
  action: string,
  params: Record<string, unknown> = {},
  timeoutMs = DEFAULT_TIMEOUT_MS,
): Promise<T> {
  if (!hasChromeRuntime()) {
    throw new Error(
      "Browser extension not available. Open Nasus in Chrome with the extension installed."
    );
  }

  const extId = getExtensionId();
  if (!extId) {
    throw new Error(
      "Nasus Browser Bridge extension ID not configured. Go to Settings → Browser Access to set it up."
    );
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Extension call '${action}' timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);

    (window as any).chrome.runtime.sendMessage(
      extId,
      { action, params },
      (response: any) => {
        clearTimeout(timer);
        const err = (window as any).chrome.runtime.lastError;
        if (err) {
          reject(new Error(
            "Extension not reachable: " + err.message +
            ". Make sure the Nasus Browser Bridge extension is installed and enabled."
          ));
          return;
        }
        if (response?.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response?.result as T);
      }
    );
  });
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Check if the extension is installed and responding */
export async function pingExtension(): Promise<boolean> {
  try {
    const res = await send<{ pong: boolean }>("ping", {}, 3000);
    return res?.pong === true;
  } catch {
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
