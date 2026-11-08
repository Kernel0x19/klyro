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
  channelIndex: number
  chipIndex: number
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

export const BOARD = {
  CANVAS_X_ALIGN: 50,
  WORKSPACE_Y: 150,
  WORKSPACE_HEIGHT: 420,
  WORKSPACE_BOTTOM: 570,
  OUTPUT_BOTTOM_Y: 142,
  INPUT_TOP_Y: 578,
  CHIP_SLOTS: [
    { left: 160, right: 310, top: 250, bottom: 470, center: 235 },
    { left: 410, right: 560, top: 250, bottom: 470, center: 485 },
    { left: 660, right: 810, top: 250, bottom: 470, center: 735 },
    { left: 910, right: 1060, top: 250, bottom: 470, center: 985 },
    { left: 1160, right: 1310, top: 250, bottom: 470, center: 1235 },
  ],
  CHANNEL_CENTERS: [105, 360, 610, 860, 1110, 1370],
  TOP_CORRIDOR_Y: 195,
  BOTTOM_CORRIDOR_Y: 525,
  CORRIDOR_SPLIT_Y: 360,
  CHANNEL_PITCH: 10,
  CORRIDOR_PITCH: 10,
  CORNER_RADIUS: 4,
}

export const BOARD_BOUNDS = {
  WORKSPACE_LEFT: 50,
  WORKSPACE_RIGHT: 1450,
  WORKSPACE_TOP: 150,
  WORKSPACE_BOTTOM: 570,

  // Channel X boundaries (inside blue board with safe margins):
  CHANNEL_RANGES: [
    { min: 85, max: 135, center: 105 },
    { min: 330, max: 390, center: 360 },
    { min: 580, max: 640, center: 610 },
    { min: 830, max: 890, center: 860 },
    { min: 1080, max: 1140, center: 1110 },
    { min: 1330, max: 1415, center: 1370 },
  ],

  // Corridors Y boundaries:
  TOP_CORRIDOR: { min: 168, max: 228, center: 195 },
  BOTTOM_CORRIDOR: { min: 490, max: 552, center: 525 },
}

/**
 * Resolves deterministic pin/handle canvas coordinates for any node and handle ID
 * to guarantee that all edges know real spatial coordinates even when unmounted.
 */
export function resolveHandlePosition(
  nodeId?: string,
  handleId?: string | null,
  fallbackPoint?: Point
): Point {
  if (!nodeId) return fallbackPoint ?? { x: 100, y: 100 }

  // 1. Output Panel (Top): Pins 15 down to 0, then VCC
  if (nodeId === 'main-output-panel') {
    const startX = 85
    const pitch = 40
    const handleY = 142
    if (!handleId) return { x: startX, y: handleY }
    if (handleId === 'pin-VCC') {
      return { x: startX + 16 * pitch, y: handleY }
    }
    const pinNum = parseInt(handleId.replace('pin-', ''), 10)
    if (!isNaN(pinNum) && pinNum >= 0 && pinNum <= 15) {
      const index = 15 - pinNum
      return { x: startX + index * pitch, y: handleY }
    }
    return { x: startX, y: handleY }
  }

  // 2. Input & Clock Panel (Bottom): Pins 15 down to 0, GND, Clocks
  if (nodeId === 'main-input-clock-panel') {
    const startX = 85
    const pitch = 40
    const handleY = 578
    if (!handleId) return { x: startX, y: handleY }
    if (handleId === 'input-gnd') {
      return { x: startX + 15 * pitch + 49, y: handleY }
    }
    if (handleId.startsWith('input-')) {
      const pinNum = parseInt(handleId.replace('input-', ''), 10)
      if (!isNaN(pinNum) && pinNum >= 0 && pinNum <= 15) {
        const index = 15 - pinNum
        return { x: startX + index * pitch, y: handleY }
      }
    }
    if (handleId.startsWith('clock-')) {
      const clockMap: Record<string, number> = {
        'clock-10': 990,
        'clock-5': 1040,
        'clock-1': 1090,
        'clock-0.5': 1140,
      }
      return { x: clockMap[handleId] ?? 990, y: handleY }
    }
    return { x: startX, y: handleY }
  }

  // 3. IC Base Nodes: ic-chip-1 to ic-chip-5
  if (nodeId.startsWith('ic-chip-')) {
    const chipNum = parseInt(nodeId.replace('ic-chip-', ''), 10)
    const chipIndex = isNaN(chipNum) ? 0 : Math.max(0, Math.min(4, chipNum - 1))
    const chipLeftX = 160 + chipIndex * 250
    const chipTopY = 250
    const leftHandleX = chipLeftX + 26
    const rightHandleX = chipLeftX + 124

    if (handleId && handleId.startsWith('pin-')) {
      const pinNum = parseInt(handleId.replace('pin-', ''), 10)
      let rowIndex = 0
      let sideIsLeft = true
      if (pinNum <= 10) {
        sideIsLeft = true
        rowIndex = pinNum - 1
      } else {
        sideIsLeft = false
        if (pinNum <= 14) rowIndex = 14 - pinNum
        else if (pinNum <= 16) rowIndex = 16 - pinNum
        else rowIndex = 20 - pinNum
      }
      const handleY = chipTopY + 15 + Math.max(0, rowIndex) * 22
      return {
        x: sideIsLeft ? leftHandleX : rightHandleX,
        y: handleY,
      }
    }
    return { x: leftHandleX, y: chipTopY + 50 }
  }

  return fallbackPoint ?? { x: 100, y: 100 }
}

