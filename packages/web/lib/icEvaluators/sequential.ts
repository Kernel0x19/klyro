import type { SignalState, ChipState } from '../simulationEngine'

export interface SequentialEvaluatorContext {
  getPinSignal: (pinNumber: number) => SignalState
  getPrevPinSignal: (pinNumber: number) => SignalState
  setPinSignal: (pinNumber: number, state: SignalState) => void
  getChipState: () => ChipState
  setChipState: (state: ChipState) => void
  isClockTriggered: (pinNumber: number, edge: 'rising' | 'falling') => boolean
}

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
 * - 1/CLR: Pin 1 (Active LOW)
 * - 1D:    Pin 2
 * - 1CLK:  Pin 3 (Positive edge-triggered)
 * - 1/PRE: Pin 4 (Active LOW)
 * - 1Q:    Pin 5
 * - 1/Q:   Pin 6
 *
 * Unit 2:
 * - 2/Q:   Pin 8
 * - 2Q:    Pin 9
 * - 2/PRE: Pin 10 (Active LOW)
 * - 2CLK:  Pin 11 (Positive edge-triggered)
 * - 2D:    Pin 12
 * - 2/CLR: Pin 13 (Active LOW)
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

  // Asynchronous inputs take precedence
  if (!pre && clr) {
    return { q: 'HIGH', qBar: 'LOW', nextStoredQ: true }
  }
  if (pre && !clr) {
    return { q: 'LOW', qBar: 'HIGH', nextStoredQ: false }
  }
  if (!pre && !clr) {
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
 * - 1CLK:  Pin 1 (Negative edge-triggered)
 * - 1/PRE: Pin 2 (Active LOW)
 * - 1/CLR: Pin 3 (Active LOW)
 * - 1J:    Pin 4
 * - 1/Q:   Pin 14
 * - 1Q:    Pin 15
 * - 1K:    Pin 16
 *
 * Unit 2:
 * - 2CLK:  Pin 6 (Negative edge-triggered)
 * - 2/PRE: Pin 7 (Active LOW)
 * - 2/CLR: Pin 8 (Active LOW)
 * - 2J:    Pin 9
 * - 2K:    Pin 10
 * - 2Q:    Pin 11
 * - 2/Q:   Pin 12
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
      // Hold
    } else if (!j && k) {
      currentQ = false // Reset
    } else if (j && !k) {
      currentQ = true  // Set
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

