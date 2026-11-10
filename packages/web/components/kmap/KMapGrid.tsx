'use client'
import { useKMapStore } from '@/stores/useKMapStore'
import { getGrayOrder, getMintermAt } from '@/lib/kmap/kMapLayout'
import KMapCell from './KMapCell'
import GroupOverlay from './GroupOverlay'

// Header dimensions — must match GroupOverlay constants
const HEADER_W = 48
const HEADER_H = 32
const CELL_W = 56
const CELL_H = 56

interface GridConfig {
  rowBits: number
  colBits: number
  rowLabel: string
  colLabel: string
}

function getConfig(variables: 2 | 3 | 4, varNames: string[]): GridConfig {
  const v = (i: number) => varNames[i] ?? String.fromCharCode(65 + i)
  if (variables === 2)
    return { rowBits: 1, colBits: 1, rowLabel: v(0), colLabel: v(1) }
  if (variables === 3)
    return {
      rowBits: 1,
      colBits: 2,
      rowLabel: v(0),
      colLabel: v(1) + v(2),
    }
  return {
    rowBits: 2,
    colBits: 2,
    rowLabel: v(0) + v(1),
    colLabel: v(2) + v(3),
  }
}

export default function KMapGrid() {
  const { variables, variableNames, cellValues, groups, toggleCell } = useKMapStore()

  const { rowBits, colBits, rowLabel, colLabel } = getConfig(variables, variableNames)
  const rowGray = getGrayOrder(rowBits)
  const colGray = getGrayOrder(colBits)

  return (
    <div className="relative inline-block">
      <table
        className="border-collapse"
        style={{ tableLayout: 'fixed' }}
      >
        <thead>
          <tr>
            {/* Top-left corner label */}
            <th
              className="text-[10px] font-mono font-semibold text-neutral-500 border border-neutral-700 bg-surface relative"
              style={{ width: HEADER_W, height: HEADER_H }}
            >
              <span className="absolute bottom-1 left-1">{rowLabel}</span>
              <span className="absolute top-1 right-1">{colLabel}</span>
              {/* Diagonal line */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="#404040" strokeWidth="1" />
              </svg>
            </th>

            {/* Column headers */}
            {colGray.map((cg, ci) => (
              <th
                key={ci}
                className="border border-neutral-700 bg-surface text-center"
                style={{ width: CELL_W, height: HEADER_H }}
              >
                <span className="text-[11px] font-mono font-bold text-neutral-400">
                  {cg.toString(2).padStart(colBits, '0')}
                </span>
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {rowGray.map((rg, ri) => (
            <tr key={ri}>
              {/* Row header */}
              <th
                className="border border-neutral-700 bg-surface text-center"
                style={{ width: HEADER_W, height: CELL_H }}
              >
                <span className="text-[11px] font-mono font-bold text-neutral-400">
                  {rg.toString(2).padStart(rowBits, '0')}
                </span>
              </th>

              {/* Cells */}
              {colGray.map((_, ci) => {
                const minterm = getMintermAt(ri, ci, variables)
                return (
                  <KMapCell
                    key={ci}
                    minterm={minterm}
                    value={cellValues[minterm] ?? 0}
                    groups={groups}
                    onToggle={() => toggleCell(minterm)}
                  />
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* SVG group overlay — rendered on top of the table */}
      <GroupOverlay groups={groups} numVars={variables} />
    </div>
  )
}

