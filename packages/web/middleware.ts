import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const lastSignIn = new Date(user.last_sign_in_at ?? 0).getTime()
    const now = Date.now()
    const isExpired = now - lastSignIn > SESSION_DURATION_MS

    if (isExpired) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }
  }

  if (user) {
    const lastActive = parseInt(
      request.cookies.get('klyro_last_active')?.value ?? '0'
    )
    const now = Date.now()

    if (lastActive && now - lastActive > SESSION_DURATION_MS) {
      await supabase.auth.signOut()
      supabaseResponse.cookies.delete('klyro_last_active')
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    supabaseResponse.cookies.set('klyro_last_active', String(now), {
      maxAge: SESSION_DURATION_MS / 1000,
      httpOnly: true,
      sameSite: 'lax',
    })
  }

  if (!user && request.nextUrl.pathname.startsWith('/editor')) {
    // Allow access — unauthenticated users can still use the editor
    // just don't save their work
  }

  if (!user && request.nextUrl.pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/account/:path*', '/editor/:path*'],
}
