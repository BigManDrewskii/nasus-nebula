/**
 * Core agent interface.
 * All agents (Planning, Execution, Verification, Specialist) implement this.
 */

import type { AgentState } from './AgentState'
import type { LlmMessage } from '../llm'
import type { ExecutionConfig } from '../sandboxRuntime'

export type { LlmMessage }

/**
 * Task definition for the agent system.
 */
export interface Task {
  id: string
  title: string
  description?: string
  status: 'idle' | 'pending' | 'running' | 'in_progress' | 'completed' | 'failed' | 'stopped'
  createdAt: Date
  sandboxId?: string
  pinned?: boolean
  /** Inferred task type used for the sidebar icon */
  taskType?: 'research' | 'code' | 'document' | 'web' | 'data' | 'general'
}

/**
 * Tool definition for agent capability.
 */
export interface AgentTool {
  name: string
  description: string
  parameters?: Record<string, unknown>
}

/**
 * Context passed to agents during execution.
 */
export interface AgentContext {
  /** The task being executed */
  task: Task
  /** User's original input */
  userInput: string
  /** Conversation history */
  messages: LlmMessage[]
  /** Available tools (filtered for this agent type) */
  tools: AgentTool[]
  /** API configuration */
  apiKey: string
  model: string
  apiBase: string
  provider: string
  /** Execution config for sandbox */
  executionConfig?: ExecutionConfig
  /** Search configuration */
  searchConfig?: { exaKey: string }
  /** Optional plan for execution agents */
  plan?: ExecutionPlan
  /** Optional correction hints from verification */
  correctionHints?: string
  /** Cancellation signal */
  signal?: AbortSignal
}

/**
 * Result returned by agent execution.
 */
export interface AgentResult {
  /** Current agent state after execution */
  state: AgentState
  /** Output content to show user */
  output?: string
  /** Error message if failed */
  error?: string
  /** Whether execution is complete */
  done: boolean
  /** Whether verification is needed */
  needsVerification?: boolean
  /** Issues found (for verification agent) */
  issues?: AgentIssue[]
  /** Additional metadata */
  metadata?: Record<string, unknown>
}

/**
 * Issue found during verification.
 */
export interface AgentIssue {
  type: 'error' | 'warning' | 'suggestion'
  message: string
  correction?: string
}

/**
 * Execution plan structure (created by PlanningAgent).
 */
export interface ExecutionPlan {
  id: string
  title: string
  description: string
  rationale?: string
  complexity?: 'low' | 'medium' | 'high'
  estimatedSteps: number
  phases: PlanPhase[]
  dependencies: string[]
  createdAt: Date
}

/**
 * A single phase in the execution plan.
 */
export interface PlanPhase {
  id: string
  title: string
  description: string
  steps: PlanStep[]
  status: 'pending' | 'in_progress' | 'completed' | 'blocked'
  estimatedDuration?: number
}

/**
 * A single step within a phase.
 */
export interface PlanStep {
  id: string
  description: string
  agent: 'planner' | 'executor' | 'verifier' | 'specialist'
  specialization?: 'research' | 'code' | 'data' | 'browser'
  tools: string[]
  status?: 'pending' | 'in_progress' | 'completed' | 'failed'
  estimatedDuration?: number
  dependencies?: string[] // IDs of steps that must complete first
}

/**
 * Base agent interface.
 * All agents must implement this.
 */
export interface Agent {
  /** Unique identifier for this agent instance */
  id: string
  /** Human-readable name */
  name: string
  /** Current state */
  state: AgentState
  /** Agent type for routing/display */
  type: 'planner' | 'executor' | 'verifier' | 'specialist'
  /** Specialization (for specialist agents) */
  specialization?: 'research' | 'code' | 'data' | 'browser'

  /**
   * Execute the agent with the given context.
   * Returns the result of execution.
   */
  execute(context: AgentContext): Promise<AgentResult>

  /**
   * Optional: Reset agent state between runs.
   */
  reset?(): void
}

/**
 * Configuration for agent execution.
 */
export interface AgentConfig {
  maxIterations?: number
  timeoutMs?: number
  verbose?: boolean
  enableThinking?: boolean // Whether to emit thinking steps
}
