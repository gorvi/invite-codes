'use client'

import { useEffect } from 'react'

interface StructuredDataProps {
  type: 'Website' | 'Organization' | 'WebPage' | 'BreadcrumbList'
  data: any
}

export default function StructuredData({ type, data }: StructuredDataProps) {
  useEffect(() => {
    const script = document.createElement('script')
    script.type = 'application/ld+json'
    script.text = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': type === 'Website' ? 'WebSite' : type,
      ...data
    })
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [type, data])

  return null
}

// Website structured data
export function WebsiteStructuredData() {
  const websiteData = {
    name: 'Sora 2 Invite Codes',
    description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology.',
    url: 'https://www.invitecodes.net',
    potentialAction: {
      '@type': 'SearchAction',
      target: 'https://www.invitecodes.net/?q={search_term_string}',
      'query-input': 'required name=search_term_string'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Sora 2 Community',
      url: 'https://www.invitecodes.net'
    }
  }

  return <StructuredData type="Website" data={websiteData} />
}

// Organization structured data
export function OrganizationStructuredData() {
  const organizationData = {
    name: 'Sora 2 Invite Code Community',
    description: 'A community dedicated to sharing Sora 2 invite codes and helping creators access AI video generation technology.',
    url: 'https://www.invitecodes.net',
    logo: {
      '@type': 'ImageObject',
      url: 'https://www.invitecodes.net/logo-web.png',
      width: 120,
      height: 40,
      alt: 'Sora 2 Invite Codes - Modern blue and silver iC logo for AI video generation platform'
    },
    sameAs: [
      'https://twitter.com/sora2codes'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      availableLanguage: 'English'
    }
  }

  return <StructuredData type="Organization" data={organizationData} />
}

// WebPage structured data
export function WebPageStructuredData() {
  const webPageData = {
    name: 'Sora 2 Invite Codes - Free AI Video Generation Access',
    description: 'Get free Sora 2 invite codes and share yours with the community. Access the latest AI video generation technology.',
    url: 'https://www.invitecodes.net',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Sora 2 Invite Codes',
      url: 'https://www.invitecodes.net'
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://www.invitecodes.net'
        }
      ]
    }
  }

  return <StructuredData type="WebPage" data={webPageData} />
}
