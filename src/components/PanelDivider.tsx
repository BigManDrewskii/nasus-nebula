/**
 * PanelDivider — Draggable resize handle for the right output panel
 *
 * Features:
 * - 6px draggable divider with hover grip indicator
 * - Min width: 300px
 * - Max width: 60% of viewport
 * - Snap-close when dragged below 200px
 * - Double-click to restore previous width
 * - When collapsed, drag right to expand
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface PanelDividerProps {
  /** Current width as percentage (0.0 - 1.0) */
  width: number
  /** Called when width changes */
  onWidthChange: (width: number) => void
  /** Called when panel should collapse */
  onCollapse: () => void
  /** Called when panel should expand */
  onExpand: () => void
  /** Previous width to restore on double-click (default: 0.4) */
  previousWidth?: number
  /** Whether the panel is currently collapsed */
  collapsed?: boolean
  /** Ref to the sidebar element for toggling resize class */
  sidebarRef?: React.RefObject<HTMLDivElement | null>
}

export function PanelDivider({
  width,
  onWidthChange,
  onCollapse,
  onExpand,
  previousWidth = 0.4,
  collapsed = false,
  sidebarRef,
}: PanelDividerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dividerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const viewportWidthRef = useRef(window.innerWidth)
  // Use ref for drag state to avoid closure issues in event listeners
  const isDraggingRef = useRef(false)

  // Update viewport width on resize
  useEffect(() => {
    const handleResize = () => {
      viewportWidthRef.current = window.innerWidth
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const startDrag = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startXRef.current = e.clientX
    startWidthRef.current = width
    isDraggingRef.current = true
    setIsDragging(true)
    viewportWidthRef.current = window.innerWidth

    // Disable transition on sidebar during drag for immediate response
    sidebarRef?.current?.classList.add('is-resizing')

    // If collapsed and starting to drag, first expand to previous width
    if (collapsed) {
      onExpand()
    }

    // Add global mouse listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return

      // Don't process width changes if we were collapsed and just expanded
      if (startWidthRef.current === 0) return

      const deltaX = startXRef.current - e.clientX
      const viewportWidth = viewportWidthRef.current
      const currentWidthPx = startWidthRef.current * viewportWidth
      const newWidthPx = currentWidthPx + deltaX
      const newWidth = newWidthPx / viewportWidth

      // Use the actual inner container width (not full viewport) so the panel
      // can never exceed what's available after the left sidebar is accounted for
      const containerWidth = dividerRef.current?.parentElement?.clientWidth ?? viewportWidth
      const minWidthPx = 300
      const minWidth = minWidthPx / viewportWidth
      const chatMinPx = 380
      const maxWidthPx = containerWidth - chatMinPx - 4 // 4 = divider width
      const maxWidth = Math.min(0.6, maxWidthPx / viewportWidth)

      // Snap-close: if dragged below 200px, collapse
      const snapClosePx = 200
      if (newWidthPx < snapClosePx && newWidthPx > 0) {
        isDraggingRef.current = false
        setIsDragging(false)
        startWidthRef.current = 0 // Reset to indicate we're collapsing
        sidebarRef?.current?.classList.remove('is-resizing')
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        onCollapse()
        return
      }

      // Clamp width
      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
      onWidthChange(clampedWidth)
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
      setIsDragging(false)
      startWidthRef.current = 0
      sidebarRef?.current?.classList.remove('is-resizing')
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width, collapsed, onExpand, onWidthChange, onCollapse, sidebarRef])

  const handleDoubleClick = useCallback(() => {
    if (collapsed) {
      // If collapsed, double-click expands
      onExpand()
      onWidthChange(previousWidth)
    } else if (width < 0.1) {
      // If current width is very small (collapsed), restore to previous
      onWidthChange(previousWidth)
    }
  }, [width, previousWidth, onWidthChange, collapsed, onExpand])

  return (
    <div
      ref={dividerRef}
      className={`panel-divider${isDragging ? ' dragging' : ''}`}
      style={{
        width: 4,
        flexShrink: 0,
        position: 'relative',
        background: isDragging
          ? 'oklch(64% 0.214 40.1 / 0.2)'
          : isHovered
          ? 'rgba(255,255,255,0.12)'
          : 'rgba(255,255,255,0.04)',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        cursor: collapsed ? 'col-resize' : 'col-resize',
        transition: isDragging ? 'none' : 'background 0.15s, border-color 0.15s',
        userSelect: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
      onMouseDown={startDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
      title={collapsed ? 'Double-click or drag right to expand' : 'Drag to resize • Double-click to restore'}
    >
      {/* Subtle centre line — glows amber on hover/drag */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 1,
          background: isHovered || isDragging
            ? 'rgba(234,179,8,0.4)'
            : collapsed
            ? 'rgba(234,179,8,0.2)'
            : 'rgba(255,255,255,0.08)',
          transition: 'background 0.15s',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}
