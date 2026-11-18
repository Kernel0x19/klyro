'use client'
import React from 'react'
import { Handle, Position } from '@xyflow/react'

interface ASMDecisionNodeData {
  condition: string
}

export default function ASMDecisionNode({ data }: { data: ASMDecisionNodeData }) {
  return (
    <div className="relative flex items-center justify-center w-32 h-18 select-none font-mono">
      {/* SVG Diamond */}
      <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
        <polygon
          points="64,2 126,36 64,70 2,36"
          className="fill-surface stroke-amber-500 stroke-2 drop-shadow-md"
        />
      </svg>

      {/* Condition Variable Text inside Diamond */}
      <div className="relative z-10 px-2 text-center text-sm font-bold text-amber-400">
        {data.condition}
      </div>

      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-amber-500 !border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-amber-500 !border-none" />
      <Handle type="source" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-amber-500 !border-none" />
      <Handle type="source" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-amber-500 !border-none" />
    </div>
  )
}
