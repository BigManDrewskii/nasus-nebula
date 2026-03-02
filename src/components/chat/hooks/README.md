# Chat Hooks

Custom React hooks for managing chat functionality in Nasus.

## Overview

This directory contains three custom hooks that subscribe to `nasus:` prefixed CustomEvents to track agent execution state, streaming text, and tool events.

## Hooks

### `useAgentStatus`

Tracks the overall agent execution state.

**Returns:**
- `status: AgentStatus` - Current agent state ('idle' | 'processing' | 'streaming' | 'done')
- `currentTool: string | null` - Name of the currently executing tool
- `iteration: number` - Current iteration count

**Events listened to:**
- `nasus:agent-started` - Sets status to 'processing'
- `nasus:iteration` - Updates iteration count
- `nasus:stream-chunk` - Sets status to 'streaming'
- `nasus:tool-call` - Updates currentTool
- `nasus:agent-done` - Sets status to 'done'
- `nasus:processing-end` - Clears currentTool
- `nasus:verification-passed` - Sets status to 'done'
- `nasus:verification-failed` - Sets status to 'done'

**Example:**
```tsx
const { status, currentTool, iteration } = useAgentStatus()

if (status === 'processing') {
  return <div>Thinking... (Tool: {currentTool})</div>
}
```

### `useChatStreaming`

Manages streaming text accumulation for messages.

**Returns:**
- `streamingContent: Map<string, StreamingContent>` - Map of messageId to streaming content
- `getStreamingText(messageId: string): string` - Get accumulated text for a message
- `isStreaming(messageId: string): boolean` - Check if a message is currently streaming

**Events listened to:**
- `nasus:stream-chunk` - Appends delta to message content
- `nasus:stream-complete` - Marks streaming as complete
- `nasus:agent-done` - Marks streaming as complete

**Example:**
```tsx
const { getStreamingText, isStreaming } = useChatStreaming()

<Message content={getStreamingText(message.id)} />
{isStreaming(message.id) && <Spinner />}
```

### `useToolEvents`

Tracks tool execution events for a specific task.

**Parameters:**
- `taskId: string | null` - The task ID to track events for

**Returns:**
- `events: ToolEvent[]` - Array of all tool events
- `activeTools: Set<string>` - Set of currently active tool names
- `completedTools: Set<string>` - Set of completed tool names
- `getEventsForTool(toolName: string): ToolEvent[]` - Get all events for a specific tool
- `getLatestEventForTool(toolName: string): ToolEvent | null` - Get most recent event for a tool

**Events listened to:**
- `nasus:tool-call` - Records tool start
- `nasus:tool-result` - Records tool completion/error

**Example:**
```tsx
const { activeTools, getLatestEventForTool } = useToolEvents(taskId)

{activeTools.has('search_web') && (
  <div>Searching the web...</div>
)}
```

## Patterns

All hooks follow these patterns:

1. **Event-based** - Subscribe to CustomEvents with `nasus:` prefix
2. **Cleanup on unmount** - All event listeners are removed in useEffect cleanup
3. **TypeScript** - Full type safety with exported interfaces
4. **Null-safe** - Check event details before processing
5. **State-driven** - Return state that components can consume directly

## Usage

Import from the index file:

```tsx
import { useAgentStatus, useChatStreaming, useToolEvents } from '@/components/chat/hooks'
```
