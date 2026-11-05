import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sign In',
  description:
    'Sign in to your Klyro account to access your saved digital logic circuits, custom IC modules, and cloud simulation lab bench.',
  alternates: {
    canonical: '/auth/login',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Sign In | Klyro',
    description:
      'Sign in to access your saved circuits, custom IC modules, and digital logic workspaces.',
    url: '/auth/login',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Sign In | Klyro',
    description:
      'Sign in to access your saved circuits, custom IC modules, and digital logic workspaces.',
  },
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

