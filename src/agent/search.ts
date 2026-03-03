/**
 * Unified Web Search Module
 *
 * Search requests route through the Rust backend via Tauri invoke.
 * Provides caching and rate limiting.
 *
 * This module provides:
 * 1. `runSearch()` — formatted string output for the agent loop
 * 2. `searchRaw()` — typed SearchResult[] for programmatic use
 * 3. Status event callbacks for UI progress indicators
 */

import { tauriInvoke } from '../tauri'
import { useAppStore } from '../store'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SearchConfig {
  /** Exa AI API key */
  exaKey: string
}

export interface SearchResult {
  title: string
  url: string
  snippet: string
  provider?: string
  score?: number
}

export interface SearchStatusEvent {
  phase: 'searching' | 'complete' | 'no_results' | 'all_failed'
  provider: string
  query: string
  message: string
  resultCount?: number
  durationMs?: number
}

export type SearchStatusCallback = (event: SearchStatusEvent) => void

// ─── Raw search (returns typed results) ─────────────────────────────────────

/**
 * Execute a search and return typed results.
 * Uses the Rust backend.
 */
export async function searchRaw(
  query: string,
  numResults = 5,
): Promise<SearchResult[]> {
  const results = await tauriInvoke<SearchResult[]>('search', {
    query,
    numResults,
    searchConfig: {
      exaKey: useAppStore.getState().exaKey,
    },
  })
  return results ?? []
}

// ─── Formatted search (returns string for agent context) ────────────────────

/**
 * Main search dispatcher for the agent loop.
 * Returns a formatted string suitable for LLM consumption.
 *
 * @param query - Search query string
 * @param num - Number of results (default 5, max 10)
 * @param _cfg - Search config (currently unused — Rust backend reads keys from its own state)
 * @param onStatus - Optional callback for UI progress events
 */
export async function runSearch(
  query: string,
  num = 5,
  _cfg?: SearchConfig,
  onStatus?: SearchStatusCallback,
): Promise<string> {
  const startTime = Date.now()
  const results = await searchRaw(query, num)
  const duration = Date.now() - startTime

  if (results.length === 0) {
    onStatus?.({
      phase: 'no_results',
      provider: 'search',
      query,
      message: `No results found for "${query}"`,
    })
    return ''
  }

  onStatus?.({
    phase: 'complete',
    provider: results[0]?.provider ?? 'search',
    query,
    message: `Found ${results.length} results for "${query}"`,
    resultCount: results.length,
    durationMs: duration,
  })

  return results
    .map((r, i) => {
      let line = `[${i + 1}] "${r.title}"\n    URL: ${r.url}\n`
      if (r.snippet) {
        // Truncate very long snippets to save tokens
        const truncated = r.snippet.length > 300
          ? r.snippet.slice(0, 297) + '...'
          : r.snippet
        line += `    ${truncated}\n`
      }
      return line
    })
    .join('\n')
}
