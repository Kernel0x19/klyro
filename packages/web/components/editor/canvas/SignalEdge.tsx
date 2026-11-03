import { type EdgeProps, useEdges } from '@xyflow/react'
import { manhattanRoute, waypointsToPath } from '@/lib/manhattanRouter'

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
    <path
      id={id}
      d={edgePath}
      fill="none"
      stroke={selected ? '#ffffff' : color}
      strokeWidth={selected ? 3 : 2}
      style={{
        filter: selected
          ? 'drop-shadow(0 0 4px rgba(255,255,255,0.6))'
          : 'none',
      }}
    />
  )
}
