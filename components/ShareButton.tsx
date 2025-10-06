'use client'

import { useState } from 'react'
import { Share2, Copy, Check, X, Facebook, Linkedin, MessageCircle, MessageSquare, Video } from 'lucide-react'

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

  // 通用复制函数，支持任意文本，兼容移动端
  const copyToClipboard = async (text: string) => {
    try {
      // 优先使用现代 Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text)
        return true
      }
      
      // 备选方案：创建临时 textarea 元素（兼容移动端）
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.left = '-999999px'
      textArea.style.top = '-999999px'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      
      try {
        const successful = document.execCommand('copy')
        return successful
      } finally {
        document.body.removeChild(textArea)
      }
    } catch (err) {
      console.error('Failed to copy text:', err)
      return false
    }
  }

  const handleCopyUrl = async () => {
    const success = await copyToClipboard(url)
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } else {
      alert(`Please copy this URL manually:\n${url}`)
    }
  }

  const shareLinks = {
    x: `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`, // Twitter 已改名为 X
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
    wechat: `https://web.wechat.com/`, // WeChat doesn't have direct share URL
    tiktok: `https://www.tiktok.com/` // TikTok doesn't have direct share URL
  }

  const handleSocialShare = async (platform: keyof typeof shareLinks) => {
    if (platform === 'wechat') {
      // For WeChat, copy the URL
      const success = await copyToClipboard(url)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        alert(`Please copy this URL manually:\n${url}`)
      }
      return
    }
    
    if (platform === 'tiktok') {
      // For TikTok, copy the title and URL
      const shareText = `${title}\n${url}`
      const success = await copyToClipboard(shareText)
      if (success) {
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } else {
        alert(`Please copy this text manually:\n${shareText}`)
      }
      return
    }
    
    const shareUrl = shareLinks[platform]
    window.open(shareUrl, '_blank', 'width=600,height=400')
  }

  return (
    <>
      {/* Fixed Share Button - Repositioned to avoid conflict */}
      <div className="fixed bottom-6 right-6 z-50 lg:top-6 lg:bottom-auto">
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
          <div className="fixed bottom-20 right-6 w-72 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 animate-in slide-in-from-bottom-2 duration-200 lg:top-20 lg:bottom-auto lg:animate-in lg:slide-in-from-top-2">
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
                   onClick={() => handleSocialShare('x')}
                   className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-gray-50 rounded-xl transition-colors border border-gray-100 hover:border-gray-200"
                 >
                   <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                     <X className="h-4 w-4 text-gray-800" />
                   </div>
                   <div>
                     <span className="text-sm font-medium text-gray-700">X (Twitter)</span>
                     <p className="text-xs text-gray-500">Share on X</p>
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

                <button
                  onClick={() => handleSocialShare('wechat')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-green-50 rounded-xl transition-colors border border-gray-100 hover:border-green-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">WeChat</span>
                    <p className="text-xs text-gray-500">Copy link for WeChat</p>
                  </div>
                </button>

                <button
                  onClick={() => handleSocialShare('tiktok')}
                  className="w-full flex items-center space-x-3 px-4 py-3 text-left hover:bg-pink-50 rounded-xl transition-colors border border-gray-100 hover:border-pink-200"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Video className="h-4 w-4 text-pink-600" />
                  </div>
                  <div>
                    <span className="text-sm font-medium text-gray-700">TikTok</span>
                    <p className="text-xs text-gray-500">Copy text for TikTok</p>
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
