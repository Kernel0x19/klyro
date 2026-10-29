// Klyro — Signal Contract
// 4-value logic model based on IEEE 1164

export type LogicValue = 0 | 1 | 'X' | 'Z'
// 0 = LOW
// 1 = HIGH
// X = Unknown / Uninitialized
// Z = High Impedance (tri-state)

export type SignalStrength = 'strong' | 'weak' | 'highZ'

export interface Signal {
  value: LogicValue
  strength: SignalStrength
  timestamp: number // simulation tick in nanoseconds
}

// Factory helpers
export const createSignal = (
  value: LogicValue,
  timestamp = 0,
  strength: SignalStrength = 'strong'
): Signal => ({ value, strength, timestamp })

export const HIGH: Signal = createSignal(1)
export const LOW: Signal = createSignal(0)
export const UNKNOWN: Signal = createSignal('X')
export const HIGH_Z: Signal = createSignal('Z', 0, 'highZ')

// Utility
export const isLogicHigh = (s: Signal): boolean => s.value === 1
export const isLogicLow = (s: Signal): boolean => s.value === 0
export const isUnknown = (s: Signal): boolean => s.value === 'X'
export const isHighZ = (s: Signal): boolean => s.value === 'Z'
