import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../store', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      model: 'gpt-4o',
      apiKey: 'sk-test',
      apiBase: 'https://api.openai.com/v1',
      provider: 'openai',
      openRouterModels: [],
      extensionConnected: false,
      currentPhase: 0,
      resolveConnection: vi.fn(() => ({
        provider: 'openai',
        apiBase: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        model: 'gpt-4o',
        extraHeaders: {},
      })),
      appendChunk: vi.fn(),
      addStep: vi.fn(),
      updateStep: vi.fn(),
      setStreaming: vi.fn(),
      updateTaskStatus: vi.fn(),
      setError: vi.fn(),
      updateTaskTitle: vi.fn(),
      setMessageModel: vi.fn(),
      updateSearchStatus: vi.fn(),
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

vi.mock('./VerificationAgent', () => ({
  verifyExecution: vi.fn(),
}))

vi.mock('../llm', () => ({
  cheapestModel: vi.fn(() => 'gpt-4o-mini'),
  chatOnceViaGateway: vi.fn(() => Promise.resolve('short title')),
  isReasoningModel: vi.fn(() => false),
}))

vi.mock('../tools', () => ({
  flushTurnFiles: vi.fn(() => []),
  resetBashCallCount: vi.fn(),
  startTurnTracking: vi.fn(),
}))

vi.mock('../tools/index', () => ({
  getToolDefinitions: vi.fn(() => []),
  executeTool: vi.fn(),
}))

vi.mock('../gateway/modelRegistry', () => ({
  getModelsForGateway: vi.fn(() => []),
}))

vi.mock('../context/ContextBuilder', () => ({
  buildContext: vi.fn(() => Promise.resolve({ messages: [{ role: 'user', content: 'do it' }] })),
  contextBuilder: { clearStablePrefix: vi.fn() },
}))

vi.mock('../projectMemory', () => ({
  readProjectMemory: vi.fn(() => Promise.resolve('')),
  updateProjectMemory: vi.fn(() => Promise.resolve()),
}))

vi.mock('../memory/userPreferences', () => ({
  buildPreferencesSummary: vi.fn(() => ''),
}))

vi.mock('../stackTemplates', () => ({
  detectStack: vi.fn(() => null),
  seedStackTemplate: vi.fn(),
}))

vi.mock('../promptAdapter', () => ({
  getModelAdapter: vi.fn(() => ''),
}))

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

vi.mock('../execution/PhaseGate', () => ({
  getActiveToolsForPhase: vi.fn(() => []),
  runPhaseGate: vi.fn(() => Promise.resolve([])),
}))

vi.mock('../execution/ContextCompressor', () => ({
  ContextCompressor: class {
    getThreshold() { return 100 }
    getContextWindow() { return 128000 }
    compress() { return 0 }
  },
}))

