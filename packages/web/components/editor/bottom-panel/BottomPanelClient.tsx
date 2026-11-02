'use client'
import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { useTheme } from '@/components/hooks/useTheme'

const tokens = {
  dark: {
    background: '#000000',
    surface: '#1a1a1a',
    surfaceElevated: '#343a40',
    border: '#2e3148',
    textPrimary: '#e8eaf0',
    textSecondary: '#8b8fa8',
  },
  light: {
    background: '#ffffff',
    surface: '#f5f6fa',
    surfaceElevated: '#e8eaef',
    border: '#d9dce6',
    textPrimary: '#14161c',
    textSecondary: '#5a5f73',
  },
}

const COLOR_TRANSITION =
  'background-color 0.4s ease, color 0.4s ease, border-color 0.4s ease'

type Tab = 'waveform' | 'console' | 'netlist'

interface ConsoleEntry {
  type: 'info' | 'error' | 'warn'
  message: string
  timestamp?: string
}

interface NetlistData {
  nodes: number
  components: number
  connections: number
  errors: string[]
  warnings: string[]
  raw?: string
}

interface Props {
  consoleLogs?: ConsoleEntry[]
  netlist?: NetlistData | null
}

export default function BottomPanelClient({
  consoleLogs = [],
  netlist = null,
}: Props) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('waveform')

  useEffect(() => {
    setMounted(true)
  }, [])

  const t = tokens[theme]

  const tabs: { id: Tab; label: string }[] = [
    { id: 'waveform', label: 'Waveform' },
    { id: 'console', label: 'Console' },
    { id: 'netlist', label: 'Netlist' },
  ]

  if (!mounted) {
    return (
      <div
        className="w-full shrink-0 invisible"
        style={{ height: collapsed ? '32px' : '200px' }}
      />
    )
  }

  return (
    <div
      className="w-full shrink-0 flex flex-col overflow-hidden"
      style={{
        height: collapsed ? '32px' : '200px',
        background: t.surface,
        borderTop: `2px solid ${t.border}`,
        transition: `height 250ms cubic-bezier(0.4,0,0.2,1), ${COLOR_TRANSITION}`,
      }}
    >
      {/* ── Header bar ── */}
      <div
        className="flex items-center justify-between px-2 shrink-0"
        style={{
          height: '32px',
          borderBottom: collapsed ? 'none' : `1px solid ${t.border}`,
          transition: COLOR_TRANSITION,
        }}
      >
        {/* Tabs */}
        <div className="flex items-center gap-0.5">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                if (collapsed) setCollapsed(false)
              }}
              className="px-3 h-7 text-[12px] font-bold rounded-md cursor-pointer border-none transition-all duration-150"
              style={{
                background:
                  activeTab === tab.id && !collapsed
                    ? 'rgba(79,110,247,0.12)'
                    : 'transparent',
                color:
                  activeTab === tab.id && !collapsed
                    ? '#4F6EF7'
                    : t.textSecondary,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-1">
          {!collapsed && (
            <button
              onClick={() => {}}
              className="px-2 h-6 text-[11px] font-bold rounded-md cursor-pointer border-none flex items-center gap-1 transition-all duration-150"
              style={{ background: t.surfaceElevated, color: t.textSecondary }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#ef4444'
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = t.textSecondary
                e.currentTarget.style.background = t.surfaceElevated
              }}
            >
              <X size={11} />
              Clear
            </button>
          )}
          <button
            onClick={() => setCollapsed((p) => !p)}
            className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer border-none transition-all duration-150"
            style={{ background: 'transparent', color: t.textSecondary }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = t.surfaceElevated)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = 'transparent')
            }
          >
            {collapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="flex-1 overflow-hidden">
          {/* Waveform */}
          {activeTab === 'waveform' && (
            <div
              className="w-full h-full flex flex-col items-center justify-center gap-2"
              style={{ color: t.textSecondary }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 32 32"
                fill="none"
                style={{ opacity: 0.4 }}
              >
                <path
                  d="M2 16h4l3-8 4 16 3-12 3 8 3-4h8"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span
                className="text-[12px] font-medium"
                style={{ color: t.textSecondary }}
              >
                Run simulation to see waveforms
              </span>
            </div>
          )}

          {/* Console */}
          {activeTab === 'console' && (
            <div
              className="w-full h-full overflow-y-auto p-3 font-mono text-[12px]"
              style={{ background: t.background }}
            >
              {consoleLogs.length === 0 ? (
                <span style={{ color: t.textSecondary }}>
                  {'>'} Console ready. Run simulation to see output.
                </span>
              ) : (
                consoleLogs.map((entry, i) => (
                  <div key={i} className="flex items-start gap-2 mb-0.5">
                    {entry.timestamp && (
                      <span style={{ color: t.textSecondary, flexShrink: 0 }}>
                        [{entry.timestamp}]
                      </span>
                    )}
                    <span
                      style={{
                        color:
                          entry.type === 'error'
                            ? '#ef4444'
                            : entry.type === 'warn'
                              ? '#f59e0b'
                              : '#22c55e',
                      }}
                    >
                      {entry.type === 'error'
                        ? '✕'
                        : entry.type === 'warn'
                          ? '⚠'
                          : '›'}
                    </span>
                    <span
                      style={{
                        color:
                          entry.type === 'error'
                            ? '#ef4444'
                            : entry.type === 'warn'
                              ? '#f59e0b'
                              : t.textPrimary,
                      }}
                    >
                      {entry.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Netlist */}
          {activeTab === 'netlist' && (
            <div
              className="w-full h-full overflow-y-auto"
              style={{ background: t.background }}
            >
              {!netlist ? (
                <div className="w-full h-full flex items-center justify-center">
                  <span
                    className="text-[12px] font-mono"
                    style={{ color: t.textSecondary }}
                  >
                    {'>'} No netlist compiled yet.
                  </span>
                </div>
              ) : (
                <div className="p-3 font-mono text-[12px]">
                  <div
                    className="flex gap-6 mb-3 pb-2"
                    style={{ borderBottom: `1px solid ${t.border}` }}
                  >
                    {[
                      { label: 'Nodes', value: netlist.nodes },
                      { label: 'Components', value: netlist.components },
                      { label: 'Connections', value: netlist.connections },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex flex-col gap-0.5">
                        <span style={{ color: t.textSecondary, fontSize: 10 }}>
                          {label}
                        </span>
                        <span style={{ color: '#4F6EF7', fontWeight: 700 }}>
                          {value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {netlist.errors.length > 0 &&
                    netlist.errors.map((err, i) => (
                      <div key={i} className="flex items-start gap-2 mb-0.5">
                        <span style={{ color: '#ef4444' }}>✕</span>
                        <span style={{ color: '#ef4444' }}>{err}</span>
                      </div>
                    ))}

                  {netlist.warnings.length > 0 &&
                    netlist.warnings.map((warn, i) => (
                      <div key={i} className="flex items-start gap-2 mb-0.5">
                        <span style={{ color: '#f59e0b' }}>⚠</span>
                        <span style={{ color: '#f59e0b' }}>{warn}</span>
                      </div>
                    ))}

                  {netlist.raw && (
                    <pre
                      className="mt-2 p-2 rounded-md text-[11px] overflow-x-auto"
                      style={{
                        background: t.surfaceElevated,
                        color: t.textPrimary,
                      }}
                    >
                      {netlist.raw}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
