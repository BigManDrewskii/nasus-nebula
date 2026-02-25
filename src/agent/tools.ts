import { extractReadableContent } from './htmlExtractor'
import { executePython, executeBash } from './sandboxRuntime'
import type { ExecutionConfig } from './sandboxRuntime'
import {
  browserNavigate,
  browserClick,
  browserType,
  browserExtract,
  browserScreenshot,
  browserScroll,
} from './browserBridge'

/**
 * Browser-safe tool execution for the web agent.
 *
 * In the browser we cannot run Docker / bash. Instead:
 * - http_fetch  → native fetch (same-origin CORS limitations apply)
 * - search_web  → multi-backend search with graceful fallback chain
 * - bash / read_file / write_file / list_files → in-memory workspace shim
 *
 * Search backend priority (Auto mode):
 *   1. Serper           — Google results via API, 2,500 free queries
 *   2. Tavily           — AI-optimized, 1,000 free credits/month
 *   3. Brave Search API — best real-web index, 2,000 req/mo free
 *   4. Google CSE       — 100 req/day free, CORS-safe
 *   5. SearXNG          — free public instances or self-hosted
 *   6. DuckDuckGo Instant — via CORS proxy fallback (limited to instant answers)
 *   7. Wikipedia        — parallel supplement for all factual queries
 *
 * Wikipedia is used as a parallel supplement for factual queries regardless of
 * which main backend is active.
 *
 * The in-memory workspace gives the agent a real key-value store so it can
 * read/write task_plan.md, findings.md, progress.md between turns.
 */

// ── In-memory workspace ───────────────────────────────────────────────────────
const workspaceStore: Map<string, Map<string, string>> = new Map()
// Version counter per task — incremented on every write so React can subscribe
const workspaceVersions: Map<string, number> = new Map()

// ── Workspace localStorage persistence ───────────────────────────────────────
const WS_STORAGE_PREFIX = 'nasus-ws-'
// Max size per file stored in localStorage (32 KB) — prevents quota exhaustion
const WS_MAX_FILE_BYTES = 32 * 1024

function loadWorkspaceFromStorage(taskId: string): Map<string, string> {
  try {
    const raw = localStorage.getItem(`${WS_STORAGE_PREFIX}${taskId}`)
    if (!raw) return new Map()
    const obj = JSON.parse(raw) as Record<string, string>
    return new Map(Object.entries(obj))
  } catch {
    return new Map()
  }
}

function saveWorkspaceToStorage(taskId: string, ws: Map<string, string>) {
  try {
    const obj: Record<string, string> = {}
    for (const [k, v] of ws.entries()) {
      // Skip oversized binary blobs (e.g. screenshots stored as data URLs)
      if (v.length <= WS_MAX_FILE_BYTES) obj[k] = v
    }
    localStorage.setItem(`${WS_STORAGE_PREFIX}${taskId}`, JSON.stringify(obj))
  } catch {
    // localStorage quota exceeded — best effort, ignore
  }
}

export function getWorkspace(taskId: string): Map<string, string> {
  if (!workspaceStore.has(taskId)) {
    const loaded = loadWorkspaceFromStorage(taskId)
    workspaceStore.set(taskId, loaded)
    // If files exist, set version to 1 so subscribers see a non-zero version
    if (loaded.size > 0 && !workspaceVersions.has(taskId)) {
      workspaceVersions.set(taskId, 1)
    }
  }
  return workspaceStore.get(taskId)!
}

export function getWorkspaceVersion(taskId: string): number {
  return workspaceVersions.get(taskId) ?? 0
}

function bumpVersion(taskId: string) {
  workspaceVersions.set(taskId, (workspaceVersions.get(taskId) ?? 0) + 1)
  // Persist to localStorage on every write
  const ws = workspaceStore.get(taskId)
  if (ws) saveWorkspaceToStorage(taskId, ws)
  window.dispatchEvent(new CustomEvent('nasus:workspace', { detail: { taskId } }))
}

