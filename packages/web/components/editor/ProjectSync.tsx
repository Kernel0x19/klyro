'use client'
import { useEffect, useRef } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'
import { useEditorEdgesStore } from '@/stores/useEditorEdgesStore'
import { loadBoardState } from '@/lib/circuitService'
import { deserializeBoardState } from '@/lib/boardStateSerializer'

interface Props {
  projectId: string
  isLoggedIn: boolean
  userId?: string | undefined
}

export default function ProjectSync({ projectId, isLoggedIn, userId }: Props) {
  const resetBoard = useBoardStore((s) => s.resetBoard)
  const loadBoardState2 = useBoardStore((s) => s.loadBoardState)
  const setDirty = useBoardStore((s) => s.setDirty)
  const icSlots = useBoardStore((s) => s.icSlots)
  const setEditorEdges = useEditorEdgesStore((s) => s.setEdges)
  const edges = useEditorEdgesStore((s) => s.edges)

  // Track initial load to avoid marking dirty on first hydration
  const isLoaded = useRef(false)
  const initialEdgeCount = useRef(-1)
  const initialSlotSnapshot = useRef('')

  // ── Load saved state on project change ──────────────────────────────────
  useEffect(() => {
    isLoaded.current = false
    initialEdgeCount.current = -1
    initialSlotSnapshot.current = ''
    resetBoard()

    if (!isLoggedIn || !userId) {
      isLoaded.current = true
      return
    }

    const load = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const { data, error } = await loadBoardState(projectId, userId)
      if (error || !data) {
        isLoaded.current = true
        return
      }
      const { icSlots, edges, inputStates, isPowerOn } = deserializeBoardState(data)
      loadBoardState2({ icSlots, inputStates, isPowerOn })
      setEditorEdges(edges)
      // Reset temporal undo/redo history after load
      useEditorEdgesStore.temporal.getState().clear()
      initialEdgeCount.current = edges.length
      initialSlotSnapshot.current = JSON.stringify(icSlots.map((s) => s.icDefinition?.partNumber ?? null))
      isLoaded.current = true
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  // ── Mark dirty when edges change after initial load ──────────────────────
  useEffect(() => {
    if (!isLoaded.current) return
    if (initialEdgeCount.current === -1) return // haven't loaded yet
    setDirty(true)
  }, [edges, setDirty])

  // ── Mark dirty when IC slots change after initial load ───────────────────
  useEffect(() => {
    if (!isLoaded.current) return
    if (!initialSlotSnapshot.current) return
    const snap = JSON.stringify(icSlots.map((s) => s.icDefinition?.partNumber ?? null))
    if (snap !== initialSlotSnapshot.current) {
      setDirty(true)
    }
  }, [icSlots, setDirty])

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
