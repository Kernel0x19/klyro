// Klyro — Event Scheduler
// Priority queue based event-driven simulation scheduler

import type { Signal } from '../contracts/Signal'

export interface SimEvent {
  targetId: string        // wire or component pin id
  signal: Signal
  scheduledAt: number     // nanoseconds
}

type EventHandler = (event: SimEvent) => void

export class EventScheduler {
  private queue: SimEvent[] = []
  private currentTime = 0
  private running = false
  private handler: EventHandler | null = null

  setHandler(handler: EventHandler): void {
    this.handler = handler
  }

  schedule(event: SimEvent): void {
    this.queue.push(event)
    this.queue.sort((a, b) => a.scheduledAt - b.scheduledAt)
  }

  step(): boolean {
    if (this.queue.length === 0) return false

    const event = this.queue.shift()!
    this.currentTime = event.scheduledAt

    if (this.handler) {
      this.handler(event)
    }

    return true
  }

  runToStable(): void {
    this.running = true
    while (this.queue.length > 0 && this.running) {
      this.step()
    }
  }

  pause(): void {
    this.running = false
  }

  reset(): void {
    this.queue = []
    this.currentTime = 0
    this.running = false
  }

  getCurrentTime(): number {
    return this.currentTime
  }

  getQueueLength(): number {
    return this.queue.length
  }
}