import { createServerSupabaseClient } from '@/lib/supabase/server'
import Topbar from '@/components/account/Topbar'
import ChangePasswordForm from './ChangePasswordForm'

export default async function ChangePasswordPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <>
      <Topbar />
      <main className="relative w-full min-h-[calc(100vh-7rem)] px-6 py-10 flex items-center justify-center select-none">
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `
              linear-gradient(var(--grid-line) 1px, transparent 1px),
              linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
            maskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
        <ChangePasswordForm userEmail={user?.email} />
      </main>
    </>
  )
}
