import Navbar from '@/components/home/Navbar'
import HeroSection from '@/components/home/HeroSection'
import FeaturesSection from '@/components/home/FeaturesSection'
import QuickStartGuides from '@/components/home/QuickStartGuides'
import ICLibraryPreview from '@/components/home/ICLibraryPreview'
import Footer from '@/components/home/Footer'

async function getGitHubStars(): Promise<number> {
  try {
    const res = await fetch('https://api.github.com/repos/Kernel0x19/klyro', {
      next: { revalidate: 3600 },
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      },
    })
    if (!res.ok) return 0
    const data = await res.json()
    return data.stargazers_count ?? 0
  } catch {
    return 0
  }
}

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
