import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Verification',
  description:
    'Security verification and email confirmation for your Klyro account.',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
}

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

