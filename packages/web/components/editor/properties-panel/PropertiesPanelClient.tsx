'use client'
import { useState, useEffect } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  Cpu,
} from 'lucide-react'
const t = {
  background: 'var(--background)',
  surface: 'var(--surface)',
  surfaceElevated: 'var(--surface-elevated)',
  border: 'var(--border)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
}
const stateColors: Record<string, string> = {
  HIGH: '#22c55e',
  LOW: '#ef4444',
  X: '#f59e0b',
  Z: '#a855f7',
  unconnected: '#71717a',
}
type PinState = 'HIGH' | 'LOW' | 'X' | 'Z' | 'unconnected'
interface Pin {
  number: number
  label: string
  function: string
  state: PinState
}
interface SelectedIC {
  part: string
  name: string
  package: string
  family: string
  delay: number
  vcc: number
  gnd: number
  datasheetUrl?: string | undefined
  pins: Pin[]
}
interface Props {
  selected?: SelectedIC | null
  onRemove?: () => void
}
export default function PropertiesPanelClient({
  selected,
  onRemove,
}: Props) {
  const [collapsed, setCollapsed] = useState(true)
  return (
    <aside
      className="h-full flex flex-col shrink-0 overflow-hidden"
      style={{
        width: collapsed ? '3rem' : '16rem',
        background: t.surface,
        border: `2px solid ${t.border}`,
        transition: 'width 250ms cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div
        className="flex items-center shrink-0 px-2 pt-2.5 pb-2"
        style={{
          borderBottom: `1px solid ${t.border}`,
          justifyContent: collapsed ? 'center' : 'space-between',
        }}
      >
        {!collapsed && (
          <span
            className="text-[15px] font-bold tracking-[0.08em] uppercase"
            style={{ color: t.textSecondary }}
          >
            Properties
          </span>
        )}
        <button
          onClick={() => setCollapsed((p) => !p)}
          className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer bg-transparent border-none"
          style={{ color: t.textSecondary }}
        >
          {collapsed ? <ChevronLeft size={16} /> : <ChevronRight size={15} />}
        </button>
      </div>
      {collapsed && (
        <div className="flex flex-col items-center pt-3 gap-2">
          <div className="w-7 h-px" style={{ background: t.border }} />
          <Cpu size={16} style={{ color: t.textSecondary }} />
        </div>
      )}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div
              className="flex flex-col items-center justify-center h-full px-5 text-center gap-3"
              style={{ color: t.textSecondary }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ background: t.surfaceElevated }}
              >
                <Cpu size={18} style={{ color: t.textSecondary }} />
              </div>
              <div className="flex flex-col gap-1">
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: t.textPrimary }}
                >
                  No component selected
                </span>
                <span
                  className="text-[12px] leading-relaxed"
                  style={{ color: t.textSecondary }}
                >
                  Click a component on the canvas to inspect its properties
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col">
              <div
                className="px-3 py-3"
                style={{ borderBottom: `1px solid ${t.border}` }}
              >
                <div className="flex items-start gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-md flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: t.surfaceElevated }}
                  >
                    <Cpu size={14} style={{ color: '#4F6EF7' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[15px] font-bold leading-tight"
                      style={{ color: t.textPrimary }}
                    >
                      {selected.part}
                    </p>
                    <p
                      className="text-[11px] mt-0.5 leading-tight"
                      style={{ color: t.textSecondary }}
                    >
                      {selected.name}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: 'rgba(79,110,247,0.12)',
                      color: '#4F6EF7',
                      border: '1px solid rgba(79,110,247,0.25)',
                    }}
                  >
                    {selected.package}
                  </span>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: t.surfaceElevated,
                      color: t.textSecondary,
                      border: `1px solid ${t.border}`,
                    }}
                  >
                    {selected.family}
                  </span>
                </div>
                <div
                  className="flex items-center justify-between px-2.5 py-1.5 rounded-md mb-2"
                  style={{ background: t.surfaceElevated }}
                >
                  <span
                    className="text-[11px]"
                    style={{ color: t.textSecondary }}
                  >
                    Propagation delay
                  </span>
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: t.textPrimary }}
                  >
                    {selected.delay} ns
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md"
                    style={{ background: t.surfaceElevated }}
                  >
                    <span
                      className="text-[11px]"
                      style={{ color: t.textSecondary }}
                    >
                      VCC Pin
                    </span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: '#22c55e' }}
                    >
                      Pin {selected.vcc}
                    </span>
                  </div>
                  <div
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-md"
                    style={{ background: t.surfaceElevated }}
                  >
                    <span
                      className="text-[11px]"
                      style={{ color: t.textSecondary }}
                    >
                      GND Pin
                    </span>
                    <span
                      className="text-[11px] font-bold"
                      style={{ color: t.textSecondary }}
                    >
                      Pin {selected.gnd}
                    </span>
                  </div>
                </div>
              </div>
              <div
                className="px-3 py-3"
                style={{ borderBottom: `1px solid ${t.border}` }}
              >
                <p
                  className="text-[10px] font-bold tracking-[0.08em] uppercase mb-2"
                  style={{ color: t.textSecondary }}
                >
                  Pin States
                </p>
                <div
                  className="grid text-[10px] font-bold px-1.5 py-1 rounded-t-md"
                  style={{
                    gridTemplateColumns: '24px 36px 1fr 44px',
                    background: t.surfaceElevated,
                    color: t.textSecondary,
                  }}
                >
                  <span>Pin</span>
                  <span>Label</span>
                  <span>Function</span>
                  <span>State</span>
                </div>
                <div
                  className="rounded-b-md overflow-hidden max-h-[260px] overflow-y-auto"
                  style={{ border: `1px solid ${t.border}`, borderTop: 'none' }}
                >
                  {selected.pins.map((pin, i) => {
                    const isNC = pin.state === 'unconnected'
                    const displayState = isNC ? 'NC' : pin.state
                    const stateColor = stateColors[pin.state] || stateColors.unconnected

                    return (
                      <div
                        key={pin.number}
                        className="grid items-center px-1.5 py-1"
                        style={{
                          gridTemplateColumns: '24px 36px 1fr 44px',
                          background:
                            i % 2 === 0 ? 'transparent' : t.surfaceElevated,
                          borderTop: i > 0 ? `1px solid ${t.border}` : 'none',
                        }}
                      >
                        <span
                          className="text-[10px]"
                          style={{ color: t.textSecondary }}
                        >
                          {pin.number}
                        </span>
                        <span
                          className="text-[10px] font-bold"
                          style={{ color: t.textPrimary }}
                        >
                          {pin.label}
                        </span>
                        <span
                          className="text-[10px] truncate pr-1"
                          style={{ color: t.textSecondary }}
                          title={pin.function}
                        >
                          {pin.function}
                        </span>
                        <div className="flex items-center gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: stateColor }}
                          />
                          <span
                            className="text-[10px] font-bold"
                            style={{ color: stateColor }}
                          >
                            {displayState}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
              <div className="px-3 py-3 flex flex-col gap-1.5">
                <p
                  className="text-[10px] font-bold tracking-[0.08em] uppercase mb-1"
                  style={{ color: t.textSecondary }}
                >
                  Actions
                </p>
                {selected.datasheetUrl && (
                  <button
                    onClick={() =>
                      window.open(selected.datasheetUrl, '_blank', 'noopener,noreferrer')
                    }
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium cursor-pointer border-none transition-all duration-150"
                    style={{
                      background: 'rgba(79,110,247,0.12)',
                      color: '#4F6EF7',
                      border: '1px solid rgba(79,110,247,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(79,110,247,0.2)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(79,110,247,0.12)'
                    }}
                  >
                    <ExternalLink size={13} />
                    Check Datasheet
                  </button>
                )}
                <button
                  onClick={onRemove}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-[12px] font-medium cursor-pointer border-none transition-all duration-150"
                  style={{
                    background: t.surfaceElevated,
                    color: t.textSecondary,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = '#ef4444'
                    e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = t.textSecondary
                    e.currentTarget.style.background = t.surfaceElevated
                  }}
                >
                  <Trash2 size={13} />
                  Remove
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
