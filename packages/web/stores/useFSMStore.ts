import { create } from 'zustand'
import type {
  FSMState,
  FSMTransition,
  MachineType,
  NextStateEquation,
  StateEncoding,
  StateTableRow,
} from '@/lib/fsm/types'
import {
  deriveFSMEquations,
  evaluateCondition,
  generateStateTable,
} from '@/lib/fsm/stateTableGenerator'
import { FSM_PRESETS } from '@/lib/fsm/fsmPresets'
import { applySymmetricalLayout } from '@/lib/fsm/fsmLayout'

interface FSMStoreState {
  states: FSMState[]
  transitions: FSMTransition[]
  inputs: string[]
  outputs: string[]
  machineType: MachineType
  encoding: StateEncoding
  activeStateId: string | null
  inputValues: Record<string, 0 | 1>
  viewMode: 'diagram' | 'asm' | 'split'
  tableRows: StateTableRow[]
  equations: NextStateEquation[]
  encodings: Record<string, string>
  numBits: number

  // Actions
  addState: (name?: string, x?: number, y?: number) => void
  updateState: (id: string, updates: Partial<FSMState>) => void
  removeState: (id: string) => void
  setInitialState: (id: string) => void

  addTransition: (
    fromState: string,
    toState: string,
    condition?: string,
    mealyOutputs?: Record<string, 0 | 1>
  ) => void
  updateTransition: (id: string, updates: Partial<FSMTransition>) => void
  removeTransition: (id: string) => void

  setMachineType: (type: MachineType) => void
  setEncoding: (encoding: StateEncoding) => void
  addInput: (name: string) => void
  removeInput: (name: string) => void
  addOutput: (name: string) => void
  removeOutput: (name: string) => void
  setInputValue: (name: string, val: 0 | 1) => void

  stepClock: () => void
  resetSimulation: () => void
  setViewMode: (mode: 'diagram' | 'asm' | 'split') => void
  loadPreset: (presetId: string) => void
  arrangeSymmetrical: () => void
  reset: () => void
}

function recomputeAll(
  states: FSMState[],
  transitions: FSMTransition[],
  inputs: string[],
  outputs: string[],
  machineType: MachineType,
  encoding: StateEncoding
) {
  const { rows, numBits, encodings } = generateStateTable(
    states,
    transitions,
    inputs,
    outputs,
    machineType,
    encoding
  )
  const equations = deriveFSMEquations(rows, numBits, inputs, outputs)
  return { tableRows: rows, numBits, encodings, equations }
}

const defaultPreset = FSM_PRESETS[0]! // Sequence Detector 101

const initialRecompute = recomputeAll(
  defaultPreset.states,
  defaultPreset.transitions,
  defaultPreset.inputs,
  defaultPreset.outputs,
  defaultPreset.machineType,
  'binary'
)

