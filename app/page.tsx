'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Plus, Users, Clock, CheckCircle, Star, TrendingUp } from 'lucide-react'
import Header from '@/components/Header'
import ShareButton from '@/components/ShareButton'
import InviteCodeDisplay from '@/components/InviteCodeDisplay'
import CreatorNote from '@/components/CreatorNote'
import WhackHamsterGame from '@/components/WhackHamsterGame'
import FAQ from '@/components/FAQ'
import HowItWorks from '@/components/HowItWorks'
import CommunityImpact from '@/components/CommunityImpact'
import Footer from '@/components/Footer'
import ActiveCodeStats from '@/components/ActiveCodeStats'
import NotificationToast, { useNotifications } from '@/components/NotificationToast'
import SubmitCodeModal from '@/components/SubmitCodeModal'
import UnifiedGuidance from '@/components/UnifiedGuidance'
import ErrorBoundary from '@/components/ErrorBoundary'
import { WebsiteStructuredData, OrganizationStructuredData, WebPageStructuredData } from '@/components/StructuredData'

import { InviteCode } from '@/lib/data'

export default function Home() {
   const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
   const [loading, setLoading] = useState(true)
   const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
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
        // 立即刷新数据以显示更新后的投票数字
        handleManualRefresh()
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
        // 立即刷新数据以显示更新后的数字
        handleManualRefresh()
      } else {
        console.error('Failed to record copy event:', response.status)
        throw new Error(`Failed to record copy event: ${response.status}`)
      }
      
    } catch (error) {
      console.error('Failed to copy code to clipboard:', error)
      throw error
    }
  }


    useEffect(() => {
      const initialLoadTimeout = setTimeout(() => {
        handleManualRefresh()
      }, 100)
      
      const refreshInterval = setInterval(() => {
        handleManualRefresh()
      }, 30000)

     // Set up SSE connection for real-time updates
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
       console.error('SSE connection error:', error)
     }

     // Listen for guidance component events
     const handleOpenSubmitModal = () => {
       setIsSubmitModalOpen(true)
     }
     
     window.addEventListener('openSubmitModal', handleOpenSubmitModal)

     // Scroll listener for floating button (mobile only)
     const handleScroll = () => {
       if (window.innerWidth >= 1024) return // Desktop only
       
       const gameSection = gameSectionRef.current
       if (gameSection) {
         const rect = gameSection.getBoundingClientRect()
         const isGameVisible = rect.top <= window.innerHeight * 0.8
         setShowFloatingButton(isGameVisible)
       }
     }
     
     window.addEventListener('scroll', handleScroll)
     window.addEventListener('resize', handleScroll)

      return () => {
        clearTimeout(initialLoadTimeout)
        clearInterval(refreshInterval)
        eventSource.close()
        window.removeEventListener('openSubmitModal', handleOpenSubmitModal)
        window.removeEventListener('scroll', handleScroll)
        window.removeEventListener('resize', handleScroll)
      }
    }, [])

  return (
    <ErrorBoundary>
      <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        {/* SEO Structured Data */}
        <WebsiteStructuredData />
        <OrganizationStructuredData />
        <WebPageStructuredData />
        
        <Header />
        
        {/* Notification component */}
        <NotificationToast 
          notifications={notifications} 
          onRemove={removeNotification} 
        />
        
        {/* Unified guidance component */}
        <UnifiedGuidance />
      
      <div className="container mx-auto px-4 py-8">
        {/* Mobile: vertical layout, Desktop: left-right layout (left 70%, right 30%) */}
        <div className="flex flex-col lg:flex-row lg:gap-6 max-w-7xl mx-auto">
          {/* Left main content area */}
          <div className="w-full lg:w-[70%] space-y-8">
            {/* Simplified Hero Section - Clean and Focused */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
              <div className="max-w-4xl mx-auto text-center">
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Get Free Sora 2 Invite Codes
                </h1>
                <p className="text-xl md:text-2xl mb-6 opacity-90">
                  Access OpenAI's revolutionary AI video generation technology with working invite codes from our community
                </p>
                
                {/* Simplified Feature Badges */}
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                    <CheckCircle className="w-4 h-4 mr-2" />
                    <span>100% Free Access</span>
                  </div>
                  <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                    <Users className="w-4 h-4 mr-2" />
                    <span>Community Verified</span>
                  </div>
                  <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>Real-time Updates</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Available invite codes stats */}
            <ActiveCodeStats />
            
            
            {/* Clear Share Button - Obviously Clickable */}
            <div className={`sticky top-4 z-10 bg-gradient-to-b from-gray-50 to-white pb-4 transition-all duration-500 ${showFloatingButton ? 'lg:block hidden' : 'block'}`}>
              {/* Main Share Button - Clear button appearance */}
              <button onClick={() => setIsSubmitModalOpen(true)} className="w-full group">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer border-2 border-green-400 hover:border-green-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Clear button icon */}
                      <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                        <Plus className="h-6 w-6 text-white" />
                      </div>
                      
                      <div className="text-left">
                        <div className="font-bold text-xl mb-1 flex items-center">
                          <span className="mr-2">🎁</span>
                          Share Your Sora 2 Code
                        </div>
                        <div className="text-green-100 text-sm">
                          Help 4 people access Sora 2! 🚀
                        </div>
                      </div>
                    </div>
                    
                    {/* Clear button indicator */}
                    <div className="flex items-center space-x-2">
                      <span className="text-white font-semibold text-sm">SHARE NOW</span>
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                        <span className="text-white text-lg">→</span>
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Secondary info card - not clickable */}
              <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-blue-800">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>Codes expire quickly - share yours now!</span>
                  </div>
                  <div className="text-blue-600 font-medium">
                    Be a community hero! ✨
                  </div>
                </div>
              </div>
              
              {/* Support Creator button is hidden */}
            </div>
            
            
            
            <InviteCodeDisplay 
              codes={inviteCodes
                .filter(code => code.status === 'active')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              } 
              onVote={handleVote}
              onCopy={handleCopyCode}
            />

            {/* SEO-Optimized Content Section - Moved after code list */}
            <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">What is Sora 2 and Why Use Invite Codes?</h2>
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-4">
                  Sora 2 is OpenAI's cutting-edge AI video generation model that creates stunning videos from text descriptions. 
                  Due to its advanced capabilities and high demand, access is currently limited through an invite-only system.
                </p>
                <p className="mb-4">
                  Our community platform provides verified, working invite codes that give you instant access to this revolutionary technology. 
                  Each code is tested and verified by our community members to ensure maximum success rates.
                </p>
                <div className="grid md:grid-cols-2 gap-6 mt-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-blue-900 mb-2 flex items-center">
                      <Star className="w-5 h-5 mr-2" />
                      High Success Rate
                    </h3>
                    <p className="text-blue-800 text-sm">Our codes have an 85%+ success rate, verified by community feedback</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-green-900 mb-2 flex items-center">
                      <TrendingUp className="w-5 h-5 mr-2" />
                      Real-time Updates
                    </h3>
                    <p className="text-green-800 text-sm">New codes are added instantly as they become available</p>
                  </div>
                </div>
              </div>
            </section>
            
            {/* Mobile game display */}
            <div className="lg:hidden" ref={gameSectionRef}>
              <WhackHamsterGame />
            </div>
            
            <FAQ />
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <HowItWorks />
              <CommunityImpact />
            </div>
            
            {/* SEO-Optimized FAQ Section */}
            <section className="mt-12 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions About Sora 2 Invite Codes</h2>
              <div className="space-y-6">
                <div className="border-l-4 border-blue-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">How do I use a Sora 2 invite code?</h3>
                  <p className="text-gray-700">Simply copy the invite code from our platform and paste it into the Sora 2 access form on OpenAI's website. Make sure you have a valid OpenAI account first.</p>
                </div>
                <div className="border-l-4 border-green-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Are these invite codes free to use?</h3>
                  <p className="text-gray-700">Yes, all invite codes on our platform are completely free. We're a community-driven platform dedicated to helping people access Sora 2.</p>
                </div>
                <div className="border-l-4 border-purple-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">How often are new codes added?</h3>
                  <p className="text-gray-700">New codes are added in real-time as community members share them. We recommend checking our platform regularly for the latest working codes.</p>
                </div>
                <div className="border-l-4 border-orange-500 pl-4">
                  <h3 className="font-semibold text-gray-900 mb-2">What if a code doesn't work?</h3>
                  <p className="text-gray-700">Try multiple codes from our platform. Each code has different usage limits and expiration times. Our community feedback system helps identify the most reliable codes.</p>
                </div>
              </div>
            </section>

            {/* SEO Pages Navigation */}
            <div className="mt-12 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-xl font-bold text-gray-800 mb-4 text-center">Learn More</h3>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link 
                  href="/how-it-works" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors border border-primary-200 shadow-sm"
                >
                  📖 How It Works
                </Link>
                <Link 
                  href="/faq" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors border border-primary-200 shadow-sm"
                >
                  ❓ FAQ
                </Link>
                <Link 
                  href="/ai-seo-guide" 
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-primary-600 rounded-lg hover:bg-primary-50 transition-colors border border-primary-200 shadow-sm"
                >
                  📚 Complete Guide
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right game area (desktop only, fixed on right) */}
          <div className="hidden lg:block lg:w-[30%]">
            <div className="sticky top-4">
              <WhackHamsterGame />
            </div>
          </div>
        </div>
      </div>
      
        <Footer />
        
        {/* Fixed Share Button */}
        <ShareButton />
        
        {/* Floating Mobile Share Button - Appears when scrolling past game */}
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
        
        {/* Submit Code Modal */}
        <SubmitCodeModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={handleManualRefresh}
        />
        
      </main>
    </ErrorBoundary>
  )
}
