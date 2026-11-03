import { IC_LIBRARY, type ICEntry } from './icLibrary'
import type { Edge } from '@xyflow/react'
import type { ICSlot } from '@/stores/useBoardStore'

export type SignalState = 'HIGH' | 'LOW' | 'X' | 'unconnected'

export interface PinSignals {
  [nodeId: string]: {
    [pinId: string]: SignalState
  }
}

// Gate evaluation functions
function evaluateGate(type: string, inputs: SignalState[]): SignalState {
  // If any input is unknown return X
  if (inputs.some((i) => i === 'X' || i === 'unconnected')) return 'X'

  const bools = inputs.map((i) => i === 'HIGH')

  switch (type) {
    case 'AND':
      return bools.every(Boolean) ? 'HIGH' : 'LOW'
    case 'OR':
      return bools.some(Boolean) ? 'HIGH' : 'LOW'
    case 'NOT':
    case 'BUFFER_INV':
      return bools[0] ? 'LOW' : 'HIGH'
    case 'NAND':
      return bools.every(Boolean) ? 'LOW' : 'HIGH'
    case 'NOR':
      return bools.some(Boolean) ? 'LOW' : 'HIGH'
    case 'XOR':
      return bools.reduce((a, b) => a !== b) ? 'HIGH' : 'LOW'
    case 'XNOR':
      return bools.reduce((a, b) => a !== b) ? 'LOW' : 'HIGH'
    default:
      return 'X'
  }
}

// Get gate type from IC part number and output pin
function getGateType(partNumber: string): string {
  if (
    partNumber.includes('00') ||
    partNumber.includes('03') ||
    partNumber.includes('38') ||
    partNumber.includes('132')
  )
    return 'NAND'
  if (partNumber.includes('02') || partNumber.includes('27')) return 'NOR'
  if (
    partNumber.includes('04') ||
    partNumber.includes('05') ||
    partNumber.includes('14')
  )
    return 'NOT'
  if (
    partNumber.includes('08') ||
    partNumber.includes('11') ||
    partNumber.includes('21')
  )
    return 'AND'
  if (partNumber.includes('32')) return 'OR'
  if (partNumber.includes('86')) return 'XOR'
  return 'X'
}

// Find IC entry from library
function findIC(partNumber: string): ICEntry | undefined {
  return IC_LIBRARY.flatMap((c) => c.ics).find((ic) => ic.part === partNumber)
}

