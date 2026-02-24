import { extractReadableContent } from './htmlExtractor'
import { executePython, executeBash } from './sandboxRuntime'
import type { ExecutionConfig } from './sandboxRuntime'

/**
 * Browser-safe tool execution for the web agent.
 *
 * In the browser we cannot run Docker / bash. Instead:
 * - http_fetch  → native fetch (same-origin CORS limitations apply)
 * - search_web  → multi-backend search with graceful fallback chain
 * - bash / read_file / write_file / list_files → in-memory workspace shim
 *
 * Search backend priority (Auto mode):
 *   1. Brave Search API   — best real-web index, 2 000 req/mo free
 *   2. Google CSE         — 100 req/day free, CORS-safe
 *   3. SearXNG            — free public instances, CORS-safe, may be unreliable
 *   4. DuckDuckGo Instant — always-on fallback (Instant Answers only)
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

export function getWorkspace(taskId: string): Map<string, string> {
  if (!workspaceStore.has(taskId)) workspaceStore.set(taskId, new Map())
  return workspaceStore.get(taskId)!
}

export function getWorkspaceVersion(taskId: string): number {
  return workspaceVersions.get(taskId) ?? 0
}

function bumpVersion(taskId: string) {
  workspaceVersions.set(taskId, (workspaceVersions.get(taskId) ?? 0) + 1)
  window.dispatchEvent(new CustomEvent('nasus:workspace', { detail: { taskId } }))
}

export function clearWorkspace(taskId: string) {
  workspaceStore.delete(taskId)
  workspaceVersions.delete(taskId)
}

function normPath(p: string): string {
  return p.replace(/^\/workspace\/?/, '').replace(/^\.\//, '') || 'output.txt'
}

// ── Search config passed in from the store ────────────────────────────────────

export interface SearchConfig {
  provider: string        // 'auto' | 'brave' | 'google' | 'searxng' | 'ddg'
  braveKey?: string
  googleCseKey?: string
  googleCseId?: string
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

async function searchSearXNG(query: string, num: number): Promise<string> {
  let lastErr: Error | null = null
  // Shuffle instances to distribute load
  const instances = [...SEARXNG_INSTANCES].sort(() => Math.random() - 0.5)

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
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const json = await res.json()

  const lines: string[] = []

  if (json.AbstractText) {
    lines.push(`[Abstract] ${json.AbstractText}`)
    if (json.AbstractURL) lines.push(`  URL: ${json.AbstractURL}`)
    lines.push('')
  }

  const topics: Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }> = json.RelatedTopics ?? []
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
    return `No instant results for "${query}". Try http_fetch with a specific URL, or refine your query.`
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
  const { provider, braveKey, googleCseKey, googleCseId } = cfg
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
    const r = await searchSearXNG(query, num)
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

  if (braveKey) {
    primaryOk = await tryBackend('Brave Search', () => searchBrave(query, num, braveKey))
  }

  if (!primaryOk && googleCseKey && googleCseId) {
    primaryOk = await tryBackend('Google CSE', () => searchGoogleCSE(query, num, googleCseKey, googleCseId))
  }

  if (!primaryOk) {
    primaryOk = await tryBackend('SearXNG', () => searchSearXNG(query, num))
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

      if (cmd.match(/^which\s|^apt-get|^apt\s|^npm\s|^pip\s|^python\s|^node\s|^git\s|^curl\s|^wget\s/)) {
        return {
          output: '[Browser sandbox: shell commands are not available. Use http_fetch or search_web instead, and read_file/write_file for file operations.]',
          isError: false,
        }
      }

      return {
        output:
          '[Browser sandbox: arbitrary bash commands cannot run. Use http_fetch, search_web, read_file, write_file, and list_files instead.]',
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
        ws.set(path, String(args.content ?? ''))
        bumpVersion(taskId)
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
        const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'auto' }
        return await executePython(code, cfg)
      }

      case 'bash_execute': {
        const command = String(args.command ?? '')
        if (!command.trim()) return { output: 'Missing command', isError: true }
        const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'auto' }
        return await executeBash(command, cfg)
      }

      default:
        return { output: `Unknown tool: ${toolName}`, isError: true }
    }
  }
