/**
 * SearchWebTool — Web search tool for the agent system.
 *
 * Delegates to the unified search module (which calls the Rust backend).
 * Does NOT import from the store or call Tauri directly — keeps tools pure.
 */

import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { runSearch } from '../../search'
import type { SearchConfig, SearchStatusCallback } from '../../search'

/**
 * Tool for searching the web for current information.
 */
export class SearchWebTool extends BaseTool {
  readonly name = 'search_web'
  readonly description =
    'Search the web for current information. Use when you need: real-time data, ' +
    'recent events, facts you are unsure about, current prices/stats, or anything ' +
    'that may have changed after your training cutoff. Do NOT use for general ' +
    'knowledge you are already confident about.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      query: {
        type: 'string',
        description:
          'A concise, specific search query — use keywords, not full sentences.',
      },
      num_results: {
        type: 'integer',
        description:
          'Number of results: 3 for simple lookups, 5 (default) for research, 10 for comprehensive.',
        default: 5,
      },
    },
    required: ['query'],
  }

  /** Optional: injected by the execution layer for UI status updates */
  private searchConfig?: SearchConfig
  private onStatus?: SearchStatusCallback

  /**
   * Configure search options before execution.
   * Called by the tool executor, not by the agent directly.
   */
  withConfig(config?: SearchConfig, onStatus?: SearchStatusCallback): this {
    this.searchConfig = config
    this.onStatus = onStatus
    return this
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const query = args.query as string | undefined
    const numResults = Math.min(Math.max((args.num_results as number) || 5, 1), 10)

    if (!query?.trim()) {
      return toolFailure('query is required and must be non-empty')
    }

    try {
      const output = await runSearch(query, numResults, this.searchConfig, this.onStatus)
      return toolSuccess(output)
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        return toolFailure(`Search failed: ${message}`)
      }
    }
  }
