import { create } from 'zustand'

export interface ICDefinitionSlot {
  partNumber: string
  name: string
  packageType: string
  family: string
  delay: number
  vcc: number
  gnd: number
}

export interface ICSlot {
  slotId: string
  icDefinition: ICDefinitionSlot | null
  isSelected: boolean
}

interface BoardState {
  isPowerOn: boolean

  inputStates: Record<string, boolean>

  clockStates: Record<string, boolean>
  selectedFrequency: string

  icSlots: ICSlot[]

  selectedSlotId: string | null

  outputStates: Record<string, boolean>

  displayValues: [string, string]

  togglePower: () => void
  toggleInput: (pin: string) => void
  toggleClock: (pin: string) => void
  setFrequency: (freq: string) => void
  selectSlot: (slotId: string) => void
  assignIC: (slotId: string, ic: ICDefinitionSlot) => void
  removeIC: (slotId: string) => void
  clearSelection: () => void
  resetBoard: () => void
  setOutputStates: (states: Record<string, boolean>) => void
}

const createDefaultSlots = (): ICSlot[] =>
  Array.from({ length: 5 }, (_, i) => ({
    slotId: `slot-${i + 1}`,
    icDefinition: null,
    isSelected: false,
  }))

export const useBoardStore = create<BoardState>((set, get) => ({
  isPowerOn: true,
  inputStates: {},
  clockStates: {},
  selectedFrequency: '1',
  icSlots: createDefaultSlots(),
  selectedSlotId: null,
  outputStates: {},
  displayValues: ['0', '0'],

  togglePower: () => set((s) => ({ isPowerOn: !s.isPowerOn })),

  toggleInput: (pin) =>
    set((s) => ({
      inputStates: {
        ...s.inputStates,
        [pin]: !s.inputStates[pin],
      },
    })),

  toggleClock: (pin) =>
    set((s) => ({
      clockStates: {
        ...s.clockStates,
        [pin]: !s.clockStates[pin],
      },
    })),

  setFrequency: (freq) => set({ selectedFrequency: freq }),

  selectSlot: (slotId) =>
    set((s) => ({
      selectedSlotId: slotId,
      icSlots: s.icSlots.map((slot) => ({
        ...slot,
        isSelected: slot.slotId === slotId,
      })),
    })),

  assignIC: (slotId, ic) =>
    set((s) => ({
      icSlots: s.icSlots.map((slot) =>
        slot.slotId === slotId ? { ...slot, icDefinition: ic } : slot
      ),
    })),

  removeIC: (slotId) =>
    set((s) => ({
      icSlots: s.icSlots.map((slot) =>
        slot.slotId === slotId
          ? { ...slot, icDefinition: null, isSelected: false }
          : slot
      ),
      selectedSlotId: s.selectedSlotId === slotId ? null : s.selectedSlotId,
    })),

  clearSelection: () =>
    set((s) => ({
      selectedSlotId: null,
      icSlots: s.icSlots.map((slot) => ({
        ...slot,
        isSelected: false,
      })),
    })),

  resetBoard: () =>
    set({
      isPowerOn: true,
      inputStates: {},
      clockStates: {},
      selectedFrequency: '1',
      icSlots: createDefaultSlots(),
      selectedSlotId: null,
      outputStates: {},
      displayValues: ['0', '0'],
    }),

  setOutputStates: (states) => {
    let value = 0
    for (let i = 7; i >= 0; i--) {
      value = (value << 1) | (states[String(i)] ? 1 : 0)
    }
    const hex = value.toString(16).toUpperCase().padStart(2, '0')
    const digit1 = hex[0] ?? '0'
    const digit2 = hex[1] ?? '0'

    set({
      outputStates: states,
      displayValues: [digit1, digit2],
    })
  },
}))
