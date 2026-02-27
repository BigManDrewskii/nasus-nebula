/**
 * Unified Web Search Backend (Rust-powered)
 *
 * This module redirects all search requests to the Rust backend via Tauri invoke.
 * This resolves CORS issues and enables professional-grade features like RRF ranking,
 * two-tier caching, and circuit breakers.
 */

import { tauriInvoke } from '../tauri'

export interface SearchConfig {
  provider: string        // 'auto' | 'serper' | 'tavily' | etc. (Backend handles logic)
  apiKey?: string
  serperKey?: string
  tavilyKey?: string
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

export interface SearchResult {
  title: string
  url: string
  snippet: string
  provider: string
  score: number
}

/**
 * Main search dispatcher.
 * Now exclusively uses the Rust backend to avoid CORS and performance issues.
 */
export async function runSearch(
  query: string,
  num: number,
  _cfg: SearchConfig,
  onStatus?: SearchStatusCallback,
): Promise<string> {
  const t0 = Date.now()
  onStatus?.({ phase: 'searching', provider: 'Native', query, message: 'Searching via unified Rust backend…' })

  try {
    const results = await tauriInvoke<SearchResult[]>('search', { query, numResults: num })
    
    if (!results || results.length === 0) {
      onStatus?.({ phase: 'no_results', provider: 'Native', query, message: 'No results found.' })
      return `No results for "${query}".`
    }

    const durationMs = Date.now() - t0
    onStatus?.({ 
      phase: 'complete', 
      provider: 'Unified', 
      query, 
      message: `Found ${results.length} results via Rust backend`, 
      resultCount: results.length,
      durationMs 
    })

    // Format results for the AI agent
    return results
      .map((r, i) => [
        `[${i + 1}] ${r.title}`,
        `    URL: ${r.url}`,
        `    ${r.snippet}`,
        `    (Provider: ${r.provider}, Score: ${r.score.toFixed(4)})`
      ].join('\n'))
      .join('\n\n')

  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    console.error('Search failed:', e)
    onStatus?.({ phase: 'all_failed', provider: 'Native', query, message: `Search failed: ${error}` })
    throw new Error(`Search failed: ${error}`)
  }
}
