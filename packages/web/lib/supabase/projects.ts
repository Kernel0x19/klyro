'use server'
import { createServerSupabaseClient } from './server'
import { redirect } from 'next/navigation'
async function generateUniqueProjectId(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>
): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  for (let attempt = 0; attempt < 10; attempt++) {
    const length = Math.floor(Math.random() * 5) + 8
    const id = Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('')
    const { data } = await supabase
      .from('circuits')
      .select('project_id')
      .eq('project_id', id)
      .single()
    if (!data) return id
  }
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
}
type ModuleType = 'board' | 'k-map-visualiser' | 'fsm' | 'pld' | 'hdl' | 'learn'
export async function openOrCreateProject(formData: FormData) {
  const moduleParam = (formData.get('module') as ModuleType) ?? 'board'
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    const tempId = await generateUniqueProjectId(supabase)
    redirect(`/editor/${tempId}?module=${moduleParam}`)
  }
  const { data: existing } = await supabase
    .from('circuits')
    .select('project_id')
    .eq('user_id', user.id)
    .eq('name', 'Untitled Project')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()
  if (existing?.project_id) {
    redirect(`/editor/${existing.project_id}?module=${moduleParam}`)
  }
  const projectId = await generateUniqueProjectId(supabase)
  await supabase.from('circuits').insert({
    user_id: user.id,
    name: 'Untitled Project',
    module: moduleParam, 
    project_id: projectId,
    last_edited: new Date().toISOString(),
  })
  redirect(`/editor/${projectId}?module=${moduleParam}`)
}
export async function deleteProject(projectId: string) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthorized' }
  const { error } = await supabase
    .from('circuits')
    .delete()
    .eq('project_id', projectId)
    .eq('user_id', user.id)
  if (error) return { error: error.message }
  return { success: true }
}
