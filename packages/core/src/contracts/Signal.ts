/**
 * Klyro — Signal Contract
 *
 * Implements a 4-value logic model based on IEEE 1164 standards:
 * - `0`: Logic LOW (ground / 0V)
 * - `1`: Logic HIGH (VCC / 5V)
 * - `'X'`: Unknown / Uninitialized / Contention
 * - `'Z'`: High Impedance (tri-state floating)
 *
 * Also models drive strength and nanosecond simulation timestamps.
 */

/** 4-value logic state according to IEEE 1164 */
export type LogicValue = 0 | 1 | 'X' | 'Z'

/** Drive strength of a digital signal */
export type SignalStrength = 'strong' | 'weak' | 'highZ'

/**
 * Represents a digital signal with a logic state, driving strength,
 * and the simulation tick timestamp at which it was set.
 */
export interface Signal {
  /** Current logic state */
  value: LogicValue
  /** Output drive capability */
  strength: SignalStrength
  /** Simulation timestamp in nanoseconds */
  timestamp: number
}

/**
 * Creates a new Signal object.
 *
 * @param value The 4-value logic state (0, 1, 'X', 'Z')
 * @param timestamp Simulation tick time in nanoseconds (defaults to 0)
 * @param strength Drive strength (defaults to 'strong')
 * @returns A frozen or plain Signal instance
 */
export const createSignal = (
  value: LogicValue,
  timestamp = 0,
  strength: SignalStrength = 'strong'
): Signal => ({ value, strength, timestamp })

/** Standard strong logic HIGH (1) */
export const HIGH: Signal = createSignal(1)

/** Standard strong logic LOW (0) */
export const LOW: Signal = createSignal(0)

/** Unknown / uninitialized signal state ('X') */
export const UNKNOWN: Signal = createSignal('X')

/** High impedance / floating signal state ('Z') */
export const HIGH_Z: Signal = createSignal('Z', 0, 'highZ')

/** Checks if a signal is strong/valid logic HIGH (1) */
export const isLogicHigh = (s: Signal): boolean => s.value === 1

/** Checks if a signal is strong/valid logic LOW (0) */
export const isLogicLow = (s: Signal): boolean => s.value === 0

/** Checks if a signal is in an unknown or uninitialized state ('X') */
export const isUnknown = (s: Signal): boolean => s.value === 'X'

/** Checks if a signal is in high impedance / tri-state floating ('Z') */
export const isHighZ = (s: Signal): boolean => s.value === 'Z'

