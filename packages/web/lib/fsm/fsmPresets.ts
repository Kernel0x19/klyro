import type { FSMState, FSMTransition, MachineType } from './types'

export interface FSMPreset {
  id: string
  name: string
  description: string
  machineType: MachineType
  inputs: string[]
  outputs: string[]
  states: FSMState[]
  transitions: FSMTransition[]
}

export const FSM_PRESETS: FSMPreset[] = [
  {
    id: 'seq-101',
    name: "Sequence Detector '101' (Mealy)",
    description: "Detects the bit sequence 1-0-1 on input 'X', asserting output 'Z=1' on detection with overlap.",
    machineType: 'mealy',
    inputs: ['X'],
    outputs: ['Z'],
    states: [
      { id: 's0', name: 'S0 (Reset)', x: 100, y: 150, isInitial: true, mooreOutputs: { Z: 0 } },
      { id: 's1', name: 'S1 (Saw 1)', x: 350, y: 150, isInitial: false, mooreOutputs: { Z: 0 } },
      { id: 's2', name: 'S2 (Saw 10)', x: 600, y: 150, isInitial: false, mooreOutputs: { Z: 0 } },
    ],
    transitions: [
      // S0
      { id: 't0_0', fromState: 's0', toState: 's0', condition: 'X=0', mealyOutputs: { Z: 0 } },
      { id: 't0_1', fromState: 's0', toState: 's1', condition: 'X=1', mealyOutputs: { Z: 0 } },
      // S1
      { id: 't1_0', fromState: 's1', toState: 's2', condition: 'X=0', mealyOutputs: { Z: 0 } },
      { id: 't1_1', fromState: 's1', toState: 's1', condition: 'X=1', mealyOutputs: { Z: 0 } },
      // S2
      { id: 't2_0', fromState: 's2', toState: 's0', condition: 'X=0', mealyOutputs: { Z: 0 } },
      { id: 't2_1', fromState: 's2', toState: 's1', condition: 'X=1', mealyOutputs: { Z: 1 } }, // match!
    ],
  },
  {
    id: 'gray-counter',
    name: '2-Bit Gray Counter (Moore)',
    description: 'Sequences through Gray codes (00 → 01 → 11 → 10) on enable input E=1.',
    machineType: 'moore',
    inputs: ['E'],
    outputs: ['Y1', 'Y0'],
    states: [
      { id: 'g0', name: 'S0 (00)', x: 150, y: 80, isInitial: true, mooreOutputs: { Y1: 0, Y0: 0 } },
      { id: 'g1', name: 'S1 (01)', x: 450, y: 80, isInitial: false, mooreOutputs: { Y1: 0, Y0: 1 } },
      { id: 'g2', name: 'S2 (11)', x: 450, y: 320, isInitial: false, mooreOutputs: { Y1: 1, Y0: 1 } },
      { id: 'g3', name: 'S3 (10)', x: 150, y: 320, isInitial: false, mooreOutputs: { Y1: 1, Y0: 0 } },
    ],
    transitions: [
      { id: 'tg0_hold', fromState: 'g0', toState: 'g0', condition: 'E=0', mealyOutputs: {} },
      { id: 'tg0_adv', fromState: 'g0', toState: 'g1', condition: 'E=1', mealyOutputs: {} },
      { id: 'tg1_hold', fromState: 'g1', toState: 'g1', condition: 'E=0', mealyOutputs: {} },
      { id: 'tg1_adv', fromState: 'g1', toState: 'g2', condition: 'E=1', mealyOutputs: {} },
      { id: 'tg2_hold', fromState: 'g2', toState: 'g2', condition: 'E=0', mealyOutputs: {} },
      { id: 'tg2_adv', fromState: 'g2', toState: 'g3', condition: 'E=1', mealyOutputs: {} },
      { id: 'tg3_hold', fromState: 'g3', toState: 'g3', condition: 'E=0', mealyOutputs: {} },
      { id: 'tg3_adv', fromState: 'g3', toState: 'g0', condition: 'E=1', mealyOutputs: {} },
    ],
  },
  {
    id: 'traffic-light',
    name: 'Simple Traffic Light Controller (Moore)',
    description: 'Cycles Green → Yellow → Red upon sensor trigger CAR=1.',
    machineType: 'moore',
    inputs: ['CAR'],
    outputs: ['RED', 'YELLOW', 'GREEN'],
    states: [
      { id: 'tl_green', name: 'GREEN', x: 150, y: 200, isInitial: true, mooreOutputs: { RED: 0, YELLOW: 0, GREEN: 1 } },
      { id: 'tl_yellow', name: 'YELLOW', x: 400, y: 200, isInitial: false, mooreOutputs: { RED: 0, YELLOW: 1, GREEN: 0 } },
      { id: 'tl_red', name: 'RED', x: 650, y: 200, isInitial: false, mooreOutputs: { RED: 1, YELLOW: 0, GREEN: 0 } },
    ],
    transitions: [
      { id: 'ttl_g_hold', fromState: 'tl_green', toState: 'tl_green', condition: 'CAR=0', mealyOutputs: {} },
      { id: 'ttl_g_adv', fromState: 'tl_green', toState: 'tl_yellow', condition: 'CAR=1', mealyOutputs: {} },
      { id: 'ttl_y_adv', fromState: 'tl_yellow', toState: 'tl_red', condition: '1', mealyOutputs: {} },
      { id: 'ttl_r_adv', fromState: 'tl_red', toState: 'tl_green', condition: '1', mealyOutputs: {} },
    ],
  },
]
