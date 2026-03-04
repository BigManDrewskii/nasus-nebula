/**
 * PanelDivider — Draggable resize handle for the right output panel
 *
 * Features:
 * - 4px draggable divider with hover grip indicator
 * - Min width: 300px
 * - Max width: 60% of viewport
 * - Snap-close when dragged below 200px
 * - Double-click to restore previous width
 */

import { useState, useRef, useCallback, useEffect } from 'react'

interface PanelDividerProps {
  /** Current width as percentage (0.0 - 1.0) */
  width: number
  /** Called when width changes */
  onWidthChange: (width: number) => void
  /** Called when panel should collapse */
  onCollapse: () => void
  /** Previous width to restore on double-click (default: 0.4) */
  previousWidth?: number
}

export function PanelDivider({
  width,
  onWidthChange,
  onCollapse,
  previousWidth = 0.4,
}: PanelDividerProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dividerRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const startWidthRef = useRef(0)
  const viewportWidthRef = useRef(window.innerWidth)

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
    setIsDragging(true)
    viewportWidthRef.current = window.innerWidth

    // Add global mouse listeners
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return

    const deltaX = startXRef.current - e.clientX
    const viewportWidth = viewportWidthRef.current
    const currentWidthPx = startWidthRef.current * viewportWidth
    const newWidthPx = currentWidthPx + deltaX
    const newWidth = newWidthPx / viewportWidth

    // Check min width (300px) and max width (60%)
    const minWidthPx = 300
    const minWidth = minWidthPx / viewportWidth
    const maxWidth = 0.6

    // Snap-close: if dragged below 200px, collapse
    const snapClosePx = 200
    if (newWidthPx < snapClosePx) {
      setIsDragging(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      onCollapse()
      return
    }

    // Clamp width
    const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newWidth))
    onWidthChange(clampedWidth)
  }, [isDragging, onWidthChange, onCollapse])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }, [handleMouseMove])

  const handleDoubleClick = useCallback(() => {
    // If current width is very small (collapsed), restore to previous
    if (width < 0.1) {
      onWidthChange(previousWidth)
    }
  }, [width, previousWidth, onWidthChange])

  return (
    <div
      ref={dividerRef}
      className={`panel-divider${isDragging ? ' dragging' : ''}`}
      style={{
        width: 4,
        flexShrink: 0,
        position: 'relative',
        background: isDragging
          ? 'oklch(64% 0.214 40.1 / 0.15)'
          : isHovered
          ? 'rgba(255,255,255,0.08)'
          : 'rgba(255,255,255,0.03)',
        borderLeft: '1px solid rgba(255,255,255,0.05)',
        borderRight: '1px solid rgba(255,255,255,0.05)',
        cursor: 'col-resize',
        transition: isDragging ? 'none' : 'background 0.12s',
        userSelect: 'none',
      }}
      onMouseDown={startDrag}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDoubleClick={handleDoubleClick}
    >
      {/* Grip indicator - shows on hover */}
      {(isHovered || isDragging) && (
        <div
          className="panel-divider-grip"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 2,
            height: 24,
            background: 'rgba(255,255,255,0.2)',
            borderRadius: 1,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
