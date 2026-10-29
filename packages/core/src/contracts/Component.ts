// Klyro — Component Contract

import type { Signal } from './Signal'

export type GateType =
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'

export type PinFunction =
  | 'input'
  | 'output'
  | 'clock'
  | 'vcc'
  | 'gnd'
  | 'nc'         // no connect

export type PackageType = 'DIP14' | 'DIP16' | 'DIP20'

export type LogicFamily = 'TTL' | 'LSTTL' | 'HCMOS'

export interface PinDefinition {
  number: number
  label: string
  function: PinFunction
  activeLevel?: 'high' | 'low'
  gateUnit?: number
}

export interface GateUnit {
  unitId: number
  type: GateType
  inputPins: number[]
  outputPin: number
  invertedOutput?: boolean
}

export interface ComponentDefinition {
  partNumber: string
  name: string
  category: ComponentCategory
  packageType: PackageType
  totalPins: number
  vccPin: number
  gndPin: number
  propagationDelay: number     // nanoseconds
  logicFamily: LogicFamily
  pins: PinDefinition[]
  internalGates: GateUnit[]
  datasheetUrl?: string
  starred: boolean
}

export type ComponentCategory =
  | 'basic-gate'
  | 'flip-flop'
  | 'counter'
  | 'register'
  | 'decoder'
  | 'encoder'
  | 'multiplexer'
  | 'adder'
  | 'comparator'

export interface ComponentInstance {
  id: string
  definitionId: string
  position: { x: number; y: number }
  rotation: 0 | 90 | 180 | 270
  pinStates: Record<number, Signal>
}