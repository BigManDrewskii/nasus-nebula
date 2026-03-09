/**
 * DropZoneOverlay — full-chat-area drag-and-drop overlay.
 *
 * Distinguishes two drop modes:
 *   • "folder" — user drags a directory; fires onFolderDropped(path)
 *   • "files"  — user drags regular files; fires onFilesDropped(files)
 *
 * In Tauri desktop mode, folder paths are resolved via the native file-system
 * path available on the dropped File object (.path property injected by Tauri).
 * In browser mode we fall back to the webkitRelativePath / File.name heuristic.
 */

import { useState, useRef, useCallback } from 'react'
import { Pxi } from './Pxi'

export interface DropZoneHandlers {
  onDragEnter: (e: React.DragEvent) => void
  onDragLeave: (e: React.DragEvent) => void
  onDragOver: (e: React.DragEvent) => void
  onDrop: (e: React.DragEvent) => void
}

type DragMode = 'files' | 'folder' | null

interface DropZoneOverlayProps {
  isDragOver: boolean
  dragMode?: DragMode
}

export function DropZoneOverlay({ isDragOver, dragMode = 'files' }: DropZoneOverlayProps) {
  if (!isDragOver) return null

  const isFolder = dragMode === 'folder'

  return (
    <div
      role="region"
      aria-label={isFolder ? 'Drop folder to set as workspace' : 'Drop zone for file uploads'}
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
          border: isFolder
            ? '2px dashed rgba(234,179,8,0.7)'
            : '2px dashed rgba(234,179,8,0.5)',
          background: isFolder
            ? 'rgba(234,179,8,0.06)'
            : 'rgba(234,179,8,0.04)',
          transition: 'border-color 0.15s, background 0.15s',
        }}
      >
        <Pxi
          name={isFolder ? 'folder-open' : 'file-alt'}
          size={32}
          style={{ color: 'var(--amber)', opacity: 0.9 }}
        />
        <div style={{ textAlign: 'center' }}>
          {isFolder ? (
            <>
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--tx-primary)' }}>
                Drop folder to open
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-secondary)', marginTop: 4 }}>
                Sets it as your workspace — just like VS Code
              </p>
            </>
          ) : (
            <>
              <p style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--tx-primary)' }}>
                Drop files here
              </p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-secondary)', marginTop: 4 }}>
                Images, documents, code, archives
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Returns true if the drag transfer contains at least one directory entry. */
function detectFolderDrag(e: React.DragEvent): boolean {
  if (!e.dataTransfer?.items) return false
  for (let i = 0; i < e.dataTransfer.items.length; i++) {
    const item = e.dataTransfer.items[i]
    if (item.kind === 'file') {
      const entry = item.webkitGetAsEntry?.()
      if (entry?.isDirectory) return true
    }
  }
  return false
}

/**
 * Extract the absolute path from a dropped folder.
 *
 * In Tauri, the File object has a non-standard `.path` property with the real
 * filesystem path. In browser mode we use the File's `.name` as best effort.
 */
function getFolderPath(e: React.DragEvent): string | null {
  const files = Array.from(e.dataTransfer.files)
  if (files.length === 0) return null

  // Tauri injects a `.path` property on File objects
  const first = files[0] as File & { path?: string }
  if (first.path) {
    // `first.path` is the path of the first file inside the folder — strip the filename
    const parts = first.path.split('/')
    parts.pop()
    return parts.join('/') || '/'
  }

  // Browser fallback: use webkitRelativePath to extract the top-level folder name
  // webkitRelativePath looks like "FolderName/subdir/file.txt"
  if (first.webkitRelativePath) {
    const topFolder = first.webkitRelativePath.split('/')[0]
    return topFolder || null
  }

  return null
}

// ── Hook: useDragDrop ─────────────────────────────────────────────────────────

export function useDragDrop(
  onFilesDropped: (files: File[]) => void,
  onFolderDropped?: (path: string) => void,
) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [dragMode, setDragMode] = useState<DragMode>(null)
  const dragCounterRef = useRef(0)

  const onDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current++
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragOver(true)
      // Detect mode on enter — items list is only available here, not on dragover
      setDragMode(detectFolderDrag(e) ? 'folder' : 'files')
    }
  }, [])

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current--
    if (dragCounterRef.current <= 0) {
      dragCounterRef.current = 0
      setIsDragOver(false)
      setDragMode(null)
    }
  }, [])

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    // Re-check drag mode on over in case items became available later
    if (e.dataTransfer.types.includes('Files') && dragMode === null) {
      setDragMode(detectFolderDrag(e) ? 'folder' : 'files')
    }
  }, [dragMode])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    dragCounterRef.current = 0
    setIsDragOver(false)

    const isFolder = detectFolderDrag(e)
    setDragMode(null)

    if (isFolder && onFolderDropped) {
      const path = getFolderPath(e)
      if (path) {
        onFolderDropped(path)
        return
      }
    }

    // Regular files
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) onFilesDropped(files)
  }, [onFilesDropped, onFolderDropped]) // eslint-disable-line react-hooks/exhaustive-deps

  return { isDragOver, dragMode, handlers: { onDragEnter, onDragLeave, onDragOver, onDrop } }
}
