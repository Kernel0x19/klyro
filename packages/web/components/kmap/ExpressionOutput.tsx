'use client'
import { useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Copy, Check, ChevronDown, ChevronUp, Cpu } from 'lucide-react'
import { useKMapStore } from '@/stores/useKMapStore'
import { useBoardStore } from '@/stores/useBoardStore'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'
import { useToastStore } from '@/stores/useToastStore'
import { getICDefinition } from '@/lib/icLibrary'
import { synthesizeCircuitFromSOP, type SynthesisResult } from '@/lib/kmap/circuitSynthesizer'
import { createProjectWithBoardState } from '@/lib/circuitService'
import type { SavedBoardState } from '@/lib/boardStateSerializer'
import type { KMapGroup } from '@/lib/kmap/types'
import BuildCircuitModal from './BuildCircuitModal'

interface ExpressionOutputProps {
  projectId?: string | undefined
  userId?: string | undefined
}

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

export default function ExpressionOutput({ userId }: ExpressionOutputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { minimalSOP, minimalPOS, groups, essentialPIs, primeImplicants, variableNames } = useKMapStore()
  const [showPIs, setShowPIs] = useState(false)

  // Confirmation modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingSynthesis, setPendingSynthesis] = useState<SynthesisResult | null>(null)

  /**
   * Applies the synthesized result directly onto the current board store.
   */
  function applyToCurrentBoard(result: SynthesisResult) {
    const board = useBoardStore.getState()
    board.resetBoard()

    for (const slot of result.slots) {
      const def = getICDefinition(slot.partNumber)
      if (def) {
        board.assignIC(slot.slotId, {
          partNumber: def.part,
          name: def.name,
          packageType: def.packageType,
          family: def.family,
          delay: def.delay,
          vcc: def.vcc,
          gnd: def.gnd,
        })
      }
    }

    useEditorEdgesStore.getState().setEdges(result.edges)
  }

  /**
   * Triggered when clicking "Build Circuit".
   * If the current board already has components or wires, prompts for confirmation.
   * If the board is empty, builds directly without prompt.
   */
  function handleBuildCircuit() {
    if (!minimalSOP) {
      useToastStore.getState().showToast('No SOP expression available to build.')
      return
    }

    const result = synthesizeCircuitFromSOP(minimalSOP, variableNames)
    if (!result.success) {
      useToastStore.getState().showToast(result.error ?? 'Failed to build circuit.')
      return
    }

    const board = useBoardStore.getState()
    const edges = useEditorEdgesStore.getState().edges
    const hasExisting = board.icSlots.some((s) => s.icDefinition !== null) || edges.length > 0

    if (hasExisting) {
      setPendingSynthesis(result)
      setIsModalOpen(true)
    } else {
      // Board is empty: build directly
      applyToCurrentBoard(result)
      useToastStore.getState().showToast('Circuit synthesized and placed on Board!')
      router.push(pathname, { scroll: false })
    }
  }

  /**
   * Overwrite the current board with the synthesized circuit.
   */
  function handleOverwrite() {
    if (!pendingSynthesis) return
    applyToCurrentBoard(pendingSynthesis)
    setIsModalOpen(false)
    setPendingSynthesis(null)
    useToastStore.getState().showToast('Circuit synthesized and placed on Board!')
    router.push(pathname, { scroll: false })
  }

  /**
   * Create a new project initialized with the synthesized circuit.
   */
  async function handleCreateNew() {
    if (!pendingSynthesis) return
    setIsSubmitting(true)

    const projectName = `K-Map: ${minimalSOP}`
    const newBoardState: SavedBoardState = {
      version: '0.1.0',
      icSlots: Array.from({ length: 5 }, (_, i) => {
        const slotId = `slot-${i + 1}`
        const synthSlot = pendingSynthesis.slots.find((s) => s.slotId === slotId)
        const icDef = synthSlot ? getICDefinition(synthSlot.partNumber) : null
        return {
          slotId,
          icDefinition: icDef
            ? {
                partNumber: icDef.part,
                name: icDef.name,
                packageType: icDef.packageType,
                family: icDef.family,
                delay: icDef.delay,
                vcc: icDef.vcc,
                gnd: icDef.gnd,
              }
            : null,
        }
      }),
      edges: pendingSynthesis.edges.map((e) => ({
        id: e.id,
        source: e.source,
        sourceHandle: e.sourceHandle ?? null,
        target: e.target,
        targetHandle: e.targetHandle ?? null,
      })),
      inputStates: {},
      isPowerOn: true,
    }

    try {
      const { projectId: newId, error } = await createProjectWithBoardState(
        userId,
        projectName,
        newBoardState
      )

      if (error) {
        useToastStore.getState().showToast(`Error creating project: ${error}`)
        setIsSubmitting(false)
        return
      }

      // Also set client stores so the editor renders the circuit instantly
      applyToCurrentBoard(pendingSynthesis)

      setIsModalOpen(false)
      setPendingSynthesis(null)
      setIsSubmitting(false)
      useToastStore.getState().showToast('New project created with synthesized circuit!')

      router.push(`/editor/${newId}`, { scroll: false })
    } catch {
      useToastStore.getState().showToast('Failed to create new project.')
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Confirmation Modal */}
      <BuildCircuitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setPendingSynthesis(null)
        }}
        onOverwrite={handleOverwrite}
        onCreateNew={handleCreateNew}
        isSubmitting={isSubmitting}
      />

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

          {/* Build Circuit button */}
          <div className="flex items-center px-4 py-2 shrink-0">
            <button
              type="button"
              onClick={handleBuildCircuit}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#4F6EF7] hover:bg-[#435dd4] text-white text-xs sm:text-sm font-bold shadow-xs hover:shadow transition-all cursor-pointer group"
              title="Synthesize logic gates and wire circuit on Board"
            >
              <Cpu size={16} className="group-hover:rotate-12 transition-transform" />
              <span>Build Circuit</span>
            </button>
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
    </>
  )
}
