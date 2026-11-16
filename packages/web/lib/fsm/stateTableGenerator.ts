import type {
  FSMState,
  FSMTransition,
  MachineType,
  NextStateEquation,
  StateEncoding,
  StateTableRow,
} from './types'
import { computeStateEncodings } from './stateEncoder'
import { findPrimeImplicants } from '../kmap/quineMcCluskey'
import { selectMinimalCover } from '../kmap/petrick'
import { toSOP } from '../kmap/expressionBuilder'

/**
 * Checks whether an input assignment matches a transition condition.
 * Supports:
 * - Empty, "1", "always", or "true" -> unconditionally true
 * - "X=1", "X=0", "X", "!X", "~X"
 * - Comma / AND separated conditions: "X=1, Y=0" or "X & !Y"
 */
export function evaluateCondition(
  condition: string,
  inputs: Record<string, 0 | 1>
): boolean {
  const trimmed = condition.trim()
  if (!trimmed || trimmed === '1' || trimmed.toLowerCase() === 'always' || trimmed.toLowerCase() === 'true') {
    return true
  }

  // Split on commas or ampersands
  const clauses = trimmed.split(/[,&]+/).map((c) => c.trim()).filter(Boolean)

  for (const clause of clauses) {
    if (clause.includes('=')) {
      const [varName, valStr] = clause.split('=').map((s) => s.trim())
      if (!varName || valStr === undefined) continue
      const expected = valStr === '1' ? 1 : 0
      const actual = inputs[varName] ?? 0
      if (actual !== expected) return false
    } else if (clause.startsWith('!') || clause.startsWith('~')) {
      const varName = clause.slice(1).trim()
      const actual = inputs[varName] ?? 0
      if (actual !== 0) return false
    } else {
      const varName = clause.trim()
      const actual = inputs[varName] ?? 0
      if (actual !== 1) return false
    }
  }

  return true
}

/**
 * Generates Cartesian combinations for an array of input variable names.
 * e.g. ['X'] -> [{X:0}, {X:1}]
 */
export function generateInputCombinations(
  inputNames: string[]
): Record<string, 0 | 1>[] {
  if (inputNames.length === 0) return [{}]

  const total = 1 << inputNames.length
  const combinations: Record<string, 0 | 1>[] = []

  for (let i = 0; i < total; i++) {
    const combo: Record<string, 0 | 1> = {}
    inputNames.forEach((name, idx) => {
      const bit = (i >> (inputNames.length - 1 - idx)) & 1
      combo[name] = bit as 0 | 1
    })
    combinations.push(combo)
  }

  return combinations
}

export function generateStateTable(
  states: FSMState[],
  transitions: FSMTransition[],
  inputNames: string[],
  outputNames: string[],
  machineType: MachineType,
  encoding: StateEncoding
): {
  rows: StateTableRow[]
  numBits: number
  encodings: Record<string, string>
} {
  const { encodings, numBits } = computeStateEncodings(states, encoding)
  const rows: StateTableRow[] = []

  if (states.length === 0) {
    return { rows, numBits: 0, encodings }
  }

  const combinations = generateInputCombinations(inputNames)

  for (const state of states) {
    for (const combo of combinations) {
      // Find matching transition
      const matching = transitions.find(
        (t) => t.fromState === state.id && evaluateCondition(t.condition, combo)
      )

      const nextState = matching
        ? states.find((s) => s.id === matching.toState) ?? state
        : state

      // Determine outputs
      const outputs: Record<string, 0 | 1> = {}
      for (const outName of outputNames) {
        if (machineType === 'moore') {
          outputs[outName] = state.mooreOutputs[outName] ?? 0
        } else {
          // Mealy output
          outputs[outName] = matching ? matching.mealyOutputs[outName] ?? 0 : 0
        }
      }

      rows.push({
        id: `${state.id}-${JSON.stringify(combo)}`,
        presentStateId: state.id,
        presentStateName: state.name,
        presentStateCode: encodings[state.id] ?? '',
        inputs: combo,
        nextStateId: nextState.id,
        nextStateName: nextState.name,
        nextStateCode: encodings[nextState.id] ?? '',
        outputs,
      })
    }
  }

  return { rows, numBits, encodings }
}

/**
 * Derives minimized Boolean SOP equations for Next State bits (D_k) and Outputs (Z_m)
 * using the Quine-McCluskey & Petrick solver.
 */
export function deriveFSMEquations(
  rows: StateTableRow[],
  numBits: number,
  inputNames: string[],
  outputNames: string[]
): NextStateEquation[] {
  if (rows.length === 0 || numBits === 0) return []

  // Variable names: State bits Q_{numBits-1}...Q_0, followed by inputs X_0...
  const stateVarNames: string[] = []
  for (let i = numBits - 1; i >= 0; i--) {
    stateVarNames.push(`Q${i}`)
  }
  const allVarNames = [...stateVarNames, ...inputNames]
  const totalVars = allVarNames.length

  const equations: NextStateEquation[] = []

  // 1. Equations for each Next State Flip-Flop D_k
  for (let bitIdx = 0; bitIdx < numBits; bitIdx++) {
    // In code string, index 0 is MSB, numBits-1 is LSB
    const bitVarName = `D${numBits - 1 - bitIdx}`
    const minterms: number[] = []

    rows.forEach((row, rowIdx) => {
      const bitVal = row.nextStateCode[bitIdx]
      if (bitVal === '1') {
        minterms.push(rowIdx)
      }
    })

    if (minterms.length === 0) {
      equations.push({ variable: bitVarName, sop: '0' })
    } else if (minterms.length === (1 << totalVars)) {
      equations.push({ variable: bitVarName, sop: '1' })
    } else {
      const pis = findPrimeImplicants(minterms, [], totalVars, allVarNames)
      const { cover } = selectMinimalCover(pis, minterms)
      equations.push({ variable: bitVarName, sop: toSOP(cover) })
    }
  }

  // 2. Equations for each Output variable
  for (const outName of outputNames) {
    const minterms: number[] = []

    rows.forEach((row, rowIdx) => {
      if (row.outputs[outName] === 1) {
        minterms.push(rowIdx)
      }
    })

    if (minterms.length === 0) {
      equations.push({ variable: outName, sop: '0' })
    } else if (minterms.length === (1 << totalVars)) {
      equations.push({ variable: outName, sop: '1' })
    } else {
      const pis = findPrimeImplicants(minterms, [], totalVars, allVarNames)
      const { cover } = selectMinimalCover(pis, minterms)
      equations.push({ variable: outName, sop: toSOP(cover) })
    }
  }

  return equations
}
