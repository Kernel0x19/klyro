'use client'
import React from 'react'
import { Handle, Position } from '@xyflow/react'

interface ASMDecisionNodeData {
  condition: string
}

export default function ASMDecisionNode({ data }: { data: ASMDecisionNodeData }) {
  return (
    <div className="relative flex items-center justify-center w-36 h-20 select-none font-mono">
      {/* SVG Diamond */}
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <polygon
          points="72,2 142,40 72,78 2,40"
          className="fill-surface stroke-amber-500 stroke-2 drop-shadow-md"
        />
      </svg>

      {/* Condition Text */}
      <div className="relative z-10 px-2 text-center text-xs font-bold text-amber-400">
        {data.condition}
      </div>

      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-amber-500" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-amber-500" />
      <Handle type="source" position={Position.Right} id="true" className="!w-2 !h-2 !bg-green-500" />
      <Handle type="source" position={Position.Left} id="false" className="!w-2 !h-2 !bg-red-500" />
    </div>
  )
}
