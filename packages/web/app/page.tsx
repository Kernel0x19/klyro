import { redirect } from 'next/navigation'
import Navbar from '@/components/home/Navbar'
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import QuickStartGuides from '@/components/home/QuickStartGuides'
import ICLibraryPreview from '@/components/home/ICLibraryPreview'
import Footer from '@/components/home/Footer'
import getGitHubStars from '@/components/hooks/githubStarCount'

interface HomePageProps {
  searchParams?: Promise<{ code?: string }>
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams

  // Intercept email verification or auth redirect codes landing on home page
  if (params?.code) {
    redirect(`/auth/callback?code=${encodeURIComponent(params.code)}`)
  }

  const starCount = await getGitHubStars()

  return (
    <main>
      <Navbar starCount={starCount} />
      <HeroSection />
      <FeaturesSection />
      <QuickStartGuides />
      <ICLibraryPreview />
      <Footer />
    </main>
  )
}
