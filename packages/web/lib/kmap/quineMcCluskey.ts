/**
 * Klyro — Quine-McCluskey Algorithm
 *
 * Implements tabular minimization for Boolean functions:
 * 1. Groups minterms and don't-cares by count of 1s (Hamming weight).
 * 2. Systematically combines adjacent terms differing by exactly a power of 2 (one variable).
 * 3. Tracks uncombined terms across reduction passes to yield all Prime Implicants (PIs).
 * 4. Produces algebraic Sum-of-Products (SOP) literals (e.g. A'B + CD).
 */

import type { Implicant } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Checks whether an integer is an exact power of two (has exactly one bit set).
 */
function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

/**
 * Builds the algebraic Sum-of-Products literal string for an individual prime implicant.
 *
 * Bit interpretation:
 * - Bit set in `mask`: Variable is eliminated (don't care / does not appear).
 * - Bit set in `value` (with mask=0): Variable appears in uncomplemented form (`A`).
 * - Bit clear in `value` (with mask=0): Variable appears in complemented form (`A'`).
 *
 * @param value Bit values representing the fixed literals
 * @param mask Bit mask of eliminated variables
 * @param numVars Total number of variables in the Boolean function
 * @param varNames Variable labels (e.g., ['A', 'B', 'C', 'D'])
 * @returns Algebraic product term string (e.g., "AB'", "Q0'X")
 */
export function buildSOPTerm(
  value: number,
  mask: number,
  numVars: number,
  varNames: string[]
): string {
  const terms: string[] = []
  for (let i = 0; i < numVars; i++) {
    const bit = 1 << (numVars - 1 - i)
    if (mask & bit) continue
    const name = varNames[i] ?? String.fromCharCode(65 + i)
    terms.push(value & bit ? name : name + "'")
  }
  return terms.length === 0 ? '1' : terms.join('')
}

// ── Core QM Data Structures ──────────────────────────────────────────────────

/**
 * Internal representation of a term during the reduction passes.
 */
interface RawImpl {
  /** Literal values of non-masked bits */
  value: number
  /** Bitmask where 1 indicates an eliminated (dash) variable */
  mask: number
  /** All fundamental minterm indices subsumed by this implicant */
  allMinterms: number[]
  /** Flag marking whether this term successfully combined with another in the current pass */
  combined: boolean
}

// ── Main Export ──────────────────────────────────────────────────────────────

/**
 * Identifies all Prime Implicants of a Boolean function using the Quine-McCluskey tabular reduction.
 *
 * @param minterms Array of required minterm decimal indices (f=1)
 * @param dontCares Array of don't-care decimal indices (f=X)
 * @param numVars Total number of Boolean variables
 * @param varNames Array of variable names in MSB to LSB order
 * @returns Complete list of unique prime implicants covering at least one true minterm
 */
export function findPrimeImplicants(
  minterms: number[],
  dontCares: number[],
  numVars: number,
  varNames: string[]
): Implicant[] {
  const all = [...new Set([...minterms, ...dontCares])]
  const mintermSet = new Set(minterms)

  if (all.length === 0) return []

  // Initialize Pass 0: 0th-order implicants (individual minterm cells)
  let current: RawImpl[] = all.map((m) => ({
    value: m,
    mask: 0,
    allMinterms: [m],
    combined: false,
  }))

  const primeImplicants: RawImpl[] = []

  // Iteratively combine terms differing by single literals (powers of 2)
  while (current.length > 0) {
    const next: RawImpl[] = []
    const seen = new Set<string>()

    // Reset combined flags
    for (const impl of current) impl.combined = false

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i] as RawImpl
        const b = current[j] as RawImpl

        // Can only combine terms with identical dash masks
        if (a.mask !== b.mask) continue
        const diff = a.value ^ b.value
        // Must differ by exactly one binary variable
        if (!isPowerOfTwo(diff)) continue

        const newValue = a.value & b.value
        const newMask = a.mask | diff
        const key = `${newValue}|${newMask}`

        if (!seen.has(key)) {
          seen.add(key)
          next.push({
            value: newValue,
            mask: newMask,
            allMinterms: [...new Set([...a.allMinterms, ...b.allMinterms])],
            combined: false,
          })
        }
        ;(current[i] as RawImpl).combined = true
        ;(current[j] as RawImpl).combined = true
      }
    }

    // Any term that could not be combined with any neighbor is a Prime Implicant
    for (const impl of current) {
      if (!impl.combined) primeImplicants.push(impl)
    }

    current = next
  }

  // Deduplicate Prime Implicants
  const seen = new Set<string>()
  const uniquePIs: RawImpl[] = []
  for (const pi of primeImplicants) {
    const key = `${pi.value}|${pi.mask}`
    if (!seen.has(key)) {
      seen.add(key)
      uniquePIs.push(pi)
    }
  }

  // Filter out PIs that only cover don't-cares (must cover at least one real minterm)
  return uniquePIs
    .filter((pi) => pi.allMinterms.some((m) => mintermSet.has(m)))
    .map((pi) => ({
      minterms: pi.allMinterms.filter((m) => mintermSet.has(m)),
      allCells: pi.allMinterms,
      mask: pi.mask,
      value: pi.value,
      variables: numVars,
      expression: buildSOPTerm(pi.value, pi.mask, numVars, varNames),
    }))
}

