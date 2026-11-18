/**
 * Klyro — Event Types
 *
 * Exhaustive catalog of all inter-module message schemas emitted through
 * the central EventBus.
 */

import type { Signal } from '../contracts/Signal'
import type { Wire } from '../contracts/Circuit'
import type { ComponentInstance } from '../contracts/Component'

/**
 * Registry of all bus event names and their corresponding payload shapes.
 */
export interface KlyroBusEvents {
  // ── Circuit Graph Events ────────────────────────────────────────────────
  /** Dispatched when a new IC component is placed on the canvas */
  'circuit:component-added': { component: ComponentInstance }
  /** Dispatched when an IC component is removed from the canvas */
  'circuit:component-removed': { componentId: string }
  /** Dispatched when a connection wire is routed between two pins */
  'circuit:wire-added': { wire: Wire }
  /** Dispatched when a wire is deleted */
  'circuit:wire-removed': { wireId: string }
  /** Dispatched when the canvas is cleared */
  'circuit:cleared': undefined

  // ── Simulation Engine Events ─────────────────────────────────────────────
  /** Simulation execution started / resumed */
  'sim:started': undefined
  /** Simulation paused by user or breakpoint */
  'sim:paused': undefined
  /** Simulation terminated and reset */
  'sim:stopped': undefined
  /** Net voltage / digital logic level changed on a wire */
  'sim:signal-changed': { wireId: string; signal: Signal }
  /** Simulation time stepped by one tick */
  'sim:tick': { timestamp: number }
  /** Timing constraint violation (setup or hold time breached) */
  'sim:violation': { type: 'setup' | 'hold'; componentId: string }

  // ── Clock Generator Events ───────────────────────────────────────────────
  /** Low-to-High positive transition on main master clock */
  'clock:edge-rising': { timestamp: number }
  /** High-to-Low negative transition on main master clock */
  'clock:edge-falling': { timestamp: number }
  /** Master clock frequency reconfigured */
  'clock:frequency-changed': { frequency: number }

  // ── Interactive User Inputs ──────────────────────────────────────────────
  /** Interactive toggle switch / button state changed on input panel */
  'input:pin-changed': { pinIndex: number; value: 0 | 1 }

  // ── Project Persistence Events ───────────────────────────────────────────
  /** Project successfully written to local or cloud store */
  'project:saved': { projectId: string }
  /** Project opened and loaded into active memory */
  'project:loaded': { projectId: string }

  // ── K-Map & Solver Events ────────────────────────────────────────────────
  /** Boolean optimization completed with minimal Sum-of-Products and Product-of-Sums */
  'kmap:solved': { minimalSOP: string; minimalPOS: string }

  // ── HDL Code Generation Events ───────────────────────────────────────────
  /** Circuit exported to hardware description language */
  'hdl:export-requested': { circuitId: string; language: 'vhdl' | 'verilog' }
}

/** Union of all valid event names */
export type BusEventName = keyof KlyroBusEvents

/** Resolves the payload type for a specific event name */
export type BusEventPayload<T extends BusEventName> = KlyroBusEvents[T]
