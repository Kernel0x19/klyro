import type { FSMState, StateEncoding, StateEncodingMap } from './types'

function getGrayCode(n: number, numBits: number): string {
  const gray = n ^ (n >> 1)
  return gray.toString(2).padStart(numBits, '0')
}

export function computeStateEncodings(
  states: FSMState[],
  encoding: StateEncoding
): { encodings: StateEncodingMap; numBits: number } {
  const n = states.length
  if (n === 0) return { encodings: {}, numBits: 0 }

  const encodings: StateEncodingMap = {}

  if (encoding === 'one-hot') {
    const numBits = Math.max(1, n)
    states.forEach((s, idx) => {
      const bits = new Array(numBits).fill('0')
      // LSB or MSB order: conventionally right-to-left or left-to-right
      // We set bit (numBits - 1 - idx) so S0 is 00...01, S1 is 00...10
      bits[numBits - 1 - idx] = '1'
      encodings[s.id] = bits.join('')
    })
    return { encodings, numBits }
  }

  const numBits = Math.max(1, Math.ceil(Math.log2(n || 1)))

  states.forEach((s, idx) => {
    if (encoding === 'gray') {
      encodings[s.id] = getGrayCode(idx, numBits)
    } else {
      // standard binary
      encodings[s.id] = idx.toString(2).padStart(numBits, '0')
    }
  })

  return { encodings, numBits }
}
