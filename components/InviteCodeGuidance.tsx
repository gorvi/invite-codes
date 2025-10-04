'use client'

import { useState, useEffect } from 'react'
import { Gift, X, ArrowRight, Users } from 'lucide-react'

export default function InviteCodeGuidance() {
  const [isVisible, setIsVisible] = useState(false)
  const [hasSeenGuidance, setHasSeenGuidance] = useState(false)

  useEffect(() => {
    // Check if user has seen the guidance before
    const seen = localStorage.getItem('sora2-guidance-seen')
    if (!seen) {
      // Show guidance after a short delay
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 2000)
      return () => clearTimeout(timer)
    } else {
      setHasSeenGuidance(true)
    }
  }, [])

  const handleClose = () => {
    setIsVisible(false)
    localStorage.setItem('sora2-guidance-seen', 'true')
  }

  const handleSubmitCodes = () => {
    // Trigger the submit modal
    const event = new CustomEvent('openSubmitModal')
    window.dispatchEvent(event)
    handleClose()
  }

  if (hasSeenGuidance || !isVisible) {
    return null
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 transform transition-all duration-500 ease-out">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Got Sora 2 Codes?</h3>
              <p className="text-sm text-gray-600">Help others join!</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-purple-800 font-medium mb-1">
                  When you register with Sora 2, you get <strong>4 invite codes</strong>!
                </p>
                <p className="text-xs text-purple-600">
                  Share them here to help 4 more people access AI video creation 🎬
                </p>
              </div>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Maybe later
            </button>
            <button
              onClick={handleSubmitCodes}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-1"
            >
              <span>Submit Codes</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  )
}
