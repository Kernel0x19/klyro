'use client'

import React from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useToastStore } from '@/stores/useToastStore'

export default function CanvasToast() {
  const { toast, dismissToast } = useToastStore()
  const isVisible = Boolean(toast)

  return (
    <div className="absolute bottom-6 right-18 z-50 pointer-events-none max-w-md select-none">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-xl border border-red-500/50 bg-[#14151f] p-4 text-white shadow-2xl transition-all duration-200 ease-out will-change-[transform,opacity] ${
          isVisible
            ? 'translate-y-0 opacity-100 pointer-events-auto'
            : 'translate-y-4 opacity-0 pointer-events-none'
        }`}
        style={{
          boxShadow: isVisible
            ? '0 10px 30px -5px rgba(0, 0, 0, 0.7), 0 0 15px rgba(239, 68, 68, 0.2)'
            : 'none',
        }}
      >
        <div className="mt-0.5 flex-shrink-0 rounded-lg bg-red-500/20 p-2 text-red-400 border border-red-500/30">
          <AlertTriangle className="w-5 h-5" />
        </div>

        <div className="flex-1 pr-2">
          <div className="text-[11px] font-black tracking-wider text-red-400 uppercase">
            Invalid Connection
          </div>
          <div className="mt-1 text-xs font-medium text-zinc-200 leading-relaxed">
            {toast?.message}
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="flex-shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
