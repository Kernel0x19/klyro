'use client'
import React from 'react'
import { Handle, Position } from '@xyflow/react'

interface ASMStateNodeData {
  name: string
  code?: string
  outputs?: Record<string, 0 | 1>
}

export default function ASMStateNode({ data }: { data: ASMStateNodeData }) {
  const outputList = data.outputs ? Object.entries(data.outputs) : []

  return (
    <div className="w-44 border-2 border-[#4F6EF7] bg-surface rounded-sm shadow-md font-mono select-none">
      {/* Top Header: State Name on Left, Code on Right */}
      <div className="flex items-center justify-between px-2.5 py-1 border-b border-border-theme bg-[#4F6EF7]/15 text-xs font-bold text-text-primary">
        <span>{data.name}</span>
        {data.code && <span className="text-blue-300 font-mono text-[11px]">[{data.code}]</span>}
      </div>

      {/* Body: Moore Outputs */}
      <div className="p-2 min-h-[36px] flex flex-col justify-center items-center text-xs">
        {outputList.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {outputList.map(([k, v]) => (
              <span
                key={k}
                className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                  v === 1 ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {k} = {v}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-[11px] text-neutral-500 italic">No Outputs</span>
        )}
      </div>

      {/* Handles on 4 sides */}
      <Handle type="target" position={Position.Top} id="top" className="!w-2.5 !h-2.5 !bg-[#4F6EF7] !border-none" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="!w-2.5 !h-2.5 !bg-[#4F6EF7] !border-none" />
      <Handle type="target" position={Position.Left} id="left" className="!w-2.5 !h-2.5 !bg-[#4F6EF7] !border-none" />
      <Handle type="target" position={Position.Right} id="right" className="!w-2.5 !h-2.5 !bg-[#4F6EF7] !border-none" />
    </div>
  )
}
