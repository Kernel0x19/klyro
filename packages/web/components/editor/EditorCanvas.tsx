'use client'

import { useMemo, useEffect, useState } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from '@/components/hooks/useTheme'
import OutputSectionNode from './canvas/OutputSectionNode'
import ICBaseNode from './canvas/ICBaseNode'
import InputClockSectionNode from './canvas/InputClockSectionNode'
import { useBoardStore } from '@/stores/useBoardStore'
import { IC_LIBRARY } from '@/lib/icLibrary'
import { useCallback } from 'react'
import { addEdge, type Connection } from '@xyflow/react'
import SignalEdge from './canvas/SignalEdge'
import CanvasToast from './canvas/CanvasToast'
import { useToastStore } from '@/stores/useToastStore'
import { validatePinConnection } from '@/lib/pinValidator'
import { type IsValidConnection, ConnectionMode, useNodes } from '@xyflow/react'
import { RoutingContext, type BoundingBox } from '@/lib/routingContext'

const NODE_TYPES = {
  hardwareOutputPanel: OutputSectionNode,
  icBaseNode: ICBaseNode,
  inputClockPanel: InputClockSectionNode,
}

const EDGE_TYPES = {
  signal: SignalEdge,
}

const isValidConnection: IsValidConnection = (connection) => {
  // Prevent connecting a pin to itself
  if (
    connection.source === connection.target &&
    connection.sourceHandle === connection.targetHandle
  ) {
    return false
  }
  return true
}

const CANVAS_X_ALIGN = 50

