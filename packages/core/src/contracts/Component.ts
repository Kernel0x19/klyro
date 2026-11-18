/**
 * Klyro — Component Contract
 *
 * Defines the schema for Integrated Circuits (ICs), gate definitions,
 * pin configurations, logic families, and active component instances.
 */

import type { Signal } from './Signal'

/** Supported primitive logic gate types */
export type GateType =
  | 'AND'
  | 'OR'
  | 'NOT'
  | 'NAND'
  | 'NOR'
  | 'XOR'
  | 'XNOR'
  | 'BUFFER'

/** Functional role of a single physical package pin */
export type PinFunction =
  | 'input'
  | 'output'
  | 'clock'
  | 'vcc'
  | 'gnd'
  | 'nc' // no connect

/** Physical dual-in-line IC package format */
export type PackageType = 'DIP14' | 'DIP16' | 'DIP20'

/** Logic family technology */
export type LogicFamily = 'TTL' | 'LSTTL' | 'HCMOS'

/**
 * Metadata and electrical properties of a single IC pin.
 */
export interface PinDefinition {
  /** 1-based physical pin number on the package */
  number: number
  /** Standard pin label (e.g. "1A", "VCC", "CLK") */
  label: string
  /** Functional classification */
  function: PinFunction
  /** Active voltage level: 'high' (active-1) or 'low' (active-0, inverted) */
  activeLevel?: 'high' | 'low'
  /** Optional index of the internal gate unit this pin belongs to */
  gateUnit?: number
}

/**
 * Represents an individual gate unit inside a multi-gate IC package
 * (e.g., Gate 1 of a 74LS08 Quad 2-Input AND gate).
 */
export interface GateUnit {
  /** 1-based internal unit index */
  unitId: number
  /** Logic operation performed */
  type: GateType
  /** Physical pin numbers serving as inputs to this gate */
  inputPins: number[]
  /** Physical pin number serving as the output of this gate */
  outputPin: number
  /** Whether the output is internally inverted (e.g., NAND vs AND) */
  invertedOutput?: boolean
}

/** High-level classification of an IC component */
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

/**
 * Static blueprint defining an IC component's behavior, pin layout,
 * and propagation timing.
 */
export interface ComponentDefinition {
  /** Standard industry part number (e.g., "74LS08", "74LS74") */
  partNumber: string
  /** Human-readable component name */
  name: string
  /** Categorization for palette / catalog organization */
  category: ComponentCategory
  /** Physical package form factor */
  packageType: PackageType
  /** Total number of pins on the package */
  totalPins: number
  /** Pin number assigned to Power (VCC) */
  vccPin: number
  /** Pin number assigned to Ground (GND) */
  gndPin: number
  /** Typical gate propagation delay in nanoseconds */
  propagationDelay: number
  /** Logic family standard */
  logicFamily: LogicFamily
  /** Ordered list of pin definitions */
  pins: PinDefinition[]
  /** Internal gate units for sub-gate evaluation */
  internalGates: GateUnit[]
  /** Link to original manufacturer datasheet */
  datasheetUrl?: string
  /** Whether marked as favorite / starred by default */
  starred: boolean
}

/**
 * An instantiated IC placed on the simulation breadboard canvas.
 */
export interface ComponentInstance {
  /** Unique instance identifier (e.g. "ic-chip-1") */
  id: string
  /** Reference to the ComponentDefinition part number */
  definitionId: string
  /** Canvas coordinate position */
  position: { x: number; y: number }
  /** Rotation angle in 90-degree increments */
  rotation: 0 | 90 | 180 | 270
  /** Map of pin number to current digital Signal state */
  pinStates: Record<number, Signal>
}
