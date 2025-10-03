'use client'

import { useEffect, useState } from 'react'

interface LocalEnvInfo {
  timestamp: string
  environment: {
    detected: string
    keyPrefix: string
    isVercel: boolean
    isLocal: boolean
  }
  relevantEnvVars: Record<string, string | undefined>
  allEnvVars: Record<string, string | undefined>
  storage: {
    type: string
    kvConfigured: boolean
  }
}

export default function LocalEnvPage() {
  const [envInfo, setEnvInfo] = useState<LocalEnvInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAllVars, setShowAllVars] = useState(false)

  useEffect(() => {
    fetch('/api/local-env')
      .then(res => res.json())
      .then(data => {
        setEnvInfo(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to fetch env info:', err)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载环境变量中...</p>
        </div>
      </div>
    )
  }

  if (!envInfo) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">❌ 无法加载环境变量</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 本地环境变量查看器
        </h1>
        
        {/* 环境信息概览 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">检测环境</h3>
            <p className="text-lg font-mono bg-blue-100 text-blue-800 px-2 py-1 rounded">
              {envInfo.environment.detected}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">键前缀</h3>
            <p className="text-lg font-mono bg-green-100 text-green-800 px-2 py-1 rounded">
              {envInfo.environment.keyPrefix}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">存储类型</h3>
            <p className="text-lg font-mono bg-purple-100 text-purple-800 px-2 py-1 rounded">
              {envInfo.storage.type}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold text-gray-700 mb-2">KV 配置</h3>
            <p className={`text-lg font-mono px-2 py-1 rounded ${
              envInfo.storage.kvConfigured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {envInfo.storage.kvConfigured ? '✅ 已配置' : '❌ 未配置'}
            </p>
          </div>
        </div>

        {/* 相关环境变量 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">相关环境变量</h2>
          <div className="space-y-2">
            {Object.entries(envInfo.relevantEnvVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-mono text-sm font-medium">{key}</span>
                <span className="font-mono text-sm text-blue-600 max-w-md truncate">
                  {value || 'undefined'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* 所有环境变量 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">所有环境变量</h2>
            <button
              onClick={() => setShowAllVars(!showAllVars)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {showAllVars ? '隐藏' : '显示'} 所有变量
            </button>
          </div>
          
          {showAllVars && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {Object.entries(envInfo.allEnvVars).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span className="font-mono font-medium">{key}</span>
                  <span className="font-mono text-gray-600 max-w-md truncate">
                    {value || 'undefined'}
                  </span>
                </div>
              ))}
            </div>
          )}
          
          {!showAllVars && (
            <p className="text-gray-500 text-sm">
              点击"显示所有变量"查看完整的环境变量列表
            </p>
          )}
        </div>

        <div className="mt-6 text-xs text-gray-500">
          更新时间: {new Date(envInfo.timestamp).toLocaleString()}
        </div>
      </div>
    </div>
  )
}
