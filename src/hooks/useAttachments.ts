/**
 * useAttachments — manages the pre-send attachment queue.
 *
 * Handles:
 *  - File validation (type + size)
 *  - Category detection
 *  - Preview URL generation (images)
 *  - Base64 extraction (images, for multimodal LLM)
 *  - Text extraction (code, plain text files)
 *  - Max 10 files per message
 *  - Total payload cap (50 MB)
 */

import { useState, useCallback } from 'react'
import type { Attachment, AttachmentCategory } from '../types'
import { parseFileBuffer, isSupportedBinaryFormat } from '../agent/FileParser'

// ── Limits ────────────────────────────────────────────────────────────────────

const MAX_FILES = 10
const MAX_TOTAL_BYTES = 50 * 1024 * 1024 // 50 MB

const CATEGORY_RULES: Array<{
  category: AttachmentCategory
  maxSize: number
  mimes: string[]
  exts: string[]
}> = [
  {
    category: 'image',
    maxSize: 10 * 1024 * 1024,
    mimes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'],
    exts: ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg'],
  },
  {
    category: 'document',
    maxSize: 25 * 1024 * 1024,
    mimes: ['application/pdf', 'text/plain', 'text/markdown', 'text/csv',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'],
    exts: ['.pdf', '.txt', '.md', '.csv', '.docx', '.doc'],
  },
  {
    category: 'spreadsheet',
    maxSize: 25 * 1024 * 1024,
    mimes: [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
      'text/tab-separated-values',
    ],
    exts: ['.xlsx', '.xls', '.csv', '.tsv'],
  },
  {
    category: 'code',
    maxSize: 5 * 1024 * 1024,
    mimes: [
      'text/javascript',
      'application/javascript',
      'text/typescript',
      'text/x-python',
      'text/html',
      'text/css',
      'application/json',
      'text/yaml',
      'application/yaml',
      'text/x-rust',
      'text/x-c',
      'text/x-java-source',
    ],
    exts: ['.js', '.ts', '.jsx', '.tsx', '.py', '.html', '.css', '.json', '.yaml', '.yml', '.rs', '.go', '.c', '.cpp', '.java', '.rb', '.php', '.swift'],
  },
  {
    category: 'archive',
    maxSize: 50 * 1024 * 1024,
    mimes: ['application/zip', 'application/x-zip-compressed'],
    exts: ['.zip'],
  },
]

function extOf(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot >= 0 ? name.slice(dot).toLowerCase() : ''
}

function categorize(file: File): { category: AttachmentCategory; maxSize: number } | null {
  const ext = extOf(file.name)
  for (const rule of CATEGORY_RULES) {
    if (rule.mimes.includes(file.type) || rule.exts.includes(ext)) {
      return { category: rule.category, maxSize: rule.maxSize }
    }
  }
  // Treat unknown text/* as document
  if (file.type.startsWith('text/')) return { category: 'document', maxSize: 25 * 1024 * 1024 }
  return null
}

function validate(file: File): { ok: true; category: AttachmentCategory; maxSize: number } | { ok: false; error: string } {
  const result = categorize(file)
  if (!result) return { ok: false, error: 'Unsupported file format' }
  if (file.size > result.maxSize) {
    return { ok: false, error: `File exceeds ${formatBytes(result.maxSize)} limit` }
  }
  return { ok: true, ...result }
}

async function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // Strip the data URL prefix: "data:image/png;base64,"
      const comma = result.indexOf(',')
      resolve(comma >= 0 ? result.slice(comma + 1) : result)
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function readText(file: File): Promise<string> {
  return file.text()
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface AttachmentsState {
  attachments: Attachment[]
  totalSize: number
  isOverLimit: boolean
  addFiles: (files: File[]) => Promise<void>
  removeAttachment: (id: string) => void
  clearAttachments: () => void
}

export function useAttachments(): AttachmentsState {
  const [attachments, setAttachments] = useState<Attachment[]>([])

  const addFiles = useCallback(async (files: File[]) => {
    setAttachments((prev) => {
      const remaining = MAX_FILES - prev.length
      if (remaining <= 0) return prev
      return prev // will be updated after async processing below
    })

    setAttachments((prev) => {
      const slotsLeft = MAX_FILES - prev.length
      if (slotsLeft <= 0) return prev

      const incoming = files.slice(0, slotsLeft)
      const placeholders: Attachment[] = incoming.map((file) => {
        const validation = validate(file)
        if (validation.ok === false) {
          return {
            id: crypto.randomUUID(),
            name: file.name,
            size: file.size,
            mimeType: file.type,
            category: 'other' as AttachmentCategory,
            status: 'error' as const,
            previewUrl: null,
            base64: null,
            textContent: null,
            error: validation.error,
          }
        }
        return {
          id: crypto.randomUUID(),
          name: file.name,
          size: file.size,
          mimeType: file.type,
          category: validation.category,
          status: 'ready' as const,
          previewUrl: null,
          base64: null,
          textContent: null,
          error: null,
        }
      })

      // Kick off async enrichment for valid files
      placeholders.forEach((placeholder, idx) => {
        if (placeholder.status === 'error') return
        const file = incoming[idx]

          const enrich = async () => {
            const updates: Partial<Attachment> = {}

            if (placeholder.category === 'image') {
              updates.previewUrl = URL.createObjectURL(file)
              updates.base64 = await toBase64(file).catch(() => null)
            } else if (isSupportedBinaryFormat(file.name)) {
              // PDF, DOCX, CSV — parse to text via FileParser
              try {
                const buffer = new Uint8Array(await file.arrayBuffer())
                const parsed = await parseFileBuffer(buffer, file.name)
                updates.textContent = parsed.text
              } catch {
                updates.textContent = await readText(file).catch(() => null)
              }
            } else if (
              placeholder.category === 'code' ||
              placeholder.category === 'document' ||
              file.type.startsWith('text/')
            ) {
              updates.textContent = await readText(file).catch(() => null)
            }

          setAttachments((current) =>
            current.map((a) => (a.id === placeholder.id ? { ...a, ...updates } : a)),
          )
        }
        enrich()
      })

      return [...prev, ...placeholders]
    })
  }, [])

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const att = prev.find((a) => a.id === id)
      if (att?.previewUrl) URL.revokeObjectURL(att.previewUrl)
      return prev.filter((a) => a.id !== id)
    })
  }, [])

  const clearAttachments = useCallback(() => {
    setAttachments((prev) => {
      for (const a of prev) {
        if (a.previewUrl) URL.revokeObjectURL(a.previewUrl)
      }
      return []
    })
  }, [])

  const totalSize = attachments.reduce((sum, a) => sum + a.size, 0)
  const isOverLimit = totalSize > MAX_TOTAL_BYTES

  return { attachments, totalSize, isOverLimit, addFiles, removeAttachment, clearAttachments }
}