export function classifyEndpoint(
  point: Point,
  nodeId?: string,
  handleId?: string | null
): EndpointInfo {
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
  if (nodeId && nodeId.startsWith('ic-chip-')) {
    const chipNum = parseInt(nodeId.replace('ic-chip-', ''), 10)
    const chipIndex = isNaN(chipNum) ? 0 : Math.max(0, Math.min(4, chipNum - 1))
    const slot = BOARD.CHIP_SLOTS[chipIndex] ?? { center: 235 + chipIndex * 250 }
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
      const isLeft = pinNum <= 7 || (pinNum <= 10 && pinNum > 0)
      return {
        point,
        side: isLeft ? 'LEFT' : 'RIGHT',
        type: 'IC_PIN',
        channelIndex: isLeft ? chipIndex : chipIndex + 1,
        chipIndex,
      }
    }
  }
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
    // Both are IC pins
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

export function manhattanRoute(
  source: Point,
  target: Point,
  allEdges: MinimalEdge[] = [],
  currentEdgeId?: string,
  edgeIndex = 0
): Point[] {
  const result = computeManhattanDetails(
    source,
    target,
    allEdges,
    currentEdgeId,
    edgeIndex
  )
  return result.waypoints
}

export interface ManhattanRouteResult {
  waypoints: Point[]
  path: string
  otherVerticalSegments: Array<{ x: number; minY: number; maxY: number }>
}

