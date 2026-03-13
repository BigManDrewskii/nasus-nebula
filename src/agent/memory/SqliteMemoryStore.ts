/**
 * SQLite-backed Memory Store — source of truth for long-term agent memory.
 *
 * Stores memories in the Tauri SQLite database (`memories` table).
 * An in-memory LocalVectorStore is rebuilt on init() for fast semantic search.
 * Falls back to keyword embedding when the Transformers.js model is unavailable.
 */

import { LocalVectorStore } from './MemoryStore'
import { createSemanticEmbedding } from './transformersEmbedding'
import { createLogger } from '../../lib/logger'
import { tauriInvoke } from '../../tauri'
import type {
  MemoryStore,
  MemoryItem,
  MemoryResult,
  MemoryMetadata,
} from './MemoryStore'

const log = createLogger('SqliteMemoryStore')

const LEGACY_STORAGE_KEY = 'nasus-memories-v1'

// ── Embedding serialisation ────────────────────────────────────────────────────

/** float32[] → Uint8Array raw LE bytes → number[] (0-255) for Tauri IPC */
function embeddingToBytes(embedding: number[]): number[] {
  const buf = new Float32Array(embedding)
  return Array.from(new Uint8Array(buf.buffer))
}

/** number[] (0-255 IPC bytes) → float32[] embedding */
function bytesToEmbedding(bytes: number[]): number[] {
  const u8 = new Uint8Array(bytes)
  const f32 = new Float32Array(u8.buffer)
  return Array.from(f32)
}

// ── Fallback keyword embedding ─────────────────────────────────────────────────

function keywordEmbedding(text: string): number[] {
  const DIM = 512
  const vec = new Float32Array(DIM)
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  for (const word of words) {
    if (!word) continue
    let h = 5381
    for (let i = 0; i < word.length; i++) {
      h = ((h << 5) + h) ^ word.charCodeAt(i)
      h = h >>> 0
    }
    vec[h % DIM] += 1
  }
  let norm = 0
  for (let i = 0; i < DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm) || 1
  const out: number[] = new Array(DIM)
  for (let i = 0; i < DIM; i++) out[i] = vec[i] / norm
  return out
}

// ── Tauri IPC shape ────────────────────────────────────────────────────────────

interface DbMemory {
  id: string
  taskId: string
  content: string
  contentType: string | null
  tags: string[] | null
  timestamp: number
  embedding: number[] | null
}

// ── SqliteMemoryStore ─────────────────────────────────────────────────────────

export class SqliteMemoryStore implements MemoryStore {
  private memories: Map<string, MemoryItem> = new Map()
  private vectorStore: LocalVectorStore = new LocalVectorStore()
  private initialized = false

  async init(): Promise<void> {
    if (this.initialized) return

    try {
      const rows = await tauriInvoke<DbMemory[]>('db_query_memories', {
        taskId: null,
        limit: 1000,
      }) ?? []

      for (const row of rows) {
        const embedding = row.embedding ? bytesToEmbedding(row.embedding) : keywordEmbedding(row.content)
        const item: MemoryItem = {
          id: row.id,
          content: row.content,
          embedding,
          metadata: {
            taskId: row.taskId,
            timestamp: row.timestamp,
            contentType: (row.contentType as MemoryMetadata['contentType']) ?? undefined,
            tags: row.tags ?? undefined,
          },
        }
        this.memories.set(item.id, item)
        await this.vectorStore.storeVector(item.id, embedding)
      }

      if (rows.length === 0) {
        await this.migrateFromLocalStorage()
      }
    } catch (err) {
      log.warn('Failed to load memories from SQLite', err instanceof Error ? err : new Error(String(err)))
    }

    this.initialized = true
  }

