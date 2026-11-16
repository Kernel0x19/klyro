'use client'
import React from 'react'
import { Handle, Position } from '@xyflow/react'

interface ASMCondOutputNodeData {
  outputs: Record<string, 0 | 1>
}

export default function ASMCondOutputNode({ data }: { data: ASMCondOutputNodeData }) {
  const outputList = Object.entries(data.outputs ?? {})

  return (
    <div className="w-36 py-2 px-3 border-2 border-emerald-500 rounded-2xl bg-surface shadow-md font-mono select-none flex flex-col items-center justify-center">
      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1">
        Conditional Out
      </span>
      {outputList.length > 0 ? (
        <div className="flex flex-wrap gap-1 justify-center">
          {outputList.map(([k, v]) => (
            <span
              key={k}
              className={`px-1 rounded text-[10px] font-bold ${
                v === 1 ? 'bg-green-500/20 text-green-400' : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {k}={v}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-[10px] text-neutral-500 italic">None</span>
      )}

      <Handle type="target" position={Position.Top} className="!w-2 !h-2 !bg-emerald-500" />
      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2 !bg-emerald-500" />
    </div>
  )
}
