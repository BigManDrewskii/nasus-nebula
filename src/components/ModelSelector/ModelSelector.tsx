/**
 * ModelSelector — Floating popover for quick model selection.
 *
 * A positioned popover that displays a filterable list of models
 * grouped by free/paid. Used by both ModelIndicatorRow (sidebar)
 * and ModelSelectorTrigger (chat input).
 *
 * Features:
 * - Auto-positioning relative to anchor element
 * - Click-outside to close
 * - Escape to close
 * - Keyboard navigation (delegated to ModelList)
 * - Smooth fade-in animation
 * - Backdrop for click-outside handling
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useAppStore } from '../../store'
import { ModelList } from './ModelList'
import type { ModelSelectorProps } from './types'

const POPOVER_WIDTH = 300
const POPOVER_MAX_HEIGHT = 440

export function ModelSelector({
  anchor,
  position = 'above',
  onSelect,
  onClose,
}: ModelSelectorProps) {
  const popoverRef = useRef<HTMLDivElement>(null)
  const [popoverStyle, setPopoverStyle] = useState<React.CSSProperties>({
    opacity: 0,
    transform: 'translateY(4px)',
  })
  const [isMounted, setIsMounted] = useState(false)

  const currentModelId = useAppStore((s) => s.model)
  const currentProvider = useAppStore((s) => s.provider)
  const routerConfig = useAppStore((s) => s.routerConfig)

  // Derive routing mode from routerConfig
  const routingMode: 'auto-free' | 'auto-paid' | 'manual' = currentModelId === 'auto'
    ? routerConfig.budget === 'free'
      ? 'auto-free'
      : 'auto-paid'
    : 'manual'

  // Calculate position based on anchor element (fixed positioning = viewport relative)
  const updatePosition = () => {
    const anchorEl = anchor.current
    if (!anchorEl) return

    const anchorRect = anchorEl.getBoundingClientRect()

    let top: number
    let left: number

    if (position === 'above') {
      // Position above the anchor (opens upward)
      top = anchorRect.top - POPOVER_MAX_HEIGHT - 4

      // Ensure it doesn't go off-screen top
      if (top < 8) {
        top = anchorRect.bottom + 8
      }

      // Adjust horizontal position
      left = anchorRect.left
      if (left + POPOVER_WIDTH > window.innerWidth - 8) {
        left = window.innerWidth - POPOVER_WIDTH - 8
      }
      if (left < 8) {
        left = 8
      }
    } else {
      // Position below the anchor
      top = anchorRect.bottom + 8
      left = anchorRect.left

      // Adjust horizontal position
      if (left + POPOVER_WIDTH > window.innerWidth - 8) {
        left = window.innerWidth - POPOVER_WIDTH - 8
      }
      if (left < 8) {
        left = 8
      }
    }

    setPopoverStyle({
      position: 'fixed',
      top,
      left,
      width: POPOVER_WIDTH,
      maxHeight: POPOVER_MAX_HEIGHT,
      opacity: 1,
      transform: 'translateY(0)',
    })
  }

  // Handle click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchor.current &&
        !anchor.current.contains(target)
      ) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose, anchor])

  // Initial position calculation and animation
  useEffect(() => {
    setIsMounted(true)
    updatePosition()

    // Animate in
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setPopoverStyle((prev) => ({
          ...prev,
          opacity: 1,
          transform: 'translateY(0)',
        }))
      })
    })

    // Recalculate on scroll/resize
    const handleUpdate = () => updatePosition()
    window.addEventListener('scroll', handleUpdate, true)
    window.addEventListener('resize', handleUpdate)

    return () => {
      window.removeEventListener('scroll', handleUpdate, true)
      window.removeEventListener('resize', handleUpdate)
    }
  }, [])

  // Update position when anchor changes
  useEffect(() => {
    updatePosition()
  }, [anchor, position])

  if (!isMounted) return null

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: popoverStyle.top,
        left: popoverStyle.left,
        width: popoverStyle.width,
        height: popoverStyle.maxHeight,
        borderRadius: 10,
        background: '#0d0d0d',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        opacity: popoverStyle.opacity,
        transform: popoverStyle.transform,
        transition: 'opacity 0.14s ease-out, transform 0.14s ease-out',
      }}
    >
      <ModelList
        currentModelId={currentModelId}
        currentProvider={currentProvider}
        routingMode={routingMode}
        onSelect={onSelect}
        onClose={onClose}
      />
    </div>,
    document.body,
  )
}
