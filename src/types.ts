export interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  createdAt: Date
  sandboxId?: string
}

export interface Message {
  id: string
  author: 'user' | 'agent'
  content: string
  timestamp: Date
  steps?: AgentStep[]
  streaming?: boolean
  error?: string
}

// Raw LLM message — stored per-task so multi-turn follow-ups include full tool history
export interface LlmMessage {
  role: string
  content: string | null
  tool_call_id?: string
  tool_calls?: Array<{
    id: string
    type: string
    function: { name: string; arguments: string }
  }>
}

// One iteration of the Plan → Act → Observe loop
export type AgentStep =
  | { kind: 'thinking'; content: string }
  | { kind: 'tool_call'; tool: string; input: Record<string, unknown>; callId: string }
  | { kind: 'tool_result'; callId: string; output: string; isError: boolean }
  | { kind: 'strike_escalation'; tool: string; attempts: string[] }
  | { kind: 'context_compressed'; removedCount: number }

export interface MemoryFiles {
  task_plan: string
  findings: string
  progress: string
  task_id: string | null
}
