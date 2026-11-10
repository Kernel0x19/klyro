import type { Implicant } from './types'

export function selectMinimalCover(
  primeImplicants: Implicant[],
  minterms: number[]
): { essential: Implicant[]; cover: Implicant[] } {
  if (primeImplicants.length === 0 || minterms.length === 0) {
    return { essential: [], cover: [] }
  }

  // chart: minterm → list of PI indices
  const chart = new Map<number, number[]>()
  for (const m of minterms) chart.set(m, [])
  for (let i = 0; i < primeImplicants.length; i++) {
    for (const m of (primeImplicants[i] as Implicant).minterms) {
      const entry = chart.get(m)
      if (entry) entry.push(i)
    }
  }

  // Essential PIs: minterms covered by exactly one PI
  const essentialIdxs = new Set<number>()
  for (const [, pis] of chart) {
    if (pis.length === 1 && pis[0] !== undefined) essentialIdxs.add(pis[0])
  }

  const coveredByEssential = new Set<number>()
  for (const idx of essentialIdxs) {
    for (const m of (primeImplicants[idx] as Implicant).minterms) {
      coveredByEssential.add(m)
    }
  }

  const remaining = minterms.filter((m) => !coveredByEssential.has(m))

  if (remaining.length === 0) {
    const essential = [...essentialIdxs].map((i) => primeImplicants[i] as Implicant)
    return { essential, cover: essential }
  }

  // Petrick's method
  let products: number[][] = []
  for (const m of remaining) {
    const pis = (chart.get(m) ?? []).filter((i) => !essentialIdxs.has(i))
    if (pis.length === 0) continue

    if (products.length === 0) {
      products = pis.map((p) => [p])
    } else {
      const expanded: number[][] = []
      for (const existing of products) {
        for (const pi of pis) {
          const merged = [...new Set([...existing, pi])].sort((a, b) => a - b)
          expanded.push(merged)
        }
      }
      products = deduplicateAndAbsorb(expanded)
    }
  }

  let minCover: number[] = products[0] ?? []
  for (const p of products) {
    if (p.length < minCover.length) minCover = p
  }

  const essential = [...essentialIdxs].map((i) => primeImplicants[i] as Implicant)
  const additional = minCover
    .filter((i) => !essentialIdxs.has(i))
    .map((i) => primeImplicants[i] as Implicant)

  return { essential, cover: [...essential, ...additional] }
}

function deduplicateAndAbsorb(products: number[][]): number[][] {
  const seen = new Set<string>()
  const unique: number[][] = []
  for (const p of products) {
    const key = p.join(',')
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(p)
    }
  }
  return unique.filter(
    (a) =>
      !unique.some((b) => b !== a && b.length < a.length && b.every((x) => a.includes(x)))
  )
}
