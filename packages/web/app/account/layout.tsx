import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Account & Circuits',
  description:
    'Manage your Klyro profile settings, browse your saved digital logic circuits, inspect project version history, and organize your cloud simulation workspaces.',
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
  openGraph: {
    title: 'Account & Circuits | Klyro',
    description:
      'Manage your digital logic circuits and cloud-synced simulation projects on Klyro.',
    url: '/account',
    type: 'website',
  },
  twitter: {
    card: 'summary',
    title: 'Account & Circuits | Klyro',
    description:
      'Manage your digital logic circuits and cloud-synced simulation projects on Klyro.',
  },
}

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}