export function clearWorkspace(taskId: string) {
  workspaceStore.delete(taskId)
  workspaceVersions.delete(taskId)
  try { localStorage.removeItem(`${WS_STORAGE_PREFIX}${taskId}`) } catch { /* ignore */ }
}

// ── Per-turn file tracker ─────────────────────────────────────────────────────
// Tracks files written during a single agent turn so the loop can emit output cards.

const turnFileTrackers: Map<string, { path: string; filename: string; content: string; size: number }[]> = new Map()

/** Call at the start of each agent turn to begin tracking write_file calls. */
export function startTurnTracking(taskId: string) {
  turnFileTrackers.set(taskId, [])
}

/** Call at the end of a turn to get all files written and clear the tracker. */
export function flushTurnFiles(taskId: string) {
  const files = turnFileTrackers.get(taskId) ?? []
  turnFileTrackers.delete(taskId)
  return files
}

function trackTurnFile(taskId: string, path: string, content: string) {
  const tracker = turnFileTrackers.get(taskId)
  if (!tracker) return
  const filename = path.split('/').pop() ?? path
  // Deduplicate — keep latest version of same path
  const idx = tracker.findIndex((f) => f.path === path)
  const entry = { path, filename, content, size: new TextEncoder().encode(content).length }
  if (idx !== -1) tracker[idx] = entry
  else tracker.push(entry)
}

/** Copy all workspace files from one task to another. */
export function copyWorkspace(sourceTaskId: string, destTaskId: string) {
  const source = getWorkspace(sourceTaskId)
  if (source.size === 0) return
  const dest = new Map(source)
  workspaceStore.set(destTaskId, dest)
  workspaceVersions.set(destTaskId, 1)
  saveWorkspaceToStorage(destTaskId, dest)
}

function normPath(p: string): string {
  return p.replace(/^\/workspace\/?/, '').replace(/^\.\//, '') || 'output.txt'
}

// ── Search config passed in from the store ────────────────────────────────────

export interface SearchConfig {
  provider: string        // 'auto' | 'brave' | 'google' | 'searxng' | 'ddg' | 'serper' | 'tavily'
  braveKey?: string
  googleCseKey?: string
  googleCseId?: string
  serperKey?: string
  tavilyKey?: string
  searxngUrl?: string     // Custom SearXNG instance URL (overrides rotating public list)
}

// Status emitted during a search so the UI can render real-time progress chips
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
// Curated list of instances known to allow CORS + JSON output.
// We rotate through them on failure.
const SEARXNG_INSTANCES = [
  'https://searx.be',
  'https://search.inetol.net',
  'https://searx.tiekoetter.com',
  'https://searx.oloke.ch',
]

// ── Individual search backends ────────────────────────────────────────────────

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

  const webResults: Array<{ title?: string; url?: string; description?: string }> =
    json?.web?.results ?? []

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
    headers: {
      'X-API-KEY': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ q: query, num }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Serper HTTP ${res.status}: ${body.slice(0, 120)}`)
  }
  const json = await res.json()
  const parts: string[] = []

  // Knowledge Graph — high-value direct answer
  if (json.knowledgeGraph) {
    const kg = json.knowledgeGraph
    if (kg.title) {
      parts.push(`[Knowledge] ${kg.title}`)
      if (kg.description) parts.push(`    ${kg.description.slice(0, 200)}`)
      if (kg.website) parts.push(`    URL: ${kg.website}`)
      parts.push('')
    }
  }

  // Organic results
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
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: 'basic',
      max_results: num,
      include_answer: true,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Tavily HTTP ${res.status}: ${body.slice(0, 120)}`)
  }
  const json = await res.json()
  const parts: string[] = []

  // Direct synthesized answer from Tavily
  if (json.answer) {
    parts.push(`[Direct Answer] ${json.answer}`)
    parts.push('')
  }

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
  // If a custom instance URL is provided, use it exclusively
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
  // DuckDuckGo's API blocks CORS in the browser. Route through a public CORS proxy.
  // We try two proxy hosts; fall back to a stub message if both fail.
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
      if (res.ok) {
        json = await res.json()
        break
      }
    } catch { /* try next proxy */ }
  }

  if (!json) {
    throw new Error('DuckDuckGo unavailable (CORS proxy failed)')
  }

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

  if (lines.length === 0) {
    throw new Error(`No DuckDuckGo instant results for "${query}"`)
  }
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

