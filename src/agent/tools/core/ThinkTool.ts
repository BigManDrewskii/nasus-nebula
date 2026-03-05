import { BaseTool } from './BaseTool'
import type { ToolResult } from './ToolResult'
import { toolSuccess } from './index'

/**
 * Think Tool — Internal reasoning scratchpad.
 */
export class ThinkTool extends BaseTool {
  readonly name = 'think'
  readonly description = 'Internal reasoning scratchpad. Use to analyze complex situations without taking action. Does not execute anything.'
  readonly parameters = {
    type: 'object',
    properties: {
      thought: {
        type: 'string',
        description: 'Your internal thought process or analysis.',
      },
    },
    required: ['thought'],
  } as const

  async execute(_args: { thought: string }): Promise<ToolResult> {
    return toolSuccess(`Thought acknowledged. Proceed with your next step.`)
  }
}
