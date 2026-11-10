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
      className="shrink-0 text-neutral-500 hover:text-text-primary transition-colors cursor-pointer"
    >
      {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
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
  if (!sop || sop === '0') return <span className="text-neutral-500 font-mono text-sm">0</span>
  if (sop === '1') return <span className="text-green-400 font-mono text-sm font-bold">1</span>

  const terms = sop.split(' + ')
  return (
    <span className="font-mono text-sm">
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
              <span className="text-neutral-400 mx-1.5">+</span>
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
        <div className="flex items-center gap-2 px-4 py-2.5 flex-1 min-w-0">
          <span className="text-xs font-bold text-text-secondary shrink-0 uppercase tracking-wide w-9">
            SOP
          </span>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <ColoredSOP sop={minimalSOP} groups={groups} />
          </div>
          <CopyBtn text={minimalSOP} />
        </div>

        {/* POS */}
        <div className="flex items-center gap-2 px-4 py-2.5 flex-1 min-w-0">
          <span className="text-xs font-bold text-text-secondary shrink-0 uppercase tracking-wide w-9">
            POS
          </span>
          <div className="flex-1 min-w-0 overflow-x-auto">
            <span className="font-mono text-sm text-text-primary">
              {minimalPOS || '—'}
            </span>
          </div>
          <CopyBtn text={minimalPOS} />
        </div>

        {/* PI toggle */}
        {primeImplicants.length > 0 && (
          <button
            onClick={() => setShowPIs((v) => !v)}
            className="px-3 py-2.5 text-neutral-500 hover:text-text-primary transition-colors cursor-pointer shrink-0"
            title="Show prime implicants"
          >
            {showPIs ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        )}
      </div>

      {/* Prime implicants detail */}
      {showPIs && primeImplicants.length > 0 && (
        <div className="px-4 pb-2.5 pt-0 flex flex-col gap-1 border-t border-border-theme/50">
          <div className="flex items-start gap-2 text-xs mt-1.5">
            <span className="text-text-secondary shrink-0 w-20">All PIs:</span>
            <div className="flex flex-wrap gap-1.5">
              {primeImplicants.map((pi, i) => {
                const g = groups.find((g) => g.implicant.expression === pi.expression)
                return (
                  <span
                    key={i}
                    className="font-mono px-1.5 py-0.5 rounded text-xs font-bold"
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
          <div className="flex items-start gap-2 text-xs">
            <span className="text-text-secondary shrink-0 w-20">Essential:</span>
            <div className="flex flex-wrap gap-1.5">
              {essentialPIs.length === 0 ? (
                <span className="text-neutral-500">none</span>
              ) : (
                essentialPIs.map((pi, i) => {
                  const g = groups.find((g) => g.implicant.expression === pi.expression)
                  return (
                    <span
                      key={i}
                      className="font-mono px-1.5 py-0.5 rounded text-xs font-bold"
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

