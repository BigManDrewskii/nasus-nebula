import { describe, it, expect, vi } from 'vitest'
import { PermissionSystem } from './PermissionSystem'

// Mock the global state and event dispatchers
const mockEnqueue = vi.fn()

vi.mock('../../store', () => ({
  useAppStore: {
    getState: () => ({
      enqueuePendingToolApproval: mockEnqueue,
    }),
  },
}))
const realDispatchEvent = window.dispatchEvent.bind(window)
window.dispatchEvent = vi.fn()

describe('PermissionSystem', () => {
  const ps = new PermissionSystem()

  it('should auto-approve allowed tools', async () => {
    const result = await ps.checkPermission('read_file', {}, 'task-1')
    expect(result.approved).toBe(true)
  })

  it('should deny denied tools', async () => {
    // @ts-expect-error - modifying private state for test
    ps.state.toolLevels['read_file'] = 'deny'
    const result = await ps.checkPermission('read_file', {}, 'task-1')
    expect(result.approved).toBe(false)
    expect(result.reason).toBe('Permission denied for tool: read_file')
    // @ts-expect-error - reset state
    ps.state.toolLevels['read_file'] = 'allow'
  })

  it('should auto-approve safe bash commands when enabled', async () => {
    // Set bash to 'allow' so safe-command auto-approval logic is exercised
    // @ts-expect-error - modifying private state for test
    ps.state.toolLevels['bash'] = 'allow'
    const result = await ps.checkPermission('bash', { command: 'ls -la' }, 'task-1')
    expect(result.approved).toBe(true)
    // @ts-expect-error - reset state
    ps.state.toolLevels['bash'] = 'ask'
  })

  it('should request approval for dangerous bash commands', async () => {
    // @ts-expect-error - modifying private state for test
    ps.state.toolLevels['bash'] = 'allow'
    // @ts-expect-error - private method
    const requestApprovalSpy = vi.spyOn(ps, 'requestApproval').mockResolvedValue({ approved: false })
    await ps.checkPermission('bash', { command: 'rm -rf /' }, 'task-1')
    expect(requestApprovalSpy).toHaveBeenCalledWith(
      'bash',
      { command: 'rm -rf /' },
      'task-1',
      'Dangerous command detected',
      undefined
    )
    requestApprovalSpy.mockRestore()
    // @ts-expect-error - reset state
    ps.state.toolLevels['bash'] = 'ask'
  })

  it('should request approval for non-safe, non-dangerous bash commands', async () => {
    // @ts-expect-error - modifying private state for test
    ps.state.toolLevels['bash'] = 'allow'
    // @ts-expect-error - private method
    const requestApprovalSpy = vi.spyOn(ps, 'requestApproval').mockResolvedValue({ approved: false })
    await ps.checkPermission('bash', { command: 'my-custom-script.sh' }, 'task-1')
    expect(requestApprovalSpy).toHaveBeenCalledWith(
      'bash',
      { command: 'my-custom-script.sh' },
      'task-1',
      'Bash execution requires confirmation',
      undefined
    )
    requestApprovalSpy.mockRestore()
    // @ts-expect-error - reset state
    ps.state.toolLevels['bash'] = 'ask'
  })

  it('concurrent requests with different tools both resolve independently via requestId', async () => {
    mockEnqueue.mockClear()

    const ps2 = new PermissionSystem()
    // Use an unknown tool so defaultLevel='ask' routes both through requestApproval
    const p1 = ps2.checkPermission('unknown-tool-a', {}, 'task-concurrent')
    const p2 = ps2.checkPermission('unknown-tool-b', {}, 'task-concurrent')

    // Both approval requests should be enqueued
    await vi.waitFor(() => expect(mockEnqueue).toHaveBeenCalledTimes(2))

    const req1 = mockEnqueue.mock.calls[0][0] as { requestId: string }
    const req2 = mockEnqueue.mock.calls[1][0] as { requestId: string }
    expect(req1.requestId).not.toBe(req2.requestId)

    // Approve both via requestId — use EventTarget prototype to bypass the
    // vi.fn() mock on window.dispatchEvent so real listeners are notified.
    realDispatchEvent(new CustomEvent('nasus:tool-approved-task-concurrent', { detail: { requestId: req2.requestId } }))
    realDispatchEvent(new CustomEvent('nasus:tool-approved-task-concurrent', { detail: { requestId: req1.requestId } }))

    const [r1, r2] = await Promise.all([p1, p2])
    expect(r1.approved).toBe(true)
    expect(r2.approved).toBe(true)
  })
})
