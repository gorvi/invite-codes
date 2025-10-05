'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, MessageCircle } from 'lucide-react'

interface ShareButtonProps {
  url?: string
  title?: string
  description?: string
}

export default function ShareButton({ 
  url = typeof window !== 'undefined' ? window.location.href : '',
  title = 'Sora 2 Invite Codes',
  description = 'Share and discover Sora 2 invite codes with the community'
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`
  }

  const handleSocialShare = (platform: keyof typeof shareLinks) => {
    const shareUrl = shareLinks[platform]
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        title="分享"
      >
        <Share2 className="h-4 w-4" />
        <span className="hidden sm:inline">分享</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Menu */}
          <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">分享到</h3>
              
              {/* Copy URL */}
              <button
                onClick={handleCopyUrl}
                className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm text-green-600">已复制!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-700">复制链接</span>
                  </>
                )}
              </button>

              {/* Social Media Links */}
              <div className="mt-3 space-y-1">
                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Twitter className="h-4 w-4 text-blue-400" />
                  <span className="text-sm text-gray-700">Twitter</span>
                </button>

                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Facebook className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-gray-700">Facebook</span>
                </button>

                <button
                  onClick={() => handleSocialShare('linkedin')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Linkedin className="h-4 w-4 text-blue-700" />
                  <span className="text-sm text-gray-700">LinkedIn</span>
                </button>

                <button
                  onClick={() => handleSocialShare('telegram')}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-left hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <MessageCircle className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Telegram</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
