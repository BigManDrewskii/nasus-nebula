import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for listing files and directories in the workspace.
 */
export class ListFilesTool extends BaseTool {
  readonly name = 'list_files'
  readonly description = 'List files and directories in the workspace.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Directory path (default: /workspace).', default: '/workspace' },
      recursive: { type: 'boolean', description: 'List recursively (default false).', default: false },
    },
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const path = (args.path as string) || '/workspace'

    try {
      const taskId = (args as any).__taskId || 'initial'
      const files = await workspaceManager.listFiles(taskId)

      // Filter by path if specified
      let filtered = files
      if (path && path !== '/workspace') {
        const normalizedPath = path.replace(/^\/workspace\/?/, '').replace(/^\.\//, '')
        filtered = files.filter(f => f.path.startsWith(normalizedPath))
      }

      // Format output
      const output = filtered.map(f => {
        const indent = f.path.includes('/') ? '  '.repeat(f.path.split('/').length - 1) : ''
        return `${indent}${f.filename}`
      }).join('\n')

      return toolSuccess(output || 'No files found.')
    } catch (error) {
      return toolFailure(`Failed to list files: ${error}`)
    }
  }
}
