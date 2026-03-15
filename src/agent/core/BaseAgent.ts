/**
 * Abstract base agent class.
 * Provides common functionality for all agent types.
 * Inspired by OpenManus BaseAgent pattern.
 */

import type {
  Agent,
  AgentContext,
  AgentConfig,
  AgentResult,
  AgentTool,
} from './Agent'
// Value import — AgentState is a const object, not a type-only export
import { AgentState } from './AgentState'
import { StateManager } from './AgentState'
import { DEFAULT_MAX_ITERATIONS } from '../../lib/constants'
import { createLogger } from '../../lib/logger'

const log = createLogger('BaseAgent')

/**
 * Abstract base class for all agents.
 * Implements the Agent interface and provides common functionality.
 */
export abstract class BaseAgent implements Agent {
  public readonly id: string
  public readonly name: string
  public readonly type: 'planner' | 'executor' | 'verifier' | 'specialist'
  public readonly specialization?: 'research' | 'code' | 'data' | 'browser'

  protected stateManager: StateManager
  protected config: Required<AgentConfig>

  constructor(
    name: string,
    type: Agent['type'],
    config: AgentConfig = {},
    specialization?: Agent['specialization'],
  ) {
    this.id = crypto.randomUUID()
    this.name = name
    this.type = type
    this.specialization = specialization
    this.stateManager = new StateManager()
    this.config = {
      maxIterations: config.maxIterations ?? DEFAULT_MAX_ITERATIONS,
      timeoutMs: config.timeoutMs ?? 300_000, // 5 minutes default
      verbose: config.verbose ?? false,
      enableThinking: config.enableThinking ?? true,
    }
  }

  get state(): AgentState {
    return this.stateManager.current
  }

  /**
   * Execute the agent.
   * Template method that sets up state, calls doExecute, and handles cleanup.
   */
  async execute(context: AgentContext): Promise<AgentResult> {
    // Reset state when re-entering from a terminal state (FINISHED or ERROR).
    // The shared singleton agents are reused across tasks; without this reset the
    // history array grows unboundedly and the next transition(RUNNING) throws because
    // FINISHED → RUNNING is not a valid transition.
    if (this.stateManager.current === AgentState.FINISHED || this.stateManager.current === AgentState.ERROR) {
      this.stateManager.reset()
    }

    return this.stateManager.withState(AgentState.RUNNING, async () => {
      try {
        // Check for cancellation
        if (context.signal?.aborted) {
          return {
            state: this.state,
            done: true,
            error: 'Execution cancelled',
          }
        }

        // Run the concrete agent implementation
        const result = await this.doExecute(context)

        // Transition to appropriate final state
        if (result.error) {
          this.stateManager.transition(AgentState.ERROR)
        } else if (result.done) {
          this.stateManager.transition(AgentState.FINISHED)
        }

        return {
          ...result,
          state: this.state,
        }
      } catch (error) {
        this.stateManager.transition(AgentState.ERROR)
        return {
          state: AgentState.ERROR,
          done: true,
          error: error instanceof Error ? error.message : String(error),
        }
      }
    })
  }

  /**
   * Abstract method: subclasses implement their specific execution logic.
   */
  protected abstract doExecute(context: AgentContext): Promise<AgentResult>

  /**
   * Reset agent state between runs.
   */
  reset(): void {
    this.stateManager.reset()
  }

  /**
   * Filter tools to only those this agent can use.
   * Specialist agents only get tools relevant to their specialization.
   */
  protected filterTools(allTools: AgentTool[]): AgentTool[] {
    if (this.type !== 'specialist' || !this.specialization) {
      return allTools
    }

    // Specialist agents get filtered tool sets
    const specialistTools: Record<string, string[]> = {
      research: ['search_web', 'http_fetch', 'read_file', 'write_file', 'list_files'],
      code: ['read_file', 'write_file', 'patch_file', 'list_files', 'python_execute', 'bash_execute', 'serve_preview'],
      data: ['read_file', 'write_file', 'python_execute', 'list_files'],
      browser: ['browser_navigate', 'browser_click', 'browser_type', 'browser_screenshot', 'browser_wait_for'],
    }

    const allowed = specialistTools[this.specialization] ?? []
    return allTools.filter((t) => allowed.includes(t.name))
  }

  /**
   * Emit a thinking step (if enabled).
   * Override in subclasses to emit to UI.
   */
  protected emitThinking(content: string): void {
    // Default: no-op. Subclasses can override to emit to store/UI.
    if (this.config.verbose) {
      log.info(content)
    }
  }

}
