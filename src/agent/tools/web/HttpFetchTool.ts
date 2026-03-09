import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { tauriInvoke } from '../../../tauri'
import { extractReadableContent } from '../../htmlExtractor'

/**
 * Tool for making HTTP GET or POST requests.
 *
 * Uses the Tauri backend (reqwest) to bypass browser CORS restrictions.
 * For text/html responses, the raw HTML is automatically converted to
 * clean Markdown using extractReadableContent — the agent receives readable
 * content instead of 200KB of raw HTML.
 */
export class HttpFetchTool extends BaseTool {
  readonly name = 'http_fetch'
  readonly description =
    'Make an HTTP GET or POST request to a URL. Runs through the native backend — no CORS restrictions. HTML pages are automatically converted to clean Markdown. Use for fetching APIs, web pages, or any external resource. For full browser rendering (JS-heavy sites), prefer browser_read_page instead.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to fetch (include protocol: https:// or http://).',
      },
      method: {
        type: 'string',
        enum: ['GET', 'POST'],
        default: 'GET',
        description: 'HTTP method.',
      },
      body: {
        type: 'string',
        description: 'Request body for POST requests.',
      },
      headers: {
        type: 'object',
        description: 'Additional request headers as a key-value object.',
      },
      raw: {
        type: 'boolean',
        default: false,
        description: 'Return raw response body without HTML-to-Markdown conversion. Useful when you need the original HTML or binary content.',
      },
    },
    required: ['url'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string
    const method = (args.method as string) || 'GET'
    const body = args.body as string | undefined
    const headersObj = (args.headers as Record<string, string>) || {}
    const raw = (args.raw as boolean) || false

    if (!url) return toolFailure('url is required')

    // Convert headers object → flat [key, value, key, value, ...] array
    const headersFlat: string[] = []
    for (const [k, v] of Object.entries(headersObj)) {
      headersFlat.push(k, String(v))
    }

    try {
      const response = await tauriInvoke<string>('http_fetch', {
        url,
        method,
        headers: headersFlat.length > 0 ? headersFlat : undefined,
        body: method === 'POST' ? body : undefined,
      })

      // Rust returns "<status_code>\n<body>"
      const newlineIdx = response.indexOf('\n')
      const statusCode = newlineIdx >= 0 ? response.slice(0, newlineIdx).trim() : response
      const responseBody = newlineIdx >= 0 ? response.slice(newlineIdx + 1) : ''

      // ── Detect content type ────────────────────────────────────────────────
      const isHtml = responseBody.trimStart().startsWith('<')
        || responseBody.includes('<html')
        || responseBody.includes('<!DOCTYPE')
        || responseBody.includes('<!doctype')

      const isJson = (() => {
        const t = responseBody.trimStart()
        return t.startsWith('{') || t.startsWith('[')
      })()

      let output = `Status: ${statusCode}\nURL: ${url}\n\n`

      if (isHtml && !raw) {
        // ── HTML → Markdown conversion ───────────────────────────────────────
        const extracted = extractReadableContent(responseBody, url, {
          includeLinks: true,
        })

        if (extracted.title) {
          output += `# ${extracted.title}\n\n`
        }
        if (extracted.description) {
          output += `> ${extracted.description}\n\n`
        }
        output += extracted.content

        if (extracted.wasTruncated) {
          output += `\n\n[Content was truncated — use browser_read_page for full content]`
        }
      } else if (isJson && !raw) {
        // ── Pretty-print JSON ────────────────────────────────────────────────
        try {
          const json = JSON.parse(responseBody)
          output += JSON.stringify(json, null, 2)
        } catch {
          output += responseBody
        }
      } else {
        // ── Raw body (plain text, XML, binary, or raw=true) ──────────────────
        output += responseBody
      }

      return toolSuccess(output)
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error)
      if (msg.includes('ENOTFOUND') || msg.includes('NAME_NOT_RESOLVED')) {
        return toolFailure(`DNS lookup failed for "${url}" — check the domain name.`)
      }
      if (msg.includes('ECONNREFUSED') || msg.includes('CONNECTION_REFUSED')) {
        return toolFailure(`Connection refused at "${url}" — the server may be down.`)
      }
      if (msg.includes('timed out') || msg.includes('timeout')) {
        return toolFailure(`Request timed out for "${url}".`)
      }
      return toolFailure(`HTTP request failed: ${msg}`)
    }
  }
}
