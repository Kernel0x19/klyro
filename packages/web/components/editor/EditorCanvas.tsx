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

const NODE_TYPES = {
  hardwareOutputPanel: OutputSectionNode,
  icBaseNode: ICBaseNode,
  inputClockPanel: InputClockSectionNode,
}

const CANVAS_X_ALIGN = 50

const initialNodes: Node[] = [
  {
    id: 'main-output-panel',
    type: 'hardwareOutputPanel',
    position: { x: CANVAS_X_ALIGN, y: 20 },
    draggable: false,
    deletable: false,
    data: { pinStates: {}, displayValues: ['0', '0'], isPowerOn: true },
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
  ...[1, 2, 3, 4, 5].map((index) => ({
    id: `ic-chip-${index}`,
    type: 'icBaseNode',
    position: { x: 110 + (index - 1) * 250, y: 100 },
    parentId: 'ic-workspace-panel',
    extent: 'parent' as const,
    data: { label: `IC BASE ${index}` },
  })),
  {
    id: 'main-input-clock-panel',
    type: 'inputClockPanel',
    position: { x: CANVAS_X_ALIGN, y: 590 },
    draggable: false,
    deletable: false,
    data: {
      inputStates: {},
      clockStates: {},
    },
  },
]

function Canvas() {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)

  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const nodeTypes = useMemo(() => NODE_TYPES, [])
  const [edges, , onEdgesChange] = useEdgesState<Edge>([])

  useEffect(() => {
    setMounted(true)
  }, [])

  // Until mounted, always use light — must match whatever the server renders
  const themeClass =
    mounted && theme === 'dark' ? 'canvas-dark' : 'canvas-light'

  return (
    <div style={{ width: '100%', height: '100%' }} className={themeClass}>
      <ReactFlow
        nodes={nodes}
        nodesDraggable={false}
        nodesConnectable={true}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
    </div>
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
