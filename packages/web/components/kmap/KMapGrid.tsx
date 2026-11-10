'use client'
import { useKMapStore } from '@/stores/useKMapStore'
import { getGrayOrder, getMintermAt } from '@/lib/kmap/kMapLayout'
import KMapCell from './KMapCell'
import GroupOverlay from './GroupOverlay'
import KMapGrid5 from './KMapGrid5'

// Header dimensions — must match GroupOverlay constants
const HEADER_W = 56
const HEADER_H = 40
const CELL_W = 68
const CELL_H = 68

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

  // 5-variable uses a separate two-map layout
  if (variables === 5) return <KMapGrid5 />

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
              className="text-[13px] font-mono font-bold text-text-primary border border-neutral-700 bg-surface relative"
              style={{ width: HEADER_W, height: HEADER_H }}
            >
              <span className="absolute bottom-1 left-1.5">{rowLabel}</span>
              <span className="absolute top-1 right-1.5">{colLabel}</span>
              {/* Diagonal line */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                preserveAspectRatio="none"
              >
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-neutral-400 dark:text-neutral-600" />
              </svg>
            </th>

            {/* Column headers */}
            {colGray.map((cg, ci) => (
              <th
                key={ci}
                className="border border-neutral-700 bg-surface text-center"
                style={{ width: CELL_W, height: HEADER_H }}
              >
                <span className="text-[13px] font-mono font-bold text-text-primary">
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
                <span className="text-[13px] font-mono font-bold text-text-primary">
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

