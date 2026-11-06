'use client'
import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  MousePointer2,
  Zap,
  Hand,
  Trash2,
  Cpu,
  Star,
} from 'lucide-react'
import { useTheme } from '@/components/hooks/useTheme'
import { IC_LIBRARY } from '@/lib/icLibrary'
import { useBoardStore, type EditorTool } from '@/stores/useBoardStore'
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
export default function SidebarClient() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const t = tokens[theme]
  const [collapsed, setCollapsed] = useState(true)
  const [search, setSearch] = useState('')
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    Object.fromEntries(IC_LIBRARY.map((g) => [g.category, true]))
  )
  const activeTool = useBoardStore((s) => s.activeTool)
  const setActiveTool = useBoardStore((s) => s.setActiveTool)
  const [hoveredIC, setHoveredIC] = useState<string | null>(null)
  const { selectedSlotId, icSlots, assignIC } = useBoardStore()
  const filtered = useMemo(() => {
    if (!search.trim()) return IC_LIBRARY
    const q = search.toLowerCase()
    return IC_LIBRARY.map((group) => ({
      ...group,
      ics: group.ics.filter(
        (ic) =>
          ic.part.toLowerCase().includes(q) || ic.name.toLowerCase().includes(q)
      ),
    })).filter((g) => g.ics.length > 0)
  }, [search])
  function toggleGroup(cat: string) {
    setOpenGroups((prev) => ({ ...prev, [cat]: !prev[cat] }))
  }
  const tools: { id: EditorTool; icon: React.ReactNode; label: string }[] = [
    { id: 'select', icon: <MousePointer2 size={18} />, label: 'Select (V)' },
    { id: 'wire', icon: <Zap size={18} />, label: 'Wire (W)' },
    { id: 'pan', icon: <Hand size={18} />, label: 'Pan (H)' },
    { id: 'delete', icon: <Trash2 size={18} />, label: 'Delete (D)' },
  ]
  if (!mounted) {
    return (
      <aside
        className="h-full shrink-0 invisible"
        style={{
          width: collapsed ? '3rem' : '16.75rem',
        }}
      />
    )
  }
  return (
    <aside
      className="h-full flex flex-col shrink-0 overflow-hidden"
      style={{
        background: t.surface,
        border: `2px solid ${t.border}`,
        width: collapsed ? '3rem' : '16.75rem',
        transition: `width 250ms cubic-bezier(0.4, 0, 0.2, 1), ${COLOR_TRANSITION}`,
      }}
    >
      {}
      <div
        className="flex flex-col items-center pt-2 pb-2 gap-2 shrink-0"
        style={{
          opacity: collapsed ? 1 : 0,
          width: '3rem',
          position: collapsed ? 'relative' : 'absolute',
          pointerEvents: collapsed ? 'auto' : 'none',
          transition: 'opacity 150ms ease',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          title="Expand sidebar"
          className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer bg-transparent border-none"
          style={{
            color: t.textSecondary,
            transition: COLOR_TRANSITION,
          }}
        >
          <ChevronRight size={16} />
        </button>
        <div
          className="w-7 h-px"
          style={{
            background: t.border,
            transition: COLOR_TRANSITION,
          }}
        />
        {tools.map((tool) => {
          const isActive = activeTool === tool.id
          const isDelete = tool.id === 'delete'
          return (
            <button
              key={tool.id}
              title={tool.label}
              onClick={() => setActiveTool(tool.id)}
              className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer border-none transition-colors duration-150"
              style={{
                color: isActive
                  ? isDelete
                    ? '#ef4444'
                    : '#4F6EF7'
                  : t.textSecondary,
                background: isActive
                  ? isDelete
                    ? 'rgba(239, 68, 68, 0.15)'
                    : 'rgba(79, 110, 247, 0.12)'
                  : 'transparent',
                transition: COLOR_TRANSITION,
              }}
            >
              {tool.icon}
            </button>
          )
        })}
      </div>
      {}
      <div
        className="flex flex-col h-full"
        style={{
          opacity: collapsed ? 0 : 1,
          pointerEvents: collapsed ? 'none' : 'auto',
          transition: 'opacity 150ms ease',
          minWidth: '16.75rem',
        }}
      >
        {}
        <div
          className="flex items-center justify-between px-3 pt-2.5 pb-2 shrink-0"
          style={{
            borderBottom: `1px solid ${t.border}`,
            transition: COLOR_TRANSITION,
          }}
        >
          <span
            className="text-[15px] font-bold tracking-[0.08em] uppercase"
            style={{
              color: t.textSecondary,
              transition: COLOR_TRANSITION,
            }}
          >
            IC Library
          </span>
          <button
            onClick={() => setCollapsed(true)}
            className="flex items-center justify-center bg-transparent border-none cursor-pointer rounded p-0.5"
            style={{
              color: t.textSecondary,
              transition: COLOR_TRANSITION,
            }}
          >
            <ChevronLeft size={15} />
          </button>
        </div>
        {}
        <div
          className="px-2.5 py-2 shrink-0"
          style={{
            borderBottom: `1px solid ${t.border}`,
            transition: COLOR_TRANSITION,
          }}
        >
          {(() => {
            const selectedSlot = icSlots.find(
              (s) => s.slotId === selectedSlotId
            )
            const isEmpty = selectedSlot && !selectedSlot.icDefinition
            return isEmpty ? (
              <div
                className="mx-2.5 mt-2 px-2.5 py-1.5 rounded-md text-[11px] text-center"
                style={{
                  background: 'rgba(79,110,247,0.1)',
                  border: '1px solid rgba(79,110,247,0.3)',
                  color: '#4F6EF7',
                }}
              >
                Click an IC to assign to selected slot
              </div>
            ) : null
          })()}
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{
                color: t.textSecondary,
                transition: COLOR_TRANSITION,
              }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ICs..."
              className="w-full h-9 pl-7 pr-2.5 text-[13px] rounded-md outline-none box-border"
              style={{
                background: t.background,
                border: `1px solid ${t.border}`,
                color: t.textPrimary,
                transition: COLOR_TRANSITION,
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#4F6EF7')}
              onBlur={(e) => (e.currentTarget.style.borderColor = t.border)}
            />
          </div>
        </div>
        {}
        <div className="flex-1 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <p
              className="px-3 py-4 text-[12px] text-center"
              style={{
                color: t.textSecondary,
                transition: COLOR_TRANSITION,
              }}
            >
              No ICs found
            </p>
          )}
          {filtered.map((group) => (
            <div key={group.category}>
              <button
                onClick={() => toggleGroup(group.category)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.25 bg-transparent border-none cursor-pointer"
                style={{
                  color: t.textSecondary,
                  transition: COLOR_TRANSITION,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = t.surfaceElevated)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = 'none')
                }
              >
                {openGroups[group.category] ? (
                  <ChevronDown size={13} />
                ) : (
                  <ChevronRight size={13} />
                )}
                <span className="text-[15px] font-bold tracking-[0.06em] uppercase">
                  {group.category}
                </span>
              </button>
              {openGroups[group.category] &&
                group.ics.map((ic) => (
                  <div
                    key={ic.part}
                    draggable
                    onDragStart={(e) =>
                      e.dataTransfer.setData('ic-part', ic.part)
                    }
                    onMouseEnter={() => setHoveredIC(ic.part)}
                    onMouseLeave={() => setHoveredIC(null)}
                    onClick={() => {
                      if (selectedSlotId) {
                        assignIC(selectedSlotId, {
                          partNumber: ic.part,
                          name: ic.name,
                          packageType: ic.packageType,
                          family: ic.family,
                          delay: ic.delay,
                          vcc: ic.vcc,
                          gnd: ic.gnd,
                        })
                      }
                    }}
                    className="flex items-center gap-2 py-1.25 pr-3 pl-6 cursor-grab transition-colors duration-100"
                    style={{
                      background:
                        hoveredIC === ic.part
                          ? t.surfaceElevated
                          : 'transparent',
                    }}
                  >
                    <Cpu
                      size={13}
                      className="shrink-0"
                      style={{ color: '#4F6EF7' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1">
                        <span
                          className="text-[12px] font-bold"
                          style={{
                            color: t.textPrimary,
                            transition: COLOR_TRANSITION,
                          }}
                        >
                          {ic.part}
                        </span>
                        {ic.advanced && (
                          <Star
                            size={10}
                            className="shrink-0"
                            style={{ color: '#F59E0B', fill: '#F59E0B' }}
                          />
                        )}
                      </div>
                      <span
                        className="text-[11px] block leading-[1.3]"
                        style={{
                          color: t.textSecondary,
                          transition: COLOR_TRANSITION,
                        }}
                      >
                        {ic.name}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
        {}
        <div
          className="flex items-center justify-between px-3 py-2 shrink-0"
          style={{
            borderTop: `1px solid ${t.border}`,
            transition: COLOR_TRANSITION,
          }}
        >
          {tools.map((tool) => {
            const isActive = activeTool === tool.id
            const isDelete = tool.id === 'delete'
            return (
              <button
                key={tool.id}
                title={tool.label}
                onClick={() => setActiveTool(tool.id)}
                onMouseEnter={(e) => {
                  if (isDelete) {
                    e.currentTarget.style.color = '#ef4444'
                    e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'
                  } else if (!isActive) {
                    e.currentTarget.style.background = t.surfaceElevated
                  }
                }}
                onMouseLeave={(e) => {
                  if (isDelete && !isActive) {
                    e.currentTarget.style.color = t.textSecondary
                    e.currentTarget.style.background = 'transparent'
                  } else if (!isActive) {
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
                className="w-9 h-9 flex items-center justify-center rounded-md cursor-pointer border-none transition-all duration-150"
                style={{
                  background: isActive
                    ? isDelete
                      ? 'rgba(239, 68, 68, 0.15)'
                      : 'rgba(79, 110, 247, 0.12)'
                    : 'transparent',
                  color: isActive
                    ? isDelete
                      ? '#ef4444'
                      : '#4F6EF7'
                    : t.textSecondary,
                  transition: COLOR_TRANSITION,
                }}
              >
                {tool.icon}
              </button>
            )
          })}
        </div>
      </div>
    </aside>
  )
}
