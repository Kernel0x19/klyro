import NavbarClient from './NavbarClient'

interface NavbarProps {
  starCount: number
}

export default function Navbar({ starCount }: NavbarProps) {
  return <NavbarClient starCount={starCount} />
}
