import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'

/**
 * Tool for replacing an exact string in a workspace file.
 * Safer than write_file for small edits.
 */
export class PatchFileTool extends BaseTool {
  readonly name = 'patch_file'
  readonly description =
    "Replace an exact string in a workspace file. Safer than write_file for small edits like checking off a phase checkbox in task_plan.md. Fails if old_str is not found — read the file first."

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      path: { type: 'string', description: 'Path relative to /workspace or absolute.' },
      old_str: { type: 'string', description: 'Exact string to find (must be unique in the file).' },
      new_str: { type: 'string', description: 'Replacement string.' },
    },
    required: ['path', 'old_str', 'new_str'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const path = args.path as string
    const oldStr = args.old_str as string
    const newStr = args.new_str as string

    if (!path || !oldStr || newStr === undefined) {
      return toolFailure('path, old_str, and new_str are required')
    }

    try {
      const taskId = (args as any).__taskId || 'initial'
      const content = await workspaceManager.readFile(taskId, path)

      if (!content.includes(oldStr)) {
        return toolFailure(`old_str not found in file: ${path}`)
      }

      const patched = content.replace(oldStr, newStr)
      await workspaceManager.writeFile(taskId, path, patched)

      return toolSuccess(`File patched: ${path}`)
    } catch (error) {
      return toolFailure(`Failed to patch file: ${error}`)
    }
  }
}
