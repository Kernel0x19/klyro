import type { SignalState } from '../simulationEngine'
import type { SequentialEvaluatorContext } from './sequential'

function toBool(sig: SignalState, defaultVal?: boolean): boolean | null {
  if (sig === 'HIGH') return true
  if (sig === 'LOW') return false
  if (defaultVal !== undefined) return defaultVal
  return null
}

/**
 * 74LS90: BCD Decade Counter (Divide-by-2 and Divide-by-5)
 *
 * Pins:
 * - CKB:   Pin 1 (Negative edge-triggered divide-by-5 clock)
 * - R0(1): Pin 2 (Active HIGH reset to 0)
 * - R0(2): Pin 3 (Active HIGH reset to 0)
 * - R9(1): Pin 6 (Active HIGH set to 9)
 * - R9(2): Pin 7 (Active HIGH set to 9)
 * - QC:    Pin 8 (Output bit 2)
 * - QB:    Pin 9 (Output bit 1)
 * - QD:    Pin 11 (Output bit 3)
 * - QA:    Pin 12 (Output bit 0, divide-by-2)
 * - CKA:   Pin 14 (Negative edge-triggered divide-by-2 clock)
 */
export function evaluate74LS90(ctx: SequentialEvaluatorContext): void {
  const state = ctx.getChipState()
  let qa = state.qa === true
  let div5 = typeof state.div5 === 'number' ? state.div5 : 0 // 0..4

  const r0_1 = toBool(ctx.getPinSignal(2), false) ?? false
  const r0_2 = toBool(ctx.getPinSignal(3), false) ?? false
  const r9_1 = toBool(ctx.getPinSignal(6), false) ?? false
  const r9_2 = toBool(ctx.getPinSignal(7), false) ?? false

  const isReset9 = r9_1 && r9_2
  const isReset0 = r0_1 && r0_2

  if (isReset9) {
    qa = true  // QA = 1
    div5 = 4   // QB=0, QC=0, QD=1 -> 1001 (BCD 9)
  } else if (isReset0) {
    qa = false
    div5 = 0   // QB=0, QC=0, QD=0 -> 0000 (BCD 0)
  } else {
    // Divide-by-2 section: falling edge on CKA (Pin 14)
    const isCkaFalling = ctx.isClockTriggered(14, 'falling')
    if (isCkaFalling) {
      qa = !qa
    }

    // Divide-by-5 section: falling edge on CKB (Pin 1)
    const isCkbFalling = ctx.isClockTriggered(1, 'falling')
    if (isCkbFalling) {
      div5 = (div5 + 1) % 5
    }
  }

  // BCD divide-by-5 output bit pattern:
  // 0 -> 000 (QD=0, QC=0, QB=0)
  // 1 -> 001 (QD=0, QC=0, QB=1)
  // 2 -> 010 (QD=0, QC=1, QB=0)
  // 3 -> 011 (QD=0, QC=1, QB=1)
  // 4 -> 100 (QD=1, QC=0, QB=0)
  const qb = (div5 & 1) !== 0 && div5 < 4
  const qc = (div5 & 2) !== 0
  const qd = div5 === 4

  ctx.setPinSignal(12, qa ? 'HIGH' : 'LOW') // QA
  ctx.setPinSignal(9, qb ? 'HIGH' : 'LOW')  // QB
  ctx.setPinSignal(8, qc ? 'HIGH' : 'LOW')  // QC
  ctx.setPinSignal(11, qd ? 'HIGH' : 'LOW') // QD

  ctx.setChipState({ ...state, qa, div5 })
}

/**
 * 74LS93: 4-Bit Binary Counter (Divide-by-2 and Divide-by-8)
 *
 * Pins:
 * - CKB:   Pin 1 (Negative edge-triggered divide-by-8 clock)
 * - R0(1): Pin 2 (Active HIGH reset to 0)
 * - R0(2): Pin 3 (Active HIGH reset to 0)
 * - QC:    Pin 8 (Output bit 2)
 * - QB:    Pin 9 (Output bit 1)
 * - QD:    Pin 11 (Output bit 3)
 * - QA:    Pin 12 (Output bit 0, divide-by-2)
 * - CKA:   Pin 14 (Negative edge-triggered divide-by-2 clock)
 */
