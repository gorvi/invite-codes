'use client'

import Link from 'next/link'
import Image from 'next/image'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <Link 
          href="/" 
          title="Sora 2 Invite Codes - Free AI Video Generation Access"
          className="flex items-center space-x-3" 
          data-protected
        >
          <Image 
            src="/logo-web.png" 
            alt="Sora 2 Invite Codes - Modern blue and silver iC logo for AI video generation platform"
            title="Sora 2 Invite Codes Logo - Access Free AI Video Generation"
            width={120} 
            height={40}
            className="h-10 w-auto"
            priority
            draggable={false}
          />
          <span className="text-xl font-bold text-gray-900">Sora 2 Invite Codes</span>
        </Link>
      </div>
    </header>
  )
}

