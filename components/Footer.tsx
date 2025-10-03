import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8 mb-6">
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/how-it-works" className="text-gray-600 hover:text-primary-600 transition-colors">
                  How It Works
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-600 hover:text-primary-600 transition-colors">
                  FAQ
                </Link>
              </li>
            </ul>
          </div>
          
          {/* About */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">About</h3>
            <p className="text-sm text-gray-600">
              A community-driven platform for sharing Sora 2 invite codes and helping everyone access AI video generation.
            </p>
          </div>
          
          {/* Community */}
          <div>
            <h3 className="font-semibold text-gray-800 mb-3">Community</h3>
            <p className="text-sm text-gray-600">
              Share your codes, help others, and be part of the Sora 2 community.
            </p>
          </div>
        </div>
        
        <div className="border-t pt-6 text-center">
          <p className="text-gray-600 text-sm">
            Built with ❤️ for the Sora 2 community
          </p>
        </div>
      </div>
    </footer>
  )
}


