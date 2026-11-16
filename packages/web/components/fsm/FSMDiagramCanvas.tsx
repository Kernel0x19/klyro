'use client'
import React, { useMemo, useState, useCallback } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  applyNodeChanges,
  MarkerType,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFSMStore } from '@/stores/useFSMStore'
import StateNode from './StateNode'
import TransitionEdge from './TransitionEdge'
import EditStateModal from './EditStateModal'
import EditTransitionModal from './EditTransitionModal'

export default function FSMDiagramCanvas() {
  const states = useFSMStore((s) => s.states)
  const transitions = useFSMStore((s) => s.transitions)
  const encodings = useFSMStore((s) => s.encodings)
  const updateState = useFSMStore((s) => s.updateState)
  const addTransition = useFSMStore((s) => s.addTransition)

  const [editStateId, setEditStateId] = useState<string | null>(null)
  const [editTransitionId, setEditTransitionId] = useState<string | null>(null)

  const nodeTypes = useMemo(() => ({ stateNode: StateNode }), [])
  const edgeTypes = useMemo(() => ({ transitionEdge: TransitionEdge }), [])

  // Map FSM states to ReactFlow nodes
  const nodes: Node[] = useMemo(() => {
    return states.map((s) => ({
      id: s.id,
      type: 'stateNode',
      position: { x: s.x, y: s.y },
      data: {
        id: s.id,
        name: s.name,
        isInitial: s.isInitial,
        code: encodings[s.id],
        mooreOutputs: s.mooreOutputs,
        onEdit: (id: string) => setEditStateId(id),
      },
    }))
  }, [states, encodings])

  // Map FSM transitions to ReactFlow edges
  const edges: Edge[] = useMemo(() => {
    return transitions.map((t) => ({
      id: t.id,
      source: t.fromState,
      target: t.toState,
      type: 'transitionEdge',
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: '#4F6EF7',
        width: 14,
        height: 14,
      },
      data: {
        condition: t.condition,
        mealyOutputs: t.mealyOutputs,
        onEdit: (id: string) => setEditTransitionId(id),
      },
    }))
  }, [transitions])

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      changes.forEach((change) => {
        if (change.type === 'position' && change.position) {
          updateState(change.id, {
            x: change.position.x,
            y: change.position.y,
          })
        }
      })
    },
    [updateState]
  )

  const onConnect = useCallback(
    (params: Connection) => {
      if (params.source && params.target) {
        addTransition(params.source, params.target, '1', {})
      }
    },
    [addTransition]
  )

  return (
    <div className="relative w-full h-full bg-black/40">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onConnect={onConnect}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.2}
        maxZoom={2.5}
        deleteKeyCode={['Backspace', 'Delete']}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#333" gap={20} size={1} />
        <Controls className="!bg-surface !border-border-theme !rounded !shadow-md" />
        <MiniMap
          nodeColor="#4F6EF7"
          maskColor="rgba(0, 0, 0, 0.7)"
          className="!bg-surface !border-border-theme !rounded !shadow-md"
        />
      </ReactFlow>

      {/* Edit Modals */}
      <EditStateModal stateId={editStateId} onClose={() => setEditStateId(null)} />
      <EditTransitionModal
        transitionId={editTransitionId}
        onClose={() => setEditTransitionId(null)}
      />
    </div>
  )
}
