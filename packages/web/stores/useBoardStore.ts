import { create } from 'zustand'
import { useEditorEdgesStore } from './useEditorEdgesStore'
import type { ChipState } from '@/lib/simulationEngine'
export interface ICDefinitionSlot {
  partNumber: string
  name: string
  packageType: string
  family: string
  delay: number
  vcc: number
  gnd: number
}
export type EditorTool = 'select' | 'wire' | 'pan' | 'delete'
export interface ICSlot {
  slotId: string
  icDefinition: ICDefinitionSlot | null
  isSelected: boolean
}
interface BoardState {
  activeTool: EditorTool
  setActiveTool: (tool: EditorTool) => void
  isPowerOn: boolean
  inputStates: Record<string, boolean>
  clockStates: Record<string, boolean>
  selectedFrequency: string
  isClockRunning: boolean
  toggleClockRunning: () => void
  setClockRunning: (running: boolean) => void
  generatePulse: () => void
  icSlots: ICSlot[]
  selectedSlotId: string | null
  outputStates: Record<string, boolean>
  displayValues: [string, string]
  chipStates: Record<string, ChipState>
  setChipStates: (states: Record<string, ChipState>) => void
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
  waveformHistory: Record<string, boolean[]>
  recordWaveform: () => void
  recordWaveformSnapshot: (
    inputs: Record<string, boolean>,
    clocks: Record<string, boolean>,
    outputs: Record<string, boolean>,
    activeSignals?: string[]
  ) => void
  clearWaveform: () => void
  loadBoardState: (state: {
    icSlots: ICSlot[]
    inputStates: Record<string, boolean>
    isPowerOn: boolean
  }) => void
}
const createDefaultSlots = (): ICSlot[] =>
  Array.from({ length: 5 }, (_, i) => ({
    slotId: `slot-${i + 1}`,
    icDefinition: null,
    isSelected: false,
  }))
export const useBoardStore = create<BoardState>((set, get) => ({
  activeTool: 'select',
  setActiveTool: (tool) => set({ activeTool: tool }),
  isPowerOn: true,
  inputStates: {},
  clockStates: {},
  selectedFrequency: '1',
  isClockRunning: false,
  toggleClockRunning: () => set((s) => ({ isClockRunning: !s.isClockRunning })),
  setClockRunning: (running) => set({ isClockRunning: running }),
  generatePulse: () => {
    const s = get()
    if (!s.isPowerOn) return
    const freq = s.selectedFrequency || '1'
    set((state) => ({
      clockStates: { ...state.clockStates, [freq]: true },
    }))
    setTimeout(() => {
      set((state) => ({
        clockStates: { ...state.clockStates, [freq]: false },
      }))
    }, 120)
  },
  icSlots: createDefaultSlots(),
  selectedSlotId: null,
  outputStates: {},
  displayValues: ['0', '0'],
  chipStates: {},
  setChipStates: (states) => set({ chipStates: states }),
  togglePower: () =>
    set((s) => ({
      isPowerOn: !s.isPowerOn,
      isClockRunning: !s.isPowerOn ? s.isClockRunning : false,
      chipStates: !s.isPowerOn ? s.chipStates : {},
    })),
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
  setFrequency: (freq) => set({ selectedFrequency: freq, isClockRunning: true }),
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
  resetBoard: () => {
    useEditorEdgesStore.getState().setEdges([])
    set({
      activeTool: 'select',
      isPowerOn: true,
      inputStates: {},
      clockStates: {},
      selectedFrequency: '1',
      isClockRunning: false,
      icSlots: createDefaultSlots(),
      selectedSlotId: null,
      outputStates: {},
      displayValues: ['0', '0'],
      chipStates: {},
      waveformHistory: {},
    })
  },
  setOutputStates: (states) =>
    set((s) => {
      const prevKeys = Object.keys(s.outputStates)
      const nextKeys = Object.keys(states)
      let isDifferent = prevKeys.length !== nextKeys.length
      if (!isDifferent) {
        for (const k of nextKeys) {
          if (s.outputStates[k] !== states[k]) {
            isDifferent = true
            break
          }
        }
      }
      let value = 0
      for (let i = 7; i >= 0; i--) {
        value = (value << 1) | (states[String(i)] ? 1 : 0)
      }
      const hex = value.toString(16).toUpperCase().padStart(2, '0')
      const digit1 = hex[0] ?? '0'
      const digit2 = hex[1] ?? '0'
      const displayDifferent =
        s.displayValues[0] !== digit1 || s.displayValues[1] !== digit2
      if (!isDifferent && !displayDifferent) {
        return s
      }
      return {
        outputStates: isDifferent ? states : s.outputStates,
        displayValues: displayDifferent ? [digit1, digit2] : s.displayValues,
      }
    }),
  waveformHistory: {},
  recordWaveform: () =>
    set((s) => {
      const next: Record<string, boolean[]> = { ...s.waveformHistory }
      for (const [pin, val] of Object.entries(s.inputStates)) {
        const key = `IN-${pin}`
        next[key] = [...(next[key] ?? []), val]
      }
      for (const [pin, val] of Object.entries(s.outputStates)) {
        const key = `OUT-${pin}`
        next[key] = [...(next[key] ?? []), val]
      }
      return { waveformHistory: next }
    }),
  recordWaveformSnapshot: (inputs, clocks, outputs, activeSignals = []) =>
    set((s) => {
      const signalKeys = new Set<string>()
      for (const k of Object.keys(s.waveformHistory)) {
        signalKeys.add(k)
      }
      for (const k of activeSignals) {
        signalKeys.add(k)
      }
      for (const [k, v] of Object.entries(inputs)) {
        if (v) signalKeys.add(`IN-${k}`)
      }
      for (const [k, v] of Object.entries(clocks)) {
        if (v) signalKeys.add(`CLK-${k}`)
      }
      for (const [k, v] of Object.entries(outputs)) {
        if (v) signalKeys.add(`OUT-${k}`)
      }
      if (signalKeys.size === 0) return s
      let maxLen = 0
      for (const samples of Object.values(s.waveformHistory)) {
        if (samples.length > maxLen) maxLen = samples.length
      }
      const MAX_SAMPLES = 80
      const next: Record<string, boolean[]> = {}
      for (const key of signalKeys) {
        let val = false
        if (key.startsWith('IN-')) {
          val = Boolean(inputs[key.slice(3)])
        } else if (key.startsWith('CLK-')) {
          val = Boolean(clocks[key.slice(4)])
        } else if (key.startsWith('OUT-')) {
          val = Boolean(outputs[key.slice(4)])
        }
        const existing = s.waveformHistory[key]
        if (existing) {
          let filled = existing
          if (existing.length < maxLen) {
            filled = [
              ...existing,
              ...Array(maxLen - existing.length).fill(
                existing[existing.length - 1] ?? false
              ),
            ]
          }
          next[key] = [...filled, val].slice(-MAX_SAMPLES)
        } else {
          next[key] = [...Array(maxLen).fill(false), val].slice(-MAX_SAMPLES)
        }
      }
      return { waveformHistory: next }
    }),
  clearWaveform: () => set({ waveformHistory: {} }),
  loadBoardState: (state) =>
    set({
      icSlots: state.icSlots,
      inputStates: state.inputStates,
      isPowerOn: state.isPowerOn,
    }),
}))
