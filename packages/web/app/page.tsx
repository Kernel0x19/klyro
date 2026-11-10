import { redirect } from 'next/navigation'
import Navbar from '@/components/home/Navbar'
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import QuickStartGuides from '@/components/home/QuickStartGuides'
import ICLibraryPreview from '@/components/home/ICLibraryPreview'
import Footer from '@/components/home/Footer'
import getGitHubStars from '@/components/hooks/githubStarCount'
import AuthHashHandler from '@/components/auth/AuthHashHandler'

interface HomePageProps {
  searchParams?: Promise<{
    code?: string
    message?: string
    error_description?: string
    deleted?: string
  }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  // 1. Intercept email verification or auth redirect codes landing on home page
  if (params?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }

  // 2. Intercept account action messages landing on home page (e.g. Supabase email change confirmation)
  if (params?.message) {
    const msg = params.message
    const lower = msg.toLowerCase()
    let targetType = 'status'
    if (lower.includes('other email') || lower.includes('confirm link sent to')) {
      targetType = 'email_change_pending'
    } else if (
      lower.includes('email') &&
      (lower.includes('confirm') ||
        lower.includes('accepted') ||
        lower.includes('updated') ||
        lower.includes('changed'))
    ) {
      targetType = 'email_change_completed'
    } else if (lower.includes('password')) {
      targetType = 'password_updated'
    } else if (lower.includes('delete') || lower.includes('deleted')) {
      targetType = 'account_deleted'
    }
    redirect(`/auth/verify?type=${targetType}&message=${encodeURIComponent(msg)}`)
  }

  if (params?.error_description) {
    redirect(
      `/auth/verify?type=status&message=${encodeURIComponent(params.error_description)}`
    )
  }

  if (params?.deleted === 'true') {
    redirect('/auth/verify?type=account_deleted')
  }

  const starCount = await getGitHubStars()

  return (
    <main>
      <AuthHashHandler />
      <Navbar starCount={starCount} />
      <HeroSection />
      <FeaturesSection />
      <QuickStartGuides />
      <ICLibraryPreview />
      <Footer />
    </main>
  )
}
