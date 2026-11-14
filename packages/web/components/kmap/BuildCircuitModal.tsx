'use client'
import React, { useEffect } from 'react'
import { Cpu, Plus, RefreshCw, X } from 'lucide-react'

interface BuildCircuitModalProps {
  isOpen: boolean
  onClose: () => void
  onOverwrite: () => void
  onCreateNew: () => void
  isSubmitting?: boolean
}

export default function BuildCircuitModal({
  isOpen,
  onClose,
  onOverwrite,
  onCreateNew,
  isSubmitting = false,
}: BuildCircuitModalProps) {
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 select-none"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#181818] border border-neutral-200 dark:border-neutral-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5 animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#4F6EF7]/10 flex items-center justify-center shrink-0">
              <Cpu className="w-5 h-5 text-[#4F6EF7]" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100">
                Build Circuit on Board
              </h3>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Placement confirmation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 p-1 rounded-lg transition-colors cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Statement */}
        <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
          Your current board already has an active circuit. Would you like to overwrite the existing board or create a new project for this circuit?
        </p>

        {/* Options */}
        <div className="flex flex-col gap-2.5">
          {/* Option 1: Create New Project */}
          <button
            type="button"
            onClick={onCreateNew}
            disabled={isSubmitting}
            className="flex items-center justify-between p-3.5 rounded-xl border border-[#4F6EF7]/40 bg-[#4F6EF7]/5 hover:bg-[#4F6EF7]/10 dark:bg-[#4F6EF7]/10 dark:hover:bg-[#4F6EF7]/15 transition-all text-left group cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#4F6EF7] text-white flex items-center justify-center shrink-0 shadow-xs">
                <Plus size={16} />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                  Create in New Project
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-[#4F6EF7]/20 text-[#4F6EF7]">
                    Recommended
                  </span>
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Keeps your current project and board untouched
                </div>
              </div>
            </div>
          </button>

          {/* Option 2: Overwrite Current Board */}
          <button
            type="button"
            onClick={onOverwrite}
            disabled={isSubmitting}
            className="flex items-center justify-between p-3.5 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700 bg-neutral-50 dark:bg-[#202020] hover:bg-neutral-100 dark:hover:bg-[#252525] transition-all text-left cursor-pointer disabled:opacity-60"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shrink-0">
                <RefreshCw size={15} />
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  Overwrite Current Board
                </div>
                <div className="text-xs text-neutral-500 dark:text-neutral-400">
                  Replaces the components and wires in this project
                </div>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
