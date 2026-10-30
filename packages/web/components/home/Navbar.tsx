import NavbarClient from './NavbarClient'

interface NavbarProps {
  starCount?: number
  isAuth?: boolean
  authType?: string
}

export default function Navbar({
  starCount = 0,
  isAuth = false,
  authType = 'sign-up',
}: NavbarProps) {
  return (
    <NavbarClient starCount={starCount} isAuth={isAuth} authType={authType} />
  )
}
