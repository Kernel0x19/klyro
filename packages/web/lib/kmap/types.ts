export type CellValue = 0 | 1 | 'X'

export interface Implicant {
  minterms: number[]  // real minterms only (not don't-cares), used for coverage
  allCells: number[]  // minterms + don't-cares, used for visual overlay
  mask: number        // bits where grouping occurred (1 = merged / free bit)
  value: number       // representative value (merged bits = 0)
  variables: number
  expression: string  // SOP term string e.g. "A'B"
}

export interface KMapGroup {
  id: string
  implicant: Implicant
  color: string
  isEssential: boolean
  cells: number[]  // allCells — for rendering on grid
}

export interface GroupRect {
  rowStart: number
  rowEnd: number
  colStart: number
  colEnd: number
  /** For 5-var maps: which half-map does this rect belong to (0 = E=0, 1 = E=1) */
  half?: 0 | 1
}

/** Serialisable K-Map snapshot — stored in Supabase alongside board_state */
export interface SavedKMapState {
  version: '1.0'
  variables: 2 | 3 | 4 | 5
  variableNames: string[]
  cellValues: (0 | 1 | 'X')[]
}

