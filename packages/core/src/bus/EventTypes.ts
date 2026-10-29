// Klyro — Event Types
// All inter-module events in one place

import type { Signal } from '../contracts/Signal'
import type { Circuit, Wire } from '../contracts/Circuit'
import type { ComponentInstance } from '../contracts/Component'

export interface KlyroBusEvents {
  // Circuit events
  'circuit:component-added': { component: ComponentInstance }
  'circuit:component-removed': { componentId: string }
  'circuit:wire-added': { wire: Wire }
  'circuit:wire-removed': { wireId: string }
  'circuit:cleared': undefined

  // Simulation events
  'sim:started': undefined
  'sim:paused': undefined
  'sim:stopped': undefined
  'sim:signal-changed': { wireId: string; signal: Signal }
  'sim:tick': { timestamp: number }
  'sim:violation': { type: 'setup' | 'hold'; componentId: string }

  // Clock events
  'clock:edge-rising': { timestamp: number }
  'clock:edge-falling': { timestamp: number }
  'clock:frequency-changed': { frequency: number }

  // Input events
  'input:pin-changed': { pinIndex: number; value: 0 | 1 }

  // Project events
  'project:saved': { projectId: string }
  'project:loaded': { projectId: string }

  // KMap events
  'kmap:solved': { minimalSOP: string; minimalPOS: string }

  // HDL events
  'hdl:export-requested': { circuitId: string; language: 'vhdl' | 'verilog' }
}

export type BusEventName = keyof KlyroBusEvents
export type BusEventPayload<T extends BusEventName> = KlyroBusEvents[T]