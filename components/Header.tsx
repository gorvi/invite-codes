'use client'

import Link from 'next/link'
import { Gift } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4">
        <Link href="/" className="flex items-center justify-center space-x-2">
          <Gift className="h-8 w-8 text-primary-600" />
          <span className="text-xl font-bold text-gray-900">Sora Invite Codes</span>
        </Link>
      </div>
    </header>
  )
}

