/**
 * Klyro — Circuit Contract
 *
 * Defines the circuit graph data structure, wire connections, ports,
 * netlist references, and project persistence metadata.
 */

import type { Signal } from './Signal'
import type { ComponentInstance } from './Component'

/** Functional domain classification of a circuit */
export type CircuitType = 'combinational' | 'sequential' | 'fsm' | 'pld'

/**
 * References a specific pin on an active component instance.
 */
export interface PinRef {
  /** Identifier of the component instance */
  componentId: string
  /** 1-based pin index on that component */
  pinNumber: number
}

/**
 * Orthogonal line segment of a routed wire on the canvas.
 */
export interface WireSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

/**
 * A connection wire linking an output source pin to one or more input target pins.
 */
export interface Wire {
  /** Unique wire identifier */
  id: string
  /** Geometric routing segments for rendering */
  segments: WireSegment[]
  /** Origin driving pin */
  sourcePin: PinRef
  /** Destination pins receiving the signal */
  targetPins: PinRef[]
  /** Historical signal transitions during simulation (for timing analysis) */
  signalHistory: Signal[]
}

/**
 * External interface port for hierarchical or modular circuit design.
 */
export interface Port {
  id: string
  label: string
  direction: 'in' | 'out' | 'inout'
  position: { x: number; y: number }
  connectedWireId: string | null
}

/**
 * Text or graphical sticky note placed on the circuit canvas.
 */
export interface Annotation {
  id: string
  text: string
  position: { x: number; y: number }
  color?: string
}

/**
 * A complete circuit schematic containing components, wires, and metadata.
 */
export interface Circuit {
  /** Unique circuit ID */
  id: string
  /** Human-readable circuit title */
  name: string
  /** Circuit classification */
  type: CircuitType
  /** All IC instances placed in this circuit */
  components: ComponentInstance[]
  /** Interconnecting wires */
  wires: Wire[]
  /** Boundary I/O ports */
  ports: Port[]
  /** Canvas annotations */
  annotations: Annotation[]
  /** ISO timestamp of creation */
  createdAt: string
  /** ISO timestamp of last update */
  modifiedAt: string
}

/**
 * Project-level metadata stored in database or exported project bundle.
 */
export interface ProjectMeta {
  id: string
  name: string
  author: string
  description?: string
  tags: string[]
  createdAt: string
  modifiedAt: string
  appVersion: string
  formatVersion: string
}

/**
 * Global engine simulation parameters.
 */
export interface SimulationConfig {
  /** Default propagation delay applied to idealized gates (ns) */
  defaultGateDelay: number
  /** Virtual clock frequency in Hertz */
  clockFrequency: number
  /** Electrical standard */
  logicFamily: 'TTL' | 'LSTTL' | 'HCMOS'
}

/**
 * Top-level container representing an entire saved project workbook.
 */
export interface Project {
  meta: ProjectMeta
  circuits: Circuit[]
  simConfig: SimulationConfig
}

