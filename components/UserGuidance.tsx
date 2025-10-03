'use client'

import { useState, useEffect } from 'react'
import { Info, X, Copy, ThumbsUp, AlertCircle } from 'lucide-react'

interface UserGuidanceProps {
  onDismiss?: () => void
}

export default function UserGuidance({ onDismiss }: UserGuidanceProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [showCopyTip, setShowCopyTip] = useState(false)

  useEffect(() => {
    // 检查用户是否已经看过引导
    const hasSeenGuidance = localStorage.getItem('hasSeenUserGuidance')
    if (!hasSeenGuidance) {
      setIsVisible(true)
    }

    // 监听复制检测，显示提示
    const handleCopyDetected = () => {
      setShowCopyTip(true)
      setTimeout(() => setShowCopyTip(false), 5000)
    }

    window.addEventListener('copyDetected', handleCopyDetected)
    return () => window.removeEventListener('copyDetected', handleCopyDetected)
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    localStorage.setItem('hasSeenUserGuidance', 'true')
    onDismiss?.()
  }

  if (!isVisible && !showCopyTip) return null

  return (
    <>
      {/* 主要引导提示 */}
      {isVisible && (
        <div className="fixed top-4 right-4 z-50 max-w-sm bg-blue-50 border border-blue-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">
                📊 Help Us Track Code Usage
              </h4>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Click <span className="font-medium">Copy Code</span> when you copy a code</p>
                <p>• Click <span className="font-medium">Worked</span> if the code worked for you</p>
                <p>• Click <span className="font-medium">Didn't Work</span> if it didn't work</p>
              </div>
              <p className="text-xs text-blue-600 mt-2">
                This helps us provide better codes to the community! 🎯
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="text-blue-400 hover:text-blue-600 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* 复制检测提示 */}
      {showCopyTip && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 animate-pulse">
          <div className="flex items-center space-x-2">
            <Copy className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-700 font-medium">
              Code copied! Please click "Worked" or "Didn't Work" after testing.
            </span>
          </div>
        </div>
      )}
    </>
  )
}

// 辅助函数：触发复制检测提示
export const triggerCopyDetected = () => {
  window.dispatchEvent(new CustomEvent('copyDetected'))
}
