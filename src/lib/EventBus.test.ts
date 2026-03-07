import { describe, it, expect, vi } from 'vitest'
import { agentEvents } from './EventBus'

describe('EventBus', () => {
  it('should register and emit an event', () => {
    const handler = vi.fn()
    agentEvents.on('agent:start', handler)
    agentEvents.emit('agent:start', { taskId: '123' })
    expect(handler).toHaveBeenCalledWith({ taskId: '123' })
    expect(handler).toHaveBeenCalledTimes(1)
  })

  it('should allow multiple handlers for the same event', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    agentEvents.on('agent:stop', handler1)
    agentEvents.on('agent:stop', handler2)
    agentEvents.emit('agent:stop', { taskId: '456' })
    expect(handler1).toHaveBeenCalledWith({ taskId: '456' })
    expect(handler2).toHaveBeenCalledWith({ taskId: '456' })
  })

  it('should unsubscribe a handler correctly', () => {
    const handler = vi.fn()
    const unsubscribe = agentEvents.on('agent:tool:start', handler)
    unsubscribe()
    agentEvents.emit('agent:tool:start', { taskId: '789', tool: 'test', input: {} })
    expect(handler).not.toHaveBeenCalled()
  })

  it('should handle events with no listeners', () => {
    // This should not throw an error
    agentEvents.emit('non-existent-event', { data: 'test' })
  })

  it('should clear all listeners for a specific event', () => {
    const handler1 = vi.fn()
    const handler2 = vi.fn()
    agentEvents.on('agent:file:created', handler1)
    agentEvents.on('agent:file:created', handler2)
    agentEvents.clear('agent:file:created')
    agentEvents.emit('agent:file:created', { taskId: 'abc', path: '/test' })
    expect(handler1).not.toHaveBeenCalled()
    expect(handler2).not.toHaveBeenCalled()
  })

  it('should clear all listeners if no event is specified', () => {
    const handler = vi.fn()
    agentEvents.on('agent:streaming:start', handler)
    agentEvents.clear()
    agentEvents.emit('agent:streaming:start', { taskId: 'def' })
    expect(handler).not.toHaveBeenCalled()
  })

  it('should correctly report listener count', () => {
    const handler = vi.fn()
    expect(agentEvents.listenerCount('test-count')).toBe(0)
    const unsubscribe = agentEvents.on('test-count', handler)
    expect(agentEvents.listenerCount('test-count')).toBe(1)
    unsubscribe()
    expect(agentEvents.listenerCount('test-count')).toBe(0)
  })
})
