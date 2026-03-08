import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { tauriInvoke } from '../../../tauri'

/**
 * Tool for making HTTP GET or POST requests.
 * Uses the Tauri backend (reqwest) to bypass browser CORS restrictions.
 */
export class HttpFetchTool extends BaseTool {
  readonly name = 'http_fetch'
  readonly description =
    'Make an HTTP GET or POST request to a URL. Runs through the native backend — no CORS restrictions. Use for fetching APIs, web pages, or any external resource.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      url: { type: 'string' },
      method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' },
      body: { type: 'string', description: 'Request body for POST' },
      headers: {
        type: 'object',
        description: 'Headers as a key-value object, e.g. {"Accept": "application/json"}',
      },
    },
    required: ['url'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string
    const method = (args.method as string) || 'GET'
    const body = args.body as string | undefined
    const headersObj = (args.headers as Record<string, string>) || {}

    if (!url) {
      return toolFailure('url is required')
    }

    // Convert headers object to flat array of [key, value, key, value, ...]
    // as expected by the Rust http_fetch command
    const headersFlat: string[] = []
    for (const [k, v] of Object.entries(headersObj)) {
      headersFlat.push(k, String(v))
    }

    try {
      const raw = await tauriInvoke<string>('http_fetch', {
        url,
        method,
        headers: headersFlat.length > 0 ? headersFlat : undefined,
        body: method === 'POST' ? body : undefined,
      })

      // Rust returns "<status_code>\n<body>"
      const newlineIdx = raw.indexOf('\n')
      const statusCode = newlineIdx >= 0 ? raw.slice(0, newlineIdx) : raw
      const responseBody = newlineIdx >= 0 ? raw.slice(newlineIdx + 1) : ''

      let output = `Status: ${statusCode}\nURL: ${url}\n\n`

      // Try to pretty-print JSON
      try {
        const json = JSON.parse(responseBody)
        output += JSON.stringify(json, null, 2)
      } catch {
        output += responseBody
      }

      return toolSuccess(output)
    } catch (error) {
      return toolFailure(`HTTP request failed: ${error}`)
    }
  }
}
