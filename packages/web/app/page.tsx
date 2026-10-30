import Navbar from '@/components/home/Navbar'
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import QuickStartGuides from '@/components/home/QuickStartGuides'
import ICLibraryPreview from '@/components/home/ICLibraryPreview'
import Footer from '@/components/home/Footer'
import getGitHubStars from '@/components/hooks/githubStarCount'

export default async function HomePage() {
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
