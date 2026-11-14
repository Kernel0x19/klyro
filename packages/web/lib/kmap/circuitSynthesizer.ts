import type { Edge } from '@xyflow/react'
import { getNetColor } from '@/components/editor/canvas/SignalEdge'

export interface SynthesizedSlot {
  slotId: string
  partNumber: string
}

export interface SynthesisResult {
  success: boolean
  error?: string
  slots: SynthesizedSlot[]
  edges: Edge[]
}

interface Endpoint {
  nodeId: string
  handleId: string
}

interface ParsedLiteral {
  varName: string
  inverted: boolean
  varIndex: number
}

interface ParsedTerm {
  raw: string
  literals: ParsedLiteral[]
}

let edgeCounter = 0
function createEdge(source: Endpoint, target: Endpoint): Edge {
  edgeCounter++
  const id = `edge-synth-${edgeCounter}-${source.nodeId}-${source.handleId}-${target.nodeId}-${target.handleId}`
  return {
    id,
    type: 'signal',
    source: source.nodeId,
    sourceHandle: source.handleId,
    target: target.nodeId,
    targetHandle: target.handleId,
    data: {
      color: getNetColor(source.nodeId, source.handleId),
      signalState: 'unconnected',
    },
  }
}

/**
 * Parses a minimal SOP expression like "A'B + BC'D" into structured terms and literals.
 */
