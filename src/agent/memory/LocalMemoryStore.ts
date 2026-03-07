/**
 * Local Memory Store — In-memory implementation of MemoryStore.
 *
 * Stores memories in browser localStorage for persistence across sessions.
 * Uses simple embedding for semantic search when no embedding API is available.
 */

import {
  LocalVectorStore,
} from './MemoryStore'
import { createSemanticEmbedding } from './transformersEmbedding'
import { createLogger } from '../../lib/logger'
import type {
  MemoryStore,
  MemoryItem,
  MemoryResult,
  MemoryMetadata,
} from './MemoryStore'

const log = createLogger('LocalMemoryStore')

export type { MemoryItem, MemoryResult, MemoryMetadata } from './MemoryStore'

const MEMORY_VERSION = 'v1'
const STORAGE_KEY = `nasus-memories-${MEMORY_VERSION}`
const MAX_MEMORIES = 1000
const MAX_STORAGE_SIZE = 5 * 1024 * 1024 // 5MB

/**
 * Lightweight keyword-based fallback embedding.
 * Produces a fixed-size 512-dim bag-of-words vector when the Transformers.js
 * model is unavailable (first launch, slow connection, WASM not supported).
 * Similarity is lower quality but ensures memories are never silently dropped.
 */
function keywordEmbedding(text: string): number[] {
  const DIM = 512
  const vec = new Float32Array(DIM)
  const words = text.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/)
  for (const word of words) {
    if (!word) continue
    // Simple deterministic hash to bucket index
    let h = 5381
    for (let i = 0; i < word.length; i++) {
      h = ((h << 5) + h) ^ word.charCodeAt(i)
      h = h >>> 0 // keep unsigned
    }
    vec[h % DIM] += 1
  }
  // L2 normalize
  let norm = 0
  for (let i = 0; i < DIM; i++) norm += vec[i] * vec[i]
  norm = Math.sqrt(norm) || 1
  const out: number[] = new Array(DIM)
  for (let i = 0; i < DIM; i++) out[i] = vec[i] / norm
  return out
}

/**
 * Stored memory format for persistence.
 */
interface StoredMemory {
  id: string
  content: string
  embedding: number[]
  metadata: MemoryMetadata
}

/**
 * Local memory store using localStorage for persistence.
 */
export class LocalMemoryStore implements MemoryStore {
  private memories: Map<string, MemoryItem> = new Map()
  private vectorStore: LocalVectorStore = new LocalVectorStore()
  private initialized = false

