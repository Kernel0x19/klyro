import { create } from 'zustand'
import type { Edge } from '@xyflow/react'
interface EditorEdgesState {
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
  hoveredEdgeId: string | null
  setHoveredEdgeId: (id: string | null) => void
}
export const useEditorEdgesStore = create<EditorEdgesState>((set) => ({
  edges: [],
  setEdges: (edges) => set({ edges }),
  hoveredEdgeId: null,
  setHoveredEdgeId: (hoveredEdgeId) => set({ hoveredEdgeId }),
}))
