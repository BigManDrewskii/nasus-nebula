/**
 * Planning Agent — Analyzes requests and generates structured execution plans.
 *
 * The Planning Agent is the first step in the multi-agent pipeline. It:
 * 1. Analyzes the user's request
 * 2. Decomposes the task into phases and steps
 * 3. Generates a structured execution plan
 * 4. Returns the plan for user confirmation before execution begins
 */

import JSON5 from 'json5'
import { BaseAgent } from '../core/BaseAgent'
import { AgentState } from '../core/AgentState'
import type { AgentContext, AgentResult, ExecutionPlan, PlanPhase, PlanFile } from '../core/Agent'
import { cheapestModel, chatJsonViaGateway } from '../llm'
import { memoryStore } from '../memory/LocalMemoryStore'
import { useAppStore } from '../../store'
import { createLogger } from '../../lib/logger'

const log = createLogger('PlanningAgent')

// ── Structured tool definition for forced JSON plan output ─────────────────────
const CREATE_PLAN_TOOL = {
  type: 'function' as const,
  function: {
    name: 'create_plan',
    description: "Creates a structured execution plan based on the user's request.",
    parameters: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Brief 3-6 word title for the plan.' },
        description: { type: 'string', description: 'One sentence overview of the plan.' },
        rationale: { type: 'string', description: 'Why this approach was chosen.' },
        complexity: { type: 'string', enum: ['low', 'medium', 'high'] },
        estimatedSteps: { type: 'number' },
        phases: {
          type: 'array' as const,
          items: {
            type: 'object' as const,
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              description: { type: 'string' },
              steps: {
                type: 'array' as const,
                items: {
                  type: 'object' as const,
                  properties: {
                    id: { type: 'string' },
                    description: { type: 'string' },
                    agent: { type: 'string', enum: ['executor', 'specialist'] },
                    tools: { type: 'array' as const, items: { type: 'string' } },
                    estimatedDuration: { type: 'number' },
                  },
                  required: ['id', 'description', 'agent', 'tools'],
                },
              },
            },
            required: ['id', 'title', 'description', 'steps'],
          },
        },
        files: {
          type: 'array' as const,
          description: 'Files that will be created or modified by this plan.',
          items: {
            type: 'object' as const,
            properties: {
              path: { type: 'string' },
              action: { type: 'string', enum: ['create', 'modify', 'delete'] },
            },
            required: ['path', 'action'],
          },
        },
      },
      required: ['title', 'description', 'rationale', 'complexity', 'phases'],
    },
  },
}

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
    const { userInput, model, useMemory } = params

        // Use cheapest available model for planning, but respect the active gateway.
        // cheapestModel() returns OpenRouter slugs which are invalid on deepseek/ollama/custom.
        const store = useAppStore.getState()
        const conn = store.resolveConnection()
        let planModel: string
        if (conn.provider === 'deepseek') {
          planModel = 'deepseek-chat'
        } else if (conn.provider === 'ollama') {
          planModel = conn.model || model || 'llama3.3:70b'
        } else {
          planModel = cheapestModel(store.openRouterModels) || model || 'anthropic/claude-3-haiku'
        }

    // Build planning prompt (now async for memory lookup)
    const prompt = await this.buildPlanningPrompt(userInput, useMemory)

    try {
      // Try structured output (tool_choice) first; fall back to chatJsonViaGateway
      const planData = await this.callWithStructuredOutput(prompt, planModel, conn)
        ?? await chatJsonViaGateway<any>(prompt, 1500, planModel)

      if (!planData) {
        throw new Error('Failed to generate structured plan')
      }

      // Parse/Validate the response into an ExecutionPlan
      const plan = this.validatePlan(planData, userInput)

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
   * Attempt to get a plan via forced tool_choice (structured output).
   * Returns null if the provider doesn't support tool_choice or an error occurs,
   * allowing the caller to fall back gracefully.
   */
  private async callWithStructuredOutput(
    prompt: string,
    model: string,
    conn: ReturnType<ReturnType<typeof useAppStore.getState>['resolveConnection']>,
  ): Promise<any | null> {
    // Providers known NOT to support tool_choice reliably
    const noToolChoice = conn.provider === 'ollama' || conn.provider === 'deepseek'
    if (noToolChoice) return null

    try {
      const base = (conn.apiBase ?? 'https://openrouter.ai/api/v1').replace(/\/$/, '')
      const url = `${base}/chat/completions`
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${conn.apiKey}`,
        ...(conn.extraHeaders ?? {}),
      }
      if (conn.provider === 'openrouter') {
        headers['HTTP-Referer'] = 'https://nasus.app'
        headers['X-Title'] = 'Nasus'
      }

      const body = JSON.stringify({
        model,
        max_tokens: 2000,
        stream: false,
        tools: [CREATE_PLAN_TOOL],
        tool_choice: { type: 'function', function: { name: 'create_plan' } },
        messages: [{ role: 'user', content: prompt }],
      })

        const resp = await fetch(url, { method: 'POST', headers, body })
        if (!resp.ok) {
          log.warn(`tool_choice request failed (HTTP ${resp.status}), falling back to chatJson`)
          return null
        }

        const rawText = await resp.text()
        let json: Record<string, unknown>
        try {
          json = JSON.parse(rawText)
        } catch {
          log.warn('tool_choice response bad JSON, falling back to chatJson', undefined)
          return null
        }
        const toolCall = (json?.choices as Array<{ message?: { tool_calls?: Array<{ function?: { arguments?: string } }> } }>)?.[0]?.message?.tool_calls?.[0]
        if (!toolCall?.function?.arguments) {
          log.warn('No tool_call in response, falling back to chatJson')
          return null
        }

        try {
          return JSON5.parse(toolCall.function.arguments)
        } catch {
          log.warn('tool_call arguments parse failed, falling back to chatJson')
          return null
        }
      } catch (err) {
        log.warn('callWithStructuredOutput failed, falling back to chatJson', err instanceof Error ? err : new Error(String(err)))
        return null
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

    // Inject UI-specific planning phases for web/design tasks
    const isUITask = /landing|website|webpage|hero|ui|ux|design|frontend|page|layout|component|dashboard|portfolio|app\s+(?:ui|design)/i.test(userMessage)
    if (isUITask) {
      prompt += `

This is a UI/web task. Your plan MUST include the following phases in order:
1. Design Setup — fetch Web Interface Guidelines (http_fetch the Vercel guidelines URL), choose font pairing, define color palette and accent color (NOT purple-to-blue gradient)
2. HTML Structure — write semantic HTML: nav (logo left, links right, CTA rightmost), two-column hero (text + visual), features grid, stats row (horizontal), footer
3. Styling & Animation — apply Tailwind classes, entrance animations (@keyframes fadeUp), hover states, section spacing
4. Visual Verification — call browser_screenshot(full_page=true), check for: broken nav, text-only hero, stacked stats, empty sections, fix any issues found
5. Guidelines Audit — check output against fetched Vercel Web Interface Guidelines, fix any violations

Each phase must use the correct tools. Do NOT collapse these into a single "implement" phase.`
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
- Set agent to "executor" for most steps, "specialist" for web searches and external API calls
- estimatedDuration is in seconds

Respond ONLY with the JSON, no other text.`
    return prompt
  }

  /**
   * Validate and format the LLM response into an ExecutionPlan.
   */
  private validatePlan(parsed: any, userMessage: string): ExecutionPlan {
    try {
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
          files: Array.isArray(parsed.files)
            ? (parsed.files as any[]).map((f): PlanFile => ({
                path: String(f.path || ''),
                action: (['create', 'modify', 'delete'].includes(f.action) ? f.action : 'create') as PlanFile['action'],
              }))
            : undefined,
          dependencies: [],
          createdAt: new Date(),
      }
    } catch {
      // Fallback: create a simple plan if validation failed
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
 * Uses a module-level singleton to avoid spinning up a new agent on every call.
 */
const _sharedPlanningAgent = new PlanningAgent('planning', 'planner')

export async function generatePlan(
  userInput: string,
  apiKey: string,
  model: string,
  apiBase: string,
  provider: string,
  config?: PlanningConfig,
): Promise<ExecutionPlan> {
  if (config) _sharedPlanningAgent.setConfig(config)

  const result = await _sharedPlanningAgent.execute({
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

