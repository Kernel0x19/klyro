'use client'
import { useKMapStore } from '@/stores/useKMapStore'
import { getGrayOrder, getMintermAt5, getGroupRects5 } from '@/lib/kmap/kMapLayout'
import KMapCell from './KMapCell'

const HEADER_W = 60
const HEADER_H = 44
const CELL_W = 74
const CELL_H = 74

/** Single 4×4 half-map for E=0 or E=1 */
function HalfMap({ half }: { half: 0 | 1 }) {
  const { variableNames, cellValues, groups, toggleCell, hoveredGroupId, setHoveredGroupId } = useKMapStore()
  const v = (i: number) => variableNames[i] ?? String.fromCharCode(65 + i)

  const rowGray = getGrayOrder(2) // AB: [0,1,3,2]
  const colGray = getGrayOrder(2) // CD: [0,1,3,2]
  const rowLabel = v(0) + v(1)
  const colLabel = v(2) + v(3)

  // Build 5-var group rects for this half
  const halfRects = groups.flatMap((group, groupIdx) => {
    const rects = getGroupRects5(group.cells)
    const matching = rects.filter((r) => r.half === half)
    return matching.map((r, ri) => ({
      ...r,
      color: group.color,
      isEssential: group.isEssential,
      id: group.id,
      groupNumber: group.groupNumber ?? groupIdx + 1,
      expression: group.implicant.expression,
      isPrimary: ri === 0,
    }))
  })

  const handleSvgClick = (e: React.MouseEvent<SVGElement>) => {
    const svg = e.currentTarget.ownerSVGElement || (e.currentTarget as unknown as SVGSVGElement)
    const rect = svg.getBoundingClientRect()
    const relX = e.clientX - rect.left - HEADER_W
    const relY = e.clientY - rect.top - HEADER_H

    if (relX < 0 || relY < 0) return
    const col = Math.floor(relX / CELL_W)
    const row = Math.floor(relY / CELL_H)

    if (row >= 0 && row < 4 && col >= 0 && col < 4) {
      const minterm = getMintermAt5(row, col, half)
      toggleCell(minterm)
    }
  }

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

            const isHovered = hoveredGroupId === rect.id
            const badgeText = w < 60 ? `G${rect.groupNumber}` : `Group ${rect.groupNumber}`
            const badgeW = w < 60 ? 26 : 52
            const badgeH = 18
            const badgeX = x + w - badgeW - 4
            const badgeY = y + 4

            const tooltipText = `Group ${rect.groupNumber}: ${rect.expression}`
            const tooltipW = Math.max(80, tooltipText.length * 7 + 24)
            const tooltipX = Math.max(tooltipW / 2 + 6, Math.min(svgW - tooltipW / 2 - 6, x + w / 2))
            const tooltipY = Math.max(22, y - 4)

            return (
              <g
                key={`${rect.id}-${ri}`}
                className="transition-all duration-150"
                style={{ zIndex: isHovered ? 30 : 10 }}
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  rx={9}
                  ry={9}
                  fill={rect.color}
                  fillOpacity={isHovered ? 0.28 : 0.12}
                  stroke={rect.color}
                  strokeWidth={isHovered ? 3.5 : 2.5}
                  strokeOpacity={rect.isEssential ? 1 : isHovered ? 0.95 : 0.55}
                  strokeDasharray={rect.isEssential ? undefined : '5 3'}
                  className="transition-all duration-150 cursor-pointer pointer-events-auto"
                  onMouseEnter={() => setHoveredGroupId(rect.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  onClick={handleSvgClick}
                />

                {/* Group Number Badge */}
                {rect.isPrimary && (
                  <g
                    className="pointer-events-auto cursor-pointer select-none transition-all duration-150"
                    onMouseEnter={() => setHoveredGroupId(rect.id)}
                    onMouseLeave={() => setHoveredGroupId(null)}
                    onClick={handleSvgClick}
                  >
                    <rect
                      x={badgeX}
                      y={badgeY}
                      width={badgeW}
                      height={badgeH}
                      rx={4}
                      fill={rect.color}
                      fillOpacity={isHovered ? 1 : 0.88}
                      stroke="#ffffff"
                      strokeWidth={isHovered ? 1.5 : 0.75}
                      strokeOpacity={isHovered ? 1 : 0.75}
                    />
                    <text
                      x={badgeX + badgeW / 2}
                      y={badgeY + badgeH / 2 + 3.5}
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="9.5"
                      fontWeight="700"
                      fontFamily="ui-monospace, monospace"
                    >
                      {badgeText}
                    </text>
                  </g>
                )}

                {/* Hover Tooltip */}
                {isHovered && rect.isPrimary && (
                  <g className="pointer-events-none transition-all duration-150" style={{ zIndex: 50 }}>
                    <rect
                      x={tooltipX - tooltipW / 2}
                      y={tooltipY - 20}
                      width={tooltipW}
                      height={20}
                      rx={5}
                      fill="#18181b"
                      stroke={rect.color}
                      strokeWidth={1.5}
                    />
                    <circle
                      cx={tooltipX - tooltipW / 2 + 8}
                      cy={tooltipY - 10}
                      r={3}
                      fill={rect.color}
                    />
                    <text
                      x={tooltipX - tooltipW / 2 + 15}
                      y={tooltipY - 6.5}
                      fill="#ffffff"
                      fontSize="10"
                      fontWeight="700"
                      fontFamily="ui-monospace, monospace"
                    >
                      {tooltipText}
                    </text>
                  </g>
                )}
              </g>
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

