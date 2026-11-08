import type { SignalState } from '../simulationEngine'

export interface ICEvaluatorContext {
  getPinSignal: (pinNumber: number) => SignalState
  setPinSignal: (pinNumber: number, state: SignalState) => void
}

/**
 * Converts a SignalState to a boolean (HIGH -> true, LOW -> false).
 * Unconnected pins in TTL standard typically float HIGH (pull-up), but for inputs
 * we treat 'unconnected' or 'X' as undefined unless defaulted.
 */
function toBool(sig: SignalState, defaultVal?: boolean): boolean | null {
  if (sig === 'HIGH') return true
  if (sig === 'LOW') return false
  if (defaultVal !== undefined) return defaultVal
  return null
}

function toSignal(boolVal: boolean | null): SignalState {
  if (boolVal === null) return 'X'
  return boolVal ? 'HIGH' : 'LOW'
}

/**
 * 74LS83: 4-Bit Binary Full Adder with Fast Carry
 * A inputs: A1 (P10), A2 (P8), A3 (P3), A4 (P1)
 * B inputs: B1 (P11), B2 (P7), B3 (P4), B4 (P16)
 * Carry In: C0 (P12)
 * Sum outputs: S1 (P9), S2 (P6), S3 (P2), S4 (P14)
 * Carry Out: C4 (P15)
 */
export function evaluate74LS83(ctx: ICEvaluatorContext): void {
  const aPins = [10, 8, 3, 1]
  const bPins = [11, 7, 4, 16]
  const sumPins = [9, 6, 2, 14]
  const c0Pin = 12
  const c4Pin = 15

  // In TTL, unconnected inputs can float HIGH, but let's strictly check valid logic
  const c0Sig = ctx.getPinSignal(c0Pin)
  let carry: boolean | null = toBool(c0Sig, false) // Carry-in defaults to 0 if not connected

  for (let i = 0; i < 4; i++) {
    const aSig = ctx.getPinSignal(aPins[i]!)
    const bSig = ctx.getPinSignal(bPins[i]!)

    const a = toBool(aSig, false)
    const b = toBool(bSig, false)

    if (a === null || b === null || carry === null) {
      ctx.setPinSignal(sumPins[i]!, 'X')
      carry = null
    } else {
      const aVal = a ? 1 : 0
      const bVal = b ? 1 : 0
      const cVal = carry ? 1 : 0
      const sum = aVal + bVal + cVal

      ctx.setPinSignal(sumPins[i]!, sum % 2 === 1 ? 'HIGH' : 'LOW')
      carry = sum >= 2
    }
  }

  ctx.setPinSignal(c4Pin, toSignal(carry))
}

/**
 * 74LS85: 4-Bit Magnitude Comparator
 * Inputs: A0..A3 (P10, P12, P13, P15), B0..B3 (P9, P11, P14, P1)
 * Cascading: IAGTB (P2), IAEQB (P3), IALTB (P4)
 * Outputs: OAGTB (P7), OAEQB (P6), OALTB (P5)
 */
