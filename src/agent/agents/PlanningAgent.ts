/**
 * Planning Agent — Analyzes requests and generates structured execution plans.
 *
 * The Planning Agent is the first step in the multi-agent pipeline. It:
 * 1. Analyzes the user's request
 * 2. Decomposes the task into phases and steps
 * 3. Generates a structured execution plan
 * 4. Returns the plan for user confirmation before execution begins
 */

import { BaseAgent } from '../core/BaseAgent'
import { AgentState } from '../core/AgentState'
import type { AgentContext, AgentResult, ExecutionPlan, PlanPhase } from '../core/Agent'
import { chatOnce, cheapestModel } from '../llm'
import { memoryStore } from '../memory/LocalMemoryStore'
import { useAppStore } from '../../store'

/**
 * Planning context parameters.
 */
export interface PlanningContext extends AgentContext {
  apiKey: string
  model: string
  apiBase: string
  provider: string
  /** Include memory from previous tasks */
  useMemory?: boolean
}

/**
 * Planning Agent configuration.
 */
export interface PlanningConfig {
  /** Whether to auto-approve simple plans (default: false) */
  autoApproveSimple?: boolean
  /** Maximum phases to generate (default: 8) */
  maxPhases?: number
  /** Maximum steps per phase (default: 6) */
  maxStepsPerPhase?: number
  /** Whether to use memory for context (default: true) */
  useMemory?: boolean
}

/**
 * Planning Agent - Generates structured execution plans.
 */
export class PlanningAgent extends BaseAgent {
  readonly id = 'planning-agent'
  readonly name = 'Planning Agent'
  readonly description = 'Analyzes requests and generates structured execution plans'

  private planningConfig: PlanningConfig = {}

  constructor(name: string = 'Planning Agent', type: 'planner' = 'planner') {
    super(name, type)
  }

  setConfig(config: PlanningConfig): void {
    this.planningConfig = { ...this.planningConfig, ...config }
  }

  /**
   * Execute the planning agent.
   */
  protected async doExecute(context: AgentContext): Promise<AgentResult> {
    const params = context as PlanningContext
    const { userInput, apiKey, model, apiBase, provider, useMemory } = params

      // Use cheapest available model for planning to avoid burning premium tokens
      const openRouterModels = useAppStore.getState().openRouterModels
      const planModel = cheapestModel(openRouterModels) || model || 'anthropic/claude-3-haiku'

    // Build planning prompt (now async for memory lookup)
    const prompt = await this.buildPlanningPrompt(userInput, useMemory)

    try {
      const response = await chatOnce(apiBase, apiKey, provider, planModel, prompt)

      // Parse the response into an ExecutionPlan
      const plan = this.parsePlan(response, userInput)

      return {
        state: this.state,
        done: true,
        metadata: { status: 'needs_approval', plan },
      }
    } catch (error) {
      return {
        state: AgentState.ERROR,
        done: true,
        error: `Planning failed: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
  }

  /**
   * Build the planning prompt.
   */
  private async buildPlanningPrompt(userMessage: string, useMemory = true): Promise<string> {
    let prompt = `You are a Planning Agent. Your job is to break down the user's request into clear, executable steps.

User Request: ${userMessage}`

    // Add memory context if enabled
    if (useMemory && this.planningConfig.useMemory !== false) {
      try {
        const { memories, context } = await memoryStore.retrieveContext(userMessage, 3)
        if (context && memories.length > 0) {
          prompt += `\n\n${context}\n\nUse this past work as reference, but adapt to the current request.`
        }
      } catch {
        // Memory lookup failed - continue without it
      }
    }

    prompt += `

Consider:
1. What information needs to be gathered?
2. What tools will be needed?
3. What are the logical dependencies?
4. Where should we verify results?

Output a structured plan with phases and steps. Use this EXACT JSON format:

\`\`\`json
{
  "title": "Brief 3-6 word title",
  "description": "One sentence overview",
  "rationale": "Why this approach was chosen",
  "complexity": "low|medium|high",
  "estimatedSteps": 5,
  "phases": [
    {
      "id": "phase-1",
      "title": "Phase name",
      "description": "What this phase accomplishes",
      "steps": [
        {
          "id": "step-1",
          "description": "Specific action to take",
          "agent": "executor",
          "tools": ["tool_name"],
          "estimatedDuration": 30
        }
      ],
      "status": "pending"
    }
  ]
}
\`\`\`

Guidelines:
- Break complex tasks into 3-8 phases
- Each phase should have 1-6 steps
- Use tool names from: search_web, http_fetch, read_file, write_file, python_execute, bash_execute, browser_navigate, browser_click, browser_extract, browser_screenshot
- Keep descriptions concise and actionable
- Set agent to "executor" for most steps, "research" for web searches
- estimatedDuration is in seconds

Respond ONLY with the JSON, no other text.`
    return prompt
  }

  /**
   * Parse the LLM response into an ExecutionPlan.
   */
  private parsePlan(response: string, userMessage: string): ExecutionPlan {
    try {
      // Extract JSON from markdown code blocks if present
      let jsonStr = response.trim()
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1]
      }

      const parsed = JSON.parse(jsonStr)

      // Validate and build the plan
      const phases: PlanPhase[] = (parsed.phases || []).map((p: unknown, idx: number) => {
        const phase = p as Record<string, unknown>
        return {
          id: (phase.id as string) || `phase-${idx + 1}`,
          title: (phase.title as string) || `Phase ${idx + 1}`,
          description: (phase.description as string) || '',
          steps: ((phase.steps as unknown[]) || []).map((s: unknown, stepIdx: number) => {
            const step = s as Record<string, unknown>
            return {
              id: (step.id as string) || `step-${idx + 1}-${stepIdx + 1}`,
              description: (step.description as string) || '',
              agent: (step.agent as string) || 'executor',
              tools: (step.tools as string[]) || [],
              estimatedDuration: (step.estimatedDuration as number) || 30,
              status: 'pending' as const,
            }
          }),
          status: 'pending' as const,
        }
      })

      return {
        id: crypto.randomUUID(),
        title: parsed.title || 'Task Execution Plan',
        description: parsed.description || userMessage.slice(0, 200),
        rationale: parsed.rationale,
        complexity: (parsed.complexity as 'low' | 'medium' | 'high') || 'medium',
        estimatedSteps: phases.reduce((sum, p) => sum + p.steps.length, 0),
        phases,
        dependencies: [],
        createdAt: new Date(),
      }
    } catch {
      // Fallback: create a simple plan if parsing failed
      return {
        id: crypto.randomUUID(),
        title: 'Task Execution',
        description: userMessage.slice(0, 200),
        rationale: 'Direct execution of the user request.',
        complexity: 'low',
        estimatedSteps: 1,
        phases: [{
          id: 'phase-1',
          title: 'Execute Task',
          description: 'Execute the user request',
          steps: [{
            id: 'step-1',
            description: userMessage,
            agent: 'executor',
            tools: [],
            estimatedDuration: 60,
            status: 'pending',
          }],
          status: 'pending',
        }],
        dependencies: [],
        createdAt: new Date(),
      }
    }
  }

