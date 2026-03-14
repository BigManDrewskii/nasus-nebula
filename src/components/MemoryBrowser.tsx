/**
 * Memory Browser — Browse and search past task memories.
 */

import { useState, useEffect, memo } from 'react'
import { memoryStore, type MemoryResult, type MemoryMetadata } from '../agent/memory/SqliteMemoryStore'
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
      className="flex-col mb-card"
      style={{
        padding: '8px 12px',
        borderRadius: 8,
          border: `1px solid ${isSelected ? 'var(--amber-a35)' : 'var(--glass-border)'}`,
          background: isSelected ? 'var(--amber-a08)' : 'var(--glass-bg)',
          cursor: 'pointer',
          transition: 'border-color 0.12s, background 0.12s',
      }}
      onClick={onSelect}
    >
      <div className="flex-v-center justify-between mb-card-top">
        <div className="flex-v-center" style={{ gap: 8, flexWrap: 'wrap' }}>
          {meta.contentType && (
            <span style={{
              fontSize: 'var(--text-xs)', padding: '1px 8px', borderRadius: 4,
              background: 'var(--bg-app-3)', color: 'var(--tx-muted)',
              textTransform: 'capitalize',
            }}>
              {meta.contentType}
            </span>
          )}
          {meta.framework && (
            <span style={{
              fontSize: 'var(--text-xs)', padding: '1px 8px', borderRadius: 4,
              background: 'rgba(125,211,252,0.1)', color: 'var(--tok-key)',
            }}>
              {meta.framework}
            </span>
          )}
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--tx-muted)' }}>{date}</span>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="mb-delete-btn hover-text-red"
          title="Delete memory"
          style={{ padding: 4, borderRadius: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)', transition: 'color 0.12s' }}
        >
          <Pxi name="times" size={12} />
        </button>
      </div>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-secondary)', margin: '8px 0 0', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {memory.content}
      </p>
      {meta.tags && meta.tags.length > 0 && (
        <div className="flex-v-center" style={{ gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
          {meta.tags.map((tag) => (
            <span
              key={tag}
              style={{
                fontSize: 'var(--text-xs)', padding: '1px 8px', borderRadius: 4,
                  background: 'var(--glass-bg)', color: 'var(--tx-muted)',
              }}
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

const MemoryStats = memo(({ totalMemories, memoriesByTask }: { totalMemories: number; memoriesByTask: Record<string, number> }) => (
  <div className="flex-v-center" style={{ gap: 8, fontSize: 'var(--text-xs)', color: 'var(--tx-muted)' }}>
    <span>{totalMemories} memories</span>
    <span style={{ opacity: 0.4 }}>·</span>
    <span>{Object.keys(memoriesByTask).length} tasks</span>
  </div>
))

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

  useEffect(() => { loadMemories() }, [])

  useEffect(() => {
    let filtered = memories
    if (filterType !== 'all') {
      filtered = filtered.filter(m => m.metadata.contentType === filterType)
    }
    if (searchQuery.trim()) {
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
      const results = await memoryStore.search('', 100)
      setMemories(results)
      setFilteredMemories(results)
    } catch (error) {
      log.error('Failed to load memories', error instanceof Error ? error : new Error(String(error)))
    }
  }

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setFilteredMemories(memories); return }
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

  const contentTypeOptions: Array<'all' | MemoryMetadata['contentType']> = ['all', 'code', 'research', 'plan', 'output', 'conversation']

  return (
    <div className="flex-col mb-root">
      {/* Header */}
      <div className="mb-header">
        <div className="flex-v-center justify-between" style={{ marginBottom: 10 }}>
          <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--tx-primary)', margin: 0, letterSpacing: '0.04em' }}>Memory Browser</h3>
          {onClose && (
            <button
              onClick={onClose}
              className="hover-text-primary"
              style={{ padding: 4, background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--tx-muted)', borderRadius: 4 }}
            >
              <Pxi name="times" size={14} />
            </button>
          )}
        </div>

        {/* Search */}
        <div style={{ position: 'relative' }}>
          <input
            type="text"
            placeholder="Search memories…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="settings-input"
            style={{ paddingLeft: 30, width: '100%', boxSizing: 'border-box' }}
          />
          <Pxi name="search" size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx-muted)', pointerEvents: 'none' }} />
        </div>

        {/* Filters */}
        <div className="flex-v-center" style={{ gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
          {contentTypeOptions.map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              style={{
                padding: '2px 8px', fontSize: 'var(--text-xs)', borderRadius: 4, border: 'none', cursor: 'pointer',
                textTransform: 'capitalize', transition: 'background 0.1s, color 0.1s',
                  background: filterType === type ? 'var(--amber-a16)' : 'var(--glass-bg)',
                color: filterType === type ? 'var(--amber)' : 'var(--tx-muted)',
                fontWeight: filterType === type ? 600 : 400,
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="mb-stats-row">
        <MemoryStats totalMemories={stats.totalMemories} memoriesByTask={stats.memoriesByTask} />
      </div>

      {/* Memory List */}
      <div className="flex-col mb-list">
        {filteredMemories.length === 0 ? (
          <div className="flex-col flex-center mb-empty">
            <Pxi name="database" size={28} style={{ color: 'var(--tx-muted)', opacity: 0.4, marginBottom: 8 }} />
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--tx-muted)', margin: 0 }}>No memories found</p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--tx-muted)', opacity: 0.6, margin: '4px 0 0' }}>Completed tasks will be automatically saved here</p>
          </div>
        ) : (
          filteredMemories.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              isSelected={selectedId === memory.id}
              onSelect={() => setSelectedId(memory.id === selectedId ? null : memory.id)}
              onDelete={() => handleDelete(memory.id)}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="mb-footer">
        <button
          onClick={() => memoryStore.clear().then(loadMemories)}
          className="flex-v-center justify-center hover-text-red"
          style={{
            width: '100%', padding: '8px 12px', fontSize: 'var(--text-xs)', borderRadius: 6,
            border: '1px solid rgba(248,113,113,0.2)', background: 'transparent',
            color: 'var(--tx-muted)', cursor: 'pointer', gap: 8,
            transition: 'color 0.12s, border-color 0.12s',
          }}
        >
          <Pxi name="trash-alt" size={12} />
          Clear All Memories
        </button>
      </div>
    </div>
  )
})

// ── Compact Memory View (for sidebar) ───────────────────────────────────────────────

export const CompactMemoryView = memo(({ onSelectMemory }: { onSelectMemory?: (content: string) => void }) => {
  const [memories, setMemories] = useState<MemoryResult[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    memoryStore.search('', 5).then(setMemories).catch(() => {})
  }, [])

  if (memories.length === 0) return null

  return (
      <div style={{ border: '1px solid var(--glass-border)', borderRadius: 8, overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex-v-center justify-between hover-bg-app-3"
        style={{
          width: '100%', padding: '8px 12px', background: 'var(--glass-bg)',
          border: 'none', cursor: 'pointer', transition: 'background 0.12s',
        }}
      >
        <span className="flex-v-center" style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--tx-secondary)', gap: 8 }}>
          <Pxi name="database" size={12} style={{ color: 'var(--tx-tertiary)' }} />
          Memory ({memories.length})
        </span>
        <Pxi name={expanded ? 'chevron-up' : 'chevron-down'} size={11} style={{ color: 'var(--tx-muted)' }} />
      </button>

      {expanded && (
        <div className="flex-col" style={{ padding: '4px', maxHeight: 192, overflowY: 'auto' }}>
          {memories.map((memory) => (
            <button
              key={memory.id}
              onClick={() => onSelectMemory?.(memory.content)}
              className="hover-bg-app-3"
              style={{
                width: '100%', textAlign: 'left', padding: '8px 8px', borderRadius: 4,
                background: 'transparent', border: 'none', cursor: 'pointer',
                fontSize: 'var(--text-xs)', color: 'var(--tx-muted)', transition: 'background 0.1s',
              }}
            >
              {memory.content.slice(0, 80)}{memory.content.length > 80 ? '…' : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  )
})
