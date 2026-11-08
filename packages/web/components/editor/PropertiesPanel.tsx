'use client'
import { useBoardStore } from '@/stores/useBoardStore'
import PropertiesPanelClient from './properties-panel/PropertiesPanelClient'
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
  }
  return (
    <PropertiesPanelClient
      selected={selected}
      onRemove={handleRemove}
      onDuplicate={handleDuplicate}
    />
  )
}
