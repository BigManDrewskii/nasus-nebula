import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for applying structured edits to a file using line ranges.
 */
export class EditFileTool extends BaseTool {
  readonly name = 'edit_file'
  readonly description = "Apply structured edits to a file using line ranges. More robust than patch_file or write_file for larger files. Line numbers are 1-based (inclusive)."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
      edits: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            startLine: { type: 'number', description: 'The 1-based start line number (inclusive).' },
            endLine: { type: 'number', description: 'The 1-based end line number (inclusive).' },
            newContent: { type: 'string', description: 'The new content to replace the range with.' },
          },
          required: ['startLine', 'endLine', 'newContent'],
        },
        description: 'List of edits to apply.',
      },
    },
    required: ['path', 'edits'],
  }

    async execute(args: Record<string, unknown>): Promise<ToolResult> {
      const rawPath = args.path as string
      const edits = args.edits as Array<{ startLine: number; endLine: number; newContent: string }>
      const taskId = (args.__taskId as string | undefined) || 'initial'

      if (!rawPath || !edits) {
        return toolFailure('path and edits are required')
      }

      const path = rawPath
        .replace(/^\/workspace\/?/, '')
        .replace(/^\.\//, '')
        .replace(/^\//, '')

      try {
        const content = await workspaceManager.readFile(taskId, path)
        const lines = content.split('\n')

        // Filter and sort edits in descending order by startLine to avoid shifting indices
        const sortedEdits = [...edits].sort((a, b) => b.startLine - a.startLine)

        // Check for overlapping edits
        for (let i = 0; i < sortedEdits.length - 1; i++) {
          const lower = sortedEdits[i + 1]
          const upper = sortedEdits[i]
          if (lower.endLine >= upper.startLine) {
            return toolFailure(`Overlapping edits detected: lines ${lower.startLine}-${lower.endLine} and ${upper.startLine}-${upper.endLine}`)
          }
        }

        for (const edit of sortedEdits) {
          const { startLine, endLine, newContent } = edit
          
          // Validation: Ensure valid range (1-based inclusive).
          // Append case: startLine === endLine === lines.length + 1 is valid (add after last line).
          const isAppendToEnd = startLine === lines.length + 1 && endLine === lines.length + 1
          if (startLine < 1 || startLine > lines.length + 1 || endLine < startLine - 1 || (!isAppendToEnd && endLine > lines.length && endLine !== startLine - 1)) {
            return toolFailure(`Invalid line range: ${startLine}-${endLine} (file has ${lines.length} lines)`)
          }

          const count = Math.max(0, endLine - startLine + 1)
          lines.splice(startLine - 1, count, ...newContent.split('\n'))
        }


      await workspaceManager.writeFile(taskId, path, lines.join('\n'))
      return toolSuccess(`File edited: ${path}`)
    } catch (error) {
      return toolFailure(`Failed to edit file: ${error}`)
    }
  }
}
