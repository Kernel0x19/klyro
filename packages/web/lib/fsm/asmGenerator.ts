import type {
  ASMBlock,
  ASMChartData,
  ASMEdge,
  FSMState,
  FSMTransition,
  MachineType,
  StateEncodingMap,
} from './types'

export function generateASMChart(
  states: FSMState[],
  transitions: FSMTransition[],
  inputNames: string[],
  outputNames: string[],
  machineType: MachineType,
  encodings: StateEncodingMap
): ASMChartData {
  const blocks: ASMBlock[] = []
  const edges: ASMEdge[] = []

  if (states.length === 0) return { blocks, edges }

  // We lay out each state column-by-column or row-by-row
  const stateSpacingX = 380
  const startX = 60
  const startY = 60

  states.forEach((state, stateIdx) => {
    const colX = startX + stateIdx * stateSpacingX
    let currentY = startY

    const stateBlockId = `asm-state-${state.id}`
    blocks.push({
      id: stateBlockId,
      type: 'state',
      stateId: state.id,
      name: state.name,
      code: encodings[state.id] ?? '',
      outputs: machineType === 'moore' ? state.mooreOutputs : undefined,
      x: colX,
      y: currentY,
    })

    currentY += 120

    // Transitions from this state
    const outgoing = transitions.filter((t) => t.fromState === state.id)

    if (outgoing.length === 0) {
      // No transitions out, self-loop or dead-end
      return
    }

    // Check if there are conditioned transitions (e.g. input dependent)
    const primaryInput = inputNames[0] ?? 'X'
    const hasCondition = outgoing.some(
      (t) => t.condition && t.condition !== '1' && t.condition.toLowerCase() !== 'always'
    )

    if (hasCondition) {
      // Create Decision diamond
      const decisionBlockId = `asm-dec-${state.id}`
      blocks.push({
        id: decisionBlockId,
        type: 'decision',
        stateId: state.id,
        name: `${primaryInput} = 1?`,
        conditionVar: primaryInput,
        x: colX,
        y: currentY,
      })

      // Edge from State box to Decision diamond
      edges.push({
        id: `edge-${stateBlockId}-${decisionBlockId}`,
        source: stateBlockId,
        target: decisionBlockId,
      })

      currentY += 140

      // Find branch where X=1 and branch where X=0
      const trueTrans = outgoing.find(
        (t) => t.condition.includes('=1') || t.condition === primaryInput || t.condition === '1'
      )
      const falseTrans = outgoing.find(
        (t) => t.condition.includes('=0') || t.condition.startsWith('!') || t.condition.startsWith('~')
      )

      // 1. True branch (drawn slightly to the right or straight)
      if (trueTrans) {
        const hasMealy =
          machineType === 'mealy' &&
          outputNames.some((o) => (trueTrans.mealyOutputs[o] ?? 0) === 1)

        let targetId = `asm-state-${trueTrans.toState}`

        if (hasMealy) {
          const condOutId = `asm-cond-${trueTrans.id}`
          blocks.push({
            id: condOutId,
            type: 'conditional_output',
            stateId: state.id,
            name: 'Outputs',
            outputs: trueTrans.mealyOutputs,
            x: colX + 90,
            y: currentY,
          })
          edges.push({
            id: `edge-${decisionBlockId}-${condOutId}`,
            source: decisionBlockId,
            target: condOutId,
            label: '1 (True)',
          })
          edges.push({
            id: `edge-${condOutId}-${targetId}`,
            source: condOutId,
            target: targetId,
          })
        } else {
          edges.push({
            id: `edge-${decisionBlockId}-${targetId}-true`,
            source: decisionBlockId,
            target: targetId,
            label: '1 (True)',
          })
        }
      }

      // 2. False branch (drawn slightly to the left)
      if (falseTrans) {
        const hasMealy =
          machineType === 'mealy' &&
          outputNames.some((o) => (falseTrans.mealyOutputs[o] ?? 0) === 1)

        let targetId = `asm-state-${falseTrans.toState}`

        if (hasMealy) {
          const condOutId = `asm-cond-${falseTrans.id}`
          blocks.push({
            id: condOutId,
            type: 'conditional_output',
            stateId: state.id,
            name: 'Outputs',
            outputs: falseTrans.mealyOutputs,
            x: colX - 90,
            y: currentY,
          })
          edges.push({
            id: `edge-${decisionBlockId}-${condOutId}`,
            source: decisionBlockId,
            target: condOutId,
            label: '0 (False)',
          })
          edges.push({
            id: `edge-${condOutId}-${targetId}`,
            source: condOutId,
            target: targetId,
          })
        } else {
          edges.push({
            id: `edge-${decisionBlockId}-${targetId}-false`,
            source: decisionBlockId,
            target: targetId,
            label: '0 (False)',
          })
        }
      }
    } else {
      // Unconditional transition directly to next state
      const t = outgoing[0]
      if (t) {
        const targetId = `asm-state-${t.toState}`
        edges.push({
          id: `edge-${stateBlockId}-${targetId}`,
          source: stateBlockId,
          target: targetId,
        })
      }
    }
  })

  return { blocks, edges }
}
