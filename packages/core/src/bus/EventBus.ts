// Klyro — Event Bus
// Typed inter-module communication

import type {
  BusEventName,
  BusEventPayload,
  KlyroBusEvents,
} from './EventTypes'

type EventHandler<T extends BusEventName> = (payload: KlyroBusEvents[T]) => void

type HandlerMap = {
  [K in BusEventName]?: Set<EventHandler<K>>
}

class KlyroEventBus {
  private handlers: HandlerMap = {}

  subscribe<T extends BusEventName>(
    event: T,
    handler: EventHandler<T>
  ): () => void {
    if (!this.handlers[event]) {
      this.handlers[event] = new Set() as HandlerMap[T]
    }

    const set = this.handlers[event] as Set<EventHandler<T>>
    set.add(handler)

    // Returns unsubscribe function
    return () => {
      set.delete(handler)
    }
  }

  publish<T extends BusEventName>(event: T, payload: BusEventPayload<T>): void {
    const set = this.handlers[event] as Set<EventHandler<T>> | undefined

    if (!set) return

    set.forEach((handler) => {
      try {
        handler(payload)
      } catch (err) {
        console.error(`[KlyroEventBus] Error in handler for "${event}":`, err)
      }
    })
  }

  unsubscribeAll(event: BusEventName): void {
    delete this.handlers[event]
  }

  clear(): void {
    this.handlers = {}
  }
}

// Singleton instance shared across all modules
export const eventBus: KlyroEventBus = new KlyroEventBus()
export type { KlyroEventBus }