  /**
   * Initialize the memory store from localStorage.
   */
  async init(): Promise<void> {
    if (this.initialized) return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as StoredMemory[]
        for (const item of data) {
          this.memories.set(item.id, {
            ...item,
          })
          await this.vectorStore.storeVector(item.id, item.embedding)
        }
      }
    } catch (error) {
        log.warn('Failed to load memories from storage', error instanceof Error ? error : new Error(String(error)))
    }

    this.initialized = true
  }

  /**
   * Ensure the store is initialized before operations.
   */
  private async ensureInit(): Promise<void> {
    if (!this.initialized) {
      await this.init()
    }
  }

  /**
   * Store a memory item.
   * If the semantic embedding model is unavailable (e.g., first run / slow connection),
   * falls back to a lightweight keyword-based embedding so the memory is never silently dropped.
   */
  async store(content: string, metadata: MemoryMetadata): Promise<string> {
    await this.ensureInit()

    const id = crypto.randomUUID()

    let embedding: number[]
    try {
      embedding = await createSemanticEmbedding(content)
    } catch (embErr) {
      log.warn('Semantic embedding failed — falling back to keyword embedding', embErr instanceof Error ? embErr : new Error(String(embErr)))
      embedding = keywordEmbedding(content)
    }

    const memory: MemoryItem = {
      id,
      content,
      embedding,
      metadata: {
        ...metadata,
        timestamp: Date.now(),
      },
    }

    this.memories.set(id, memory)
    await this.vectorStore.storeVector(id, embedding)
    await this.persist()

    return id
  }

  /**
   * Search memories by semantic similarity.
   */
  async search(query: string, k = 10): Promise<MemoryResult[]> {
    await this.ensureInit()

    let queryEmbedding: number[]
    try {
      queryEmbedding = await createSemanticEmbedding(query)
    } catch {
      queryEmbedding = keywordEmbedding(query)
    }
    const searchResults = await this.vectorStore.search(queryEmbedding, k * 2) // Get more to filter

    const results: MemoryResult[] = []
    for (const result of searchResults) {
      const memory = this.memories.get(result.id)
      if (memory) {
        results.push({
          id: memory.id,
          content: memory.content,
          similarity: result.similarity,
          metadata: memory.metadata,
        })
        if (results.length >= k) break
      }
    }

    return results
  }

  /**
   * Get memories related to a specific task.
   */
  async getRelated(taskId: string): Promise<MemoryResult[]> {
    await this.ensureInit()

    const results: MemoryResult[] = []
    for (const memory of this.memories.values()) {
      if (memory.metadata.taskId === taskId) {
        results.push({
          id: memory.id,
          content: memory.content,
          similarity: 1, // Exact match
          metadata: memory.metadata,
        })
      }
    }

    return results.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
  }

  /**
   * Get a specific memory by ID.
   */
  async get(id: string): Promise<MemoryItem | null> {
    await this.ensureInit()
    return this.memories.get(id) || null
  }

  /**
   * Delete a memory by ID.
   */
  async delete(id: string): Promise<void> {
    await this.ensureInit()

    this.memories.delete(id)
    await this.vectorStore.deleteVector(id)
    await this.persist()
  }

  /**
   * Clear all memories.
   */
  async clear(): Promise<void> {
    await this.ensureInit()

    this.memories.clear()
    await this.vectorStore.clear()
    localStorage.removeItem(STORAGE_KEY)
  }

  /**
   * Get memory statistics.
   */
  async stats(): Promise<{ totalMemories: number; memoriesByTask: Record<string, number> }> {
    await this.ensureInit()

    const memoriesByTask: Record<string, number> = {}
    for (const memory of this.memories.values()) {
      const taskId = memory.metadata.taskId
      memoriesByTask[taskId] = (memoriesByTask[taskId] || 0) + 1
    }

    return {
      totalMemories: this.memories.size,
      memoriesByTask,
    }
  }

  /**
   * Persist memories to localStorage.
   *
   * When storage is over budget, truncates the oldest 20% — and synchronously
   * removes the truncated entries from the in-memory Map and vector store so
   * they don't become ghost vectors that waste ANN slots without matching data.
   */
  private async persist(): Promise<void> {
    try {
      // Check storage size before writing
      const memories = Array.from(this.memories.values()).slice(0, MAX_MEMORIES)
      const serialized = JSON.stringify(memories)

      if (serialized.length > MAX_STORAGE_SIZE) {
          log.warn('Memory store exceeds storage limit, truncating old memories')
        // Keep only the most recent memories
        const sorted = memories.sort((a, b) => b.metadata.timestamp - a.metadata.timestamp)
        const truncated = sorted.slice(0, Math.floor(MAX_MEMORIES * 0.8))
        const truncatedIds = new Set(truncated.map(m => m.id))

        // Remove dropped entries from in-memory structures so they don't ghost
        for (const id of this.memories.keys()) {
          if (!truncatedIds.has(id)) {
            this.memories.delete(id)
            await this.vectorStore.deleteVector(id)
          }
        }

        const truncatedSerialized = JSON.stringify(truncated)
        localStorage.setItem(STORAGE_KEY, truncatedSerialized)
      } else {
        localStorage.setItem(STORAGE_KEY, serialized)
      }
    } catch (error) {
        log.warn('Failed to persist memories', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Store task output as memory.
   */
  async storeTaskOutput(
    taskId: string,
    output: string,
    metadata?: Partial<MemoryMetadata>,
  ): Promise<string> {
    return this.store(output, {
      taskId,
      timestamp: Date.now(),
      contentType: 'output',
      ...metadata,
    })
  }

  /**
   * Store task plan as memory.
   */
  async storeTaskPlan(
    taskId: string,
    plan: string,
    metadata?: Partial<MemoryMetadata>,
  ): Promise<string> {
    return this.store(plan, {
      taskId,
      timestamp: Date.now(),
      contentType: 'plan',
      ...metadata,
    })
  }

  /**
   * Store research findings as memory.
   */
  async storeFindings(
    taskId: string,
    findings: string,
    metadata?: Partial<MemoryMetadata>,
  ): Promise<string> {
    return this.store(findings, {
      taskId,
      timestamp: Date.now(),
      contentType: 'research',
      ...metadata,
    })
  }

  /**
   * Retrieve relevant context for a new task.
   */
  async retrieveContext(
    query: string,
    k = 5,
  ): Promise<{ memories: MemoryResult[]; context: string }> {
    const memories = await this.search(query, k)

    if (memories.length === 0) {
      return { memories: [], context: '' }
    }

    const context = `Relevant past work:\n${memories
      .map((m, i) => `${i + 1}. ${m.content.slice(0, 200)}${m.content.length > 200 ? '...' : ''}`)
      .join('\n')}`

    return { memories, context }
  }
}

/**
 * Global memory store instance.
 */
export const memoryStore = new LocalMemoryStore()

/**
 * Initialize the memory store (call on app startup).
 */
export async function initMemoryStore(): Promise<void> {
  await memoryStore.init()
}

/**
 * Store task completion as memory.
 */
export async function storeTaskCompletion(
  taskId: string,
  summary: string,
  outputFiles: string[] = [],
): Promise<void> {
  await memoryStore.storeTaskOutput(taskId, summary, {
    tags: ['completed', 'summary'],
  })

  if (outputFiles.length > 0) {
    await memoryStore.store(outputFiles.join('\n'), {
      taskId,
      timestamp: Date.now(),
      contentType: 'code',
      tags: ['files', 'output'],
    })
  }
}
