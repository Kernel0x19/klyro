import Sidebar from '@/components/editor/Sidebar'
import Topbar from '@/components/editor/Topbar'
import ProjectSync from '@/components/editor/ProjectSync'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import EditorCanvas from '@/components/editor/EditorCanvas'
import GuestRedirect from '@/components/editor/GuestRedirect'
import PropertiesPanel from '@/components/editor/PropertiesPanel'
import BottomPanel from '@/components/editor/BottomPanel'
import KMapModule from '@/components/kmap/KMapModule'

interface Props {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ module?: string }>
}
export default async function EditorPage({ params, searchParams }: Props) {
  const { projectId } = await params
  const { module: activeModule } = await searchParams
  const isKMap = activeModule === 'k-map-visualiser'

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
    <div className="h-screen flex flex-col overflow-hidden bg-bg text-text-primary">
      <ProjectSync
        projectId={projectId}
        isLoggedIn={!!user}
        userId={user?.id}
      />
      {!user && <GuestRedirect currentProjectId={projectId} />}
      <Topbar
        avatarUrl={avatarUrl}
        name={name}
        projectName={projectName}
        projectId={projectId}
        userId={user?.id}
      />
      {isKMap ? (
        <KMapModule projectId={projectId} {...(user?.id ? { userId: user.id } : {})} />
      ) : (
        <div className="flex flex-1 overflow-hidden gap-1">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden border-l-2 border-t-2 border-r-2 border-border-theme">
            <main className="flex-1 overflow-hidden">
              <EditorCanvas />
            </main>
            <BottomPanel />
          </div>
          <PropertiesPanel />
        </div>
      )}
    </div>
  )
}
