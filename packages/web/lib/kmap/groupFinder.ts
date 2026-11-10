import type { Implicant, KMapGroup } from './types'

const GROUP_COLORS = [
  '#ef4444', // red
  '#3b82f6', // blue
  '#22c55e', // green
  '#f59e0b', // amber
  '#a855f7', // purple
  '#06b6d4', // cyan
  '#f97316', // orange
  '#ec4899', // pink
]

/**
 * Convert minimal cover and essential PIs into KMapGroup[] for rendering.
 */
export function buildKMapGroups(
  cover: Implicant[],
  essential: Implicant[]
): KMapGroup[] {
  const essentialExprs = new Set(essential.map((pi) => pi.expression))

  return cover.map((pi, i) => ({
    id: `group-${i}-${pi.expression}`,
    implicant: pi,
    color: GROUP_COLORS[i % GROUP_COLORS.length]!,
    isEssential: essentialExprs.has(pi.expression),
    cells: pi.allCells,
  }))
}

