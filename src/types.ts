export interface Task {
  id: string
  title: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'stopped'
  createdAt: Date
  sandboxId?: string
  pinned?: boolean
  /** Inferred task type used for the sidebar icon */
  taskType?: 'research' | 'code' | 'document' | 'web' | 'data' | 'general'
}

export interface Message {
  id: string
  author: 'user' | 'agent'
  content: string
  timestamp: Date
  steps?: AgentStep[]
  streaming?: boolean
  error?: string
  attachments?: MessageAttachment[]
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
  | { kind: 'search_status'; callId: string; query: string; phase: 'searching' | 'fallback' | 'complete' | 'no_results' | 'all_failed'; provider: string; message: string; resultCount?: number; durationMs?: number }

export interface MemoryFiles {
  task_plan: string
  findings: string
  progress: string
}

// ── File attachments ──────────────────────────────────────────────────────────

export type AttachmentCategory = 'image' | 'document' | 'spreadsheet' | 'code' | 'archive' | 'other'

export interface Attachment {
  id: string
  name: string
  size: number
  mimeType: string
  category: AttachmentCategory
  status: 'ready' | 'error'
  previewUrl: string | null    // Object URL for image previews
  base64: string | null        // For images sent to multimodal LLM
  textContent: string | null   // For text/code/document files
  error: string | null
}

// Extend Message to carry attachments
export interface MessageAttachment {
  id: string
  name: string
  size: number
  mimeType: string
  category: AttachmentCategory
  previewUrl: string | null
  base64: string | null
}
