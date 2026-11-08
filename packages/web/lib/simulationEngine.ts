import { IC_LIBRARY, type ICEntry } from './icLibrary'
import type { Edge } from '@xyflow/react'
import type { ICSlot } from '@/stores/useBoardStore'
import {
  evaluate74LS83,
  evaluate74LS85,
  evaluate74LS138,
  evaluate74LS139,
  evaluate74LS151,
  evaluate74LS153,
  type ICEvaluatorContext,
} from './icEvaluators/combinational'
import {
  evaluate74LS74,
  evaluate74LS76,
  type SequentialEvaluatorContext,
} from './icEvaluators/sequential'
import {
  evaluate74LS90,
  evaluate74LS93,
  evaluate74x191,
} from './icEvaluators/counters'
import { evaluate74x194 } from './icEvaluators/shiftRegisters'
export type SignalState = 'HIGH' | 'LOW' | 'X' | 'unconnected'
export interface PinSignals {
  [nodeId: string]: {
    [pinId: string]: SignalState
  }
}
function evaluateGate(type: string, inputs: SignalState[]): SignalState {
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
function findIC(partNumber: string): ICEntry | undefined {
  return IC_LIBRARY.flatMap((c) => c.ics).find((ic) => ic.part === partNumber)
}
export function simulateBoard(
  edges: Edge[],
  icSlots: ICSlot[],
  inputStates: Record<string, boolean>,
  isPowerOn: boolean,
  clockStates: Record<string, boolean> = {},
  chipStates: Record<string, any> = {},
  prevPinSignals: PinSignals = {}
): {
  updatedEdges: Edge[]
  outputStates: Record<string, boolean>
  pinSignals: PinSignals
  updatedChipStates: Record<string, any>
} {
  if (!isPowerOn) {
    return {
      updatedEdges: edges.map((e) => ({
        ...e,
        data: { ...e.data, signalState: 'unconnected' },
      })),
      outputStates: {},
      pinSignals: {},
      updatedChipStates: {},
    }
  }
  const pinSignals: PinSignals = {}
  const updatedChipStates: Record<string, any> = { ...chipStates }
  const triggeredClockEdges = new Set<string>()
  const setSignal = (nodeId: string, pinId: string, state: SignalState) => {
    if (!pinSignals[nodeId]) pinSignals[nodeId] = {}
    pinSignals[nodeId][pinId] = state
  }
  const getSignal = (nodeId: string, pinId: string): SignalState => {
    return pinSignals[nodeId]?.[pinId] ?? 'unconnected'
  }
  const getPrevSignal = (nodeId: string, pinId: string): SignalState => {
    return prevPinSignals[nodeId]?.[pinId] ?? 'unconnected'
  }
  setSignal('main-output-panel', 'pin-VCC', 'HIGH')
  setSignal('main-input-clock-panel', 'input-gnd', 'LOW')
  for (const [pin, isHigh] of Object.entries(inputStates)) {
    setSignal('main-input-clock-panel', `input-${pin}`, isHigh ? 'HIGH' : 'LOW')
  }
  for (const [pin, isHigh] of Object.entries(clockStates)) {
    setSignal('main-input-clock-panel', `clock-${pin}`, isHigh ? 'HIGH' : 'LOW')
  }
  const isDriver = (nodeId: string, pinId: string): boolean => {
    if (nodeId === 'main-input-clock-panel') return true
    if (nodeId === 'main-output-panel' && pinId === 'pin-VCC') return true
    if (nodeId.startsWith('ic-chip-')) {
      const chipIndex = parseInt(nodeId.replace('ic-chip-', ''), 10) - 1
      const slot = icSlots[chipIndex]
      if (!slot?.icDefinition) return false
      const ic = findIC(slot.icDefinition.partNumber)
      if (!ic) return false
      const pinNum = parseInt(pinId.replace('pin-', ''), 10)
      const pin = ic.pins.find((p) => p.number === pinNum)
      return pin?.function === 'output'
    }
    return false
  }

  const propagateEdges = (): boolean => {
    let changed = false
    for (const edge of edges) {
      const sHandle = edge.sourceHandle ?? ''
      const tHandle = edge.targetHandle ?? ''
      const sSig = getSignal(edge.source, sHandle)
      const tSig = getSignal(edge.target, tHandle)

      const sDriver = isDriver(edge.source, sHandle)
      const tDriver = isDriver(edge.target, tHandle)

      if (sDriver && !tDriver) {
        if (tSig !== sSig) {
          setSignal(edge.target, tHandle, sSig)
          changed = true
        }
      } else if (tDriver && !sDriver) {
        if (sSig !== tSig) {
          setSignal(edge.source, sHandle, tSig)
          changed = true
        }
      } else {
        if (sSig !== 'unconnected' && tSig === 'unconnected') {
          setSignal(edge.target, tHandle, sSig)
          changed = true
        } else if (tSig !== 'unconnected' && sSig === 'unconnected') {
          setSignal(edge.source, sHandle, tSig)
          changed = true
        }
      }
    }
    return changed
  }
  const evaluateAllICs = (): boolean => {
    let changed = false
    for (let i = 0; i < icSlots.length; i++) {
      const slot = icSlots[i]
      if (!slot?.icDefinition) continue
      const nodeId = `ic-chip-${i + 1}`
      const ic = findIC(slot.icDefinition.partNumber)
      if (!ic) continue

      const ctx: ICEvaluatorContext = {
        getPinSignal: (pinNumber: number) => getSignal(nodeId, `pin-${pinNumber}`),
        setPinSignal: (pinNumber: number, state: SignalState) => {
          const prev = getSignal(nodeId, `pin-${pinNumber}`)
          if (prev !== state) {
            setSignal(nodeId, `pin-${pinNumber}`, state)
            changed = true
          }
        },
      }

      const part = slot.icDefinition.partNumber
      if (part === '74LS83') {
        evaluate74LS83(ctx)
        continue
      }
      if (part === '74LS85') {
        evaluate74LS85(ctx)
        continue
      }
      if (part === '74LS138') {
        evaluate74LS138(ctx)
        continue
      }
      if (part === '74LS139') {
        evaluate74LS139(ctx)
        continue
      }
      if (part === '74LS151') {
        evaluate74LS151(ctx)
        continue
      }
      if (part === '74LS153') {
        evaluate74LS153(ctx)
        continue
      }

      const seqCtx: SequentialEvaluatorContext = {
        getPinSignal: (pinNumber: number) => getSignal(nodeId, `pin-${pinNumber}`),
        getPrevPinSignal: (pinNumber: number) => getPrevSignal(nodeId, `pin-${pinNumber}`),
        setPinSignal: (pinNumber: number, state: SignalState) => {
          const prev = getSignal(nodeId, `pin-${pinNumber}`)
          if (prev !== state) {
            setSignal(nodeId, `pin-${pinNumber}`, state)
            changed = true
          }
        },
        getChipState: () => updatedChipStates[nodeId] ?? {},
        setChipState: (state) => {
          updatedChipStates[nodeId] = state
        },
        isClockTriggered: (pinNumber: number, edge: 'rising' | 'falling') => {
          const key = `${nodeId}:${pinNumber}`
          if (triggeredClockEdges.has(key)) return false
          const prev = getPrevSignal(nodeId, `pin-${pinNumber}`)
          const curr = getSignal(nodeId, `pin-${pinNumber}`)
          const hasEdge =
            edge === 'rising'
              ? (prev === 'LOW' || prev === 'unconnected') && curr === 'HIGH'
              : prev === 'HIGH' && curr === 'LOW'
          if (hasEdge) {
            triggeredClockEdges.add(key)
            return true
          }
          return false
        },
      }

      if (part === '74LS74') {
        evaluate74LS74(seqCtx)
        continue
      }
      if (part === '74LS76') {
        evaluate74LS76(seqCtx)
        continue
      }
      if (part === '74LS90') {
        evaluate74LS90(seqCtx)
        continue
      }
      if (part === '74LS93') {
        evaluate74LS93(seqCtx)
        continue
      }
      if (part === '74HC191' || part === '74LS191') {
        evaluate74x191(seqCtx)
        continue
      }
      if (part === '74HC194' || part === '74LS194') {
        evaluate74x194(seqCtx)
        continue
      }

      const gateType = getGateType(slot.icDefinition.partNumber)
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
  for (let pass = 0; pass < 10; pass++) {
    const p1 = propagateEdges()
    const p2 = evaluateAllICs()
    const p3 = propagateEdges()
    if (!p1 && !p2 && !p3) break
  }
  const outputStates: Record<string, boolean> = {}
  const outputNode = pinSignals['main-output-panel'] ?? {}
  for (const [pinId, state] of Object.entries(outputNode)) {
    const pinName = pinId.replace('pin-', '')
    outputStates[pinName] = state === 'HIGH'
  }
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
  const updatedEdges = edges.map((edge) => {
    const sSig = getSignal(edge.source, edge.sourceHandle ?? '')
    const tSig = getSignal(edge.target, edge.targetHandle ?? '')
    const signal = sSig !== 'unconnected' ? sSig : tSig
    return {
      ...edge,
      data: { ...edge.data, signalState: signal },
    }
  })
  return { updatedEdges, outputStates, pinSignals, updatedChipStates }
}
