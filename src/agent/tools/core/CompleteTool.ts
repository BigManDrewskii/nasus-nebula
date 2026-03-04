import { BaseTool } from './BaseTool'
import type { ToolResult } from './ToolResult'
import { toolSuccess } from './index'

/**
 * Complete Tool — Signal task completion with a summary.
 */
export class CompleteTool extends BaseTool {
  readonly name = 'complete'
  readonly description = 'Signal task completion with a summary. Use when all steps in the plan are done.'
  readonly parameters = {
    type: 'object',
    properties: {
      summary: {
        type: 'string',
        description: 'A brief summary of what was accomplished and which files were created/modified.',
      },
    },
    required: ['summary'],
  } as const

  async execute(args: { summary: string }): Promise<ToolResult> {
    return toolSuccess(`Task marked as complete. Summary: ${args.summary}`)
  }
}
