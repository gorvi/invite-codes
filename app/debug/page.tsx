'use client'

import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('[Debug] Fetching dashboard data...')
        const response = await fetch('/api/dashboard')
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const dashboardData = await response.json()
        console.log('[Debug] Dashboard data received:', dashboardData)
        
        setData(dashboardData)
        setLoading(false)
      } catch (err) {
        console.error('[Debug] Error fetching data:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return <div className="p-8">Loading debug data...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Debug Dashboard Data</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Summary</h2>
          <p>Total Codes: {data?.totalCodeCount || 0}</p>
          <p>Active Codes: {data?.activeCodeCount || 0}</p>
          <p>All Invite Codes Count: {data?.allInviteCodes?.length || 0}</p>
          <p>Active Invite Codes Count: {data?.activeInviteCodes?.length || 0}</p>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">All Invite Codes</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data?.allInviteCodes || [], null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Active Invite Codes</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data?.activeInviteCodes || [], null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Full Response</h2>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