  private async migrateFromLocalStorage(): Promise<void> {
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
      if (!raw) return

      const items = JSON.parse(raw) as Array<{
        id: string
        content: string
        embedding: number[]
        metadata: MemoryMetadata
      }>

      log.warn(`Migrating ${items.length} memories from localStorage to SQLite`)

      for (const item of items) {
        const embedding = item.embedding ?? keywordEmbedding(item.content)
        await tauriInvoke('db_save_memory', {
          memory: {
            id: item.id,
            taskId: item.metadata.taskId,
            content: item.content,
            contentType: item.metadata.contentType ?? null,
            tags: item.metadata.tags ?? null,
            timestamp: item.metadata.timestamp,
            embedding: embeddingToBytes(embedding),
          } satisfies DbMemory,
        })
        const memory: MemoryItem = { id: item.id, content: item.content, embedding, metadata: item.metadata }
        this.memories.set(item.id, memory)
        await this.vectorStore.storeVector(item.id, embedding)
      }

      localStorage.removeItem(LEGACY_STORAGE_KEY)
    } catch (err) {
      log.warn('localStorage migration failed', err instanceof Error ? err : new Error(String(err)))
    }
  }

  private async ensureInit(): Promise<void> {
    if (!this.initialized) await this.init()
  }

  async store(content: string, metadata: MemoryMetadata): Promise<string> {
    await this.ensureInit()

    const id = crypto.randomUUID()

    let embedding: number[]
    try {
      embedding = await createSemanticEmbedding(content)
    } catch (err) {
      log.warn('Semantic embedding failed — falling back to keyword embedding', err instanceof Error ? err : new Error(String(err)))
      embedding = keywordEmbedding(content)
    }

    const ts = metadata.timestamp ?? Date.now()
    const meta: MemoryMetadata = { ...metadata, timestamp: ts }

    await tauriInvoke('db_save_memory', {
      memory: {
        id,
        taskId: meta.taskId,
        content,
        contentType: meta.contentType ?? null,
        tags: meta.tags ?? null,
        timestamp: ts,
        embedding: embeddingToBytes(embedding),
      } satisfies DbMemory,
    })

    const item: MemoryItem = { id, content, embedding, metadata: meta }
    this.memories.set(id, item)
    await this.vectorStore.storeVector(id, embedding)

    return id
  }

  async search(query: string, k = 10): Promise<MemoryResult[]> {
    await this.ensureInit()

    let queryEmbedding: number[]
    try {
      queryEmbedding = await createSemanticEmbedding(query)
    } catch {
      queryEmbedding = keywordEmbedding(query)
    }

    const searchResults = await this.vectorStore.search(queryEmbedding, k * 2)
    const results: MemoryResult[] = []
    for (const r of searchResults) {
      const memory = this.memories.get(r.id)
      if (memory) {
        results.push({ id: memory.id, content: memory.content, similarity: r.similarity, metadata: memory.metadata })
        if (results.length >= k) break
      }
    }
    return results
  }

  async getRelated(taskId: string): Promise<MemoryResult[]> {
    await this.ensureInit()
    const results: MemoryResult[] = []
    for (const memory of this.memories.values()) {
      if (memory.metadata.taskId === taskId) {
        results.push({ id: memory.id, content: memory.content, similarity: 1, metadata: memory.metadata })
      }
    }
    return results.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
  }

  async get(id: string): Promise<MemoryItem | null> {
    await this.ensureInit()
    return this.memories.get(id) ?? null
  }

  async delete(id: string): Promise<void> {
    await this.ensureInit()
    this.memories.delete(id)
    await this.vectorStore.deleteVector(id)
    await tauriInvoke('db_delete_memory', { memoryId: id })
  }

  async clear(): Promise<void> {
    await this.ensureInit()
    this.memories.clear()
    await this.vectorStore.clear()
    await tauriInvoke('db_clear_memories', {})
  }

  async stats(): Promise<{ totalMemories: number; memoriesByTask: Record<string, number> }> {
    await this.ensureInit()
    const memoriesByTask: Record<string, number> = {}
    for (const memory of this.memories.values()) {
      const tid = memory.metadata.taskId
      memoriesByTask[tid] = (memoriesByTask[tid] ?? 0) + 1
    }
    return { totalMemories: this.memories.size, memoriesByTask }
  }

  async retrieveContext(
    query: string,
    k = 5,
  ): Promise<{ memories: MemoryResult[]; context: string }> {
    const memories = await this.search(query, k)
    if (memories.length === 0) return { memories: [], context: '' }
    const context = `Relevant past work:\n${memories
      .map((m, i) => `${i + 1}. ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`)
      .join('\n')}`
    return { memories, context }
  }
}
