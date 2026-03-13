import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReactLoop } from './ReactLoop'
import { ContextCompressor } from './ContextCompressor'
import type { ReactLoopConfig, ReactLoopCallbacks } from './ReactLoop'
import type { LlmMessage, LlmResponse } from '../llm'
import { ErrorTracker } from '../core/ErrorTracker'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../llm', () => ({
  streamCompletion: vi.fn(),
  isReasoningModel: vi.fn(() => false),
  powerfulModel: vi.fn(() => 'gpt-4o'),
}))

vi.mock('../tools', () => ({
  startTurnTracking: vi.fn(),
}))

vi.mock('../tools/index', () => ({
  executeTool: vi.fn(),
  getToolDefinitions: vi.fn(() => []),
}))

vi.mock('../../store', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      model: 'gpt-4o',
      apiBase: 'https://api.openai.com/v1',
      apiKey: 'sk-test',
      provider: 'openai',
      openRouterModels: [],
      messages: {},
      appendChunk: vi.fn(),
      appendRawHistory: vi.fn(),
      addStep: vi.fn(),
      updateStep: vi.fn(),
      updateSearchStatus: vi.fn(),
      setMessageModel: vi.fn(),
      setStreaming: vi.fn(),
      updateTaskStatus: vi.fn(),
      updateTokenUsage: vi.fn(),
      setCurrentPhase: vi.fn(),
      setCurrentStep: vi.fn(),
      setMessageContent: vi.fn(),
      setSandboxStatus: vi.fn(),
    })),
  },
}))

vi.mock('../workspace/WorkspaceManager', () => ({
  workspaceManager: {
    getWorkspaceSync: vi.fn(() => null),
  },
}))

vi.mock('../TraceLogger', () => ({
  TraceLogger: class {
    recordThinking() {}
    startToolCall() { return { end() {} } }
  },
}))

