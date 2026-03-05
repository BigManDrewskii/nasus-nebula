import { BaseTool } from './BaseTool'
import { toolSuccess, toolFailure } from './ToolResult'
import type { ToolResult, ToolParameterSchema } from './ToolResult'
import { updatePreference } from '../../memory/userPreferences'

/**
 * Tool for saving persistent user preferences.
 */
export class SavePreferenceTool extends BaseTool {
  readonly name = 'save_preference'
  readonly description =
    'Save a persistent user preference that the agent will remember across tasks. Use this when the user explicitly states a preference for a specific technology, coding style, or project structure. Example: save_preference(key="language", value="TypeScript").'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      key: { type: 'string', description: 'The preference key (e.g. "language", "styling", "react_style").' },
      value: { type: 'string', description: 'The preference value (e.g. "TypeScript", "Tailwind CSS", "Functional Components").' },
    },
    required: ['key', 'value'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    try {
      const key = args.key as string
      const value = args.value as string
      
      updatePreference(key, value)
      
      return toolSuccess(`Successfully saved preference: ${key} = ${value}`)
    } catch (err) {
      return toolFailure(err instanceof Error ? err.message : String(err))
    }
  }
}
