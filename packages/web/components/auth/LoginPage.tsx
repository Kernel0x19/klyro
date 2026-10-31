import Navbar from '../home/Navbar'
import LoginForm from './LoginForm'
import getGitHubStars from '../hooks/githubStarCount'

export default async function LoginPage() {
  const starCount = await getGitHubStars()
  return (
    <>
      <Navbar isAuth={true} authType="login" starCount={starCount} />
      <section className="relative w-full min-h-[calc(100vh-6rem)] px-6 py-16 flex items-center justify-center select-none">
        <div
          className="absolute inset-0 pointer-events-none -z-10"
          style={{
            backgroundImage: `
                    linear-gradient(var(--grid-line) 1px, transparent 1px),
                    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)
                  `,
            backgroundSize: '40px 40px',
            maskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse at center, black 40%, transparent 80%)',
          }}
        />
        <LoginForm />
      </section>
    </>
  )
}
