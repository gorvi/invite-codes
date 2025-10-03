'use client'

import { useState, useEffect } from 'react'
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

import { InviteCode } from '@/lib/data'

export default function Home() {
  const [inviteCodes, setInviteCodes] = useState<InviteCode[]>([])
  const [loading, setLoading] = useState(true)
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const { notifications, removeNotification, showNewCodeNotification } = useNotifications()

  // 手动刷新邀请码数据
  const handleRefresh = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/invite-codes')
      if (response.ok) {
        const codes = await response.json()
        setInviteCodes(codes)
      }
    } catch (error) {
      console.error('Failed to refresh invite codes:', error)
    } finally {
      setLoading(false)
    }
  }

  // 处理投票
  const handleVote = async (id: string, type: 'worked' | 'didntWork') => {
    try {
      const response = await fetch(`/api/invite-codes/${id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
      })
      
      if (response.ok) {
        // 投票成功后刷新数据
        await handleRefresh()
      } else {
        console.error('Failed to vote:', response.statusText)
      }
    } catch (error) {
      console.error('Error voting:', error)
    }
  }

  // 处理复制邀请码
  const handleCopyCode = async (code: string, codeId: string) => {
    try {
      // 复制到剪贴板
      await navigator.clipboard.writeText(code)
      
      // 记录复制事件（可选）
      const response = await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          type: 'copy', 
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
    // 获取邀请码数据
    const fetchInviteCodes = async () => {
      try {
        const response = await fetch('/api/invite-codes')
        if (response.ok) {
          const codes = await response.json()
          setInviteCodes(codes)
        }
      } catch (error) {
        console.error('获取邀请码失败:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchInviteCodes()

    // 设置 SSE 连接进行实时更新
    const eventSource = new EventSource('/api/sse')
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        
        if (data.type === 'new_code') {
          console.log('[SSE] New code received:', data.inviteCode.code)
          setInviteCodes(prev => [data.inviteCode, ...prev])
          // 显示新邀请码通知
          showNewCodeNotification(data.inviteCode.code)
          // 🔥 触发统计数据刷新
          window.dispatchEvent(new CustomEvent('statsUpdate'))
        } else if (data.type === 'initial') {
          console.log('[SSE] Initial data received:', data.inviteCodes.length, 'codes')
          setInviteCodes(data.inviteCodes)
        } else if (data.type === 'update') {
          console.log('[SSE] Update received:', data.inviteCodes.length, 'codes')
          setInviteCodes(data.inviteCodes)
          // 🔥 触发统计数据刷新
          window.dispatchEvent(new CustomEvent('statsUpdate'))
        }
      } catch (error) {
        console.error('[SSE] Parse error:', error)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE 连接错误:', error)
    }

    return () => {
      eventSource.close()
    }
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* 通知组件 */}
      <NotificationToast 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <div className="container mx-auto px-4 py-8">
        {/* 移动端：垂直布局，电脑端：左右分栏布局（左侧70%，右侧30%） */}
        <div className="flex flex-col lg:flex-row lg:gap-6 max-w-7xl mx-auto">
          {/* 左侧主内容区 */}
          <div className="w-full lg:w-[70%] space-y-8">
            <CreatorNote />
            
            {/* 可用邀请码统计 */}
            <ActiveCodeStats />
            
            {/* 操作按钮区 - 固定吸附 */}
            <div className="sticky top-4 z-10 bg-gradient-to-b from-gray-50 to-white pb-4">
              {/* Submit Code 按钮（主要操作） */}
              <button onClick={() => setIsSubmitModalOpen(true)} className="w-full">
                <div className="bg-gradient-to-r from-primary-600 to-blue-600 text-white p-4 rounded-lg hover:from-primary-700 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 cursor-pointer">
                  <div className="flex items-start space-x-3">
                    <Plus className="h-6 w-6 flex-shrink-0 mt-1" />
                    <div className="flex-1 text-left">
                      <div className="font-bold text-lg mb-1">Submit Your Code</div>
                      <div className="text-sm text-blue-100">
                        Have an invite? Share it with the community!
                      </div>
                    </div>
                  </div>
                </div>
              </button>
              
              {/* Support Creator 按钮已隐藏 */}
            </div>
            
            <InviteCodeDisplay 
              codes={inviteCodes} 
              onVote={handleVote}
              onCopy={handleCopyCode}
            />
            
            {/* 移动端显示游戏 */}
            <div className="lg:hidden">
              <WhackHamsterGame />
            </div>
            
            <FAQ />
            
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <HowItWorks />
              <CommunityImpact />
            </div>
          </div>
          
          {/* 右侧游戏区（仅电脑端显示，固定在右侧） */}
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
