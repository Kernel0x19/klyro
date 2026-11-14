'use client'
import { useState } from 'react'
import { Copy, Check, ChevronDown, ChevronUp } from 'lucide-react'
import { useKMapStore } from '@/stores/useKMapStore'
import type { KMapGroup } from '@/lib/kmap/types'

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <button
      onClick={handleCopy}
      title="Copy"
      className="shrink-0 p-1.5 rounded-md hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-500 hover:text-text-primary transition-colors cursor-pointer"
    >
      {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
    </button>
  )
}

/** Render an SOP string with color-coded terms matching group colors. */
function ColoredSOP({
  sop,
  groups,
}: {
  sop: string
  groups: KMapGroup[]
}) {
  if (!sop || sop === '0') return <span className="text-neutral-500 font-mono text-lg md:text-xl font-medium">0</span>
  if (sop === '1') return <span className="text-green-500 font-mono text-lg md:text-xl font-bold">1</span>

  const terms = sop.split(' + ')
  return (
    <span className="font-mono text-lg md:text-xl tracking-wide select-text">
      {terms.map((term, i) => {
        const group = groups.find((g) => g.implicant.expression === term)
        return (
          <span key={i}>
            <span
              style={{ color: group?.color ?? 'var(--color-text-primary)' }}
              className="font-bold"
            >
              {term}
            </span>
            {i < terms.length - 1 && (
              <span className="text-neutral-400 dark:text-neutral-500 mx-2 font-normal">+</span>
            )}
          </span>
        )
      })}
    </span>
  )
}

export default function ExpressionOutput() {
  const { minimalSOP, minimalPOS, groups, essentialPIs, primeImplicants } = useKMapStore()
  const [showPIs, setShowPIs] = useState(false)

  return (
    <div className="border-t border-border-theme bg-surface shrink-0">
      {/* Main expressions row */}
      <div className="flex items-center gap-0 divide-x divide-border-theme">
        {/* SOP */}
        <div className="flex items-center gap-3 px-5 py-3 flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-extrabold text-text-secondary shrink-0 uppercase tracking-wider w-11">
            SOP
          </span>
          <div className="flex-1 min-w-0 overflow-x-auto py-0.5">
            <ColoredSOP sop={minimalSOP} groups={groups} />
          </div>
          <CopyBtn text={minimalSOP} />
        </div>

        {/* POS */}
        <div className="flex items-center gap-3 px-5 py-3 flex-1 min-w-0">
          <span className="text-xs sm:text-sm font-extrabold text-text-secondary shrink-0 uppercase tracking-wider w-11">
            POS
          </span>
          <div className="flex-1 min-w-0 overflow-x-auto py-0.5">
            <span className="font-mono text-lg md:text-xl tracking-wide text-text-primary font-medium select-text">
              {minimalPOS || '—'}
            </span>
          </div>
          <CopyBtn text={minimalPOS} />
        </div>

        {/* PI toggle */}
        {primeImplicants.length > 0 && (
          <button
            onClick={() => setShowPIs((v) => !v)}
            className="px-3.5 py-3.5 text-neutral-500 hover:text-text-primary hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer shrink-0"
            title={showPIs ? 'Hide prime implicants' : 'Show prime implicants'}
          >
            {showPIs ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </button>
        )}
      </div>

      {/* Prime implicants detail */}
      {showPIs && primeImplicants.length > 0 && (
        <div className="px-5 pb-3 pt-2 flex flex-col gap-2 border-t border-border-theme/50">
          <div className="flex items-start gap-3 text-sm">
            <span className="text-text-secondary font-semibold shrink-0 w-24">All PIs:</span>
            <div className="flex flex-wrap gap-2">
              {primeImplicants.map((pi, i) => {
                const g = groups.find((g) => g.implicant.expression === pi.expression)
                return (
                  <span
                    key={i}
                    className="font-mono px-2 py-0.5 rounded text-xs sm:text-sm font-bold"
                    style={{
                      color: g?.color ?? 'var(--color-text-primary)',
                      backgroundColor: g ? g.color + '1a' : 'transparent',
                      border: `1px solid ${g?.color ?? '#555'}40`,
                    }}
                  >
                    {pi.expression}
                  </span>
                )
              })}
            </div>
          </div>
          <div className="flex items-start gap-3 text-sm">
            <span className="text-text-secondary font-semibold shrink-0 w-24">Essential:</span>
            <div className="flex flex-wrap gap-2">
              {essentialPIs.length === 0 ? (
                <span className="text-neutral-500 text-sm">none</span>
              ) : (
                essentialPIs.map((pi, i) => {
                  const g = groups.find((g) => g.implicant.expression === pi.expression)
                  return (
                    <span
                      key={i}
                      className="font-mono px-2 py-0.5 rounded text-xs sm:text-sm font-bold"
                      style={{
                        color: g?.color ?? 'var(--color-text-primary)',
                        backgroundColor: g ? g.color + '1a' : 'transparent',
                        border: `1px solid ${g?.color ?? '#555'}`,
                      }}
                    >
                      {pi.expression}
                    </span>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
