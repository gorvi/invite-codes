'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, BarChart3, Copy, ThumbsUp, ThumbsDown, Plus } from 'lucide-react'

interface AnalyticsData {
  totalClicks: number
  copyClicks: number
  workedVotes: number
  didntWorkVotes: number
  submitCount: number
  activeCodeCount: number // 活跃邀请码数量
  totalCodeCount: number // 历史上提交的邀请码总数
  usedCodeCount: number // 已使用的邀请码数量
  invalidCodeCount: number // 无效的邀请码数量
  successfullyUsedCount: number // 成功使用的邀请码数量
  allInviteCodes: Array<{
    id: string
    code: string
    createdAt: Date
    status: 'active' | 'used' | 'invalid'
    votes: {
      worked: number
      didntWork: number
      uniqueWorked: number
      uniqueDidntWork: number
    }
  }>
  todayStats: {
    date: string
    copyClicks: number
    workedVotes: number
    didntWorkVotes: number
    submitCount: number
    uniqueVisitors: number
  }
  inviteCodeStats: Record<string, any>
  userStats: Record<string, any>
  uniqueCopyStats: Record<string, any>
  uniqueVoteStats: Record<string, any>
}

export default function AdminPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string>('')

  const fetchAnalytics = async () => {
    try {
      console.log('[Admin] Fetching analytics data...')
      const response = await fetch('/api/analytics')
      if (response.ok) {
        const data = await response.json()
        console.log('[Admin] Data received:', {
          totalCodes: data.totalCodeCount,
          activeCodes: data.activeCodeCount,
          submitCount: data.submitCount
        })
        setAnalytics(data)
        
        // 更新最后刷新时间
        const now = new Date()
        const timeString = now.toLocaleTimeString('en-US', { 
          hour12: false, 
          hour: '2-digit', 
          minute: '2-digit', 
          second: '2-digit' 
        })
        console.log('[Admin] Last update:', timeString)
        setLastUpdate(timeString)
      } else {
        setError('Failed to fetch analytics')
      }
    } catch (error) {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    console.log('[Admin] Initial fetch')
    fetchAnalytics()
    
    // 🔥 每10秒自动刷新数据
    const interval = setInterval(() => {
      console.log('[Admin] Auto-refresh triggered')
      fetchAnalytics()
    }, 10000) // 10秒
    
    return () => {
      console.log('[Admin] Cleanup interval')
      clearInterval(interval)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载统计数据中...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={fetchAnalytics}
            className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            重试
          </button>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link 
              href="/" 
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">Analytics Dashboard</h1>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {lastUpdate && (
              <div className="text-sm text-gray-500">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Last updated: {lastUpdate}
              </div>
            )}
            <button 
              onClick={fetchAnalytics}
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Refresh Now
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* 总体统计 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">历史提交总数</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.totalCodeCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Plus className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">成功使用</p>
                <p className="text-2xl font-bold text-green-600">{analytics.successfullyUsedCount}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <ThumbsUp className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">当前可用</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.activeCodeCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">已失效</p>
                <p className="text-2xl font-bold text-red-600">{analytics.invalidCodeCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <ThumbsDown className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 用户行为统计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总复制次数</p>
                <p className="text-2xl font-bold text-indigo-600">{analytics.copyClicks}</p>
              </div>
              <div className="p-3 bg-indigo-100 rounded-full">
                <Copy className="h-6 w-6 text-indigo-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">总投票数</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.workedVotes + analytics.didntWorkVotes}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <BarChart3 className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">活跃用户</p>
                <p className="text-2xl font-bold text-teal-600">{Object.keys(analytics.userStats || {}).length}</p>
              </div>
              <div className="p-3 bg-teal-100 rounded-full">
                <Plus className="h-6 w-6 text-teal-600" />
              </div>
            </div>
          </div>
        </div>

        {/* 今日统计 */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">今日统计 ({analytics.todayStats.date})</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{analytics.todayStats.copyClicks}</p>
              <p className="text-sm text-gray-600">复制次数</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{analytics.todayStats.workedVotes}</p>
              <p className="text-sm text-gray-600">有效投票</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{analytics.todayStats.didntWorkVotes}</p>
              <p className="text-sm text-gray-600">无效投票</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{analytics.todayStats.submitCount}</p>
              <p className="text-sm text-gray-600">提交次数</p>
            </div>
          </div>
        </div>

        {/* 全量邀请码统计 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">全量邀请码统计</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    邀请码
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    状态
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交时间
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总复制次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    独立用户复制
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    有效投票 (总/独立)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    无效投票 (总/独立)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    成功率
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.allInviteCodes.map((code) => {
                  // 🔥 优先使用 inviteCode 对象上的准确数据，而不是 analyticsData 中可能过时的统计
                  const copyClicks = (code as any).copiedCount || analytics.inviteCodeStats[code.id]?.copyClicks || 0
                  const stats = analytics.inviteCodeStats[code.id] || { copyClicks: 0, workedVotes: 0, didntWorkVotes: 0 }
                  const totalVotes = code.votes.worked + code.votes.didntWork
                  const successRate = totalVotes > 0 ? (code.votes.worked / totalVotes * 100).toFixed(1) : '0'
                  const uniqueCopies = (code as any).uniqueCopiedCount || analytics.uniqueCopyStats[code.id]?.totalUniqueCopies || 0
                  
                  return (
                    <tr key={code.id} className={code.status === 'active' ? 'bg-green-50' : code.status === 'used' ? 'bg-blue-50' : 'bg-red-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                          {code.code}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          code.status === 'active' ? 'bg-green-100 text-green-800' :
                          code.status === 'used' ? 'bg-blue-100 text-blue-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {code.status === 'active' ? '可用' : code.status === 'used' ? '已使用' : '已失效'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(code.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {copyClicks}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                        {uniqueCopies}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className="text-blue-600">{code.votes.worked} Total</span>
                          <span className="text-xs text-green-600">({code.votes.uniqueWorked} Unique)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-col">
                          <span className="text-red-600">{code.votes.didntWork} Total</span>
                          <span className="text-xs text-red-500">({code.votes.uniqueDidntWork} Unique)</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          parseFloat(successRate) >= 70 ? 'bg-green-100 text-green-800' :
                          parseFloat(successRate) >= 50 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {successRate}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 用户统计 */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">用户统计</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(analytics.userStats || {}).length}
              </p>
              <p className="text-sm text-gray-600">总用户数</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-2xl font-bold text-green-600">
                {Object.values(analytics.userStats || {}).reduce((sum: number, user: any) => sum + user.copyCount, 0)}
              </p>
              <p className="text-sm text-gray-600">总复制次数</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-2xl font-bold text-purple-600">
                {Object.values(analytics.userStats || {}).reduce((sum: number, user: any) => sum + user.voteCount, 0)}
              </p>
              <p className="text-sm text-gray-600">总投票次数</p>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    用户ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    复制次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    投票次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    提交次数
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    首次访问
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(analytics.userStats || {}).slice(0, 10).map(([userId, user]: [string, any]) => (
                  <tr key={userId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                        {userId.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.copyCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.voteCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.submitCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.firstVisit).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {Object.keys(analytics.userStats || {}).length > 10 && (
              <p className="text-sm text-gray-500 mt-2 text-center">
                显示前 10 个用户，共 {Object.keys(analytics.userStats || {}).length} 个用户
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

