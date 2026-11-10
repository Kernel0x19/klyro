import { create } from 'zustand'
import { temporal } from 'zundo'
import type { Edge } from '@xyflow/react'

interface EditorEdgesState {
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
  hoveredEdgeId: string | null
  setHoveredEdgeId: (id: string | null) => void
}

export const useEditorEdgesStore = create<EditorEdgesState>()(
  temporal(
    (set) => ({
      edges: [],
      setEdges: (edges) => set({ edges }),
      hoveredEdgeId: null,
      setHoveredEdgeId: (hoveredEdgeId) => set({ hoveredEdgeId }),
    }),
    {
      // Only track edges in undo history, not hover state
      partialize: (state) => ({ edges: state.edges }),
    }
  )
)
