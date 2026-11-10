import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import VerifyPage from '@/components/auth/VerifyPage'
import type { VerificationType } from '@/components/auth/VerifyCard'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface PageProps {
  searchParams: Promise<{
    type?: string
    email?: string
    message?: string
    code?: string
  }>
}

function resolveVerificationType(
  rawType?: string,
  message?: string
): VerificationType | null {
  // If message explicitly specifies other email pending, it's ALWAYS email_change_pending
  if (message) {
    const lower = message.toLowerCase()
    if (lower.includes('other email') || lower.includes('confirm link sent to')) {
      return 'email_change_pending'
    }
  }

  if (!rawType) {
    if (message) {
      const lower = message.toLowerCase()
      if (
        lower.includes('email') &&
        (lower.includes('confirm') ||
          lower.includes('accepted') ||
          lower.includes('updated') ||
          lower.includes('changed'))
      ) {
        return 'email_change_completed'
      }
      if (lower.includes('password')) return 'password_updated'
      if (lower.includes('delete') || lower.includes('deleted')) return 'account_deleted'
      return 'status'
    }
    return null
  }

  const normalized = rawType.toLowerCase().trim()

  switch (normalized) {
    case 'signup':
    case 'confirm_signup':
    case 'signup_confirmation':
    case 'confirm-signup':
      return 'signup'

    case 'magiclink':
    case 'magic-link':
    case 'otp':
    case 'signin':
    case 'one_time_signin':
      return 'magiclink'

    case 'email_change':
    case 'change_email':
    case 'email-change':
      return 'email_change'

    case 'email_change_pending':
    case 'email-change-pending':
    case 'change_email_pending':
    case 'pending_email_change':
      return 'email_change_pending'

    case 'email_change_completed':
    case 'email-change-completed':
    case 'change_email_completed':
    case 'completed_email_change':
      return 'email_change_completed'

    case 'recovery':
    case 'reset_password':
    case 'password_reset':
    case 'reset-password':
      return 'recovery'

    case 'password_updated':
    case 'password-updated':
    case 'password_changed':
    case 'password-changed':
      return 'password_updated'

    case 'verified':
    case 'confirmed':
    case 'success':
    case 'email_verified':
      return 'verified'

    case 'account_deleted':
    case 'account-deleted':
    case 'delete_account':
    case 'delete-account':
      return 'account_deleted'

    case 'status':
    case 'notice':
    case 'alert':
      return 'status'

    default:
      return 'status'
  }
}

export default async function VerifyRoute({ searchParams }: PageProps) {
  const { type: rawType, email, message, code } = await searchParams

  // If a PKCE / confirmation code is present, exchange it for session
  if (code) {
    try {
      const supabase = await createServerSupabaseClient()
      await supabase.auth.exchangeCodeForSession(code)
    } catch (err) {
      console.error('Error exchanging code in verify route:', err)
    }
  }

  // 1. Validate the verification type parameter
  const verificationType = resolveVerificationType(rawType, message)
  if (!verificationType) {
    redirect('/')
  }

  // 2. Check access authorization:
  // Status templates, notices, email confirmations, or authorized referral
  const isStatusType =
    verificationType === 'email_change_pending' ||
    verificationType === 'email_change_completed' ||
    verificationType === 'password_updated' ||
    verificationType === 'account_deleted' ||
    verificationType === 'status' ||
    Boolean(message)

  const cookieStore = await cookies()
  const headerStore = await headers()

  const hasVerifyCookie =
    cookieStore.get('klyro_verify_access')?.value === 'true'
  const referer = headerStore.get('referer') || ''
  const secFetchSite = headerStore.get('sec-fetch-site')

  // Direct address bar navigation sends no referer and sec-fetch-site is 'none'
  const isInternalReferral =
    referer.includes('/auth/') || referer.includes('/account')
  const isAllowed =
    isStatusType ||
    hasVerifyCookie ||
    (isInternalReferral && secFetchSite !== 'none')

  if (!isAllowed) {
    redirect('/')
  }

  return (
    <main>
      <VerifyPage type={verificationType} email={email} message={message} />
    </main>
  )
}
