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
async function send<T>(action: string, params: Record<string, unknown> = {}): Promise<T> {
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
    (window as any).chrome.runtime.sendMessage(
      extId,
      { action, params },
      (response: any) => {
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
    const res = await send<{ pong: boolean }>("ping");
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
  return send<NavigateResult>("browser_navigate", { url, newTab });
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
  return send<ScreenshotResult>("browser_screenshot", params);
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
