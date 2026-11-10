'use server'

import { createServerSupabaseClient } from './server'
import { createAdminClient } from './admin'
import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'

async function getBaseUrl(): Promise<string> {
  try {
    const headerList = await headers()
    const host = headerList.get('host')
    const proto = headerList.get('x-forwarded-proto') || 'http'
    if (host) {
      return `${proto}://${host}`
    }
  } catch {}

  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    'http://localhost:3000'
  )
}

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
  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const fullName = (formData.get('fullName') as string)?.trim()

  if (!email || !password) {
    return { error: 'Email and password are required.' }
  }

  // 1. Proactively check if user already exists via Admin API
  const admin = createAdminClient()
  if (admin) {
    try {
      const { data: userList } = await admin.auth.admin.listUsers()
      const existingUser = userList?.users?.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase()
      )
      if (existingUser) {
        return {
          error:
            'An account with this email address already exists. Please log in instead.',
        }
      }
    } catch (err) {
      console.error('Error verifying existing user:', err)
    }
  }

  const siteUrl = await getBaseUrl()
  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  // 2. Check Supabase identities: if user already exists, Supabase returns empty identities array
  if (data?.user && (!data.user.identities || data.user.identities.length === 0)) {
    return {
      error:
        'An account with this email address already exists. Please log in instead.',
    }
  }

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
  const siteUrl = await getBaseUrl()

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${siteUrl}/auth/callback`,
    },
  })

  if (error) return { error: error.message }

  await grantVerificationAccess()
  redirect(`/auth/verify?type=magiclink&email=${encodeURIComponent(email)}`)
}

export async function requestPasswordReset(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createServerSupabaseClient()
  const siteUrl = await getBaseUrl()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/callback?next=/account/reset-password`,
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
  const siteUrl = await getBaseUrl()
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${siteUrl}/auth/callback?next=/editor`,
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