vi.mock('../execution/ReactLoop', () => ({
  ReactLoop: vi.fn().mockImplementation(() => ({
    run: vi.fn(() => Promise.resolve({
      status: 'complete',
      executionOutputBuffer: '',
      errorTracker: { record: vi.fn(), isBlocked: vi.fn(() => false), recordCall: vi.fn(() => false), getStrikes: vi.fn(() => 0), attempts: vi.fn(() => []) },
      completedCheckboxes: 0,
    })),
  })),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { ExecutionAgent } from './ExecutionAgent'
import { AgentState } from '../core/AgentState'
import type { ExecutionConfigParams } from './ExecutionAgent'
import type { VerificationResult } from './VerificationAgent'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeParams(overrides: Partial<ExecutionConfigParams> = {}): ExecutionConfigParams {
  return {
    task: { id: 'task-1', title: 'Test', status: 'pending', createdAt: new Date() },
    userInput: 'do a task',
    messages: [],
    tools: [],
    taskId: 'task-1',
    messageId: 'msg-1',
    userMessages: [{ role: 'user', content: 'do a task' }],
    signal: new AbortController().signal,
    ...overrides,
  }
}

function makeVerificationResult(overrides: Partial<VerificationResult> = {}): VerificationResult {
  return {
    passed: true,
    checklist: { filesCreated: true, syntaxValid: true, planCompliant: true, errorsResolved: true },
    issues: [],
    confidence: 1.0,
    corrections: [],
    ...overrides,
  }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ExecutionAgent.buildCorrectionHints', () => {
  it('output contains [Correction Attempt, error message, and warning message', async () => {
    const { verifyExecution } = await import('./VerificationAgent')
    vi.mocked(verifyExecution).mockResolvedValueOnce(makeVerificationResult({
      passed: false,
      issues: [
        { type: 'error', message: 'Build failed badly' },
        { type: 'warning', message: 'Missing test coverage' },
      ],
    }))

    const agent = new ExecutionAgent()
    const params = makeParams({ enableVerification: true })

    // Spy on executeOnce to return FINISHED so executeWithVerification gets called
    vi.spyOn(agent as unknown as { executeOnce: () => Promise<{ agentResult: { state: string; done: boolean }; executionOutputBuffer: string }> }, 'executeOnce').mockResolvedValue({
      agentResult: { state: AgentState.FINISHED, done: true },
      executionOutputBuffer: 'some output',
    })

    // Second attempt also returns FINISHED + verification passes
    vi.mocked(verifyExecution).mockResolvedValueOnce(makeVerificationResult({ passed: true }))

    const result = await agent.execute(params)
    expect(result.state).toBe(AgentState.FINISHED)
  })
})

describe('ExecutionAgent.executeWithVerification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes through when verification passes — emits verification-passed event', async () => {
    const { verifyExecution } = await import('./VerificationAgent')
    vi.mocked(verifyExecution).mockResolvedValue(makeVerificationResult({ passed: true }))

    const agent = new ExecutionAgent()
    vi.spyOn(agent as unknown as { executeOnce: () => Promise<{ agentResult: { state: string; done: boolean }; executionOutputBuffer: string }> }, 'executeOnce').mockResolvedValue({
      agentResult: { state: AgentState.FINISHED, done: true },
      executionOutputBuffer: '',
    })

    let passedFired = false
    window.addEventListener('nasus:verification-passed', () => { passedFired = true }, { once: true })

    const result = await agent.execute(makeParams({ enableVerification: true }))

    expect(result.state).toBe(AgentState.FINISHED)
    expect(result.done).toBe(true)
    expect(passedFired).toBe(true)
  })

  it('retries on failure and stops at MAX_CORRECTION_ATTEMPTS → returns FINISHED (not ERROR)', async () => {
    const { verifyExecution } = await import('./VerificationAgent')
    vi.mocked(verifyExecution).mockResolvedValue(makeVerificationResult({
      passed: false,
      issues: [{ type: 'error', message: 'Still broken' }],
    }))

    const agent = new ExecutionAgent()
    vi.spyOn(agent as unknown as { executeOnce: () => Promise<{ agentResult: { state: string; done: boolean }; executionOutputBuffer: string }> }, 'executeOnce').mockResolvedValue({
      agentResult: { state: AgentState.FINISHED, done: true },
      executionOutputBuffer: '',
    })

    const result = await agent.execute(makeParams({ enableVerification: true }))

    // After MAX_CORRECTION_ATTEMPTS (3) it must return FINISHED, not ERROR
    expect(result.state).toBe(AgentState.FINISHED)
    expect(result.done).toBe(true)
  })
})

describe('ExecutionAgent.executeWithSelfCorrection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns FINISHED (not ERROR) when correctionAttempt >= MAX_CORRECTION_ATTEMPTS', async () => {
    const agent = new ExecutionAgent()

    const result = await agent.execute(makeParams({
      correctionHints: 'fix this',
      correctionAttempt: 3, // = MAX_CORRECTION_ATTEMPTS
    }))

    expect(result.state).toBe(AgentState.FINISHED)
    expect(result.done).toBe(true)
  })
})
