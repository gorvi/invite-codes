'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import Header from '@/components/Header'
import InviteCodeDisplay from '@/components/InviteCodeDisplay'
import CreatorNote from '@/components/CreatorNote'
import SupportCreator from '@/components/SupportCreator'
import WhackHamsterGame from '@/components/WhackHamsterGame'
import FAQ from '@/components/FAQ'
import HowItWorks from '@/components/HowItWorks'
import CommunityImpact from '@/components/CommunityImpact'
import Footer from '@/components/Footer'
import ActiveCodeStats from '@/components/ActiveCodeStats'
import NotificationToast, { useNotifications } from '@/components/NotificationToast'
import SubmitCodeModal from '@/components/SubmitCodeModal'
import UserGuidance from '@/components/UserGuidance'
import { WebsiteStructuredData, OrganizationStructuredData, WebPageStructuredData } from '@/components/StructuredData'

import { InviteCode } from '@/lib/data'
import { dataManager, GlobalData } from '@/lib/dataManager'

export default function Home() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const { notifications, removeNotification, showNewCodeNotification } = useNotifications()

  // Manually refresh invite codes data - 使用全局数据管理器
  const handleRefresh = async () => {
    console.log('[Page] Manual refresh triggered')
    await dataManager.triggerRefresh()
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
        // 🔥 使用数据管理器统一刷新所有数据
        await dataManager.triggerRefresh()
      } else {
        console.error('Failed to vote:', response.statusText)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  // Handle copying invite code
  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      // Copy to clipboard
      await navigator.clipboard.writeText(code)
      
      // Record copy event (optional)
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
      
      if (!response.ok) {
        console.error('Failed to record copy event')
      }
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  useEffect(() => {
    // 🔥 使用全局数据管理器，避免重复 API 调用
    const handleDataUpdate = (data: GlobalData) => {
      console.log('[Page] Data updated via DataManager:', data.inviteCodes.length, 'codes')
      setInviteCodes(data.inviteCodes)
      setLoading(false)
    }

    // 注册数据监听器
    dataManager.addListener(handleDataUpdate)

    // 初始加载数据
    dataManager.getData(true).then((data) => {
      if (data) {
        handleDataUpdate(data)
      }
    })

    // Set up SSE connection for real-time updates
    const eventSource = new EventSource('/api/sse')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'new_code') {
          console.log('[SSE] New code received:', data.inviteCode.code)
          setInviteCodes(prev => [data.inviteCode, ...prev])
          // Show new invite code notification
          showNewCodeNotification(data.inviteCode.code)
          // 🔥 使用数据管理器统一刷新
          dataManager.triggerRefresh()
        } else if (data.type === 'initial') {
          console.log('[SSE] Initial data received:', data.inviteCodes.length, 'codes')
          setInviteCodes(data.inviteCodes)
        } else if (data.type === 'update') {
          console.log('[SSE] Update received:', data.inviteCodes.length, 'codes')
          setInviteCodes(data.inviteCodes)
          // 🔥 使用数据管理器统一刷新
          dataManager.triggerRefresh()
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
    }

    return () => {
      eventSource.close()
      dataManager.removeListener(handleDataUpdate)
    }
  }, [])

  return (
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
      
      {/* User guidance component */}
      <UserGuidance />
      
      <div className="container mx-auto px-4 py-8">
        {/* Mobile: vertical layout, Desktop: left-right layout (left 70%, right 30%) */}
        <div className="flex flex-col lg:flex-row lg:gap-6 max-w-7xl mx-auto">
          {/* Left main content area */}
          <div className="w-full lg:w-[70%] space-y-8">
            <CreatorNote />
            
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
            
            <InviteCodeDisplay 
              codes={inviteCodes} 
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
      
      
      {/* Submit Code Modal */}
      <SubmitCodeModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        onSuccess={handleRefresh}
      />
    </main>
  )
}
