'use client'
import { useEffect } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'
import { useKMapStore } from '@/stores/useKMapStore'
import { useFSMStore } from '@/stores/useFSMStore'
import { loadBoardState } from '@/lib/circuitService'
import { deserializeBoardState } from '@/lib/boardStateSerializer'
import { computeCircuitSnapshot } from '@/lib/circuitSnapshot'

interface Props {
  projectId: string
  isLoggedIn: boolean
  userId?: string | undefined
}

export default function ProjectSync({ projectId, isLoggedIn, userId }: Props) {
  const resetBoard = useBoardStore((s) => s.resetBoard)
  const loadBoardState2 = useBoardStore((s) => s.loadBoardState)
  const setDirty = useBoardStore((s) => s.setDirty)
  const setLastSavedSnapshot = useBoardStore((s) => s.setLastSavedSnapshot)
  const setEditorEdges = useEditorEdgesStore((s) => s.setEdges)

  // ── Load saved state on project change ──────────────────────────────────
  useEffect(() => {
    setLastSavedSnapshot(null)
    setDirty(false)
    resetBoard()
    useKMapStore.getState().reset()
    useFSMStore.getState().reset()

    if (!isLoggedIn || !userId) {
      const emptySnap = computeCircuitSnapshot(useBoardStore.getState().icSlots, [])
      setLastSavedSnapshot(emptySnap)
      setDirty(false)
      return
    }

    const load = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const { data, error } = await loadBoardState(projectId, userId)
      if (error || !data) {
        const emptySnap = computeCircuitSnapshot(useBoardStore.getState().icSlots, [])
        setLastSavedSnapshot(emptySnap)
        setDirty(false)
        return
      }
      const { icSlots: loadedSlots, edges: loadedEdges, inputStates, isPowerOn } =
        deserializeBoardState(data)
      loadBoardState2({ icSlots: loadedSlots, inputStates, isPowerOn })
      setEditorEdges(loadedEdges)
      // Reset temporal undo/redo history after load
      useEditorEdgesStore.temporal.getState().clear()
      const loadedSnap = computeCircuitSnapshot(loadedSlots, loadedEdges)
      setLastSavedSnapshot(loadedSnap)
      setDirty(false)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // ── Track recent projects in localStorage ───────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return
    try {
      const existing = JSON.parse(localStorage.getItem('klyro_recent_projects') ?? '[]')
      const updated = [projectId, ...existing.filter((id: string) => id !== projectId)].slice(0, 10)
      localStorage.setItem('klyro_recent_projects', JSON.stringify(updated))
    } catch {}
  }, [projectId, isLoggedIn])

  return null
}
