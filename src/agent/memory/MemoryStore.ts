/**
 * Memory Store — Long-term memory and RAG for agents.
 *
 * Provides persistent storage and retrieval of task context,
 * enabling agents to remember past work and leverage it for
 * future tasks.
 */

/**
 * Memory metadata.
 */
export interface MemoryMetadata {
  taskId: string
  timestamp: number
  tags?: string[]
  contentType?: 'code' | 'research' | 'plan' | 'output' | 'conversation'
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
 * In-memory vector store using simple cosine similarity.
 */
export class LocalVectorStore implements VectorStore {
  private vectors: Map<string, number[]> = new Map()

  async storeVector(id: string, vector: number[]): Promise<void> {
    this.vectors.set(id, vector)
  }

  async search(query: number[], k = 10): Promise<Array<{ id: string; similarity: number }>> {
    const results: Array<{ id: string; similarity: number }> = []

    for (const [id, vector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(query, vector)
      results.push({ id, similarity })
    }

    // Sort by similarity descending and return top-k
    results.sort((a, b) => b.similarity - a.similarity)
    return results.slice(0, k)
  }

  async deleteVector(id: string): Promise<void> {
    this.vectors.delete(id)
  }

  async clear(): Promise<void> {
    this.vectors.clear()
  }

  /**
   * Calculate cosine similarity between two vectors.
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0

    let dotProduct = 0
    let normA = 0
    let normB = 0

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i]
      normA += a[i] * a[i]
      normB += b[i] * b[i]
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB)
    if (denominator === 0) return 0
    return dotProduct / denominator
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
    console.warn('Embedding API failed, using simple embedding:', error)
    return createSimpleEmbedding(text)
  }
}
