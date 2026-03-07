/**
 * Memory Browser — Browse and search past task memories.
 *
 * Allows users to:
 * - View all stored memories
 * - Search memories by semantic similarity
 * - Filter by task, content type, or tags
 * - Pin important memories
 */

import { useState, useEffect, memo } from 'react'
import { memoryStore, type MemoryResult, type MemoryMetadata } from '../agent/memory/LocalMemoryStore'
import { Pxi } from './Pxi'
import { createLogger } from '../lib/logger'

const log = createLogger('MemoryBrowser')

// ── Memory Card ────────────────────────────────────────────────────────────────────

interface MemoryCardProps {
  memory: MemoryResult
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

const MemoryCard = memo(({ memory, isSelected, onSelect, onDelete }: MemoryCardProps) => {
  const meta = memory.metadata
  const date = new Date(meta.timestamp).toLocaleDateString()

  return (
    <div
      className={`p-3 rounded-lg border transition-all cursor-pointer ${
        isSelected
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
      }`}
      onClick={onSelect}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {meta.contentType && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 capitalize">
                {meta.contentType}
              </span>
            )}
            {meta.framework && (
              <span className="px-1.5 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400">
                {meta.framework}
              </span>
            )}
            <span className="text-xs text-gray-400">{date}</span>
          </div>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1 rounded hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-400 hover:text-red-500 transition-colors"
          title="Delete memory"
        >
          <Pxi name="x" className="w-4 h-4" />
        </button>
      </div>
      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
        {memory.content}
      </p>
      {meta.tags && meta.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {meta.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 text-xs rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
})

// ── Memory Stats ───────────────────────────────────────────────────────────────────

interface MemoryStatsProps {
  totalMemories: number
  memoriesByTask: Record<string, number>
}

const MemoryStats = memo(({ totalMemories, memoriesByTask }: MemoryStatsProps) => {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
      <span>{totalMemories} memories</span>
      <span>·</span>
      <span>{Object.keys(memoriesByTask).length} tasks</span>
    </div>
  )
})

// ── Memory Browser ──────────────────────────────────────────────────────────────────

interface MemoryBrowserProps {
  onClose?: () => void
}

export const MemoryBrowser = memo(({ onClose }: MemoryBrowserProps) => {
  const [memories, setMemories] = useState<MemoryResult[]>([])
  const [filteredMemories, setFilteredMemories] = useState<MemoryResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | MemoryMetadata['contentType']>('all')
  const [stats, setStats] = useState({ totalMemories: 0, memoriesByTask: {} as Record<string, number> })

  // Load memories on mount
  useEffect(() => {
    loadMemories()
  }, [])

  // Filter memories when search or filter changes
  useEffect(() => {
    let filtered = memories

    // Apply type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.metadata.contentType === filterType)
    }

    // Apply search filter (semantic search)
    if (searchQuery.trim()) {
      // For now, do text matching. In future, use memoryStore.search()
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(m =>
        m.content.toLowerCase().includes(query) ||
        m.metadata.tags?.some(t => t.toLowerCase().includes(query))
      )
    }

    setFilteredMemories(filtered)
  }, [memories, searchQuery, filterType])

  const loadMemories = async () => {
    try {
      const statsData = await memoryStore.stats()
      setStats(statsData)

      // Load all memories (we'd need a getAll method, but for now search with empty query)
      const results = await memoryStore.search('', 100)
      setMemories(results)
      setFilteredMemories(results)
    } catch (error) {
        log.error('Failed to load memories', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setFilteredMemories(memories)
      return
    }

    try {
      const results = await memoryStore.search(searchQuery, 10)
      setFilteredMemories(results)
    } catch (error) {
        log.error('Memory search failed', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await memoryStore.delete(id)
      await loadMemories()
    } catch (error) {
      log.error('Failed to delete memory', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const handleSelect = (id: string) => {
    setSelectedId(id === selectedId ? null : id)
  }

  const contentTypeOptions: Array<'all' | MemoryMetadata['contentType']> = [
    'all',
    'code',
    'research',
    'plan',
    'output',
    'conversation',
  ]

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Memory Browser</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <Pxi name="x" className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search memories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Pxi name="search" className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          {contentTypeOptions.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 text-xs rounded capitalize transition-colors ${
                filterType === type
                  ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
        <MemoryStats totalMemories={stats.totalMemories} memoriesByTask={stats.memoriesByTask} />
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredMemories.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Pxi name="database" className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No memories found</p>
            <p className="text-sm mt-1">Completed tasks will be automatically saved here</p>
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              isSelected={selectedId === memory.id}
              onSelect={() => handleSelect(memory.id)}
              onDelete={() => handleDelete(memory.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => memoryStore.clear().then(loadMemories)}
          className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center gap-2"
        >
          <Pxi name="trash" className="w-4 h-4" />
          Clear All Memories
        </button>
      </div>
    </div>
  )
})

// ── Compact Memory View (for sidebar) ───────────────────────────────────────────────

interface CompactMemoryViewProps {
  onSelectMemory?: (content: string) => void
}

export const CompactMemoryView = memo(({ onSelectMemory }: CompactMemoryViewProps) => {
  const [memories, setMemories] = useState<MemoryResult[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    memoryStore.search('', 5).then(setMemories).catch(() => {})
  }, [])

  if (memories.length === 0) {
    return null
  }

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Pxi name="database" className="w-4 h-4" />
          Memory ({memories.length})
        </span>
        <Pxi
          name={expanded ? 'chevron-up' : 'chevron-down'}
          className="w-4 h-4 text-gray-400"
        />
      </button>

      {expanded && (
        <div className="p-2 space-y-1 max-h-48 overflow-y-auto">
          {memories.map((memory) => (
            <button
              key={memory.id}
              onClick={() => onSelectMemory?.(memory.content)}
              className="w-full text-left p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-xs text-gray-600 dark:text-gray-400"
            >
              {memory.content.slice(0, 80)}{memory.content.length > 80 ? '...' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