vi.mock('./PhaseGate', () => ({
  runPhaseGate: vi.fn(() => Promise.resolve([])),
  getActiveToolsForPhase: vi.fn(() => []),
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const compressor = new ContextCompressor()

const noop = vi.fn()

const makeCallbacks = (): ReactLoopCallbacks => ({
  onIterationTick: noop,
  onChunk: noop,
  onReasoning: noop,
  onTokenUsage: noop,
  onToolCall: noop,
  onToolResult: noop,
  onSearchStatus: noop,
  onStrikeEscalation: noop,
  onContextCompressed: noop,
  onModelSelected: noop,
})

const conn = {
  apiBase: 'https://api.openai.com/v1',
  apiKey: 'sk-test',
  provider: 'openai',
  model: 'gpt-4o',
  extraHeaders: {} as Record<string, string>,
}

const makeConfig = (overrides: Partial<ReactLoopConfig> = {}): ReactLoopConfig => ({
  taskId: 'task-test',
  messageId: 'msg-test',
  maxIterations: 50,
  signal: new AbortController().signal,
  toolDefs: [],
  resolvedConnection: conn,
  forcePowerfulModel: false,
  env: 'browser-only',
  callbacks: makeCallbacks(),
  compressor,
  ...overrides,
})

const userMessages: LlmMessage[] = [{ role: 'user', content: 'do a task' }]

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ReactLoop', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ── Zero-mock cases ────────────────────────────────────────────────────────

  it('returns max_iterations immediately when maxIterations is 0', async () => {
    const loop = new ReactLoop(makeConfig({ maxIterations: 0 }))
    const result = await loop.run([...userMessages])
    expect(result.status).toBe('max_iterations')
  })

  it('returns aborted when signal is pre-aborted', async () => {
    const ac = new AbortController()
    ac.abort()
    const loop = new ReactLoop(makeConfig({ maxIterations: 5, signal: ac.signal }))
    const result = await loop.run([...userMessages])
    expect(result.status).toBe('aborted')
  })

  // ── LLM stop → complete ────────────────────────────────────────────────────

  it('returns complete when LLM returns stop with no tool calls and no workspace', async () => {
    const { streamCompletion } = await import('../llm')
    vi.mocked(streamCompletion).mockResolvedValueOnce({
      finishReason: 'stop',
      content: 'Task done!',
      toolCalls: [],
      usage: null,
    } satisfies LlmResponse)

    const loop = new ReactLoop(makeConfig({ maxIterations: 5 }))
    const result = await loop.run([...userMessages])

    expect(result.status).toBe('complete')
  })

  // ── complete tool ──────────────────────────────────────────────────────────

  it('returns complete when the "complete" tool is called', async () => {
    const { streamCompletion } = await import('../llm')
    const { executeTool } = await import('../tools/index')

    vi.mocked(streamCompletion).mockResolvedValueOnce({
      finishReason: 'tool_calls',
      content: null,
      toolCalls: [
        { id: 'tc-1', type: 'function', function: { name: 'complete', arguments: '{"summary":"done"}' } },
      ],
      usage: null,
    } satisfies LlmResponse)

    vi.mocked(executeTool).mockResolvedValueOnce({ output: 'Completed.', isError: false })

    // Tool defs must include 'complete' so the availability check passes
    const toolDefs = [
      { type: 'function' as const, function: { name: 'complete', description: '', parameters: {} as never } },
    ]

    const loop = new ReactLoop(makeConfig({ maxIterations: 5, toolDefs }))
    const result = await loop.run([...userMessages])

    expect(result.status).toBe('complete')
    expect(vi.mocked(executeTool)).toHaveBeenCalledWith(
      'complete',
      expect.any(Object),
      expect.any(Object),
    )
  })

  // ── priorRunState ──────────────────────────────────────────────────────────

  it('uses the provided errorTracker from priorRunState instead of creating a new one', async () => {
    const priorErrorTracker = new ErrorTracker()
    const loop = new ReactLoop(
      makeConfig({
        maxIterations: 0, // returns immediately without LLM calls
        priorRunState: { errorTracker: priorErrorTracker, executionOutputBuffer: '' },
      }),
    )
    const result = await loop.run([...userMessages])
    expect(result.errorTracker).toBe(priorErrorTracker)
  })

  it('seeds executionOutputBuffer from priorRunState', async () => {
    const { streamCompletion } = await import('../llm')
    vi.mocked(streamCompletion).mockResolvedValueOnce({
      finishReason: 'stop',
      content: 'done',
      toolCalls: [],
      usage: null,
    } satisfies LlmResponse)

    const prior = { errorTracker: new ErrorTracker(), executionOutputBuffer: '[prior output]' }
    const loop = new ReactLoop(makeConfig({ maxIterations: 5, priorRunState: prior }))
    const result = await loop.run([...userMessages])

    // The buffer should start with the prior content (no tool calls in this run, so it's just the prior)
    expect(result.executionOutputBuffer).toContain('[prior output]')
  })

  // ── executionOutputBuffer accumulation ────────────────────────────────────

  it('prefixes error tool output with [ERROR] in executionOutputBuffer', async () => {
    const { streamCompletion } = await import('../llm')
    const { executeTool } = await import('../tools/index')

    // First call: tool call that errors
    vi.mocked(streamCompletion)
      .mockResolvedValueOnce({
        finishReason: 'tool_calls',
        content: null,
        toolCalls: [
          { id: 'tc-err', type: 'function', function: { name: 'read_file', arguments: '{"path":"x"}' } },
        ],
        usage: null,
      } satisfies LlmResponse)
      // Second call: stop (end the loop)
      .mockResolvedValueOnce({
        finishReason: 'stop',
        content: 'done',
        toolCalls: [],
        usage: null,
      } satisfies LlmResponse)

    vi.mocked(executeTool).mockResolvedValueOnce({
      output: 'File not found: x',
      isError: true,
    })

    const toolDefs = [
      { type: 'function' as const, function: { name: 'read_file', description: '', parameters: {} as never } },
    ]

    const loop = new ReactLoop(makeConfig({ maxIterations: 10, toolDefs }))
    const result = await loop.run([...userMessages])

    expect(result.executionOutputBuffer).toContain('[ERROR]')
    expect(result.executionOutputBuffer).toContain('File not found: x')
  })
})
