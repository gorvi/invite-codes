'use client'

import { useState, useEffect } from 'react'
import { Gift, TrendingUp } from 'lucide-react'

export default function ActiveCodeStats() {
  const [activeCodeCount, setActiveCodeCount] = useState<number>(0)
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
      setActiveCodeCount(dashboardData.activeCodeCount || 0)
      setLoading(false)
    } catch (error) {
      console.error('[ActiveCodeStats] Fetch error:', error)
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
    }, 30000)
    
    return () => {
      clearInterval(refreshInterval)
      window.removeEventListener('statsUpdate', handleManualRefresh)
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
            <p className="text-sm text-gray-600">Active Sora 2 Codes</p>
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
            ⚠️ No Sora 2 codes available. Please check back later or submit a new code.
          </p>
        </div>
      )}
      
      {activeCodeCount > 0 && activeCodeCount <= 2 && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
          <p className="text-sm text-orange-700">
            🔥 Limited Sora 2 codes available. Grab one quickly!
          </p>
        </div>
      )}
      
      {activeCodeCount >= 5 && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-700">
            ✅ Plenty of Sora 2 codes available. Choose your favorite!
          </p>
        </div>
      )}
    </div>
  )
}
