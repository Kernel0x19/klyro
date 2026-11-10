'use client'
import { useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'

// Module display metadata
const MODULE_META: Record<string, { label: string; icon: string }> = {
  'board':              { label: 'Board',          icon: '⬛' },
  'k-map-visualiser':   { label: 'K-Map Visualiser', icon: '◼' },
  'fsm':                { label: 'FSM Editor',     icon: '◈' },
  'pld':                { label: 'PLD Designer',   icon: '▦' },
  'hdl':                { label: 'HDL Editor',     icon: '</>' },
  'learn':              { label: 'Learn',          icon: '📖' },
}

interface ModuleTransitionOverlayProps {
  /** The module param string being loaded (e.g. 'k-map-visualiser'), or null when idle */
  pendingModule: string | null
  onSettled: () => void
}

export default function ModuleTransitionOverlay({
  pendingModule,
  onSettled,
}: ModuleTransitionOverlayProps) {
  const searchParams = useSearchParams()
  const prevPendingRef = useRef<string | null>(null)

  // When searchParams change and we were pending → navigation settled
  useEffect(() => {
    if (prevPendingRef.current !== null && pendingModule !== null) {
      // URL has updated → call onSettled
      onSettled()
    }
    prevPendingRef.current = pendingModule
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  if (!pendingModule) return null

  const meta = MODULE_META[pendingModule] ?? { label: pendingModule, icon: '◼' }

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-5 bg-bg/80 backdrop-blur-sm"
      aria-live="polite"
      aria-label={`Loading ${meta.label}`}
    >
      {/* Double-ring spinner — matches EditorLoading style */}
      <div className="relative w-12 h-12">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#4F6EF7] animate-spin"
          style={{ animationDuration: '800ms' }}
        />
        <div
          className="absolute inset-1 rounded-full border-2 border-transparent border-t-[#8BA4FA] animate-spin"
          style={{ animationDuration: '600ms', animationDirection: 'reverse' }}
        />
      </div>

      <div className="flex flex-col items-center gap-1">
        <span className="text-sm font-bold text-text-primary tracking-wide">
          {meta.label}
        </span>
        <span className="text-xs text-neutral-500">
          Loading module...
        </span>
      </div>
    </div>
  )
}

