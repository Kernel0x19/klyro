import { create } from 'zustand'
import type { Edge } from '@xyflow/react'

interface EditorEdgesState {
  edges: Edge[]
  setEdges: (edges: Edge[]) => void
}

export const useEditorEdgesStore = create<EditorEdgesState>((set) => ({
  edges: [],
  setEdges: (edges) => set({ edges }),
}))
