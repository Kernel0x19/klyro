'use client'
import React from 'react'
import type { KMapGroup } from '@/lib/kmap/types'
import { getGroupRects, getMintermAt } from '@/lib/kmap/kMapLayout'
import { useKMapStore } from '@/stores/useKMapStore'

// Fixed dimensions — must match KMapGrid cell sizes
const CELL_W = 88
const CELL_H = 88
const HEADER_W = 64 // row header column width
const HEADER_H = 48 // col header row height
const PAD = 6 // inset padding for each rect

interface GroupOverlayProps {
  groups: KMapGroup[]
  numVars: 2 | 3 | 4
}

export default function GroupOverlay({ groups, numVars }: GroupOverlayProps) {
  const numRows = numVars === 4 ? 4 : 2
  const numCols = numVars === 2 ? 2 : 4

  const svgW = HEADER_W + numCols * CELL_W
  const svgH = HEADER_H + numRows * CELL_H

  const hoveredGroupId = useKMapStore((s) => s.hoveredGroupId)
  const setHoveredGroupId = useKMapStore((s) => s.setHoveredGroupId)
  const toggleCell = useKMapStore((s) => s.toggleCell)

  const handleSvgClick = (e: React.MouseEvent<SVGElement>) => {
    const svg = e.currentTarget.ownerSVGElement || (e.currentTarget as unknown as SVGSVGElement)
    const rect = svg.getBoundingClientRect()
    const relX = e.clientX - rect.left - HEADER_W
    const relY = e.clientY - rect.top - HEADER_H

    if (relX < 0 || relY < 0) return
    const col = Math.floor(relX / CELL_W)
    const row = Math.floor(relY / CELL_H)

    if (row >= 0 && row < numRows && col >= 0 && col < numCols) {
      const minterm = getMintermAt(row, col, numVars)
      toggleCell(minterm)
    }
  }

  return (
    <svg
      width={svgW}
      height={svgH}
      className="absolute inset-0 pointer-events-none"
      style={{ top: 0, left: 0, overflow: 'visible' }}
    >
      {groups.map((group, groupIdx) => {
        const groupNumber = group.groupNumber ?? groupIdx + 1
        const isHovered = hoveredGroupId === group.id
        const rects = getGroupRects(group.cells, numVars)

        return rects.map((rect, ri) => {
          const x = HEADER_W + rect.colStart * CELL_W + PAD
          const y = HEADER_H + rect.rowStart * CELL_H + PAD
          const w = (rect.colEnd - rect.colStart + 1) * CELL_W - PAD * 2
          const h = (rect.rowEnd - rect.rowStart + 1) * CELL_H - PAD * 2

          const isPrimary = ri === 0
          const badgeText = w < 65 ? `G${groupNumber}` : `Group ${groupNumber}`
          const badgeW = w < 65 ? 28 : 58
          const badgeH = 19
          const badgeX = x + w - badgeW - 6
          const badgeY = y + 6

          const tooltipText = `Group ${groupNumber}: ${group.implicant.expression}`
          const tooltipW = Math.max(90, tooltipText.length * 7.5 + 28)
          const tooltipX = Math.max(tooltipW / 2 + 10, Math.min(svgW - tooltipW / 2 - 10, x + w / 2))
          const tooltipY = Math.max(26, y - 6)

          return (
            <g
              key={`${group.id}-${ri}`}
              className="transition-all duration-150"
              style={{ zIndex: isHovered ? 30 : 10 }}
            >
              {/* Group boundary rectangle */}
              <rect
                x={x}
                y={y}
                width={w}
                height={h}
                rx={10}
                ry={10}
                fill={group.color}
                fillOpacity={isHovered ? 0.28 : 0.12}
                stroke={group.color}
                strokeWidth={isHovered ? 3.5 : 2.5}
                strokeOpacity={group.isEssential ? 1 : isHovered ? 0.95 : 0.55}
                strokeDasharray={group.isEssential ? undefined : '5 3'}
                className="transition-all duration-150 cursor-pointer pointer-events-auto"
                onMouseEnter={() => setHoveredGroupId(group.id)}
                onMouseLeave={() => setHoveredGroupId(null)}
                onClick={handleSvgClick}
              />

              {/* Group number badge on the primary rect */}
              {isPrimary && (
                <g
                  className="pointer-events-auto cursor-pointer select-none transition-all duration-150"
                  onMouseEnter={() => setHoveredGroupId(group.id)}
                  onMouseLeave={() => setHoveredGroupId(null)}
                  onClick={handleSvgClick}
                >
                  <rect
                    x={badgeX}
                    y={badgeY}
                    width={badgeW}
                    height={badgeH}
                    rx={5}
                    fill={group.color}
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
                    fontSize="10"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                  >
                    {badgeText}
                  </text>
                </g>
              )}

              {/* Hover Tooltip showing group number and expression */}
              {isHovered && isPrimary && (
                <g className="pointer-events-none transition-all duration-150" style={{ zIndex: 50 }}>
                  <rect
                    x={tooltipX - tooltipW / 2}
                    y={tooltipY - 22}
                    width={tooltipW}
                    height={22}
                    rx={6}
                    fill="#18181b"
                    stroke={group.color}
                    strokeWidth={1.5}
                  />
                  <circle
                    cx={tooltipX - tooltipW / 2 + 10}
                    cy={tooltipY - 11}
                    r={3.5}
                    fill={group.color}
                  />
                  <text
                    x={tooltipX - tooltipW / 2 + 18}
                    y={tooltipY - 7.5}
                    fill="#ffffff"
                    fontSize="11"
                    fontWeight="700"
                    fontFamily="ui-monospace, monospace"
                  >
                    {tooltipText}
                  </text>
                </g>
              )}
            </g>
          )
        })
      })}
    </svg>
  )
}
