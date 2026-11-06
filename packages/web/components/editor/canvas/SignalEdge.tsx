import { useMemo } from 'react'
import { type EdgeProps, useEdges } from '@xyflow/react'
import { computeManhattanDetails } from '@/lib/manhattanRouter'
import { useBoardStore } from '@/stores/useBoardStore'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'

export const NET_PALETTE = [
  '#06b6d4', // Cyan
  '#f59e0b', // Amber
  '#8b5cf6', // Violet
  '#10b981', // Emerald
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#ec4899', // Pink
  '#84cc16', // Lime
  '#14b8a6', // Teal
  '#a855f7', // Purple
  '#f43f5e', // Rose
  '#eab308', // Gold
]

export function getNetColor(sourceNode?: string, sourceHandle?: string | null): string {
  const key = `${sourceNode ?? ''}:${sourceHandle ?? ''}`
  let hash = 0
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i)
    hash |= 0
  }
  const index = Math.abs(hash) % NET_PALETTE.length
  return NET_PALETTE[index]!
}

function formatEndpointLabel(nodeId?: string, handleId?: string | null): string {
  if (!nodeId) return 'Pin'
  if (nodeId === 'main-input-clock-panel') {
    if (handleId === 'input-gnd') return 'GND'
    if (handleId?.startsWith('clock-')) return `CLK ${handleId.replace('clock-', '')}Hz`
    return `IN ${handleId?.replace('input-', '') ?? ''}`
  }
  if (nodeId === 'main-output-panel') {
    if (handleId === 'pin-VCC') return 'VCC'
    return `OUT ${handleId?.replace('pin-', '') ?? ''}`
  }
  if (nodeId.startsWith('ic-chip-')) {
    const chipNum = nodeId.replace('ic-chip-', '')
    const pin = handleId?.replace('pin-', '') ?? ''
    return `IC ${chipNum} Pin ${pin}`
  }
  return `${nodeId}:${handleId}`
}

const signalColors: Record<string, string> = {
  HIGH: '#22c55e',
  LOW: '#ef4444',
  X: '#f59e0b',
  conflict: '#f97316',
}

export default function SignalEdge({
  id,
  source,
  target,
  sourceHandleId,
  targetHandleId,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps) {
  const activeTool = useBoardStore((s) => s.activeTool)
  const isDeleteMode = activeTool === 'delete'

  const hoveredEdgeId = useEditorEdgesStore((s) => s.hoveredEdgeId)
  const setHoveredEdgeId = useEditorEdgesStore((s) => s.setHoveredEdgeId)

  const isThisHovered = hoveredEdgeId === id
  const isAnyHovered = Boolean(hoveredEdgeId)
  const isDeleteHighlight = isDeleteMode && isThisHovered

  const edges = useEdges()
  const edgeIndex = edges.findIndex((e) => e.id === id)

  const { waypoints, path: edgePath } = useMemo(
    () =>
      computeManhattanDetails(
        { x: sourceX, y: sourceY },
        { x: targetX, y: targetY },
        edges,
        id,
        edgeIndex >= 0 ? edgeIndex : 0
      ),
    [sourceX, sourceY, targetX, targetY, edges, id, edgeIndex]
  )

  const netColor = useMemo(
    () => getNetColor(source, sourceHandleId),
    [source, sourceHandleId]
  )

  const state = (data?.signalState as string) ?? 'unconnected'
  const displayColor =
    state === 'unconnected' ? netColor : signalColors[state] ?? netColor

  // Midpoint coordinate for tooltip label
  const midPoint = useMemo(() => {
    if (waypoints.length === 0) return { x: (sourceX + targetX) / 2, y: (sourceY + targetY) / 2 }
    const midIdx = Math.floor(waypoints.length / 2)
    return waypoints[midIdx]!
  }, [waypoints, sourceX, targetX, sourceY, targetY])

  const sourceLabel = formatEndpointLabel(source, sourceHandleId)
  const targetLabel = formatEndpointLabel(target, targetHandleId)

  const opacity = isAnyHovered ? (isThisHovered ? 1 : 0.2) : 1
  const strokeWidth = isDeleteHighlight ? 3.5 : isThisHovered ? 3.5 : selected ? 3 : 2

  return (
    <g
      className="react-flow__edge-signal"
      style={{
        opacity,
        transition: 'opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: isThisHovered ? 50 : 1,
      }}
    >
      {/* Background glow when hovered or selected */}
      {(isThisHovered || selected) && !isDeleteHighlight && (
        <path
          d={edgePath}
          fill="none"
          stroke={displayColor}
          strokeWidth={strokeWidth + 5}
          strokeOpacity={0.35}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            filter: `drop-shadow(0 0 8px ${displayColor})`,
          }}
        />
      )}

      {/* Main Signal Path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isDeleteHighlight ? '#ef4444' : selected ? '#ffffff' : displayColor}
        strokeWidth={strokeWidth}
        strokeDasharray={isDeleteHighlight ? '6,3' : 'none'}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          filter: isDeleteHighlight
            ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.95))'
            : selected
            ? 'drop-shadow(0 0 4px rgba(255,255,255,0.8))'
            : isThisHovered
            ? `drop-shadow(0 0 6px ${displayColor})`
            : 'none',
          transition: 'stroke 0.15s ease, stroke-width 0.15s ease, filter 0.15s ease',
        }}
      />

      {/* Invisible wider hit area for easy clicking and hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{
          pointerEvents: 'stroke',
          cursor: isDeleteMode ? 'pointer' : 'pointer',
        }}
        onMouseEnter={() => setHoveredEdgeId(id)}
        onMouseLeave={() => setHoveredEdgeId(null)}
      />

      {/* Interactive Net Tooltip when Hovered */}
      {isThisHovered && !isDeleteMode && (
        <foreignObject
          x={midPoint.x - 90}
          y={midPoint.y - 34}
          width={180}
          height={30}
          className="pointer-events-none select-none overflow-visible"
        >
          <div
            className="flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono font-bold shadow-2xl border"
            style={{
              backgroundColor: '#090d16',
              borderColor: displayColor,
              color: '#ffffff',
              boxShadow: `0 4px 12px rgba(0,0,0,0.7), 0 0 8px ${displayColor}55`,
            }}
          >
            <span style={{ color: displayColor }}>{sourceLabel}</span>
            <span className="text-zinc-500">→</span>
            <span className="text-zinc-200">{targetLabel}</span>
            {state !== 'unconnected' && (
              <span
                className="ml-1 px-1 rounded text-[9px]"
                style={{
                  backgroundColor: state === 'HIGH' ? '#22c55e22' : '#ef444422',
                  color: state === 'HIGH' ? '#22c55e' : '#ef4444',
                }}
              >
                {state}
              </span>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  )
}
