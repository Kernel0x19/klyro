'use client'
import { useEffect } from 'react'
import { useBoardStore } from '@/stores/useBoardStore'

interface Props {
  projectId: string
  isLoggedIn: boolean
}

export default function ProjectSync({ projectId, isLoggedIn }: Props) {
  const resetBoard = useBoardStore((s) => s.resetBoard)

  useEffect(() => {
    console.log('Project changed, resetting board:', projectId)
    resetBoard()
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
