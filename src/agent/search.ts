/**
 * Unified Web Search Module
 *
 * Search requests route through either:
 * - Tauri mode: Rust backend via Tauri invoke (caching, rate limiting)
 * - Browser mode: Direct Exa API call (fallback for development)
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

// ─── Browser-mode search (direct Exa API call) ─────────────────────────────

/**
 * Check if running in Tauri environment.
 */
function isTauriMode(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Browser-only search using Exa API directly.
 * Fallback for when not running in Tauri mode.
 */
async function searchBrowser(query: string, numResults: number): Promise<SearchResult[]> {
  const apiKey = useAppStore.getState().exaKey

  if (!apiKey) {
    throw new Error(
      'Exa API key not configured. Please add it in Settings:\n' +
      '1. Go to https://dashboard.exa.ai to get your free API key\n' +
      '2. Paste it in Settings > Search > Exa API Key'
    )
  }

  console.log('[search] Browser mode: calling Exa API directly', { query, numResults })

  const response = await fetch('https://api.exa.ai/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
    },
    body: JSON.stringify({
      query,
      numResults,
      type: 'auto',
    }),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(`Exa API error (${response.status}): ${errorText}`)
  }

  const data = await response.json()

  if (!data.results || !Array.isArray(data.results)) {
    throw new Error('Invalid response from Exa API')
  }

  console.log(`[search] Browser mode: got ${data.results.length} results from Exa`)

  return data.results.map((r: ExaResult) => ({
    title: r.title ?? 'Untitled',
    url: r.url,
    snippet: r.highlights?.join(' ') ?? r.text ?? '',
    provider: 'exa',
    score: r.score ?? 0,
  }))
}

interface ExaResult {
  title: string | null
  url: string
  score: number | null
  highlights?: string[] | null
  text?: string | null
}

// ─── Raw search (returns typed results) ─────────────────────────────────────

/**
 * Execute a search and return typed results.
 * Uses Rust backend when in Tauri mode, or calls Exa API directly in browser mode.
 */
export async function searchRaw(
  query: string,
  numResults = 5,
): Promise<SearchResult[]> {
  if (isTauriMode()) {
    console.log('[search] Tauri mode: using Rust backend')
    const results = await tauriInvoke<SearchResult[]>('search', {
      query,
      numResults,
      searchConfig: {
        exaKey: useAppStore.getState().exaKey,
      },
    })
    return results ?? []
  } else {
    // Browser mode: call Exa directly
    return searchBrowser(query, numResults)
  }
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
