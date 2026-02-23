/**
 * DropZoneOverlay — full-chat-area drag-and-drop overlay.
 *
 * Usage: mount inside the ChatView container (position: relative).
 * It covers the full area with a dashed amber border + label when a file
 * is being dragged over. Drop fires onFilesDropped.
 *
 * Uses a dragCounter ref to handle the child-element dragenter/dragleave
 * flicker problem correctly.
 */

import { useState, useRef, useCallback } from 'react'
import { Pxi } from './Pxi'

export interface DropZoneHandlers {
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

interface DropZoneOverlayProps {
  isDragOver: boolean
}

export function DropZoneOverlay({ isDragOver }: DropZoneOverlayProps) {
  if (!isDragOver) return null
  return (
    <div
      role="region"
      aria-label="Drop zone for file uploads"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(13,13,13,0.88)',
        backdropFilter: 'blur(4px)',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          padding: '40px 60px',
          borderRadius: 20,
          border: '2px dashed rgba(234,179,8,0.5)',
          background: 'rgba(234,179,8,0.04)',
        }}
      >
        <Pxi name="folder-open" size={32} style={{ color: 'var(--amber)', opacity: 0.9 }} />
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--tx-primary)' }}>Drop files here</p>
          <p style={{ fontSize: 12, color: 'var(--tx-secondary)', marginTop: 4 }}>
            Images, documents, code, archives
          </p>
        </div>
      </div>
    </div>
  )
}

// ── Hook: useDragDrop ─────────────────────────────────────────────────────────

export function useDragDrop(onFilesDropped: (files: File[]) => void) {
  const [isDragOver, setIsDragOver] = useState(false)
  const dragCounterRef = useRef(0)

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
    }
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFilesDropped(files)
  }, [onFilesDropped])

  return { isDragOver, handlers: { onDragEnter, onDragLeave, onDragOver, onDrop } }
}
