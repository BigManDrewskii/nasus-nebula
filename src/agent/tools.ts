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
  browserGetTabs,
  browserWaitFor,
  browserEval,
  browserSelect,
} from './browserBridge'
import { runSearch } from './search'
import type { SearchConfig, SearchStatusCallback } from './search'
export type { SearchConfig, SearchStatusCallback }
import { tauriInvoke } from '../tauri'
import { workspaceManager } from './workspace/WorkspaceManager'

/**
 * Check if running in Tauri environment.
 */
function isTauriMode(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

/**
 * Browser-safe tool execution for the web agent.
 *
 * Search backends live in search.ts. This file handles workspace I/O,
 * file tracking, and the tool dispatcher switch.
 */

export function getWorkspace(taskId: string): Map<string, string> {
  return workspaceManager.getWorkspaceSync(taskId)
}

export function getWorkspaceVersion(taskId: string): number {
  return workspaceManager.getVersion(taskId)
}

export async function clearWorkspace(taskId: string) {
  await workspaceManager.deleteWorkspace(taskId)
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
export async function copyWorkspace(sourceTaskId: string, destTaskId: string) {
  // Use the new async WorkspaceManager
  const { copyWorkspace: copyWs } = await import('./workspace/WorkspaceManager')
  await copyWs(sourceTaskId, destTaskId)
}

function normPath(p: string): string {
  return p.replace(/^\/workspace\/?/, '').replace(/^\.\//, '') || 'output.txt'
}

// ── Tool executor ─────────────────────────────────────────────────────────────

export async function executeTool(
  taskId: string,
  toolName: string,
  args: Record<string, unknown>,
  onSearchStatus?: SearchStatusCallback,
  executionConfig?: ExecutionConfig,
): Promise<{ output: string; isError: boolean }> {
  switch (toolName) {
    case 'bash': {
      const cmd = String(args.command ?? '')
      const b64WriteMatch = cmd.match(/echo\s+'([A-Za-z0-9+/=\s]+)'\s*\|\s*base64\s+-d\s*>\s*(\S+)/)
      if (b64WriteMatch) {
        try {
          const decoded = atob(b64WriteMatch[1].replace(/\s/g, ''))
          const path = normPath(b64WriteMatch[2])
          await workspaceManager.writeFile(taskId, path, decoded)
          return { output: `written: ${b64WriteMatch[2]}`, isError: false }
        } catch { /* fall through */ }
      }

      const catMatch = cmd.match(/^cat\s+'?([^'>\s]+)'?\s*(?:2>&1)?$/)
      if (catMatch) {
        const path = normPath(catMatch[1])
        try {
          const content = await workspaceManager.readFile(taskId, path)
          return { output: content, isError: false }
        } catch {
          return { output: `cat: ${catMatch[1]}: No such file`, isError: true }
        }
      }

      if (cmd.trim().startsWith('ls') || cmd.trim().startsWith('find')) {
        const files = await workspaceManager.listFiles(taskId)
        return { output: files.length ? files.map((f) => `/workspace/${f.path}`).join('\n') : '(empty workspace)', isError: false }
      }

      if (cmd.trim().startsWith('mkdir')) {
        return { output: '(directory created)', isError: false }
      }

      const echoMatch = cmd.match(/^echo\s+(.+)$/)
      if (echoMatch) {
        return { output: echoMatch[1].replace(/['"]/g, ''), isError: false }
      }

      // ... existing intercepts

        // Intercept framework/package-manager commands — return as an ERROR so the
          // 3-strike counter fires and the agent pivots instead of retrying endlessly.
          // Also intercept version-checking commands (node -v, npm -v etc) which are
          // a sign the agent is thinking in "npm project" mode — redirect immediately.
          if (/\bnpx\b|\bnpm\b|\bnode\b|\byarn\b|\bpnpm\b|\bbun\b/.test(cmd)) {
            return {
              output:
                'Error: Node.js / npm / npx / node is not available in browser mode — not even for version checks. ' +
                'Do NOT retry this command. Instead: write the file contents directly with write_file. ' +
                'For a Next.js page write a .tsx file. For a website write index.html + styles.css. ' +
                'Use bash_execute only if a cloud sandbox (E2B) is configured in Settings.',
              isError: true,
            }
          }

        if (/\bpip3?\b|\bpython3?\b/.test(cmd)) {
          return {
            output:
              'Error: pip / python is not available as a shell command in browser mode. ' +
              'Use python_execute to run Python code, or bash_execute if a cloud sandbox is configured.',
            isError: true,
          }
        }

        if (/\bcurl\b|\bwget\b/.test(cmd)) {
          return {
            output:
              'Error: curl / wget is not available in browser mode. ' +
              'Use http_fetch to make HTTP requests or search_web to search the internet.',
            isError: true,
          }
        }

        if (/\bapt\b|\bapt-get\b|\bbrew\b/.test(cmd)) {
          return {
            output:
              'Error: apt / brew package managers are not available in browser mode. ' +
              'Use bash_execute if a cloud sandbox (E2B) is configured.',
            isError: true,
          }
        }

        if (/\bgit\b/.test(cmd)) {
          return {
            output:
              'Error: git is not available in browser mode. ' +
              'Write files directly with write_file instead.',
            isError: true,
          }
        }

        if (/\bwhich\b/.test(cmd)) {
          return {
            output:
              'Error: which returned nothing — no shell tools are available in browser mode. ' +
              'Use write_file for file creation, http_fetch for network, python_execute for code.',
            isError: true,
          }
        }

        return {
          output:
            'Error: this shell command is not available in browser mode. ' +
            'Use write_file, read_file, http_fetch, search_web, python_execute, or bash_execute instead.',
          isError: true,
        }
    }

    case 'read_file': {
      const path = normPath(String(args.path ?? ''))
      try {
        const content = await workspaceManager.readFile(taskId, path)
        return { output: content, isError: false }
      } catch {
        return { output: `File not found: ${args.path}`, isError: true }
      }
    }

    case 'write_file': {
      const path = normPath(String(args.path ?? 'output.txt'))
      const content = String(args.content ?? '')
      await workspaceManager.writeFile(taskId, path, content)
      trackTurnFile(taskId, path, content)
      return { output: `Written: ${args.path}`, isError: false }
    }

    case 'list_files': {
      const files = await workspaceManager.listFiles(taskId)
      if (files.length === 0) return { output: '(workspace is empty)', isError: false }
      const lines = files.map((f) => `/workspace/${f.path}`)
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
          let text: string
          let status: number

          if (isTauriMode()) {
            // Use Rust backend to bypass CORS
            const result = await tauriInvoke<string>('http_fetch', {
              url,
              method,
              headers: Object.keys(headersArg).length > 0
                ? Object.entries(headersArg).flat()
                : undefined,
              body: method === 'POST' ? body : undefined,
            })

            if (!result) {
              return { output: 'fetch error: No response from backend', isError: true }
            }

            // Result format: "STATUS_CODE\nCONTENT"
            const newlineIdx = result.indexOf('\n')
            status = parseInt(result.slice(0, newlineIdx))
            text = result.slice(newlineIdx + 1)
          } else {
            // Regular browser fetch for web version
            const res = await fetch(url, {
              method,
              headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Nasus/1.0)', ...headersArg },
              body: method === 'POST' ? body : undefined,
            })
            status = res.status
            text = await res.text()
          }

          // Detect content type: only extract HTML pages, pass JSON/text as-is
          // In Tauri mode, we don't have content-type headers, so detect from content
          const isHtml = text.trimStart().startsWith('<')
          const isJson = text.trimStart().startsWith('{') || text.trimStart().startsWith('[')

          if (!rawMode && isHtml) {
            const extracted = extractReadableContent(text, url)
            let output = `HTTP ${status} — ${url}\n`
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
            return { output: `HTTP ${status}\n${preview}`, isError: false }
          }

          // Plain text / CSV / other — return as-is with truncation
          const preview = text.length > 8000 ? text.slice(0, 8000) + '\n[...truncated]' : text
          return { output: `HTTP ${status}\n${preview}`, isError: false }
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
        if (!query || query === '[object Object]') {
          return { 
            output: 'Error: Missing search query. You called search_web with empty arguments or an object. Call it correctly: search_web(query="your keywords here").', 
            isError: true 
          }
        }
        const num = Math.min(Number(args.num_results ?? 5), 10)
        // Exa key comes from backend state, don't pass frontend config

        try {
          // Exa key comes from backend state, no frontend config needed
          const output = await runSearch(query, num, undefined, onSearchStatus)
          return { output, isError: false }
        } catch (err) {
          return { output: `search error: ${err instanceof Error ? err.message : String(err)}`, isError: true }
        }
      }

      case 'patch_file': {
        const path = normPath(String(args.path ?? ''))
        try {
          const content = await workspaceManager.readFile(taskId, path)
          const oldStr = String(args.old_str ?? '')
          const newStr = String(args.new_str ?? '')
          if (!oldStr) return { output: 'Missing old_str', isError: true }
          if (!content.includes(oldStr)) return { output: `old_str not found in ${args.path}. Read the file first and copy the exact string.`, isError: true }
          await workspaceManager.writeFile(taskId, path, content.replace(oldStr, newStr))
          return { output: `Patched: ${args.path}`, isError: false }
        } catch {
          return { output: `File not found: ${args.path}`, isError: true }
        }
      }

      case 'python_execute': {
        const code = String(args.code ?? '')
        if (!code.trim()) return { output: 'Missing code', isError: true }
        const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'disabled' }
        return await executePython(code, cfg)
      }

       case 'serve_preview': {
         const command = String(args.command ?? '')
         const port = Number(args.port ?? 3000)
         if (!command.trim()) return { output: 'Missing command', isError: true }

         const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'disabled' }
         if (cfg.executionMode !== 'e2b' || !cfg.e2bApiKey?.trim()) {
           return {
             output:
               'serve_preview requires E2B cloud sandbox. Add your E2B API key in Settings → Code Execution. ' +
               'In browser-only mode, use write_file to create index.html and preview it in the Output panel instead.',
             isError: true,
           }
         }

         // Kill any existing server on this port
         await executeBash(
           `kill $(lsof -t -i:${port} 2>/dev/null) 2>/dev/null || true`,
           cfg,
         )

         // Start server in background — nohup so it survives the exec timeout
         const bgCommand = `nohup sh -c ${JSON.stringify(command)} > /tmp/nasus-server-${port}.log 2>&1 &`
         await executeBash(bgCommand, cfg)

         // Poll until port responds (max 20 × 500ms = 10s)
         let ready = false
         for (let i = 0; i < 20; i++) {
           await new Promise((r) => setTimeout(r, 500))
           const check = await executeBash(
             `curl -s -o /dev/null -w '%{http_code}' http://localhost:${port}/ 2>/dev/null || echo waiting`,
             cfg,
           )
           const code = check.output.trim()
           if (code === '200' || code === '304' || code === '302' || code === '101') {
             ready = true
             break
           }
         }

         if (ready) {
           // Emit preview-ready event so the frontend can open the Preview tab
           window.dispatchEvent(
             new CustomEvent('nasus:preview-ready', {
               detail: { port, url: `http://localhost:${port}` },
             }),
           )
           return {
             output:
               `Dev server is running on port ${port}. Preview is now live in the Preview tab.\n` +
               `URL: http://localhost:${port}\n` +
               `Edit files in the project directory — the dev server hot-reloads automatically.`,
             isError: false,
           }
         }

         // Server didn't come up — return logs
         const logs = await executeBash(
           `tail -30 /tmp/nasus-server-${port}.log 2>/dev/null || echo '(no logs)'`,
           cfg,
         )
         return {
           output:
             `Server did not respond on port ${port} within 10 seconds.\n` +
             `Server logs:\n${logs.output.trim()}`,
           isError: true,
         }
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
        
        // --- Stealth Mode in Docker Sandbox ---
        if (args.stealth === true) {
          const cfg: ExecutionConfig = executionConfig ?? { executionMode: 'docker' }
          const pythonCode = `
import asyncio
from playwright.async_api import async_playwright
from playwright_stealth import stealth_async

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
        )
        await stealth_async(context)
        page = await context.new_page()
        try:
            # Navigate with 30s timeout
            response = await page.goto("${url}", wait_until="domcontentloaded", timeout=30000)
            if not response:
                print("Error: No response from ${url}")
                return
                
            title = await page.title()
            content = await page.content()
            
            print(f"--- TITLE ---\\n{title}")
            print(f"--- URL ---\\n{page.url}")
            print(f"--- CONTENT ---\\n{content}")
        except Exception as e:
            print(f"Error navigating to ${url}: {str(e)}")
        finally:
            await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
`
          const result = await executePython(pythonCode, cfg)
          if (result.isError) return result
          
          // Parse title and content from stdout if possible, or just return the whole thing
          const output = result.output
          if (output.includes('--- CONTENT ---')) {
              const [header, fullContent] = output.split('--- CONTENT ---\n')
              // Extract readable content from the raw HTML
              const readable = extractReadableContent(fullContent, url)
              return { 
                  output: `[Stealth Sandbox Mode]\n${header.replace(/--- /g, '').trim()}\n\n${readable.content}`, 
                  isError: false 
              }
          }
          return result
        }

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

       case 'browser_get_tabs': {
         try {
           const tabs = await browserGetTabs()
           if (!tabs || tabs.length === 0) return { output: 'No open tabs', isError: false }
           const lines = tabs.map((t, i) =>
             `[${i + 1}] Tab ID: ${t.id}  Active: ${t.active}\n    Title: ${t.title}\n    URL: ${t.url}`
           )
           return { output: lines.join('\n\n'), isError: false }
         } catch (err) {
           return { output: err instanceof Error ? err.message : String(err), isError: true }
         }
       }

       case 'browser_wait_for': {
         const selector = args.selector as string | undefined
         const urlPattern = args.url_pattern as string | undefined
         const timeoutMs = args.timeout_ms as number | undefined
         if (!selector && !urlPattern) {
           return { output: 'Provide selector or url_pattern to wait for', isError: true }
         }
         try {
           const result = await browserWaitFor({
             tabId: args.tab_id as number | undefined,
             selector,
             urlPattern,
             timeoutMs,
           })
           if (!result.success) return { output: result.error ?? 'Timed out', isError: true }
           return {
             output: result.matched === 'url'
               ? `URL pattern matched: ${result.url}`
               : `Element appeared: ${result.selector}`,
             isError: false,
           }
         } catch (err) {
           return { output: err instanceof Error ? err.message : String(err), isError: true }
         }
       }

       case 'browser_eval': {
         const expression = String(args.expression ?? '')
         if (!expression) return { output: 'Missing expression', isError: true }
         try {
           const result = await browserEval({
             tabId: args.tab_id as number | undefined,
             expression,
             awaitPromise: Boolean(args.await_promise),
           })
           if (result.error) return { output: result.error, isError: true }
           const val = result.result
           const output = val === undefined || val === null
             ? '(no return value)'
             : typeof val === 'object'
               ? JSON.stringify(val, null, 2)
               : String(val)
           return { output, isError: false }
         } catch (err) {
           return { output: err instanceof Error ? err.message : String(err), isError: true }
         }
       }

       case 'browser_select': {
         const selector = String(args.selector ?? '')
         if (!selector) return { output: 'Missing selector', isError: true }
         if (args.value === undefined && args.label === undefined) {
           return { output: 'Provide value or label to select', isError: true }
         }
         try {
           const result = await browserSelect({
             tabId: args.tab_id as number | undefined,
             selector,
             value: args.value as string | number | undefined,
             label: args.label as string | undefined,
           })
           if (result.error) return { output: result.error, isError: true }
           return { output: `Selected value: ${result.selectedValue}`, isError: false }
         } catch (err) {
           return { output: err instanceof Error ? err.message : String(err), isError: true }
         }
       }

       default:
         return { output: `Unknown tool: ${toolName}`, isError: true }
     }
   }
