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
}

