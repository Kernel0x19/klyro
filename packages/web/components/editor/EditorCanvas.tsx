'use client'

import { useMemo } from 'react'
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
      width: 1100,
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
    position: { x: 58 + (index - 1) * 208, y: 80 },
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

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const nodeTypes = useMemo(() => NODE_TYPES, [])

  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])

  const isDark = theme === 'dark'

  return (
    <ReactFlow
      nodes={nodes}
      nodesDraggable={false}
      fitView={true}
      nodesConnectable={true}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      minZoom={0.1}
      maxZoom={4}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      snapToGrid
      snapGrid={[20, 20]}
      colorMode={isDark ? 'dark' : 'light'}
      fitViewOptions={{
        padding: 0.1,
        includeHiddenNodes: false,
        duration: 0,
      }}
      proOptions={{ hideAttribution: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.2}
        color={isDark ? 'rgba(100,116,139,0.8)' : 'rgba(100,116,139,1)'}
        style={{ backgroundColor: isDark ? '#000000' : '#ffffff' }}
      />

      <Controls
        position="bottom-right"
        showInteractive={false}
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          background: isDark ? '#1a1d27' : '#f5f6fa',
          border: `1px solid ${isDark ? '#2e3148' : '#d9dce6'}`,
          borderRadius: 8,
          padding: 4,
          boxShadow: 'none',
          marginBottom: '1rem',
          marginRight: '1rem',
        }}
      />

      <Panel position="bottom-center">
        <span
          style={{
            fontSize: 11,
            color: isDark ? 'rgba(139,143,168,0.5)' : 'rgba(90,95,115,0.5)',
            userSelect: 'none',
            marginBottom: '0.5rem',
            display: 'block',
          }}
        >
          Scroll to pan · Ctrl+scroll to zoom · Drag to select
        </span>
      </Panel>
    </ReactFlow>
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
