import type { SignalState } from '../simulationEngine'
import type { SequentialEvaluatorContext } from './sequential'

function toBool(sig: SignalState, defaultVal?: boolean): boolean | null {
  if (sig === 'HIGH') return true
  if (sig === 'LOW') return false
  if (defaultVal !== undefined) return defaultVal
  return null
}

/**
 * 74HC194 / 74LS194: 4-Bit Bidirectional Universal Shift Register
 *
 * Supports SISO, SIPO, PISO, PIPO, Hold, and Clear.
 *
 * Pins:
 * - /CLR: Pin 1 (Active LOW asynchronous master reset)
 * - SR:   Pin 2 (Shift-right serial data input)
 * - A:    Pin 3 (Parallel input A)
 * - B:    Pin 4 (Parallel input B)
 * - C:    Pin 5 (Parallel input C)
 * - D:    Pin 6 (Parallel input D)
 * - SL:   Pin 7 (Shift-left serial data input)
 * - S0:   Pin 9 (Mode control 0)
 * - S1:   Pin 10 (Mode control 1)
 * - CLK:  Pin 11 (Positive edge-triggered clock)
 * - QD:   Pin 12 (Parallel output D / shift-right serial output)
 * - QC:   Pin 13 (Parallel output C)
 * - QB:   Pin 14 (Parallel output B)
 * - QA:   Pin 15 (Parallel output A / shift-left serial output)
 */
export function evaluate74x194(ctx: SequentialEvaluatorContext): void {
  const state = ctx.getChipState()
  let qa = state.qa ?? false
  let qb = state.qb ?? false
  let qc = state.qc ?? false
  let qd = state.qd ?? false

  const clr = toBool(ctx.getPinSignal(1), true) ?? true // Active LOW

  if (!clr) {
    // Asynchronous Master Reset: overrides clock
    qa = false
    qb = false
    qc = false
    qd = false
  } else {
    // Synchronous clocking on rising edge
    const isRisingEdge = ctx.isClockTriggered(11, 'rising')

    if (isRisingEdge) {
      const s0 = toBool(ctx.getPinSignal(9), false) ?? false
      const s1 = toBool(ctx.getPinSignal(10), false) ?? false

      if (!s1 && !s0) {
        // Mode 0: Hold (no change)
      } else if (!s1 && s0) {
        // Mode 1: Shift Right (towards QD)
        // QA gets SR, QB gets QA, QC gets QB, QD gets QC
        const sr = toBool(ctx.getPinSignal(2), false) ?? false
        qd = qc
        qc = qb
        qb = qa
        qa = sr
      } else if (s1 && !s0) {
        // Mode 2: Shift Left (towards QA)
        // QD gets SL, QC gets QD, QB gets QC, QA gets QB
        const sl = toBool(ctx.getPinSignal(7), false) ?? false
        qa = qb
        qb = qc
        qc = qd
        qd = sl
      } else if (s1 && s0) {
        // Mode 3: Parallel Load
        qa = toBool(ctx.getPinSignal(3), false) ?? false
        qb = toBool(ctx.getPinSignal(4), false) ?? false
        qc = toBool(ctx.getPinSignal(5), false) ?? false
        qd = toBool(ctx.getPinSignal(6), false) ?? false
      }
    }
  }

  // Set parallel outputs
  ctx.setPinSignal(15, qa ? 'HIGH' : 'LOW') // QA
  ctx.setPinSignal(14, qb ? 'HIGH' : 'LOW') // QB
  ctx.setPinSignal(13, qc ? 'HIGH' : 'LOW') // QC
  ctx.setPinSignal(12, qd ? 'HIGH' : 'LOW') // QD

  ctx.setChipState({ ...state, qa, qb, qc, qd })
}
