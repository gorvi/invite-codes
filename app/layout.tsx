import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CopyrightProtection from '@/components/CopyrightProtection'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sora 2 Invite Codes - Free Access to AI Video Generation',
  description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI. Join thousands of creators using Sora 2 for amazing video content.',
  keywords: [
    'Sora 2',
    'Sora 2 invite code',
    'AI video generation',
    'OpenAI Sora',
    'video AI',
    'free invite codes',
    'Sora access',
    'AI video creator',
    'video generation tool',
    'OpenAI invite'
  ],
  authors: [{ name: 'Sora 2 Community' }],
  creator: 'Sora 2 Invite Code Community',
  publisher: 'Sora 2 Community',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.invitecodes.net'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Sora 2 Invite Codes - Free AI Video Generation Access',
    description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology.',
    url: 'https://www.invitecodes.net',
    siteName: 'Sora 2 Invite Codes',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Invite Codes - Free AI Video Generation Access',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Invite Codes - Free AI Video Generation Access',
    description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology.',
    images: ['/og-image.png'],
    creator: '@sora2codes',
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
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <CopyrightProtection />
      </body>
    </html>
  )
}


