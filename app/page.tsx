import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import getGitHubStars from "./githubStarCount";

export default async function HomePage() {
  const starCount = await getGitHubStars();

  return (
    <main>
      <Navbar starCount={starCount} />
      <HeroSection />
    </main>
  );
}
