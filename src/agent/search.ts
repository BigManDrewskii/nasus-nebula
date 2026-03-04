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
 * Fallback search using DuckDuckGo (no API key required).
 */
async function duckduckgoSearch(query: string, numResults = 5): Promise<SearchResult[]> {
  // Use the HTML version of DuckDuckGo for easier scraping
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    // Add a small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000))

    const response = await tauriInvoke<string>('http_fetch', { 
      url,
      headers: [
        'User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      ]
    })
    if (!response) return []
    
    // Response format from Tauri http_fetch is "status\nbody"
    const firstNewline = response.indexOf('\n')
    if (firstNewline === -1) return []
    const html = response.slice(firstNewline + 1)
    
    const results: SearchResult[] = []
    // Regex to match DuckDuckGo HTML results
    // Title and URL: <a class="result__a" href="(url)">(title)</a>
    // Snippet: <a class="result__snippet" ...>(snippet)</a>
    const resultRegex = /<div class="result nav-link[\s\S]*?<a class="result__a" href="([^"]+)">([\s\S]*?)<\/a>[\s\S]*?<a class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g
    
    let match
    while ((match = resultRegex.exec(html)) !== null && results.length < numResults) {
      const url = match[1]
      const title = match[2].replace(/<[^>]*>/g, '').trim()
      const snippet = match[3].replace(/<[^>]*>/g, '').trim()
      
      if (url && title) {
        results.push({
          title,
          url,
          snippet,
          provider: 'duckduckgo'
        })
      }
    }
    return results
  } catch (e) {
    console.warn('DuckDuckGo fallback failed:', e)
    return []
  }
}

/**
 * Execute a search and return typed results.
 * Uses the Rust backend with a TS fallback for DuckDuckGo.
 */
export async function searchRaw(
  query: string,
  numResults = 5,
): Promise<SearchResult[]> {
  const store = useAppStore.getState()
  const exaKey = store.exaKey
  
  // Try Exa first if key is present
  if (exaKey && exaKey.trim()) {
    try {
      const results = await tauriInvoke<SearchResult[]>('search', {
        query,
        numResults,
        searchConfig: { exaKey },
      })
      if (results && results.length > 0) return results
    } catch (e) {
      console.warn('Exa search failed, trying fallback:', e)
    }
  }
  
  // Fallback to DuckDuckGo
  return await duckduckgoSearch(query, numResults)
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