function Canvas() {
  const liveNodes = useNodes()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const {
    isPowerOn,
    inputStates,
    clockStates,
    selectedFrequency,
    icSlots,
    selectedSlotId,
    togglePower,
    toggleInput,
    toggleClock,
    selectSlot,
    assignIC,
    clearSelection,
  } = useBoardStore()

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const part = e.dataTransfer.getData('ic-part')
      if (!part) return

      const allICs = IC_LIBRARY.flatMap((g) => g.ics)
      const ic = allICs.find((i) => i.part === part)
      if (!ic) return

      // Use selected slot if one is selected
      // Otherwise assign to first empty slot
      const targetSlotId =
        selectedSlotId ?? icSlots.find((s) => !s.icDefinition)?.slotId

      if (!targetSlotId) return

      assignIC(targetSlotId, {
        partNumber: ic.part,
        name: ic.name,
        packageType: ic.packageType,
        family: ic.family,
        delay: ic.delay,
        vcc: ic.vcc,
        gnd: ic.gnd,
      })
    },
    [selectedSlotId, icSlots, assignIC]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const boardNodes: Node[] = useMemo(
    () => [
      {
        id: 'main-output-panel',
        type: 'hardwareOutputPanel',
        position: { x: CANVAS_X_ALIGN, y: 20 },
        draggable: false,
        deletable: false,
        data: {
          pinStates: {},
          displayValues: ['0', '0'],
          isPowerOn,
          onTogglePower: togglePower,
        },
      },
      {
        id: 'ic-workspace-panel',
        type: 'group',
        position: { x: CANVAS_X_ALIGN, y: 150 },
        style: {
          width: 1400,
          height: 420,
          backgroundColor: '#0ca5d7',
          borderRadius: '12px',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        },
        draggable: false,
        deletable: false,
        data: {},
      },
      ...icSlots.map((slot, index) => ({
        id: `ic-chip-${index + 1}`,
        type: 'icBaseNode',
        position: { x: 110 + index * 250, y: 100 },
        parentId: 'ic-workspace-panel',
        extent: 'parent' as const,
        data: {
          label: `IC BASE ${index + 1}`,
          icDefinition: slot.icDefinition,
          isSelected: slot.isSelected,
          onSelect: () => selectSlot(slot.slotId),
        },
      })),
      {
        id: 'main-input-clock-panel',
        type: 'inputClockPanel',
        position: { x: CANVAS_X_ALIGN, y: 590 },
        draggable: false,
        deletable: false,
        data: {
          inputStates,
          clockStates,
          selectedFrequency,
          onToggleInput: toggleInput,
          onToggleClock: toggleClock,
        },
      },
    ],
    [
      isPowerOn,
      inputStates,
      clockStates,
      selectedFrequency,
      icSlots,
      togglePower,
      toggleInput,
      toggleClock,
      selectSlot,
    ]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(boardNodes)
  useEffect(() => {
    setNodes(boardNodes)
  }, [isPowerOn, inputStates, clockStates, icSlots, selectedFrequency])

  const nodeTypes = useMemo(() => NODE_TYPES, [])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge.id)
  }, [])

  const obstacles = useMemo<BoundingBox[]>(() => {
    // Build a map of node positions for parent resolution
    const posMap = new Map(liveNodes.map((n) => [n.id, n.position]))

    return liveNodes
      .filter((n) => n.type === 'group' || n.type === 'icBaseNode')
      .map((n) => {
        let x = n.position.x
        let y = n.position.y

        // Resolve parent offset for child nodes
        if (n.parentId) {
          const parentPos = posMap.get(n.parentId)
          if (parentPos) {
            x += parentPos.x
            y += parentPos.y
          }
        }

        return {
          x,
          y,
          width: (n.measured?.width ?? (n.style?.width as number)) || 150,
          height: (n.measured?.height ?? (n.style?.height as number)) || 200,
        }
      })
  }, [liveNodes])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        setEdges((eds) => eds.filter((ed) => ed.id !== selectedEdge))
        setSelectedEdge(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEdge, setEdges])

  const onPaneClick = useCallback(() => {
    setSelectedEdge(null)
  }, [])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSelection()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [clearSelection])

  const themeClass =
    mounted && theme === 'dark' ? 'canvas-dark' : 'canvas-light'

  const onConnect = useCallback(
    (connection: Connection) => {
      const result = validatePinConnection(connection, icSlots)
      if (!result.valid) {
        useToastStore.getState().showToast(result.message)
        return
      }

      setEdges((eds) =>
        addEdge(
          {
            ...connection,
            type: 'signal',
            animated: false,
            style: { stroke: '#6b7280', strokeWidth: 2 },
            data: { signalState: 'unconnected' },
          },
          eds
        )
      )
    },
    [icSlots, setEdges]
  )

  const edgeTypes = useMemo(() => EDGE_TYPES, [])

  return (
    <RoutingContext.Provider value={obstacles}>
      <div
        style={{ width: '100%', height: '100%' }}
        className={`relative ${themeClass}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <ReactFlow
          nodes={nodes}
          nodesDraggable={false}
          nodesConnectable={true}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={() => {
            clearSelection()
            onPaneClick()
          }}
          minZoom={0.1}
          maxZoom={4}
          defaultViewport={{ x: 50, y: 20, zoom: 0.8 }}
          snapToGrid
          snapGrid={[20, 20]}
          fitView={true}
          fitViewOptions={{
            padding: 0.05,
            minZoom: 0.85,
            maxZoom: 0.85,
            duration: 0,
          }}
          onConnect={onConnect}
          edgeTypes={edgeTypes}
          isValidConnection={isValidConnection}
          onEdgeClick={onEdgeClick}
          connectionMode={ConnectionMode.Loose}
          deleteKeyCode="Backspace"
          proOptions={{ hideAttribution: false }}
          style={{ width: '100%', height: '100%' }}
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1.2} />

          <Controls
            position="bottom-right"
            showInteractive={false}
            className="canvas-controls"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              borderRadius: 8,
              padding: 4,
              boxShadow: 'none',
              marginBottom: '1rem',
              marginRight: '1rem',
            }}
          />

          <Panel position="bottom-center">
            <span className="canvas-hint">
              Scroll to pan · Ctrl+scroll to zoom · Drag to select
            </span>
          </Panel>
        </ReactFlow>

        <CanvasToast />
      </div>
    </RoutingContext.Provider>
  )
}

export default function EditorCanvas() {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100%' }}>
        <Canvas />
      </div>
    </ReactFlowProvider>
  )
}