export function evaluate74LS85(ctx: ICEvaluatorContext): void {
  const aPins = [10, 12, 13, 15]
  const bPins = [9, 11, 14, 1]

  let aVal = 0
  let bVal = 0
  let valid = true

  for (let i = 0; i < 4; i++) {
    const a = toBool(ctx.getPinSignal(aPins[i]!), false)
    const b = toBool(ctx.getPinSignal(bPins[i]!), false)
    if (a === null || b === null) {
      valid = false
      break
    }
    if (a) aVal |= 1 << i
    if (b) bVal |= 1 << i
  }

  if (!valid) {
    ctx.setPinSignal(7, 'X')
    ctx.setPinSignal(6, 'X')
    ctx.setPinSignal(5, 'X')
    return
  }

  if (aVal > bVal) {
    ctx.setPinSignal(7, 'HIGH') // A > B
    ctx.setPinSignal(6, 'LOW')  // A = B
    ctx.setPinSignal(5, 'LOW')  // A < B
  } else if (aVal < bVal) {
    ctx.setPinSignal(7, 'LOW')
    ctx.setPinSignal(6, 'LOW')
    ctx.setPinSignal(5, 'HIGH')
  } else {
    // A == B: cascade inputs determine the result
    // Standard 74LS85: IAEQB (P3) is typically HIGH for single chip use
    const iAgtB = toBool(ctx.getPinSignal(2), false) ?? false
    const iAeqB = toBool(ctx.getPinSignal(3), true) ?? true // defaults to true for standalone
    const iAltB = toBool(ctx.getPinSignal(4), false) ?? false

    if (iAeqB) {
      ctx.setPinSignal(7, 'LOW')
      ctx.setPinSignal(6, 'HIGH')
      ctx.setPinSignal(5, 'LOW')
    } else if (iAgtB && !iAltB) {
      ctx.setPinSignal(7, 'HIGH')
      ctx.setPinSignal(6, 'LOW')
      ctx.setPinSignal(5, 'LOW')
    } else if (iAltB && !iAgtB) {
      ctx.setPinSignal(7, 'LOW')
      ctx.setPinSignal(6, 'LOW')
      ctx.setPinSignal(5, 'HIGH')
    } else {
      // Both high or neither high
      ctx.setPinSignal(7, iAgtB ? 'HIGH' : 'LOW')
      ctx.setPinSignal(6, 'LOW')
      ctx.setPinSignal(5, iAltB ? 'HIGH' : 'LOW')
    }
  }
}

/**
 * 74LS138: 3-to-8 Line Decoder / Demultiplexer
 * Select: A (P1), B (P2), C (P3)
 * Enables: G1 (P6, Active HIGH), /G2A (P4, Active LOW), /G2B (P5, Active LOW)
 * Outputs: /Y0../Y7 (P15, P14, P13, P12, P11, P10, P9, P7) - Active LOW
 */
export function evaluate74LS138(ctx: ICEvaluatorContext): void {
  const outPins = [15, 14, 13, 12, 11, 10, 9, 7]

  const g1 = toBool(ctx.getPinSignal(6), false)
  const g2a = toBool(ctx.getPinSignal(4), false)
  const g2b = toBool(ctx.getPinSignal(5), false)

  // Enabled if G1 is HIGH and both /G2A and /G2B are LOW
  const isEnabled = g1 === true && g2a === false && g2b === false

  if (!isEnabled) {
    // When disabled, all active-low outputs are HIGH
    for (const pin of outPins) {
      ctx.setPinSignal(pin, 'HIGH')
    }
    return
  }

  const a = toBool(ctx.getPinSignal(1), false) ?? false
  const b = toBool(ctx.getPinSignal(2), false) ?? false
  const c = toBool(ctx.getPinSignal(3), false) ?? false

  const select = (a ? 1 : 0) | ((b ? 1 : 0) << 1) | ((c ? 1 : 0) << 2)

  for (let i = 0; i < 8; i++) {
    // Active low output: the selected pin is LOW, others are HIGH
    ctx.setPinSignal(outPins[i]!, i === select ? 'LOW' : 'HIGH')
  }
}

/**
 * 74LS139: Dual 2-to-4 Line Demultiplexer
 * Unit 1: Enable 1/E (P1, Active LOW), Select 1A (P2), 1B (P3), Outputs 1/Y0..1/Y3 (P4, P5, P6, P7)
 * Unit 2: Enable 2/E (P15, Active LOW), Select 2A (P14), 2B (P13), Outputs 2/Y0..2/Y3 (P12, P11, P10, P9)
 */
