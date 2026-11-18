'use client'
import React from 'react'
import { Handle, Position } from '@xyflow/react'
import { useFSMStore } from '@/stores/useFSMStore'

interface StateNodeData {
  id: string
  name: string
  isInitial: boolean
  code?: string
  mooreOutputs?: Record<string, 0 | 1>
  onEdit?: (id: string) => void
}

export default function StateNode({ data }: { data: StateNodeData }) {
  const activeStateId = useFSMStore((s) => s.activeStateId)
  const machineType = useFSMStore((s) => s.machineType)
  const isActive = activeStateId === data.id

  const mooreList =
    machineType === 'moore' && data.mooreOutputs
      ? Object.entries(data.mooreOutputs)
      : []

  return (
    <div
      onDoubleClick={() => data.onEdit?.(data.id)}
      className={`group relative flex flex-col items-center justify-center w-24 h-24 rounded-full border-2 transition-all duration-200 cursor-pointer select-none bg-surface ${
        isActive
          ? 'border-[#4F6EF7] ring-4 ring-[#4F6EF7]/40 shadow-[0_0_25px_rgba(79,110,247,0.6)] scale-105'
          : 'border-neutral-500 hover:border-[#4F6EF7]/80 shadow-lg'
      }`}
    >
      {/* Reset / Initial State indicator arrow placed cleanly above circle */}
      {data.isInitial && (
        <div
          title="Initial / Reset State"
          className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none select-none z-10"
        >
          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-green-500/20 text-green-400 border border-green-500/50 uppercase tracking-wider shadow-md">
            INIT
          </span>
          <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-green-400 -mt-px drop-shadow-sm" />
        </div>
      )}

      {/* State Name */}
      <span className="text-xs font-bold font-mono text-text-primary text-center px-1 truncate max-w-[80px]">
        {data.name}
      </span>

      {/* State Code Encoding */}
      {data.code && (
        <span className="text-[10px] font-mono text-text-secondary">
          {data.code}
        </span>
      )}

      {/* Moore outputs inside state */}
      {mooreList.length > 0 && (
        <div className="flex gap-1 mt-0.5 max-w-[80px] overflow-hidden">
          {mooreList.map(([k, v]) => (
            <span
              key={k}
              className={`text-[9px] font-mono px-1 rounded ${
                v === 1
                  ? 'bg-green-500/20 text-green-400 font-bold'
                  : 'bg-neutral-800 text-neutral-400'
              }`}
            >
              {k}:{v}
            </span>
          ))}
        </div>
      )}

      {/* Connection Handles: Hidden by default, fade in on hover so no extra dots clutter the circles */}
      {/* TOP */}
      <Handle
        id="top"
        type="source"
        position={Position.Top}
        className="!w-3 !h-3 !bg-[#4F6EF7] !border-2 !border-white/80 transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-125 cursor-crosshair shadow-sm"
      />
      <Handle
        id="top-in"
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-transparent !border-none pointer-events-none"
      />

      {/* RIGHT */}
      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-[#4F6EF7] !border-2 !border-white/80 transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-125 cursor-crosshair shadow-sm"
      />
      <Handle
        id="right-in"
        type="target"
        position={Position.Right}
        className="!w-3 !h-3 !bg-transparent !border-none pointer-events-none"
      />

      {/* BOTTOM */}
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-[#4F6EF7] !border-2 !border-white/80 transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-125 cursor-crosshair shadow-sm"
      />
      <Handle
        id="bottom-in"
        type="target"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-transparent !border-none pointer-events-none"
      />

      {/* LEFT */}
      <Handle
        id="left"
        type="source"
        position={Position.Left}
        className="!w-3 !h-3 !bg-[#4F6EF7] !border-2 !border-white/80 transition-all duration-150 opacity-0 group-hover:opacity-100 hover:scale-125 cursor-crosshair shadow-sm"
      />
      <Handle
        id="left-in"
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-transparent !border-none pointer-events-none"
      />
    </div>
  )
}
