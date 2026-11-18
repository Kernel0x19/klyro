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
  MarkerType,
  ConnectionMode,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useFSMStore } from '@/stores/useFSMStore'
import StateNode from './StateNode'
import TransitionEdge from './TransitionEdge'
import EditStateModal from './EditStateModal'
import EditTransitionModal from './EditTransitionModal'
import { getOptimalEdgeRouting } from '@/lib/fsm/fsmLayout'

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

  // Map FSM transitions to ReactFlow edges with symmetrical arc calculation
  const edges: Edge[] = useMemo(() => {
    let cx = 380
    let cy = 260
    if (states.length > 0) {
      cx = states.reduce((acc, s) => acc + s.x + 48, 0) / states.length
      cy = states.reduce((acc, s) => acc + s.y + 48, 0) / states.length
    }

    const stateMap = new Map(states.map((s) => [s.id, s]))

    return transitions.map((t) => {
      const fromS = stateMap.get(t.fromState)
      const toS = stateMap.get(t.toState)

      if (!fromS || !toS) {
        return {
          id: t.id,
          source: t.fromState,
          target: t.toState,
          type: 'transitionEdge',
          data: {
            condition: t.condition,
            mealyOutputs: t.mealyOutputs,
            onEdit: (id: string) => setEditTransitionId(id),
          },
        }
      }

      const hasMutual = transitions.some(
        (other) =>
          other.id !== t.id &&
          ((other.fromState === t.toState && other.toState === t.fromState) ||
            (other.fromState === t.fromState && other.toState === t.toState))
      )

      const routing = getOptimalEdgeRouting(fromS, toS, hasMutual, cx, cy)

      return {
        id: t.id,
        source: t.fromState,
        target: t.toState,
        sourceHandle: routing.sourceHandle,
        targetHandle: routing.targetHandle,
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
          curveOffset: routing.curveOffset,
          isSelfLoop: routing.isSelfLoop,
          loopDirection: routing.loopDirection,
          onEdit: (id: string) => setEditTransitionId(id),
        },
      }
    })
  }, [transitions, states])

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
        connectionMode={ConnectionMode.Loose}
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

      {/* Edit State Modal */}
      {editStateId && (
        <EditStateModal
          stateId={editStateId}
          onClose={() => setEditStateId(null)}
        />
      )}

      {/* Edit Transition Modal */}
      {editTransitionId && (
        <EditTransitionModal
          transitionId={editTransitionId}
          onClose={() => setEditTransitionId(null)}
        />
      )}
    </div>
  )
}
