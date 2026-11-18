/**
 * Klyro — Sequential Logic IC Evaluators
 *
 * Implements digital simulation behavior for bistable multivibrators / flip-flops:
 * - 74LS74: Dual D-Type Positive-Edge-Triggered Flip-Flop with asynchronous Preset & Clear
 * - 74LS76: Dual J-K Flip-Flop with asynchronous Preset & Clear (Negative-Edge Triggered)
 *
 * Priority Rules:
 * 1. Asynchronous active-LOW Preset (/PRE) and Clear (/CLR) take immediate precedence over clock edges.
 * 2. Synchronous clock transitions (rising or falling edge) transfer D or J-K inputs into internal state.
 */

import type { SignalState, ChipState } from '../simulationEngine'

/**
 * Execution context provided by simulationEngine to sequential IC evaluators.
 */
export interface SequentialEvaluatorContext {
  /** Reads current signal state of an IC pin */
  getPinSignal: (pinNumber: number) => SignalState
  /** Reads signal state of an IC pin from the preceding simulation tick */
  getPrevPinSignal: (pinNumber: number) => SignalState
  /** Sets the new signal state on an IC pin */
  setPinSignal: (pinNumber: number, state: SignalState) => void
  /** Retrieves persistent internal state across clock ticks */
  getChipState: () => ChipState
  /** Updates persistent internal state */
  setChipState: (state: ChipState) => void
  /** Detects whether a pin experienced an edge transition in the current tick */
  isClockTriggered: (pinNumber: number, edge: 'rising' | 'falling') => boolean
}

/**
 * Helper: Converts SignalState into a boolean logic value with optional default for floating TTL pins.
 */
function toBool(sig: SignalState, defaultVal?: boolean): boolean | null {
  if (sig === 'HIGH') return true
  if (sig === 'LOW') return false
  if (defaultVal !== undefined) return defaultVal
  return null
}

/**
 * 74LS74: Dual D-Type Positive-Edge-Triggered Flip-Flop with Preset & Clear
 *
 * Unit 1:
 * - 1/CLR: Pin 1 (Active LOW asynchronous reset)
 * - 1D:    Pin 2 (Data input)
 * - 1CLK:  Pin 3 (Positive edge-triggered clock)
 * - 1/PRE: Pin 4 (Active LOW asynchronous set)
 * - 1Q:    Pin 5 (True output)
 * - 1/Q:   Pin 6 (Inverted output)
 *
 * Unit 2:
 * - 2/Q:   Pin 8 (Inverted output)
 * - 2Q:    Pin 9 (True output)
 * - 2/PRE: Pin 10 (Active LOW asynchronous set)
 * - 2CLK:  Pin 11 (Positive edge-triggered clock)
 * - 2D:    Pin 12 (Data input)
 * - 2/CLR: Pin 13 (Active LOW asynchronous reset)
 *
 * Power: Pin 14 (VCC), Pin 7 (GND)
 */
export function evaluate74LS74(ctx: SequentialEvaluatorContext): void {
  const state = ctx.getChipState()
  let q1 = state.q1 === true
  let q2 = state.q2 === true

  // Evaluate Unit 1
  const res1 = evaluate74LS74Unit({
    clrSig: ctx.getPinSignal(1),
    preSig: ctx.getPinSignal(4),
    dSig: ctx.getPinSignal(2),
    isRisingEdge: ctx.isClockTriggered(3, 'rising'),
    storedQ: q1,
  })
  ctx.setPinSignal(5, res1.q)
  ctx.setPinSignal(6, res1.qBar)
  q1 = res1.nextStoredQ

  // Evaluate Unit 2
  const res2 = evaluate74LS74Unit({
    clrSig: ctx.getPinSignal(13),
    preSig: ctx.getPinSignal(10),
    dSig: ctx.getPinSignal(12),
    isRisingEdge: ctx.isClockTriggered(11, 'rising'),
    storedQ: q2,
  })
  ctx.setPinSignal(9, res2.q)
  ctx.setPinSignal(8, res2.qBar)
  q2 = res2.nextStoredQ

  ctx.setChipState({ ...state, q1, q2 })
}

/**
 * Evaluates an isolated 74LS74 D Flip-Flop unit.
 */
