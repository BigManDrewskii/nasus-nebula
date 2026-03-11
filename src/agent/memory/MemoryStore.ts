/**
 * Memory Store — Long-term memory and RAG for agents.
 *
 * Provides persistent storage and retrieval of task context,
 * enabling agents to remember past work and leverage it for
 * future tasks.
 */

import { createLogger } from '../../lib/logger'

const log = createLogger('MemoryStore')

/**
 * Memory metadata.
 */
export interface MemoryMetadata {
  taskId: string
  timestamp: number
  tags?: string[]
  contentType?: 'code' | 'research' | 'plan' | 'output' | 'conversation' | 'project_fact'
  language?: string
  framework?: string
}

/**
 * A stored memory item.
 */
export interface MemoryItem {
  id: string
  content: string
  embedding?: number[]  // Float32Array for vector similarity
  metadata: MemoryMetadata
}

/**
 * Memory search result with similarity score.
 */
export interface MemoryResult {
  id: string
  content: string
  similarity: number  // 0-1, higher is more similar
  metadata: MemoryMetadata
}

/**
 * Vector store interface for semantic search.
 *
 * Implementations can use in-memory vectors, Qdrant, Pinecone, etc.
 */
export interface VectorStore {
  /**
   * Store a vector with its associated ID.
   */
  storeVector(id: string, vector: number[]): Promise<void>

  /**
   * Search for similar vectors by cosine similarity.
   * Returns top-k results with similarity scores.
   */
  search(query: number[], k?: number): Promise<Array<{ id: string; similarity: number }>>

  /**
   * Delete a vector by ID.
   */
  deleteVector(id: string): Promise<void>

  /**
   * Clear all vectors.
   */
  clear(): Promise<void>
}

/**
 * Memory store interface.
 *
 * Handles storage, retrieval, and semantic search of agent memories.
 */
export interface MemoryStore {
  /**
   * Store a memory item.
   */
  store(content: string, metadata: MemoryMetadata): Promise<string>

  /**
   * Search memories by semantic similarity.
   */
  search(query: string, k?: number): Promise<MemoryResult[]>

  /**
   * Get memories related to a specific task.
   */
  getRelated(taskId: string): Promise<MemoryResult[]>

  /**
   * Get a specific memory by ID.
   */
  get(id: string): Promise<MemoryItem | null>

  /**
   * Delete a memory by ID.
   */
  delete(id: string): Promise<void>

  /**
   * Clear all memories.
   */
  clear(): Promise<void>

  /**
   * Get memory statistics.
   */
  stats(): Promise<{ totalMemories: number; memoriesByTask: Record<string, number> }>
}

/**
 * In-memory vector store using Voy (WASM) for fast ANN search.
 * Falls back to cosine similarity if Voy fails to load.
 */
export class LocalVectorStore implements VectorStore {
  private voy: import('voy-search').Voy | null = null
  private vectors: Map<string, number[]> = new Map()
  private voyReady = false

  private async getVoy(): Promise<import('voy-search').Voy | null> {
    if (this.voyReady) return this.voy
    try {
      const { Voy } = await import('voy-search')
      this.voy = new Voy()
      this.voyReady = true
    } catch {
      this.voyReady = true
      this.voy = null
    }
    return this.voy
  }

  async storeVector(id: string, vector: number[]): Promise<void> {
    this.vectors.set(id, vector)
    const voy = await this.getVoy()
    if (voy) {
      try {
        voy.add({ embeddings: [{ id, title: id, url: id, embeddings: vector }] })
      } catch {
        // Voy index corrupt; rebuild on next search
      }
    }
  }

