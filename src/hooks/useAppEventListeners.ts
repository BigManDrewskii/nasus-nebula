import { useEffect } from 'react'
import { useAppStore } from '../store'
import type { Tab } from '../components/OutputPanel'

interface AppEventHandlers {
  setRightCollapsed: (value: boolean | ((prev: boolean) => boolean)) => void
  setRightActiveTab: (tab: Tab) => void
  setPruneNotice: (msg: string | null) => void
  setMemoryBrowserOpen: (open: boolean) => void
  setIsOffline: (offline: boolean) => void
}

/**
 * Registers all app-level window event listeners in one place.
 * Keeps App.tsx free of boilerplate addEventListener/removeEventListener blocks.
 */
export function useAppEventListeners({
  setRightCollapsed,
  setRightActiveTab,
  setPruneNotice,
  setMemoryBrowserOpen,
  setIsOffline,
}: AppEventHandlers) {
  const setBrowserActivityActive = useAppStore((s) => s.setBrowserActivityActive)
  const addToast = useAppStore((s) => s.addToast)

  // Browser activity → auto-open browser panel
  useEffect(() => {
    const handler = () => {
      setBrowserActivityActive(true)
      setRightCollapsed(false)
      setRightActiveTab('browser')
    }
    window.addEventListener('nasus:browser-activity', handler)
    return () => window.removeEventListener('nasus:browser-activity', handler)
  }, [setBrowserActivityActive, setRightCollapsed, setRightActiveTab])

  // Tasks pruned → show temporary notice
  useEffect(() => {
    const handler = (e: Event) => {
      const count = (e as CustomEvent).detail?.count ?? 1
      const msg = `${count} oldest task${count > 1 ? 's were' : ' was'} removed to stay under the 50-task limit.`
      setPruneNotice(msg)
      setTimeout(() => setPruneNotice(null), 5000)
    }
    window.addEventListener('nasus:tasks-pruned', handler)
    return () => window.removeEventListener('nasus:tasks-pruned', handler)
  }, [setPruneNotice])

  // Preview ready → switch to preview tab
  useEffect(() => {
    const handler = () => {
      setRightActiveTab('preview')
      setRightCollapsed(false)
    }
    window.addEventListener('nasus:preview-ready', handler)
    return () => window.removeEventListener('nasus:preview-ready', handler)
  }, [setRightActiveTab, setRightCollapsed])

  // Open memory browser
  useEffect(() => {
    const handler = () => setMemoryBrowserOpen(true)
    window.addEventListener('nasus:open-memory-browser', handler)
    return () => window.removeEventListener('nasus:open-memory-browser', handler)
  }, [setMemoryBrowserOpen])

  // Free limit warning → amber toast
  useEffect(() => {
    const handler = (e: Event) => {
      const remaining = (e as CustomEvent).detail?.remaining
      const msg = typeof remaining === 'number'
        ? `${remaining} free request${remaining !== 1 ? 's' : ''} remaining on this model.`
        : 'Approaching free tier request limit.'
      addToast(msg, 'amber')
    }
    window.addEventListener('nasus:free-limit-warning', handler)
    return () => window.removeEventListener('nasus:free-limit-warning', handler)
  }, [addToast])

  // Offline / online
  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline  = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [setIsOffline])
}
