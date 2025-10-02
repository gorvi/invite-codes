'use client'

import { useState, useEffect } from 'react'
import { Gift, TrendingUp } from 'lucide-react'

export default function ActiveCodeStats() {
  const [activeCodeCount, setActiveCodeCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('[ActiveCodeStats] Fetching stats...')
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const data = await response.json()
          console.log('[ActiveCodeStats] Active codes:', data.activeCodeCount)
          setActiveCodeCount(data.activeCodeCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch active code count:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // 每10秒更新一次数据
    const interval = setInterval(() => {
      console.log('[ActiveCodeStats] Auto-refresh triggered')
      fetchStats()
    }, 10000)
    
    // 🔥 监听自定义事件，立即刷新
    const handleStatsUpdate = () => {
      console.log('[ActiveCodeStats] Manual refresh triggered by event')
      fetchStats()
    }
    window.addEventListener('statsUpdate', handleStatsUpdate)
    
    return () => {
      console.log('[ActiveCodeStats] Cleanup interval')
      clearInterval(interval)
      window.removeEventListener('statsUpdate', handleStatsUpdate)
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6">
        <div className="flex items-center space-x-3">
          <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
          <div className="animate-pulse bg-gray-200 h-4 w-32 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <Gift className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600">Active Invite Codes</p>
            <p className="text-2xl font-bold text-blue-600">{activeCodeCount}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <TrendingUp className="h-4 w-4" />
          <span>Live Update</span>
        </div>
      </div>
      
      {activeCodeCount === 0 && (
        <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-700">
            ⚠️ No codes available. Please check back later or submit a new code.
          </p>
        </div>
      )}
      
      {activeCodeCount > 0 && activeCodeCount <= 2 && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">
            🔥 Limited codes available. Grab one quickly!
          </p>
        </div>
      )}
      
      {activeCodeCount >= 5 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Plenty of codes available. Choose your favorite!
          </p>
        </div>
      )}
    </div>
  )
}
