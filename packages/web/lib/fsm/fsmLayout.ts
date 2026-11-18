import type { FSMState } from './types'

/**
 * Arranges FSM states in a symmetrical circular / regular polygon layout.
 * Starts from top (-PI/2) and distributes states clockwise.
 */
export function applySymmetricalLayout(
  states: FSMState[],
  centerX = 380,
  centerY = 260,
  radius = 160
): FSMState[] {
  const n = states.length
  if (n === 0) return []
  if (n === 1) return [{ ...states[0]!, x: centerX - 48, y: centerY - 48 }]

  return states.map((s, i) => {
    // S0 at top (-PI/2), S1 at right, S2 at bottom, S3 at left (for N=4)
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const x = Math.round(centerX + radius * Math.cos(angle) - 48)
    const y = Math.round(centerY + radius * Math.sin(angle) - 48)
    return { ...s, x, y }
  })
}

export interface EdgeRoutingInfo {
  sourceHandle: 'top' | 'right' | 'bottom' | 'left'
  targetHandle: 'top-in' | 'right-in' | 'bottom-in' | 'left-in'
  curveOffset: number
  isSelfLoop: boolean
  loopDirection?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Determines optimal handles, curve offsets, and self-loop orientation
 * so that state transitions bow gracefully and never cross clutteredly.
 */
export function getOptimalEdgeRouting(
  fromState: FSMState,
  toState: FSMState,
  hasMutual: boolean,
  centerX = 380,
  centerY = 260
): EdgeRoutingInfo {
  // 1. Self Loop
  if (fromState.id === toState.id) {
    const dxC = fromState.x + 48 - centerX
    const dyC = fromState.y + 48 - centerY

    let loopDirection: 'top' | 'right' | 'bottom' | 'left' = 'top'
    if (Math.abs(dyC) >= Math.abs(dxC)) {
      loopDirection = dyC <= 0 ? 'top' : 'bottom'
    } else {
      loopDirection = dxC > 0 ? 'right' : 'left'
    }

    return {
      sourceHandle: loopDirection,
      targetHandle: `${loopDirection}-in` as EdgeRoutingInfo['targetHandle'],
      curveOffset: 0,
      isSelfLoop: true,
      loopDirection,
    }
  }

  // 2. Inter-state transition
  const fromCenterX = fromState.x + 48
  const fromCenterY = fromState.y + 48
  const toCenterX = toState.x + 48
  const toCenterY = toState.y + 48

  // Vectors from layout center
  const vAx = fromCenterX - centerX
  const vAy = fromCenterY - centerY
  const vBx = toCenterX - centerX
  const vBy = toCenterY - centerY

  // 2D cross product: > 0 means clockwise around center
  const cross = vAx * vBy - vAy * vBx

  if (hasMutual) {
    // Symmetrical outer / inner ring routing for mutual transitions
    if (cross > 0) {
      // Clockwise (Outer lane)
      const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX)
      let sourceHandle: 'top' | 'right' | 'bottom' | 'left' = 'right'
      let targetHandle: 'top-in' | 'right-in' | 'bottom-in' | 'left-in' = 'top-in'

      if (angle >= 0 && angle < Math.PI / 2) {
        // top to right
        sourceHandle = 'right'
        targetHandle = 'top-in'
      } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        // right to bottom
        sourceHandle = 'bottom'
        targetHandle = 'right-in'
      } else if (angle >= -Math.PI && angle < -Math.PI / 2) {
        // bottom to left
        sourceHandle = 'left'
        targetHandle = 'bottom-in'
      } else {
        // left to top
        sourceHandle = 'top'
        targetHandle = 'left-in'
      }

      return {
        sourceHandle,
        targetHandle,
        curveOffset: 34,
        isSelfLoop: false,
      }
    } else {
      // Counter-Clockwise (Inner lane)
      const angle = Math.atan2(toCenterY - fromCenterY, toCenterX - fromCenterX)
      let sourceHandle: 'top' | 'right' | 'bottom' | 'left' = 'left'
      let targetHandle: 'top-in' | 'right-in' | 'bottom-in' | 'left-in' = 'bottom-in'

      if (angle >= 0 && angle < Math.PI / 2) {
        sourceHandle = 'bottom'
        targetHandle = 'left-in'
      } else if (angle >= Math.PI / 2 && angle < Math.PI) {
        sourceHandle = 'left'
        targetHandle = 'top-in'
      } else if (angle >= -Math.PI && angle < -Math.PI / 2) {
        sourceHandle = 'top'
        targetHandle = 'right-in'
      } else {
        sourceHandle = 'right'
        targetHandle = 'bottom-in'
      }

      return {
        sourceHandle,
        targetHandle,
        curveOffset: 34,
        isSelfLoop: false,
      }
    }
  }

  // Non-mutual transition: standard direct facing handles with gentle arc
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  const angle = Math.atan2(dy, dx)

  let sourceHandle: 'top' | 'right' | 'bottom' | 'left' = 'right'
  let targetHandle: 'top-in' | 'right-in' | 'bottom-in' | 'left-in' = 'left-in'

  if (angle >= -Math.PI / 4 && angle < Math.PI / 4) {
    sourceHandle = 'right'
    targetHandle = 'left-in'
  } else if (angle >= Math.PI / 4 && angle < (3 * Math.PI) / 4) {
    sourceHandle = 'bottom'
    targetHandle = 'top-in'
  } else if (angle >= -(3 * Math.PI) / 4 && angle < -Math.PI / 4) {
    sourceHandle = 'top'
    targetHandle = 'bottom-in'
  } else {
    sourceHandle = 'left'
    targetHandle = 'right-in'
  }

  return {
    sourceHandle,
    targetHandle,
    curveOffset: 20,
    isSelfLoop: false,
  }
}
