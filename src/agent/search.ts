/**
 * Web search backends for the browser agent.
 *
 * Extracted from tools.ts to keep that file focused on tool execution.
 * Backend priority (Auto mode):
 *   1. Serper        — Google results via API, 2,500 free queries
 *   2. Tavily        — AI-optimized, 1,000 free credits/month
 *   3. Brave Search  — best real-web index, 2,000 req/mo free
 *   4. Google CSE    — 100 req/day free, CORS-safe
 *   5. SearXNG       — free public instances or self-hosted
 *   6. DuckDuckGo    — via CORS proxy fallback
 *   7. Wikipedia     — parallel supplement for all factual queries
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export interface SearchConfig {
  provider: string        // 'auto' | 'brave' | 'google' | 'searxng' | 'ddg' | 'serper' | 'tavily'
  braveKey?: string
  googleCseKey?: string
  googleCseId?: string
  serperKey?: string
  tavilyKey?: string
  searxngUrl?: string     // Custom SearXNG instance URL (overrides rotating public list)
}

export interface SearchStatusEvent {
  phase: 'searching' | 'fallback' | 'complete' | 'no_results' | 'all_failed'
  provider: string
  query: string
  message: string
  resultCount?: number
  durationMs?: number
}

export type SearchStatusCallback = (event: SearchStatusEvent) => void

// ── SearXNG public instances ──────────────────────────────────────────────────

const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.inetol.net',
  'https://searx.tiekoetter.com',
  'https://searx.oloke.ch',
]

// ── Individual backends ────────────────────────────────────────────────────────

async function searchBrave(query: string, num: number, apiKey: string): Promise<string> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${num}&text_decorations=0&result_filter=web`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  })
  if (!res.ok) throw new Error(`Brave HTTP ${res.status}`)
  const json = await res.json()
  const webResults: Array<{ title?: string; url?: string; description?: string }> = json?.web?.results ?? []
  if (webResults.length === 0) return `No results for "${query}".`
  return webResults
    .slice(0, num)
    .map((r, i) => [
      `[${i + 1}] ${r.title ?? '(no title)'}`,
      r.url ? `    URL: ${r.url}` : '',
      r.description ? `    ${r.description.slice(0, 150)}` : '',
    ].filter(Boolean).join('\n'))
    .join('\n\n')
}

async function searchGoogleCSE(query: string, num: number, apiKey: string, cseId: string): Promise<string> {
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(apiKey)}&cx=${encodeURIComponent(cseId)}&q=${encodeURIComponent(query)}&num=${Math.min(num, 10)}`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Google CSE HTTP ${res.status}: ${body.slice(0, 120)}`)
  }
  const json = await res.json()
  const items: Array<{ title?: string; link?: string; snippet?: string }> = json.items ?? []
  if (items.length === 0) return `No results for "${query}".`
  return items
    .slice(0, num)
    .map((r, i) => [
      `[${i + 1}] ${r.title ?? '(no title)'}`,
      r.link ? `    URL: ${r.link}` : '',
      r.snippet ? `    ${r.snippet.slice(0, 150)}` : '',
    ].filter(Boolean).join('\n'))
    .join('\n\n')
}

async function searchSerper(query: string, num: number, apiKey: string): Promise<string> {
  const res = await fetch('https://google.serper.dev/search', {
    method: 'POST',
    headers: { 'X-API-KEY': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: query, num }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Serper HTTP ${res.status}: ${body.slice(0, 120)}`)
  }
  const json = await res.json()
  const parts: string[] = []
  if (json.knowledgeGraph) {
    const kg = json.knowledgeGraph
    if (kg.title) {
      parts.push(`[Knowledge] ${kg.title}`)
      if (kg.description) parts.push(`    ${kg.description.slice(0, 200)}`)
      if (kg.website)     parts.push(`    URL: ${kg.website}`)
      parts.push('')
    }
  }
  const organic: Array<{ title?: string; link?: string; snippet?: string; date?: string }> = json.organic ?? []
  if (organic.length === 0 && parts.length === 0) return `No results for "${query}".`
  for (let i = 0; i < Math.min(organic.length, num); i++) {
    const r = organic[i]
    parts.push(`[${i + 1}] ${r.title ?? '(no title)'}`)
    if (r.link)    parts.push(`    URL: ${r.link}`)
    if (r.snippet) parts.push(`    ${r.snippet.slice(0, 180)}`)
    if (r.date)    parts.push(`    Date: ${r.date}`)
    parts.push('')
  }
  return parts.join('\n').trim()
}

async function searchTavily(query: string, num: number, apiKey: string): Promise<string> {
  const res = await fetch('https://api.tavily.com/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey, query, search_depth: 'basic', max_results: num, include_answer: true }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Tavily HTTP ${res.status}: ${body.slice(0, 120)}`)
  }
  const json = await res.json()
  const parts: string[] = []
  if (json.answer) { parts.push(`[Direct Answer] ${json.answer}`); parts.push('') }
  const results: Array<{ title?: string; url?: string; content?: string; published_date?: string }> = json.results ?? []
  if (results.length === 0 && parts.length === 0) return `No results for "${query}".`
  for (let i = 0; i < Math.min(results.length, num); i++) {
    const r = results[i]
    parts.push(`[${i + 1}] ${r.title ?? '(no title)'}`)
    if (r.url)            parts.push(`    URL: ${r.url}`)
    if (r.content)        parts.push(`    ${r.content.slice(0, 180)}`)
    if (r.published_date) parts.push(`    Date: ${r.published_date}`)
    parts.push('')
  }
  return parts.join('\n').trim()
}

async function searchSearXNG(query: string, num: number, customUrl?: string): Promise<string> {
  let lastErr: Error | null = null
  const instances = customUrl
    ? [customUrl]
    : [...SEARXNG_INSTANCES].sort(() => Math.random() - 0.5)

  for (const base of instances) {
    try {
      const url = `${base}/search?q=${encodeURIComponent(query)}&format=json&categories=general`
      const res = await fetch(url, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(6000),
      })
      if (!res.ok) { lastErr = new Error(`SearXNG ${base} HTTP ${res.status}`); continue }
      const json = await res.json()
      const results: Array<{ title?: string; url?: string; content?: string }> = json.results ?? []
      if (results.length === 0) continue
      return results
        .slice(0, num)
        .map((r, i) => [
          `[${i + 1}] ${r.title ?? '(no title)'}`,
          r.url ? `    URL: ${r.url}` : '',
          r.content ? `    ${r.content.slice(0, 150)}` : '',
        ].filter(Boolean).join('\n'))
        .join('\n\n')
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error(String(e))
    }
  }
  throw lastErr ?? new Error('All SearXNG instances failed')
}

async function searchDuckDuckGo(query: string, num: number): Promise<string> {
  const apiUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
  const proxies = [
    `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`,
    `https://api.allorigins.win/raw?url=${encodeURIComponent(apiUrl)}`,
  ]
  let json: Record<string, unknown> | null = null
  for (const proxyUrl of proxies) {
    try {
      const res = await fetch(proxyUrl, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      })
      if (res.ok) { json = await res.json(); break }
    } catch { /* try next proxy */ }
  }
  if (!json) throw new Error('DuckDuckGo unavailable (CORS proxy failed)')

  const lines: string[] = []
  const abstract = json.AbstractText as string | undefined
  const abstractUrl = json.AbstractURL as string | undefined
  if (abstract) {
    lines.push(`[Abstract] ${abstract}`)
    if (abstractUrl) lines.push(`  URL: ${abstractUrl}`)
    lines.push('')
  }
  const topics: Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }> =
    (json.RelatedTopics as Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }>) ?? []
  let count = 0
  for (const t of topics) {
    if (count >= num) break
    if (t.Text && t.FirstURL) {
      lines.push(`[${count + 1}] ${t.Text}\n    URL: ${t.FirstURL}`)
      count++
    } else if (t.Topics) {
      for (const sub of t.Topics as Array<{ Text?: string; FirstURL?: string }>) {
        if (count >= num) break
        if (sub.Text && sub.FirstURL) {
          lines.push(`[${count + 1}] ${sub.Text}\n    URL: ${sub.FirstURL}`)
          count++
        }
      }
    }
  }
  if (lines.length === 0) throw new Error(`No DuckDuckGo instant results for "${query}"`)
  return lines.join('\n')
}

