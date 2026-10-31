// app/editor/[projectId]/page.tsx
import Sidebar from '@/components/editor/Sidebar'
import Topbar from '@/components/editor/Topbar'
import ProjectSync from '@/components/editor/ProjectSync'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface Props {
  params: Promise<{ projectId: string }>
}

export default async function EditorPage({ params }: Props) {
  const { projectId } = await params
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const avatarUrl = user?.user_metadata?.avatar_url ?? null
  const name = user?.user_metadata?.full_name ?? user?.email ?? 'U'

  let projectName = 'Untitled Project'
  if (user) {
    const { data: circuit } = await supabase
      .from('circuits')
      .select('name')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()
    if (circuit) projectName = circuit.name
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <ProjectSync projectId={projectId} isLoggedIn={!!user} /> 
      <Topbar
        avatarUrl={avatarUrl}
        name={name}
        projectName={projectName}
        projectId={projectId}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden" />
      </div>
    </div>
  )
}
