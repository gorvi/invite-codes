'use client'

import { useEffect, useState } from 'react'

interface EnvInfo {
  environment: {
    detected: string
    keyPrefix: string
    isVercel: boolean
  }
  environmentVariables: Record<string, string>
  timestamp: string
}

export default function EnvDebugger() {
  const [envInfo, setEnvInfo] = useState<EnvInfo | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/debug-env')
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
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-700">🔄 加载环境信息中...</p>
      </div>
    )
  }

  if (!envInfo) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700">❌ 无法加载环境信息</p>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
      <h3 className="text-lg font-semibold mb-3">🔍 环境信息</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-700 mb-2">环境检测</h4>
          <p className="text-sm">
            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
              {envInfo.environment.detected}
            </span>
          </p>
        </div>
        
        <div className="bg-white p-3 rounded border">
          <h4 className="font-medium text-gray-700 mb-2">键前缀</h4>
          <p className="text-sm">
            <span className="font-mono bg-blue-100 px-2 py-1 rounded text-blue-800">
              {envInfo.environment.keyPrefix}
            </span>
          </p>
        </div>
      </div>

      <div className="bg-white p-3 rounded border">
        <h4 className="font-medium text-gray-700 mb-2">Vercel 环境变量</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>VERCEL_ENV:</span>
            <span className="font-mono text-green-600">
              {envInfo.environmentVariables.VERCEL_ENV || 'undefined'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>VERCEL_URL:</span>
            <span className="font-mono text-green-600">
              {envInfo.environmentVariables.VERCEL_URL || 'undefined'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>NODE_ENV:</span>
            <span className="font-mono text-green-600">
              {envInfo.environmentVariables.NODE_ENV || 'undefined'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-500">
        更新时间: {new Date(envInfo.timestamp).toLocaleString()}
      </div>
    </div>
  )
}
