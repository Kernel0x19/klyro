'use server'

import { createServerSupabaseClient } from './server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'

/**
 * Grants temporary access to the /auth/verify page for legitimate system redirects.
 */
export async function grantVerificationAccess() {
  const cookieStore = await cookies()
  cookieStore.set('klyro_verify_access', 'true', {
    maxAge: 300, // 5 minutes
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  })
}

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const fullName = formData.get('fullName') as string

  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) return { error: error.message }

  await grantVerificationAccess()
  redirect(`/auth/verify?type=signup&email=${encodeURIComponent(email)}`)
}

export async function signIn(formData: FormData) {
  const supabase = await createServerSupabaseClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })

  if (error) return { error: error.message }

  redirect('/editor')
}

export async function sendMagicLink(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://klyro.dev'}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  await grantVerificationAccess()
  redirect(`/auth/verify?type=magiclink&email=${encodeURIComponent(email)}`)
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://klyro.dev'}/auth/callback?next=/account/reset-password`,
  })

  if (error) return { error: error.message }

  await grantVerificationAccess()
  redirect(`/auth/verify?type=recovery&email=${encodeURIComponent(email)}`)
}

export async function requestEmailChange(newEmail: string) {
  const supabase = await createServerSupabaseClient()

  const { error } = await supabase.auth.updateUser({
    email: newEmail,
  })

  if (error) return { error: error.message }

  await grantVerificationAccess()
  redirect(`/auth/verify?type=email_change&email=${encodeURIComponent(newEmail)}`)
}

export async function signInWithGitHub() {
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })

  if (error) return { error: error.message }
  if (data.url) redirect(data.url)

  return { error: 'Failed to start GitHub login' }
}

export async function signOut() {
  const supabase = await createServerSupabaseClient()
  await supabase.auth.signOut()
  redirect('/')
}
