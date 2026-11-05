import React from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'
import { IC_LIBRARY, type ICPin } from '@/lib/icLibrary'
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
function getICEntry(partNumber: string) {
  for (const category of IC_LIBRARY) {
    const found = category.ics.find((ic) => ic.part === partNumber)
    if (found) return found
  }
  return null
}
function handleType(fn: ICPin['function']): 'source' | 'target' {
  return fn === 'output' ? 'source' : 'target'
}
function pinDotColor(fn: ICPin['function']): string {
  switch (fn) {
    case 'output':
      return '#fbbf24' 
    case 'clock':
      return '#60a5fa' 
    case 'vcc':
      return '#f87171' 
    case 'gnd':
      return '#52525b' 
    case 'nc':
      return '#3f3f46' 
    default:
      return '#a1a1aa' 
  }
}
const DEFAULT_LEFT_PINS: ICPin[] = Array.from({ length: 10 }, (_, i) => ({
  number: i + 1,
  label: String(i + 1),
  function: 'input' as const,
}))
const DEFAULT_RIGHT_PINS: ICPin[] = Array.from({ length: 10 }, (_, i) => ({
  number: 20 - i,
  label: String(20 - i),
  function: 'output' as const,
}))
export default function ICBaseNode({ data }: NodeProps<ICBaseNodeType>) {
  const partNumber = data.icDefinition?.partNumber
  const icEntry = partNumber ? getICEntry(partNumber) : null
  let leftPins: ICPin[]
  let rightPins: ICPin[]
  if (icEntry) {
    const total = icEntry.pins.length
    const half = total / 2
    leftPins = icEntry.pins.slice(0, half)
    rightPins = [...icEntry.pins.slice(half)].reverse()
  } else {
    leftPins = DEFAULT_LEFT_PINS
    rightPins = DEFAULT_RIGHT_PINS
  }
  const pinCount = leftPins.length 
  const bodyH = pinCount * 22 
  return (
    <div
      className="flex items-center justify-center select-none"
      style={{ width: '150px', height: `${bodyH}px` }}
    >
      {}
      <div
        className="flex flex-col justify-between items-end pr-1"
        style={{ height: `${bodyH - 8}px`, width: '30px' }}
      >
        {leftPins.map((pin) => (
          <div
            key={pin.number}
            className="flex items-center justify-end h-4 w-full relative"
          >
            <span className="text-[9px] text-zinc-100 font-black font-mono bg-black/50 px-0.5 rounded-sm border border-zinc-800 leading-tight">
              {pin.label}
            </span>
            <div
              className="w-1.5 h-1 rounded-l-sm ml-0.5 border"
              style={{
                background: pinDotColor(pin.function),
                borderColor: pinDotColor(pin.function),
                opacity: pin.function === 'nc' ? 0.3 : 1,
              }}
            />
            <Handle
              type={handleType(pin.function)}
              position={Position.Left}
              id={`pin-${pin.number}`}
              style={{
                left: '22px',
                background: pinDotColor(pin.function),
                width: '8px',
                height: '8px',
                border: '1px solid #111',
                zIndex: 10,
                opacity: pin.function === 'nc' ? 0 : 1,
                pointerEvents: pin.function === 'nc' ? 'none' : 'auto',
              }}
            />
          </div>
        ))}
      </div>
      {}
      <div
        className={`relative bg-[#1a1a1a] rounded-md flex items-center justify-center shadow-xl cursor-pointer transition-all ${
          data.isSelected
            ? 'border-[3px] border-[#4F6EF7]'
            : 'border-[3px] border-[#0a0a0a] hover:border-zinc-600'
        }`}
        style={{ width: '90px', height: `${bodyH}px` }}
        onClick={() => data.onSelect?.()}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-3 bg-[#262626] rounded-b-full border-b-2 border-black" />
        <div
          style={{ transform: 'rotate(90deg)' }}
          className="flex flex-col items-center gap-0.5"
        >
          <span className="text-[13px] font-black text-zinc-400 tracking-widest uppercase font-mono whitespace-nowrap">
            {icEntry?.part || data.label || 'IC BASE'}
          </span>
          {icEntry && (
            <span className="text-[9px] text-zinc-600 font-mono whitespace-nowrap">
              {icEntry.name}
            </span>
          )}
        </div>
      </div>
      {}
      <div
        className="flex flex-col justify-between items-start pl-1"
        style={{ height: `${bodyH - 8}px`, width: '30px' }}
      >
        {rightPins.map((pin) => (
          <div
            key={pin.number}
            className="flex items-center justify-start h-4 w-full relative"
          >
            <div
              className="w-1.5 h-1 rounded-r-sm mr-0.5 border"
              style={{
                background: pinDotColor(pin.function),
                borderColor: pinDotColor(pin.function),
                opacity: pin.function === 'nc' ? 0.3 : 1,
              }}
            />
            <span className="text-[9px] text-zinc-100 font-black font-mono bg-black/50 px-0.5 rounded-sm border border-zinc-800 leading-tight">
              {pin.label}
            </span>
            <Handle
              type={handleType(pin.function)}
              position={Position.Right}
              id={`pin-${pin.number}`}
              style={{
                right: '22px',
                background: pinDotColor(pin.function),
                width: '8px',
                height: '8px',
                border: '1px solid #111',
                zIndex: 10,
                opacity: pin.function === 'nc' ? 0 : 1,
                pointerEvents: pin.function === 'nc' ? 'none' : 'auto',
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
