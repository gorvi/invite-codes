'use client'

import Link from 'next/link'
import Image from 'next/image'
import ShareButton from './ShareButton'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3" data-protected>
            <Image 
              src="/logo_web.png" 
              alt="Sora 2 Invite Codes" 
              width={120} 
              height={40}
              className="h-10 w-auto"
              priority
              draggable={false}
            />
            <span className="text-xl font-bold text-gray-900">Sora 2 Invite Codes</span>
          </Link>
          
          <ShareButton />
        </div>
      </div>
    </header>
  )
}

