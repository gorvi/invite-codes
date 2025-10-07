'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Gift } from 'lucide-react'

export default function CommunityImpact() {
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0)
  const [totalCodes, setTotalCodes] = useState<number>(0)
  const [activeCodes, setActiveCodes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  // 🔥 直接获取数据的函数
  const fetchData = async () => {
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
      setTotalSubmissions(dashboardData.submitCount || 0)
      setTotalCodes(dashboardData.totalCodeCount || 0)
      setActiveCodes(dashboardData.activeCodeCount || 0)
      setLoading(false)
    } catch (error) {
      console.error('[CommunityImpact] Fetch error:', error)
      setLoading(false)
    }
  }

  useEffect(() => {
    // 立即获取数据
    fetchData()

    const handleManualRefresh = () => {
      fetchData()
    }
    window.addEventListener('statsUpdate', handleManualRefresh)
    
    const refreshInterval = setInterval(() => {
      fetchData()
    }, 300000) // 改为5分钟，减少资源消耗
    
    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('statsUpdate', handleManualRefresh)
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
        <p className="text-4xl font-bold text-blue-600 mb-2">{totalCodes}</p>
        <p className="text-lg text-gray-600">Total Sora 2 Codes</p>
        <p className="text-sm text-gray-500 mt-2">
          ({activeCodes} active, {totalCodes - activeCodes} used/invalid)
        </p>
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