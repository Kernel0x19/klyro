// Klyro — Circuit Contract

import type { Signal } from './Signal'
import type { ComponentInstance } from './Component'

export type CircuitType = 'combinational' | 'sequential' | 'fsm' | 'pld'

export interface PinRef {
  componentId: string
  pinNumber: number
}

export interface WireSegment {
  x1: number
  y1: number
  x2: number
  y2: number
}

export interface Wire {
  id: string
  segments: WireSegment[]
  sourcePin: PinRef
  targetPins: PinRef[]
  signalHistory: Signal[] // populated during simulation
}

export interface Port {
  id: string
  label: string
  direction: 'in' | 'out' | 'inout'
  position: { x: number; y: number }
  connectedWireId: string | null
}

export interface Annotation {
  id: string
  text: string
  position: { x: number; y: number }
  color?: string
}

export interface Circuit {
  id: string
  name: string
  type: CircuitType
  components: ComponentInstance[]
  wires: Wire[]
  ports: Port[]
  annotations: Annotation[]
  createdAt: string
  modifiedAt: string
}

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

export interface SimulationConfig {
  defaultGateDelay: number
  clockFrequency: number
  logicFamily: 'TTL' | 'LSTTL' | 'HCMOS'
}

export interface Project {
  meta: ProjectMeta
  circuits: Circuit[]
  simConfig: SimulationConfig
}
