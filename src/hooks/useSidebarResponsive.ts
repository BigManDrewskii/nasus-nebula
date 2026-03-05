/**
 * Responsive sidebar hook for window-size-aware sidebar behavior.
 * Provides auto-collapse recommendations based on window width thresholds.
 *
 * Thresholds for 1280×720 minimum window size:
 * - Below 1280px: Collapse both panels (tight mode)
 * - 1280-1500px: Collapse left sidebar, keep right panel (compact mode)
 * - Above 1500px: Show all panels (full mode)
 */

import { useState, useEffect, useMemo } from 'react'

export interface ResponsiveConfig {
  compactThreshold: number  // 1500px - comfortable for both panels
  tightThreshold: number    // 1280px - minimum, collapse left
  collapseBothThreshold: number  // Below 1280px - collapse both
}

export interface SidebarState {
  leftCollapsed: boolean
  rightCollapsed: boolean
}

export interface ResponsiveState extends SidebarState {
  shouldAutoCollapse: boolean
  shouldAutoCollapseLeft: boolean
  shouldAutoCollapseRight: boolean
  windowWidth: number
  recommendations: {
    collapseLeft: boolean
    collapseRight: boolean
  }
}

const DEFAULT_CONFIG: ResponsiveConfig = {
  compactThreshold: 1500,
  tightThreshold: 1280,
  collapseBothThreshold: 1280,
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
    typeof window !== 'undefined' ? window.innerWidth : 1400
  )

  useEffect(() => {
    function handleResize() {
      setWindowWidth(window.innerWidth)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const state = useMemo(() => {
    const recommendations = {
      collapseLeft: windowWidth < config.compactThreshold,
      collapseRight: windowWidth < config.tightThreshold,
    }

    // User preference overrides
    if (userPreference === 'minimal') {
      return {
        leftCollapsed: true,
        rightCollapsed: true,
        recommendations,
        shouldAutoCollapseLeft: true,
        shouldAutoCollapseRight: true,
      }
    }
    if (userPreference === 'always-left' && windowWidth >= config.tightThreshold) {
      return {
        leftCollapsed: false,
        rightCollapsed: true,
        recommendations,
        shouldAutoCollapseLeft: false,
        shouldAutoCollapseRight: true,
      }
    }
    if (userPreference === 'always-right' && windowWidth >= config.tightThreshold) {
      return {
        leftCollapsed: true,
        rightCollapsed: false,
        recommendations,
        shouldAutoCollapseLeft: true,
        shouldAutoCollapseRight: false,
      }
    }

    // Auto behavior based on window width
    if (windowWidth < config.tightThreshold) {
      // At or below minimum (1280px) - collapse both
      return {
        leftCollapsed: true,
        rightCollapsed: true,
        recommendations,
        shouldAutoCollapseLeft: true,
        shouldAutoCollapseRight: true,
      }
    }
    if (windowWidth < config.compactThreshold) {
      // 1280-1500px - compact mode, keep right panel, collapse left
      return userPreference === 'always-left'
        ? {
            leftCollapsed: leftManual,
            rightCollapsed: true,
            recommendations,
            shouldAutoCollapseLeft: false,
            shouldAutoCollapseRight: true,
          }
        : {
            leftCollapsed: true,
            rightCollapsed: rightManual,
            recommendations,
            shouldAutoCollapseLeft: true,
            shouldAutoCollapseRight: false,
          }
    }

    // Above 1500px - spacious, both can be open, respect manual state
    return {
      leftCollapsed: leftManual,
      rightCollapsed: rightManual,
      recommendations,
      shouldAutoCollapseLeft: false,
      shouldAutoCollapseRight: false,
    }
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
