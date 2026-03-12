import { describe, it, expect, vi } from 'vitest'
import { BaseAgent } from './BaseAgent'
import { AgentState } from './AgentState'
import type { AgentContext, AgentResult, AgentTool } from './Agent'

// ---------------------------------------------------------------------------
// Minimal concrete subclass for testing abstract BaseAgent
// ---------------------------------------------------------------------------

class TestAgent extends BaseAgent {
  public lastContext: AgentContext | null = null
  public returnValue: AgentResult = { state: AgentState.FINISHED, done: true }
  public emitted: string[] = []

  constructor(config = {}) {
    super('TestAgent', 'executor', config)
  }

  protected async doExecute(context: AgentContext): Promise<AgentResult> {
    this.lastContext = context
    return this.returnValue
  }

  // Expose protected methods for testing
  public testFilterTools(tools: AgentTool[]) {
    return this.filterTools(tools)
  }

  public testIsStuck(messages: Array<{ content?: string }>) {
    return this.isStuck(messages)
  }

  public testEmitThinking(content: string) {
    this.emitThinking(content)
  }
}

class SpecialistAgent extends BaseAgent {
  constructor(specialization: 'research' | 'code' | 'data' | 'browser') {
    super('Specialist', 'specialist', {}, specialization)
  }

  protected async doExecute(): Promise<AgentResult> {
    return { state: AgentState.FINISHED, done: true }
  }

  public testFilterTools(tools: AgentTool[]) {
    return this.filterTools(tools)
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeContext(overrides: Partial<AgentContext> = {}): AgentContext {
  return {
    task: {
      id: 'task-1',
      title: 'Test task',
      status: 'running',
      createdAt: new Date(),
    },
    userInput: 'do something',
    messages: [],
    tools: [],
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// State transitions
// ---------------------------------------------------------------------------

describe('BaseAgent state transitions', () => {
  it('starts in IDLE state', () => {
    const agent = new TestAgent()
    expect(agent.state).toBe(AgentState.IDLE)
  })

  it('transitions to FINISHED on successful execution', async () => {
    const agent = new TestAgent()
    const result = await agent.execute(makeContext())
    expect(result.done).toBe(true)
    expect(result.error).toBeUndefined()
    expect(agent.state).toBe(AgentState.FINISHED)
  })

  it('transitions to ERROR when doExecute throws', async () => {
    const agent = new TestAgent()
    agent.returnValue = { state: AgentState.ERROR, done: true, error: 'forced' }
    const result = await agent.execute(makeContext())
    expect(agent.state).toBe(AgentState.ERROR)
    expect(result.error).toBe('forced')
  })

  it('can be re-executed after FINISHED', async () => {
    const agent = new TestAgent()
    await agent.execute(makeContext())
    expect(agent.state).toBe(AgentState.FINISHED)

    // Second execution should not throw
    const result2 = await agent.execute(makeContext())
    expect(result2.done).toBe(true)
    expect(agent.state).toBe(AgentState.FINISHED)
  })

  it('reset() returns agent to IDLE', () => {
    const agent = new TestAgent()
    agent.reset()
    expect(agent.state).toBe(AgentState.IDLE)
  })
})

// ---------------------------------------------------------------------------
// Cancellation
// ---------------------------------------------------------------------------

describe('BaseAgent cancellation', () => {
  it('returns immediately when signal is aborted', async () => {
    const agent = new TestAgent()
    const controller = new AbortController()
    controller.abort()

    const result = await agent.execute(makeContext({ signal: controller.signal }))
    expect(result.done).toBe(true)
    expect(result.error).toBe('Execution cancelled')
    expect(agent.lastContext).toBeNull()  // doExecute was never called
  })
})

// ---------------------------------------------------------------------------
// filterTools
// ---------------------------------------------------------------------------

describe('BaseAgent.filterTools', () => {
  const allTools: AgentTool[] = [
    { name: 'search_web', description: 'web search' },
    { name: 'read_file', description: 'read a file' },
    { name: 'python_execute', description: 'run python' },
    { name: 'browser_navigate', description: 'navigate browser' },
    { name: 'bash_execute', description: 'run bash' },
  ]

  it('non-specialist agents get all tools', () => {
    const agent = new TestAgent()
    const filtered = agent.testFilterTools(allTools)
    expect(filtered).toHaveLength(allTools.length)
  })

  it('research specialist gets search and file tools only', () => {
    const agent = new SpecialistAgent('research')
    const filtered = agent.testFilterTools(allTools)
    const names = filtered.map((t) => t.name)
    expect(names).toContain('search_web')
    expect(names).toContain('read_file')
    expect(names).not.toContain('python_execute')
    expect(names).not.toContain('browser_navigate')
  })

  it('code specialist gets code execution tools', () => {
    const agent = new SpecialistAgent('code')
    const filtered = agent.testFilterTools(allTools)
    const names = filtered.map((t) => t.name)
    expect(names).toContain('python_execute')
    expect(names).toContain('bash_execute')
    expect(names).not.toContain('browser_navigate')
  })

  it('browser specialist gets browser tools only', () => {
    const agent = new SpecialistAgent('browser')
    const filtered = agent.testFilterTools(allTools)
    const names = filtered.map((t) => t.name)
    expect(names).toContain('browser_navigate')
    expect(names).not.toContain('search_web')
    expect(names).not.toContain('python_execute')
  })
})

// ---------------------------------------------------------------------------
// isStuck
// ---------------------------------------------------------------------------

describe('BaseAgent.isStuck', () => {
  it('returns false for fewer than 3 messages', () => {
    const agent = new TestAgent()
    expect(agent.testIsStuck([{ content: 'a' }, { content: 'a' }])).toBe(false)
  })

  it('returns false when messages are not repeated', () => {
    const agent = new TestAgent()
    expect(agent.testIsStuck([
      { content: 'a' }, { content: 'b' }, { content: 'c' },
    ])).toBe(false)
  })

  it('returns true when last content repeated 2+ times in recent window', () => {
    const agent = new TestAgent()
    expect(agent.testIsStuck([
      { content: 'x' }, { content: 'x' }, { content: 'x' },
    ])).toBe(true)
  })
})
