export type MachineType = 'moore' | 'mealy'
export type StateEncoding = 'binary' | 'gray' | 'one-hot'

export interface FSMState {
  id: string
  name: string
  x: number
  y: number
  isInitial: boolean
  mooreOutputs: Record<string, 0 | 1>
}

export interface FSMTransition {
  id: string
  fromState: string
  toState: string
  condition: string // e.g. "X=1", "X=0", or "1" (unconditional)
  mealyOutputs: Record<string, 0 | 1>
}

export interface StateEncodingMap {
  [stateId: string]: string // e.g. "00", "01", "10", "11"
}

export interface StateTableRow {
  id: string
  presentStateId: string
  presentStateName: string
  presentStateCode: string
  inputs: Record<string, 0 | 1>
  nextStateId: string
  nextStateName: string
  nextStateCode: string
  outputs: Record<string, 0 | 1>
}

export type ASMBlockType = 'state' | 'decision' | 'conditional_output'

export interface ASMBlock {
  id: string
  type: ASMBlockType
  stateId?: string | undefined
  name: string
  code?: string | undefined
  outputs?: Record<string, 0 | 1> | undefined
  conditionVar?: string | undefined
  x: number
  y: number
  trueTargetId?: string | undefined
  falseTargetId?: string | undefined
  nextBlockId?: string | undefined
}

export interface ASMEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | undefined
  targetHandle?: string | undefined
  label?: string | undefined
}

export interface ASMChartData {
  blocks: ASMBlock[]
  edges: ASMEdge[]
}

export interface NextStateEquation {
  variable: string // e.g. "D0", "D1", "Z"
  sop: string // e.g. "Q0' · X + Q1 · X'"
}
