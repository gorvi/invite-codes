'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { RefreshCw, Gift, Copy, Clock, Lightbulb } from 'lucide-react'
import { InviteCode } from '@/lib/data'

interface InviteCodeDisplayProps {
  inviteCodes: InviteCode[]
  loading: boolean
  onRefresh: () => void
  onUpdate?: (codes: InviteCode[]) => void
}

export default function InviteCodeDisplay({ inviteCodes, loading, onRefresh, onUpdate }: InviteCodeDisplayProps) {
  const [lastCodeTime, setLastCodeTime] = useState<string>('--')
  const [lastCodeTimestamp, setLastCodeTimestamp] = useState<number | null>(null)
  
  // 🔥 防抖状态：记录每个按钮的最后点击时间
  const [lastClickTimes, setLastClickTimes] = useState<{
    [key: string]: number
  }>({})

  // 获取或创建用户ID
  const getOrCreateUserId = () => {
    let userId = localStorage.getItem('userId')
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('userId', userId)
    }
    return userId
  }
  
  // 🔥 检查是否可以点击（距离上次点击是否超过1秒）
  const canClick = (buttonKey: string): boolean => {
    const now = Date.now()
    const lastClick = lastClickTimes[buttonKey] || 0
    const timeDiff = now - lastClick
    
    if (timeDiff < 1000) {
      console.log(`[Debounce] Button "${buttonKey}" clicked too fast. Wait ${1000 - timeDiff}ms`)
      return false
    }
    
    return true
  }
  
  // 🔥 更新最后点击时间
  const updateClickTime = (buttonKey: string) => {
    setLastClickTimes(prev => ({
      ...prev,
      [buttonKey]: Date.now()
    }))
  }

  // 计算最后一个邀请码出现的时间
  const calculateLastCodeTime = () => {
    if (inviteCodes.length === 0) {
      // 如果没有邀请码，尝试从localStorage获取上次的时间
      const stored = localStorage.getItem('lastCodeTimestamp')
      if (stored) {
        const timestamp = parseInt(stored)
        const now = Date.now()
        const diffInSeconds = Math.floor((now - timestamp) / 1000)
        
        if (diffInSeconds < 60) {
          setLastCodeTime(`${diffInSeconds}s ago`)
        } else if (diffInSeconds < 3600) {
          const minutes = Math.floor(diffInSeconds / 60)
          setLastCodeTime(`${minutes}m ago`)
        } else if (diffInSeconds < 86400) {
          const hours = Math.floor(diffInSeconds / 3600)
          setLastCodeTime(`${hours}h ago`)
        } else {
          const days = Math.floor(diffInSeconds / 86400)
          setLastCodeTime(`${days}d ago`)
        }
      } else {
        setLastCodeTime('never')
      }
    } else {
      // 找到最新的邀请码
      const latestCode = inviteCodes.reduce((latest, code) => {
        const codeTime = new Date(code.submittedAt).getTime()
        const latestTime = new Date(latest.submittedAt).getTime()
        return codeTime > latestTime ? code : latest
      })
      
      const timestamp = new Date(latestCode.submittedAt).getTime()
      setLastCodeTimestamp(timestamp)
      localStorage.setItem('lastCodeTimestamp', timestamp.toString())
      
      const now = Date.now()
      const diffInSeconds = Math.floor((now - timestamp) / 1000)
      
      if (diffInSeconds < 5) {
        setLastCodeTime('just now')
      } else if (diffInSeconds < 60) {
        setLastCodeTime(`${diffInSeconds}s ago`)
      } else if (diffInSeconds < 3600) {
        const minutes = Math.floor(diffInSeconds / 60)
        setLastCodeTime(`${minutes}m ago`)
      } else if (diffInSeconds < 86400) {
        const hours = Math.floor(diffInSeconds / 3600)
        setLastCodeTime(`${hours}h ago`)
      } else {
        const days = Math.floor(diffInSeconds / 86400)
        setLastCodeTime(`${days}d ago`)
      }
    }
  }

  // 初始计算和每秒更新
  useEffect(() => {
    calculateLastCodeTime()
    const interval = setInterval(calculateLastCodeTime, 1000)
    return () => clearInterval(interval)
  }, [inviteCodes])

  const handleCopyCode = async (code: string, codeId: string) => {
    // 🔥 防抖检查
    const buttonKey = `copy-${codeId}`
    if (!canClick(buttonKey)) {
      console.log(`[Copy] Debounce: Please wait before copying again`)
      return
    }
    updateClickTime(buttonKey)
    
    try {
      // 复制到剪贴板
      await navigator.clipboard.writeText(code)
      
      const userId = getOrCreateUserId()
      
      // 记录复制事件
      await fetch('/api/analytics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'copy',
          inviteCodeId: codeId,
          inviteCode: code,
          userId: userId
        }),
      })
      
      console.log('Invite code copied:', code)
      
      // 🔥 立即获取更新后的邀请码数据
      if (onUpdate) {
        try {
          const response = await fetch('/api/invite-codes')
          if (response.ok) {
            const updatedCodes = await response.json()
            onUpdate(updatedCodes)
            console.log('[Copy] Updated local state with latest data')
          }
        } catch (error) {
          console.error('[Copy] Failed to refresh codes:', error)
        }
      }
      
      // 🔥 触发统计数据刷新
      window.dispatchEvent(new CustomEvent('statsUpdate'))
      
      // 🔥 显示成功提示
      showCopySuccess(code)
    } catch (error) {
      console.error('Copy failed:', error)
      // 显示错误提示
      showCopyError()
    }
  }
  
  // 复制成功提示
  const [copyNotification, setCopyNotification] = useState<{show: boolean, code: string}>({show: false, code: ''})
  
  const showCopySuccess = (code: string) => {
    setCopyNotification({show: true, code})
    setTimeout(() => {
      setCopyNotification({show: false, code: ''})
    }, 2000) // 2秒后消失
  }
  
  const showCopyError = () => {
    // 可以用类似的方式显示错误提示
    alert('❌ Failed to copy code. Please try again.')
  }

  const handleVote = async (codeId: string, voteType: 'worked' | 'didntWork', code: string) => {
    // 🔥 防抖检查
    const buttonKey = `vote-${voteType}-${codeId}`
    if (!canClick(buttonKey)) {
      console.log(`[Vote] Debounce: Please wait before voting again`)
      return
    }
    updateClickTime(buttonKey)
    
    try {
      const userId = getOrCreateUserId()
      
      console.log('[Vote] Voting:', { codeId, voteType, userId })
      
      const response = await fetch(`/api/invite-codes/${codeId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          vote: voteType,
          userId: userId
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[Vote] Success:', result)
        console.log('[Vote] Updated votes:', {
          worked: result.votes?.worked,
          didntWork: result.votes?.didntWork,
          uniqueWorked: result.votes?.uniqueWorked,
          uniqueDidntWork: result.votes?.uniqueDidntWork
        })
        
        // 🔥 立即更新本地状态，让UI实时反映变化
        if (onUpdate) {
          const updatedCodes = inviteCodes.map(code => 
            code.id === codeId ? result : code
          )
          // 过滤掉状态变为 used 或 invalid 的邀请码
          const activeCodes = updatedCodes.filter(c => c.status === 'active')
          onUpdate(activeCodes)
        }
        
        // 记录投票事件到统计系统
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: voteType === 'worked' ? 'vote_worked' : 'vote_didntWork',
            inviteCodeId: codeId,
            inviteCode: code,
            userId: userId
          }),
        })
        
        console.log('[Vote] Vote recorded successfully')
        
        // 🔥 触发统计数据刷新
        window.dispatchEvent(new CustomEvent('statsUpdate'))
      } else {
        console.error('[Vote] Failed:', await response.text())
      }
    } catch (error) {
      console.error('[Vote] Error:', error)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading invite code...</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 relative">
      {/* 🔥 复制成功通知 */}
      {copyNotification.show && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in-right">
          <div className="bg-green-500 text-white px-6 py-4 rounded-lg shadow-xl flex items-center space-x-3">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <div>
              <p className="font-semibold">✅ Copied Successfully!</p>
              <p className="text-sm opacity-90">Code: {copyNotification.code}</p>
            </div>
          </div>
        </div>
      )}
      
      <style jsx>{`
        @keyframes slideInRight {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s ease-out;
        }
      `}</style>
      {inviteCodes.length === 0 ? (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Invite Codes Available</h2>
          <p className="text-gray-600 mb-6">
            Be the first to submit an invite code or try refreshing to check for new codes!
          </p>
          
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Last code appeared {lastCodeTime}</span>
          </div>
          
          <p className="text-sm text-gray-500 mb-6">
            Typically, new codes appear within a 5-minute window
          </p>
          
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <Lightbulb className="inline h-4 w-4 mr-1" />
              <strong>Tip:</strong> If you don't find any codes for a long time, consider sharing this site on Reddit or other communities to help restart the sharing loop!
            </p>
          </div>
          
          <div className="flex space-x-4 justify-center">
            <button 
              onClick={onRefresh}
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Refresh</span>
            </button>
            
            <Link 
              href="/submit"
              className="flex items-center space-x-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              <Gift className="h-4 w-4" />
              <span>Submit Code</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {inviteCodes.map((inviteCode) => (
            <div key={inviteCode.id} className="border rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Available Invite Code</h3>
                <span className="text-sm text-gray-500">
                  {new Date(inviteCode.createdAt).toLocaleString()}
                </span>
              </div>
              
              <div className="bg-white border-2 border-dashed border-primary-300 rounded-lg p-4 mb-4">
                <code className="text-2xl font-mono font-bold text-primary-600">
                  {inviteCode.code}
                </code>
              </div>
              
              <div className="flex space-x-4">
                {/* Copy Code 按钮 + 统计 */}
                <div className="flex-1 flex flex-col">
                  <button
                    onClick={() => handleCopyCode(inviteCode.code, inviteCode.id)}
                    className="w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    Copy Code
                  </button>
                  <div className="mt-2 text-center">
                    <div className="text-sm text-gray-700 font-medium">{inviteCode.copiedCount || 0} Total</div>
                    <div className="text-xs text-blue-600">({inviteCode.uniqueCopiedCount || 0} Unique)</div>
                  </div>
                </div>
                
                {/* Worked 按钮 + 统计 */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => handleVote(inviteCode.id, 'worked', inviteCode.code)}
                    className="bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                  >
                    ✅ Worked
                  </button>
                  <div className="mt-2 text-center">
                    <div className="text-sm text-gray-700 font-medium">{inviteCode.votes.worked} Total</div>
                    <div className="text-xs text-green-600">({inviteCode.votes.uniqueWorked} Unique)</div>
                  </div>
                </div>
                
                {/* Didn't Work 按钮 + 统计 */}
                <div className="flex flex-col items-center">
                  <button 
                    onClick={() => handleVote(inviteCode.id, 'didntWork', inviteCode.code)}
                    className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors whitespace-nowrap"
                  >
                    ❌ Didn't Work
                  </button>
                  <div className="mt-2 text-center">
                    <div className="text-sm text-gray-700 font-medium">{inviteCode.votes.didntWork} Total</div>
                    <div className="text-xs text-red-600">({inviteCode.votes.uniqueDidntWork} Unique)</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
