/**
 * Klyro — Board State Serializer & Deserializer
 *
 * Handles versioned serialization of the digital breadboard workbook:
 * - IC socket assignments and placed chip definitions
 * - Connecting wire edges and pin handle bindings
 * - Interactive input switch toggles
 * - Master power state
 * - Bundled K-Map state for cross-mode persistence
 * - Safe migration and fallback defaulting to 5 standard socket bays for legacy saves
 */

import type { Edge } from '@xyflow/react'
import type { ICSlot } from '@/stores/useBoardStore'
import type { SavedKMapState } from '@/lib/kmap/types'

/** Serialized JSON schema format for persisted breadboard circuits */
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

/** Current serializer schema version */
const CURRENT_SERIALIZER_VERSION = '0.1.0'

/** Total standard socket bays guaranteed on the breadboard */
const TOTAL_DEFAULT_SLOTS = 5

/**
 * Serializes the current breadboard state into a portable JSON structure.
 *
 * @param icSlots Active breadboard IC slots
 * @param edges Active wire edges connecting pins
 * @param inputStates Input toggle switch values
 * @param isPowerOn Master power switch state
 * @returns Serializable SavedBoardState object
 */
export function serializeBoardState(
  icSlots: ICSlot[],
  edges: Edge[],
  inputStates: Record<string, boolean>,
  isPowerOn: boolean
): SavedBoardState {
  return {
    version: CURRENT_SERIALIZER_VERSION,
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

/**
 * Deserializes and migrates a saved board JSON object into active store formats.
 * Guarantees exactly 5 IC slots even when loading partial or legacy saves.
 *
 * @param raw Persisted JSON data
 * @returns Hydrated IC slots, ReactFlow wire edges, input states, and power state
 */
export function deserializeBoardState(raw: SavedBoardState): {
  icSlots: ICSlot[]
  edges: Edge[]
  inputStates: Record<string, boolean>
  isPowerOn: boolean
} {
  const defaultSlots: ICSlot[] = Array.from({ length: TOTAL_DEFAULT_SLOTS }, (_, i) => ({
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

