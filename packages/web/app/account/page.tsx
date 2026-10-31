import { createServerSupabaseClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Topbar from '@/components/account/Topbar'
import MainSection from '@/components/account/MainSection'

export default async function AccountPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: circuits } = await supabase
    .from('circuits')
    .select('*')
    .eq('user_id', user.id)
    .order('last_edited', { ascending: false })

  return (
    <>
      <Topbar />
      <MainSection user={user} profile={profile} circuits={circuits ?? []} />
    </>
  )
}
