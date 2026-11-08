'use client'
import { useEffect } from 'react'
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
  const setEditorEdges = useEditorEdgesStore((s) => s.setEdges)
  useEffect(() => {
    resetBoard()
    if (!isLoggedIn || !userId) return
    const load = async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
      const { data, error } = await loadBoardState(projectId, userId)
      if (error || !data) return
      const { icSlots, edges, inputStates, isPowerOn } =
        deserializeBoardState(data)
      loadBoardState2({ icSlots, inputStates, isPowerOn })
      setEditorEdges(edges)
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])
  useEffect(() => {
    if (!isLoggedIn) return
    try {
      const existing = JSON.parse(
        localStorage.getItem('klyro_recent_projects') ?? '[]'
      )
      const updated = [
        projectId,
        ...existing.filter((id: string) => id !== projectId),
      ].slice(0, 10)
      localStorage.setItem('klyro_recent_projects', JSON.stringify(updated))
    } catch {}
  }, [projectId, isLoggedIn])
  return null
}