async function searchWikipedia(query: string): Promise<string> {
  const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=3&utf8=1&format=json&origin=*`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  if (!res.ok) throw new Error(`Wikipedia HTTP ${res.status}`)
  const json = await res.json()
  const hits: Array<{ title?: string; snippet?: string; pageid?: number }> = json?.query?.search ?? []
  if (hits.length === 0) return ''
  return '[Wikipedia]\n' + hits
    .map((h) => {
      const title = h.title ?? ''
      const snippet = (h.snippet ?? '').replace(/<[^>]+>/g, '').slice(0, 150)
      const link = title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : ''
      return `  • ${title}${link ? `\n    URL: ${link}` : ''}${snippet ? `\n    ${snippet}` : ''}`
    })
    .join('\n\n')
}

// ── Main search dispatcher ─────────────────────────────────────────────────────

export async function runSearch(
  query: string,
  num: number,
  cfg: SearchConfig,
  onStatus?: SearchStatusCallback,
): Promise<string> {
  const { provider, braveKey, googleCseKey, googleCseId, serperKey, tavilyKey, searxngUrl } = cfg
  const results: string[] = []

  async function tryBackend(name: string, fn: () => Promise<string>): Promise<boolean> {
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: name, query, message: `Searching with ${name}…` })
    try {
      const r = await fn()
      if (r && r.trim()) {
        const durationMs = Date.now() - t0
        const resultCount = (r.match(/^\[/gm) ?? []).length || 1
        onStatus?.({ phase: 'complete', provider: name, query, message: `Found results via ${name}`, resultCount, durationMs })
        results.push(`[${name}]\n${r}`)
        return true
      }
      onStatus?.({ phase: 'no_results', provider: name, query, message: `No results from ${name}` })
    } catch {
      onStatus?.({ phase: 'fallback', provider: name, query, message: `${name} failed, trying next…` })
    }
    return false
  }

  // ── Named provider mode ────────────────────────────────────────────────────
  if (provider === 'serper') {
    if (!serperKey) throw new Error('Serper API key not configured. Add it in Settings → Web Search.')
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'Serper', query, message: 'Searching with Serper…' })
    const r = await searchSerper(query, num, serperKey)
    onStatus?.({ phase: 'complete', provider: 'Serper', query, message: 'Found results via Serper', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'tavily') {
    if (!tavilyKey) throw new Error('Tavily API key not configured. Add it in Settings → Web Search.')
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'Tavily', query, message: 'Searching with Tavily…' })
    const r = await searchTavily(query, num, tavilyKey)
    onStatus?.({ phase: 'complete', provider: 'Tavily', query, message: 'Found results via Tavily', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'brave') {
    if (!braveKey) throw new Error('Brave Search key not configured. Add it in Settings.')
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'brave', query, message: 'Searching with Brave…' })
    const r = await searchBrave(query, num, braveKey)
    onStatus?.({ phase: 'complete', provider: 'brave', query, message: 'Found results via Brave', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'google') {
    if (!googleCseKey || !googleCseId) throw new Error('Google CSE key / engine ID not configured. Add them in Settings.')
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'google', query, message: 'Searching with Google CSE…' })
    const r = await searchGoogleCSE(query, num, googleCseKey, googleCseId)
    onStatus?.({ phase: 'complete', provider: 'google', query, message: 'Found results via Google CSE', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'searxng') {
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'searxng', query, message: 'Searching with SearXNG…' })
    const r = await searchSearXNG(query, num, searxngUrl)
    onStatus?.({ phase: 'complete', provider: 'searxng', query, message: 'Found results via SearXNG', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'ddg') {
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'ddg', query, message: 'Searching with DuckDuckGo…' })
    const r = await searchDuckDuckGo(query, num)
    onStatus?.({ phase: 'complete', provider: 'ddg', query, message: 'Found results via DuckDuckGo', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'wikipedia') {
    const t0 = Date.now()
    onStatus?.({ phase: 'searching', provider: 'wikipedia', query, message: 'Searching Wikipedia…' })
    const r = await searchWikipedia(query)
    onStatus?.({ phase: 'complete', provider: 'wikipedia', query, message: 'Found results via Wikipedia', resultCount: (r.match(/^\[/gm) ?? []).length || 1, durationMs: Date.now() - t0 })
    return r
  }

  // ── Auto mode: cascade through all available backends ─────────────────────
  const wikiPromise = searchWikipedia(query).catch(() => '')
  let primaryOk = false

  if (serperKey)                    primaryOk = await tryBackend('Serper',      () => searchSerper(query, num, serperKey))
  if (!primaryOk && tavilyKey)      primaryOk = await tryBackend('Tavily',      () => searchTavily(query, num, tavilyKey))
  if (!primaryOk && braveKey)       primaryOk = await tryBackend('Brave Search',() => searchBrave(query, num, braveKey))
  if (!primaryOk && googleCseKey && googleCseId)
                                    primaryOk = await tryBackend('Google CSE',  () => searchGoogleCSE(query, num, googleCseKey, googleCseId))
  if (!primaryOk)                   primaryOk = await tryBackend('SearXNG',     () => searchSearXNG(query, num, searxngUrl))
  if (!primaryOk)                              await tryBackend('DuckDuckGo',   () => searchDuckDuckGo(query, num))

  const wiki = await wikiPromise
  if (wiki.trim()) results.push(wiki)

  if (results.length === 0) {
    onStatus?.({ phase: 'all_failed', provider: 'none', query, message: 'All search providers failed. Proceeding with existing knowledge.' })
    return `No results for "${query}".`
  }

  return results.join('\n\n---\n\n')
}
