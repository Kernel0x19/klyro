import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next')

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

  // 1. Handle direct OTP token hash verification (works across all browsers and devices)
  if (token_hash && type) {
    const { error: otpError } = await supabase.auth.verifyOtp({
      token_hash,
      type,
    })

    if (!otpError) {
      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }
      if (type === 'signup') {
        cookieStore.set('klyro_verify_access', 'true', {
          maxAge: 300,
          httpOnly: true,
          sameSite: 'lax',
          path: '/',
        })
        return NextResponse.redirect(`${origin}/auth/verify?type=verified`)
      }
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/account/change-password`)
      }
      if (type === 'email_change') {
        return NextResponse.redirect(`${origin}/auth/verify?type=email_change_completed`)
      }
      return NextResponse.redirect(`${origin}/account`)
    }
    console.error('verifyOtp error in callback:', otpError)
  }

  // 2. Handle PKCE code exchange
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      const provider =
        data.user?.app_metadata?.provider ||
        data.session?.user?.app_metadata?.provider
      const isGitHub = provider === 'github'

      if (isGitHub) {
        // Direct redirect for GitHub OAuth
        return NextResponse.redirect(`${origin}${next || '/editor'}`)
      }

      if (next) {
        return NextResponse.redirect(`${origin}${next}`)
      }

      // Grant verification access so /auth/verify allows entry
      cookieStore.set('klyro_verify_access', 'true', {
        maxAge: 300,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })

      return NextResponse.redirect(`${origin}/auth/verify?type=verified`)
    }

    console.error('exchangeCodeForSession error in callback:', error.message)

    // Detect if this failed because the link was opened in a different browser/profile
    const isVerifierError =
      error.message?.toLowerCase().includes('verifier') ||
      error.message?.toLowerCase().includes('code_verifier')

    if (isVerifierError) {
      return NextResponse.redirect(
        `${origin}/auth/login?error=cross_browser_recovery`
      )
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
}
