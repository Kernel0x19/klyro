import type { Implicant } from './types'

/**
 * Minimal SOP: join each implicant expression with ' + '.
 */
export function toSOP(cover: Implicant[]): string {
  if (cover.length === 0) return '0'
  return cover.map((pi) => pi.expression).join(' + ')
}

/**
 * Minimal POS term for one implicant derived from maxterms.
 * Polarity is INVERTED compared to SOP:
 *   bit=1 in value → variable appears COMPLEMENTED  (A')
 *   bit=0 in value → variable appears UNcomplemented (A)
 */
export function buildPOSTerm(pi: Implicant, varNames: string[]): string {
  const { value, mask, variables } = pi
  const terms: string[] = []
  for (let i = 0; i < variables; i++) {
    const bit = 1 << (variables - 1 - i)
    if (mask & bit) continue
    const name = varNames[i] ?? String.fromCharCode(65 + i)
    terms.push(value & bit ? name + "'" : name)
  }
  if (terms.length === 0) return '0'
  if (terms.length === 1) return terms[0] ?? ''
  return '(' + terms.join(' + ') + ')'
}

/**
 * Minimal POS: product of sum terms derived from minimal cover of maxterms.
 */
export function toPOS(posImplicants: Implicant[], varNames: string[]): string {
  if (posImplicants.length === 0) return '1'
  return posImplicants.map((pi) => buildPOSTerm(pi, varNames)).join('')
}

