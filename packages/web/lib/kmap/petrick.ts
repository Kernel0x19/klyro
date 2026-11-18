/**
 * Klyro — Petrick's Method for Minimal Prime Implicant Cover
 *
 * Given a set of Prime Implicants and target minterms:
 * 1. Identifies Essential Prime Implicants (EPIs): minterms covered by exactly one PI.
 * 2. Removes minterms covered by EPIs from the target set.
 * 3. Applies Petrick's algebraic distribution algorithm to find the absolute minimum
 *    number of additional prime implicants needed to cover all remaining minterms.
 * 4. Applies Boolean absorption laws (P + P·Q = P) to eliminate redundant product terms.
 */

import type { Implicant } from './types'

/**
 * Selects the minimal set of Prime Implicants that covers all target minterms.
 *
 * @param primeImplicants Full list of prime implicants computed by Quine-McCluskey
 * @param minterms Required minterms to be covered
 * @returns Both the essential prime implicants and the complete minimal cover
 */
export function selectMinimalCover(
  primeImplicants: Implicant[],
  minterms: number[]
): { essential: Implicant[]; cover: Implicant[] } {
  if (primeImplicants.length === 0 || minterms.length === 0) {
    return { essential: [], cover: [] }
  }

  // Prime Implicant Chart: minterm -> array of candidate PI indices covering it
  const chart = new Map<number, number[]>()
  for (const m of minterms) chart.set(m, [])
  for (let i = 0; i < primeImplicants.length; i++) {
    for (const m of (primeImplicants[i] as Implicant).minterms) {
      const entry = chart.get(m)
      if (entry) entry.push(i)
    }
  }

  // 1. Identify Essential PIs: any minterm covered by only one PI makes that PI essential
  const essentialIdxs = new Set<number>()
  for (const [, pis] of chart) {
    if (pis.length === 1 && pis[0] !== undefined) essentialIdxs.add(pis[0])
  }

  // Collect all minterms covered by the essential PIs
  const coveredByEssential = new Set<number>()
  for (const idx of essentialIdxs) {
    for (const m of (primeImplicants[idx] as Implicant).minterms) {
      coveredByEssential.add(m)
    }
  }

  // Identify remaining uncovered minterms
  const remaining = minterms.filter((m) => !coveredByEssential.has(m))

  // If essential PIs already cover all minterms, we are done
  if (remaining.length === 0) {
    const essential = [...essentialIdxs].map((i) => primeImplicants[i] as Implicant)
    return { essential, cover: essential }
  }

  // 2. Petrick's Method for remaining uncovered minterms:
  // Form POS: P = (P_a + P_b) * (P_c + P_d) ...
  // Expand to SOP and select the term with minimum length (fewest PIs)
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

  // Find the product term with the minimum number of prime implicants
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

/**
 * Deduplicates product terms and eliminates absorbed terms using the Boolean absorption law:
 * If term A is a subset of term B, term B is redundant and absorbed by A (A + AB = A).
 *
 * @param products Array of product terms (each term is an array of PI indices)
 * @returns Simplified array of minimal product terms
 */
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

