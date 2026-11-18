import { describe, it, expect, vi } from 'vitest'
import {
  EventScheduler,
  createSignal,
  HIGH,
  LOW,
  componentRegistry,
  registerAllComponents,
  NetlistCompiler,
  eventBus,
  type Circuit,
} from '../src'

describe('EventScheduler', () => {
  it('schedules events in chronological order', () => {
    const scheduler = new EventScheduler()
    const events: number[] = []
    scheduler.setHandler((e) => {
      events.push(e.scheduledAt)
    })

    scheduler.schedule({ targetId: 'w1', signal: HIGH, scheduledAt: 30 })
    scheduler.schedule({ targetId: 'w2', signal: LOW, scheduledAt: 10 })
    scheduler.schedule({ targetId: 'w3', signal: HIGH, scheduledAt: 20 })

    expect(scheduler.getQueueLength()).toBe(3)

    expect(scheduler.step()).toBe(true)
    expect(scheduler.getCurrentTime()).toBe(10)

    expect(scheduler.step()).toBe(true)
    expect(scheduler.getCurrentTime()).toBe(20)

    expect(scheduler.step()).toBe(true)
    expect(scheduler.getCurrentTime()).toBe(30)

    expect(scheduler.step()).toBe(false)
    expect(events).toEqual([10, 20, 30])
  })

  it('runs to stable without exceeding maxSteps', () => {
    const scheduler = new EventScheduler()
    let count = 0
    scheduler.setHandler(() => {
      count++
      // Simulate an oscillating feedback loop
      scheduler.schedule({
        targetId: 'osc',
        signal: HIGH,
        scheduledAt: scheduler.getCurrentTime() + 1,
      })
    })

    scheduler.schedule({ targetId: 'osc', signal: LOW, scheduledAt: 0 })
    scheduler.runToStable(100)

    expect(count).toBe(100)
  })

  it('resets correctly', () => {
    const scheduler = new EventScheduler()
    scheduler.schedule({ targetId: 'w1', signal: HIGH, scheduledAt: 10 })
    scheduler.step()
    expect(scheduler.getCurrentTime()).toBe(10)
    scheduler.reset()
    expect(scheduler.getCurrentTime()).toBe(0)
    expect(scheduler.getQueueLength()).toBe(0)
  })
})

describe('ComponentRegistry & BasicGates', () => {
  it('registers and retrieves built-in gates', () => {
    registerAllComponents()
    expect(componentRegistry.isRegistered('74LS00')).toBe(true)
    expect(componentRegistry.isRegistered('74LS08')).toBe(true)
    expect(componentRegistry.isRegistered('74LS32')).toBe(true)

    const def08 = componentRegistry.get('74LS08')
    expect(def08).toBeDefined()
    expect(def08?.vccPin).toBe(14)
    expect(def08?.gndPin).toBe(7)

    const inputs08 = componentRegistry.getInputPins('74LS08')
    expect(inputs08).toEqual([1, 2, 4, 5, 9, 10, 12, 13])

    const outputs08 = componentRegistry.getOutputPins('74LS08')
    expect(outputs08).toEqual([3, 6, 8, 11])
  })
})

describe('NetlistCompiler', () => {
  it('detects short circuits and floating inputs', () => {
    registerAllComponents()
    const compiler = new NetlistCompiler()

    const circuit: Circuit = {
      id: 'c1',
      name: 'Test Circuit',
      type: 'combinational',
      components: [
        {
          id: 'u1',
          definitionId: '74LS08',
          position: { x: 0, y: 0 },
          rotation: 0,
          pinStates: {},
        },
        {
          id: 'u2',
          definitionId: '74LS08',
          position: { x: 100, y: 0 },
          rotation: 0,
          pinStates: {},
        },
      ],
      wires: [
        // Wire connecting two outputs together -> short circuit
        {
          id: 'w1',
          segments: [],
          sourcePin: { componentId: 'u1', pinNumber: 3 },
          targetPins: [{ componentId: 'u2', pinNumber: 3 }],
          signalHistory: [],
        },
      ],
      ports: [],
      annotations: [],
      createdAt: new Date().toISOString(),
      modifiedAt: new Date().toISOString(),
    }

    const netlist = compiler.compile(circuit)
    expect(netlist.errors.length).toBeGreaterThan(0)
    expect(netlist.errors[0]?.type).toBe('short-circuit')

    // Floating inputs should be detected
    expect(netlist.warnings.some((w) => w.type === 'floating-input')).toBe(true)
  })
})

describe('EventBus', () => {
  it('publishes and receives typed events', () => {
    const handler = vi.fn()
    const unsubscribe = eventBus.subscribe('simulation:started', handler)

    eventBus.publish('simulation:started', undefined)
    expect(handler).toHaveBeenCalledTimes(1)

    unsubscribe()
    eventBus.publish('simulation:started', undefined)
    expect(handler).toHaveBeenCalledTimes(1)
  })
})
