import NavbarClient from './NavbarClient'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface NavbarProps {
  starCount?: number
  isAuth?: boolean
  authType?: string
}

export default async function Navbar({
  starCount,
  isAuth,
  authType,
}: NavbarProps) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <NavbarClient
      starCount={starCount}
      isAuth={isAuth}
      authType={authType}
      isLoggedIn={!!user}
      avatarUrl={user?.user_metadata?.avatar_url ?? null}
      name={user?.user_metadata?.full_name ?? user?.email ?? ''}
    />
  )
}
