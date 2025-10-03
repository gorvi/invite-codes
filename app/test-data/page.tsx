'use client'

import { useState, useEffect } from 'react'

export default function TestDataPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/analytics')
      .then(res => res.json())
      .then(data => {
        console.log('Test page received data:', data)
        setData(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Test page error:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [])

  if (loading) {
    return <div className="p-8">Loading...</div>
  }

  if (error) {
    return <div className="p-8 text-red-600">Error: {error}</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Data Test Page</h1>
      
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Invite Codes Count: {data?.allInviteCodes?.length || 0}</h2>
        <h2 className="text-xl font-semibold">Active Count: {data?.activeCodeCount || 0}</h2>
        <h2 className="text-xl font-semibold">Submit Count: {data?.submitCount || 0}</h2>
      </div>

      <div className="mb-4">
        <h3 className="text-lg font-semibold mb-2">All Invite Codes:</h3>
        {data?.allInviteCodes?.map((code: any) => (
          <div key={code.id} className="border p-4 mb-2 rounded">
            <p><strong>Code:</strong> {code.code}</p>
            <p><strong>Status:</strong> {code.status}</p>
            <p><strong>ID:</strong> {code.id}</p>
            <p><strong>Worked:</strong> {code.votes?.uniqueWorked || 0}</p>
            <p><strong>Didn't Work:</strong> {code.votes?.uniqueDidntWork || 0}</p>
          </div>
        ))}
      </div>

      <details>
        <summary className="cursor-pointer text-blue-600 hover:text-blue-800">Show Full JSON</summary>
        <pre className="mt-2 p-4 bg-gray-100 rounded overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
    </div>
  )
}
