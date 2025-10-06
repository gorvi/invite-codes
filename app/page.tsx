'use client'

import { useState, useEffect } from 'react'
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
   const { notifications, removeNotification, showNewCodeNotification } = useNotifications()


   const handleManualRefresh = async () => {
     setLoading(true)
     try {
       const timestamp = Date.now()
       const response = await fetch(`/api/dashboard?t=${timestamp}`, {
         cache: 'no-store',
         headers: {
           'Cache-Control': 'no-cache, no-store, must-revalidate',
           'Pragma': 'no-cache'
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
        handleManualRefresh()
      } else {
        console.error('Failed to vote:', response.statusText)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(code)
      
      fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'copy', 
          inviteCodeId: codeId 
        }),
      }).then(response => {
        if (response.ok) {
          setTimeout(() => {
            handleManualRefresh()
          }, 500)
        } else {
          console.error('Failed to record copy event:', response.status)
        }
      }).catch(error => {
        console.error('Error recording copy event:', error)
      })
      
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
          setInviteCodes(data.inviteCodes)
        } else if (data.type === 'update') {
          setInviteCodes(data.inviteCodes)
          window.dispatchEvent(new CustomEvent('statsUpdate'))
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

     return () => {
       clearTimeout(initialLoadTimeout)
       clearInterval(refreshInterval)
       eventSource.close()
       window.removeEventListener('openSubmitModal', handleOpenSubmitModal)
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
            {/* Unified Hero Section - Combined Welcome + Main CTA */}
            <section className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 text-white mb-8">
              <div className="max-w-4xl mx-auto text-center">
                {/* Welcome Message */}
                <div className="mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-3">
                    <span className="text-3xl">🎁</span>
                    <h2 className="text-2xl md:text-3xl font-bold">Welcome to Sora 2 Invite Code Community</h2>
                  </div>
                  <p className="text-lg md:text-xl opacity-90 mb-4">
                    Share your Sora 2 invite codes and help others access the latest AI video generation technology! 🎬✨
                  </p>
                </div>

                {/* Main CTA */}
                <h1 className="text-4xl md:text-5xl font-bold mb-4">
                  Get Free Sora 2 Invite Codes
                </h1>
                <p className="text-xl md:text-2xl mb-6 opacity-90">
                  Access OpenAI's revolutionary AI video generation technology with working invite codes from our community
                </p>

                {/* Share Code Call-to-Action */}
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6 border border-white/20">
                  <p className="text-lg font-semibold mb-2">💡 Got 1 code to share?</p>
                  <p className="text-sm opacity-90">
                    After registering with Sora 2, you receive 1 invite code that can help 4 people join. 
                    <span className="font-semibold text-yellow-200"> Share it here and help the community!</span>
                  </p>
                </div>

                {/* Feature Badges */}
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
            
            
            {/* Action buttons area - sticky */}
            <div className="sticky top-4 z-10 bg-gradient-to-b from-gray-50 to-white pb-4">
              {/* Submit Code button (main action) */}
              <button onClick={() => setIsSubmitModalOpen(true)} className="w-full">
                <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4 rounded-lg hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <Plus className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div className="flex-1 text-left">
                      <div className="font-bold text-lg mb-1">Submit Your Sora 2 Code</div>
                      <div className="text-sm text-blue-100">
                        Have a Sora 2 invite? Share it with the community!
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Support Creator button is hidden */}
            </div>
            
            
            
            {/* SEO-Optimized Content Section */}
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

            <InviteCodeDisplay 
              codes={inviteCodes
                .filter(code => code.status === 'active')
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              } 
              onVote={handleVote}
              onCopy={handleCopyCode}
            />
            
            {/* Mobile game display */}
            <div className="lg:hidden">
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
