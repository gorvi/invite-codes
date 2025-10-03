'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Gift } from 'lucide-react'
import { dataManager, GlobalData } from '@/lib/dataManager'

export default function CommunityImpact() {
  const [totalSubmissions, setTotalSubmissions] = useState<number>(0)
  const [totalCodes, setTotalCodes] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 🔥 使用全局数据管理器，避免重复 API 调用
    const handleDataUpdate = (data: GlobalData) => {
      console.log('[CommunityImpact] Data updated via DataManager:', {
        submitCount: data.submitCount,
        totalCodeCount: data.totalCodeCount
      })
      setTotalSubmissions(data.submitCount)
      setTotalCodes(data.totalCodeCount)
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

    // 🔥 监听手动刷新事件
    const handleManualRefresh = () => {
      console.log('[CommunityImpact] Manual refresh triggered')
      dataManager.triggerRefresh()
    }
    window.addEventListener('statsUpdate', handleManualRefresh)
    
    return () => {
      console.log('[CommunityImpact] Cleanup')
      dataManager.removeListener(handleDataUpdate)
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