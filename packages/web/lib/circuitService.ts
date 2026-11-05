import { createClient } from './supabase/client'
import type { SavedBoardState } from './boardStateSerializer'
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
