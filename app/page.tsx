'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
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
import { dataManager, GlobalData } from '@/lib/dataManager'

export default function Home() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([
    // 🔥 临时硬编码测试数据
    {
      id: 'temp1',
      code: 'TEMP1',
      createdAt: new Date().toISOString(),
      status: 'active',
      votes: { worked: 0, didntWork: 0, uniqueWorked: 0, uniqueDidntWork: 0 },
      copiedCount: 5,
      uniqueCopiedCount: 3
    },
    {
      id: 'temp2', 
      code: 'TEMP2',
      createdAt: new Date().toISOString(),
      status: 'active',
      votes: { worked: 1, didntWork: 0, uniqueWorked: 1, uniqueDidntWork: 0 },
      copiedCount: 3,
      uniqueCopiedCount: 2
    }
  ])
  const [loading, setLoading] = useState(false) // 设置为 false，因为我们已经有了测试数据
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
        console.log(`[Vote] ${type} vote recorded successfully for code ${id}`)
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
      // 立即复制到剪贴板
      await navigator.clipboard.writeText(code)
      console.log(`[Copy] Code "${code}" copied to clipboard`)
      
      // 🔥 异步记录复制事件，不阻塞用户体验
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
          console.log('[Copy] Copy event recorded successfully')
          // 延迟刷新，确保数据已保存
          setTimeout(() => dataManager.triggerRefresh(), 500)
        } else {
          console.error('[Copy] Failed to record copy event:', response.status)
        }
      }).catch(error => {
        console.error('[Copy] Error recording copy event:', error)
      })
      
    } catch (error) {
      console.error('[Copy] Failed to copy code to clipboard:', error)
      throw error // 重新抛出错误，让组件知道复制失败
    }
  }

  useEffect(() => {
    console.log('[Page] 🔍 useEffect triggered, setting up data manager...')
    
    // 🔥 临时修复：直接获取数据，不依赖 dataManager
    const fetchDataDirectly = async () => {
      try {
        console.log('[Page] 🔍 Fetching data directly from API...')
        const response = await fetch('/api/dashboard')
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const dashboardData = await response.json()
        console.log('[Page] 🔍 Direct API Response:', {
          hasActiveInviteCodes: !!dashboardData.activeInviteCodes,
          activeInviteCodesLength: dashboardData.activeInviteCodes?.length,
          sampleCodes: dashboardData.activeInviteCodes?.slice(0, 3).map(c => c.code)
        })
        
        const activeInviteCodes = dashboardData.activeInviteCodes || []
        console.log('[Page] 🔍 Setting invite codes:', activeInviteCodes.length)
        
        // 🔥 临时测试：如果 API 数据为空，使用测试数据
        if (activeInviteCodes.length === 0) {
          console.log('[Page] 🔍 API returned empty data, using test data')
          const testData = [
            {
              id: 'test1',
              code: 'TEST1',
              createdAt: new Date().toISOString(),
              status: 'active',
              votes: { worked: 0, didntWork: 0, uniqueWorked: 0, uniqueDidntWork: 0 },
              copiedCount: 5,
              uniqueCopiedCount: 3
            }
          ]
          setInviteCodes(testData)
        } else {
          setInviteCodes(activeInviteCodes)
        }
        setLoading(false)
      } catch (error) {
        console.error('[Page] ❌ Direct fetch error:', error)
        setLoading(false)
      }
    }
    
    // 🔥 使用全局数据管理器，避免重复 API 调用
    const handleDataUpdate = (data: GlobalData) => {
      console.log('[Page] 🔍 Data updated via DataManager:', {
        inviteCodesLength: data.inviteCodes.length,
        activeCodeCount: data.activeCodeCount,
        totalCodeCount: data.totalCodeCount,
        sampleCodes: data.inviteCodes.slice(0, 3).map(c => c.code)
      })
      console.log('[Page] 🔍 Full invite codes data:', data.inviteCodes)
      setInviteCodes(data.inviteCodes)
      setLoading(false)
    }

    // 注册数据监听器（会自动触发数据加载）
    console.log('[Page] 🔍 Adding listener to dataManager...')
    dataManager.addListener(handleDataUpdate)
    
    // 🔥 强制刷新数据，确保数据加载
    console.log('[Page] 🔍 Force refreshing data...')
    dataManager.triggerRefresh()
    
    // 🔥 临时修复：同时直接获取数据作为备用
    fetchDataDirectly()

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

    // Listen for guidance component events
    const handleOpenSubmitModal = () => {
      setIsSubmitModalOpen(true)
    }
    
    window.addEventListener('openSubmitModal', handleOpenSubmitModal)

    return () => {
      eventSource.close()
      dataManager.removeListener(handleDataUpdate)
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
            
            {/* 🔥 调试信息 */}
            <div className="bg-yellow-100 p-4 rounded mb-4">
              <h3 className="font-bold">Debug Info:</h3>
              <p>inviteCodes length: {inviteCodes.length}</p>
              <p>filtered codes length: {inviteCodes.filter(code => code.status === 'active').length}</p>
              <p>sample codes: {inviteCodes.slice(0, 3).map(c => c.code).join(', ')}</p>
            </div>
            
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
        
        {/* Fixed Share Button */}
        <ShareButton />
        
        {/* Submit Code Modal */}
        <SubmitCodeModal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          onSuccess={handleRefresh}
        />
        
      </main>
    </ErrorBoundary>
  )
}
