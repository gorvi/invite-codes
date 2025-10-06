import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import CopyrightProtection from '@/components/CopyrightProtection'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'Sora 2 Invite Codes - Free Access to AI Video Generation | 2024',
    template: '%s | Sora 2 Invite Codes'
  },
  description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI. Join thousands of creators using Sora 2 for amazing video content. Updated for 2024.',
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
    'OpenAI invite',
    'Sora 2 2024',
    'AI video creation',
    'Sora 2 tutorial',
    'Sora 2 guide',
    'Sora 2 tips',
    'Sora 2 troubleshooting',
    'Sora 2 community',
    'Sora 2 working codes',
    'Sora 2 success rate',
    'Sora 2 best practices'
  ],
  authors: [{ name: 'Sora 2 Community', url: 'https://www.invitecodes.net' }],
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
    languages: {
      'en-US': '/en-US',
    },
  },
  openGraph: {
    title: 'Sora 2 Invite Codes - Free AI Video Generation Access | 2024',
    description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology. Updated for 2024.',
    url: 'https://www.invitecodes.net',
    siteName: 'Sora 2 Invite Codes',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Sora 2 Invite Codes - Free AI Video Generation Access',
        type: 'image/png',
      },
    ],
    locale: 'en_US',
    type: 'website',
    countryName: 'United States',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sora 2 Invite Codes - Free AI Video Generation Access | 2024',
    description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology.',
    images: ['/og-image.png'],
    creator: '@sora2codes',
    site: '@sora2codes',
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
    yandex: 'your-yandex-verification-code',
    yahoo: 'your-yahoo-verification-code',
  },
  category: 'Technology',
  classification: 'AI Video Generation',
  referrer: 'origin-when-cross-origin',
  colorScheme: 'light',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#1e40af' },
    { media: '(prefers-color-scheme: dark)', color: '#1e40af' },
  ],
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 5,
  },
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Sora 2 Invite Codes',
    'application-name': 'Sora 2 Invite Codes',
    'msapplication-TileColor': '#1e40af',
    'msapplication-config': '/browserconfig.xml',
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
        {/* PWA and App Icons */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" title="Sora 2 Invite Codes Favicon" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" title="Sora 2 Invite Codes App Icon" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" title="Sora 2 Invite Codes 32x32 Icon" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" title="Sora 2 Invite Codes 16x16 Icon" />
        <link rel="mask-icon" href="/safari-pinned-tab.svg" color="#1e40af" title="Sora 2 Invite Codes Safari Icon" />
        
        {/* SEO and Performance */}
        <meta name="theme-color" content="#1e40af" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Sora 2 Invite Codes" />
        
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* DNS Prefetch for better performance */}
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        
        {/* Structured Data for AI SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Sora 2 Invite Codes",
              "description": "Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology from OpenAI.",
              "url": "https://www.invitecodes.net",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://www.invitecodes.net/search?q={search_term_string}",
                "query-input": "required name=search_term_string"
              },
              "publisher": {
                "@type": "Organization",
                "name": "Sora 2 Community",
                "url": "https://www.invitecodes.net"
              }
            })
          }}
        />
        
        {/* Additional AI-friendly structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "How do I get Sora 2 invite codes?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can get free Sora 2 invite codes from our community platform. We provide verified, working codes that are shared by community members."
                  }
                },
                {
                  "@type": "Question", 
                  "name": "Are Sora 2 invite codes free?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "Yes, all invite codes on our platform are completely free. We're a community-driven platform dedicated to helping people access Sora 2."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How often are new Sora 2 codes added?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "New codes are added in real-time as community members share them. We recommend checking our platform regularly for the latest working codes."
                  }
                }
              ]
            })
          }}
        />
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


