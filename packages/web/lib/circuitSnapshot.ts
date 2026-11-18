import type { Edge } from '@xyflow/react'
import type { ICSlot } from '@/stores/useBoardStore'

/**
 * Computes a deterministic string fingerprint of the circuit (placed ICs and wired connections).
 * Used to track unsaved changes against the last saved version.
 */
export function computeCircuitSnapshot(icSlots: ICSlot[], edges: Edge[]): string {
  const slotsKey = icSlots
    .map((s) => `${s.slotId}:${s.icDefinition?.partNumber ?? 'empty'}`)
    .join('|')

  const edgesKey = edges
    .map((e) => {
      const s = `${e.source}:${e.sourceHandle ?? ''}`
      const t = `${e.target}:${e.targetHandle ?? ''}`
      return s < t ? `${s}->${t}` : `${t}->${s}`
    })
    .sort()
    .join(';')

  return `${slotsKey}#${edgesKey}`
}
