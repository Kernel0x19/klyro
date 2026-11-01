import React from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

export interface OutputSectionNodeData {
  pinStates?: Record<string, boolean>
  displayValues?: [string | number, string | number]
  isPowerOn?: boolean
  [key: string]: unknown
}

export type OutputSectionNodeType = Node<
  OutputSectionNodeData,
  'hardwareOutputPanel'
>
const PINS: Array<string> = [...Array(16).keys()]
  .map((i) => String(15 - i))
  .concat(['VCC'])

export default function OutputSectionNode({
  data,
}: NodeProps<OutputSectionNodeType>) {
  const pinStates = data.pinStates || {}
  const displayValues = data.displayValues || ['0', '0']
  const isPowerOn = data.isPowerOn ?? true

  return (
    <div
      className="relative bg-[#0ca5d7] rounded-xl shadow-lg border border-[#0a8cb8] px-6 py-4 flex items-center select-none"
      style={{ width: '1100px', height: '110px', color: '#111' }}
    >
      <div className="absolute top-2 left-[25%] transform -translate-x-1/2 text-[11px] font-black tracking-wider text-[#054358]">
        OUTPUT SECTION
      </div>

      <div className="flex items-center gap-4.5 mt-3">
        {PINS.map((pinName) => {
          const isPinHigh = pinStates[pinName] && isPowerOn

          return (
            <div
              key={pinName}
              className="flex flex-col items-center justify-between h-13.5 w-5.5 relative"
            >
              <span className="text-[10px] font-bold text-[#054358]">
                {pinName}
              </span>
              <div className="w-3 h-3 rounded-full border border-black bg-zinc-900 shadow-inner flex items-center justify-center">
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                    isPinHigh
                      ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                      : 'bg-zinc-700'
                  }`}
                />
              </div>
              <div className="w-1 h-2.5 bg-zinc-400 rounded-sm shadow border border-zinc-600" />
              <Handle
                type="source"
                position={Position.Bottom}
                id={`pin-${pinName}`}
                style={{
                  bottom: '-12px',
                  background: '#333',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="ml-auto flex items-center gap-6 pr-2">
        <div className="flex gap-2 bg-[#18181b] p-1.5 rounded-lg border-2 border-[#096d8f]">
          {displayValues.map((val, displayIndex) => (
            <div
              key={displayIndex}
              className="w-9 h-14 bg-black rounded flex items-center justify-center font-mono text-3xl text-zinc-800 border border-zinc-800 relative"
            >
              <span className="opacity-5 text-zinc-700 absolute selection:bg-transparent">
                8
              </span>

              <span
                className={`transition-colors duration-150 font-bold ${
                  isPowerOn
                    ? 'text-[#ff3b30] filter drop-shadow-[0_0_4px_#ff3b30]'
                    : 'text-zinc-900'
                }`}
              >
                {isPowerOn ? val : ''}
              </span>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-[9px] font-black text-[#054358] tracking-tight">
            Power
          </span>
          <button
            className={`w-9 h-9 rounded-full border border-black flex items-center justify-center shadow-md active:scale-95 transition-all text-zinc-400 ${
              isPowerOn
                ? 'bg-zinc-900 text-emerald-400'
                : 'bg-zinc-950 text-zinc-600'
            }`}
          >
            <svg
              xmlns="http://w3.org"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.636 5.636a9 9 0 1 0 12.728 0M12 3v9"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
