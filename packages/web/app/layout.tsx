import type { Metadata, Viewport } from 'next'
import { Space_Grotesk, Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/hooks/useTheme'
import { Suspense } from 'react'
import { NavigationProgress } from '@/components/ui/NavigationProgress'
import ScrollToTop from '@/components/ScrollToTop'
import MobileDeviceNotice from '@/components/mobile/MobileDeviceNotice'

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-inter',
  display: 'swap',
})

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://klyro.dev'

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f111a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Klyro — Modern Digital Logic Simulator & Virtual Lab Bench',
    template: '%s | Klyro',
  },
  description:
    'The open-source lab bench for digital logic — right in your browser, no hardware required. Simulate logic gates, 7400-series ICs, clock signals, truth tables, and complex microarchitectures with real-time waveform inspection.',
  applicationName: 'Klyro',
  authors: [{ name: 'Klyro Team', url: siteUrl }],
  creator: 'Klyro',
  publisher: 'Klyro',
  keywords: [
    'digital logic simulator',
    'logic gates',
    'circuit simulator',
    'boolean algebra',
    '7400 series IC',
    'breadboard simulation',
    'electronics CAD',
    'computer engineering',
    'schematic editor',
    'FPGA prototyping',
    'digital circuits',
    'microarchitecture',
    'interactive electronics lab',
  ],
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: ['/favicon.svg'],
    apple: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName: 'Klyro',
    title: 'Klyro — Modern Digital Logic Simulator & Virtual Lab Bench',
    description:
      'The open-source lab bench for digital logic — right in your browser, no hardware required. Simulate logic gates, integrated circuits, and computer architectures in real-time.',
    images: [
      {
        url: '/klyro-logo-new.png',
        width: 1200,
        height: 630,
        alt: 'Klyro — Digital Logic Simulator',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Klyro — Modern Digital Logic Simulator & Virtual Lab Bench',
    description:
      'Interactive digital logic simulation right in your browser. Design, wire, test, and debug digital circuits without physical hardware.',
    images: ['/klyro-logo-new.png'],
    creator: '@klyro_dev',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'education',
}

const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('klyro-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {}
  })();
`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${spaceGrotesk.variable} ${inter.variable}`}>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <ThemeProvider>
          <ScrollToTop />
          <MobileDeviceNotice>{children}</MobileDeviceNotice>
        </ThemeProvider>
      </body>
    </html>
  )
}
