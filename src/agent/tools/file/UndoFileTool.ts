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
      const rawPath = args.path as string
      if (!rawPath) return toolFailure('path is required')

      const path = rawPath
        .replace(/^\/workspace\/?/, '')
        .replace(/^\.\//, '')
        .replace(/^\//, '')

      try {
        const taskId = (args.__taskId as string | undefined) || 'initial'
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
