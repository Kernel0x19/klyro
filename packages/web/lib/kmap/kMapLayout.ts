import type { GroupRect } from './types'

// ── Grid configuration ────────────────────────────────────────────────────────

interface GridConfig {
  rowBits: number
  colBits: number
  numRows: number
  numCols: number
}

export function getGridConfig(numVars: 2 | 3 | 4): GridConfig {
  if (numVars === 2) return { rowBits: 1, colBits: 1, numRows: 2, numCols: 2 }
  if (numVars === 3) return { rowBits: 1, colBits: 2, numRows: 2, numCols: 4 }
  return { rowBits: 2, colBits: 2, numRows: 4, numCols: 4 }
}

// ── Gray code helpers ─────────────────────────────────────────────────────────

/** Returns the Gray-code-ordered values for k bits.
 *  e.g. getGrayOrder(2) → [0, 1, 3, 2]  (00, 01, 11, 10)
 */
export function getGrayOrder(numBits: number): number[] {
  const count = 1 << numBits
  return Array.from({ length: count }, (_, i) => i ^ (i >> 1))
}

// ── Coordinate conversion ─────────────────────────────────────────────────────

/**
 * Get the minterm number at grid position (rowIdx, colIdx).
 * rowIdx / colIdx are 0-based display indices.
 */
export function getMintermAt(rowIdx: number, colIdx: number, numVars: 2 | 3 | 4): number {
  const { colBits } = getGridConfig(numVars)
  const rowGray = rowIdx ^ (rowIdx >> 1)
  const colGray = colIdx ^ (colIdx >> 1)
  return (rowGray << colBits) | colGray
}

/**
 * Get the display grid position (rowIdx, colIdx) for a given minterm.
 */
export function getGridPosition(
  minterm: number,
  numVars: 2 | 3 | 4
): { row: number; col: number } {
  const { colBits, numRows, numCols } = getGridConfig(numVars)
  const colMask = (1 << colBits) - 1
  const rowVal = minterm >> colBits
  const colVal = minterm & colMask

  let row = 0
  let col = 0
  for (let ri = 0; ri < numRows; ri++) {
    if ((ri ^ (ri >> 1)) === rowVal) { row = ri; break }
  }
  for (let ci = 0; ci < numCols; ci++) {
    if ((ci ^ (ci >> 1)) === colVal) { col = ci; break }
  }
  return { row, col }
}

// ── Group rectangle calculation ───────────────────────────────────────────────

/**
 * Convert cell minterm indices into 1–4 GroupRects for SVG rendering.
 * Handles edge-wrapping and corner-wrapping groups.
 */
export function getGroupRects(cells: number[], numVars: 2 | 3 | 4): GroupRect[] {
  if (cells.length === 0) return []

  const { numRows, numCols } = getGridConfig(numVars)
  const positions = cells.map((m) => getGridPosition(m, numVars))
  const rows = [...new Set(positions.map((p) => p.row))].sort((a, b) => a - b)
  const cols = [...new Set(positions.map((p) => p.col))].sort((a, b) => a - b)

  const rowsWrap = isWrapping(rows, numRows)
  const colsWrap = isWrapping(cols, numCols)

  const rowMin = rows[0] ?? 0
  const rowMax = rows[rows.length - 1] ?? 0
  const colMin = cols[0] ?? 0
  const colMax = cols[cols.length - 1] ?? 0

  if (!rowsWrap && !colsWrap) {
    return [{ rowStart: rowMin, rowEnd: rowMax, colStart: colMin, colEnd: colMax }]
  }

  if (rowsWrap && !colsWrap) {
    const [loPart, hiPart] = splitWrapping(rows)
    return [
      { rowStart: hiPart[0] ?? 0, rowEnd: hiPart[hiPart.length - 1] ?? 0, colStart: colMin, colEnd: colMax },
      { rowStart: loPart[0] ?? 0, rowEnd: loPart[loPart.length - 1] ?? 0, colStart: colMin, colEnd: colMax },
    ]
  }

  if (!rowsWrap && colsWrap) {
    const [loPart, hiPart] = splitWrapping(cols)
    return [
      { rowStart: rowMin, rowEnd: rowMax, colStart: hiPart[0] ?? 0, colEnd: hiPart[hiPart.length - 1] ?? 0 },
      { rowStart: rowMin, rowEnd: rowMax, colStart: loPart[0] ?? 0, colEnd: loPart[loPart.length - 1] ?? 0 },
    ]
  }

  // Both wrap → up to 4 corner rectangles
  const [loRows, hiRows] = splitWrapping(rows)
  const [loCols, hiCols] = splitWrapping(cols)
  const rects: GroupRect[] = []
  for (const rPart of [hiRows, loRows]) {
    for (const cPart of [hiCols, loCols]) {
      rects.push({
        rowStart: rPart[0] ?? 0,
        rowEnd: rPart[rPart.length - 1] ?? 0,
        colStart: cPart[0] ?? 0,
        colEnd: cPart[cPart.length - 1] ?? 0,
      })
    }
  }
  return rects
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isWrapping(indices: number[], total: number): boolean {
  return (
    indices.length > 0 &&
    indices.includes(0) &&
    indices.includes(total - 1) &&
    indices.length < total
  )
}

function splitWrapping(sorted: number[]): [number[], number[]] {
  for (let i = 0; i < sorted.length - 1; i++) {
    if ((sorted[i + 1] ?? 0) - (sorted[i] ?? 0) > 1) {
      return [sorted.slice(0, i + 1), sorted.slice(i + 1)]
    }
  }
  return [sorted, []]
}
