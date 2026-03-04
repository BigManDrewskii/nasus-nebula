import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for undoing the last change to a file.
 */
export class UndoFileTool extends BaseTool {
  readonly name = 'undo_file'
  readonly description =
    'Undo the last change to a file in the workspace. Restores the previous version of the file if available.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path to the file to undo.' },
    },
    required: ['path'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const path = args.path as string
    if (!path) return toolFailure('path is required')

    try {
      const taskId = (args as any).__taskId || 'initial'
      const restoredContent = await workspaceManager.undoFile(taskId, path)
      
      if (restoredContent !== null) {
        return toolSuccess(`File ${path} restored to previous version.`)
      } else {
        return toolFailure(`No previous version found for ${path}.`)
      }
    } catch (error) {
      return toolFailure(`Failed to undo file: ${error}`)
    }
  }
}
