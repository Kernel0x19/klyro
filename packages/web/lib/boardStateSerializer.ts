import type { Edge } from '@xyflow/react'
import type { ICSlot } from '@/stores/useBoardStore'
import type { SavedKMapState } from '@/lib/kmap/types'

export interface SavedBoardState {
  version: string
  icSlots: {
    slotId: string
    icDefinition: ICSlot['icDefinition']
  }[]
  edges: {
    id: string
    source: string
    sourceHandle: string | null
    target: string
    targetHandle: string | null
  }[]
  inputStates: Record<string, boolean>
  isPowerOn: boolean
  /** K-Map state bundled alongside the board — optional for backwards compat */
  kmap?: SavedKMapState
}
export function serializeBoardState(
  icSlots: ICSlot[],
  edges: Edge[],
  inputStates: Record<string, boolean>,
  isPowerOn: boolean
): SavedBoardState {
  return {
    version: '0.1.0',
    icSlots: icSlots.map((slot) => ({
      slotId: slot.slotId,
      icDefinition: slot.icDefinition,
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      sourceHandle: e.sourceHandle ?? null,
      target: e.target,
      targetHandle: e.targetHandle ?? null,
    })),
    inputStates,
    isPowerOn,
  }
}
export function deserializeBoardState(raw: SavedBoardState): {
  icSlots: ICSlot[]
  edges: Edge[]
  inputStates: Record<string, boolean>
  isPowerOn: boolean
} {
  const defaultSlots: ICSlot[] = Array.from({ length: 5 }, (_, i) => ({
    slotId: `slot-${i + 1}`,
    icDefinition: null,
    isSelected: false,
  }))
  const slotMap = new Map((raw.icSlots || []).map((s) => [s.slotId, s]))
  const icSlots: ICSlot[] = defaultSlots.map((ds) => {
    const found = slotMap.get(ds.slotId)
    return found
      ? { slotId: found.slotId, icDefinition: found.icDefinition, isSelected: false }
      : ds
  })
  const edges: Edge[] = (raw.edges || []).map((e) => ({
    id: e.id,
    source: e.source,
    sourceHandle: e.sourceHandle,
    target: e.target,
    targetHandle: e.targetHandle,
    type: 'signal',
    animated: false,
    data: { signalState: 'unconnected' },
  }))
  return {
    icSlots,
    edges,
    inputStates: raw.inputStates,
    isPowerOn: raw.isPowerOn,
  }
}
