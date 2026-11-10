'use client'
import { useKMapStore } from '@/stores/useKMapStore'
import { getGrayOrder, getMintermAt5, getGroupRects5 } from '@/lib/kmap/kMapLayout'
import KMapCell from './KMapCell'

const HEADER_W = 56
const HEADER_H = 40
const CELL_W = 60
const CELL_H = 60

/** Single 4×4 half-map for E=0 or E=1 */
function HalfMap({ half }: { half: 0 | 1 }) {
  const { variableNames, cellValues, groups, toggleCell } = useKMapStore()
  const v = (i: number) => variableNames[i] ?? String.fromCharCode(65 + i)

  const rowGray = getGrayOrder(2) // AB: [0,1,3,2]
  const colGray = getGrayOrder(2) // CD: [0,1,3,2]
  const rowLabel = v(0) + v(1)
  const colLabel = v(2) + v(3)

  // Build 5-var group rects for this half
  const halfRects = groups.flatMap((group) => {
    const rects = getGroupRects5(group.cells)
    return rects
      .filter((r) => r.half === half)
      .map((r) => ({ ...r, color: group.color, isEssential: group.isEssential, id: group.id }))
  })

  const svgW = HEADER_W + 4 * CELL_W
  const svgH = HEADER_H + 4 * CELL_H

  return (
    <div className="flex flex-col items-center gap-1">
      {/* E label */}
      <span className="text-xs font-mono font-bold text-text-primary tracking-wider">
        {v(4)} = {half}
      </span>

      <div className="relative inline-block">
        <table className="border-collapse" style={{ tableLayout: 'fixed' }}>
          <thead>
            <tr>
              <th
                className="text-[12px] font-mono font-bold text-text-primary border border-neutral-700 bg-surface relative"
                style={{ width: HEADER_W, height: HEADER_H }}
              >
                <span className="absolute bottom-1 left-1">{rowLabel}</span>
                <span className="absolute top-1 right-1">{colLabel}</span>
                <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none">
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1" className="text-neutral-400 dark:text-neutral-600" />
                </svg>
              </th>
              {colGray.map((cg, ci) => (
                <th
                  key={ci}
                  className="border border-neutral-700 bg-surface text-center"
                  style={{ width: CELL_W, height: HEADER_H }}
                >
                  <span className="text-[12px] font-mono font-bold text-text-primary">
                    {cg.toString(2).padStart(2, '0')}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rowGray.map((rg, ri) => (
              <tr key={ri}>
                <th
                  className="border border-neutral-700 bg-surface text-center"
                  style={{ width: HEADER_W, height: CELL_H }}
                >
                  <span className="text-[12px] font-mono font-bold text-text-primary">
                    {rg.toString(2).padStart(2, '0')}
                  </span>
                </th>
                {colGray.map((_, ci) => {
                  const minterm = getMintermAt5(ri, ci, half)
                  return (
                    <KMapCell
                      key={ci}
                      minterm={minterm}
                      value={cellValues[minterm] ?? 0}
                      groups={groups}
                      onToggle={() => toggleCell(minterm)}
                      cellSize={CELL_W}
                    />
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Group overlay SVG */}
        <svg
          width={svgW}
          height={svgH}
          className="absolute inset-0 pointer-events-none"
          style={{ top: 0, left: 0, overflow: 'visible' }}
        >
          {halfRects.map((rect, ri) => {
            const PAD = 4
            const x = HEADER_W + rect.colStart * CELL_W + PAD
            const y = HEADER_H + rect.rowStart * CELL_H + PAD
            const w = (rect.colEnd - rect.colStart + 1) * CELL_W - PAD * 2
            const h = (rect.rowEnd - rect.rowStart + 1) * CELL_H - PAD * 2
            return (
              <rect
                key={`${rect.id}-${ri}`}
                x={x} y={y} width={w} height={h}
                rx={9} ry={9}
                fill={rect.color} fillOpacity={0.12}
                stroke={rect.color} strokeWidth={2.5}
                strokeOpacity={rect.isEssential ? 0.9 : 0.5}
                strokeDasharray={rect.isEssential ? undefined : '5 3'}
              />
            )
          })}
        </svg>
      </div>
    </div>
  )
}

export default function KMapGrid5() {
  return (
    <div className="flex items-start gap-6">
      <HalfMap half={0} />
      {/* Visual separator */}
      <div className="self-center w-px h-32 bg-border-theme mt-6" />
      <HalfMap half={1} />
    </div>
  )
}

