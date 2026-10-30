import Navbar from '../home/Navbar'
import SignupForm from './SignupForm'
import getGitHubStars from '../hooks/githubStarCount'

export default async function SignupPage() {
  const starCount = await getGitHubStars()
  return (
    <>
      <Navbar isAuth={true} authType="signup" starCount={starCount} />
      <section className="w-full min-h-[calc(100vh-6rem)] px-6 py-10 flex items-center justify-center select-none bg-white dark:bg-transparent">
        <SignupForm />
      </section>
    </>
  )
}
