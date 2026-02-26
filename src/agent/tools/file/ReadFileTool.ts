import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for reading file contents from the workspace.
 */
export class ReadFileTool extends BaseTool {
  readonly name = 'read_file'
  readonly description =
    "Read the contents of a file from the workspace. Use to check task_plan.md, findings.md, progress.md."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
    },
    required: ['path'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const path = args.path as string

    if (!path) {
      return toolFailure('path is required')
    }

    try {
      // taskId comes from context - we'll need to inject this
      // For now, get it from the agent context
      const taskId = (args as any).__taskId || 'initial'
      const content = await workspaceManager.readFile(taskId, path)
      return toolSuccess(content)
    } catch (error) {
      return toolFailure(`Failed to read file: ${error}`)
    }
  }
}
