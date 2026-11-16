'use client'
import React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from '@xyflow/react'
import { useFSMStore } from '@/stores/useFSMStore'

interface TransitionEdgeData {
  condition?: string
  mealyOutputs?: Record<string, 0 | 1>
  onEdit?: (id: string) => void
}

export default function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const isSelfLoop = Math.abs(sourceX - targetX) < 5 && Math.abs(sourceY - targetY) < 5
  const machineType = useFSMStore((s) => s.machineType)

  const edgeData = data as TransitionEdgeData | undefined
  const condition = edgeData?.condition ?? '1'
  const mealyOutputs = edgeData?.mealyOutputs ?? {}

  let edgePath = ''
  let labelX = (sourceX + targetX) / 2
  let labelY = (sourceY + targetY) / 2

  if (isSelfLoop) {
    // Custom loop path above the node
    const r = 35
    edgePath = `M ${sourceX} ${sourceY} C ${sourceX - r} ${sourceY - r * 2.2}, ${sourceX + r} ${sourceY - r * 2.2}, ${targetX} ${targetY}`
    labelX = sourceX
    labelY = sourceY - r * 1.8
  } else {
    const [path, lx, ly] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    })
    edgePath = path
    labelX = lx
    labelY = ly
  }

  // Format label string
  let labelText = condition || '1'
  if (machineType === 'mealy' && Object.keys(mealyOutputs).length > 0) {
    const outs = Object.entries(mealyOutputs)
      .map(([k, v]) => `${k}=${v}`)
      .join(',')
    labelText = `${labelText} / ${outs}`
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        {...(markerEnd ? { markerEnd } : {})}
        style={{
          stroke: '#4F6EF7',
          strokeWidth: 2,
          ...style,
        }}
      />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          onDoubleClick={() => edgeData?.onEdit?.(id)}
          className="nodrag nopan px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-900 border border-neutral-700 text-neutral-200 hover:border-[#4F6EF7] hover:text-white transition-colors cursor-pointer shadow-sm select-none"
        >
          {labelText}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
