'use client'

import { useEffect } from 'react'

export default function TestDataError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Test data page error:', error)
  }, [error])

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Test Data Error</h1>
      <p className="text-gray-700 mb-4">{error.message}</p>
      <button
        onClick={reset}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Try Again
      </button>
    </div>
  )
}

