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
            <p className="text-sm text-gray-600 mb-3">
              Share your codes, help others, and be part of the Sora 2 community.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-700">
                <strong>💝 Got 4 codes to share?</strong><br/>
                After registering with Sora 2, you get 4 invite codes. Please share them here to help others!
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-6 text-center">
          <p className="text-gray-600 text-sm">
            Built with ❤️ for the Sora 2 community
          </p>
          <p className="text-gray-500 text-xs mt-2">
            © 2025 Sora 2 Invite Codes. All rights reserved. Unauthorized copying or reproduction is prohibited.
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Contact: <a href="mailto:wecesoft@gmail.com" className="text-primary-600 hover:text-primary-700 transition-colors">wecesoft@gmail.com</a>
          </p>
        </div>
      </div>
    </footer>
  )
}


