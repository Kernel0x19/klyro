import NavbarClient from './NavbarClient'

interface NavbarProps {
  starCount?: number
  isAuth?: boolean
  authType?: string
}

export default async function Navbar({
  starCount,
  isAuth,
  authType,
}: NavbarProps) {
  return (
    <NavbarClient
      starCount={starCount}
      isAuth={isAuth}
      authType={authType}
    />
  )
}
