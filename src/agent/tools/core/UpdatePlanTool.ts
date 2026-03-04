import { BaseTool } from '../core/BaseTool'
import { toolSuccess, toolFailure } from '../core/ToolResult'
import type { ToolResult, ToolParameterSchema } from '../core/ToolResult'
import { workspaceManager } from '../../workspace/WorkspaceManager'
import { useAppStore } from '../../../store'
import type { ExecutionPlan } from '../../core/Agent'

/**
 * Tool for updating the execution plan.
 * This tool allows the agent to dynamically adapt the plan based on new findings.
 */
export class UpdatePlanTool extends BaseTool {
  readonly name = 'update_plan'
  readonly description =
    'Update the execution plan. Use this tool when you discover new information that requires changing the phases or steps of the task. Provide the FULL updated plan as JSON.'

  readonly parameters: ToolParameterSchema = {
    type: 'object',
    properties: {
      plan: {
        type: 'object',
        description: 'The full updated execution plan object.',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          phases: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
                steps: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      description: { type: 'string' },
                      status: { type: 'string', enum: ['pending', 'in_progress', 'completed', 'failed'] },
                    }
                  }
                }
              }
            }
          }
        },
        required: ['title', 'phases']
      }
    },
    required: ['plan'],
  }

  async execute(args: Record<string, unknown>): Promise<ToolResult> {
    const plan = args.plan as ExecutionPlan

    if (!plan || !plan.phases) {
      return toolFailure('Valid plan object with phases is required')
    }

    try {
      const taskId = (args as any).__taskId || 'initial'
      
      // 1. Update task_plan.md in workspace
      const planMarkdown = this.convertToMarkdown(plan)
      await workspaceManager.writeFile(taskId, 'task_plan.md', planMarkdown)
      
      // 2. Update store
      useAppStore.getState().setCurrentPlan(plan)
      
      return toolSuccess(`Execution plan updated and saved to task_plan.md`)
    } catch (error) {
      return toolFailure(`Failed to update plan: ${error}`)
    }
  }

  private convertToMarkdown(plan: ExecutionPlan): string {
    let md = `# Execution Plan: ${plan.title}\n\n`
    md += `${plan.description || ''}\n\n`
    
    plan.phases.forEach((phase, pIdx) => {
      const pStatus = phase.status === 'completed' ? '☑' : '☐'
      md += `## Phase ${pIdx + 1}: ${phase.title} ${pStatus}\n`
      md += `${phase.description || ''}\n\n`
      
      phase.steps.forEach((step) => {
        const sStatus = step.status === 'completed' ? '[x]' : '[ ]'
        md += `- ${sStatus} ${step.description}\n`
      })
      md += '\n'
    })
    
    return md
  }
}
