/**
 * Global type definitions for external APIs (Chrome Extension, Tauri).
 * These types eliminate the need for `as any` casts throughout the codebase.
 */

declare global {
  interface Window {
    // Chrome Extension API (Manifest V3)
    chrome?: {
      runtime: {
        sendMessage: (
          extensionId: string,
          message: unknown,
          callback?: (response: unknown) => void
        ) => void
        lastError: { message: string } | undefined
      }
    }

    // Tauri internal APIs (multiple possible locations)
    __TAURI_INTERNALS__?: {
      invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
    }

    __TAURI__?: {
      invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
    }

    external?: {
      invoke?: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>
    }
  }
}

export {}
