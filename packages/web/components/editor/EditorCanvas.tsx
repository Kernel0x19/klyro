'use client'

import { useCallback } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  Panel,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from '@/components/hooks/useTheme'

function Canvas() {
  const { theme } = useTheme()
  const [nodes, , onNodesChange] = useNodesState([])
  const [edges, , onEdgesChange] = useEdgesState([])

  const isDark = theme === 'dark'

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      minZoom={0.1}
      maxZoom={4}
      defaultViewport={{ x: 0, y: 0, zoom: 1 }}
      snapToGrid
      snapGrid={[20, 20]}
      colorMode={isDark ? 'dark' : 'light'}
      fitView={false}
      proOptions={{ hideAttribution: false }}
      style={{ width: '100%', height: '100%' }}
    >
      <Background
        variant={BackgroundVariant.Dots}
        gap={20}
        size={1.5}
        color={isDark ? 'rgba(100,116,139,0.9)' : 'rgba(100,116,139,0.7)'}
        style={{ backgroundColor: isDark ? '#000000' : '#f8f9fa' }}
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

      <MiniMap
        position="bottom-left"
        nodeColor="#4F6EF7"
        maskColor={isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.6)'}
        style={{
          background: isDark ? '#1a1d27' : '#f5f6fa',
          border: `1px solid ${isDark ? '#2e3148' : '#d9dce6'}`,
          borderRadius: 8,
          marginBottom: '1rem',
          marginLeft: '1rem',
        }}
        zoomable
        pannable
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