export function computeManhattanDetails(
  source: Point,
  target: Point,
  allEdges: MinimalEdge[] = [],
  currentEdgeId?: string,
  edgeIndex = 0
): ManhattanRouteResult {
  const currEdge = allEdges.find((e) => e.id === currentEdgeId) ?? {
    id: currentEdgeId ?? `edge-${edgeIndex}`,
    source: '',
    target: '',
  }

  // Pre-resolve real coordinates for EVERY edge to prevent coordinate collapse
  const plannedEdges: PlannedEdge[] = allEdges.map((e) => {
    const sPt =
      e.id === currEdge.id && source.x > 0
        ? source
        : e.sourceX !== undefined && e.sourceX > 0
          ? { x: e.sourceX, y: e.sourceY! }
          : resolveHandlePosition(e.source, e.sourceHandle)

    const tPt =
      e.id === currEdge.id && target.x > 0
        ? target
        : e.targetX !== undefined && e.targetX > 0
          ? { x: e.targetX, y: e.targetY! }
          : resolveHandlePosition(e.target, e.targetHandle)

    return planEdgeTopology(e, sPt, tPt)
  })

  let currentPlan = plannedEdges.find((p) => p.id === currEdge.id)
  if (!currentPlan) {
    currentPlan = planEdgeTopology(currEdge, source, target)
    plannedEdges.push(currentPlan)
  }

  // Bounded channel track X calculation
  const getChannelTrackX = (channelIdx: number, edgeId: string): number => {
    const ch = BOARD_BOUNDS.CHANNEL_RANGES[channelIdx] ?? {
      min: 85,
      max: 135,
      center: 105,
    }
    const edgesInChannel = plannedEdges.filter(
      (p) => p.channelS === channelIdx || p.channelT === channelIdx
    )
    if (edgesInChannel.length <= 1) return ch.center

    edgesInChannel.sort((a, b) => {
      const aMinY = Math.min(a.source.y, a.target.y)
      const bMinY = Math.min(b.source.y, b.target.y)
      if (Math.abs(aMinY - bMinY) > 5) return aMinY - bMinY
      return a.id.localeCompare(b.id)
    })

    const idx = edgesInChannel.findIndex((p) => p.id === edgeId)
    const count = edgesInChannel.length
    const availableSpan = ch.max - ch.min
    const pitch = Math.min(10, availableSpan / Math.max(1, count + 1))
    const offset = (idx - (count - 1) / 2) * pitch
    const rawX = ch.center + offset
    return Math.max(ch.min, Math.min(ch.max, rawX))
  }

  // Bounded corridor track Y calculation
  const getCorridorTrackY = (
    corridor: 'TOP' | 'BOTTOM',
    edgeId: string
  ): number => {
    const cor =
      corridor === 'TOP'
        ? BOARD_BOUNDS.TOP_CORRIDOR
        : BOARD_BOUNDS.BOTTOM_CORRIDOR
    const edgesInCorridor = plannedEdges.filter((p) =>
      corridor === 'TOP'
        ? p.topology === 'TOP_CORRIDOR'
        : p.topology === 'BOTTOM_CORRIDOR'
    )
    if (edgesInCorridor.length <= 1) return cor.center

    edgesInCorridor.sort((a, b) => {
      const aSpan = Math.abs(a.source.x - a.target.x)
      const bSpan = Math.abs(b.source.x - b.target.x)
      if (Math.abs(aSpan - bSpan) > 10) {
        return corridor === 'TOP' ? bSpan - aSpan : aSpan - bSpan
      }
      return a.id.localeCompare(b.id)
    })

    const idx = edgesInCorridor.findIndex((p) => p.id === edgeId)
    const count = edgesInCorridor.length
    const availableSpan = cor.max - cor.min
    const pitch = Math.min(10, availableSpan / Math.max(1, count + 1))
    const offset = (idx - (count - 1) / 2) * pitch
    const rawY = cor.center + offset
    return Math.max(cor.min, Math.min(cor.max, rawY))
  }

  const { sourceInfo, targetInfo, topology, channelS, channelT } = currentPlan
  const trackXS = getChannelTrackX(channelS, currentPlan.id)
  const trackXT = getChannelTrackX(channelT, currentPlan.id)

  let rawWaypoints: Point[] = []

  if (topology === 'INTRA_CHANNEL') {
    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: target.y },
      target,
    ]
  } else if (sourceInfo.type === 'TOP_PANEL' && targetInfo.type === 'IC_PIN') {
    const corridorY = getCorridorTrackY('TOP', currentPlan.id)
    rawWaypoints = [
      source,
      { x: source.x, y: corridorY },
      { x: trackXT, y: corridorY },
      { x: trackXT, y: target.y },
      target,
    ]
  } else if (sourceInfo.type === 'IC_PIN' && targetInfo.type === 'TOP_PANEL') {
    const corridorY = getCorridorTrackY('TOP', currentPlan.id)
    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: corridorY },
      { x: target.x, y: corridorY },
      target,
    ]
  } else if (sourceInfo.type === 'BOTTOM_PANEL' && targetInfo.type === 'IC_PIN') {
    const corridorY = getCorridorTrackY('BOTTOM', currentPlan.id)
    rawWaypoints = [
      source,
      { x: source.x, y: corridorY },
      { x: trackXT, y: corridorY },
      { x: trackXT, y: target.y },
      target,
    ]
  } else if (sourceInfo.type === 'IC_PIN' && targetInfo.type === 'BOTTOM_PANEL') {
    const corridorY = getCorridorTrackY('BOTTOM', currentPlan.id)
    rawWaypoints = [
      source,
      { x: trackXS, y: source.y },
      { x: trackXS, y: corridorY },
      { x: target.x, y: corridorY },
      target,
    ]
  } else if (topology === 'PANEL_TO_PANEL') {
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
  } else {
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

  const waypoints = simplifyPath(rawWaypoints)

  // Collect vertical segments from all other edges for schematic crossover bridge hops
  const otherVerticalSegments: Array<{ x: number; minY: number; maxY: number }> =
    []
  for (const plan of plannedEdges) {
    if (plan.id === currEdge.id) continue
    const trXS = getChannelTrackX(plan.channelS, plan.id)
    const trXT = getChannelTrackX(plan.channelT, plan.id)
    // Vertical track segments
    const topY = getCorridorTrackY('TOP', plan.id)
    const botY = getCorridorTrackY('BOTTOM', plan.id)

    if (plan.topology === 'INTRA_CHANNEL') {
      otherVerticalSegments.push({
        x: trXS,
        minY: Math.min(plan.source.y, plan.target.y),
        maxY: Math.max(plan.source.y, plan.target.y),
      })
    } else {
      otherVerticalSegments.push({
        x: trXS,
        minY: Math.min(plan.source.y, plan.topology === 'TOP_CORRIDOR' ? topY : botY),
        maxY: Math.max(plan.source.y, plan.topology === 'TOP_CORRIDOR' ? topY : botY),
      })
      otherVerticalSegments.push({
        x: trXT,
        minY: Math.min(plan.target.y, plan.topology === 'TOP_CORRIDOR' ? topY : botY),
        maxY: Math.max(plan.target.y, plan.topology === 'TOP_CORRIDOR' ? topY : botY),
      })
    }
  }

  const path = waypointsToPathWithBridges(
    waypoints,
    otherVerticalSegments,
    BOARD.CORNER_RADIUS
  )

  return { waypoints, path, otherVerticalSegments }
}

