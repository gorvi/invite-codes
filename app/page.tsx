'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Plus } from 'lucide-react'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import ActiveCodeStats from '@/components/ActiveCodeStats'
import CommunityImpact from '@/components/CommunityImpact'
import InviteCodeDisplay from '@/components/InviteCodeDisplay'
import SubmitCodeModal from '@/components/SubmitCodeModal'
import WhackHamsterGame from '@/components/WhackHamsterGame'
import ShareButton from '@/components/ShareButton'
import { useNotifications } from '@/components/NotificationToast'
import { InviteCode } from '@/lib/data'

// 游戏相关状态管理
export default function HomePage() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showFloatingButton, setShowFloatingButton] = useState(false)
  const { notifications, removeNotification, showNewCodeNotification } = useNotifications()
  const gameSectionRef = useRef<HTMLDivElement>(null)


  const handleManualRefresh = async () => {
    setLoading(true)
    try {
      const timestamp = Date.now()
      const response = await fetch(`/api/dashboard?t=${timestamp}&_bust=${Math.random()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'If-None-Match': '*',
          'If-Modified-Since': '0'
        }
      })
       
       if (!response.ok) {
         throw new Error(`HTTP ${response.status}: ${response.statusText}`)
       }
       
       const dashboardData = await response.json()
       const activeInviteCodes = dashboardData.activeInviteCodes || []
       setInviteCodes(activeInviteCodes)
       
       window.dispatchEvent(new CustomEvent('statsUpdate'))
     } catch (error) {
       console.error('Manual refresh error:', error)
     } finally {
       setLoading(false)
     }
   }


  // Handle voting
  const handleVote = async (id: string, type: 'worked' | 'didntWork') => {
    try {
      const response = await fetch(`/api/invite-codes/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ vote: type }),
      })
      
      if (response.ok) {
        // 不再立即刷新，让乐观更新和定时刷新处理
        console.log(`[Vote] Vote recorded successfully: ${type} for code ${id}`)
      } else {
        const errorText = await response.text()
        console.error('Failed to vote:', response.status, errorText)
        throw new Error(`Failed to vote: ${response.status} ${errorText}`)
      }
    } catch (error) {
      console.error('Error voting:', error)
      throw error
    }
  }

  // Handle copy code
  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'copy', 
          inviteCodeId: codeId 
        }),
      })
      
           if (response.ok) {
             // 不再立即刷新，让乐观更新和定时刷新处理
             console.log('Copy event recorded successfully')
           } else {
        console.error('Failed to record copy event:', response.status)
        throw new Error(`Failed to record copy event: ${response.status}`)
      }
      
    } catch (error) {
      console.error('Failed to copy code to clipboard:', error)
      throw error
    }
  }

  // 初始数据加载
  useEffect(() => {
    handleManualRefresh()
  }, [])

  // 定期刷新数据（每5分钟，减少资源消耗）
  useEffect(() => {
    const interval = setInterval(() => {
      handleManualRefresh()
    }, 300000) // 改为5分钟，减少API调用频率

    return () => clearInterval(interval)
  }, [])

  // 监听统计更新事件（移除自动刷新，减少API调用）
  useEffect(() => {
    const handleStatsUpdate = () => {
      // 不再自动刷新，让定时器处理
      console.log('Stats update event received')
    }

    window.addEventListener('statsUpdate', handleStatsUpdate)
    return () => window.removeEventListener('statsUpdate', handleStatsUpdate)
  }, [])

  // 移动端浮动按钮逻辑
  useEffect(() => {
    const handleScroll = () => {
      if (!gameSectionRef.current) return
      
      const gameSectionTop = gameSectionRef.current.offsetTop
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop
      
      // 当滚动超过游戏区域时显示浮动按钮
      setShowFloatingButton(scrollTop > gameSectionTop)
    }

    const handleResize = () => {
      // 在大屏幕上隐藏浮动按钮
      if (window.innerWidth >= 1024) {
        setShowFloatingButton(false)
      }
    }

    window.addEventListener('scroll', handleScroll)
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // SSE 连接用于实时更新
  useEffect(() => {
    const eventSource = new EventSource('/api/sse')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'new_code') {
          setInviteCodes(prev => [data.inviteCode, ...prev])
          showNewCodeNotification(data.inviteCode.code)
          window.dispatchEvent(new CustomEvent('statsUpdate'))
        } else if (data.type === 'initial') {
          // 只在初始加载时使用 SSE 数据，避免覆盖手动刷新的数据
          console.log('[SSE] Initial data received, but using manual refresh data instead')
        } else if (data.type === 'update') {
          // 忽略 SSE 的 update 事件，只使用手动刷新的数据
          console.log('[SSE] Update event received, but using manual refresh data instead')
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error)
    }

    return () => {
      eventSource.close()
    }
  }, [showNewCodeNotification])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 左侧内容区域 */}
          <div className="lg:col-span-2">
            {/* SEO优化的英雄区域 */}
            <section className="text-center mb-12">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-3xl p-8 md:p-12 text-white shadow-2xl">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Get Free Sora 2 Invite Codes
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto leading-relaxed">
              Access the latest AI video generation technology from OpenAI. Join thousands of creators using Sora 2 for amazing video content.
            </p>
            
            {/* 主要行动号召 */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-bold py-4 px-8 rounded-2xl text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-3 group relative overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-3">
                  <span className="group-hover:rotate-12 transition-transform duration-300">🎁</span>
                  Share Your Sora 2 Code
                  <span className="group-hover:rotate-12 transition-transform duration-300">✨</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
            
            {/* 特色徽章 */}
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">✅ Free Access</span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">🚀 Real-time Updates</span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">🤝 Community Driven</span>
              <span className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">🔒 Secure & Verified</span>
            </div>
          </div>
        </section>

        {/* 活跃邀请码统计 */}
        <section className="mb-8">
          <ActiveCodeStats />
        </section>

        {/* 社区影响力统计 */}
        <section className="mb-12">
          <CommunityImpact />
        </section>

        {/* 邀请码列表 */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-gray-800">Active Sora 2 Codes</h2>
            <button
              onClick={handleManualRefresh}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>
          <InviteCodeDisplay 
            codes={inviteCodes} 
            onVote={handleVote}
            onCopy={handleCopyCode}
          />
        </section>
          </div>

          {/* 右侧边栏 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* 活跃代码统计 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Active Codes</h3>
                <ActiveCodeStats />
              </div>

              {/* 社区影响 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Community Impact</h3>
                <CommunityImpact />
              </div>

              {/* 游戏区域 */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Game</h3>
                <WhackHamsterGame />
              </div>
            </div>
          </div>
        </div>

        {/* SEO优化的内容区域 - 什么是 Sora 2 以及为什么使用邀请码 */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-6">What is Sora 2 and Why Use Invite Codes?</h2>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">About Sora 2</h3>
                <p className="text-gray-600 mb-4">
                  Sora 2 is OpenAI's advanced AI video generation model that creates realistic, high-quality videos from text prompts. 
                  It represents the cutting edge of AI video technology, capable of generating complex scenes with multiple characters, 
                  specific types of motion, and accurate details of the subject and background.
                </p>
                <p className="text-gray-600">
                  With Sora 2, creators can produce professional-quality videos without expensive equipment or extensive video editing skills, 
                  making it a game-changer for content creators, marketers, and filmmakers.
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-700 mb-4">Why Use Invite Codes?</h3>
                <p className="text-gray-600 mb-4">
                  Sora 2 is currently in limited access, requiring invite codes for early access. These codes allow users to:
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2">
                  <li>Access Sora 2 before general release</li>
                  <li>Test the latest AI video generation features</li>
                  <li>Create content with cutting-edge technology</li>
                  <li>Provide feedback to improve the platform</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 游戏区域 */}
        <section ref={gameSectionRef} className="mb-12">
          <WhackHamsterGame />
        </section>

        {/* SEO优化的FAQ区域 */}
        <section className="mb-12">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Frequently Asked Questions</h2>
            
            <div className="space-y-6">
              <div className="border-l-4 border-blue-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">How do I get Sora 2 invite codes?</h3>
                <p className="text-gray-600">
                  You can get free Sora 2 invite codes from our community platform. We provide verified, working codes that are shared by community members. 
                  Simply browse our active codes list and use any available code to access Sora 2.
                </p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Are Sora 2 invite codes free?</h3>
                <p className="text-gray-600">
                  Yes, all invite codes on our platform are completely free. We're a community-driven platform dedicated to helping people access Sora 2. 
                  There are no hidden fees or charges for using our invite codes.
                </p>
              </div>
              
              <div className="border-l-4 border-purple-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">How often are new Sora 2 codes added?</h3>
                <p className="text-gray-600">
                  New codes are added in real-time as community members share them. We recommend checking our platform regularly for the latest working codes, 
                  as codes can become inactive when they reach their usage limit.
                </p>
              </div>
              
              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">What should I do if a code doesn't work?</h3>
                <p className="text-gray-600">
                  If a code doesn't work, it may have reached its usage limit or expired. Try using a different code from our active list. 
                  You can also report non-working codes using the "Didn't Work" button to help other users.
                </p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Can I share my own Sora 2 invite code?</h3>
                <p className="text-gray-600">
                  Absolutely! If you have a Sora 2 invite code to share, use the "Share Your Code" button to contribute to our community. 
                  Sharing codes helps others access Sora 2 and strengthens our community-driven platform.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 了解更多区域 */}
        <section className="text-center mb-12">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Learn More About Sora 2</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Discover tips, tricks, and best practices for creating amazing videos with Sora 2.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="/ai-seo-guide" 
                title="Complete Guide to Sora 2 Invite Codes - Learn Everything About AI Video Generation"
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                📚 Complete Guide
              </a>
              <a 
                href="/submit" 
                title="Share Your Sora 2 Invite Code - Help Others Access AI Video Generation"
                className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg transition-colors"
              >
                ➕ Share Your Code
              </a>
            </div>
          </div>
        </section>
      </main>

      {/* 移动端浮动提交按钮 */}
      {showFloatingButton && (
        <div className="fixed top-4 right-4 z-50 lg:hidden">
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 flex items-center justify-center group"
          >
            <Plus className="h-6 w-6 text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      )}

      <SubmitCodeModal 
        isOpen={isSubmitModalOpen} 
        onClose={() => setIsSubmitModalOpen(false)} 
        onSuccess={() => {
          handleManualRefresh()
          showNewCodeNotification('New code shared!')
        }} 
      />
      
      <ShareButton />
      
      <Footer />
      
      {/* 通知系统 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              notification.type === 'success' 
                ? 'bg-green-500 text-white' 
                : 'bg-red-500 text-white'
            }`}
          >
            <div className="flex justify-between items-start">
              <p className="text-sm font-medium">{notification.message}</p>
              <button
                onClick={() => removeNotification(notification.id)}
                title="Close notification"
                aria-label="Close notification"
                className="ml-2 text-white hover:text-gray-200"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}