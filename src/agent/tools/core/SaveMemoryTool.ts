import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { tauriInvoke } from '../../../tauri'
import { useAppStore } from '../../../store'

/**
 * Tool for saving project-wide facts to project_memory.md.
 */
export class SaveMemoryTool extends BaseTool {
  readonly name = 'save_memory'
  readonly description = 
    'Save project-wide facts (frameworks, conventions, API patterns) to project_memory.md. ' +
    'This context persists across tasks for this project.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      fact: { type: 'string', description: 'The project-level fact to save (e.g. "Uses Tailwind v4").' },
    },
    required: ['fact'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const fact = args.fact as string
    if (!fact) return toolFailure('fact is required')

    const workspacePath = useAppStore.getState().workspacePath
    if (!workspacePath) return toolFailure('No workspace path configured')

    const memoryPath = `${workspacePath}/.nasus/project_memory.md`
    
    try {
      // Read existing
      let existing = ''
      try {
        existing = await tauriInvoke<string>('read_file', {
          taskId: '__system__',
          path: memoryPath
        }) || ''
      } catch { /* ignore if not exists */ }

      const updated = existing
        ? `${existing.trimEnd()}\n- ${fact}\n`
        : `# Project Memory\n\nFacts discovered about this project:\n\n- ${fact}\n`

      await tauriInvoke('write_file', {
        taskId: '__system__',
        path: memoryPath,
        content: updated
      })

      return toolSuccess(`Fact saved to project memory: ${fact}`)
    } catch (error) {
      return toolFailure(`Failed to save memory: ${error}`)
    }
  }
}
