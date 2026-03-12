import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

import {
  approveSubtask,
  rejectSubtask,
  resumeTask,
  listWorkspace,
  getArtifact,
  deleteWorkspace,
  pollStatus,
} from './sidecarClient'

// ---------------------------------------------------------------------------
// Stub fetch globally
// ---------------------------------------------------------------------------

const mockFetch = vi.hoisted(() => vi.fn())
vi.stubGlobal('fetch', mockFetch)

function mockOkJson(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  }
}

function mockError(status: number, text: string) {
  return {
    ok: false,
    status,
    json: () => Promise.reject(new Error('not json')),
    text: () => Promise.resolve(text),
  }
}

beforeEach(() => {
  mockFetch.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// HITL: approveSubtask
// ---------------------------------------------------------------------------

describe('approveSubtask', () => {
  it('POSTs to /task/{jobId}/approve with correct body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkJson({ job_id: 'j1', subtask_id: 's1', decision: 'approved' }),
    )

    await approveSubtask('j1', 's1')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:4751/task/j1/approve')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ subtask_id: 's1' })
  })

  it('returns ApprovalResponse', async () => {
    const expected = { job_id: 'j1', subtask_id: 's1', decision: 'approved' as const }
    mockFetch.mockResolvedValueOnce(mockOkJson(expected))

    const result = await approveSubtask('j1', 's1')
    expect(result).toEqual(expected)
  })
})

// ---------------------------------------------------------------------------
// HITL: rejectSubtask
// ---------------------------------------------------------------------------

describe('rejectSubtask', () => {
  it('POSTs to /task/{jobId}/reject with correct body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkJson({ job_id: 'j2', subtask_id: 's2', decision: 'rejected' }),
    )

    await rejectSubtask('j2', 's2')

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:4751/task/j2/reject')
    expect(init.method).toBe('POST')
    expect(JSON.parse(init.body as string)).toEqual({ subtask_id: 's2' })
  })

  it('returns ApprovalResponse with rejected decision', async () => {
    const expected = { job_id: 'j2', subtask_id: 's2', decision: 'rejected' as const }
    mockFetch.mockResolvedValueOnce(mockOkJson(expected))

    const result = await rejectSubtask('j2', 's2')
    expect(result.decision).toBe('rejected')
  })
})

// ---------------------------------------------------------------------------
// HITL: resumeTask
// ---------------------------------------------------------------------------

describe('resumeTask', () => {
  it('POSTs to /task/{jobId}/resume with no body', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkJson({ job_id: 'resume_abc123', status: 'PENDING', resumed_from: 'j1' }),
    )

    await resumeTask('j1')

    expect(mockFetch).toHaveBeenCalledOnce()
    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('http://127.0.0.1:4751/task/j1/resume')
    expect(init.method).toBe('POST')
  })

  it('returns TaskResponse with new job_id', async () => {
    const expected = {
      job_id: 'resume_abc123',
      status: 'PENDING' as const,
      module_id: 'M00',
      created_at: '2026-01-01T00:00:00Z',
    }
    mockFetch.mockResolvedValueOnce(mockOkJson(expected))

    const result = await resumeTask('j1')
    expect(result.job_id).toBe('resume_abc123')
  })

  it('throws on 404 (no checkpoint for job)', async () => {
    mockFetch.mockResolvedValueOnce(mockError(404, 'No checkpoint found for job_id'))
    await expect(resumeTask('ghost_job')).rejects.toThrow('404')
  })
})

// ---------------------------------------------------------------------------
// Workspace: listWorkspace
// ---------------------------------------------------------------------------

describe('listWorkspace', () => {
  it('GETs correct URL', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkJson({ session_id: 'sess1', files: [], count: 0 }),
    )

    await listWorkspace('sess1')

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe('http://127.0.0.1:4751/workspace/sess1')
  })

  it('returns WorkspaceListResponse', async () => {
    const payload = {
      session_id: 'sess1',
      files: [{ name: 's1.json', size: 42, created_at: '2026-01-01T00:00:00Z' }],
      count: 1,
    }
    mockFetch.mockResolvedValueOnce(mockOkJson(payload))

    const result = await listWorkspace('sess1')
    expect(result.count).toBe(1)
    expect(result.files[0].name).toBe('s1.json')
  })
})

// ---------------------------------------------------------------------------
// Workspace: getArtifact
// ---------------------------------------------------------------------------

describe('getArtifact', () => {
  it('GETs correct URL', async () => {
    mockFetch.mockResolvedValueOnce(mockOkJson({ content: 'hello' }))

    await getArtifact('sess1', 's1.json')

    const [url] = mockFetch.mock.calls[0] as [string]
    expect(url).toBe('http://127.0.0.1:4751/workspace/sess1/s1.json')
  })
})

// ---------------------------------------------------------------------------
// Workspace: deleteWorkspace
// ---------------------------------------------------------------------------

describe('deleteWorkspace', () => {
  it('sends DELETE method', async () => {
    mockFetch.mockResolvedValueOnce(
      mockOkJson({ session_id: 'sess1', deleted_count: 3 }),
    )

    await deleteWorkspace('sess1')

    const [, init] = mockFetch.mock.calls[0] as [string, RequestInit]
    expect(init.method).toBe('DELETE')
  })
})

// ---------------------------------------------------------------------------
// Error handling: sidecarFetch throws on non-ok response
// ---------------------------------------------------------------------------

describe('sidecarFetch error handling', () => {
  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce(mockError(404, 'not found'))

    await expect(pollStatus('missing-job')).rejects.toThrow('404')
  })
})
