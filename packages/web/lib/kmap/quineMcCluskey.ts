import type { Implicant } from './types'

// ── Helpers ──────────────────────────────────────────────────────────────────

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0
}

/** Build the SOP term string for one implicant.
 *  bit=1 in value → variable appears UNcomplemented (A)
 *  bit=0 in value → variable appears complemented (A')
 *  bit set in mask → variable is free (doesn't appear)
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

// ── Core QM data structure ────────────────────────────────────────────────────

interface RawImpl {
  value: number
  mask: number
  allMinterms: number[]
  combined: boolean
}

// ── Main export ───────────────────────────────────────────────────────────────

export function findPrimeImplicants(
  minterms: number[],
  dontCares: number[],
  numVars: number,
  varNames: string[]
): Implicant[] {
  const all = [...new Set([...minterms, ...dontCares])]
  const mintermSet = new Set(minterms)

  if (all.length === 0) return []

  let current: RawImpl[] = all.map((m) => ({
    value: m,
    mask: 0,
    allMinterms: [m],
    combined: false,
  }))

  const primeImplicants: RawImpl[] = []

  while (current.length > 0) {
    const next: RawImpl[] = []
    const seen = new Set<string>()

    // Reset combined flags
    for (const impl of current) impl.combined = false

    for (let i = 0; i < current.length; i++) {
      for (let j = i + 1; j < current.length; j++) {
        const a = current[i] as RawImpl
        const b = current[j] as RawImpl

        if (a.mask !== b.mask) continue
        const diff = a.value ^ b.value
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

    for (const impl of current) {
      if (!impl.combined) primeImplicants.push(impl)
    }

    current = next
  }

  // Deduplicate PIs
  const seen = new Set<string>()
  const uniquePIs: RawImpl[] = []
  for (const pi of primeImplicants) {
    const key = `${pi.value}|${pi.mask}`
    if (!seen.has(key)) {
      seen.add(key)
      uniquePIs.push(pi)
    }
  }

  // Filter to only PIs covering at least one real minterm
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
