'use client'
import type { CellValue, KMapGroup } from '@/lib/kmap/types'

interface KMapCellProps {
  minterm: number
  value: CellValue
  groups: KMapGroup[]
  onToggle: () => void
}

export default function KMapCell({ minterm, value, groups, onToggle }: KMapCellProps) {
  const cellGroups = groups.filter((g) => g.cells.includes(minterm))

  return (
    <td
      onClick={onToggle}
      title={`m${minterm}`}
      className="border border-neutral-700 text-center cursor-pointer select-none relative align-middle"
      style={{ width: 68, height: 68, minWidth: 68, minHeight: 68 }}
    >
      {/* Group background tints (layered) */}
      {cellGroups.map((g, i) => (
        <div
          key={g.id}
          className="absolute inset-0"
          style={{ backgroundColor: g.color, opacity: 0.08 + i * 0.03 }}
        />
      ))}

      {/* Minterm number (tiny, top-left) */}
      <span className="absolute top-0.5 left-1 text-[9px] font-mono text-neutral-400 dark:text-neutral-600 select-none z-10">
        {minterm}
      </span>

      {/* Cell value */}
      <span
        className={`relative z-10 text-xl font-bold font-mono transition-colors ${
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

