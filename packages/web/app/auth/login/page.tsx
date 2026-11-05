import LoginPage from '@/components/auth/LoginPage'

interface LoginPageProps {
  searchParams?: Promise<{
    verified?: string
    error?: string
  }>
}

export default async function Login({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const isVerified = params?.verified === 'true'
  const urlError = params?.error

  return (
    <main>
      <LoginPage verified={isVerified} urlError={urlError} />
    </main>
  )
}
