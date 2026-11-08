'use client'
import { useMemo, useEffect, useState, useRef, useCallback } from 'react'
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
  addEdge,
  type Connection,
  type IsValidConnection,
  ConnectionMode,
  useNodes,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from '@/components/hooks/useTheme'
import OutputSectionNode from './canvas/OutputSectionNode'
import ICBaseNode from './canvas/ICBaseNode'
import InputClockSectionNode from './canvas/InputClockSectionNode'
import { useBoardStore } from '@/stores/useBoardStore'
import { IC_LIBRARY } from '@/lib/icLibrary'
import SignalEdge from './canvas/SignalEdge'
import CanvasToast from './canvas/CanvasToast'
import { useToastStore } from '@/stores/useToastStore'
import { validatePinConnection } from '@/lib/pinValidator'
import { RoutingContext, type BoundingBox } from '@/lib/routingContext'
import { simulateBoard, type PinSignals } from '@/lib/simulationEngine'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'
const NODE_TYPES = {
  hardwareOutputPanel: OutputSectionNode,
  icBaseNode: ICBaseNode,
  inputClockPanel: InputClockSectionNode,
}
const EDGE_TYPES = {
  signal: SignalEdge,
}
const isValidConnection: IsValidConnection = (connection) => {
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
  const activeTool = useBoardStore((s) => s.activeTool)
  const setActiveTool = useBoardStore((s) => s.setActiveTool)
  const isPowerOn = useBoardStore((s) => s.isPowerOn)
  const inputStates = useBoardStore((s) => s.inputStates)
  const clockStates = useBoardStore((s) => s.clockStates)
  const selectedFrequency = useBoardStore((s) => s.selectedFrequency)
  const icSlots = useBoardStore((s) => s.icSlots)
  const selectedSlotId = useBoardStore((s) => s.selectedSlotId)
  const togglePower = useBoardStore((s) => s.togglePower)
  const toggleInput = useBoardStore((s) => s.toggleInput)
  const toggleClock = useBoardStore((s) => s.toggleClock)
  const selectSlot = useBoardStore((s) => s.selectSlot)
  const assignIC = useBoardStore((s) => s.assignIC)
  const removeIC = useBoardStore((s) => s.removeIC)
  const clearSelection = useBoardStore((s) => s.clearSelection)
  const outputStates = useBoardStore((s) => s.outputStates)
  const setOutputStates = useBoardStore((s) => s.setOutputStates)
  const displayValues = useBoardStore((s) => s.displayValues)
  const chipStates = useBoardStore((s) => s.chipStates)
  const setChipStates = useBoardStore((s) => s.setChipStates)
  const recordWaveformSnapshot = useBoardStore((s) => s.recordWaveformSnapshot)
  const edges = useEditorEdgesStore((s) => s.edges)
  const setEdges = useEditorEdgesStore((s) => s.setEdges)
  const [, , onEdgesChange] = useEdgesState<Edge>([])
  const edgesRef = useRef(edges)
  const prevPinSignalsRef = useRef<PinSignals>({})
  useEffect(() => {
    edgesRef.current = edges
  }, [edges])
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null)
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      const part = e.dataTransfer.getData('ic-part')
      if (!part) return
      const allICs = IC_LIBRARY.flatMap((g) => g.ics)
      const ic = allICs.find((i) => i.part === part)
      if (!ic) return
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
          pinStates: outputStates,
          displayValues,
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
          isSelected: activeTool === 'select' && slot.isSelected,
          isDeleteMode: activeTool === 'delete',
          onAssignIC: (icDef: {
            partNumber: string
            name: string
            packageType: string
            family: string
            delay: number
            vcc: number
            gnd: number
          }) => assignIC(slot.slotId, icDef),
          onSelect: () => {
            if (activeTool === 'delete') {
              if (slot.icDefinition) {
                const part = slot.icDefinition.partNumber
                removeIC(slot.slotId)
                const chipNodeId = `ic-chip-${index + 1}`
                setEdges(
                  edgesRef.current.filter(
                    (e) => e.source !== chipNodeId && e.target !== chipNodeId
                  )
                )
                useToastStore
                  .getState()
                  .showToast(`Removed ${part} from Slot ${index + 1}`)
              }
              return
            }
            if (activeTool === 'select') {
              selectSlot(slot.slotId)
            }
          },
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
      activeTool,
      isPowerOn,
      inputStates,
      clockStates,
      selectedFrequency,
      icSlots,
      togglePower,
      toggleInput,
      toggleClock,
      selectSlot,
      assignIC,
      removeIC,
      setEdges,
      outputStates,
      displayValues,
    ]
  )
  const [nodes, setNodes, onNodesChange] = useNodesState(boardNodes)
  useEffect(() => {
    setNodes(boardNodes)
  }, [boardNodes, setNodes])
  const nodeTypes = useMemo(() => NODE_TYPES, [])
  const edgeTypes = useMemo(() => EDGE_TYPES, [])
  const lastWaveformKeyRef = useRef<string>('')
  useEffect(() => {
    const {
      updatedEdges,
      outputStates: newOutputStates,
      pinSignals: newPinSignals,
      updatedChipStates,
    } = simulateBoard(
      edgesRef.current,
      icSlots,
      inputStates,
      isPowerOn,
      clockStates,
      chipStates,
      prevPinSignalsRef.current
    )
    prevPinSignalsRef.current = newPinSignals
    const isStateChanged =
      JSON.stringify(chipStates) !== JSON.stringify(updatedChipStates)
    if (isStateChanged) {
      setChipStates(updatedChipStates)
    }
    const prev = edgesRef.current
    const isDifferent =
      prev.length !== updatedEdges.length ||
      prev.some(
        (e, i) => e.data?.signalState !== updatedEdges[i]?.data?.signalState
      )
    if (isDifferent) {
      setEdges(updatedEdges)
    }
    setOutputStates(newOutputStates)
    const activeSignals: string[] = []
    for (const e of edgesRef.current) {
      if (e.source === 'main-input-clock-panel') {
        if (e.sourceHandle?.startsWith('input-')) {
          activeSignals.push(`IN-${e.sourceHandle.replace('input-', '')}`)
        } else if (e.sourceHandle?.startsWith('clock-')) {
          activeSignals.push(`CLK-${e.sourceHandle.replace('clock-', '')}`)
        }
      }
      if (
        e.target === 'main-output-panel' &&
        e.targetHandle?.startsWith('pin-') &&
        e.targetHandle !== 'pin-VCC'
      ) {
        activeSignals.push(`OUT-${e.targetHandle.replace('pin-', '')}`)
      }
    }
    const sortedSignals = [...activeSignals].sort()
    const stateKey = JSON.stringify({
      inputStates,
      clockStates,
      newOutputStates,
      isPowerOn,
      activeSignals: sortedSignals,
    })
    if (sortedSignals.length > 0 || Object.keys(inputStates).length > 0) {
      if (lastWaveformKeyRef.current !== stateKey) {
        lastWaveformKeyRef.current = stateKey
        recordWaveformSnapshot(
          inputStates,
          clockStates,
          newOutputStates,
          activeSignals
        )
      }
    }
  }, [inputStates, clockStates, isPowerOn, icSlots])
  const obstacles = useMemo<BoundingBox[]>(() => {
    const posMap = new Map(liveNodes.map((n) => [n.id, n.position]))
    return liveNodes
      .filter((n) => n.type === 'group' || n.type === 'icBaseNode')
      .map((n) => {
        let x = n.position.x
        let y = n.position.y
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
      const activeEl = document.activeElement
      const isInputFocused =
        activeEl instanceof HTMLInputElement ||
        activeEl instanceof HTMLTextAreaElement ||
        activeEl?.getAttribute('contenteditable') === 'true'

      if (!isInputFocused && !e.ctrlKey && !e.metaKey && !e.altKey) {
        const key = e.key.toLowerCase()
        if (key === 'v') {
          setActiveTool('select')
          return
        }
        if (key === 'w') {
          setActiveTool('wire')
          return
        }
        if (key === 'h') {
          setActiveTool('pan')
          return
        }
        if (key === 'd') {
          setActiveTool('delete')
          return
        }
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedEdge) {
        setEdges(edges.filter((ed) => ed.id !== selectedEdge))
        setSelectedEdge(null)
        useToastStore.getState().showToast('Wire deleted')
      }
      if (e.key === 'Escape') {
        clearSelection()
        setSelectedEdge(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedEdge, edges, setEdges, clearSelection, setActiveTool])
  useEffect(() => {
    setMounted(true)
  }, [])
  const themeClass =
    mounted && theme === 'dark' ? 'canvas-dark' : 'canvas-light'
  const onConnect = useCallback(
    (connection: Connection) => {
      const result = validatePinConnection(connection, icSlots)
      if (!result.valid) {
        useToastStore.getState().showToast(result.message)
        return
      }
      const newEdge: Edge = {
        ...connection,
        id: `xy-edge__${connection.source}-${connection.sourceHandle}-${connection.target}-${connection.targetHandle}`,
        type: 'signal',
        animated: false,
        data: { signalState: 'unconnected' },
      }
      setEdges([...edges, newEdge])
    },
    [icSlots, edges, setEdges]
  )
  const onEdgeClick = useCallback(
    (_: React.MouseEvent, edge: Edge) => {
      if (activeTool === 'delete') {
        setEdges(edgesRef.current.filter((e) => e.id !== edge.id))
        setSelectedEdge(null)
        useToastStore.getState().showToast('Wire deleted')
        return
      }
      if (activeTool === 'select') {
        setSelectedEdge(edge.id)
      }
    },
    [activeTool, setEdges]
  )
  const toolCursorClass = useMemo(() => {
    switch (activeTool) {
      case 'pan':
        return 'cursor-grab active:cursor-grabbing'
      case 'wire':
        return 'cursor-crosshair'
      case 'delete':
        return 'cursor-pointer'
      case 'select':
      default:
        return 'cursor-default'
    }
  }, [activeTool])
  return (
    <RoutingContext.Provider value={obstacles}>
      <div
        style={{ width: '100%', height: '100%' }}
        className={`relative ${themeClass} ${toolCursorClass} tool-${activeTool}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        <style>{`
          .tool-pan .react-flow__pane {
            cursor: grab !important;
          }
          .tool-pan .react-flow__pane:active {
            cursor: grabbing !important;
          }
          .tool-wire .react-flow__pane {
            cursor: crosshair !important;
          }
          .tool-wire .react-flow__handle {
            cursor: crosshair !important;
            pointer-events: auto !important;
          }
          .tool-select .react-flow__handle,
          .tool-pan .react-flow__handle,
          .tool-delete .react-flow__handle {
            pointer-events: none !important;
          }
          .tool-delete .react-flow__pane {
            cursor: default !important;
          }
          .tool-select .react-flow__pane {
            cursor: default !important;
          }
        `}</style>
        <ReactFlow
          nodes={nodes}
          nodesDraggable={false}
          nodesConnectable={activeTool === 'wire'}
          panOnDrag={activeTool === 'pan'}
          panOnScroll={false}
          elementsSelectable={activeTool === 'select'}
          selectionOnDrag={false}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onPaneClick={() => {
            clearSelection()
            setSelectedEdge(null)
            useEditorEdgesStore.getState().setHoveredEdgeId(null)
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
              {activeTool === 'select' &&
                'Select Tool (V) · Click IC to select · Drag & drop IC to slot'}
              {activeTool === 'wire' &&
                'Wire Tool (W) · Drag between pin handles to connect wires'}
              {activeTool === 'pan' &&
                'Pan Tool (H) · Click and drag to move canvas · Scroll to zoom'}
              {activeTool === 'delete' &&
                'Delete Tool (D) · Click any wire or IC to delete'}
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
