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

  // Pure vertical layout along a central spine
  const spineX = 380
  const stateBoxW = 180
  const decDiamondW = 130
  const startY = 60
  const stateSpacingY = 240

  states.forEach((state, stateIdx) => {
    const stateY = startY + stateIdx * stateSpacingY
    const stateBlockId = `asm-state-${state.id}`

    // 1. State Box (centered on spine)
    blocks.push({
      id: stateBlockId,
      type: 'state',
      stateId: state.id,
      name: state.name,
      code: encodings[state.id] ?? '',
      outputs: machineType === 'moore' ? state.mooreOutputs : undefined,
      x: spineX - stateBoxW / 2,
      y: stateY,
    })

    const outgoing = transitions.filter((t) => t.fromState === state.id)
    if (outgoing.length === 0) return

    // Check if transitions are conditioned on an input variable
    const hasCondition = outgoing.some(
      (t) => t.condition && t.condition !== '1' && t.condition.toLowerCase() !== 'always'
    )

    if (hasCondition) {
      // Determine condition variable name (e.g. "m" or "X")
      let condVar = inputNames[0] ?? 'X'
      for (const t of outgoing) {
        if (t.condition.includes('=')) {
          const varPart = t.condition.split('=')[0]?.trim()
          if (varPart) {
            condVar = varPart
            break
          }
        }
      }

      const decY = stateY + 95
      const decisionBlockId = `asm-dec-${state.id}`

      // 2. Decision Diamond (centered on spine beneath State Box)
      blocks.push({
        id: decisionBlockId,
        type: 'decision',
        stateId: state.id,
        name: condVar,
        conditionVar: condVar,
        x: spineX - decDiamondW / 2,
        y: decY,
      })

      // Downward flow from State Box into Decision Diamond
      edges.push({
        id: `edge-${stateBlockId}-${decisionBlockId}`,
        source: stateBlockId,
        target: decisionBlockId,
        sourceHandle: 'bottom',
        targetHandle: 'top',
      })

      // Identify True (1) and False (0) transitions
      const trueTrans = outgoing.find(
        (t) =>
          t.condition.includes('=1') ||
          t.condition.includes('= 1') ||
          t.condition === condVar ||
          t.condition === '1'
      )
      const falseTrans = outgoing.find(
        (t) =>
          t.condition.includes('=0') ||
          t.condition.includes('= 0') ||
          t.condition.startsWith('!') ||
          t.condition.startsWith('~')
      )

      const branchesToProcess: Array<{ trans: FSMTransition; label: string; isTrue: boolean }> = []
      if (trueTrans) {
        branchesToProcess.push({ trans: trueTrans, label: '1', isTrue: true })
      }
      if (falseTrans && falseTrans.id !== trueTrans?.id) {
        branchesToProcess.push({ trans: falseTrans, label: '0', isTrue: false })
      }

      // If neither matched by regex but we have outgoing edges, fall back to first and second
      if (branchesToProcess.length === 0) {
        if (outgoing[0]) branchesToProcess.push({ trans: outgoing[0], label: '1', isTrue: true })
        if (outgoing[1]) branchesToProcess.push({ trans: outgoing[1], label: '0', isTrue: false })
      }

      branchesToProcess.forEach(({ trans, label, isTrue }) => {
        const targetIdx = states.findIndex((s) => s.id === trans.toState)
        const targetStateId = `asm-state-${trans.toState}`

        const hasMealy =
          machineType === 'mealy' &&
          outputNames.some((o) => (trans.mealyOutputs[o] ?? 0) === 1)

        // Determine orthogonal routing handles based on vertical chart geometry
        let sourceHandle: 'bottom' | 'left' | 'right' = 'bottom'
        let targetHandle: 'top' | 'left' | 'right' = 'top'

        const isSequentialNext = targetIdx === stateIdx + 1
        const isWrapAroundToStart = targetIdx === 0 && stateIdx === states.length - 1
        const isLoopBack = targetIdx <= stateIdx && !isWrapAroundToStart
        const isForwardSkip = targetIdx > stateIdx + 1

        if (isSequentialNext) {
          // Straight down vertical spine
          sourceHandle = 'bottom'
          targetHandle = 'top'
        } else if (isWrapAroundToStart) {
          // Outer right rail wrapping around to the top
          sourceHandle = 'right'
          targetHandle = 'top'
        } else if (isLoopBack) {
          // Left rail looping back up to an earlier state
          sourceHandle = 'left'
          targetHandle = 'left'
        } else if (isForwardSkip) {
          // Right rail leaping forward
          sourceHandle = 'right'
          targetHandle = 'right'
        } else {
          sourceHandle = isTrue ? 'bottom' : 'left'
          targetHandle = 'top'
        }

        if (hasMealy) {
          // Conditional Output Box (Oval / Rounded rectangle)
          const condOutId = `asm-cond-${trans.id}`
          let condX = spineX - 60
          let condY = decY + 65

          if (sourceHandle === 'left') {
            condX = spineX - 160
            condY = decY
          } else if (sourceHandle === 'right') {
            condX = spineX + 160
            condY = decY
          }

          blocks.push({
            id: condOutId,
            type: 'conditional_output',
            stateId: state.id,
            name: 'Outputs',
            outputs: trans.mealyOutputs,
            x: condX,
            y: condY,
          })

          edges.push({
            id: `edge-${decisionBlockId}-${condOutId}`,
            source: decisionBlockId,
            target: condOutId,
            sourceHandle,
            targetHandle: 'top',
            label,
          })

          edges.push({
            id: `edge-${condOutId}-${targetStateId}`,
            source: condOutId,
            target: targetStateId,
            sourceHandle: 'bottom',
            targetHandle,
          })
        } else {
          edges.push({
            id: `edge-${decisionBlockId}-${targetStateId}-${label}`,
            source: decisionBlockId,
            target: targetStateId,
            sourceHandle,
            targetHandle,
            label,
          })
        }
      })
    } else {
      // Unconditional transition (straight flow)
      const t = outgoing[0]
      if (t) {
        const targetIdx = states.findIndex((s) => s.id === t.toState)
        const targetId = `asm-state-${t.toState}`

        let sourceHandle: 'bottom' | 'left' | 'right' = 'bottom'
        let targetHandle: 'top' | 'left' | 'right' = 'top'

        if (targetIdx === stateIdx + 1) {
          sourceHandle = 'bottom'
          targetHandle = 'top'
        } else if (targetIdx === 0 && stateIdx === states.length - 1) {
          sourceHandle = 'right'
          targetHandle = 'top'
        } else if (targetIdx <= stateIdx) {
          sourceHandle = 'left'
          targetHandle = 'left'
        } else {
          sourceHandle = 'right'
          targetHandle = 'right'
        }

        edges.push({
          id: `edge-${stateBlockId}-${targetId}`,
          source: stateBlockId,
          target: targetId,
          sourceHandle,
          targetHandle,
        })
      }
    }
  })

  return { blocks, edges }
}
