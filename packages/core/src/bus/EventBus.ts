/**
 * Klyro — Event Bus
 *
 * Provides a strongly-typed, publish/subscribe message broker for decoupled
 * inter-module communication across the digital simulation engine, clock generator,
 * netlist compiler, and UI state managers.
 */

import type {
  BusEventName,
  BusEventPayload,
  KlyroBusEvents,
} from './EventTypes'

/** Callback signature for a typed event listener */
type EventHandler<T extends BusEventName> = (payload: KlyroBusEvents[T]) => void

/** Internal mapping storing registered listeners per event name */
type HandlerMap = {
  [K in BusEventName]?: Set<EventHandler<K>>
}

/**
 * High-performance, fault-tolerant typed event broker.
 */
class KlyroEventBus {
  private handlers: HandlerMap = {}

  /**
   * Subscribes a listener to a specific event topic.
   *
   * @param event The event name to observe
   * @param handler Function invoked when the event is emitted
   * @returns Unsubscribe closure that cleans up the registration
   */
  subscribe<T extends BusEventName>(
    event: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = new Set() as HandlerMap[T]
    }

    const set = this.handlers[event] as Set<EventHandler<T>>
    set.add(handler)

    // Return a self-cleanup function
    return () => {
      set.delete(handler)
    }
  }

  /**
   * Broadcasts an event payload to all currently subscribed listeners.
   * Exceptions in individual handlers are safely caught and logged so
   * other subscribers are not interrupted.
   *
   * @param event The event topic to emit
   * @param payload Typed payload data matching the event definition
   */
  publish<T extends BusEventName>(event: T, payload: BusEventPayload<T>): void {
    const set = this.handlers[event] as Set<EventHandler<T>> | undefined

    if (!set || set.size === 0) return

    set.forEach((handler) => {
      try {
        handler(payload)
      } catch (err) {
        console.error(`[KlyroEventBus] Error in handler for "${event}":`, err)
      }
    })
  }

  /**
   * Clears all registered handlers for a specific event topic.
   *
   * @param event The event topic to unsubscribe
   */
  unsubscribeAll(event: BusEventName): void {
    delete this.handlers[event]
  }

  /**
   * Clears all listeners across all events. Useful between test runs or full reset.
   */
  clear(): void {
    this.handlers = {}
  }
}

/**
 * Singleton instance shared across all engine and UI modules.
 */
export const eventBus: KlyroEventBus = new KlyroEventBus()
export type { KlyroEventBus }

