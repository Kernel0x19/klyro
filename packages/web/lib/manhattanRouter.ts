export interface Point {
  x: number
  y: number
}

export type PortSide = 'LEFT' | 'RIGHT' | 'TOP' | 'BOTTOM'
export type EndpointType = 'TOP_PANEL' | 'BOTTOM_PANEL' | 'IC_PIN' | 'UNKNOWN'

export interface EndpointInfo {
  point: Point
  side: PortSide
  type: EndpointType
  channelIndex: number // 0..5 for IC channels, or -1 for panels
  chipIndex: number // 0..4 for ICs, or -1
}

export interface MinimalEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  sourceX?: number
  sourceY?: number
  targetX?: number
  targetY?: number
}

// ─── Geometric Layout Constants ───────────────────────────────────────────────
export const BOARD = {
  CANVAS_X_ALIGN: 50,
  WORKSPACE_Y: 150,
  WORKSPACE_HEIGHT: 420,
  WORKSPACE_BOTTOM: 570,

  OUTPUT_BOTTOM_Y: 130, // approximate handle line of top output panel
  INPUT_TOP_Y: 585, // approximate handle line of bottom input panel

  // 5 IC Chips: absolute X positions [160, 410, 660, 910, 1160], width 150, height 220
  CHIP_SLOTS: [
    { left: 160, right: 310, top: 250, bottom: 470, center: 235 },
    { left: 410, right: 560, top: 250, bottom: 470, center: 485 },
    { left: 660, right: 810, top: 250, bottom: 470, center: 735 },
    { left: 910, right: 1060, top: 250, bottom: 470, center: 985 },
    { left: 1160, right: 1310, top: 250, bottom: 470, center: 1235 },
  ],

  // 6 Vertical Channels: [C0 (left flank), C1, C2, C3, C4, C5 (right flank)]
  CHANNEL_CENTERS: [105, 360, 610, 860, 1110, 1380],

  // Horizontal Corridors
  TOP_CORRIDOR_Y: 195, // inside workspace top area [155, 235]
  BOTTOM_CORRIDOR_Y: 525, // inside workspace bottom area [480, 560]
  CORRIDOR_SPLIT_Y: 360, // midpoint of IC chips

  // Channel Pitch & Track Limits
  CHANNEL_PITCH: 10,
  CORRIDOR_PITCH: 10,
  CORNER_RADIUS: 3,
}

// ─── Classify any pin endpoint ────────────────────────────────────────────────
export function classifyEndpoint(
  point: Point,
  nodeId?: string,
  handleId?: string | null
): EndpointInfo {
  // 1. By Node ID (if provided)
  if (nodeId === 'main-output-panel') {
    return {
      point,
      side: 'BOTTOM',
      type: 'TOP_PANEL',
      channelIndex: -1,
      chipIndex: -1,
    }
  }

  if (nodeId === 'main-input-clock-panel') {
    return {
      point,
      side: 'TOP',
      type: 'BOTTOM_PANEL',
      channelIndex: -1,
      chipIndex: -1,
    }
  }

  // 2. By Handle ID & Coordinate on IC Chip
  if (nodeId && nodeId.startsWith('ic-chip-')) {
    const chipNum = parseInt(nodeId.replace('ic-chip-', ''), 10)
    const chipIndex = isNaN(chipNum) ? 0 : Math.max(0, Math.min(4, chipNum - 1))
    const slot = BOARD.CHIP_SLOTS[chipIndex] ?? { center: 235 + chipIndex * 250 }

    // If we have actual pixel coordinates, physical X position relative to chip center is ground truth
    if (point && point.x > 0) {
      const isLeft = point.x <= slot.center
      return {
        point,
        side: isLeft ? 'LEFT' : 'RIGHT',
        type: 'IC_PIN',
        channelIndex: isLeft ? chipIndex : chipIndex + 1,
        chipIndex,
      }
    }

    if (handleId && handleId.startsWith('pin-')) {
      const pinNum = parseInt(handleId.replace('pin-', ''), 10)
      // DIP14 chips have 1..7 left and 8..14 right; DIP16 have 1..8 left and 9..16 right; DIP20 have 1..10 left.
      // Default to 1..7 for DIP14 (like 74LS08), 8..14 right.
      const isLeft = pinNum <= 7
      return {
        point,
        side: isLeft ? 'LEFT' : 'RIGHT',
        type: 'IC_PIN',
        channelIndex: isLeft ? chipIndex : chipIndex + 1,
        chipIndex,
      }
    }
  }

  // 3. Fallback: by Y coordinate
  if (point.y < BOARD.WORKSPACE_Y) {
    return {
      point,
      side: 'BOTTOM',
      type: 'TOP_PANEL',
      channelIndex: -1,
      chipIndex: -1,
    }
  }

  if (point.y > BOARD.WORKSPACE_BOTTOM) {
    return {
      point,
      side: 'TOP',
      type: 'BOTTOM_PANEL',
      channelIndex: -1,
      chipIndex: -1,
    }
  }

  // 4. Fallback: by X coordinate relative to IC chips
  let closestChip = 0
  let minDist = Infinity
  for (let i = 0; i < BOARD.CHIP_SLOTS.length; i++) {
    const slot = BOARD.CHIP_SLOTS[i]
    if (!slot) continue
    const dist = Math.abs(point.x - slot.center)
    if (dist < minDist) {
      minDist = dist
      closestChip = i
    }
  }

  const slot = BOARD.CHIP_SLOTS[closestChip]
  const center = slot ? slot.center : 235
  const isLeft = point.x <= center

  return {
    point,
    side: isLeft ? 'LEFT' : 'RIGHT',
    type: 'IC_PIN',
    channelIndex: isLeft ? closestChip : closestChip + 1,
    chipIndex: closestChip,
  }
}

