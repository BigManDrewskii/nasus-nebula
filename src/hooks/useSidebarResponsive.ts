/**
 * Responsive sidebar hook for window-size-aware sidebar behavior.
 * Provides auto-collapse recommendations based on window width thresholds.
 */

import { useState, useEffect, useMemo } from 'react'

export interface ResponsiveConfig {
  compactThreshold: number  // 1100px - only one sidebar fits
  tightThreshold: number    // 900px - both should collapse
}

export interface SidebarState {
  leftCollapsed: boolean
  rightCollapsed: boolean
}

export interface ResponsiveState extends SidebarState {
  shouldAutoCollapse: boolean
  windowWidth: number
}

const DEFAULT_CONFIG: ResponsiveConfig = {
  compactThreshold: 1100,
  tightThreshold: 900,
}

export interface UseSidebarResponsiveOptions {
  leftManual: boolean
  rightManual: boolean
  userPreference?: 'auto' | 'always-left' | 'always-right' | 'minimal'
  config?: ResponsiveConfig
}

/**
 * Hook for window-responsive sidebar behavior.
 * Returns recommended collapse states based on window size,
 * while respecting user preferences where appropriate.
 */
export function useSidebarResponsive({
  leftManual,
  rightManual,
  userPreference,
  config = DEFAULT_CONFIG,
}: UseSidebarResponsiveOptions): ResponsiveState {
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1200
  )

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const state = useMemo(() => {
    // User preference overrides
    if (userPreference === 'minimal') {
      return { leftCollapsed: true, rightCollapsed: true }
    }
    if (userPreference === 'always-left' && windowWidth >= config.tightThreshold) {
      return { leftCollapsed: false, rightCollapsed: true }
    }
    if (userPreference === 'always-right' && windowWidth >= config.tightThreshold) {
      return { leftCollapsed: true, rightCollapsed: false }
    }

    // Auto behavior based on window width
    if (windowWidth < config.tightThreshold) {
      // Very tight - collapse both
      return { leftCollapsed: true, rightCollapsed: true }
    }
    if (windowWidth < config.compactThreshold) {
      // Compact - only one sidebar, prioritize right (output) by default
      return userPreference === 'always-left'
        ? { leftCollapsed: leftManual, rightCollapsed: true }
        : { leftCollapsed: true, rightCollapsed: rightManual }
    }

    // Spacious - both can be open, respect manual state
    return { leftCollapsed: leftManual, rightCollapsed: rightManual }
  }, [windowWidth, leftManual, rightManual, userPreference, config])

  return {
    ...state,
    shouldAutoCollapse: windowWidth < config.tightThreshold,
    windowWidth,
  }
}

/**
 * Hook to persist and retrieve sidebar preference from localStorage.
 */
export function useSidebarPreference() {
  const [preference, setPreference] = useState<'auto' | 'always-left' | 'always-right' | 'minimal'>('auto')

  useEffect(() => {
    // Load saved preference on mount
    try {
      const saved = localStorage.getItem('sidebar-preference')
      if (saved && ['auto', 'always-left', 'always-right', 'minimal'].includes(saved)) {
        setPreference(saved as typeof preference)
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [])

  const savePreference = (newPreference: typeof preference) => {
    setPreference(newPreference)
    try {
      localStorage.setItem('sidebar-preference', newPreference)
    } catch {
      // Ignore localStorage errors
    }
  }

  return { preference, setPreference: savePreference }
}
