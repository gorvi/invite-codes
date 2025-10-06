'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Gift } from 'lucide-react'
import Header from '@/components/Header'
import NotificationToast, { useNotifications } from '@/components/NotificationToast'

export default function SubmitPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitMessage, setSubmitMessage] = useState('')
  const { notifications, removeNotification, showSuccessNotification, showErrorNotification } = useNotifications()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setIsSubmitting(true)
    setSubmitMessage('')

    try {
      const response = await fetch('/api/invite-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code: inviteCode }),
      })

      if (response.ok) {
        // 记录提交事件到统计系统
        await fetch('/api/analytics', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'submit',
            inviteCodeId: null,
            inviteCode: inviteCode
          }),
        })
        
        setSubmitMessage('✅ Invite code submitted successfully! Thank you for contributing to the community!')
        showSuccessNotification(`Invite code "${inviteCode}" has been submitted successfully!`)
        setInviteCode('')
        
        // 🔥 触发统计数据刷新
        window.dispatchEvent(new CustomEvent('statsUpdate'))
      } else {
        const errorData = await response.json()
        setSubmitMessage(`❌ ${errorData.error || 'Submission failed, please try again later'}`)
        showErrorNotification(errorData.error || 'Submission failed, please try again later')
      }
    } catch (error) {
      setSubmitMessage('❌ Submission failed, please try again later')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />
      
      {/* 通知组件 */}
      <NotificationToast 
        notifications={notifications} 
        onRemove={removeNotification} 
      />
      
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Codes</span>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex items-center space-x-2 mb-4">
            <Gift className="h-6 w-6 text-primary-600" />
            <h1 className="text-2xl font-bold text-gray-800">Submit Invite Code</h1>
          </div>
          
          <p className="text-gray-600 mb-8">
            Share your Sora invite code with the community
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="inviteCode" className="block text-sm font-medium text-gray-700 mb-2">
                Invite Code
              </label>
              <input
                type="text"
                id="inviteCode"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="Enter your invite code (e.g., ABC123)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-lg font-mono"
                maxLength={10}
                required
              />
              <p className="mt-2 text-sm text-gray-500">
                Please enter a valid Sora invite code to help other users gain access
              </p>
            </div>

            <button
              type="submit"
              disabled={!inviteCode.trim() || isSubmitting}
              className="w-full flex items-center justify-center space-x-2 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <Gift className="h-4 w-4" />
              <span>{isSubmitting ? 'Submitting...' : 'Submit Code'}</span>
            </button>
          </form>

          {submitMessage && (
            <div className={`mt-6 p-4 rounded-lg ${
              submitMessage.includes('✅') 
                ? 'bg-green-50 text-green-800 border border-green-200' 
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}>
              {submitMessage}
            </div>
          )}

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">💡 Tips for Submitting Codes:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Ensure the invite code is valid and unused</li>
              <li>• Please do not submit duplicate invite codes</li>
              <li>• Please wait patiently after submission, we will review as soon as possible</li>
              <li>• Thank you for your contribution to the community!</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  )
}