// ─── Find nearest channel to an X coordinate ──────────────────────────────────
export function getNearestChannelIndex(x: number): number {
  let bestIdx = 0
  let bestDist = Infinity
  for (let i = 0; i < BOARD.CHANNEL_CENTERS.length; i++) {
    const cX = BOARD.CHANNEL_CENTERS[i] ?? 0
    const d = Math.abs(x - cX)
    if (d < bestDist) {
      bestDist = d
      bestIdx = i
    }
  }
  return bestIdx
}

// ─── Multi-edge route planning and track assignment ───────────────────────────
interface PlannedEdge {
  id: string
  source: Point
  target: Point
  sourceInfo: EndpointInfo
  targetInfo: EndpointInfo
  topology: 'INTRA_CHANNEL' | 'TOP_CORRIDOR' | 'BOTTOM_CORRIDOR' | 'PANEL_TO_PANEL'
  channelS: number
  channelT: number
}

function planEdgeTopology(
  edge: MinimalEdge,
  sourcePt: Point,
  targetPt: Point
): PlannedEdge {
  const sourceInfo = classifyEndpoint(
    sourcePt,
    edge.source,
    edge.sourceHandle ?? null
  )
  const targetInfo = classifyEndpoint(
    targetPt,
    edge.target,
    edge.targetHandle ?? null
  )

  let topology: PlannedEdge['topology'] = 'TOP_CORRIDOR'
  let channelS = sourceInfo.channelIndex
  let channelT = targetInfo.channelIndex

  const isSourcePanel =
    sourceInfo.type === 'TOP_PANEL' || sourceInfo.type === 'BOTTOM_PANEL'
  const isTargetPanel =
    targetInfo.type === 'TOP_PANEL' || targetInfo.type === 'BOTTOM_PANEL'

  if (isSourcePanel && isTargetPanel) {
    topology = 'PANEL_TO_PANEL'
    const midX = (sourcePt.x + targetPt.x) / 2
    channelS = getNearestChannelIndex(midX)
    channelT = channelS
  } else if (sourceInfo.type === 'TOP_PANEL' || targetInfo.type === 'TOP_PANEL') {
    topology = 'TOP_CORRIDOR'
    if (channelS < 0) channelS = channelT
    if (channelT < 0) channelT = channelS
  } else if (
    sourceInfo.type === 'BOTTOM_PANEL' ||
    targetInfo.type === 'BOTTOM_PANEL'
  ) {
    topology = 'BOTTOM_CORRIDOR'
    if (channelS < 0) channelS = channelT
    if (channelT < 0) channelT = channelS
  } else {
    // Both are IC pins!
    if (channelS === channelT) {
      topology = 'INTRA_CHANNEL'
    } else {
      const avgY = (sourcePt.y + targetPt.y) / 2
      topology = avgY < BOARD.CORRIDOR_SPLIT_Y ? 'TOP_CORRIDOR' : 'BOTTOM_CORRIDOR'
    }
  }

  return {
    id: edge.id,
    source: sourcePt,
    target: targetPt,
    sourceInfo,
    targetInfo,
    topology,
    channelS: Math.max(0, Math.min(5, channelS)),
    channelT: Math.max(0, Math.min(5, channelT)),
  }
}