function evaluate74LS74Unit({
  clrSig,
  preSig,
  dSig,
  isRisingEdge,
  storedQ,
}: {
  clrSig: SignalState
  preSig: SignalState
  dSig: SignalState
  isRisingEdge: boolean
  storedQ: boolean
}): { q: SignalState; qBar: SignalState; nextStoredQ: boolean } {
  // In TTL logic, unconnected inputs float HIGH (active-low PRE and CLR remain inactive)
  const clr = toBool(clrSig, true) ?? true
  const pre = toBool(preSig, true) ?? true

  // Asynchronous inputs take precedence over clock
  if (!pre && clr) {
    return { q: 'HIGH', qBar: 'LOW', nextStoredQ: true }
  }
  if (pre && !clr) {
    return { q: 'LOW', qBar: 'HIGH', nextStoredQ: false }
  }
  if (!pre && !clr) {
    // Unstable condition in real 74LS74: both Q and /Q are forced HIGH
    return { q: 'HIGH', qBar: 'HIGH', nextStoredQ: true }
  }

  // Synchronous positive-edge triggered
  let currentQ = storedQ
  if (isRisingEdge) {
    const d = toBool(dSig, false) ?? false
    currentQ = d
  }

  return {
    q: currentQ ? 'HIGH' : 'LOW',
    qBar: currentQ ? 'LOW' : 'HIGH',
    nextStoredQ: currentQ,
  }
}

/**
 * 74LS76: Dual J-K Flip-Flop with Preset & Clear (Negative-edge triggered)
 *
 * Unit 1:
 * - 1CLK:  Pin 1 (Negative edge-triggered clock)
 * - 1/PRE: Pin 2 (Active LOW asynchronous set)
 * - 1/CLR: Pin 3 (Active LOW asynchronous reset)
 * - 1J:    Pin 4 (J input)
 * - 1/Q:   Pin 14 (Inverted output)
 * - 1Q:    Pin 15 (True output)
 * - 1K:    Pin 16 (K input)
 *
 * Unit 2:
 * - 2CLK:  Pin 6 (Negative edge-triggered clock)
 * - 2/PRE: Pin 7 (Active LOW asynchronous set)
 * - 2/CLR: Pin 8 (Active LOW asynchronous reset)
 * - 2J:    Pin 9 (J input)
 * - 2K:    Pin 10 (K input)
 * - 2Q:    Pin 11 (True output)
 * - 2/Q:   Pin 12 (Inverted output)
 *
 * Power: Pin 5 (VCC), Pin 13 (GND)
 */
export function evaluate74LS76(ctx: SequentialEvaluatorContext): void {
  const state = ctx.getChipState()
  let q1 = state.q1 === true
  let q2 = state.q2 === true

  // Evaluate Unit 1
  const res1 = evaluate74LS76Unit({
    clrSig: ctx.getPinSignal(3),
    preSig: ctx.getPinSignal(2),
    jSig: ctx.getPinSignal(4),
    kSig: ctx.getPinSignal(16),
    isFallingEdge: ctx.isClockTriggered(1, 'falling'),
    storedQ: q1,
  })
  ctx.setPinSignal(15, res1.q)
  ctx.setPinSignal(14, res1.qBar)
  q1 = res1.nextStoredQ

  // Evaluate Unit 2
  const res2 = evaluate74LS76Unit({
    clrSig: ctx.getPinSignal(8),
    preSig: ctx.getPinSignal(7),
    jSig: ctx.getPinSignal(9),
    kSig: ctx.getPinSignal(10),
    isFallingEdge: ctx.isClockTriggered(6, 'falling'),
    storedQ: q2,
  })
  ctx.setPinSignal(11, res2.q)
  ctx.setPinSignal(12, res2.qBar)
  q2 = res2.nextStoredQ

  ctx.setChipState({ ...state, q1, q2 })
}

/**
 * Evaluates an isolated 74LS76 J-K Flip-Flop unit.
 */
function evaluate74LS76Unit({
  clrSig,
  preSig,
  jSig,
  kSig,
  isFallingEdge,
  storedQ,
}: {
  clrSig: SignalState
  preSig: SignalState
  jSig: SignalState
  kSig: SignalState
  isFallingEdge: boolean
  storedQ: boolean
}): { q: SignalState; qBar: SignalState; nextStoredQ: boolean } {
  const clr = toBool(clrSig, true) ?? true
  const pre = toBool(preSig, true) ?? true

  // Asynchronous controls override clock
  if (!pre && clr) {
    return { q: 'HIGH', qBar: 'LOW', nextStoredQ: true }
  }
  if (pre && !clr) {
    return { q: 'LOW', qBar: 'HIGH', nextStoredQ: false }
  }
  if (!pre && !clr) {
    return { q: 'HIGH', qBar: 'HIGH', nextStoredQ: true }
  }

  // Negative edge-triggered (falling edge: HIGH -> LOW)
  let currentQ = storedQ
  if (isFallingEdge) {
    const j = toBool(jSig, false) ?? false
    const k = toBool(kSig, false) ?? false

    if (!j && !k) {
      // Hold state: currentQ unchanged
    } else if (!j && k) {
      currentQ = false // Reset to 0
    } else if (j && !k) {
      currentQ = true  // Set to 1
    } else if (j && k) {
      currentQ = !currentQ // Toggle
    }
  }

  return {
    q: currentQ ? 'HIGH' : 'LOW',
    qBar: currentQ ? 'LOW' : 'HIGH',
    nextStoredQ: currentQ,
  }
}


