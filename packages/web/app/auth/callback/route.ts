import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next')

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const provider =
        data.user?.app_metadata?.provider ||
        data.session?.user?.app_metadata?.provider
      const isGitHub = provider === 'github'

      if (isGitHub) {
        // Direct redirect for GitHub OAuth - never show verify or verified cards
        return NextResponse.redirect(`${origin}${next || '/editor'}`)
      }

      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Grant verification access so /auth/verify allows entry for manual email verification
      cookieStore.set('klyro_verify_access', 'true', {
        maxAge: 300,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })

      // Redirect to verification success screen
      return NextResponse.redirect(`${origin}/auth/verify?type=verified`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
}
