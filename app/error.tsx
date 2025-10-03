'use client'

import { useEffect } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-red-100 rounded-full p-4">
            <AlertCircle className="h-12 w-12 text-red-600" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          Oops! Something went wrong
        </h1>

        <p className="text-gray-600 text-center mb-6">
          We encountered an unexpected error. Don't worry, you can try refreshing the page.
        </p>

        {error.message && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-700 font-mono break-words">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col space-y-3">
          <button
            onClick={reset}
            className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
          >
            <RefreshCw className="h-5 w-5" />
            <span>Try Again</span>
          </button>

          <a
            href="/"
            className="flex items-center justify-center space-x-2 w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            <Home className="h-5 w-5" />
            <span>Go Home</span>
          </a>
        </div>

        <p className="text-xs text-gray-500 text-center mt-6">
          If this problem persists, please contact support at{' '}
          <a href="mailto:wecesoft@gmail.com" className="text-primary-600 hover:underline">
            wecesoft@gmail.com
          </a>
        </p>
      </div>
    </div>
  )
}