// ─── Simplify collinear points ────────────────────────────────────────────────
function simplifyPath(points: Point[]): Point[] {
  if (points.length <= 2) return points
  const result: Point[] = [points[0]!]

  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1]!
    const curr = points[i]!
    const next = points[i + 1]!

    const sameX = Math.abs(prev.x - curr.x) < 0.1 && Math.abs(curr.x - next.x) < 0.1
    const sameY = Math.abs(prev.y - curr.y) < 0.1 && Math.abs(curr.y - next.y) < 0.1

    if (!sameX && !sameY) {
      result.push(curr)
    }
  }

  result.push(points[points.length - 1]!)
  return result
}

// ─── Main Routing Function ────────────────────────────────────────────────────
export function manhattanRoute(
  source: Point,
  target: Point,
  allEdges: MinimalEdge[] = [],
  currentEdgeId?: string,
  edgeIndex = 0
): Point[] {
  // Find current edge info
  const currEdge = allEdges.find((e) => e.id === currentEdgeId) ?? {
    id: currentEdgeId ?? `edge-${edgeIndex}`,
    source: '',
    target: '',
  }

  // Plan all edges to compute lane assignments
  const plannedEdges = allEdges.map((e) => {
    const sPt =
      e.id === currEdge.id
        ? source
        : e.sourceX !== undefined && e.sourceY !== undefined
          ? { x: e.sourceX, y: e.sourceY }
          : source
    const tPt =
      e.id === currEdge.id
        ? target
        : e.targetX !== undefined && e.targetY !== undefined
          ? { x: e.targetX, y: e.targetY }
          : target
    return planEdgeTopology(e, sPt, tPt)
  })

  // Ensure current edge is planned
  let currentPlan = plannedEdges.find((p) => p.id === currEdge.id)
  if (!currentPlan) {
    currentPlan = planEdgeTopology(currEdge, source, target)
    plannedEdges.push(currentPlan)
  }

  // 1. Calculate Channel X Tracks for current edge
  const getChannelTrackX = (channelIdx: number, edgeId: string): number => {
    const center = BOARD.CHANNEL_CENTERS[channelIdx] ?? 105
    // Find all edges using this channel
    const edgesInChannel = plannedEdges.filter(
      (p) => p.channelS === channelIdx || p.channelT === channelIdx
    )
    if (edgesInChannel.length <= 1) return center

    // Sort edges deterministically by min Y to avoid crossings
    edgesInChannel.sort((a, b) => {
      const aMinY = Math.min(a.source.y, a.target.y)
      const bMinY = Math.min(b.source.y, b.target.y)
      if (Math.abs(aMinY - bMinY) > 5) return aMinY - bMinY
      return a.id.localeCompare(b.id)
    })

    const idx = edgesInChannel.findIndex((p) => p.id === edgeId)
    const count = edgesInChannel.length
    const offset = (idx - (count - 1) / 2) * BOARD.CHANNEL_PITCH
    return center + offset
  }

  // 2. Calculate Corridor Y Track for current edge
  const getCorridorTrackY = (
    corridor: 'TOP' | 'BOTTOM',
    edgeId: string
  ): number => {
    const baseCenter =
      corridor === 'TOP' ? BOARD.TOP_CORRIDOR_Y : BOARD.BOTTOM_CORRIDOR_Y
    const edgesInCorridor = plannedEdges.filter((p) =>
      corridor === 'TOP'
        ? p.topology === 'TOP_CORRIDOR'
        : p.topology === 'BOTTOM_CORRIDOR'
    )
    if (edgesInCorridor.length <= 1) return baseCenter

    // Sort by span length (shorter spans inner, longer spans outer)
    edgesInCorridor.sort((a, b) => {
      const aSpan = Math.abs(a.source.x - a.target.x)
      const bSpan = Math.abs(b.source.x - b.target.x)
      if (Math.abs(aSpan - bSpan) > 10) {
        // For TOP: larger span = higher up (smaller Y)
        // For BOTTOM: larger span = lower down (larger Y)
        return corridor === 'TOP' ? bSpan - aSpan : aSpan - bSpan
      }
      return a.id.localeCompare(b.id)
    })

    const idx = edgesInCorridor.findIndex((p) => p.id === edgeId)
    const count = edgesInCorridor.length
    const offset = (idx - (count - 1) / 2) * BOARD.CORRIDOR_PITCH
    return baseCenter + offset
  }

  const { sourceInfo, targetInfo, topology, channelS, channelT } = currentPlan
  const trackXS = getChannelTrackX(channelS, currentPlan.id)
  const trackXT = getChannelTrackX(channelT, currentPlan.id)

  let rawWaypoints: Point[] = []

  // ── Route by Topology ────────────────────────────────────────────────────────

  // Case A: Intra-Channel (e.g. adjacent IC pins facing same channel, or same-side loop)
  if (topology === 'INTRA_CHANNEL') {
    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: target.y },
      target,
    ]
  }

  // Case B: Top Output Panel → IC Pin
  else if (sourceInfo.type === 'TOP_PANEL' && targetInfo.type === 'IC_PIN') {
    const corridorY = getCorridorTrackY('TOP', currentPlan.id)
    rawWaypoints = [
      source,
      { x: source.x, y: corridorY },
      { x: trackXT, y: corridorY },
      { x: trackXT, y: target.y },
      target,
    ]
  }

  // Case C: IC Pin → Top Output Panel
  else if (sourceInfo.type === 'IC_PIN' && targetInfo.type === 'TOP_PANEL') {
    const corridorY = getCorridorTrackY('TOP', currentPlan.id)
    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: corridorY },
      { x: target.x, y: corridorY },
      target,
    ]
  }

  // Case D: Bottom Input Panel → IC Pin
  else if (sourceInfo.type === 'BOTTOM_PANEL' && targetInfo.type === 'IC_PIN') {
    const corridorY = getCorridorTrackY('BOTTOM', currentPlan.id)
    rawWaypoints = [
      source,
      { x: source.x, y: corridorY },
      { x: trackXT, y: corridorY },
      { x: trackXT, y: target.y },
      target,
    ]
  }

  // Case E: IC Pin → Bottom Input Panel
  else if (sourceInfo.type === 'IC_PIN' && targetInfo.type === 'BOTTOM_PANEL') {
    const corridorY = getCorridorTrackY('BOTTOM', currentPlan.id)
    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: corridorY },
      { x: target.x, y: corridorY },
      target,
    ]
  }

  // Case F: Direct Panel to Panel (Top to Bottom or Bottom to Top)
  else if (topology === 'PANEL_TO_PANEL') {
    const topPt = sourceInfo.type === 'TOP_PANEL' ? source : target
    const botPt = sourceInfo.type === 'BOTTOM_PANEL' ? source : target
    const throughX = trackXS
    const topY = getCorridorTrackY('TOP', currentPlan.id)
    const botY = getCorridorTrackY('BOTTOM', currentPlan.id)

    const forward = [
      topPt,
      { x: topPt.x, y: topY },
      { x: throughX, y: topY },
      { x: throughX, y: botY },
      { x: botPt.x, y: botY },
      botPt,
    ]
    rawWaypoints = sourceInfo.type === 'TOP_PANEL' ? forward : forward.reverse()
  }

  // Case G: Inter-Channel IC Pin to IC Pin (different chips or opposite sides)
  else {
    const corridor = topology === 'TOP_CORRIDOR' ? 'TOP' : 'BOTTOM'
    const corridorY = getCorridorTrackY(corridor, currentPlan.id)

    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: corridorY },
      { x: trackXT, y: corridorY },
      { x: trackXT, y: target.y },
      target,
    ]
  }

  return simplifyPath(rawWaypoints)
}

