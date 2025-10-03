'use client'

import { useEffect, useState } from 'react'

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string>>({})

  useEffect(() => {
    // 获取所有环境变量（客户端只能看到公开的）
    const vars = {
      NODE_ENV: process.env.NODE_ENV || 'undefined',
      NEXT_PUBLIC_VERCEL_ENV: process.env.NEXT_PUBLIC_VERCEL_ENV || 'undefined',
      NEXT_PUBLIC_VERCEL_URL: process.env.NEXT_PUBLIC_VERCEL_URL || 'undefined',
    }
    setEnvVars(vars)
  }, [])

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Environment Variables Debug
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Client-Side Environment Variables</h2>
          <div className="space-y-2">
            {Object.entries(envVars).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                <span className="font-mono text-sm font-medium">{key}</span>
                <span className="font-mono text-sm text-blue-600">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ 注意</h3>
          <p className="text-yellow-700 text-sm">
            客户端只能看到以 <code className="bg-yellow-100 px-1 rounded">NEXT_PUBLIC_</code> 开头的环境变量。
            服务器端环境变量（如 VERCEL_ENV）只能在 API 路由中查看。
          </p>
        </div>

        <div className="mt-6">
          <a 
            href="/api/debug-env" 
            className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            查看服务器端环境变量
          </a>
        </div>
      </div>
    </div>
  )
}