export function simulateBoard(
  edges: Edge[],
  icSlots: ICSlot[],
  inputStates: Record<string, boolean>,
  isPowerOn: boolean
): {
  updatedEdges: Edge[]
  outputStates: Record<string, boolean>
  pinSignals: PinSignals
} {
  if (!isPowerOn) {
    return {
      updatedEdges: edges.map((e) => ({
        ...e,
        data: { ...e.data, signalState: 'unconnected' },
      })),
      outputStates: {},
      pinSignals: {},
    }
  }

  // Step 1 — Build pin signal map
  const pinSignals: PinSignals = {}

  const setSignal = (nodeId: string, pinId: string, state: SignalState) => {
    if (!pinSignals[nodeId]) pinSignals[nodeId] = {}
    pinSignals[nodeId][pinId] = state
  }

  const getSignal = (nodeId: string, pinId: string): SignalState => {
    return pinSignals[nodeId]?.[pinId] ?? 'unconnected'
  }

  // Step 2 — Seed power & input section signals
  setSignal('main-output-panel', 'pin-VCC', 'HIGH')
  setSignal('main-input-clock-panel', 'input-gnd', 'LOW')

  for (const [pin, isHigh] of Object.entries(inputStates)) {
    setSignal('main-input-clock-panel', `input-${pin}`, isHigh ? 'HIGH' : 'LOW')
  }

  // Helper for bidirectional signal transfer along wires
  const propagateEdges = (): boolean => {
    let changed = false
    for (const edge of edges) {
      const sHandle = edge.sourceHandle ?? ''
      const tHandle = edge.targetHandle ?? ''
      const sSig = getSignal(edge.source, sHandle)
      const tSig = getSignal(edge.target, tHandle)

      if (sSig !== 'unconnected' && tSig === 'unconnected') {
        setSignal(edge.target, tHandle, sSig)
        changed = true
      } else if (tSig !== 'unconnected' && sSig === 'unconnected') {
        setSignal(edge.source, sHandle, tSig)
        changed = true
      }
    }
    return changed
  }

  // Helper to evaluate all IC gates
  const evaluateAllICs = (): boolean => {
    let changed = false
    for (let i = 0; i < icSlots.length; i++) {
      const slot = icSlots[i]
      if (!slot?.icDefinition) continue

      const nodeId = `ic-chip-${i + 1}`
      const ic = findIC(slot.icDefinition.partNumber)
      if (!ic) continue

      const gateType = getGateType(slot.icDefinition.partNumber)

      // Group pins by gate unit (based on label prefix like 1A, 1B, 1Y)
      const gateGroups: Record<
        string,
        {
          inputs: number[]
          output: number
        }
      > = {}

      for (const pin of ic.pins) {
        if (
          pin.function === 'vcc' ||
          pin.function === 'gnd' ||
          pin.function === 'nc'
        )
          continue

        // Extract gate number from label (1A → 1, 2Y → 2, 3A → 3, etc.)
        const match = pin.label.match(/^(\d+)/)
        if (!match) continue
        const gateNum = match[1]
        if (!gateNum) continue

        if (!gateGroups[gateNum]) {
          gateGroups[gateNum] = { inputs: [], output: -1 }
        }

        if (pin.function === 'input') {
          gateGroups[gateNum].inputs.push(pin.number)
        } else if (pin.function === 'output') {
          gateGroups[gateNum].output = pin.number
        }
      }

      // Evaluate each gate
      for (const gate of Object.values(gateGroups)) {
        if (gate.output === -1) continue

        const inputSignals = gate.inputs.map((pinNum) =>
          getSignal(nodeId, `pin-${pinNum}`)
        )

        const result = evaluateGate(gateType, inputSignals)
        const prevSignal = getSignal(nodeId, `pin-${gate.output}`)
        if (prevSignal !== result) {
          setSignal(nodeId, `pin-${gate.output}`, result)
          changed = true
        }
      }
    }
    return changed
  }

  // Step 3 — Multi-pass convergence loop (up to 5 passes for chained logic)
  for (let pass = 0; pass < 5; pass++) {
    const p1 = propagateEdges()
    const p2 = evaluateAllICs()
    const p3 = propagateEdges()
    if (!p1 && !p2 && !p3) break
  }

  // Step 4 — Collect output panel states
  const outputStates: Record<string, boolean> = {}

  // Read directly from pinSignals
  const outputNode = pinSignals['main-output-panel'] ?? {}
  for (const [pinId, state] of Object.entries(outputNode)) {
    const pinName = pinId.replace('pin-', '')
    outputStates[pinName] = state === 'HIGH'
  }

  // Also check all edges connected to the output panel directly
  for (const edge of edges) {
    if (edge.source === 'main-output-panel' && edge.sourceHandle?.startsWith('pin-')) {
      const pinName = edge.sourceHandle.replace('pin-', '')
      const sig = getSignal(edge.target, edge.targetHandle ?? '')
      if (sig === 'HIGH') outputStates[pinName] = true
    } else if (edge.target === 'main-output-panel' && edge.targetHandle?.startsWith('pin-')) {
      const pinName = edge.targetHandle.replace('pin-', '')
      const sig = getSignal(edge.source, edge.sourceHandle ?? '')
      if (sig === 'HIGH') outputStates[pinName] = true
    }
  }

  // Step 5 — Color edges by active signal state
  const updatedEdges = edges.map((edge) => {
    const sSig = getSignal(edge.source, edge.sourceHandle ?? '')
    const tSig = getSignal(edge.target, edge.targetHandle ?? '')
    const signal = sSig !== 'unconnected' ? sSig : tSig
    return {
      ...edge,
      data: { ...edge.data, signalState: signal },
    }
  })

  return { updatedEdges, outputStates, pinSignals }
}
