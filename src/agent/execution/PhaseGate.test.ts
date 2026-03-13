import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getActiveToolsForPhase, runPhaseGate } from './PhaseGate'
import type { ExecutionPlan } from '../core/Agent'
import type { VerificationResult, VerificationChecklist } from '../agents/VerificationAgent'
import { workspaceManager } from '../workspace/WorkspaceManager'
import { verifyPhaseGate } from '../agents/VerificationAgent'

vi.mock('../workspace/WorkspaceManager', () => ({
  workspaceManager: {
    getWorkspaceSync: vi.fn(),
  },
}))

vi.mock('../agents/VerificationAgent', () => ({
  verifyPhaseGate: vi.fn(),
}))

const passedChecklist: VerificationChecklist = {
  filesCreated: true,
  syntaxValid: true,
  planCompliant: true,
  errorsResolved: true,
}

const emptyVerificationResult: VerificationResult = {
  passed: true,
  checklist: passedChecklist,
  issues: [],
  confidence: 1,
  corrections: [],
}

// ── getActiveToolsForPhase ────────────────────────────────────────────────────

describe('getActiveToolsForPhase', () => {
  const ALWAYS = ['think', 'complete', 'update_plan', 'save_memory', 'save_preference']

  it('returns empty array for an unrecognised generic phase title', () => {
    expect(getActiveToolsForPhase('Final Output')).toEqual([])
    expect(getActiveToolsForPhase('Summary')).toEqual([])
    expect(getActiveToolsForPhase('')).toEqual([])
  })

  it('includes ALWAYS_AVAILABLE tools in every non-empty keyword result', () => {
    const result = getActiveToolsForPhase('Research Phase')
    for (const tool of ALWAYS) {
      expect(result).toContain(tool)
    }
  })

  it('returns research tools for a phase title containing "research"', () => {
    const result = getActiveToolsForPhase('Research Phase')
    expect(result).toContain('search_web')
    expect(result).toContain('http_fetch')
    expect(result).toContain('browser_navigate')
  })

  it('returns research tools for a phase title containing "search"', () => {
    const result = getActiveToolsForPhase('Search & Gather')
    expect(result).toContain('search_web')
    expect(result).toContain('browser_extract')
  })

  it('returns implementation tools for a phase title containing "implement"', () => {
    const result = getActiveToolsForPhase('Implement Feature')
    expect(result).toContain('write_file')
    expect(result).toContain('edit_file')
    expect(result).toContain('bash_execute')
  })

  it('returns implementation tools for a phase title containing "build"', () => {
    const result = getActiveToolsForPhase('Build Component')
    expect(result).toContain('write_file')
    expect(result).toContain('bash_execute')
  })

  it('returns data-driven tools (union with ALWAYS_AVAILABLE) when phaseStepTools is provided', () => {
    const result = getActiveToolsForPhase('Anything', [['custom_tool', 'read_file']])
    expect(result).toContain('custom_tool')
    expect(result).toContain('read_file')
    for (const tool of ALWAYS) {
      expect(result).toContain(tool)
    }
    expect(result).not.toContain('search_web')
  })

  it('falls back to keyword matching when phaseStepTools is an empty array', () => {
    const result = getActiveToolsForPhase('Research Phase', [])
    expect(result).toContain('search_web')
  })

  it('falls back to keyword matching when phaseStepTools contains only empty arrays', () => {
    const result = getActiveToolsForPhase('Research Phase', [[], []])
    expect(result).toContain('search_web')
  })

  it('de-duplicates tool names in the data-driven path', () => {
    const result = getActiveToolsForPhase('Phase', [['think', 'think', 'read_file']])
    const thinkCount = result.filter(t => t === 'think').length
    expect(thinkCount).toBe(1)
  })
})

// ── runPhaseGate ──────────────────────────────────────────────────────────────

describe('runPhaseGate', () => {
  const plan: ExecutionPlan = {
    id: 'plan-1',
    title: 'Build a site',
    description: '',
    complexity: 'low',
    estimatedSteps: 3,
    dependencies: [],
    createdAt: new Date(),
    phases: [
      {
        id: 'p0',
        title: 'Phase 0',
        description: '',
        status: 'pending',
        steps: [],
      },
    ],
  }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns [] when workspace is empty (no files)', async () => {
    vi.mocked(workspaceManager.getWorkspaceSync).mockReturnValue(new Map())
    const result = await runPhaseGate(plan, 'task-1')
    expect(result).toEqual([])
    expect(verifyPhaseGate).not.toHaveBeenCalled()
  })

  it('returns [] when workspace only contains metadata files', async () => {
    const ws = new Map<string, string>([
      ['task_plan.md', '# plan'],
      ['findings.md', '## findings'],
      ['.hidden', 'secret'],
    ])
    vi.mocked(workspaceManager.getWorkspaceSync).mockReturnValue(ws)
    const result = await runPhaseGate(plan, 'task-1')
    expect(result).toEqual([])
    expect(verifyPhaseGate).not.toHaveBeenCalled()
  })

  it('calls verifyPhaseGate when workspace has non-metadata files', async () => {
    const ws = new Map<string, string>([
      ['index.html', '<html/>'],
      ['task_plan.md', '# plan'],
    ])
    vi.mocked(workspaceManager.getWorkspaceSync).mockReturnValue(ws)
    vi.mocked(verifyPhaseGate).mockResolvedValue(emptyVerificationResult)

    await runPhaseGate(plan, 'task-1')

    expect(verifyPhaseGate).toHaveBeenCalledOnce()
    const callArgs = vi.mocked(verifyPhaseGate).mock.calls[0][0]
    expect(callArgs.quick).toBe(true)
    expect(callArgs.createdFiles).toEqual([{ path: 'index.html', content: '<html/>' }])
  })

  it('returns only error-type issues from verifyPhaseGate', async () => {
    const ws = new Map<string, string>([['index.html', '<html/>']])
    vi.mocked(workspaceManager.getWorkspaceSync).mockReturnValue(ws)
    vi.mocked(verifyPhaseGate).mockResolvedValue({
      ...emptyVerificationResult,
      passed: false,
      issues: [
        { type: 'error', message: 'Missing title tag' },
        { type: 'warning', message: 'No description meta' },
        { type: 'error', message: 'Broken link' },
      ],
    })

    const result = await runPhaseGate(plan, 'task-1')
    expect(result).toHaveLength(2)
    expect(result[0].message).toBe('Missing title tag')
    expect(result[1].message).toBe('Broken link')
  })

  it('returns [] and swallows errors thrown by verifyPhaseGate', async () => {
    const ws = new Map<string, string>([['index.html', '<html/>']])
    vi.mocked(workspaceManager.getWorkspaceSync).mockReturnValue(ws)
    vi.mocked(verifyPhaseGate).mockRejectedValue(new Error('LLM timeout'))

    const result = await runPhaseGate(plan, 'task-1')
    expect(result).toEqual([])
  })
})
