import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SqliteMemoryStore } from './SqliteMemoryStore'

// ── Module mocks ──────────────────────────────────────────────────────────────

// voy-search is a WASM package whose package.json exports field isn't
// resolvable by Vite in a Node/jsdom test environment.  Stub it out so the
// import-analysis phase can succeed; LocalVectorStore falls back to cosine
// similarity when Voy.add/search throw.
vi.mock('voy-search', () => ({
  Voy: class {
    add() {}
    search() { return { neighbors: [] } }
    clear() {}
  },
}))

// Swap LocalVectorStore to a pure-JS cosine-similarity store so tests don't
// depend on the WASM fallback path.
vi.mock('./MemoryStore', () => {
  class LocalVectorStore {
    private vectors = new Map<string, number[]>()
    async storeVector(id: string, v: number[]) { this.vectors.set(id, v) }
    async search(q: number[], k = 10) {
      const cos = (a: number[], b: number[]) => {
        let dot = 0, na = 0, nb = 0
        for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; na += a[i] ** 2; nb += b[i] ** 2 }
        const d = Math.sqrt(na) * Math.sqrt(nb)
        return d === 0 ? 0 : dot / d
      }
      return [...this.vectors.entries()]
        .map(([id, v]) => ({ id, similarity: cos(q, v) }))
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
    }
    async deleteVector(id: string) { this.vectors.delete(id) }
    async clear() { this.vectors.clear() }
  }
  return { LocalVectorStore }
})

const mockInvoke = vi.fn()

vi.mock('../../tauri', () => ({
  tauriInvoke: (...args: unknown[]) => mockInvoke(...args),
}))

vi.mock('./transformersEmbedding', () => ({
  createSemanticEmbedding: vi.fn(async (text: string) => {
    // Deterministic 4-dim test embedding based on text length
    const v = text.length / 100
    return [v, v * 0.5, v * 0.25, v * 0.1]
  }),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeStore(): SqliteMemoryStore {
  return new SqliteMemoryStore()
}

/** Default empty-DB response */
function setupEmptyDb(): void {
  mockInvoke.mockImplementation(async (cmd: string) => {
    if (cmd === 'db_query_memories') return []
    if (cmd === 'db_save_memory') return
    if (cmd === 'db_delete_memory') return
    if (cmd === 'db_clear_memories') return
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SqliteMemoryStore', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Silence localStorage (jsdom has a stub, but no LEGACY_STORAGE_KEY data)
    localStorage.clear()
  })

  it('initialises by querying SQLite on first operation', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()
    expect(mockInvoke).toHaveBeenCalledWith('db_query_memories', { taskId: null, limit: 1000 })
  })

  it('loads memories from SQLite into the in-memory cache on init', async () => {
    const embBytes = Array.from(new Uint8Array(new Float32Array([0.1, 0.2, 0.3, 0.4]).buffer))
    mockInvoke.mockResolvedValueOnce([
      {
        id: 'mem-1',
        taskId: 'task-a',
        content: 'past finding',
        contentType: 'research',
        tags: ['relevant'],
        timestamp: 1000,
        embedding: embBytes,
      },
    ])

    const store = makeStore()
    await store.init()

    const item = await store.get('mem-1')
    expect(item).not.toBeNull()
    expect(item?.content).toBe('past finding')
    expect(item?.metadata.taskId).toBe('task-a')
  })

  it('store() persists to SQLite before updating cache', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()

    const id = await store.store('new memory content', {
      taskId: 'task-1',
      timestamp: Date.now(),
      contentType: 'code',
    })

    expect(id).toBeTruthy()
    // db_save_memory must have been called
    const saveCall = mockInvoke.mock.calls.find(([cmd]) => cmd === 'db_save_memory')
    expect(saveCall).toBeDefined()
    const saved = (saveCall as [string, { memory: { id: string; content: string } }])[1].memory
    expect(saved.id).toBe(id)
    expect(saved.content).toBe('new memory content')

    // in-memory cache should also have it
    const item = await store.get(id)
    expect(item?.content).toBe('new memory content')
  })

  it('search() returns results ordered by similarity', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()

    await store.store('alpha result', { taskId: 't1', timestamp: 1000, contentType: 'output' })
    await store.store('beta result', { taskId: 't1', timestamp: 2000, contentType: 'output' })

    const results = await store.search('alpha result', 5)
    expect(results.length).toBeGreaterThan(0)
    // Most similar should be first
    expect(results[0].similarity).toBeGreaterThanOrEqual(results[results.length - 1].similarity)
  })

  it('getRelated() returns all memories for a given taskId', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()

    await store.store('task A memory 1', { taskId: 'task-A', timestamp: 1000 })
    await store.store('task A memory 2', { taskId: 'task-A', timestamp: 2000 })
    await store.store('task B memory', { taskId: 'task-B', timestamp: 3000 })

    const related = await store.getRelated('task-A')
    expect(related).toHaveLength(2)
    expect(related.every((r) => r.metadata.taskId === 'task-A')).toBe(true)
    // Most recent first
    expect(related[0].metadata.timestamp).toBeGreaterThan(related[1].metadata.timestamp)
  })

  it('delete() removes from SQLite and cache', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()

    const id = await store.store('to delete', { taskId: 't1', timestamp: Date.now() })
    await store.delete(id)

    expect(await store.get(id)).toBeNull()
    const deleteCall = mockInvoke.mock.calls.find(([cmd]) => cmd === 'db_delete_memory')
    expect(deleteCall).toBeDefined()
    expect((deleteCall as [string, { memoryId: string }])[1].memoryId).toBe(id)
  })

  it('clear() empties cache and calls db_clear_memories', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()

    await store.store('keep me', { taskId: 't1', timestamp: Date.now() })
    await store.clear()

    const stats = await store.stats()
    expect(stats.totalMemories).toBe(0)
    const clearCall = mockInvoke.mock.calls.find(([cmd]) => cmd === 'db_clear_memories')
    expect(clearCall).toBeDefined()
  })

  it('stats() returns totalMemories and per-task counts', async () => {
    setupEmptyDb()
    const store = makeStore()
    await store.init()

    await store.store('m1', { taskId: 'task-X', timestamp: 1000 })
    await store.store('m2', { taskId: 'task-X', timestamp: 2000 })
    await store.store('m3', { taskId: 'task-Y', timestamp: 3000 })

    const stats = await store.stats()
    expect(stats.totalMemories).toBe(3)
    expect(stats.memoriesByTask['task-X']).toBe(2)
    expect(stats.memoriesByTask['task-Y']).toBe(1)
  })
})
