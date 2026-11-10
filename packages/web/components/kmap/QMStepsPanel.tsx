'use client'
import { useState } from 'react'
import { ChevronDown, ChevronRight, FlaskConical } from 'lucide-react'
import { useKMapStore } from '@/stores/useKMapStore'

export default function QMStepsPanel() {
  const { qmSteps, primeImplicants, essentialPIs, minimalSOP } = useKMapStore()
  const [open, setOpen] = useState(false)
  const [expandedRounds, setExpandedRounds] = useState<Set<number>>(new Set([0]))

  if (qmSteps.length === 0) return null

  function toggleRound(r: number) {
    setExpandedRounds((prev) => {
      const next = new Set(prev)
      next.has(r) ? next.delete(r) : next.add(r)
      return next
    })
  }

  return (
    <div className="border-t border-border-theme bg-surface shrink-0">
      {/* Header toggle */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
      >
        <FlaskConical size={13} className="text-[#4F6EF7]" />
        <span className="uppercase tracking-wide">Step-by-Step Working</span>
        {open ? <ChevronDown size={13} className="ml-auto" /> : <ChevronRight size={13} className="ml-auto" />}
      </button>

      {open && (
        <div className="px-4 pb-4 flex flex-col gap-3 max-h-72 overflow-y-auto">

          {/* QM merge rounds */}
          {qmSteps.map((step) => (
            <div key={step.round} className="flex flex-col gap-1">
              <button
                onClick={() => toggleRound(step.round)}
                className="flex items-center gap-1.5 text-xs font-bold text-text-secondary hover:text-text-primary cursor-pointer"
              >
                {expandedRounds.has(step.round)
                  ? <ChevronDown size={11} />
                  : <ChevronRight size={11} />}
                {step.round === 0 ? 'Initial minterms' : `Merge round ${step.round}`}
                <span className="ml-auto text-neutral-500 font-normal">
                  {step.implicants.length} implicant{step.implicants.length !== 1 ? 's' : ''}
                </span>
              </button>

              {expandedRounds.has(step.round) && (
                <div className="flex flex-wrap gap-1.5 pl-4">
                  {step.implicants.map((impl, i) => (
                    <span
                      key={i}
                      className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                        impl.merged
                          ? 'text-neutral-500 border-neutral-700 bg-neutral-800/40 line-through'
                          : 'text-text-primary border-border-theme bg-surface'
                      }`}
                      title={`m(${impl.minterms.join(',')})`}
                    >
                      {impl.expression}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Prime implicants summary */}
          <div className="flex flex-col gap-1 border-t border-border-theme/50 pt-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide">
              Prime Implicants ({primeImplicants.length})
            </span>
            <div className="flex flex-wrap gap-1.5">
              {primeImplicants.map((pi, i) => {
                const isEssential = essentialPIs.some((e) => e.expression === pi.expression)
                return (
                  <span
                    key={i}
                    className={`font-mono text-[11px] px-1.5 py-0.5 rounded border ${
                      isEssential
                        ? 'text-[#4F6EF7] border-[#4F6EF7]/40 bg-[#4F6EF7]/10 font-bold'
                        : 'text-text-primary border-border-theme'
                    }`}
                    title={`m(${pi.minterms.join(',')})`}
                  >
                    {pi.expression}{isEssential ? ' ✓' : ''}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Final result */}
          <div className="flex items-center gap-2 border-t border-border-theme/50 pt-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wide shrink-0">Minimal SOP</span>
            <span className="font-mono text-sm text-text-primary font-bold">{minimalSOP || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

