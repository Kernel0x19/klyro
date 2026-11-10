'use client'
import { useEffect, useRef } from 'react'
import { useKMapStore } from '@/stores/useKMapStore'
import { saveKMapState, loadKMapState } from '@/lib/circuitService'
import type { SavedKMapState } from '@/lib/kmap/types'

interface Props {
  projectId: string
  userId: string
}

const AUTOSAVE_DELAY = 3000 // 3s debounce — faster than board (30s) since kmap is lighter

export default function KMapPersistenceSync({ projectId, userId }: Props) {
  const toSnapshot = useKMapStore((s) => s.toSnapshot)
  const loadSnapshot = useKMapStore((s) => s.loadSnapshot)
  const cellValues = useKMapStore((s) => s.cellValues)
  const variables = useKMapStore((s) => s.variables)
  const variableNames = useKMapStore((s) => s.variableNames)

  const isLoaded = useRef(false)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const initialSnap = useRef<string>('')

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    isLoaded.current = false
    const load = async () => {
      const { data } = await loadKMapState(projectId, userId)
      if (data) {
        loadSnapshot(data as SavedKMapState)
        initialSnap.current = JSON.stringify(data)
      }
      isLoaded.current = true
    }
    load()
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, userId])

  // ── Auto-save with debounce on any state change ────────────────────────────
  useEffect(() => {
    if (!isLoaded.current) return
    const snap = toSnapshot()
    const snapStr = JSON.stringify(snap)
    if (snapStr === initialSnap.current) return // no real change

    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(async () => {
      await saveKMapState(projectId, userId, snap)
      initialSnap.current = snapStr
    }, AUTOSAVE_DELAY)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cellValues, variables, variableNames])

  return null
}