// ─── SVG Path Generator with Clean 90-degree fillets ──────────────────────────
export function waypointsToPath(
  points: Point[],
  radius = BOARD.CORNER_RADIUS
): string {
  if (points.length < 2) return ''
  const start = points[0]
  if (!start) return ''

  let d = `M ${start.x} ${start.y}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    const next = points[i + 1]

    if (!prev || !curr) continue

    if (!next || radius <= 0) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const r = Math.min(
      radius,
      Math.abs(curr.x - prev.x) / 2,
      Math.abs(curr.y - prev.y) / 2,
      Math.abs(next.x - curr.x) / 2,
      Math.abs(next.y - curr.y) / 2
    )

    const dx1 = curr.x - prev.x
    const dy1 = curr.y - prev.y
    const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1)
    const dx2 = next.x - curr.x
    const dy2 = next.y - curr.y
    const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2)

    if (len1 === 0 || len2 === 0 || r < 0.5) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    const p1 = { x: curr.x - (dx1 / len1) * r, y: curr.y - (dy1 / len1) * r }
    const p2 = { x: curr.x + (dx2 / len2) * r, y: curr.y + (dy2 / len2) * r }

    d += ` L ${p1.x} ${p1.y} Q ${curr.x} ${curr.y} ${p2.x} ${p2.y}`
  }

  return d
}
