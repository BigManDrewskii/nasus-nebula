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

vi.mock('../llm', () => ({
  chatJsonViaGateway: vi.fn(() => Promise.resolve(null)),
  cheapestModel: vi.fn(() => 'gpt-4o-mini'),
}))

vi.mock('../memory/SqliteMemoryStore', () => ({
  memoryStore: {
    retrieveContext: vi.fn(() => Promise.resolve({ memories: [], context: '' })),
  },
}))

vi.mock('../gateway/modelRegistry', () => ({
  getModelsForGateway: vi.fn(() => []),
}))

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() }),
}))

// ── Import after mocks ────────────────────────────────────────────────────────

import { PlanningAgent, isSimplePlan } from './PlanningAgent'
import type { ExecutionPlan } from '../core/Agent'

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePlan(overrides: Partial<ExecutionPlan> = {}): ExecutionPlan {
  return {
    id: 'test-id',
    title: 'Test Plan',
    description: 'Test',
    complexity: 'low',
    estimatedSteps: 2,
    phases: [
      {
        id: 'phase-1',
        title: 'Phase 1',
        description: 'Do it',
        steps: [
          { id: 'step-1', description: 'Step 1', agent: 'executor', tools: ['search_web'], status: 'pending' },
          { id: 'step-2', description: 'Step 2', agent: 'executor', tools: ['search_web'], status: 'pending' },
        ],
        status: 'pending',
      },
    ],
    dependencies: [],
    createdAt: new Date(),
    ...overrides,
  }
}

// ── Access validatePlan and detectDomain via doExecute fallback path ──────────
// We call the private methods indirectly through the public execute() interface
// by constructing a PlanningAgent and feeding it controlled planData.

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('PlanningAgent.validatePlan', () => {
  let agent: PlanningAgent

  beforeEach(() => {
    vi.clearAllMocks()
    agent = new PlanningAgent()
  })

  it('happy path — 2 phases and 3 steps produces correct estimatedSteps', async () => {
    const { chatJsonViaGateway } = await import('../llm')
    vi.mocked(chatJsonViaGateway).mockResolvedValueOnce({
      title: 'Test Plan',
      description: 'A description',
      rationale: 'Because',
      complexity: 'medium',
      phases: [
        {
          id: 'phase-1',
          title: 'Phase One',
          description: 'First phase',
          steps: [
            { id: 'step-1', description: 'Step 1', agent: 'executor', tools: [] },
            { id: 'step-2', description: 'Step 2', agent: 'executor', tools: [] },
          ],
        },
        {
          id: 'phase-2',
          title: 'Phase Two',
          description: 'Second phase',
          steps: [
            { id: 'step-3', description: 'Step 3', agent: 'executor', tools: [] },
          ],
        },
      ],
    } as unknown as Record<string, unknown>)

    const result = await agent.execute({
      task: { id: 'task-1', title: 'Test', status: 'pending', createdAt: new Date() },
      userInput: 'do a task',
      messages: [],
      tools: [],
    })

    expect(result.metadata?.plan).toBeDefined()
    const plan = result.metadata?.plan as ExecutionPlan
    expect(plan.estimatedSteps).toBe(3)
    expect(plan.phases).toHaveLength(2)
  })

  it('empty phases — returns fallback single-step plan', async () => {
    const { chatJsonViaGateway } = await import('../llm')
    vi.mocked(chatJsonViaGateway).mockResolvedValueOnce({
      title: 'T',
      description: 'D',
      phases: [],
    } as unknown as Record<string, unknown>)

    const result = await agent.execute({
      task: { id: 'task-1', title: 'Test', status: 'pending', createdAt: new Date() },
      userInput: 'do a task',
      messages: [],
      tools: [],
    })

    const plan = result.metadata?.plan as ExecutionPlan
    expect(plan.phases).toHaveLength(1)
    expect(plan.estimatedSteps).toBe(1)
  })

  it('malformed phases — triggers catch and returns fallback plan', async () => {
    const { chatJsonViaGateway } = await import('../llm')
    vi.mocked(chatJsonViaGateway).mockResolvedValueOnce({
      phases: 'not-an-array',
    } as unknown as Record<string, unknown>)

    const result = await agent.execute({
      task: { id: 'task-1', title: 'Test', status: 'pending', createdAt: new Date() },
      userInput: 'do a task',
      messages: [],
      tools: [],
    })

    // Should still succeed with a fallback plan
    const plan = result.metadata?.plan as ExecutionPlan
    expect(plan).toBeDefined()
    expect(plan.phases).toHaveLength(1)
  })
})

describe('PlanningAgent.detectDomain (via generatePlan)', () => {
  let agent: PlanningAgent

  beforeEach(() => {
    vi.clearAllMocks()
    agent = new PlanningAgent()
  })

  async function runWithInput(userInput: string) {
    const { chatJsonViaGateway } = await import('../llm')
    vi.mocked(chatJsonViaGateway).mockResolvedValueOnce({
      title: 'T',
      description: 'D',
      rationale: 'R',
      complexity: 'low',
      phases: [
        {
          id: 'phase-1',
          title: 'Phase 1',
          description: 'Do it',
          steps: [{ id: 'step-1', description: 'Step', agent: 'executor', tools: [] }],
        },
      ],
    } as unknown as Record<string, unknown>)

    return agent.execute({
      task: { id: 'task-1', title: 'Test', status: 'pending', createdAt: new Date() },
      userInput,
      messages: [],
      tools: [],
    })
  }

  it('research task', async () => {
    const result = await runWithInput('research the latest trends')
    const plan = result.metadata?.plan as ExecutionPlan
    expect(plan.specialistDomain).toBe('research')
  })

  it('code task', async () => {
    const result = await runWithInput('build a react component')
    const plan = result.metadata?.plan as ExecutionPlan
    expect(plan.specialistDomain).toBe('code')
  })

  it('data_analysis task', async () => {
    const result = await runWithInput('analyze this csv')
    const plan = result.metadata?.plan as ExecutionPlan
    expect(plan.specialistDomain).toBe('data_analysis')
  })
})

describe('isSimplePlan', () => {
  it('returns true for 1 phase/2 steps with only search_web tools', () => {
    const plan = makePlan()
    expect(isSimplePlan(plan)).toBe(true)
  })

  it('returns false for plan containing bash_execute', () => {
    const plan = makePlan({
      phases: [
        {
          id: 'phase-1',
          title: 'Phase 1',
          description: 'Build it',
          steps: [
            { id: 'step-1', description: 'Step', agent: 'executor', tools: ['bash_execute'], status: 'pending' },
          ],
          status: 'pending',
        },
      ],
    })
    expect(isSimplePlan(plan)).toBe(false)
  })

  it('returns false for plan with 3 phases', () => {
    const plan = makePlan({
      phases: [
        { id: 'p1', title: 'P1', description: '', steps: [{ id: 's1', description: '', agent: 'executor', tools: [], status: 'pending' }], status: 'pending' },
        { id: 'p2', title: 'P2', description: '', steps: [{ id: 's2', description: '', agent: 'executor', tools: [], status: 'pending' }], status: 'pending' },
        { id: 'p3', title: 'P3', description: '', steps: [{ id: 's3', description: '', agent: 'executor', tools: [], status: 'pending' }], status: 'pending' },
      ],
    })
    expect(isSimplePlan(plan)).toBe(false)
  })
})
