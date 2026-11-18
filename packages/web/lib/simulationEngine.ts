/**
 * Klyro — Digital Logic Simulation Engine
 *
 * Implements an iterative signal propagation and IC evaluation loop:
 * - Multi-pass edge propagation connecting drivers (input panels, VCC, IC outputs) to inputs
 * - IC power verification (strict VCC & GND requirement)
 * - Combinational logic gate and MSI chip evaluation (Adders, Comparators, Decoders, Multiplexers)
 * - Sequential logic flip-flop and counter evaluation with edge-triggered clock detection
 * - Convergence detection up to MAX_PROPAGATION_PASSES
 */

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

/**
 * 4-state digital signal representing logic levels on breadboard pins and wire edges.
 */
export type SignalState = 'HIGH' | 'LOW' | 'X' | 'unconnected'

/**
 * Pin signal lookup table indexed by nodeId (e.g. 'ic-chip-1') and pinId (e.g. 'pin-3').
 */
export interface PinSignals {
  [nodeId: string]: {
    [pinId: string]: SignalState
  }
}

/** Maximum relaxation passes allowed for signals to settle across cascading gates */
const MAX_PROPAGATION_PASSES = 10

/**
 * Evaluates an idealized primitive digital logic gate with given input states.
 *
 * @param type Gate function: 'AND', 'OR', 'NOT', 'NAND', 'NOR', 'XOR', 'XNOR'
 * @param inputs Array of input signal states
 * @returns Output SignalState ('HIGH', 'LOW', or 'X')
 */
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

/**
 * Maps standard TTL part number prefixes to primitive gate logic types.
 *
 * @param partNumber IC part number (e.g., '74LS08', '74LS00')
 * @returns The primitive gate type string, or 'X' if unknown/complex
 */
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

/**
 * Finds an IC definition from the active IC library catalog.
 *
 * @param partNumber Part number string (e.g., '74LS08')
 * @returns Matching ICEntry or undefined
 */
function findIC(partNumber: string): ICEntry | undefined {
  return IC_LIBRARY.flatMap((c) => c.ics).find((ic) => ic.part === partNumber)
}

/** Internal state snapshot of a sequential IC chip across simulation ticks */
export type ChipState = Record<string, boolean | number | string | undefined>

/**
 * Executes a full discrete simulation cycle across the entire digital breadboard.
 *
 * @param edges Active wire edges connecting panels and IC pins
 * @param icSlots Sockets on the breadboard containing IC chips
 * @param inputStates Interactive logic switch inputs (true = HIGH, false = LOW)
 * @param isPowerOn Master power switch state (VCC active)
 * @param clockStates Manual or automatic clock generator pin levels
 * @param chipStates Internal state registers for sequential ICs (flip-flops, counters)
 * @param prevPinSignals Pin states from the previous tick (used for clock edge detection)
 * @returns Updated edge colors, panel output LED states, pin signals, and chip states
 */
export function simulateBoard(
  edges: Edge[],
  icSlots: ICSlot[],
  inputStates: Record<string, boolean>,
  isPowerOn: boolean,
  clockStates: Record<string, boolean> = {},
  chipStates: Record<string, ChipState> = {},
  prevPinSignals: PinSignals = {}
): {
  updatedEdges: Edge[]
  outputStates: Record<string, boolean>
  pinSignals: PinSignals
  updatedChipStates: Record<string, ChipState>
} {
  // If master power is OFF, immediately zero out all wires, outputs, and IC states
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
  const updatedChipStates: Record<string, ChipState> = { ...chipStates }
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

  // 1. Initialize fixed power and user input rails
  setSignal('main-output-panel', 'pin-VCC', 'HIGH')
  setSignal('main-input-clock-panel', 'input-gnd', 'LOW')

  for (const [pin, isHigh] of Object.entries(inputStates)) {
    setSignal('main-input-clock-panel', `input-${pin}`, isHigh ? 'HIGH' : 'LOW')
  }

  for (const [pin, isHigh] of Object.entries(clockStates)) {
    setSignal('main-input-clock-panel', `clock-${pin}`, isHigh ? 'HIGH' : 'LOW')
  }

  /**
   * Identifies whether a given node pin acts as an electrical output driver.
   * Drivers push their state onto connected wires and sink pins.
   */
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

  /**
   * Propagates voltage signals across all connecting wire edges.
   * Returns true if any target pin's state changed.
   */
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
        // If neither is explicitly an IC output driver, propagate connected signal across the net
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

  /**
   * Evaluates logic functions for all seated IC chips.
   * Checks VCC/GND connectivity and dispatches to specific chip evaluators.
   */
  const evaluateAllICs = (): boolean => {
    let changed = false
    for (let i = 0; i < icSlots.length; i++) {
      const slot = icSlots[i]
      if (!slot?.icDefinition) continue
      const nodeId = `ic-chip-${i + 1}`
      const ic = findIC(slot.icDefinition.partNumber)
      if (!ic) continue

      // Strict IC Power Requirement: VCC must be connected to HIGH and GND to LOW
      const vccPin = ic.pins.find((p) => p.function === 'vcc')
      const gndPin = ic.pins.find((p) => p.function === 'gnd')

      const isVccPowered = vccPin
        ? getSignal(nodeId, `pin-${vccPin.number}`) === 'HIGH'
        : true
      const isGndConnected = gndPin
        ? getSignal(nodeId, `pin-${gndPin.number}`) === 'LOW'
        : true

      if (!isVccPowered || !isGndConnected) {
        // If unpowered, force all outputs to unpowered LOW
        for (const pin of ic.pins) {
          if (pin.function === 'output') {
            const prev = getSignal(nodeId, `pin-${pin.number}`)
            if (prev !== 'LOW') {
              setSignal(nodeId, `pin-${pin.number}`, 'LOW')
              changed = true
            }
          }
        }
        if (updatedChipStates[nodeId] && Object.keys(updatedChipStates[nodeId]).length > 0) {
          updatedChipStates[nodeId] = {}
        }
        continue
      }

      // Context interface passed to combinational MSI evaluators
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

      // ── Combinational MSI Chips ──────────────────────────────────────────
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

      // Context interface passed to sequential IC evaluators
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

      // ── Sequential Flip-Flops & Counters ─────────────────────────────────
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

      // ── Standard Multi-Gate SSI Packages (74LS00, 74LS04, 74LS08, etc.) ─
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

  // Multi-pass relaxation loop: alternates edge propagation and IC evaluations until stable
  for (let pass = 0; pass < MAX_PROPAGATION_PASSES; pass++) {
    const p1 = propagateEdges()
    const p2 = evaluateAllICs()
    const p3 = propagateEdges()
    if (!p1 && !p2 && !p3) break
  }

  // 2. Read final logic states of the Output Panel LEDs
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

  // 3. Annotate wire edges with their resolved digital SignalState for live styling
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