  /**
   * Check if a plan is simple enough to auto-approve.
   */
  isSimplePlan(plan: ExecutionPlan): boolean {
    if (!this.planningConfig.autoApproveSimple) return false

    // Simple plans have:
    // - 1-2 phases max
    // - 3 steps total max
    // - No complex tool dependencies (just web search or file ops)
    const stepCount = plan.phases.reduce((sum, p) => sum + p.steps.length, 0)
    if (plan.phases.length > 2 || stepCount > 3) return false

    // Check if all tools are simple (search_web, http_fetch, read_file, write_file)
    const complexTools = ['bash_execute', 'python_execute', 'browser_navigate', 'serve_preview']
    for (const phase of plan.phases) {
      for (const step of phase.steps) {
        if (step.tools.some(t => complexTools.includes(t))) {
          return false
        }
      }
    }

    return true
  }
}

/**
 * Convenience function to generate a plan.
 */
export async function generatePlan(
  userInput: string,
  apiKey: string,
  model: string,
  apiBase: string,
  provider: string,
  config?: PlanningConfig,
): Promise<ExecutionPlan> {
  const agent = new PlanningAgent('planning', 'planner')
  if (config) agent.setConfig(config)

    const result = await agent.execute({
      task: { id: 'planning-task', title: 'Planning Task', status: 'pending', createdAt: new Date() },
      userInput,
    messages: [],
    tools: [],
    apiKey,
    model,
    apiBase,
    provider,
  })

  if (result.metadata?.status === 'needs_approval' && result.metadata?.plan) {
    return result.metadata.plan as ExecutionPlan
  }

  // Fallback plan on error
  return {
    id: crypto.randomUUID(),
    title: 'Task Execution',
    description: userInput.slice(0, 200),
    rationale: 'Direct execution of the user request.',
    complexity: 'low',
    estimatedSteps: 1,
    phases: [{
      id: 'phase-1',
      title: 'Execute Task',
      description: 'Execute the user request',
      steps: [{
        id: 'step-1',
        description: userInput,
        agent: 'executor',
        tools: [],
        estimatedDuration: 60,
        status: 'pending',
      }],
      status: 'pending',
    }],
    dependencies: [],
    createdAt: new Date(),
  }
}
