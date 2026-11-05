import { redirect } from 'next/navigation'
import { cookies, headers } from 'next/headers'
import VerifyPage from '@/components/auth/VerifyPage'
import type { VerificationType } from '@/components/auth/VerifyCard'

interface PageProps {
  searchParams: Promise<{
    type?: string
    email?: string
  }>
}

function resolveVerificationType(
  rawType?: string
): VerificationType | null {
  if (!rawType) return null

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

    case 'recovery':
    case 'reset_password':
    case 'password_reset':
    case 'reset-password':
      return 'recovery'

    case 'verified':
    case 'confirmed':
    case 'success':
    case 'email_verified':
      return 'verified'

    default:
      return null
  }
}

export default async function VerifyRoute({ searchParams }: PageProps) {
  const { type: rawType, email } = await searchParams

  // 1. Validate the verification type parameter
  const verificationType = resolveVerificationType(rawType)
  if (!verificationType) {
    redirect('/')
  }

  // 2. Check access authorization:
  // Must be accessed via signup / system redirect, NOT entered directly in the URL bar
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
    hasVerifyCookie || (isInternalReferral && secFetchSite !== 'none')

  if (!isAllowed) {
    redirect('/')
  }

  return (
    <main>
      <VerifyPage type={verificationType} email={email} />
    </main>
  )
}

