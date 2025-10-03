import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Copy, Users, Gift, CheckCircle } from 'lucide-react'

export const metadata: Metadata = {
  title: 'How It Works - Sora 2 Invite Codes',
  description: 'Learn how to get and share Sora 2 invite codes. Step-by-step guide to accessing AI video generation technology.',
  keywords: ['how to get sora 2 invite', 'sora 2 access guide', 'ai video generation tutorial'],
}

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/" 
            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Home</span>
          </Link>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h1>
          <p className="text-xl text-gray-600">
            Get free access to Sora 2 AI video generation in just a few simple steps
          </p>
        </div>

        {/* Steps */}
        <div className="space-y-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Gift className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 1: Get an Invite Code</h2>
                <p className="text-gray-600 mb-4">
                  Browse available Sora 2 invite codes on our platform. Each code gives you access to OpenAI's latest AI video generation technology.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Check the "Active Sora 2 Codes" section on our homepage</li>
                  <li>Look for codes with high success rates</li>
                  <li>Choose a code that hasn't been used by many people</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Copy className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 2: Copy the Code</h2>
                <p className="text-gray-600 mb-4">
                  Click the "Copy Code" button next to the invite code you want to use. The code will be copied to your clipboard automatically.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Make sure to copy the entire code accurately</li>
                  <li>Don't add extra spaces or characters</li>
                  <li>Use the code immediately after copying</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 3: Use the Code</h2>
                <p className="text-gray-600 mb-4">
                  Go to the official Sora 2 website and use your invite code to create an account and start generating AI videos.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Visit the official OpenAI Sora 2 website</li>
                  <li>Sign up for an account</li>
                  <li>Enter your invite code when prompted</li>
                  <li>Start creating amazing AI videos!</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Step 4: Share Your Experience</h2>
                <p className="text-gray-600 mb-4">
                  Help the community by voting on whether the code worked or not. This helps others find reliable codes.
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>Click "Worked" if the code successfully gave you access</li>
                  <li>Click "Didn't Work" if the code was invalid or expired</li>
                  <li>Share your own codes when you get them</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="mt-12 bg-blue-50 rounded-lg p-6">
          <h3 className="text-xl font-bold text-blue-900 mb-4">💡 Pro Tips</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Check back regularly for new codes as they're shared by the community</li>
            <li>• Codes with higher success rates are more likely to work</li>
            <li>• Don't share the same code multiple times - it won't work for others</li>
            <li>• Be patient - new codes are added frequently by generous community members</li>
          </ul>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link 
            href="/"
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Gift className="h-5 w-5" />
            <span>Get Your Sora 2 Code Now</span>
          </Link>
        </div>
      </div>
    </div>
  )
}
