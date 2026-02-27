import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import type { SearchResult as ApiSearchResult } from '../../../types'

/**
 * Tool for searching the web for current information.
 */
export class SearchWebTool extends BaseTool {
  readonly name = 'search_web'
  readonly description =
    'Search the web for current information. Use this tool when you need: real-time data, recent events, facts you are unsure about, current prices/stats, or anything that may have changed after your training cutoff. Do NOT use for general knowledge you are already confident about, coding syntax, math, or creative writing. Do NOT search again if results are already in context for the same topic.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description: 'A concise, specific search query written like you would type into Google — use keywords, not full sentences.',
      },
      num_results: {
        type: 'integer',
        description: 'Number of results to return. Use 3 for simple factual lookups, 5 (default) for general research, 10 for comprehensive research.',
        default: 5,
      },
    },
    required: ['query'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const query = args.query as string
    const numResults = (args.num_results as number) || 5

    if (!query) {
      return toolFailure('query is required')
    }

    try {
      // Call the Tauri command for search
      const { invoke } = await import('@tauri-apps/api/core')
      const results = await invoke<ApiSearchResult[]>('search', {
        query,
        num_results: numResults,
      })

      if (!results || results.length === 0) {
        return toolSuccess('No results found.')
      }

      // Format results
      const output = results.map((r, i) => {
        return `${i + 1}. ${r.title}\n   ${r.url}\n   ${r.snippet}\n`
      }).join('\n')

      return toolSuccess(output)
    } catch (error) {
      return toolFailure(`Search failed: ${error}`)
    }
  }
}