export const useFSMStore = create<FSMStoreState>((set, get) => ({
  states: [...defaultPreset.states],
  transitions: [...defaultPreset.transitions],
  inputs: [...defaultPreset.inputs],
  outputs: [...defaultPreset.outputs],
  machineType: defaultPreset.machineType,
  encoding: 'binary',
  activeStateId: defaultPreset.states[0]?.id ?? null,
  inputValues: { m: 1, X: 1 },
  viewMode: 'diagram',
  tableRows: initialRecompute.tableRows,
  equations: initialRecompute.equations,
  encodings: initialRecompute.encodings,
  numBits: initialRecompute.numBits,

  addState: (name, x, y) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const nextIdx = states.length
    const id = `s${Date.now()}`
    const newState: FSMState = {
      id,
      name: name ?? `S${nextIdx}`,
      x: x ?? 100 + (nextIdx % 4) * 200,
      y: y ?? 150 + Math.floor(nextIdx / 4) * 160,
      isInitial: states.length === 0,
      mooreOutputs: {},
    }
    const newStates = [...states, newState]
    const activeStateId = get().activeStateId ?? (newState.isInitial ? id : null)
    set({
      states: newStates,
      activeStateId,
      ...recomputeAll(newStates, transitions, inputs, outputs, machineType, encoding),
    })
  },

  updateState: (id, updates) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const newStates = states.map((s) => (s.id === id ? { ...s, ...updates } : s))
    set({
      states: newStates,
      ...recomputeAll(newStates, transitions, inputs, outputs, machineType, encoding),
    })
  },

  setInitialState: (id) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const newStates = states.map((s) => ({
      ...s,
      isInitial: s.id === id,
    }))
    set({
      states: newStates,
      activeStateId: id,
      ...recomputeAll(newStates, transitions, inputs, outputs, machineType, encoding),
    })
  },

  removeState: (id) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const newStates = states.filter((s) => s.id !== id)
    // Remove transitions connected to this state
    const newTransitions = transitions.filter((t) => t.fromState !== id && t.toState !== id)
    const activeStateId = get().activeStateId === id ? (newStates[0]?.id ?? null) : get().activeStateId
    set({
      states: newStates,
      transitions: newTransitions,
      activeStateId,
      ...recomputeAll(newStates, newTransitions, inputs, outputs, machineType, encoding),
    })
  },

  addTransition: (fromState, toState, condition = '1', mealyOutputs = {}) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const id = `t${Date.now()}`
    const newTransition: FSMTransition = {
      id,
      fromState,
      toState,
      condition,
      mealyOutputs,
    }
    const newTransitions = [...transitions, newTransition]
    set({
      transitions: newTransitions,
      ...recomputeAll(states, newTransitions, inputs, outputs, machineType, encoding),
    })
  },

  updateTransition: (id, updates) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const newTransitions = transitions.map((t) => (t.id === id ? { ...t, ...updates } : t))
    set({
      transitions: newTransitions,
      ...recomputeAll(states, newTransitions, inputs, outputs, machineType, encoding),
    })
  },

  removeTransition: (id) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const newTransitions = transitions.filter((t) => t.id !== id)
    set({
      transitions: newTransitions,
      ...recomputeAll(states, newTransitions, inputs, outputs, machineType, encoding),
    })
  },

  setMachineType: (type) => {
    const { states, transitions, inputs, outputs, encoding } = get()
    set({
      machineType: type,
      ...recomputeAll(states, transitions, inputs, outputs, type, encoding),
    })
  },

  setEncoding: (encoding) => {
    const { states, transitions, inputs, outputs, machineType } = get()
    set({
      encoding,
      ...recomputeAll(states, transitions, inputs, outputs, machineType, encoding),
    })
  },

  addInput: (name) => {
    const upper = name.trim().toUpperCase()
    if (!upper) return
    const { states, transitions, inputs, outputs, machineType, encoding, inputValues } = get()
    if (inputs.includes(upper)) return
    const newInputs = [...inputs, upper]
    const newInputValues = { ...inputValues, [upper]: 0 as 0 | 1 }
    set({
      inputs: newInputs,
      inputValues: newInputValues,
      ...recomputeAll(states, transitions, newInputs, outputs, machineType, encoding),
    })
  },

  removeInput: (name) => {
    const { states, transitions, inputs, outputs, machineType, encoding, inputValues } = get()
    const newInputs = inputs.filter((i) => i !== name)
    const restInputValues = { ...inputValues }
    delete restInputValues[name]
    set({
      inputs: newInputs,
      inputValues: restInputValues,
      ...recomputeAll(states, transitions, newInputs, outputs, machineType, encoding),
    })
  },

  addOutput: (name) => {
    const upper = name.trim().toUpperCase()
    if (!upper) return
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    if (outputs.includes(upper)) return
    const newOutputs = [...outputs, upper]
    set({
      outputs: newOutputs,
      ...recomputeAll(states, transitions, inputs, newOutputs, machineType, encoding),
    })
  },

  removeOutput: (name) => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const newOutputs = outputs.filter((o) => o !== name)
    set({
      outputs: newOutputs,
      ...recomputeAll(states, transitions, inputs, newOutputs, machineType, encoding),
    })
  },

  setInputValue: (name, val) => {
    const inputValues = { ...get().inputValues, [name]: val }
    set({ inputValues })
  },

  stepClock: () => {
    const { states, transitions, activeStateId, inputValues } = get()
    if (!activeStateId) return

    const currentState = states.find((s) => s.id === activeStateId)
    if (!currentState) return

    // Find first transition matching inputValues
    const outgoing = transitions.filter((t) => t.fromState === activeStateId)
    const matching = outgoing.find((t) => evaluateCondition(t.condition, inputValues))

    if (matching) {
      set({ activeStateId: matching.toState })
    }
  },

  resetSimulation: () => {
    const { states } = get()
    const initial = states.find((s) => s.isInitial) ?? states[0]
    set({ activeStateId: initial?.id ?? null })
  },

  setViewMode: (mode) => {
    set({ viewMode: mode })
  },

  loadPreset: (presetId) => {
    const preset = FSM_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    const inputValues: Record<string, 0 | 1> = {}
    preset.inputs.forEach((inp) => {
      inputValues[inp] = 1
    })
    const initial = preset.states.find((s) => s.isInitial) ?? preset.states[0]
    set({
      states: [...preset.states],
      transitions: [...preset.transitions],
      inputs: [...preset.inputs],
      outputs: [...preset.outputs],
      machineType: preset.machineType,
      activeStateId: initial?.id ?? null,
      inputValues,
      ...recomputeAll(
        preset.states,
        preset.transitions,
        preset.inputs,
        preset.outputs,
        preset.machineType,
        get().encoding
      ),
    })
  },

  arrangeSymmetrical: () => {
    const { states, transitions, inputs, outputs, machineType, encoding } = get()
    const arranged = applySymmetricalLayout(states)
    set({
      states: arranged,
      ...recomputeAll(
        arranged,
        transitions,
        inputs,
        outputs,
        machineType,
        encoding
      ),
    })
  },

  reset: () => {
    set({
      states: [],
      transitions: [],
      inputs: ['X'],
      outputs: ['Z'],
      activeStateId: null,
      tableRows: [],
      equations: [],
      encodings: {},
      numBits: 0,
    })
  },
}))
