/**
 * Klyro — FSM Graphical Layout & Edge Routing Geometry
 *
 * Implements symmetrical circular arrangement of state circles and optimal handle/arc routing:
 * - Regular polygon positioning starting with S0 at the 12 o'clock apex (-PI/2)
 * - Self-loop routing pointing outward radially from the layout center
 * - Mutual transition routing (two-way transitions between adjacent states) separated into
 *   an outer clockwise lane and an inner counter-clockwise lane to prevent wire collisions.
 */

import type { FSMState } from './types'

/** Standard state bubble radius in pixels */
const STATE_RADIUS = 48

/** Default layout canvas center and orbit radius */
const DEFAULT_CENTER_X = 380
const DEFAULT_CENTER_Y = 260
const DEFAULT_RADIUS = 160

/** Curve offset for mutual transition arcs (in pixels) */
const MUTUAL_CURVE_OFFSET = 34
/** Curve offset for standard one-way transition arcs */
const STANDARD_CURVE_OFFSET = 20

/**
 * Arranges FSM states into a symmetrical regular polygon / circular ring.
 *
 * S0 is positioned at the top apex (-PI/2 / 12 o'clock), followed by S1, S2, ...
 * distributed clockwise around the perimeter.
 *
 * @param states Array of FSM state nodes
 * @param centerX Center X coordinate on canvas
 * @param centerY Center Y coordinate on canvas
 * @param radius Circular distribution radius in pixels
 * @returns Updated state array with newly computed (x, y) coordinates
 */
export function applySymmetricalLayout(
  states: FSMState[],
  centerX = DEFAULT_CENTER_X,
  centerY = DEFAULT_CENTER_Y,
  radius = DEFAULT_RADIUS
): FSMState[] {
  const n = states.length
  if (n === 0) return []
  if (n === 1) return [{ ...states[0]!, x: centerX - STATE_RADIUS, y: centerY - STATE_RADIUS }]

  return states.map((s, i) => {
    // S0 at top (-PI/2), S1 at right, S2 at bottom, S3 at left (for N=4)
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n
    const x = Math.round(centerX + radius * Math.cos(angle) - STATE_RADIUS)
    const y = Math.round(centerY + radius * Math.sin(angle) - STATE_RADIUS)
    return { ...s, x, y }
  })
}

/**
 * Output geometry descriptor specifying optimal attachment handles and curve offsets.
 */
export interface EdgeRoutingInfo {
  /** Source node handle anchor */
  sourceHandle: 'top' | 'right' | 'bottom' | 'left'
  /** Target node handle anchor */
  targetHandle: 'top-in' | 'right-in' | 'bottom-in' | 'left-in'
  /** Quadratic Bézier curvature distance (0 for straight) */
  curveOffset: number
  /** Whether the transition is a self-loop (same source and target state) */
  isSelfLoop: boolean
  /** Compass direction in which a self-loop bows */
  loopDirection?: 'top' | 'right' | 'bottom' | 'left'
}

/**
 * Calculates optimal source/target handles and curve offsets for a transition edge.
 *
 * Ensures:
 * 1. Self-loops always bow radially outward away from the center of the diagram.
 * 2. Mutual transitions (A -> B and B -> A) bow in opposing directions (outer track vs inner track).
 * 3. Direct transitions use direct facing compass handles with gentle outward arcs.
 *
 * @param fromState Origin state
 * @param toState Destination state
 * @param hasMutual Whether a reverse transition (toState -> fromState) also exists
 * @param centerX Diagram center X
 * @param centerY Diagram center Y
 * @returns Routing geometry parameters
 */
export function getOptimalEdgeRouting(
  fromState: FSMState,
  toState: FSMState,
  hasMutual: boolean,
  centerX = DEFAULT_CENTER_X,
  centerY = DEFAULT_CENTER_Y
): EdgeRoutingInfo {
  // 1. Self Loop: loops back to the same state bubble
  if (fromState.id === toState.id) {
    const dxC = fromState.x + STATE_RADIUS - centerX
    const dyC = fromState.y + STATE_RADIUS - centerY

    // Point loop in the outward radial quadrant
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
  const fromCenterX = fromState.x + STATE_RADIUS
  const fromCenterY = fromState.y + STATE_RADIUS
  const toCenterX = toState.x + STATE_RADIUS
  const toCenterY = toState.y + STATE_RADIUS

  // Vectors from layout center
  const vAx = fromCenterX - centerX
  const vAy = fromCenterY - centerY
  const vBx = toCenterX - centerX
  const vBy = toCenterY - centerY

  // 2D cross product: > 0 means clockwise direction around the center
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
        curveOffset: MUTUAL_CURVE_OFFSET,
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
        curveOffset: MUTUAL_CURVE_OFFSET,
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
    curveOffset: STANDARD_CURVE_OFFSET,
    isSelfLoop: false,
  }
}