export function evaluate74LS139(ctx: ICEvaluatorContext): void {
  // Unit 1
  const e1 = toBool(ctx.getPinSignal(1), true) // defaults to disabled if floating
  const outPins1 = [4, 5, 6, 7]
  if (e1 === false) {
    const a1 = toBool(ctx.getPinSignal(2), false) ?? false
    const b1 = toBool(ctx.getPinSignal(3), false) ?? false
    const sel1 = (a1 ? 1 : 0) | ((b1 ? 1 : 0) << 1)
    for (let i = 0; i < 4; i++) {
      ctx.setPinSignal(outPins1[i]!, i === sel1 ? 'LOW' : 'HIGH')
    }
  } else {
    for (const pin of outPins1) ctx.setPinSignal(pin, 'HIGH')
  }

  // Unit 2
  const e2 = toBool(ctx.getPinSignal(15), true)
  const outPins2 = [12, 11, 10, 9]
  if (e2 === false) {
    const a2 = toBool(ctx.getPinSignal(14), false) ?? false
    const b2 = toBool(ctx.getPinSignal(13), false) ?? false
    const sel2 = (a2 ? 1 : 0) | ((b2 ? 1 : 0) << 1)
    for (let i = 0; i < 4; i++) {
      ctx.setPinSignal(outPins2[i]!, i === sel2 ? 'LOW' : 'HIGH')
    }
  } else {
    for (const pin of outPins2) ctx.setPinSignal(pin, 'HIGH')
  }
}

/**
 * 74LS151: 8-to-1 Data Selector / Multiplexer
 * Data inputs: D0..D7 (P12, P13, P14, P15, P1, P2, P3, P4)
 * Select: S0 (P11), S1 (P10), S2 (P9)
 * Strobe: /E (P7, Active LOW)
 * Outputs: Y (P5, non-inverted), /Y (P6, inverted)
 */
export function evaluate74LS151(ctx: ICEvaluatorContext): void {
  const dataPins = [12, 13, 14, 15, 1, 2, 3, 4]
  const strobe = toBool(ctx.getPinSignal(7), true) // Active LOW

  if (strobe === true) {
    // Disabled
    ctx.setPinSignal(5, 'LOW')
    ctx.setPinSignal(6, 'HIGH')
    return
  }

  const s0 = toBool(ctx.getPinSignal(11), false) ?? false
  const s1 = toBool(ctx.getPinSignal(10), false) ?? false
  const s2 = toBool(ctx.getPinSignal(9), false) ?? false

  const sel = (s0 ? 1 : 0) | ((s1 ? 1 : 0) << 1) | ((s2 ? 1 : 0) << 2)
  const dataSig = ctx.getPinSignal(dataPins[sel]!)
  const dataBool = toBool(dataSig, false)

  if (dataBool === null) {
    ctx.setPinSignal(5, 'X')
    ctx.setPinSignal(6, 'X')
  } else {
    ctx.setPinSignal(5, dataBool ? 'HIGH' : 'LOW')
    ctx.setPinSignal(6, dataBool ? 'LOW' : 'HIGH')
  }
}

/**
 * 74LS153: Dual 4-to-1 Data Selector / Multiplexer
 * Shared select: S0 (P14), S1 (P2)
 * Unit 1: 1/E (P1, Active LOW), 1C0..1C3 (P6, P5, P4, P3), Output 1Y (P7)
 * Unit 2: 2/E (P15, Active LOW), 2C0..2C3 (P10, P11, P12, P13), Output 2Y (P9)
 */
export function evaluate74LS153(ctx: ICEvaluatorContext): void {
  const s0 = toBool(ctx.getPinSignal(14), false) ?? false
  const s1 = toBool(ctx.getPinSignal(2), false) ?? false
  const sel = (s0 ? 1 : 0) | ((s1 ? 1 : 0) << 1)

  // Unit 1
  const e1 = toBool(ctx.getPinSignal(1), true)
  if (e1 === false) {
    const cPins1 = [6, 5, 4, 3]
    const sig = ctx.getPinSignal(cPins1[sel]!)
    ctx.setPinSignal(7, sig === 'HIGH' ? 'HIGH' : sig === 'LOW' ? 'LOW' : 'X')
  } else {
    ctx.setPinSignal(7, 'LOW')
  }

  // Unit 2
  const e2 = toBool(ctx.getPinSignal(15), true)
  if (e2 === false) {
    const cPins2 = [10, 11, 12, 13]
    const sig = ctx.getPinSignal(cPins2[sel]!)
    ctx.setPinSignal(9, sig === 'HIGH' ? 'HIGH' : sig === 'LOW' ? 'LOW' : 'X')
  } else {
    ctx.setPinSignal(9, 'LOW')
  }
}

