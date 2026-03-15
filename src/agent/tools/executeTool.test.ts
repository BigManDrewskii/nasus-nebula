/**
 * executeTool.test.ts
 *
 * Tests the permission gate (Fix C1) and per-task bash call cap (Fix C3)
 * in the central executeTool dispatcher.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Module mocks (hoisted before any import) ──────────────────────────────────
// executeTool lives in tools/index.ts which imports all tool constructors
// transitively. Mock every external dep that would fail in a test environment.

vi.mock('../../tauri', () => ({
  tauriInvoke: vi.fn().mockResolvedValue(undefined),
  workspaceReadBinary: vi.fn().mockResolvedValue(null),
  tauriInvokeOrThrow: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../store', () => ({
  useAppStore: {
    getState: vi.fn(() => ({
      exaKey: '',
      apiKey: '',
      openRouterModels: [],
      enqueuePendingToolApproval: vi.fn(),
    })),
  },
}))

vi.mock('../workspace/WorkspaceManager', () => ({
  workspaceManager: {
    readFile: vi.fn().mockResolvedValue(''),
    writeFile: vi.fn().mockResolvedValue(undefined),
    listFiles: vi.fn().mockResolvedValue([]),
    deleteFile: vi.fn().mockResolvedValue(undefined),
    getWorkspaceSync: vi.fn(() => new Map()),
    getWorkspacePath: vi.fn().mockResolvedValue('/tmp/test'),
    init: vi.fn().mockResolvedValue(undefined),
    ensureLoaded: vi.fn().mockResolvedValue(undefined),
    initialized: true,
  },
  getWorkspace: vi.fn().mockResolvedValue(new Map()),
  clearWorkspace: vi.fn().mockResolvedValue(undefined),
  copyWorkspace: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../memory', () => ({
  memoryStore: {
    store: vi.fn().mockResolvedValue(undefined),
    retrieveContext: vi.fn().mockResolvedValue({ memories: [], context: null }),
  },
  initMemoryStore: vi.fn().mockResolvedValue(undefined),
  storeTaskCompletion: vi.fn().mockResolvedValue(undefined),
  loadUserPreferences: vi.fn().mockResolvedValue(null),
  saveUserPreferences: vi.fn().mockResolvedValue(undefined),
  updatePreference: vi.fn().mockResolvedValue(undefined),
  buildPreferencesSummary: vi.fn(() => ''),
  extractPreferencesFromText: vi.fn(() => []),
}))

vi.mock('../memory/SqliteMemoryStore', () => ({
  memoryStore: {
    store: vi.fn().mockResolvedValue(undefined),
    retrieveContext: vi.fn().mockResolvedValue({ memories: [], context: null }),
  },
  initMemoryStore: vi.fn().mockResolvedValue(undefined),
  storeTaskCompletion: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../memory/userPreferences', () => ({
  loadUserPreferences: vi.fn().mockResolvedValue(null),
  saveUserPreferences: vi.fn().mockResolvedValue(undefined),
  updatePreference: vi.fn().mockResolvedValue(undefined),
  buildPreferencesSummary: vi.fn(() => ''),
  extractPreferencesFromText: vi.fn(() => []),
}))

vi.mock('../browserBridge', () => ({
  browserEval: vi.fn().mockResolvedValue({ result: null }),
  browserNavigate: vi.fn().mockResolvedValue(undefined),
  browserClick: vi.fn().mockResolvedValue(undefined),
  browserType: vi.fn().mockResolvedValue(undefined),
  browserExtract: vi.fn().mockResolvedValue(''),
  browserScreenshot: vi.fn().mockResolvedValue(''),
  browserScroll: vi.fn().mockResolvedValue(undefined),
  browserWaitFor: vi.fn().mockResolvedValue(undefined),
  browserAriaSnapshot: vi.fn().mockResolvedValue(''),
  browserReadPage: vi.fn().mockResolvedValue(''),
  browserGetTabs: vi.fn().mockResolvedValue([]),
  browserSelect: vi.fn().mockResolvedValue(undefined),
  browserAct: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../sandboxRuntime', () => ({
  executeBash: vi.fn().mockResolvedValue({ output: '', isError: false }),
  executePython: vi.fn().mockResolvedValue({ output: '', isError: false }),
}))

vi.mock('../search', () => ({
  runSearch: vi.fn().mockResolvedValue([]),
  createSearchConfig: vi.fn(),
}))

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('../core/PermissionSystem', () => ({
  permissionSystem: {
    checkPermission: vi.fn(),
  },
}))

vi.mock('../FileParser', () => ({
  isSupportedBinaryFormat: vi.fn(() => false),
  parseFileBuffer: vi.fn(),
}))

// ── Imports (after mocks are set up) ─────────────────────────────────────────

import { executeTool, resetBashCallCount, toolRegistry } from './index'
import { permissionSystem } from '../core/PermissionSystem'

// ── Permission gate tests (Fix C1 + C2) ──────────────────────────────────────

describe('executeTool — permission gate (Fix C1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('skips permission check when tool has requiresPermission = false', async () => {
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: false,
      execute: vi.fn().mockResolvedValue({ output: 'ok', error: null }),
      name: 'read_file',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: false,
      worksInBrowser: true,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    vi.spyOn(toolRegistry, 'execute').mockResolvedValue({ output: 'content', error: null })

    await executeTool('read_file', { path: 'file.txt' }, { taskId: 'task-1' })

    expect(permissionSystem.checkPermission).not.toHaveBeenCalled()
  })

  it('skips permission check when no taskId is provided', async () => {
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: true,
      execute: vi.fn().mockResolvedValue({ output: 'ok', error: null }),
      name: 'browser_eval',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: false,
      worksInBrowser: true,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    vi.spyOn(toolRegistry, 'execute').mockResolvedValue({ output: 'result', error: null })

    await executeTool('browser_eval', { expression: 'document.title' })
    // No taskId → no permission check
    expect(permissionSystem.checkPermission).not.toHaveBeenCalled()
  })

  it('calls permissionSystem.checkPermission when requiresPermission = true and taskId present', async () => {
    vi.mocked(permissionSystem.checkPermission).mockResolvedValue({ approved: true })
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: true,
      execute: vi.fn().mockResolvedValue({ output: 'ok', error: null }),
      name: 'bash_execute',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: true,
      worksInBrowser: false,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    vi.spyOn(toolRegistry, 'execute').mockResolvedValue({ output: 'stdout', error: null })

    await executeTool('bash_execute', { command: 'ls' }, { taskId: 'task-1' })

    expect(permissionSystem.checkPermission).toHaveBeenCalledWith(
      'bash_execute',
      { command: 'ls' },
      'task-1',
      undefined, // no signal
    )
  })

  it('passes signal to checkPermission when provided', async () => {
    vi.mocked(permissionSystem.checkPermission).mockResolvedValue({ approved: true })
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: true,
      execute: vi.fn().mockResolvedValue({ output: 'ok', error: null }),
      name: 'bash_execute',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: true,
      worksInBrowser: false,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    vi.spyOn(toolRegistry, 'execute').mockResolvedValue({ output: 'ok', error: null })

    const signal = new AbortController().signal
    await executeTool('bash_execute', { command: 'ls' }, { taskId: 'task-1', signal })

    expect(permissionSystem.checkPermission).toHaveBeenCalledWith(
      'bash_execute',
      { command: 'ls' },
      'task-1',
      signal,
    )
  })

  it('returns isError: true with denial message when permission is denied', async () => {
    vi.mocked(permissionSystem.checkPermission).mockResolvedValue({
      approved: false,
      reason: 'User denied access',
    })
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: true,
      execute: vi.fn(),
      name: 'bash_execute',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: true,
      worksInBrowser: false,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    const executeSpy = vi.spyOn(toolRegistry, 'execute')

    const result = await executeTool('bash_execute', { command: 'ls' }, { taskId: 'task-1' })

    expect(result.isError).toBe(true)
    expect(result.output).toContain('User denied access')
    // toolRegistry.execute must NOT be called when permission is denied
    expect(executeSpy).not.toHaveBeenCalled()
  })

  it('returns fallback denial message when reason is undefined', async () => {
    vi.mocked(permissionSystem.checkPermission).mockResolvedValue({ approved: false })
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: true,
      execute: vi.fn(),
      name: 'browser_eval',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: false,
      worksInBrowser: true,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    vi.spyOn(toolRegistry, 'execute')

    const result = await executeTool('browser_eval', { expression: 'x' }, { taskId: 'task-1' })

    expect(result.isError).toBe(true)
    expect(result.output).toMatch(/permission denied/i)
  })

  it('proceeds to toolRegistry.execute when permission is approved', async () => {
    vi.mocked(permissionSystem.checkPermission).mockResolvedValue({ approved: true })
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: true,
      execute: vi.fn(),
      name: 'bash_execute',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: true,
      worksInBrowser: false,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    const executeSpy = vi.spyOn(toolRegistry, 'execute').mockResolvedValue({ output: 'done', error: null })

    const result = await executeTool('bash_execute', { command: 'echo hi' }, { taskId: 'task-1' })

    expect(executeSpy).toHaveBeenCalledOnce()
    expect(result.isError).toBe(false)
    expect(result.output).toBe('done')
  })
})

// ── Bash call cap tests (Fix C3) ──────────────────────────────────────────────

describe('executeTool — bash call cap (Fix C3)', () => {
  const TASK = 'task-cap-test'
  const OTHER_TASK = 'task-cap-other'
  const BASH_NAMES = ['bash', 'bash_execute'] as const

  beforeEach(() => {
    vi.clearAllMocks()
    resetBashCallCount(TASK)
    resetBashCallCount(OTHER_TASK)
    // No permission check needed — bash_execute requires permission but
    // the cap fires independently. Use 'bash' (requiresPermission = false by default).
    vi.spyOn(toolRegistry, 'get').mockReturnValue({
      requiresPermission: false,
      execute: vi.fn(),
      name: 'bash',
      description: '',
      parameters: { type: 'object', properties: {}, required: [] },
      requiresSandbox: false,
      worksInBrowser: true,
      timeout: 30_000,
      toFunctionDefinition: vi.fn(),
    })
    vi.spyOn(toolRegistry, 'execute').mockResolvedValue({ output: 'ok', error: null })
  })

  it('allows the first 50 calls for a given task', async () => {
    for (let i = 0; i < 50; i++) {
      const result = await executeTool('bash', { command: 'ls' }, { taskId: TASK })
      expect(result.isError).toBe(false)
    }
  })

  it('blocks the 51st call and returns isError: true', async () => {
    for (let i = 0; i < 50; i++) {
      await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    }
    const result = await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    expect(result.isError).toBe(true)
    expect(result.output).toMatch(/bash cap reached/i)
  })

  it('cap message includes the call count and limit', async () => {
    for (let i = 0; i < 51; i++) {
      await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    }
    const result = await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    expect(result.output).toContain('50')
  })

  it('counters are independent per task', async () => {
    for (let i = 0; i < 50; i++) {
      await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    }
    // OTHER_TASK should still have its full quota
    const result = await executeTool('bash', { command: 'ls' }, { taskId: OTHER_TASK })
    expect(result.isError).toBe(false)
  })

  it('applies the cap to both "bash" and "bash_execute"', async () => {
    // Fill up using bash_execute calls
    for (let i = 0; i < 50; i++) {
      await executeTool('bash_execute', { command: 'ls' }, { taskId: TASK })
    }
    // The cap should fire on the 51st call (for bash_execute)
    const result = await executeTool('bash_execute', { command: 'ls' }, { taskId: TASK })
    expect(result.isError).toBe(true)
    expect(result.output).toMatch(/bash cap reached/i)
  })

  it('resetBashCallCount clears the counter so calls succeed again', async () => {
    for (let i = 0; i < 51; i++) {
      await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    }
    // Verify we're over the cap
    let over = await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    expect(over.isError).toBe(true)

    // Reset
    resetBashCallCount(TASK)

    // Should succeed again
    const result = await executeTool('bash', { command: 'ls' }, { taskId: TASK })
    expect(result.isError).toBe(false)
  })

  it('does not cap when no taskId is provided', async () => {
    // Without a taskId, counting is skipped entirely
    for (let i = 0; i < 55; i++) {
      const result = await executeTool('bash', { command: 'ls' })
      expect(result.isError).toBe(false)
    }
  })

  for (const bashName of BASH_NAMES) {
    it(`applies cap to tool name: "${bashName}"`, async () => {
      resetBashCallCount(TASK)
      for (let i = 0; i < 50; i++) {
        await executeTool(bashName, { command: 'ls' }, { taskId: TASK })
      }
      const result = await executeTool(bashName, { command: 'ls' }, { taskId: TASK })
      expect(result.isError).toBe(true)
    })
  }
})