export function evaluate74LS93(ctx: SequentialEvaluatorContext): void {
  const state = ctx.getChipState()
  let qa = state.qa === true
  let div8 = typeof state.div8 === 'number' ? state.div8 : 0 // 0..7

  const r0_1 = toBool(ctx.getPinSignal(2), false) ?? false
  const r0_2 = toBool(ctx.getPinSignal(3), false) ?? false
  const isReset = r0_1 && r0_2

  if (isReset) {
    qa = false
    div8 = 0
  } else {
    // Divide-by-2: falling edge on CKA (Pin 14)
    const isCkaFalling = ctx.isClockTriggered(14, 'falling')
    if (isCkaFalling) {
      qa = !qa
    }

    // Divide-by-8: falling edge on CKB (Pin 1)
    const isCkbFalling = ctx.isClockTriggered(1, 'falling')
    if (isCkbFalling) {
      div8 = (div8 + 1) & 7
    }
  }

  const qb = (div8 & 1) !== 0
  const qc = (div8 & 2) !== 0
  const qd = (div8 & 4) !== 0

  ctx.setPinSignal(12, qa ? 'HIGH' : 'LOW') // QA
  ctx.setPinSignal(9, qb ? 'HIGH' : 'LOW')  // QB
  ctx.setPinSignal(8, qc ? 'HIGH' : 'LOW')  // QC
  ctx.setPinSignal(11, qd ? 'HIGH' : 'LOW') // QD

  ctx.setChipState({ ...state, qa, div8 })
}

/**
 * 74HC191 & 74LS191: Synchronous 4-Bit Up/Down Counter with Mode / Enable
 *
 * Pins:
 * - B:        Pin 1 (Parallel data input bit 1)
 * - QA:       Pin 2 (Output bit 0)
 * - QB:       Pin 3 (Output bit 1)
 * - QC:       Pin 4 (Output bit 2)
 * - QD:       Pin 5 (Output bit 3)
 * - D/U:      Pin 6 (Direction: LOW = Count UP, HIGH = Count DOWN)
 * - /CTEN:    Pin 7 (Count Enable: Active LOW)
 * - /LOAD:    Pin 9 (Asynchronous Parallel Load: Active LOW)
 * - C:        Pin 10 (Parallel data input bit 2)
 * - D:        Pin 11 (Parallel data input bit 3)
 * - A:        Pin 12 (Parallel data input bit 0)
 * - RCO:      Pin 13 (Ripple Clock Output: Active LOW)
 * - /MAX//MIN: Pin 14 (Terminal count reached: Active HIGH)
 * - CLK:      Pin 15 (Positive edge-triggered)
 */
export function evaluate74x191(ctx: SequentialEvaluatorContext): void {
  const state = ctx.getChipState()
  let count = typeof state.count === 'number' ? state.count : 0 // 0..15

  const load = toBool(ctx.getPinSignal(9), true) ?? true // Active LOW
  const cten = toBool(ctx.getPinSignal(7), true) ?? true // Active LOW
  const downUp = toBool(ctx.getPinSignal(6), false) ?? false // LOW = Up, HIGH = Down
  const currClk = ctx.getPinSignal(15)

  if (!load) {
    // Asynchronous parallel load
    const a = toBool(ctx.getPinSignal(12), false) ?? false
    const b = toBool(ctx.getPinSignal(1), false) ?? false
    const c = toBool(ctx.getPinSignal(10), false) ?? false
    const d = toBool(ctx.getPinSignal(11), false) ?? false
    count = (a ? 1 : 0) | ((b ? 1 : 0) << 1) | ((c ? 1 : 0) << 2) | ((d ? 1 : 0) << 3)
  } else {
    // Synchronous clocking on rising edge
    const isRisingEdge = ctx.isClockTriggered(15, 'rising')
    if (isRisingEdge && !cten) {
      if (downUp) {
        // Count DOWN
        count = (count - 1 + 16) & 15
      } else {
        // Count UP
        count = (count + 1) & 15
      }
    }
  }

  // Max/Min and Ripple Clock Output logic
  // In UP mode (downUp = false), terminal is 15
  // In DOWN mode (downUp = true), terminal is 0
  const isTerminal = downUp ? count === 0 : count === 15
  const maxMin = isTerminal
  // RCO is active LOW pulse when terminal is reached, counting is enabled, and CLK is LOW
  const rco = !(isTerminal && !cten && currClk === 'LOW')

  // Set Outputs
  ctx.setPinSignal(2, (count & 1) !== 0 ? 'HIGH' : 'LOW')  // QA
  ctx.setPinSignal(3, (count & 2) !== 0 ? 'HIGH' : 'LOW')  // QB
  ctx.setPinSignal(4, (count & 4) !== 0 ? 'HIGH' : 'LOW')  // QC
  ctx.setPinSignal(5, (count & 8) !== 0 ? 'HIGH' : 'LOW')  // QD
  ctx.setPinSignal(14, maxMin ? 'HIGH' : 'LOW')            // /MAX//MIN
  ctx.setPinSignal(13, rco ? 'HIGH' : 'LOW')               // RCO

  ctx.setChipState({ ...state, count })
}