function parseSOP(sop: string, varNames: string[]): ParsedTerm[] {
  const clean = sop.trim()
  if (!clean || clean === '0' || clean === '1') return []

  const termStrings = clean.split(/\s*\+\s*/)
  const result: ParsedTerm[] = []

  for (const rawTerm of termStrings) {
    if (!rawTerm) continue
    const literals: ParsedLiteral[] = []
    const regex = /([A-Za-z]+)('?)/g
    let match: RegExpExecArray | null

    while ((match = regex.exec(rawTerm)) !== null) {
      const varName = match[1] ?? ''
      const inverted = match[2] === "'"
      let varIndex = varNames.indexOf(varName)
      if (varIndex === -1) {
        varIndex = varName.toUpperCase().charCodeAt(0) - 65
      }
      literals.push({
        varName,
        inverted,
        varIndex: Math.max(0, varIndex),
      })
    }

    if (literals.length > 0) {
      result.push({ raw: rawTerm, literals })
    }
  }

  return result
}

// ── Pin definitions for DIP14 logic chips ───────────────────────────────────

// 74LS04 Hex Inverter (6 gates)
const INVERTER_GATES = [
  { in: 1, out: 2 },
  { in: 3, out: 4 },
  { in: 5, out: 6 },
  { in: 9, out: 8 },
  { in: 11, out: 10 },
  { in: 13, out: 12 },
]

// 74LS08 Quad 2-Input AND (4 gates)
const AND2_GATES = [
  { in1: 1, in2: 2, out: 3 },
  { in1: 4, in2: 5, out: 6 },
  { in1: 9, in2: 10, out: 8 },
  { in1: 12, in2: 13, out: 11 },
]

// 74LS11 Triple 3-Input AND (3 gates)
const AND3_GATES = [
  { in1: 1, in2: 2, in3: 13, out: 12 },
  { in1: 3, in2: 4, in3: 5, out: 6 },
  { in1: 9, in2: 10, in3: 11, out: 8 },
]

// 74LS21 Dual 4-Input AND (2 gates)
const AND4_GATES = [
  { in1: 1, in2: 2, in3: 4, in4: 5, out: 6 },
  { in1: 9, in2: 10, in3: 12, in4: 13, out: 8 },
]

// 74LS32 Quad 2-Input OR (4 gates)
const OR2_GATES = [
  { in1: 1, in2: 2, out: 3 },
  { in1: 4, in2: 5, out: 6 },
  { in1: 9, in2: 10, out: 8 },
  { in1: 12, in2: 13, out: 11 },
]

/**
 * Synthesizes an SOP expression into gate IC slot assignments and wires.
 * Places chips into available board slots (slot-1 through slot-5) and wires:
 *   Input Panel -> Inverters -> AND Gates -> OR Gates -> Output Panel (pin-0)
 */
export function synthesizeCircuitFromSOP(
  sop: string,
  varNames: string[] = ['A', 'B', 'C', 'D']
): SynthesisResult {
  const edges: Edge[] = []
  const slots: SynthesizedSlot[] = []
  edgeCounter = 0

  const clean = sop.trim()

  // Constant 0: Connect ground to output pin-0
  if (clean === '0' || !clean) {
    edges.push(
      createEdge(
        { nodeId: 'main-input-clock-panel', handleId: 'input-gnd' },
        { nodeId: 'main-output-panel', handleId: 'pin-0' }
      )
    )
    return { success: true, slots, edges }
  }

  // Constant 1: Connect VCC to output pin-0
  if (clean === '1') {
    edges.push(
      createEdge(
        { nodeId: 'main-output-panel', handleId: 'pin-VCC' },
        { nodeId: 'main-output-panel', handleId: 'pin-0' }
      )
    )
    return { success: true, slots, edges }
  }

  const terms = parseSOP(clean, varNames)
  if (terms.length === 0) {
    return {
      success: false,
      error: 'Unable to parse SOP expression for circuit synthesis.',
      slots: [],
      edges: [],
    }
  }

  let nextSlotIndex = 1
  const allocateSlot = (partNumber: string): { slotId: string; nodeId: string } | null => {
    if (nextSlotIndex > 5) return null
    const slotId = `slot-${nextSlotIndex}`
    const nodeId = `ic-chip-${nextSlotIndex}`
    slots.push({ slotId, partNumber })
    nextSlotIndex++
    return { slotId, nodeId }
  }

  // ── Step 1: Inverters for complemented variables ─────────────────────────
  const invertedVarIndices = new Set<number>()
  for (const term of terms) {
    for (const lit of term.literals) {
      if (lit.inverted) {
        invertedVarIndices.add(lit.varIndex)
      }
    }
  }

  // Map of inverted varIndex -> Endpoint
  const invertedEndpoints = new Map<number, Endpoint>()

  if (invertedVarIndices.size > 0) {
    if (invertedVarIndices.size > INVERTER_GATES.length) {
      return {
        success: false,
        error: `Expression requires ${invertedVarIndices.size} inverters, exceeding single 74LS04 capacity.`,
        slots: [],
        edges: [],
      }
    }

    const inverterSlot = allocateSlot('74LS04')
    if (!inverterSlot) {
      return {
        success: false,
        error: 'Not enough IC slots available on the board (maximum 5 slots).',
        slots: [],
        edges: [],
      }
    }

    let gateIdx = 0
    for (const varIdx of Array.from(invertedVarIndices).sort((a, b) => a - b)) {
      const gate = INVERTER_GATES[gateIdx++]!
      const inputEndpoint: Endpoint = {
        nodeId: 'main-input-clock-panel',
        handleId: `input-${varIdx}`,
      }
      const gateIn: Endpoint = {
        nodeId: inverterSlot.nodeId,
        handleId: `pin-${gate.in}`,
      }
      const gateOut: Endpoint = {
        nodeId: inverterSlot.nodeId,
        handleId: `pin-${gate.out}`,
      }

      edges.push(createEdge(inputEndpoint, gateIn))
      invertedEndpoints.set(varIdx, gateOut)
    }
  }

  // Helper to get signal source endpoint for a literal
  const getLiteralEndpoint = (lit: ParsedLiteral): Endpoint => {
    if (lit.inverted) {
      return invertedEndpoints.get(lit.varIndex)!
    }
    return {
      nodeId: 'main-input-clock-panel',
      handleId: `input-${lit.varIndex}`,
    }
  }

  // ── Step 2: Synthesize AND gates for each product term ───────────────────
  const termOutputs: Endpoint[] = []

  // Group terms by literal count to optimize chip usage
  // First, terms with 1 literal need no AND gate
  const complexTerms = terms.map((t, originalIndex) => ({
    term: t,
    originalIndex,
  }))

  // Track AND chips
  interface ChipTracker<T> {
    nodeId: string
    gates: T[]
    used: number
  }

  let chip74LS08: ChipTracker<typeof AND2_GATES[0]> | null = null
  let chip74LS11: ChipTracker<typeof AND3_GATES[0]> | null = null
  let chip74LS21: ChipTracker<typeof AND4_GATES[0]> | null = null

  const getOrAllocate74LS08 = () => {
    if (chip74LS08 && chip74LS08.used < chip74LS08.gates.length) {
      return chip74LS08
    }
    const slot = allocateSlot('74LS08')
    if (!slot) return null
    chip74LS08 = { nodeId: slot.nodeId, gates: AND2_GATES, used: 0 }
    return chip74LS08
  }

  const getOrAllocate74LS11 = () => {
    if (chip74LS11 && chip74LS11.used < chip74LS11.gates.length) {
      return chip74LS11
    }
    const slot = allocateSlot('74LS11')
    if (!slot) return null
    chip74LS11 = { nodeId: slot.nodeId, gates: AND3_GATES, used: 0 }
    return chip74LS11
  }

  const getOrAllocate74LS21 = () => {
    if (chip74LS21 && chip74LS21.used < chip74LS21.gates.length) {
      return chip74LS21
    }
    const slot = allocateSlot('74LS21')
    if (!slot) return null
    chip74LS21 = { nodeId: slot.nodeId, gates: AND4_GATES, used: 0 }
    return chip74LS21
  }

  for (const { term } of complexTerms) {
    const lits = term.literals

    if (lits.length === 1) {
      // Single literal term (e.g. "A" or "A'")
      termOutputs.push(getLiteralEndpoint(lits[0]!))
    } else if (lits.length === 2) {
      // 2-input AND gate
      const chip = getOrAllocate74LS08()
      if (!chip) {
        return {
          success: false,
          error: 'Not enough IC slots available on the board for 2-input AND gates.',
          slots: [],
          edges: [],
        }
      }
      const gate = chip.gates[chip.used++]!
      const in1 = getLiteralEndpoint(lits[0]!)
      const in2 = getLiteralEndpoint(lits[1]!)

      edges.push(createEdge(in1, { nodeId: chip.nodeId, handleId: `pin-${gate.in1}` }))
      edges.push(createEdge(in2, { nodeId: chip.nodeId, handleId: `pin-${gate.in2}` }))

      termOutputs.push({ nodeId: chip.nodeId, handleId: `pin-${gate.out}` })
    } else if (lits.length === 3) {
      // 3-input AND gate (74LS11)
      const chip = getOrAllocate74LS11()
      if (!chip) {
        // Fallback: cascade two 2-input AND gates if 74LS11 slot is unavailable
        const chipA = getOrAllocate74LS08()
        const chipB = getOrAllocate74LS08()
        if (!chipA || !chipB) {
          return {
            success: false,
            error: 'Not enough IC slots available for 3-input AND gates.',
            slots: [],
            edges: [],
          }
        }
        const g1 = chipA.gates[chipA.used++]!
        const g2 = chipB.gates[chipB.used++]!

        const in1 = getLiteralEndpoint(lits[0]!)
        const in2 = getLiteralEndpoint(lits[1]!)
        const in3 = getLiteralEndpoint(lits[2]!)

        edges.push(createEdge(in1, { nodeId: chipA.nodeId, handleId: `pin-${g1.in1}` }))
        edges.push(createEdge(in2, { nodeId: chipA.nodeId, handleId: `pin-${g1.in2}` }))

        const tempOut: Endpoint = { nodeId: chipA.nodeId, handleId: `pin-${g1.out}` }
        edges.push(createEdge(tempOut, { nodeId: chipB.nodeId, handleId: `pin-${g2.in1}` }))
        edges.push(createEdge(in3, { nodeId: chipB.nodeId, handleId: `pin-${g2.in2}` }))

        termOutputs.push({ nodeId: chipB.nodeId, handleId: `pin-${g2.out}` })
      } else {
        const gate = chip.gates[chip.used++]!
        const in1 = getLiteralEndpoint(lits[0]!)
        const in2 = getLiteralEndpoint(lits[1]!)
        const in3 = getLiteralEndpoint(lits[2]!)

        edges.push(createEdge(in1, { nodeId: chip.nodeId, handleId: `pin-${gate.in1}` }))
        edges.push(createEdge(in2, { nodeId: chip.nodeId, handleId: `pin-${gate.in2}` }))
        edges.push(createEdge(in3, { nodeId: chip.nodeId, handleId: `pin-${gate.in3}` }))

        termOutputs.push({ nodeId: chip.nodeId, handleId: `pin-${gate.out}` })
      }
    } else if (lits.length === 4) {
      // 4-input AND gate (74LS21)
      const chip = getOrAllocate74LS21()
      if (!chip) {
        return {
          success: false,
          error: 'Not enough IC slots available for 4-input AND gates.',
          slots: [],
          edges: [],
        }
      }
      const gate = chip.gates[chip.used++]!
      const in1 = getLiteralEndpoint(lits[0]!)
      const in2 = getLiteralEndpoint(lits[1]!)
      const in3 = getLiteralEndpoint(lits[2]!)
      const in4 = getLiteralEndpoint(lits[3]!)

      edges.push(createEdge(in1, { nodeId: chip.nodeId, handleId: `pin-${gate.in1}` }))
      edges.push(createEdge(in2, { nodeId: chip.nodeId, handleId: `pin-${gate.in2}` }))
      edges.push(createEdge(in3, { nodeId: chip.nodeId, handleId: `pin-${gate.in3}` }))
      edges.push(createEdge(in4, { nodeId: chip.nodeId, handleId: `pin-${gate.in4}` }))

      termOutputs.push({ nodeId: chip.nodeId, handleId: `pin-${gate.out}` })
    } else {
      // 5 literals or more: cascade 4-input + 2-input
      const chip4 = getOrAllocate74LS21()
      const chip2 = getOrAllocate74LS08()
      if (!chip4 || !chip2) {
        return {
          success: false,
          error: 'Not enough IC slots available for wide AND gates.',
          slots: [],
          edges: [],
        }
      }
      const g4 = chip4.gates[chip4.used++]!
      const g2 = chip2.gates[chip2.used++]!

      edges.push(createEdge(getLiteralEndpoint(lits[0]!), { nodeId: chip4.nodeId, handleId: `pin-${g4.in1}` }))
      edges.push(createEdge(getLiteralEndpoint(lits[1]!), { nodeId: chip4.nodeId, handleId: `pin-${g4.in2}` }))
      edges.push(createEdge(getLiteralEndpoint(lits[2]!), { nodeId: chip4.nodeId, handleId: `pin-${g4.in3}` }))
      edges.push(createEdge(getLiteralEndpoint(lits[3]!), { nodeId: chip4.nodeId, handleId: `pin-${g4.in4}` }))

      const temp4: Endpoint = { nodeId: chip4.nodeId, handleId: `pin-${g4.out}` }
      edges.push(createEdge(temp4, { nodeId: chip2.nodeId, handleId: `pin-${g2.in1}` }))
      edges.push(createEdge(getLiteralEndpoint(lits[4]!), { nodeId: chip2.nodeId, handleId: `pin-${g2.in2}` }))

      termOutputs.push({ nodeId: chip2.nodeId, handleId: `pin-${g2.out}` })
    }
  }

  // ── Step 3: OR Gates to sum all terms ────────────────────────────────────
  let finalOutput: Endpoint

  if (termOutputs.length === 1) {
    // Only 1 term — direct connection to output
    finalOutput = termOutputs[0]!
  } else {
    // 2 or more terms — cascade using 74LS32 OR gates
    let chip74LS32: ChipTracker<typeof OR2_GATES[0]> | null = null

    const getOrAllocate74LS32 = () => {
      if (chip74LS32 && chip74LS32.used < chip74LS32.gates.length) {
        return chip74LS32
      }
      const slot = allocateSlot('74LS32')
      if (!slot) return null
      chip74LS32 = { nodeId: slot.nodeId, gates: OR2_GATES, used: 0 }
      return chip74LS32
    }

    let runningSum: Endpoint = termOutputs[0]!

    for (let i = 1; i < termOutputs.length; i++) {
      const chip = getOrAllocate74LS32()
      if (!chip) {
        return {
          success: false,
          error: 'Not enough IC slots available for OR summation gates.',
          slots: [],
          edges: [],
        }
      }
      const gate = chip.gates[chip.used++]!
      const nextTerm = termOutputs[i]!

      edges.push(createEdge(runningSum, { nodeId: chip.nodeId, handleId: `pin-${gate.in1}` }))
      edges.push(createEdge(nextTerm, { nodeId: chip.nodeId, handleId: `pin-${gate.in2}` }))

      runningSum = { nodeId: chip.nodeId, handleId: `pin-${gate.out}` }
    }

    finalOutput = runningSum
  }

  // ── Step 4: Connect final output to main-output-panel pin-0 ──────────────
  edges.push(
    createEdge(finalOutput, {
      nodeId: 'main-output-panel',
      handleId: 'pin-0',
    })
  )

  return {
    success: true,
    slots,
    edges,
  }
}
