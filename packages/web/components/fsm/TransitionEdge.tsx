'use client'
import React from 'react'
import {
  BaseEdge,
  EdgeLabelRenderer,
  type EdgeProps,
} from '@xyflow/react'
import { useFSMStore } from '@/stores/useFSMStore'

interface TransitionEdgeData {
  condition?: string
  mealyOutputs?: Record<string, 0 | 1>
  curveOffset?: number
  isSelfLoop?: boolean
  loopDirection?: 'top' | 'right' | 'bottom' | 'left'
  onEdit?: (id: string) => void
}

export default function TransitionEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  style = {},
  markerEnd,
  data,
}: EdgeProps) {
  const machineType = useFSMStore((s) => s.machineType)

  const edgeData = data as TransitionEdgeData | undefined
  const condition = edgeData?.condition ?? '1'
  const mealyOutputs = edgeData?.mealyOutputs ?? {}
  const curveOffset = edgeData?.curveOffset ?? 0
  const isSelfLoop =
    edgeData?.isSelfLoop ||
    (Math.abs(sourceX - targetX) < 15 && Math.abs(sourceY - targetY) < 15)
  const loopDirection = edgeData?.loopDirection ?? 'top'

  let edgePath = ''
  let labelX = (sourceX + targetX) / 2
  let labelY = (sourceY + targetY) / 2

  if (isSelfLoop) {
    const loopSpan = 40
    if (loopDirection === 'top') {
      edgePath = `M ${sourceX - 10} ${sourceY} C ${sourceX - 35} ${sourceY - loopSpan}, ${sourceX + 35} ${sourceY - loopSpan}, ${targetX + 10} ${targetY}`
      labelX = sourceX
      labelY = sourceY - loopSpan - 4
    } else if (loopDirection === 'bottom') {
      edgePath = `M ${sourceX + 10} ${sourceY} C ${sourceX + 35} ${sourceY + loopSpan}, ${sourceX - 35} ${sourceY + loopSpan}, ${targetX - 10} ${targetY}`
      labelX = sourceX
      labelY = sourceY + loopSpan + 4
    } else if (loopDirection === 'right') {
      edgePath = `M ${sourceX} ${sourceY - 10} C ${sourceX + loopSpan} ${sourceY - 35}, ${sourceX + loopSpan} ${sourceY + 35}, ${targetX} ${targetY + 10}`
      labelX = sourceX + loopSpan + 4
      labelY = sourceY
    } else {
      // left
      edgePath = `M ${sourceX} ${sourceY + 10} C ${sourceX - loopSpan} ${sourceY + 35}, ${sourceX - loopSpan} ${sourceY - 35}, ${targetX} ${targetY - 10}`
      labelX = sourceX - loopSpan - 4
      labelY = sourceY
    }
  } else {
    // Inter-state curved transition
    const dx = targetX - sourceX
    const dy = targetY - sourceY
    const dist = Math.hypot(dx, dy)

    if (dist < 1 || curveOffset === 0) {
      edgePath = `M ${sourceX} ${sourceY} L ${targetX} ${targetY}`
      labelX = (sourceX + targetX) / 2
      labelY = (sourceY + targetY) / 2
    } else {
      // Normal vector to the right of travel direction
      const nx = -dy / dist
      const ny = dx / dist

      const midX = (sourceX + targetX) / 2
      const midY = (sourceY + targetY) / 2

      const ctrlX = midX + nx * curveOffset
      const ctrlY = midY + ny * curveOffset

      edgePath = `M ${sourceX} ${sourceY} Q ${ctrlX} ${ctrlY} ${targetX} ${targetY}`

      // Quadratic bezier midpoint at t=0.5:
      labelX = midX + nx * (curveOffset * 0.55)
      labelY = midY + ny * (curveOffset * 0.55)
    }
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
          className="nodrag nopan px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#0c1020]/95 border border-[#4F6EF7]/60 text-blue-200 hover:border-[#4F6EF7] hover:text-white transition-colors cursor-pointer shadow-md select-none"
        >
          {labelText}
        </div>
      </EdgeLabelRenderer>
    </>
  )
}
