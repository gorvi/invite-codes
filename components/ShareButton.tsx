'use client'

import { useState } from 'react'
import { Share2, Copy, Check, Twitter, Facebook, Linkedin, MessageCircle, X } from 'lucide-react'

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
    <>
      {/* Fixed Share Button */}
      <div className="fixed top-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="bg-white hover:bg-gray-50 text-gray-700 hover:text-gray-900 shadow-lg hover:shadow-xl border border-gray-200 rounded-full p-3 transition-all duration-200 transform hover:scale-105"
          title="Share"
        >
          {isOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Share2 className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Share Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40 bg-black bg-opacity-20 backdrop-blur-sm" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Share Panel */}
          <div className="fixed top-20 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-top-2 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <X className="h-4 w-4 text-gray-500" />
                </button>
              </div>
              
              {/* Copy URL */}
              <button
                onClick={handleCopyUrl}
                className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 hover:border-blue-200 mb-4"
              >
                {copied ? (
                  <>
                    <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <Check className="h-4 w-4 text-green-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-green-700">Copied!</span>
                      <p className="text-xs text-green-600">Link copied to clipboard</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      <Copy className="h-4 w-4 text-gray-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-gray-700">Copy Link</span>
                      <p className="text-xs text-gray-500">Copy URL to clipboard</p>
                    </div>
                  </>
                )}
              </button>

              {/* Social Media Links */}
              <div className="space-y-2">
                <button
                  onClick={() => handleSocialShare('twitter')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Twitter className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Twitter</span>
                    <p className="text-xs text-gray-500">Share on Twitter</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSocialShare('facebook')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Facebook className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Facebook</span>
                    <p className="text-xs text-gray-500">Share on Facebook</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSocialShare('linkedin')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Linkedin className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">LinkedIn</span>
                    <p className="text-xs text-gray-500">Share on LinkedIn</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSocialShare('telegram')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-blue-50 rounded-xl transition-colors border border-gray-100 hover:border-blue-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">Telegram</span>
                    <p className="text-xs text-gray-500">Share on Telegram</p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
}
