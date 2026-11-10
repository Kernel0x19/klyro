'use client'
import { create } from 'zustand'
import type { CellValue, Implicant, KMapGroup, SavedKMapState } from '@/lib/kmap/types'
import { findPrimeImplicants, buildSOPTerm } from '@/lib/kmap/quineMcCluskey'
import { selectMinimalCover } from '@/lib/kmap/petrick'
import { toSOP, toPOS } from '@/lib/kmap/expressionBuilder'
import { buildKMapGroups } from '@/lib/kmap/groupFinder'

// ── Types ─────────────────────────────────────────────────────────────────────

export type VarCount = 2 | 3 | 4 | 5

interface KMapState {
  variables: VarCount
  variableNames: string[]  // always length 5; slice to `variables` when needed
  cellValues: CellValue[]  // length = 2^variables

  // Derived (recomputed on every change)
  minterms: number[]
  dontCares: number[]
  maxterms: number[]
  primeImplicants: Implicant[]
  essentialPIs: Implicant[]
  minimalSOP: string
  minimalPOS: string
  groups: KMapGroup[]

  // QM step-by-step working (for the step panel)
  qmSteps: QMStep[]

  // Actions
  setVariables: (n: VarCount) => void
  setVariableName: (index: number, name: string) => void
  toggleCell: (minterm: number) => void
  setCellValue: (minterm: number, val: CellValue) => void
  reset: () => void

  /** Parse a SOP string and fill in the K-Map cells that match the expression */
  loadFromSOP: (sop: string) => void

  /** Persistence: snapshot for Supabase */
  toSnapshot: () => SavedKMapState
  loadSnapshot: (snap: SavedKMapState) => void
}

// ── QM Steps ──────────────────────────────────────────────────────────────────

export interface QMStep {
  round: number
  /** Implicants produced in this round (before merging) */
  implicants: Array<{
    expression: string
    minterms: number[]
    merged: boolean
  }>
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDefaultCells(variables: VarCount): CellValue[] {
  return Array<CellValue>(1 << variables).fill(0)
}

function recompute(
  variables: VarCount,
  variableNames: string[],
  cellValues: CellValue[]
): Pick<
  KMapState,
  | 'minterms'
  | 'dontCares'
  | 'maxterms'
  | 'primeImplicants'
  | 'essentialPIs'
  | 'minimalSOP'
  | 'minimalPOS'
  | 'groups'
  | 'qmSteps'
> {
  const minterms: number[] = []
  const dontCares: number[] = []
  const maxterms: number[] = []

  for (let i = 0; i < cellValues.length; i++) {
    if (cellValues[i] === 1) minterms.push(i)
    else if (cellValues[i] === 'X') dontCares.push(i)
    else maxterms.push(i)
  }

  const names = variableNames.slice(0, variables)

  // SOP minimization
  const sopPIs = findPrimeImplicants(minterms, dontCares, variables, names)
  const { essential, cover } = selectMinimalCover(sopPIs, minterms)
  const minimalSOP = minterms.length === 0 ? '0' : toSOP(cover)

  // POS minimization (run QM on maxterms as "minterms of f'")
  const posPIs = findPrimeImplicants(maxterms, dontCares, variables, names)
  const { cover: posCover } = selectMinimalCover(posPIs, maxterms)
  const minimalPOS = maxterms.length === 0 ? '1' : toPOS(posCover, names)

  const groups = buildKMapGroups(cover, essential)

  // Build QM steps for the step-by-step panel
  const qmSteps = buildQMSteps(minterms, dontCares, variables, names)

  return {
    minterms,
    dontCares,
    maxterms,
    primeImplicants: sopPIs,
    essentialPIs: essential,
    minimalSOP,
    minimalPOS,
    groups,
    qmSteps,
  }
}

/** Re-runs QM and captures each merge round for display */
function buildQMSteps(
  minterms: number[],
  dontCares: number[],
  numVars: number,
  varNames: string[]
): QMStep[] {
  interface Raw { value: number; mask: number; allMinterms: number[]; combined: boolean }
  function isPow2(n: number) { return n > 0 && (n & (n - 1)) === 0 }
  const all = [...new Set([...minterms, ...dontCares])]
  if (all.length === 0) return []

  let current: Raw[] = all.map((m) => ({ value: m, mask: 0, allMinterms: [m], combined: false }))
  const steps: QMStep[] = []
  let round = 0

  while (current.length > 0) {
    const next: Raw[] = []
    const seen = new Set<string>()
    for (const impl of current) impl.combined = false

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i] as Raw
        const b = current[j] as Raw
        if (a.mask !== b.mask) continue
        const diff = a.value ^ b.value
        if (!isPow2(diff)) continue
        const key = `${a.value & b.value}|${a.mask | diff}`
        if (!seen.has(key)) {
          seen.add(key)
          next.push({ value: a.value & b.value, mask: a.mask | diff, allMinterms: [...new Set([...a.allMinterms, ...b.allMinterms])], combined: false })
        }
        ;(current[i] as Raw).combined = true
        ;(current[j] as Raw).combined = true
      }
    }

    steps.push({
      round,
      implicants: current.map((impl) => ({
        expression: buildSOPTerm(impl.value, impl.mask, numVars, varNames),
        minterms: impl.allMinterms,
        merged: impl.combined,
      })),
    })

    current = next
    round++
  }

  return steps
}

