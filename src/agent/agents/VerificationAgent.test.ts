import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks ──────────────────────────────────────────────────────────────

vi.mock('../../store', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      model: 'gpt-4o',
      openRouterModels: [],
      resolveConnection: vi.fn(() => ({
        provider: 'openai',
        apiBase: 'https://api.openai.com/v1',
        apiKey: 'sk-test',
        model: 'gpt-4o',
        extraHeaders: {},
      })),
    })),
  },
}))

vi.mock('../workspace/WorkspaceManager', () => ({
  workspaceManager: {
    getWorkspaceSync: vi.fn(() => null),
  },
}))

vi.mock('../llm', () => ({
  chatOnceViaGateway: vi.fn(() => Promise.resolve('{"issues":[]}')),
  cheapestModel: vi.fn(() => 'gpt-4o-mini'),
}))

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { verifyExecution, verifyPhaseGate } from './VerificationAgent'
import type { VerificationContext } from './VerificationAgent'
import type { ExecutionPlan } from '../core/Agent'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  return {
    id: 'plan-1',
    title: 'Test Plan',
    description: 'Test',
    estimatedSteps: 1,
    phases: [],
    dependencies: [],
    createdAt: new Date(),
    ...overrides,
  }
}

function makeContext(overrides: Partial<VerificationContext> = {}): VerificationContext {
  return {
    task: { id: 'task-1', title: 'Test Task', status: 'pending', createdAt: new Date() },
    userInput: 'do a task',
    messages: [],
    tools: [],
    taskId: 'task-1',
    plan: makePlan(),
    executionOutput: '',
    quick: true,
    ...overrides,
  }
}

// ── Tests: runChecklist ───────────────────────────────────────────────────────

describe('VerificationAgent.runChecklist', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('filesCreated=false when createdFiles contains empty content', async () => {
    const ctx = makeContext({
      createdFiles: [{ path: 'file.ts', content: '' }],
    })
    const result = await verifyPhaseGate(ctx)
    expect(result.checklist.filesCreated).toBe(false)
  })

  it('syntaxValid=false for truncated TypeScript file (// ... in last 5 lines)', async () => {
    const truncatedContent = `const x = 1\nconst y = 2\nconst z = 3\n\n// ...`
    const ctx = makeContext({
      createdFiles: [{ path: 'file.ts', content: truncatedContent }],
    })
    const result = await verifyPhaseGate(ctx)
    expect(result.checklist.syntaxValid).toBe(false)
  })

  it('planCompliant=true when no workspace entry exists (optimistic default)', async () => {
    const { workspaceManager } = await import('../workspace/WorkspaceManager')
    vi.mocked(workspaceManager.getWorkspaceSync).mockReturnValueOnce(null)
    const ctx = makeContext({ taskId: 'no-workspace-task' })
    const result = await verifyPhaseGate(ctx)
    expect(result.checklist.planCompliant).toBe(true)
  })

  it('errorsResolved=false when executionOutput contains "Error:"', async () => {
    const ctx = makeContext({ executionOutput: 'Error: something went wrong' })
    const result = await verifyPhaseGate(ctx)
    expect(result.checklist.errorsResolved).toBe(false)
  })
})

// ── Tests: isPassed ───────────────────────────────────────────────────────────

describe('VerificationAgent.isPassed', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('passes when no errors and all checklist items true', async () => {
    const ctx = makeContext({
      executionOutput: 'Success',
      createdFiles: [{ path: 'out.ts', content: 'const x = 1' }],
    })
    const result = await verifyPhaseGate(ctx)
    expect(result.passed).toBe(true)
  })

  it('fails when syntaxValid=false even with no execution errors', async () => {
    const truncatedContent = `const x = 1\nconst y = 2\nconst z = 3\n\n// ...`
    const ctx = makeContext({
      createdFiles: [{ path: 'file.ts', content: truncatedContent }],
      executionOutput: '',
    })
    const result = await verifyPhaseGate(ctx)
    expect(result.passed).toBe(false)
  })
})

// ── Tests: calculateConfidence ────────────────────────────────────────────────

describe('VerificationAgent.calculateConfidence', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('full pass → confidence = 1.0', async () => {
    const ctx = makeContext({
      executionOutput: 'all good',
      createdFiles: [{ path: 'out.ts', content: 'const x = 1' }],
    })
    const result = await verifyPhaseGate(ctx)
    expect(result.confidence).toBe(1.0)
  })

  it('one error issue → confidence < 0.9', async () => {
    const ctx = makeContext({ executionOutput: 'Error: something failed' })
    const result = await verifyPhaseGate(ctx)
    expect(result.confidence).toBeLessThan(0.9)
  })

  it('syntaxValid=false + one error → confidence < 0.5', async () => {
    const truncatedContent = `const x = 1\nconst y = 2\nconst z = 3\n\n// ...`
    const ctx = makeContext({
      createdFiles: [{ path: 'file.ts', content: truncatedContent }],
      executionOutput: 'Error: build failed',
    })
    const result = await verifyPhaseGate(ctx)
    expect(result.confidence).toBeLessThan(0.5)
  })
})

// ── Tests: verifyExecution quick mode ────────────────────────────────────────

describe('VerificationAgent.verifyExecution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('quick mode: does NOT call analyzeWithLLM (LLM mock not called)', async () => {
    const { chatOnceViaGateway } = await import('../llm')
    const ctx = makeContext({ quick: true, executionOutput: 'Success' })
    await verifyExecution(ctx)
    expect(vi.mocked(chatOnceViaGateway)).not.toHaveBeenCalled()
  })

  it('full mode with no issues: returns { passed: true }', async () => {
    const { chatOnceViaGateway } = await import('../llm')
    vi.mocked(chatOnceViaGateway).mockResolvedValueOnce('{"issues":[]}')
    const ctx = makeContext({ quick: false, executionOutput: 'Success' })
    const result = await verifyExecution(ctx)
    expect(result.passed).toBe(true)
  })
})
