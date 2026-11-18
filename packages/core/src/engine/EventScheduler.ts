/**
 * Klyro — Event Scheduler
 *
 * Discrete-event simulation scheduler driven by a time-ordered priority queue.
 * Models propagation delays, wire transitions, and gate switching in simulated
 * nanoseconds.
 */

import type { Signal } from '../contracts/Signal'

/** Maximum steps runToStable will execute before halting to avoid infinite oscillation */
const DEFAULT_MAX_STABLE_STEPS = 50000

/**
 * A scheduled discrete simulation event representing a logic transition
 * targeted at a specific wire or component pin at a future timestamp.
 */
export interface SimEvent {
  /** Target identifier (wire ID or "componentId:pinNumber") */
  targetId: string
  /** New signal state arriving at the target */
  signal: Signal
  /** Absolute simulation timestamp in nanoseconds when this event occurs */
  scheduledAt: number
}

/** Callback triggered when a discrete simulation event fires */
type EventHandler = (event: SimEvent) => void

/**
 * Priority queue based discrete-event simulation scheduler.
 */
export class EventScheduler {
  private queue: SimEvent[] = []
  private currentTime = 0
  private running = false
  private handler: EventHandler | null = null

  /**
   * Registers the event dispatch callback invoked whenever an event is popped.
   *
   * @param handler Callback to receive dispatched events
   */
  setHandler(handler: EventHandler): void {
    this.handler = handler
  }

  /**
   * Enqueues a future simulation event. The queue is maintained in ascending
   * order of scheduled timestamp.
   *
   * @param event The simulation event to schedule
   */
  schedule(event: SimEvent): void {
    this.queue.push(event)
    this.queue.sort((a, b) => a.scheduledAt - b.scheduledAt)
  }

  /**
   * Steps the simulation forward by processing the earliest scheduled event.
   * Advances current simulation time to that event's timestamp.
   *
   * @returns `true` if an event was processed; `false` if the queue is empty
   */
  step(): boolean {
    if (this.queue.length === 0) return false

    const event = this.queue.shift()!
    this.currentTime = event.scheduledAt

    if (this.handler) {
      this.handler(event)
    }

    return true
  }

  /**
   * Runs the scheduler repeatedly until all queued events are processed or
   * until `maxSteps` is reached (guarding against infinite ring oscillator loops).
   *
   * @param maxSteps Maximum iteration limit (defaults to 50,000)
   */
  runToStable(maxSteps = DEFAULT_MAX_STABLE_STEPS): void {
    this.running = true
    let steps = 0
    while (this.queue.length > 0 && this.running && steps < maxSteps) {
      this.step()
      steps++
    }
  }

  /**
   * Pauses an active simulation run.
   */
  pause(): void {
    this.running = false
  }

  /**
   * Clears the event queue and resets simulation clock to 0 nanoseconds.
   */
  reset(): void {
    this.queue = []
    this.currentTime = 0
    this.running = false
  }

  /**
   * Returns the current simulation time in nanoseconds.
   */
  getCurrentTime(): number {
    return this.currentTime
  }

  /**
   * Returns the number of events currently awaiting processing in the priority queue.
   */
  getQueueLength(): number {
    return this.queue.length
  }
}
