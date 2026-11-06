import { useState } from 'react'
import { type EdgeProps, useEdges } from '@xyflow/react'
import { manhattanRoute, waypointsToPath } from '@/lib/manhattanRouter'
import { useBoardStore } from '@/stores/useBoardStore'
const signalColors: Record<string, string> = {
  HIGH: '#22c55e',
  LOW: '#ef4444',
  unconnected: '#6b7280',
  X: '#f59e0b',
  conflict: '#f97316',
}
export default function SignalEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  data,
  selected,
}: EdgeProps) {
  const [hovered, setHovered] = useState(false)
  const activeTool = useBoardStore((s) => s.activeTool)
  const isDeleteMode = activeTool === 'delete'
  const isDeleteHighlight = isDeleteMode && hovered
  const edges = useEdges()
  const edgeIndex = edges.findIndex((e) => e.id === id)
  const waypoints = manhattanRoute(
    { x: sourceX, y: sourceY },
    { x: targetX, y: targetY },
    edges,
    id,
    edgeIndex >= 0 ? edgeIndex : 0
  )
  const edgePath = waypointsToPath(waypoints)
  const state = (data?.signalState as string) ?? 'unconnected'
  const color = signalColors[state] ?? '#6b7280'
  return (
    <g className="react-flow__edge-signal">
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={isDeleteHighlight ? '#ef4444' : selected ? '#ffffff' : color}
        strokeWidth={isDeleteHighlight ? 3.5 : selected ? 3 : 2}
        strokeDasharray={isDeleteHighlight ? '6,3' : 'none'}
        style={{
          filter: isDeleteHighlight
            ? 'drop-shadow(0 0 6px rgba(239, 68, 68, 0.95))'
            : selected
            ? 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
            : 'none',
          transition: 'stroke 0.15s ease, filter 0.15s ease',
        }}
      />
      {/* Invisible wider hit area for easy clicking and hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        style={{ pointerEvents: 'stroke', cursor: isDeleteMode ? 'pointer' : 'default' }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      />
    </g>
  )
}
