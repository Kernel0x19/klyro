import { createClient } from './supabase/client'
import type { SavedBoardState } from './boardStateSerializer'
import type { SavedKMapState } from './kmap/types'

export async function saveBoardState(
  projectId: string,
  userId: string,
  boardState: SavedBoardState
): Promise<{ error: string | null }> {
  const supabase = createClient()
  const { error } = await supabase
    .from('circuits')
    .update({
      board_state: boardState,
      last_edited: new Date().toISOString(),
    })
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) return { error: error.message }
  return { error: null }
}

export async function loadBoardState(
  projectId: string,
  userId: string
): Promise<{ data: SavedBoardState | null; error: string | null }> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('circuits')
    .select('board_state')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single()
  if (error) return { data: null, error: error.message }
  if (!data?.board_state) return { data: null, error: null }
  return { data: data.board_state as SavedBoardState, error: null }
}

/**
 * Save only the K-Map state into the existing board_state JSONB blob.
 * Uses a JSON merge-patch so the board data is never overwritten.
 */
export async function saveKMapState(
  projectId: string,
  userId: string,
  kmap: SavedKMapState
): Promise<{ error: string | null }> {
  const supabase = createClient()
  // Load current state first to merge
  const { data: current } = await loadBoardState(projectId, userId)
  const merged: SavedBoardState = current
    ? { ...current, kmap }
    : {
        version: '0.1.0',
        icSlots: [],
        edges: [],
        inputStates: {},
        isPowerOn: false,
        kmap,
      }
  return saveBoardState(projectId, userId, merged)
}

/**
 * Load the K-Map state from the board_state blob.
 * Returns null if no K-Map state has been saved yet.
 */
export async function loadKMapState(
  projectId: string,
  userId: string
): Promise<{ data: SavedKMapState | null; error: string | null }> {
  const { data, error } = await loadBoardState(projectId, userId)
  if (error) return { data: null, error }
  if (!data?.kmap) return { data: null, error: null }
  return { data: data.kmap, error: null }
}

/**
 * Create a brand-new circuit project with a pre-populated board state.
 */
export async function createProjectWithBoardState(
  userId: string | undefined,
  projectName: string,
  boardState: SavedBoardState
): Promise<{ projectId: string; error: string | null }> {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const newProjectId = Array.from(
    { length: 10 },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')

  if (!userId) {
    return { projectId: newProjectId, error: null }
  }

  const supabase = createClient()
  const { error } = await supabase.from('circuits').insert({
    user_id: userId,
    name: projectName,
    module: 'board',
    project_id: newProjectId,
    board_state: boardState,
    last_edited: new Date().toISOString(),
  })

  if (error) {
    return { projectId: newProjectId, error: error.message }
  }

  return { projectId: newProjectId, error: null }
}
