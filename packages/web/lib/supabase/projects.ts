'use server'

import { createServerSupabaseClient } from './server'
import { redirect } from 'next/navigation'

function generateProjectId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const length = Math.floor(Math.random() * 5) + 8
  return Array.from(
    { length },
    () => chars[Math.floor(Math.random() * chars.length)]
  ).join('')
}

type Module = 'board' | 'k-map-visualiser' | 'fsm' | 'pld' | 'hdl' | 'learn'

export async function openOrCreateProject(formData: FormData) {
  const module = (formData.get('module') as Module) ?? 'board'
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    const tempId = generateProjectId()
    redirect(`/editor/${tempId}?module=${module}`)
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
    redirect(`/editor/${existing.project_id}?module=${module}`)
  }

  const projectId = generateProjectId()

  await supabase.from('circuits').insert({
    user_id: user.id,
    name: 'Untitled Project',
    module,
    project_id: projectId,
    last_edited: new Date().toISOString(),
  })

  redirect(`/editor/${projectId}?module=${module}`)
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
