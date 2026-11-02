import React from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

export interface ICBaseNodeData {
  label?: string
  icDefinition?: {
    partNumber: string
    name: string
    packageType: string
    family: string
    delay: number
    vcc: number
    gnd: number
  } | null
  onSelect?: () => void
  isSelected?: boolean
  [key: string]: unknown
}

export type ICBaseNodeType = Node<ICBaseNodeData, 'icBaseNode'>

const LEFT_PINS = Array.from({ length: 10 }, (_, i) => i + 1)
const RIGHT_PINS = Array.from({ length: 10 }, (_, i) => 20 - i)

export default function ICBaseNode({ data }: NodeProps<ICBaseNodeType>) {
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ width: '150px', height: '220px' }}
    >
      <div className="flex flex-col justify-between items-end h-47.5 w-7.5 pr-1">
        {LEFT_PINS.map((pinNum) => (
          <div
            key={pinNum}
            className="flex items-center justify-end h-4 w-full relative"
          >
            <span className="text-[10px] text-zinc-100 font-black font-mono bg-black/50 px-1 rounded-sm border border-zinc-800">
              {pinNum}
            </span>
            <div className="w-1.5 h-1 bg-zinc-400 border border-zinc-600 rounded-l-sm ml-1" />
            <Handle
              type="target"
              position={Position.Left}
              id={`pin-${pinNum}`}
              style={{
                left: '26px',
                background: '#e4e4e7',
                width: '8px',
                height: '8px',
                border: '1px solid #111',
                zIndex: 10,
              }}
            />
          </div>
        ))}
      </div>
      <div
        className={`relative bg-[#1a1a1a] rounded-md flex items-center justify-center shadow-xl cursor-pointer transition-all ${
          data.isSelected
            ? 'border-[3px] border-[#4F6EF7]'
            : 'border-[3px] border-[#0a0a0a] hover:border-zinc-600'
        }`}
        style={{ width: '90px', height: '220px' }}
        onClick={() => data.onSelect?.()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-[#262626] rounded-b-full border-b-2 border-black" />
        <div
          style={{ transform: 'rotate(90deg)' }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[13px] font-black text-zinc-400 tracking-widest uppercase font-mono whitespace-nowrap">
            {data.icDefinition?.partNumber || data.label || 'IC BASE'}
          </span>
          {data.icDefinition && (
            <span className="text-[9px] text-zinc-600 font-mono whitespace-nowrap">
              {data.icDefinition.name}
            </span>
          )}
        </div>
      </div>
      <div className="flex flex-col justify-between items-start h-47.5 w-7.5 pl-1">
        {RIGHT_PINS.map((pinNum) => (
          <div
            key={pinNum}
            className="flex items-center justify-start h-4 w-full relative"
          >
            <div className="w-1.5 h-1 bg-zinc-400 border border-zinc-600 rounded-r-sm mr-1" />
            <span className="text-[10px] text-zinc-100 font-black font-mono bg-black/50 px-1 rounded-sm border border-zinc-800">
              {pinNum}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={`pin-${pinNum}`}
              style={{
                right: '26px',
                background: '#e4e4e7',
                width: '8px',
                height: '8px',
                border: '1px solid #111',
                zIndex: 10,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
