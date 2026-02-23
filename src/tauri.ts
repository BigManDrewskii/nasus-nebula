// Tauri API wrappers that gracefully no-op when running outside the Tauri runtime

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

export async function tauriInvoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!isTauri) {
    console.warn(`[nasus] invoke('${cmd}') called outside Tauri — no-op`)
    return undefined as unknown as T
  }
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke<T>(cmd, args)
}

export async function tauriListen<T>(
  event: string,
  handler: (payload: T) => void,
): Promise<() => void> {
  if (!isTauri) {
    return () => {}
  }
  const { listen } = await import('@tauri-apps/api/event')
  const unlisten = await listen<T>(event, (e) => handler(e.payload))
  return unlisten
}
