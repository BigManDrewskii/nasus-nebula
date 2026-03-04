import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { executeBash, type ExecutionConfig } from '../../sandboxRuntime'

/**
 * Tool for interacting with Git repositories in the workspace.
 * Requires Docker sandbox to be active.
 */
export class GitTool extends BaseTool {
  readonly name = 'git'
  readonly description =
    'Perform git operations in the workspace (status, diff, commit, log, branch). Useful for tracking changes and managing code versions.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      command: {
        type: 'string',
        enum: ['status', 'diff', 'commit', 'log', 'branch', 'add', 'init', 'rev-parse'],
        description: 'The git command to run.',
      },
      args: {
        type: 'string',
        description: 'Additional arguments for the git command (e.g. "-m "message"", "."), as a single string.',
      },
    },
    required: ['command'],
  }

  private executionConfig?: ExecutionConfig

  setExecutionConfig(config: ExecutionConfig): void {
    this.executionConfig = config
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    if (!this.executionConfig) {
      return toolFailure('Execution config not set')
    }

    const command = args.command as string
    const commandArgs = (args.args as string) || ''
    
    const fullCommand = `git ${command} ${commandArgs}`

    try {
      const result = await executeBash(fullCommand, this.executionConfig)
      if (result.isError) {
        return toolFailure(result.output)
      }
      return toolSuccess(result.output)
    } catch (error) {
      return toolFailure(`Git command failed: ${error}`)
    }
  }
}