/**
 * Converts orthogonal waypoints to SVG path with rounded 90-degree corners
 * and upward schematic bridge jumper arches ('⌒') wherever crossing other vertical wires.
 */
export function waypointsToPathWithBridges(
  points: Point[],
  otherVerticalSegments: Array<{ x: number; minY: number; maxY: number }> = [],
  radius = BOARD.CORNER_RADIUS
): string {
  if (points.length < 2) return ''
  const start = points[0]
  if (!start) return ''
  let d = `M ${start.x} ${start.y}`

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    const next = points[i + 1]

    const isHorizontal = Math.abs(curr.y - prev.y) < 1 && Math.abs(curr.x - prev.x) > 1

    if (isHorizontal) {
      const y = curr.y
      const x1 = prev.x
      const x2 = curr.x
      const dir = x2 > x1 ? 1 : -1
      const minX = Math.min(x1, x2)
      const maxX = Math.max(x1, x2)

      // Find crossings with other vertical segments (keeping at least 8px clearance from bends)
      const crossings: number[] = []
      for (const seg of otherVerticalSegments) {
        if (seg.x > minX + 8 && seg.x < maxX - 8) {
          if (y > seg.minY + 2 && y < seg.maxY - 2) {
            // Prevent duplicate or overlapping hops
            if (!crossings.some((cx) => Math.abs(cx - seg.x) < 12)) {
              crossings.push(seg.x)
            }
          }
        }
      }

      // Sort crossings along the direction of travel
      if (dir > 0) {
        crossings.sort((a, b) => a - b)
      } else {
        crossings.sort((a, b) => b - a)
      }

      const bridgeRadius = 4

      for (const cx of crossings) {
        const approachX = cx - dir * bridgeRadius
        const exitX = cx + dir * bridgeRadius
        d += ` L ${approachX} ${y}`
        // Upward arc jumper hop:
        // When moving left-to-right (dir > 0), sweep-flag 0 produces upward arc.
        // When moving right-to-left (dir < 0), sweep-flag 1 produces upward arc.
        const sweep = dir > 0 ? 0 : 1
        d += ` A ${bridgeRadius} ${bridgeRadius} 0 0 ${sweep} ${exitX} ${y}`
      }

      if (!next || radius <= 0) {
        d += ` L ${curr.x} ${curr.y}`
        continue
      }
    }

    if (!next || radius <= 0) {
      d += ` L ${curr.x} ${curr.y}`
      continue
    }

    // Corner rounding using quadratic bezier curve
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

export function waypointsToPath(
  points: Point[],
  radius = BOARD.CORNER_RADIUS
): string {
  return waypointsToPathWithBridges(points, [], radius)
}
