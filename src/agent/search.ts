/**
 * Unified Web Search Module
 *
 * All search requests go through the Rust backend via Tauri invoke.
 * The Rust backend handles: provider cascade, caching, rate limiting,
 * deduplication, and RRF ranking.
 *
 * This module provides:
 * 1. `runSearch()` — formatted string output for the agent loop
 * 2. `searchRaw()` — typed SearchResult[] for programmatic use
 * 3. Status event callbacks for UI progress indicators
 */

import { tauriInvoke } from '../tauri'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SearchConfig {
  /** Provider preference: 'auto' lets the backend cascade, or force a specific one */
  provider: string
  serperKey?: string
  tavilyKey?: string
  braveKey?: string
  googleCseKey?: string
  googleCseId?: string
  searxngUrl?: string
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
 * Execute a search via the Rust backend and return typed results.
 * This is the low-level function — use `runSearch` for agent-formatted output.
 */
export async function searchRaw(
  query: string,
  numResults = 5,
): Promise<SearchResult[]> {
  const results = await tauriInvoke<SearchResult[]>('search', {
    query,
    numResults,
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
  const t0 = Date.now()

  onStatus?.({
    phase: 'searching',
    provider: 'auto',
    query,
    message: 'Searching…',
  })

  try {
    const results = await searchRaw(query, num)

    if (results.length === 0) {
      onStatus?.({
        phase: 'no_results',
        provider: 'auto',
        query,
        message: 'No results found.',
      })
      return `No results for "${query}".`
    }

    const durationMs = Date.now() - t0
    onStatus?.({
      phase: 'complete',
      provider: results[0]?.provider ?? 'auto',
      query,
      message: `Found ${results.length} results`,
      resultCount: results.length,
      durationMs,
    })

    return formatResultsForAgent(results)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[search] Failed:', message)

    onStatus?.({
      phase: 'all_failed',
      provider: 'auto',
      query,
      message: `Search failed: ${message}`,
    })

    // Return error as content rather than throwing — the agent can decide how to handle it
    return `Search failed for "${query}": ${message}`
  }
}

// ─── Formatting ─────────────────────────────────────────────────────────────

/**
 * Format search results into a string the LLM can parse.
 * Compact format: numbered list with title, URL, and snippet.
 */
function formatResultsForAgent(results: SearchResult[]): string {
  return results
    .map((r, i) => {
      const lines = [
        `[${i + 1}] ${r.title}`,
        `    URL: ${r.url}`,
        `    ${r.snippet}`,
      ]
      return lines.join('\n')
    })
    .join('\n\n')
}
