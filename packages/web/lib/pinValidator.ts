import type { Connection } from '@xyflow/react'
import { IC_LIBRARY, type ICPin } from './icLibrary'
export interface PinInfo {
  nodeId: string
  handleId: string
  section: 'OUTPUT_PANEL' | 'INPUT_PANEL' | 'IC'
  type: 'OUTPUT_INDICATOR' | 'VCC' | 'GND' | 'CLOCK' | 'INPUT_SWITCH' | 'IC_PIN'
  icFunction?: 'input' | 'output' | 'clock' | 'vcc' | 'gnd' | 'nc'
  pinLabel: string
  chipLabel?: string
}
export interface ValidationResult {
  valid: boolean
  message: string
}
function findIC(partNumber: string) {
  for (const cat of IC_LIBRARY) {
    const found = cat.ics.find((ic) => ic.part === partNumber)
    if (found) return found
  }
  return null
}
export function resolvePinInfo(
  nodeId: string | null | undefined,
  handleId: string | null | undefined,
  icSlots: Array<{ slotId: string; icDefinition?: { partNumber: string } | null }>
): PinInfo | null {
  if (!nodeId || !handleId) return null
  if (nodeId === 'main-output-panel') {
    if (handleId === 'pin-VCC') {
      return {
        nodeId,
        handleId,
        section: 'OUTPUT_PANEL',
        type: 'VCC',
        pinLabel: 'VCC (+5V)',
      }
    }
    const pinName = handleId.replace('pin-', '')
    return {
      nodeId,
      handleId,
      section: 'OUTPUT_PANEL',
      type: 'OUTPUT_INDICATOR',
      pinLabel: `Output Section Pin ${pinName}`,
    }
  }
  if (nodeId === 'main-input-clock-panel') {
    if (handleId === 'input-gnd') {
      return {
        nodeId,
        handleId,
        section: 'INPUT_PANEL',
        type: 'GND',
        pinLabel: 'GND (0V)',
      }
    }
    if (handleId.startsWith('clock-')) {
      const freq = handleId.replace('clock-', '')
      return {
        nodeId,
        handleId,
        section: 'INPUT_PANEL',
        type: 'CLOCK',
        pinLabel: `Clock ${freq} Hz`,
      }
    }
    if (handleId.startsWith('input-')) {
      const pinName = handleId.replace('input-', '')
      return {
        nodeId,
        handleId,
        section: 'INPUT_PANEL',
        type: 'INPUT_SWITCH',
        pinLabel: `Input Switch ${pinName}`,
      }
    }
  }
  if (nodeId.startsWith('ic-chip-')) {
    const chipNum = parseInt(nodeId.replace('ic-chip-', ''), 10)
    const chipIndex = isNaN(chipNum) ? 0 : Math.max(0, chipNum - 1)
    const slot = icSlots[chipIndex]
    const chipLabel = slot?.icDefinition?.partNumber || `IC BASE ${chipIndex + 1}`
    const pinNum = parseInt(handleId.replace('pin-', ''), 10)
    let icFunction: PinInfo['icFunction'] = undefined
    let pinLabel = `Pin ${pinNum}`
    if (slot?.icDefinition?.partNumber) {
      const icEntry = findIC(slot.icDefinition.partNumber)
      if (icEntry) {
        const pin = icEntry.pins.find((p) => p.number === pinNum)
        if (pin) {
          icFunction = pin.function
          pinLabel = `Pin ${pinNum} (${pin.label})`
        }
      }
    }
    if (!icFunction) {
      icFunction = pinNum <= 10 ? 'input' : 'output'
    }
    return {
      nodeId,
      handleId,
      section: 'IC',
      type: 'IC_PIN',
      icFunction,
      pinLabel: `${chipLabel} - ${pinLabel}`,
      chipLabel,
    }
  }
  return null
}
export function validatePinConnection(
  connection: Connection,
  icSlots: Array<{ slotId: string; icDefinition?: { partNumber: string } | null }>
): ValidationResult {
  const { source, target, sourceHandle, targetHandle } = connection
  if (!source || !target || !sourceHandle || !targetHandle) {
    return { valid: false, message: 'Incomplete connection points.' }
  }
  if (source === target && sourceHandle === targetHandle) {
    return { valid: false, message: 'Cannot connect a pin to itself.' }
  }
  const pinA = resolvePinInfo(source, sourceHandle, icSlots)
  const pinB = resolvePinInfo(target, targetHandle, icSlots)
  if (!pinA || !pinB) {
    return { valid: false, message: 'Could not resolve connection pins.' }
  }
  const checkPair = (predicate: (p: PinInfo) => boolean) => {
    if (predicate(pinA)) return { matched: pinA, other: pinB }
    if (predicate(pinB)) return { matched: pinB, other: pinA }
    return null
  }
  const outputIndicatorPair = checkPair((p) => p.type === 'OUTPUT_INDICATOR')
  if (outputIndicatorPair) {
    const { matched, other } = outputIndicatorPair
    if (other.section === 'IC') {
      if (other.icFunction === 'input') {
        return {
          valid: false,
          message: `Cannot connect IC Input pin (${other.pinLabel}) to ${matched.pinLabel}. Output indicators can only be driven by IC Outputs.`,
        }
      }
      if (other.icFunction === 'clock') {
        return {
          valid: false,
          message: `Cannot connect IC Clock pin (${other.pinLabel}) to ${matched.pinLabel}.`,
        }
      }
      if (other.icFunction === 'vcc' || other.icFunction === 'gnd') {
        return {
          valid: false,
          message: `Cannot connect Power/Ground (${other.pinLabel}) directly to ${matched.pinLabel}.`,
        }
      }
    } else if (other.section === 'INPUT_PANEL') {
      return {
        valid: false,
        message:
          'Cannot connect Input Section directly to Output Section. Wires must route through ICs.',
      }
    }
  }
  const inputDriverPair = checkPair(
    (p) => p.type === 'INPUT_SWITCH' || p.type === 'CLOCK'
  )
  if (inputDriverPair) {
    const { matched, other } = inputDriverPair
    if (other.section === 'IC') {
      if (other.icFunction === 'output') {
        return {
          valid: false,
          message: `Cannot connect IC Output pin (${other.pinLabel}) to ${matched.pinLabel}. Input switches/clocks cannot be driven by IC Outputs.`,
        }
      }
      if (other.icFunction === 'vcc' || other.icFunction === 'gnd') {
        return {
          valid: false,
          message: `Cannot connect Power/Ground (${other.pinLabel}) to ${matched.pinLabel}.`,
        }
      }
    } else if (other.section === 'OUTPUT_PANEL') {
      return {
        valid: false,
        message:
          'Cannot connect Input Section directly to Output Section. Wires must route through ICs.',
      }
    }
  }
  const vccPair = checkPair((p) => p.type === 'VCC' || p.icFunction === 'vcc')
  if (vccPair) {
    const { other } = vccPair
    if (other.type === 'GND' || other.icFunction === 'gnd') {
      return {
        valid: false,
        message: 'Short Circuit! Cannot connect VCC (+5V) directly to Ground (0V).',
      }
    }
    if (other.icFunction === 'output') {
      return {
        valid: false,
        message: `Short Circuit Risk! Cannot connect IC Output (${other.pinLabel}) directly to VCC.`,
      }
    }
  }
  const gndPair = checkPair((p) => p.type === 'GND' || p.icFunction === 'gnd')
  if (gndPair) {
    const { other } = gndPair
    if (other.type === 'VCC' || other.icFunction === 'vcc') {
      return {
        valid: false,
        message: 'Short Circuit! Cannot connect Ground (0V) directly to VCC (+5V).',
      }
    }
    if (other.icFunction === 'output') {
      return {
        valid: false,
        message: `Short Circuit Risk! Cannot connect IC Output (${other.pinLabel}) directly to Ground.`,
      }
    }
  }
  if (pinA.section === 'IC' && pinB.section === 'IC') {
    if (pinA.icFunction === 'output' && pinB.icFunction === 'output') {
      return {
        valid: false,
        message: `Bus Contention! Cannot connect IC Output (${pinA.pinLabel}) to another IC Output (${pinB.pinLabel}).`,
      }
    }
    if (pinA.icFunction === 'nc' || pinB.icFunction === 'nc') {
      return {
        valid: false,
        message: 'Cannot connect to a No Connect (NC) pin.',
      }
    }
  }
  return { valid: true, message: '' }
}
