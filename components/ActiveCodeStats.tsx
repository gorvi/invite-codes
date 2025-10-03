'use client'

import { useState, useEffect } from 'react'
import { Gift, TrendingUp } from 'lucide-react'
import { dataManager, GlobalData } from '@/lib/dataManager'

export default function ActiveCodeStats() {
  const [activeCodeCount, setActiveCodeCount] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 🔥 使用全局数据管理器，避免重复 API 调用
    const handleDataUpdate = (data: GlobalData) => {
      console.log('[ActiveCodeStats] Data updated via DataManager:', data.activeCodeCount)
      setActiveCodeCount(data.activeCodeCount)
      setLoading(false)
    }

    // 注册数据监听器（会自动触发数据加载）
    dataManager.addListener(handleDataUpdate)

    // 🔥 监听手动刷新事件
    const handleManualRefresh = () => {
      console.log('[ActiveCodeStats] Manual refresh triggered')
      dataManager.triggerRefresh()
    }
    window.addEventListener('statsUpdate', handleManualRefresh)
    
    return () => {
      console.log('[ActiveCodeStats] Cleanup')
      dataManager.removeListener(handleDataUpdate)
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