/**
 * Minimal SOP parser → cell values.
 * Supports terms like A'B, AB'C, etc. joined by " + ".
 * Sets matching minterms to 1, leaves others at 0.
 */
function parseSOP(sop: string, variables: VarCount, varNames: string[]): CellValue[] {
  const cells = makeDefaultCells(variables)
  const terms = sop.split('+').map((t) => t.trim()).filter(Boolean)
  const names = varNames.slice(0, variables)
  const total = 1 << variables

  for (const term of terms) {
    // Parse each literal: letter optionally followed by '
    const literalRe = /([A-Za-z]+)'?/g
    const constraints: { idx: number; val: number }[] = []
    let match: RegExpExecArray | null
    let pos = 0

    while ((match = literalRe.exec(term)) !== null) {
      const letter = match[0]!.replace("'", '')
      const complemented = match[0]!.endsWith("'")
      const idx = names.findIndex((n) => n.toUpperCase() === letter.toUpperCase())
      if (idx === -1) continue
      constraints.push({ idx, val: complemented ? 0 : 1 })
      pos = literalRe.lastIndex
    }
    void pos

    if (constraints.length === 0) continue

    // Find all minterms that satisfy every constraint
    for (let m = 0; m < total; m++) {
      let ok = true
      for (const { idx, val } of constraints) {
        const bit = 1 << (variables - 1 - idx)
        const mVal = (m & bit) ? 1 : 0
        if (mVal !== val) { ok = false; break }
      }
      if (ok) cells[m] = 1
    }
  }

  return cells
}

// ── Store ─────────────────────────────────────────────────────────────────────

const DEFAULT_VAR_NAMES = ['A', 'B', 'C', 'D', 'E']
const DEFAULT_VARS: VarCount = 4

export const useKMapStore = create<KMapState>((set, get) => {
  const initCells = makeDefaultCells(DEFAULT_VARS)
  const initDerived = recompute(DEFAULT_VARS, DEFAULT_VAR_NAMES, initCells)

  return {
    variables: DEFAULT_VARS,
    variableNames: [...DEFAULT_VAR_NAMES],
    cellValues: initCells,
    ...initDerived,

    setVariables: (n) => {
      const cellValues = makeDefaultCells(n)
      const { variableNames } = get()
      set({ variables: n, cellValues, ...recompute(n, variableNames, cellValues) })
    },

    setVariableName: (index, name) => {
      const variableNames = [...get().variableNames]
      variableNames[index] = name.slice(0, 2).toUpperCase() || (DEFAULT_VAR_NAMES[index] ?? 'A')
      const { variables, cellValues } = get()
      set({ variableNames, ...recompute(variables, variableNames, cellValues) })
    },

    toggleCell: (minterm) => {
      const { cellValues, variables, variableNames } = get()
      const cur = cellValues[minterm]
      const next: CellValue = cur === 0 ? 1 : cur === 1 ? 'X' : 0
      const newCells = [...cellValues]
      newCells[minterm] = next
      set({ cellValues: newCells, ...recompute(variables, variableNames, newCells) })
    },

    setCellValue: (minterm, val) => {
      const { cellValues, variables, variableNames } = get()
      const newCells = [...cellValues]
      newCells[minterm] = val
      set({ cellValues: newCells, ...recompute(variables, variableNames, newCells) })
    },

    reset: () => {
      const { variables, variableNames } = get()
      const cellValues = makeDefaultCells(variables)
      set({ cellValues, ...recompute(variables, variableNames, cellValues) })
    },

    loadFromSOP: (sop) => {
      const { variables, variableNames } = get()
      const cellValues = parseSOP(sop, variables, variableNames)
      set({ cellValues, ...recompute(variables, variableNames, cellValues) })
    },

    toSnapshot: (): SavedKMapState => {
      const { variables, variableNames, cellValues } = get()
      return {
        version: '1.0',
        variables,
        variableNames: [...variableNames],
        cellValues: [...cellValues] as (0 | 1 | 'X')[],
      }
    },

    loadSnapshot: (snap) => {
      const variables = snap.variables as VarCount
      const variableNames = snap.variableNames.length >= 5
        ? snap.variableNames
        : [...snap.variableNames, ...DEFAULT_VAR_NAMES.slice(snap.variableNames.length)]
      const cellValues = snap.cellValues as CellValue[]
      set({ variables, variableNames, cellValues, ...recompute(variables, variableNames, cellValues) })
    },
  }
})
