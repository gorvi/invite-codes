'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Gift, Users, CheckCircle, Clock, Star } from 'lucide-react'
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
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <Link 
            href="/" 
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Codes</span>
          </Link>
        </div>

        {/* SEO-Optimized Hero Section */}
        <section className="bg-gradient-to-r from-green-600 to-blue-600 rounded-xl p-8 text-white mb-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Share Your Sora 2 Invite Code
            </h1>
            <p className="text-xl md:text-2xl mb-6 opacity-90">
              Help the community access AI video generation by sharing your working invite codes
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Users className="w-4 h-4 mr-2" />
                <span>Help Others</span>
              </div>
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <CheckCircle className="w-4 h-4 mr-2" />
                <span>Verified Codes</span>
              </div>
              <div className="flex items-center bg-white/20 rounded-full px-4 py-2">
                <Clock className="w-4 h-4 mr-2" />
                <span>Instant Sharing</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Main Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex items-center space-x-2 mb-4">
              <Gift className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-800">Submit Your Code</h2>
            </div>
            
            <p className="text-gray-600 mb-8">
              Share your Sora invite code with the community and help others access AI video generation
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

          {/* SEO-Optimized Content Sidebar */}
          <div className="space-y-6">
            {/* Why Share Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="w-6 h-6 text-yellow-500 mr-2" />
                Why Share Your Invite Code?
              </h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <p className="text-gray-700 text-sm">
                    <strong>Help the Community:</strong> Your code can help multiple people access Sora 2's AI video generation capabilities.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <p className="text-gray-700 text-sm">
                    <strong>Build Reputation:</strong> Contributing to the community helps build trust and recognition.
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <p className="text-gray-700 text-sm">
                    <strong>Access to More Codes:</strong> Active contributors often get priority access to new codes.
                  </p>
                </div>
              </div>
            </div>

            {/* How It Works Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">How Code Sharing Works</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <p className="text-gray-700 text-sm">Submit your working invite code</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <p className="text-gray-700 text-sm">Our system verifies the code format</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <p className="text-gray-700 text-sm">Code becomes available to the community</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <p className="text-gray-700 text-sm">Users provide feedback on success rate</p>
                </div>
              </div>
            </div>

            {/* Community Stats */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Community Impact</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">500+</div>
                  <div className="text-sm text-gray-600">Codes Shared</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2K+</div>
                  <div className="text-sm text-gray-600">People Helped</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
