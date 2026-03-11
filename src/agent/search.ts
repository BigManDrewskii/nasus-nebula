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
import { createLogger } from '../lib/logger'

const log = createLogger('Search')

// ─── Types ──────────────────────────────────────────────────────────────────

export interface SearchConfig {
  /** Exa AI API key */
  exaKey?: string
  /** Generic API key (alias for exaKey, used for compatibility) */
  apiKey?: string
  /** Brave Search API key */
  braveKey?: string
  /** Serper (Google) API key */
  serperKey?: string
  /** Tavily API key */
  tavilyKey?: string
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
  const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  try {
    await new Promise(r => setTimeout(r, 500))

    const response = await tauriInvoke<string>('http_fetch', {
      url: searchUrl,
      headers: [
        'User-Agent', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language', 'en-US,en;q=0.9',
      ]
    })
    if (!response) return []

    // Tauri http_fetch returns "status\nbody"
    const firstNewline = response.indexOf('\n')
    if (firstNewline === -1) return []
    const html = response.slice(firstNewline + 1)

    const results: SearchResult[] = []

    // Extract all result__a links — DDG wraps real URL in a redirect: //duckduckgo.com/l/?uddg=<encoded>
    // Also handle href that is already a direct URL
    const titleRegex = /<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g
    const snippetRegex = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g

    const titles: Array<{ url: string; title: string }> = []
    let m: RegExpExecArray | null
    while ((m = titleRegex.exec(html)) !== null) {
      let href = m[1].replace(/&amp;/g, '&')
      // Decode DDG redirect: //duckduckgo.com/l/?uddg=<URL>&rut=...
      const uddg = href.match(/[?&]uddg=([^&]+)/)
      if (uddg) {
        try { href = decodeURIComponent(uddg[1]) } catch { /* keep raw */ }
      } else if (href.startsWith('//')) {
        href = 'https:' + href
      }
      const title = m[2].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim()
      if (href && title) titles.push({ url: href, title })
    }

    const snippets: string[] = []
    while ((m = snippetRegex.exec(html)) !== null) {
      snippets.push(m[1].replace(/<[^>]*>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").trim())
    }

    for (let i = 0; i < Math.min(titles.length, numResults); i++) {
      results.push({
        title: titles[i].title,
        url: titles[i].url,
        snippet: snippets[i] ?? '',
        provider: 'duckduckgo',
      })
    }

    return results
  } catch (e) {
    log.warn('DuckDuckGo fallback failed', e instanceof Error ? e : new Error(String(e)))
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
  const exaKey = store.exaKey?.trim() ?? ''
  const braveKey = store.braveKey?.trim() ?? ''
  const serperKey = store.serperKey?.trim() ?? ''
  const tavilyKey = store.tavilyKey?.trim() ?? ''

  const hasAnyKey = exaKey || braveKey || serperKey || tavilyKey

  if (hasAnyKey) {
    try {
      const results = await tauriInvoke<SearchResult[]>('search', {
        query,
        numResults,
        searchConfig: { exaKey, braveKey, serperKey, tavilyKey },
      })
      if (results && results.length > 0) return results
    } catch (e) {
      log.warn('Search failed, trying DuckDuckGo fallback', e instanceof Error ? e : new Error(String(e)))
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
    throw new Error(`No search results found for "${query}". Try rephrasing the query or use http_fetch with a direct URL instead.`)
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
