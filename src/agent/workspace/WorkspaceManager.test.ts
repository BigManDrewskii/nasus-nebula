import { describe, it, expect, vi, beforeEach } from 'vitest'

// ---------------------------------------------------------------------------
// Mock Tauri IPC and logger — WorkspaceManager calls these for all I/O
// vi.mock is hoisted so we use vi.hoisted() to create the ref first.
// ---------------------------------------------------------------------------

const mockTauriInvoke = vi.hoisted(() => vi.fn())

vi.mock('../../tauri', () => ({
  tauriInvoke: mockTauriInvoke,
  workspaceReadBinary: vi.fn(),
}))

vi.mock('../../lib/logger', () => ({
  createLogger: () => ({ info: vi.fn(), warn: vi.fn(), error: vi.fn() }),
}))

vi.mock('../FileParser', () => ({
  isSupportedBinaryFormat: () => false,
  parseFileBuffer: vi.fn(),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

import { WorkspaceManager, slugify } from './WorkspaceManager'

// ---------------------------------------------------------------------------
// slugify
// ---------------------------------------------------------------------------

describe('slugify', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world')
  })

  it('strips special characters', () => {
    expect(slugify('My Task (2024)!')).toBe('my-task-2024')
  })

  it('truncates to 30 characters', () => {
    const long = 'this is a very long title that exceeds thirty characters'
    expect(slugify(long).length).toBeLessThanOrEqual(30)
  })

  it('handles empty string', () => {
    expect(slugify('')).toBe('')
  })
})

// ---------------------------------------------------------------------------
// In-memory cache operations (no Tauri I/O)
// ---------------------------------------------------------------------------

describe('WorkspaceManager in-memory cache', () => {
  let manager: WorkspaceManager

  beforeEach(() => {
    manager = new WorkspaceManager()
    vi.clearAllMocks()
  })

  it('getWorkspaceSync creates empty map on first call', () => {
    const ws = manager.getWorkspaceSync('task-1')
    expect(ws).toBeInstanceOf(Map)
    expect(ws.size).toBe(0)
  })

  it('getVersion returns 0 for unknown task', () => {
    expect(manager.getVersion('unknown')).toBe(0)
  })

  it('getVersion increments after writeFile', async () => {
    mockTauriInvoke.mockResolvedValue(undefined)

    await manager.init('/tmp/test-workspace')
    await manager.writeFile('task-1', 'file.txt', 'hello')

    expect(manager.getVersion('task-1')).toBe(1)
  })

  it('writeFile updates contentCache', async () => {
    mockTauriInvoke.mockResolvedValue(undefined)
    await manager.init('/tmp/test-workspace')

    await manager.writeFile('task-2', 'notes.md', '# Hello')
    const ws = manager.getWorkspaceSync('task-2')

    expect(ws.get('notes.md')).toBe('# Hello')
  })

  it('deleteFile removes entry from contentCache', async () => {
    mockTauriInvoke.mockResolvedValue(undefined)
    await manager.init('/tmp/test-workspace')

    await manager.writeFile('task-3', 'remove.txt', 'remove me')
    expect(manager.getWorkspaceSync('task-3').has('remove.txt')).toBe(true)

    await manager.deleteFile('task-3', 'remove.txt')
    expect(manager.getWorkspaceSync('task-3').has('remove.txt')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Path traversal guard
// ---------------------------------------------------------------------------

describe('WorkspaceManager.writeFile path traversal guard', () => {
  it('throws on paths containing ..', async () => {
    const manager = new WorkspaceManager()
    await manager.init('/tmp/test-workspace')

    await expect(
      manager.writeFile('task-1', '../escape/secret.txt', 'bad')
    ).rejects.toThrow('Path traversal detected')
  })

  it('allows normal relative paths', async () => {
    mockTauriInvoke.mockResolvedValue(undefined)
    const manager = new WorkspaceManager()
    await manager.init('/tmp/test-workspace')

    await expect(
      manager.writeFile('task-1', 'subdir/file.txt', 'ok')
    ).resolves.not.toThrow()
  })
})

// ---------------------------------------------------------------------------
// undoFile
// ---------------------------------------------------------------------------

describe('WorkspaceManager.undoFile', () => {
  it('returns null when no history exists', async () => {
    mockTauriInvoke.mockResolvedValue(undefined)
    const manager = new WorkspaceManager()
    await manager.init('/tmp/test-workspace')

    const result = await manager.undoFile('task-1', 'file.txt')
    expect(result).toBeNull()
  })

  it('restores previous version', async () => {
    mockTauriInvoke.mockResolvedValue(undefined)
    const manager = new WorkspaceManager()
    await manager.init('/tmp/test-workspace')

    await manager.writeFile('task-1', 'f.txt', 'v1')
    await manager.writeFile('task-1', 'f.txt', 'v2')

    const restored = await manager.undoFile('task-1', 'f.txt')
    expect(restored).toBe('v1')
    expect(manager.getWorkspaceSync('task-1').get('f.txt')).toBe('v1')
  })
})
