'use client'
import React, { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  MarkerType,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFSMStore } from '@/stores/useFSMStore'
import { generateASMChart } from '@/lib/fsm/asmGenerator'
import ASMStateNode from './asm/ASMStateNode'
import ASMDecisionNode from './asm/ASMDecisionNode'
import ASMCondOutputNode from './asm/ASMCondOutputNode'

export default function ASMChartCanvas() {
  const states = useFSMStore((s) => s.states)
  const transitions = useFSMStore((s) => s.transitions)
  const inputs = useFSMStore((s) => s.inputs)
  const outputs = useFSMStore((s) => s.outputs)
  const machineType = useFSMStore((s) => s.machineType)
  const encodings = useFSMStore((s) => s.encodings)

  const nodeTypes = useMemo(
    () => ({
      asmState: ASMStateNode,
      asmDecision: ASMDecisionNode,
      asmCondOutput: ASMCondOutputNode,
    }),
    []
  )

  const { blocks, edges: rawEdges } = useMemo(() => {
    return generateASMChart(
      states,
      transitions,
      inputs,
      outputs,
      machineType,
      encodings
    )
  }, [states, transitions, inputs, outputs, machineType, encodings])

  const nodes: Node[] = useMemo(() => {
    return blocks.map((b) => {
      const type =
        b.type === 'state'
          ? 'asmState'
          : b.type === 'decision'
            ? 'asmDecision'
            : 'asmCondOutput'

      return {
        id: b.id,
        type,
        position: { x: b.x, y: b.y },
        data: {
          name: b.name,
          code: b.code,
          outputs: b.outputs,
          condition: b.conditionVar ?? b.name,
        },
      }
    })
  }, [blocks])

  const edges: Edge[] = useMemo(() => {
    return rawEdges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      ...(e.sourceHandle ? { sourceHandle: e.sourceHandle } : {}),
      ...(e.targetHandle ? { targetHandle: e.targetHandle } : {}),
      type: 'smoothstep',
      pathOptions: { borderRadius: 8, offset: e.offset ?? 28 },
      ...(e.label ? { label: e.label } : {}),
      labelStyle: { fill: '#93c5fd', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' },
      labelBgStyle: { fill: '#0c1020', stroke: '#4F6EF7', strokeWidth: 1, rx: 4, ry: 4 },
      labelBgPadding: [6, 3] as [number, number],
      style: { stroke: '#4F6EF7', strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4F6EF7',
        width: 14,
        height: 14,
      },
    }))
  }, [rawEdges])

  return (
    <div className="relative w-full h-full bg-black/40">
      <div className="absolute top-3 left-4 z-10 px-2.5 py-1 rounded bg-surface/90 border border-border-theme backdrop-blur-xs text-[11px] font-mono text-text-secondary select-none">
        Auto-Generated ASM Chart (Algorithmic State Machine)
      </div>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.2}
        maxZoom={2.5}
        nodesDraggable={true}
        nodesConnectable={false}
        edgesReconnectable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        deleteKeyCode={null}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls className="!bg-surface !border-border-theme !rounded !shadow-md" />
      </ReactFlow>
    </div>
  )
}
