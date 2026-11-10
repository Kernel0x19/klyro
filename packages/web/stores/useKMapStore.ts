'use client'
import { create } from 'zustand'
import type { CellValue, Implicant, KMapGroup } from '@/lib/kmap/types'
import { findPrimeImplicants } from '@/lib/kmap/quineMcCluskey'
import { selectMinimalCover } from '@/lib/kmap/petrick'
import { toSOP, toPOS } from '@/lib/kmap/expressionBuilder'
import { buildKMapGroups } from '@/lib/kmap/groupFinder'

// ── Types ─────────────────────────────────────────────────────────────────────

type VarCount = 2 | 3 | 4

interface KMapState {
  variables: VarCount
  variableNames: string[]  // always length 4; slice to `variables` when needed
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

  // Actions
  setVariables: (n: VarCount) => void
  setVariableName: (index: number, name: string) => void
  toggleCell: (minterm: number) => void
  setCellValue: (minterm: number, val: CellValue) => void
  reset: () => void
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

  return {
    minterms,
    dontCares,
    maxterms,
    primeImplicants: sopPIs,
    essentialPIs: essential,
    minimalSOP,
    minimalPOS,
    groups,
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

const DEFAULT_VAR_NAMES = ['A', 'B', 'C', 'D']
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
  }
})

