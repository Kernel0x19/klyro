import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Create Account',
  description:
    'Join Klyro to design, simulate, and export digital logic circuits right in your browser with zero setup. Access cloud project saves and real-time interactive simulation.',
  alternates: {
    canonical: '/auth/signup',
  },
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Create Account | Klyro',
    description:
      'Join Klyro to design, simulate, and export digital logic circuits right in your browser with zero setup.',
    url: '/auth/signup',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Create Account | Klyro',
    description:
      'Join Klyro to design, simulate, and export digital logic circuits right in your browser with zero setup.',
  },
}

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

