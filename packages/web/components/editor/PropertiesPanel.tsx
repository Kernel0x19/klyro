'use client'

import { useBoardStore } from '@/stores/useBoardStore'
import PropertiesPanelClient from './properties-panel/PropertiesPanelClient'
import { IC_LIBRARY } from '@/lib/icLibrary'

export default function PropertiesPanel() {
  const { selectedSlotId, icSlots, removeIC, clearSelection } = useBoardStore()

  const selectedSlot = icSlots.find((s) => s.slotId === selectedSlotId)
  const icDef = selectedSlot?.icDefinition ?? null

  const selected = icDef
    ? {
        part: icDef.partNumber,
        name: icDef.name,
        package: icDef.packageType,
        family: icDef.family,
        delay: icDef.delay,
        datasheetUrl: undefined,
        pins: [],
      }
    : null

  const handleRemove = () => {
    if (selectedSlotId) {
      removeIC(selectedSlotId)
      clearSelection()
    }
  }

  const handleDuplicate = () => {
    // Will implement when multiple slots are supported
  }

  return (
    <PropertiesPanelClient
      selected={selected}
      onRemove={handleRemove}
      onDuplicate={handleDuplicate}
    />
  )
}
