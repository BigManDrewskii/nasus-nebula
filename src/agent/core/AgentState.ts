/**
 * Agent state machine types.
 * Based on OpenManus state machine pattern with context manager guarantees.
 */

/**
 * Agent lifecycle states.
 * Transitions: IDLE → THINKING → RUNNING → (FINISHED | ERROR)
 * WAITING is for user input scenarios (plan confirmation, human-in-the-loop)
 */
export enum AgentState {
  IDLE = 'idle',
  THINKING = 'thinking',
  RUNNING = 'running',
  WAITING = 'waiting',
  FINISHED = 'finished',
  ERROR = 'error',
}

/**
 * State transition result for the context manager pattern.
 */
export interface StateTransition {
  previous: AgentState
  current: AgentState
  rollback: () => void
}

/**
 * Check if a state transition is valid.
 */
export function isValidTransition(from: AgentState, to: AgentState): boolean {
  const validTransitions: Record<AgentState, AgentState[]> = {
    [AgentState.IDLE]: [AgentState.THINKING, AgentState.RUNNING, AgentState.ERROR],
    [AgentState.THINKING]: [AgentState.RUNNING, AgentState.WAITING, AgentState.ERROR, AgentState.FINISHED],
    [AgentState.RUNNING]: [AgentState.THINKING, AgentState.RUNNING, AgentState.WAITING, AgentState.FINISHED, AgentState.ERROR],
    [AgentState.WAITING]: [AgentState.RUNNING, AgentState.THINKING, AgentState.ERROR],
    [AgentState.FINISHED]: [AgentState.IDLE], // Can restart
    [AgentState.ERROR]: [AgentState.IDLE, AgentState.THINKING], // Can retry
  }

  return validTransitions[from]?.includes(to) ?? false
}

/**
 * Context manager for safe state transitions (inspired by OpenManus).
 * Ensures state is always rolled back on error.
 */
export class StateManager {
  private state: AgentState = AgentState.IDLE
  private stateHistory: AgentState[] = [AgentState.IDLE]

  get current(): AgentState {
    return this.state
  }

  get history(): readonly AgentState[] {
    return this.stateHistory
  }

  /**
   * Transition to a new state with validation.
   * Throws if transition is invalid.
   */
  transition(to: AgentState): StateTransition {
    const from = this.state

    if (!isValidTransition(from, to)) {
      throw new Error(`Invalid state transition: ${from} → ${to}`)
    }

    this.state = to
    this.stateHistory.push(to)

    return {
      previous: from,
      current: to,
      rollback: () => {
        this.state = from
        this.stateHistory.pop()
      },
    }
  }

  /**
   * Context manager pattern for safe state transitions.
   * Automatically rolls back on error.
   */
  async withState<T>(newState: AgentState, fn: () => Promise<T>): Promise<T> {
    const transition = this.transition(newState)

    try {
      return await fn()
    } catch (error) {
      this.state = transition.previous
      this.stateHistory.pop()
      throw error
    }
  }

  reset(): void {
    this.state = AgentState.IDLE
    this.stateHistory = [AgentState.IDLE]
  }
}
