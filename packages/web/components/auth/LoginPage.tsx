import Navbar from '../home/Navbar'
import LoginForm from './LoginForm'
import getGitHubStars from '../hooks/githubStarCount'

export default async function LoginPage() {
  const starCount = await getGitHubStars()
  return (
    <>
      <Navbar isAuth={true} authType="login" starCount={starCount}/>
      <section className="w-full min-h-[calc(100vh-6rem)] px-6 py-16 flex items-center justify-center select-none bg-white dark:bg-transparent">
        <LoginForm />
      </section>
    </>
  )
}