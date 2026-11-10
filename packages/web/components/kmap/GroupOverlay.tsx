'use client'
import type { KMapGroup } from '@/lib/kmap/types'
import { getGroupRects } from '@/lib/kmap/kMapLayout'

// Fixed dimensions — must match KMapGrid cell sizes (w-14 = 56px)
const CELL_W = 56
const CELL_H = 56
const HEADER_W = 48  // row header column width
const HEADER_H = 32  // col header row height
const PAD = 5        // inset padding for each rect

interface GroupOverlayProps {
  groups: KMapGroup[]
  numVars: 2 | 3 | 4
}

export default function GroupOverlay({ groups, numVars }: GroupOverlayProps) {
  const numRows = numVars === 4 ? 4 : 2
  const numCols = numVars === 2 ? 2 : 4

  const svgW = HEADER_W + numCols * CELL_W
  const svgH = HEADER_H + numRows * CELL_H

  return (
    <svg
      width={svgW}
      height={svgH}
      className="absolute inset-0 pointer-events-none"
      style={{ top: 0, left: 0, overflow: 'visible' }}
    >
      {groups.map((group) => {
        const rects = getGroupRects(group.cells, numVars)
        return rects.map((rect, ri) => {
          const x = HEADER_W + rect.colStart * CELL_W + PAD
          const y = HEADER_H + rect.rowStart * CELL_H + PAD
          const w = (rect.colEnd - rect.colStart + 1) * CELL_W - PAD * 2
          const h = (rect.rowEnd - rect.rowStart + 1) * CELL_H - PAD * 2

          return (
            <g key={`${group.id}-${ri}`}>
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={10}
                ry={10}
                fill={group.color}
                fillOpacity={0.12}
                stroke={group.color}
                strokeWidth={2.5}
                strokeOpacity={group.isEssential ? 0.9 : 0.5}
                strokeDasharray={group.isEssential ? undefined : '5 3'}
              />
            </g>
          )
        })
      })}
    </svg>
  )
}