  async search(query: number[], k = 10): Promise<Array<{ id: string; similarity: number }>> {
    const voy = await this.getVoy()
    if (voy && this.vectors.size > 0) {
      try {
        const result = voy.search(new Float32Array(query), k)
        return result.neighbors
          .filter((n) => this.vectors.has(n.id))
          .map((n) => {
            // Voy returns L2 distances — convert to a [0,1] similarity score
            const dist = parseFloat(n.url) || 0
            return { id: n.id, similarity: 1 / (1 + dist) }
          })
      } catch {
        // Fall through to cosine fallback
      }
    }

    // Cosine similarity fallback
    const results: Array<{ id: string; similarity: number }> = []
    for (const [id, vector] of this.vectors.entries()) {
      results.push({ id, similarity: this.cosineSimilarity(query, vector) })
    }
    results.sort((a, b) => b.similarity - a.similarity)
    return results.slice(0, k)
  }

  async deleteVector(id: string): Promise<void> {
    this.vectors.delete(id)
    // Voy's remove() is unreliable across versions and silently no-ops in many builds,
    // leaving stale entries in the WASM heap. Rebuild the entire index from the
    // remaining vectors instead — this is the only safe way to evict an entry.
    const voy = await this.getVoy()
    if (voy) {
      try {
        voy.clear()
        if (this.vectors.size > 0) {
          voy.add({
            embeddings: Array.from(this.vectors.entries()).map(([vid, vec]) => ({
              id: vid,
              title: vid,
              url: vid,
              embeddings: vec,
            })),
          })
        }
      } catch { /* ok — cosine fallback will handle searches */ }
    }
  }

  async clear(): Promise<void> {
    this.vectors.clear()
    const voy = await this.getVoy()
    if (voy) {
      try { voy.clear() } catch { /* ok */ }
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0
    let dot = 0, na = 0, nb = 0
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]
    }
    const denom = Math.sqrt(na) * Math.sqrt(nb)
    return denom === 0 ? 0 : dot / denom
  }
}

/**
 * Simple embedding function using TF-IDF-like hashing.
 *
 * This is a fallback for when no proper embedding API is available.
 * It creates a fixed-size vector from text using character n-grams.
 */
export function createSimpleEmbedding(text: string, dimensions = 384): number[] {
  const vector = new Float32Array(dimensions)
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, ' ')

  // Simple word-based hashing
  const words = normalized.split(/\s+/)
  for (const word of words) {
    if (word.length === 0) continue

    // Hash the word to get indices
    let hash = 0
    for (let i = 0; i < word.length; i++) {
      hash = ((hash << 5) - hash) + word.charCodeAt(i)
      hash = hash & hash // Convert to 32bit integer
    }

    // Distribute the word across multiple dimensions
    for (let i = 0; i < Math.min(word.length, 4); i++) {
      const idx = Math.abs((hash + i * 31) % dimensions)
      vector[idx] += 1 / Math.sqrt(word.length)
    }
  }

  // Normalize the vector
  let norm = 0
  for (let i = 0; i < dimensions; i++) {
    norm += vector[i] * vector[i]
  }
  norm = Math.sqrt(norm)

  if (norm > 0) {
    for (let i = 0; i < dimensions; i++) {
      vector[i] /= norm
    }
  }

  return Array.from(vector)
}

/**
 * Create an embedding using an external API (OpenAI, etc.).
 *
 * This is a placeholder for future integration with proper embedding models.
 */
export async function createEmbedding(
  text: string,
  apiKey?: string,
  model = 'text-embedding-3-small',
): Promise<number[]> {
  // If no API key, fall back to simple embedding
  if (!apiKey) {
    return createSimpleEmbedding(text)
  }

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        input: text.slice(0, 8191), // OpenAI limit
      }),
    })

    if (!response.ok) {
      throw new Error(`Embedding API error: ${response.status}`)
    }

    const data = await response.json()
    return data.data[0].embedding
  } catch (error) {
    // Fall back to simple embedding on error
      log.warn('Embedding API failed, using simple embedding', error instanceof Error ? error : new Error(String(error)))
    return createSimpleEmbedding(text)
  }
}
