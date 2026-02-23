/**
 * Browser-safe tool execution for the web agent.
 *
 * In the browser we cannot run Docker / bash. Instead:
 * - http_fetch  → native fetch (same-origin CORS limitations apply)
 * - search_web  → Brave Search API (if key configured) or DuckDuckGo fallback
 * - bash / read_file / write_file / list_files → in-memory workspace shim
 *
 * The in-memory workspace gives the agent a real key-value store so it can
 * read/write task_plan.md, findings.md, progress.md between turns.
 */

// ── In-memory workspace ───────────────────────────────────────────────────────
// Keyed by taskId → filename → content
const workspaceStore: Map<string, Map<string, string>> = new Map()

export function getWorkspace(taskId: string): Map<string, string> {
  if (!workspaceStore.has(taskId)) workspaceStore.set(taskId, new Map())
  return workspaceStore.get(taskId)!
}

export function clearWorkspace(taskId: string) {
  workspaceStore.delete(taskId)
}

function normPath(p: string): string {
  // Strip /workspace prefix so filenames are portable
  return p.replace(/^\/workspace\/?/, '').replace(/^\.\//, '') || 'output.txt'
}

// ── Search backends ───────────────────────────────────────────────────────────

async function searchBrave(query: string, numResults: number, apiKey: string): Promise<string> {
  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${numResults}&text_decorations=0&result_filter=web`
  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
      'Accept-Encoding': 'gzip',
      'X-Subscription-Token': apiKey,
    },
  })
  if (!res.ok) throw new Error(`Brave Search HTTP ${res.status}`)
  const json = await res.json()

  const results: string[] = []
  const webResults: Array<{ title?: string; url?: string; description?: string }> =
    json?.web?.results ?? []

  for (let i = 0; i < Math.min(webResults.length, numResults); i++) {
    const r = webResults[i]
    results.push(`[${i + 1}] ${r.title ?? '(no title)'}`)
    if (r.url) results.push(`    URL: ${r.url}`)
    if (r.description) results.push(`    ${r.description}`)
    results.push('')
  }

  if (results.length === 0) {
    return `No results found for "${query}".`
  }
  return results.join('\n')
}

async function searchDuckDuckGo(query: string, numResults: number): Promise<string> {
  const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_redirect=1&no_html=1&skip_disambig=1`
  const res = await fetch(url, { headers: { Accept: 'application/json' } })
  const json = await res.json()

  const results: string[] = []

  if (json.AbstractText) {
    results.push(`[Abstract] ${json.AbstractText}`)
    if (json.AbstractURL) results.push(`  URL: ${json.AbstractURL}`)
    results.push('')
  }

  const topics: Array<{ Text?: string; FirstURL?: string; Topics?: unknown[] }> = json.RelatedTopics ?? []
  let count = 0
  for (const t of topics) {
    if (count >= numResults) break
    if (t.Text && t.FirstURL) {
      results.push(`[${count + 1}] ${t.Text}`)
      results.push(`    URL: ${t.FirstURL}`)
      results.push('')
      count++
    } else if (t.Topics) {
      for (const sub of t.Topics as Array<{ Text?: string; FirstURL?: string }>) {
        if (count >= numResults) break
        if (sub.Text && sub.FirstURL) {
          results.push(`[${count + 1}] ${sub.Text}`)
          results.push(`    URL: ${sub.FirstURL}`)
          results.push('')
          count++
        }
      }
    }
  }

  if (results.length === 0) {
    return (
      `No instant results for "${query}". ` +
      `Try http_fetch with a specific URL, or refine your query.`
    )
  }
  return results.slice(0, numResults * 3).join('\n')
}

// ── Tool executor ─────────────────────────────────────────────────────────────

export async function executeTool(
  taskId: string,
  toolName: string,
  args: Record<string, unknown>,
  braveSearchKey?: string,
): Promise<{ output: string; isError: boolean }> {
  const ws = getWorkspace(taskId)

  switch (toolName) {
    case 'bash': {
      const cmd = String(args.command ?? '')
      // Intercept common bash patterns that write/read files
      // e.g. "echo '...' | base64 -d > /workspace/task_plan.md"
      const b64WriteMatch = cmd.match(/echo\s+'([A-Za-z0-9+/=\s]+)'\s*\|\s*base64\s+-d\s*>\s*(\S+)/)
      if (b64WriteMatch) {
        try {
          const decoded = atob(b64WriteMatch[1].replace(/\s/g, ''))
          const path = normPath(b64WriteMatch[2])
          ws.set(path, decoded)
          return { output: `written: ${b64WriteMatch[2]}`, isError: false }
        } catch {
          // fall through
        }
      }

      // cat file
      const catMatch = cmd.match(/^cat\s+'?([^'>\s]+)'?\s*(?:2>&1)?$/)
      if (catMatch) {
        const path = normPath(catMatch[1])
        const content = ws.get(path)
        if (content !== undefined) return { output: content, isError: false }
        return { output: `cat: ${catMatch[1]}: No such file`, isError: true }
      }

      // ls
      if (cmd.trim().startsWith('ls') || cmd.trim().startsWith('find')) {
        const files = [...ws.keys()]
        return { output: files.length ? files.map((f) => `/workspace/${f}`).join('\n') : '(empty workspace)', isError: false }
      }

      // mkdir (no-op in browser)
      if (cmd.trim().startsWith('mkdir')) {
        return { output: '(directory created)', isError: false }
      }

      // echo
      const echoMatch = cmd.match(/^echo\s+(.+)$/)
      if (echoMatch) {
        return { output: echoMatch[1].replace(/['"]/g, ''), isError: false }
      }

      // which / apt-get / package managers
      if (cmd.match(/^which\s|^apt-get|^apt\s|^npm\s|^pip\s|^python\s|^node\s|^git\s|^curl\s|^wget\s/)) {
        return {
          output: '[Browser sandbox: shell commands are not available. Use http_fetch or search_web instead, and read_file/write_file for file operations.]',
          isError: false,
        }
      }

      return {
        output:
          '[Browser sandbox: arbitrary bash commands cannot run in the browser. Use the http_fetch, search_web, read_file, write_file, and list_files tools instead.]',
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
      return { output: `Written: ${args.path}`, isError: false }
    }

    case 'list_files': {
      const files = [...ws.keys()]
      if (files.length === 0) return { output: '(workspace is empty)', isError: false }
      const recursive = Boolean(args.recursive)
      const lines = files.map((f) => `/workspace/${f}`)
      if (!recursive) {
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

      try {
        const res = await fetch(url, {
          method,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; Nasus/1.0)',
            ...headersArg,
          },
          body: method === 'POST' ? body : undefined,
        })
        const text = await res.text()
        const preview = text.length > 6000 ? text.slice(0, 6000) + '\n[...truncated]' : text
        return { output: `HTTP ${res.status}\n${preview}`, isError: false }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('CORS')) {
          return {
            output:
              `CORS error fetching ${url}. In browser mode, direct page fetching is blocked by cross-origin policy.\n` +
              `Try using search_web to find information instead, or fetch a JSON API that has CORS headers.`,
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

      try {
        if (braveSearchKey) {
          // Preferred: Brave Search API — real web results
          const output = await searchBrave(query, num, braveSearchKey)
          return { output, isError: false }
        } else {
          // Fallback: DuckDuckGo Instant Answer (no key needed, limited results)
          const output = await searchDuckDuckGo(query, num)
          return { output, isError: false }
        }
      } catch (err) {
        // If Brave fails (e.g. CORS in some environments), fall back to DDG
        if (braveSearchKey) {
          try {
            const output = await searchDuckDuckGo(query, num)
            return { output: `[Brave Search unavailable, using DuckDuckGo fallback]\n${output}`, isError: false }
          } catch { /* ignore secondary failure */ }
        }
        return { output: `search error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
      }
    }

    default:
      return { output: `Unknown tool: ${toolName}`, isError: true }
  }
}