// ── Main search dispatcher ────────────────────────────────────────────────────

async function runSearch(
  query: string,
  num: number,
  cfg: SearchConfig,
  onStatus?: SearchStatusCallback,
): Promise<string> {
  const { provider, braveKey, googleCseKey, googleCseId, serperKey, tavilyKey, searxngUrl } = cfg
  const results: string[] = []

  // Helper to try a backend with status events and timing
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

  if (provider === 'serper') {
    if (!serperKey) throw new Error('Serper API key not configured. Add it in Settings → Web Search.')
    onStatus?.({ phase: 'searching', provider: 'Serper', query, message: 'Searching with Serper…' })
    const t0 = Date.now()
    const r = await searchSerper(query, num, serperKey)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'Serper', query, message: 'Found results via Serper', resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'tavily') {
    if (!tavilyKey) throw new Error('Tavily API key not configured. Add it in Settings → Web Search.')
    onStatus?.({ phase: 'searching', provider: 'Tavily', query, message: 'Searching with Tavily…' })
    const t0 = Date.now()
    const r = await searchTavily(query, num, tavilyKey)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'Tavily', query, message: 'Found results via Tavily', resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'brave') {
    if (!braveKey) throw new Error('Brave Search key not configured. Add it in Settings.')
    onStatus?.({ phase: 'searching', provider: 'brave', query, message: 'Searching with Brave…' })
    const t0 = Date.now()
    const r = await searchBrave(query, num, braveKey)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'brave', query, message: `Found results via Brave`, resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'google') {
    if (!googleCseKey || !googleCseId) throw new Error('Google CSE key / engine ID not configured. Add them in Settings.')
    onStatus?.({ phase: 'searching', provider: 'google', query, message: 'Searching with Google CSE…' })
    const t0 = Date.now()
    const r = await searchGoogleCSE(query, num, googleCseKey, googleCseId)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'google', query, message: `Found results via Google CSE`, resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'searxng') {
    onStatus?.({ phase: 'searching', provider: 'searxng', query, message: 'Searching with SearXNG…' })
    const t0 = Date.now()
    const r = await searchSearXNG(query, num, searxngUrl)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'searxng', query, message: `Found results via SearXNG`, resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'ddg') {
    onStatus?.({ phase: 'searching', provider: 'ddg', query, message: 'Searching with DuckDuckGo…' })
    const t0 = Date.now()
    const r = await searchDuckDuckGo(query, num)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'ddg', query, message: `Found results via DuckDuckGo`, resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  if (provider === 'wikipedia') {
    onStatus?.({ phase: 'searching', provider: 'wikipedia', query, message: 'Searching Wikipedia…' })
    const t0 = Date.now()
    const r = await searchWikipedia(query)
    const rc = (r.match(/^\[/gm) ?? []).length || 1
    onStatus?.({ phase: 'complete', provider: 'wikipedia', query, message: `Found results via Wikipedia`, resultCount: rc, durationMs: Date.now() - t0 })
    return r
  }

  // ── Auto mode: cascade through all available backends ─────────────────────
  // Run Wikipedia in parallel with the primary backend for richer context.
  const wikiPromise = searchWikipedia(query).catch(() => '')

  let primaryOk = false

  if (serperKey) {
    primaryOk = await tryBackend('Serper', () => searchSerper(query, num, serperKey))
  }

  if (!primaryOk && tavilyKey) {
    primaryOk = await tryBackend('Tavily', () => searchTavily(query, num, tavilyKey))
  }

  if (!primaryOk && braveKey) {
    primaryOk = await tryBackend('Brave Search', () => searchBrave(query, num, braveKey))
  }

  if (!primaryOk && googleCseKey && googleCseId) {
    primaryOk = await tryBackend('Google CSE', () => searchGoogleCSE(query, num, googleCseKey, googleCseId))
  }

  if (!primaryOk) {
    primaryOk = await tryBackend('SearXNG', () => searchSearXNG(query, num, searxngUrl))
  }

  if (!primaryOk) {
    await tryBackend('DuckDuckGo', () => searchDuckDuckGo(query, num))
  }

  // Append Wikipedia if it returned something
  const wiki = await wikiPromise
  if (wiki.trim()) results.push(wiki)

  if (results.length === 0) {
    onStatus?.({ phase: 'all_failed', provider: 'none', query, message: 'All search providers failed. Proceeding with existing knowledge.' })
    return `No results for "${query}".`
  }

  return results.join('\n\n---\n\n')
}

// ── Tool executor ─────────────────────────────────────────────────────────────

export async function executeTool(
  taskId: string,
  toolName: string,
  args: Record<string, unknown>,
  searchConfig?: SearchConfig,
  onSearchStatus?: SearchStatusCallback,
  executionConfig?: ExecutionConfig,
): Promise<{ output: string; isError: boolean }> {
  const ws = getWorkspace(taskId)

  switch (toolName) {
    case 'bash': {
      const cmd = String(args.command ?? '')
      const b64WriteMatch = cmd.match(/echo\s+'([A-Za-z0-9+/=\s]+)'\s*\|\s*base64\s+-d\s*>\s*(\S+)/)
      if (b64WriteMatch) {
        try {
          const decoded = atob(b64WriteMatch[1].replace(/\s/g, ''))
          const path = normPath(b64WriteMatch[2])
          ws.set(path, decoded)
          return { output: `written: ${b64WriteMatch[2]}`, isError: false }
        } catch { /* fall through */ }
      }

      const catMatch = cmd.match(/^cat\s+'?([^'>\s]+)'?\s*(?:2>&1)?$/)
      if (catMatch) {
        const path = normPath(catMatch[1])
        const content = ws.get(path)
        if (content !== undefined) return { output: content, isError: false }
        return { output: `cat: ${catMatch[1]}: No such file`, isError: true }
      }

      if (cmd.trim().startsWith('ls') || cmd.trim().startsWith('find')) {
        const files = [...ws.keys()]
        return { output: files.length ? files.map((f) => `/workspace/${f}`).join('\n') : '(empty workspace)', isError: false }
      }

      if (cmd.trim().startsWith('mkdir')) {
        return { output: '(directory created)', isError: false }
      }

      const echoMatch = cmd.match(/^echo\s+(.+)$/)
      if (echoMatch) {
        return { output: echoMatch[1].replace(/['"]/g, ''), isError: false }
      }

        // Intercept any command containing curl, wget, python, python3, node, pip, npm, git, apt
        if (/\bcurl\b|\bwget\b|\bpython3?\b|\bnode\b|\bnpm\b|\bpip3?\b|\bgit\b|\bapt\b|\bapt-get\b|\bwhich\b/.test(cmd)) {
          return {
            output: '[Browser sandbox: shell commands (curl, wget, python3, etc.) are not available. Use http_fetch or search_web for network access, and read_file/write_file for file operations. Use python_execute for Python code, bash_execute if a cloud sandbox is configured.]',
            isError: false,
          }
        }

        return {
          output:
            '[Browser sandbox: arbitrary bash commands cannot run. Use http_fetch, search_web, read_file, write_file, list_files, python_execute, or bash_execute instead.]',
          isError: false,
        }
    }

    case 'read_file': {
      const path = normPath(String(args.path ?? ''))
      const content = ws.get(path)
      if (content !== undefined) return { output: content, isError: false }
      return { output: `File not found: ${args.path}`, isError: true }
    }

      case 'write_file': {
        const path = normPath(String(args.path ?? 'output.txt'))
        const content = String(args.content ?? '')
        ws.set(path, content)
        bumpVersion(taskId)
        trackTurnFile(taskId, path, content)
        return { output: `Written: ${args.path}`, isError: false }
      }

    case 'list_files': {
      const files = [...ws.keys()]
      if (files.length === 0) return { output: '(workspace is empty)', isError: false }
      const lines = files.map((f) => `/workspace/${f}`)
      if (!Boolean(args.recursive)) {
        const top = [...new Set(lines.map((l) => l.split('/').slice(0, 3).join('/')))]
        return { output: top.join('\n'), isError: false }
      }
      return { output: lines.join('\n'), isError: false }
    }

      case 'http_fetch': {
        const url = String(args.url ?? '')
        if (!url) return { output: 'Missing url', isError: true }
        const method = String(args.method ?? 'GET').toUpperCase()
        const headersArg = (args.headers ?? {}) as Record<string, string>
        const body = args.body ? String(args.body) : undefined
        const rawMode = args.raw === true  // Opt-in to skip HTML extraction

        try {
          const res = await fetch(url, {
            method,
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Nasus/1.0)', ...headersArg },
            body: method === 'POST' ? body : undefined,
          })
          const text = await res.text()

          // Detect content type: only extract HTML pages, pass JSON/text as-is
          const ct = res.headers.get('content-type') ?? ''
          const isHtml = ct.includes('text/html') || (ct === '' && text.trimStart().startsWith('<'))
          const isJson = ct.includes('application/json') || ct.includes('text/json')

          if (!rawMode && isHtml) {
            const extracted = extractReadableContent(text, url)
            let output = `HTTP ${res.status} — ${url}\n`
            if (extracted.title) output += `Title: ${extracted.title}\n`
            if (extracted.description) output += `Description: ${extracted.description}\n`
            output += `\n${extracted.content}`
            return { output, isError: false }
          }

          if (isJson) {
            // Pretty-print JSON, truncate if huge
            let pretty = text
            try { pretty = JSON.stringify(JSON.parse(text), null, 2) } catch { /* keep raw */ }
            const preview = pretty.length > 8000 ? pretty.slice(0, 8000) + '\n[...truncated]' : pretty
            return { output: `HTTP ${res.status}\n${preview}`, isError: false }
          }

          // Plain text / CSV / other — return as-is with truncation
          const preview = text.length > 8000 ? text.slice(0, 8000) + '\n[...truncated]' : text
          return { output: `HTTP ${res.status}\n${preview}`, isError: false }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
            return {
              output:
                `CORS error fetching ${url}. Direct page fetching is blocked by cross-origin policy.\n` +
                `Try search_web to find information instead, or fetch a JSON API that has CORS headers.`,
              isError: true,
            }
          }
          return { output: `fetch error: ${msg}`, isError: true }
        }
      }

      case 'search_web': {
        const query = String(args.query ?? '')
        if (!query) return { output: 'Missing query', isError: true }
        const num = Math.min(Number(args.num_results ?? 5), 10)
        const cfg: SearchConfig = searchConfig ?? { provider: 'auto' }

        try {
          const output = await runSearch(query, num, cfg, onSearchStatus)
          return { output, isError: false }
        } catch (err) {
          return { output: `search error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
        }
      }

      case 'patch_file': {
        const path = normPath(String(args.path ?? ''))
        const content = ws.get(path)
        if (content === undefined) return { output: `File not found: ${args.path}`, isError: true }
        const oldStr = String(args.old_str ?? '')
        const newStr = String(args.new_str ?? '')
        if (!oldStr) return { output: 'Missing old_str', isError: true }
        if (!content.includes(oldStr)) return { output: `old_str not found in ${args.path}. Read the file first and copy the exact string.`, isError: true }
        ws.set(path, content.replace(oldStr, newStr))
        bumpVersion(taskId)
        return { output: `Patched: ${args.path}`, isError: false }
      }

      case 'python_execute': {
        const code = String(args.code ?? '')
        if (!code.trim()) return { output: 'Missing code', isError: true }
        const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'disabled' }
        return await executePython(code, cfg)
      }

      case 'bash_execute': {
        const command = String(args.command ?? '')
        if (!command.trim()) return { output: 'Missing command', isError: true }
        const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'disabled' }
        return await executeBash(command, cfg)
      }

      case 'browser_navigate': {
        const url = String(args.url ?? '')
        if (!url) return { output: 'Missing url', isError: true }
        try {
          const result = await browserNavigate(url, Boolean(args.new_tab))
          return { output: `Navigated to: ${result.url}\nTitle: ${result.title}\nTab ID: ${result.tabId}`, isError: false }
        } catch (err) {
          return { output: err instanceof Error ? err.message : String(err), isError: true }
        }
      }

      case 'browser_click': {
        try {
          const result = await browserClick({
            tabId: args.tab_id as number | undefined,
            selector: args.selector as string | undefined,
            x: args.x as number | undefined,
            y: args.y as number | undefined,
          })
          if (result.error) return { output: result.error, isError: true }
          return { output: `Clicked: ${result.tag ?? ''} ${result.text ? `"${result.text}"` : ''}`.trim(), isError: false }
        } catch (err) {
          return { output: err instanceof Error ? err.message : String(err), isError: true }
        }
      }

      case 'browser_type': {
        const text = String(args.text ?? '')
        if (!text) return { output: 'Missing text', isError: true }
        try {
          const result = await browserType({
            tabId: args.tab_id as number | undefined,
            selector: args.selector as string | undefined,
            text,
            clearFirst: Boolean(args.clear_first),
          })
          return { output: `Typed ${result.typed}`, isError: false }
        } catch (err) {
          return { output: err instanceof Error ? err.message : String(err), isError: true }
        }
      }

      case 'browser_extract': {
        try {
          const result = await browserExtract({
            tabId: args.tab_id as number | undefined,
            selector: args.selector as string | undefined,
          })
          if (result.error) return { output: result.error, isError: true }
          const header = `URL: ${result.url}\nTitle: ${result.title}\nLength: ${result.length} chars\n\n`
          const content = result.content.length > 12000
            ? result.content.slice(0, 12000) + '\n[...truncated]'
            : result.content
          return { output: header + content, isError: false }
        } catch (err) {
          return { output: err instanceof Error ? err.message : String(err), isError: true }
        }
      }

      case 'browser_screenshot': {
        try {
          const result = await browserScreenshot({
            tabId: args.tab_id as number | undefined,
            fullPage: Boolean(args.full_page),
          })
          // Return the data URL — the LLM can reference it; for multimodal models it will be inlined
          return { output: result.dataUrl, isError: false }
        } catch (err) {
          return { output: err instanceof Error ? err.message : String(err), isError: true }
        }
      }

      case 'browser_scroll': {
        const direction = String(args.direction ?? 'down') as 'up' | 'down'
        try {
          const result = await browserScroll({
            tabId: args.tab_id as number | undefined,
            direction,
            amount: args.amount as number | undefined,
          })
          return { output: `Scrolled ${direction} by ${Math.abs(result.scrolled)}px`, isError: false }
        } catch (err) {
          return { output: err instanceof Error ? err.message : String(err), isError: true }
        }
      }

      default:
        return { output: `Unknown tool: ${toolName}`, isError: true }
    }
  }
