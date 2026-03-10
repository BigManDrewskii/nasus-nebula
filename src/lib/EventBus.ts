/**
 * Type-safe event bus for agent communication
 */

import { createLogger } from './logger'

const log = createLogger('EventBus')

type EventHandler<T = unknown> = (data: T) => void;

interface EventBusEvents {
  "agent:start": { taskId: string };
  "agent:stop": { taskId: string };
  "agent:tool:start": { taskId: string; tool: string; input: unknown };
  "agent:tool:complete": { taskId: string; tool: string; output: unknown; isError?: boolean };
  "agent:file:created": { taskId: string; path: string };
  "agent:file:modified": { taskId: string; path: string };
  "agent:streaming:start": { taskId: string };
  "agent:streaming:chunk": { taskId: string; delta: string };
  "agent:streaming:stop": { taskId: string };
}

type EventName = keyof EventBusEvents;

class EventBus {
  private listeners: Map<string, Set<EventHandler>> = new Map();

  /**
   * Register an event listener
   * @param event - Event name to listen for
   * @param handler - Callback function to execute when event is emitted
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => this.off(event, handler);
  }

  /**
   * Emit an event to all registered listeners
   * @param event - Event name to emit
   * @param data - Optional data to pass to listeners
   */
  emit<T = unknown>(event: string, data?: T): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
            log.error(`Error in event handler for "${event}"`, error instanceof Error ? error : new Error(String(error)));
        }
      });
    }
  }

  /**
   * Remove a specific event listener
   * @param event - Event name
   * @param handler - Handler function to remove
   */
  off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      // Clean up empty sets
      if (handlers.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if no event specified
   * @param event - Optional event name to clear
   */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the number of listeners for an event
   * @param event - Event name
   * @returns Number of registered listeners
   */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}

/**
 * Singleton instance for agent-related events
 */
export const agentEvents = new EventBus();

/**
 * Type-safe event names and payloads for agent events
 */
export type AgentEvents = EventBusEvents;
export type AgentEventName = EventName;
