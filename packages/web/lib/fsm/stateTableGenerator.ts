/**
 * Klyro — FSM State Table & Logic Equation Derivation
 *
 * Implements truth table synthesis and Boolean equation derivation for Finite State Machines:
 * - Condition parser: Evaluates input conditions ("X=1", "X & !Y", "~X", "always", etc.)
 * - Cartesian combination generator for input vectors
 * - State transition table generation with Mealy and Moore output resolution
 * - Logic minimization: Derives minimal Sum-of-Products (SOP) next-state excitation equations
 *   for D flip-flops (D0, D1, ...) and outputs (Z0, Z1, ...) using Quine-McCluskey and Petrick's method.
 */

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

/** Maximum number of variables for which full don't-care minterm expansion is computed (10 vars = 1024 cells) */
const MAX_VARS_FOR_DONT_CARE_EXPANSION = 10

/**
 * Checks whether a given input variable assignment satisfies a transition condition string.
 *
 * Supported formats:
 * - Empty string, `"1"`, `"always"`, or `"true"` -> unconditionally satisfied
 * - Explicit equality: `"X=1"`, `"X=0"`, `"m=1"`, `"m=0"`
 * - Negation operators: `"!X"`, `"~X"` (evaluates to true when X is 0)
 * - Positive assertion: `"X"` (evaluates to true when X is 1)
 * - Conjunctions: Comma- or ampersand-separated clauses like `"X=1, Y=0"` or `"X & !Y"`
 *
 * @param condition Transition condition expression
 * @param inputs Current binary assignment of input variables
 * @returns `true` if all clauses match the input state; `false` otherwise
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
 * Generates the full Cartesian combination table of binary assignments for a list of input variables.
 * For example: `['X', 'Y']` -> `[{X:0, Y:0}, {X:0, Y:1}, {X:1, Y:0}, {X:1, Y:1}]`.
 *
 * @param inputNames List of input variable names
 * @returns Array of input combination dictionaries of length 2^(inputNames.length)
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

/**
 * Synthesizes a tabular State Transition Table from FSM states, transitions, and inputs.
 *
 * For each present state and each possible input combination:
 * 1. Finds the matching outgoing transition whose condition is satisfied
 * 2. Determines the next state (defaults to self-loop if no transition fires)
 * 3. Resolves output variables (state-dependent for Moore, transition-dependent for Mealy)
 *
 * @param states List of states in the FSM
 * @param transitions List of directed transitions between states
 * @param inputNames Active input variables
 * @param outputNames Active output variables
 * @param machineType 'mealy' or 'moore'
 * @param encoding State encoding scheme ('binary', 'gray', or 'one-hot')
 * @returns Table rows, number of state flip-flop bits, and binary encoding map
 */
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
          // Moore machine: outputs depend exclusively on present state
          outputs[outName] = state.mooreOutputs[outName] ?? 0
        } else {
          // Mealy machine: outputs depend on present state AND inputs (associated with transition)
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
 * Derives minimal Boolean Sum-of-Products (SOP) equations for each Next State bit (D_k)
 * and each Output variable (Z_m) using Quine-McCluskey minimization and Petrick's cover algorithm.
 *
 * Minterm addressing strictly matches the concatenated binary vector:
 * [ Q_{numBits-1} ... Q_0 , X_0 ... X_{n-1} ]
 * Unused state codes are treated as Don't Cares (d) to maximize logic simplification.
 *
 * @param rows Generated State Transition Table rows
 * @param numBits Number of state register bits (flip-flops)
 * @param inputNames Input variable names
 * @param outputNames Output variable names
 * @returns Array of minimal SOP equations for each flip-flop input and output
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

  /**
   * Helper: Computes the exact binary minterm number for a given row.
   * Encodes presentStateCode bits concatenated with input bits.
   */
  const getRowMinterm = (row: StateTableRow): number => {
    let m = 0
    for (let i = 0; i < numBits; i++) {
      const bit = row.presentStateCode[i] === '1' ? 1 : 0
      m = (m << 1) | bit
    }
    for (const name of inputNames) {
      const bit = (row.inputs[name] ?? 0) === 1 ? 1 : 0
      m = (m << 1) | bit
    }
    return m
  }

  // Identify all valid assigned minterm addresses and unused states (Don't Cares)
  const validMinterms = new Set<number>()
  rows.forEach((row) => validMinterms.add(getRowMinterm(row)))

  const dontCares: number[] = []
  // Only compute full don't-cares when totalVars is reasonable (<= 10 vars = 1024 cells)
  if (totalVars <= MAX_VARS_FOR_DONT_CARE_EXPANSION) {
    const totalPossible = 1 << totalVars
    for (let m = 0; m < totalPossible; m++) {
      if (!validMinterms.has(m)) {
        dontCares.push(m)
      }
    }
  }

  const equations: NextStateEquation[] = []

  // 1. Equations for each Next State Flip-Flop D_k (D0, D1, ...)
  for (let bitIdx = 0; bitIdx < numBits; bitIdx++) {
    // In code string, index 0 is MSB, numBits-1 is LSB
    const bitVarName = `D${numBits - 1 - bitIdx}`
    const minterms: number[] = []

    rows.forEach((row) => {
      const bitVal = row.nextStateCode[bitIdx]
      if (bitVal === '1') {
        minterms.push(getRowMinterm(row))
      }
    })

    if (minterms.length === 0) {
      equations.push({ variable: bitVarName, sop: '0' })
    } else if (
      totalVars <= MAX_VARS_FOR_DONT_CARE_EXPANSION &&
      minterms.length + dontCares.length === (1 << totalVars)
    ) {
      equations.push({ variable: bitVarName, sop: '1' })
    } else {
      const pis = findPrimeImplicants(minterms, dontCares, totalVars, allVarNames)
      const { cover } = selectMinimalCover(pis, minterms)
      equations.push({ variable: bitVarName, sop: toSOP(cover) })
    }
  }

  // 2. Equations for each Output variable (Z0, Z1, ...)
  for (const outName of outputNames) {
    const minterms: number[] = []

    rows.forEach((row) => {
      if (row.outputs[outName] === 1) {
        minterms.push(getRowMinterm(row))
      }
    })

    if (minterms.length === 0) {
      equations.push({ variable: outName, sop: '0' })
    } else if (
      totalVars <= MAX_VARS_FOR_DONT_CARE_EXPANSION &&
      minterms.length + dontCares.length === (1 << totalVars)
    ) {
      equations.push({ variable: outName, sop: '1' })
    } else {
      const pis = findPrimeImplicants(minterms, dontCares, totalVars, allVarNames)
      const { cover } = selectMinimalCover(pis, minterms)
      equations.push({ variable: outName, sop: toSOP(cover) })
    }
  }

  return equations
}

