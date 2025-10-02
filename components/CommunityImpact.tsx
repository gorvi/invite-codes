'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Gift } from 'lucide-react'

export default function CommunityImpact() {
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0)
  const [totalCodes, setTotalCodes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        console.log('[CommunityImpact] Fetching stats...')
        const response = await fetch('/api/analytics')
        if (response.ok) {
          const data = await response.json()
          console.log('[CommunityImpact] Stats received:', {
            submitCount: data.submitCount,
            totalCodeCount: data.totalCodeCount
          })
          // 🔥 使用 submitCount（历史累计提交次数）或 totalCodeCount（当前邀请码总数）
          // submitCount 更准确，因为即使邀请码被删除，历史提交数也会保留
          setTotalSubmissions(data.submitCount || 0)
          setTotalCodes(data.totalCodeCount || 0)
        }
      } catch (error) {
        console.error('Failed to fetch community stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
    
    // 每10秒更新一次数据
    const interval = setInterval(() => {
      console.log('[CommunityImpact] Auto-refresh triggered')
      fetchStats()
    }, 10000)
    
    // 🔥 监听自定义事件，立即刷新
    const handleStatsUpdate = () => {
      console.log('[CommunityImpact] Manual refresh triggered by event')
      fetchStats()
    }
    window.addEventListener('statsUpdate', handleStatsUpdate)
    
    return () => {
      console.log('[CommunityImpact] Cleanup interval')
      clearInterval(interval)
      window.removeEventListener('statsUpdate', handleStatsUpdate)
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-2 mb-6">
          <TrendingUp className="h-6 w-6 text-green-600" />
          <h3 className="text-xl font-bold text-gray-800">Community Impact</h3>
        </div>
        
        <div className="text-center p-8">
          <div className="animate-pulse">
            <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
            <div className="h-8 w-20 bg-gray-200 rounded mx-auto mb-2"></div>
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center space-x-2 mb-6">
        <TrendingUp className="h-6 w-6 text-green-600" />
        <h3 className="text-xl font-bold text-gray-800">Community Impact</h3>
      </div>
      
      <div className="text-center p-8">
        <div className="flex items-center justify-center mb-4">
          <Gift className="h-16 w-16 text-blue-600" />
        </div>
        <p className="text-4xl font-bold text-blue-600 mb-2">{totalSubmissions}</p>
        <p className="text-lg text-gray-600">Total Codes Submitted</p>
        {totalCodes !== totalSubmissions && (
          <p className="text-sm text-gray-500 mt-2">
            ({totalCodes} codes currently in database)
          </p>
        )}
      </div>

      {/* Community impact description */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
        <div className="text-center">
          <p className="text-sm text-gray-700 mb-2">
            Community has submitted <span className="font-semibold text-blue-600">{totalSubmissions}</span> invite codes in total
          </p>
          <p className="text-xs text-gray-500">
            Thank you to our community members for helping others access Sora's powerful features!
          </p>
        </div>
      </div>
    </div>
  )
}