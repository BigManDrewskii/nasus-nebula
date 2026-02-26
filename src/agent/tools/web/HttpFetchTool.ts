import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'

/**
 * Tool for making HTTP GET or POST requests.
 */
export class HttpFetchTool extends BaseTool {
  readonly name = 'http_fetch'
  readonly description =
    'Make an HTTP GET or POST request to a URL. Note: cross-origin requests may be blocked by CORS in browser mode. JSON APIs with CORS headers work best.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      url: { type: 'string' },
      method: { type: 'string', enum: ['GET', 'POST'], default: 'GET' },
      body: { type: 'string', description: 'Request body for POST' },
      headers: { type: 'object', description: 'Headers map' },
    },
    required: ['url'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const url = args.url as string
    const method = (args.method as string) || 'GET'
    const body = args.body as string | undefined
    const headers = (args.headers as Record<string, string>) || {}

    if (!url) {
      return toolFailure('url is required')
    }

    try {
      const response = await fetch(url, {
        method,
        headers,
        body: method === 'POST' ? body : undefined,
      })

      const text = await response.text()

      let output = `Status: ${response.status} ${response.statusText}\n`
      output += `URL: ${response.url}\n\n`

      // Try to parse as JSON for pretty printing
      try {
        const json = JSON.parse(text)
        output += JSON.stringify(json, null, 2)
      } catch {
        output += text
      }

      return toolSuccess(output)
    } catch (error) {
      return toolFailure(`HTTP request failed: ${error}`)
    }
  }
}
