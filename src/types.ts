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

// Raw LLM message — re-exported from llm.ts as the single source of truth.
export type { LlmMessage } from './agent/llm'

// One iteration of the Plan → Act → Observe loop
export type AgentStep =
  | { kind: 'thinking'; content: string }
  | { kind: 'tool_call'; tool: string; input: Record<string, unknown>; callId: string }
  | { kind: 'tool_result'; callId: string; output: string; isError: boolean }
  | { kind: 'strike_escalation'; tool: string; attempts: string[] }
  | { kind: 'context_compressed'; removedCount: number }
  | { kind: 'search_status'; callId: string; query: string; phase: 'searching' | 'fallback' | 'complete' | 'no_results' | 'all_failed'; provider: string; message: string; resultCount?: number; durationMs?: number }
  | { kind: 'browser_action'; action: string; url?: string; selector?: string; tabId?: number; phase: 'start' | 'done' | 'error'; detail?: string }
  | { kind: 'output_cards'; files: OutputCardFile[] }

// A file written by the agent during a turn — used to render output cards
export interface OutputCardFile {
  filename: string
  path: string      // normalised path (no leading /workspace/)
  content: string
  size: number      // byte length of content
}

// ── Agent event payload (emitted by Tauri backend) ────────────────────────────

export interface AgentEventPayload {
  kind:
    | 'thinking'
    | 'tool_call'
    | 'tool_result'
    | 'stream_chunk'
    | 'done'
    | 'error'
    | 'strike_escalation'
    | 'context_compressed'
    | 'iteration_tick'
    | 'token_usage'
    | 'auto_title'
    | 'raw_messages'
  task_id: string
  message_id: string
  content?: string
  error?: string
  call_id?: string
  tool?: string
  input?: Record<string, unknown>
  output?: string
  is_error?: boolean
  delta?: string
  done?: boolean
  attempts?: string[]
  removed_count?: number
  iteration?: number
  prompt_tokens?: number
  completion_tokens?: number
  total_tokens?: number
  title?: string
  messages?: LlmMessage[]
}

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
