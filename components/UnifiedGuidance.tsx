'use client'

import { useState, useEffect } from 'react'
import { Info, X, Copy, Gift, Users } from 'lucide-react'

export default function UnifiedGuidance() {
  const [isVisible, setIsVisible] = useState(false)
  const [showCopyTip, setShowCopyTip] = useState(false)

  useEffect(() => {
    // 检查用户是否已经看过引导
    const hasSeenGuidance = localStorage.getItem('hasSeenUnifiedGuidance')
    if (!hasSeenGuidance) {
      // 延迟显示，避免页面加载时立即弹出
      const timer = setTimeout(() => {
        setIsVisible(true)
      }, 3000)
      return () => clearTimeout(timer)
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
    localStorage.setItem('hasSeenUnifiedGuidance', 'true')
  }

  const handleSubmitCodes = () => {
    // 触发提交模态框
    const event = new CustomEvent('openSubmitModal')
    window.dispatchEvent(event)
    handleDismiss()
  }

  // 复制检测提示
  if (showCopyTip) {
    return (
      <div className="fixed top-4 right-4 z-50 max-w-sm bg-green-50 border border-green-200 rounded-lg shadow-lg p-3 animate-pulse">
        <div className="flex items-center space-x-2">
          <Copy className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-700 font-medium">
            Code copied! Please click "Worked" or "Didn't Work" after testing.
          </span>
        </div>
      </div>
    )
  }

  // 主要引导提示
  if (!isVisible) return null

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm">
      <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 transform transition-all duration-500 ease-out">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
              <Gift className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-gray-800 text-lg">Welcome to Sora 2!</h3>
              <p className="text-sm text-gray-600">Get started here</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* 分享邀请码部分 */}
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-start space-x-3">
              <Users className="h-5 w-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-purple-800 font-medium mb-1">
                  💡 Got 1 code to share? After registering with Sora 2, you get 1 invite code that can help 4 people join!
                </p>
                <p className="text-xs text-purple-600">
                  Share it here to help others access AI video creation 🎬
                </p>
              </div>
            </div>
          </div>

          {/* 使用指南部分 */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
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
            </div>
          </div>

          {/* 操作按钮 */}
          <div className="flex space-x-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Got it
            </button>
            <button
              onClick={handleSubmitCodes}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg text-sm font-medium hover:from-purple-700 hover:to-pink-700 transition-all flex items-center justify-center space-x-1"
            >
              <span>Submit Code</span>
              <Gift className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 装饰元素 */}
        <div className="absolute -top-2 -right-2 w-4 h-4 bg-yellow-400 rounded-full animate-pulse"></div>
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
      </div>
    </div>
  )
}

// 辅助函数：触发复制检测提示
export const triggerCopyDetected = () => {
  window.dispatchEvent(new CustomEvent('copyDetected'))
}
