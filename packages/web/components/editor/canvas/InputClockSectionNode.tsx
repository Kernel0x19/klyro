import React from 'react'
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react'

export interface InputClockNodeData {
  inputStates?: Record<string, boolean>
  clockStates?: Record<string, boolean>
  onToggleInput?: (pin: string) => void
  onToggleClock?: (pin: string) => void
  selectedFrequency?: string
  [key: string]: unknown
}

export type InputClockNodeType = Node<InputClockNodeData, 'inputClockPanel'>

const INPUT_PINS = [...Array(16).keys()].map((i) => String(15 - i))
const CLOCK_PINS = ['10', '5', '1', '0.5']

export default function InputClockSectionNode({
  data,
}: NodeProps<InputClockNodeType>) {
  const inputStates = data.inputStates || {}
  const clockStates = data.clockStates || {}

  return (
    <div
      className="relative bg-[#0ca5d7] rounded-xl shadow-lg border border-[#0a8cb8] px-6 py-4 flex items-center select-none"
      style={{ width: '1400px', height: '110px', color: '#111' }}
    >
      <div className="flex items-center gap-4.5 mt-3">
        {INPUT_PINS.map((pinName) => {
          const isHigh = inputStates[pinName] || false

          return (
            <div
              key={pinName}
              className="flex flex-col items-center justify-between h-13.75 w-5.5 relative"
            >
              <Handle
                type="source"
                position={Position.Top}
                id={`input-${pinName}`}
                style={{
                  top: '-12px',
                  background: '#333',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                }}
              />
              <div className="w-3 h-3 rounded-full border border-black bg-zinc-900 shadow-inner flex items-center justify-center">
                <div
                  className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                    isHigh
                      ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24]'
                      : 'bg-zinc-700'
                  }`}
                />
              </div>
              <div
                className="w-2 h-4 bg-zinc-800 rounded-sm p-px border border-zinc-950 flex flex-col justify-between cursor-pointer"
                onClick={() => data.onToggleInput?.(pinName)}
              >
                <div
                  className={`w-full h-1.5 rounded-sm bg-zinc-100 shadow transition-all ${
                    isHigh ? 'translate-y-0' : 'translate-y-1.75'
                  }`}
                />
              </div>
              <span className="text-[10px] font-bold text-[#054358]">
                {pinName}
              </span>
            </div>
          )
        })}

        <div className="flex flex-col items-center justify-between h-13.75 w-5.5 relative ml-4">
          <Handle
            type="source"
            position={Position.Top}
            id="input-gnd"
            style={{
              top: '-12px',
              background: '#333',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
            }}
          />
          <div className="w-3 h-3 rounded-full border border-black bg-zinc-900 shadow-inner flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
          </div>
          <div className="w-1 h-2.5 bg-zinc-400 rounded-sm shadow border border-zinc-600" />
          <span className="text-[10px] font-bold text-[#054358]">GND</span>
        </div>
      </div>

      <div className="absolute bottom-1 left-[25%] transform -translate-x-1/2 text-[11px] font-black tracking-wider text-[#054358]">
        INPUT SECTION
      </div>

      <div className="ml-auto flex items-center gap-8 pr-2 mt-3">
        <div className="flex items-center gap-4.5 relative">
          {CLOCK_PINS.map((clkName) => {
            const isClkHigh = clockStates[clkName] || false

            return (
              <div
                key={clkName}
                className="flex flex-col items-center justify-between h-13.75 w-5.5 relative cursor-pointer"
                onClick={() => data.onToggleClock?.(clkName)}
              >
                <Handle
                  type="source"
                  position={Position.Top}
                  id={`clock-${clkName}`}
                  style={{
                    top: '-12px',
                    background: '#333',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                  }}
                />
                <div className="w-3 h-3 rounded-full border border-black bg-zinc-900 shadow-inner flex items-center justify-center">
                  <div
                    className={`w-1.5 h-1.5 rounded-full transition-colors duration-150 ${
                      isClkHigh
                        ? 'bg-red-500 shadow-[0_0_6px_#ef4444]'
                        : 'bg-zinc-700'
                    }`}
                  />
                </div>
                <div className="w-1 h-2.5 bg-zinc-400 rounded-sm shadow border border-zinc-600" />
                <span className="text-[10px] font-bold text-[#054358]">
                  {clkName}
                </span>
              </div>
            )
          })}
          <div className="absolute top-14.5 left-1/2 transform -translate-x-1/2 text-[11px] font-black tracking-wider text-[#054358] whitespace-nowrap">
            CLOCK SECTION
          </div>
        </div>

        <div className="flex items-center gap-4 pl-4 border-l-2 border-[#096d8f]/30">
          <div className="flex gap-3 text-[9px] font-black text-[#054358] font-mono">
            <span className="flex flex-col items-center gap-0.5">
              HIGH
              <div className="w-2 h-2 rounded-full bg-zinc-900 border border-black" />
            </span>
            <span className="flex flex-col items-center gap-0.5">
              LOW
              <div className="w-2 h-2 rounded-full bg-zinc-900 border border-black" />
            </span>
          </div>

          <button className="relative w-35 h-14 bg-linear-to-b from-zinc-800 to-zinc-950 rounded-lg border-2 border-zinc-900 shadow-md flex items-center justify-center gap-1.5 px-2 text-white active:scale-95 transition-transform overflow-hidden group">
            <svg
              className="w-5 h-5 text-red-500 filter drop-shadow-[0_0_2px_#ef4444]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 12h3l3-9 4 18 3-12h5"
              />
            </svg>
            <span className="text-[10px] font-black tracking-wider font-mono text-zinc-300 uppercase">
              GENERATE PULSE
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
