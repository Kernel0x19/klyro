'use client'
import type { CellValue, KMapGroup } from '@/lib/kmap/types'
import { useKMapStore } from '@/stores/useKMapStore'

interface KMapCellProps {
  minterm: number
  value: CellValue
  groups: KMapGroup[]
  onToggle: () => void
  cellSize?: number
}

export default function KMapCell({ minterm, value, groups, onToggle, cellSize = 88 }: KMapCellProps) {
  const cellGroups = groups.filter((g) => g.cells.includes(minterm))
  const hoveredMinterm = useKMapStore((s) => s.hoveredMinterm)
  const isFromTruthTable = hoveredMinterm === minterm

  return (
    <td
      onClick={onToggle}
      title={`m${minterm}`}
      className={`border text-center cursor-pointer select-none relative align-middle transition-colors duration-150 ${
        isFromTruthTable
          ? 'border-neutral-400 bg-white/[0.06] z-10'
          : 'border-neutral-700 hover:border-neutral-500 hover:bg-white/[0.02]'
      }`}
      style={{ width: cellSize, height: cellSize, minWidth: cellSize, minHeight: cellSize }}
    >
      {/* Group background tints (layered) */}
      {cellGroups.map((g, i) => (
        <div
          key={g.id}
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: g.color, opacity: 0.08 + i * 0.03 }}
        />
      ))}

      {/* Minterm number (tiny, top-left) */}
      <span className="absolute top-1 left-1.5 text-[10px] font-mono text-neutral-400 dark:text-neutral-500 select-none z-10 pointer-events-none">
        {minterm}
      </span>

      {/* Cell value */}
      <span
        className={`relative z-10 text-2xl font-bold font-mono transition-colors pointer-events-none ${
          value === 1
            ? 'text-green-400'
            : value === 'X'
              ? 'text-amber-400'
              : 'text-text-secondary'
        }`}
      >
        {value === 'X' ? 'X' : String(value)}
      </span>
    </td>
  )
}

