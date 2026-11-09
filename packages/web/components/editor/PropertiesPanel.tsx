'use client'

import { useBoardStore } from '@/stores/useBoardStore'
import PropertiesPanelClient from './properties-panel/PropertiesPanelClient'
import { getICDefinition, DATASHEET_URLS } from '@/lib/icLibrary'

export default function PropertiesPanel() {
  const {
    selectedSlotId,
    icSlots,
    removeIC,
    clearSelection,
    pinSignals,
    isPowerOn,
  } = useBoardStore()

  const selectedSlot = icSlots.find((s) => s.slotId === selectedSlotId)
  const icDef = selectedSlot?.icDefinition ?? null

  const chipDef = icDef ? getICDefinition(icDef.partNumber) : null
  const chipNodeId = selectedSlotId
    ? `ic-chip-${selectedSlotId.replace('slot-', '')}`
    : null

  const pins = (chipDef?.pins || []).map((pin) => {
    const rawState =
      isPowerOn && chipNodeId
        ? pinSignals[chipNodeId]?.[`pin-${pin.number}`] ?? 'unconnected'
        : 'unconnected'

    return {
      number: pin.number,
      label: pin.label,
      function: pin.function,
      state: rawState,
    }
  })

  const selected = icDef
    ? {
        part: icDef.partNumber,
        name: icDef.name,
        package: icDef.packageType,
        family: icDef.family,
        delay: icDef.delay,
        vcc: icDef.vcc,
        gnd: icDef.gnd,
        datasheetUrl: DATASHEET_URLS[icDef.partNumber],
        pins,
      }
    : null

  const handleRemove = () => {
    if (selectedSlotId) {
      removeIC(selectedSlotId)
      clearSelection()
    }
  }

  return (
    <PropertiesPanelClient
      selected={selected}
      onRemove={handleRemove}
    />
  )
}
